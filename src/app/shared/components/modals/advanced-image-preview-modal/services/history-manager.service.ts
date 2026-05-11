import { Injectable } from '@angular/core';

/**
 * History Manager Service
 *
 * Manages undo/redo functionality for canvas operations:
 * - Stores canvas state snapshots as ImageData
 * - Provides undo/redo navigation through history
 * - Limits history size to prevent memory issues
 *
 * Extracted from advanced-image-preview-modal for better separation of concerns.
 */
@Injectable()
export class HistoryManagerService {
  private history: ImageData[] = [];
  private historyIndex: number = -1;
  private readonly MAX_HISTORY_SIZE: number = 20;

  /**
   * Save current canvas state to history
   */
  saveToHistory(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    if (!ctx) return;

    // Get current state
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // If we made changes and aren't at the end of history, truncate the future
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Add current state to history
    this.history.push(currentState);
    this.historyIndex = this.history.length - 1;

    // Enforce history size limit to prevent memory issues
    if (this.history.length > this.MAX_HISTORY_SIZE) {
      // Remove oldest entries
      const itemsToRemove = this.history.length - this.MAX_HISTORY_SIZE;
      this.history = this.history.slice(itemsToRemove);
      this.historyIndex -= itemsToRemove;
    }
  }

  /**
   * Undo last action
   */
  undo(ctx: CanvasRenderingContext2D): boolean {
    if (!ctx || this.historyIndex <= 0) return false;

    this.historyIndex--;
    ctx.putImageData(this.history[this.historyIndex], 0, 0);
    return true;
  }

  /**
   * Redo last undone action
   */
  redo(ctx: CanvasRenderingContext2D): boolean {
    if (!ctx || this.historyIndex >= this.history.length - 1) return false;

    this.historyIndex++;
    ctx.putImageData(this.history[this.historyIndex], 0, 0);
    return true;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.historyIndex = -1;
  }

  /**
   * Get current history index
   */
  getHistoryIndex(): number {
    return this.historyIndex;
  }

  /**
   * Get history length
   */
  getHistoryLength(): number {
    return this.history.length;
  }
}
