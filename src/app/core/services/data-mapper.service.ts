import { Injectable } from '@angular/core';
import { OrderResponse, InquiryResponse, InquiryHistory, Inquiry } from '@core/models';
import { OrderInquiryItem, ORDER_STATUS, INQUIRY_TYPE, OrderStatus } from '@shared/components/order-inquiry-table/order-inquiry-table.types';

// ============ Shared Interfaces ============

/**
 * Extended history item with source ID for tracking
 */
export interface HistoryItem extends InquiryHistory {
  sourceId: string;
}

/**
 * Draft item interface for draft orders/inquiries
 */
export interface DraftItem {
  id: string;
  type: 'order' | 'inquiry';
  number: string;
  status: string;
  dateCreated: string;
  machine: string;
  partsOrdered: number;
  userInitials: string;
  notes: string;
  isDraft: boolean;
  lastModified: string;
}

/**
 * Draft list item (for draft inquiries page with edit capabilities)
 */
export interface DraftListItem {
  id: string;
  dateCreated: string;
  type: 'Order' | 'Inquiry';
  internalReference: string;
  customer: {
    initials: string;
    name: string;
    avatar?: string;
  };
  status: string;
  originalData?: OrderResponse | InquiryResponse;
}

/**
 * Active inquiry item (for dashboard and active inquiries page)
 */
export interface ActiveInquiryItem extends Inquiry {
  // Inherits all properties from Inquiry
}

