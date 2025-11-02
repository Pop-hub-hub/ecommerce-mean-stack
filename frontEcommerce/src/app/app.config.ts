import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ReactiveFormsModule } from '@angular/forms';
import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ThemeService } from './services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(
      withFetch(),
      // فعّل اعتراضات DI (HTTP_INTERCEPTORS) لحقن التوكن تلقائياً
      withInterceptorsFromDi()
    ),
    // Provide ThemeService
    ThemeService,
    // Initialize theme before app starts
    {
      provide: APP_INITIALIZER,
      useFactory: (themeService: ThemeService, platformId: Object) => {
        return () => {
          if (isPlatformBrowser(platformId)) {
            return themeService.initializeTheme();
          }
          return Promise.resolve();
        };
      },
      deps: [ThemeService, PLATFORM_ID],
      multi: true
    },
    // تفعيل الـ animations
    provideAnimationsAsync(),
    
    // Provide AuthInterceptor via DI (works with both withInterceptorsFromDi and classic HttpClient)
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    importProvidersFrom(ReactiveFormsModule)
  ]
};