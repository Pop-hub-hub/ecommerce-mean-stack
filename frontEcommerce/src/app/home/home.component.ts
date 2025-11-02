import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductServiceService } from '../services/product-service.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent {
  sliderProducts: any[] = [];

  reviews = [
    { name: 'Ahmed Y.', message: 'Amazing experience! Highly recommended.', image: 'person 1.webp', rating: 5 },
    { name: 'Abdalrhman M.', message: 'Great service and beautiful UI.', image: 'person 2.webp', rating: 4 },
    { name: 'Omar K.', message: 'Fast delivery and excellent support.', image: 'person 3.webp', rating: 5 },
    { name: 'John D.', message: 'I love shopping here! The quality is unmatched.', image: 'person 4.webp', rating: 5 },
    { name: 'mosa M.', message: 'The best online shopping experience!', image: 'person 5.webp', rating: 5 },
    { name: 'Mohamed A.', message: 'Excellent quality and fast shipping!', image: 'person 6.avif', rating: 5 },
    { name: 'Ali B.', message: 'Fast and reliable service!', image: 'person 7.jpg', rating: 4 }
  ];

  constructor(private productService: ProductServiceService) {}

  ngOnInit(): void {
    this.productService.getHomeSliderProducts().subscribe({
      next: (res) => {
        this.sliderProducts = res.data;
      },
      error: (err) => console.error('Error loading slider products:', err)
    });
  }

  getDiscountedPrice(price: number, discount?: number): number {
    if (!discount) return price;
    return price - (price * discount / 100);
  }

  getRating(rating: number): number[] {
    return Array(rating).fill(0);
  }

  getEmptyRating(rating: number): number[] {
    return Array(5 - rating).fill(0);
  }
}