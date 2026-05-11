import { HttpParams } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Observable, BehaviorSubject, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProductResponse, Product } from '@core/models';
import { normalizeHydraCollection, NormalizedCollection } from '@models/api/hydra-api.model';
import { BaseHttpService } from './base-http.service';

/**
 * Product filter options
 */
export interface ProductFilters {
  'machines.articleDescription'?: string | string[];
  [key: string]: string | string[] | number | boolean | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService extends BaseHttpService {
  private readonly productsUrl: string;
  private readonly clientUrl: string;

  // Add this for search selection functionality
  private selectedProductIdSubject = new BehaviorSubject<string | null>(null);
  public selectedProductId$ = this.selectedProductIdSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    super();
    // Base API URL for products
    this.productsUrl = this.buildUrl('products');
    // Base API URL for client-specific products
    this.clientUrl = this.buildUrl('client');
  }

  // Methods for search selection
  setSelectedProductId(productId: string | null): void {
    this.selectedProductIdSubject.next(productId);
  }

  getSelectedProductId(): string | null {
    return this.selectedProductIdSubject.value;
  }

  clearSelectedProductId(): void {
    this.selectedProductIdSubject.next(null);
  }

  /**
   * Get all products (without client filter)
   * @param options Optional parameters for pagination and search
   * @returns Observable with ProductResponse
   */
  getProducts(options?: { itemsPerPage?: number; search?: string }): Observable<ProductResponse> {
    const itemsPerPage = options?.itemsPerPage ?? 300;

    // If no search term, just fetch all products
    if (!options?.search) {
      const params = this.buildParams({ itemsPerPage });
      return this.getWithJsonLd<ProductResponse>(this.productsUrl, params).pipe(
        map(response => this.normalizeHydraCollection<Product>(response))
      );
    }

    // Search by both name and partNo (OR logic) using parallel requests
    const searchTerm = options.search;

    const emptyResponse: ProductResponse = {
      '@context': '',
      '@id': '',
      '@type': '',
      member: [],
      totalItems: 0,
      view: null
    };

    const searchByName$ = this.getWithJsonLd<ProductResponse>(
      this.productsUrl,
      this.buildParams({ itemsPerPage, name: searchTerm })
    ).pipe(
      map(response => this.normalizeHydraCollection<Product>(response)),
      catchError(() => of(emptyResponse))
    );

    const searchByPartNo$ = this.getWithJsonLd<ProductResponse>(
      this.productsUrl,
      this.buildParams({ itemsPerPage, partNo: searchTerm })
    ).pipe(
      map(response => this.normalizeHydraCollection<Product>(response)),
      catchError(() => of(emptyResponse))
    );

    // Combine results from both searches, removing duplicates
    return forkJoin([searchByName$, searchByPartNo$]).pipe(
      map(([nameResults, partNoResults]) => {
        const seenIds = new Set<string>();
        const combinedMembers: Product[] = [];

        // Add results from name search
        for (const product of nameResults.member || []) {
          if (!seenIds.has(product.id)) {
            seenIds.add(product.id);
            combinedMembers.push(product);
          }
        }

        // Add results from partNo search (avoiding duplicates)
        for (const product of partNoResults.member || []) {
          if (!seenIds.has(product.id)) {
            seenIds.add(product.id);
            combinedMembers.push(product);
          }
        }

        return {
          '@context': '',
          '@id': '',
          '@type': '',
          member: combinedMembers,
          totalItems: combinedMembers.length,
          view: null
        } as ProductResponse;
      })
    );
  }

  /**
   * Get products for a specific client by ID
   * @param clientId The client ID
   * @param itemsPerPage Number of items to return per page
   * @returns Observable with ProductResponse
   */
  getProductsByClientId(clientId: string, itemsPerPage: number = 300): Observable<ProductResponse> {
    const params = this.buildParams({ itemsPerPage });
    return this.getWithJsonLd<ProductResponse>(
      this.buildClientUrl(clientId, 'products'),
      params
    ).pipe(
      map(response => this.normalizeHydraCollection<Product>(response))
    );
  }

  /**
   * Get products for a specific client by ID with filters
   * @param clientId The client ID
   * @param filters Object containing filter parameters
   * @param itemsPerPage Number of items to return per page
   * @returns Observable with ProductResponse
   */
  getProductsByClientIdWithFilters(
    clientId: string,
    filters: ProductFilters = {},
    itemsPerPage: number = 300
  ): Observable<ProductResponse> {
    const params = this.buildArrayParams({
      itemsPerPage,
      ...filters
    });

    const url = this.buildClientUrl(clientId, 'products');

    return this.getWithJsonLd<ProductResponse>(url, params).pipe(
      map(response => this.normalizeHydraCollection<Product>(response))
    );
  }

  /**
   * Get a specific product by ID
   * @param id Product ID
   * @returns Observable with the product data
   */
  getProduct(id: string): Observable<Product> {
    return this.getWithJsonLd<Product>(this.buildUrl('products', id));
  }

  /**
   * Get a specific product for a client
   * @param clientId The client ID
   * @param productId The product ID
   * @returns Observable with the product data
   */
  getClientProduct(clientId: string, productId: string): Observable<Product> {
    return this.getWithJsonLd<Product>(
      this.buildClientUrl(clientId, 'products', productId)
    );
  }
}
