import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { HttpParams } from '@angular/common/http';

export interface AreaManagerUser {
  '@id': string;
  '@type': string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface AreaManagerArea {
  '@id': string;
  '@type': string;
  id: string;
  name: string;
  code: string;
  client?: string | { '@id': string; id: string };
}

export interface AreaManager {
  '@context'?: string;
  '@id': string;
  '@type': string;
  id: string;
  manager: AreaManagerUser | string;
  area: AreaManagerArea | string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AreaManagersCollection {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: AreaManager[];
}

@Injectable({
  providedIn: 'root'
})
export class AreaManagerService extends BaseHttpService {

  /**
   * Get primary area manager for a client
   * @param clientId - The client ID
   * @returns Observable of the primary AreaManager or null
   */
  getPrimaryManagerByClient(clientId: string): Observable<AreaManager | null> {
    const clientIri = `/api/v1/clients/${clientId}`;
    const params = new HttpParams()
      .set('itemsPerPage', '100');

    return this.getWithJsonLd<AreaManagersCollection>(
      this.buildUrl('area_managers'),
      params
    ).pipe(
      map(response => {
        if (response.member && response.member.length > 0) {
          // Filter client-side for managers belonging to this client's areas
          const filteredManagers = response.member.filter(am => {
            if (!am.isActive) return false;
            if (!am.isPrimary) return false;

            // Check if the area belongs to this client
            if (am.area && typeof am.area === 'object') {
              const area = am.area as AreaManagerArea;
              if (area.client) {
                if (typeof area.client === 'string') {
                  return area.client === clientIri || area.client.endsWith(`/${clientId}`);
                } else if (typeof area.client === 'object') {
                  return area.client.id === clientId || area.client['@id'] === clientIri;
                }
              }
            }
            return false;
          });

          return filteredManagers.length > 0 ? filteredManagers[0] : null;
        }
        return null;
      })
    );
  }

  /**
   * Get all area managers for a client
   * @param clientId - The client ID
   * @returns Observable of AreaManagersCollection
   */
  getManagersByClient(clientId: string): Observable<AreaManagersCollection> {
    const clientIri = `/api/v1/clients/${clientId}`;
    const params = new HttpParams()
      .set('itemsPerPage', '100');

    return this.getWithJsonLd<AreaManagersCollection>(
      this.buildUrl('area_managers'),
      params
    ).pipe(
      map(response => {
        if (response.member && response.member.length > 0) {
          // Filter client-side for managers belonging to this client's areas
          response.member = response.member.filter(am => {
            if (!am.isActive) return false;

            // Check if the area belongs to this client
            if (am.area && typeof am.area === 'object') {
              const area = am.area as AreaManagerArea;
              if (area.client) {
                if (typeof area.client === 'string') {
                  return area.client === clientIri || area.client.endsWith(`/${clientId}`);
                } else if (typeof area.client === 'object') {
                  return area.client.id === clientId || area.client['@id'] === clientIri;
                }
              }
            }
            return false;
          });
        }
        return response;
      })
    );
  }
}
