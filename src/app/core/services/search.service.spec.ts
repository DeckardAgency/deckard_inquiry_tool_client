import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SearchService } from './search.service';
import { AuthService } from '@core/auth/auth.service';
import { environment } from '@env/environment';

describe('SearchService', () => {
  let service: SearchService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['ROLE_USER'],
    client: {
      '@id': '/api/v1/clients/client1',
      '@type': 'Client',
      id: 'client1',
      code: 'TEST-CLIENT',
      name: 'Test Client',
      isActive: true,
      isArchived: false
    }
  };

  const mockMachinesResponse = {
    '@context': '/api/contexts/Machine',
    '@id': '/api/v1/machines',
    '@type': 'Collection',
    totalItems: 2,
    member: [
      {
        id: 'm1',
        articleDescription: 'Test Machine 1',
        articleNumber: 'ART001',
        ibSerialNumber: 'SN001',
        mcNumber: 'MC001'
      },
      {
        id: 'm2',
        articleDescription: 'Test Machine 2',
        articleNumber: 'ART002',
        ibSerialNumber: 'SN002',
        mcNumber: 'MC002'
      }
    ]
  };

  const mockProductsResponse = {
    '@context': '/api/contexts/Product',
    '@id': '/api/v1/products',
    '@type': 'Collection',
    totalItems: 1,
    member: [
      {
        id: 'p1',
        name: 'Test Product',
        partNo: 'PART001',
        shortDescription: 'A test product',
        price: 100,
        unit: 'pcs'
      }
    ]
  };

  const mockOrdersResponse = {
    '@context': '/api/contexts/Order',
    '@id': '/api/v1/orders',
    '@type': 'Collection',
    totalItems: 1,
    member: [
      {
        id: 'o1',
        orderNumber: 'ORD-001',
        status: 'submitted',
        totalAmount: 500
      }
    ]
  };

  const mockInquiriesResponse = {
    '@context': '/api/contexts/Inquiry',
    '@id': '/api/v1/inquiries',
    '@type': 'Collection',
    totalItems: 1,
    member: [
      {
        id: 'i1',
        inquiryNumber: 'INQ-001',
        status: 'submitted',
        machines: [
          { products: [{}, {}] }
        ]
      }
    ]
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    authServiceSpy.getCurrentUser.and.returnValue(mockUser);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SearchService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(SearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('searchAll', () => {
    it('should return empty results for empty query', (done) => {
      service.searchAll('').subscribe(results => {
        expect(results.machines).toEqual([]);
        expect(results.products).toEqual([]);
        expect(results.orders).toEqual([]);
        expect(results.inquiries).toEqual([]);
        expect(results.totalMachines).toBe(0);
        expect(results.totalProducts).toBe(0);
        expect(results.totalOrders).toBe(0);
        expect(results.totalInquiries).toBe(0);
        done();
      });
    });

    it('should search all entity types', (done) => {
      service.searchAll('test').subscribe(results => {
        expect(results.machines.length).toBe(2);
        expect(results.products.length).toBe(1);
        expect(results.orders.length).toBe(1);
        expect(results.inquiries.length).toBe(1);
        expect(results.totalMachines).toBe(2);
        expect(results.totalProducts).toBe(1);
        expect(results.totalOrders).toBe(1);
        expect(results.totalInquiries).toBe(1);
        done();
      });

      const machinesReq = httpMock.expectOne(req =>
        req.url.includes('/machines') && req.params.get('articleDescription') === 'test'
      );
      machinesReq.flush(mockMachinesResponse);

      const productsReq = httpMock.expectOne(req =>
        req.url.includes('/products') && req.params.get('name') === 'test'
      );
      productsReq.flush(mockProductsResponse);

      const ordersReq = httpMock.expectOne(req =>
        req.url.includes('/orders') && req.params.get('orderNumber') === 'test'
      );
      ordersReq.flush(mockOrdersResponse);

      const inquiriesReq = httpMock.expectOne(req =>
        req.url.includes('/inquiries') && req.params.get('inquiryNumber') === 'test'
      );
      inquiriesReq.flush(mockInquiriesResponse);
    });

    it('should filter orders by client code', (done) => {
      service.searchAll('test').subscribe(() => done());

      const machinesReq = httpMock.expectOne(req => req.url.includes('/machines'));
      machinesReq.flush(mockMachinesResponse);

      const productsReq = httpMock.expectOne(req => req.url.includes('/products'));
      productsReq.flush(mockProductsResponse);

      const ordersReq = httpMock.expectOne(req => {
        return req.url.includes('/orders') &&
               req.params.get('user.client.code') === 'TEST-CLIENT';
      });
      expect(ordersReq.request.params.get('user.client.code')).toBe('TEST-CLIENT');
      ordersReq.flush(mockOrdersResponse);

      const inquiriesReq = httpMock.expectOne(req => req.url.includes('/inquiries'));
      inquiriesReq.flush(mockInquiriesResponse);
    });

    it('should filter inquiries by client code', (done) => {
      service.searchAll('test').subscribe(() => done());

      const machinesReq = httpMock.expectOne(req => req.url.includes('/machines'));
      machinesReq.flush(mockMachinesResponse);

      const productsReq = httpMock.expectOne(req => req.url.includes('/products'));
      productsReq.flush(mockProductsResponse);

      const ordersReq = httpMock.expectOne(req => req.url.includes('/orders'));
      ordersReq.flush(mockOrdersResponse);

      const inquiriesReq = httpMock.expectOne(req => {
        return req.url.includes('/inquiries') &&
               req.params.get('user.client.code') === 'TEST-CLIENT';
      });
      expect(inquiriesReq.request.params.get('user.client.code')).toBe('TEST-CLIENT');
      inquiriesReq.flush(mockInquiriesResponse);
    });

    it('should return empty orders/inquiries when no client code', (done) => {
      authServiceSpy.getCurrentUser.and.returnValue(null);

      service.searchAll('test').subscribe(results => {
        expect(results.orders).toEqual([]);
        expect(results.inquiries).toEqual([]);
        expect(results.totalOrders).toBe(0);
        expect(results.totalInquiries).toBe(0);
        done();
      });

      // Only machines and products should be requested
      const machinesReq = httpMock.expectOne(req => req.url.includes('/machines'));
      machinesReq.flush(mockMachinesResponse);

      const productsReq = httpMock.expectOne(req => req.url.includes('/products'));
      productsReq.flush(mockProductsResponse);

      // No orders or inquiries requests should be made
      httpMock.expectNone(req => req.url.includes('/orders'));
      httpMock.expectNone(req => req.url.includes('/inquiries'));
    });

    it('should handle API errors gracefully', (done) => {
      service.searchAll('test').subscribe(results => {
        // Should return empty arrays on error
        expect(results.machines).toEqual([]);
        expect(results.products).toEqual([]);
        done();
      });

      const machinesReq = httpMock.expectOne(req => req.url.includes('/machines'));
      machinesReq.error(new ErrorEvent('Network error'));

      const productsReq = httpMock.expectOne(req => req.url.includes('/products'));
      productsReq.error(new ErrorEvent('Network error'));

      const ordersReq = httpMock.expectOne(req => req.url.includes('/orders'));
      ordersReq.error(new ErrorEvent('Network error'));

      const inquiriesReq = httpMock.expectOne(req => req.url.includes('/inquiries'));
      inquiriesReq.error(new ErrorEvent('Network error'));
    });

    it('should transform machine results correctly', (done) => {
      service.searchAll('test').subscribe(results => {
        const machine = results.machines[0];
        expect(machine.id).toBe('m1');
        expect(machine.title).toBe('Test Machine 1');
        expect(machine.type).toBe('machine');
        expect(machine.badge).toBe('Machine');
        expect(machine.description).toContain('ART001');
        expect(machine.description).toContain('SN001');
        done();
      });

      httpMock.expectOne(req => req.url.includes('/machines')).flush(mockMachinesResponse);
      httpMock.expectOne(req => req.url.includes('/products')).flush(mockProductsResponse);
      httpMock.expectOne(req => req.url.includes('/orders')).flush(mockOrdersResponse);
      httpMock.expectOne(req => req.url.includes('/inquiries')).flush(mockInquiriesResponse);
    });

    it('should transform product results correctly', (done) => {
      service.searchAll('test').subscribe(results => {
        const product = results.products[0];
        expect(product.id).toBe('p1');
        expect(product.title).toBe('Test Product');
        expect(product.type).toBe('product');
        expect(product.badge).toBe('Product');
        expect(product.description).toContain('PART001');
        done();
      });

      httpMock.expectOne(req => req.url.includes('/machines')).flush(mockMachinesResponse);
      httpMock.expectOne(req => req.url.includes('/products')).flush(mockProductsResponse);
      httpMock.expectOne(req => req.url.includes('/orders')).flush(mockOrdersResponse);
      httpMock.expectOne(req => req.url.includes('/inquiries')).flush(mockInquiriesResponse);
    });

    it('should transform order results correctly', (done) => {
      service.searchAll('test').subscribe(results => {
        const order = results.orders[0];
        expect(order.id).toBe('o1');
        expect(order.title).toBe('Order ORD-001');
        expect(order.type).toBe('order');
        expect(order.badge).toBe('Order');
        expect(order.description).toContain('submitted');
        done();
      });

      httpMock.expectOne(req => req.url.includes('/machines')).flush(mockMachinesResponse);
      httpMock.expectOne(req => req.url.includes('/products')).flush(mockProductsResponse);
      httpMock.expectOne(req => req.url.includes('/orders')).flush(mockOrdersResponse);
      httpMock.expectOne(req => req.url.includes('/inquiries')).flush(mockInquiriesResponse);
    });

    it('should transform inquiry results correctly', (done) => {
      service.searchAll('test').subscribe(results => {
        const inquiry = results.inquiries[0];
        expect(inquiry.id).toBe('i1');
        expect(inquiry.title).toBe('Inquiry INQ-001');
        expect(inquiry.type).toBe('inquiry');
        expect(inquiry.badge).toBe('Inquiry');
        expect(inquiry.description).toContain('1 machine');
        expect(inquiry.description).toContain('2 part');
        done();
      });

      httpMock.expectOne(req => req.url.includes('/machines')).flush(mockMachinesResponse);
      httpMock.expectOne(req => req.url.includes('/products')).flush(mockProductsResponse);
      httpMock.expectOne(req => req.url.includes('/orders')).flush(mockOrdersResponse);
      httpMock.expectOne(req => req.url.includes('/inquiries')).flush(mockInquiriesResponse);
    });
  });

  describe('Recent Searches', () => {
    it('should return empty array when no recent searches', () => {
      const searches = service.getRecentSearches();
      expect(searches).toEqual([]);
    });

    it('should add recent search', () => {
      service.addRecentSearch('test query');

      const searches = service.getRecentSearches();
      expect(searches.length).toBe(1);
      expect(searches[0].query).toBe('test query');
    });

    it('should not add search with less than 2 characters', () => {
      service.addRecentSearch('a');

      const searches = service.getRecentSearches();
      expect(searches.length).toBe(0);
    });

    it('should not add empty search', () => {
      service.addRecentSearch('');
      service.addRecentSearch('   ');

      const searches = service.getRecentSearches();
      expect(searches.length).toBe(0);
    });

    it('should move duplicate to top', () => {
      service.addRecentSearch('first');
      service.addRecentSearch('second');
      service.addRecentSearch('first');

      const searches = service.getRecentSearches();
      expect(searches.length).toBe(2);
      expect(searches[0].query).toBe('first');
      expect(searches[1].query).toBe('second');
    });

    it('should limit to max recent searches', () => {
      service.addRecentSearch('one');
      service.addRecentSearch('two');
      service.addRecentSearch('three');
      service.addRecentSearch('four');
      service.addRecentSearch('five');
      service.addRecentSearch('six');

      const searches = service.getRecentSearches();
      expect(searches.length).toBe(5);
      expect(searches[0].query).toBe('six');
    });

    it('should clear recent searches', () => {
      service.addRecentSearch('test');
      service.clearRecentSearches();

      const searches = service.getRecentSearches();
      expect(searches.length).toBe(0);
    });

    it('should handle localStorage errors gracefully', () => {
      spyOn(localStorage, 'getItem').and.throwError('Storage error');

      const searches = service.getRecentSearches();
      expect(searches).toEqual([]);
    });
  });
});
