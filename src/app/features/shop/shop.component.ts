import { Component, OnInit, OnDestroy, HostListener, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '@env/environment';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { ProductCardComponent } from '@shared/components/product/product-card/product-card.component';
import { ArticleItemComponent } from '@shared/components/product/article-item/article-item.component';
import { ProductService } from '@services/http/product.service';
import { CartService } from '@services/cart/cart.service';
import { AuthService } from '@core/auth/auth.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';
import { ManagedClientResponse } from '@core/services/http/agent.service';
import { Breadcrumb, Product } from '@core/models';
import { MachineType } from '@core/models';
import { IconComponent } from '@shared/components/icon/icon.component';
import { AgentClientSelectComponent } from '@shared/components/agent-client-select/agent-client-select.component';
import { ArticleItemShimmerComponent } from '@shared/components/product/article-item/article-item-shimmer.component';
import { ProductCardShimmerComponent } from '@shared/components/product/product-card/product-card-shimmer.component';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-shop',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbsComponent,
    ProductCardComponent,
    ArticleItemComponent,
    IconComponent,
    AgentClientSelectComponent,
    ArticleItemShimmerComponent,
    ProductCardShimmerComponent,
  ],
  templateUrl: 'shop.component.html',
  styleUrls: ['shop.component.scss']
})
export class ShopComponent implements OnInit, OnDestroy {
  environment = environment;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProduct: Product | null = null;
  relatedProducts: Product[] = [];
  loading = true;
  error: string | null = null;
  viewMode: 'grid' | 'list' = 'list';
  totalItems = 0;
  clientName: string = '';
  isProductDetailsLoading = false;
  isListProductDetailsLoading = false;

  isAgent = false;
  selectedAgentClients: ManagedClientResponse[] = [];
  cartClientBadges: { clientName: string; clientCode: string; itemCount: number; items: { partNo: string; shortDescription: string; quantity: number }[] }[] = [];

  searchControl = new FormControl('');
  discountedControl = new FormControl(false);
  quantityControl = new FormControl(1);

  machines: MachineType[] = [];
  isFilterOpen = false;
  activeFilters: string[] = [];
  breadcrumbs: Breadcrumb[] = [
    { label: 'Shop' },
    { label: 'All Parts', link: '/shop' },
  ];

