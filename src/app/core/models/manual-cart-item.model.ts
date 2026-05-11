import { MediaItem } from './media.model';
import { Subscription } from 'rxjs';

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File | null; // null when loaded from server (no actual File object)
  status: 'uploading' | 'success' | 'error';
  progress: number;
  previewUrl?: string;
  mediaItem?: MediaItem;
  uploadSubscription?: Subscription;
  errorMessage?: string;
}

export interface ManualCartItem {
  id: string;
  machineId: string;
  machineName: string;
  clientId?: string;
  clientName?: string;
  clientCode?: string;
  partData: {
    partName: string;
    partNumber: string;
    shortDescription: string;
    additionalNotes: string;
    quantity?: string;
    mediaItems?: MediaItem[];
  };
  files: UploadedFile[];
}
