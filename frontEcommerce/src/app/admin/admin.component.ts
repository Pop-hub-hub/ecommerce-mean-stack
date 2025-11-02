import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  sidebarCollapsed = false;
  isDarkMode = false;
  private themeSubscription: Subscription;

  adminMenuItems = [
    {
      title: 'Dashboard',
      icon: '📊',
      route: '/admin/dashboard',
      description: 'Overview of system statistics'
    },
    {
      title: 'Users Management',
      icon: '👥',
      route: '/admin/users',
      description: 'View and manage all users'
    },
    {
      title: 'Products Management',
      icon: '📦',
      route: '/admin/products',
      description: 'Add, edit, and delete products'
    },
    {
      title: 'Orders Management',
      icon: '📋',
      route: '/admin/orders',
      description: 'View and update order statuses'
    }
  ];

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      document.documentElement.classList.toggle('dark-theme', isDark);
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // Initialize theme
    this.themeService.initializeTheme();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }
}
