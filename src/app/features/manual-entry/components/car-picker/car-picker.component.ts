import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleService, Vehicle, VehicleModule } from '@services/http/vehicle.service';
import { Machine } from '@core/models';

/**
 * Two-step picker for the manual-entry flow:
 *   step 1: 20-30 cars (make+model groups, server-aggregated)
 *   step 2: that car's modules (engine, brakes, …)
 *
 * Emits a Machine-shaped synthetic object once a (car, module) pair is
 * selected so the parent components (manual-entry-input-form and
 * manual-entry-template) can keep their existing per-machine state
 * (machinePartsMap, parts form, submit flow) without rewriting.
 */
@Component({
  selector: 'app-car-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './car-picker.component.html',
  styleUrls: ['./car-picker.component.scss'],
})
export class CarPickerComponent implements OnInit {
  @Output() selectionMade = new EventEmitter<Machine>();

  private vehicleService = inject(VehicleService);

  vehicles: Vehicle[] = [];
  loading = true;
  error: string | null = null;
  selectedVehicle: Vehicle | null = null;

  ngOnInit(): void {
    this.vehicleService.getVehicles().subscribe({
      next: (response) => {
        this.vehicles = response.vehicles ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load vehicles.';
        this.loading = false;
        console.error('CarPicker: getVehicles failed', err);
      },
    });
  }

  selectVehicle(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
  }

  clearSelectedVehicle(): void {
    this.selectedVehicle = null;
  }

  selectModule(module: VehicleModule): void {
    if (!this.selectedVehicle) return;
    this.selectionMade.emit(this.toSyntheticMachine(this.selectedVehicle, module));
  }

  prettyMake(make: string): string {
    return make.charAt(0).toUpperCase() + make.slice(1);
  }

  yearRange(v: Vehicle): string {
    if (!v.yearFrom && !v.yearTo) return '';
    return `${v.yearFrom ?? ''}–${v.yearTo ?? ''}`;
  }

  /**
   * Synthesize a Machine the parent can store as the "selected machine"
   * in its existing per-machine parts map. ID is stable per (car, module)
   * so switching back to the same selection preserves entered data.
   */
  private toSyntheticMachine(vehicle: Vehicle, module: VehicleModule): Machine {
    const id = `car:${vehicle.id}:${module.code}`;
    const articleDescription = `${this.prettyMake(vehicle.make)} ${vehicle.model} — ${module.label}`;
    return {
      '@id': `/api/v1/synthetic-machines/${id}`,
      '@type': 'Machine',
      id,
      createdAt: '',
      updatedAt: '',
      ibStationNumber: 0,
      ibSerialNumber: 0,
      articleNumber: module.code,
      articleDescription,
      orderNumber: '',
      kmsIdentificationNumber: '',
      kmsIdNumber: '',
      mcNumber: module.code,
      fiStationNumber: 0,
      fiSerialNumber: 0,
      featuredImage: null,
      imageGallery: [],
      name: articleDescription,
      documents: [],
      products: [],
    };
  }
}
