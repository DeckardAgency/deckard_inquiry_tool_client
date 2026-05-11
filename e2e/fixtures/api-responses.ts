/**
 * Mock API responses for E2E tests
 */

export const mockTokenResponse = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RAdGVzdC5jb20iLCJyb2xlcyI6WyJST0xFX1VTRVIiXSwiZXhwIjoxOTk5OTk5OTk5LCJpYXQiOjE3MDAwMDAwMDB9.fake-signature',
  refresh_token: 'fake-refresh-token'
};

export const mockUserResponse = {
  '@id': '/api/v1/users/user-1',
  '@type': 'User',
  id: 'user-1',
  email: 'test@test.com',
  firstName: 'Test',
  lastName: 'User',
  roles: ['ROLE_USER'],
  client: {
    '@id': '/api/v1/clients/client-1',
    '@type': 'Client',
    id: 'client-1',
    code: 'TEST-CLIENT',
    name: 'Test Company',
    isActive: true,
    isArchived: false
  }
};

export const mockMachinesResponse = {
  '@context': '/api/contexts/Machine',
  '@id': '/api/v1/machines',
  '@type': 'Collection',
  totalItems: 3,
  member: [
    {
      '@id': '/api/v1/machines/m1',
      '@type': 'Machine',
      id: 'm1',
      articleDescription: 'recoSTAR dynamic 145',
      articleNumber: 'ART-001',
      ibSerialNumber: 'SN-001',
      mcNumber: 'MC-001'
    },
    {
      '@id': '/api/v1/machines/m2',
      '@type': 'Machine',
      id: 'm2',
      articleDescription: 'recoSTAR PET 165 HC iV+',
      articleNumber: 'ART-002',
      ibSerialNumber: 'SN-002',
      mcNumber: 'MC-002'
    },
    {
      '@id': '/api/v1/machines/m3',
      '@type': 'Machine',
      id: 'm3',
      articleDescription: 'Cutter compactor RC',
      articleNumber: 'ART-003',
      ibSerialNumber: 'SN-003',
      mcNumber: 'MC-003'
    }
  ]
};

export const mockProductsResponse = {
  '@context': '/api/contexts/Product',
  '@id': '/api/v1/products',
  '@type': 'Collection',
  totalItems: 5,
  member: [
    {
      '@id': '/api/v1/products/p1',
      '@type': 'Product',
      id: 'p1',
      name: 'Cutter Blade',
      slug: 'cutter-blade',
      partNo: 'CB-100',
      shortDescription: 'High-quality cutter blade for recycling machines',
      regularPrice: 280.00,
      clientPrice: 250.00,
      discountPercentage: 10,
      effectivePrice: 250.00,
      unit: 'pcs',
      weight: '2.5 kg',
      statistic: 'Fast moving',
      machines: [{ id: 'm1', articleDescription: 'recoSTAR dynamic 145' }],
      featuredImage: { '@id': '/api/media/1', filePath: '/images/products/cutter-blade.jpg' },
      imageGallery: []
    },
    {
      '@id': '/api/v1/products/p2',
      '@type': 'Product',
      id: 'p2',
      name: 'Filter Screen',
      slug: 'filter-screen',
      partNo: 'FS-200',
      shortDescription: 'Replacement filter screen',
      regularPrice: 180.00,
      clientPrice: 180.00,
      effectivePrice: 180.00,
      unit: 'pcs',
      weight: '1.2 kg',
      statistic: 'Standard',
      machines: [{ id: 'm2', articleDescription: 'recoSTAR PET 165 HC iV+' }],
      featuredImage: { '@id': '/api/media/2', filePath: '/images/products/filter-screen.jpg' },
      imageGallery: []
    },
    {
      '@id': '/api/v1/products/p3',
      '@type': 'Product',
      id: 'p3',
      name: 'Drive Belt',
      slug: 'drive-belt',
      partNo: 'DB-300',
      shortDescription: 'Industrial drive belt for conveyor system',
      regularPrice: 95.00,
      clientPrice: 95.00,
      effectivePrice: 95.00,
      unit: 'pcs',
      weight: '0.8 kg',
      statistic: 'Fast moving',
      machines: [{ id: 'm1', articleDescription: 'recoSTAR dynamic 145' }],
      featuredImage: { '@id': '/api/media/3', filePath: '/images/products/drive-belt.jpg' },
      imageGallery: []
    },
    {
      '@id': '/api/v1/products/p4',
      '@type': 'Product',
      id: 'p4',
      name: 'Heating Element',
      slug: 'heating-element',
      partNo: 'HE-400',
      shortDescription: 'Replacement heating element for extruder',
      regularPrice: 500.00,
      clientPrice: 450.00,
      discountPercentage: 10,
      effectivePrice: 450.00,
      unit: 'pcs',
      weight: '3.5 kg',
      statistic: 'Slow moving',
      machines: [{ id: 'm3', articleDescription: 'Cutter compactor RC' }],
      featuredImage: { '@id': '/api/media/4', filePath: '/images/products/heating-element.jpg' },
      imageGallery: []
    },
    {
      '@id': '/api/v1/products/p5',
      '@type': 'Product',
      id: 'p5',
      name: 'Bearing Assembly',
      slug: 'bearing-assembly',
      partNo: 'BA-500',
      shortDescription: 'Complete bearing assembly with seals',
      regularPrice: 320.00,
      clientPrice: 320.00,
      effectivePrice: 320.00,
      unit: 'pcs',
      weight: '4.2 kg',
      statistic: 'Standard',
      machines: [{ id: 'm2', articleDescription: 'recoSTAR PET 165 HC iV+' }],
      featuredImage: { '@id': '/api/media/5', filePath: '/images/products/bearing-assembly.jpg' },
      imageGallery: []
    }
  ]
};

