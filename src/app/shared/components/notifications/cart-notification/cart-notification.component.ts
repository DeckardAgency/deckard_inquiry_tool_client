import { Component, Input, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-cart-notification',
    imports: [CommonModule],
    templateUrl: './cart-notification.component.html',
    styleUrls: ['./cart-notification.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('slideInOut', [
            transition(':enter', [
                style({ transform: 'translateY(100%)', opacity: 0 }),
                animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('300ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
            ])
        ])
    ]
})
export class CartNotificationComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Input() message = 'Part added to cart.';
  @Input() type: 'success' | 'remove' = 'success';
  @Output() viewCart = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  timeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    if (this.visible) {
      this.startAutoCloseTimer();
    }
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.startAutoCloseTimer();
    } else {
      this.clearAutoCloseTimer();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoCloseTimer();
  }

  onViewCart(): void {
    this.clearAutoCloseTimer();
    this.viewCart.emit();
  }

  onClose(): void {
    this.clearAutoCloseTimer();
    this.close.emit();
  }

  private startAutoCloseTimer(): void {
    this.clearAutoCloseTimer();
    this.timeoutId = setTimeout(() => {
      this.close.emit();
    }, 3000); // Auto close after 3 seconds
  }

  private clearAutoCloseTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
