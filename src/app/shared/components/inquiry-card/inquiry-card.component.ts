import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { DateFilterPipe } from '@shared/pipes/date-filter.pipe';
import { Inquiry } from '@core/models';

@Component({
    selector: 'app-inquiry-card',
    templateUrl: './inquiry-card.component.html',
    styleUrls: ['./inquiry-card.component.scss'],
  imports: [CommonModule, RouterModule, DateFilterPipe],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('400ms ease-out', style({ opacity: 1 }))
            ])
        ])
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InquiryCardComponent {
  @Input() inquiry!: Inquiry;

  readonly statusLabelMap: Record<string, string> = {
    'submitted': 'Submitted',
    'in_review': 'In Review',
    'more_info': 'More Info',
    'information_provided': 'Information Provided',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'accepted': 'Accepted',
    'canceled': 'Canceled',
    'dispatched': 'Dispatched',
    'confirmed': 'Confirmed',
    'pending_approval': 'Pending Approval',
    'draft': 'Draft'
  };

  getStatusLabel(status: string): string {
    const normalizedStatus = status?.toLowerCase().replace(/-/g, '_');
    return this.statusLabelMap[normalizedStatus] || status;
  }
}
