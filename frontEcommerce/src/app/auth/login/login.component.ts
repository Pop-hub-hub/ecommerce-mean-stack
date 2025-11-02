import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted: boolean = false;
  message: string = '';
  loading: boolean = false;
  showWelcome: boolean = false;
  userName: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });

    // Allow visiting the login page without redirecting to Home
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.message = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    const payload = {
      email: this.f['email'].value,
      password: this.f['password'].value
    };

    console.log('Login payload:', payload);

    this.authService.login(payload).subscribe({
      next: (response) => {
        console.log('Login response received:', response);
        this.loading = false;

        if (response.status === 'success' && response.user?.token) {
          this.userName = response.user.firstName || 'User';
          this.showWelcome = true;
          this.message = 'تم تسجيل الدخول بنجاح!';

          setTimeout(() => {
            this.showWelcome = false;
            this.router.navigate(['/']);
          }, 2000);
        } else {
          this.message = response.message || '❌ فشل في تسجيل الدخول.';
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.loading = false;
        this.message = err.error?.message || '🚨 حدث خطأ ما. حاول مرة أخرى.';
      }
    });
  }

  navigateToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}