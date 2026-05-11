import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ManualEntryTemplateComponent } from './manual-entry-template.component';
import { MachineService } from '@services/http/machine.service';
import { ManualQuickCartService } from '@services/cart/manual-quick-cart.service';
import { AuthService } from '@core/auth/auth.service';
import { InquiryService } from '@services/http/inquiry.service';
import { ManualEntryStateService } from '@services/manual-entry-state.service';
import { MediaService } from '@services/http/media.service';
import { LoggerService } from '@services/logger.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { Machine, UploadedFile } from '@core/models';
import { SpreadsheetRow } from '@shared/components/spreadsheet/spreadsheet.interface';

describe('ManualEntryTemplateComponent', () => {
  let component: ManualEntryTemplateComponent;
  let fixture: ComponentFixture<ManualEntryTemplateComponent>;
  let machineServiceSpy: jasmine.SpyObj<MachineService>;
  let manualQuickCartServiceSpy: jasmine.SpyObj<ManualQuickCartService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let inquiryServiceSpy: jasmine.SpyObj<InquiryService>;
  let manualEntryStateServiceSpy: jasmine.SpyObj<ManualEntryStateService>;
  let mediaServiceSpy: jasmine.SpyObj<MediaService>;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

  const mockMachines: Machine[] = [
    {
      id: 'machine-1',
      articleDescription: 'Test Machine 1',
      machineType: ['Winding'],
      '@id': '/api/v1/machines/machine-1',
      '@type': 'Machine'
    } as unknown as Machine,
    {
      id: 'machine-2',
      articleDescription: 'Test Machine 2',
      machineType: ['Extrusion'],
      '@id': '/api/v1/machines/machine-2',
      '@type': 'Machine'
    } as unknown as Machine
  ];

  const mockUser = {
    id: 'user-123',
    email: 'test@test.com',
    roles: ['ROLE_USER'],
    '@id': '/api/v1/users/user-123'
  };

  beforeEach(async () => {
    const machineServiceSpyObj = jasmine.createSpyObj('MachineService', ['getMachines', 'searchMachines']);
    const manualQuickCartServiceSpyObj = jasmine.createSpyObj('ManualQuickCartService', ['addToCart']);
    const authServiceSpyObj = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const inquiryServiceSpyObj = jasmine.createSpyObj('InquiryService', ['createInquiry', 'saveDraft']);
    const manualEntryStateServiceSpyObj = jasmine.createSpyObj('ManualEntryStateService', [
      'getSelectedMachine',
      'setSelectedMachine',
      'getIsOtherMachineSelected',
      'setIsOtherMachineSelected',
      'clearSelectedMachine'
    ]);
    const mediaServiceSpyObj = jasmine.createSpyObj('MediaService', ['uploadFile']);
    const loggerServiceSpyObj = jasmine.createSpyObj('LoggerService', ['createLogger']);

    loggerServiceSpyObj.createLogger.and.returnValue({
      debug: jasmine.createSpy('debug'),
      info: jasmine.createSpy('info'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error')
    });

    // Return a fresh copy of machines for each call to avoid mutation issues
    machineServiceSpyObj.getMachines.and.callFake(() =>
      of({
        member: [...mockMachines.map(m => ({ ...m }))],
        totalItems: 2,
        '@context': '',
        '@id': '',
        '@type': '',
        view: null
      })
    );

    // Return a fresh copy for search as well
    machineServiceSpyObj.searchMachines.and.callFake(() =>
      of({
        member: [{ ...mockMachines[0] }],
        totalItems: 1,
        '@context': '',
        '@id': '',
        '@type': '',
        view: null
      })
    );

    authServiceSpyObj.getCurrentUser.and.returnValue(mockUser);

    await TestBed.configureTestingModule({
      imports: [ManualEntryTemplateComponent, HttpClientTestingModule, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: MachineService, useValue: machineServiceSpyObj },
        { provide: ManualQuickCartService, useValue: manualQuickCartServiceSpyObj },
        { provide: AuthService, useValue: authServiceSpyObj },
        { provide: InquiryService, useValue: inquiryServiceSpyObj },
        { provide: ManualEntryStateService, useValue: manualEntryStateServiceSpyObj },
        { provide: MediaService, useValue: mediaServiceSpyObj },
        { provide: LoggerService, useValue: loggerServiceSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManualEntryTemplateComponent);
    component = fixture.componentInstance;

    machineServiceSpy = TestBed.inject(MachineService) as jasmine.SpyObj<MachineService>;
    manualQuickCartServiceSpy = TestBed.inject(ManualQuickCartService) as jasmine.SpyObj<ManualQuickCartService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    inquiryServiceSpy = TestBed.inject(InquiryService) as jasmine.SpyObj<InquiryService>;
    manualEntryStateServiceSpy = TestBed.inject(ManualEntryStateService) as jasmine.SpyObj<ManualEntryStateService>;
    mediaServiceSpy = TestBed.inject(MediaService) as jasmine.SpyObj<MediaService>;
    loggerServiceSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load machines on init', fakeAsync(() => {
      fixture.detectChanges();
      tick(300); // Wait for debounceTime

      expect(machineServiceSpy.getMachines).toHaveBeenCalled();
      expect(component.machines.length).toBe(3); // 2 machines + "Other" option
      expect(component.loading).toBe(false);
    }));

    it('should add "Other" machine option', fakeAsync(() => {
      fixture.detectChanges();
      tick(300);

      const otherMachine = component.machines.find(m => m.id === 'other');
      expect(otherMachine).toBeDefined();
      expect(otherMachine?.articleDescription).toContain('Other');
    }));

    it('should add first part by default', () => {
      fixture.detectChanges();

      expect(component.parts.length).toBe(1);
      expect(component.parts[0].files).toEqual([]);
      expect(component.parts[0].spreadsheetData).toEqual([]);
    });

    it('should handle loading error', fakeAsync(() => {
      machineServiceSpy.getMachines.and.returnValue(
        throwError(() => new Error('Loading failed'))
      );

      fixture.detectChanges();
      tick(300);

      expect(component.error).toBeTruthy();
      expect(component.loading).toBe(false);
    }));
  });

  describe('machine selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(300);
    }));

    it('should select machine', () => {
      component.selectMachine(mockMachines[0]);

      expect(component.selectedMachine).toEqual(mockMachines[0]);
      expect(manualEntryStateServiceSpy.setSelectedMachine).toHaveBeenCalledWith(mockMachines[0]);
    });

    it('should handle "Other" machine selection', () => {
      const otherMachine = component.machines.find(m => m.id === 'other')!;
      component.selectMachine(otherMachine);

      expect(component.isOtherMachineSelected).toBe(true);
      expect(manualEntryStateServiceSpy.setIsOtherMachineSelected).toHaveBeenCalledWith(true);
    });

    it('should save current parts when switching machines', () => {
      component.selectMachine(mockMachines[0]);
      component.parts[0].spreadsheetData = [
        { partName: 'Part 1', partNumber: 'P1', quantity: '10' }
      ];

      component.selectMachine(mockMachines[1]);

      expect(component.machinePartsMap.has(mockMachines[0].id)).toBe(true);
      const savedParts = component.machinePartsMap.get(mockMachines[0].id)!;
      expect(savedParts[0].spreadsheetData.length).toBe(1);
    });

    it('should restore saved parts when returning to machine', () => {
      component.selectMachine(mockMachines[0]);
      component.parts[0].spreadsheetData = [
        { partName: 'Part 1', partNumber: 'P1', quantity: '10' }
      ];

      component.selectMachine(mockMachines[1]);
      component.selectMachine(mockMachines[0]);

      expect(component.parts[0].spreadsheetData.length).toBe(1);
      expect(component.parts[0].spreadsheetData[0].partName).toBe('Part 1');
    });

    it('should close details panel', () => {
      component.selectMachine(mockMachines[0]);
      component.closeDetails();

      expect(component.selectedMachine).toBeNull();
      expect(component.isOtherMachineSelected).toBe(false);
      expect(manualEntryStateServiceSpy.clearSelectedMachine).toHaveBeenCalled();
    });
  });

  describe('search functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(300);
    }));

    it('should call getMachines on init', () => {
      // The getMachines is called during init via setupSearch with startWith('')
      expect(machineServiceSpy.getMachines).toHaveBeenCalled();
    });

    it('should set up search control', () => {
      expect(component.searchControl).toBeDefined();
      expect(component.searchControl.value).toBe('');
    });

    it('should have searchMachines method available on service', () => {
      // Verify the service spy is set up correctly
      expect(machineServiceSpy.searchMachines).toBeDefined();
    });
  });

  describe('parts management', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(300);
    }));

    it('should add new part', () => {
      const initialLength = component.parts.length;
      component.addPart();

      expect(component.parts.length).toBe(initialLength + 1);
      expect(component.parts[initialLength].files).toEqual([]);
    });

    it('should handle spreadsheet data changes', () => {
      component.selectMachine(mockMachines[0]);
      const spreadsheetData: SpreadsheetRow[] = [
        { partName: 'Part 1', partNumber: 'P1', quantity: '5' }
      ];

      component.onSpreadsheetDataChanged(spreadsheetData, 0);

      expect(component.parts[0].spreadsheetData).toEqual(spreadsheetData);
    });

    it('should handle file changes', () => {
      const mockFile: UploadedFile = {
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
        file: new File([''], 'test.jpg'),
        status: 'success',
        progress: 100
      };

      component.onFilesChanged([mockFile], 0);

      expect(component.parts[0].files.length).toBe(1);
      expect(component.parts[0].files[0]).toEqual(mockFile);
    });
  });

  describe('form validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(300);
    }));

    it('should validate form with valid spreadsheet data', () => {
      component.parts[0].spreadsheetData = [
        { partName: 'Part 1', partNumber: 'P1', quantity: '10' }
      ];

      expect(component.isFormValid()).toBe(true);
    });

    it('should validate form with uploaded files', () => {
      component.parts[0].files = [{
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
        file: new File([''], 'test.jpg'),
        status: 'success',
        progress: 100
      }];

      expect(component.isFormValid()).toBe(true);
    });

    it('should invalidate empty form', () => {
      component.parts = [{
        id: '1',
        files: [],
        spreadsheetData: [],
        additionalNotes: '',
        data: { machineId: '' }
      }];

      expect(component.isFormValid()).toBe(false);
    });
  });

  describe('image preview', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(300);
    }));

    it('should check if file is image', () => {
      expect(component.isImageFile('test.jpg')).toBe(true);
      expect(component.isImageFile('test.png')).toBe(true);
      expect(component.isImageFile('test.pdf')).toBe(false);
      expect(component.isImageFile('test.xlsx')).toBe(false);
    });

    it('should open image preview', () => {
      const mockFile: UploadedFile = {
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
        file: new File([''], 'test.jpg'),
        status: 'success',
        progress: 100,
        previewUrl: 'blob:http://test.com/123'
      };

      component.onFilePreviewRequested(mockFile);

      expect(component.showImagePreview).toBe(true);
      expect(component.previewImageSrc).toBe(mockFile.previewUrl!);
    });

    it('should close image preview', () => {
      component.showImagePreview = true;
      component.closeImagePreview();

      expect(component.showImagePreview).toBe(false);
    });

    it('should not open preview for non-image files', () => {
      const mockFile: UploadedFile = {
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        file: new File([''], 'test.pdf'),
        status: 'success',
        progress: 100,
        previewUrl: 'blob:http://test.com/123'
      };

      component.onFilePreviewRequested(mockFile);

      expect(component.showImagePreview).toBe(false);
    });
  });

  describe('can deactivate guard', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(300);
    }));

    it('should allow deactivation with no data', () => {
      component.parts = [{
        id: '1',
        files: [],
        spreadsheetData: [],
        additionalNotes: '',
        data: { machineId: '' }
      }];

      expect(component.canDeactivate()).toBe(true);
    });

    it('should prevent deactivation with unsaved data', () => {
      component.parts[0].spreadsheetData = [
        { partName: 'Part 1', partNumber: 'P1', quantity: '10' }
      ];

      expect(component.canDeactivate()).toBe(false);
    });

    it('should prevent deactivation with uploaded files', () => {
      component.parts[0].files = [{
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
        file: new File([''], 'test.jpg'),
        status: 'success',
        progress: 100
      }];

      expect(component.canDeactivate()).toBe(false);
    });

    it('should return component name', () => {
      expect(component.getComponentName()).toBe('Use template');
    });
  });

  describe('utility methods', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(300);
    }));

    it('should count total parts', () => {
      component.selectMachine(mockMachines[0]);
      component.parts[0].spreadsheetData = [
        { partName: 'Part 1', partNumber: 'P1', quantity: '10' }
      ];

      expect(component.getTotalPartsCount()).toBe(1);
    });

    it('should count parts from multiple machines', () => {
      component.selectMachine(mockMachines[0]);
      component.parts[0].spreadsheetData = [
        { partName: 'Part 1', partNumber: 'P1', quantity: '10' }
      ];

      component.selectMachine(mockMachines[1]);
      component.parts[0].spreadsheetData = [
        { partName: 'Part 2', partNumber: 'P2', quantity: '5' }
      ];

      expect(component.getTotalPartsCount()).toBe(2);
    });

    it('should track by index', () => {
      expect(component.trackByIndex(0)).toBe(0);
      expect(component.trackByIndex(5)).toBe(5);
    });
  });

  describe('memory cleanup', () => {
    it('should revoke object URLs on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick(300);

      spyOn(URL, 'revokeObjectURL');

      component.parts[0].files = [{
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
        file: new File([''], 'test.jpg'),
        status: 'success',
        progress: 100,
        previewUrl: 'blob:http://test.com/123'
      }];

      component.ngOnDestroy();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://test.com/123');
    }));
  });

  describe('spreadsheet tab handling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(300);
    }));

    it('should change spreadsheet tab', () => {
      component.onSpreadsheetTabChanged('demo');

      expect(component.currentSpreadsheetTab).toBe('demo');
    });

    it('should change to client tab', () => {
      component.onSpreadsheetTabChanged('client');

      expect(component.currentSpreadsheetTab).toBe('client');
    });
  });

  describe('state restoration', () => {
    it('should restore selected machine on init', fakeAsync(() => {
      manualEntryStateServiceSpy.getSelectedMachine.and.returnValue(mockMachines[0]);
      manualEntryStateServiceSpy.getIsOtherMachineSelected.and.returnValue(false);

      fixture.detectChanges();
      tick(300);

      expect(component.selectedMachine).toEqual(mockMachines[0]);
    }));

    it('should restore "Other" machine selection', fakeAsync(() => {
      const otherMachine = {
        id: 'other',
        articleDescription: 'Other/Older (Not Listed)',
        machineType: []
      } as unknown as Machine;

      manualEntryStateServiceSpy.getSelectedMachine.and.returnValue(otherMachine);
      manualEntryStateServiceSpy.getIsOtherMachineSelected.and.returnValue(true);

      fixture.detectChanges();
      tick(300);

      expect(component.isOtherMachineSelected).toBe(true);
    }));
  });
});