// Mock cart data for pre-populating localStorage in tests
export const mockCartData = [
  {
    product: {
      '@id': '/api/v1/products/p1',
      '@type': 'Product',
      id: 'p1',
      name: 'Cutter Blade',
      slug: 'cutter-blade',
      partNo: 'CB-100',
      shortDescription: 'High-quality cutter blade for recycling machines',
      regularPrice: 280.00,
      clientPrice: 250.00,
      effectivePrice: 250.00,
      unit: 'pcs',
      weight: '2.5 kg',
      machines: [{ id: 'm1', articleDescription: 'recoSTAR dynamic 145' }],
      featuredImage: { '@id': '/api/media/1', filePath: '/images/products/cutter-blade.jpg' },
      imageGallery: []
    },
    quantity: 2
  },
  {
    product: {
      '@id': '/api/v1/products/p3',
      '@type': 'Product',
      id: 'p3',
      name: 'Drive Belt',
      slug: 'drive-belt',
      partNo: 'DB-300',
      shortDescription: 'Industrial drive belt for conveyor system',
      regularPrice: 95.00,
      clientPrice: 95.00,
      effectivePrice: 95.00,
      unit: 'pcs',
      weight: '0.8 kg',
      machines: [{ id: 'm1', articleDescription: 'recoSTAR dynamic 145' }],
      featuredImage: { '@id': '/api/media/3', filePath: '/images/products/drive-belt.jpg' },
      imageGallery: []
    },
    quantity: 1
  }
];

export const mockOrderCreateResponse = {
  '@id': '/api/v1/orders/new-order-1',
  '@type': 'Order',
  id: 'new-order-1',
  orderNumber: 'ORD-2024-100',
  internalReferenceNumber: 'REF-100',
  status: 'submitted',
  createdAt: '2024-01-25T10:00:00Z',
  items: [],
  user: { email: 'test@test.com' }
};

export const mockOrdersResponse = {
  '@context': '/api/contexts/Order',
  '@id': '/api/v1/orders',
  '@type': 'Collection',
  totalItems: 3,
  member: [
    {
      '@id': '/api/v1/orders/o1',
      '@type': 'Order',
      id: 'o1',
      orderNumber: 'ORD-2024-001',
      internalReferenceNumber: 'REF-001',
      status: 'submitted',
      totalAmount: 1500.00,
      createdAt: '2024-01-15T10:00:00Z',
      user: { email: 'test@test.com' },
      machines: [{ products: [{}, {}] }]
    },
    {
      '@id': '/api/v1/orders/o2',
      '@type': 'Order',
      id: 'o2',
      orderNumber: 'ORD-2024-002',
      internalReferenceNumber: 'REF-002',
      status: 'confirmed',
      totalAmount: 2300.00,
      createdAt: '2024-01-18T14:30:00Z',
      user: { email: 'test@test.com' },
      machines: [{ products: [{}] }]
    },
    {
      '@id': '/api/v1/orders/o3',
      '@type': 'Order',
      id: 'o3',
      orderNumber: 'ORD-2024-003',
      internalReferenceNumber: 'REF-003',
      status: 'processing',
      totalAmount: 850.00,
      createdAt: '2024-01-20T09:15:00Z',
      user: { email: 'test@test.com' },
      machines: [{ products: [{}, {}, {}] }]
    }
  ]
};

export const mockInquiriesResponse = {
  '@context': '/api/contexts/Inquiry',
  '@id': '/api/v1/inquiries',
  '@type': 'Collection',
  totalItems: 2,
  member: [
    {
      '@id': '/api/v1/inquiries/i1',
      '@type': 'Inquiry',
      id: 'i1',
      inquiryNumber: 'INQ-2024-001',
      internalReferenceNumber: 'REF-INQ-001',
      status: 'draft',
      machines: [
        { products: [{}, {}] }
      ],
      createdAt: '2024-01-10T10:00:00Z',
      user: { email: 'test@test.com' }
    },
    {
      '@id': '/api/v1/inquiries/i2',
      '@type': 'Inquiry',
      id: 'i2',
      inquiryNumber: 'INQ-2024-002',
      internalReferenceNumber: 'REF-INQ-002',
      status: 'submitted',
      machines: [
        { products: [{}, {}, {}] },
        { products: [{}] }
      ],
      createdAt: '2024-01-12T10:00:00Z',
      user: { email: 'test@test.com' }
    }
  ]
};

export const emptyCollectionResponse = {
  '@context': '/api/contexts/Collection',
  '@id': '/api/v1/items',
  '@type': 'Collection',
  totalItems: 0,
  member: []
};
