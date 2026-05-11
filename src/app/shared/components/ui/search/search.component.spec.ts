import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { SearchComponent, HighlightPipe } from './search.component';
import { SearchService, SearchResults, RecentSearch } from '@core/services/search.service';
import { ProductService } from '@services/http/product.service';
import { LoggerService } from '@services/logger.service';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let searchServiceSpy: jasmine.SpyObj<SearchService>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

  const mockSearchResults: SearchResults = {
    machines: [
      { id: 'm1', title: 'Machine 1', type: 'machine', badge: 'Machine', route: '/machines/m1', description: 'Test machine' }
    ],
    products: [
      { id: 'p1', title: 'Product 1', type: 'product', badge: 'Product', route: '/products/p1', description: 'Test product' }
    ],
    orders: [
      { id: 'o1', title: 'Order 123', type: 'order', badge: 'Order', route: '/orders/o1', description: 'Test order' }
    ],
    inquiries: [
      { id: 'i1', title: 'Inquiry 456', type: 'inquiry', badge: 'Inquiry', route: '/inquiries/i1', description: 'Test inquiry' }
    ],
    totalMachines: 1,
    totalProducts: 1,
    totalOrders: 1,
    totalInquiries: 1
  };

  const mockRecentSearches: RecentSearch[] = [
    { query: 'test search 1', timestamp: Date.now() - 1000 },
    { query: 'test search 2', timestamp: Date.now() - 2000 }
  ];

  beforeEach(async () => {
    searchServiceSpy = jasmine.createSpyObj('SearchService', [
      'searchAll',
      'getRecentSearches',
      'addRecentSearch',
      'clearRecentSearches'
    ]);
    searchServiceSpy.searchAll.and.returnValue(of(mockSearchResults));
    searchServiceSpy.getRecentSearches.and.returnValue(mockRecentSearches);

    productServiceSpy = jasmine.createSpyObj('ProductService', ['setSelectedProductId']);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['createLogger']);
    loggerServiceSpy.createLogger.and.returnValue({
      debug: jasmine.createSpy('debug'),
      info: jasmine.createSpy('info'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error'),
      logger: loggerServiceSpy,
      scope: 'SearchComponent'
    } as any);

    await TestBed.configureTestingModule({
      imports: [
        SearchComponent,
        FormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SearchService, useValue: searchServiceSpy },
        { provide: ProductService, useValue: productServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: LoggerService, useValue: loggerServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load recent searches on init', () => {
      expect(searchServiceSpy.getRecentSearches).toHaveBeenCalled();
      expect(component.recentSearches).toEqual(mockRecentSearches);
    });

    it('should have default filter set to all', () => {
      expect(component.activeFilter).toBe('all');
    });
  });

  describe('Search Functionality', () => {
    it('should not search if query is less than minimum length', fakeAsync(() => {
      component.searchQuery = 'a';
      component.search();
      tick(350);

      expect(searchServiceSpy.searchAll).not.toHaveBeenCalled();
    }));

    it('should search when query meets minimum length', fakeAsync(() => {
      component.searchQuery = 'test';
      component.search();
      tick(350);

      expect(searchServiceSpy.searchAll).toHaveBeenCalledWith('test');
    }));

    it('should debounce search calls', fakeAsync(() => {
      component.searchQuery = 'te';
      component.search();
      tick(100);

      component.searchQuery = 'tes';
      component.search();
      tick(100);

      component.searchQuery = 'test';
      component.search();
      tick(350);

      // Should only call once with final value due to debounce + distinctUntilChanged
      expect(searchServiceSpy.searchAll).toHaveBeenCalledTimes(1);
      expect(searchServiceSpy.searchAll).toHaveBeenCalledWith('test');
    }));

    it('should show results after successful search', fakeAsync(() => {
      component.searchQuery = 'test';
      component.search();
      tick(350);

      expect(component.showResults).toBe(true);
      expect(component.searchResults.length).toBe(4);
    }));

    it('should update counts after search', fakeAsync(() => {
      component.searchQuery = 'test';
      component.search();
      tick(350);

      expect(component.machineCounts).toBe(1);
      expect(component.productCounts).toBe(1);
      expect(component.orderCounts).toBe(1);
      expect(component.inquiryCounts).toBe(1);
    }));

    it('should save to recent searches after successful search', fakeAsync(() => {
      component.searchQuery = 'test';
      component.search();
      tick(350);

      expect(searchServiceSpy.addRecentSearch).toHaveBeenCalledWith('test');
    }));
  });

  describe('Filter Functionality', () => {
    beforeEach(fakeAsync(() => {
      component.searchQuery = 'test';
      component.search();
      tick(350);
    }));

    it('should filter results by machine', () => {
      component.setFilter('machine');

      expect(component.activeFilter).toBe('machine');
      expect(component.filteredResults.length).toBe(1);
      expect(component.filteredResults[0].type).toBe('machine');
    });

    it('should filter results by product', () => {
      component.setFilter('product');

      expect(component.activeFilter).toBe('product');
      expect(component.filteredResults.length).toBe(1);
      expect(component.filteredResults[0].type).toBe('product');
    });

    it('should filter results by order', () => {
      component.setFilter('order');

      expect(component.activeFilter).toBe('order');
      expect(component.filteredResults.length).toBe(1);
      expect(component.filteredResults[0].type).toBe('order');
    });

    it('should filter results by inquiry', () => {
      component.setFilter('inquiry');

      expect(component.activeFilter).toBe('inquiry');
      expect(component.filteredResults.length).toBe(1);
      expect(component.filteredResults[0].type).toBe('inquiry');
    });

    it('should show all results when filter is all', () => {
      component.setFilter('machine');
      component.setFilter('all');

      expect(component.activeFilter).toBe('all');
      expect(component.filteredResults.length).toBe(4);
    });

    it('should return correct filter count', () => {
      expect(component.getFilterCount('all')).toBe(4);
      expect(component.getFilterCount('machine')).toBe(1);
      expect(component.getFilterCount('product')).toBe(1);
      expect(component.getFilterCount('order')).toBe(1);
      expect(component.getFilterCount('inquiry')).toBe(1);
    });
  });

  describe('Recent Searches', () => {
    it('should show recent searches on input focus when query is empty', () => {
      component.searchQuery = '';
      component.onInputFocus();

      expect(component.showRecentSearches).toBe(true);
      expect(component.showResults).toBe(false);
    });

    it('should not show recent searches if query has value', () => {
      component.searchQuery = 'test';
      component.onInputFocus();

      expect(component.showRecentSearches).toBe(false);
    });

    it('should select recent search and trigger search', fakeAsync(() => {
      const recentSearch = mockRecentSearches[0];
      component.selectRecentSearch(recentSearch);

      expect(component.searchQuery).toBe(recentSearch.query);
      expect(component.showRecentSearches).toBe(false);

      tick(350);
      expect(searchServiceSpy.searchAll).toHaveBeenCalledWith(recentSearch.query);
    }));

    it('should clear recent searches', () => {
      component.clearRecentSearches();

      expect(searchServiceSpy.clearRecentSearches).toHaveBeenCalled();
      expect(component.recentSearches.length).toBe(0);
      expect(component.showRecentSearches).toBe(false);
    });
  });

  describe('Result Selection', () => {
    beforeEach(fakeAsync(() => {
      component.searchQuery = 'test';
      component.search();
      tick(350);
    }));

    it('should navigate to shop when selecting product', () => {
      const productResult = mockSearchResults.products[0];
      component.selectResult(productResult);

      expect(productServiceSpy.setSelectedProductId).toHaveBeenCalledWith('p1');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/shop']);
      expect(component.showResults).toBe(false);
      expect(component.searchQuery).toBe('');
    });

    it('should navigate to my-machines when selecting machine', () => {
      const machineResult = mockSearchResults.machines[0];
      component.selectResult(machineResult);

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/my-machines']);
    });

    it('should navigate to order detail when selecting order', () => {
      const orderResult = mockSearchResults.orders[0];
      component.selectResult(orderResult);

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/my-inquiries/active/order', 'o1', 'view']);
    });

    it('should navigate to inquiry detail when selecting inquiry', () => {
      const inquiryResult = mockSearchResults.inquiries[0];
      component.selectResult(inquiryResult);

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/manual-entry', 'i1', 'view']);
    });

    it('should select result by index', () => {
      component.activeIndex = 0;
      component.selectByIndex(0);

      expect(routerSpy.navigate).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(fakeAsync(() => {
      component.searchQuery = 'test';
      component.search();
      tick(350);
    }));

    it('should navigate down on arrow down', () => {
      component.activeIndex = 0;
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });

      component.handleArrowDown(event);

      expect(component.activeIndex).toBe(1);
    });

    it('should not go below last result on arrow down', () => {
      component.activeIndex = component.filteredResults.length - 1;
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });

      component.handleArrowDown(event);

      expect(component.activeIndex).toBe(component.filteredResults.length - 1);
    });

    it('should navigate up on arrow up', () => {
      component.activeIndex = 2;
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });

      component.handleArrowUp(event);

      expect(component.activeIndex).toBe(1);
    });

    it('should not go above first result on arrow up', () => {
      component.activeIndex = 0;
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });

      component.handleArrowUp(event);

      expect(component.activeIndex).toBe(0);
    });

    it('should close results on escape', () => {
      component.handleEscapeKey();

      expect(component.showResults).toBe(false);
      expect(component.showRecentSearches).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    it('should return correct badge class for machine', () => {
      expect(component.getBadgeClass('machine')).toBe('search__badge--machine');
    });

    it('should return correct badge class for product', () => {
      expect(component.getBadgeClass('product')).toBe('search__badge--file');
    });

    it('should return correct badge class for order', () => {
      expect(component.getBadgeClass('order')).toBe('search__badge--order');
    });

    it('should return correct badge class for inquiry', () => {
      expect(component.getBadgeClass('inquiry')).toBe('search__badge--inquiry');
    });

    it('should identify active result', () => {
      component.activeIndex = 2;

      expect(component.isResultActive(2)).toBe(true);
      expect(component.isResultActive(0)).toBe(false);
    });
  });
});

