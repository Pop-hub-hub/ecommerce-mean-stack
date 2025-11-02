import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({ 
  providedIn: 'root' 
})
export class OrderService {
  private baseUrl = environment.apiUrl + '/orders';

  constructor(private http: HttpClient) {}

  /**
   * إنشاء طلب جديد
   */
  createOrder(orderData: any): Observable<any> {
    console.log('Creating order:', orderData);
    
    return this.http.post(this.baseUrl, orderData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * الحصول على طلبات مستخدم معين
   */
  getOrders(userId: string): Observable<any> {
    if (!userId) {
      return throwError(() => new Error('User ID is required'));
    }

    console.log('Fetching orders for user:', userId);
    
    return this.http.get(`${this.baseUrl}/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  /** تحديث كمية عنصر داخل طلب (مسموح فقط لو الحالة pending) */
  updateOrderItemQuantity(orderId: string, productId: string, quantity: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${orderId}/item`, { productId, quantity }).pipe(
      catchError(this.handleError)
    );
  }

  /** حذف عنصر من طلب (pending فقط) */
  removeOrderItem(orderId: string, productId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${orderId}/item/${productId}`).pipe(
      catchError(this.handleError)
    );
  }

  /** إضافة عنصر جديد لطلب (pending فقط) */
  addOrderItem(orderId: string, productId: string, quantity: number = 1): Observable<any> {
    return this.http.post(`${this.baseUrl}/${orderId}/item`, { productId, quantity }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * الحصول على جميع الطلبات (للإدارة)
   */
  getAllOrders(): Observable<any> {
    return this.http.get(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * حذف طلب
   */
  deleteOrder(orderId: string): Observable<any> {
    if (!orderId) {
      return throwError(() => new Error('Order ID is required'));
    }

    console.log('Deleting order:', orderId);
    
    return this.http.delete(`${this.baseUrl}/${orderId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * تحديث حالة الطلب (للإدارة)
   */
  updateOrderStatus(orderId: string, status: string): Observable<any> {
    if (!orderId || !status) {
      return throwError(() => new Error('Order ID and status are required'));
    }

    console.log('Updating order status:', { orderId, status });
    
    return this.http.patch(`${this.baseUrl}/${orderId}/status`, { status }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * الحصول على طلب واحد بالتفصيل
   */
  getOrderById(orderId: string): Observable<any> {
    if (!orderId) {
      return throwError(() => new Error('Order ID is required'));
    }

    return this.http.get(`${this.baseUrl}/details/${orderId}`).pipe(
      catchError(this.handleError)
    );
  }

  /** حفظ التعديلات على الطلب كاملاً (pending فقط) */
  saveOrder(orderId: string, products: Array<{ productId: string; quantity: number }>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${orderId}`, { products }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * معالجة الأخطاء
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('OrderService error:', error);

    let errorMessage = 'حدث خطأ غير متوقع';

    if (error.error instanceof ErrorEvent) {
      // خطأ من جهة العميل
      errorMessage = `خطأ: ${error.error.message}`;
    } else {
      // خطأ من جهة الخادم
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'بيانات غير صحيحة';
          break;
        case 401:
          errorMessage = 'يجب تسجيل الدخول أولاً';
          break;
        case 403:
          errorMessage = 'غير مخول للوصول';
          break;
        case 404:
          errorMessage = 'الطلب غير موجود';
          break;
        case 500:
          errorMessage = 'خطأ في الخادم، حاول لاحقاً';
          break;
        default:
          errorMessage = error.error?.message || `خطأ: ${error.status}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}