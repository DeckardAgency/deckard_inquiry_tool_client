import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { MachineArticleItemComponent } from '@shared/components/machine/machine-article-item/machine-article-item.component';
import { MachineArticleItemShimmerComponent } from '@shared/components/machine/machine-article-item/machine-article-item-shimmer.component';
import { IconComponent } from '@shared/components/icon/icon.component';

import { ClientMachineInstalledBaseService } from '@services/http/client-machine-installed-base.service';
import { AuthService } from '@core/auth/auth.service';
import { ClientMachineInstalledBase, Machine, MediaItem, Breadcrumb } from '@core/models';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-my-machines',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbsComponent,
    MachineArticleItemComponent,
    MachineArticleItemShimmerComponent,
    IconComponent
  ],
  templateUrl: './my-machines.component.html',
  styleUrls: ['./my-machines.component.scss']
})
export class MyMachinesComponent implements OnInit {
  // Machine data
  clientMachines: ClientMachineInstalledBase[] = [];
  filteredMachines: ClientMachineInstalledBase[] = [];
  adaptedMachines: Machine[] = [];
  filteredAdaptedMachines: Machine[] = [];
  loading = true;
  error: string | null = null;
  totalItems = 0;

  // Search control
  searchControl = new FormControl('');

  // View mode
  viewMode: 'grid' | 'list' = 'list';

