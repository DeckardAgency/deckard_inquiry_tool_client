import { Component, OnInit, HostListener, AfterViewInit, OnDestroy, ChangeDetectorRef, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, startWith, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, of } from 'rxjs';
import { HttpEventType } from '@angular/common/http';
import * as XLSX from 'xlsx';

// Components
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { MachineArticleItemComponent } from '@shared/components/machine/machine-article-item/machine-article-item.component';
import { AdvancedImagePreviewModalComponent } from '@shared/components/modals/advanced-image-preview-modal/advanced-image-preview-modal.component';
import { MachineArticleItemShimmerComponent } from '@shared/components/machine/machine-article-item/machine-article-item-shimmer.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { SpreadsheetComponent } from '@shared/components/spreadsheet/spreadsheet.component';
import { FileUploadComponent } from '../components/file-upload/file-upload.component';
import { CarPickerComponent } from '../components/car-picker/car-picker.component';
import { AgentClientSelectComponent } from '@shared/components/agent-client-select/agent-client-select.component';

// Dev tools
import { TemplatePopulatorComponent, GeneratedTemplateData } from '@shared/components/dev-tools/template-populator/template-populator.component';

// Services
import { MachineService } from '@services/http/machine.service';
import { ManualQuickCartService } from '@services/cart/manual-quick-cart.service';
import { AuthService } from '@core/auth/auth.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';
import { ManagedClientResponse } from '@core/services/http/agent.service';
import { InquiryService, InquiryRequest } from '@services/http/inquiry.service';
import { ManualEntryStateService } from '@services/manual-entry-state.service';
import { MediaService } from '@services/http/media.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';

// Models and Types
import { ManualCartItem, UploadedFile, Breadcrumb, Part, MachineType, OtherMachine, Machine } from '@core/models';
import { SpreadsheetRow, TabType } from '@shared/components/spreadsheet/spreadsheet.interface';
import { environment } from '@env/environment';

// Guard interface
import { CanComponentDeactivate } from '@core/guards/can-deactivate.guard';

@Component({
  selector: 'app-manual-entry-template',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbsComponent,
    MachineArticleItemComponent,
    AdvancedImagePreviewModalComponent,
    MachineArticleItemShimmerComponent,
    IconComponent,
    SpreadsheetComponent,
    FileUploadComponent,
    CarPickerComponent,
    AgentClientSelectComponent,
    TemplatePopulatorComponent
  ],
  templateUrl: './manual-entry-template.component.html',
  styleUrls: ['./manual-entry-template.component.scss']
})
export class ManualEntryTemplateComponent implements OnInit, AfterViewInit, OnDestroy, CanComponentDeactivate {
  private destroyRef = inject(DestroyRef);
  private logger!: ScopedLogger;

  // Agent state
  isAgent = false;
  selectedAgentClients: ManagedClientResponse[] = [];

  // Machine data properties
  machines: Machine[] = [];
  filteredMachines: Machine[] = [];
  selectedMachine: Machine | null = null;
  isOtherMachineSelected = false;
  loading = true;
  error: string | null = null;
  totalItems = 0;

  // Search state
  searchLoading = false;
  searchError: string | null = null;
  private searchSubscription?: Subscription;

  // Image preview modal properties
  showImagePreview = false;
  previewImageSrc = '';
  previewImageAlt = '';
  previewImageFileName = '';

  // Search and form controls
  searchControl = new FormControl('');

  // Simple form for files only
  partForm = new FormGroup({});

  // Spreadsheet state
  currentSpreadsheetTab: TabType = 'client';
  hasClientData: boolean = false;

  // Parts array (simplified)
  parts: Part[] = [];

  // Map to store parts for each machine
  machinePartsMap: Map<string, Part[]> = new Map();

  // Machine types for filtering
  machineTypes: MachineType[] = [
    { id: '1', name: 'Winding Machines', checked: false },
    { id: '2', name: 'Extrusion Machines', checked: false },
    { id: '3', name: 'Converting Machines', checked: false },
    { id: '4', name: 'Packaging Machines', checked: false }
  ];

