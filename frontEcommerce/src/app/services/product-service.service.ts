import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Product, ProductResponse } from '../types/product';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductServiceService {
  private baseUrl = environment.apiUrl + '/products';
  private productUrl = 'http://localhost:4000/api/admin';
  constructor(private http: HttpClient) {}

  getProductsList(page: number = 1, filter: string = 'all', search: string = '', category?: string): Observable<ProductResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('filter', filter)
      .set('search', search);

    if (category) {
      params = params.set('category', category);
    }

    console.log('Fetching products with params:', { page, filter, search, category });

    return this.http.get<ProductResponse>(`${this.baseUrl}`, { params }).pipe(
      retry(2), 
      catchError(this.handleError)
    );
  }

  getHomeSliderProducts(): Observable<ProductResponse> {
    console.log('Fetching home slider products');
    
    return this.http.get<ProductResponse>(`${this.baseUrl}/home-slider`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getProductDetails(id: string): Observable<Product> {
    if (!id) {
      return throwError(() => new Error('Product ID is required'));
    }

    console.log('Fetching product details for ID:', id);

    return this.http.get<{ status: string; data: Product }>(`${this.baseUrl}/${id}`).pipe(
      retry(1),
      map((res) => res.data),
      catchError(this.handleError)
    );
  }

  // Fetch a product by id from backend DB (to hydrate cart items)
  getProductByIdFromBackend(id: string): Observable<Product | undefined> {
    if (!id) return throwError(() => new Error('Product ID is required'));
    return this.http.get<{ status: string; data: Product }>(`${this.baseUrl}/${id}`).pipe(
      retry(1),
      map((res) => res?.data),
      catchError((err) => {
        console.error('Failed to hydrate product', err);
        return throwError(() => err);
      })
    );
  }


  searchProducts(query: string, page: number = 1): Observable<ProductResponse> {
    if (!query.trim()) {
      return this.getProductsList(page);
    }

    const params = new HttpParams()
      .set('search', query.trim())
      .set('page', page.toString());

    console.log('Searching products with query:', query);

    return this.http.get<ProductResponse>(`${this.baseUrl}`, { params }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getProductsByCategory(category: string, page: number = 1): Observable<ProductResponse> {
    if (!category) {
      return this.getProductsList(page);
    }

    const params = new HttpParams()
      .set('category', category)
      .set('page', page.toString());

    console.log('Fetching products by category:', category);

    return this.http.get<ProductResponse>(`${this.baseUrl}`, { params }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }


  getFilteredProducts(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    inStock?: boolean;
    onSale?: boolean;
    page?: number;
    limit?: number;
  }): Observable<ProductResponse> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof typeof filters];
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'inStock' && value) {
          params = params.set('filter', 'in-stock');
        } else if (key === 'onSale' && value) {
          params = params.set('filter', 'on-sale');
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    console.log('Fetching filtered products:', filters);

    return this.http.get<ProductResponse>(`${this.baseUrl}`, { params }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * الحصول على الفئات المتاحة
   */
  getCategories(): Observable<{ status: string; data: string[] }> {
    return this.http.get<{ status: string; data: string[] }>(`${this.baseUrl}/categories`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * الحصول على جميع المنتجات للوحة الإدارة
   */
  getAdminProductsList(page: number = 1, filter: string = 'all', search: string = '', category?: string): Observable<ProductResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('filter', filter)
      .set('search', search);

    if (category) {
      params = params.set('category', category);
    }

    console.log('Fetching admin products with params:', { page, filter, search, category });

    // Using the admin endpoint
    return this.http.get<ProductResponse>(`${this.productUrl}/products`, { params }).pipe(
      retry(2), 
      catchError(this.handleError)
    );
  }

  /**
   * إنشاء منتج جديد (للإدارة فقط)
   */
  createProduct(productData: Partial<Product>): Observable<{ status: string; data: Product; message: string }> {
    console.log('Creating new product:', productData);

    return this.http.post<{ status: string; data: Product; message: string }>(this.baseUrl, productData).pipe(
      catchError(this.handleError)
    );
  }

  // get all products for admin 

  /**
   * تحديث منتج (للإدارة فقط)
   */
  updateProduct(id: string, productData: Partial<Product>): Observable<{ status: string; data: Product; message: string }> {
    if (!id) {
      return throwError(() => new Error('Product ID is required'));
    }

    console.log('Updating product:', id, productData);

    return this.http.put<{ status: string; data: Product; message: string }>(`${this.baseUrl}/${id}`, productData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * حذف منتج (للإدارة فقط)
   */
  deleteProduct(id: string): Observable<{ status: string; message: string }> {
    if (!id) {
      return throwError(() => new Error('Product ID is required'));
    }

    console.log('Deleting product:', id);

    return this.http.delete<{ status: string; message: string }>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * معالجة الأخطاء
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('ProductService error:', error);

    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // خطأ من جهة العميل
      errorMessage = `خطأ: ${error.error.message}`;
    } else {
      // خطأ من جهة الخادم
      switch (error.status) {
        case 0:
          errorMessage = 'No internet connection';
          break;
        case 400:
          errorMessage = error.error?.message || 'Invalid data';
          break;
        case 401:
          errorMessage = 'You must log in first';
          break;
        case 403:
          errorMessage = 'Not authorized to access';
          break;
        case 404:
          errorMessage = 'Product not found';
          break;
        case 429:
          errorMessage = 'Too many requests, please try again later';
          break;
        case 500:
          errorMessage = 'Server error, please try again later';
          break;
        case 503:
          errorMessage = 'Service unavailable, please try again later';
          break;
        default:
          errorMessage = error.error?.message || `Error: ${error.status}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}