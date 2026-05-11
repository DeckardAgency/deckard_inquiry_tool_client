/**
 * API interfaces for Inquiry-related requests and responses
 * Moved from inquiry.service.ts to follow Angular best practices
 */

import { UserEmbedded } from './order-api.model';

/** Request payload for creating/updating products in an inquiry */
export interface InquiryProduct {
  partName: string;
  partNumber: string;
  shortDescription: string;
  additionalNotes: string;
  mediaItems?: string[]; // Array of MediaItem IRIs (e.g., ['/api/v1/media_items/123'])
  quantity?: string; // Optional quantity field
}

/** Request payload for creating/updating machines in an inquiry */
export interface InquiryMachine {
  machine: string | null;
  customMachineId?: string | null;
  notes: string;
  products: InquiryProduct[];
  mediaItems?: string[]; // Array of MediaItem IRIs for machine-level files (e.g., Excel files)
  onBehalfOfClient?: string; // IRI: /api/v1/clients/{id}
}

/** Request payload for creating/updating an inquiry */
export interface InquiryRequest {
  status: string;
  notes: string;
  contactEmail: string;
  contactPhone: string;
  isDraft: boolean;
  user: string;
  machines: InquiryMachine[];
  onBehalfOfClient?: string;
}

/** API response for a single product in an inquiry */
export interface InquiryProductResponse {
  '@id': string;
  '@type': string;
  id: string;
  partName: string;
  partNumber: string;
  shortDescription: string;
  additionalNotes: string;
  mediaItems?: Array<{
    '@id': string;
    '@type': string;
    id: string;
    filename: string;
    mimeType: string;
    filePath: string;
  }>;
  quantity?: string;
}

/** API response for a single machine in an inquiry */
export interface InquiryMachineResponse {
  '@id': string;
  '@type': string;
  id: string;
  machine?: {
    '@id': string;
    '@type': string;
    id: string;
    articleDescription: string;
    articleNumber: string;
  } | null;
  customMachineId?: string | null;
  notes: string;
  products: InquiryProductResponse[];
  mediaItems?: Array<{
    '@id': string;
    '@type': string;
    id: string;
    filename: string;
    mimeType: string;
    filePath: string;
  }>;
}

/** API response for a single inquiry */
export interface InquiryResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  id: string;
  inquiryNumber: string;
  status: string;
  notes: string;
  contactEmail: string;
  contactPhone: string;
  isDraft: boolean;
  lastSavedAt: string;
  createdAt: string;
  updatedAt: string;
  machines: InquiryMachineResponse[];
  user: string | UserEmbedded; // Can be IRI or embedded object
  onBehalfOfClient?: {
    '@id'?: string;
    id: string;
    name: string;
    code: string;
  } | null;
}

/**
 * Hydra pagination view for collections
 */
export interface HydraView {
  '@id': string;
  '@type': string;
  first?: string;
  last?: string;
  next?: string;
  previous?: string;
}

/**
 * API response for a collection of inquiries
 * Note: The API returns already-normalized properties (without 'hydra:' prefix)
 */
export interface InquiriesCollection {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: InquiryResponse[];
  view?: HydraView | null;
  search?: {
    '@type': string;
    template: string;
    variableRepresentation: string;
    mapping: Array<{
      '@type': string;
      variable: string;
      property: string;
      required: boolean;
    }>;
  };
}
