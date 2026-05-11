import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import {
  InquiryOfferResponse,
  InquiryOffersCollection
} from '@models/api/inquiry-offer-api.model';

@Injectable({
  providedIn: 'root'
})
export class InquiryOfferService extends BaseHttpService {

  /**
   * Get all sent offers for an inquiry (only offers visible to client)
   */
  getSentOffersByInquiry(inquiryId: string): Observable<InquiryOffersCollection> {
    const params = this.buildArrayParams({
      'inquiry.id': inquiryId,
      'status': ['sent', 'accepted', 'rejected']
    });

    return this.getWithJsonLd<InquiryOffersCollection>(
      this.buildUrl('inquiry_offers'),
      params
    );
  }

  /**
   * Get a single offer by ID
   */
  getOffer(offerId: string): Observable<InquiryOfferResponse> {
    return this.getWithJsonLd<InquiryOfferResponse>(
      this.buildUrl('inquiry_offers', offerId)
    );
  }

  /**
   * Accept an offer (client action)
   */
  acceptOffer(offerId: string): Observable<InquiryOfferResponse> {
    return this.patchWithMergePatch<InquiryOfferResponse>(
      this.buildUrl('inquiry_offers', offerId, 'respond'),
      { status: 'accepted' }
    );
  }

  /**
   * Reject an offer with a reason (client action)
   */
  rejectOffer(offerId: string, rejectionReason: string): Observable<InquiryOfferResponse> {
    return this.patchWithMergePatch<InquiryOfferResponse>(
      this.buildUrl('inquiry_offers', offerId, 'respond'),
      { status: 'rejected', rejectionReason }
    );
  }

  /**
   * Download the offer PDF
   */
  downloadOfferPdf(offerId: string): Observable<Blob> {
    return this.getPdf(
      this.buildUrl('inquiry_offers', offerId, 'download-pdf')
    );
  }
}
