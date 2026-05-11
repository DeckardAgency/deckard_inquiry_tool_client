import { Component, OnInit, Input, Output, EventEmitter, signal, computed, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, startWith, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MachineService } from '@services/http/machine.service';
import { Machine, OtherMachine } from '@core/models';
import { MachineArticleItemComponent } from '@shared/components/machine/machine-article-item/machine-article-item.component';
import { MachineArticleItemShimmerComponent } from '@shared/components/machine/machine-article-item/machine-article-item-shimmer.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { LoggerService, ScopedLogger } from '@services/logger.service';

/**
 * Machine Search Component
 *
 * Handles machine search and selection.
 * Extracted from manual-entry-input-form for better separation of concerns.
 *
 * @example
 * ```html
 * <app-machine-search
 *   (machineSelected)="onMachineSelected($event)"
 *   (otherMachineSelected)="onOtherMachineSelected()">
 * </app-machine-search>
 * ```
 */
@Component({
  selector: 'app-machine-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MachineArticleItemComponent,
    MachineArticleItemShimmerComponent,
    IconComponent
  ],
  templateUrl: './machine-search.component.html',
  styleUrls: ['./machine-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineSearchComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private machineService = inject(MachineService);
  private loggerService = inject(LoggerService);
  private logger!: ScopedLogger;

  // Inputs
  @Input() restoreSelectedMachineId: string | null = null;

  // Outputs
  @Output() machineSelected = new EventEmitter<Machine>();
  @Output() otherMachineSelected = new EventEmitter<void>();

  // State signals
  machines = signal<Machine[]>([]);
  loading = signal(false);
  searchLoading = signal(false);
  error = signal<string | null>(null);
  searchError = signal<string | null>(null);
  totalItems = signal(0);
  selectedMachineId = signal<string | null>(null);

  // Form control
  searchControl = new FormControl('');

  // Computed filtered machines
  filteredMachines = computed(() => {
    const filtered = this.machines();
    // Add "Other" option at the end
    return [...filtered, this.createOtherMachineOption()];
  });

  ngOnInit(): void {
    this.logger = this.loggerService.createLogger('MachineSearchComponent');
    this.setupSearch();
    this.loadMachines();
  }

  /**
   * Set up reactive search with debounce
   */
  private setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        this.searchLoading.set(true);
        this.searchError.set(null);

        if (!searchTerm?.trim()) {
          return this.machineService.getMachines().pipe(
            catchError(error => {
              this.logger.error('Error loading machines:', error);
              this.searchError.set('Failed to load machines. Please try again.');
              return of({ member: [], totalItems: 0, '@context': '', '@id': '', '@type': '', view: null });
            })
          );
        }

        return this.machineService.searchMachines(searchTerm.trim()).pipe(
          catchError(error => {
            this.logger.error('Error searching machines:', error);
            this.searchError.set(`Failed to search for "${searchTerm}". Please try again.`);
            return of({ member: [], totalItems: 0, '@context': '', '@id': '', '@type': '', view: null });
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.machines.set(response.member);
        this.totalItems.set(response.totalItems);
        this.searchLoading.set(false);
      },
      error: (error) => {
        this.logger.error('Search subscription error:', error);
        this.searchError.set('Search failed. Please try again.');
        this.searchLoading.set(false);
      }
    });
  }

  /**
   * Load all machines on init
   */
  private loadMachines(): void {
    this.loading.set(true);
    this.error.set(null);

    this.machineService.getMachines().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.machines.set(response.member);
        this.totalItems.set(response.totalItems);
        this.loading.set(false);

        // Restore selected machine if provided
        if (this.restoreSelectedMachineId) {
          this.restoreSelectedMachine(this.restoreSelectedMachineId);
        }
      },
      error: (err) => {
        this.error.set('Failed to load machines. Please try again later.');
        this.loading.set(false);
        this.logger.error('Error loading machines:', err);
      }
    });
  }

  /**
   * Restore previously selected machine
   */
  private restoreSelectedMachine(machineId: string): void {
    if (machineId === 'other') {
      this.onOtherMachineClick();
    } else {
      const foundMachine = this.machines().find(m => m.id === machineId);
      if (foundMachine) {
        this.onMachineClick(foundMachine);
      }
    }
  }

  /**
   * Create "Other" machine option
   */
  private createOtherMachineOption(): OtherMachine {
    return {
      id: 'other',
      articleDescription: 'Other/Older (Not Listed)',
      isOther: true
    } as OtherMachine;
  }

  /**
   * Clear search input
   */
  clearSearch(): void {
    this.searchControl.setValue('');
  }

  /**
   * Handle machine selection
   */
  onMachineClick(machine: Machine): void {
    this.selectedMachineId.set(machine.id);
    this.machineSelected.emit(machine);
  }

  /**
   * Handle "Other" machine selection
   */
  onOtherMachineClick(): void {
    this.selectedMachineId.set('other');
    this.otherMachineSelected.emit();
  }

  /**
   * Check if machine is "Other"
   */
  isOtherMachine(machine: Machine): boolean {
    return 'isOther' in machine && (machine as OtherMachine).isOther === true;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
