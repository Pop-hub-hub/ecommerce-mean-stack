import { Component } from '@angular/core';
import { NavbarComponent } from './navbar/navbar.component';

import { RouterOutlet } from '@angular/router';
import { FooterComponent } from "./footer/footer.component";
import { ScrollComponent } from "./scroll/scroll.component";
import { ToastComponent } from './toast/toast.component';


@Component({
  selector: 'app-root',
  imports: [NavbarComponent, RouterOutlet, FooterComponent, ScrollComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  title = 'product-app'; 
}