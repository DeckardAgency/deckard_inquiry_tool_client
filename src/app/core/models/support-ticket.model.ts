export interface SupportTicketResponse {
  '@context'?: string;
  '@id': string;
  '@type': string;
  id: string;
  subject: string;
  message: string;
  orderId?: string;
  machine?: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachment?: {
    '@id': string;
    '@type': string;
    id: string;
    filename: string;
    mimeType: string;
    filePath: string;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  user?: {
    '@id': string;
    '@type': string;
    id: string;
    email: string;
    fullName: string;
  };
}

export interface SupportTicketCollectionResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  'totalItems': number;
  'member': SupportTicketResponse[];
  'view'?: {
    '@id': string;
    '@type': string;
    'first'?: string;
    'last'?: string;
    'previous'?: string;
    'next'?: string;
  };
  'search'?: {
    '@type': string;
    'template': string;
    'variableRepresentation': string;
    'mapping': Array<{ '@type': string; variable: string; property: string }>;
  };
}
