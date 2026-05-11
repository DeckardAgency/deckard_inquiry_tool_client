import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InquiryOfferResponse } from '@models/api/inquiry-offer-api.model';

export interface OfferRejectData {
  offer: InquiryOfferResponse;
  rejectionReason: string;
}

@Component({
  selector: 'app-offer-reject-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offer-reject-modal.component.html',
  styleUrls: ['./offer-reject-modal.component.scss']
})
export class OfferRejectModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() offer: InquiryOfferResponse | null = null;
  @Input() saving: boolean = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() confirmReject = new EventEmitter<OfferRejectData>();

  rejectionReason: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.rejectionReason = '';
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

  onSubmit(): void {
    if (!this.offer || !this.isValid) return;

    this.confirmReject.emit({
      offer: this.offer,
      rejectionReason: this.rejectionReason.trim()
    });
  }

  get isValid(): boolean {
    return this.rejectionReason.trim().length > 0;
  }
}
