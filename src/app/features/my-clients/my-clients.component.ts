import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { AgentService, ManagedClientResponse } from '@core/services/http/agent.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';

type SortColumn = 'code' | 'vatNumber' | 'name' | 'email' | 'status' | null;
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-my-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbsComponent],
  templateUrl: './my-clients.component.html',
  styleUrls: ['./my-clients.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyClientsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private logger!: ScopedLogger;

  breadcrumbs = [
    { label: 'My Clients' }
  ];

  clients: ManagedClientResponse[] = [];
  filteredClients: ManagedClientResponse[] = [];
  isLoading = false;
  error: string | null = null;

  // Search
  searchQuery = '';

  // Sort
  sortColumn: SortColumn = null;
  sortDirection: SortDirection = 'asc';

  // Pagination
  currentPage = 1;
  pageSize = 30;
  totalItems = 0;

  // Actions menu
  openMenuClientId: string | null = null;

  constructor(
    private agentService: AgentService,
    private agentClientSelectionService: AgentClientSelectionService,
    private router: Router,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('MyClientsComponent');
  }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading = true;
    this.error = null;

    this.agentService.getManagedClients()
      .pipe(
        catchError(err => {
          this.logger.error('Error loading managed clients', err);
          this.error = 'Failed to load clients. Please try again later.';
          return of({ totalItems: 0, member: [] } as any);
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.clients = response.member || [];
          this.totalItems = this.clients.length;
          this.applyFiltersAndSort();
        }
      });
  }

  // ============================================================================
  // SEARCH & FILTER
  // ============================================================================

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    let filtered = [...this.clients];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(client => {
        const name = (client.name || '').toLowerCase();
        const code = (client.code || '').toLowerCase();
        const email = (client.email || '').toLowerCase();
        return name.includes(query) || code.includes(query) || email.includes(query);
      });
    }

    // Apply sorting
    if (this.sortColumn) {
      filtered.sort((a, b) => {
        let valA: string | boolean = '';
        let valB: string | boolean = '';

        switch (this.sortColumn) {
          case 'code':
            valA = a.code || '';
            valB = b.code || '';
            break;
          case 'vatNumber':
            valA = a.vatNumber || '';
            valB = b.vatNumber || '';
            break;
          case 'name':
            valA = a.name || '';
            valB = b.name || '';
            break;
          case 'email':
            valA = a.email || '';
            valB = b.email || '';
            break;
          case 'status':
            valA = a.isActive ? 'Active' : 'Inactive';
            valB = b.isActive ? 'Active' : 'Inactive';
            break;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          const comparison = valA.localeCompare(valB);
          return this.sortDirection === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    this.totalItems = filtered.length;
    this.filteredClients = filtered;
    this.cdr.markForCheck();
  }

  // ============================================================================
  // SORTING
  // ============================================================================

  toggleSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  // ============================================================================
  // PAGINATION
  // ============================================================================

  get paginatedClients(): ManagedClientResponse[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredClients.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get showingFrom(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  // ============================================================================
  // ACTIONS MENU
  // ============================================================================

  toggleActionsMenu(clientId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuClientId = this.openMenuClientId === clientId ? null : clientId;
  }

  closeActionsMenu(): void {
    this.openMenuClientId = null;
  }

  isMenuOpen(clientId: string): boolean {
    return this.openMenuClientId === clientId;
  }

  createOrder(client: ManagedClientResponse, event: Event): void {
    event.stopPropagation();
    this.closeActionsMenu();
    this.agentClientSelectionService.selectClient(client);
    this.router.navigate(['/shop']);
  }

  viewClient(client: ManagedClientResponse, event: Event): void {
    event.stopPropagation();
    this.closeActionsMenu();
    this.router.navigate(['/my-clients', client.id, 'view']);
  }

  createInquiry(client: ManagedClientResponse, event: Event): void {
    event.stopPropagation();
    this.closeActionsMenu();
    this.agentClientSelectionService.selectClient(client);
    this.router.navigate(['/manual-entry/input-form']);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  getClientStatus(client: ManagedClientResponse): 'Active' | 'Inactive' {
    return client.isActive ? 'Active' : 'Inactive';
  }

  trackByClientId(index: number, client: ManagedClientResponse): string {
    return client.id;
  }
}