  // Breadcrumbs
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', link: '/dashboard' },
    { label: 'My Machines' }
  ];

  private logger!: ScopedLogger;
  private destroyRef = inject(DestroyRef);

  constructor(
    private clientMachineService: ClientMachineInstalledBaseService,
    private authService: AuthService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('MyMachinesComponent');

    // Setup search with debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.filterMachines());
  }

  ngOnInit(): void {
    this.loadMachines();
  }

  private loadMachines(): void {
    this.loading = true;
    this.error = null;

    // Get current user
    const currentUser = this.authService.getCurrentUser();

    if (currentUser?.client?.code) {
      // Load machines for the user's client using client code
      this.logger.debug('Load machines for the user\'s client using client code');
      this.clientMachineService.getClientMachinesByClientCode(currentUser.client.code)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.clientMachines = response.member || [];
            this.totalItems = response.totalItems || 0;
            this.filteredMachines = [...this.clientMachines];

            // Adapt ClientMachineInstalledBase to Machine format for compatibility
            this.adaptedMachines = this.adaptClientMachinesToMachines(this.clientMachines);
            this.filteredAdaptedMachines = [...this.adaptedMachines];

            this.loading = false;
          },
          error: (err) => {
            this.error = 'Failed to load machines. Please try again later.';
            this.loading = false;
            this.logger.error('Error loading client machines', err);
          }
        });
    } else {
      // No client associated with user, load all machines
      this.logger.debug('No client associated with user, load all machines');
      this.clientMachineService.getAllClientMachines()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.clientMachines = response.member || [];
            this.totalItems = response.totalItems || 0;
            this.filteredMachines = [...this.clientMachines];

            // Adapt ClientMachineInstalledBase to Machine format for compatibility
            this.adaptedMachines = this.adaptClientMachinesToMachines(this.clientMachines);
            this.filteredAdaptedMachines = [...this.adaptedMachines];

            this.loading = false;
          },
          error: (err) => {
            this.error = 'Failed to load machines. Please try again later.';
            this.loading = false;
            this.logger.error('Error loading client machines', err);
          }
        });
    }
  }

  /**
   * Adapt ClientMachineInstalledBase objects to Machine objects for compatibility
   * with existing components
   */
  private adaptClientMachinesToMachines(clientMachines: ClientMachineInstalledBase[]): Machine[] {
    return clientMachines.map(clientMachine => ({
      '@id': clientMachine.machine['@id'],
      '@type': clientMachine.machine['@type'],
      id: clientMachine.machine.id,
      createdAt: clientMachine.machine.createdAt,
      updatedAt: clientMachine.machine.updatedAt,
      ibStationNumber: clientMachine.machine.ibStationNumber,
      ibSerialNumber: clientMachine.machine.ibSerialNumber,
      articleNumber: clientMachine.machine.articleNumber || '',
      articleDescription: clientMachine.machine.articleDescription || 'No description available',
      orderNumber: clientMachine.machine.orderNumber || '',
      kmsIdentificationNumber: clientMachine.machine.kmsIdentificationNumber || '',
      kmsIdNumber: clientMachine.machine.kmsIdNumber || '',
      mcNumber: clientMachine.machine.mcNumber || '',
      fiStationNumber: clientMachine.machine.fiStationNumber || 0,
      fiSerialNumber: clientMachine.machine.fiSerialNumber || 0,
      featuredImage: clientMachine.machine.featuredImage ? {
        '@id': `/api/v1/media/${clientMachine.machine.id}`,
        '@type': 'MediaItem',
        id: `media-${clientMachine.machine.id}`,
        filename: 'machine-image.jpg',
        mimeType: 'image/jpeg',
        filePath: clientMachine.machine.featuredImage,
        createdAt: clientMachine.machine.createdAt,
        updatedAt: clientMachine.machine.updatedAt
      } : null,
      imageGallery: clientMachine.machine.imageGallery || [],
      name: clientMachine.machine.articleDescription || `Machine ${clientMachine.machine.ibSerialNumber}`,
      documents: clientMachine.machine.documents || [],
      products: []
    }));
  }

  private filterMachines(): void {
    const searchTerm = this.searchControl.value?.toLowerCase() || '';

    if (!searchTerm) {
      this.filteredMachines = [...this.clientMachines];
      this.filteredAdaptedMachines = [...this.adaptedMachines];
      return;
    }

    // Filter ClientMachineInstalledBase objects
    this.filteredMachines = this.clientMachines.filter(clientMachine =>
      clientMachine.machine.articleDescription?.toLowerCase().includes(searchTerm) ||
      clientMachine.machine.articleNumber?.toLowerCase().includes(searchTerm) ||
      clientMachine.machine.ibSerialNumber?.toString().includes(searchTerm) ||
      clientMachine.machine.ibStationNumber?.toString().includes(searchTerm) ||
      clientMachine.machine.mcNumber?.toLowerCase().includes(searchTerm) ||
      clientMachine.machine.kmsIdentificationNumber?.toLowerCase().includes(searchTerm) ||
      clientMachine.machine.orderNumber?.toLowerCase().includes(searchTerm) ||
      clientMachine.location?.toLowerCase().includes(searchTerm) ||
      clientMachine.status?.toLowerCase().includes(searchTerm) ||
      clientMachine.client.name?.toLowerCase().includes(searchTerm) ||
      clientMachine.client.code?.toLowerCase().includes(searchTerm)
    );

    // Update adapted machines to match filtered results
    this.filteredAdaptedMachines = this.adaptClientMachinesToMachines(this.filteredMachines);
  }

  toggleViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  onMachineSelected(machine: Machine): void {
    // Find the original ClientMachineInstalledBase object
    const clientMachine = this.filteredMachines.find(cm => cm.machine.id === machine.id);

    this.logger.debug('Machine selected', { machine });
    this.logger.debug('Client Machine selected', { clientMachine });

    // You can add navigation logic here
    // this.router.navigate(['/machines', machine.id]);
    // Or navigate to client machine specific route
    // this.router.navigate(['/client-machines', clientMachine.id]);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  refreshMachines(): void {
    this.loadMachines();
  }

  /**
   * Get the status badge class for display
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'status-badge status-badge--active';
      case 'inactive':
        return 'status-badge status-badge--inactive';
      case 'maintenance':
        return 'status-badge status-badge--maintenance';
      case 'decommissioned':
        return 'status-badge status-badge--decommissioned';
      default:
        return 'status-badge';
    }
  }

  /**
   * Get warranty status for a machine
   */
  getWarrantyStatus(clientMachine: ClientMachineInstalledBase): 'active' | 'expired' | 'expiring' {
    if (!clientMachine.warrantyEndDate) return 'expired';

    const warrantyEnd = new Date(clientMachine.warrantyEndDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    if (warrantyEnd < now) return 'expired';
    if (warrantyEnd < thirtyDaysFromNow) return 'expiring';
    return 'active';
  }
}
