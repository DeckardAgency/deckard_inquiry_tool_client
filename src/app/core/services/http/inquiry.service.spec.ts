import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InquiryService } from './inquiry.service';
import { InquiryRequest } from '@models/api/inquiry-api.model';
import { environment } from '@env/environment';

describe('InquiryService', () => {
  let service: InquiryService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}${environment.apiPath}`;

  const mockInquiryRequest: InquiryRequest = {
    status: 'submitted',
    isDraft: false,
    notes: 'Test notes',
    contactEmail: 'test@test.com',
    contactPhone: '+123456789',
    machines: [],
    user: `${apiUrl}/users/1`
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InquiryService]
    });

    service = TestBed.inject(InquiryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('createInquiry', () => {
    it('should create inquiry successfully', (done) => {
      const mockResponse = {
        '@id': '/api/v1/inquiries/1',
        '@type': 'Inquiry',
        id: '1',
        inquiryNumber: 'INQ-001',
        status: 'submitted'
      };

      service.createInquiry(mockInquiryRequest).subscribe({
        next: (response) => {
          expect(response.id).toBe('1');
          expect(response.status).toBe('submitted');
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${apiUrl}/inquiries`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockInquiryRequest);
      expect(req.request.headers.get('Content-Type')).toBe('application/ld+json');
      req.flush(mockResponse);
    });
  });

  describe('saveDraft', () => {
    it('should save inquiry as draft', (done) => {
      const draftRequest = { ...mockInquiryRequest };

      const mockResponse = {
        '@id': '/api/v1/inquiries/2',
        '@type': 'Inquiry',
        id: '2',
        status: 'draft',
        isDraft: true
      };

      service.saveDraft(draftRequest).subscribe({
        next: (response) => {
          expect(response.status).toBe('draft');
          expect(response.isDraft).toBe(true);
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${apiUrl}/inquiries`);
      expect(req.request.body.status).toBe('draft');
      expect(req.request.body.isDraft).toBe(true);
      req.flush(mockResponse);
    });
  });

  describe('submitDraft', () => {
    it('should submit draft inquiry', (done) => {
      const inquiryId = '123';
      const mockResponse = {
        '@id': `/api/v1/inquiries/${inquiryId}`,
        '@type': 'Inquiry',
        id: inquiryId,
        status: 'submitted',
        isDraft: false
      };

      service.submitDraft(inquiryId).subscribe({
        next: (response) => {
          expect(response.status).toBe('submitted');
          expect(response.isDraft).toBe(false);
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${apiUrl}/inquiries/${inquiryId}/submit`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('getInquiryById', () => {
    it('should fetch inquiry by ID', (done) => {
      const inquiryId = '123';
      const mockInquiry = {
        '@id': `/api/v1/inquiries/${inquiryId}`,
        '@type': 'Inquiry',
        id: inquiryId,
        inquiryNumber: 'INQ-123',
        status: 'submitted'
      };

      service.getInquiryById(inquiryId).subscribe({
        next: (inquiry) => {
          expect(inquiry.id).toBe(inquiryId);
          expect(inquiry.inquiryNumber).toBe('INQ-123');
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${apiUrl}/inquiries/${inquiryId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockInquiry);
    });
  });

  describe('getInquiriesByUserEmail', () => {
    it('should fetch all inquiries by user email', (done) => {
      const email = 'user@test.com';
      const mockResponse = {
        '@context': '/api/contexts/Inquiry',
        '@id': '/api/inquiries',
        '@type': 'hydra:Collection',
        'hydra:member': [],
        'hydra:totalItems': 0
      };

      service.getInquiriesByUserEmail(email).subscribe({
        next: () => done(),
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(req =>
        req.url === `${apiUrl}/inquiries` &&
        req.params.get('user.email') === email
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getDraftInquiriesByUserEmail', () => {
    it('should fetch draft inquiries by user email', (done) => {
      const email = 'user@test.com';

      service.getDraftInquiriesByUserEmail(email).subscribe({
        next: () => done(),
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(req =>
        req.url === `${apiUrl}/inquiries` &&
        req.params.get('user.email') === email &&
        req.params.get('status') === 'draft'
      );
      req.flush({ 'hydra:member': [] });
    });
  });

  describe('getSubmittedInquiriesByUserEmail', () => {
    it('should fetch submitted inquiries by user email', (done) => {
      const email = 'user@test.com';

      service.getSubmittedInquiriesByUserEmail(email).subscribe({
        next: () => done(),
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(req =>
        req.url === `${apiUrl}/inquiries` &&
        req.params.get('user.email') === email &&
        req.params.get('isDraft') === 'false' &&
        req.params.get('status') === 'submitted'
      );
      req.flush({ 'hydra:member': [] });
    });
  });

  describe('getInquiriesHistoryByUserEmail', () => {
    it('should fetch inquiry history without status filter', (done) => {
      const email = 'user@test.com';

      service.getInquiriesHistoryByUserEmail(email).subscribe({
        next: () => done(),
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(req =>
        req.url === `${apiUrl}/inquiries` &&
        req.params.get('user.email') === email &&
        req.params.get('isDraft') === 'false' &&
        !req.params.has('status')
      );
      req.flush({ 'hydra:member': [] });
    });
  });

  describe('deleteInquiry', () => {
    it('should delete inquiry by ID', (done) => {
      const inquiryId = '123';

      service.deleteInquiry(inquiryId).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${apiUrl}/inquiries/${inquiryId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('exportInquiryPdf', () => {
    it('should request PDF export', (done) => {
      const inquiryId = '123';

      service.exportInquiryPdf(inquiryId).subscribe({
        next: (blob) => {
          expect(blob).toBeInstanceOf(Blob);
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${apiUrl}/inquiries/${inquiryId}/export/pdf`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Accept')).toBe('application/pdf');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['PDF content'], { type: 'application/pdf' }));
    });
  });
});
