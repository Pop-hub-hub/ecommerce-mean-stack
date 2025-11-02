import { Routes } from '@angular/router';
import { ProductsListComponent } from './products-list/products-list.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

import { CartComponent } from './cart/cart.component';
import { NotFoundPageComponent } from './not-found-page/not-found-page.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { BuyComponent } from './buy/buy/buy.component';
import { OrdersComponent } from './orders/orders.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { VerifyResetComponent } from './verify-reset/verify-reset.component';
import { HomeComponent } from './home/home.component';
import { AdminComponent } from './admin/admin.component';
import { AdminDashboardComponent } from './admin/dashboard/dashboard.component';
import { AdminUsersComponent } from './admin/users/users.component';
import { AdminProductsComponent } from './admin/products/products.component';
import { AdminOrdersComponent } from './admin/orders/orders.component';
import { ProductFormComponent } from './admin/products/product-form/product-form.component';

export const routes: Routes = [
    // {path: '', component: ProductsListComponent, title: ''},
     { path: '', component: HomeComponent },
     { path: 'home', component: HomeComponent },
    {path: 'products', component: ProductsListComponent,title: 'Products-List'},
    {path: 'product/:id', component:ProductDetailsComponent , title: 'Product-Details'},
    {path: 'login', component: LoginComponent, title: 'Login'},
    {path: 'register', component:RegisterComponent, title: 'Register'},
    {path: 'forgot-password', component:ForgotPasswordComponent, title: 'forgot-pass'},
    {path: 'reset-password', component: ResetPasswordComponent , title: 'reset-pass'},
    {path: 'verify-reset', component: VerifyResetComponent , title: 'verify-pass'},
    {path: 'cart', component: CartComponent, title: 'Cart'},
    {path: 'buy_now', component: BuyComponent, title: 'Buy'},
     { path: 'orders', component: OrdersComponent, title: 'Orders' },
     
     // Admin Routes
     { 
       path: 'admin', 
       component: AdminComponent,
       children: [
         { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
         { path: 'dashboard', component: AdminDashboardComponent, title: 'Admin Dashboard' },
         { path: 'users', component: AdminUsersComponent, title: 'Users Management' },
         { path: 'products', component: AdminProductsComponent, title: 'Products Management' },
         { path: 'products/new', component: ProductFormComponent, title: 'Add New Product' },
         { path: 'products/edit/:id', component: ProductFormComponent, title: 'Edit Product' },
         { path: 'orders', component: AdminOrdersComponent, title: 'Orders Management' }
       ]
     },
     
    {path: '**', component:NotFoundPageComponent, title: 'Not-Found-Page'}
];