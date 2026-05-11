/**
 * Documentation Model
 *
 * Types for documentation pages fetched from the API.
 */

export interface DocumentationMedia {
  '@id'?: string;
  '@type'?: string;
  id: string;
  filename: string;
  mimeType: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface Documentation {
  '@id'?: string;
  '@type'?: string;
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  sortOrder: number;
  isPublished: boolean;
  media?: DocumentationMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentationSection {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  sortOrder: number;
  subsections?: DocumentationSection[];
}
