import { Component } from '@angular/core';
import { ToastService, ToastType } from '../services/toast.service';
import { CommonModule } from '@angular/common';
import {
  trigger,
  transition,
  style,
  animate
} from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  get visible(): boolean {
    return this.toastService.visible;
  }

  get message(): string {
    return this.toastService.message;
  }

  get type(): ToastType {
    return this.toastService.type;
  }
}