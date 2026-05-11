import { Injectable } from '@angular/core';
import { LoggerService, ScopedLogger } from '@services/logger.service';

export enum DrawingMode {
  None = 'none',
  Freehand = 'freehand',
  Circle = 'circle',
  Text = 'text'
}

export interface Annotation {
  type: string;
  x: number;
  y: number;
  text?: string;
  radius?: number;
  color: string;
  fontSize?: number;
  rotation?: number;
}

/**
 * Canvas Drawing Service
 *
 * Handles all canvas drawing operations including:
 * - Canvas setup and context management
 * - Freehand drawing
 * - Circle drawing
 * - Text annotation
 * - Color and style management
 *
 * Extracted from advanced-image-preview-modal for better separation of concerns.
 */
@Injectable()
export class CanvasDrawingService {
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private image: HTMLImageElement | null = null;

  // Drawing state
  private isDrawing: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private currentColor: string = '#dc3545';
  private currentMode: DrawingMode = DrawingMode.None;

  // Circle drawing state
  private circleStartX: number = 0;
  private circleStartY: number = 0;
  private tempCanvasState: ImageData | null = null;

  // Annotations storage
  private annotations: Annotation[] = [];

  private logger!: ScopedLogger;

  constructor(private loggerService: LoggerService) {
    this.logger = this.loggerService.createLogger('CanvasDrawingService');
  }

  /**
   * Setup canvas with image dimensions
   */
  setupCanvas(canvas: HTMLCanvasElement, image: HTMLImageElement): boolean {
    if (!canvas || !image) {
      this.logger.warn('Canvas or image element not available');
      return false;
    }

    try {
      // Check if image has loaded and has dimensions
      if (image.width === 0 || image.height === 0) {
        this.logger.warn('Image dimensions are zero, waiting for image to load');
        return false;
      }

      // Set canvas dimensions to match the image
      canvas.width = image.width;
      canvas.height = image.height;

      // Get the canvas context for drawing
      this.ctx = canvas.getContext('2d');
      this.canvas = canvas;
      this.image = image;

      if (!this.ctx) {
        this.logger.error('Failed to get canvas context');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error setting up canvas', error);
      return false;
    }
  }

  /**
   * Set drawing mode
   */
  setDrawingMode(mode: DrawingMode): void {
    this.currentMode = mode;
  }

  /**
   * Set drawing color
   */
  setColor(color: string): void {
    this.currentColor = color;
  }

  /**
   * Get current context
   */
  getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  /**
   * Get current canvas
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * Get annotations
   */
  getAnnotations(): Annotation[] {
    return this.annotations;
  }

  /**
   * Clear annotations
   */
  clearAnnotations(): void {
    this.annotations = [];
  }

  /**
   * Start drawing at position
   */
  startDrawing(x: number, y: number): void {
    if (!this.ctx || this.currentMode === DrawingMode.None) return;

    if (this.currentMode === DrawingMode.Circle) {
      // Start a circle
      this.circleStartX = x;
      this.circleStartY = y;
    }

    this.isDrawing = true;
    this.lastX = x;
    this.lastY = y;

    // Start a new path for freehand drawing
    if (this.currentMode === DrawingMode.Freehand) {
      this.ctx.beginPath();
    }
  }

  /**
   * Continue drawing to position
   */
  draw(x: number, y: number): void {
    if (!this.isDrawing || !this.ctx || this.currentMode === DrawingMode.None) return;

    if (this.currentMode === DrawingMode.Circle) {
      // Store the current canvas state if we don't have a temporary backup
      if (!this.tempCanvasState && this.canvas) {
        this.tempCanvasState = this.ctx.getImageData(
          0, 0,
          this.canvas.width,
          this.canvas.height
        );
      }

      // Restore the canvas to the state before drawing the circle
      if (this.tempCanvasState) {
        this.ctx.putImageData(this.tempCanvasState, 0, 0);
      }

      // Draw the new circle
      const radius = Math.sqrt(
        Math.pow(x - this.circleStartX, 2) +
        Math.pow(y - this.circleStartY, 2)
      );

      this.ctx.beginPath();
      this.ctx.arc(this.circleStartX, this.circleStartY, radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      return;
    }

    // Freehand drawing
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.strokeStyle = this.currentColor;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  /**
   * Stop drawing
   */
  stopDrawing(): boolean {
    if (!this.isDrawing) return false;

    this.isDrawing = false;

    // Clean up temporary canvas state after circle drawing
    if (this.currentMode === DrawingMode.Circle) {
      this.tempCanvasState = null;
    }

    // Return true to indicate state should be saved to history
    return this.currentMode !== DrawingMode.None;
  }

  /**
   * Add text annotation at position
   */
  addText(text: string, x: number, y: number, fontSize: number): boolean {
    try {
      if (!this.ctx || !this.canvas) {
        this.logger.warn('Canvas context not available for text input');
        return false;
      }

      // Check if text is empty or only whitespace
      const trimmedText = text.trim();
      if (!trimmedText) {
        return false;
      }

      // Validate font size
      const validFontSize = Math.max(10, Math.min(fontSize || 24, 72));

      // Draw the text on the canvas with proper font settings
      this.ctx.save();
      this.ctx.font = `${validFontSize}px Arial, sans-serif`;
      this.ctx.fillStyle = this.currentColor || '#000000';
      this.ctx.textBaseline = 'middle';

      // Apply text with word wrapping if needed
      const maxWidth = this.canvas.width - x - 10;
      if (maxWidth > 100) {
        this.ctx.fillText(trimmedText, x, y, maxWidth);
      } else {
        this.ctx.fillText(trimmedText, x, y);
      }
      this.ctx.restore();

      // Save the annotation
      this.annotations.push({
        type: 'text',
        x: x,
        y: y,
        text: trimmedText,
        color: this.currentColor,
        fontSize: validFontSize
      });

      return true;
    } catch (error) {
      this.logger.error('Error adding text annotation', error);
      return false;
    }
  }

  /**
   * Clear canvas
   */
  clearCanvas(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.clearCanvas();
    this.isDrawing = false;
    this.tempCanvasState = null;
    this.annotations = [];
  }
}
