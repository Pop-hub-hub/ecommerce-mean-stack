import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';

import { ProductServiceService } from '../../../services/product-service.service';
import { Product } from '../../../types/product';
import { ReplacePipe } from '../../../shared/pipes/replace.pipe';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatCardModule,
    ReplacePipe
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  product: Partial<Product> = {
    title: '',
    description: '',
    price: 0,
    discountPercentage: 0,
    rating: 0,
    stock: 0,
    brand: '',
    category: '',
    thumbnail: '',
    images: []
  };
  
  categories = [
    'smartphones', 'electronics', 'fragrances', 'skincare', 
    'groceries', 'home-decoration', 'furniture', 'tops', 
    'womens-dresses', 'womens-shoes', 'mens-shirts', 'mens-shoes', 
    'mens-watches', 'womens-watches', 'womens-bags', 'womens-jewellery', 
    'sunglasses', 'automotive', 'motorcycle', 'lighting'
  ];
  
  isEditMode = false;
  productId: string | null = null;
  loading = false;

  constructor(
    private productService: ProductServiceService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.productId = params['id'];
        // Add null check
        if (this.productId) {
          this.loadProduct(this.productId);
        }
      }
    });
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProductDetails(id).subscribe({
      next: (product) => {
        this.product = { ...product };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.snackBar.open('Failed to load product', 'Close', { duration: 3000 });
        this.loading = false;
        this.router.navigate(['/admin/products']);
      }
    });
  }

  onSubmit(): void {
    if (!this.product.title || !this.product.description || !this.product.category) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    
    if (this.isEditMode && this.productId) {
      // Update existing product
      this.productService.updateProduct(this.productId, this.product).subscribe({
        next: (response) => {
          this.snackBar.open('Product updated successfully', 'Close', { duration: 3000 });
          this.loading = false;
          this.router.navigate(['/admin/products']);
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.snackBar.open('Failed to update product', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    } else {
      // Create new product
      this.productService.createProduct(this.product).subscribe({
        next: (response) => {
          this.snackBar.open('Product created successfully', 'Close', { duration: 3000 });
          this.loading = false;
          this.router.navigate(['/admin/products']);
        },
        error: (error) => {
          console.error('Error creating product:', error);
          this.snackBar.open('Failed to create product', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/products']);
  }
}