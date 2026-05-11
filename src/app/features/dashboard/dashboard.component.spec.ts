import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DashboardComponent } from './dashboard.component';
import { LoggerService } from '@services/logger.service';
import { AuthService } from '@core/auth/auth.service';
import { BehaviorSubject } from 'rxjs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['createLogger']);
    loggerServiceSpy.createLogger.and.returnValue({
      debug: jasmine.createSpy('debug'),
      info: jasmine.createSpy('info'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error'),
      logger: loggerServiceSpy,
      scope: 'DashboardComponent'
    } as any);

    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getCurrentUser'], {
      isAuthenticated$: new BehaviorSubject(false),
      currentUser$: new BehaviorSubject(null)
    });
    authServiceSpy.isAuthenticated.and.returnValue(false);
    authServiceSpy.getCurrentUser.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: LoggerService, useValue: loggerServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have breadcrumbs', () => {
    expect(component.breadcrumbs).toBeDefined();
    expect(component.breadcrumbs.length).toBe(1);
    expect(component.breadcrumbs[0].label).toBe('Dashboard');
  });
});
