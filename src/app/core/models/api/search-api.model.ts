/**
 * API interfaces for Search functionality
 * Moved from search.service.ts to follow Angular best practices
 */

/** Metadata for search result items */
export interface SearchResultMetadata {
  partNumber?: string;
  machineType?: string;
  orderDate?: string;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

/** Single search result item */
export interface SearchResultItem {
  id: string;
  title: string;
  type: 'machine' | 'product' | 'order' | 'inquiry';
  badge: string;
  route: string;
  description?: string;
  metadata?: SearchResultMetadata;
}

/** Filter type for search results */
export type SearchFilterType = 'all' | 'machine' | 'product' | 'order' | 'inquiry';

/** Recent search item */
export interface RecentSearch {
  query: string;
  timestamp: number;
}

/** Aggregated search results across all entity types */
export interface SearchResults {
  machines: SearchResultItem[];
  products: SearchResultItem[];
  orders: SearchResultItem[];
  inquiries: SearchResultItem[];
  totalMachines: number;
  totalProducts: number;
  totalOrders: number;
  totalInquiries: number;
}
