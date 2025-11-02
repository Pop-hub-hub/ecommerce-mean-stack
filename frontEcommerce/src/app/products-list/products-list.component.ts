import { Component, OnInit } from '@angular/core';
import { ProductServiceService } from '../services/product-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Product, ProductResponse } from '../types/product';
import { ProductCardComponent } from '../product-card/product-card.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [ProductCardComponent, CommonModule, FormsModule, ToastComponent],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.css']
})
export class ProductsListComponent implements OnInit {
  products: Product[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  filter: string = 'all';
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  constructor(
    private ps: ProductServiceService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService 
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const page = +params['page'] || 1;
      const filter = params['filter'] || 'all';
      const search = params['search'] || '';

      this.currentPage = page;
      this.filter = filter;
      this.searchTerm = search;

      this.fetchProducts(page, filter, search);
    });

    this.searchSubject.pipe(debounceTime(500)).subscribe((search) => {
      this.router.navigate([], {
        queryParams: { search, page: 1 },
        queryParamsHandling: 'merge'
      });
    });
  }

  fetchProducts(page: number, filter: string, search: string): void {
    this.ps.getProductsList(page, filter, search).subscribe({
      next: (res: ProductResponse) => {
        this.products = res.data;
        this.totalPages = res.pagination.totalPages;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching products:', err.message);
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.router.navigate([], {
        queryParams: { page },
        queryParamsHandling: 'merge'
      });
    }
  }

  applyFilter(filter: string): void {
    this.router.navigate([], {
      queryParams: { filter, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  handleAddToCart(product: Product): void {
    this.toastService.show(`${product.title} اتضاف للسلة ✅`, 'success');
  }
}