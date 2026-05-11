import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { ManagedClientResponse } from './http/agent.service';

@Injectable({ providedIn: 'root' })
export class AgentClientSelectionService {
  private selectedClientSubject = new BehaviorSubject<ManagedClientResponse | null>(null);
  public selectedClient$ = this.selectedClientSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Restore from localStorage on init
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('agentSelectedClient');
      if (saved) {
        try {
          this.selectedClientSubject.next(JSON.parse(saved));
        } catch {
          // Ignore invalid JSON
        }
      }
    }
  }

  selectClient(client: ManagedClientResponse): void {
    this.selectedClientSubject.next(client);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('agentSelectedClient', JSON.stringify(client));
    }
  }

  clearSelection(): void {
    this.selectedClientSubject.next(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('agentSelectedClient');
    }
  }

  getSelectedClient(): ManagedClientResponse | null {
    return this.selectedClientSubject.value;
  }
}
