import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  message: string = '';
  visible: boolean = false;
  type: ToastType = 'info';
  private timeoutId: any;

  show(msg: string, type: ToastType = 'info', duration: number = 3000): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.message = msg;
    this.type = type;
    this.visible = true;

    this.timeoutId = setTimeout(() => {
      this.visible = false;
      this.message = '';
      this.timeoutId = null;
    }, duration);
  }

  hide(): void {
    this.visible = false;
    this.message = '';
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  
}
export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
  
}

