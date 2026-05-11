import { UploadedFile } from './manual-cart-item.model';
import { SpreadsheetRow } from '@shared/components/spreadsheet/spreadsheet.interface';

/**
 * Unified Part interface for all manual entry flows
 * Supports both input-form and template-based entry
 */
export interface Part {
  /** Unique identifier for the part */
  id: string;

  /** Uploaded files/attachments for this part */
  files: UploadedFile[];

  /**
   * Spreadsheet data (used in template-based entry)
   * Contains rows from Excel/spreadsheet import
   * Always defined, but can be empty array
   */
  spreadsheetData: SpreadsheetRow[];

  /**
   * Additional notes for this part (template-based entry)
   * Note: input-form stores notes in data.additionalNotes instead
   */
  additionalNotes?: string;

  /**
   * Structured part data (used in input-form entry)
   * Contains detailed part information
   * Always defined, but properties are optional
   */
  data: {
    /** Part/product name */
    partName?: string;
    /** Part number/SKU */
    partNumber?: string;
    /** Short description of the part need */
    shortDescription?: string;
    /** Additional notes (input-form specific) */
    additionalNotes?: string;
    /** Machine ID for "Other/Unlisted" machines */
    machineId?: string;
  };

  /** UI state: whether the part form has been touched/validated */
  touched?: boolean;

  /** UI state: whether the part accordion is expanded */
  isExpanded?: boolean;
}
