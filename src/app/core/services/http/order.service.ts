import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { CartItem, Order } from '@core/models';
import {
  OrderRequest,
  OrderResponse,
  OrdersCollection
} from '@models/api/order-api.model';

// Re-export for backward compatibility
export type {
  OrderRequest,
  OrderResponse,
  OrdersCollection
};

@Injectable({
  providedIn: 'root'
})
export class OrderService extends BaseHttpService {

  /**
   * Create a new order from cart items
   */
  createOrder(
    cartItems: CartItem[], shippingAddress: string, billingAddress: string, p0: string, id: string, onBehalfOfClient?: string  ): Observable<OrderResponse> {
    // Transform cart items to the format expected by the API
    // Per-item onBehalfOfClient: use item.clientId if available, fall back to order-level onBehalfOfClient
    const items = cartItems.map(item => ({
      product: this.buildIri('products', item.product.id),
      quantity: item.quantity,
      ...(onBehalfOfClient && item.clientId ? { onBehalfOfClient: `/api/v1/clients/${item.clientId}` } :
          onBehalfOfClient ? { onBehalfOfClient } : {})
    }));

    // Only set order-level onBehalfOfClient when explicitly provided (agent flow)
    const orderLevelClient = onBehalfOfClient || undefined;

    const orderData: OrderRequest = {
      status: 'submitted',
      shippingAddress,
      billingAddress,
      items,
      user: this.buildIri('users', id),
      ...(orderLevelClient ? { onBehalfOfClient: orderLevelClient } : {})
    };

    return this.postWithJsonLd<OrderResponse>(
      this.buildUrl('orders'),
      orderData
    );
  }

  /**
   * Save order as draft
   */
  saveDraft(cartItems: CartItem[], shippingAddress: string, billingAddress: string, referenceNumber: string, userId: string, onBehalfOfClient?: string): Observable<OrderResponse> {
    // Transform cart items to the format expected by the API
    // Per-item onBehalfOfClient: use item.clientId if available, fall back to order-level onBehalfOfClient
    const items = cartItems.map(item => ({
      product: this.buildIri('products', item.product.id),
      quantity: item.quantity,
      ...(onBehalfOfClient && item.clientId ? { onBehalfOfClient: `/api/v1/clients/${item.clientId}` } :
          onBehalfOfClient ? { onBehalfOfClient } : {})
    }));

    // Only set order-level onBehalfOfClient when explicitly provided (agent flow)
    const orderLevelClient = onBehalfOfClient || undefined;

    const orderData: OrderRequest = {
      status: 'draft',
      shippingAddress,
      billingAddress,
      items,
      user: this.buildIri('users', userId),
      ...(orderLevelClient ? { onBehalfOfClient: orderLevelClient } : {})
    };

    return this.postWithJsonLd<OrderResponse>(
      this.buildUrl('orders'),
      orderData
    );
  }

  /**
   * Get a single order by ID
   */
  getOrder(id: string): Observable<Order> {
    return this.getWithJsonLd<Order>(
      this.buildUrl('orders', id)
    );
  }

  /**
   * Get orders by order number
   */
  getOrdersByOrderNumber(orderNumber: string): Observable<OrdersCollection> {
    const params = this.buildParams({ orderNumber });

    return this.getWithJsonLd<OrdersCollection>(
      this.buildUrl('orders'),
      params
    );
  }

  /**
   * Get all orders by user email with pagination support
   */
  getOrdersByUserEmail(
    email: string,
    options?: { page?: number; itemsPerPage?: number; status?: string; search?: string; sort?: string }
  ): Observable<OrdersCollection> {
    const filters: Record<string, string | boolean | undefined> = {
      isDraft: false
    };

    // Handle sorting
    if (options?.sort) {
      switch (options.sort) {
        case 'date-asc':
          filters['order[createdAt]'] = 'asc';
          break;
        case 'number-asc':
          filters['order[orderNumber]'] = 'asc';
          break;
        case 'number-desc':
          filters['order[orderNumber]'] = 'desc';
          break;
        case 'date-desc':
        default:
          filters['order[createdAt]'] = 'desc';
          break;
      }
    } else {
      filters['order[createdAt]'] = 'desc';
    }

    if (options?.page) {
      filters['page'] = options.page.toString();
    }
    if (options?.itemsPerPage) {
      filters['itemsPerPage'] = options.itemsPerPage.toString();
    }
    if (options?.status && options.status !== 'all') {
      filters['status'] = options.status;
    }
    if (options?.search) {
      filters['orderNumber'] = options.search;
    }

    const params = this.buildUserFilterParams(email, filters);
    return this.getWithJsonLd<OrdersCollection>(
      this.buildUrl('orders'),
      params
    );
  }

  /**
   * Get all orders for history by user email (includes submitted, confirmed, completed, etc.)
   */
  getOrdersHistoryByUserEmail(email: string): Observable<OrdersCollection> {
    // Don't filter by status - we want all submitted/confirmed/completed orders
    const params = this.buildUserFilterParams(email, { isDraft: false });

    return this.getWithJsonLd<OrdersCollection>(
      this.buildUrl('orders'),
      params
    );
  }

  /**
   * Get draft orders by user email
   */
  getDraftOrdersByUserEmail(email: string): Observable<OrdersCollection> {
    const params = this.buildUserFilterParams(email, { status: 'draft' });

    return this.getWithJsonLd<OrdersCollection>(
      this.buildUrl('orders'),
      params
    );
  }

  /**
   * Export order to PDF
   */
  exportOrderPdf(orderId: string): Observable<Blob> {
    return this.getPdf(
      this.buildUrl('orders', orderId, 'export', 'pdf')
    );
  }

  /**
   * Get draft orders by client code (for client admin view)
   */
  getDraftOrdersByClientCode(clientCode: string): Observable<OrdersCollection> {
    const params = this.buildParams({
      'user.client.code': clientCode,
      status: 'draft'
    });

    return this.getWithJsonLd<OrdersCollection>(
      this.buildUrl('orders'),
      params
    );
  }

  /**
   * Get all orders by client code (for client admin history view)
   */
  getOrdersByClientCode(clientCode: string): Observable<OrdersCollection> {
    const params = this.buildParams({
      'user.client.code': clientCode,
      isDraft: false
    });

    return this.getWithJsonLd<OrdersCollection>(
      this.buildUrl('orders'),
      params
    );
  }

  /**
   * Get pending approval orders by client code (for client admin view)
   */
  getPendingApprovalOrdersByClientCode(clientCode: string): Observable<OrdersCollection> {
    const params = this.buildParams({
      'user.client.code': clientCode,
      status: 'pending_approval'
    });

    return this.getWithJsonLd<OrdersCollection>(
      this.buildUrl('orders'),
      params
    );
  }

  /**
   * Approve a pending order (client admin action)
   */
  approveOrder(orderId: string): Observable<OrderResponse> {
    return this.postWithJsonLd<OrderResponse>(
      this.buildUrl('orders', orderId, 'approve'),
      {}
    );
  }

  /**
   * Delete an order by ID
   */
  deleteOrder(orderId: string): Observable<void> {
    return this.deleteWithJsonLd<void>(
      this.buildUrl('orders', orderId)
    );
  }
}
