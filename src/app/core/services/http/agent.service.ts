import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';

export interface ManagedClientResponse {
  '@id'?: string;
  '@type'?: string;
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  vatNumber?: string;
  isActive: boolean;
  isArchived: boolean;
  maxActiveUsers?: number;
  machinesCount?: number;
}

export interface ManagedClientsCollection {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  totalItems: number;
  member: ManagedClientResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class AgentService extends BaseHttpService {

  /**
   * Get all clients managed by the current agent user
   * @returns Observable of ManagedClientsCollection
   */
  getManagedClients(): Observable<ManagedClientsCollection> {
    return this.getWithJsonLd<ManagedClientsCollection>(
      this.buildUrl('agent', 'managed-clients')
    );
  }
}
