import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  ChangeDetectionStrategy,
  OnInit,
  DestroyRef,
  inject,
  HostListener,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, Subject } from 'rxjs';

import {
  OrderInquiryItem,
  OrderInquiryTab,
  OrderInquiryAction,
  OrderInquiryTableConfig,
  SortConfig,
  FilterConfig,
  TabChangeEvent,
  ORDER_INQUIRY_TABS,
  ORDER_STATUS,
  INQUIRY_TYPE,
  DATA_SOURCE,
  SortableColumn,
  DataSource
} from './order-inquiry-table.types';
import {InquiryShimmerComponent} from '@shared/components/inquiry-table/inquiry-shimmer.component';
import {DateFilterPipe} from '@shared/pipes/date-filter.pipe';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-order-inquiry-table',
  standalone: true,
  imports: [CommonModule, FormsModule, InquiryShimmerComponent, DateFilterPipe],
  templateUrl: './order-inquiry-table.component.html',
  styleUrls: ['./order-inquiry-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderInquiryTableComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  private loggerService = inject(LoggerService);
  private logger!: ScopedLogger;

  // Input signals
  readonly inquiries = signal<OrderInquiryItem[]>([]);
  readonly orders = signal<OrderInquiryItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly config = signal<OrderInquiryTableConfig>({
    loadDataOnTabChange: true,
    dataSource: DATA_SOURCE.BOTH,
    enableSorting: true,
    enableFiltering: true,
    pageSize: 10,
    showPagination: true
  });

  // State signals
  readonly activeTab = signal<OrderInquiryTab>(ORDER_INQUIRY_TABS.LATEST);
  readonly sortConfig = signal<SortConfig | null>(null);
  readonly filterConfig = signal<FilterConfig>({});
  readonly currentPage = signal<number>(1);
  readonly searchTerm = signal<string>('');
  readonly showLoadOnTabChangeToggle = signal<boolean>(false);

  // Dropdown state
  readonly activeDropdownId = signal<string | null>(null);

  // Search debounce subject
  private searchSubject = new Subject<string>();

  // Output events
  @Output() tabChange = new EventEmitter<TabChangeEvent>();
  @Output() itemAction = new EventEmitter<OrderInquiryAction>();
  @Output() loadData = new EventEmitter<OrderInquiryTab>();
  @Output() configChange = new EventEmitter<OrderInquiryTableConfig>();

  // Constants
  readonly tabs = Object.values(ORDER_INQUIRY_TABS);
  readonly statusOptions = Object.values(ORDER_STATUS);
  readonly typeOptions = Object.values(INQUIRY_TYPE);

  // Host listener for click outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = this.elementRef.nativeElement.contains(target);

    // If clicked outside the component or on a different action button, close dropdown
    if (!clickedInside || !target.closest('.order-inquiry__dropdown')) {
      // Check if the click is on an action button
      const actionButton = target.closest('.order-inquiry__action-menu');
      if (!actionButton || actionButton.getAttribute('data-item-id') !== this.activeDropdownId()) {
        this.activeDropdownId.set(null);
      }
    }
  }

  // Computed signals
  readonly allItems = computed(() => {
    const dataSource = this.config().dataSource;
    const inquiriesData = this.inquiries();
    const ordersData = this.orders();

    switch (dataSource) {
      case DATA_SOURCE.INQUIRIES:
        return inquiriesData;
      case DATA_SOURCE.ORDERS:
        return ordersData;
      case DATA_SOURCE.BOTH:
        return [...inquiriesData, ...ordersData];
      default:
        return [];
    }
  });

  readonly filteredByTab = computed(() => {
    const tab = this.activeTab();
    const items = this.allItems();

    switch (tab) {
      case ORDER_INQUIRY_TABS.COMPLETED:
        return items.filter(item => item.status === ORDER_STATUS.COMPLETED);
      case ORDER_INQUIRY_TABS.CANCELED:
        return items.filter(item => item.status === ORDER_STATUS.CANCELED);
      case ORDER_INQUIRY_TABS.LATEST:
      default:
        return items;
    }
  });

  readonly filteredItems = computed(() => {
    let items = this.filteredByTab();
    const filter = this.filterConfig();
    const search = this.searchTerm().toLowerCase();

    // Apply search filter
    if (search) {
      items = items.filter(item =>
        item.id.toLowerCase().includes(search) ||
        item.internalReferenceNumber.toLowerCase().includes(search) ||
        item.customer.name.toLowerCase().includes(search) ||
        item.type.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (filter.status && filter.status.length > 0) {
      items = items.filter(item => filter.status!.includes(item.status));
    }

    // Apply type filter
    if (filter.type && filter.type.length > 0) {
      items = items.filter(item => filter.type!.includes(item.type));
    }

    // Apply date range filter
    if (filter.dateRange) {
      items = items.filter(item => {
        const itemDate = new Date(item.dateCreated);
        return itemDate >= filter.dateRange!.start && itemDate <= filter.dateRange!.end;
      });
    }

    this.logger.debug('Filtered items', { items });
    return items;
  });

  readonly sortedItems = computed(() => {
    const items = [...this.filteredItems()];
    const sort = this.sortConfig();

    if (!sort || !this.config().enableSorting) {
      return items;
    }

    return items.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sort.column) {
        case 'customerName':
          aVal = a.customer.name;
          bVal = b.customer.name;
          break;
        case 'dateCreated':
          aVal = new Date(a.dateCreated).getTime();
          bVal = new Date(b.dateCreated).getTime();
          break;
        case 'partsOrdered':
          aVal = a.partsOrdered;
          bVal = b.partsOrdered;
          break;
        default:
          aVal = a[sort.column];
          bVal = b[sort.column];
      }

      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  readonly paginatedItems = computed(() => {
    const items = this.sortedItems();
    const config = this.config();

    if (!config.showPagination || !config.pageSize) {
      return items;
    }

    const page = this.currentPage();
    const pageSize = config.pageSize;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return items.slice(start, end);
  });

  readonly totalPages = computed(() => {
    const config = this.config();
    if (!config.showPagination || !config.pageSize) {
      return 1;
    }

    return Math.ceil(this.sortedItems().length / config.pageSize);
  });

  readonly isEmpty = computed(() => !this.loading() && this.paginatedItems().length === 0);
  readonly hasData = computed(() => !this.loading() && this.allItems().length > 0);

  readonly itemCounts = computed(() => {
    const items = this.allItems();
    return {
      total: items.length,
      completed: items.filter(item => item.status === ORDER_STATUS.COMPLETED).length,
      canceled: items.filter(item => item.status === ORDER_STATUS.CANCELED).length
    };
  });

  // Lifecycle
  ngOnInit(): void {
    this.logger = this.loggerService.createLogger('OrderInquiryTableComponent');

    // Setup search debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(term => {
        this.searchTerm.set(term);
        this.currentPage.set(1); // Reset to first page on search
      });
  }

  // Input setters
  @Input() set inquiriesData(value: OrderInquiryItem[]) {
    this.inquiries.set(value);
  }

  @Input() set ordersData(value: OrderInquiryItem[]) {
    this.orders.set(value);
  }

  @Input() set loadingState(value: boolean) {
    this.loading.set(value);
  }

  @Input() set configuration(value: Partial<OrderInquiryTableConfig>) {
    this.config.update(current => ({ ...current, ...value }));
  }

  @Input() set initialTab(value: OrderInquiryTab) {
    this.activeTab.set(value);
  }

  // Methods
  selectTab(tab: OrderInquiryTab): void {
    const previousTab = this.activeTab();
    this.activeTab.set(tab);
    this.currentPage.set(1); // Reset to first page on tab change

    const shouldLoad = this.config().loadDataOnTabChange;
    this.tabChange.emit({ tab, shouldLoadData: shouldLoad });

    if (shouldLoad && tab !== previousTab) {
      this.loadData.emit(tab);
    }
  }

  toggleSort(column: SortableColumn): void {
    if (!this.config().enableSorting) return;

    const current = this.sortConfig();

    if (current?.column === column) {
      this.sortConfig.update(config => ({
        column,
        direction: config!.direction === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      this.sortConfig.set({ column, direction: 'asc' });
    }
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.searchSubject.next(target.value);
    }
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  toggleLoadOnTabChange(): void {
    this.config.update(config => ({
      ...config,
      loadDataOnTabChange: !config.loadDataOnTabChange
    }));
    this.configChange.emit(this.config());
  }

  toggleDropdown(itemId: string, event: Event): void {
    event.stopPropagation();

    if (this.activeDropdownId() === itemId) {
      this.activeDropdownId.set(null);
    } else {
      this.activeDropdownId.set(itemId);
    }
  }

  handleAction(action: 'view' | 'edit' | 'delete' | 'export', item: OrderInquiryItem): void {
    // Close dropdown
    this.activeDropdownId.set(null);

    // Handle view action with navigation
    if (action === 'view') {
      const type = item.type.toLowerCase();
      const url = `/my-inquiries/active/${type}/${item.internalReferenceNumber}/view`;
      this.router.navigate([url]);
    }

    // Emit action for other cases
    this.itemAction.emit({ type: action, item });
  }

  isDropdownOpen(itemId: string): boolean {
    return this.activeDropdownId() === itemId;
  }

  // Track by functions
  trackByItemId(index: number, item: OrderInquiryItem): string {
    return item.id;
  }

  trackByTab(index: number, tab: OrderInquiryTab): string {
    return tab;
  }

  // Helper methods
  getTypeClass(type: string): string {
    return `order-inquiry__type-badge--${type.toLowerCase()}`;
  }

  getStatusClass(status: string): string {
    const key = status?.toLowerCase().split(' ').join('_').split('-').join('_') ?? 'default';
    return `order-inquiry__status-badge--${key}`;
  }

  getSortIcon(column: SortableColumn): 'asc' | 'desc' | 'both' {
    const current = this.sortConfig();
    if (!current || current.column !== column) return 'both';
    return current.direction;
  }
}
