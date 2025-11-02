import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';
  message: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  forgotPassword(): void {
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.message = 'Code sent to your email.';
        this.router.navigate(['/verify-reset'], {
          queryParams: { email: this.email }
        });
      },
      error: (err: any) => {
        console.error('Forgot password error:', err);
        this.message = 'Failed to send code.';
      }
    });
  }
}