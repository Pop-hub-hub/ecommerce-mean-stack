import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/orders.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class AdminOrdersComponent implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  searchTerm: string = '';
  selectedStatus: string = 'all';
  loading = true;
  currentPage = 1;
  itemsPerPage = 10;

  orderStatuses = [
    'all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  ];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getAllOrders().subscribe({
      next: (response) => {
        if (response?.orders && Array.isArray(response.orders)) {
          this.orders = response.orders;
          this.filteredOrders = [...this.orders];
        } else {
          this.orders = [];
          this.filteredOrders = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading = false;
        this.orders = [];
        this.filteredOrders = [];
      }
    });
  }

  searchOrders(): void {
    if (!this.searchTerm.trim() && this.selectedStatus === 'all') {
      this.filteredOrders = [...this.orders];
      return;
    }

    this.filteredOrders = this.orders.filter(order => {
      const matchesSearch = !this.searchTerm.trim() || 
        order._id?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.user?.firstName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.user?.lastName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.selectedStatus === 'all' || 
        order.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  onStatusChange(): void {
    this.searchOrders();
  }

  updateOrderStatus(orderId: string, event: Event): void {
    const newStatus = (event.target as HTMLInputElement).value;
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (response) => {
        console.log('Order status updated successfully:', response);
        // Update local state
        const order = this.orders.find(o => o._id === orderId);
        if (order) {
          order.status = newStatus;
        }
        const filteredOrder = this.filteredOrders.find(o => o._id === orderId);
        if (filteredOrder) {
          filteredOrder.status = newStatus;
        }
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        // Revert the change in UI
        this.loadOrders();
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  get paginatedOrders(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredOrders.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getTotalRevenue(): number {
    return this.filteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  }

  getOrdersCount(): number {
    return this.filteredOrders.length;
  }
}
