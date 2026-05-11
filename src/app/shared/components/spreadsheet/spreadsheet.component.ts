import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { SpreadsheetRow, TabType, ExportOptions } from './spreadsheet.interface';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-spreadsheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './spreadsheet.component.html',
  styleUrls: ['./spreadsheet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpreadsheetComponent implements OnInit, OnChanges {
  @Input() initialData: SpreadsheetRow[] = [];
  @Output() dataChanged = new EventEmitter<SpreadsheetRow[]>();
  @Output() tabChanged = new EventEmitter<TabType>();

  activeTab: TabType = 'client';
  statusMessage: string = '';
  isSuccess: boolean = false;
  isExpanded: boolean = false;

  // Demo data matching the design image
  demoData: SpreadsheetRow[] = [
    { quantity: '8', partNumber: 'ANCS-05001', partName: 'Hexagon screw' },
    { quantity: '16', partNumber: 'ANSK-03000', partName: 'Washer' },
    { quantity: '24', partNumber: 'ANSK-12345', partName: 'Power panel T30' },
    { quantity: '10', partNumber: 'ANSK-90000', partName: 'DC converter' },
    { quantity: '300', partNumber: 'POUBM-1231', partName: 'Power module 5000W' }
  ];

  // Client data - starts with empty rows
  clientData: SpreadsheetRow[] = [];
  private isOwnEmission = false;
  private logger!: ScopedLogger;

  constructor(
    private loggerService: LoggerService,
    private cdr: ChangeDetectorRef
  ) {
    this.logger = this.loggerService.createLogger('SpreadsheetComponent');
  }

  ngOnInit(): void {
    // Check if we have initial data, otherwise initialize with empty rows
    if (this.initialData && this.initialData.length > 0) {
      this.populateFromInitialData(this.initialData);
    } else {
      this.initializeClientData();
    }
    this.emitData();
    // Emit initial tab state
    this.tabChanged.emit(this.activeTab);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only handle external changes (not caused by our own emission)
    if (changes['initialData'] && !changes['initialData'].firstChange && !this.isOwnEmission) {
      const newData = changes['initialData'].currentValue as SpreadsheetRow[];
      if (newData && newData.length > 0) {
        this.populateFromInitialData(newData);
        this.cdr.markForCheck();
      }
    }
  }

  /**
   * Populate client data from initial/external data
   */
  private populateFromInitialData(data: SpreadsheetRow[]): void {
    // Populate client data with provided data
    this.clientData = data.map(row => ({ ...row }));
    // Ensure we have at least a few empty rows for additional entries
    const emptyRowsToAdd = Math.max(0, 5 - this.clientData.length);
    for (let i = 0; i < emptyRowsToAdd; i++) {
      this.clientData.push({ quantity: '', partNumber: '', partName: '' });
    }
    // Always add 2 extra empty rows at the end for more entries
    this.clientData.push({ quantity: '', partNumber: '', partName: '' });
    this.clientData.push({ quantity: '', partNumber: '', partName: '' });
  }

  /**
   * Initialize client data with empty rows
   */
  private initializeClientData(): void {
    this.clientData = [];
    // Create initial empty rows for client data entry
    for (let i = 0; i < 10; i++) {
      this.clientData.push({
        quantity: '',
        partNumber: '',
        partName: ''
      });
    }
  }

  /**
   * Emit current data to parent component
   */
  private emitData(): void {
    const currentData = this.getCurrentData();
    // Filter out completely empty rows before emitting
    const filteredData = currentData.filter(row =>
      row.quantity || row.partNumber || row.partName
    );
    this.isOwnEmission = true;
    this.dataChanged.emit(filteredData);
    // Reset flag after Angular processes the change
    setTimeout(() => this.isOwnEmission = false, 0);
  }

  /**
   * Switch between demo and client data tabs
   */
  switchTab(tab: TabType): void {
    this.activeTab = tab;
    this.clearStatusMessage();
    this.emitData();
    // Emit tab change event
    this.tabChanged.emit(tab);
  }

  /**
   * Get current data based on active tab
   */
  getCurrentData(): SpreadsheetRow[] {
    return this.activeTab === 'demo' ? [...this.demoData] : [...this.clientData];
  }

  /**
   * Check if client data has valid entries
   */
  hasValidClientData(): boolean {
    return this.clientData.some(row =>
      row.quantity || row.partNumber || row.partName
    );
  }

  /**
   * Handle data changes and auto-add rows
   */
  onDataChange(rowIndex?: number): void {
    // Check if we need to add more rows (when user is typing in penultimate row)
    if (this.activeTab === 'client' && rowIndex !== undefined) {
      this.checkAndAddRow(rowIndex);
    }

    // Use setTimeout to ensure the model is updated before emitting
    setTimeout(() => {
      this.emitData();
    }, 0);
  }

  /**
   * Check if user is entering data in penultimate row and add a new row if needed
   */
  private checkAndAddRow(currentRowIndex: number): void {
    const totalRows = this.clientData.length;
    const penultimateRowIndex = totalRows - 2;

    // If user is typing in the penultimate row
    if (currentRowIndex === penultimateRowIndex) {
      const currentRow = this.clientData[currentRowIndex];

      // Check if the current row has any data
      if (currentRow.quantity || currentRow.partNumber || currentRow.partName) {
        // Check if the last row is empty (to avoid adding duplicate empty rows)
        const lastRow = this.clientData[totalRows - 1];
        if (lastRow.quantity || lastRow.partNumber || lastRow.partName) {
          // Last row has data, so add a new empty row
          this.addRow();
        }
      }
    }
  }

  /**
   * Add new row (internal use only)
   */
  private addRow(): void {
    if (this.activeTab === 'client') {
      this.clientData.push({
        quantity: '',
        partNumber: '',
        partName: ''
      });
    }
  }

  /**
   * Remove row (client data only) - keeping for potential future use
   */
  removeRow(index: number): void {
    if (this.activeTab === 'client' && this.clientData.length > 1) {
      this.clientData.splice(index, 1);
      this.emitData();
    }
  }

  /**
   * Toggle fullscreen/expanded view
   */
  toggleFullscreen(): void {
    this.isExpanded = !this.isExpanded;

    // Add or remove fullscreen class to body to handle scrolling
    if (this.isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  /**
   * Exit fullscreen with Escape key
   */
  onEscapeKey(): void {
    if (this.isExpanded) {
      this.toggleFullscreen();
    }
  }

  /**
   * Export current data to Excel file
   */
  exportToExcel(options: ExportOptions = {}): void {
    try {
      const currentData = this.getCurrentData();
      const dataToExport = this.prepareExportData(currentData);

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(dataToExport);

      // Set column widths for better formatting
      ws['!cols'] = [
        { width: 15 },
        { width: 20 },
        { width: 30 }
      ];

      // Add worksheet to workbook
      const sheetName = options.sheetName || 'Deckard Parts Request';
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Generate filename
      const filename = this.generateFilename(options);

      // Save file
      XLSX.writeFile(wb, filename);

      this.showStatusMessage(`Excel file "${filename}" exported successfully!`, true);
    } catch (error) {
      this.logger.error('Export failed', error);
      this.showStatusMessage('Failed to export Excel file. Please try again.', false);
    }
  }

  /**
   * Prepare data for Excel export
   */
  private prepareExportData(data: SpreadsheetRow[]): (string | number)[][] {
    const exportData: (string | number)[][] = [];

    // Add header
    exportData.push(['Deckard part request template', '', '']);
    exportData.push(['Quantity', 'Part Number', 'Part Name']);

    // Add data entries - filter out completely empty entries
    const nonEmptyData = data.filter(row =>
      row.quantity || row.partNumber || row.partName
    );

    nonEmptyData.forEach(row => {
      exportData.push([row.quantity || '', row.partNumber || '', row.partName || '']);
    });

    return exportData;
  }

  /**
   * Generate filename for export
   */
  private generateFilename(options: ExportOptions): string {
    const baseFilename = options.filename || 'Deckard_Parts_Request';
    const tabSuffix = this.activeTab;

    if (options.includeTimestamp !== false) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      return `${baseFilename}_${tabSuffix}_${timestamp}.xlsx`;
    }

    return `${baseFilename}_${tabSuffix}.xlsx`;
  }

  /**
   * Show status message with auto-clear
   */
  private showStatusMessage(message: string, success: boolean): void {
    this.statusMessage = message;
    this.isSuccess = success;
    setTimeout(() => this.clearStatusMessage(), 5000);
  }

  /**
   * Clear status message
   */
  private clearStatusMessage(): void {
    this.statusMessage = '';
    this.isSuccess = false;
  }

  /**
   * TrackBy function for row loops
   */
  trackByIndex(index: number): number {
    return index;
  }
}
