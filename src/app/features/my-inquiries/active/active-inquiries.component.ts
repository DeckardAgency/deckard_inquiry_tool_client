import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { InquiryListComponent } from '@shared/components/inquiry-list/inquiry-list.component';

@Component({
  selector: 'app-active-inquiries',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent, InquiryListComponent],
  templateUrl: './active-inquiries.component.html',
  styleUrls: ['./active-inquiries.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveInquiriesComponent {
  breadcrumbs = [
    { label: 'My Inquiries', link: '/my-inquiries' },
    { label: 'Active' }
  ];
}
