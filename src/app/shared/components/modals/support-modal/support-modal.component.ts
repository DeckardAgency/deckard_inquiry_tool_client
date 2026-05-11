import { Component, Input, Output, EventEmitter, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SupportTicketService } from '@core/services/http/support-ticket.service';
import { LoggerService, ScopedLogger } from '@core/services/logger.service';

@Component({
  selector: 'app-support-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './support-modal.component.html',
  styleUrls: ['./support-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(-50px)', opacity: 0 }),
        animate('300ms 100ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(-50px)', opacity: 0 }))
      ])
    ])
  ]
})
export class SupportModalComponent {
  private destroyRef = inject(DestroyRef);
  private supportTicketService = inject(SupportTicketService);
  private loggerService = inject(LoggerService);
  private logger!: ScopedLogger;

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();

  formData = {
    subject: '',
    message: '',
    orderId: '',
    machine: '',
    urgency: 'medium'
  };

  fileName = 'No file chosen';
  isSubmitting = false;
  selectedFile: File | null = null;

  constructor() {
    this.logger = this.loggerService.createLogger('SupportModalComponent');
  }

  close(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.resetForm();
  }

  closeOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.fileName = this.selectedFile.name;
    } else {
      this.selectedFile = null;
      this.fileName = 'No file chosen';
    }
  }

  submitForm(): void {
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    // Prepare form data for multipart/form-data submission
    const formData = new FormData();
    formData.append('subject', this.formData.subject);
    formData.append('message', this.formData.message);
    formData.append('urgency', this.formData.urgency);

    if (this.formData.orderId) {
      formData.append('orderId', this.formData.orderId);
    }

    if (this.formData.machine) {
      formData.append('machine', this.formData.machine);
    }

    if (this.selectedFile) {
      formData.append('attachment', this.selectedFile, this.selectedFile.name);
    }

    this.supportTicketService.createSupportTicket(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.logger.debug('Support ticket created successfully', { ticketId: response.id });
          this.isSubmitting = false;
          this.close();
          alert('Support request sent successfully! We will contact you soon.');
        },
        error: (error) => {
          this.logger.error('Failed to create support ticket', error);
          this.isSubmitting = false;
          alert('Failed to send support request. Please try again.');
        }
      });
  }

  private resetForm(): void {
    this.formData = {
      subject: '',
      message: '',
      orderId: '',
      machine: '',
      urgency: 'medium'
    };
    this.fileName = 'No file chosen';
    this.selectedFile = null;
  }
}
