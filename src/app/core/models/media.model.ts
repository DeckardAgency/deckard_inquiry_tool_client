export interface MediaItem {
  '@context'?: string;     // JSON-LD context
  '@id': string;           // The IRI identifier for the media item
  '@type': string;         // The JSON-LD type
  id: string;              // The local ID
  filename: string;
  mimeType: string;
  filePath: string;
  createdAt?: string;      // Optional - may not be present in all API responses
  updatedAt?: string;      // Optional - may not be present in all API responses
}
