import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../environments/environment';
import { CartServiceService } from './cart-service.service';


export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  token?: string;
  refreshToken?: string;
  role: 'user' | 'admin';
  isActive?: boolean;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isBrowser: boolean;
  private isAuthenticated$ = new BehaviorSubject<boolean>(false);
  private user$ = new BehaviorSubject<User | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cartService: CartServiceService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.autoLogin();
      this.startTokenRefreshTimer();
    }
  }

  /** بدء مؤقت تجديد الـ token */
  private startTokenRefreshTimer(): void {
    if (!this.isBrowser) return;

    // تجديد الـ token كل 7 أيام (604800000 مللي ثانية)
    setInterval(() => {
      const user = this.getCurrentUserSync();
      if (user && this.isTokenValid()) {
        this.refreshToken().subscribe({
          next: () => console.log('Token refreshed automatically'),
          error: (error) => console.error('Auto token refresh failed:', error)
        });
      }
    }, 604800000); // 7 أيام
  }

  /** تحميل المستخدم من localStorage */
  private loadUser(): User | null {
    if (!this.isBrowser) return null;
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }

  /** تسجيل دخول تلقائي */
  private autoLogin(): void {
    const user = this.loadUser();
    if (user && user.token?.trim()) {
      // التحقق من صلاحية الـ token
      if (this.isTokenValid()) {
        this.user$.next(user);
        this.isAuthenticated$.next(true);
        this.cartService.setUserId(user.id);
        console.log('Auto login successful for user:', user.email);
      } else {
        // محاولة تجديد الـ token
        this.refreshToken().subscribe({
          next: (response) => {
            console.log('Token refreshed successfully');
            this.user$.next(user);
            this.isAuthenticated$.next(true);
            this.cartService.setUserId(user.id);
          },
          error: (error) => {
            console.log('Token refresh failed, logging out');
            this.logout();
          }
        });
      }
    } else {
      this.isAuthenticated$.next(false);
      this.user$.next(null);
      // تنظيف localStorage في حالة وجود بيانات تالفة
      if (this.isBrowser) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/register`, userData).pipe(
      tap((response: any) => {
        console.log('Registration response:', response);
        if (response.user?.token) {
          const mappedUser = this.mapUser(response.user);
          this.setUser(mappedUser);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/login`, credentials).pipe(
      tap((response: any) => {
        console.log('Login response:', response);
        if (response.user?.token) {
          const mappedUser = this.mapUser(response.user);
          this.setUser(mappedUser);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/forgot-password`, { email });
  }

  resetPassword(payload: { email: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/reset-password`, payload);
  }

  verifyResetCode(payload: { email: string; resetCode: string }): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(
      `${this.apiUrl}/users/verify-reset-code`,
      payload
    );
  }

  logout(): void {
    const user = this.getCurrentUserSync();
    if (this.isBrowser) {
      if (user?.id) {
        this.cartService.clearLocalCacheForUser(user.id);
      }
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    this.cartService.resetStateOnLogout();
    this.user$.next(null);
    this.isAuthenticated$.next(false);
    this.router.navigate(['/login']);
    console.log('User logged out successfully');
  }

  /** تحويل شكل الـ user اللي جاي من السيرفر */
  private mapUser(raw: any): User {
    return {
      id: raw.id || raw._id, // دعم الحالتين
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email,
      token: raw.token,
      role: raw.role || 'user',
      isActive: raw.isActive,
      lastLogin: raw.lastLogin,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    };
  }

  /** حفظ بيانات المستخدم في الذاكرة والتخزين */
  setUser(user: User): void {
    console.log('Setting user:', user);
    if (this.isBrowser) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', user.token || '');
    }
    this.user$.next(user);
    this.isAuthenticated$.next(true);
    this.cartService.setUserId(user.id);
  }

  /** التحقق من تسجيل الدخول */
  isLoggedIn(): Observable<boolean> {
    return this.isAuthenticated$.asObservable();
  }

  getCurrentUser(): Observable<User | null> {
    return this.user$.asObservable();
  }

  getCurrentUserSync(): User | null {
    return this.user$.getValue();
  }

  getToken(): string | null {
    // Prefer in-memory token; fallback to localStorage for early app loads
    const memToken = this.getCurrentUserSync()?.token;
    if (memToken && memToken.trim()) return memToken;
    if (this.isBrowser) {
      const lsToken = localStorage.getItem('token');
      if (lsToken && lsToken.trim()) return lsToken;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          return user?.token || null;
        }
      } catch {}
    }
    return null;
  }

  /** التحقق من صحة التوكن */
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  /** تجديد التوكن تلقائياً */
  refreshToken(): Observable<any> {
    const currentUser = this.getCurrentUserSync();
    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    return this.http.post(`${this.apiUrl}/refresh-token`, {
      userId: currentUser.id
    }).pipe(
      tap((response: any) => {
        if (response?.token) {
          const updatedUser = { ...currentUser, token: response.token };
          this.setUser(updatedUser);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error refreshing token:', error);
        return throwError(() => error);
      })
    );
  }

  /** التحقق من صلاحية التوكن وتجديده إذا لزم الأمر */
  checkAndRefreshToken(): Observable<boolean> {
    if (!this.isTokenValid()) {
      return this.refreshToken().pipe(
        map(() => true),
        catchError(() => {
          this.logout();
          return of(false);
        })
      );
    }
    return of(true);
  }

  /** الحصول على جميع المستخدمين (للإدارة فقط) */
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching users:', error);
        return throwError(() => error);
      })
    );
  }

  /** تحديث مستخدم (للإدارة فقط) */
  updateUser(userId: string, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}`, userData).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating user:', error);
        return throwError(() => error);
      })
    );
  }

  /** حذف مستخدم (للإدارة فقط) */
    deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${userId}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting user:', error);
        return throwError(() => error);
      })
    );
  }

  /** حذف جميع المستخدمين (للإدارة فقط) */
  deleteAllUsers(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting all users:', error);
        return throwError(() => error);
      })
    );
  }
}
