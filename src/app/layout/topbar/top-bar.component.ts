import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import {SearchComponent} from '@shared/components/ui/search/search.component';
import {CartService} from '@services/cart/cart.service';
import {QuickCartService} from '@services/cart/quick-cart.service';
import {ManualCartService} from '@services/cart/manual-cart.service';
import {ManualQuickCartService} from '@services/cart/manual-quick-cart.service';
import {MobileMenuService} from '@services/mobile-menu.service';

@Component({
    selector: 'app-top-bar',
    imports: [SearchComponent],
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent implements OnInit {
  currentRoute: string = '';
  manualCartCount: number = 0;
  private destroyRef = inject(DestroyRef);

  constructor(
    public cartService: CartService,
    public quickCartService: QuickCartService,
    public manualCartService: ManualCartService,
    public manualQuickCartService: ManualQuickCartService,
    private router: Router,
    private mobileMenuService: MobileMenuService
  ) {}

  ngOnInit(): void {
    // Subscribe to router events to keep track of the current route
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });

    // Subscribe to manual cart count changes
    this.manualCartService.getCartCount().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(count => {
      this.manualCartCount = count;
    });

    // Initialize current route
    this.currentRoute = this.router.url;
  }

  toggleCart() {
    // Determine which cart to toggle based on the current route
    if (this.isManualEntryRoute()) {
      this.manualQuickCartService.toggle();
    } else {
      this.quickCartService.toggle();
    }
  }

  navigateToCart() {
    // Navigate to the appropriate cart based on the current route
    if (this.isManualEntryRoute()) {
      this.router.navigate(['/manual-entry-cart']);
    } else {
      this.router.navigate(['/cart']);
    }
  }

  // Helper method to check if current route is in the manual entry section
  private isManualEntryRoute(): boolean {
    return this.currentRoute.includes('/manual-entry');
  }

  // Get total cart items based on current route
  getTotalItems(): number {
    if (this.isManualEntryRoute()) {
      // Return cached manual cart count
      return this.manualCartCount;
    } else {
      return this.quickCartService.getTotalItems();
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuService.toggle();
  }
}
