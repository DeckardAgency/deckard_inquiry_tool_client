import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopBarComponent } from './layout/topbar/top-bar.component';
import { AsyncPipe } from '@angular/common';
import { filter } from 'rxjs/operators';
import {QuickCartComponent} from '@shared/components/cart/quick-cart/quick-cart.component';
import {ManualQuickCartComponent} from '@shared/components/cart/manual-quick-cart/manual-quick-cart.component';
import {
  CartNotificationComponent
} from '@shared/components/notifications/cart-notification/cart-notification.component';
import {
  ManualNotificationComponent
} from '@shared/components/notifications/manual-notification/manual-notification.component';
import {SidebarService} from '@services/sidebar.service';
import {QuickCartService} from '@services/cart/quick-cart.service';
import {ManualQuickCartService} from '@services/cart/manual-quick-cart.service';
import {LoginModalService} from '@services/login-modal.service';
import {LoginModalComponent} from '@shared/components/modals/login-modal/login-modal.component';
import {AuthService} from '@core/auth/auth.service';
import {MobileMenuComponent} from './layout/mobile-menu/mobile-menu.component';
import {UserService} from '@services/http/user.service';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
    selector: 'app-root',
    imports: [
      RouterOutlet,
      SidebarComponent,
      TopBarComponent,
      QuickCartComponent,
      ManualQuickCartComponent,
      CartNotificationComponent,
      ManualNotificationComponent,
      AsyncPipe,
      LoginModalComponent,
      MobileMenuComponent
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'deckard_inquiry_tool_client';
  currentRoute: string = '';
  isAuthenticated: boolean = false;

  private destroyRef = inject(DestroyRef);
  private logger!: ScopedLogger;

  constructor(
    public sidebarService: SidebarService,
    public quickCartService: QuickCartService,
    public manualQuickCartService: ManualQuickCartService,
    private router: Router,
    public loginModalService: LoginModalService,
    private authService: AuthService,
    private userService: UserService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('AppComponent');

    // Subscribe to router events to keep track of current route
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;

      // Check client status on every route change
      this.checkClientStatus();
    });

    // Initialize current route
    this.currentRoute = this.router.url;

    // Subscribe to authentication state changes
    this.authService.isAuthenticated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });
  }

  ngOnInit(): void {
    // Check client status on app initialization if user is already logged in
    this.checkClientStatus();
  }

  onViewCart(): void {
    this.quickCartService.hideNotification();
    this.quickCartService.open();
  }

  hideNotification(): void {
    this.quickCartService.hideNotification();
  }

  onViewInquiry(): void {
    this.manualQuickCartService.hideNotification();
    this.manualQuickCartService.open();
  }

  hideManualNotification(): void {
    this.manualQuickCartService.hideNotification();
  }

  // Check if current route is in the manual entry section
  isManualEntryRoute(): boolean {
    return this.currentRoute.includes('/manual-entry');
  }

  // Navigate to the appropriate cart based on current route
  navigateToCart(): void {
    if (this.isManualEntryRoute()) {
      this.router.navigate(['/manual-entry-cart']);
    } else {
      this.router.navigate(['/cart']);
    }
  }

  onLoginModalOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      this.loginModalService.close();
    }
  }

  onLoginSuccess(): void {
    // Handle successful login - e.g., redirect to dashboard
    this.router.navigate(['/dashboard']);
  }

  /**
   * Check if user's client is archived and log them out if so
   */
  private checkClientStatus(): void {
    // Only check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();

    // Only check if user has a client and an email
    if (!currentUser?.email || !currentUser?.client) {
      return;
    }

    // Fetch fresh user data from the API to check current client status
    this.userService.getUserByEmail(currentUser.email).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (userData) => {
        // Check if the client is archived
        if (userData?.client?.isArchived) {
          this.logger.warn('User\'s client is archived. Logging out...');

          // Log out the user
          this.authService.logout();

          // Redirect to home page
          this.router.navigate(['/']);

          // Show login modal with a slight delay
          setTimeout(() => {
            this.loginModalService.open();
            // You could also show a notification here if you have a notification service
            alert('Your company account has been archived. Please contact support for assistance.');
          }, 500);
        }
      },
      error: (error) => {
        this.logger.error('Error checking client status:', error);
        // Don't log out on error to avoid disrupting user experience
        // if there's a temporary API issue
      }
    });
  }

}
