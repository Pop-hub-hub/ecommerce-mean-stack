import { Component, OnInit } from '@angular/core';
import { Product } from '../types/product';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ProductServiceService } from '../services/product-service.service';
import { CartServiceService } from '../services/cart-service.service';
import { ToastService } from '../services/toast.service';

@Component({
    standalone: true,
  selector: 'app-product-details',
  imports: [CommonModule, CurrencyPipe,],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit {
  products : Product [] = [];
  product: Product | undefined;
  selectedImage : any = '';
  quantity: number = 1;
  loading: boolean = false;
  
  constructor(
    private route: ActivatedRoute, 
    private ps: ProductServiceService, 
    private cartService: CartServiceService, 
    private router: Router,
    private toastService: ToastService
  ) {}
  
 
  ngOnInit() {
    const id = String(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    
    this.ps.getProductDetails(id).subscribe({
      next: (response: any) => {
        // DummyJSON returns the product directly, not in a data property
        if (response) {
          this.product = response;
          // Check if images array exists before accessing it
          if (this.product?.images && this.product.images.length > 0) {
            this.selectedImage = this.product.images[0];
          } else if (this.product?.thumbnail) {
            // Fallback to thumbnail if no images array
            this.selectedImage = this.product.thumbnail;
          }
        } else {
          // Handle case where response doesn't have expected structure
          this.toastService.show('Invalid product data received', 'error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('ProductService error:', error);
        this.loading = false;
        const errorMessage = error.message || 'Failed to load product details';
        this.toastService.show(errorMessage, 'error');
        // Optionally redirect to products page after error
        // this.router.navigate(['/products']);
      }
    });
  }

  addToCart() {
    if (!this.product) return;
    if (!this.product._id && this.product.id) {
      this.product._id = this.product.id;
    }
    this.cartService.addToCart(this.product, this.quantity);
    this.router.navigate(['/cart']);
  }
  
  increaseQty() {
    if (this.quantity < this.product?.stock!) {
      this.quantity++;
    }
  }

  decreaseQty() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  getStars(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }

  selectImage(img: string) {
    this.selectedImage = img;
  }
}
