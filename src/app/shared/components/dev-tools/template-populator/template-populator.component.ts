import { Component, EventEmitter, HostListener, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpreadsheetRow } from '@shared/components/spreadsheet/spreadsheet.interface';

export interface TemplatePopulatorConfig {
  machineIndex: number;
  rowCount: number;
  isOther: boolean;
  machineId?: string;
}

export interface GeneratedTemplateData {
  machineIndex: number;
  rows: SpreadsheetRow[];
  isOther: boolean;
  machineId?: string;
}

@Component({
  selector: 'app-template-populator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './template-populator.component.html',
  styleUrls: ['./template-populator.component.scss']
})
export class TemplatePopulatorComponent implements OnInit, OnDestroy {
  @Output() populate = new EventEmitter<GeneratedTemplateData[]>();

  isOpen = false;
  machineCount = 1;
  rowsPerMachine: number[] = [5];
  isOtherMachine: boolean[] = [false];
  machineIds: string[] = [''];

  // Real Deckard parts from ERP offer PDFs (for testing)
  private realParts: { partNumber: string; partName: string }[] = [
    { partNumber: 'AZZW-02806', partName: 'CERAMIC HEATHER BAND' },
    { partNumber: 'AIHD-01452', partName: 'HEATING BAND CERAMIC SEGMENT' },
    { partNumber: 'AIHD-01453', partName: 'HEATING BAND CERAMIC SEGMENT' },
    { partNumber: 'ZWH-01356', partName: 'CERAMIC HEATING ELEMENT' },
    { partNumber: 'AIHD-01455', partName: 'HEATING BAND CERAMIC SEGMENT' },
    { partNumber: 'ZWH-04159', partName: 'CERAMIC HEATING BAND' },
    { partNumber: 'AIRZ-01236', partName: 'MELT TEMPERATURE SENSOR' },
    { partNumber: 'ZWH-01546', partName: 'STATIC MIXER DISPLACE RING' },
    { partNumber: 'AZZW-00690', partName: 'HEATING CARTRIDGE' },
    { partNumber: 'ZWH-00744', partName: 'AL SQUEEZIMH RING' },
    { partNumber: 'ZWH-00895', partName: 'ALUMINUM SEALING RING' },
    { partNumber: 'ZWH-00990', partName: 'STUD BOLT AUTOMATIC FILTER' },
    { partNumber: 'ANCS-01086', partName: 'WASHER M20' },
    { partNumber: 'ANSI-02376', partName: 'ALLEN SCREW' },
    { partNumber: 'ANUK-04073', partName: 'HEXAGON NUT M20' },
    { partNumber: 'AIHS-01141', partName: 'HIGH PERFORMANCE HEATING CARTRIDGE' },
    { partNumber: 'AARF-01461', partName: 'ARMID-TANGENTIAL-BELT' },
    { partNumber: 'Z3O-01256A', partName: 'SUCTION PIPE' },
    { partNumber: 'Z3R-09721A', partName: 'SLEEVE' },
    { partNumber: 'ANUK-01029', partName: 'HEXAGON NUT' },
    { partNumber: 'ADRV-01036', partName: 'SLEEVE NUT' },
    { partNumber: 'AIRD-01099', partName: 'MELT PRESSURE SENSOR' },
    { partNumber: 'Z4R-05213', partName: 'SPACER-RING D120' },
    { partNumber: 'Z3R-03762A', partName: 'ADJUSTMENT FOR ROTARY INLET' },
    { partNumber: 'AZEX-01130', partName: 'FILTER BELT' },
    { partNumber: 'AZEX-01166', partName: 'FILTER BELT' },
    { partNumber: 'AZZG-00010', partName: 'ROTARY ENCODER COMPLETE WITH 250mm CABLE' },
  ];
  private usedPartIndices = new Set<number>();

