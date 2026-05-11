import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrderService, OrderResponse } from '@services/http/order.service';
import { AuthService } from '@core/auth/auth.service';
import { CartService } from '@services/cart/cart.service';
import { ManualQuickCartService } from '@services/cart/manual-quick-cart.service';
import { InquiryService, InquiryResponse } from '@services/http/inquiry.service';
import { ProductService } from '@services/http/product.service';
import { DataMapperService, DraftListItem } from '@services/data-mapper.service';
import { Product } from '@core/models/product.model';
import { ManualCartItem } from '@core/models';
import { OrderProduct } from '@core/models/order.model';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-client-admin-drafts',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent, IconComponent],
  templateUrl: './client-admin-drafts.component.html',
  styleUrls: ['./client-admin-drafts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAdminDraftsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private logger!: ScopedLogger;

  breadcrumbs = [
    { label: 'Client Admin', link: '/client-admin' },
    { label: 'Drafts' }
  ];

  draftItems: DraftListItem[] = [];
  isLoading = false;
  error: string | null = null;
  sortField: string = 'dateCreated';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private orderService: OrderService,
    private inquiryService: InquiryService,
    private authService: AuthService,
    private cartService: CartService,
    private manualQuickCartService: ManualQuickCartService,
    private productService: ProductService,
    private router: Router,
    private dataMapper: DataMapperService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('ClientAdminDraftsComponent');
  }

  ngOnInit(): void {
    this.loadDraftItems();
  }

  loadDraftItems(): void {
    this.isLoading = true;
    this.error = null;

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.error = 'User not authenticated';
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    // Get current user from auth service
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.error = 'User information not available';
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    // Get client code for filtering
    const clientCode = currentUser.client?.code;

    if (!clientCode) {
      this.error = 'Client information not available';
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    // Fetch both draft orders and draft inquiries for the client using forkJoin
    forkJoin({
      orders: this.orderService.getDraftOrdersByClientCode(clientCode).pipe(
        catchError(err => {
          this.logger.error('Error loading draft orders', err);
          return of({
            '@context': '',
            '@id': '',
            '@type': '',
            'totalItems': 0,
            'member': [],
            'view': { '@id': '', '@type': '' },
            'search': { '@type': '', 'template': '', 'variableRepresentation': '', 'mapping': [] }
          });
        })
      ),
      inquiries: this.inquiryService.getDraftInquiriesByClientCode(clientCode).pipe(
        catchError(err => {
          this.logger.error('Error loading draft inquiries', err);
          return of({
            '@context': '',
            '@id': '',
            '@type': '',
            'totalItems': 0,
            'member': [],
            'view': { '@id': '', '@type': '' },
            'search': { '@type': '', 'template': '', 'variableRepresentation': '', 'mapping': [] }
          });
        })
      )
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ orders, inquiries }) => {
        this.draftItems = [];

        // Add draft orders to the array using DataMapperService
        if (orders.member && orders.member.length > 0) {
          const mappedOrders = orders.member.map(order => this.dataMapper.mapOrderToDraftListItem(order));
          this.draftItems.push(...mappedOrders);
        }

        // Add draft inquiries to the array using DataMapperService
        if (inquiries.member && inquiries.member.length > 0) {
          const mappedInquiries = inquiries.member.map(inquiry => this.dataMapper.mapInquiryToDraftListItem(inquiry));
          this.draftItems.push(...mappedInquiries);
        }

        // If there was no items found
        if (this.draftItems.length === 0) {
          this.error = 'No draft items found';
        }

        this.sortItems();
        this.cdr.markForCheck();
      });
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.sortItems();
  }

  private sortItems(): void {
    this.draftItems.sort((a, b) => {
      let aValue: string | number = a[this.sortField as keyof DraftListItem] as string | number;
      let bValue: string | number = b[this.sortField as keyof DraftListItem] as string | number;

      // Handle nested customer property
      if (this.sortField === 'customer') {
        aValue = a.customer.name;
        bValue = b.customer.name;
      }

      // Handle date comparison
      if (this.sortField === 'dateCreated') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  onView(item: DraftListItem): void {
    if (item.type === 'Inquiry') {
      this.router.navigate(['/manual-entry', item.id, 'view']);
    } else if (item.type === 'Order') {
      this.router.navigate(['/my-inquiries/active/order', item.id, 'view']);
    }
  }

  onEdit(item: DraftListItem): void {
    if (item.type === 'Order') {
      this.editDraftOrder(item);
    } else if (item.type === 'Inquiry') {
      this.editDraftInquiry(item);
    }
  }

  private editDraftOrder(item: DraftListItem): void {
    const loadOrderAndProducts = (orderData: OrderResponse) => {
      if (!orderData || !orderData.items || orderData.items.length === 0) {
        alert('This draft order has no items.');
        return;
      }

      // Clear the current cart
      this.cartService.clearCart();

      // Create an array of product fetch observables
      const productRequests = orderData.items.map((orderItem) => {
        if (orderItem.product && orderItem.product.id) {
          // Fetch full product details
          return this.productService.getProduct(orderItem.product.id).pipe(
            catchError(err => {
              this.logger.error('Error loading product', { productId: orderItem.product.id, error: err });
              // Return a fallback partial product if fetch fails
              return of<Product>({
                '@id': orderItem.product['@id'] || '',
                '@type': orderItem.product['@type'] || 'Product',
                id: orderItem.product.id,
                name: orderItem.product.name || 'Unknown Product',
                slug: orderItem.product.id,
                partNo: (orderItem.product as Partial<OrderProduct>).partNo || '',
                shortDescription: (orderItem.product as Partial<OrderProduct>).shortDescription || '',
                clientPrice: orderItem.product.price || 0,
                regularPrice: orderItem.product.price || 0,
                featuredImage: null,
                imageGallery: [],
                machines: []
              });
            })
          );
        }
        return of(null);
      });

      // Fetch all products in parallel
      forkJoin(productRequests)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((products: (Product | null)[]) => {
          // Add each product to cart with its quantity
          products.forEach((product: Product | null, index: number) => {
            if (product) {
              const orderItem = orderData.items[index];

              // Ensure all required price fields are set
              const effectivePrice = orderItem.unitPrice || product.clientPrice || product.price || product.regularPrice || 0;

              const productWithPrices = {
                ...product,
                price: effectivePrice,
                clientPrice: effectivePrice,
                regularPrice: product.regularPrice || effectivePrice,
                discountPercentage: product.discountPercentage || null,
                effectivePrice: effectivePrice
              };

              this.cartService.addToCart(productWithPrices, orderItem.quantity);
            }
          });

          // Store draft order ID in sessionStorage
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.setItem('draftOrderId', item.id);
            sessionStorage.setItem('draftOrderNumber', item.internalReference);
          }

          // Navigate to cart page
          this.router.navigate(['/cart']);
        });
    };

    // Check if we have the original order data with items
    if (item.originalData && 'items' in item.originalData) {
      loadOrderAndProducts(item.originalData);
    } else {
      // Fetch the order details first
      this.orderService.getOrder(item.id)
        .pipe(
          catchError(err => {
            this.logger.error('Error loading draft order details', err);
            alert('Failed to load draft order details. Please try again.');
            return of(null);
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((order) => {
          if (order) {
            loadOrderAndProducts(order as OrderResponse);
          }
        });
    }
  }

  private editDraftInquiry(item: DraftListItem): void {
    // Check if we have the original inquiry data with machines
    if (item.originalData && 'machines' in item.originalData) {
      const cartItems = this.transformInquiryToCartItems(item.originalData);

      if (cartItems.length > 0) {
        this.manualQuickCartService.addToCart(cartItems);

        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem('draftInquiryId', item.id);
          sessionStorage.setItem('draftInquiryNumber', item.internalReference);
        }

        this.router.navigate(['/manual-entry']);
      } else {
        alert('No items found in this draft inquiry.');
      }
    } else {
      // Fetch the inquiry details
      this.inquiryService.getInquiryById(item.id)
        .pipe(
          catchError(err => {
            this.logger.error('Error loading draft inquiry details', err);
            alert('Failed to load draft inquiry details. Please try again.');
            return of(null);
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(inquiryData => {
          if (inquiryData && inquiryData.machines) {
            const cartItems = this.transformInquiryToCartItems(inquiryData);

            if (cartItems.length > 0) {
              this.manualQuickCartService.addToCart(cartItems);

              if (typeof window !== 'undefined' && window.sessionStorage) {
                sessionStorage.setItem('draftInquiryId', item.id);
                sessionStorage.setItem('draftInquiryNumber', item.internalReference);
              }

              this.router.navigate(['/manual-entry']);
            } else {
              alert('No items found in this draft inquiry.');
            }
          }
        });
    }
  }

  private transformInquiryToCartItems(inquiry: InquiryResponse): ManualCartItem[] {
    const cartItems: ManualCartItem[] = [];

    if (!inquiry.machines || inquiry.machines.length === 0) {
      return cartItems;
    }

    inquiry.machines.forEach((machine) => {
      const machineId = machine.machine?.id || (typeof machine.machine === 'string' ? machine.machine : machine.customMachineId) || 'unknown';
      const machineName = machine.machine && typeof machine.machine === 'object' ? machine.machine.articleDescription : 'Unknown Machine';

      if (machine.products && machine.products.length > 0) {
        machine.products.forEach((product, index: number) => {
          // Transform mediaItems to file objects for the cart
          const files = (product.mediaItems?.map((mediaItem) => ({
            name: mediaItem.filename,
            size: 0,
            type: mediaItem.mimeType,
            status: 'success' as const,
            progress: 100,
            mediaItem: mediaItem,
            file: null
          })) || []);

          const cartItem: ManualCartItem = {
            id: `${machineId}-${index}`,
            machineId: machineId,
            machineName: machineName,
            partData: {
              partName: product.partName,
              partNumber: product.partNumber,
              shortDescription: product.shortDescription,
              additionalNotes: product.additionalNotes,
              mediaItems: (product.mediaItems || [])
            },
            files: files
          };

          cartItems.push(cartItem);
        });
      }
    });

    return cartItems;
  }

  onDelete(item: DraftListItem): void {
    if (confirm(`Are you sure you want to delete this draft ${item.type.toLowerCase()}?`)) {
      const deleteObservable = item.type === 'Order'
        ? this.orderService.deleteOrder(item.id)
        : this.inquiryService.deleteInquiry(item.id);

      deleteObservable
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.logger.debug('Draft deleted successfully', { type: item.type.toLowerCase() });
            // Re-fetch the draft items to update the list
            this.loadDraftItems();
          },
          error: (err) => {
            this.logger.error('Error deleting draft', { type: item.type.toLowerCase(), error: err });
            alert(`Failed to delete draft ${item.type.toLowerCase()}. Please try again.`);
          }
        });
    }
  }

  onMoreOptions(item: DraftListItem): void {
    this.logger.debug('More options for item', { item });
  }
}