  private destroyRef = inject(DestroyRef);
  private logger!: ScopedLogger;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private agentClientSelectionService: AgentClientSelectionService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('ShopComponent');
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => this.onSearchChange(value || ''));

    this.discountedControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.applyLocalFilters());

    // Get the client name if available
    const clientInfo = this.authService.getClientInfo();
    if (clientInfo) {
      this.clientName = clientInfo.name;

      // Update breadcrumbs with the client name
      this.breadcrumbs = [
        { label: 'Shop' },
        { label: 'All Parts', link: '/shop' },
      ];
    }
  }

  ngOnInit(): void {
    // Check if user is an agent
    const user = this.authService.getCurrentUser();
    this.isAgent = user?.roles?.includes('ROLE_USER_CLIENT_AGENT') || false;

    // Restore agent client selection if available
    if (this.isAgent) {
      const savedClient = this.agentClientSelectionService.getSelectedClient();
      if (savedClient) {
        this.selectedAgentClients = [savedClient];
      }

      // Subscribe to cart changes to build client badges with item details
      this.cartService.getCartItems()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(items => {
          const grouped = new Map<string, typeof this.cartClientBadges[0]>();
          for (const item of items) {
            if (item.clientId) {
              if (!grouped.has(item.clientId)) {
                grouped.set(item.clientId, {
                  clientName: item.clientName || 'Unknown',
                  clientCode: item.clientCode || '',
                  itemCount: 0,
                  items: []
                });
              }
              const group = grouped.get(item.clientId)!;
              group.itemCount += item.quantity;
              group.items.push({
                partNo: item.product.partNo || '',
                shortDescription: item.product.shortDescription || item.product.name || '',
                quantity: item.quantity
              });
            }
          }
          this.cartClientBadges = Array.from(grouped.values());
        });
    }

    // First load products
    this.loadProducts();

    // Then subscribe to selected product ID from search
    this.productService.selectedProductId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(productId => {
        if (productId && typeof productId === 'string') {
          // Wait a bit to ensure products are loaded
          setTimeout(() => {
            if (this.products.length > 0) {
              this.selectProductById(productId);
            } else {
              // If products aren't loaded yet, store the ID to check later
              this.logger.debug('Products not loaded yet, will check after loading');
            }
          }, 100);
        }
      });
  }

  ngOnDestroy(): void {
    // Clear any selected product ID when leaving the shop
    this.productService.clearSelectedProductId();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const filterElement = document.querySelector('.shop__machine-filter');
    if (!filterElement?.contains(event.target as Node)) {
      this.isFilterOpen = false;
    }
  }

  private selectProductById(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      // Select the product
      this.selectProduct(product);

      // Clear the selected product ID so it doesn't persist
      this.productService.clearSelectedProductId();

      // Scroll to top to show the selected product
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Product not found
      this.logger.warn('Product not found in current product list', { productId });
      this.productService.clearSelectedProductId();
    }
  }

  private loadInitialProducts(): void {
    // Preserve current search term when reloading
    const currentSearch = this.searchControl.value?.trim() || undefined;
    this.loadProducts(currentSearch);
  }

  private loadProducts(search?: string): void {
    this.loading = true;
    this.totalItems = 0;

    // Load products with optional search
    this.logger.debug('Loading products', { search });
    this.productService.getProducts({ search: search || undefined }).subscribe({
      next: (response) => {
        this.logger.debug('Product response received', { productCount: response.member.length });
        // Deduplicate products by id to avoid duplicate key errors in @for loops
        this.products = this.deduplicateProducts(response.member);
        this.totalItems = response.totalItems;

        // Apply local filters (machine, discount) after loading
        this.applyLocalFilters();

        // Only extract machines on initial load (when no search)
        if (!search) {
          this.extractMachinesFromProducts(this.products);
        }

        this.loading = false;

        // Check if there's a selected product ID after loading
        const selectedProductId = this.productService.getSelectedProductId();
        if (selectedProductId) {
          this.selectProductById(selectedProductId);
        }
      },
      error: (err) => {
        this.error = 'Failed to load products. Please try again later.';
        this.loading = false;
        this.logger.error('Error loading products', err);
      }
    });
  }

  /**
   * Handle search input change - calls API with search term
   */
  private onSearchChange(searchTerm: string): void {
    this.loadProducts(searchTerm.trim());
  }

  private extractMachinesFromProducts(products: Product[]): void {
    const machineMap = new Map<string, MachineType>();

    products.forEach(product => {
      if (product.machines && Array.isArray(product.machines)) {
        product.machines.forEach(machine => {
          if (machine.articleDescription && !machineMap.has(machine.articleDescription)) {
            machineMap.set(machine.articleDescription, {
              id: machine.id,
              name: machine.articleDescription,
              checked: false
            });
          }
        });
      }
    });

    this.machines = Array.from(machineMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    this.logger.debug('Extracted machines', { machineCount: this.machines.length });
  }

  /**
   * Check if a product has a discount
   * @param product The product
   * @returns True if the product has a discount
   */
  hasDiscount(product: Product): boolean {
    // If discountPercentage is explicitly set and not null
    if (product.discountPercentage !== undefined && product.discountPercentage !== null) {
      return true;
    }

    // If both regularPrice and clientPrice are available and different
    if (product.regularPrice !== undefined && product.clientPrice !== undefined) {
      return product.regularPrice > product.clientPrice && product.regularPrice > 0;
    }

    return false;
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;

    if (this.viewMode === 'grid') {
      this.isProductDetailsLoading = true;
    } else {
      this.isListProductDetailsLoading = true;
    }

    if (product) {
      // Update breadcrumbs with the client name if available
      if (this.clientName) {
        this.breadcrumbs = [
          { label: 'Shop', link: '/shop' },
          { label: 'All Parts', link: '/shop' },
          { label: product.name }
        ];
      } else {
        this.breadcrumbs = [
          { label: 'Shop', link: '/shop' },
          { label: 'All Parts', link: '/shop' },
          { label: product.name }
        ];
      }

      // Filter related products based on matching machineText
      this.relatedProducts = this.products
        .filter(p => {
          // Exclude the current product
          if (p.id === product.id) return false;

          // If the selected product has machineText, filter by matching machineText
          if (product.machineText && product.machineText.trim()) {
            return p.machineText === product.machineText;
          }

          // If no machineText, return all other products (fallback behavior)
          return true;
        })
        .slice(0, 6);

      // Reset quantity when selecting a new product
      this.quantityControl.setValue(1);

      // Simulate loading time using setTimeout
      setTimeout(() => {
        if (this.viewMode === 'grid') {
          this.isProductDetailsLoading = false;
        } else {
          this.isListProductDetailsLoading = false;
        }
      }, 300);
    }
  }

  closeDetails(): void {
    this.selectedProduct = null;

    // Reset breadcrumbs with the client name if available
    if (this.clientName) {
      this.breadcrumbs = [
        { label: 'Shop', link: '/shop' },
        { label: `${this.clientName} Products`, link: '/shop/machines' }
      ];
    } else {
      this.breadcrumbs = [
        { label: 'Shop', link: '/shop' },
        { label: 'All machines', link: '/shop/machines' }
      ];
    }
  }

  removeFilter(filter: string): void {
    // Remove from activeFilters
    this.activeFilters = this.activeFilters.filter(f => f !== filter);

    // Update machine checked state
    const machine = this.machines.find(m => m.name === filter);
    if (machine) {
      machine.checked = false;
    }

    // If no active filters remain, reload initial products
    if (this.activeFilters.length === 0) {
      this.loadInitialProducts();
    } else {
      this.applyLocalFilters();
    }
  }

  incrementQuantity(): void {
    this.quantityControl.setValue(this.quantityControl.value! + 1);
  }

  decrementQuantity(): void {
    if (this.quantityControl.value! > 1) {
      this.quantityControl.setValue(this.quantityControl.value! - 1);
    }
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  toggleMachine(machine: MachineType): void {
    machine.checked = !machine.checked;

    if (machine.checked) {
      // Add to activeFilters if not already present
      if (!this.activeFilters.includes(machine.name)) {
        this.activeFilters.push(machine.name);
      }
    } else {
      // Remove from activeFilters
      this.activeFilters = this.activeFilters.filter(filter => filter !== machine.name);
    }

    // Check if all machines are unchecked
    const hasAnyCheckedMachine = this.machines.some(m => m.checked);

    if (!hasAnyCheckedMachine && this.activeFilters.length === 0) {
      // All checkboxes are unchecked, reset to initial state
      this.loadInitialProducts();
    } else {
      // Apply filters normally
      this.applyLocalFilters();
    }
  }

  onAgentClientSelected(client: ManagedClientResponse): void {
    const currentClient = this.agentClientSelectionService.getSelectedClient();

    // If switching from a different client that has items in cart, show alert
    if (currentClient && currentClient.id !== client.id) {
      const currentClientBadge = this.cartClientBadges.find(b => b.clientName === currentClient.name);
      if (currentClientBadge && currentClientBadge.itemCount > 0) {
        const confirmed = confirm(
          `You have ${currentClientBadge.itemCount} product(s) in the cart for "${currentClient.name}". ` +
          `Switching to "${client.name}" will not remove those items, but new products will be added for the new client.\n\n` +
          `Continue?`
        );
        if (!confirmed) {
          return;
        }
      }
    }

    this.selectedAgentClients = [client];
    this.agentClientSelectionService.selectClient(client);
    this.loadProducts();
  }

  onAgentClientDeselected(client: ManagedClientResponse): void {
    this.selectedAgentClients = this.selectedAgentClients.filter(c => c.id !== client.id);
    if (this.selectedAgentClients.length === 0) {
      this.agentClientSelectionService.clearSelection();
    }
  }

  addSelectedProductToCart(): void {
    if (this.selectedProduct) {
      const quantity = this.quantityControl.value || 1;

      // Read selected client from the selection service (single source of truth)
      const selectedClient = this.agentClientSelectionService.getSelectedClient();
      const client = selectedClient ? {
        id: selectedClient.id,
        name: selectedClient.name,
        code: selectedClient.code
      } : undefined;

      // CartService blocks agents without a client selection
      this.cartService.addToCart(this.selectedProduct, quantity, client);

      // Reset quantity after adding to cart
      this.quantityControl.setValue(1);
    }
  }

  private applyLocalFilters(): void {
    // Local filtering for machine and discount filters only
    // Search is handled via API
    let filtered = this.products;

    // Apply machine filters
    if (this.activeFilters.length > 0) {
      filtered = filtered.filter(product => {
        if (!product.machines || !Array.isArray(product.machines)) {
          return false;
        }
        return product.machines.some(machine =>
          this.activeFilters.includes(machine.articleDescription)
        );
      });
    }

    if (this.discountedControl.value) {
      // Filter products with discounts
      filtered = filtered.filter(product => this.hasDiscount(product));
    }

    this.filteredProducts = filtered;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private deduplicateProducts(products: Product[]): Product[] {
    const seenIds = new Set<string>();
    const seenPartNos = new Set<string>();
    return products.filter(product => {
      // Check by ID first
      if (seenIds.has(product.id)) {
        return false;
      }
      // Also check by partNo to catch duplicates with different IDs
      if (product.partNo && seenPartNos.has(product.partNo)) {
        return false;
      }
      seenIds.add(product.id);
      if (product.partNo) {
        seenPartNos.add(product.partNo);
      }
      return true;
    });
  }
}
