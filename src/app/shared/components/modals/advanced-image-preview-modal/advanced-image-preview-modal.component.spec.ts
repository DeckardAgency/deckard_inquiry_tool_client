import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AdvancedImagePreviewModalComponent } from './advanced-image-preview-modal.component';
import { CanvasDrawingService } from './services/canvas-drawing.service';
import { HistoryManagerService } from './services/history-manager.service';
import { LoggerService } from '@services/logger.service';
import { DrawingMode } from './components/drawing-toolbar.component';
import { CropSelection } from './components/crop-tool.component';
import { ElementRef } from '@angular/core';

describe('AdvancedImagePreviewModalComponent', () => {
  let component: AdvancedImagePreviewModalComponent;
  let fixture: ComponentFixture<AdvancedImagePreviewModalComponent>;
  let canvasDrawingServiceSpy: jasmine.SpyObj<CanvasDrawingService>;
  let historyManagerServiceSpy: jasmine.SpyObj<HistoryManagerService>;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(async () => {
    const canvasDrawingServiceSpyObj = jasmine.createSpyObj('CanvasDrawingService', [
      'setupCanvas',
      'setDrawingMode',
      'setColor',
      'getContext',
      'getCanvas',
      'startDrawing',
      'draw',
      'stopDrawing',
      'addText',
      'reset'
    ]);

    const historyManagerServiceSpyObj = jasmine.createSpyObj('HistoryManagerService', [
      'saveToHistory',
      'undo',
      'redo',
      'clear'
    ]);

    const loggerServiceSpyObj = jasmine.createSpyObj('LoggerService', ['createLogger']);
    loggerServiceSpyObj.createLogger.and.returnValue({
      debug: jasmine.createSpy('debug'),
      info: jasmine.createSpy('info'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error')
    });

    canvasDrawingServiceSpyObj.setupCanvas.and.returnValue(true);
    canvasDrawingServiceSpyObj.stopDrawing.and.returnValue(true);

    const mockCtx = {
      clearRect: jasmine.createSpy('clearRect')
    } as any;
    canvasDrawingServiceSpyObj.getContext.and.returnValue(mockCtx);

    const mockCanvas = document.createElement('canvas');
    canvasDrawingServiceSpyObj.getCanvas.and.returnValue(mockCanvas);

    await TestBed.configureTestingModule({
      imports: [AdvancedImagePreviewModalComponent],
      providers: [
        { provide: LoggerService, useValue: loggerServiceSpyObj }
      ]
    })
    .overrideComponent(AdvancedImagePreviewModalComponent, {
      set: {
        providers: [
          { provide: CanvasDrawingService, useValue: canvasDrawingServiceSpyObj },
          { provide: HistoryManagerService, useValue: historyManagerServiceSpyObj }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdvancedImagePreviewModalComponent);
    component = fixture.componentInstance;

    // Get services from component's injector since they're provided at component level
    canvasDrawingServiceSpy = canvasDrawingServiceSpyObj;
    historyManagerServiceSpy = historyManagerServiceSpyObj;
    loggerServiceSpy = loggerServiceSpyObj;

    // Mock ViewChild references
    component.previewImage = new ElementRef(document.createElement('img'));
    component.annotationCanvas = new ElementRef(document.createElement('canvas'));
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.imageSrc).toBe('');
      expect(component.imageAlt).toBe('Image preview');
      expect(component.imageFileName).toBe('image.jpg');
      expect(component.drawingMode).toBe(DrawingMode.None);
      expect(component.isAddingText).toBe(false);
      expect(component.isCropMode).toBe(false);
      expect(component.imageRotation).toBe(0);
    });

    it('should setup canvas on view init', fakeAsync(() => {
      fixture.detectChanges();
      tick(100);

      expect(canvasDrawingServiceSpy.setupCanvas).toHaveBeenCalled();
      expect(historyManagerServiceSpy.saveToHistory).toHaveBeenCalled();
    }));
  });

  describe('drawing mode changes', () => {
    it('should change drawing mode', () => {
      component.onDrawingModeChange(DrawingMode.Freehand);

      expect(component.drawingMode).toBe(DrawingMode.Freehand);
      expect(canvasDrawingServiceSpy.setDrawingMode).toHaveBeenCalledWith(DrawingMode.Freehand);
    });

    it('should disable crop mode when entering drawing mode', () => {
      component.isCropMode = true;
      component.onDrawingModeChange(DrawingMode.Freehand);

      expect(component.isCropMode).toBe(false);
    });

    it('should reset text input when switching from text mode', () => {
      component.isAddingText = true;
      component.drawingMode = DrawingMode.Text;

      component.onDrawingModeChange(DrawingMode.Freehand);

      expect(component.isAddingText).toBe(false);
    });

    it('should not reset text input when staying in text mode', () => {
      component.isAddingText = true;
      component.drawingMode = DrawingMode.Text;

      component.onDrawingModeChange(DrawingMode.Text);

      expect(component.isAddingText).toBe(true);
    });
  });

  describe('crop mode', () => {
    it('should toggle crop mode on', () => {
      component.isCropMode = false;
      component.onCropModeToggle();

      expect(component.isCropMode).toBe(true);
      expect(component.drawingMode).toBe(DrawingMode.None);
    });

    it('should toggle crop mode off', () => {
      component.isCropMode = true;
      component.onCropModeToggle();

      expect(component.isCropMode).toBe(false);
    });

    it('should reset crop tool when entering crop mode', () => {
      component.cropTool = jasmine.createSpyObj('CropToolComponent', ['reset']);
      component.onCropModeToggle();

      expect(component.cropTool.reset).toHaveBeenCalled();
    });

    it('should cancel crop mode', () => {
      component.isCropMode = true;
      component.onCropCancelled();

      expect(component.isCropMode).toBe(false);
    });
  });

  describe('image rotation', () => {
    it('should rotate image by 90 degrees', fakeAsync(() => {
      component.onRotateImage(90);
      tick(100);

      expect(component.imageRotation).toBe(90);
      expect(canvasDrawingServiceSpy.setupCanvas).toHaveBeenCalled();
    }));

    it('should rotate image by -90 degrees', fakeAsync(() => {
      component.onRotateImage(-90);
      tick(100);

      // JavaScript modulo with negative numbers: (0 + -90) % 360 = -90
      expect(component.imageRotation).toBe(-90);
    }));

    it('should wrap rotation at 360 degrees', fakeAsync(() => {
      component.onRotateImage(270);
      tick(100);
      component.onRotateImage(90);
      tick(100);

      expect(component.imageRotation).toBe(0);
    }));

    it('should handle multiple rotations', fakeAsync(() => {
      component.onRotateImage(90);
      tick(100);
      component.onRotateImage(90);
      tick(100);
      component.onRotateImage(90);
      tick(100);

      expect(component.imageRotation).toBe(270);
    }));
  });

  describe('color and font size', () => {
    it('should change color', () => {
      component.onColorChange('#ff0000');

      expect(component.currentColor).toBe('#ff0000');
      expect(canvasDrawingServiceSpy.setColor).toHaveBeenCalledWith('#ff0000');
    });

    it('should change font size', () => {
      component.onFontSizeChange(32);

      expect(component.fontSize).toBe(32);
    });
  });

  describe('undo and redo', () => {
    it('should perform undo', () => {
      component.onUndo();

      expect(canvasDrawingServiceSpy.getContext).toHaveBeenCalled();
      expect(historyManagerServiceSpy.undo).toHaveBeenCalled();
    });

    it('should perform redo', () => {
      component.onRedo();

      expect(canvasDrawingServiceSpy.getContext).toHaveBeenCalled();
      expect(historyManagerServiceSpy.redo).toHaveBeenCalled();
    });
  });

  describe('reset functionality', () => {
    it('should reset all state', () => {
      component.cropTool = jasmine.createSpyObj('CropToolComponent', ['reset']);
      component.imageRotation = 90;
      component.isCropMode = true;
      component.isAddingText = true;
      component.currentText = 'Test';

      component.onReset();

      expect(canvasDrawingServiceSpy.reset).toHaveBeenCalled();
      expect(historyManagerServiceSpy.clear).toHaveBeenCalled();
      expect(component.imageRotation).toBe(0);
      expect(component.isCropMode).toBe(false);
      expect(component.isAddingText).toBe(false);
      expect(component.currentText).toBe('');
      expect(component.cropTool.reset).toHaveBeenCalled();
    });
  });

  describe('canvas drawing', () => {
    beforeEach(() => {
      component.annotationCanvas.nativeElement.getBoundingClientRect = jasmine.createSpy().and.returnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600
      });
    });

    it('should start drawing on mouse down', () => {
      component.drawingMode = DrawingMode.Freehand;
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });

      component.startDrawing(event);

      expect(canvasDrawingServiceSpy.startDrawing).toHaveBeenCalledWith(100, 100);
    });

    it('should not start drawing in None mode', () => {
      component.drawingMode = DrawingMode.None;
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });

      component.startDrawing(event);

      expect(canvasDrawingServiceSpy.startDrawing).not.toHaveBeenCalled();
    });

    it('should handle mouse move while drawing', () => {
      const event = new MouseEvent('mousemove', { clientX: 150, clientY: 150 });

      component.draw(event);

      expect(canvasDrawingServiceSpy.draw).toHaveBeenCalledWith(150, 150);
    });

    it('should stop drawing and save to history', () => {
      component.stopDrawing();

      expect(canvasDrawingServiceSpy.stopDrawing).toHaveBeenCalled();
      expect(historyManagerServiceSpy.saveToHistory).toHaveBeenCalled();
    });

    it('should not save to history if no drawing occurred', () => {
      canvasDrawingServiceSpy.stopDrawing.and.returnValue(false);

      component.stopDrawing();

      expect(historyManagerServiceSpy.saveToHistory).not.toHaveBeenCalled();
    });
  });

  describe('text annotation', () => {
    beforeEach(() => {
      component.annotationCanvas.nativeElement.getBoundingClientRect = jasmine.createSpy().and.returnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600
      });
      component.textInput = new ElementRef(document.createElement('input'));
    });

    it('should start text input mode on click', fakeAsync(() => {
      component.drawingMode = DrawingMode.Text;
      const event = new MouseEvent('mousedown', { clientX: 200, clientY: 200 });

      component.startDrawing(event);
      tick(10);

      expect(component.isAddingText).toBe(true);
      expect(component.textPosition).toEqual({ x: 200, y: 200 });
    }));

    it('should confirm text input and add to canvas', () => {
      component.currentText = 'Test Annotation';
      component.textPosition = { x: 100, y: 100 };
      component.fontSize = 24;
      canvasDrawingServiceSpy.addText.and.returnValue(true);

      component.confirmTextInput();

      expect(canvasDrawingServiceSpy.addText).toHaveBeenCalledWith(
        'Test Annotation',
        100,
        100,
        24
      );
      expect(component.currentText).toBe('');
      expect(component.isAddingText).toBe(false);
    });

    it('should not save to history if text add fails', () => {
      component.currentText = 'Test';
      canvasDrawingServiceSpy.addText.and.returnValue(false);
      historyManagerServiceSpy.saveToHistory.calls.reset();

      component.confirmTextInput();

      expect(historyManagerServiceSpy.saveToHistory).not.toHaveBeenCalled();
    });
  });

  describe('modal actions', () => {
    it('should close modal on handleClose', (done) => {
      component.closeModal.subscribe(() => {
        done();
      });

      component.handleClose();
    });

    it('should close modal on discard changes', (done) => {
      component.closeModal.subscribe(() => {
        done();
      });

      component.discardChanges();
    });

    it('should save changes and close modal', (done) => {
      const mockImage = component.previewImage.nativeElement;

      Object.defineProperty(mockImage, 'naturalWidth', {
        writable: true,
        value: 800
      });
      Object.defineProperty(mockImage, 'naturalHeight', {
        writable: true,
        value: 600
      });

      component.closeModal.subscribe(() => {
        done();
      });

      component.saveChanges();
    });

    it('should close modal if canvas not available on save', (done) => {
      component.annotationCanvas = null as any;

      component.closeModal.subscribe(() => {
        done();
      });

      component.saveChanges();
    });
  });

  describe('crop application', () => {
    it('should handle crop applied event', () => {
      const selection: CropSelection = {
        startX: 100,
        startY: 100,
        endX: 300,
        endY: 300
      };

      spyOn<any>(component, 'applyCrop');

      component.onCropApplied(selection);

      expect(component['applyCrop']).toHaveBeenCalledWith(selection);
    });
  });

  describe('canvas setup', () => {
    it('should setup canvas with valid elements', () => {
      component.setupCanvas();

      expect(canvasDrawingServiceSpy.setupCanvas).toHaveBeenCalled();
      expect(historyManagerServiceSpy.saveToHistory).toHaveBeenCalled();
    });

    it('should handle setup failure', () => {
      canvasDrawingServiceSpy.setupCanvas.and.returnValue(false);
      historyManagerServiceSpy.saveToHistory.calls.reset();

      component.setupCanvas();

      expect(historyManagerServiceSpy.saveToHistory).not.toHaveBeenCalled();
    });

    it('should setup canvas on image load', () => {
      spyOn(component, 'setupCanvas');

      component.onImageLoad();

      expect(component.setupCanvas).toHaveBeenCalled();
    });
  });

  describe('input/output properties', () => {
    it('should accept imageSrc input', () => {
      component.imageSrc = 'test.jpg';
      expect(component.imageSrc).toBe('test.jpg');
    });

    it('should accept imageAlt input', () => {
      component.imageAlt = 'Test Alt';
      expect(component.imageAlt).toBe('Test Alt');
    });

    it('should accept imageFileName input', () => {
      component.imageFileName = 'test.png';
      expect(component.imageFileName).toBe('test.png');
    });

    it('should emit closeModal', (done) => {
      component.closeModal.subscribe(() => {
        done();
      });

      component.handleClose();
    });

    it('should emit saveImage with data URL', (done) => {
      const mockImage = component.previewImage.nativeElement;

      Object.defineProperty(mockImage, 'naturalWidth', {
        writable: true,
        value: 800
      });
      Object.defineProperty(mockImage, 'naturalHeight', {
        writable: true,
        value: 600
      });

      component.saveImage.subscribe((dataUrl: string) => {
        expect(dataUrl).toContain('data:image/jpeg');
        done();
      });

      component.saveChanges();
    });
  });

  describe('crop mode interactions', () => {
    beforeEach(() => {
      component.cropTool = jasmine.createSpyObj('CropToolComponent', [
        'reset',
        'onMouseDown',
        'onMouseMove'
      ]);
      component.isCropMode = true;
      component.annotationCanvas.nativeElement.getBoundingClientRect = jasmine.createSpy().and.returnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600
      });
    });

    it('should delegate mouse down to crop tool in crop mode', () => {
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });

      component.startDrawing(event);

      expect(component.cropTool.onMouseDown).toHaveBeenCalled();
      expect(canvasDrawingServiceSpy.startDrawing).not.toHaveBeenCalled();
    });

    it('should delegate mouse move to crop tool in crop mode', () => {
      const event = new MouseEvent('mousemove', { clientX: 150, clientY: 150 });

      component.draw(event);

      expect(component.cropTool.onMouseMove).toHaveBeenCalled();
      expect(canvasDrawingServiceSpy.draw).not.toHaveBeenCalled();
    });
  });

  describe('Math utility', () => {
    it('should expose Math object for template use', () => {
      expect(component.Math).toBe(Math);
    });
  });
});
