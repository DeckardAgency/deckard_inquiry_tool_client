import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { OrderInquiryTableComponent } from '@shared/components/order-inquiry-table/order-inquiry-table.component';
import {
  DATA_SOURCE,
  DataSource,
  OrderInquiryAction,
  OrderInquiryItem,
  OrderInquiryTab,
  OrderInquiryTableConfig,
  TabChangeEvent
} from '@shared/components/order-inquiry-table/order-inquiry-table.types';
import { OrderService, OrdersCollection } from '@services/http/order.service';
import { InquiryService, InquiriesCollection } from '@services/http/inquiry.service';
import { AuthService } from '@core/auth/auth.service';
import { DataMapperService } from '@core/services/data-mapper.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-client-admin-history',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbsComponent, OrderInquiryTableComponent],
  templateUrl: './client-admin-history.component.html',
  styleUrls: ['./client-admin-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAdminHistoryComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private logger!: ScopedLogger;

  breadcrumbs = [
    { label: 'Client Admin', link: '/client-admin' },
    { label: 'History' }
  ];

  inquiries: OrderInquiryItem[] = [];
  orders: OrderInquiryItem[] = [];
  loading = false;
  error: string | null = null;
  currentDataSource: DataSource = DATA_SOURCE.BOTH;

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
    this.logger = this.loggerService.createLogger('ClientAdminHistoryComponent');
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
      this.cdr.markForCheck();
      return;
    }

    // Get current user from auth service
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.error = 'User information not available';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    // Get client code for filtering
    const clientCode = currentUser.client?.code;

    if (!clientCode) {
      this.error = 'Client information not available';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    // Fetch both orders and inquiries for the client in parallel
    forkJoin({
      orders: this.orderService.getOrdersByClientCode(clientCode).pipe(
        catchError(err => {
          this.logger.error('Error loading orders:', err);
          return of(this.getEmptyOrdersCollection());
        })
      ),
      inquiries: this.inquiryService.getInquiriesByClientCode(clientCode).pipe(
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
    localStorage.setItem('clientAdminHistoryTableConfig', JSON.stringify(config));
  }

  private viewItem(item: OrderInquiryItem): void {
    // Navigate to detail view based on source
    this.logger.debug('View item', { item });
  }

  private editItem(item: OrderInquiryItem): void {
    // Open edit dialog based on source
    this.logger.debug('Edit item', { item });
  }

  private deleteItem(item: OrderInquiryItem): void {
    // Show confirmation dialog
    this.logger.debug('Delete item', { item });
  }

  private exportItem(item: OrderInquiryItem): void {
    // Export to CSV/PDF
    this.logger.debug('Export item', { item });
  }
}
