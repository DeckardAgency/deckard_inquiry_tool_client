import { Injectable } from '@angular/core';
import { Observable, map, of, catchError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { BaseHttpService } from './base-http.service';
import { Documentation, DocumentationMedia, DocumentationSection } from '@models/documentation.model';
import { NormalizedCollection } from '@models/api/hydra-api.model';
import { environment } from '@env/environment';

/**
 * Documentation Service
 *
 * Provides methods to fetch documentation pages from the API.
 * Only fetches published documentation for client-facing app.
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentationService extends BaseHttpService {
  private readonly endpoint = 'documentations';

  /**
   * Get all published documentations
   */
  getPublishedDocumentations(): Observable<Documentation[]> {
    const params = this.buildParams({
      isPublished: true,
      'order[sortOrder]': 'asc'
    });

    return this.getWithJsonLd<NormalizedCollection<Documentation>>(
      this.buildUrl(this.endpoint),
      params
    ).pipe(
      map(response => this.normalizeHydraCollection<Documentation>(response as Record<string, unknown>).member),
      catchError(error => {
        console.error('Error fetching documentations:', error);
        return of([]);
      })
    );
  }

  /**
   * Get a single documentation by slug
   */
  getDocumentationBySlug(slug: string): Observable<Documentation | null> {
    const params = this.buildParams({
      slug: slug,
      isPublished: true
    });

    return this.getWithJsonLd<NormalizedCollection<Documentation>>(
      this.buildUrl(this.endpoint),
      params
    ).pipe(
      map(response => {
        const normalized = this.normalizeHydraCollection<Documentation>(response as Record<string, unknown>);
        return normalized.member.length > 0 ? normalized.member[0] : null;
      }),
      catchError(error => {
        console.error('Error fetching documentation by slug:', error);
        return of(null);
      })
    );
  }

  /**
   * Get a single documentation by ID
   */
  getDocumentation(id: string): Observable<Documentation | null> {
    return this.getWithJsonLd<Documentation>(
      this.buildUrl(this.endpoint, id)
    ).pipe(
      catchError(error => {
        console.error('Error fetching documentation:', error);
        return of(null);
      })
    );
  }

  /**
   * Build navigation sections from documentations
   * Groups by category and creates a hierarchical structure
   */
  buildNavigationSections(documentations: Documentation[]): DocumentationSection[] {
    const sections: DocumentationSection[] = [];
    const categoryMap = new Map<string, DocumentationSection>();

    // Sort by sortOrder
    const sorted = [...documentations].sort((a, b) => a.sortOrder - b.sortOrder);

    for (const doc of sorted) {
      const section: DocumentationSection = {
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        category: doc.category,
        sortOrder: doc.sortOrder
      };

      if (doc.category) {
        // Group under category
        if (!categoryMap.has(doc.category)) {
          const categorySection: DocumentationSection = {
            id: `category-${doc.category.toLowerCase().replace(/\s+/g, '-')}`,
            title: doc.category,
            slug: '',
            category: null,
            sortOrder: doc.sortOrder,
            subsections: []
          };
          categoryMap.set(doc.category, categorySection);
          sections.push(categorySection);
        }
        categoryMap.get(doc.category)!.subsections!.push(section);
      } else {
        // Top-level item
        sections.push(section);
      }
    }

    return sections;
  }

  /**
   * Get the full URL for a media file
   */
  getMediaUrl(filePath: string): string {
    return `${environment.apiBaseUrl}${filePath}`;
  }

  /**
   * Build a map of media placeholders to URLs for a documentation
   */
  buildMediaMap(media: DocumentationMedia[] | undefined): Map<string, string> {
    const mediaMap = new Map<string, string>();
    if (media) {
      for (const item of media) {
        mediaMap.set(item.filename, this.getMediaUrl(item.filePath));
      }
    }
    return mediaMap;
  }
}
