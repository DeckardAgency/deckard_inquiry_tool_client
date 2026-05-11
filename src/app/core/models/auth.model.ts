/**
 * JWT Token Payload Interface
 * Represents the decoded JWT token structure from the API
 */
export interface TokenPayload {
  // User identification
  username: string;
  email?: string;
  roles: string[];

  // JWT standard claims (RFC 7519)
  iss?: string;      // Issuer
  sub?: string;      // Subject (usually user ID)
  aud?: string;      // Audience
  exp: number;       // Expiration time (Unix timestamp)
  iat: number;       // Issued at (Unix timestamp)
  nbf?: number;      // Not before (Unix timestamp)
  jti?: string;      // JWT ID

  // Additional custom claims from Symfony/API Platform
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  orders?: string[];
  username?: string;
  isActive?: boolean;
  client?: {
    '@id': string;
    '@type': string;
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    isArchived: boolean;
    maxActiveUsers?: number;
    vatNumber?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    requiresOrderApproval?: boolean;
    requiresInquiryApproval?: boolean;
    isClientAgent?: boolean;
  };
}

export interface UserCollectionResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: UserMember[];
  view: {
    '@id': string;
    '@type': string;
  };
  search: {
    '@type': string;
    template: string;
    variableRepresentation: string;
    mapping: {
      '@type': string;
      variable: string;
      property: string;
      required: boolean;
    }[];
  };
}

export interface UserMember {
  '@id': string;
  '@type': string;
  id: string;
  email: string;
  roles: string[];
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  orders: string[];
  isActive?: boolean;
  client?: {
    '@id': string;
    '@type': string;
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    isArchived: boolean;
    maxActiveUsers?: number;
    vatNumber?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    requiresOrderApproval?: boolean;
    requiresInquiryApproval?: boolean;
  };
}
