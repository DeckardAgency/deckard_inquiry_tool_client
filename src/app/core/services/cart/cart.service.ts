import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { CartItem, Product } from '@core/models';
import { AuthService } from '@core/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  private shippingCost = 49.00; // Default shipping cost
  private readonly isBrowser: boolean;

  // Quick cart panel state
  private readonly openStateSubject = new BehaviorSubject<boolean>(false); // Open state
  public readonly isOpen$ = this.openStateSubject.asObservable();

  // Notification state
  private readonly notificationVisibleSubject = new BehaviorSubject<boolean>(false);
  public readonly notificationVisible$ = this.notificationVisibleSubject.asObservable();

  // Last added product message
  private lastAddedProductSubject = new BehaviorSubject<string>('Product added to cart.');
  public readonly lastAddedProduct$ = this.lastAddedProductSubject.asObservable();

  // Notification type (success or remove)
  private notificationTypeSubject = new BehaviorSubject<'success' | 'remove'>('success');
  public readonly notificationType$ = this.notificationTypeSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Load cart from localStorage only in the browser environment
    if (this.isBrowser) {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        this.cartItems.next(JSON.parse(savedCart));
      }
    }
  }

  private isAgentUser(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.roles?.includes('ROLE_USER_CLIENT_AGENT') || false;
  }

  // Cart panel UI methods

  public openCart(): void {
    this.openStateSubject.next(true);
    this.hideNotification(); // Hide notification when cart is opened
  }

  public closeCart(): void {
    this.openStateSubject.next(false);
  }

  public toggleCart(): void {
    this.openStateSubject.next(!this.openStateSubject.value);
    if (this.openStateSubject.value) {
      this.hideNotification();
    }
  }

  // Convenience aliases (merged from QuickCartService)
  public open(): void {
    this.openCart();
  }

  public close(): void {
    this.closeCart();
  }

  public toggle(): void {
    this.toggleCart();
  }

  // Notification methods
  public showNotification(message?: string, type: 'success' | 'remove' = 'success'): void {
    if (message) {
      this.lastAddedProductSubject.next(message);
    }
    this.notificationTypeSubject.next(type);
    this.notificationVisibleSubject.next(true);
  }

  public showRemoveNotification(message: string = 'Product removed from cart.'): void {
    this.showNotification(message, 'remove');
  }

  public hideNotification(): void {
    this.notificationVisibleSubject.next(false);
  }

  // Cart data methods
  getCartItems(): Observable<CartItem[]> {
    return this.cartItems.asObservable();
  }

  // Convenience getter (merged from QuickCartService)
  public get cartItems$(): Observable<CartItem[]> {
    return this.getCartItems();
  }

  getCartCount(): Observable<number> {
    return this.cartItems.pipe(
      map(items => items.reduce((total, item) => total + item.quantity, 0))
    );
  }

  getCartTotal(): Observable<number> {
    return this.cartItems.pipe(
      map(items => items.reduce((total, item) =>
        total + (this.getProductPrice(item.product) * item.quantity), 0))
    );
  }

  private getProductPrice(product: Product): number {
    return product.effectivePrice ?? product.clientPrice ?? product.price ?? 0;
  }

  // Convenience methods (merged from QuickCartService)
  public getTotalItems(): number {
    let count = 0;
    this.getCartCount().subscribe(total => {
      count = total;
    }).unsubscribe();
    return count;
  }

  public getTotalPrice(): number {
    let total = 0;
    this.getCartTotal().subscribe(price => {
      total = price;
    }).unsubscribe();
    return total;
  }

  getShippingCost(): number {
    return this.shippingCost;
  }

  getFinalTotal(): Observable<number> {
    return this.getCartTotal().pipe(
      map(total => total + this.shippingCost)
    );
  }

  // Cart manipulation methods
  addToCart(product: Product, quantity: number = 1, client?: { id: string; name: string; code: string }): void {
    // Agents MUST select a client before adding to cart
    if (this.isAgentUser() && !client) {
      this.showNotification('Please select a client before adding products to cart.', 'remove');
      return;
    }

    const currentItems = this.cartItems.value;
    const clientId = client?.id || '';

    // Match by product ID AND client ID (same product for different clients = separate items)
    const existingItem = currentItems.find(
      item => item.product.id === product.id && (item.clientId || '') === clientId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      // Update client info in case it was missing
      if (client) {
        existingItem.clientId = client.id;
        existingItem.clientName = client.name;
        existingItem.clientCode = client.code;
      }
      this.cartItems.next([...currentItems]);
    } else {
      const newItem: CartItem = {
        product,
        quantity,
        ...(client ? { clientId: client.id, clientName: client.name, clientCode: client.code } : {})
      };
      this.cartItems.next([...currentItems, newItem]);
    }

    this.saveCartToStorage();

    // Show notification instead of opening the cart
    this.showNotification('Product added to cart.');
  }

  updateQuantity(productId: string, quantity: number): void {
    const currentItems = this.cartItems.value;
    const itemIndex = currentItems.findIndex(item => item.product.id === productId);

    if (itemIndex > -1) {
      if (quantity <= 0) {
        currentItems.splice(itemIndex, 1);
      } else {
        currentItems[itemIndex].quantity = quantity;
      }
      this.cartItems.next([...currentItems]);
      this.saveCartToStorage();
    }
  }

  // Convenience alias (merged from QuickCartService)
  public updateItemQuantity(productId: string, quantity: number): void {
    this.updateQuantity(productId, quantity);
  }

  removeFromCart(productId: string): void {
    const currentItems = this.cartItems.value;
    // Find the product name before removal
    const product = currentItems.find(item => item.product.id === productId);
    const productName = product?.product.name || 'Product';

    const updatedItems = currentItems.filter(item => item.product.id !== productId);
    this.cartItems.next(updatedItems);
    this.saveCartToStorage();

    // Show removal notification
    this.showRemoveNotification(`${productName} removed from cart.`);
  }

  clearCart(): void {
    this.cartItems.next([]);
    if (this.isBrowser) {
      localStorage.removeItem('cart');
    }
  }

  getCartItemsByClient(): Map<string, { clientName: string; clientCode: string; items: CartItem[] }> {
    const currentItems = this.cartItems.value;
    const grouped = new Map<string, { clientName: string; clientCode: string; items: CartItem[] }>();

    for (const item of currentItems) {
      const key = item.clientId || '_self';
      if (!grouped.has(key)) {
        grouped.set(key, {
          clientName: item.clientName || '',
          clientCode: item.clientCode || '',
          items: []
        });
      }
      grouped.get(key)!.items.push(item);
    }

    return grouped;
  }

  hasMultipleClients(): boolean {
    return this.getCartItemsByClient().size > 1;
  }

  private saveCartToStorage(): void {
    if (this.isBrowser) {
      localStorage.setItem('cart', JSON.stringify(this.cartItems.value));
    }
  }
}
