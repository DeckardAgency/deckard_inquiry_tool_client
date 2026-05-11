/**
 * API interfaces for Machine-related search and query parameters
 * Moved from machine.service.ts to follow Angular best practices
 */

/** Search parameters for machine queries */
export interface MachineSearchParams {
  articleDescription?: string;
  itemsPerPage?: number;
  page?: number;
}
