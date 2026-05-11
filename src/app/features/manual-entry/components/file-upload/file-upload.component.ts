import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ElementRef, ViewChild, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { IconComponent } from '@shared/components/icon/icon.component';
import { MediaService } from '@services/http/media.service';
import { UploadedFile, MediaItem } from '@core/models';
import { LoggerService, ScopedLogger } from '@services/logger.service';

/**
 * File Upload Component
 *
 * Handles file selection, drag & drop, upload progress, and file management.
 * Supports multiple files with validation and error handling.
 *
 * @example
 * ```html
 * <app-file-upload
 *   [files]="part.files"
 *   (filesChanged)="onFilesChanged($event)"
 *   (filePreviewRequested)="onFilePreview($event)">
 * </app-file-upload>
 * ```
 */
@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent
  ],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent {
  private destroyRef = inject(DestroyRef);
  private mediaService = inject(MediaService);
  private loggerService = inject(LoggerService);
  private logger!: ScopedLogger;

  constructor() {
    this.logger = this.loggerService.createLogger('FileUploadComponent');
  }

  // Inputs
  @Input() files: UploadedFile[] = [];

  // Outputs
  @Output() filesChanged = new EventEmitter<UploadedFile[]>();
  @Output() filePreviewRequested = new EventEmitter<UploadedFile>();

  // View references
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // State
  isDragging = signal(false);
  dragCounter = 0;

  // Configuration
  maxFileSize = 5 * 1024 * 1024; // 5MB
  allowedFileTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  /**
   * Trigger file input click
   */
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Handle file selection from input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
    }
  }

  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  /**
   * Handle drag enter event
   */
  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter++;
    this.isDragging.set(true);
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter--;

    if (this.dragCounter === 0) {
      this.isDragging.set(false);
    }
  }

  /**
   * Handle drop event
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    this.dragCounter = 0;

    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  /**
   * Handle file list processing
   */
  private handleFiles(fileList: FileList): void {
    Array.from(fileList).forEach(file => {
      if (!this.isValidFileType(file)) {
        alert(`File type not allowed: ${file.name}`);
        return;
      }

      if (file.size > this.maxFileSize) {
        alert(`File too large: ${file.name}. Maximum size is 5MB.`);
        return;
      }

      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        status: 'uploading',
        progress: 0
      };

      if (this.isImageFile(file.name)) {
        uploadedFile.previewUrl = URL.createObjectURL(file);
      }

      this.files = [...this.files, uploadedFile];
      this.filesChanged.emit(this.files);

      // Start upload after small delay
      setTimeout(() => {
        this.uploadFile(uploadedFile);
      }, 10);
    });
  }

  /**
   * Upload a file to the server
   */
  private uploadFile(file: UploadedFile): void {
    if (!file.file) {
      this.logger.error('Cannot upload file: file object is null');
      return;
    }

    file.progress = 1;

    const uploadSubscription = this.mediaService.uploadFile(file.file).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (event: HttpEvent<MediaItem>) => {
        switch (event.type) {
          case HttpEventType.Sent:
            file.progress = 1;
            break;

          case HttpEventType.UploadProgress:
            if (event.total) {
              file.progress = Math.max(1, Math.round((event.loaded / event.total) * 100));
            }
            break;

          case HttpEventType.Response:
            if (event.body) {
              file.status = 'success';
              file.progress = 100;
              file.mediaItem = event.body;
              this.logger.debug('File uploaded successfully', { mediaItem: event.body });
            }
            break;
        }

        this.filesChanged.emit(this.files);
      },
      error: (error) => {
        this.logger.error('Upload failed', error);
        file.status = 'error';
        file.progress = 0;

        if (error.status === 413) {
          file.errorMessage = 'File too large';
        } else if (error.status === 415) {
          file.errorMessage = 'Unsupported file type';
        } else if (error.status === 0) {
          file.errorMessage = 'Network error';
        } else {
          file.errorMessage = error.error?.message || 'Upload failed';
        }

        this.filesChanged.emit(this.files);
      },
      complete: () => {
        if (file.uploadSubscription) {
          file.uploadSubscription = undefined;
        }
      }
    });

    file.uploadSubscription = uploadSubscription;
  }

  /**
   * Remove a file
   */
  removeFile(file: UploadedFile): void {
    if (file.uploadSubscription && !file.uploadSubscription.closed) {
      file.uploadSubscription.unsubscribe();
    }

    if (file.status === 'success' && file.mediaItem) {
      this.mediaService.deleteMediaItem(file.mediaItem.id).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.logger.debug('File deleted from server', { filename: file.mediaItem?.filename });
        },
        error: (error) => {
          this.logger.error('Failed to delete file from server', error);
        }
      });
    }

    if (file.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }

    this.files = this.files.filter(f => f !== file);
    this.filesChanged.emit(this.files);
  }

  /**
   * Cancel an upload in progress
   */
  cancelUpload(file: UploadedFile): void {
    if (file.uploadSubscription && !file.uploadSubscription.closed) {
      file.uploadSubscription.unsubscribe();
    }

    this.removeFile(file);
  }

  /**
   * Retry a failed upload
   */
  retryUpload(file: UploadedFile): void {
    if (file.uploadSubscription && !file.uploadSubscription.closed) {
      file.uploadSubscription.unsubscribe();
    }

    file.status = 'uploading';
    file.progress = 0;
    file.errorMessage = undefined;

    this.uploadFile(file);
  }

  /**
   * Open image preview
   */
  openImagePreview(file: UploadedFile): void {
    if (this.isImageFile(file.name) && file.previewUrl) {
      this.filePreviewRequested.emit(file);
    }
  }

  /**
   * Check if file type is valid
   */
  private isValidFileType(file: File): boolean {
    return this.allowedFileTypes.includes(file.type);
  }

  /**
   * Check if file is an image
   */
  isImageFile(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '');
  }

  /**
   * Check if there are successful uploads
   */
  hasSuccessfulUploads(): boolean {
    return this.files.some(file => file.status === 'success');
  }

  /**
   * Check if there are uploads in progress
   */
  hasUploadsInProgress(): boolean {
    return this.files.some(file => file.status === 'uploading');
  }

  /**
   * Get count of successful uploads
   */
  getSuccessfulUploadCount(): number {
    return this.files.filter(file => file.status === 'success').length;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(file: UploadedFile): string {
    if (this.isImageFile(file.name)) {
      return 'imageIcon';
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'pdfIcon';
      case 'doc':
      case 'docx':
        return 'docIcon';
      default:
        return 'fileIcon';
    }
  }
}
