import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { SupportTicketResponse, SupportTicketCollectionResponse } from '@models/support-ticket.model';

@Injectable({
  providedIn: 'root'
})
export class SupportTicketService extends BaseHttpService {
  /**
   * Create a new support ticket
   * @param formData - FormData object containing ticket details and optional file attachment
   */
  createSupportTicket(formData: FormData): Observable<SupportTicketResponse> {
    // Use http directly for multipart/form-data - browser sets Content-Type with boundary
    return this.http.post<SupportTicketResponse>(
      this.buildUrl('support_tickets'),
      formData
    );
  }

  /**
   * Get all support tickets for the current user
   */
  getUserSupportTickets(): Observable<SupportTicketCollectionResponse> {
    return this.getWithJsonLd<SupportTicketCollectionResponse>(
      this.buildUrl('support_tickets')
    );
  }

  /**
   * Get a specific support ticket by ID
   */
  getSupportTicket(id: string): Observable<SupportTicketResponse> {
    return this.getWithJsonLd<SupportTicketResponse>(
      this.buildUrl('support_tickets', id)
    );
  }

  /**
   * Update support ticket status (admin only)
   */
  updateSupportTicketStatus(id: string, status: 'open' | 'in_progress' | 'resolved' | 'closed'): Observable<SupportTicketResponse> {
    return this.patchWithJsonLd<SupportTicketResponse>(
      this.buildUrl('support_tickets', id),
      { status }
    );
  }
}
