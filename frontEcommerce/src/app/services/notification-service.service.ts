import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  showSuccess(message: string): void {
    this.snackBar.open(message, 'تم', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'left',
      verticalPosition: 'bottom',
      direction: 'rtl'
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'إغلاق', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'left',
      verticalPosition: 'bottom',
      direction: 'rtl'
    });
  }
}