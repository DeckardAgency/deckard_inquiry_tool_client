import { Component, Input, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselImage } from './carousel.types';

// Re-export for backward compatibility
export type { CarouselImage };

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarouselComponent implements OnInit, OnDestroy {
  @Input() images: CarouselImage[] = [];
  @Input() autoPlay = false;
  @Input() autoPlayInterval = 3000;
  @Input() showArrows = true;
  @Input() showDots = true;
  @Input() infiniteLoop = true;
  @Input() animationDuration = 300;

  @ViewChild('carouselTrack', { static: false }) carouselTrack!: ElementRef<HTMLDivElement>;

  currentIndex = 0;
  translateX = 0;
  isDragging = false;
  startX = 0;
  currentX = 0;
  autoPlayTimer: ReturnType<typeof setInterval> | null = null;
  touchStartX = 0;
  touchEndX = 0;
  isAnimating = false;

  ngOnInit(): void {
    if (this.autoPlay && this.images.length > 1) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateCarouselPosition(false);
  }

  startAutoPlay(): void {
    this.autoPlayTimer = setInterval(() => {
      this.next();
    }, this.autoPlayInterval);
  }

  stopAutoPlay(): void {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
    }
  }

  next(): void {
    if (this.isAnimating || this.images.length <= 1) return;

    if (this.currentIndex === this.images.length - 1) {
      if (this.infiniteLoop) {
        this.goToSlide(0);
      }
    } else {
      this.goToSlide(this.currentIndex + 1);
    }
  }

  previous(): void {
    if (this.isAnimating || this.images.length <= 1) return;

    if (this.currentIndex === 0) {
      if (this.infiniteLoop) {
        this.goToSlide(this.images.length - 1);
      }
    } else {
      this.goToSlide(this.currentIndex - 1);
    }
  }

  goToSlide(index: number): void {
    if (this.isAnimating || index === this.currentIndex || index < 0 || index >= this.images.length) {
      return;
    }

    this.isAnimating = true;
    this.currentIndex = index;
    this.updateCarouselPosition(true);

    setTimeout(() => {
      this.isAnimating = false;
    }, this.animationDuration);

    if (this.autoPlay) {
      this.stopAutoPlay();
      this.startAutoPlay();
    }
  }

  updateCarouselPosition(animate: boolean): void {
    this.translateX = -this.currentIndex * 100;
  }

  onTouchStart(event: TouchEvent): void {
    if (this.images.length <= 1) return;

    this.touchStartX = event.touches[0].clientX;
    this.isDragging = true;
    this.startX = event.touches[0].clientX;
    this.stopAutoPlay();
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || this.images.length <= 1) return;

    event.preventDefault();
    this.currentX = event.touches[0].clientX;
    const diffX = this.currentX - this.startX;
    const percentageMoved = (diffX / this.carouselTrack.nativeElement.offsetWidth) * 100;

    // Add resistance at the edges
    if ((this.currentIndex === 0 && diffX > 0 && !this.infiniteLoop) ||
      (this.currentIndex === this.images.length - 1 && diffX < 0 && !this.infiniteLoop)) {
      this.translateX = -this.currentIndex * 100 + percentageMoved * 0.3;
    } else {
      this.translateX = -this.currentIndex * 100 + percentageMoved;
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isDragging || this.images.length <= 1) return;

    this.isDragging = false;
    this.touchEndX = this.currentX || this.touchStartX;

    const diffX = this.touchEndX - this.touchStartX;
    const threshold = this.carouselTrack.nativeElement.offsetWidth * 0.2;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        this.previous();
      } else {
        this.next();
      }
    } else {
      this.updateCarouselPosition(true);
    }

    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  onMouseDown(event: MouseEvent): void {
    if (this.images.length <= 1) return;

    event.preventDefault();
    this.isDragging = true;
    this.startX = event.clientX;
    this.stopAutoPlay();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || this.images.length <= 1) return;

    event.preventDefault();
    this.currentX = event.clientX;
    const diffX = this.currentX - this.startX;
    const percentageMoved = (diffX / this.carouselTrack.nativeElement.offsetWidth) * 100;

    // Add resistance at the edges
    if ((this.currentIndex === 0 && diffX > 0 && !this.infiniteLoop) ||
      (this.currentIndex === this.images.length - 1 && diffX < 0 && !this.infiniteLoop)) {
      this.translateX = -this.currentIndex * 100 + percentageMoved * 0.3;
    } else {
      this.translateX = -this.currentIndex * 100 + percentageMoved;
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (!this.isDragging || this.images.length <= 1) return;

    this.isDragging = false;
    const diffX = this.currentX - this.startX;
    const threshold = this.carouselTrack.nativeElement.offsetWidth * 0.2;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        this.previous();
      } else {
        this.next();
      }
    } else {
      this.updateCarouselPosition(true);
    }

    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  get showNavigationArrows(): boolean {
    return this.showArrows && this.images.length > 1;
  }

  get showNavigationDots(): boolean {
    return this.showDots && this.images.length > 1;
  }

  // TrackBy function for performance
  trackByIndex(index: number): number {
    return index;
  }
}
