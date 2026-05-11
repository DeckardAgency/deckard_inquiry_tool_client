import { Component, OnInit, OnDestroy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { ManualCartItem, UploadedFile } from '@core/models';
import { ManualCartService } from '@services/cart/manual-cart.service';
import { ManualQuickCartService } from '@services/cart/manual-quick-cart.service';
import { AuthService } from '@core/auth/auth.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';
import { Breadcrumb, SectionState } from '@core/models';
import {CartSwitcherComponent} from '@shared/components/cart-switcher/cart-switcher.component';
import { environment } from '@env/environment';
import { LoggerService, ScopedLogger } from '@services/logger.service';

export interface MachineGroup {
  machineId: string;
  machineName: string;
  items: ManualCartItem[];
  originalIndices: number[]; // Track original indices for remove/edit operations
}

@Component({
    selector: 'app-manual-entry-cart',
    imports: [CommonModule, ReactiveFormsModule, RouterModule, BreadcrumbsComponent, CartSwitcherComponent],
    templateUrl: './manual-entry-cart.component.html',
    styleUrls: ['./manual-entry-cart.component.scss']
})
export class ManualEntryCartComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  private logger!: ScopedLogger;

  cartItems: ManualCartItem[] = [];
  groupedItems: MachineGroup[] = [];

  // Track the expanded/collapsed state of each section for each item
  // Key format: "machineIndex-itemIndex-sectionName"
  sectionStates: { [key: string]: boolean } = {};

  // Track expanded state for machine groups
  expandedMachines: Set<string> = new Set();

  breadcrumbs: Breadcrumb[] = [
    { label: 'Manual Entry Cart' }
  ];

  referenceNumber: string = '';

  constructor(
    private manualCartService: ManualCartService,
    public manualQuickCartService: ManualQuickCartService,
    private authService: AuthService,
    private agentClientSelectionService: AgentClientSelectionService,
    private router: Router,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('ManualEntryCartComponent');
  }

  ngOnInit(): void {
    // Subscribe to cart changes
    this.manualCartService.getCartItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(items => {
        this.cartItems = items;
        this.groupedItems = this.groupItemsByMachine(items);

        // Auto-expand first machine group
        if (this.groupedItems.length > 0 && this.expandedMachines.size === 0) {
          this.expandedMachines.add(this.groupedItems[0].machineId);
        }
      });

    // Load reference number from sessionStorage if available
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const savedReference = sessionStorage.getItem('manualInquiryReferenceNumber');
      if (savedReference) {
        this.referenceNumber = savedReference;
      }
    }
  }

  /**
   * Group cart items by machine
   */
  private groupItemsByMachine(items: ManualCartItem[]): MachineGroup[] {
    const groupMap = new Map<string, MachineGroup>();

    items.forEach((item, index) => {
      const machineId = item.machineId || 'unknown';
      const machineName = item.machineName || 'Unknown Machine';

      if (!groupMap.has(machineId)) {
        groupMap.set(machineId, {
          machineId,
          machineName,
          items: [],
          originalIndices: []
        });
      }

      const group = groupMap.get(machineId)!;
      group.items.push(item);
      group.originalIndices.push(index);
    });

    return Array.from(groupMap.values());
  }

  /**
   * Toggle machine group expanded state
   */
  toggleMachineGroup(machineId: string): void {
    if (this.expandedMachines.has(machineId)) {
      this.expandedMachines.delete(machineId);
    } else {
      this.expandedMachines.add(machineId);
    }
  }

  /**
   * Check if machine group is expanded
   */
  isMachineExpanded(machineId: string): boolean {
    return this.expandedMachines.has(machineId);
  }

  ngOnDestroy(): void {
    // Subscriptions are automatically cleaned up by takeUntilDestroyed

    // Clear reference number from sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('manualInquiryReferenceNumber');
    }
  }

  /**
   * Remove an item from the cart
   */
  removeItem(index: number): void {
    this.manualQuickCartService.removeFromCart(index);
  }

  /**
   * Edit an item in the cart
   */
  editItem(index: number): void {
    // Navigate back to manual entry with the item pre-loaded for editing
    this.logger.debug('Edit item', { index });
    // This would typically navigate back to manual entry page with this item loaded
  }

  /**
   * Clear the entire cart
   */
  clearCart(): void {
    this.manualQuickCartService.clearCart();
  }

  /**
   * Place the inquiry (submit to backend)
   */
  placeInquiry(): void {
    // Check if cart is empty
    if (this.cartItems.length === 0) {
      alert('Your cart is empty. Please add items before placing an inquiry.');
      return;
    }

    // Check if user is authenticated
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/manual-entry-cart' }
      });
      return;
    }

    // Confirm submission
    if (!confirm('Are you sure you want to submit this inquiry?')) {
      return;
    }

    // Build onBehalfOfClient IRI if agent has a selected client
    const selectedClient = this.agentClientSelectionService.getSelectedClient();
    const onBehalfOfClient = selectedClient ? `/api/v1/clients/${selectedClient.id}` : undefined;

    // Submit inquiry via the service
    this.manualQuickCartService.submitInquiry(
      this.cartItems,
      this.referenceNumber || undefined,
      onBehalfOfClient
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.logger.debug('Inquiry submitted', { response });

          // Clear the cart after successful submission
          this.manualQuickCartService.clearCart();

          // Clear reference number from sessionStorage
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.removeItem('manualInquiryReferenceNumber');
          }

          // Navigate to inquiry confirmation page with query parameters
          this.router.navigate(['/inquiry-confirmation'], {
            queryParams: {
              inquiryId: response.id || response['@id'] || '',
              inquiryNumber: response.inquiryNumber || '',
              status: response.status || ''
            }
          });
        },
        error: (error) => {
          this.logger.error('Error submitting inquiry', error);
          alert('Failed to submit inquiry. Please try again.');
        }
      });
  }

  /**
   * Save draft of the inquiry
   */
  saveDraft(): void {
    // Check if cart is empty
    if (this.cartItems.length === 0) {
      alert('Your cart is empty. Please add items before saving a draft.');
      return;
    }

    // Check if user is authenticated
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/manual-entry-cart' }
      });
      return;
    }

    // Build onBehalfOfClient IRI if agent has a selected client
    const selectedClientForDraft = this.agentClientSelectionService.getSelectedClient();
    const onBehalfOfClientForDraft = selectedClientForDraft ? `/api/v1/clients/${selectedClientForDraft.id}` : undefined;

    // Save draft via the service
    this.manualQuickCartService.saveDraft(
      this.cartItems,
      this.referenceNumber || undefined,
      onBehalfOfClientForDraft
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.logger.debug('Draft saved', { response });
          alert('Inquiry saved as draft successfully!');

          // Clear reference number from sessionStorage
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.removeItem('manualInquiryReferenceNumber');
          }

          // Navigate to drafts page
          this.router.navigate(['/my-inquiries/drafts']);
        },
        error: (error) => {
          this.logger.error('Error saving draft', error);
          alert('Failed to save draft. Please try again.');
        }
      });
  }

  /**
   * Download a file
   */
  downloadFile(file: UploadedFile): void {
    // If file has a mediaItem with filePath, download from server
    if (file.mediaItem && file.mediaItem.filePath) {
      const fileUrl = `${environment.apiBaseUrl}${file.mediaItem.filePath}`;
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    // If file object exists, create download from blob
    else if (file.file) {
      const url = URL.createObjectURL(file.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Check if a file is an image based on extension
   */
  isImageFile(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '');
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Track by function for ngFor loops - improve performance by tracking items by unique ID
   */
  trackByFn(index: number, item: ManualCartItem): string {
    return item.id;
  }

  /**
   * Track by function for file items - track by file name
   */
  trackByFileName(index: number, file: UploadedFile): string {
    return file.name;
  }

  /**
   * Toggle the expanded/collapsed state of a section
   */
  toggleSection(machineIndex: number, itemIndex: number, sectionName: 'details' | 'files' | 'notes', event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const key = `${machineIndex}-${itemIndex}-${sectionName}`;
    this.sectionStates[key] = !this.sectionStates[key];
  }

  /**
   * Get the current state of a section
   */
  getSectionState(machineIndex: number, itemIndex: number, sectionName: 'details' | 'files' | 'notes'): boolean {
    const key = `${machineIndex}-${itemIndex}-${sectionName}`;
    return this.sectionStates[key] || false;
  }

  /**
   * Get visible files (excludes Excel files which are auto-generated from spreadsheet)
   */
  getVisibleFiles(files: UploadedFile[]): UploadedFile[] {
    if (!files) return [];
    return files.filter(file => {
      const fileName = file.name.toLowerCase();
      return !fileName.endsWith('.xls') && !fileName.endsWith('.xlsx');
    });
  }

  /**
   * Track by function for machine groups
   */
  trackByMachineId(index: number, group: MachineGroup): string {
    return group.machineId;
  }
}
