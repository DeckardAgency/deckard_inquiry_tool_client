import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { InquiryTableComponent } from '@shared/components/inquiry-table/inquiry-table.component';
import { OrderService } from '@services/http/order.service';
import { InquiryService } from '@services/http/inquiry.service';
import { AuthService } from '@core/auth/auth.service';
import { DataMapperService, HistoryItem } from '@services/data-mapper.service';
import { catchError, finalize, forkJoin } from 'rxjs';
import { of } from 'rxjs';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent, IconComponent, InquiryTableComponent],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private logger!: ScopedLogger;

  loading = true;
  error: string | null = null;

  breadcrumbs = [
    { label: 'My Orders', link: '/my-orders' },
    { label: 'History' }
  ];

  allHistoryItems: HistoryItem[] = [];

  constructor(
    private orderService: OrderService,
    private inquiryService: InquiryService,
    private authService: AuthService,
    private dataMapper: DataMapperService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('OrderHistoryComponent');
  }

  ngOnInit(): void {
    this.loadHistoryData();
  }

  loadHistoryData(): void {
    this.loading = true;
    this.error = null;

    if (!this.authService.isAuthenticated()) {
      this.error = 'User not authenticated';
      this.loading = false;
      return;
    }

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.email) {
      this.error = 'User information not available';
      this.loading = false;
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
            'view': { '@id': '', '@type': '' },
            'search': { '@type': '', 'template': '', 'variableRepresentation': '', 'mapping': [] }
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
            'view': { '@id': '', '@type': '' },
            'search': { '@type': '', 'template': '', 'variableRepresentation': '', 'mapping': [] }
          });
        })
      )
    })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ orders, inquiries }) => {
        const historyItems: HistoryItem[] = [];

        // Map orders to HistoryItems using DataMapperService
        if (orders.member && orders.member.length > 0) {
          const mappedOrders = orders.member.map(order => this.dataMapper.mapOrderToHistoryItem(order));
          historyItems.push(...mappedOrders);
        }

        // Map inquiries to HistoryItems using DataMapperService
        if (inquiries.member && inquiries.member.length > 0) {
          const mappedInquiries = inquiries.member.map(inquiry => this.dataMapper.mapInquiryToHistoryItem(inquiry));
          historyItems.push(...mappedInquiries);
        }

        if (historyItems.length === 0) {
          this.error = 'No history items found';
          return;
        }

        // Sort all items by date descending
        historyItems.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());

        // Store all items - inquiry-table will handle tab filtering
        this.allHistoryItems = historyItems;
      });
  }

  get hasHistoryItems(): boolean {
    return this.allHistoryItems.length > 0;
  }

  retry(): void {
    this.loadHistoryData();
  }
}
