import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { environment } from '@env/environment';

// Test implementation of BaseHttpService
@Injectable()
class TestHttpService extends BaseHttpService {
  testGet(url: string, params?: any) {
    return this.getWithJsonLd(url, params);
  }

  testPost(url: string, body: any) {
    return this.postWithJsonLd(url, body);
  }

  testBuildParams(params: Record<string, string | number | boolean | undefined | null>) {
    return this.buildParams(params);
  }

  testBuildArrayParams(params: Record<string, string | string[] | number | boolean | undefined | null>) {
    return this.buildArrayParams(params);
  }

  testBuildUserFilterParams(email: string, filters?: any) {
    return this.buildUserFilterParams(email, filters);
  }

  testBuildUrl(...segments: string[]) {
    return this.buildUrl(...segments);
  }

  testBuildIri(resource: string, id: string) {
    return this.buildIri(resource, id);
  }

  testBuildClientUrl(clientId: string, ...segments: string[]) {
    return this.buildClientUrl(clientId, ...segments);
  }

  testNormalizeHydraCollection(response: Record<string, unknown>) {
    return this.normalizeHydraCollection(response);
  }
}

describe('BaseHttpService', () => {
  let service: TestHttpService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}${environment.apiPath}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TestHttpService]
    });

    service = TestBed.inject(TestHttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getWithJsonLd', () => {
    it('should make GET request with JSON-LD headers', (done) => {
      const testUrl = `${apiUrl}/test`;

      service.testGet(testUrl).subscribe({
        next: (data) => {
          expect(data).toEqual({ result: 'success' });
          done();
        }
      });

      const req = httpMock.expectOne(testUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/ld+json');
      expect(req.request.headers.get('Accept')).toBe('application/ld+json');
      req.flush({ result: 'success' });
    });
  });

  describe('postWithJsonLd', () => {
    it('should make POST request with JSON-LD headers', (done) => {
      const testUrl = `${apiUrl}/test`;
      const testBody = { name: 'test' };

      service.testPost(testUrl, testBody).subscribe({
        next: (data) => {
          expect(data).toEqual({ id: 1 });
          done();
        }
      });

      const req = httpMock.expectOne(testUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(testBody);
      expect(req.request.headers.get('Content-Type')).toBe('application/ld+json');
      expect(req.request.headers.get('Accept')).toBe('application/ld+json');
      req.flush({ id: 1 });
    });
  });

  describe('buildParams', () => {
    it('should build HttpParams from object', () => {
      const params = service.testBuildParams({
        page: 1,
        limit: 10,
        active: true,
        name: 'test'
      });

      expect(params.get('page')).toBe('1');
      expect(params.get('limit')).toBe('10');
      expect(params.get('active')).toBe('true');
      expect(params.get('name')).toBe('test');
    });

    it('should filter out undefined and null values', () => {
      const params = service.testBuildParams({
        page: 1,
        undefined: undefined,
        null: null,
        name: 'test'
      });

      expect(params.has('page')).toBe(true);
      expect(params.has('undefined')).toBe(false);
      expect(params.has('null')).toBe(false);
      expect(params.has('name')).toBe(true);
    });
  });

  describe('buildArrayParams', () => {
    it('should handle array values', () => {
      const params = service.testBuildArrayParams({
        tags: ['tag1', 'tag2', 'tag3']
      });

      expect(params.getAll('tags[]')).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle mixed scalar and array values', () => {
      const params = service.testBuildArrayParams({
        page: 1,
        tags: ['tag1', 'tag2'],
        active: true
      });

      expect(params.get('page')).toBe('1');
      expect(params.getAll('tags[]')).toEqual(['tag1', 'tag2']);
      expect(params.get('active')).toBe('true');
    });
  });

  describe('buildUserFilterParams', () => {
    it('should build params with user email', () => {
      const params = service.testBuildUserFilterParams('user@test.com');

      expect(params.get('user.email')).toBe('user@test.com');
    });

    it('should include additional filters', () => {
      const params = service.testBuildUserFilterParams('user@test.com', {
        status: 'active',
        isDraft: false
      });

      expect(params.get('user.email')).toBe('user@test.com');
      expect(params.get('status')).toBe('active');
      expect(params.get('isDraft')).toBe('false');
    });

    it('should filter out undefined values in filters', () => {
      const params = service.testBuildUserFilterParams('user@test.com', {
        status: 'active',
        undefined: undefined
      });

      expect(params.has('status')).toBe(true);
      expect(params.has('undefined')).toBe(false);
    });
  });

  describe('buildUrl', () => {
    it('should build URL from segments', () => {
      const url = service.testBuildUrl('users', '123', 'orders');

      expect(url).toBe(`${apiUrl}/users/123/orders`);
    });

    it('should handle single segment', () => {
      const url = service.testBuildUrl('users');

      expect(url).toBe(`${apiUrl}/users`);
    });
  });

  describe('buildIri', () => {
    it('should build IRI for resource', () => {
      const iri = service.testBuildIri('products', '456');

      expect(iri).toBe(`${apiUrl}/products/456`);
    });
  });

  describe('buildClientUrl', () => {
    it('should build client-specific URL', () => {
      const url = service.testBuildClientUrl('client123', 'products');

      expect(url).toBe(`${apiUrl}/client/client123/products`);
    });

    it('should handle multiple segments', () => {
      const url = service.testBuildClientUrl('client123', 'products', '789');

      expect(url).toBe(`${apiUrl}/client/client123/products/789`);
    });
  });

  describe('normalizeHydraCollection', () => {
    it('should normalize Hydra collection response', () => {
      const hydraResponse = {
        '@context': '/api/contexts/Product',
        '@id': '/api/products',
        '@type': 'hydra:Collection',
        'hydra:member': [
          { id: '1', name: 'Product 1' },
          { id: '2', name: 'Product 2' }
        ],
        'hydra:totalItems': 2,
        'hydra:view': {
          '@id': '/api/products?page=1',
          '@type': 'hydra:PartialCollectionView'
        }
      };

      const normalized = service.testNormalizeHydraCollection(hydraResponse);

      expect(normalized.member).toEqual([
        { id: '1', name: 'Product 1' },
        { id: '2', name: 'Product 2' }
      ]);
      expect(normalized.totalItems).toBe(2);
      expect(normalized.view).toBeDefined();
    });

    it('should handle already normalized response', () => {
      const normalizedResponse = {
        member: [
          { id: '1', name: 'Product 1' }
        ],
        totalItems: 1
      };

      const result = service.testNormalizeHydraCollection(normalizedResponse as any);

      expect(result.member).toEqual([{ id: '1', name: 'Product 1' }]);
      expect(result.totalItems).toBe(1);
    });

    it('should provide defaults for missing properties', () => {
      const minimalResponse = {};

      const normalized = service.testNormalizeHydraCollection(minimalResponse);

      expect(normalized.member).toEqual([]);
      expect(normalized.totalItems).toBe(0);
    });
  });
});
