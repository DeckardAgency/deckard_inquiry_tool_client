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
    const lower = make.toLowerCase();
    if (lower === 'bmw') return 'BMW';
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  yearRange(v: Vehicle): string {
    if (!v.yearFrom && !v.yearTo) return '';
    return `${v.yearFrom ?? ''}–${v.yearTo ?? ''}`;
  }

  /**
   * Brand logo via the Simple Icons SVG set on jsDelivr (MIT-licensed,
   * monochrome glyphs). The slug matches the lowercase make.
   */
  brandLogoUrl(make: string): string {
    const slug = make.toLowerCase();
    if (!CarPickerComponent.SUPPORTED_BRANDS.has(slug)) {
      return '';
    }
    return `https://cdn.jsdelivr.net/npm/simple-icons@13/icons/${slug}.svg`;
  }

  /** Inline SVG path data for each top-level module. */
  moduleIcon(code: string): string {
    return CarPickerComponent.MODULE_ICONS[code] ?? CarPickerComponent.MODULE_ICONS['_default'];
  }

  private static readonly SUPPORTED_BRANDS = new Set([
    'toyota',
    'volkswagen',
    'mercedes',
    'bmw',
    'ford',
    'renault',
    'skoda',
    'audi',
    'opel',
    'peugeot',
  ]);

  /**
   * Inline SVG path `d` attributes for each module. Drawn into a 24x24
   * viewBox in the template. Stroke-based icons so they sit well next
   * to the brand logos in the picker.
   */
  private static readonly MODULE_ICONS: Record<string, string> = {
    cars_engine:
      'M5 8h14v8H5z M8 8V6h8v2 M8 16v2h8v-2 M3 10h2 M3 14h2 M19 10h2 M19 14h2 M12 8v8',
    cars_brakes:
      'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M2 12h2 M20 12h2',
    cars_suspension:
      'M12 3v4 M12 17v4 M8 7l8 0 M8 10l8 0 M8 13l8 0 M8 17l8 0',
    cars_electrical:
      'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
    cars_body:
      'M3 12l2-5a3 3 0 0 1 2.8-2h8.4a3 3 0 0 1 2.8 2l2 5v5H3v-5z M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M17 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    cars_interior:
      'M7 4h10v4H7z M7 8c0 4 -2 6 -2 10h14c0-4-2-6-2-10 M9 18v3 M15 18v3',
    cars_transmission:
      'M7 3v6 M7 15v6 M17 3v6 M17 15v6 M4 9h6 M14 9h6 M4 15h6 M14 15h6 M7 9a3 3 0 0 1 0 6 M17 9a3 3 0 0 1 0 6',
    _default:
      'M4 4h16v16H4z',
  };

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