describe('HighlightPipe', () => {
  let pipe: HighlightPipe;

  beforeEach(() => {
    // Create mock sanitizer that just returns the HTML as-is for testing
    const mockSanitizer = {
      bypassSecurityTrustHtml: (html: string) => html
    } as any;
    pipe = new HighlightPipe(mockSanitizer);
  });

  it('should return original text if no search term', () => {
    const result = pipe.transform('test text', '');
    expect(result).toBe('test text');
  });

  it('should return empty string if text is null', () => {
    const result = pipe.transform(null, 'test');
    expect(result).toBe('');
  });

  it('should return empty string if text is undefined', () => {
    const result = pipe.transform(undefined, 'test');
    expect(result).toBe('');
  });

  it('should highlight matching text', () => {
    const result = pipe.transform('This is a test string', 'test');
    expect(result).toContain('<mark class="search__highlight">test</mark>');
  });

  it('should highlight case-insensitively', () => {
    const result = pipe.transform('This is a TEST string', 'test');
    expect(result).toContain('<mark class="search__highlight">TEST</mark>');
  });

  it('should highlight multiple occurrences', () => {
    const result = pipe.transform('test one test two', 'test') as string;
    const matches = result.match(/<mark class="search__highlight">test<\/mark>/gi);
    expect(matches?.length).toBe(2);
  });

  it('should escape special regex characters', () => {
    const result = pipe.transform('test (value)', '(value)');
    expect(result).toContain('<mark class="search__highlight">(value)</mark>');
  });
});
