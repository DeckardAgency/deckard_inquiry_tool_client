import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CarouselComponent } from './carousel.component';
import { CarouselImage } from './carousel.types';
import { ElementRef } from '@angular/core';

describe('CarouselComponent', () => {
  let component: CarouselComponent;
  let fixture: ComponentFixture<CarouselComponent>;
  let compiled: HTMLElement;

  const mockImages: CarouselImage[] = [
    { url: 'image1.jpg', alt: 'Image 1', caption: 'First Image' },
    { url: 'image2.jpg', alt: 'Image 2', caption: 'Second Image' },
    { url: 'image3.jpg', alt: 'Image 3', caption: 'Third Image' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarouselComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CarouselComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;

    // Mock the carouselTrack ViewChild
    component.carouselTrack = {
      nativeElement: {
        offsetWidth: 800
      }
    } as ElementRef<HTMLDivElement>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display images', () => {
    component.images = mockImages;
    fixture.detectChanges();

    // The component uses carousel__slide class (BEM naming)
    const slides = compiled.querySelectorAll('.carousel__slide');
    expect(slides.length).toBe(3);
  });

  it('should show navigation arrows when showArrows is true and multiple images', () => {
    component.images = mockImages;
    component.showArrows = true;
    fixture.detectChanges();

    // The component uses showNavigationArrows getter which checks for > 1 images
    expect(component.showNavigationArrows).toBe(true);
  });

  it('should hide navigation arrows when showArrows is false', () => {
    component.images = mockImages;
    component.showArrows = false;
    fixture.detectChanges();

    expect(component.showNavigationArrows).toBe(false);
  });

  it('should show dots when showDots is true and multiple images', () => {
    component.images = mockImages;
    component.showDots = true;
    fixture.detectChanges();

    expect(component.showNavigationDots).toBe(true);
  });

  it('should navigate to next slide', () => {
    component.images = mockImages;
    fixture.detectChanges();

    expect(component.currentIndex).toBe(0);
    component.next();
    expect(component.currentIndex).toBe(1);
  });

  it('should navigate to previous slide', () => {
    component.images = mockImages;
    component.currentIndex = 1;
    fixture.detectChanges();

    component.previous();
    expect(component.currentIndex).toBe(0);
  });

  it('should handle infinite loop when going forward', fakeAsync(() => {
    component.images = mockImages;
    component.infiniteLoop = true;
    component.currentIndex = 2;
    fixture.detectChanges();

    component.next();
    tick(component.animationDuration + 10);
    expect(component.currentIndex).toBe(0);
  }));

  it('should not loop when infiniteLoop is false', () => {
    component.images = mockImages;
    component.infiniteLoop = false;
    component.currentIndex = 2;
    fixture.detectChanges();

    component.next();
    expect(component.currentIndex).toBe(2);
  });

  it('should start autoplay when enabled', fakeAsync(() => {
    component.images = mockImages;
    component.autoPlay = true;
    component.autoPlayInterval = 1000;

    component.ngOnInit();
    expect(component.currentIndex).toBe(0);

    tick(1000);
    tick(component.animationDuration + 10);
    expect(component.currentIndex).toBe(1);

    component.ngOnDestroy();
  }));

  it('should handle touch events', () => {
    component.images = mockImages;
    fixture.detectChanges();

    // Create a proper TouchEvent by dispatching on the wrapper
    // Since TouchEvent construction is tricky in test environments,
    // we'll test the method directly by creating a mock event
    const mockTouchEvent = {
      touches: [{ clientX: 100 }]
    } as unknown as TouchEvent;

    component.onTouchStart(mockTouchEvent);
    expect(component.isDragging).toBe(true);
  });

  it('should not navigate with single image', () => {
    component.images = [{ url: 'image1.jpg', alt: 'Image 1' }];
    fixture.detectChanges();

    expect(component.currentIndex).toBe(0);
    component.next();
    expect(component.currentIndex).toBe(0);
    component.previous();
    expect(component.currentIndex).toBe(0);
  });

  it('should go to specific slide', fakeAsync(() => {
    component.images = mockImages;
    fixture.detectChanges();

    component.goToSlide(2);
    tick(component.animationDuration + 10);
    expect(component.currentIndex).toBe(2);
  }));

  afterEach(() => {
    component.ngOnDestroy();
  });
});
