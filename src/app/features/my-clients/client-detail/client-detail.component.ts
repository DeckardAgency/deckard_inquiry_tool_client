import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { AgentService, ManagedClientResponse } from '@core/services/http/agent.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';
import { Breadcrumb } from '@core/models';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbsComponent],
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss']
})
export class ClientDetailComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  breadcrumbs: Breadcrumb[] = [
    { label: 'My Clients', link: '/my-clients' },
    { label: 'Client Details' }
  ];

  client: ManagedClientResponse | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private agentService: AgentService,
    private agentClientSelectionService: AgentClientSelectionService
  ) {}

  ngOnInit(): void {
    const clientId = this.route.snapshot.paramMap.get('id');
    if (!clientId) {
      this.error = 'Client ID is required';
      this.isLoading = false;
      return;
    }

    this.agentService.getManagedClients()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.client = response.member.find(c => c.id === clientId) || null;
          if (this.client) {
            this.breadcrumbs = [
              { label: 'My Clients', link: '/my-clients' },
              { label: this.client.name }
            ];
          } else {
            this.error = 'Client not found';
          }
        },
        error: () => {
          this.error = 'Failed to load client details';
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/my-clients']);
  }

  createOrder(): void {
    if (this.client) {
      this.agentClientSelectionService.selectClient(this.client);
      this.router.navigate(['/shop']);
    }
  }

  createInquiry(): void {
    if (this.client) {
      this.agentClientSelectionService.selectClient(this.client);
      this.router.navigate(['/manual-entry/input-form']);
    }
  }

  getStatusLabel(): string {
    if (!this.client) return '';
    return this.client.isActive ? 'Active' : 'Inactive';
  }
}
