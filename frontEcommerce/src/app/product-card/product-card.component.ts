import { Component, Input, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, NgClass } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Product } from '../types/product';
import { CartServiceService } from '../services/cart-service.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, NgClass, CurrencyPipe, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent {
  @Input() product!: Product;

  private cartService = inject(CartServiceService);
  private router = inject(Router);

  addToCart(): void {
    if (this.product.stock === 0) return;
    this.cartService.addToCart(this.product);
    // ✅ التوست هيظهر من جوه السيرفيس نفسه
  }

  getStockStatus(): string {
    return this.product.stock > 0 ? 'In stock' : 'Out of stock';
  }

  getStockClass(): string {
    return this.product.stock > 0 ? 'text-success' : 'text-danger';
  }

  getStars(): number[] {
    const safeRating = Math.floor(this.product.rating ?? 0);
    return Array.from({ length: 5 }, (_, i) => i < safeRating ? 1 : 0);
  }
}