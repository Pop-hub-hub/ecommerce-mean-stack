import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  loading = true;
  currentPage = 1;
  itemsPerPage = 10;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.authService.getAllUsers().subscribe({
      next: (response) => {
        if (response?.users) {
          this.users = response.users.map((user: any) => ({
            ...user,
            createdAt: new Date(user.createdAt || Date.now())
          }));
        } else {
          this.users = [];
        }
        this.filteredUsers = [...this.users];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
        // Fallback to empty array
        this.users = [];
        this.filteredUsers = [];
      }
    });
  }

  searchUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  }

  toggleUserStatus(userId: string): void {
    const user = this.users.find(u => u._id === userId);
    if (user) {
      const newStatus = !user.isActive;
      this.authService.updateUser(userId, { isActive: newStatus }).subscribe({
        next: (response) => {
          console.log('User status updated successfully:', response);
          user.isActive = newStatus;
        },
        error: (error) => {
          console.error('Error updating user status:', error);
          // Revert the change in UI
          this.loadUsers();
        }
      });
    }
  }

  changeUserRole(userId: string, newRole: string): void {
    const user = this.users.find(u => u._id === userId);
    if (user) {
      this.authService.updateUser(userId, { role: newRole }).subscribe({
        next: (response) => {
          console.log('User role updated successfully:', response);
          user.role = newRole;
        },
        error: (error) => {
          console.error('Error updating user role:', error);
          // Revert the change in UI
          this.loadUsers();
        }
      });
    }
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.authService.deleteUser(userId).subscribe({
        next: (response) => {
          console.log('User deleted successfully:', response);
          this.users = this.users.filter(u => u._id !== userId);
          this.filteredUsers = this.filteredUsers.filter(u => u._id !== userId);
        },
        error: (error) => {
          console.error('Error deleting user:', error);
        }
      });
    }
  }

  get paginatedUsers(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  deleteAllUsers(): void {
    if (confirm('Are you sure you want to delete all users? This action cannot be undone.')) {
      this.authService.deleteAllUsers().subscribe({
        next: (response) => {
          console.log('All users deleted successfully:', response);
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting all users:', error);
        }
      });
    }
  }
}
