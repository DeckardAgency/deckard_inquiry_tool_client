import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Import shared business components
import { ArticleItemComponent } from '@shared/components/product/article-item/article-item.component';
import { ProductCardComponent } from '@shared/components/product/product-card/product-card.component';
import { InquiryCardComponent } from '@shared/components/inquiry-card/inquiry-card.component';
import { MachineArticleItemComponent } from '@shared/components/machine/machine-article-item/machine-article-item.component';
import { CartNotificationComponent } from '@shared/components/notifications/cart-notification/cart-notification.component';
import { CartSwitcherComponent } from '@shared/components/cart-switcher/cart-switcher.component';
// Modals
import { SupportModalComponent } from '@shared/components/modals/support-modal/support-modal.component';
import { LoginModalComponent } from '@shared/components/modals/login-modal/login-modal.component';
import { InquiryModalComponent } from '@shared/components/modals/inquiry-modal/inquiry-modal.component';
// Models
import { Product } from '@core/models/product.model';
import { Inquiry } from '@core/models/inquiry.model';
import { Machine } from '@core/models/machine.model';

// Import all UI Kit components
import {
  // Atoms
  ButtonComponent,
  IconComponent,
  InputComponent,
  TextareaComponent,
  BadgeComponent,
  ShimmerComponent,
  SpinnerComponent,
  AvatarComponent,
  CheckboxComponent,
  SelectComponent,
  DividerComponent,
  LinkComponent,
  ToggleComponent,
  // Molecules
  FormFieldComponent,
  CardComponent,
  ToastComponent,
  TabsComponent,
  DropdownComponent,
  FileUploadComponent,
  BreadcrumbsComponent,
  EmptyStateComponent,
  PaginationComponent,
  SearchComponent,
  CalendarComponent,
  CarouselComponent,
  QuantitySelectorComponent,
  PriceDisplayComponent,
  AccordionComponent,
  AccordionItemComponent,
  // Organisms
  ModalComponent,
  DataTableComponent,
  CardGridComponent,
  DrawerComponent,
  // Types
  type SearchSuggestion,
  type CarouselSlide,
  type DropdownItem,
  type BreadcrumbItem,
  type TabItem,
  type SelectOption,
  type TableColumn
} from '@app/ui-kit';

interface ComponentSection {
  id: string;
  title: string;
  type: 'atoms' | 'molecules' | 'organisms' | 'shared' | 'modals';
}

