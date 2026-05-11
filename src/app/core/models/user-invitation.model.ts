export interface UserInvitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  createdBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  client?: {
    id: string;
    name: string;
    code: string;
  };
  roles: string[];
}

export type InvitationStatus = 'pending' | 'completed' | 'expired' | 'revoked';

export interface InvitationVerifyResponse {
  email: string;
  firstName: string;
  lastName: string;
  expiresAt: string;
  isExpired: boolean;
}

export interface CompleteInvitationRequest {
  password: string;
  passwordConfirm: string;
}

export interface CompleteInvitationResponse {
  message: string;
  success: boolean;
}

export interface CreateInvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  client?: string; // IRI (e.g., "/api/clients/123...")
  roles?: string[];
}
