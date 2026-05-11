// order-inquiry-table.types.ts

// Status types
export const ORDER_STATUS = {
  CANCELED: 'Canceled',
  COMPLETED: 'Completed',
  DISPATCHED: 'Dispatched',
  CONFIRMED: 'Confirmed',
  SUBMITTED: 'Submitted',
  PENDING_APPROVAL: 'Pending Approval',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Tab types
export const ORDER_INQUIRY_TABS = {
  LATEST: 'Latest',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled'
} as const;

export type OrderInquiryTab = typeof ORDER_INQUIRY_TABS[keyof typeof ORDER_INQUIRY_TABS];

// Type of inquiry/order
export const INQUIRY_TYPE = {
  ORDER: 'Order',
  INQUIRY: 'Inquiry'
} as const;

export type InquiryType = typeof INQUIRY_TYPE[keyof typeof INQUIRY_TYPE];

// Data source types
export const DATA_SOURCE = {
  INQUIRIES: 'inquiries',
  ORDERS: 'orders',
  BOTH: 'both'
} as const;

export type DataSource = typeof DATA_SOURCE[keyof typeof DATA_SOURCE];

// Customer interface
export interface Customer {
  id: string;
  name: string;
  initials: string;
  image?: string;
}

// Base interface for common properties
export interface BaseOrderInquiry {
  id: string;
  type: InquiryType;
  dateCreated: string;
  internalReferenceNumber: string;
  customer: Customer;
  partsOrdered: number;
  status: OrderStatus;
}

// Specific interfaces for different sources
export interface Inquiry extends BaseOrderInquiry {
  source: 'inquiry';
}

export interface Order extends BaseOrderInquiry {
  source: 'order';
}

// Union type for mixed data
export type OrderInquiryItem = Inquiry | Order;

// Sort configuration
export interface SortConfig {
  column: SortableColumn;
  direction: 'asc' | 'desc';
}

export type SortableColumn = 'id' | 'type' | 'dateCreated' | 'internalReferenceNumber' | 'customerName' | 'partsOrdered' | 'status';

// Filter configuration
export interface FilterConfig {
  status?: OrderStatus[];
  type?: InquiryType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

// Component configuration
export interface OrderInquiryTableConfig {
  loadDataOnTabChange: boolean;
  dataSource: DataSource;
  enableSorting: boolean;
  enableFiltering: boolean;
  pageSize?: number;
  showPagination?: boolean;
}

// Action types
export interface OrderInquiryAction {
  type: 'view' | 'edit' | 'delete' | 'export';
  item: OrderInquiryItem;
}

// Tab data loading event
export interface TabChangeEvent {
  tab: OrderInquiryTab;
  shouldLoadData: boolean;
}
