import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { InquiryListComponent } from '@shared/components/inquiry-list/inquiry-list.component';

@Component({
  selector: 'app-active-orders',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent, InquiryListComponent],
  templateUrl: './active-orders.component.html',
  styleUrls: ['./active-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveOrdersComponent {
  breadcrumbs = [
    { label: 'My Orders', link: '/my-orders' },
    { label: 'Active' }
  ];
}
