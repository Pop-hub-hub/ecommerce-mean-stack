import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  email: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  message: string = '';
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.message = '❌ Email is missing. Please try again.';
      }
    });
  }

  resetPassword(): void {
    if (!this.newPassword || !this.confirmPassword) {
      this.message = '⚠️ Please fill in both fields.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.message = '❌ Passwords do not match.';
      return;
    }

    this.loading = true;
    this.message = '';

    const payload = {
      email: this.email,
      newPassword: this.newPassword
    };

    this.authService.resetPassword(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.message = '✅ Password updated successfully!';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.message = res.message || '❌ Failed to update password.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || '🚨 Something went wrong.';
      }
    });
  }
}