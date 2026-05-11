import { Component, Input, Output, EventEmitter, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggerService, ScopedLogger } from '@services/logger.service';

export interface CropSelection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Crop Tool Component
 *
 * Handles image cropping functionality:
 * - Visual crop selection overlay
 * - Click-to-define crop area
 * - Keyboard shortcut (Enter) to apply crop
 * - Coordinate transformation for rotated images
 *
 * Extracted from advanced-image-preview-modal for better separation of concerns.
 */
@Component({
  selector: 'app-crop-tool',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './crop-tool.component.html',
  styleUrls: ['./crop-tool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CropToolComponent {
  // Inputs
  @Input() isActive: boolean = false;
  @Input() imageRotation: number = 0;

  // Outputs
  @Output() cropApplied = new EventEmitter<CropSelection>();
  @Output() cropCancelled = new EventEmitter<void>();

  // Crop state
  cropStarted: boolean = false;
  cropSelectionFinalized: boolean = false;
  cropStart = { x: 0, y: 0 };
  cropEnd = { x: 0, y: 0 };

  // Make Math available in template
  readonly Math: typeof Math = Math;

  private logger!: ScopedLogger;

  constructor(private loggerService: LoggerService) {
    this.logger = this.loggerService.createLogger('CropToolComponent');
  }

  /**
   * Handle keyboard events
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // Apply crop when Enter key is pressed and crop selection is finalized
    if (event.key === 'Enter' && this.isActive && this.cropStarted && this.cropSelectionFinalized) {
      this.applyCrop();
    }

    // Cancel crop with Escape key
    if (event.key === 'Escape' && this.isActive) {
      this.cancelCrop();
    }
  }

  /**
   * Start or update crop selection
   */
  onMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!this.isActive) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (!this.cropStarted) {
      // First click: Start crop selection
      this.cropStarted = true;
      this.cropSelectionFinalized = false;
      this.cropStart = { x, y };
      this.cropEnd = { x, y };
    } else if (!this.cropSelectionFinalized) {
      // Second click: Finalize crop selection
      this.cropSelectionFinalized = true;
    } else {
      // If already finalized, start a new crop selection
      this.cropSelectionFinalized = false;
      this.cropStart = { x, y };
      this.cropEnd = { x, y };
    }
  }

  /**
   * Update crop selection during mouse move
   */
  onMouseMove(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!this.isActive || !this.cropStarted || this.cropSelectionFinalized) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.cropEnd = { x, y };
  }

  /**
   * Validate and apply crop
   */
  applyCrop(): void {
    if (!this.cropStarted) {
      this.logger.warn('No crop area selected');
      return;
    }

    // Calculate crop dimensions
    const width = Math.abs(this.cropEnd.x - this.cropStart.x);
    const height = Math.abs(this.cropEnd.y - this.cropStart.y);

    // Validate crop size
    if (width < 10 || height < 10) {
      this.logger.warn('Crop area too small (minimum 10x10 pixels)');
      return;
    }

    // Emit crop selection
    this.cropApplied.emit({
      startX: Math.min(this.cropStart.x, this.cropEnd.x),
      startY: Math.min(this.cropStart.y, this.cropEnd.y),
      endX: Math.max(this.cropStart.x, this.cropEnd.x),
      endY: Math.max(this.cropStart.y, this.cropEnd.y)
    });

    // Reset crop state
    this.reset();
  }

  /**
   * Cancel crop operation
   */
  cancelCrop(): void {
    this.reset();
    this.cropCancelled.emit();
  }

  /**
   * Reset crop state
   */
  reset(): void {
    this.cropStarted = false;
    this.cropSelectionFinalized = false;
    this.cropStart = { x: 0, y: 0 };
    this.cropEnd = { x: 0, y: 0 };
  }

  /**
   * Get crop overlay style
   */
  getCropOverlayStyle(): { left: string; top: string; width: string; height: string } | Record<string, never> {
    if (!this.cropStarted) return {};

    return {
      left: `${Math.min(this.cropStart.x, this.cropEnd.x)}px`,
      top: `${Math.min(this.cropStart.y, this.cropEnd.y)}px`,
      width: `${Math.abs(this.cropEnd.x - this.cropStart.x)}px`,
      height: `${Math.abs(this.cropEnd.y - this.cropStart.y)}px`
    };
  }
}
