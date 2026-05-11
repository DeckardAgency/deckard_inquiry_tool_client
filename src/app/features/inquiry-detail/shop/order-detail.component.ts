import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { Order, OrderItem } from '@core/models';
import { OrderService } from '@services/http/order.service';
import { delay } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PriceFilterAdvancedPipe } from '@shared/pipes/price-filter-advanced.pipe';
import { DateFilterPipe } from '@shared/pipes/date-filter.pipe';
import { OrderDetailShimmerComponent } from '@features/inquiry-detail/shop/order-detail-shimmer-component';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-inquiry-detail',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent, RouterModule, PriceFilterAdvancedPipe, DateFilterPipe, OrderDetailShimmerComponent],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private logger!: ScopedLogger;

  breadcrumbs = [
    { label: 'Active Orders', link: '/my-inquiries/active' },
    { label: '...' },
  ];

  order: Order | null = null;
  isLoading = true;
  error: string | null = null;

  // Order totals calculated from items
  grandTotal = 0;
  priceWithoutTax = 0;
  priceTax = 0;

  // Client groups for agent orders
  isAgentOrder = false;
  clientGroups: { clientId: string; clientName: string; clientCode: string; items: OrderItem[] }[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderService: OrderService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('OrderDetailComponent');
  }

  ngOnInit(): void {
    this.loadOrderData();
  }

  /**
   * Load order data from the API
   */
  loadOrderData(): void {
    const orderId = this.route.snapshot.paramMap.get('id');

    if (!orderId) {
      this.isLoading = false;
      this.error = 'Order ID is required';
      return;
    }

    // Update breadcrumbs with order ID
    this.breadcrumbs = [
      { label: 'Active Inquiries', link: '/my-inquiries/active' },
      { label: `Order #${orderId.substring(0, 8)}` },
    ];

    this.orderService.getOrder(orderId)
      .pipe(
        // Add a small delay to show the loading state in development
        delay(300),
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (order) => {
          if (order) {
            this.order = order;

            // Update breadcrumbs with order number if available
            if (order.orderNumber) {
              this.breadcrumbs = [
                { label: 'Active Inquiries', link: '/my-inquiries/active' },
                { label: `Order #${orderId.substring(0, 8)}` },
              ];
            }

            // Calculate totals from order items
            this.calculateTotals();

            // Build client groups if this is an agent order
            this.buildClientGroups();

            this.logger.debug('Order data loaded:', order);
          } else {
            this.error = 'Order not found';
          }
        },
        error: (err) => {
          this.logger.error('Error loading order:', err);
          this.error = 'Failed to load order data';
        }
      });
  }

  /**
   * Navigate back to the order list
   */
  goBack(): void {
    this.router.navigate(['/my-inquiries/active']);
  }

  /**
   * Calculate order totals from items
   */
  calculateTotals(): void {
    if (!this.order || !this.order.items) {
      return;
    }

    // Calculate grand total from order totalAmount or sum of items
    this.grandTotal = this.order.totalAmount || 0;

    // If we don't have the totalAmount, calculate from items
    if (!this.grandTotal && this.order.items.length > 0) {
      this.grandTotal = this.order.items.reduce((sum, item) => sum + item.subtotal, 0);
    }

    // Calculate price without a tax (assuming 20% VAT for demo)
    const taxRate = 0.20;
    this.priceWithoutTax = this.grandTotal / (1 + taxRate);
    this.priceTax = this.grandTotal - this.priceWithoutTax;
  }

  /**
   * Export the order to PDF
   */
  exportOrder(): void {
    if (!this.order) {
      // this.notificationService.error('No order loaded to export');
      return;
    }

    // Show loading state
    const exportButton = document.querySelector('.order-detail__action-btn--export') as HTMLButtonElement;
    const originalButtonContent = exportButton?.innerHTML;

    if (exportButton) {
      exportButton.disabled = true;
      exportButton.innerHTML = `
        <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1V4M8 12V15M3.05 3.05L5.17 5.17M10.83 10.83L12.95 12.95M1 8H4M12 8H15M3.05 12.95L5.17 10.83M10.83 5.17L12.95 3.05" stroke="#232323" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Exporting...
      `;
    }

    this.orderService.exportOrderPdf(this.order.id).subscribe({
      next: (blob) => {
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;

        // Set filename with order number and current date
        const date = new Date();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        a.download = `order_${this.order!.orderNumber}_${dateStr}.pdf`;

        // Trigger download
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Show a success notification
        // this.notificationService.success('Order exported successfully!');
      },
      error: (error) => {
        this.logger.error('Export error:', error);

        // Show a specific error message based on an error type
        if (error.status === 403) {
          // this.notificationService.error('You do not have permission to export this order.');
        } else if (error.status === 404) {
          // this.notificationService.error('Order not found.');
        } else if (error.status === 0) {
          // this.notificationService.error('Network error. Please check your connection.');
        } else {
          // this.notificationService.error('Failed to export order. Please try again.');
        }
      },
      complete: () => {
        // Reset button state
        if (exportButton && originalButtonContent) {
          exportButton.disabled = false;
          exportButton.innerHTML = originalButtonContent;
        }
      }
    });
  }

  /**
   * Print the order
   */
  printOrder(): void {
    window.print();
  }

  /**
   * Get the CSS class for log status badges
   */
  getLogStatusClass(status: string): string {
    const normalizedStatus = status.toLowerCase().replace(/ /g, '_');

    switch (normalizedStatus) {
      case 'submitted':
        return 'order-logs__status--submitted';
      case 'confirmed':
        return 'order-logs__status--confirmed';
      case 'dispatched':
        return 'order-logs__status--dispatched';
      case 'completed':
        return 'order-logs__status--completed';
      case 'canceled':
        return 'order-logs__status--canceled';
      default:
        return 'order-logs__status--default';
    }
  }

  /**
   * Get the CSS class for order status badge
   */
  getOrderStatusClass(status: string | undefined): string {
    if (!status) return 'order-detail__badge--default';

    const normalizedStatus = status.toLowerCase().replace(/ /g, '-');

    switch (normalizedStatus) {
      case 'submitted':
        return 'order-detail__badge--submitted';
      case 'confirmed':
        return 'order-detail__badge--confirmed';
      case 'dispatched':
        return 'order-detail__badge--dispatched';
      case 'completed':
        return 'order-detail__badge--completed';
      case 'canceled':
        return 'order-detail__badge--canceled';
      default:
        return 'order-detail__badge--default';
    }
  }

  /**
   * Build client groups from order items for agent orders
   */
  buildClientGroups(): void {
    if (!this.order?.items) return;

    // Check if any item has onBehalfOfClient set
    const hasClientItems = this.order.items.some(item => item.onBehalfOfClient);
    if (!hasClientItems) {
      this.isAgentOrder = false;
      this.clientGroups = [];
      return;
    }

    this.isAgentOrder = true;
    const groupMap = new Map<string, typeof this.clientGroups[0]>();

    for (const item of this.order.items) {
      const clientId = item.onBehalfOfClient?.id || '_self';
      const clientName = item.onBehalfOfClient?.name || 'Own Company';
      const clientCode = item.onBehalfOfClient?.code || '';

      if (!groupMap.has(clientId)) {
        groupMap.set(clientId, { clientId, clientName, clientCode, items: [] });
      }
      groupMap.get(clientId)!.items.push(item);
    }

    this.clientGroups = Array.from(groupMap.values());
  }

  // TrackBy functions for performance optimization
  trackByItemId(index: number, item: OrderItem): string {
    return item.product?.id || item.product?.['@id'] || index.toString();
  }

  trackByLogIndex(index: number): number {
    return index;
  }
}
