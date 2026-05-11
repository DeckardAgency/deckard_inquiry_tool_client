import { HydraView, HydraSearch } from './api/hydra-api.model';

export interface ClientMachineInstalledBase {
  '@context': string;
  '@id': string;
  '@type': string;
  id: string;
  client: ClientMachineClient;
  machine: ClientMachineMachine;
  installedDate: string;
  location?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  warrantyEndDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  installedBy?: string;
  installationReference?: string;
  monthlyRate?: string;
}

export interface ClientMachineClient {
  '@context'?: string;
  '@id': string;
  '@type': string;
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  vatNumber?: string;
  createdAt: string;
  updatedAt: string;
  users: string[];
  machinesCount: number;
}

export interface ClientMachineMachine {
  '@context'?: string;
  '@id': string;
  '@type': string;
  id: string;
  createdAt: string;
  updatedAt: string;
  ibStationNumber: number;
  ibSerialNumber: number;
  articleNumber?: string;
  articleDescription?: string;
  orderNumber?: string;
  deliveryDate?: string;
  kmsIdentificationNumber?: string;
  kmsIdNumber?: string;
  mcNumber?: string;
  mainWarrantyEnd?: string;
  extendedWarrantyEnd?: string;
  fiStationNumber?: number;
  fiSerialNumber?: number;
  featuredImage?: string;
  imageGallery: string[];
  documents: string[];
  clientsCount: number;
}

export interface ClientMachineInstalledBaseResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: ClientMachineInstalledBase[];
  view?: HydraView;
  search?: HydraSearch;
}
