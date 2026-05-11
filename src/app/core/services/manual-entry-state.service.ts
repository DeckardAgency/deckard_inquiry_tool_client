import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Machine } from '@core/models';

/**
 * Service to manage shared state between Manual Entry Template and Input Form components
 * Persists the selected machine when switching between routes
 */
@Injectable({
  providedIn: 'root'
})
export class ManualEntryStateService {
  private selectedMachineSubject = new BehaviorSubject<Machine | null>(null);
  private machinesSubject = new BehaviorSubject<Machine[]>([]);
  private activeFiltersSubject = new BehaviorSubject<string[]>([]);
  private searchTermSubject = new BehaviorSubject<string>('');
  private isOtherMachineSelectedSubject = new BehaviorSubject<boolean>(false);

  // Observable streams
  selectedMachine$ = this.selectedMachineSubject.asObservable();
  machines$ = this.machinesSubject.asObservable();
  activeFilters$ = this.activeFiltersSubject.asObservable();
  searchTerm$ = this.searchTermSubject.asObservable();
  isOtherMachineSelected$ = this.isOtherMachineSelectedSubject.asObservable();

  constructor() {}

  /**
   * Set the selected machine and persist it
   */
  setSelectedMachine(machine: Machine | null): void {
    this.selectedMachineSubject.next(machine);
  }

  /**
   * Get the current selected machine (synchronous)
   */
  getSelectedMachine(): Machine | null {
    return this.selectedMachineSubject.value;
  }

  /**
   * Set the machines list
   */
  setMachines(machines: Machine[]): void {
    this.machinesSubject.next(machines);
  }

  /**
   * Get the current machines list (synchronous)
   */
  getMachines(): Machine[] {
    return this.machinesSubject.value;
  }

  /**
   * Set active filters
   */
  setActiveFilters(filters: string[]): void {
    this.activeFiltersSubject.next(filters);
  }

  /**
   * Get active filters (synchronous)
   */
  getActiveFilters(): string[] {
    return this.activeFiltersSubject.value;
  }

  /**
   * Set search term
   */
  setSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }

  /**
   * Get search term (synchronous)
   */
  getSearchTerm(): string {
    return this.searchTermSubject.value;
  }

  /**
   * Set whether "Other" machine is selected
   */
  setIsOtherMachineSelected(isOther: boolean): void {
    this.isOtherMachineSelectedSubject.next(isOther);
  }

  /**
   * Get whether "Other" machine is selected (synchronous)
   */
  getIsOtherMachineSelected(): boolean {
    return this.isOtherMachineSelectedSubject.value;
  }

  /**
   * Clear all state
   */
  clearState(): void {
    this.selectedMachineSubject.next(null);
    this.activeFiltersSubject.next([]);
    this.searchTermSubject.next('');
    this.isOtherMachineSelectedSubject.next(false);
  }

  /**
   * Clear only the selected machine, keeping other state
   */
  clearSelectedMachine(): void {
    this.selectedMachineSubject.next(null);
    this.isOtherMachineSelectedSubject.next(false);
  }

  /**
   * Check if a machine is currently selected
   */
  hasMachineSelected(): boolean {
    return this.selectedMachineSubject.value !== null;
  }

  /**
   * Check if the selected machine has a specific ID
   */
  isSelectedMachine(machineId: string): boolean {
    return this.selectedMachineSubject.value?.id === machineId;
  }

  /**
   * Restore machine selection from saved state (useful for route navigation)
   */
  restoreMachineSelection(machines: Machine[]): Machine | null {
    const currentSelectedMachine = this.selectedMachineSubject.value;

    // If a machine was previously selected, try to find it in the new machines list
    if (currentSelectedMachine) {
      const foundMachine = machines.find(m => m.id === currentSelectedMachine.id);
      if (foundMachine) {
        this.selectedMachineSubject.next(foundMachine);
        return foundMachine;
      }
    }

    return null;
  }
}
