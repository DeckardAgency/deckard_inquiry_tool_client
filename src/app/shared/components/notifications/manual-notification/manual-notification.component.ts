import { Component, Input, OnInit, Output, EventEmitter, OnDestroy, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-manual-notification',
    imports: [CommonModule],
    templateUrl: './manual-notification.component.html',
    styleUrls: ['./manual-notification.component.scss'],
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
export class ManualNotificationComponent implements OnInit, OnDestroy, OnChanges {
  @Input() visible = false;
  @Input() message = 'Part removed from inquiry.';
  @Input() type: 'success' | 'remove' | 'error' = 'success';
  @Output() viewInquiry = new EventEmitter<void>();
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

  onViewInquiry(): void {
    this.clearAutoCloseTimer();
    this.viewInquiry.emit();
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
