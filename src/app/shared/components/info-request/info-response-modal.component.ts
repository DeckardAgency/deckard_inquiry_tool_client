import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { PartInfoRequestResponse } from '@models/api/part-info-request-api.model';
import { MediaItem } from '@core/models';
import { MediaService } from '@services/http/media.service';
import { environment } from '@env/environment';

export interface InfoResponseSubmitData {
  infoRequest: PartInfoRequestResponse;
  messageText: string;
  attachments: string[]; // IRI references to media items
}

interface UploadingFile {
  file: File;
  progress: number;
  preview: string;
  error?: string;
}

@Component({
  selector: 'app-info-response-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './info-response-modal.component.html',
  styleUrls: ['./info-response-modal.component.scss']
})
export class InfoResponseModalComponent implements OnChanges {
  private mediaService = inject(MediaService);

  @Input() isOpen: boolean = false;
  @Input() infoRequest: PartInfoRequestResponse | null = null;
  @Input() saving: boolean = false;
  @Input() readOnly: boolean = false; // When true, only show history without response form

  @Output() closeModal = new EventEmitter<void>();
  @Output() submitResponse = new EventEmitter<InfoResponseSubmitData>();

  responseText: string = '';
  uploadedFiles: MediaItem[] = [];
  uploadingFiles: UploadingFile[] = [];
  isUploading: boolean = false;

  // Image preview
  previewImage: string | null = null;
  previewFilename: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.responseText = '';
    this.uploadedFiles = [];
    this.uploadingFiles = [];
    this.previewImage = null;
    this.previewFilename = '';
  }

  onClose(): void {
    if (!this.saving && !this.isUploading) {
      this.closeModal.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  onSubmit(): void {
    if (!this.infoRequest || !this.responseText.trim()) {
      return;
    }

    this.submitResponse.emit({
      infoRequest: this.infoRequest,
      messageText: this.responseText.trim(),
      attachments: this.uploadedFiles.map(f => f['@id'] || `/api/v1/media_items/${f.id}`)
    });
  }

  onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);

      // Filter valid files (images and documents)
      const validFiles = files.filter(file => {
        const validTypes = [
          'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        const isValid = validTypes.includes(file.type);
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

        if (!isValid) {
          console.warn(`Invalid file type: ${file.type}`);
        }
        if (!isValidSize) {
          console.warn(`File too large: ${file.name}`);
        }

        return isValid && isValidSize;
      });

      // Upload each file
      validFiles.forEach(file => this.uploadFile(file));

      // Reset input so the same file can be selected again
      input.value = '';
    }
  }

  private uploadFile(file: File): void {
    // Create preview for images
    const uploadingFile: UploadingFile = {
      file,
      progress: 0,
      preview: ''
    };

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadingFile.preview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }

    this.uploadingFiles.push(uploadingFile);
    this.isUploading = true;

    this.mediaService.uploadFile(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          uploadingFile.progress = Math.round((event.loaded / event.total) * 100);
        } else if (event.type === HttpEventType.Response) {
          // Upload complete - add to uploaded files
          const mediaItem = event.body as MediaItem;
          this.uploadedFiles.push(mediaItem);

          // Remove from uploading list
          const index = this.uploadingFiles.indexOf(uploadingFile);
          if (index > -1) {
            this.uploadingFiles.splice(index, 1);
          }

          this.updateUploadingStatus();
        }
      },
      error: (error) => {
        console.error('Upload failed:', error);
        uploadingFile.error = 'Upload failed';

        // Remove failed upload after a delay
        setTimeout(() => {
          const index = this.uploadingFiles.indexOf(uploadingFile);
          if (index > -1) {
            this.uploadingFiles.splice(index, 1);
          }
          this.updateUploadingStatus();
        }, 2000);
      }
    });
  }

  private updateUploadingStatus(): void {
    this.isUploading = this.uploadingFiles.length > 0;
  }

  removeFile(index: number): void {
    const file = this.uploadedFiles[index];
    this.uploadedFiles.splice(index, 1);

    // Optionally delete from server
    if (file.id) {
      this.mediaService.deleteMediaItem(file.id).subscribe({
        error: (err) => console.warn('Could not delete file from server:', err)
      });
    }
  }

  removeUploadingFile(index: number): void {
    this.uploadingFiles.splice(index, 1);
    this.updateUploadingStatus();
  }

  get isValid(): boolean {
    return this.responseText.trim().length > 0;
  }

  get partInfo(): string {
    if (!this.infoRequest) return '';
    const part = this.infoRequest.inquiryMachinePart;
    if (part.partNumber && part.partName) {
      return `${part.partNumber} - ${part.partName}`;
    }
    return part.partNumber || part.partName || 'Part';
  }

  get adminMessage(): string {
    if (!this.infoRequest || !this.infoRequest.messages) return '';
    // Get the latest admin message
    const adminMessages = this.infoRequest.messages.filter(m => m.senderType === 'admin');
    if (adminMessages.length > 0) {
      return adminMessages[adminMessages.length - 1].messageText;
    }
    return '';
  }

  getFileUrl(filePath: string): string {
    return `${environment.apiBaseUrl}${filePath}`;
  }

  getUploadedFileUrl(file: MediaItem): string {
    if (file.filePath) {
      return `${environment.apiBaseUrl}${file.filePath}`;
    }
    return '';
  }

  isImageFile(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '');
  }

  isImageMediaItem(file: MediaItem): boolean {
    return file.mimeType?.startsWith('image/') || false;
  }

  openImagePreview(filePath: string, filename: string): void {
    this.previewImage = this.getFileUrl(filePath);
    this.previewFilename = filename;
  }

  openUploadedImagePreview(file: MediaItem): void {
    if (this.isImageMediaItem(file)) {
      this.previewImage = this.getUploadedFileUrl(file);
      this.previewFilename = file.filename;
    }
  }

  openUploadingPreview(uploadingFile: UploadingFile): void {
    if (uploadingFile.preview) {
      this.previewImage = uploadingFile.preview;
      this.previewFilename = uploadingFile.file.name;
    }
  }

  closeImagePreview(): void {
    this.previewImage = null;
    this.previewFilename = '';
  }

  onPreviewBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('preview-backdrop')) {
      this.closeImagePreview();
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get hasUploadedFiles(): boolean {
    return this.uploadedFiles.length > 0 || this.uploadingFiles.length > 0;
  }
}
