import { Component, OnInit, OnDestroy, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '@env/environment';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { CartService } from '@services/cart/cart.service';
import { QuickCartService } from '@services/cart/quick-cart.service';
import { Breadcrumb, CartItem } from '@core/models';
import { OrderResponse, OrderService } from '@services/http/order.service';
import { IconComponent } from '@shared/components/icon/icon.component';
import { AuthService } from '@core/auth/auth.service';
import { CartSwitcherComponent } from '@shared/components/cart-switcher/cart-switcher.component';
import { User } from '@core/models/auth.model';
import { Product } from '@core/models/product.model';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
    selector: 'app-cart',
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, BreadcrumbsComponent, IconComponent, CartSwitcherComponent],
    templateUrl: 'cart.component.html',
    styleUrls: ['cart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  isAgent = false;
  clientGroups: { clientId: string; clientName: string; clientCode: string; items: CartItem[]; collapsed: boolean }[] = [];
  cartSubtotal: number = 0;
  discountAmount: number = 0;
  shippingCost: number = 0;
  totalAmount: number = 0;
  isSubmitting: boolean = false;
  orderSuccess: boolean = false;
  orderError: string | null = null;
  orderResponse: OrderResponse | null = null;
  referenceNumber: string = '';

  private destroyRef = inject(DestroyRef);
  private currentUser: User | null = null;
  private logger!: ScopedLogger;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Cart' }
  ];

  constructor(
    private cartService: CartService,
    public quickCartService: QuickCartService,
    private orderService: OrderService,
    private router: Router,
    private authService: AuthService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('CartComponent');
  }

  ngOnInit(): void {
    // Check if user is an agent
    this.currentUser = this.authService.getCurrentUser();
    this.isAgent = this.currentUser?.roles?.includes('ROLE_USER_CLIENT_AGENT') || false;

    // Subscribe to cart changes
    this.cartService.getCartItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(items => {
        this.cartItems = items;
        this.buildClientGroups(items);
        this.calculateTotals();
      });

    // Get shipping cost
    this.shippingCost = this.cartService.getShippingCost();

    // If the user is not authenticated, redirect to login
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/cart' }
      });
    }
  }

  ngOnDestroy(): void {
    // Subscriptions are automatically cleaned up by takeUntilDestroyed
  }

  /**
   * Get the price to use for calculations (effectivePrice if available, otherwise clientPrice)
   */
  getEffectivePrice(product: Product): number {
    return product.effectivePrice ?? product.clientPrice ?? product.price ?? 0;
  }

  /**
   * Calculate all cart totals using effective prices
   */
  calculateTotals(): void {
    // Calculate original subtotal using effective prices
    this.cartSubtotal = this.cartItems.reduce(
      (total, item) => total + (this.getEffectivePrice(item.product) * item.quantity),
      0
    );

    // Calculate total with discount applied
    const discountedTotal = this.cartItems.reduce(
      (total, item) => total + (this.getDiscountedPrice(this.getEffectivePrice(item.product)) * item.quantity),
      0
    );

    // Calculate discount amount
    this.discountAmount = this.cartSubtotal - discountedTotal;

    // Calculate final total with shipping
    this.totalAmount = discountedTotal + this.shippingCost;
  }

  /**
   * Get the discounted price (20% off)
   */
  getDiscountedPrice(price: number): number {
    return price;
  }

  /**
   * Calculate the total for a specific item using effective price
   */
  getItemTotal(item: CartItem): number {
    return this.getDiscountedPrice(this.getEffectivePrice(item.product)) * item.quantity;
  }

  /**
   * Update quantity for a cart item
   */
  updateQuantity(productId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const quantity = parseInt(input.value, 10);

    if (!isNaN(quantity) && quantity > 0) {
      this.cartService.updateQuantity(productId, quantity);
    }
  }

  /**
   * Increment quantity for an item
   */
  incrementQuantity(productId: string): void {
    const item = this.cartItems.find(item => item.product.id === productId);
    if (item) {
      this.cartService.updateQuantity(productId, item.quantity + 1);
    }
  }

  /**
   * Decrement quantity for an item
   */
  decrementQuantity(productId: string): void {
    const item = this.cartItems.find(item => item.product.id === productId);
    if (item && item.quantity > 1) {
      this.cartService.updateQuantity(productId, item.quantity - 1);
    }
  }

  /**
   * Remove an item from the cart
   */
  removeItem(productId: string): void {
    this.cartService.removeFromCart(productId);
  }

  /**
   * Clear the entire cart
   */
  clearCart(): void {
    this.cartService.clearCart();
  }

  /**
   * Build client groups from cart items for agent users
   */
  private buildClientGroups(items: CartItem[]): void {
    if (!this.isAgent) {
      this.clientGroups = [];
      return;
    }
    const groupMap = new Map<string, typeof this.clientGroups[0]>();
    for (const item of items) {
      const key = item.clientId || '_self';
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          clientId: item.clientId || '',
          clientName: item.clientName || 'My Company',
          clientCode: item.clientCode || '',
          items: [],
          collapsed: false
        });
      }
      groupMap.get(key)!.items.push(item);
    }
    // Preserve collapsed state from previous groups
    const oldGroups = new Map(this.clientGroups.map(g => [g.clientId, g.collapsed]));
    this.clientGroups = Array.from(groupMap.values()).map(g => ({
      ...g,
      collapsed: oldGroups.get(g.clientId) ?? false
    }));
  }

  /**
   * Toggle collapse state of a client group
   */
  toggleClientGroup(group: typeof this.clientGroups[0]): void {
    group.collapsed = !group.collapsed;
  }

  /**
   * Proceed to check out by sending order to API
   */
  checkout(): void {
    if (this.isSubmitting || this.cartItems.length === 0) {
      return;
    }

    // Check if user is authenticated
    if (!this.currentUser || !this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/cart' }
      });
      return;
    }

    this.logger.debug('Proceeding to checkout with items', { cartItems: this.cartItems });
    this.logger.debug('Current user', { user: this.currentUser });

    this.isSubmitting = true;
    this.orderError = null;

    // For this example, using static addresses
    // In a real application, you would get these from a form or user profile
    const shippingAddress = "444 Main Street, Anytown, ST 12345";
    const billingAddress = "444 Main Street, Anytown, ST 12345";

    // Single order for all items (both agent and non-agent).
    // For agents, per-item onBehalfOfClient is set automatically from CartItem.clientId in OrderService.
    // Use the OrderService to create the order with user ID
    this.orderService.createOrder(
      this.cartItems,
      shippingAddress,
      billingAddress,
      this.referenceNumber || 'Order from cart',  // Use the reference number as notes
      this.currentUser.id  // Pass the user ID
    )
      .subscribe({
        next: (response) => {
          this.logger.debug('Order created successfully', { response });
          this.orderResponse = response;
          this.orderSuccess = true;
          this.isSubmitting = false;

          // Clear the cart after a successful order
          this.cartService.clearCart();

          // Redirect to order confirmation page
          this.router.navigate(['/order-confirmation'], {
            queryParams: { orderId: response.id, orderNumber: response.orderNumber, status: response.status }
          });
        },
        error: (error) => {
          this.logger.error('Error creating order', error);
          this.orderError = error.message || 'Failed to create order. Please try again.';
          this.isSubmitting = false;
        }
      });
  }

  protected readonly environment = environment;

  /**
   * Save the current cart as a draft order
   */
  saveDraft(): void {
    if (this.isSubmitting || this.cartItems.length === 0) {
      return;
    }

    // Check if the user is authenticated
    if (!this.currentUser || !this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/cart' }
      });
      return;
    }

    this.isSubmitting = true;
    this.orderError = null;

    // For this example, using static addresses
    const shippingAddress = "444 Main Street, Anytown, ST 12345";
    const billingAddress = "444 Main Street, Anytown, ST 12345";

    // Use the OrderService to create the draft order
    this.orderService.saveDraft(
      this.cartItems,
      shippingAddress,
      billingAddress,
      this.referenceNumber || 'Draft order',
      this.currentUser.id
    )
      .subscribe({
        next: (response) => {
          this.logger.debug('Draft saved successfully', { response });
          this.orderResponse = response;
          this.isSubmitting = false;

          // Show notification
          this.cartService.showNotification('Order saved as draft successfully!', 'success');
        },
        error: (error) => {
          this.logger.error('Error saving draft', error);
          this.orderError = error.message || 'Failed to save draft. Please try again.';
          this.isSubmitting = false;

          // Show error notification
          this.cartService.showNotification('Error saving draft. Please try again.', 'remove');
        }
      });
  }

  goToShopPage() {
    this.router.navigate(['/shop']);
  }

}
