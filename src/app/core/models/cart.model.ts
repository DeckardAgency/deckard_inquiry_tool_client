import { Product } from './product.model';

export interface CartItem {
  product: Product;
  quantity: number;
  clientId?: string;
  clientName?: string;
  clientCode?: string;
}
