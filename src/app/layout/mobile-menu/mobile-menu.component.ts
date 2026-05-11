import { Component, OnInit, ElementRef, HostListener, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/auth/auth.service';
import { MobileMenuService } from '@services/mobile-menu.service';
import { LoginModalService } from '@services/login-modal.service';
import { SupportModalService } from '@services/support-modal.service';
import { User } from '@core/models';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { filter } from 'rxjs/operators';
import { signal } from '@angular/core';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mobile-menu.component.html',
  styleUrls: ['./mobile-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('300ms ease-in-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ transform: 'translateX(-100%)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('expandCollapse', [
      state('void', style({
        height: '0',
        overflow: 'hidden',
        opacity: 0,
        margin: '0'
      })),
      state('*', style({
        height: '*',
        opacity: 1
      })),
      transition('void <=> *', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class MobileMenuComponent implements OnInit {
  isInquiriesExpanded = signal<boolean>(false);
  isUserDropdownOpen = signal<boolean>(false);
  currentUser: User | null = null;
  userFullName: string = '';
  userRole: string = '';
  userInitials: string = '';
  private destroyRef = inject(DestroyRef);

  constructor(
    public authService: AuthService,
    private router: Router,
    private elementRef: ElementRef,
    public mobileMenuService: MobileMenuService,
    public loginModalService: LoginModalService,
    public supportModalService: SupportModalService
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.authService.currentUser$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(user => {
      this.currentUser = user;
      this.updateUserDisplay();
    });

    // Initialize with current user
    this.currentUser = this.authService.getCurrentUser();
    this.updateUserDisplay();

    // Close menu on navigation
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.mobileMenuService.close();
      });

    // Set initial state of inquiry menu based on current URL
    this.isInquiriesExpanded.set(this.router.url.includes('/my-inquiries/'));
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const mobileMenuElement = this.elementRef.nativeElement.querySelector('.mobile-menu');
    const hamburgerButton = document.querySelector('.top-bar__hamburger');

    if (
      this.mobileMenuService.isOpen() &&
      mobileMenuElement &&
      !mobileMenuElement.contains(event.target) &&
      hamburgerButton &&
      !hamburgerButton.contains(event.target as Node)
    ) {
      this.mobileMenuService.close();
    }
  }

  get isOpen() {
    return this.mobileMenuService.isOpen;
  }

  closeMenu() {
    this.mobileMenuService.close();
  }

  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    this.isUserDropdownOpen.update(value => !value);
  }

  toggleInquiriesMenu(): void {
    this.isInquiriesExpanded.update(value => !value);
  }

  openLoginModal() {
    this.isUserDropdownOpen.set(false);
    this.loginModalService.open();
    this.closeMenu();
  }

  openSupportModal(event: Event) {
    event.preventDefault();
    this.supportModalService.open();
    this.closeMenu();
  }

  updateUserDisplay(): void {
    if (this.currentUser) {
      if (this.currentUser.firstName && this.currentUser.lastName) {
        this.userFullName = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        this.userInitials = `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`.toUpperCase();
      } else if (this.currentUser.firstName) {
        this.userFullName = this.currentUser.firstName;
        this.userInitials = this.currentUser.firstName[0].toUpperCase();
      } else {
        this.userFullName = this.currentUser.email;
        this.userInitials = this.currentUser.email[0].toUpperCase();
      }

      if (this.currentUser.roles && this.currentUser.roles.length > 0) {
        const role = this.currentUser.roles[0];
        this.userRole = role.replace('ROLE_', '').charAt(0).toUpperCase() +
          role.replace('ROLE_', '').slice(1).toLowerCase();
      } else {
        this.userRole = 'User';
      }
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closeMenu();
  }

  isRouteActive(basePath: string): boolean {
    return this.router.url.includes(`/${basePath}/`);
  }

  isMyInquiriesRoute(): boolean {
    return this.router.url.includes('/my-inquiries/');
  }
}
