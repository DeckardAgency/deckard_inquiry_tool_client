import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { Product, CartItem } from '@core/models';

describe('CartService', () => {
  let service: CartService;

  const mockProduct = {
    '@id': '/api/v1/products/1',
    '@type': 'Product',
    id: '1',
    name: 'Test Product',
    slug: 'test-product',
    partNo: 'PART-001',
    shortDescription: 'Test Description',
    regularPrice: 100,
    clientPrice: 90,
    machines: []
  } as unknown as Product;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CartService]
    });
    service = TestBed.inject(CartService);
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
      const savedItems: CartItem[] = [
        { product: mockProduct, quantity: 2 }
      ];
      localStorage.setItem('cart', JSON.stringify(savedItems));

      const newService = new CartService('browser');
      newService.getCartItems().subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].product.id).toBe('1');
        expect(items[0].quantity).toBe(2);
      });
    });
  });

  describe('addToCart', () => {
    it('should add new item to cart', (done) => {
      service.addToCart(mockProduct, 3);

      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].product).toEqual(mockProduct);
        expect(items[0].quantity).toBe(3);
        done();
      });
    });

    it('should update quantity if product already exists', (done) => {
      service.addToCart(mockProduct, 2);
      service.addToCart(mockProduct, 3);

      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].quantity).toBe(5);
        done();
      });
    });

    it('should save to localStorage', () => {
      service.addToCart(mockProduct, 2);

      const saved = localStorage.getItem('cart');
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed.length).toBe(1);
      expect(parsed[0].quantity).toBe(2);
    });
  });

  describe('removeFromCart', () => {
    beforeEach(() => {
      service.addToCart(mockProduct, 2);
    });

    it('should remove item from cart', (done) => {
      service.removeFromCart('1');

      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(0);
        done();
      });
    });

    it('should update localStorage', () => {
      service.removeFromCart('1');

      const saved = localStorage.getItem('cart');
      const parsed = JSON.parse(saved!);
      expect(parsed.length).toBe(0);
    });
  });

  describe('updateQuantity', () => {
    beforeEach(() => {
      service.addToCart(mockProduct, 5);
    });

    it('should update item quantity', (done) => {
      service.updateQuantity('1', 10);

      service.getCartItems().subscribe(items => {
        expect(items[0].quantity).toBe(10);
        done();
      });
    });

    it('should remove item if quantity is 0', (done) => {
      service.updateQuantity('1', 0);

      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(0);
        done();
      });
    });

    it('should update localStorage', () => {
      service.updateQuantity('1', 7);

      const saved = localStorage.getItem('cart');
      const parsed = JSON.parse(saved!);
      expect(parsed[0].quantity).toBe(7);
    });
  });

  describe('clearCart', () => {
    beforeEach(() => {
      service.addToCart(mockProduct, 2);
    });

    it('should clear all items from cart', (done) => {
      service.clearCart();

      service.getCartItems().subscribe(items => {
        expect(items.length).toBe(0);
        done();
      });
    });

    it('should clear localStorage', () => {
      service.clearCart();

      const saved = localStorage.getItem('cart');
      expect(saved).toBeNull();
    });
  });

  describe('getCartCount', () => {
    it('should return 0 for empty cart', (done) => {
      service.getCartCount().subscribe(count => {
        expect(count).toBe(0);
        done();
      });
    });

    it('should return total quantity of all items', (done) => {
      service.addToCart(mockProduct, 3);
      service.addToCart({ ...mockProduct, id: '2' } as Product, 5);

      service.getCartCount().subscribe(count => {
        expect(count).toBe(8);
        done();
      });
    });
  });

  describe('getCartTotal', () => {
    it('should return 0 for empty cart', (done) => {
      service.getCartTotal().subscribe(total => {
        expect(total).toBe(0);
        done();
      });
    });

    it('should calculate total price correctly', (done) => {
      service.addToCart(mockProduct, 2); // 90 * 2 = 180
      service.addToCart({ ...mockProduct, id: '2', clientPrice: 50 } as Product, 3); // 50 * 3 = 150

      service.getCartTotal().subscribe(total => {
        expect(total).toBe(330);
        done();
      });
    });
  });

  describe('cart panel state', () => {
    it('should open cart', (done) => {
      service.openCart();

      service.isOpen$.subscribe(isOpen => {
        expect(isOpen).toBe(true);
        done();
      });
    });

    it('should close cart', (done) => {
      service.openCart();
      service.closeCart();

      service.isOpen$.subscribe(isOpen => {
        expect(isOpen).toBe(false);
        done();
      });
    });

    it('should toggle cart', (done) => {
      service.toggleCart();

      service.isOpen$.subscribe(isOpen => {
        expect(isOpen).toBe(true);
        done();
      });
    });
  });

  describe('notifications', () => {
    it('should show notification', (done) => {
      service.showNotification('Test message', 'success');

      service.notificationVisible$.subscribe(visible => {
        expect(visible).toBe(true);
      });

      service.lastAddedProduct$.subscribe(message => {
        expect(message).toBe('Test message');
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
});
