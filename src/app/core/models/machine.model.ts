import { MediaItem } from './media.model';
import { HydraView } from './api/hydra-api.model';

export interface Machine {
  '@id': string;
  '@type': string;
  id: string;
  createdAt: string;
  updatedAt: string;
  ibStationNumber: number;
  ibSerialNumber: number;
  articleNumber: string;
  articleDescription: string;
  orderNumber: string;
  kmsIdentificationNumber: string;
  kmsIdNumber: string;
  mcNumber: string;
  fiStationNumber: number;
  fiSerialNumber: number;
  featuredImage: MediaItem | null;
  imageGallery: MediaItem[] | string[];
  name?: string;
  documents: MediaItem[] | string[];
  products: string[]
}

export interface MachineResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: Machine[];
  view: HydraView | null;
  [key: string]: unknown;
}

export interface MachineType {
  id: string;
  name: string;
  checked: boolean;
}

/** Extended Machine interface for "Other/Unlisted" machines in manual entry */
export interface OtherMachine extends Machine {
  isOther?: boolean;
}

export interface MachineCollection {
  member: Machine[];
  totalItems: number;
  view?: PaginationView;
  search?: SearchConfig;
}

export interface PaginationView {
  '@id': string;
  '@type': string;
  first?: string;
  last?: string;
  previous?: string;
  next?: string;
}

export interface SearchConfig {
  '@type': string;
  template: string;
  variableRepresentation: string;
  mapping: SearchMapping[];
}

export interface SearchMapping {
  '@type': string;
  variable: string;
  property: string;
  required: boolean;
}
