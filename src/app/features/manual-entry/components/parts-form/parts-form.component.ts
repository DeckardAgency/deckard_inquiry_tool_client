import { Component, Input, Output, EventEmitter, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Machine, Part, UploadedFile } from '@core/models';
import { IconComponent } from '@shared/components/icon/icon.component';
import { FileUploadComponent } from '../file-upload/file-upload.component';

/**
 * Parts Form Component
 *
 * Handles the parts array management, form validation, and add/remove functionality.
 * Extracted from manual-entry-input-form for better separation of concerns.
 *
 * @example
 * ```html
 * <app-parts-form
 *   [selectedMachine]="selectedMachine()"
 *   [isOtherMachine]="isOtherMachine()"
 *   (partsChanged)="onPartsChanged($event)"
 *   (validityChanged)="onValidityChanged($event)"
 *   (fileUploadRequested)="onFileUploadRequested($event)">
 * </app-parts-form>
 * ```
 */
@Component({
  selector: 'app-parts-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    FileUploadComponent
  ],
  templateUrl: './parts-form.component.html',
  styleUrls: ['./parts-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartsFormComponent {
  // Inputs
  @Input() selectedMachine: Machine | null = null;
  @Input() isOtherMachine = false;

  // Outputs
  @Output() partsChanged = new EventEmitter<Part[]>();
  @Output() validityChanged = new EventEmitter<boolean>();
  @Output() partTouchedChanged = new EventEmitter<{ partIndex: number; touched: boolean }>();
  @Output() fileUploadRequested = new EventEmitter<{ partIndex: number }>();
  @Output() fileRemoveRequested = new EventEmitter<{ partIndex: number; file: UploadedFile }>();
  @Output() filePreviewRequested = new EventEmitter<UploadedFile>();

  // State
  parts = signal<Part[]>([]);

  // Computed
  isFormValid = computed(() => {
    return this.parts().some(part => this.isPartValid(part));
  });

  /**
   * Initialize with first part
   */
  ngOnInit(): void {
    if (this.parts().length === 0) {
      this.addPart();
    }
  }

  /**
   * Add a new part
   */
  addPart(): void {
    // Close all existing parts
    this.parts.update(parts => {
      const updatedParts = parts.map(part => ({
        ...part,
        isExpanded: false
      }));

      const newPart: Part = {
        id: this.generateUniqueId(),
        data: {
          partName: '',
          partNumber: '',
          shortDescription: '',
          additionalNotes: '',
          machineId: this.isOtherMachine ? '' : (this.selectedMachine?.id || '')
        },
        files: [],
        spreadsheetData: [],
        touched: false,
        isExpanded: true
      };

      const newParts = [...updatedParts, newPart];
      this.emitChanges(newParts);
      return newParts;
    });

    // Scroll to new part after DOM update
    setTimeout(() => this.scrollToNewPart(), 100);
  }

  /**
   * Remove a part by index
   */
  removePart(index: number): void {
    if (this.parts().length > 1) {
      this.parts.update(parts => {
        // Clean up file URLs
        parts[index].files.forEach(file => {
          if (file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl);
          }
        });

        const newParts = parts.filter((_, i) => i !== index);

        // If only one part remains, expand it
        if (newParts.length === 1) {
          newParts[0].isExpanded = true;
        }

        this.emitChanges(newParts);
        return newParts;
      });
    }
  }

  /**
   * Toggle part accordion
   */
  togglePartAccordion(index: number): void {
    this.parts.update(parts => {
      const newParts = [...parts];
      newParts[index] = {
        ...newParts[index],
        isExpanded: !newParts[index].isExpanded
      };
      this.emitChanges(newParts);
      return newParts;
    });
  }

  /**
   * Update part data
   */
  updatePartData(index: number, field: keyof Part['data'], value: string): void {
    this.parts.update(parts => {
      const newParts = [...parts];
      newParts[index] = {
        ...newParts[index],
        data: {
          ...newParts[index].data,
          [field]: value
        }
      };
      this.emitChanges(newParts);
      return newParts;
    });
  }

  /**
   * Mark part as touched for validation
   */
  markPartAsTouched(index: number): void {
    this.parts.update(parts => {
      const newParts = [...parts];
      newParts[index] = {
        ...newParts[index],
        touched: true
      };
      this.partTouchedChanged.emit({ partIndex: index, touched: true });
      this.emitChanges(newParts);
      return newParts;
    });
  }

  /**
   * Check if a part is valid
   */
  isPartValid(part: Part): boolean {
    const hasBasicFields = !!part.data.partName?.trim() &&
      !!part.data.shortDescription?.trim();

    // If "Other" machine, also require machineId
    if (this.isOtherMachine) {
      return hasBasicFields && !!part.data.machineId?.trim();
    }

    return hasBasicFields;
  }

  /**
   * Get validation errors for a part
   */
  getPartErrors(part: Part): string[] {
    const errors: string[] = [];

    if (!part.data.partName?.trim()) {
      errors.push('Part name is required');
    }
    if (!part.data.shortDescription?.trim()) {
      errors.push('Short description is required');
    }
    if (this.isOtherMachine && !part.data.machineId?.trim()) {
      errors.push('Machine ID is required for unlisted machines');
    }

    return errors;
  }

  /**
   * Show validation errors for a part
   */
  shouldShowErrors(part: Part): boolean {
    return (part.touched ?? false) && !this.isPartValid(part);
  }

  /**
   * Handle files changed from FileUploadComponent
   */
  onFilesChanged(partIndex: number, files: UploadedFile[]): void {
    this.parts.update(parts => {
      const newParts = [...parts];
      newParts[partIndex] = {
        ...newParts[partIndex],
        files: files
      };
      this.emitChanges(newParts);
      return newParts;
    });
  }

  /**
   * Handle file preview
   */
  onPreviewFile(file: UploadedFile): void {
    this.filePreviewRequested.emit(file);
  }

  /**
   * Update part files (called from parent after upload)
   */
  updatePartFiles(partIndex: number, files: UploadedFile[]): void {
    this.parts.update(parts => {
      const newParts = [...parts];
      newParts[partIndex] = {
        ...newParts[partIndex],
        files: files
      };
      this.emitChanges(newParts);
      return newParts;
    });
  }

  /**
   * Get parts for external access
   */
  getParts(): Part[] {
    return this.parts();
  }

  /**
   * Set parts from external source
   */
  setParts(parts: Part[]): void {
    this.parts.set(parts);
    this.emitChanges(parts);
  }

  /**
   * Reset parts to initial state with one empty part
   */
  reset(): void {
    // Clean up existing file URLs
    this.parts().forEach(part => {
      part.files.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    });

    // Clear parts and add fresh empty part
    this.parts.set([]);
    this.addPart();
  }

  /**
   * Generate unique ID for parts
   */
  private generateUniqueId(): string {
    return 'part_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  }

  /**
   * Scroll to newly added part
   */
  private scrollToNewPart(): void {
    const partElements = document.querySelectorAll('.part-repeater__item');
    if (partElements.length > 0) {
      const lastPart = partElements[partElements.length - 1];
      const elementPosition = lastPart.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - 140;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  /**
   * Emit changes to parent
   */
  private emitChanges(parts: Part[]): void {
    this.partsChanged.emit(parts);
    this.validityChanged.emit(parts.some(part => this.isPartValid(part)));
  }

  /**
   * Get part number for display
   */
  getPartNumber(index: number): number {
    return index + 1;
  }

  /**
   * Get accordion title
   */
  getAccordionTitle(part: Part, index: number): string {
    if (part.data.partName) {
      return `Part ${index + 1}: ${part.data.partName}`;
    }
    return `Part ${index + 1}`;
  }

  /**
   * Check if part has files
   */
  hasFiles(part: Part): boolean {
    return part.files && part.files.length > 0;
  }

  /**
   * Get file count for a part
   */
  getFileCount(part: Part): number {
    return part.files?.length || 0;
  }
}
