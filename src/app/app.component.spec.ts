import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SidebarService } from '@services/sidebar.service';
import { QuickCartService } from '@services/cart/quick-cart.service';
import { ManualQuickCartService } from '@services/cart/manual-quick-cart.service';
import { LoginModalService } from '@services/login-modal.service';
import { AuthService } from '@core/auth/auth.service';
import { UserService } from '@services/http/user.service';
import { LoggerService } from '@services/logger.service';
import { BehaviorSubject, of } from 'rxjs';

describe('AppComponent', () => {
  let sidebarServiceSpy: jasmine.SpyObj<SidebarService>;
  let quickCartServiceSpy: jasmine.SpyObj<QuickCartService>;
  let manualQuickCartServiceSpy: jasmine.SpyObj<ManualQuickCartService>;
  let loginModalServiceSpy: jasmine.SpyObj<LoginModalService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(async () => {
    sidebarServiceSpy = jasmine.createSpyObj('SidebarService', ['toggleSidebar'], {
      isCollapsed: false
    });
    quickCartServiceSpy = jasmine.createSpyObj('QuickCartService', ['hideNotification', 'open'], {
      isOpen$: new BehaviorSubject(false),
      notification$: new BehaviorSubject(null)
    });
    manualQuickCartServiceSpy = jasmine.createSpyObj('ManualQuickCartService', ['hideNotification', 'open'], {
      isOpen$: new BehaviorSubject(false),
      notification$: new BehaviorSubject(null)
    });
    loginModalServiceSpy = jasmine.createSpyObj('LoginModalService', ['open', 'close'], {
      isOpen$: new BehaviorSubject(false)
    });
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getCurrentUser', 'logout'], {
      isAuthenticated$: new BehaviorSubject(false)
    });
    authServiceSpy.isAuthenticated.and.returnValue(false);
    authServiceSpy.getCurrentUser.and.returnValue(null);

    userServiceSpy = jasmine.createSpyObj('UserService', ['getUserByEmail']);
    userServiceSpy.getUserByEmail.and.returnValue(of(null));

    loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['createLogger']);
    loggerServiceSpy.createLogger.and.returnValue({
      debug: jasmine.createSpy('debug'),
      info: jasmine.createSpy('info'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error'),
      logger: loggerServiceSpy,
      scope: 'AppComponent'
    } as any);

    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SidebarService, useValue: sidebarServiceSpy },
        { provide: QuickCartService, useValue: quickCartServiceSpy },
        { provide: ManualQuickCartService, useValue: manualQuickCartServiceSpy },
        { provide: LoginModalService, useValue: loginModalServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'deckard_inquiry_tool_client' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('deckard_inquiry_tool_client');
  });

  it('should check if route is manual entry', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.currentRoute = '/manual-entry/new';
    expect(app.isManualEntryRoute()).toBe(true);

    app.currentRoute = '/dashboard';
    expect(app.isManualEntryRoute()).toBe(false);
  });

  it('should handle view cart', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.onViewCart();

    expect(quickCartServiceSpy.hideNotification).toHaveBeenCalled();
    expect(quickCartServiceSpy.open).toHaveBeenCalled();
  });

  it('should handle view inquiry', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.onViewInquiry();

    expect(manualQuickCartServiceSpy.hideNotification).toHaveBeenCalled();
    expect(manualQuickCartServiceSpy.open).toHaveBeenCalled();
  });
});
