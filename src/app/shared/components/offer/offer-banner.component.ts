import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InquiryOfferResponse } from '@models/api/inquiry-offer-api.model';

@Component({
  selector: 'app-offer-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offer-banner.component.html',
  styleUrls: ['./offer-banner.component.scss']
})
export class OfferBannerComponent {
  @Input() pendingOffer: InquiryOfferResponse | null = null;

  @Output() viewOffer = new EventEmitter<InquiryOfferResponse>();

  get offerNumber(): string {
    return this.pendingOffer?.offerNumber || '';
  }

  get totalAmount(): number {
    return this.pendingOffer?.totalAmount || 0;
  }

  get itemCount(): number {
    return this.pendingOffer?.itemCount || this.pendingOffer?.items?.length || 0;
  }

  onViewOffer(): void {
    if (this.pendingOffer) {
      this.viewOffer.emit(this.pendingOffer);
    }
  }
}
