import { Component, OnInit, inject, DestroyRef, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { InquiryListComponent } from '@shared/components/inquiry-list/inquiry-list.component';
import { InquiryTableComponent } from '@shared/components/inquiry-table/inquiry-table.component';
import { OrderService } from '@services/http/order.service';
import { InquiryService } from '@services/http/inquiry.service';
import { AuthService } from '@core/auth/auth.service';
import { DataMapperService, HistoryItem } from '@services/data-mapper.service';
import { catchError, finalize, forkJoin } from 'rxjs';
import { of } from 'rxjs';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-my-inquiries',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    IconComponent,
    InquiryListComponent,
    InquiryTableComponent
  ],
  templateUrl: './my-inquiries.component.html',
  styleUrls: ['./my-inquiries.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyInquiriesComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private logger!: ScopedLogger;

  breadcrumbs = [
    { label: 'My Inquiries' }
  ];

  // History section state
  historyLoading = signal(true);
  historyError = signal<string | null>(null);
  historyItems = signal<HistoryItem[]>([]);

  constructor(
    private orderService: OrderService,
    private inquiryService: InquiryService,
    private authService: AuthService,
    private dataMapper: DataMapperService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('MyInquiriesComponent');
  }

  ngOnInit(): void {
    this.loadHistoryData();
  }

  loadHistoryData(): void {
    this.historyLoading.set(true);
    this.historyError.set(null);

    if (!this.authService.isAuthenticated()) {
      this.historyError.set('User not authenticated');
      this.historyLoading.set(false);
      return;
    }

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.email) {
      this.historyError.set('User information not available');
      this.historyLoading.set(false);
      return;
    }

    forkJoin({
      orders: this.orderService.getOrdersHistoryByUserEmail(currentUser.email).pipe(
        catchError(err => {
          this.logger.error('Error loading orders:', err);
          return of({
            '@context': '',
            '@id': '',
            '@type': '',
            'totalItems': 0,
            'member': [],
            'view': null
          });
        })
      ),
      inquiries: this.inquiryService.getInquiriesHistoryByUserEmail(currentUser.email).pipe(
        catchError(err => {
          this.logger.error('Error loading inquiries:', err);
          return of({
            '@context': '',
            '@id': '',
            '@type': '',
            'totalItems': 0,
            'member': [],
            'view': null
          });
        })
      )
    })
      .pipe(
        finalize(() => {
          this.historyLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ orders, inquiries }) => {
        const items: HistoryItem[] = [];

        // Map orders to HistoryItems
        if (orders.member && orders.member.length > 0) {
          const mappedOrders = orders.member.map(order => this.dataMapper.mapOrderToHistoryItem(order));
          items.push(...mappedOrders);
        }

        // Map inquiries to HistoryItems
        if (inquiries.member && inquiries.member.length > 0) {
          const mappedInquiries = inquiries.member.map(inquiry => this.dataMapper.mapInquiryToHistoryItem(inquiry));
          items.push(...mappedInquiries);
        }

        // Sort all items by date descending
        items.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());

        this.historyItems.set(items);
      });
  }

  retryHistory(): void {
    this.loadHistoryData();
  }
}
