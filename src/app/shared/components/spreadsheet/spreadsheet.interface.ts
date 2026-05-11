export interface SpreadsheetRow {
  quantity?: string;
  partNumber?: string;
  partName?: string;
}

export type TabType = 'demo' | 'client';

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeTimestamp?: boolean;
}
