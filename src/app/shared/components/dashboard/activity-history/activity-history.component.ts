import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { OrderInquiryTableComponent } from '@shared/components/order-inquiry-table/order-inquiry-table.component';
import {
  DATA_SOURCE,
  DataSource,
  INQUIRY_TYPE,
  ORDER_STATUS,
  OrderStatus,
  OrderInquiryAction,
  OrderInquiryItem,
  OrderInquiryTab,
  OrderInquiryTableConfig,
  TabChangeEvent
} from '@shared/components/order-inquiry-table/order-inquiry-table.types';
import { OrderService, OrderResponse, OrdersCollection } from '@services/http/order.service';
import { InquiryService, InquiryResponse, InquiriesCollection } from '@services/http/inquiry.service';
import { AuthService } from '@core/auth/auth.service';
import { DataMapperService } from '@core/services/data-mapper.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-activity-history',
  standalone: true,
  imports: [CommonModule, RouterModule, OrderInquiryTableComponent],
  templateUrl: './activity-history.component.html',
  styleUrls: ['./activity-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityHistoryComponent implements OnInit {
  inquiries: OrderInquiryItem[] = [];
  orders: OrderInquiryItem[] = [];
  loading = false;
  error: string | null = null;
  currentDataSource: DataSource = DATA_SOURCE.BOTH;
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private logger!: ScopedLogger;

  tableConfig: Partial<OrderInquiryTableConfig> = {
    loadDataOnTabChange: false,
    dataSource: DATA_SOURCE.BOTH,
    enableSorting: true,
    enableFiltering: true,
    pageSize: 10,
    showPagination: true
  };

  constructor(
    private orderService: OrderService,
    private inquiryService: InquiryService,
    private authService: AuthService,
    private dataMapper: DataMapperService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('ActivityHistoryComponent');
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.loading = true;
    this.error = null;

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.error = 'User not authenticated';
      this.loading = false;
      return;
    }

    // Get current user from auth service
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.email) {
      this.error = 'User information not available';
      this.loading = false;
      return;
    }

    // Fetch both orders and inquiries in parallel
    forkJoin({
      orders: this.orderService.getOrdersByUserEmail(currentUser.email).pipe(
        catchError(err => {
          this.logger.error('Error loading orders:', err);
          return of(this.getEmptyOrdersCollection());
        })
      ),
      inquiries: this.inquiryService.getInquiriesByUserEmail(currentUser.email).pipe(
        catchError(err => {
          this.logger.error('Error loading inquiries:', err);
          return of(this.getEmptyInquiriesCollection());
        })
      )
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ orders, inquiries }) => {
        // Map orders to OrderInquiryItem format
        if (orders.member && orders.member.length > 0) {
          this.orders = orders.member.map(order => this.dataMapper.mapOrderToOrderInquiryItem(order));
        }

        // Map inquiries to OrderInquiryItem format
        if (inquiries.member && inquiries.member.length > 0) {
          this.inquiries = inquiries.member.map(inquiry => this.dataMapper.mapInquiryToOrderInquiryItem(inquiry));
        }

        this.cdr.markForCheck();
      });
  }

  private getEmptyOrdersCollection(): OrdersCollection {
    return {
      '@context': '',
      '@id': '',
      '@type': '',
      totalItems: 0,
      member: [],
      view: { '@id': '', '@type': '' },
      search: { '@type': '', template: '', variableRepresentation: '', mapping: [] }
    };
  }

  private getEmptyInquiriesCollection(): InquiriesCollection {
    return {
      '@context': '',
      '@id': '',
      '@type': '',
      totalItems: 0,
      member: [],
      view: { '@id': '', '@type': '' },
      search: { '@type': '', template: '', variableRepresentation: '', mapping: [] }
    };
  }

  onTabChange(event: TabChangeEvent): void {
    // Since we load all data at once, we don't need to reload on tab change
  }

  onItemAction(action: OrderInquiryAction): void {
    switch (action.type) {
      case 'view':
        this.viewItem(action.item);
        break;
      case 'edit':
        this.editItem(action.item);
        break;
      case 'delete':
        this.deleteItem(action.item);
        break;
      case 'export':
        this.exportItem(action.item);
        break;
    }
  }

  onLoadData(tab: OrderInquiryTab): void {
    // Since we load all data at once, we can skip this
  }

  onConfigChange(config: OrderInquiryTableConfig): void {
    // Save configuration preferences
    localStorage.setItem('orderInquiryTableConfig', JSON.stringify(config));
  }

  private viewItem(item: OrderInquiryItem): void {
    // Navigate to detail view based on source
    if (item.source === 'order') {
      // Navigate to order detail
      // this.router.navigate(['/orders', item.internalReferenceNumber]);
    } else {
      // Navigate to inquiry detail
      // this.router.navigate(['/inquiries', item.internalReferenceNumber]);
    }
  }

  private editItem(item: OrderInquiryItem): void {
    // Open edit dialog based on source
  }

  private deleteItem(item: OrderInquiryItem): void {
    // Show confirmation dialog
  }

  private exportItem(item: OrderInquiryItem): void {
    // Export to CSV/PDF
  }
}
