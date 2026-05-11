import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { InquiryService, InquiryResponse } from '@services/http/inquiry.service';
import { PartInfoRequestService } from '@services/http/part-info-request.service';
import { InquiryOfferService } from '@services/http/inquiry-offer.service';
import { AuthService } from '@core/auth/auth.service';
import { LogMessage } from '@core/models';
import { switchMap, finalize } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { environment } from '@env/environment';
import { LoggerService, ScopedLogger } from '@services/logger.service';
import { PartInfoRequestResponse } from '@models/api/part-info-request-api.model';
import { InquiryOfferResponse } from '@models/api/inquiry-offer-api.model';
import {
    InfoRequiredBannerComponent,
    InfoResponseModalComponent,
    InfoRequestsListComponent,
    InfoResponseSubmitData
} from '@shared/components/info-request';
import {
    OfferBannerComponent,
    OfferDetailModalComponent,
    OfferRejectModalComponent,
    OfferRejectData
} from '@shared/components/offer';

interface MediaItem {
  '@id': string;
  id: string;
  filename: string;
  mimeType: string;
  filePath: string;
}

interface Product {
  partNo: string;
  name: string;
  shortDescription: string;
  additionalNotes: string;
  mediaItems?: MediaItem[];
  quantity?: string;
}

interface Machine {
  id: string;
  name: string;
  machineNumber: string;
  notes: string;
  products: Product[];
  mediaItems?: MediaItem[]; // Machine-level files (Excel files)
  isOpen: boolean;
}


