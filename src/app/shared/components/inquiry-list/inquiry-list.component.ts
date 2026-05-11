import { Component, OnInit, Input, inject, DestroyRef, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, map } from 'rxjs';
import { of, Observable } from 'rxjs';
import { InquiryCardComponent } from '@shared/components/inquiry-card/inquiry-card.component';
import { InquiryCardShimmerComponent } from '@shared/components/inquiry-card/inquiry-card-shimmer.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { OrderService } from '@services/http/order.service';
import { InquiryService } from '@services/http/inquiry.service';
import { AuthService } from '@core/auth/auth.service';
import { DataMapperService } from '@services/data-mapper.service';
import { Inquiry } from '@core/models';
import { LoggerService, ScopedLogger } from '@services/logger.service';

/**
 * Unified Inquiry List Component
 *
 * Replaces both dashboard and full-page active-inquiries components.
 * Configurable to show limited items (dashboard) or all with filters (full page).
 *
 * @example Dashboard usage
 * ```html
 * <app-inquiry-list
 *   [maxItems]="3"
 *   [showViewAllLink]="true"
 *   [showInquiries]="false">
 * </app-inquiry-list>
 * ```
 *
 * @example Full page usage
 * ```html
 * <app-inquiry-list
 *   [enableFiltering]="true"
 *   [enableSorting]="true"
 *   [showInquiries]="true">
 * </app-inquiry-list>
 * ```
 */
