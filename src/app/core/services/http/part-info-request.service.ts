import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import {
  PartInfoRequestResponse,
  PartInfoRequestsCollection,
  ClientInfoResponsePayload,
  InfoRequestMessageResponse
} from '@models/api/part-info-request-api.model';

@Injectable({
  providedIn: 'root'
})
export class PartInfoRequestService extends BaseHttpService {

  /**
   * Get all pending info requests for an inquiry
   */
  getPendingInfoRequestsByInquiry(inquiryId: string): Observable<PartInfoRequestsCollection> {
    const params = this.buildArrayParams({
      'inquiry.id': inquiryId,
      'status': ['pending', 'needs_revision']
    });

    return this.getWithJsonLd<PartInfoRequestsCollection>(
      this.buildUrl('inquiry_part_info_requests'),
      params
    );
  }

  /**
   * Get all info requests for an inquiry (including responded/accepted)
   */
  getAllInfoRequestsByInquiry(inquiryId: string): Observable<PartInfoRequestsCollection> {
    const params = this.buildParams({
      'inquiry.id': inquiryId
    });

    return this.getWithJsonLd<PartInfoRequestsCollection>(
      this.buildUrl('inquiry_part_info_requests'),
      params
    );
  }

  /**
   * Get a single info request by ID with full message thread
   */
  getInfoRequest(infoRequestId: string): Observable<PartInfoRequestResponse> {
    return this.getWithJsonLd<PartInfoRequestResponse>(
      this.buildUrl('inquiry_part_info_requests', infoRequestId)
    );
  }

  /**
   * Submit a response to an info request (client action)
   */
  respondToInfoRequest(
    infoRequestId: string,
    payload: ClientInfoResponsePayload
  ): Observable<InfoRequestMessageResponse> {
    const body = {
      infoRequest: `/api/v1/inquiry_part_info_requests/${infoRequestId}`,
      messageText: payload.messageText,
      senderType: 'client',
      mediaItems: payload.attachments || []
    };

    return this.postWithJsonLd<InfoRequestMessageResponse>(
      this.buildUrl('inquiry_part_info_messages'),
      body
    );
  }

  /**
   * Mark info request as responded (updates status after client submits response)
   */
  markAsResponded(infoRequestId: string): Observable<PartInfoRequestResponse> {
    return this.patchWithMergePatch<PartInfoRequestResponse>(
      this.buildUrl('inquiry_part_info_requests', infoRequestId),
      { status: 'responded' }
    );
  }

  /**
   * Combined method to submit response and update status
   */
  submitClientResponse(
    infoRequestId: string,
    payload: ClientInfoResponsePayload
  ): Observable<PartInfoRequestResponse> {
    // First add the message, then update status
    return new Observable(observer => {
      this.respondToInfoRequest(infoRequestId, payload).subscribe({
        next: () => {
          // After message is added, mark as responded
          this.markAsResponded(infoRequestId).subscribe({
            next: (response) => {
              observer.next(response);
              observer.complete();
            },
            error: (err) => observer.error(err)
          });
        },
        error: (err) => observer.error(err)
      });
    });
  }
}