  private machineIdPrefixes = [
    'SL', 'STR', 'MX', 'PRO', 'IND', 'LN'
  ];

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // Cmd+Shift+P (or Ctrl+Shift+P) to toggle populator
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
      event.preventDefault();
      this.togglePopulator();
    }
  }

  ngOnInit(): void {
    this.registerConsoleCommands();
  }

  ngOnDestroy(): void {
    this.unregisterConsoleCommands();
  }

  private registerConsoleCommands(): void {
    if (!window.devTools) {
      window.devTools = {};
    }
    window.devTools.templatePopulator = {
      open: () => { this.open(); return 'Template Populator opened'; },
      close: () => { this.close(); return 'Template Populator closed'; },
      toggle: () => { this.togglePopulator(); return this.isOpen ? 'Template Populator opened' : 'Template Populator closed'; }
    };
    console.log('%c[DevTools] Template Populator registered. Use:', 'color: #DC2626; font-weight: bold;');
    console.log('%c  devTools.templatePopulator.open()   - Open the populator', 'color: #9ca3af;');
    console.log('%c  devTools.templatePopulator.close()  - Close the populator', 'color: #9ca3af;');
    console.log('%c  devTools.templatePopulator.toggle() - Toggle the populator', 'color: #9ca3af;');
    console.log('%c  Or press Cmd+Shift+P', 'color: #9ca3af;');
  }

  private unregisterConsoleCommands(): void {
    if (window.devTools?.templatePopulator) {
      delete window.devTools.templatePopulator;
    }
  }

  togglePopulator(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.resetConfig();
    }
  }

  open(): void {
    this.isOpen = true;
    this.resetConfig();
  }

  close(): void {
    this.isOpen = false;
  }

  resetConfig(): void {
    this.machineCount = 1;
    this.rowsPerMachine = [5];
    this.isOtherMachine = [false];
    this.machineIds = [''];
  }

  updateMachineCount(): void {
    const newCount = Math.max(1, Math.min(10, this.machineCount));
    this.machineCount = newCount;

    // Adjust rowsPerMachine array
    while (this.rowsPerMachine.length < newCount) {
      this.rowsPerMachine.push(5);
    }
    while (this.rowsPerMachine.length > newCount) {
      this.rowsPerMachine.pop();
    }

    // Adjust isOtherMachine array
    while (this.isOtherMachine.length < newCount) {
      this.isOtherMachine.push(false);
    }
    while (this.isOtherMachine.length > newCount) {
      this.isOtherMachine.pop();
    }

    // Adjust machineIds array
    while (this.machineIds.length < newCount) {
      this.machineIds.push('');
    }
    while (this.machineIds.length > newCount) {
      this.machineIds.pop();
    }
  }

  updateRowCount(machineIndex: number, count: number): void {
    this.rowsPerMachine[machineIndex] = Math.max(1, Math.min(50, count));
  }

  onOtherMachineChange(machineIndex: number): void {
    if (this.isOtherMachine[machineIndex]) {
      this.machineIds[machineIndex] = this.generateMachineId();
    } else {
      this.machineIds[machineIndex] = '';
    }
  }

  private generateMachineId(): string {
    const prefix = this.machineIdPrefixes[Math.floor(Math.random() * this.machineIdPrefixes.length)];
    const year = 2015 + Math.floor(Math.random() * 10);
    const serial = Math.floor(Math.random() * 9000 + 1000);
    return `${prefix}-${year}-${serial}`;
  }

  generateAndPopulate(): void {
    const generatedData: GeneratedTemplateData[] = [];

    for (let m = 0; m < this.machineCount; m++) {
      const rows: SpreadsheetRow[] = [];
      const rowCount = this.rowsPerMachine[m];

      for (let r = 0; r < rowCount; r++) {
        rows.push(this.generateRow(m, r));
      }

      const machine: GeneratedTemplateData = {
        machineIndex: m,
        rows,
        isOther: this.isOtherMachine[m]
      };

      if (this.isOtherMachine[m] && this.machineIds[m]) {
        machine.machineId = this.machineIds[m];
      }

      generatedData.push(machine);
    }

    this.populate.emit(generatedData);
    this.close();
  }

  private generateRow(machineIndex: number, rowIndex: number): SpreadsheetRow {
    // Pick a real part that hasn't been used yet
    let idx: number;
    if (this.usedPartIndices.size >= this.realParts.length) {
      this.usedPartIndices.clear();
    }
    do {
      idx = Math.floor(Math.random() * this.realParts.length);
    } while (this.usedPartIndices.has(idx));
    this.usedPartIndices.add(idx);

    const realPart = this.realParts[idx];
    const quantity = String(Math.floor(Math.random() * 10) + 1);

    return {
      quantity,
      partNumber: realPart.partNumber,
      partName: realPart.partName
    };
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('populator-backdrop')) {
      this.close();
    }
  }

  getTotalRows(): number {
    return this.rowsPerMachine.reduce((sum, count) => sum + count, 0);
  }
}
