import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClientMachineInstalledBase, ClientMachineInstalledBaseResponse } from '@core/models';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class ClientMachineInstalledBaseService extends BaseHttpService {
  private clientMachineInstalledBasesUrl = this.buildUrl('client_machine_installed_bases');

  constructor() {
    super();
  }

  /**
   * Get client machine installed bases by client code
   * @param clientCode The client code to filter by
   * @returns Observable with the client machine installed bases
   */
  getClientMachinesByClientCode(clientCode: string): Observable<ClientMachineInstalledBaseResponse> {
    const params = new HttpParams().set('client.code', clientCode);
    return this.getWithJsonLd<ClientMachineInstalledBaseResponse>(this.clientMachineInstalledBasesUrl, params);
  }

  /**
   * Get all client machine installed bases
   * @returns Observable with all client machine installed bases
   */
  getAllClientMachines(): Observable<ClientMachineInstalledBaseResponse> {
    return this.getWithJsonLd<ClientMachineInstalledBaseResponse>(this.clientMachineInstalledBasesUrl);
  }

  /**
   * Get client machine installed base by ID
   * @param id The ID of the client machine installed base
   * @returns Observable with the client machine installed base
   */
  getClientMachineById(id: string): Observable<ClientMachineInstalledBase> {
    return this.getWithJsonLd<ClientMachineInstalledBase>(`${this.clientMachineInstalledBasesUrl}/${id}`);
  }

  /**
   * Create a new client machine installed base
   * @param clientMachine The client machine data to create
   * @returns Observable with the created client machine installed base
   */
  createClientMachine(clientMachine: Partial<ClientMachineInstalledBase>): Observable<ClientMachineInstalledBase> {
    return this.postWithJsonLd<ClientMachineInstalledBase>(this.clientMachineInstalledBasesUrl, clientMachine);
  }

  /**
   * Update a client machine installed base
   * @param id The ID of the client machine to update
   * @param clientMachine The updated client machine data
   * @returns Observable with the updated client machine installed base
   */
  updateClientMachine(id: string, clientMachine: Partial<ClientMachineInstalledBase>): Observable<ClientMachineInstalledBase> {
    return this.putWithJsonLd<ClientMachineInstalledBase>(`${this.clientMachineInstalledBasesUrl}/${id}`, clientMachine);
  }

  /**
   * Delete a client machine installed base
   * @param id The ID of the client machine to delete
   * @returns Observable with the deletion result
   */
  deleteClientMachine(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.clientMachineInstalledBasesUrl}/${id}`);
  }
}
