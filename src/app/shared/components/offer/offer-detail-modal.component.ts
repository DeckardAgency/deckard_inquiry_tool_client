import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { InquiryOfferResponse } from '@models/api/inquiry-offer-api.model';
import { InquiryOfferService } from '@services/http/inquiry-offer.service';
import { environment } from '@env/environment';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-offer-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offer-detail-modal.component.html',
  styleUrls: ['./offer-detail-modal.component.scss']
})
export class OfferDetailModalComponent implements OnChanges {
  private inquiryOfferService = inject(InquiryOfferService);
  private destroyRef = inject(DestroyRef);

  @Input() isOpen: boolean = false;
  @Input() offer: InquiryOfferResponse | null = null;
  @Input() saving: boolean = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() acceptOffer = new EventEmitter<InquiryOfferResponse>();
  @Output() rejectOffer = new EventEmitter<InquiryOfferResponse>();
  @Output() downloadPdf = new EventEmitter<InquiryOfferResponse>();

  downloadingPdf: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.downloadingPdf = false;
    }
  }

  onClose(): void {
    if (!this.saving) {
      this.closeModal.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  onAccept(): void {
    if (this.offer && !this.saving) {
      this.acceptOffer.emit(this.offer);
    }
  }

  onReject(): void {
    if (this.offer && !this.saving) {
      this.rejectOffer.emit(this.offer);
    }
  }

  onDownloadPdf(): void {
    if (!this.offer || this.downloadingPdf) return;

    this.downloadingPdf = true;
    this.inquiryOfferService.downloadOfferPdf(this.offer.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = this.offer?.pdfDocument?.filename || `offer_${this.offer?.offerNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          this.downloadingPdf = false;
        },
        error: () => {
          alert('Failed to download PDF. Please try again.');
          this.downloadingPdf = false;
        }
      });
  }

  get isSent(): boolean {
    return this.offer?.status === 'sent';
  }

  get isAccepted(): boolean {
    return this.offer?.status === 'accepted';
  }

  get isRejected(): boolean {
    return this.offer?.status === 'rejected';
  }

  get statusLabel(): string {
    if (!this.offer) return '';
    const labels: Record<string, string> = {
      sent: 'Pending Review',
      accepted: 'Accepted',
      rejected: 'Rejected'
    };
    return labels[this.offer.status] || this.offer.status;
  }

  get statusClass(): string {
    return this.offer?.status || '';
  }

  get hasPdf(): boolean {
    return !!this.offer?.pdfDocument;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
