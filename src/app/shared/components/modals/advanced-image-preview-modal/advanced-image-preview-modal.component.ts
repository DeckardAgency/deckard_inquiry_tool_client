/**
 * Advanced Image Preview Modal Component
 *
 * This component provides a modal interface for viewing and editing images with various annotation tools.
 *
 * Features:
 * - Drawing tools: freehand, circle, and text annotations
 * - Image cropping
 * - Image rotation
 * - Undo/redo functionality
 *
 * Refactored (2025-01-XX):
 * - Extracted DrawingToolbarComponent for toolbar UI
 * - Extracted CanvasDrawingService for drawing operations
 * - Extracted HistoryManagerService for undo/redo
 * - Extracted CropToolComponent for crop functionality
 * - Main component now orchestrates extracted services/components
 */
import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Extracted components
import { DrawingToolbarComponent, DrawingMode } from './components/drawing-toolbar.component';
import { CropToolComponent, CropSelection } from './components/crop-tool.component';

// Extracted services
import { CanvasDrawingService } from './services/canvas-drawing.service';
import { HistoryManagerService } from './services/history-manager.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-advanced-image-preview-modal',
  imports: [
    CommonModule,
    FormsModule,
    DrawingToolbarComponent,
    CropToolComponent
  ],
  providers: [
    CanvasDrawingService,
    HistoryManagerService
  ],
  templateUrl: './advanced-image-preview-modal.component.html',
  styleUrls: ['./advanced-image-preview-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdvancedImagePreviewModalComponent implements OnInit, AfterViewInit {
  @Input() imageSrc: string = '';
  @Input() imageAlt: string = 'Image preview';
  @Input() imageFileName: string = 'image.jpg';
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveImage = new EventEmitter<string>();

  // Canvas references for drawing
  @ViewChild('previewImage') previewImage!: ElementRef<HTMLImageElement>;
  @ViewChild('annotationCanvas') annotationCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('textInput') textInput!: ElementRef<HTMLInputElement>;
  @ViewChild('cropTool') cropTool!: CropToolComponent;

  // Drawing modes
  readonly DrawingMode = DrawingMode;
  drawingMode: DrawingMode = DrawingMode.None;

  // Text annotation properties
  isAddingText: boolean = false;
  currentText: string = '';
  textPosition = { x: 0, y: 0 };
  fontSize: number = 24;

  // Crop mode
  isCropMode: boolean = false;

  // Rotation properties
  imageRotation: number = 0;

  // Toolbar state
  currentColor: string = '#dc3545';

  // Make Math available in the template
  readonly Math: typeof Math = Math;

  private logger!: ScopedLogger;

  constructor(
    private canvasDrawingService: CanvasDrawingService,
    private historyManager: HistoryManagerService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('AdvancedImagePreviewModalComponent');
  }

  ngOnInit(): void {
    // Initialization
  }

  ngAfterViewInit(): void {
    // Setup canvas after view is initialized
    requestAnimationFrame(() => {
      this.setupCanvas();
    });
  }

  setupCanvas(): void {
    if (!this.annotationCanvas || !this.previewImage) {
      this.logger.warn('Canvas or image element not available');
      return;
    }

    const canvas = this.annotationCanvas.nativeElement;
    const img = this.previewImage.nativeElement;

    const success = this.canvasDrawingService.setupCanvas(canvas, img);
    if (success) {
      // Save initial state in history
      const ctx = this.canvasDrawingService.getContext();
      if (ctx) {
        this.historyManager.saveToHistory(ctx, canvas);
      }
    }
  }

  onImageLoad(): void {
    this.setupCanvas();
  }

  // Toolbar event handlers
  onDrawingModeChange(mode: DrawingMode): void {
    this.drawingMode = mode;
    this.canvasDrawingService.setDrawingMode(mode);

    if (this.drawingMode !== DrawingMode.None) {
      this.isCropMode = false;
    }

    // Reset text input if switching away from text mode
    if (this.isAddingText && mode !== DrawingMode.Text) {
      this.isAddingText = false;
    }
  }

  onCropModeToggle(): void {
    this.isCropMode = !this.isCropMode;
    if (this.isCropMode) {
      this.drawingMode = DrawingMode.None;
      this.canvasDrawingService.setDrawingMode(DrawingMode.None);
      if (this.cropTool) {
        this.cropTool.reset();
      }
    }
  }

  onRotateImage(degrees: number): void {
    this.imageRotation = (this.imageRotation + degrees) % 360;

    // Need to update canvas setup after rotation
    requestAnimationFrame(() => {
      this.setupCanvas();
    });
  }

  onColorChange(color: string): void {
    this.currentColor = color;
    this.canvasDrawingService.setColor(color);
  }

  onFontSizeChange(size: number): void {
    this.fontSize = size;
  }

  onUndo(): void {
    const ctx = this.canvasDrawingService.getContext();
    if (ctx) {
      this.historyManager.undo(ctx);
    }
  }

  onRedo(): void {
    const ctx = this.canvasDrawingService.getContext();
    if (ctx) {
      this.historyManager.redo(ctx);
    }
  }

  onReset(): void {
    this.canvasDrawingService.reset();
    this.historyManager.clear();

    // Reset rotation
    this.imageRotation = 0;

    // Reset crop mode
    this.isCropMode = false;
    if (this.cropTool) {
      this.cropTool.reset();
    }

    // Reset drawing mode
    this.drawingMode = DrawingMode.None;
    this.canvasDrawingService.setDrawingMode(DrawingMode.None);

    // Reset text input
    this.isAddingText = false;
    this.currentText = '';

    // Save fresh state
    const ctx = this.canvasDrawingService.getContext();
    const canvas = this.canvasDrawingService.getCanvas();
    if (ctx && canvas) {
      this.historyManager.saveToHistory(ctx, canvas);
    }
  }

  // Canvas drawing event handlers
  startDrawing(event: MouseEvent): void {
    const rect = this.annotationCanvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Handle crop mode
    if (this.isCropMode && this.cropTool) {
      this.cropTool.onMouseDown(event, this.annotationCanvas.nativeElement);
      return;
    }

    if (this.drawingMode === DrawingMode.None) return;

    if (this.drawingMode === DrawingMode.Text) {
      // Set position for text input
      this.textPosition = { x, y };
      this.isAddingText = true;

      // Focus the text input
      setTimeout(() => {
        if (this.textInput) {
          this.textInput.nativeElement.focus();
        }
      }, 0);
      return;
    }

    this.canvasDrawingService.startDrawing(x, y);
  }

  draw(event: MouseEvent): void {
    const rect = this.annotationCanvas.nativeElement.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    // Handle crop mode
    if (this.isCropMode && this.cropTool) {
      this.cropTool.onMouseMove(event, this.annotationCanvas.nativeElement);
      return;
    }

    this.canvasDrawingService.draw(currentX, currentY);
  }

  stopDrawing(): void {
    const shouldSaveHistory = this.canvasDrawingService.stopDrawing();

    // Save state to history when stroke is complete
    if (shouldSaveHistory) {
      const ctx = this.canvasDrawingService.getContext();
      const canvas = this.canvasDrawingService.getCanvas();
      if (ctx && canvas) {
        this.historyManager.saveToHistory(ctx, canvas);
      }
    }
  }

  // Text handling
  confirmTextInput(): void {
    const success = this.canvasDrawingService.addText(
      this.currentText,
      this.textPosition.x,
      this.textPosition.y,
      this.fontSize
    );

    if (success) {
      // Save state to history
      const ctx = this.canvasDrawingService.getContext();
      const canvas = this.canvasDrawingService.getCanvas();
      if (ctx && canvas) {
        this.historyManager.saveToHistory(ctx, canvas);
      }
    }

    // Clear input
    this.currentText = '';
    this.isAddingText = false;
  }

  // Crop handling
  onCropApplied(selection: CropSelection): void {
    this.applyCrop(selection);
  }

  onCropCancelled(): void {
    this.isCropMode = false;
  }

  /**
   * Apply crop operation
   */
  private applyCrop(selection: CropSelection): void {
    try {
      const ctx = this.canvasDrawingService.getContext();
      if (!ctx) {
        this.logger.warn('Canvas context not available for crop operation');
        return;
      }

      // Calculate crop dimensions
      const displayWidth = selection.endX - selection.startX;
      const displayHeight = selection.endY - selection.startY;
      const displayX = selection.startX;
      const displayY = selection.startY;

      // Get both the image and annotations
      const image = this.previewImage.nativeElement;
      const annotations = this.annotationCanvas.nativeElement;

      if (!image || !annotations) {
        this.logger.error('Image or annotation canvas not available');
        return;
      }

      // Calculate the scaling factor
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Calculate actual crop coordinates
      let x, y, width, height;

      if (this.imageRotation !== 0) {
        const originalWidth = image.naturalWidth;
        const originalHeight = image.naturalHeight;

        if (this.imageRotation === 90) {
          x = Math.round(displayY * scaleY);
          y = Math.round(originalWidth - (displayX + displayWidth) * scaleX);
          width = Math.round(displayHeight * scaleY);
          height = Math.round(displayWidth * scaleX);
        } else if (this.imageRotation === 180) {
          x = Math.round(originalWidth - (displayX + displayWidth) * scaleX);
          y = Math.round(originalHeight - (displayY + displayHeight) * scaleY);
          width = Math.round(displayWidth * scaleX);
          height = Math.round(displayHeight * scaleY);
        } else if (this.imageRotation === 270) {
          x = Math.round(originalHeight - (displayY + displayHeight) * scaleY);
          y = Math.round(displayX * scaleX);
          width = Math.round(displayHeight * scaleY);
          height = Math.round(displayWidth * scaleX);
        } else {
          x = Math.round(displayX * scaleX);
          y = Math.round(displayY * scaleY);
          width = Math.round(displayWidth * scaleX);
          height = Math.round(displayHeight * scaleY);
        }
      } else {
        x = Math.round(displayX * scaleX);
        y = Math.round(displayY * scaleY);
        width = Math.round(displayWidth * scaleX);
        height = Math.round(displayHeight * scaleY);
      }

      // Create temporary canvas for cropped image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');

      if (!tempCtx) {
        this.logger.error('Failed to get temporary canvas context');
        return;
      }

      // Draw cropped image
      tempCtx.drawImage(
        image,
        x, y, width, height,
        0, 0, width, height
      );

      // Draw annotations
      if (this.imageRotation !== 0) {
        const annotationTempCanvas = document.createElement('canvas');
        annotationTempCanvas.width = annotations.width;
        annotationTempCanvas.height = annotations.height;
        const annotationTempCtx = annotationTempCanvas.getContext('2d');

        if (annotationTempCtx) {
          annotationTempCtx.drawImage(annotations, 0, 0);
          tempCtx.drawImage(
            annotationTempCanvas,
            displayX, displayY, displayWidth, displayHeight,
            0, 0, width, height
          );
        }
      } else {
        tempCtx.drawImage(
          annotations,
          displayX, displayY, displayWidth, displayHeight,
          0, 0, width, height
        );
      }

      // Create new image
      const newImage = new Image();
      newImage.onload = () => {
        try {
          const canvas = this.annotationCanvas.nativeElement;
          canvas.width = width;
          canvas.height = height;

          const previewImg = this.previewImage.nativeElement;
          previewImg.src = tempCanvas.toDataURL('image/png');

          previewImg.onload = () => {
            canvas.width = previewImg.naturalWidth;
            canvas.height = previewImg.naturalHeight;

            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          };

          previewImg.style.width = '';
          previewImg.style.height = '';
          previewImg.style.maxWidth = '100%';
          previewImg.style.maxHeight = '60vh';

          // Reset crop mode
          this.isCropMode = false;
          if (this.cropTool) {
            this.cropTool.reset();
          }

          // Clear history and save new state
          this.historyManager.clear();
          this.historyManager.saveToHistory(ctx, canvas);
        } catch (error) {
          this.logger.error('Error applying crop', error);
        }
      };

      newImage.src = tempCanvas.toDataURL('image/png');

    } catch (error) {
      this.logger.error('Error during crop operation', error);
      this.isCropMode = false;
      if (this.cropTool) {
        this.cropTool.reset();
      }
    }
  }

  // Modal action handlers
  handleClose(): void {
    this.closeModal.emit();
  }

  discardChanges(): void {
    this.closeModal.emit();
  }

  saveChanges(): void {
    if (!this.annotationCanvas || !this.previewImage) {
      this.closeModal.emit();
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const image = this.previewImage.nativeElement;

      // For rotated images, adjust canvas dimensions
      if (this.imageRotation === 90 || this.imageRotation === 270) {
        canvas.width = image.naturalHeight;
        canvas.height = image.naturalWidth;
      } else {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        this.logger.error('Failed to get canvas context');
        this.closeModal.emit();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply rotation if needed
      if (this.imageRotation !== 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(this.imageRotation * Math.PI / 180);

        if (this.imageRotation === 90 || this.imageRotation === 270) {
          ctx.drawImage(
            image,
            -image.naturalHeight / 2,
            -image.naturalWidth / 2,
            image.naturalHeight,
            image.naturalWidth
          );

          const drawingCtx = this.canvasDrawingService.getContext();
          if (drawingCtx) {
            ctx.drawImage(
              this.annotationCanvas.nativeElement,
              -image.naturalHeight / 2,
              -image.naturalWidth / 2,
              image.naturalHeight,
              image.naturalWidth
            );
          }
        } else {
          ctx.drawImage(
            image,
            -image.naturalWidth / 2,
            -image.naturalHeight / 2,
            image.naturalWidth,
            image.naturalHeight
          );

          const drawingCtx = this.canvasDrawingService.getContext();
          if (drawingCtx) {
            ctx.drawImage(
              this.annotationCanvas.nativeElement,
              -image.naturalWidth / 2,
              -image.naturalHeight / 2,
              image.naturalWidth,
              image.naturalHeight
            );
          }
        }

        ctx.restore();
      } else {
        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

        const drawingCtx = this.canvasDrawingService.getContext();
        if (drawingCtx) {
          ctx.drawImage(this.annotationCanvas.nativeElement, 0, 0, image.naturalWidth, image.naturalHeight);
        }
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      this.saveImage.emit(dataUrl);

    } catch (error) {
      this.logger.error('Error saving image', error);
    } finally {
      this.closeModal.emit();
    }
  }
}
