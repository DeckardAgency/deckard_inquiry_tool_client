import { inject, Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Machine, MachineCollection, Product, ProductResponse, Order, OrdersResponse } from '@core/models';
import { SearchResultItem, SearchResults, RecentSearch, SearchFilterType } from '@models/api/search-api.model';
import { InquiriesCollection, InquiryResponse } from '@models/api/inquiry-api.model';
import { BaseHttpService } from './http/base-http.service';
import { AuthService } from '@core/auth/auth.service';

// Re-export for backward compatibility
export type { SearchResultItem, SearchResults, RecentSearch, SearchFilterType };

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 5;

@Injectable({
  providedIn: 'root'
})
export class SearchService extends BaseHttpService {
  private authService = inject(AuthService);

  private machinesUrl = this.buildUrl('machines');
  private productsUrl = this.buildUrl('products');
  private ordersUrl = this.buildUrl('orders');
  private inquiriesUrl = this.buildUrl('inquiries');

  constructor() {
    super();
  }

  /**
   * Get the current user's client code for filtering
   */
  private getClientCode(): string | null {
    const user = this.authService.getCurrentUser();
    return user?.client?.code || null;
  }

  /**
   * Search across all entities
   */
  searchAll(query: string): Observable<SearchResults> {
    if (!query || query.trim().length === 0) {
      return of({
        machines: [],
        products: [],
        orders: [],
        inquiries: [],
        totalMachines: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalInquiries: 0
      });
    }

    return forkJoin({
      machines: this.searchMachines(query),
      products: this.searchProducts(query),
      orders: this.searchOrders(query),
      inquiries: this.searchInquiries(query)
    }).pipe(
      map(results => ({
        machines: results.machines.items,
        products: results.products.items,
        orders: results.orders.items,
        inquiries: results.inquiries.items,
        totalMachines: results.machines.total,
        totalProducts: results.products.total,
        totalOrders: results.orders.total,
        totalInquiries: results.inquiries.total
      }))
    );
  }

  /**
   * Get recent searches from localStorage
   */
  getRecentSearches(): RecentSearch[] {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Add a search query to recent searches
   */
  addRecentSearch(query: string): void {
    if (!query || query.trim().length < 2) return;

    const searches = this.getRecentSearches();
    const normalizedQuery = query.trim().toLowerCase();

    // Remove existing entry with same query
    const filtered = searches.filter(s => s.query.toLowerCase() !== normalizedQuery);

    // Add new entry at the beginning
    filtered.unshift({
      query: query.trim(),
      timestamp: Date.now()
    });

    // Keep only MAX_RECENT_SEARCHES
    const limited = filtered.slice(0, MAX_RECENT_SEARCHES);

    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(limited));
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches(): void {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Search machines by articleDescription
   */
  private searchMachines(query: string): Observable<{ items: SearchResultItem[], total: number }> {
    const params = new HttpParams()
      .set('articleDescription', query)
      .set('page', '1')
      .set('itemsPerPage', '10');

    return this.getWithJsonLd<MachineCollection>(this.machinesUrl, params).pipe(
      map(response => ({
        items: response.member.map(machine => this.transformMachineToSearchResult(machine)),
        total: response.totalItems
      })),
      catchError(() => of({ items: [], total: 0 }))
    );
  }

  /**
   * Search products by name
   */
  private searchProducts(query: string): Observable<{ items: SearchResultItem[], total: number }> {
    const params = new HttpParams()
      .set('name', query)
      .set('page', '1')
      .set('itemsPerPage', '10');

    return this.getWithJsonLd<ProductResponse>(this.productsUrl, params).pipe(
      map(response => ({
        items: response.member ? response.member.map((product: Product) => this.transformProductToSearchResult(product)) : [],
        total: response.totalItems || 0
      })),
      catchError(() => of({ items: [], total: 0 }))
    );
  }

  /**
   * Search orders by orderNumber (filtered by current user's client code)
   */
  private searchOrders(query: string): Observable<{ items: SearchResultItem[], total: number }> {
    const clientCode = this.getClientCode();

    // If no client code, return empty results
    if (!clientCode) {
      return of({ items: [], total: 0 });
    }

    const params = new HttpParams()
      .set('orderNumber', query)
      .set('user.client.code', clientCode)
      .set('page', '1')
      .set('itemsPerPage', '10');

    return this.getWithJsonLd<OrdersResponse>(this.ordersUrl, params).pipe(
      map(response => ({
        items: response.member.map(order => this.transformOrderToSearchResult(order)),
        total: response.totalItems
      })),
      catchError(() => of({ items: [], total: 0 }))
    );
  }

  /**
   * Search inquiries by inquiryNumber (filtered by current user's client code)
   */
  private searchInquiries(query: string): Observable<{ items: SearchResultItem[], total: number }> {
    const clientCode = this.getClientCode();

    // If no client code, return empty results
    if (!clientCode) {
      return of({ items: [], total: 0 });
    }

    const params = new HttpParams()
      .set('inquiryNumber', query)
      .set('user.client.code', clientCode)
      .set('page', '1')
      .set('itemsPerPage', '10');

    return this.getWithJsonLd<InquiriesCollection>(this.inquiriesUrl, params).pipe(
      map(response => ({
        items: response.member.map(inquiry => this.transformInquiryToSearchResult(inquiry)),
        total: response.totalItems
      })),
      catchError(() => of({ items: [], total: 0 }))
    );
  }

  /**
   * Transform machine to search result
   */
  private transformMachineToSearchResult(machine: Machine): SearchResultItem {
    return {
      id: machine.id,
      title: machine.articleDescription || `Machine ${machine.articleNumber}`,
      type: 'machine',
      badge: 'Machine',
      route: `/machines/${machine.id}/edit`,
      description: `Article: ${machine.articleNumber} | S/N: ${machine.ibSerialNumber}`,
      metadata: {
        articleNumber: machine.articleNumber,
        serialNumber: machine.ibSerialNumber,
        mcNumber: machine.mcNumber
      }
    };
  }

  /**
   * Transform product to search result
   */
  private transformProductToSearchResult(product: Product): SearchResultItem {
    return {
      id: product.id,
      title: product.name,
      type: 'product',
      badge: 'Product',
      route: `/products/${product.id}/edit`,
      description: `Part No: ${product.partNo} | ${product.shortDescription}`,
      metadata: {
        partNo: product.partNo,
        price: product.price,
        unit: product.unit
      }
    };
  }

  /**
   * Transform order to search result
   */
  private transformOrderToSearchResult(order: Order): SearchResultItem {
    return {
      id: order.id,
      title: `Order ${order.orderNumber}`,
      type: 'order',
      badge: 'Order',
      route: `/orders/${order.id}/view`,
      description: `Status: ${order.status} | Total: ${order.totalAmount}`,
      metadata: {
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt
      }
    };
  }

  /**
   * Transform inquiry to search result
   */
  private transformInquiryToSearchResult(inquiry: InquiryResponse): SearchResultItem {
    const machineCount = inquiry.machines?.length || 0;
    const productCount = inquiry.machines?.reduce((sum, m) => sum + (m.products?.length || 0), 0) || 0;

    return {
      id: inquiry.id,
      title: `Inquiry ${inquiry.inquiryNumber}`,
      type: 'inquiry',
      badge: 'Inquiry',
      route: `/manual-entry/${inquiry.id}/view`,
      description: `Status: ${inquiry.status} | ${machineCount} machine(s), ${productCount} part(s)`,
      metadata: {
        status: inquiry.status,
        machineCount: machineCount,
        productCount: productCount,
        createdAt: inquiry.createdAt
      }
    };
  }
}
