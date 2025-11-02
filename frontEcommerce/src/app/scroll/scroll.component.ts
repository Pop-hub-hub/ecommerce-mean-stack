import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll',
  standalone: true,
  templateUrl: './scroll.component.html',
  imports: [CommonModule],
  styleUrls: ['./scroll.component.css']
})
export class ScrollComponent {
  show = false;

  @HostListener('window:scroll')
  onScroll() {
    this.show = typeof window !== 'undefined' && window.pageYOffset > 300;
  }

  scrollToTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}