import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Product, ProductResponse } from '@core/models';
import { MediaItem } from '@core/models/media.model';

/**
 * Deckard PIM product source.
 *
 * Fetches products from the PIM's public export endpoint and adapts them
 * to the local Product model. The shop currently uses this in place of
 * the inquiry-tool backend's /products endpoint.
 *
 * Field mapping is family-aware: PIM stores per-family attributes with the
 * family code as a prefix (e.g. cars_family carries cars_name, cars_price,
 * cars_part_number, …). We try '{prefix}_{key}' first and fall back to the
 * bare key for families that use generic attribute codes.
 */
@Injectable({ providedIn: 'root' })
export class PimProductService {
  private readonly http = inject(HttpClient);
  private readonly productsUrl = `${environment.pim.exportUrl}/products`;
  private readonly channel = environment.pim.channel;

  getProducts(options?: { itemsPerPage?: number; search?: string }): Observable<ProductResponse> {
    const itemsPerPage = options?.itemsPerPage ?? 300;

    const params = new HttpParams()
      .set('channel', this.channel)
      .set('itemsPerPage', itemsPerPage.toString());

    return this.http.get<PimExportResponse>(this.productsUrl, { params }).pipe(
      map(response => this.toProductResponse(response, options?.search))
    );
  }

  private toProductResponse(response: PimExportResponse, search?: string): ProductResponse {
    const items = response['hydra:member'] ?? [];
    const matched = search ? this.filterByTerm(items, search) : items;
    const member = matched.map(item => this.toProduct(item));
    return {
      '@context': '',
      '@id': '',
      '@type': '',
      member,
      totalItems: matched.length,
      view: null,
    };
  }

  private filterByTerm(items: PimProduct[], term: string): PimProduct[] {
    const t = term.trim().toLowerCase();
    if (!t) {
      return items;
    }
    return items.filter(p => {
      const name = String(this.familyAware(p, 'name') ?? '').toLowerCase();
      const partNo = String(this.familyAware(p, 'part_number') ?? '').toLowerCase();
      return p.sku.toLowerCase().includes(t) || name.includes(t) || partNo.includes(t);
    });
  }

  private toProduct(p: PimProduct): Product {
    const name = String(this.familyAware(p, 'name') ?? p.sku);
    const partNo = String(this.familyAware(p, 'part_number') ?? p.sku);
    const description = String(this.familyAware(p, 'description') ?? '');
    const price = this.extractPrice(this.familyAware(p, 'price'));
    const featuredUuid = this.familyAware(p, 'featured_image');
    const galleryUuids = this.familyAware(p, 'gallery');
    const weight = this.familyAware(p, 'weight_kg') ?? this.familyAware(p, 'weight');

    return {
      '@id': `/api/v1/products/${p.id}`,
      '@type': 'Product',
      id: p.id,
      name,
      slug: p.sku.toLowerCase(),
      partNo,
      shortDescription: description,
      regularPrice: price,
      clientPrice: price,
      effectivePrice: price,
      weight: weight != null ? String(weight) : undefined,
      featuredImage: this.toMediaItem(featuredUuid, name),
      imageGallery: Array.isArray(galleryUuids)
        ? galleryUuids.map(uuid => this.toMediaItem(uuid, name)).filter((m): m is MediaItem => m !== null)
        : [],
      machines: [],
    };
  }

  private toMediaItem(uuid: unknown, name: string): MediaItem | null {
    if (typeof uuid !== 'string' || uuid === '') {
      return null;
    }
    return {
      '@id': `/api/v1/assets/${uuid}`,
      '@type': 'MediaItem',
      id: uuid,
      filename: name,
      mimeType: 'image/*',
      filePath: `${environment.pim.assetUrl}/${uuid}/file`,
    };
  }

  /**
   * Resolve a PIM attribute value taking the family prefix into account.
   * Tries '{prefix}_{key}' (prefix = family with '_family' stripped),
   * then '{family}_{key}', then the bare key.
   */
  private familyAware(p: PimProduct, key: string): unknown {
    const values = p.values ?? {};
    const family = p.family ?? '';

    if (family) {
      const prefix = family.replace(/_family$/, '');
      if (prefix && prefix !== family) {
        const v = this.extractValue(values[`${prefix}_${key}`]);
        if (v != null) return v;
      }
      const v2 = this.extractValue(values[`${family}_${key}`]);
      if (v2 != null) return v2;
    }

    return this.extractValue(values[key]);
  }

  /**
   * Unwrap a PIM attribute value: localized maps -> first English/German variant,
   * reference values like {"code": "..."} -> the code string, arrays/primitives -> as-is.
   */
  private extractValue(v: unknown): unknown {
    if (v == null) return null;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
    if (Array.isArray(v)) return v;
    if (typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      if ('code' in obj && (typeof obj['code'] === 'string' || typeof obj['code'] === 'number')) {
        return obj['code'];
      }
      for (const locale of ['en_US', 'en_GB', 'en', 'de_DE', 'default']) {
        if (locale in obj) return obj[locale];
      }
      const first = Object.values(obj)[0];
      return first ?? null;
    }
    return null;
  }

  private extractPrice(p: unknown): number {
    if (p == null) return 0;
    if (typeof p === 'number') return p;
    if (typeof p === 'string') {
      const n = Number(p);
      return Number.isFinite(n) ? n : 0;
    }
    if (typeof p === 'object') {
      const obj = p as Record<string, unknown>;
      for (const cur of ['EUR', 'USD', 'GBP']) {
        const v = obj[cur];
        if (v != null) return Number(v) || 0;
      }
      const first = Object.values(obj)[0];
      return first != null ? Number(first) || 0 : 0;
    }
    return 0;
  }
}

interface PimExportResponse {
  'hydra:member'?: PimProduct[];
  'hydra:totalItems'?: number;
}

interface PimProduct {
  id: string;
  sku: string;
  family?: string;
  enabled?: boolean;
  values?: Record<string, unknown>;
  categories?: string[];
}
