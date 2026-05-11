import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-admin-bin',
  imports: [CommonModule],
  templateUrl: './client-admin-bin.component.html',
  styleUrls: ['./client-admin-bin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAdminBinComponent {
  constructor() {}
}
