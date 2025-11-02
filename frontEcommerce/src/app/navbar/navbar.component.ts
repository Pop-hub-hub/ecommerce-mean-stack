import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartServiceService } from '../services/cart-service.service';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true
})
export class NavbarComponent implements OnInit {
  cartCount = 0;
  isDarkMode = false;
  currentUser: any = null;

  constructor(
    private cartService: CartServiceService,
    private themeService: ThemeService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
    
    // Get cart count
    this.cartService.counter.subscribe(count => this.cartCount = count);

    // Get current user for admin access
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  closeDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Close the dropdown
    const dropdown = document.querySelector('.dropdown-menu.show');
    if (dropdown) {
      dropdown.classList.remove('show');
      const parent = dropdown.closest('.dropdown');
      if (parent) {
        const button = parent.querySelector('.dropdown-toggle');
        if (button) {
          button.setAttribute('aria-expanded', 'false');
        }
      }
    }
  }

  navigateTo(route: string, event: Event): void {
    this.closeDropdown(event);
    this.router.navigate([route]);
  }

  logout(event: Event): void {
    event.preventDefault();
    this.closeDropdown(event);
    this.authService.logout();
  }

  // removed admin link
}
