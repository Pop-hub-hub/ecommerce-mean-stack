import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartServiceService } from '../services/cart-service.service';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartItem } from '../types/cartItem';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  loading: boolean = false;
  private subscription = new Subscription();

  constructor(
    public cartService: CartServiceService, 
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // التحقق من تسجيل الدخول
    this.subscription.add(
      this.authService.isLoggedIn().subscribe(isLoggedIn => {
        if (!isLoggedIn) {
          this.router.navigate(['/login']);
          return;
        }
      })
    );

    // تحميل السلة
    this.subscription.add(
      this.cartService.getCartItems().subscribe(items => {
        // console.log('Cart items received:', items);
        this.cartItems = items;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  increase(item: CartItem): void {
    if (!item.product || !item.product._id) {
      console.error('Invalid product in cart item:', item);
      return;
    }

    const productId = item.product._id || item.product.id;
    const newQuantity = item.quantity + 1;
    
    // التحقق من المخزون
    if (item.product.stock && newQuantity > item.product.stock) {
      console.warn('Cannot increase quantity beyond stock limit');
      return;
    }

    console.log('Increasing quantity:', { productId, newQuantity });
    this.cartService.changeQuantity(productId, newQuantity);
  }

  decrease(item: CartItem): void {
    if (!item.product || !item.product._id) {
      console.error('Invalid product in cart item:', item);
      return;
    }

    const newQuantity = item.quantity - 1;

    if (newQuantity <= 0) {
      this.remove(item);
    } else {
      const productId = item.product._id || item.product.id;
      console.log('Decreasing quantity:', { productId, newQuantity });
      this.cartService.changeQuantity(productId, newQuantity);
    }
  }

  remove(item: CartItem): void {
    if (!item.product) {
      console.error('Invalid product in cart item:', item);
      return;
    }

    console.log('Removing item from cart:', item);
    this.cartService.removeFromCart(item.product);
  }

  clearCart(): void {
    if (confirm('هل أنت متأكد من تفريغ السلة؟')) {
      this.cartService.clearCart();
    }
  }

  getTotal(): number {
    return this.cartService.getTotal();
  }

  getTotalItems(): number {
    return this.cartService.getTotalItems();
  }

  trackByProductId(index: number, item: CartItem): string {
    return item.product?._id || item.product?.id || index.toString();
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      return;
    }
    
    this.router.navigate(['/buy_now']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }
}