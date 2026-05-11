import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { catchError, finalize } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrderService, OrderResponse } from '@services/http/order.service';
import { AuthService } from '@core/auth/auth.service';
import { InquiryService, InquiryResponse } from '@services/http/inquiry.service';
import { DataMapperService, DraftListItem } from '@services/data-mapper.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-client-admin-pending-approvals',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent, IconComponent],
  templateUrl: './client-admin-pending-approvals.component.html',
  styleUrls: ['./client-admin-pending-approvals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAdminPendingApprovalsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private logger!: ScopedLogger;

  breadcrumbs = [
    { label: 'Client Admin', link: '/client-admin' },
    { label: 'Pending Approvals' }
  ];

  pendingItems: DraftListItem[] = [];
  isLoading = false;
  error: string | null = null;
  sortField: string = 'dateCreated';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private orderService: OrderService,
    private inquiryService: InquiryService,
    private authService: AuthService,
    private router: Router,
    private dataMapper: DataMapperService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('ClientAdminPendingApprovalsComponent');
  }

  ngOnInit(): void {
    this.loadPendingItems();
  }

  loadPendingItems(): void {
    this.isLoading = true;
    this.error = null;

    if (!this.authService.isAuthenticated()) {
      this.error = 'User not authenticated';
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.error = 'User information not available';
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    const clientCode = currentUser.client?.code;

    if (!clientCode) {
      this.error = 'Client information not available';
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    forkJoin({
      orders: this.orderService.getPendingApprovalOrdersByClientCode(clientCode).pipe(
        catchError(err => {
          this.logger.error('Error loading pending approval orders', err);
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
      inquiries: this.inquiryService.getPendingApprovalInquiriesByClientCode(clientCode).pipe(
        catchError(err => {
          this.logger.error('Error loading pending approval inquiries', err);
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
        this.pendingItems = [];

        if (orders.member && orders.member.length > 0) {
          const mappedOrders = orders.member.map(order => this.dataMapper.mapOrderToDraftListItem(order));
          this.pendingItems.push(...mappedOrders);
        }

        if (inquiries.member && inquiries.member.length > 0) {
          const mappedInquiries = inquiries.member.map(inquiry => this.dataMapper.mapInquiryToDraftListItem(inquiry));
          this.pendingItems.push(...mappedInquiries);
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
    this.pendingItems.sort((a, b) => {
      let aValue: string | number = a[this.sortField as keyof DraftListItem] as string | number;
      let bValue: string | number = b[this.sortField as keyof DraftListItem] as string | number;

      if (this.sortField === 'customer') {
        aValue = a.customer.name;
        bValue = b.customer.name;
      }

      if (this.sortField === 'dateCreated') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

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

  onApprove(item: DraftListItem): void {
    if (confirm(`Are you sure you want to approve this ${item.type.toLowerCase()}?`)) {
      const onSuccess = () => {
        this.logger.debug('Item approved successfully', { type: item.type.toLowerCase() });
        this.loadPendingItems();
      };
      const onError = (err: unknown) => {
        this.logger.error('Error approving item', { type: item.type.toLowerCase(), error: err });
        alert(`Failed to approve ${item.type.toLowerCase()}. Please try again.`);
      };

      if (item.type === 'Order') {
        this.orderService.approveOrder(item.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: onSuccess, error: onError });
      } else {
        this.inquiryService.approveInquiry(item.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: onSuccess, error: onError });
      }
    }
  }

  onDelete(item: DraftListItem): void {
    if (confirm(`Are you sure you want to delete this ${item.type.toLowerCase()}?`)) {
      const deleteObservable = item.type === 'Order'
        ? this.orderService.deleteOrder(item.id)
        : this.inquiryService.deleteInquiry(item.id);

      deleteObservable
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.logger.debug('Item deleted successfully', { type: item.type.toLowerCase() });
            this.loadPendingItems();
          },
          error: (err) => {
            this.logger.error('Error deleting item', { type: item.type.toLowerCase(), error: err });
            alert(`Failed to delete ${item.type.toLowerCase()}. Please try again.`);
          }
        });
    }
  }
}
