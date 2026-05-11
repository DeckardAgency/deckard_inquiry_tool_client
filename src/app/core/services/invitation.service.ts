import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  UserInvitation,
  InvitationVerifyResponse,
  CompleteInvitationRequest,
  CompleteInvitationResponse,
  CreateInvitationRequest
} from '../models/user-invitation.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private readonly apiUrl = `${environment.apiBaseUrl}${environment.apiPath}/user_invitations`;

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/ld+json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Verify an invitation token (PUBLIC)
   * Returns invitation details if token is valid
   */
  verifyToken(token: string): Observable<InvitationVerifyResponse> {
    return this.http.get<InvitationVerifyResponse>(
      `${this.apiUrl}/verify/${token}`
    );
  }

  /**
   * Complete an invitation by setting password (PUBLIC)
   * Creates user account and marks invitation as completed
   */
  completeInvitation(
    token: string,
    data: CompleteInvitationRequest
  ): Observable<CompleteInvitationResponse> {
    return this.http.post<CompleteInvitationResponse>(
      `${this.apiUrl}/complete/${token}`,
      data,
      this.httpOptions
    );
  }

  /**
   * Create a new invitation (ADMIN only)
   * Sends invitation email to the user
   */
  createInvitation(data: CreateInvitationRequest): Observable<UserInvitation> {
    return this.http.post<UserInvitation>(this.apiUrl, data, this.httpOptions);
  }

  /**
   * Get all invitations (ADMIN only)
   * Returns list of all invitations
   */
  getInvitations(): Observable<{ 'hydra:member': UserInvitation[] }> {
    return this.http.get<{ 'hydra:member': UserInvitation[] }>(this.apiUrl);
  }

  /**
   * Get a specific invitation by ID (ADMIN only)
   */
  getInvitation(id: string): Observable<UserInvitation> {
    return this.http.get<UserInvitation>(`${this.apiUrl}/${id}`);
  }

  /**
   * Revoke an invitation (ADMIN only)
   * Prevents the invitation from being used
   */
  revokeInvitation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
