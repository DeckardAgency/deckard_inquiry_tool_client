// src/app/services/http/machine.service.ts
import { HttpParams } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Observable, map } from 'rxjs';
import { MachineResponse, Machine, MachineSearchParams } from '@core/models';
import { normalizeHydraCollection, NormalizedCollection } from '@models/api/hydra-api.model';
import { BaseHttpService } from './base-http.service';

// Re-export for backward compatibility
export type { MachineSearchParams };

@Injectable({
  providedIn: 'root'
})
export class MachineService extends BaseHttpService {
  private readonly machinesUrl: string;
  private readonly clientUrl: string;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    super();
    // Base API URL for machines
    this.machinesUrl = this.buildUrl('machines');
    // Base API URL for client-specific machines
    this.clientUrl = this.buildUrl('client');
  }

  /**
   * Get all machines with optional search and pagination
   * @param searchParamsOrItemsPerPage Search parameters object OR number of items per page (for backward compatibility)
   * @returns Observable with MachineResponse
   */
  getMachines(searchParamsOrItemsPerPage: MachineSearchParams | number = {}): Observable<MachineResponse> {
    // Handle backward compatibility - if a number is passed, convert to searchParams
    let searchParams: MachineSearchParams;
    if (typeof searchParamsOrItemsPerPage === 'number') {
      searchParams = { itemsPerPage: searchParamsOrItemsPerPage };
    } else {
      searchParams = searchParamsOrItemsPerPage;
    }

    const params = this.buildParams(searchParams as Record<string, string | number | boolean | undefined>);

    return this.getWithJsonLd<MachineResponse>(this.machinesUrl, params).pipe(
      map(response => this.normalizeHydraCollection<Machine>(response)),
      map(response => {
        // Add name property for UI compatibility
        response.member = response.member.map(machine => ({
          ...machine,
          name: machine.articleDescription
        }));
        return response;
      })
    );
  }

  /**
   * Search machines by article description
   * @param term Search term for article description
   * @param itemsPerPage Number of items to return per page
   * @returns Observable with MachineResponse
   */
  searchMachines(term: string, itemsPerPage: number = 300): Observable<MachineResponse> {
    return this.getMachines({
      articleDescription: term,
      itemsPerPage
    });
  }

  /**
   * Get machines for a specific client by ID with optional search
   * @param clientId The client ID
   * @param searchParamsOrItemsPerPage Search parameters object OR number of items per page (for backward compatibility)
   * @returns Observable with MachineResponse
   */
  getMachinesByClientId(clientId: string, searchParamsOrItemsPerPage: MachineSearchParams | number = {}): Observable<MachineResponse> {
    // Handle backward compatibility - if a number is passed, convert to searchParams
    let searchParams: MachineSearchParams;
    if (typeof searchParamsOrItemsPerPage === 'number') {
      searchParams = { itemsPerPage: searchParamsOrItemsPerPage };
    } else {
      searchParams = searchParamsOrItemsPerPage;
    }

    const params = this.buildParams(searchParams as Record<string, string | number | boolean | undefined>);

    return this.getWithJsonLd<MachineResponse>(
      this.buildClientUrl(clientId, 'machines'),
      params
    ).pipe(
      map(response => this.normalizeHydraCollection<Machine>(response)),
      map(response => {
        // Add name property for UI compatibility
        response.member = response.member.map(machine => ({
          ...machine,
          name: machine.articleDescription
        }));
        return response;
      })
    );
  }

  /**
   * Search machines for a specific client
   * @param clientId The client ID
   * @param term Search term for article description
   * @param itemsPerPage Number of items to return per page
   * @returns Observable with MachineResponse
   */
  searchClientMachines(clientId: string, term: string, itemsPerPage: number = 300): Observable<MachineResponse> {
    return this.getMachinesByClientId(clientId, {
      articleDescription: term,
      itemsPerPage
    });
  }

  /**
   * Get a specific machine by ID
   * @param id Machine ID
   * @returns Observable with the machine data
   */
  getMachine(id: string): Observable<Machine> {
    return this.getWithJsonLd<Machine>(this.buildUrl('machines', id)).pipe(
      map(machine => ({
        ...machine,
        name: machine.articleDescription
      }))
    );
  }

  /**
   * Get a specific machine for a client
   * @param clientId The client ID
   * @param machineId The machine ID
   * @returns Observable with the machine data
   */
  getClientMachine(clientId: string, machineId: string): Observable<Machine> {
    return this.getWithJsonLd<Machine>(
      this.buildClientUrl(clientId, 'machines', machineId)
    ).pipe(
      map(machine => ({
        ...machine,
        name: machine.articleDescription
      }))
    );
  }
}
