/**
 * API interfaces for Inquiry Offer-related requests and responses
 * Used when admin sends a priced offer for an inquiry and client can accept/reject
 */

export type InquiryOfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

/** Embedded media item in offer response */
export interface OfferMediaItemResponse {
  '@id': string;
  '@type': string;
  id: string;
  filename: string;
  mimeType: string;
  filePath: string;
}

/** Embedded machine part reference in offer item */
export interface OfferMachinePartResponse {
  '@id': string;
  '@type': string;
  id: string;
  partNumber: string;
  partName: string;
}

/** API response for a single offer item (line item) */
export interface InquiryOfferItemResponse {
  '@id': string;
  '@type': string;
  id: string;
  inquiryMachinePart: OfferMachinePartResponse;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  createdAt: string;
}

/** API response for a single inquiry offer */
export interface InquiryOfferResponse {
  '@id': string;
  '@type': string;
  id: string;
  inquiry?: string;
  offerNumber: string;
  status: InquiryOfferStatus;
  notes?: string;
  totalAmount: number;
  pdfDocument?: OfferMediaItemResponse;
  rejectionReason?: string;
  respondedAt?: string;
  createdBy?: {
    '@id': string;
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt?: string;
  items: InquiryOfferItemResponse[];
  itemCount: number;
}

/** Collection response for inquiry offers */
export interface InquiryOffersCollection {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: InquiryOfferResponse[];
}

/** Request payload for client accepting an offer */
export interface AcceptOfferPayload {
  status: 'accepted';
}

/** Request payload for client rejecting an offer */
export interface RejectOfferPayload {
  status: 'rejected';
  rejectionReason: string;
}
