import { Component, OnInit, ViewChild, OnDestroy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { AdvancedImagePreviewModalComponent } from '@shared/components/modals/advanced-image-preview-modal/advanced-image-preview-modal.component';
import { MachineService } from '@services/http/machine.service';
import { ManualQuickCartService } from '@services/cart/manual-quick-cart.service';
import { MediaService } from '@services/http/media.service';
import { ManualCartItem, Breadcrumb, UploadedFile, Part, Machine } from '@core/models';
import { IconComponent } from '@shared/components/icon/icon.component';
import { AuthService } from '@core/auth/auth.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';
import { ManagedClientResponse } from '@core/services/http/agent.service';
import { InquiryRequest } from '@services/http/inquiry.service';
import { ManualEntryStateService } from '@services/manual-entry-state.service';
import { InquiryMachine } from '@core/models/api/inquiry-api.model';
import { environment } from '@env/environment';
import { LoggerService, ScopedLogger } from '@services/logger.service';

// Extracted components
import { MachineSearchComponent } from '../components/machine-search/machine-search.component';
import { CarPickerComponent } from '../components/car-picker/car-picker.component';
import { PartsFormComponent } from '../components/parts-form/parts-form.component';

// Agent client select
import { AgentClientSelectComponent } from '@shared/components/agent-client-select/agent-client-select.component';

// Dev tools
import { FormPopulatorComponent, GeneratedMachine } from '@shared/components/dev-tools/form-populator/form-populator.component';

// Guard interface
import { CanComponentDeactivate } from '@core/guards/can-deactivate.guard';

@Component({
  selector: 'app-manual-entry-input-form',
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    AdvancedImagePreviewModalComponent,
    IconComponent,
    MachineSearchComponent,
    CarPickerComponent,
    PartsFormComponent,
    AgentClientSelectComponent,
    FormPopulatorComponent
  ],
  templateUrl: './manual-entry-input-form.component.html',
  styleUrls: ['./manual-entry-input-form.component.scss']
})
export class ManualEntryInputFormComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  private destroyRef = inject(DestroyRef);
  private logger!: ScopedLogger;

  // Agent state
  isAgent = false;
  selectedAgentClients: ManagedClientResponse[] = [];

  // Machine state
  selectedMachine: Machine | null = null;
  isOtherMachineSelected = false;

  // Image preview state
  showImagePreview = false;
  previewImageSrc = '';
  previewImageAlt = '';
  previewImageFileName = '';

  // Parts state
  parts: Part[] = [];
  machinePartsMap: Map<string, Part[]> = new Map();
  machineNamesMap: Map<string, string> = new Map();

  // UI state
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', link: '/dashboard' },
    { label: 'Manual Entry', link: '/manual-entry' }
  ];

  @ViewChild('partsForm') partsFormComponent?: PartsFormComponent;
  @ViewChild('machineSearch') machineSearchComponent?: MachineSearchComponent;

  constructor(
    private machineService: MachineService,
    private manualQuickCartService: ManualQuickCartService,
    private authService: AuthService,
    private agentClientSelectionService: AgentClientSelectionService,
    private mediaService: MediaService,
    private manualEntryStateService: ManualEntryStateService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('ManualEntryInputFormComponent');
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

    // Machines are now loaded by MachineSearchComponent
    // Parts are now managed by PartsFormComponent
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

  ngOnDestroy(): void {
    // Clean up file URLs from machinePartsMap
    this.machinePartsMap.forEach(parts => {
      parts.forEach(part => {
        part.files.forEach(file => {
          if (file.uploadSubscription && !file.uploadSubscription.closed) {
            file.uploadSubscription.unsubscribe();
          }
          if (file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl);
          }
        });
      });
    });

    // Clean up current parts
    this.parts.forEach(part => {
      part.files.forEach(file => {
        if (file.uploadSubscription && !file.uploadSubscription.closed) {
          file.uploadSubscription.unsubscribe();
        }
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    });
  }

  canDeactivate(): boolean {
    return !this.hasUnsavedData();
  }

  getComponentName(): string {
    return 'Use input form';
  }

  private hasUnsavedData(): boolean {
    const hasCurrentData = this.parts.some(part =>
      part.files.length > 0 ||
      part.data.partName ||
      part.data.shortDescription
    );

    if (hasCurrentData) {
      return true;
    }

    for (const [machineId, parts] of this.machinePartsMap.entries()) {
      const hasData = parts.some(part =>
        part.files.length > 0 ||
        part.data.partName ||
        part.data.shortDescription
      );
      if (hasData) {
        return true;
      }
    }

    return false;
  }

  selectMachine(machine: Machine): void {
    // Save current machine's parts before switching to preserve data
    if (this.selectedMachine && this.parts.length > 0) {
      this.machinePartsMap.set(this.selectedMachine.id, [...this.parts]);
    }

    this.selectedMachine = machine;
    this.isOtherMachineSelected = machine.id === 'other';

    // Store machine name for later lookup during submission
    if (machine.articleDescription) {
      this.machineNamesMap.set(machine.id, machine.articleDescription);
    }

    if (machine) {
      this.breadcrumbs = [
        { label: 'Dashboard', link: '/dashboard' },
        { label: 'Manual Entry', link: '/manual-entry' },
        { label: machine.articleDescription }
      ];

      if (this.machinePartsMap.has(machine.id)) {
        const savedParts = this.machinePartsMap.get(machine.id)!;
        this.parts = [...savedParts];
        // Update PartsFormComponent with saved parts
        if (this.partsFormComponent) {
          this.partsFormComponent.setParts([...savedParts]);
        }
      } else {
        this.parts = [];
        // Reset PartsFormComponent to initial state with empty part
        if (this.partsFormComponent) {
          this.partsFormComponent.reset();
        }
      }
    }

    // Save selected machine to service for persistence across routes
    this.manualEntryStateService.setSelectedMachine(machine);
    this.manualEntryStateService.setIsOtherMachineSelected(this.isOtherMachineSelected);
  }

  selectOtherMachine(): void {
    const otherMachine: Machine = {
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
    this.selectMachine(otherMachine);
  }

  onPartsChanged(parts: Part[]): void {
    this.parts = parts;
    if (this.selectedMachine) {
      this.machinePartsMap.set(this.selectedMachine.id, [...parts]);
    }
  }

  onValidityChanged(isValid: boolean): void {
    // Validity is handled by the isFormValid() method
  }

  closeDetails(): void {
    // Save parts before closing to preserve data
    if (this.selectedMachine && this.parts.length > 0) {
      this.machinePartsMap.set(this.selectedMachine.id, [...this.parts]);
    }

    this.selectedMachine = null;
    this.isOtherMachineSelected = false;
    this.breadcrumbs = [
      { label: 'Dashboard', link: '/dashboard' },
      { label: 'Manual Entry', link: '/manual-entry' }
    ];

    // Clear selected machine from service when closing details
    this.manualEntryStateService.clearSelectedMachine();
  }

  /**
   * Check if a single part is valid
   */
  private isPartValid(part: Part, isOtherMachine: boolean): boolean {
    return !!part.data.partName &&
      !!part.data.shortDescription &&
      (!isOtherMachine || !!part.data.machineId?.trim());
  }

  /**
   * Check if there's at least one valid part across all machines
   */
  isFormValid(): boolean {
    // Must have a selected machine
    if (!this.selectedMachine) {
      return false;
    }

    // Check if current machine has at least one valid part
    const hasValidCurrentParts = this.parts.some(part =>
      this.isPartValid(part, this.isOtherMachineSelected)
    );

    if (hasValidCurrentParts) {
      return true;
    }

    // Check if any other machine has at least one valid part
    let hasValidPartsInMap = false;

    this.machinePartsMap.forEach((parts, machineId) => {
      const isOtherMachine = machineId === 'other';
      const hasValidParts = parts.some(part => this.isPartValid(part, isOtherMachine));

      if (hasValidParts) {
        hasValidPartsInMap = true;
      }
    });

    return hasValidPartsInMap;
  }

  openImagePreview(file: UploadedFile): void {
    if (this.isImageFile(file.name) && file.previewUrl) {
      this.previewImageSrc = file.previewUrl;
      this.previewImageAlt = file.name;
      this.previewImageFileName = file.name;
      this.showImagePreview = true;
    }
  }

  closeImagePreview(): void {
    this.showImagePreview = false;
  }

  isImageFile(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '');
  }

  onSubmit(): void {
    // Agents must select a client before submitting
    if (this.isAgent && !this.agentClientSelectionService.getSelectedClient()) {
      alert('Please select a client before submitting.');
      return;
    }

    if (this.isFormValid() && this.selectedMachine) {
      // First, save current machine's parts to the map
      if (this.parts.length > 0) {
        this.machinePartsMap.set(this.selectedMachine.id, [...this.parts]);
      }

      // Collect ALL VALID parts from ALL machines for the cart
      const allManualCartItems: ManualCartItem[] = [];
      const machineEntries: InquiryMachine[] = [];

      // Iterate through all machines in the map
      this.machinePartsMap.forEach((parts, machineId) => {
        if (parts.length === 0) return;

        // Determine if this is an "Other" machine
        const isOtherMachine = machineId === 'other';

        // Filter to get only VALID parts for this machine
        const validParts = parts.filter(part => this.isPartValid(part, isOtherMachine));

        // Skip this machine if it has no valid parts
        if (validParts.length === 0) return;

        // Get the machine name from our stored map
        const storedMachineName = this.machineNamesMap.get(machineId);

        // Create cart items for each VALID part in this machine
        validParts.forEach(part => {
          const machineIdForCart = isOtherMachine && part.data.machineId
            ? part.data.machineId
            : machineId;
          const machineNameForCart = isOtherMachine && part.data.machineId
            ? `Other Machine: ${part.data.machineId}`
            : (storedMachineName || 'Unknown Machine');

          allManualCartItems.push({
            id: this.generateUniqueId(),
            machineId: machineIdForCart,
            machineName: machineNameForCart,
            partData: {
              partName: part.data.partName || '',
              partNumber: part.data.partNumber || '',
              shortDescription: part.data.shortDescription || '',
              additionalNotes: part.data.additionalNotes || '',
              mediaItems: part.files
                .filter(file => file.status === 'success' && file.mediaItem)
                .map(file => file.mediaItem!)
            },
            files: part.files.filter(file => file.status === 'success')
          });
        });

        // Create machine entry for inquiry data (only with VALID parts)
        if (isOtherMachine) {
          machineEntries.push({
            machine: validParts[0].data.machineId || null, // Custom machine identifier
            notes: `Inquiry for unlisted/custom machine: ${validParts[0].data.machineId}`,
            products: validParts.map(part => ({
              partName: part.data.partName || '',
              partNumber: part.data.partNumber || '',
              shortDescription: part.data.shortDescription || '',
              additionalNotes: part.data.additionalNotes || '',
              mediaItems: part.files
                .filter(file => file.status === 'success' && file.mediaItem)
                .map(file => '/api/v1/media_items/' + file.mediaItem!.id)
            }))
          });
        } else {
          machineEntries.push({
            machine: `${environment.apiBaseUrl}${environment.apiPath}/machines/${machineId}`,
            notes: "string",
            products: validParts.map(part => ({
              partName: part.data.partName || '',
              partNumber: part.data.partNumber || '',
              shortDescription: part.data.shortDescription || '',
              additionalNotes: part.data.additionalNotes || '',
              mediaItems: part.files
                .filter(file => file.status === 'success' && file.mediaItem)
                .map(file => '/api/v1/media_items/' + file.mediaItem!.id)
            }))
          });
        }
      });

      // Attach agent client info to cart items
      const selectedClient = this.agentClientSelectionService.getSelectedClient();
      if (selectedClient) {
        allManualCartItems.forEach(item => {
          item.clientId = selectedClient.id;
          item.clientName = selectedClient.name;
          item.clientCode = selectedClient.code;
        });
      }

      const currentUser = this.authService.getCurrentUser();
      const userId = currentUser?.id || 'current-user';

      // Add ALL valid items from ALL machines to cart
      this.manualQuickCartService.addToCart(allManualCartItems);

      const inquiryData: InquiryRequest = {
        status: "pending",
        notes: "Inquiry created via manual entry form",
        contactEmail: currentUser?.email || "string",
        contactPhone: 'string',
        isDraft: false,
        user: `${environment.apiBaseUrl}${environment.apiPath}/users/${userId}`,
        machines: machineEntries
      };

      this.logger.debug('Form submission data:', inquiryData);
      this.logger.debug(`Submitted ${allManualCartItems.length} valid parts to cart`);

      // Clear ALL saved machine data after submission
      this.machinePartsMap.clear();

      this.parts = [];
      this.isOtherMachineSelected = false;
      // PartsFormComponent will re-initialize when machine is selected again
    }
  }

  saveEditedImage(dataUrl: string): void {
    if (!this.previewImageSrc) return;

    for (const part of this.parts) {
      const fileIndex = part.files.findIndex(f => f.previewUrl === this.previewImageSrc);
      if (fileIndex !== -1) {
        const blob = this.dataURLToBlob(dataUrl);
        const editedFile = new File([blob], part.files[fileIndex].name, {
          type: part.files[fileIndex].type
        });

        URL.revokeObjectURL(part.files[fileIndex].previewUrl!);

        part.files[fileIndex].file = editedFile;
        part.files[fileIndex].previewUrl = URL.createObjectURL(editedFile);

        if (part.files[fileIndex].status === 'success') {
          part.files[fileIndex].status = 'uploading';
          part.files[fileIndex].progress = 0;

          if (part.files[fileIndex].mediaItem) {
            this.mediaService.deleteMediaItem(part.files[fileIndex].mediaItem!.id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                error: (error) => this.logger.error('Failed to delete old file:', error)
              });
          }

          this.uploadFileAfterEdit(this.parts.indexOf(part), part.files[fileIndex]);
        }

        this.previewImageSrc = part.files[fileIndex].previewUrl;

        if (this.selectedMachine) {
          this.machinePartsMap.set(this.selectedMachine.id, [...this.parts]);
        }
        break;
      }
    }
  }

  /**
   * Upload file after image editing
   * This is a simplified version that delegates to the FileUploadComponent's logic
   * TODO: Consider refactoring to emit an event to PartsFormComponent/FileUploadComponent
   */
  private uploadFileAfterEdit(partIndex: number, file: UploadedFile): void {
    // For now, the file is marked as uploading and the actual upload
    // will be handled by re-triggering the FileUploadComponent
    // This is a known technical debt from the component split
    this.logger.warn('File upload after edit needs to be delegated to FileUploadComponent');
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

  private generateUniqueId(): string {
    return 'part_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  }

  /**
   * Handle form population from dev tool
   */
  onPopulateForm(generatedData: GeneratedMachine[]): void {
    if (!this.machineSearchComponent) {
      this.logger.warn('Machine search component not available');
      return;
    }

    const machines = this.machineSearchComponent.machines();
    if (machines.length === 0) {
      this.logger.warn('No machines available to populate');
      return;
    }

    // Clear existing data
    this.machinePartsMap.clear();
    this.parts = [];

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
        machine = machines[regularMachineIndex % machines.length];
        regularMachineIndex++;
      }

      // Track first machine for initial selection
      if (!firstMachine) {
        firstMachine = machine;
      }

      // Generate parts for this machine
      const parts: Part[] = genMachine.parts.map((genPart, partIndex) => ({
        id: this.generateUniqueId(),
        data: {
          partName: genPart.partName,
          partNumber: genPart.partNumber,
          shortDescription: genPart.shortDescription,
          additionalNotes: genPart.additionalNotes,
          machineId: genMachine.isOther ? (genMachine.machineId || '') : machine.id
        },
        files: [],
        spreadsheetData: [],
        touched: false,
        isExpanded: partIndex === 0 // Expand first part
      }));

      // Store in machine parts map
      this.machinePartsMap.set(machine.id, parts);
      this.machineNamesMap.set(machine.id, machine.articleDescription || 'Unknown Machine');

      this.logger.debug(`Populated machine ${machine.articleDescription} with ${parts.length} parts${genMachine.isOther ? ` (Machine ID: ${genMachine.machineId})` : ''}`);
    });

    // Select the first machine to show its parts
    if (firstMachine) {
      this.selectMachine(firstMachine);
    }

    this.logger.info(`Form populated with ${generatedData.length} machine(s)`);
  }
}
