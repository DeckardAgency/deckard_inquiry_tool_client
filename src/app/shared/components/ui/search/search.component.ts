import { Component, OnInit, HostListener, ElementRef, ViewChild, ChangeDetectionStrategy, inject, DestroyRef, ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchService, SearchResultItem, SearchResults, RecentSearch, SearchFilterType } from '@core/services/search.service';
import { ProductService } from '@services/http/product.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';

/**
 * Pipe to highlight search terms in text
 */
@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string | undefined | null, searchTerm: string): SafeHtml {
    if (!searchTerm || !text) {
      return text || '';
    }

    // Escape special regex characters in search term
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    const highlighted = text.replace(regex, '<mark class="search__highlight">$1</mark>');

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, HighlightPipe],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;

  searchQuery: string = '';
  showResults: boolean = false;
  showRecentSearches: boolean = false;
  minSearchLength: number = 2;
  searchPlaceholder: string = 'Search';
  isLoading: boolean = false;

  searchResults: SearchResultItem[] = [];
  filteredResults: SearchResultItem[] = [];
  recentSearches: RecentSearch[] = [];
  activeIndex: number = 0;
  activeFilter: SearchFilterType = 'all';

  // Counts for different types
  machineCounts: number = 0;
  productCounts: number = 0;
  orderCounts: number = 0;
  inquiryCounts: number = 0;

  // Skeleton loading items
  skeletonItems = Array(5).fill(0);

  private searchSubject = new Subject<string>();
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private logger!: ScopedLogger;

  constructor(
    private router: Router,
    private elementRef: ElementRef,
    private searchService: SearchService,
    private productService: ProductService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('SearchComponent');
    this.setSearchPlaceholder();
  }

  ngOnInit(): void {
    // Load recent searches
    this.recentSearches = this.searchService.getRecentSearches();

    // Set up debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < this.minSearchLength) {
          this.showResults = false;
          this.cdr.markForCheck();
          return [];
        }
        this.isLoading = true;
        this.showResults = true;
        this.cdr.markForCheck();
        return this.searchService.searchAll(query);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (results: SearchResults) => {
        this.handleSearchResults(results);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.showResults = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Search functionality
  search(): void {
    this.showRecentSearches = false;
    this.searchSubject.next(this.searchQuery);
  }

  private handleSearchResults(results: SearchResults): void {
    // Combine all results
    this.searchResults = [
      ...results.machines,
      ...results.products,
      ...results.orders,
      ...results.inquiries
    ];

    // Update counts
    this.machineCounts = results.totalMachines;
    this.productCounts = results.totalProducts;
    this.orderCounts = results.totalOrders;
    this.inquiryCounts = results.totalInquiries;

    // Apply filter
    this.applyFilter();

    // Show results if we have any
    if (this.searchResults.length > 0) {
      this.showResults = true;
      this.activeIndex = 0;

      // Save to recent searches
      this.searchService.addRecentSearch(this.searchQuery);
      this.recentSearches = this.searchService.getRecentSearches();
    } else {
      this.showResults = true; // Still show "no results" message
    }
  }

  // Filter functionality
  setFilter(filter: SearchFilterType): void {
    this.activeFilter = filter;
    this.applyFilter();
    this.activeIndex = 0;
    this.cdr.markForCheck();
  }

  private applyFilter(): void {
    if (this.activeFilter === 'all') {
      this.filteredResults = [...this.searchResults];
    } else {
      this.filteredResults = this.searchResults.filter(r => r.type === this.activeFilter);
    }
  }

  getFilterCount(filter: SearchFilterType): number {
    switch (filter) {
      case 'machine': return this.machineCounts;
      case 'product': return this.productCounts;
      case 'order': return this.orderCounts;
      case 'inquiry': return this.inquiryCounts;
      case 'all': return this.machineCounts + this.productCounts + this.orderCounts + this.inquiryCounts;
      default: return 0;
    }
  }

  // Recent searches functionality
  onInputFocus(): void {
    if (!this.searchQuery && this.recentSearches.length > 0) {
      this.showRecentSearches = true;
      this.showResults = false;
      this.cdr.markForCheck();
    }
  }

  selectRecentSearch(search: RecentSearch): void {
    this.searchQuery = search.query;
    this.showRecentSearches = false;
    this.search();
  }

  clearRecentSearches(): void {
    this.searchService.clearRecentSearches();
    this.recentSearches = [];
    this.showRecentSearches = false;
    this.cdr.markForCheck();
  }

  selectResult(result: SearchResultItem): void {
    this.logger.debug('Selected:', result);
    this.showResults = false;
    this.showRecentSearches = false;
    this.searchQuery = '';

    // Check if it's a product result
    if (result.type === 'product' && result.id) {
      // Store the selected product ID in ProductService
      this.productService.setSelectedProductId(result.id);

      // Navigate to shop page
      this.router.navigate(['/shop']);
    } else if (result.type === 'machine' && result.id) {
      // For machine results, navigate to appropriate page
      this.router.navigate(['/my-machines']);
    } else if (result.type === 'order' && result.id) {
      // For order results, navigate to order details
      this.router.navigate(['/my-inquiries/active/order', result.id, 'view']);
    } else if (result.type === 'inquiry' && result.id) {
      // For inquiry results, navigate to inquiry view
      this.router.navigate(['/manual-entry', result.id, 'view']);
    } else {
      // Fallback to the route property if available
      this.router.navigate([result.route]);
    }

    this.cdr.markForCheck();
  }

  selectByIndex(index: number): void {
    if (index >= 0 && index < this.filteredResults.length) {
      this.selectResult(this.filteredResults[index]);
    }
  }

  focusSearchInput(): void {
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.focus();
    }
  }

  // Keyboard event handlers
  @HostListener('document:keydown', ['$event'])
  handleShortcut(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.focusSearchInput();
    }
  }

  @HostListener('document:keydown.arrowup', ['$event'])
  handleArrowUp(event: KeyboardEvent) {
    if (this.showRecentSearches && this.recentSearches.length > 0) {
      event.preventDefault();
      // Handle navigation in recent searches
      return;
    }

    if (!this.showResults || this.filteredResults.length === 0) return;

    event.preventDefault();
    if (this.activeIndex > 0) {
      this.activeIndex--;
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:keydown.arrowdown', ['$event'])
  handleArrowDown(event: KeyboardEvent) {
    if (this.showRecentSearches && this.recentSearches.length > 0) {
      event.preventDefault();
      // Handle navigation in recent searches
      return;
    }

    if (!this.showResults || this.filteredResults.length === 0) return;

    event.preventDefault();
    if (this.activeIndex < this.filteredResults.length - 1) {
      this.activeIndex++;
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:keydown.enter', ['$event'])
  handleEnterKey(event: KeyboardEvent) {
    if (!this.showResults || this.filteredResults.length === 0) return;

    event.preventDefault();
    this.selectByIndex(this.activeIndex);
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey() {
    this.showResults = false;
    this.showRecentSearches = false;
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.showResults = false;
      this.showRecentSearches = false;
      this.cdr.markForCheck();
    }
  }

  // Helper methods
  getBadgeClass(type: string): string {
    switch(type) {
      case 'machine':
        return 'search__badge--machine';
      case 'product':
        return 'search__badge--file';
      case 'order':
        return 'search__badge--order';
      case 'inquiry':
        return 'search__badge--inquiry';
      default:
        return '';
    }
  }

  private setSearchPlaceholder(): void {
    this.searchPlaceholder = "Search";
  }

  // Template helper to check if result is active
  isResultActive(index: number): boolean {
    return index === this.activeIndex;
  }

  // TrackBy function for performance optimization
  trackByResultId(index: number, result: SearchResultItem): string {
    return result.id || index.toString();
  }

  trackByRecentSearch(index: number, search: RecentSearch): string {
    return search.query + search.timestamp;
  }
}
