import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductServiceService } from '../../services/product-service.service';
import { OrderService } from '../../services/orders.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats = {
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  };

  recentOrders: any[] = [];
  topProducts: any[] = [];
  loading = true;

  constructor(
    private productService: ProductServiceService,
    private orderService: OrderService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Load statistics
    Promise.all([
      this.loadUsersCount(),
      this.loadProductsCount(),
      this.loadOrdersData()
    ]).finally(() => {
      this.loading = false;
    });
  }

  private async loadUsersCount(): Promise<void> {
    try {
      const response = await this.authService.getAllUsers().toPromise();
      if (response?.users) {
        this.stats.totalUsers = response.users.length;
      }
    } catch (error) {
      console.error('Error loading users count:', error);
      this.stats.totalUsers = 0;
    }
  }

  private async loadProductsCount(): Promise<void> {
    try {
      const response = await this.productService.getProductsList(1, 'all', '').toPromise();
      if (response?.pagination?.totalItems) {
        this.stats.totalProducts = response.pagination.totalItems;
      }
    } catch (error) {
      console.error('Error loading products count:', error);
    }
  }

  private async loadOrdersData(): Promise<void> {
    try {
      const response = await this.orderService.getAllOrders().toPromise();
      if (response?.orders && Array.isArray(response.orders)) {
        this.stats.totalOrders = response.orders.length;
        this.stats.totalRevenue = response.orders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);
        this.recentOrders = response.orders.slice(0, 5); // Last 5 orders
      }
    } catch (error) {
      console.error('Error loading orders data:', error);
    }
  }

  refreshData(): void {
    this.loadDashboardData();
  }
}
