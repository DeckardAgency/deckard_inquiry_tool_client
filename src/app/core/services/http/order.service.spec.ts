import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { CartItem } from '@core/models';
import { environment } from '@env/environment';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}${environment.apiPath}`;

  const mockCartItems: CartItem[] = [
    {
      product: {
        '@id': '/api/v1/products/1',
        '@type': 'Product',
        id: '1',
        name: 'Test Product 1',
        partNo: 'PART-001',
        slug: 'test-product-1',
        shortDescription: 'Test Product 1',
        regularPrice: 100,
        clientPrice: 100,
        machines: []
      } as any,
      quantity: 2
    },
    {
      product: {
        '@id': '/api/v1/products/2',
        '@type': 'Product',
        id: '2',
        name: 'Test Product 2',
        partNo: 'PART-002',
        slug: 'test-product-2',
        shortDescription: 'Test Product 2',
        regularPrice: 50,
        clientPrice: 50,
        machines: []
      } as any,
      quantity: 3
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderService]
    });

    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('createOrder', () => {
    it('should create order successfully', (done) => {
      const shippingAddress = '123 Main St';
      const billingAddress = '456 Oak Ave';
      const referenceNumber = 'REF-001';
      const userId = 'user-123';

      const mockResponse = {
        '@id': '/api/v1/orders/1',
        '@type': 'Order',
        id: '1',
        orderNumber: 'ORD-001',
        status: 'submitted',
        shippingAddress,
        billingAddress,
        items: []
      };

      service.createOrder(mockCartItems, shippingAddress, billingAddress, referenceNumber, userId)
        .subscribe({
          next: (response) => {
            expect(response.id).toBe('1');
            expect(response.status).toBe('submitted');
            done();
          },
          error: () => fail('Should not error')
        });

      const req = httpMock.expectOne(`${apiUrl}/orders`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.status).toBe('submitted');
      expect(req.request.body.shippingAddress).toBe(shippingAddress);
      expect(req.request.body.billingAddress).toBe(billingAddress);
      expect(req.request.body.items.length).toBe(2);
      expect(req.request.body.user).toBe(`${apiUrl}/users/${userId}`);
      req.flush(mockResponse);
    });

    it('should transform cart items to order items', (done) => {
      service.createOrder(mockCartItems, 'addr1', 'addr2', 'ref', 'user1')
        .subscribe({
          next: () => done(),
          error: () => fail('Should not error')
        });

      const req = httpMock.expectOne(`${apiUrl}/orders`);
      const orderItems = req.request.body.items;

      expect(orderItems[0].product).toBe(`${apiUrl}/products/1`);
      expect(orderItems[0].quantity).toBe(2);
      expect(orderItems[1].product).toBe(`${apiUrl}/products/2`);
      expect(orderItems[1].quantity).toBe(3);

      req.flush({ id: '1' });
    });
  });

  describe('saveDraft', () => {
    it('should save draft order', (done) => {
      const shippingAddress = '123 Main St';
      const billingAddress = '456 Oak Ave';
      const referenceNumber = 'REF-002';
      const userId = 'user-123';

      const mockResponse = {
        '@id': '/api/v1/orders/2',
        '@type': 'Order',
        id: '2',
        status: 'draft'
      };

      service.saveDraft(mockCartItems, shippingAddress, billingAddress, referenceNumber, userId)
        .subscribe({
          next: (response) => {
            expect(response.status).toBe('draft');
            done();
          },
          error: () => fail('Should not error')
        });

      const req = httpMock.expectOne(`${apiUrl}/orders`);
      expect(req.request.body.status).toBe('draft');
      req.flush(mockResponse);
    });
  });

  describe('getOrder', () => {
    it('should fetch order by ID', (done) => {
      const orderId = '123';
      const mockOrder = {
        '@id': `/api/v1/orders/${orderId}`,
        '@type': 'Order',
        id: orderId,
        orderNumber: 'ORD-123',
        status: 'submitted'
      };

      service.getOrder(orderId).subscribe({
        next: (order) => {
          expect(order.id).toBe(orderId);
          expect(order.orderNumber).toBe('ORD-123');
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/${orderId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrder);
    });
  });

  describe('getOrdersByOrderNumber', () => {
    it('should fetch orders by order number', (done) => {
      const orderNumber = 'ORD-123';
      const mockResponse = {
        '@context': '/api/contexts/Order',
        '@id': '/api/orders',
        '@type': 'hydra:Collection',
        'hydra:member': [
          { id: '1', orderNumber: 'ORD-123' }
        ],
        'hydra:totalItems': 1
      };

      service.getOrdersByOrderNumber(orderNumber).subscribe({
        next: (response: any) => {
          expect(response['hydra:member'].length).toBe(1);
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(req =>
        req.url === `${apiUrl}/orders` && req.params.get('orderNumber') === orderNumber
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getOrdersByUserEmail', () => {
    it('should fetch submitted orders by user email', (done) => {
      const email = 'user@test.com';
      const mockResponse = {
        '@context': '/api/contexts/Order',
        '@id': '/api/orders',
        '@type': 'hydra:Collection',
        'hydra:member': [],
        'hydra:totalItems': 0
      };

      service.getOrdersByUserEmail(email).subscribe({
        next: () => done(),
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(req =>
        req.url === `${apiUrl}/orders` &&
        req.params.get('user.email') === email &&
        req.params.get('isDraft') === 'false' &&
        req.params.get('status') === 'submitted'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getOrdersHistoryByUserEmail', () => {
    it('should fetch order history without status filter', (done) => {
      const email = 'user@test.com';

      service.getOrdersHistoryByUserEmail(email).subscribe({
        next: () => done(),
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(req =>
        req.url === `${apiUrl}/orders` &&
        req.params.get('user.email') === email &&
        req.params.get('isDraft') === 'false' &&
        !req.params.has('status')
      );
      req.flush({ 'hydra:member': [] });
    });
  });

  describe('getDraftOrdersByUserEmail', () => {
    it('should fetch draft orders by user email', (done) => {
      const email = 'user@test.com';

      service.getDraftOrdersByUserEmail(email).subscribe({
        next: () => done(),
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(req =>
        req.url === `${apiUrl}/orders` &&
        req.params.get('user.email') === email &&
        req.params.get('status') === 'draft'
      );
      req.flush({ 'hydra:member': [] });
    });
  });

  describe('exportOrderPdf', () => {
    it('should request PDF export', (done) => {
      const orderId = '123';

      service.exportOrderPdf(orderId).subscribe({
        next: (blob) => {
          expect(blob).toBeInstanceOf(Blob);
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/${orderId}/export/pdf`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Accept')).toBe('application/pdf');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['PDF content'], { type: 'application/pdf' }));
    });
  });

  describe('deleteOrder', () => {
    it('should delete order by ID', (done) => {
      const orderId = '123';

      service.deleteOrder(orderId).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/${orderId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
