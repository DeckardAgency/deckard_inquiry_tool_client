import { Component, EventEmitter, HostListener, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface MachineConfig {
  machineIndex: number;
  partsCount: number;
  isOther: boolean;
  machineId?: string;
}

export interface PopulatorConfig {
  machines: MachineConfig[];
}

export interface GeneratedPart {
  partName: string;
  partNumber: string;
  shortDescription: string;
  additionalNotes: string;
}

export interface GeneratedMachine {
  machineIndex: number;
  parts: GeneratedPart[];
  isOther: boolean;
  machineId?: string;
}

// Extend Window interface for dev tools
declare global {
  interface Window {
    devTools?: {
      formPopulator?: {
        open: () => void;
        close: () => void;
        toggle: () => void;
      };
      templatePopulator?: {
        open: () => void;
        close: () => void;
        toggle: () => void;
      };
    };
  }
}

@Component({
  selector: 'app-form-populator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-populator.component.html',
  styleUrls: ['./form-populator.component.scss']
})
export class FormPopulatorComponent implements OnInit, OnDestroy {
  @Output() populate = new EventEmitter<GeneratedMachine[]>();

  isOpen = false;
  machineCount = 1;
  partsPerMachine: number[] = [3];
  isOtherMachine: boolean[] = [false];
  machineIds: string[] = [''];

  // Real Deckard parts from ERP offer PDFs (for testing)
  private realParts: { partNumber: string; partName: string; description: string }[] = [
    // From EA1063409A (ecoTex 1600L)
    { partNumber: 'AZZW-02806', partName: 'CERAMIC HEATHER BAND', description: 'D153 X 93, P=2000W / KERAMIKHEIZBAND' },
    { partNumber: 'AIHD-01452', partName: 'HEATING BAND CERAMIC SEGMENT', description: 'D298 X 50mm 2100W 440V / KERAMIKHEIZBAND' },
    { partNumber: 'AIHD-01453', partName: 'HEATING BAND CERAMIC SEGMENT', description: 'D298 X 110mm 4000W 440V / KERAMIKHEIZBAND' },
    { partNumber: 'ZWH-01356', partName: 'CERAMIC HEATING ELEMENT', description: 'D268 X 168 X 161, 3100W / RINGHEIZBAND KERAMIK' },
    { partNumber: 'AIHD-01455', partName: 'HEATING BAND CERAMIC SEGMENT', description: 'D180 X 48mm 600W 380V / KERAMIKHEIZBAND' },
    { partNumber: 'ZWH-04159', partName: 'CERAMIC HEATING BAND', description: 'D105 X 123 600W / KERAMIKHEIZBAND' },
    { partNumber: 'AIRZ-01236', partName: 'MELT TEMPERATURE SENSOR', description: 'Fe-CuNi 1/2"-20 UNF l=0,2m / MASSETEMPERATURFUEHLER' },
    { partNumber: 'ZWH-01546', partName: 'STATIC MIXER DISPLACE RING', description: 'STATIKMISCHER ERSATZRING' },
    { partNumber: 'AZZW-00690', partName: 'HEATING CARTRIDGE', description: 'D16 X 225, 2040W, 440V / HEIZPATRONE' },
    { partNumber: 'ZWH-00744', partName: 'AL SQUEEZIMH RING', description: 'D65 X D85 X 11 / ALU-DICHTRING' },
    { partNumber: 'ZWH-00895', partName: 'ALUMINUM SEALING RING', description: 'D38 X 56.5 X 11 / ALU-DICHTRING' },
    { partNumber: 'ZWH-00990', partName: 'STUD BOLT AUTOMATIC FILTER', description: 'M20 X 370 / STIFTSCHRAUBE AUTOMATFILTER' },
    { partNumber: 'ANCS-01086', partName: 'WASHER M20', description: 'SCHEIBE M20' },
    { partNumber: 'ANSI-02376', partName: 'ALLEN SCREW', description: 'M20 X 200 / ISK-SCHRAUBE' },
    { partNumber: 'ANUK-04073', partName: 'HEXAGON NUT M20', description: 'SK-MUTTER M20' },
    // From EA1063691 (+++ STAREX 1400 S)
    { partNumber: 'AIHS-01141', partName: 'HIGH PERFORMANCE HEATING CARTRIDGE', description: 'D10 X 100mm 550W 440V / HOCHLEISTUNGS-HEIZPATRONE' },
    { partNumber: 'AARF-01461', partName: 'ARMID-TANGENTIAL-BELT', description: '120 X 8220 / ARMID-TANGENTIALRIEMEN' },
    { partNumber: 'Z3O-01256A', partName: 'SUCTION PIPE', description: 'D13,5 X 2,35 / SAUGROHR' },
    { partNumber: 'Z3R-09721A', partName: 'SLEEVE', description: 'HUELSE 120' },
    { partNumber: 'ANUK-01029', partName: 'HEXAGON NUT', description: 'B M16 X 1,5 / SK-MUTTER' },
    { partNumber: 'ADRV-01036', partName: 'SLEEVE NUT', description: 'IN(M16 X 1,5) / UEBERWURFMUTTER' },
    { partNumber: 'AIRD-01099', partName: 'MELT PRESSURE SENSOR', description: '0 - 500 bar CAN-Open / MASSEDRUCKAUFNEHMER' },
    { partNumber: 'Z4R-05213', partName: 'SPACER-RING D120', description: 'UEBERGANGSRING D120/FILTER120' },
    { partNumber: 'Z3R-03762A', partName: 'ADJUSTMENT FOR ROTARY INLET', description: 'ANPASSUNG F. DREHEINFUEHRUNG' },
    { partNumber: 'AZEX-01130', partName: 'FILTER BELT', description: 'L=10m, B=127mm, MESH: 260/40 / FILTERBAND' },
    { partNumber: 'AZEX-01166', partName: 'FILTER BELT', description: 'L=10m, B=127mm, MESH: 152/30 / FILTERBAND' },
    // From EA1063752
    { partNumber: 'AZZG-00010', partName: 'ROTARY ENCODER COMPLETE WITH 250mm CABLE', description: 'DREHGEBER KOMPLETT MIT 250mm KABEL' },
  ];

  private descriptions = [
    'Replacement needed due to wear',
    'Preventive maintenance replacement',
    'Upgrade to newer version required',
    'Original part showing signs of degradation',
    'Requested for spare parts inventory',
    'Emergency replacement needed',
    'Scheduled maintenance part',
    'Quality improvement upgrade'
  ];

  private machineIdPrefixes = [
    'SL', 'STR', 'MX', 'PRO', 'IND', 'LN'
  ];

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // Cmd+Shift+P (or Ctrl+Shift+P) to toggle populator
    // This doesn't conflict with browser shortcuts
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
    window.devTools.formPopulator = {
      open: () => { this.open(); return 'Form Populator opened'; },
      close: () => { this.close(); return 'Form Populator closed'; },
      toggle: () => { this.togglePopulator(); return this.isOpen ? 'Form Populator opened' : 'Form Populator closed'; }
    };
    console.log('%c[DevTools] Form Populator registered. Use:', 'color: #a855f7; font-weight: bold;');
    console.log('%c  devTools.formPopulator.open()   - Open the populator', 'color: #9ca3af;');
    console.log('%c  devTools.formPopulator.close()  - Close the populator', 'color: #9ca3af;');
    console.log('%c  devTools.formPopulator.toggle() - Toggle the populator', 'color: #9ca3af;');
    console.log('%c  Or press Cmd+Shift+P', 'color: #9ca3af;');
  }

  private unregisterConsoleCommands(): void {
    if (window.devTools?.formPopulator) {
      delete window.devTools.formPopulator;
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
    this.partsPerMachine = [3];
    this.isOtherMachine = [false];
    this.machineIds = [''];
  }

  updateMachineCount(): void {
    const newCount = Math.max(1, Math.min(10, this.machineCount));
    this.machineCount = newCount;

    // Adjust partsPerMachine array
    while (this.partsPerMachine.length < newCount) {
      this.partsPerMachine.push(3);
    }
    while (this.partsPerMachine.length > newCount) {
      this.partsPerMachine.pop();
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

  updatePartsCount(machineIndex: number, count: number): void {
    this.partsPerMachine[machineIndex] = Math.max(1, Math.min(20, count));
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
    const generatedData: GeneratedMachine[] = [];

    for (let m = 0; m < this.machineCount; m++) {
      const parts: GeneratedPart[] = [];
      const partsCount = this.partsPerMachine[m];

      for (let p = 0; p < partsCount; p++) {
        parts.push(this.generatePart(m, p));
      }

      const machine: GeneratedMachine = {
        machineIndex: m,
        parts,
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

  private usedPartIndices = new Set<number>();

  private generatePart(machineIndex: number, partIndex: number): GeneratedPart {
    // Pick a real part that hasn't been used yet
    let idx: number;
    if (this.usedPartIndices.size >= this.realParts.length) {
      this.usedPartIndices.clear(); // Reset if all used
    }
    do {
      idx = Math.floor(Math.random() * this.realParts.length);
    } while (this.usedPartIndices.has(idx));
    this.usedPartIndices.add(idx);

    const realPart = this.realParts[idx];

    return {
      partName: realPart.partName,
      partNumber: realPart.partNumber,
      shortDescription: realPart.description,
      additionalNotes: ''
    };
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('populator-backdrop')) {
      this.close();
    }
  }

  getTotalParts(): number {
    return this.partsPerMachine.reduce((sum, count) => sum + count, 0);
  }
}
