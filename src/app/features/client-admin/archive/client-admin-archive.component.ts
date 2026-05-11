import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-admin-archive',
  imports: [CommonModule],
  templateUrl: './client-admin-archive.component.html',
  styleUrls: ['./client-admin-archive.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAdminArchiveComponent {
  constructor() {}
}
