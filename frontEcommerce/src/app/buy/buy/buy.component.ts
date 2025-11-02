import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartServiceService } from '../../services/cart-service.service';
import { OrderService } from '../../services/orders.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-buy',
  templateUrl: './buy.component.html',
  styleUrls: ['./buy.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class BuyComponent implements OnInit, OnDestroy {
  cartItems: any[] = [];
  totalPrice = 0;
  shippingForm!: FormGroup;
  paymentForm!: FormGroup;
  currentUser: any = null;
  submitted = false;
  loading = false;
  locating = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private cartService: CartServiceService,
    private orderService: OrderService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // التحقق من تسجيل الدخول أولاً
    const authSub = this.authService.getCurrentUser().subscribe(user => {
      if (!user) {
        this.toastService.show('Please login first', 'info');
        this.router.navigate(['/login']);
        return;
      }
      this.currentUser = user;
      console.log('Current user loaded:', this.currentUser);
    });
    this.subscriptions.push(authSub);

    // إنشاء النماذج
    this.shippingForm = this.fb.group({
      address: ['', [Validators.required, Validators.minLength(10)]],
      phone: ['', [Validators.required, Validators.pattern(/^01[0-2,5]{1}[0-9]{8}$/)]],
      notes: [''],
      location: this.fb.group({
        lat: [null],
        lng: [null],
        formattedAddress: ['']
      })
    });

    this.paymentForm = this.fb.group({
      method: ['cod', Validators.required],
      // card fields
      cardName: [''],
      cardNumber: [''],
      cardExpiry: [''],
      cardCvv: [''],
      // ewallet fields
      provider: [''], // 'vodafone','orange','etisalat','we'
      walletNumber: [''],
      walletPin: ['']
    });

    // تحميل محتويات السلة
    const cartSub = this.cartService.getCartItems().subscribe((items) => {
      this.cartItems = items;
      this.totalPrice = this.cartService.getTotal();
      
      // التحقق من وجود عناصر في السلة
      if (this.cartItems.length === 0) {
        this.toastService.show('Cart is empty, redirecting to products', 'info');
        this.router.navigate(['/products']);
        return;
      }
    });
    this.subscriptions.push(cartSub);
  }

  get formControls() {
    return this.shippingForm.controls;
  }

  placeOrder() {
    this.submitted = true;

    // التحقق من تسجيل الدخول
    if (!this.currentUser) {
      this.toastService.show('Please login first', 'info');
      this.router.navigate(['/login']);
      return;
    }

    // التحقق من وجود عناصر في السلة
    if (this.cartItems.length === 0) {
      this.toastService.show('Cart is empty', 'info');
      this.router.navigate(['/cart']);
      return;
    }

    // التحقق من صحة النموذج
    if (this.shippingForm.invalid || this.paymentForm.invalid) {
      this.toastService.show('Please fill in all required fields correctly', 'info');
      this.shippingForm.markAllAsTouched();
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    // تجهيز بيانات الطلب
    const orderData = {
      user: this.currentUser.id,
      products: this.cartItems.map(item => ({
        productId: item.product._id || item.product.id,
        quantity: item.quantity
      })),
      totalPrice: this.totalPrice,
      shippingInfo: {
        address: this.shippingForm.value.address,
        phone: this.shippingForm.value.phone,
        notes: this.shippingForm.value.notes
      },
      location: this.shippingForm.value.location,
      payment: this.buildPaymentPayload()
    };

    console.log('Placing order:', orderData);

    // إرسال الطلب
    const orderSub = this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        console.log('Order created successfully:', response);
        this.toastService.show('Order created successfully', 'success');
        
        // تفريغ السلة
        this.cartService.clearCart();
        
        // إعادة تعيين النموذج
        this.shippingForm.reset();
        this.submitted = false;
        this.loading = false;
        
        // الانتقال لصفحة الطلبات
        setTimeout(() => {
          this.router.navigate(['/orders']);
        }, 2000);
      },
      error: (error) => {
        console.error('Order creation failed:', error);
        this.loading = false;
        
        const errorMessage = error.error?.message || 'Failed to create order';
        this.toastService.show(errorMessage, 'error');
      }
    });

    this.subscriptions.push(orderSub);
  }

  useGPS() {
    if (!navigator.geolocation) {
      this.toastService.show('Geolocation is not supported', 'error');
      return;
    }
    this.locating = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords as any;
        this.shippingForm.patchValue({ location: { lat: latitude, lng: longitude } });
        this.toastService.show('Location captured', 'success');
        this.locating = false;
      },
      () => {
        this.toastService.show('Failed to get location', 'error');
        this.locating = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private buildPaymentPayload() {
    const v = this.paymentForm.value;
    if (v.method === 'card') {
      return {
        method: 'card',
        cardName: v.cardName,
        cardNumber: v.cardNumber, // backend will only keep last4
        cardExpiry: v.cardExpiry,
        cardCvv: v.cardCvv
      };
    }
    if (v.method === 'ewallet') {
      return {
        method: 'ewallet',
        provider: v.provider,
        walletNumber: v.walletNumber,
        walletPin: v.walletPin
      };
    }
    return { method: 'cod' };
  }

  goBack() {
    this.router.navigate(['/cart']);
  }

  continueShopping() {
    this.router.navigate(['/products']);
  }

  // حساب إجمالي العناصر
  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  // تنسيق السعر
  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}