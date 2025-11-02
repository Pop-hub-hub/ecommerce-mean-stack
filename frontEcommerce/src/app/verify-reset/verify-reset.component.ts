import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http'; // ✅ تم إضافة النوع

@Component({
  selector: 'app-verify-reset',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './verify-reset.component.html',
  styleUrls: ['./verify-reset.component.css']
})
export class VerifyResetComponent implements OnInit {
  email: string = '';
  resetCode: string = '';
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
        this.message = '❌ Email is missing. Please go back and try again.';
      }
    });
  }

  verifyCode(): void {
    if (!this.resetCode.trim()) {
      this.message = '⚠️ Please enter the reset code.';
      return;
    }

    this.loading = true;
    this.message = '';

    const payload = {
      email: this.email,
      resetCode: this.resetCode.trim()
    };

    this.authService.verifyResetCode(payload).subscribe({
      next: (res: { success: boolean; message?: string }) => {
        this.loading = false;
        if (res.success) {
          this.router.navigate(['/reset-password'], {
            queryParams: { email: this.email }
          });
        } else {
          this.message = res.message || '❌ Verification failed.';
        }
      },
      error: (err: HttpErrorResponse) => { 
        this.loading = false;
        if (err.status === 404) {
          this.message = '❌ Email or code not found.';
        } else if (err.status === 400) {
          this.message = '⚠️ Invalid code format.';
        } else {
          this.message = '🚨 Something went wrong. Please try again.';
        }
      }
    });
  }
}