/**
 * @deprecated Use CartService directly instead
 * This service has been merged into CartService for better code organization.
 * All functionality is now available in CartService.
 */
import { Injectable } from '@angular/core';
import { CartService } from './cart.service';

@Injectable({
  providedIn: 'root',
  useExisting: CartService
})
export class QuickCartService extends CartService {
}