@Component({
    selector: 'app-inquiry-detail',
    imports: [
        CommonModule,
        BreadcrumbsComponent,
        IconComponent,
        RouterModule,
        InfoRequiredBannerComponent,
        InfoResponseModalComponent,
        InfoRequestsListComponent,
        OfferBannerComponent,
        OfferDetailModalComponent,
        OfferRejectModalComponent
    ],
    templateUrl: './inquiry-detail.component.html',
    styleUrls: ['./inquiry-detail.component.scss']
})
export class InquiryDetailComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private logger!: ScopedLogger;

  loading: boolean = true;
  error: string | null = null;

  inquiryId: string = '';
  inquiryNumber: string = '';
  internalReference: string = '';
  dateCreated: string = '';
  partsOrdered: number = 0;

  // Part Info Request states
  pendingInfoRequests: PartInfoRequestResponse[] = [];
  allInfoRequests: PartInfoRequestResponse[] = [];
  loadingInfoRequests: boolean = false;
  showResponseModal: boolean = false;
  selectedInfoRequest: PartInfoRequestResponse | null = null;
  savingResponse: boolean = false;
  showInfoRequestsList: boolean = false;
  modalReadOnly: boolean = false; // True when viewing history only

  // Offer states
  offers: InquiryOfferResponse[] = [];
  loadingOffers: boolean = false;
  pendingOffer: InquiryOfferResponse | null = null;
  showOfferDetailModal: boolean = false;
  showOfferRejectModal: boolean = false;
  selectedOffer: InquiryOfferResponse | null = null;
  savingOfferResponse: boolean = false;

  breadcrumbs = [
    { label: 'Loading...', link: '/my-inquiries/active' },
    { label: 'Loading...' },
  ];

  isDraft: boolean = false;

  status: string = '';
  statusClass: string = ''; // CSS-safe status class
  type: string = 'Manual Entry';

  machines: Machine[] = [];
  inquiryNotes: string = '';

  logMessages: LogMessage[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inquiryService: InquiryService,
    private partInfoRequestService: PartInfoRequestService,
    private inquiryOfferService: InquiryOfferService,
    private authService: AuthService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('InquiryDetailComponent');
  }

  ngOnInit(): void {
    // Check if this is a draft inquiry based on the URL
    this.isDraft = this.router.url.includes('/manual-entry/');

    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          this.error = 'No inquiry ID provided';
          this.loading = false;
          return of(null);
        }
        this.inquiryId = id;
        return this.inquiryService.getInquiryById(id);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        if (data) {
          this.processInquiryData(data);
          // Load info requests and offers after inquiry data is loaded
          this.loadInfoRequests();
          this.loadOffers();
        }
        this.loading = false;
      },
      error: (err) => {
        this.logger.error('Error loading inquiry:', err);
        this.error = 'Failed to load inquiry details';
        this.loading = false;
      }
    });
  }

  private processInquiryData(inquiry: InquiryResponse): void {
    this.inquiryNumber = inquiry.inquiryNumber || this.inquiryId;
    const statusInfo = this.normalizeStatus(inquiry.status);
    this.status = statusInfo.label;
    this.statusClass = statusInfo.cssClass;
    this.internalReference = inquiry.id;
    this.inquiryNotes = inquiry.notes || '';
    this.dateCreated = this.formatDate(inquiry.createdAt);

    // Update breadcrumbs based on whether this is a draft or active inquiry
    if (this.isDraft) {
      this.breadcrumbs = [
        { label: 'Drafts', link: '/my-inquiries/drafts' },
        { label: `Draft ${this.inquiryNumber}` },
      ];
    } else {
      this.breadcrumbs = [
        { label: 'Active Inquiries', link: '/my-inquiries/active' },
        { label: `Inquiry ${this.inquiryNumber}` },
      ];
    }

    // Map machines
    this.machines = inquiry.machines.map((machineData, index) => ({
      id: machineData.id,
      name: machineData.machine?.articleDescription || (machineData.customMachineId ? `Other/Older Machine` : 'Unknown Machine'),
      machineNumber: machineData.machine?.articleNumber || machineData.customMachineId || '-',
      notes: machineData.notes || '',
      mediaItems: machineData.mediaItems || [], // Machine-level files (Excel)
      products: machineData.products.map(product => ({
        partNo: product.partNumber || '-',
        name: product.partName || 'Unnamed Part',
        shortDescription: product.shortDescription || '',
        additionalNotes: product.additionalNotes || '',
        mediaItems: product.mediaItems || [], // Product-level files (images, PDFs)
        quantity: product.quantity || ''
      })),
      isOpen: index === 0 // Open first machine by default
    }));

    // Count total parts
    this.partsOrdered = this.machines.reduce((total, machine) => {
      return total + machine.products.length;
    }, 0);

    // Create log message for submission
    const currentUser = this.authService.getCurrentUser();
    const userName = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email || 'User'
      : 'User';

    this.logMessages = [
      {
        type: 'Inquiry',
        date: this.formatDate(inquiry.createdAt),
        time: this.formatTime(inquiry.createdAt),
        user: userName,
        message: 'Inquiry submitted'
      }
    ];
  }

  private normalizeStatus(status: string): { label: string; cssClass: string } {
    const normalizedKey = status.toLowerCase().replace(/-/g, '_');
    const statusMap: { [key: string]: { label: string; cssClass: string } } = {
      'draft': { label: 'Draft', cssClass: 'draft' },
      'submitted': { label: 'Submitted', cssClass: 'submitted' },
      'processing': { label: 'Processing', cssClass: 'processing' },
      'completed': { label: 'Completed', cssClass: 'completed' },
      'accepted': { label: 'Accepted', cssClass: 'accepted' },
      'cancelled': { label: 'Cancelled', cssClass: 'cancelled' },
      'canceled': { label: 'Cancelled', cssClass: 'cancelled' },
      'confirmed': { label: 'Confirmed', cssClass: 'confirmed' },
      'in_review': { label: 'In Review', cssClass: 'in_review' },
      'more_info': { label: 'More Info', cssClass: 'more_info' },
      'information_provided': { label: 'Information Provided', cssClass: 'information_provided' },
      'in_progress': { label: 'In Progress', cssClass: 'in_progress' },
      'dispatched': { label: 'Dispatched', cssClass: 'dispatched' }
    };
    return statusMap[normalizedKey] || { label: status, cssClass: normalizedKey };
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  private formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  goBack(): void {
    if (this.isDraft) {
      this.router.navigate(['/my-inquiries/drafts']);
    } else {
      this.router.navigate(['/my-inquiries/active']);
    }
  }

  toggleMachine(machine: Machine): void {
    machine.isOpen = !machine.isOpen;
  }

  getLogTypeBadgeClass(type: string): string {
    return `inquiry-detail__log-type--${type.toLowerCase()}`;
  }

  /**
   * Download a file
   */
  downloadFile(mediaItem: MediaItem): void {
    if (mediaItem.filePath) {
      const fileUrl = `${environment.apiBaseUrl}${mediaItem.filePath}`;
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = mediaItem.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Check if file is an Excel file
   */
  isExcelFile(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return ['xls', 'xlsx'].includes(extension || '');
  }

  /**
   * Check if file is a PDF
   */
  isPdfFile(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension === 'pdf';
  }

  /**
   * Check if file is an image
   */
  isImageFile(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '');
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(filename: string): string {
    if (this.isExcelFile(filename)) return 'fileSpreadsheet';
    if (this.isPdfFile(filename)) return 'filePdf';
    if (this.isImageFile(filename)) return 'fileImage';
    return 'file';
  }

  /**
   * Export the inquiry to PDF
   */
  exportInquiry(): void {
    if (!this.inquiryId) {
      this.logger.error('No inquiry ID available for export');
      return;
    }

    // Show loading state
    const exportButton = document.querySelector('.inquiry-detail__action-btn--export') as HTMLButtonElement;
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

    this.inquiryService.exportInquiryPdf(this.inquiryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (blob) => {
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;

        // Set filename with inquiry number and current date
        const date = new Date();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        a.download = `inquiry_${this.inquiryNumber}_${dateStr}.pdf`;

        // Trigger download
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        this.logger.info('Inquiry exported successfully');
      },
      error: (error) => {
        this.logger.error('Export error:', error);
        alert('Failed to export inquiry. Please try again.');
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

  // TrackBy functions for performance optimization
  trackByMachineId(index: number, machine: Machine): string {
    return machine.id;
  }

  trackByMediaItemId(index: number, mediaItem: MediaItem): string {
    return mediaItem.id;
  }

  trackByProductPartNo(index: number, product: Product): string {
    return product.partNo;
  }

  trackByLogIndex(index: number, log: LogMessage): number {
    return index;
  }

  // ========== Part Info Request Methods ==========

  /**
   * Load pending info requests for this inquiry
   */
  loadInfoRequests(): void {
    if (!this.inquiryId) return;

    this.loadingInfoRequests = true;

    forkJoin({
      pending: this.partInfoRequestService.getPendingInfoRequestsByInquiry(this.inquiryId),
      all: this.partInfoRequestService.getAllInfoRequestsByInquiry(this.inquiryId)
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingInfoRequests = false)
    ).subscribe({
      next: ({ pending, all }) => {
        this.pendingInfoRequests = pending.member || [];
        this.allInfoRequests = all.member || [];
        this.logger.info('Info requests loaded:', {
          pending: this.pendingInfoRequests.length,
          all: this.allInfoRequests.length
        });
      },
      error: (err) => {
        this.logger.error('Error loading info requests:', err);
      }
    });
  }

  /**
   * Check if inquiry has pending info requests
   */
  get hasPendingRequests(): boolean {
    return this.pendingInfoRequests.length > 0;
  }

  /**
   * Check if inquiry has any info requests (for viewing history)
   */
  get hasAnyInfoRequests(): boolean {
    return this.allInfoRequests.length > 0;
  }

  /**
   * Check if inquiry status indicates info is required
   */
  get isInfoRequired(): boolean {
    return this.status.toLowerCase() === 'more info' ||
           this.status.toLowerCase() === 'more_info';
  }

  /**
   * Handle viewing/responding to info requests.
   *
   * Pending requests need action, so route the user straight to the response form.
   * Only fall through to read-only history when there are no pending requests.
   */
  onViewAllRequests(): void {
    if (this.pendingInfoRequests.length === 1) {
      this.openModal(this.pendingInfoRequests[0], false);
      return;
    }
    if (this.pendingInfoRequests.length > 1) {
      this.showInfoRequestsList = true;
      return;
    }
    if (this.allInfoRequests.length === 1) {
      this.openModal(this.allInfoRequests[0], true);
      return;
    }
    this.showInfoRequestsList = true;
  }

  /**
   * Close the info requests list overlay
   */
  closeInfoRequestsList(): void {
    this.showInfoRequestsList = false;
  }

  /**
   * Handle opening response modal for a specific request
   */
  onOpenResponseModal(request: PartInfoRequestResponse): void {
    this.openModal(request, false);
  }

  /**
   * Open modal with specified mode (respond or view history)
   */
  private openModal(request: PartInfoRequestResponse, readOnly: boolean): void {
    // Load full request details including messages
    this.loadingInfoRequests = true;

    this.partInfoRequestService.getInfoRequest(request.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingInfoRequests = false)
      )
      .subscribe({
        next: (fullRequest) => {
          this.selectedInfoRequest = fullRequest;
          this.modalReadOnly = readOnly;
          this.showResponseModal = true;
        },
        error: (err) => {
          this.logger.error('Error loading info request details:', err);
          alert('Failed to load request details. Please try again.');
        }
      });
  }

  /**
   * Close the response modal
   */
  closeResponseModal(): void {
    this.showResponseModal = false;
    this.selectedInfoRequest = null;
    this.modalReadOnly = false;
  }

  /**
   * Handle response submission
   */
  onSubmitResponse(data: InfoResponseSubmitData): void {
    if (this.savingResponse) return;

    this.savingResponse = true;

    this.partInfoRequestService.submitClientResponse(data.infoRequest.id, {
      messageText: data.messageText,
      attachments: data.attachments
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.savingResponse = false)
    ).subscribe({
      next: (updatedRequest) => {
        this.logger.info('Response submitted successfully');

        // Update local data
        const index = this.pendingInfoRequests.findIndex(r => r.id === updatedRequest.id);
        if (index !== -1) {
          this.pendingInfoRequests.splice(index, 1);
        }

        // Update in all requests
        const allIndex = this.allInfoRequests.findIndex(r => r.id === updatedRequest.id);
        if (allIndex !== -1) {
          this.allInfoRequests[allIndex] = updatedRequest;
        }

        this.closeResponseModal();

        // Show success message
        alert('Your response has been submitted successfully. Deckard will review your information.');

        // Reload info requests to get fresh data
        this.loadInfoRequests();
      },
      error: (err) => {
        this.logger.error('Error submitting response:', err);
        alert('Failed to submit response. Please try again.');
      }
    });
  }

  /**
   * Handle viewing history of a request
   */
  onViewRequestHistory(request: PartInfoRequestResponse): void {
    // Open the modal in read-only mode to view history
    this.openModal(request, true);
  }

  /**
   * Track info request by ID
   */
  trackByInfoRequestId(index: number, request: PartInfoRequestResponse): string {
    return request.id;
  }

  // ========== Offer Methods ==========

  /**
   * Load offers for this inquiry
   */
  loadOffers(): void {
    if (!this.inquiryId) return;

    this.loadingOffers = true;

    this.inquiryOfferService.getSentOffersByInquiry(this.inquiryId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingOffers = false)
      )
      .subscribe({
        next: (response) => {
          this.offers = response.member || [];
          // Find the latest pending (sent) offer
          this.pendingOffer = this.offers.find(o => o.status === 'sent') || null;
          this.logger.info('Offers loaded:', {
            total: this.offers.length,
            pending: this.pendingOffer ? 1 : 0
          });
        },
        error: (err) => {
          this.logger.error('Error loading offers:', err);
        }
      });
  }

  /**
   * Check if there's a pending offer to show the banner
   */
  get hasPendingOffer(): boolean {
    return this.pendingOffer !== null;
  }

  /**
   * Check if there are any offers (for history display)
   */
  get hasAnyOffers(): boolean {
    return this.offers.length > 0;
  }

  /**
   * Get non-pending (responded) offers for history display
   */
  get respondedOffers(): InquiryOfferResponse[] {
    return this.offers.filter(o => o.status !== 'sent');
  }

  /**
   * Handle viewing an offer from the banner
   */
  onViewOffer(offer: InquiryOfferResponse): void {
    this.selectedOffer = offer;
    this.showOfferDetailModal = true;
  }

  /**
   * Close the offer detail modal
   */
  closeOfferDetailModal(): void {
    this.showOfferDetailModal = false;
    this.selectedOffer = null;
  }

  /**
   * Handle accept offer from detail modal
   */
  onAcceptOffer(offer: InquiryOfferResponse): void {
    if (this.savingOfferResponse) return;

    if (!confirm('Are you sure you want to accept this offer? This action cannot be undone.')) {
      return;
    }

    this.savingOfferResponse = true;

    this.inquiryOfferService.acceptOffer(offer.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.savingOfferResponse = false)
      )
      .subscribe({
        next: () => {
          this.logger.info('Offer accepted successfully');
          this.closeOfferDetailModal();
          alert('Offer accepted successfully. Deckard has been notified.');
          this.loadOffers();
          // Backend auto-flips inquiry status to "accepted" on offer accept;
          // re-fetch so the status badge reflects the new state without a page refresh.
          this.reloadInquiryStatus();
        },
        error: (err) => {
          this.logger.error('Error accepting offer:', err);
          alert('Failed to accept offer. Please try again.');
        }
      });
  }

  /**
   * Re-fetch the inquiry to refresh status (e.g., after offer accept/reject which
   * trigger backend status flips).
   */
  private reloadInquiryStatus(): void {
    if (!this.inquiryId) return;
    this.inquiryService.getInquiryById(this.inquiryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data) {
            this.processInquiryData(data);
          }
        },
        error: (err) => this.logger.error('Failed to reload inquiry status:', err)
      });
  }

  /**
   * Handle reject offer - opens the reject modal
   */
  onRejectOffer(offer: InquiryOfferResponse): void {
    this.selectedOffer = offer;
    this.showOfferDetailModal = false;
    this.showOfferRejectModal = true;
  }

  /**
   * Close the reject modal
   */
  closeOfferRejectModal(): void {
    this.showOfferRejectModal = false;
    // Don't clear selectedOffer here in case user wants to go back to detail
  }

  /**
   * Handle confirmed rejection with reason
   */
  onConfirmReject(data: OfferRejectData): void {
    if (this.savingOfferResponse) return;

    this.savingOfferResponse = true;

    this.inquiryOfferService.rejectOffer(data.offer.id, data.rejectionReason)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.savingOfferResponse = false)
      )
      .subscribe({
        next: () => {
          this.logger.info('Offer rejected successfully');
          this.showOfferRejectModal = false;
          this.selectedOffer = null;
          alert('Offer rejected. Deckard has been notified and may send a revised offer.');
          this.loadOffers();
        },
        error: (err) => {
          this.logger.error('Error rejecting offer:', err);
          alert('Failed to reject offer. Please try again.');
        }
      });
  }

  /**
   * Get status display text for an offer
   */
  getOfferStatusDisplay(status: string): string {
    const labels: Record<string, string> = {
      sent: 'Pending Review',
      accepted: 'Accepted',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  }

  /**
   * Get status CSS class for an offer
   */
  getOfferStatusClass(status: string): string {
    return `offer-status--${status}`;
  }

  /**
   * Format date for offer display
   */
  formatOfferDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Track offer by ID
   */
  trackByOfferId(index: number, offer: InquiryOfferResponse): string {
    return offer.id;
  }
}
