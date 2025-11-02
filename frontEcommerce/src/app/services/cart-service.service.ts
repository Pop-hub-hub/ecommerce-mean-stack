import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Product } from '../types/product';
import { CartItem } from '../types/cartItem';
import { ToastService } from './toast.service';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class CartServiceService {
  private cartItems$ = new BehaviorSubject<CartItem[]>([]);
  private cartCount$ = new BehaviorSubject<number>(0);

  cart = this.cartItems$.asObservable();
  counter = this.cartCount$.asObservable();

  private baseUrl = 'http://localhost:4000/api/cart';
  private userId: string = '';
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private http: HttpClient,
    private toast: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // لو فيه مستخدم محفوظ في localStorage نحمله
    if (this.isBrowser) {
      const user = localStorage.getItem('user');
      if (user) {
        this.userId = JSON.parse(user).id;
        // حمل نسخة محلية أولاً لمنع فَراغ السلة عند إعادة التحميل
        this.loadUserCartFromLocal(this.userId);
        // ثم اعمل مزامنة مع السيرفر
        this.loadCartFromServer();
      } else {
        // تحميل سلة الضيف من localStorage
        this.loadGuestCart();
      }
    }
  }

  setUserId(id: string) {
    this.userId = id;
    this.loadCartFromServer();
  }

  private updateState() {
    this.cartCount$.next(this.getTotalItems());
  }

  private getUserId(): string {
    if (this.isBrowser) {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : this.userId;
    }
    return this.userId;
  }

  // =====================
  // Guest cart management
  // =====================
  private loadGuestCart() {
    if (!this.isBrowser) return;
    try {
      const stored = localStorage.getItem('guestCart');
      const items: CartItem[] = stored ? JSON.parse(stored) : [];
      this.cartItems$.next(items);
      this.updateState();
    } catch (e) {
      console.error('❌ Failed to parse guestCart from localStorage', e);
      this.cartItems$.next([]);
      this.updateState();
    }
  }

  private saveGuestCart() {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem('guestCart', JSON.stringify(this.cartItems$.getValue()));
    } catch (e) {
      console.error('❌ Failed to save guestCart', e);
    }
  }

  // =====================
  // User cart local cache
  // =====================
  private getUserCartKey(userId: string) {
    return `userCart_${userId}`;
  }

  private loadUserCartFromLocal(userId: string) {
    if (!this.isBrowser || !userId) return;
    try {
      const stored = localStorage.getItem(this.getUserCartKey(userId));
      if (stored) {
        const items: CartItem[] = JSON.parse(stored);
        this.cartItems$.next(items);
        this.updateState();
      }
    } catch (e) {
      console.error('❌ Failed to parse user cart from localStorage', e);
    }
  }

  private saveUserCartToLocal(userId: string) {
    if (!this.isBrowser || !userId) return;
    try {
      localStorage.setItem(this.getUserCartKey(userId), JSON.stringify(this.cartItems$.getValue()));
    } catch (e) {
      console.error('❌ Failed to save user cart to localStorage', e);
    }
  }

  loadCartFromServer() {
    const userId = this.getUserId();

    if (!userId) {
      console.warn('⚠️ No userId set for cart loading');
      return;
    }

    this.http.get<any>(`${this.baseUrl}/${userId}`).subscribe({
      next: (res) => {
        const items = this.mapServerItemsToClient(res?.items || []);
        this.cartItems$.next(items);
        this.updateState();
        this.saveUserCartToLocal(userId);
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Failed to load cart', err);
        // في حالة الفشل، اترك النسخة المحلية كما هي
      }
    });
  }

  addToCart(product: Product, quantity: number = 1) {
    const userId = this.getUserId();
    if (!userId) {
      this.toast.show('⚠️ you must log in to add items to the cart', 'info');
      this.router.navigate(['/login'], { queryParams: { redirect: 'cart' } });
      return;
    }
    if (product.stock === 0) {
      this.toast.show('❌ Product is out of stock', 'error');
      return;
    }
    // Use _id if available, otherwise use id (for DummyJSON products)
    const productId = product._id || product.id;
    const payload = { userId, product: { _id: productId }, quantity };
    this.http.post<any>(`${this.baseUrl}/add`, payload).subscribe({
      next: (res) => {
        const items = this.mapServerItemsToClient(res?.items || []);
        this.cartItems$.next(items);
        this.updateState();
        this.saveUserCartToLocal(userId);
        this.toast.show('✅ Product added to cart!', 'success');
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Failed to add product', err);
        this.toast.show('❌ Failed to add product to cart', 'error');
      }
    });
  }

  removeFromCart(product: Product | string) {
    const userId = this.getUserId();

    if (!userId) {
      const productId = typeof product === 'string' ? product : (product._id || product.id);
      const filtered = this.cartItems$.getValue().filter(ci => (ci.product?._id || ci.product?.id) !== productId);
      this.cartItems$.next(filtered);
      this.updateState();
      this.saveGuestCart();
      return;
    }

    const productId = typeof product === 'string' ? product : (product._id || product.id);

    this.http.delete<any>(`${this.baseUrl}/${userId}/${productId}`).subscribe({
      next: (res) => {
        const items = this.mapServerItemsToClient(res?.items || []);
        this.cartItems$.next(items);
        this.updateState();
        this.saveUserCartToLocal(userId);
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Failed to remove product', err);
      }
    });
  }

  changeQuantity(productId: string, newQuantity: number) {
    const userId = this.getUserId();

    if (!userId) {
      const items = this.cartItems$.getValue();
      const index = items.findIndex(ci => (ci.product?._id || ci.product?.id) === productId);
      if (index >= 0) {
        if (newQuantity <= 0) {
          items.splice(index, 1);
        } else {
          items[index] = { ...items[index], quantity: newQuantity };
        }
        this.cartItems$.next([...items]);
        this.updateState();
        this.saveGuestCart();
      }
      return;
    }

    const payload = { userId, productId, quantity: newQuantity };

    this.http.put<any>(`${this.baseUrl}/update-quantity`, payload).subscribe({
      next: (res) => {
        const items = this.mapServerItemsToClient(res?.items || []);
        this.cartItems$.next(items);
        this.updateState();
        this.saveUserCartToLocal(userId);
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Failed to update quantity', err);
      }
    });
  }

  clearCart() {
    const userId = this.getUserId();

    if (!userId) {
      this.cartItems$.next([]);
      this.cartCount$.next(0);
      this.saveGuestCart();
      return;
    }

    this.cartItems$.next([]);
    this.cartCount$.next(0);

    this.http.delete(`${this.baseUrl}/${userId}`).subscribe({
      next: () => {
        console.log('🧹 Cart cleared');
        // امسح النسخة المحلية أيضاً
        if (this.isBrowser) localStorage.removeItem(this.getUserCartKey(userId));
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Failed to clear cart', err);
      }
    });
  }

  placeOrder(order: any) {
    return this.http.post('http://localhost:4000/api/orders', order);
  }

  getCartItems(): Observable<CartItem[]> {
    return this.cartItems$.asObservable();
  }

  getTotal(): number {
    return this.cartItems$.getValue().reduce((sum, item) => {
      const price = item.product?.price ?? 0;
      return sum + item.quantity * price;
    }, 0);
  }

  getTotalItems(): number {
    return this.cartItems$.getValue().reduce((sum, item) => sum + item.quantity, 0);
  }

  // =====================
  // Logout helpers
  // =====================
  clearLocalCacheForUser(userId: string): void {
    if (!this.isBrowser || !userId) return;
    try {
      localStorage.removeItem(this.getUserCartKey(userId));
    } catch {}
  }

  resetStateOnLogout(): void {
    // Clear in-memory state and both guest and user local caches (user cache removed by caller with known userId)
    this.cartItems$.next([]);
    this.cartCount$.next(0);
    if (this.isBrowser) {
      try { localStorage.removeItem('guestCart'); } catch {}
    }
  }
  // خريطة تحويل استجابة السيرفر لشكل الواجهة
  private mapServerItemsToClient(serverItems: any[]): CartItem[] {
    return (serverItems || []).map((it: any) => {
      const product = it.product || it.productId || it.productDetails || null;
      return {
        product: product as unknown as Product,
        quantity: it.quantity ?? 1,
        _id: it._id,
        userId: this.userId
      } as CartItem;
    });
  }
}