/**
 * Data Mapper Service
 *
 * Centralizes all data transformation logic for orders and inquiries.
 * Eliminates duplicate mapping functions across components.
 *
 * @example
 * ```typescript
 * constructor(private dataMapper: DataMapperService) {}
 *
 * const historyItem = this.dataMapper.mapOrderToHistoryItem(order);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class DataMapperService {

  // ============ Common Utilities ============

  /**
   * Extract user initials from name or email
   * @example "John Doe" -> "JD", "john.doe@example.com" -> "JD"
   */
  private extractUserInitials(name: string | undefined, email: string | undefined): string {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }

    if (email) {
      const emailParts = email.split('@')[0];
      return emailParts
        .split('.')
        .map(part => part.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
    }

    return 'UN'; // Unknown
  }

  /**
   * Normalize status values to match InquiryHistory status type
   */
  private normalizeStatus(status: string): InquiryHistory['status'] {
    const normalizedStatus = status.toLowerCase().replace(/-/g, '_');

    const mapped: { [key: string]: InquiryHistory['status'] } = {
      'completed': 'Completed',
      'accepted': 'Accepted',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'cancelled': 'Cancelled',
      'canceled': 'Cancelled',
      'submitted': 'Submitted',
      'pending': 'Processing',
      'in_review': 'In Review',
      'more_info': 'More Info',
      'information_provided': 'Information Provided',
      'in_progress': 'In Progress',
      'dispatched': 'Dispatched',
      'pending_approval': 'Pending Approval'
    };

    return mapped[normalizedStatus] || 'Processing';
  }

  /**
   * Extract machine name from order
   */
  private extractMachineName(order: OrderResponse): string {
    if (order.items && order.items.length > 0 && order.items[0].product) {
      return order.items[0].product.name;
    }
    return `Order ${order.orderNumber}`;
  }

  /**
   * Extract machine name from inquiry
   */
  private extractInquiryMachineName(inquiry: InquiryResponse): string {
    if (inquiry.machines && inquiry.machines.length > 0) {
      const firstMachine = inquiry.machines[0];
      if (firstMachine.machine) {
        return firstMachine.machine.articleDescription;
      } else if (firstMachine.customMachineId) {
        return `Other/Older Machine (${firstMachine.customMachineId})`;
      }
    }
    return `Inquiry ${inquiry.inquiryNumber}`;
  }

  /**
   * Count total products in inquiry
   */
  private countInquiryProducts(inquiry: InquiryResponse): number {
    return inquiry.machines?.reduce((total, machine) => {
      return total + (machine.products?.length || 0);
    }, 0) || 0;
  }

  // ============ History Mappers ============

  /**
   * Map OrderResponse to HistoryItem for inquiry history display
   */
  mapOrderToHistoryItem(order: OrderResponse): HistoryItem {
    const user = typeof order.user === 'object' ? order.user : null;
    const userName = user?.name || user?.email || 'Unknown User';
    const itemsCount = order.items ? order.items.length : 0;

    return {
      id: order.id,
      sourceId: order.id,
      type: 'Order',
      orderNumber: order.orderNumber || '-',
      dateCreated: order.createdAt,
      customer: {
        initials: this.extractUserInitials(user?.name, user?.email),
        name: userName,
        image: user?.avatar
      },
      partsOrdered: itemsCount,
      status: this.normalizeStatus(order.status)
    };
  }

  /**
   * Map InquiryResponse to HistoryItem for inquiry history display
   */
  mapInquiryToHistoryItem(inquiry: InquiryResponse): HistoryItem {
    const user = typeof inquiry.user === 'object' ? inquiry.user : null;
    const userName = user?.name || user?.email || 'Unknown User';
    const partsCount = this.countInquiryProducts(inquiry);

    return {
      id: inquiry.id,
      sourceId: inquiry.id,
      type: 'Inquiry',
      inquiryNumber: inquiry.inquiryNumber || '-',
      dateCreated: inquiry.createdAt,
      customer: {
        initials: this.extractUserInitials(user?.name, user?.email),
        name: userName,
        image: user?.avatar
      },
      partsOrdered: partsCount,
      status: this.normalizeStatus(inquiry.status)
    };
  }

  // ============ Draft Mappers ============

  /**
   * Map OrderResponse to DraftItem for draft orders display
   */
  mapOrderToDraftItem(order: OrderResponse): DraftItem {
    const formatDate = (isoDate: string): string => {
      const date = new Date(isoDate);
      return `${date.getDate().toString().padStart(2, '0')}-${
        (date.getMonth() + 1).toString().padStart(2, '0')}-${
        date.getFullYear()}`;
    };

    const user = typeof order.user === 'object' ? order.user : null;

    return {
      id: order.id,
      type: 'order',
      number: order.orderNumber,
      status: order.status,
      dateCreated: formatDate(order.createdAt),
      machine: this.extractMachineName(order),
      partsOrdered: order.items?.length || 0,
      userInitials: this.extractUserInitials(user?.name, user?.email),
      notes: order.notes || '',
      isDraft: order.status === 'draft',
      lastModified: formatDate(order.updatedAt || order.createdAt)
    };
  }

  /**
   * Map InquiryResponse to DraftItem for draft inquiries display
   */
  mapInquiryToDraftItem(inquiry: InquiryResponse): DraftItem {
    const totalProducts = this.countInquiryProducts(inquiry);
    const formatDate = (isoDate: string): string => {
      const date = new Date(isoDate);
      return `${date.getDate().toString().padStart(2, '0')}-${
        (date.getMonth() + 1).toString().padStart(2, '0')}-${
        date.getFullYear()}`;
    };

    const user = typeof inquiry.user === 'object' ? inquiry.user : null;

    return {
      id: inquiry.id,
      type: 'inquiry',
      number: inquiry.inquiryNumber,
      status: inquiry.status,
      dateCreated: formatDate(inquiry.createdAt),
      machine: this.extractInquiryMachineName(inquiry),
      partsOrdered: totalProducts,
      userInitials: this.extractUserInitials(user?.name, user?.email),
      notes: inquiry.notes || '',
      isDraft: inquiry.isDraft,
      lastModified: formatDate(inquiry.updatedAt || inquiry.createdAt)
    };
  }

  // ============ Active Inquiry Mappers ============

  /**
   * Map OrderResponse to Inquiry item for active inquiries display
   */
  mapOrderToActiveInquiry(order: OrderResponse): Inquiry {
    return {
      id: order.id,
      type: 'order',
      machine: this.extractMachineName(order),
      dateCreated: order.createdAt,
      partsOrdered: order.items?.length || 0,
      status: order.status,
      internalReference: order.id,
      orderNumber: order.orderNumber,
      onBehalfOfClientName: order.onBehalfOfClient?.name
    };
  }

  /**
   * Map InquiryResponse to Inquiry item for active inquiries display
   */
  mapInquiryToActiveInquiry(inquiry: InquiryResponse): Inquiry {
    const totalProducts = this.countInquiryProducts(inquiry);

    return {
      id: inquiry.id,
      type: 'inquiry',
      machine: this.extractInquiryMachineName(inquiry),
      dateCreated: inquiry.createdAt,
      partsOrdered: totalProducts,
      status: inquiry.status,
      internalReference: inquiry.id,
      inquiryNumber: inquiry.inquiryNumber,
      onBehalfOfClientName: inquiry.onBehalfOfClient?.name
    };
  }

  // ============ Draft List Mappers (for draft page with edit) ============

  /**
   * Map OrderResponse to DraftListItem (includes originalData for editing)
   */
  mapOrderToDraftListItem(order: OrderResponse): DraftListItem {
    const user = typeof order.user === 'object' ? order.user : null;
    const userName = user?.name || user?.email || 'Unknown User';

    return {
      id: order.id,
      dateCreated: order.createdAt,
      type: 'Order',
      internalReference: order.orderNumber || '-',
      customer: {
        initials: this.extractUserInitials(user?.name, user?.email),
        name: userName,
        avatar: user?.avatar
      },
      status: order.status || 'draft',
      originalData: order
    };
  }

  /**
   * Map InquiryResponse to DraftListItem (includes originalData for editing)
   */
  mapInquiryToDraftListItem(inquiry: InquiryResponse): DraftListItem {
    const user = typeof inquiry.user === 'object' ? inquiry.user : null;
    const userName = user?.name || user?.email || 'Unknown User';

    return {
      id: inquiry.id,
      dateCreated: inquiry.createdAt,
      type: 'Inquiry',
      internalReference: inquiry.inquiryNumber || '-',
      customer: {
        initials: this.extractUserInitials(user?.name, user?.email),
        name: userName,
        avatar: user?.avatar
      },
      status: inquiry.status || 'draft',
      originalData: inquiry
    };
  }

  // ============ Order/Inquiry Table Mappers (for activity-history component) ============

  /**
   * Map API status to OrderStatus enum for order-inquiry-table component
   */
  private mapToOrderStatus(apiStatus: string): OrderStatus {
    const normalized = apiStatus.toLowerCase();
    const mapping: { [key: string]: OrderStatus } = {
      'canceled': ORDER_STATUS.CANCELED,
      'cancelled': ORDER_STATUS.CANCELED,
      'completed': ORDER_STATUS.COMPLETED,
      'dispatched': ORDER_STATUS.DISPATCHED,
      'confirmed': ORDER_STATUS.CONFIRMED,
      'submitted': ORDER_STATUS.SUBMITTED,
      'processing': ORDER_STATUS.SUBMITTED, // Map processing to submitted
      'pending': ORDER_STATUS.SUBMITTED,
      'pending_approval': ORDER_STATUS.PENDING_APPROVAL
    };

    return mapping[normalized] || ORDER_STATUS.SUBMITTED;
  }

  /**
   * Extract customer name from order user object
   */
  private extractCustomerNameFromOrder(order: OrderResponse): string {
    const user = typeof order.user === 'object' ? order.user : null;
    return user?.name || user?.email || 'Unknown Customer';
  }

  /**
   * Extract customer name from inquiry user object
   */
  private extractCustomerNameFromInquiry(inquiry: InquiryResponse): string {
    const user = typeof inquiry.user === 'object' ? inquiry.user : null;
    return user?.name || user?.email || 'Unknown Customer';
  }

  /**
   * Get initials from a name
   */
  private getInitials(name: string): string {
    if (!name || name === 'Unknown Customer') return 'UN';

    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Map OrderResponse to OrderInquiryItem for activity history table
   */
  mapOrderToOrderInquiryItem(order: OrderResponse): OrderInquiryItem {
    const customerName = this.extractCustomerNameFromOrder(order);

    return {
      id: order.orderNumber,
      type: INQUIRY_TYPE.ORDER,
      dateCreated: order.createdAt,
      internalReferenceNumber: order.id,
      customer: {
        id: '',
        name: customerName,
        initials: this.getInitials(customerName),
        image: undefined
      },
      partsOrdered: order.items?.length || 0,
      status: this.mapToOrderStatus(order.status),
      source: 'order' as const
    };
  }

  /**
   * Map InquiryResponse to OrderInquiryItem for activity history table
   */
  mapInquiryToOrderInquiryItem(inquiry: InquiryResponse): OrderInquiryItem {
    const customerName = this.extractCustomerNameFromInquiry(inquiry);
    const partsOrdered = this.countInquiryProducts(inquiry);

    // Get user ID - handle both string IRI and object formats
    let userId = '';
    if (typeof inquiry.user === 'string') {
      userId = inquiry.user.split('/').pop() || '';
    } else if (inquiry.user && typeof inquiry.user === 'object' && 'id' in inquiry.user) {
      userId = inquiry.user.id || '';
    }

    return {
      id: inquiry.inquiryNumber,
      type: INQUIRY_TYPE.INQUIRY,
      dateCreated: inquiry.createdAt,
      internalReferenceNumber: inquiry.id,
      customer: {
        id: userId,
        name: customerName,
        initials: this.getInitials(customerName),
        image: undefined
      },
      partsOrdered: partsOrdered,
      status: this.mapToOrderStatus(inquiry.status),
      source: 'inquiry' as const
    };
  }
}
