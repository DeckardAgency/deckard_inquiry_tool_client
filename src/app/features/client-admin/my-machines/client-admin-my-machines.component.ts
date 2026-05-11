import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-admin-my-machines',
  imports: [CommonModule],
  templateUrl: './client-admin-my-machines.component.html',
  styleUrls: ['./client-admin-my-machines.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAdminMyMachinesComponent {
  constructor() {}
}
