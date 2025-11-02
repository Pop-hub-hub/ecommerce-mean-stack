import { Product } from './product'; 

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt?: string;
  userId?: string;
  _id?: string;
}

