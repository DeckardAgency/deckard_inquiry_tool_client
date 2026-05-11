export interface Inquiry {
  id: string;
  machine?: string; // Optional to accommodate different use cases
  dateCreated: string;
  partsOrdered: number;
  status: string;
  internalReference?: string;
  type?: 'order' | 'inquiry';
  orderNumber?: string;
  inquiryNumber?: string;
  onBehalfOfClientName?: string;
}


export interface InquiryHistory {
  id: string;
  type?: 'Order' | 'Inquiry';
  orderNumber?: string;
  inquiryNumber?: string;
  dateCreated: string;
  customer: {
    initials: string;
    name: string;
    image?: string;
  };
  partsOrdered: number;
  status: 'Completed' | 'Accepted' | 'Confirmed' | 'Processing' | 'Cancelled' | 'Submitted' | 'In Review' | 'More Info' | 'Information Provided' | 'In Progress' | 'Dispatched' | 'Pending Approval';
}
