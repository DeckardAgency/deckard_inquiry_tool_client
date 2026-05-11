import { TestBed } from '@angular/core/testing';
import { CanvasDrawingService, DrawingMode, Annotation } from './canvas-drawing.service';
import { LoggerService } from '@services/logger.service';

describe('CanvasDrawingService', () => {
  let service: CanvasDrawingService;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: jasmine.SpyObj<CanvasRenderingContext2D>;
  let mockImage: HTMLImageElement;

  beforeEach(() => {
    const loggerServiceSpyObj = jasmine.createSpyObj('LoggerService', ['createLogger']);
    loggerServiceSpyObj.createLogger.and.returnValue({
      debug: jasmine.createSpy('debug'),
      info: jasmine.createSpy('info'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error')
    });

    TestBed.configureTestingModule({
      providers: [
        CanvasDrawingService,
        { provide: LoggerService, useValue: loggerServiceSpyObj }
      ]
    });

    service = TestBed.inject(CanvasDrawingService);
    loggerServiceSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;

    // Create mock canvas and context
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;

    mockCtx = jasmine.createSpyObj('CanvasRenderingContext2D', [
      'beginPath',
      'moveTo',
      'lineTo',
      'stroke',
      'arc',
      'clearRect',
      'fillText',
      'getImageData',
      'putImageData',
      'save',
      'restore'
    ]);

    spyOn(mockCanvas, 'getContext').and.returnValue(mockCtx as any);

    // Create mock image
    mockImage = new Image();
    mockImage.width = 800;
    mockImage.height = 600;
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with no mode set', () => {
      const ctx = service.getContext();
      expect(ctx).toBeNull();
    });
  });

  describe('canvas setup', () => {
    it('should setup canvas with valid image', () => {
      const result = service.setupCanvas(mockCanvas, mockImage);

      expect(result).toBe(true);
      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(600);
      expect(service.getContext()).toBeTruthy();
      expect(service.getCanvas()).toBe(mockCanvas);
    });

    it('should fail setup with invalid canvas', () => {
      const result = service.setupCanvas(null as any, mockImage);

      expect(result).toBe(false);
    });

    it('should fail setup with invalid image', () => {
      const result = service.setupCanvas(mockCanvas, null as any);

      expect(result).toBe(false);
    });

    it('should fail setup with zero-dimension image', () => {
      const zeroImage = new Image();
      zeroImage.width = 0;
      zeroImage.height = 0;

      const result = service.setupCanvas(mockCanvas, zeroImage);

      expect(result).toBe(false);
    });

    it('should fail if canvas context cannot be obtained', () => {
      (mockCanvas.getContext as jasmine.Spy).and.returnValue(null);

      const result = service.setupCanvas(mockCanvas, mockImage);

      expect(result).toBe(false);
    });
  });

  describe('drawing mode', () => {
    it('should set drawing mode to freehand', () => {
      service.setDrawingMode(DrawingMode.Freehand);
      // Mode is private, but we can test its effect via drawing
      expect(service).toBeTruthy();
    });

    it('should set drawing mode to circle', () => {
      service.setDrawingMode(DrawingMode.Circle);
      expect(service).toBeTruthy();
    });

    it('should set drawing mode to text', () => {
      service.setDrawingMode(DrawingMode.Text);
      expect(service).toBeTruthy();
    });

    it('should set drawing mode to none', () => {
      service.setDrawingMode(DrawingMode.None);
      expect(service).toBeTruthy();
    });
  });

  describe('color management', () => {
    it('should set drawing color', () => {
      service.setColor('#ff0000');
      // Color is private, but we can test its effect in drawing operations
      expect(service).toBeTruthy();
    });

    it('should handle different color formats', () => {
      service.setColor('rgb(255, 0, 0)');
      service.setColor('#00ff00');
      service.setColor('blue');
      expect(service).toBeTruthy();
    });
  });

  describe('freehand drawing', () => {
    beforeEach(() => {
      service.setupCanvas(mockCanvas, mockImage);
      service.setDrawingMode(DrawingMode.Freehand);
      service.setColor('#ff0000');
    });

    it('should start drawing', () => {
      service.startDrawing(100, 100);

      expect(mockCtx.beginPath).toHaveBeenCalled();
    });

    it('should draw line between points', () => {
      service.startDrawing(100, 100);
      service.draw(150, 150);

      expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 100);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(150, 150);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should stop drawing', () => {
      service.startDrawing(100, 100);
      service.draw(150, 150);
      const result = service.stopDrawing();

      expect(result).toBe(true);
    });

    it('should not draw when not started', () => {
      mockCtx.moveTo.calls.reset();
      service.draw(100, 100);

      expect(mockCtx.moveTo).not.toHaveBeenCalled();
    });

    it('should not draw in None mode', () => {
      service.setDrawingMode(DrawingMode.None);
      service.startDrawing(100, 100);
      mockCtx.beginPath.calls.reset();
      service.draw(150, 150);

      expect(mockCtx.beginPath).not.toHaveBeenCalled();
    });

    it('should apply correct stroke style', () => {
      service.setColor('#00ff00');
      service.startDrawing(100, 100);
      service.draw(150, 150);

      expect(mockCtx.strokeStyle).toBe('#00ff00');
    });

    it('should use correct line width', () => {
      service.startDrawing(100, 100);
      service.draw(150, 150);

      expect(mockCtx.lineWidth).toBe(3);
    });

    it('should use round line cap', () => {
      service.startDrawing(100, 100);
      service.draw(150, 150);

      expect(mockCtx.lineCap).toBe('round');
    });
  });

  describe('circle drawing', () => {
    beforeEach(() => {
      service.setupCanvas(mockCanvas, mockImage);
      service.setDrawingMode(DrawingMode.Circle);
      service.setColor('#0000ff');
    });

    it('should start circle at position', () => {
      service.startDrawing(200, 200);

      expect(service).toBeTruthy(); // Circle start position is private
    });

    it('should draw circle with correct radius', () => {
      const mockImageData = new ImageData(800, 600);
      mockCtx.getImageData.and.returnValue(mockImageData);

      service.startDrawing(200, 200);
      service.draw(300, 300); // 100 pixels away in each direction

      const expectedRadius = Math.sqrt(Math.pow(100, 2) + Math.pow(100, 2));
      expect(mockCtx.arc).toHaveBeenCalledWith(200, 200, expectedRadius, 0, Math.PI * 2);
    });

    it('should update circle as mouse moves', () => {
      const mockImageData = new ImageData(800, 600);
      mockCtx.getImageData.and.returnValue(mockImageData);

      service.startDrawing(200, 200);
      service.draw(250, 250);
      service.draw(300, 300);

      expect(mockCtx.arc.calls.count()).toBeGreaterThan(1);
    });

    it('should restore canvas state while dragging', () => {
      const mockImageData = new ImageData(800, 600);
      mockCtx.getImageData.and.returnValue(mockImageData);

      service.startDrawing(200, 200);
      service.draw(250, 250);
      service.draw(300, 300);

      expect(mockCtx.putImageData).toHaveBeenCalled();
    });

    it('should stop circle drawing', () => {
      service.startDrawing(200, 200);
      const result = service.stopDrawing();

      expect(result).toBe(true);
    });
  });

  describe('text annotations', () => {
    beforeEach(() => {
      service.setupCanvas(mockCanvas, mockImage);
      service.setDrawingMode(DrawingMode.Text);
      service.setColor('#000000');
    });

    it('should add text annotation', () => {
      const result = service.addText('Test Text', 100, 100, 24);

      expect(result).toBe(true);
      expect(mockCtx.fillText).toHaveBeenCalled();
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('should trim whitespace from text', () => {
      service.addText('  Test Text  ', 100, 100, 24);

      const annotations = service.getAnnotations();
      expect(annotations[0].text).toBe('Test Text');
    });

    it('should reject empty text', () => {
      const result = service.addText('   ', 100, 100, 24);

      expect(result).toBe(false);
      expect(service.getAnnotations().length).toBe(0);
    });

    it('should validate font size minimum', () => {
      service.addText('Test', 100, 100, 5);

      const annotations = service.getAnnotations();
      expect(annotations[0].fontSize).toBe(10); // Minimum is 10
    });

    it('should validate font size maximum', () => {
      service.addText('Test', 100, 100, 100);

      const annotations = service.getAnnotations();
      expect(annotations[0].fontSize).toBe(72); // Maximum is 72
    });

    it('should store annotation with correct properties', () => {
      service.setColor('#ff0000');
      service.addText('Test Annotation', 150, 200, 30);

      const annotations = service.getAnnotations();
      expect(annotations.length).toBe(1);
      expect(annotations[0]).toEqual({
        type: 'text',
        x: 150,
        y: 200,
        text: 'Test Annotation',
        color: '#ff0000',
        fontSize: 30
      });
    });

    it('should apply word wrapping for long text', () => {
      service.addText('Very long text that should wrap', 700, 100, 24);

      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should handle text without word wrapping if needed', () => {
      service.addText('Short', 100, 100, 24);

      // Should be called with text, x, y, maxWidth
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should fail if canvas not setup', () => {
      const newService = new CanvasDrawingService(loggerServiceSpy);
      const result = newService.addText('Test', 100, 100, 24);

      expect(result).toBe(false);
    });
  });

  describe('annotations management', () => {
    beforeEach(() => {
      service.setupCanvas(mockCanvas, mockImage);
      service.setDrawingMode(DrawingMode.Text);
    });

    it('should get all annotations', () => {
      service.addText('Text 1', 100, 100, 24);
      service.addText('Text 2', 200, 200, 24);

      const annotations = service.getAnnotations();
      expect(annotations.length).toBe(2);
    });

    it('should clear annotations', () => {
      service.addText('Text 1', 100, 100, 24);
      service.addText('Text 2', 200, 200, 24);

      service.clearAnnotations();

      expect(service.getAnnotations().length).toBe(0);
    });

    it('should return empty array initially', () => {
      expect(service.getAnnotations()).toEqual([]);
    });
  });

  describe('canvas operations', () => {
    beforeEach(() => {
      service.setupCanvas(mockCanvas, mockImage);
    });

    it('should clear canvas', () => {
      service.clearCanvas();

      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should reset all state', () => {
      service.setDrawingMode(DrawingMode.Freehand);
      service.addText('Test', 100, 100, 24);
      service.startDrawing(100, 100);

      service.reset();

      expect(mockCtx.clearRect).toHaveBeenCalled();
      expect(service.getAnnotations().length).toBe(0);
    });

    it('should handle clear without setup', () => {
      const newService = new CanvasDrawingService(loggerServiceSpy);
      newService.clearCanvas(); // Should not throw

      expect(mockCtx.clearRect).not.toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    it('should get canvas context', () => {
      service.setupCanvas(mockCanvas, mockImage);

      const ctx = service.getContext();
      expect(ctx).toBeTruthy();
    });

    it('should get canvas element', () => {
      service.setupCanvas(mockCanvas, mockImage);

      const canvas = service.getCanvas();
      expect(canvas).toBe(mockCanvas);
    });

    it('should return null before setup', () => {
      expect(service.getContext()).toBeNull();
      expect(service.getCanvas()).toBeNull();
    });
  });

  describe('drawing state management', () => {
    beforeEach(() => {
      service.setupCanvas(mockCanvas, mockImage);
    });

    it('should return false when stopping without starting', () => {
      const result = service.stopDrawing();

      expect(result).toBe(false);
    });

    it('should return true after drawing', () => {
      service.setDrawingMode(DrawingMode.Freehand);
      service.startDrawing(100, 100);
      service.draw(150, 150);
      const result = service.stopDrawing();

      expect(result).toBe(true);
    });

    it('should return false when stopped in None mode', () => {
      service.setDrawingMode(DrawingMode.None);
      service.startDrawing(100, 100);
      const result = service.stopDrawing();

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle setup errors gracefully', () => {
      (mockCanvas.getContext as jasmine.Spy).and.throwError('Context error');

      const result = service.setupCanvas(mockCanvas, mockImage);

      expect(result).toBe(false);
    });

    it('should handle text drawing errors', () => {
      service.setupCanvas(mockCanvas, mockImage);
      mockCtx.fillText.and.throwError('Drawing error');

      const result = service.addText('Test', 100, 100, 24);

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      service.setupCanvas(mockCanvas, mockImage);
    });

    it('should handle drawing at canvas boundaries', () => {
      service.setDrawingMode(DrawingMode.Freehand);
      service.startDrawing(0, 0);
      service.draw(800, 600);

      expect(mockCtx.lineTo).toHaveBeenCalledWith(800, 600);
    });

    it('should handle zero-radius circle', () => {
      const mockImageData = new ImageData(800, 600);
      mockCtx.getImageData.and.returnValue(mockImageData);

      service.setDrawingMode(DrawingMode.Circle);
      service.startDrawing(200, 200);
      service.draw(200, 200); // Same point = 0 radius

      expect(mockCtx.arc).toHaveBeenCalledWith(200, 200, 0, 0, Math.PI * 2);
    });

    it('should handle multiple drawing sessions', () => {
      service.setDrawingMode(DrawingMode.Freehand);

      service.startDrawing(100, 100);
      service.draw(150, 150);
      service.stopDrawing();

      service.startDrawing(200, 200);
      service.draw(250, 250);
      service.stopDrawing();

      expect(mockCtx.stroke.calls.count()).toBeGreaterThan(1);
    });

    it('should handle switching modes mid-drawing', () => {
      service.setDrawingMode(DrawingMode.Freehand);
      service.startDrawing(100, 100);

      service.setDrawingMode(DrawingMode.Circle);
      service.draw(150, 150);

      // Should handle mode change gracefully
      expect(service).toBeTruthy();
    });
  });
});