@Component({
  selector: 'app-inquiry-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InquiryCardComponent,
    InquiryCardShimmerComponent,
    IconComponent
  ],
  templateUrl: './inquiry-list.component.html',
  styleUrls: ['./inquiry-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InquiryListComponent implements OnInit {
  // Configuration inputs
  @Input() maxItems: number | null = null; // null = show all, number = limit to N items
  @Input() enableFiltering = false; // Show search and status filter
  @Input() enableSorting = false; // Show sort dropdown
  @Input() showInquiries = true; // Include inquiries or just orders
  @Input() showViewAllLink = false; // Show "View all" link (for dashboard)
  @Input() title = 'Active Inquiries'; // Customizable title

  // State signals
  inquiries = signal<Inquiry[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Pagination state (server-side)
  currentPage = signal(1);
  itemsPerPage = signal(9); // 3x3 grid
  totalItems = signal(0);

  // Filter state
  searchQuery = signal('');
  selectedStatus = signal('all');
  sortBy = signal<'date-desc' | 'date-asc' | 'number-asc' | 'number-desc'>('date-desc');

  // Computed total pages
  totalPages = computed(() => {
    if (this.maxItems !== null) return 1; // No pagination in dashboard mode
    return Math.ceil(this.totalItems() / this.itemsPerPage()) || 1;
  });

  // Computed pages array for pagination buttons
  pagesArray = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (current > 3) {
        pages.push('...');
      }
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (current < total - 2) {
        pages.push('...');
      }
      pages.push(total);
    }

    return pages;
  });

  // Calculate shimmer placeholders needed (for dashboard mode)
  placeholdersNeeded = computed(() => {
    if (this.maxItems === null) return [];
    const count = Math.max(0, this.maxItems - this.inquiries().length);
    return Array(count).fill(0).map((_, i) => i);
  });

  // Available statuses for filter (excluding canceled - those go to history)
  readonly availableStatuses = ['all', 'submitted', 'in_review', 'more_info', 'information_provided', 'in_progress', 'confirmed', 'processing', 'completed', 'accepted', 'dispatched'];

  private destroyRef = inject(DestroyRef);
  private logger!: ScopedLogger;
  private currentUserEmail: string | null = null;

  constructor(
    private orderService: OrderService,
    private inquiryService: InquiryService,
    private authService: AuthService,
    private dataMapper: DataMapperService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('InquiryListComponent');
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserEmail = currentUser?.email || null;
    this.loadData();
  }

  /**
   * Load orders and optionally inquiries with server-side pagination
   */
  loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    if (!this.authService.isAuthenticated()) {
      this.error.set('User not authenticated');
      this.isLoading.set(false);
      return;
    }

    if (!this.currentUserEmail) {
      this.error.set('User information not available');
      this.isLoading.set(false);
      return;
    }

    const page = this.currentPage();
    const itemsPerPage = this.maxItems !== null ? this.maxItems : this.itemsPerPage();
    const status = this.selectedStatus();
    const search = this.searchQuery().trim();
    const sort = this.sortBy();

    // When combining orders and inquiries, we need to fetch all items and paginate client-side
    // Otherwise server-side pagination breaks when sources have different item counts
    const useClientSidePagination = this.showInquiries && this.maxItems === null;

    // Build observable sources
    const sources: { orders: Observable<{ items: Inquiry[]; total: number }>; inquiries?: Observable<{ items: Inquiry[]; total: number }> } = {
      orders: this.orderService.getOrdersByUserEmail(this.currentUserEmail, {
        // Only use server-side pagination when not combining sources
        page: useClientSidePagination ? undefined : page,
        itemsPerPage: useClientSidePagination ? undefined : itemsPerPage,
        status: status !== 'all' ? status : undefined,
        search: search || undefined,
        sort
      }).pipe(
        map(collection => ({
          items: collection.member?.map(order => this.dataMapper.mapOrderToActiveInquiry(order)) || [],
          total: collection.totalItems || 0
        })),
        catchError(err => {
          this.logger.error('Error loading orders:', err);
          return of({ items: [], total: 0 });
        })
      )
    };

    if (this.showInquiries) {
      sources.inquiries = this.inquiryService.getInquiriesByUserEmail(this.currentUserEmail, {
        // Only use server-side pagination when not combining sources
        page: useClientSidePagination ? undefined : page,
        itemsPerPage: useClientSidePagination ? undefined : itemsPerPage,
        status: status !== 'all' ? status : undefined,
        search: search || undefined,
        sort
      }).pipe(
        map(collection => ({
          items: collection.member?.map(inquiry => this.dataMapper.mapInquiryToActiveInquiry(inquiry)) || [],
          total: collection.totalItems || 0
        })),
        catchError(err => {
          this.logger.error('Error loading inquiries:', err);
          return of({ items: [], total: 0 });
        })
      );
    }

    forkJoin(sources).pipe(
      map((results) => {
        const orders = results.orders;
        const inquiriesResult = results.inquiries || { items: [], total: 0 };

        // Combine items
        let allItems = [...orders.items, ...inquiriesResult.items];

        // Filter out cancelled/canceled items when showing "all" active inquiries
        // Only include cancelled items if explicitly filtered by cancelled status
        if (status === 'all') {
          allItems = allItems.filter(item => {
            const itemStatus = item.status?.toLowerCase();
            return itemStatus !== 'canceled' && itemStatus !== 'cancelled';
          });
        }

        // Apply sorting based on sortBy signal
        allItems.sort((a, b) => {
          switch (sort) {
            case 'date-asc':
              return new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime();
            case 'number-asc':
              return (a.orderNumber || a.inquiryNumber || '').localeCompare(b.orderNumber || b.inquiryNumber || '');
            case 'number-desc':
              return (b.orderNumber || b.inquiryNumber || '').localeCompare(a.orderNumber || a.inquiryNumber || '');
            case 'date-desc':
            default:
              return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
          }
        });

        // Calculate total (after filtering)
        const combinedTotal = allItems.length;

        // Apply client-side pagination when combining sources
        if (useClientSidePagination) {
          const startIndex = (page - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          allItems = allItems.slice(startIndex, endIndex);
        }

        return {
          items: allItems,
          total: combinedTotal
        };
      }),
      catchError(err => {
        this.error.set('Failed to load data. Please try again later.');
        this.logger.error('Error loading data:', err);
        return of({ items: [], total: 0 });
      }),
      finalize(() => {
        setTimeout(() => {
          this.isLoading.set(false);
        }, 300);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.inquiries.set(result.items);
      this.totalItems.set(result.total);
    });
  }

  /**
   * Update search query and reload
   */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadData();
  }

  /**
   * Update status filter and reload
   */
  onStatusChange(status: string): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadData();
  }

  /**
   * Update sort order
   */
  onSortChange(sortBy: 'date-desc' | 'date-asc' | 'number-asc' | 'number-desc'): void {
    this.sortBy.set(sortBy);
    this.currentPage.set(1);
    this.loadData();
  }

  /**
   * Clear all filters and reload
   */
  clearFilters(): void {
    this.selectedStatus.set('all');
    this.searchQuery.set('');
    this.sortBy.set('date-desc');
    this.currentPage.set(1);
    this.loadData();
  }

  /**
   * Navigate to a specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadData();
    }
  }

  /**
   * Navigate to first page
   */
  goToFirstPage(): void {
    this.currentPage.set(1);
    this.loadData();
  }

  /**
   * Navigate to last page
   */
  goToLastPage(): void {
    this.currentPage.set(this.totalPages());
    this.loadData();
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadData();
    }
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadData();
    }
  }

  /**
   * Check if any filters are active
   */
  get hasActiveFilters(): boolean {
    return this.selectedStatus() !== 'all' || this.searchQuery().trim().length > 0;
  }

  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Calculate the end item number for pagination display
   */
  getEndItem(): number {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems());
  }
}
