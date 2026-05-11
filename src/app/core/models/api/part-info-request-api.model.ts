/**
 * API interfaces for Part Information Request-related requests and responses
 * Used when admin requests additional information from client about parts
 */

export type PartInfoStatus = 'none' | 'clear' | 'pending_info' | 'info_provided';
export type InfoRequestStatus = 'pending' | 'responded' | 'accepted' | 'needs_revision';
export type SenderType = 'admin' | 'client';

/** Media item embedded in response */
export interface MediaItemResponse {
  '@id': string;
  '@type': string;
  id: string;
  filename: string;
  mimeType: string;
  filePath: string;
}

/** Sender information embedded in message */
export interface SenderResponse {
  '@id': string;
  '@type': string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** API response for a single message in an info request thread */
export interface InfoRequestMessageResponse {
  '@id': string;
  '@type': string;
  id: string;
  messageText: string;
  senderType: SenderType;
  sender?: SenderResponse;
  mediaItems?: MediaItemResponse[];
  createdAt: string;
}

/** API response for a part info request */
export interface PartInfoRequestResponse {
  '@id': string;
  '@type': string;
  id: string;
  status: InfoRequestStatus;
  messages: InfoRequestMessageResponse[];
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
  inquiryMachinePart: {
    '@id': string;
    id: string;
    partNumber: string;
    partName: string;
  };
}

/** Collection response for part info requests */
export interface PartInfoRequestsCollection {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: PartInfoRequestResponse[];
}

/** Request payload for client responding to an info request */
export interface ClientInfoResponsePayload {
  messageText: string;
  attachments?: string[]; // IRI references to media items
}
