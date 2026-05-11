import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import {
  InquiryProduct,
  InquiryMachine,
  InquiryRequest,
  InquiryResponse,
  InquiriesCollection
} from '@models/api/inquiry-api.model';

// Re-export for backward compatibility
export type {
  InquiryProduct,
  InquiryMachine,
  InquiryRequest,
  InquiryResponse,
  InquiriesCollection
};

@Injectable({
  providedIn: 'root'
})
export class InquiryService extends BaseHttpService {

  /**
   * Create a new inquiry
   */
  createInquiry(inquiryData: InquiryRequest): Observable<InquiryResponse> {
    return this.postWithJsonLd<InquiryResponse>(
      this.buildUrl('inquiries'),
      inquiryData
    );
  }

  /**
   * Save inquiry as draft
   */
  saveDraft(inquiryData: InquiryRequest): Observable<InquiryResponse> {
    // Ensure the status is set to draft
    inquiryData.status = 'draft';
    inquiryData.isDraft = true;

    return this.postWithJsonLd<InquiryResponse>(
      this.buildUrl('inquiries'),
      inquiryData
    );
  }

  /**
   * Submit a draft inquiry (converts it to submitted status)
   */
  submitDraft(inquiryId: string): Observable<InquiryResponse> {
    return this.postWithJsonLd<InquiryResponse>(
      this.buildUrl('inquiries', inquiryId, 'submit'),
      {}
    );
  }

  /**
   * Get inquiry details by ID
   */
  getInquiryById(inquiryId: string): Observable<InquiryResponse> {
    return this.getWithJsonLd<InquiryResponse>(
      this.buildUrl('inquiries', inquiryId)
    );
  }

  /**
   * Get all inquiries by user email with pagination support
   */
  getInquiriesByUserEmail(
    email: string,
    options?: { page?: number; itemsPerPage?: number; status?: string; search?: string; sort?: string }
  ): Observable<InquiriesCollection> {
    const filters: Record<string, string | boolean | undefined> = {
      isDraft: false
    };

    // Handle sorting
    if (options?.sort) {
      switch (options.sort) {
        case 'date-asc':
          filters['order[createdAt]'] = 'asc';
          break;
        case 'number-asc':
          filters['order[inquiryNumber]'] = 'asc';
          break;
        case 'number-desc':
          filters['order[inquiryNumber]'] = 'desc';
          break;
        case 'date-desc':
        default:
          filters['order[createdAt]'] = 'desc';
          break;
      }
    } else {
      filters['order[createdAt]'] = 'desc';
    }

    if (options?.page) {
      filters['page'] = options.page.toString();
    }
    if (options?.itemsPerPage) {
      filters['itemsPerPage'] = options.itemsPerPage.toString();
    }
    if (options?.status && options.status !== 'all') {
      filters['status'] = options.status;
    }
    if (options?.search) {
      filters['inquiryNumber'] = options.search;
    }

    const params = this.buildUserFilterParams(email, filters);
    return this.getWithJsonLd<InquiriesCollection>(
      this.buildUrl('inquiries'),
      params
    );
  }

  /**
   * Get draft inquiries by user email
   */
  getDraftInquiriesByUserEmail(email: string): Observable<InquiriesCollection> {
    const params = this.buildUserFilterParams(email, { status: 'draft' });

    return this.getWithJsonLd<InquiriesCollection>(
      this.buildUrl('inquiries'),
      params
    );
  }

  /**
   * Get submitted inquiries by user email
   */
  getSubmittedInquiriesByUserEmail(email: string): Observable<InquiriesCollection> {
    const params = this.buildUserFilterParams(email, {
      isDraft: false,
      status: 'submitted'
    });

    return this.getWithJsonLd<InquiriesCollection>(
      this.buildUrl('inquiries'),
      params
    );
  }

  /**
   * Get all inquiries for history by user email (includes submitted, confirmed, completed, etc.)
   */
  getInquiriesHistoryByUserEmail(email: string): Observable<InquiriesCollection> {
    // Don't filter by status - we want all submitted/confirmed/completed inquiries
    const params = this.buildUserFilterParams(email, { isDraft: false });

    return this.getWithJsonLd<InquiriesCollection>(
      this.buildUrl('inquiries'),
      params
    );
  }

  /**
   * Delete an inquiry by ID
   */
  deleteInquiry(inquiryId: string): Observable<void> {
    return this.deleteWithJsonLd<void>(
      this.buildUrl('inquiries', inquiryId)
    );
  }

  /**
   * Get draft inquiries by client code (for client admin view)
   */
  getDraftInquiriesByClientCode(clientCode: string): Observable<InquiriesCollection> {
    const params = this.buildParams({
      'user.client.code': clientCode,
      status: 'draft'
    });

    return this.getWithJsonLd<InquiriesCollection>(
      this.buildUrl('inquiries'),
      params
    );
  }

  /**
   * Get all inquiries by client code (for client admin history view)
   */
  getInquiriesByClientCode(clientCode: string): Observable<InquiriesCollection> {
    const params = this.buildParams({
      'user.client.code': clientCode,
      isDraft: false
    });

    return this.getWithJsonLd<InquiriesCollection>(
      this.buildUrl('inquiries'),
      params
    );
  }

  /**
   * Get pending approval inquiries by client code (for client admin view)
   */
  getPendingApprovalInquiriesByClientCode(clientCode: string): Observable<InquiriesCollection> {
    const params = this.buildParams({
      'user.client.code': clientCode,
      status: 'pending_approval'
    });

    return this.getWithJsonLd<InquiriesCollection>(
      this.buildUrl('inquiries'),
      params
    );
  }

  /**
   * Approve a pending inquiry (client admin action)
   */
  approveInquiry(inquiryId: string): Observable<InquiryResponse> {
    return this.postWithJsonLd<InquiryResponse>(
      this.buildUrl('inquiries', inquiryId, 'approve'),
      {}
    );
  }

  /**
   * Export inquiry as PDF
   */
  exportInquiryPdf(inquiryId: string): Observable<Blob> {
    return this.getPdf(
      this.buildUrl('inquiries', inquiryId, 'export', 'pdf')
    );
  }
}
