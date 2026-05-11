/**
 * API interfaces for Order-related requests and responses
 * Moved from order.service.ts to follow Angular best practices
 */

import { HydraView } from './inquiry-api.model';

/** User object as it appears in API responses (embedded) */
export interface UserEmbedded {
  '@id'?: string;
  '@type'?: string;
  id?: string;
  email?: string;
  name?: string;
  avatar?: string;
}

/** Request payload for creating/updating an order */
export interface OrderRequest {
  status: string;
  shippingAddress: string;
  billingAddress: string;
  notes?: string;
  items: {
    product: string;
    quantity: number;
    onBehalfOfClient?: string; // IRI: /api/v1/clients/{id}
  }[];
  user: string;
  onBehalfOfClient?: string;
}

/** API response for a single order item */
export interface OrderItemResponse {
  '@id': string;
  '@type': string;
  product: {
    '@id': string;
    '@type': string;
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** API response for a single order */
export interface OrderResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  billingAddress: string;
  createdAt: string;
  updatedAt: string;
  lastSavedAt: string;
  items: OrderItemResponse[];
  notes?: string;
  user: string | UserEmbedded; // Can be IRI or embedded object
  onBehalfOfClient?: {
    '@id'?: string;
    id: string;
    name: string;
    code: string;
  } | null;
}

/**
 * API response for a collection of orders
 * Note: The API returns already-normalized properties (without 'hydra:' prefix)
 */
export interface OrdersCollection {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: OrderResponse[];
  view?: HydraView | null;
  search?: {
    '@type': string;
    template: string;
    variableRepresentation: string;
    mapping: Array<{
      '@type': string;
      variable: string;
      property: string;
      required: boolean;
    }>;
  };
}
