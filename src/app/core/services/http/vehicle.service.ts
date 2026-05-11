import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface VehicleModule {
  code: string;     // e.g. "cars_engine"
  label: string;    // e.g. "Engine"
  partCount: number;
}

export interface Vehicle {
  id: string;             // e.g. "toyota:corolla"
  make: string;           // e.g. "toyota"
  model: string;          // e.g. "Corolla"
  partCount: number;
  yearFrom: string | null;
  yearTo: string | null;
  modules: VehicleModule[];
}

interface VehicleListResponse {
  totalItems: number;
  vehicles: Vehicle[];
}

/**
 * Talks to the inquiry-tool backend's /api/v1/vehicles endpoint.
 * Vehicles are aggregated server-side from PIM-sourced products
 * (make + model groups, with their available top-level modules).
 */
@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}${environment.apiPath}/vehicles`;

  getVehicles(): Observable<VehicleListResponse> {
    return this.http.get<VehicleListResponse>(this.baseUrl);
  }

  getModulesFor(make: string, model: string): Observable<{ vehicle: { make: string; model: string }; totalItems: number; modules: VehicleModule[] }> {
    const url = `${this.baseUrl}/${encodeURIComponent(make)}/${encodeURIComponent(model)}/modules`;
    return this.http.get<{ vehicle: { make: string; model: string }; totalItems: number; modules: VehicleModule[] }>(url);
  }
}