@Component({
  selector: 'app-ui-kit-docs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // Atoms
    ButtonComponent,
    IconComponent,
    InputComponent,
    TextareaComponent,
    BadgeComponent,
    ShimmerComponent,
    SpinnerComponent,
    AvatarComponent,
    CheckboxComponent,
    SelectComponent,
    DividerComponent,
    LinkComponent,
    ToggleComponent,
    // Molecules
    FormFieldComponent,
    CardComponent,
    ToastComponent,
    TabsComponent,
    DropdownComponent,
    FileUploadComponent,
    BreadcrumbsComponent,
    EmptyStateComponent,
    PaginationComponent,
    SearchComponent,
    CalendarComponent,
    CarouselComponent,
    QuantitySelectorComponent,
    PriceDisplayComponent,
    AccordionComponent,
    AccordionItemComponent,
    // Organisms
    ModalComponent,
    DataTableComponent,
    CardGridComponent,
    DrawerComponent,
    // Shared Business Components
    ArticleItemComponent,
    ProductCardComponent,
    InquiryCardComponent,
    MachineArticleItemComponent,
    CartNotificationComponent,
    CartSwitcherComponent,
    // Modals
    SupportModalComponent,
    LoginModalComponent,
    InquiryModalComponent
  ],
  templateUrl: './ui-kit-docs.component.html',
  styleUrls: ['./ui-kit-docs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiKitDocsComponent {
  // Navigation
  activeSection = 'button';
  sections: ComponentSection[] = [
    // Atoms
    { id: 'button', title: 'Button', type: 'atoms' },
    { id: 'icon', title: 'Icon', type: 'atoms' },
    { id: 'input', title: 'Input', type: 'atoms' },
    { id: 'textarea', title: 'Textarea', type: 'atoms' },
    { id: 'badge', title: 'Badge', type: 'atoms' },
    { id: 'shimmer', title: 'Shimmer', type: 'atoms' },
    { id: 'spinner', title: 'Spinner', type: 'atoms' },
    { id: 'avatar', title: 'Avatar', type: 'atoms' },
    { id: 'checkbox', title: 'Checkbox', type: 'atoms' },
    { id: 'select', title: 'Select', type: 'atoms' },
    { id: 'divider', title: 'Divider', type: 'atoms' },
    { id: 'link', title: 'Link', type: 'atoms' },
    { id: 'toggle', title: 'Toggle', type: 'atoms' },
    // Molecules
    { id: 'form-field', title: 'Form Field', type: 'molecules' },
    { id: 'card', title: 'Card', type: 'molecules' },
    { id: 'toast', title: 'Toast', type: 'molecules' },
    { id: 'tabs', title: 'Tabs', type: 'molecules' },
    { id: 'dropdown', title: 'Dropdown', type: 'molecules' },
    { id: 'file-upload', title: 'File Upload', type: 'molecules' },
    { id: 'breadcrumbs', title: 'Breadcrumbs', type: 'molecules' },
    { id: 'empty-state', title: 'Empty State', type: 'molecules' },
    { id: 'pagination', title: 'Pagination', type: 'molecules' },
    { id: 'search', title: 'Search', type: 'molecules' },
    { id: 'calendar', title: 'Calendar', type: 'molecules' },
    { id: 'carousel', title: 'Carousel', type: 'molecules' },
    { id: 'quantity-selector', title: 'Quantity Selector', type: 'molecules' },
    { id: 'price-display', title: 'Price Display', type: 'molecules' },
    { id: 'accordion', title: 'Accordion', type: 'molecules' },
    // Organisms
    { id: 'modal', title: 'Modal', type: 'organisms' },
    { id: 'data-table', title: 'Data Table', type: 'organisms' },
    { id: 'card-grid', title: 'Card Grid', type: 'organisms' },
    { id: 'drawer', title: 'Drawer', type: 'organisms' },
    // Shared Business Components
    { id: 'article-item', title: 'Article Item', type: 'shared' },
    { id: 'product-card', title: 'Product Card', type: 'shared' },
    { id: 'inquiry-card', title: 'Inquiry Card', type: 'shared' },
    { id: 'machine-article-item', title: 'Machine Article Item', type: 'shared' },
    { id: 'cart-notification', title: 'Cart Notification', type: 'shared' },
    { id: 'cart-switcher', title: 'Cart Switcher', type: 'shared' },
    // Modals
    { id: 'support-modal', title: 'Support Modal', type: 'modals' },
    { id: 'login-modal', title: 'Login Modal', type: 'modals' },
    { id: 'inquiry-modal', title: 'Inquiry Modal', type: 'modals' }
  ];

  // Demo states
  inputValue = '';
  textareaValue = '';
  checkboxChecked = false;
  selectedOption = '';
  selectedDate: Date | null = null;
  isModalOpen = false;
  isDrawerOpen = false;
  currentPage = 1;
  toggleChecked = false;
  quantity = 1;

  // Demo data
  selectOptions: SelectOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4', disabled: true }
  ];

  dropdownItems: DropdownItem[] = [
    { id: '1', label: 'Edit', icon: 'edit' },
    { id: '2', label: 'Duplicate', icon: 'copy' },
    { id: '3', label: 'Archive', icon: 'archive' },
    { id: 'divider', label: '', divider: true },
    { id: '4', label: 'Delete', icon: 'trash', danger: true }
  ];

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', route: '/' },
    { label: 'Products', route: '/products' },
    { label: 'Category', route: '/products/category' },
    { label: 'Current Item' }
  ];

  tabItems: TabItem[] = [
    { id: 'tab1', label: 'Overview', icon: 'home' },
    { id: 'tab2', label: 'Details', icon: 'file' },
    { id: 'tab3', label: 'Settings', icon: 'settings' },
    { id: 'tab4', label: 'Disabled', disabled: true }
  ];

  searchSuggestions: SearchSuggestion[] = [
    { id: '1', label: 'Machine XYZ-100', description: 'Serial: 12345', icon: 'settings', type: 'machine' },
    { id: '2', label: 'Spare Part ABC', description: 'Part number: ABC-001', icon: 'package', type: 'product' },
    { id: '3', label: 'Order #5678', description: 'Pending delivery', icon: 'shopping-cart', type: 'order' }
  ];

  carouselSlides: CarouselSlide[] = [
    { id: 1, imageUrl: 'https://picsum.photos/800/400?random=1', title: 'Slide 1', description: 'First slide description' },
    { id: 2, imageUrl: 'https://picsum.photos/800/400?random=2', title: 'Slide 2', description: 'Second slide description' },
    { id: 3, imageUrl: 'https://picsum.photos/800/400?random=3', title: 'Slide 3', description: 'Third slide description' }
  ];

  tableColumns: TableColumn<Record<string, unknown>>[] = [
    { key: 'id', label: 'ID', sortable: true, width: '80px' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'date', label: 'Date', sortable: true }
  ];

  tableData = [
    { id: 1, name: 'Item One', status: 'Active', date: '2024-01-15' },
    { id: 2, name: 'Item Two', status: 'Pending', date: '2024-01-16' },
    { id: 3, name: 'Item Three', status: 'Completed', date: '2024-01-17' },
    { id: 4, name: 'Item Four', status: 'Active', date: '2024-01-18' },
    { id: 5, name: 'Item Five', status: 'Inactive', date: '2024-01-19' }
  ];

  cardGridItems = [
    { id: 1, title: 'Card 1', description: 'Description for card 1' },
    { id: 2, title: 'Card 2', description: 'Description for card 2' },
    { id: 3, title: 'Card 3', description: 'Description for card 3' },
    { id: 4, title: 'Card 4', description: 'Description for card 4' },
    { id: 5, title: 'Card 5', description: 'Description for card 5' },
    { id: 6, title: 'Card 6', description: 'Description for card 6' }
  ];

  iconList = [
    'home', 'search', 'settings', 'user', 'users', 'mail', 'phone', 'calendar',
    'clock', 'check', 'close', 'plus', 'minus', 'edit', 'trash', 'copy',
    'download', 'upload', 'file', 'folder', 'image', 'link', 'eye', 'eye-off',
    'lock', 'unlock', 'star', 'heart', 'bell', 'filter', 'sort', 'refresh',
    'chevron-left', 'chevron-right', 'chevron-up', 'chevron-down', 'arrow-left',
    'arrow-right', 'arrow-up', 'arrow-down', 'external-link', 'menu', 'more-vertical',
    'info', 'warning', 'error', 'success', 'help', 'logout', 'login'
  ];

  // Mock data for shared business components
  mockProduct: Product = {
    '@id': '/api/products/1',
    '@type': 'Product',
    id: '1',
    name: 'Bearing Assembly Kit',
    slug: 'bearing-assembly-kit',
    partNo: 'BAK-2024-001',
    shortDescription: 'High-precision bearing assembly for RX Series',
    technicalDescription: 'Premium grade bearing assembly with integrated seals and pre-lubrication for extended service life.',
    statistic: 'S-12345',
    machineText: 'RX 4.0 / RX 6.0',
    unit: 'PCS',
    regularPrice: 1249.99,
    clientPrice: 999.99,
    weight: '2.5 kg',
    featuredImage: null,
    imageGallery: [],
    machines: []
  };

  mockProducts: Product[] = [
    this.mockProduct,
    {
      '@id': '/api/products/2',
      '@type': 'Product',
      id: '2',
      name: 'Filter Element',
      slug: 'filter-element',
      partNo: 'FE-2024-042',
      shortDescription: 'Replacement filter for hydraulic system',
      technicalDescription: 'High-efficiency filtration element with 10 micron rating.',
      statistic: 'S-54321',
      machineText: 'All Models',
      unit: 'PCS',
      regularPrice: 89.99,
      clientPrice: 79.99,
      weight: '0.3 kg',
      featuredImage: null,
      imageGallery: [],
      machines: []
    }
  ];

  mockInquiries: Inquiry[] = [
    {
      id: '1',
      type: 'order',
      orderNumber: '2024-00156',
      dateCreated: '2024-01-15T10:30:00Z',
      partsOrdered: 5,
      status: 'Processing',
      internalReference: 'PO-2024-001'
    },
    {
      id: '2',
      type: 'inquiry',
      inquiryNumber: 'INQ-2024-089',
      dateCreated: '2024-01-14T14:20:00Z',
      partsOrdered: 3,
      status: 'Submitted',
      internalReference: 'REQ-2024-042'
    },
    {
      id: '3',
      type: 'order',
      orderNumber: '2024-00142',
      dateCreated: '2024-01-10T09:15:00Z',
      partsOrdered: 12,
      status: 'Completed'
    }
  ];

  selectedArticle: Product | null = null;
  selectedMachine: Machine | null = null;

  // Mock Machine data
  mockMachines: Machine[] = [
    {
      '@id': '/api/machines/1',
      '@type': 'Machine',
      id: '1',
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      ibStationNumber: 1001,
      ibSerialNumber: 12345,
      articleNumber: 'RX-4.0-2020',
      articleDescription: 'RX 4.0 Recycling Line',
      orderNumber: 'ORD-2020-001',
      kmsIdentificationNumber: 'KMS-001',
      kmsIdNumber: 'KID-001',
      mcNumber: 'MC-001',
      fiStationNumber: 2001,
      fiSerialNumber: 54321,
      featuredImage: null,
      imageGallery: [],
      name: 'RX 4.0 Recycling Line',
      documents: [],
      products: []
    },
    {
      '@id': '/api/machines/2',
      '@type': 'Machine',
      id: '2',
      createdAt: '2022-06-01T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
      ibStationNumber: 1002,
      ibSerialNumber: 67890,
      articleNumber: 'SL-800-2022',
      articleDescription: 'Starlink 800 Conversion Line',
      orderNumber: 'ORD-2022-042',
      kmsIdentificationNumber: 'KMS-002',
      kmsIdNumber: 'KID-002',
      mcNumber: 'MC-002',
      fiStationNumber: 2002,
      fiSerialNumber: 98765,
      featuredImage: null,
      imageGallery: [],
      name: 'Starlink 800',
      documents: [],
      products: []
    }
  ];

  // Notification state
  showCartNotification = false;
  cartNotificationType: 'success' | 'remove' = 'success';
  cartNotificationMessage = 'Product added to cart successfully!';

  // Modal states
  isSupportModalOpen = false;
  isLoginModalOpen = false;
  isInquiryModalOpen = false;

  get atomSections(): ComponentSection[] {
    return this.sections.filter(s => s.type === 'atoms');
  }

  get moleculeSections(): ComponentSection[] {
    return this.sections.filter(s => s.type === 'molecules');
  }

  get organismSections(): ComponentSection[] {
    return this.sections.filter(s => s.type === 'organisms');
  }

  get sharedSections(): ComponentSection[] {
    return this.sections.filter(s => s.type === 'shared');
  }

  get modalSections(): ComponentSection[] {
    return this.sections.filter(s => s.type === 'modals');
  }

  scrollTo(sectionId: string): void {
    this.activeSection = sectionId;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onButtonClick(): void {
    console.log('Button clicked!');
  }

  onSearch(query: string): void {
    console.log('Search:', query);
  }

  onDateSelect(date: Date): void {
    this.selectedDate = date;
    console.log('Date selected:', date);
  }

  onFileSelect(files: File[]): void {
    console.log('Files selected:', files);
  }

  onTabChange(tabId: string): void {
    console.log('Tab changed:', tabId);
  }

  onDropdownSelect(item: DropdownItem): void {
    console.log('Dropdown item selected:', item);
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  openDrawer(): void {
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
  }

  onArticleSelect(product: Product): void {
    this.selectedArticle = product;
    console.log('Article selected:', product);
  }

  onMachineSelect(machine: Machine): void {
    this.selectedMachine = machine;
    console.log('Machine selected:', machine);
  }

  // Cart notification methods
  showSuccessNotification(): void {
    this.cartNotificationType = 'success';
    this.cartNotificationMessage = 'Product added to cart successfully!';
    this.showCartNotification = true;
  }

  showRemoveNotification(): void {
    this.cartNotificationType = 'remove';
    this.cartNotificationMessage = 'Product removed from cart.';
    this.showCartNotification = true;
  }

  onCartNotificationClose(): void {
    this.showCartNotification = false;
  }

  onViewCart(): void {
    this.showCartNotification = false;
    console.log('View cart clicked');
  }

  // Modal methods
  openSupportModal(): void {
    this.isSupportModalOpen = true;
  }

  openLoginModal(): void {
    this.isLoginModalOpen = true;
  }

  openInquiryModal(): void {
    this.isInquiryModalOpen = true;
  }

  trackBySection(index: number, section: ComponentSection): string {
    return section.id;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
