import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrderService } from '../services/orders.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-orders',
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: any[] = [];
  currentUser: any = null;
  loading: boolean = true;
  deleteLoading: { [key: string]: boolean } = {};
  dirty: { [orderId: string]: boolean } = {};

  private subscriptions: Subscription[] = [];

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    // التحقق من تسجيل الدخول
    const authSub = this.authService.getCurrentUser().subscribe(user => {
      if (!user) {
        this.toastService.show('Please login first', 'info');

        this.router.navigate(['/login']);
        return;
      }
      
      this.currentUser = user;
      console.log('Current user loaded:', this.currentUser);
      this.fetchOrders();
    });
    
    this.subscriptions.push(authSub);
  }

  fetchOrders() {
    if (!this.currentUser) {
      console.warn('No current user found');
      return;
    }

    this.loading = true;
    console.log('Fetching orders for user:', this.currentUser.id);

    const ordersSub = this.orderService.getOrders(this.currentUser.id).subscribe({
      next: (data: any) => {
        console.log('Orders fetched successfully:', data);
        this.orders = Array.isArray(data) ? data : [];
        this.loading = false;
        
        if (this.orders.length === 0) {
          this.toastService.show('No orders available', 'info');
        }
      },
      error: (error) => {
        console.error('Error fetching orders:', error);
        this.loading = false;
        
        if (error.status === 404) {
          this.orders = [];
          this.toastService.show('No orders available', 'info');
        } else {
          this.toastService.show('Failed to load orders', 'error');
        }
      }
    });

    this.subscriptions.push(ordersSub);
  }

  deleteOrder(orderId: string) {
    if (!orderId) {
      this.toastService.show('Invalid order ID', 'error');
      return;
    }

    // تأكيد الحذف
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    this.deleteLoading[orderId] = true;

    const deleteSub = this.orderService.deleteOrder(orderId).subscribe({
      next: (response) => {
        console.log('Order deleted successfully:', response);
        this.toastService.show('Order deleted successfully', 'success');
        this.fetchOrders();
        // إزالة الطلب من القائمة محلياً لتحسين الأداء
        this.orders = this.orders.filter(order => order._id !== orderId);
        
        this.deleteLoading[orderId] = false;
      },
      error: (error) => {
        console.error('Error deleting order:', error);
        this.deleteLoading[orderId] = false;
        
        const errorMessage = error.error?.message || 'Failed to delete order';
        this.toastService.show(errorMessage, 'error');
        
      }
    });

    this.subscriptions.push(deleteSub);
  }

  // تنسيق التاريخ
  formatDate(dateString: string): string {
    if (!dateString) return 'Not available';
    if (dateString.includes('T')) {
      dateString = dateString.replace('T', ' ');
    }

    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  // تنسيق حالة الطلب
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[status] || status;
  }

  // تنسيق لون حالة الطلب
  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    
    return classMap[status] || 'status-default';
  }

  // تنسيق السعر
  formatPrice(price: number): string {
    if (!price) return '0.00';
    return price.toFixed(2);
  }

  // حساب إجمالي العناصر في الطلب
  getTotalItems(products: any[]): number {
    if (!products || !Array.isArray(products)) return 0;
    
    return products.reduce((total, product) => {
      return total + (product.quantity || 0);
    }, 0);
  }

  onIncrease(orderId: string, item: any) {
    const productId = item.productId?._id || item.productId?.id;
    const newQty = (item.quantity || 0) + 1;
    this.orderService.updateOrderItemQuantity(orderId, productId, newQty).subscribe({
      next: (updated) => {
        this.orders = this.orders.map(o => o._id === orderId ? updated : o);
        this.dirty[orderId] = true;
      },
      error: () => this.toastService.show('Failed to update quantity', 'error')
    });
  }

  onDecrease(orderId: string, item: any) {
    const productId = item.productId?._id || item.productId?.id;
    const newQty = (item.quantity || 0) - 1;
    this.orderService.updateOrderItemQuantity(orderId, productId, newQty).subscribe({
      next: (updated) => {
        this.orders = this.orders.map(o => o._id === orderId ? updated : o);
        this.dirty[orderId] = true;
      },
      error: () => this.toastService.show('Failed to update quantity', 'error')
    });
  }

  onRemoveItem(orderId: string, item: any) {
    const productId = item.productId?._id || item.productId?.id;
    this.orderService.removeOrderItem(orderId, productId).subscribe({
      next: (updated) => {
        this.orders = this.orders.map(o => o._id === orderId ? updated : o);
        this.dirty[orderId] = true;
      },
      error: () => this.toastService.show('Failed to remove item', 'error')
    });
  }

  getOrderTotal(order: any): number {
    const items = order.products || order.items || [];
    return items.reduce((sum: number, it: any) => sum + ((it.productId?.price || 0) * (it.quantity || 0)), 0);
  }

  save(order: any) {
    const items = (order.products || order.items || [])
      .map((it: any) => ({ productId: it.productId?._id || it.productId?.id, quantity: it.quantity }));
    this.orderService.saveOrder(order._id, items).subscribe({
      next: (updated) => {
        this.orders = this.orders.map(o => o._id === order._id ? updated : o);
        this.dirty[order._id] = false;
        this.toastService.show('Order saved', 'success');
      },
      error: () => this.toastService.show('Failed to save order', 'error')
    });
  }

  // الانتقال للتسوق
  continueShopping() {
    this.router.navigate(['/products']);
  }

  // تحديث الطلبات
  refreshOrders() {
    this.fetchOrders();
  }

  // تتبع العناصر للأداء
  trackByOrderId(index: number, order: any): string {
    return order._id || index.toString();
  }

  trackByProductId(index: number, product: any): string {
    return product._id || product.productId?._id || index.toString();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}