  isFilterOpen = false;
  activeFilters: string[] = [];
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', link: '/dashboard' },
    { label: 'Manual Entry', link: '/manual-entry' }
  ];

  constructor(
    private machineService: MachineService,
    private authService: AuthService,
    private agentClientSelectionService: AgentClientSelectionService,
    private inquiryService: InquiryService,
    private manualQuickCartService: ManualQuickCartService,
    private manualEntryStateService: ManualEntryStateService,
    private mediaService: MediaService,
    private cdr: ChangeDetectorRef,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('ManualEntryTemplateComponent');
    // Set up search functionality
    this.setupSearch();
  }

  ngOnInit(): void {
    // Check if user is an agent
    const user = this.authService.getCurrentUser();
    this.isAgent = user?.roles?.includes('ROLE_USER_CLIENT_AGENT') || false;

    // Restore agent client selection if available
    if (this.isAgent) {
      const savedClient = this.agentClientSelectionService.getSelectedClient();
      if (savedClient) {
        this.selectedAgentClients = [savedClient];
      }
    }

    this.loadMachines();
    this.addPart(); // Add first part by default
  }

  onAgentClientSelected(client: ManagedClientResponse): void {
    this.selectedAgentClients = [client];
    this.agentClientSelectionService.selectClient(client);
  }

  onAgentClientDeselected(client: ManagedClientResponse): void {
    this.selectedAgentClients = this.selectedAgentClients.filter(c => c.id !== client.id);
    if (this.selectedAgentClients.length === 0) {
      this.agentClientSelectionService.clearSelection();
    }
  }

  ngAfterViewInit(): void {
    // Component initialization complete
  }

  ngOnDestroy(): void {
    // Clean up search subscription
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    // Clean up file URLs to prevent memory leaks
    this.machinePartsMap.forEach(parts => {
      parts.forEach(part => {
        part.files.forEach(file => {
          if (file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl);
          }
        });
      });
    });

    // Also clean up current parts
    this.parts.forEach(part => {
      part.files.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    });
  }

  /**
   * CanComponentDeactivate implementation
   * Returns true if there's no unsaved data, false otherwise
   */
  canDeactivate(): boolean {
    return !this.hasUnsavedData();
  }

  /**
   * Get component name for the guard message
   */
  getComponentName(): string {
    return 'Use template';
  }

  /**
   * Check if there's any unsaved data
   */
  private hasUnsavedData(): boolean {
    // Check current parts
    const hasCurrentData = this.parts.some(part =>
      part.files.length > 0 ||
      part.spreadsheetData.length > 0
    );

    if (hasCurrentData) {
      return true;
    }

    // Check parts in machinePartsMap
    for (const [machineId, parts] of this.machinePartsMap.entries()) {
      const hasData = parts.some(part =>
        part.files.length > 0 ||
        part.spreadsheetData.length > 0
      );
      if (hasData) {
        return true;
      }
    }

    return false;
  }

  /**
   * Set up reactive search functionality
   */
  private setupSearch(): void {
    this.searchSubscription = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        this.searchLoading = true;
        this.searchError = null;

        if (!searchTerm?.trim()) {
          return this.machineService.getMachines().pipe(
            catchError(error => {
              this.logger.error('Error loading machines', error);
              this.searchError = 'Failed to load machines. Please try again.';
              return of({ member: [], totalItems: 0, '@context': '', '@id': '', '@type': '', view: null });
            })
          );
        }

        return this.machineService.searchMachines(searchTerm.trim()).pipe(
          catchError(error => {
            this.logger.error('Error searching machines', error);
            this.searchError = `Failed to search for "${searchTerm}". Please try again.`;
            return of({ member: [], totalItems: 0, '@context': '', '@id': '', '@type': '', view: null });
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.machines = response.member;

        // Add "Other" machine option at the end
        this.machines.push({
          id: 'other',
          articleDescription: 'Other/Older (Not Listed)',
          machineType: []
        } as unknown as Machine);

        this.totalItems = response.totalItems + 1;
        this.searchLoading = false;
        this.applyLocalFilters();
      },
      error: (error) => {
        this.logger.error('Search subscription error', error);
        this.searchError = 'Search failed. Please try again.';
        this.searchLoading = false;
      }
    });
  }

  /**
   * Apply local filters to machines list
   */
  private applyLocalFilters(): void {
    // For template component, no machine type filtering needed
    // Just return all machines as filtered machines
    this.filteredMachines = this.machines;
  }

  /**
   * Load machines from service
   */
  private loadMachines(): void {
    this.loading = true;
    this.error = null;

    this.machineService.getMachines()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.machines = response.member;

          // Add "Other" machine option at the end
          this.machines.push({
            id: 'other',
            articleDescription: 'Other/Unlisted Machine',
            machineType: []
          } as unknown as Machine);

          this.totalItems = response.totalItems + 1;
          this.applyLocalFilters();
          this.loading = false;

          // FIX: Restore machine selection AFTER machines are loaded
          this.restoreSelectedMachine();
        },
        error: (error) => {
          this.logger.error('Error loading machines', error);
          this.error = 'Failed to load machines. Please try again.';
          this.loading = false;
        }
      });
  }

  /**
   * Restore previously selected machine if it exists
   */
  private restoreSelectedMachine(): void {
    const savedMachine = this.manualEntryStateService.getSelectedMachine();
    const isOtherSelected = this.manualEntryStateService.getIsOtherMachineSelected();

    if (savedMachine && this.machines.length > 0) {
      // Check if the saved machine is "Other"
      if (savedMachine.id === 'other' || isOtherSelected) {
        // Find "Other" machine option in the machines array
        const otherMachine = this.machines.find(m => m.id === 'other');
        if (otherMachine) {
          this.selectMachine(otherMachine);
        }
      } else {
        // Restore regular machine
        const foundMachine = this.machines.find(m => m.id === savedMachine.id);
        if (foundMachine) {
          this.selectMachine(foundMachine);
        }
      }
    }
  }

  /**
   * Select a machine and initialize parts for it
   */
  selectMachine(machine: Machine): void {
    // Save current machine's spreadsheet data before switching
    if (this.selectedMachine && this.parts.length > 0) {
      // Deep clone the parts to ensure we're saving the current state
      const savedParts = this.parts.map(part => ({
        ...part,
        spreadsheetData: [...(part.spreadsheetData || [])],
        files: [...(part.files || [])],
        additionalNotes: part.additionalNotes || '',
        data: { ...part.data }
      }));
      this.machinePartsMap.set(this.selectedMachine.id, savedParts);
      this.logger.debug('Saved data for machine', { machineId: this.selectedMachine.id, savedParts });
    }

    this.selectedMachine = machine;
    this.isOtherMachineSelected = machine.id === 'other';

    // Restore previously saved parts for this machine if they exist
    if (this.machinePartsMap.has(machine.id)) {
      const savedParts = this.machinePartsMap.get(machine.id)!;
      this.logger.debug('Restoring data for machine', { machineId: machine.id, savedParts });

      // Deep clone the saved parts with new IDs to force Angular to create new component instances
      this.parts = savedParts.map(part => ({
        ...part,
        id: this.generateUniqueId(), // New ID to ensure fresh component instance
        spreadsheetData: [...(part.spreadsheetData || [])],
        files: [...(part.files || [])],
        additionalNotes: part.additionalNotes || '',
        data: { ...part.data }
      }));

      // Ensure all parts have data object initialized
      this.parts.forEach(part => {
        if (!part.data) {
          part.data = { machineId: '' };
        }
      });
    } else {
      this.logger.debug('No saved data for machine, creating new empty part', { machineId: machine.id });
      // Reset parts for new machine selection
      this.parts = [{
        id: this.generateUniqueId(),
        files: [],
        spreadsheetData: [],
        additionalNotes: '',
        data: { machineId: '' }
      }];
    }

    this.logger.debug('Parts after selection', { parts: this.parts });

    // Save selected machine to service for persistence across routes
    this.manualEntryStateService.setSelectedMachine(machine);
    this.manualEntryStateService.setIsOtherMachineSelected(this.isOtherMachineSelected);

    // Don't trigger change detection manually - let Angular handle it naturally
    // This prevents the spreadsheet binding from temporarily becoming undefined during re-render
  }

  /**
   * Add a new part to the current machine
   */
  addPart(): void {
    this.parts.push({
      id: this.generateUniqueId(),
      files: [],
      spreadsheetData: [],
      additionalNotes: '',
      data: { machineId: '' }
    });
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    return this.parts.some(part =>
      part.files.length > 0 ||
      part.spreadsheetData.some(row => row.quantity || row.partNumber || row.partName)
    );
  }

  /**
   * Close the details panel and save current parts
   */
  closeDetails(): void {
    if (this.selectedMachine) {
      this.machinePartsMap.set(this.selectedMachine.id, [...this.parts]);
    }
    this.selectedMachine = null;
    this.isOtherMachineSelected = false;

    // Clear selected machine from service when closing details
    this.manualEntryStateService.clearSelectedMachine();
  }

  /**
   * Handle spreadsheet data changes
   */
  onSpreadsheetDataChanged(data: SpreadsheetRow[], partIndex: number): void {
    if (this.parts[partIndex]) {
      // Create a deep copy of the spreadsheet data
      this.parts[partIndex].spreadsheetData = data.map(row => ({ ...row }));
      this.logger.debug('Spreadsheet data changed for part', { partIndex, data: this.parts[partIndex].spreadsheetData });

      if (this.selectedMachine) {
        // Deep clone the parts when saving to the map
        const savedParts = this.parts.map(part => ({
          ...part,
          spreadsheetData: [...(part.spreadsheetData || [])],
          files: [...(part.files || [])],
          additionalNotes: part.additionalNotes || '',
          data: { ...part.data }
        }));
        this.machinePartsMap.set(this.selectedMachine.id, savedParts);
        this.logger.debug('Updated machinePartsMap for machine', { machineId: this.selectedMachine.id });
      }
    }
  }

  /**
   * Handle spreadsheet tab changes
   */
  onSpreadsheetTabChanged(tab: TabType): void {
    this.currentSpreadsheetTab = tab;
  }

  /**
   * Handle file changes
   */
  onFilesChanged(files: UploadedFile[], partIndex: number): void {
    if (this.parts[partIndex]) {
      this.parts[partIndex].files = [...files];
      if (this.selectedMachine) {
        // Deep clone the parts when saving to the map
        const savedParts = this.parts.map(part => ({
          ...part,
          spreadsheetData: [...(part.spreadsheetData || [])],
          files: [...(part.files || [])],
          additionalNotes: part.additionalNotes || '',
          data: { ...part.data }
        }));
        this.machinePartsMap.set(this.selectedMachine.id, savedParts);
      }
    }
  }

  /**
   * Handle file preview request
   */
  onFilePreviewRequested(file: UploadedFile): void {
    if (this.isImageFile(file.name) && file.previewUrl) {
      this.previewImageSrc = file.previewUrl;
      this.previewImageAlt = file.name;
      this.previewImageFileName = file.name;
      this.showImagePreview = true;
    }
  }

  /**
   * Check if file is an image
   */
  isImageFile(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '');
  }

  /**
   * Close image preview modal
   */
  closeImagePreview(): void {
    this.showImagePreview = false;
  }

  /**
   * Generate unique ID for parts
   */
  private generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Remove a filter
   */
  removeFilter(filter: string): void {
    this.activeFilters = this.activeFilters.filter(f => f !== filter);
    this.applyLocalFilters();
  }

  /**
   * Check if parts have valid data
   */
  private hasValidPartsData(parts: Part[]): boolean {
    return parts.some(part => {
      const hasValidSpreadsheetData = part.spreadsheetData?.some(row =>
        row.quantity || row.partNumber || row.partName
      ) || false;

      const hasSuccessfulUpload = part.files.some(file => file.status === 'success');

      return hasValidSpreadsheetData || hasSuccessfulUpload;
    });
  }

  /**
   * Create manual cart items from parts
   */
  private createManualCartItems(machine: Machine, parts: Part[]): ManualCartItem[] {
    return parts.flatMap(part => {
      // For "Other" machines, use the manually entered Machine ID
      const machineId = this.isOtherMachineSelected && part.data.machineId
        ? part.data.machineId
        : machine.id;
      const machineName = this.isOtherMachineSelected && part.data.machineId
        ? `Other Machine: ${part.data.machineId}`
        : machine.articleDescription;

      const spreadsheetRows = part.spreadsheetData?.filter(row =>
        row.quantity || row.partNumber || row.partName
      ) || [];

      if (spreadsheetRows.length > 0) {
        return spreadsheetRows.map(row => ({
          id: this.generateUniqueId(),
          machineId: machineId,
          machineName: machineName,
          partData: {
            partName: row.partName || '',
            partNumber: row.partNumber || '',
            quantity: row.quantity || '',
            shortDescription: row.quantity ? `${row.quantity} pieces of ${row.partNumber || ''}` : '',
            additionalNotes: part.additionalNotes || '',
            mediaItems: part.files
              .filter(file => file.status === 'success' && file.mediaItem)
              .map(file => file.mediaItem!)
          },
          files: part.files.filter(file => file.status === 'success')
        }));
      } else if (part.files.some(file => file.status === 'success')) {
        return [{
          id: this.generateUniqueId(),
          machineId: machineId,
          machineName: machineName,
          partData: {
            partName: '',
            partNumber: '',
            quantity: '',
            shortDescription: '',
            additionalNotes: part.additionalNotes || '',
            mediaItems: part.files
              .filter(file => file.status === 'success' && file.mediaItem)
              .map(file => file.mediaItem!)
          },
          files: part.files.filter(file => file.status === 'success')
        }];
      }

      return [];
    });
  }

  /**
   * Create inquiry data for API
   */
  private createInquiryData(): InquiryRequest {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || 'current-user';

    const machineEntries = [];

    // Current machine
    if (this.selectedMachine && this.parts.length > 0) {
      machineEntries.push(this.createMachineEntry(this.selectedMachine, this.parts));
    }

    // Saved machines
    this.machinePartsMap.forEach((parts, machineId) => {
      if (machineId !== this.selectedMachine?.id) {
        const machine = this.machines.find(m => m.id === machineId);
        if (machine && parts.length > 0 && this.hasValidPartsData(parts)) {
          machineEntries.push(this.createMachineEntry(machine, parts));
        }
      }
    });

    return {
      status: "pending",
      notes: "Inquiry created via manual entry template",
      contactEmail: currentUser?.email || "string",
      contactPhone: 'string',
      isDraft: false,
      user: `${environment.apiBaseUrl}${environment.apiPath}/users/${userId}`,
      machines: machineEntries
    };
  }

  /**
   * Create machine entry for inquiry - Updated for new structure
   * Excel files (from spreadsheet) are attached at machine level
   * Products are just the individual parts without files
   */
  private createMachineEntry(machine: Machine, parts: Part[]) {
    // Collect all mediaItems from all parts for this machine
    const allMediaItems = parts.flatMap(part =>
      part.files
        .filter(file => file.status === 'success' && file.mediaItem)
        .map(file => '/api/v1/media_items/' + file.mediaItem!.id)
    );

    // Handle "Other" machines differently
    if (this.isOtherMachineSelected && machine.id === 'other') {
      return {
        machine: this.parts[0].data?.machineId || 'Custom machine', // Custom machine identifier
        notes: `Inquiry for unlisted/custom machine: ${this.parts[0].data?.machineId}`,
        mediaItems: allMediaItems, // Files at machine level
        products: parts.flatMap(part => {
          const spreadsheetRows = part.spreadsheetData?.filter(row =>
            row.quantity || row.partNumber || row.partName
          ) || [];

          if (spreadsheetRows.length > 0) {
            return spreadsheetRows.map(row => ({
              partName: row.partName || '',
              partNumber: row.partNumber || '',
              quantity: row.quantity || '',
              shortDescription: row.quantity ? `${row.quantity} pieces of ${row.partNumber || ''}` : '',
              additionalNotes: part.additionalNotes || ''
            }));
          }

          return [];
        })
      };
    }

    // Regular machine entry
    return {
      machine: `${environment.apiBaseUrl}${environment.apiPath}/machines/${machine.id}`,
      notes: "string",
      mediaItems: allMediaItems, // Files at machine level (Excel files from spreadsheet)
      products: parts.flatMap(part => {
        const spreadsheetRows = part.spreadsheetData?.filter(row =>
          row.quantity || row.partNumber || row.partName
        ) || [];

        if (spreadsheetRows.length > 0) {
          return spreadsheetRows.map(row => ({
            partName: row.partName || '',
            partNumber: row.partNumber || '',
            quantity: row.quantity || '',
            shortDescription: row.quantity ? `${row.quantity} pieces of ${row.partNumber || ''}` : '',
            additionalNotes: part.additionalNotes || ''
          }));
        }

        return [];
      })
    };
  }

  /**
   * Generate consolidated Excel file with all machines as separate sheets
   */
  private async generateConsolidatedExcel(): Promise<UploadedFile | null> {
    // Collect all machines with valid data
    const machinesWithData: { machine: Machine; parts: Part[] }[] = [];

    for (const [machineId, parts] of this.machinePartsMap.entries()) {
      if (parts.length === 0) continue;

      const machine = this.machines.find(m => m.id === machineId);
      if (!machine) continue;

      const hasValidData = parts.some(part =>
        part.spreadsheetData?.some(row => row.quantity || row.partNumber || row.partName)
      );

      if (hasValidData) {
        machinesWithData.push({ machine, parts });
      }
    }

    if (machinesWithData.length === 0) {
      return null;
    }

    try {
      const workbook = XLSX.utils.book_new();
      let totalPartsAllMachines = 0;
      let totalQuantityAllMachines = 0;

      // Format current date
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = currentDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Create a sheet for each machine
      machinesWithData.forEach(({ machine, parts }, index) => {
        // Get all valid rows from all parts of this machine
        const allValidRows = parts.flatMap(part =>
          (part.spreadsheetData || []).filter(row =>
            row.quantity || row.partNumber || row.partName
          )
        );

        if (allValidRows.length === 0) return;

        // Calculate totals for this machine
        const totalQuantity = allValidRows.reduce((sum, row) => {
          const qty = parseInt(row.quantity || '0', 10);
          return sum + (isNaN(qty) ? 0 : qty);
        }, 0);

        totalPartsAllMachines += allValidRows.length;
        totalQuantityAllMachines += totalQuantity;

        // Get machine description (handle "Other" machines)
        const machineDescription = machine.id === 'other' && parts[0]?.data?.machineId
          ? `Other Machine: ${parts[0].data.machineId}`
          : machine.articleDescription;

        // Create worksheet data
        const worksheetData: (string | number)[][] = [
          ['DECKARD PART REQUEST'],
          [''],
          ['Machine:', machineDescription],
          ['Date:', `${formattedDate} at ${formattedTime}`],
          [''],
          ['Quantity', 'Part Number', 'Part Name'],
          ...allValidRows.map(row => [
            row.quantity || '',
            row.partNumber || '',
            row.partName || ''
          ]),
          [''],
          ['SUMMARY'],
          ['Total Parts:', allValidRows.length],
          ['Total Quantity:', totalQuantity],
          [''],
          ['Generated by Deckard Inquiry Tool']
        ];

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Set column widths
        worksheet['!cols'] = [
          { wch: 12 },
          { wch: 20 },
          { wch: 40 }
        ];

        // Apply bold formatting to specific cells
        const boldStyle = { font: { bold: true } };
        const boldCells = ['A1', 'A3', 'A4', 'A6', 'B6', 'C6']; // Title, Machine:, Date:, Column headers
        const summaryRowStart = 7 + allValidRows.length; // After data rows
        boldCells.push(`A${summaryRowStart}`, `A${summaryRowStart + 1}`, `A${summaryRowStart + 2}`); // SUMMARY, Total Parts:, Total Quantity:

        boldCells.forEach(cellRef => {
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = boldStyle;
          }
        });

        // Create safe sheet name (Excel limits to 31 chars, no special chars)
        let sheetName = machineDescription
          .replace(/[\\/*?[\]:]/g, '')
          .substring(0, 28);

        // Ensure unique sheet name
        if (index > 0) {
          sheetName = `${sheetName.substring(0, 25)}_${index + 1}`;
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Get current user information
      const currentUser = this.authService.getCurrentUser();

      // Build client address string
      const clientAddress = currentUser?.client ? [
        currentUser.client.address,
        currentUser.client.postalCode,
        currentUser.client.city,
        currentUser.client.country
      ].filter(Boolean).join(', ') : '';

      // Add a summary sheet at the beginning
      const summaryData: (string | number)[][] = [
        ['DECKARD INQUIRY SUMMARY'],
        [''],
        ['Date:', `${formattedDate} at ${formattedTime}`],
        [''],
        ['SUBMITTED BY'],
        ['Name:', currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''],
        ['Email:', currentUser?.email || ''],
        [''],
        ['CLIENT INFORMATION'],
        ['Company Name:', currentUser?.client?.name || ''],
        ['Client Code:', currentUser?.client?.code || ''],
        ['VAT Number:', currentUser?.client?.vatNumber || ''],
        ['Address:', clientAddress || currentUser?.address || ''],
        [''],
        ['MACHINES INCLUDED'],
        [''],
        ...machinesWithData.map(({ machine, parts }) => {
          const machineDesc = machine.id === 'other' && parts[0]?.data?.machineId
            ? `Other Machine: ${parts[0].data.machineId}`
            : machine.articleDescription;
          const partsCount = parts.flatMap(p =>
            (p.spreadsheetData || []).filter(row => row.quantity || row.partNumber || row.partName)
          ).length;
          return [machineDesc, `${partsCount} part(s)`];
        }),
        [''],
        ['GRAND TOTAL'],
        ['Total Machines:', machinesWithData.length],
        ['Total Parts:', totalPartsAllMachines],
        ['Total Quantity:', totalQuantityAllMachines],
        [''],
        ['Generated by Deckard Inquiry Tool']
      ];

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWorksheet['!cols'] = [
        { wch: 40 },
        { wch: 20 }
      ];

      // Apply bold formatting to summary sheet labels
      const boldStyle = { font: { bold: true } };
      const summaryBoldCells = [
        'A1',  // DECKARD INQUIRY SUMMARY
        'A3',  // Date:
        'A5',  // SUBMITTED BY
        'A6',  // Name:
        'A7',  // Email:
        'A9',  // CLIENT INFORMATION
        'A10', // Company Name:
        'A11', // Client Code:
        'A12', // VAT Number:
        'A13', // Address:
        'A15', // MACHINES INCLUDED
      ];

      // Calculate dynamic row positions for GRAND TOTAL section
      const machineListEndRow = 17 + machinesWithData.length;
      summaryBoldCells.push(
        `A${machineListEndRow}`,     // GRAND TOTAL
        `A${machineListEndRow + 1}`, // Total Machines:
        `A${machineListEndRow + 2}`, // Total Parts:
        `A${machineListEndRow + 3}`  // Total Quantity:
      );

      summaryBoldCells.forEach(cellRef => {
        if (summaryWorksheet[cellRef]) {
          summaryWorksheet[cellRef].s = boldStyle;
        }
      });

      // Insert summary sheet at the beginning
      workbook.SheetNames.unshift('Summary');
      workbook.Sheets['Summary'] = summaryWorksheet;

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      // Convert to Blob
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Create filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `Deckard_Inquiry_All_Machines_${timestamp}.xlsx`;

      // Convert to File
      const file = new File([blob], filename, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Create UploadedFile object
      const uploadedFile: UploadedFile = {
        name: filename,
        size: file.size,
        type: file.type,
        file: file,
        status: 'uploading',
        progress: 0
      };

      // Upload the file
      return new Promise((resolve, reject) => {
        this.mediaService.uploadFile(file)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (event) => {
              if (event.type === HttpEventType.UploadProgress && event.total) {
                uploadedFile.progress = Math.round((event.loaded / event.total) * 100);
              } else if (event.type === HttpEventType.Response && event.body) {
                uploadedFile.status = 'success';
                uploadedFile.progress = 100;
                uploadedFile.mediaItem = event.body;
                this.logger.debug('Consolidated Excel file uploaded successfully', { mediaItem: event.body });
                resolve(uploadedFile);
              }
            },
            error: (error) => {
              this.logger.error('Consolidated Excel upload failed', error);
              uploadedFile.status = 'error';
              uploadedFile.errorMessage = 'Failed to upload consolidated Excel file';
              reject(error);
            }
          });
      });
    } catch (error) {
      this.logger.error('Error generating consolidated Excel file', error);
      return null;
    }
  }

  /**
   * Generate Excel file from spreadsheet data and upload it
   */
  private async generateAndUploadExcel(part: Part, machineDescription: string): Promise<UploadedFile | null> {
    // Filter valid spreadsheet rows
    const validRows = part.spreadsheetData?.filter(row =>
      row.quantity || row.partNumber || row.partName
    ) || [];

    if (validRows.length === 0) {
      return null;
    }

    try {
      // Calculate total quantity
      const totalQuantity = validRows.reduce((sum, row) => {
        const qty = parseInt(row.quantity || '0', 10);
        return sum + (isNaN(qty) ? 0 : qty);
      }, 0);

      // Format current date
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = currentDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Create worksheet data with header, machine info, data, and summary
      const worksheetData: (string | number)[][] = [
        // Header section
        ['DECKARD PART REQUEST'],
        [''],
        ['Machine:', machineDescription],
        ['Date:', `${formattedDate} at ${formattedTime}`],
        [''],
        // Column headers
        ['Quantity', 'Part Number', 'Part Name'],
        // Data rows
        ...validRows.map(row => [
          row.quantity || '',
          row.partNumber || '',
          row.partName || ''
        ]),
        // Summary section
        [''],
        ['SUMMARY'],
        ['Total Parts:', validRows.length],
        ['Total Quantity:', totalQuantity],
        [''],
        ['Generated by Deckard Inquiry Tool']
      ];

      // Create worksheet and workbook
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 },  // Quantity
        { wch: 20 },  // Part Number
        { wch: 40 }   // Part Name
      ];

      // Apply bold formatting to specific cells
      const boldStyle = { font: { bold: true } };
      const boldCells = ['A1', 'A3', 'A4', 'A6', 'B6', 'C6']; // Title, Machine:, Date:, Column headers

      // Calculate dynamic row positions for summary section
      const summaryRowStart = 7 + validRows.length; // After data rows (row 7 is first data row)
      boldCells.push(
        `A${summaryRowStart}`,     // SUMMARY
        `A${summaryRowStart + 1}`, // Total Parts:
        `A${summaryRowStart + 2}`  // Total Quantity:
      );

      boldCells.forEach(cellRef => {
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = boldStyle;
        }
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Parts Request');

      // Generate Excel file as ArrayBuffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      // Convert to Blob
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Create filename with machine name and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const safeMachineName = machineDescription.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${safeMachineName}_parts_${timestamp}.xlsx`;

      // Convert Blob to File
      const file = new File([blob], filename, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Create UploadedFile object
      const uploadedFile: UploadedFile = {
        name: filename,
        size: file.size,
        type: file.type,
        file: file,
        status: 'uploading',
        progress: 0
      };

      // Upload the file using MediaService
      return new Promise((resolve, reject) => {
        this.mediaService.uploadFile(file)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (event) => {
              if (event.type === HttpEventType.UploadProgress && event.total) {
                uploadedFile.progress = Math.round((event.loaded / event.total) * 100);
              } else if (event.type === HttpEventType.Response && event.body) {
                uploadedFile.status = 'success';
                uploadedFile.progress = 100;
                uploadedFile.mediaItem = event.body;
                this.logger.debug('Excel file uploaded successfully', { mediaItem: event.body });
                resolve(uploadedFile);
              }
            },
            error: (error) => {
              this.logger.error('Excel upload failed', error);
              uploadedFile.status = 'error';
              uploadedFile.errorMessage = 'Failed to upload Excel file';
              reject(error);
            }
          });
      });
    } catch (error) {
      this.logger.error('Error generating Excel file', error);
      return null;
    }
  }

  /**
   * Submit the form
   */
  async onSubmit(): Promise<void> {
    // Agents must select a client before submitting
    if (this.isAgent && !this.agentClientSelectionService.getSelectedClient()) {
      alert('Please select a client before submitting.');
      return;
    }

    if (!this.isFormValid() || !this.selectedMachine) {
      return;
    }

    // Save current machine's parts to the map before processing
    if (this.parts.length > 0) {
      this.machinePartsMap.set(this.selectedMachine.id, [...this.parts]);
    }

    // Generate consolidated Excel file with all machines as separate sheets
    let consolidatedExcelFile: UploadedFile | null = null;
    if (this.machinePartsMap.size > 0) {
      try {
        consolidatedExcelFile = await this.generateConsolidatedExcel();
        if (consolidatedExcelFile && consolidatedExcelFile.status === 'success') {
          this.logger.debug('Consolidated Excel file generated successfully');
        }
      } catch (error) {
        this.logger.error('Failed to generate consolidated Excel', error);
      }
    }

    // Process all machines and generate individual Excel files
    const allManualCartItems: ManualCartItem[] = [];
    let isFirstMachine = true;

    // Iterate through all machines in the map
    for (const [machineId, parts] of this.machinePartsMap.entries()) {
      if (parts.length === 0) continue;

      // Find the machine object
      const machine = this.machines.find(m => m.id === machineId);
      if (!machine) continue;

      // Generate and upload Excel files for each part with spreadsheet data
      for (const part of parts) {
        const hasSpreadsheetData = part.spreadsheetData?.some(row =>
          row.quantity || row.partNumber || row.partName
        );

        if (hasSpreadsheetData) {
          try {
            const excelFile = await this.generateAndUploadExcel(part, machine.articleDescription);

            // Add the Excel file to the part's files array if upload was successful
            if (excelFile && excelFile.status === 'success') {
              part.files.push(excelFile);
              this.logger.debug('Excel file added to cart for machine', { machineDescription: machine.articleDescription });
            }

            // Add consolidated Excel to the first part of the first machine
            if (isFirstMachine && consolidatedExcelFile && consolidatedExcelFile.status === 'success') {
              part.files.push(consolidatedExcelFile);
              this.logger.debug('Consolidated Excel file added to first machine');
              isFirstMachine = false;
            }
          } catch (error) {
            this.logger.error('Failed to generate Excel for machine', { machineDescription: machine.articleDescription, error });
          }
        }
      }

      // Create cart items for this machine
      const machineCartItems = this.createManualCartItems(machine, parts);
      allManualCartItems.push(...machineCartItems);
    }

    // Attach agent client info to cart items
    const selectedClient = this.agentClientSelectionService.getSelectedClient();
    if (selectedClient) {
      allManualCartItems.forEach(item => {
        item.clientId = selectedClient.id;
        item.clientName = selectedClient.name;
        item.clientCode = selectedClient.code;
      });
    }

    // Add all cart items at once
    this.manualQuickCartService.addToCart(allManualCartItems);

    const inquiryData = this.createInquiryData();
    this.logger.debug('Form submission data', { inquiryData, itemCount: allManualCartItems.length });

    // Clear ALL saved machine data after submission
    this.machinePartsMap.clear();

    this.parts = [];
    this.isOtherMachineSelected = false;
    this.addPart();
  }

  // Image editing
  saveEditedImage(dataUrl: string): void {
    if (!this.previewImageSrc) return;

    for (const part of this.parts) {
      const fileIndex = part.files.findIndex(f => f.previewUrl === this.previewImageSrc);
      if (fileIndex !== -1) {
        const blob = this.dataURLToBlob(dataUrl);
        const editedFile = new File([blob], part.files[fileIndex].name, {
          type: part.files[fileIndex].type
        });

        const updatedFile = { ...part.files[fileIndex] };
        updatedFile.file = editedFile;

        if (updatedFile.previewUrl) {
          URL.revokeObjectURL(updatedFile.previewUrl);
        }
        updatedFile.previewUrl = URL.createObjectURL(editedFile);

        const newFiles = [...part.files];
        newFiles[fileIndex] = updatedFile;

        this.onFilesChanged(newFiles, this.parts.indexOf(part));
        this.previewImageSrc = updatedFile.previewUrl;
        break;
      }
    }
  }

  private dataURLToBlob(dataURL: string): Blob {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  }

  // Utility methods
  getTotalPartsCount(): number {
    let count = 0;

    count += this.parts.filter(part => this.hasValidPartsData([part])).length;

    this.machinePartsMap.forEach((parts, machineId) => {
      if (machineId !== this.selectedMachine?.id) {
        count += parts.filter(part => this.hasValidPartsData([part])).length;
      }
    });

    return count;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const filterElement = document.querySelector('.manual-entry__machine-filter');
    if (!filterElement?.contains(event.target as Node)) {
      this.isFilterOpen = false;
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Handle template population from dev tool
   */
  onPopulateTemplate(generatedData: GeneratedTemplateData[]): void {
    if (this.machines.length === 0) {
      this.logger.warn('No machines available to populate');
      return;
    }

    // Clear existing data and selection
    this.machinePartsMap.clear();
    this.parts = [];
    this.selectedMachine = null;
    this.isOtherMachineSelected = false;

    // Track regular machine index separately from "other" machines
    let regularMachineIndex = 0;
    let firstMachine: Machine | null = null;

    // Process each generated machine
    generatedData.forEach((genMachine) => {
      let machine: Machine;

      if (genMachine.isOther) {
        // Use the "Other" machine option
        machine = {
          '@id': '/machines/other',
          '@type': 'Machine',
          id: 'other',
          articleDescription: 'Other / Unlisted Machine',
          articleNumber: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ibStationNumber: 0,
          ibSerialNumber: 0,
          orderNumber: '',
          mcNumber: '',
          fiStationNumber: 0,
          fiSerialNumber: 0,
          featuredImage: null,
          imageGallery: [],
          documents: [],
          products: [],
          kmsIdentificationNumber: '',
          kmsIdNumber: ''
        };
      } else {
        // Get a regular machine from the list (cycle through if more generated than available)
        // Skip the "other" machine in the list
        const regularMachines = this.machines.filter(m => m.id !== 'other');
        machine = regularMachines[regularMachineIndex % regularMachines.length];
        regularMachineIndex++;
      }

      // Track first machine for initial selection
      if (!firstMachine) {
        firstMachine = machine;
      }

      // Create part with spreadsheet data
      const part: Part = {
        id: this.generateUniqueId(),
        files: [],
        spreadsheetData: genMachine.rows.map(row => ({ ...row })),
        additionalNotes: '',
        data: {
          machineId: genMachine.isOther ? (genMachine.machineId || '') : ''
        }
      };

      // Store in machine parts map
      this.machinePartsMap.set(machine.id, [part]);

      this.logger.debug(`Populated machine ${machine.articleDescription} with ${genMachine.rows.length} rows${genMachine.isOther ? ` (Machine ID: ${genMachine.machineId})` : ''}`);
    });

    // Select the first machine to show its data
    if (firstMachine) {
      this.selectMachine(firstMachine);
      // Force change detection to ensure spreadsheet receives data
      this.cdr.detectChanges();
    }

    this.logger.info(`Template populated with ${generatedData.length} machine(s)`);
  }
}
