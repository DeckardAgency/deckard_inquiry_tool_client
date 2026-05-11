import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export enum DrawingMode {
  None = 'none',
  Freehand = 'freehand',
  Circle = 'circle',
  Text = 'text'
}

/**
 * Drawing Toolbar Component
 *
 * Provides UI controls for image annotation tools:
 * - Drawing modes (freehand, circle, text)
 * - Crop mode toggle
 * - Image rotation controls
 * - Color picker
 * - Font size controls (for text mode)
 * - Undo/redo/reset actions
 *
 * Extracted from advanced-image-preview-modal for better separation of concerns.
 */
@Component({
  selector: 'app-drawing-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drawing-toolbar.component.html',
  styleUrls: ['./drawing-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DrawingToolbarComponent {
  // Inputs
  @Input() drawingMode: DrawingMode = DrawingMode.None;
  @Input() isCropMode: boolean = false;
  @Input() currentColor: string = '#dc3545';
  @Input() fontSize: number = 24;

  // Outputs
  @Output() drawingModeChange = new EventEmitter<DrawingMode>();
  @Output() cropModeToggle = new EventEmitter<void>();
  @Output() rotateImage = new EventEmitter<number>();
  @Output() colorChange = new EventEmitter<string>();
  @Output() fontSizeChange = new EventEmitter<number>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();

  // Expose DrawingMode enum to template
  readonly DrawingMode = DrawingMode;

  /**
   * Toggle between drawing modes
   */
  toggleDrawingMode(mode: DrawingMode): void {
    if (this.drawingMode === mode) {
      this.drawingModeChange.emit(DrawingMode.None);
    } else {
      this.drawingModeChange.emit(mode);
    }
  }

  /**
   * Toggle crop mode
   */
  onCropModeToggle(): void {
    this.cropModeToggle.emit();
  }

  /**
   * Rotate image by degrees
   */
  onRotateImage(degrees: number): void {
    this.rotateImage.emit(degrees);
  }

  /**
   * Handle color change
   */
  onColorChange(color: string): void {
    this.colorChange.emit(color);
  }

  /**
   * Handle font size change
   */
  onFontSizeChange(size: number): void {
    this.fontSizeChange.emit(size);
  }

  /**
   * Emit undo action
   */
  onUndo(): void {
    this.undo.emit();
  }

  /**
   * Emit redo action
   */
  onRedo(): void {
    this.redo.emit();
  }

  /**
   * Emit reset action
   */
  onReset(): void {
    this.reset.emit();
  }
}
