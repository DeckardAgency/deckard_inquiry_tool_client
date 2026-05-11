import { Component, Input, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InquiryShimmerComponent } from '@shared/components/inquiry-table/inquiry-shimmer.component';
import { InquiryHistory } from '@core/models';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-inquiry-table',
  imports: [CommonModule, InquiryShimmerComponent],
  templateUrl: './inquiry-table.component.html',
  styleUrls: ['./inquiry-table.component.scss']
})
export class InquiryTableComponent implements OnInit, OnChanges {
  @Input() inquiries: InquiryHistory[] = [];
  @Input() loading: boolean = false;

  tabs = ['Latest', 'Completed', 'Cancelled'];
  activeTab = 'Latest';
  filteredInquiries: InquiryHistory[] = [];
  openMenuId: string | null = null;

  readonly statusLabelMap: Record<string, string> = {
    'submitted': 'Submitted',
    'in_review': 'In Review',
    'more_info': 'More Info',
    'information_provided': 'Information Provided',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'accepted': 'Accepted',
    'canceled': 'Canceled',
    'cancelled': 'Cancelled',
    'dispatched': 'Dispatched',
    'confirmed': 'Confirmed',
    'pending_approval': 'Pending Approval',
    'draft': 'Draft',
    'processing': 'Processing'
  };

  private logger!: ScopedLogger;

  constructor(
    private router: Router,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('InquiryTableComponent');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close menu when clicking outside
    this.closeMenu();
  }

  ngOnInit(): void {
    this.filterInquiries();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inquiries']) {
      this.filterInquiries();
    }
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.filterInquiries();
  }

  filterInquiries(): void {
    if (this.activeTab === 'Latest') {
      // Latest: show all items except cancelled, limit to 30
      this.filteredInquiries = this.inquiries
        .filter(inquiry => inquiry.status !== 'Cancelled')
        .slice(0, 30);
    } else if (this.activeTab === 'Completed') {
      this.filteredInquiries = this.inquiries.filter(inquiry => inquiry.status === 'Completed');
    } else if (this.activeTab === 'Cancelled') {
      this.filteredInquiries = this.inquiries.filter(inquiry => inquiry.status === 'Cancelled');
    }
  }

  get hasData(): boolean {
    return !this.loading && this.inquiries.length > 0;
  }

  toggleMenu(inquiryId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === inquiryId ? null : inquiryId;
  }

  isMenuOpen(inquiryId: string): boolean {
    return this.openMenuId === inquiryId;
  }

  closeMenu(): void {
    this.openMenuId = null;
  }

  viewInquiry(inquiry: InquiryHistory, event: Event): void {
    event.stopPropagation();
    this.closeMenu();

    // Determine the route based on type
    if (inquiry.type === 'Order') {
      // Navigate to order detail view
      this.router.navigate(['/my-inquiries/active/order', inquiry.id, 'view']);
    } else if (inquiry.type === 'Inquiry') {
      // Navigate to inquiry detail view
      this.router.navigate(['/my-inquiries/active/inquiry', inquiry.id, 'view']);
    } else {
      // Fallback: try to determine from ID or default to order
      this.logger.warn('Inquiry type not specified, defaulting to order view');
      this.router.navigate(['/my-inquiries/active/order', inquiry.id, 'view']);
    }
  }

  // TrackBy functions for performance
  trackByIndex(index: number): number {
    return index;
  }

  trackByInquiryId(index: number, inquiry: InquiryHistory): string {
    return inquiry.id;
  }

  getStatusLabel(status: string): string {
    const normalizedStatus = status?.toLowerCase().replace(/-/g, '_');
    return this.statusLabelMap[normalizedStatus] || status;
  }

  getStatusClass(status: string): string {
    return 'status-badge--' + status?.toLowerCase().split(' ').join('_').split('-').join('_');
  }
}
