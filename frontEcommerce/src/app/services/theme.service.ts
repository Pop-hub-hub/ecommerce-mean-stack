import { Injectable, PLATFORM_ID, Inject, Optional } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  isDarkMode$ = this.isDarkModeSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.initializeTheme();
    }
  }

  initializeTheme(): void {
    if (!this.isBrowser) return;
    
    // Check for saved theme preference
    let isDark = false;
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        isDark = savedTheme === 'dark';
      } else {
        // If no saved preference, use system preference
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch (e) {
      console.error('Error accessing theme preferences:', e);
      // Fallback to light theme if there's an error
      isDark = false;
    }
    
    this.setTheme(isDark);
  }

  toggleTheme(): void {
    this.setTheme(!this.isDarkModeSubject.value);
  }

  private setTheme(isDark: boolean): void {
    if (!this.isBrowser) return;
    
    const theme = isDark ? 'dark' : 'light';
    
    try {
      // Update the DOM
      if (document?.documentElement) {
        // Keep legacy attribute for any custom selectors
        document.documentElement.setAttribute('data-theme', theme);
        // Use Bootstrap 5.3 theming attribute
        document.documentElement.setAttribute('data-bs-theme', theme);
      }
      
      // Update local storage
      localStorage.setItem('theme', theme);
      
      // Update the subject
      this.isDarkModeSubject.next(isDark);
    } catch (e) {
      console.error('Error setting theme:', e);
    }
  }

  // Initialize the app with the correct theme
  static initializeApp(themeService: ThemeService) {
    return () => {
      if (themeService.isBrowser) {
        return themeService.initializeTheme();
      }
      return Promise.resolve();
    };
  }
}
