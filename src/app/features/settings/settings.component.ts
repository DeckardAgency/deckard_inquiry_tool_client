import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, BreadcrumbsComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  breadcrumbs = [
    { label: 'Settings' }
  ];

  constructor() {}

  ngOnInit(): void {
    // TODO: Implement settings functionality
  }
}
