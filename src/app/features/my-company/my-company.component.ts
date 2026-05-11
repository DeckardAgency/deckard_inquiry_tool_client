import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { AuthService } from '@core/auth/auth.service';
import { User } from '@core/models';

@Component({
  selector: 'app-my-company',
  imports: [CommonModule, BreadcrumbsComponent],
  templateUrl: './my-company.component.html',
  styleUrls: ['./my-company.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyCompanyComponent implements OnInit {
  breadcrumbs = [
    { label: 'My Company' }
  ];

  currentUser: User | null = null;
  companyName: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser && this.currentUser.client) {
      this.companyName = this.currentUser.client.name;
    }
  }
}
