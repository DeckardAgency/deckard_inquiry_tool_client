/**
 * @deprecated Use ManualCartService directly instead
 * This service has been merged into ManualCartService for better code organization.
 * All functionality is now available in ManualCartService.
 */
import { Injectable } from '@angular/core';
import { ManualCartService } from './manual-cart.service';

@Injectable({
  providedIn: 'root',
  useExisting: ManualCartService
})
export class ManualQuickCartService extends ManualCartService {
}
