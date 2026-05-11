import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InquiryModalComponent } from './inquiry-modal.component';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('InquiryModalComponent', () => {
  let component: InquiryModalComponent;
  let fixture: ComponentFixture<InquiryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InquiryModalComponent,
        RouterTestingModule,
        BrowserAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InquiryModalComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with isOpen as false', () => {
      expect(component.isOpen).toBe(false);
    });

    it('should not render modal when isOpen is false', () => {
      fixture.detectChanges();
      const modalOverlay = fixture.debugElement.query(By.css('.modal-overlay'));

      expect(modalOverlay).toBeNull();
    });

    it('should render modal when isOpen is true', () => {
      component.isOpen = true;
      fixture.detectChanges();

      const modalOverlay = fixture.debugElement.query(By.css('.modal-overlay'));
      expect(modalOverlay).toBeTruthy();
    });
  });

  describe('modal display', () => {
    beforeEach(() => {
      component.isOpen = true;
      fixture.detectChanges();
    });

    it('should display modal overlay', () => {
      const modalOverlay = fixture.debugElement.query(By.css('.modal-overlay'));
      expect(modalOverlay).toBeTruthy();
    });

    it('should display modal container', () => {
      const modalContainer = fixture.debugElement.query(By.css('.modal-container'));
      expect(modalContainer).toBeTruthy();
    });

    it('should display modal header', () => {
      const modalHeader = fixture.debugElement.query(By.css('.modal-header'));
      expect(modalHeader).toBeTruthy();
    });

    it('should display modal title', () => {
      const modalTitle = fixture.debugElement.query(By.css('.modal-title'));
      expect(modalTitle.nativeElement.textContent.trim()).toContain('New inquiry');
    });

    it('should display modal content', () => {
      const modalContent = fixture.debugElement.query(By.css('.modal-content'));
      expect(modalContent).toBeTruthy();
    });
  });

  describe('inquiry options', () => {
    beforeEach(() => {
      component.isOpen = true;
      fixture.detectChanges();
    });

    it('should display three inquiry options', () => {
      const inquiryOptions = fixture.debugElement.queryAll(By.css('.inquiry-option'));
      expect(inquiryOptions.length).toBe(3);
    });

    it('should display Shop option', () => {
      const shopOption = fixture.debugElement.query(By.css('a[routerLink="/shop"]'));
      expect(shopOption).toBeTruthy();
    });

    it('should display Manual Inquiry option', () => {
      const manualOption = fixture.debugElement.query(By.css('a[routerLink="/manual-entry/input-form"]'));
      expect(manualOption).toBeTruthy();
    });

    it('should display Inquiry Tool option', () => {
      const toolOption = fixture.debugElement.query(By.css('a[routerLink="/inquiry-tool"]'));
      expect(toolOption).toBeTruthy();
    });

    it('should show Shop option title', () => {
      const shopOption = fixture.debugElement.query(By.css('a[routerLink="/shop"]'));
      const title = shopOption.query(By.css('.inquiry-option__title'));
      expect(title.nativeElement.textContent).toBe('Shop');
    });

    it('should show Manual Inquiry option title', () => {
      const manualOption = fixture.debugElement.query(By.css('a[routerLink="/manual-entry/input-form"]'));
      const title = manualOption.query(By.css('.inquiry-option__title'));
      expect(title.nativeElement.textContent).toBe('Manual Inquiry');
    });

    it('should show Inquiry Tool option title', () => {
      const toolOption = fixture.debugElement.query(By.css('a[routerLink="/inquiry-tool"]'));
      const title = toolOption.query(By.css('.inquiry-option__title'));
      expect(title.nativeElement.textContent).toBe('Inquiry Tool');
    });

    it('should have descriptions for all options', () => {
      const descriptions = fixture.debugElement.queryAll(By.css('.inquiry-option__description'));
      expect(descriptions.length).toBe(3);
      descriptions.forEach(desc => {
        expect(desc.nativeElement.textContent.trim().length).toBeGreaterThan(0);
      });
    });

    it('should have icons for all options', () => {
      const icons = fixture.debugElement.queryAll(By.css('.inquiry-option__icon'));
      expect(icons.length).toBe(3);
    });

    it('should have buttons for all options', () => {
      const buttons = fixture.debugElement.queryAll(By.css('.inquiry-option__button'));
      expect(buttons.length).toBe(3);
      buttons.forEach(button => {
        expect(button.nativeElement.textContent.trim()).toContain('Select');
      });
    });

    it('should mark Inquiry Tool option as disabled', () => {
      const toolOption = fixture.debugElement.query(By.css('a[routerLink="/inquiry-tool"]'));
      expect(toolOption.nativeElement.classList.contains('inquiry-option--disabled')).toBe(true);
    });
  });

  describe('close functionality', () => {
    beforeEach(() => {
      component.isOpen = true;
      fixture.detectChanges();
    });

    it('should close modal when close() is called', () => {
      component.close();

      expect(component.isOpen).toBe(false);
    });

    it('should emit isOpenChange event when closing', (done) => {
      component.isOpenChange.subscribe((isOpen: boolean) => {
        expect(isOpen).toBe(false);
        done();
      });

      component.close();
    });

    it('should close modal when clicking on backdrop', () => {
      const modalOverlay = fixture.debugElement.query(By.css('.modal-overlay'));
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', {
        value: modalOverlay.nativeElement,
        enumerable: true
      });

      component.closeOnBackdrop(event);

      expect(component.isOpen).toBe(false);
    });

    it('should not close modal when clicking inside modal container', () => {
      const modalContainer = fixture.debugElement.query(By.css('.modal-container'));
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', {
        value: modalContainer.nativeElement,
        enumerable: true
      });

      component.closeOnBackdrop(event);

      expect(component.isOpen).toBe(true);
    });

    it('should close when clicking on an inquiry option', () => {
      spyOn(component, 'close');
      const shopOption = fixture.debugElement.query(By.css('a[routerLink="/shop"]'));

      shopOption.nativeElement.click();

      expect(component.close).toHaveBeenCalled();
    });
  });

  describe('pagination indicators', () => {
    beforeEach(() => {
      component.isOpen = true;
      fixture.detectChanges();
    });

    it('should display pagination indicators', () => {
      const pagination = fixture.debugElement.query(By.css('.inquiry-pagination'));
      expect(pagination).toBeTruthy();
    });

    it('should have three pagination dots', () => {
      const dots = fixture.debugElement.queryAll(By.css('.inquiry-pagination__dot'));
      expect(dots.length).toBe(3);
    });

    it('should mark first pagination dot as active', () => {
      const activeDots = fixture.debugElement.queryAll(By.css('.inquiry-pagination__dot--active'));
      expect(activeDots.length).toBe(1);
    });
  });

  describe('visual elements', () => {
    beforeEach(() => {
      component.isOpen = true;
      fixture.detectChanges();
    });

    it('should have SVG icons in header', () => {
      const headerSvg = fixture.debugElement.query(By.css('.modal-title svg'));
      expect(headerSvg).toBeTruthy();
    });

    it('should have SVG icons in all inquiry options', () => {
      const iconSvgs = fixture.debugElement.queryAll(By.css('.inquiry-option__icon svg'));
      expect(iconSvgs.length).toBe(3);
    });

    it('should have arrow icons in all buttons', () => {
      const arrowSvgs = fixture.debugElement.queryAll(By.css('.inquiry-option__arrow svg'));
      expect(arrowSvgs.length).toBe(3);
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      component.isOpen = true;
      fixture.detectChanges();
    });

    it('should have navigable links', () => {
      const links = fixture.debugElement.queryAll(By.css('a[routerLink]'));
      expect(links.length).toBe(3);
      links.forEach(link => {
        expect(link.nativeElement.getAttribute('routerLink')).toBeTruthy();
      });
    });

    it('should have descriptive text for each option', () => {
      const descriptions = fixture.debugElement.queryAll(By.css('.inquiry-option__description'));
      descriptions.forEach(desc => {
        const text = desc.nativeElement.textContent.trim();
        expect(text.length).toBeGreaterThan(50); // Descriptive text should be substantial
      });
    });
  });

  describe('component state', () => {
    it('should handle isOpen input changes', () => {
      expect(component.isOpen).toBe(false);

      component.isOpen = true;
      fixture.detectChanges();
      let modalOverlay = fixture.debugElement.query(By.css('.modal-overlay'));
      expect(modalOverlay).toBeTruthy();

      component.isOpen = false;
      fixture.detectChanges();
      modalOverlay = fixture.debugElement.query(By.css('.modal-overlay'));
      expect(modalOverlay).toBeNull();
    });

    it('should maintain state after multiple open/close cycles', () => {
      component.isOpen = true;
      fixture.detectChanges();
      component.close();
      expect(component.isOpen).toBe(false);

      component.isOpen = true;
      fixture.detectChanges();
      component.close();
      expect(component.isOpen).toBe(false);
    });
  });

  describe('routing links', () => {
    beforeEach(() => {
      component.isOpen = true;
      fixture.detectChanges();
    });

    it('should have correct route for Shop', () => {
      const shopLink = fixture.debugElement.query(By.css('a[routerLink="/shop"]'));
      expect(shopLink.nativeElement.getAttribute('routerLink')).toBe('/shop');
    });

    it('should have correct route for Manual Inquiry', () => {
      const manualLink = fixture.debugElement.query(By.css('a[routerLink="/manual-entry/input-form"]'));
      expect(manualLink.nativeElement.getAttribute('routerLink')).toBe('/manual-entry/input-form');
    });

    it('should have correct route for Inquiry Tool', () => {
      const toolLink = fixture.debugElement.query(By.css('a[routerLink="/inquiry-tool"]'));
      expect(toolLink.nativeElement.getAttribute('routerLink')).toBe('/inquiry-tool');
    });
  });

  describe('styling classes', () => {
    beforeEach(() => {
      component.isOpen = true;
      fixture.detectChanges();
    });

    it('should apply red icon class to all options', () => {
      const redIcons = fixture.debugElement.queryAll(By.css('.inquiry-option__icon--red'));
      expect(redIcons.length).toBe(3);
    });

    it('should have proper structure for each option', () => {
      const options = fixture.debugElement.queryAll(By.css('.inquiry-option'));

      options.forEach(option => {
        expect(option.query(By.css('.inquiry-option__icon'))).toBeTruthy();
        expect(option.query(By.css('.inquiry-option__content'))).toBeTruthy();
        expect(option.query(By.css('.inquiry-option__title'))).toBeTruthy();
        expect(option.query(By.css('.inquiry-option__description'))).toBeTruthy();
        expect(option.query(By.css('.inquiry-option__button'))).toBeTruthy();
        expect(option.query(By.css('.inquiry-option__arrow'))).toBeTruthy();
      });
    });
  });
});
