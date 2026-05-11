import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, map, tap, catchError, take } from 'rxjs';
import { ManualCartItem } from '@core/models';
import { InquiryRequest, InquiryResponse, InquiryService } from '@services/http/inquiry.service';
import { InquiryMachine } from '@core/models/api/inquiry-api.model';
import { AuthService } from '@core/auth/auth.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class ManualCartService {
  private cartItems = new BehaviorSubject<ManualCartItem[]>([]);
  private readonly isBrowser: boolean;
  private logger!: ScopedLogger;

  // Quick cart panel state (merged from ManualQuickCartService)
  private openStateSubject = new BehaviorSubject<boolean>(false);
  public readonly isOpen$ = this.openStateSubject.asObservable();

  // Notification state (merged from ManualQuickCartService)
  private notificationVisibleSubject = new BehaviorSubject<boolean>(false);
  public readonly notificationVisible$ = this.notificationVisibleSubject.asObservable();

  // Notification message
  private notificationMessageSubject = new BehaviorSubject<string>('Part removed from inquiry.');
  public readonly notificationMessage$ = this.notificationMessageSubject.asObservable();

  // Notification type
  private notificationTypeSubject = new BehaviorSubject<'success' | 'remove' | 'error'>('remove');
  public readonly notificationType$ = this.notificationTypeSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public readonly loading$ = this.loadingSubject.asObservable();

  // Saved inquiry ID (for tracking)
  private savedInquiryIdSubject = new BehaviorSubject<string | null>(null);
  public readonly savedInquiryId$ = this.savedInquiryIdSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private inquiryService: InquiryService,
    private authService: AuthService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('ManualCartService');
    this.isBrowser = isPlatformBrowser(platformId);

    // Load cart from localStorage only in the browser environment
    if (this.isBrowser) {
      const savedCart = localStorage.getItem('manualCart');
      if (savedCart) {
        this.cartItems.next(JSON.parse(savedCart));
      }
    }
  }

  // UI State methods (merged from ManualQuickCartService)

  /**
   * Open the cart panel
   */
  public open(): void {
    this.openStateSubject.next(true);
    this.hideNotification();
  }

  /**
   * Close the cart panel
   */
  public close(): void {
    this.openStateSubject.next(false);
  }

  /**
   * Toggle cart panel visibility
   */
  public toggle(): void {
    this.openStateSubject.next(!this.openStateSubject.value);
    if (this.openStateSubject.value) {
      this.hideNotification();
    }
  }

  /**
   * Show notification with message and type
   */
  public showNotification(message: string, type: 'success' | 'remove' | 'error' = 'remove'): void {
    this.notificationMessageSubject.next(message);
    this.notificationTypeSubject.next(type);
    this.notificationVisibleSubject.next(true);
  }

  /**
   * Hide notification
   */
  public hideNotification(): void {
    this.notificationVisibleSubject.next(false);
  }

  // Cart data methods

  /**
   * Get cart items as observable
   */
  getCartItems(): Observable<ManualCartItem[]> {
    return this.cartItems.asObservable();
  }

  /**
   * Convenience getter for cart items
   */
  public get cartItems$(): Observable<ManualCartItem[]> {
    return this.getCartItems();
  }

  /**
   * Get cart count
   */
  getCartCount(): Observable<number> {
    return this.cartItems.pipe(
      map(items => items.length)
    );
  }

  // Cart manipulation methods

  /**
   * Add items to cart and open panel
   */
  addToCart(items: ManualCartItem[]): void {
    const currentItems = this.cartItems.value;
    this.cartItems.next([...currentItems, ...items]);
    this.saveCartToStorage();
    this.open();
  }

  /**
   * Add items to cart silently (without opening panel)
   * Used for auto-save when switching machines
   */
  public addToCartSilently(items: ManualCartItem[]): void {
    const currentItems = this.cartItems.value;
    this.cartItems.next([...currentItems, ...items]);
    this.saveCartToStorage();
  }

  /**
   * Remove item from cart with notification
   */
  removeFromCart(index: number): void {
    let partName = 'Part';

    this.cartItems.pipe(
      take(1),
      tap(items => {
        if (items.length > index) {
          partName = items[index].partData?.partName || `Part ${index + 1}`;
        }
      })
    ).subscribe(() => {
      // Remove the item
      const currentItems = [...this.cartItems.value];
      currentItems.splice(index, 1);
      this.cartItems.next(currentItems);
      this.saveCartToStorage();

      // Show notification
      this.showNotification(`${partName} removed from inquiry.`, 'remove');
    });
  }

  /**
   * Clear all items from cart
   */
  clearCart(): void {
    this.cartItems.next([]);
    if (this.isBrowser) {
      localStorage.removeItem('manualCart');
    }
  }

  /**
   * Save cart to localStorage
   */
  private saveCartToStorage(): void {
    if (this.isBrowser) {
      localStorage.setItem('manualCart', JSON.stringify(this.cartItems.value));
    }
  }

  // Business logic methods (merged from ManualQuickCartService)

  /**
   * Save inquiry as draft
   * Converts ManualCartItem[] to InquiryRequest format and calls the backend
   */
  public saveDraft(
    cartItems: ManualCartItem[],
    referenceNumber?: string,
    onBehalfOfClient?: string
  ): Observable<InquiryResponse> {
    this.loadingSubject.next(true);

    // Get current user
    const user = this.authService.getCurrentUser();
    if (!user || !user.id || user.id.trim() === '') {
      this.loadingSubject.next(false);
      this.showNotification('User information is incomplete. Please log out and log in again.', 'error');
      throw new Error('User ID not available');
    }

    // Transform cart items to inquiry format
    const inquiryRequest = this.transformCartItemsToInquiryRequest(
      cartItems,
      'draft',
      user,
      referenceNumber,
      onBehalfOfClient
    );

    return this.inquiryService.saveDraft(inquiryRequest).pipe(
      tap(response => {
        this.loadingSubject.next(false);
        this.savedInquiryIdSubject.next(response.id);
        this.showNotification(`Inquiry draft saved successfully! Reference: ${response.inquiryNumber}`, 'success');
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        const errorMessage = error?.error?.message || 'Failed to save inquiry draft. Please try again.';
        this.showNotification(errorMessage, 'error');
        throw error;
      })
    );
  }

  /**
   * Submit inquiry (converts draft to submitted)
   * Creates and submits the inquiry in one operation
   */
  public submitInquiry(
    cartItems: ManualCartItem[],
    referenceNumber?: string,
    onBehalfOfClient?: string
  ): Observable<InquiryResponse> {
    this.loadingSubject.next(true);

    // Get current user
    const user = this.authService.getCurrentUser();
    if (!user || !user.id || user.id.trim() === '') {
      this.loadingSubject.next(false);
      this.showNotification('User information is incomplete. Please log out and log in again.', 'error');
      throw new Error('User ID not available');
    }

    // Transform cart items to inquiry format (submitted status)
    const inquiryRequest = this.transformCartItemsToInquiryRequest(
      cartItems,
      'submitted',
      user,
      referenceNumber,
      onBehalfOfClient
    );

    // DEBUG: Log the payload being sent
    this.logger.debug('Inquiry request payload', inquiryRequest);

    return this.inquiryService.createInquiry(inquiryRequest).pipe(
      tap(response => {
        this.loadingSubject.next(false);
        this.savedInquiryIdSubject.next(response.id);
        this.showNotification(
          `Inquiry submitted successfully! Inquiry #${response.inquiryNumber}`,
          'success'
        );
        // Clear the cart after successful submission
        this.clearCart();
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        const errorMessage = error?.error?.message || 'Failed to submit inquiry. Please try again.';
        this.showNotification(errorMessage, 'error');
        throw error;
      })
    );
  }

  /**
   * Check if a machine ID is valid (UUID from database)
   * Returns false for custom machine IDs (including numeric ones like "999666")
   *
   * Machine IDs from the database are always UUIDs.
   * Any other format (numeric, alphanumeric, etc.) is a custom machine ID entered by the user.
   */
  private isValidMachineId(machineId: string): boolean {
    // Check if it's a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(machineId);
  }

  /**
   * Transform ManualCartItem[] to InquiryRequest format
   */
  private transformCartItemsToInquiryRequest(
    cartItems: ManualCartItem[],
    status: 'draft' | 'submitted',
    user: { '@id'?: string; id: string },
    referenceNumber?: string,
    onBehalfOfClient?: string
  ): InquiryRequest {
    // Validate machine IDs
    const invalidItems = cartItems.filter(item => !item.machineId || item.machineId.trim() === '');
    if (invalidItems.length > 0) {
      throw new Error('Some items have invalid machine IDs. Please ensure all parts have a valid machine selected.');
    }

    // Group items by machine
    const machinesMap = new Map<string, ManualCartItem[]>();

    cartItems.forEach(item => {
      const machineId = item.machineId;
      if (!machinesMap.has(machineId)) {
        machinesMap.set(machineId, []);
      }
      machinesMap.get(machineId)!.push(item);
    });

    // Transform to InquiryMachine format
    // Collect all mediaItems at machine level (for Excel files from spreadsheet)
    const machines = Array.from(machinesMap.entries()).map(([machineId, items]) => {
      // Collect all unique mediaItems from all items for this machine
      const allMediaItemIds = new Set<string>();
      items.forEach(item => {
        item.partData.mediaItems?.forEach(mediaItem => {
          allMediaItemIds.add(mediaItem.id);
        });
      });

      // Check if this is a custom machine ID (for "Other/Older" machines)
      // UUIDs and numeric IDs are valid machine references; anything else is custom
      const isCustomMachine = !this.isValidMachineId(machineId);

      // For custom machines (Other/Older), OMIT machine field and send customMachineId instead
      // For regular machines, send machine IRI and omit customMachineId
      // Only include per-machine onBehalfOfClient if the caller explicitly passed onBehalfOfClient (agent flow)
      const machineClientId = onBehalfOfClient ? items[0]?.clientId : undefined;

      const machineData: InquiryMachine = {
        machine: isCustomMachine ? null : '/api/v1/machines/' + machineId,
        customMachineId: isCustomMachine ? machineId : null,
        notes: items.map(item => item.partData.additionalNotes).filter(n => n).join('\n'),
        mediaItems: Array.from(allMediaItemIds).map(id => `/api/v1/media_items/${id}`),
        products: items.map(item => ({
          partName: item.partData.partName,
          partNumber: item.partData.partNumber,
          shortDescription: item.partData.shortDescription,
          additionalNotes: item.partData.additionalNotes
          // No mediaItems at product level for template flow
        })),
        ...(machineClientId ? { onBehalfOfClient: `/api/v1/clients/${machineClientId}` } : {})
      };

      return machineData;
    });

    // Only set inquiry-level onBehalfOfClient when explicitly provided (agent flow)
    const inquiryLevelClient = onBehalfOfClient || undefined;

    return {
      status,
      notes: referenceNumber ? `Reference: ${referenceNumber}` : '',
      contactEmail: '',
      contactPhone: '',
      isDraft: status === 'draft',
      user: `/api/v1/users/${user.id}`,
      machines,
      ...(inquiryLevelClient ? { onBehalfOfClient: inquiryLevelClient } : {})
    };
  }
}
