import { TestBed } from '@angular/core/testing';
import { ManualCartService } from './manual-cart.service';
import { InquiryService } from '@services/http/inquiry.service';
import { AuthService } from '@core/auth/auth.service';
import { LoggerService } from '@services/logger.service';
import { ManualCartItem } from '@core/models';
import { PLATFORM_ID } from '@angular/core';
import { of, throwError } from 'rxjs';

describe('ManualCartService', () => {
  let service: ManualCartService;
  let inquiryServiceSpy: jasmine.SpyObj<InquiryService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['ROLE_USER']
  };

  const mockCartItem: ManualCartItem = {
    id: 'item-1',
    machineId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    machineName: 'Test Machine',
    partData: {
      partName: 'Test Part',
      partNumber: 'PART-001',
      shortDescription: 'Test Description',
      additionalNotes: 'Test Notes',
      mediaItems: []
    },
    files: []
  };

  const mockCartItemWithMedia: ManualCartItem = {
    id: 'item-2',
    machineId: 'a1b2c3d4-1234-5678-90ab-cdef12345678',
    machineName: 'Test Machine 2',
    partData: {
      partName: 'Part with Media',
      partNumber: 'PART-002',
      shortDescription: 'Test',
      additionalNotes: '',
      mediaItems: [
        { '@id': '/api/v1/media_items/media-1', '@type': 'MediaItem', id: 'media-1', filename: 'image.jpg', mimeType: 'image/jpeg', filePath: '/uploads/image.jpg' },
        { '@id': '/api/v1/media_items/media-2', '@type': 'MediaItem', id: 'media-2', filename: 'doc.pdf', mimeType: 'application/pdf', filePath: '/uploads/doc.pdf' }
      ]
    },
    files: []
  };

  beforeEach(() => {
    const inquiryServiceSpyObj = jasmine.createSpyObj('InquiryService', ['saveDraft', 'createInquiry']);
    const authServiceSpyObj = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const loggerServiceSpyObj = jasmine.createSpyObj('LoggerService', ['createLogger']);

    loggerServiceSpyObj.createLogger.and.returnValue({
      debug: jasmine.createSpy('debug'),
      info: jasmine.createSpy('info'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error')
    });

    TestBed.configureTestingModule({
      providers: [
        ManualCartService,
        { provide: InquiryService, useValue: inquiryServiceSpyObj },
        { provide: AuthService, useValue: authServiceSpyObj },
        { provide: LoggerService, useValue: loggerServiceSpyObj },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(ManualCartService);
    inquiryServiceSpy = TestBed.inject(InquiryService) as jasmine.SpyObj<InquiryService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    loggerServiceSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;

    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty cart', (done) => {
      service.getCartItems().subscribe(items => {
        expect(items).toEqual([]);
        done();
      });
    });

    it('should load cart from localStorage on init', () => {
      const savedItems: ManualCartItem[] = [mockCartItem];
      localStorage.setItem('manualCart', JSON.stringify(savedItems));

      const newService = new ManualCartService(
        'browser',
        inquiryServiceSpy,
        authServiceSpy,
        loggerServiceSpy
      );

      newService.getCartItems().subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].partData.partName).toBe('Test Part');
      });
    });
  });

  describe('cart panel state', () => {
    it('should open cart panel', (done) => {
      service.open();

      service.isOpen$.subscribe(isOpen => {
        expect(isOpen).toBe(true);
        done();
      });
    });

    it('should close cart panel', (done) => {
      service.open();
      service.close();

      service.isOpen$.subscribe(isOpen => {
        expect(isOpen).toBe(false);
        done();
      });
    });

    it('should toggle cart panel visibility', (done) => {
      service.toggle();

      service.isOpen$.subscribe(isOpen => {
        expect(isOpen).toBe(true);
        done();
      });
    });

    it('should hide notification when opening panel', (done) => {
      service.showNotification('Test message');
      service.open();

      service.notificationVisible$.subscribe(visible => {
        expect(visible).toBe(false);
        done();
      });
    });
  });

  describe('notification system', () => {
    it('should show notification with message and type', (done) => {
      service.showNotification('Success message', 'success');

      service.notificationMessage$.subscribe(message => {
        expect(message).toBe('Success message');
      });

      service.notificationType$.subscribe(type => {
        expect(type).toBe('success');
        done();
      });
    });

    it('should hide notification', (done) => {
      service.showNotification('Test');
      service.hideNotification();

      service.notificationVisible$.subscribe(visible => {
        expect(visible).toBe(false);
        done();
      });
    });
  });

  describe('cart manipulation', () => {
    it('should add items to cart', (done) => {
      service.addToCart([mockCartItem]);

      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0]).toEqual(mockCartItem);
        done();
      });
    });

    it('should add items silently without opening panel', (done) => {
      service.addToCartSilently([mockCartItem]);

      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(1);
      });

      service.isOpen$.subscribe(isOpen => {
        expect(isOpen).toBe(false);
        done();
      });
    });

    it('should save cart to localStorage', () => {
      service.addToCart([mockCartItem]);

      const saved = localStorage.getItem('manualCart');
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed.length).toBe(1);
    });

    it('should remove item from cart', (done) => {
      service.addToCart([mockCartItem, mockCartItemWithMedia]);
      service.removeFromCart(0);

      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].partData.partName).toBe('Part with Media');
        done();
      });
    });

    it('should show notification when removing item', (done) => {
      service.addToCart([mockCartItem]);
      service.removeFromCart(0);

      service.notificationMessage$.subscribe(message => {
        expect(message).toContain('Test Part');
        expect(message).toContain('removed');
        done();
      });
    });

    it('should clear all cart items', (done) => {
      service.addToCart([mockCartItem, mockCartItemWithMedia]);
      service.clearCart();

      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(0);
        done();
      });
    });

    it('should remove cart from localStorage when cleared', () => {
      service.addToCart([mockCartItem]);
      service.clearCart();

      const saved = localStorage.getItem('manualCart');
      expect(saved).toBeNull();
    });
  });

  describe('cart observables', () => {
    it('should return cart count', (done) => {
      service.addToCart([mockCartItem, mockCartItemWithMedia]);

      service.getCartCount().subscribe(count => {
        expect(count).toBe(2);
        done();
      });
    });

    it('should provide cartItems$ convenience getter', (done) => {
      service.addToCart([mockCartItem]);

      service.cartItems$.subscribe(items => {
        expect(items.length).toBe(1);
        done();
      });
    });
  });

  describe('saveDraft', () => {
    beforeEach(() => {
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
    });

    it('should save draft successfully', (done) => {
      const mockResponse = {
        '@id': '/api/v1/inquiries/1',
        '@type': 'Inquiry',
        id: '1',
        inquiryNumber: 'INQ-001',
        status: 'draft',
        isDraft: true
      } as any;

      inquiryServiceSpy.saveDraft.and.returnValue(of(mockResponse));

      service.saveDraft([mockCartItem], 'REF-123').subscribe({
        next: (response) => {
          expect(response.inquiryNumber).toBe('INQ-001');
          done();
        }
      });

      expect(inquiryServiceSpy.saveDraft).toHaveBeenCalled();
    });

    it('should throw error if user ID not available', () => {
      authServiceSpy.getCurrentUser.and.returnValue({ id: '', email: 'test@test.com' } as any);

      expect(() => {
        service.saveDraft([mockCartItem]).subscribe();
      }).toThrow();
    });

    it('should handle save draft error', (done) => {
      inquiryServiceSpy.saveDraft.and.returnValue(
        throwError(() => ({ error: { message: 'Save failed' } }))
      );

      service.saveDraft([mockCartItem]).subscribe({
        error: (error) => {
          expect(error.error.message).toBe('Save failed');
          done();
        }
      });
    });

    it('should show success notification after saving draft', (done) => {
      const mockResponse = {
        '@id': '/api/v1/inquiries/1',
        id: '1',
        inquiryNumber: 'INQ-001',
        status: 'draft'
      } as any;

      inquiryServiceSpy.saveDraft.and.returnValue(of(mockResponse));

      service.saveDraft([mockCartItem]).subscribe(() => {
        service.notificationMessage$.subscribe(message => {
          expect(message).toContain('INQ-001');
          done();
        });
      });
    });
  });

  describe('submitInquiry', () => {
    beforeEach(() => {
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
    });

    it('should submit inquiry successfully', (done) => {
      const mockResponse = {
        '@id': '/api/v1/inquiries/2',
        id: '2',
        inquiryNumber: 'INQ-002',
        status: 'submitted',
        isDraft: false
      } as any;

      inquiryServiceSpy.createInquiry.and.returnValue(of(mockResponse));

      service.submitInquiry([mockCartItem], 'REF-456').subscribe({
        next: (response) => {
          expect(response.status).toBe('submitted');
          done();
        }
      });

      expect(inquiryServiceSpy.createInquiry).toHaveBeenCalled();
    });

    it('should clear cart after successful submission', (done) => {
      const mockResponse = {
        '@id': '/api/v1/inquiries/2',
        id: '2',
        inquiryNumber: 'INQ-002',
        status: 'submitted'
      } as any;

      inquiryServiceSpy.createInquiry.and.returnValue(of(mockResponse));
      service.addToCart([mockCartItem]);

      service.submitInquiry([mockCartItem]).subscribe(() => {
        service.getCartItems().subscribe(items => {
          expect(items.length).toBe(0);
          done();
        });
      });
    });

    it('should handle submission error', (done) => {
      inquiryServiceSpy.createInquiry.and.returnValue(
        throwError(() => ({ error: { message: 'Submit failed' } }))
      );

      service.submitInquiry([mockCartItem]).subscribe({
        error: (error) => {
          expect(error.error.message).toBe('Submit failed');
          done();
        }
      });
    });
  });

  describe('machine ID validation', () => {
    it('should handle valid UUID machine IDs', (done) => {
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      inquiryServiceSpy.createInquiry.and.returnValue(
        of({ id: '1', inquiryNumber: 'INQ-001', status: 'submitted' } as any)
      );

      service.submitInquiry([mockCartItem]).subscribe(() => {
        const call = inquiryServiceSpy.createInquiry.calls.mostRecent();
        const request = call.args[0];

        expect(request.machines[0].machine).toBe('/api/v1/machines/f47ac10b-58cc-4372-a567-0e02b2c3d479');
        expect(request.machines[0].customMachineId).toBeNull();
        done();
      });
    });

    it('should handle custom machine IDs (Other/Older machines)', (done) => {
      const customMachineItem: ManualCartItem = {
        id: 'item-3',
        machineId: 'CUSTOM-999',
        machineName: 'Custom Machine',
        partData: {
          partName: 'Custom Part',
          partNumber: 'PART-999',
          shortDescription: 'Test',
          additionalNotes: '',
          mediaItems: []
        },
        files: []
      };

      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      inquiryServiceSpy.createInquiry.and.returnValue(
        of({ id: '1', inquiryNumber: 'INQ-001', status: 'submitted' } as any)
      );

      service.submitInquiry([customMachineItem]).subscribe(() => {
        const call = inquiryServiceSpy.createInquiry.calls.mostRecent();
        const request = call.args[0];

        expect(request.machines[0].machine).toBeNull();
        expect(request.machines[0].customMachineId).toBe('CUSTOM-999');
        done();
      });
    });

    it('should group items by machine', (done) => {
      const item1 = { ...mockCartItem };
      const item2 = { ...mockCartItem, partData: { ...mockCartItem.partData, partName: 'Part 2' } };

      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      inquiryServiceSpy.createInquiry.and.returnValue(
        of({ id: '1', inquiryNumber: 'INQ-001', status: 'submitted' } as any)
      );

      service.submitInquiry([item1, item2]).subscribe(() => {
        const call = inquiryServiceSpy.createInquiry.calls.mostRecent();
        const request = call.args[0];

        expect(request.machines.length).toBe(1);
        expect(request.machines[0].products.length).toBe(2);
        done();
      });
    });

    it('should collect media items at machine level', (done) => {
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      inquiryServiceSpy.createInquiry.and.returnValue(
        of({ id: '1', inquiryNumber: 'INQ-001', status: 'submitted' } as any)
      );

      service.submitInquiry([mockCartItemWithMedia]).subscribe(() => {
        const call = inquiryServiceSpy.createInquiry.calls.mostRecent();
        const request = call.args[0];

        expect(request.machines[0].mediaItems).toContain('/api/v1/media_items/media-1');
        expect(request.machines[0].mediaItems).toContain('/api/v1/media_items/media-2');
        done();
      });
    });
  });

  describe('loading state', () => {
    it('should set loading state during save draft', (done) => {
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      inquiryServiceSpy.saveDraft.and.returnValue(
        of({ id: '1', inquiryNumber: 'INQ-001', status: 'draft' } as any)
      );

      const loadingStates: boolean[] = [];
      const subscription = service.loading$.subscribe(loading => {
        loadingStates.push(loading);
      });

      service.saveDraft([mockCartItem]).subscribe({
        complete: () => {
          subscription.unsubscribe();
          // Expect: initial false -> true (loading) -> false (complete)
          expect(loadingStates).toContain(true);
          expect(loadingStates[loadingStates.length - 1]).toBe(false);
          done();
        }
      });
    });

    it('should set loading state during submit inquiry', (done) => {
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      inquiryServiceSpy.createInquiry.and.returnValue(
        of({ id: '1', inquiryNumber: 'INQ-001', status: 'submitted' } as any)
      );

      const loadingStates: boolean[] = [];
      const subscription = service.loading$.subscribe(loading => {
        loadingStates.push(loading);
      });

      service.submitInquiry([mockCartItem]).subscribe({
        complete: () => {
          subscription.unsubscribe();
          // Expect: initial false -> true (loading) -> false (complete)
          expect(loadingStates).toContain(true);
          expect(loadingStates[loadingStates.length - 1]).toBe(false);
          done();
        }
      });
    });
  });
});
