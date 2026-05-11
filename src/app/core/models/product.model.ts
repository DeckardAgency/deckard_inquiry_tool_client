import { MediaItem } from './media.model';
import { Machine } from './machine.model';
import { HydraView } from './api/hydra-api.model';

export interface ProductResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: Product[];
  view: HydraView | null;
  [key: string]: unknown;
}

export interface Product {
  '@id': string;
  '@type': string;
  id: string;
  name: string;
  slug: string;
  partNo: string;
  shortDescription: string;
  technicalDescription?: string;
  statistic?: string;
  machineText?: string;
  unit?: string;
  regularPrice: number;
  clientPrice: number;
  discountPercentage?: number | null;
  effectivePrice?: number;
  isValid?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  price?: number;
  weight?: string;
  featuredImage: MediaItem | null;
  imageGallery: MediaItem[];
  createdAt?: string;
  updatedAt?: string;
  machines: Machine[];
}
