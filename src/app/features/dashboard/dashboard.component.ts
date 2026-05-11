import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickActionsComponent } from '@shared/components/dashboard/quick-actions/quick-actions.component';
import { InquiryListComponent } from '@shared/components/inquiry-list/inquiry-list.component';
import { ActivityHistoryComponent } from '@shared/components/dashboard/activity-history/activity-history.component';

@Component({
    selector: 'app-dashboard',
  imports: [
    CommonModule,
    QuickActionsComponent,
    InquiryListComponent,
    ActivityHistoryComponent
  ],
    templateUrl: "dashboard.component.html",
    styleUrls: ['./dashboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  breadcrumbs = [
    { label: 'Dashboard' }
  ];
}
