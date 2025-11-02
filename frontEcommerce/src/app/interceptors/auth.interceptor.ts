import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // إضافة التوكن للطلبات
    const token = this.authService.getToken();
    
    if (token && request.url.startsWith(environment.apiUrl)) {
      request = request.clone({
        setHeaders: { 'Authorization': `Bearer ${token}` }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // إذا كان الخطأ 401 (غير مصرح) والطلب ليس لـ refresh token
        if (error.status === 401 && !request.url.includes('/refresh-token')) {
          // محاولة تجديد الـ token
          return this.authService.refreshToken().pipe(
            switchMap(() => {
              // إعادة الطلب الأصلي مع الـ token الجديد
              const newToken = this.authService.getToken();
              const newRequest = request.clone({
                setHeaders: { 'Authorization': `Bearer ${newToken}` }
              });
              return next.handle(newRequest);
            }),
            catchError((refreshError) => {
              // إذا فشل تجديد الـ token، تسجيل الخروج
              this.authService.logout();
              return throwError(() => refreshError);
            })
          );
        }
        
        return throwError(() => error);
      })
    );
  }
}