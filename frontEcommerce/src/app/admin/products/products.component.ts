import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { Subscription, take } from 'rxjs';

import { ProductServiceService } from '../../services/product-service.service';
import { AuthService } from '../../services/auth.service';
import { Product, ProductResponse } from '../../types/product';
import { ReplacePipe } from '../../shared/pipes/replace.pipe';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSnackBarModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    ReplacePipe,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class AdminProductsComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['image', 'title', 'price', 'stock', 'category', 'actions'];
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm: string = '';
  selectedCategory: string = 'all';
  loading: boolean = true;
  pageIndex: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  totalProducts: number = 0;
  isAdmin: boolean = false;
  private subscriptions = new Subscription();

  categories = [
    'smartphones', 'electronics', 'fragrances', 'skincare', 
    'groceries', 'home-decoration', 'furniture', 'tops', 
    'womens-dresses', 'womens-shoes', 'mens-shirts', 'mens-shoes', 
    'mens-watches', 'womens-watches', 'womens-bags', 'womens-jewellery', 
    'sunglasses', 'automotive', 'motorcycle', 'lighting'
  ];
   
  constructor(
    private productService: ProductServiceService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Check if user is admin
    this.authService.getCurrentUser().pipe(take(1)).subscribe(user => {
      this.isAdmin = user?.role === 'admin';
      if (!this.isAdmin) {
        this.router.navigate(['/']);
        return;
      }
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading = true;
    const sub = this.productService.getAdminProductsList(
      this.pageIndex + 1, 
      this.selectedCategory === 'all' ? '' : this.selectedCategory, 
      this.searchTerm
    ).subscribe({
      next: (response: any) => {
        if (response?.data) {
          // The response.data is the array of products directly, not in a 'products' sub-property
          this.products = response.data;
          this.filteredProducts = [...this.products];
          // Pagination info is in response.pagination
          this.totalProducts = response.pagination?.totalItems || this.products.length;
        } else {
          this.products = [];
          this.filteredProducts = [];
          this.totalProducts = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.snackBar.open('Failed to load products', 'Close', { duration: 3000 });
        this.products = [];
        this.filteredProducts = [];
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  searchProducts(): void {
    this.pageIndex = 0; // Reset to first page when searching
    this.loadProducts();
  }

  onCategoryChange(): void {
    this.pageIndex = 0; // Reset to first page when changing category
    this.loadProducts();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  editProduct(productId: string): void {
    this.router.navigate(['/admin/products/edit', productId]);
  }

  viewProduct(productId: string): void {
    this.router.navigate(['/product', productId]);
  }

  deleteProduct(event: Event, productId: string): void {
    event.stopPropagation(); // Prevent row click event
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Delete Product',
        message: 'Are you sure you want to delete this product? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    const sub = dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.deleteProduct(productId).subscribe({
          next: () => {
            this.products = this.products.filter(p => p._id !== productId);
            this.filteredProducts = this.filteredProducts.filter(p => p._id !== productId);
            this.totalProducts--;
            this.snackBar.open('Product deleted successfully', 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            this.snackBar.open('Failed to delete product', 'Close', { duration: 3000 });
          }
        });
      }
    });
    this.subscriptions.add(sub);
  }

  addNewProduct(): void {
    this.router.navigate(['/admin/products/new']);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get paginatedProducts(): any[] {
    const startIndex = (this.pageIndex * this.pageSize);
    const endIndex = startIndex + this.pageSize;
    return this.filteredProducts.slice(startIndex, endIndex);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/placeholder-product.png';
  }
}