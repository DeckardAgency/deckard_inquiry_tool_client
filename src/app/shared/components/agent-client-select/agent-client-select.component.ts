import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  HostListener,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  DestroyRef,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AgentService, ManagedClientResponse } from '@core/services/http/agent.service';

@Component({
  selector: 'app-agent-client-select',
  imports: [CommonModule],
  templateUrl: './agent-client-select.component.html',
  styleUrls: ['./agent-client-select.component.scss'],
  host: { style: 'display: block; width: 100%;' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentClientSelectComponent implements OnInit {
  @Input() selectedClients: ManagedClientResponse[] = [];
  @Output() clientSelected = new EventEmitter<ManagedClientResponse>();
  @Output() clientDeselected = new EventEmitter<ManagedClientResponse>();

  clients: ManagedClientResponse[] = [];
  isOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  private agentService = inject(AgentService);
  private elementRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadClients();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isOpen.update(value => !value);
  }

  isSelected(client: ManagedClientResponse): boolean {
    return this.selectedClients.some(c => c.id === client.id);
  }

  toggleClient(client: ManagedClientResponse, event: Event): void {
    event.stopPropagation();
    if (this.isSelected(client)) {
      this.clientDeselected.emit(client);
    } else {
      this.clientSelected.emit(client);
    }
  }

  removeClient(client: ManagedClientResponse, event: Event): void {
    event.stopPropagation();
    this.clientDeselected.emit(client);
  }

  private loadClients(): void {
    this.isLoading.set(true);
    this.agentService.getManagedClients()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.clients = response.member || [];
          this.isLoading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }
      });
  }
}
