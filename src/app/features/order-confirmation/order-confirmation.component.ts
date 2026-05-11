import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { Breadcrumb } from '@core/models';
import { AuthService } from '@core/auth/auth.service';
import { AreaManagerService, AreaManager, AreaManagerUser } from '@services/http/area-manager.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-order-confirmation',
    imports: [CommonModule, ReactiveFormsModule, RouterModule, BreadcrumbsComponent],
    templateUrl: './order-confirmation.component.html',
    styleUrls: ['./order-confirmation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderConfirmationComponent implements OnInit {

    breadcrumbs: Breadcrumb[] = [
        { label: 'Dashboard', link: '/dashboard' },
        { label: 'Order Confirmation' }
    ];

    // Order details from query params
    orderId: string | null = null;
    orderNumber: string | null = null;
    orderStatus: string | null = null;
    isPendingApproval = false;

    // Primary area manager
    primaryManager: AreaManagerUser | null = null;
    managerLoading = true;
    managerError = false;

    constructor(
        private route: ActivatedRoute,
        private authService: AuthService,
        private areaManagerService: AreaManagerService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        // Get order details from query params
        this.route.queryParams.subscribe(params => {
            this.orderId = params['orderId'] || null;
            this.orderNumber = params['orderNumber'] || null;
            this.orderStatus = params['status'] || null;
            this.isPendingApproval = this.orderStatus === 'pending_approval';
            this.cdr.markForCheck();
        });

        // Load primary area manager for the user's client
        this.loadPrimaryManager();
    }

    private loadPrimaryManager(): void {
        const user = this.authService.getCurrentUser();
        if (!user?.client?.id) {
            this.managerLoading = false;
            this.managerError = true;
            this.cdr.markForCheck();
            return;
        }

        this.areaManagerService.getPrimaryManagerByClient(user.client.id)
            .pipe(finalize(() => {
                this.managerLoading = false;
                this.cdr.markForCheck();
            }))
            .subscribe({
                next: (areaManager) => {
                    if (areaManager && this.isManagerObject(areaManager.manager)) {
                        this.primaryManager = areaManager.manager as AreaManagerUser;
                    } else {
                        this.managerError = true;
                    }
                },
                error: (err) => {
                    console.error('Error loading primary manager:', err);
                    this.managerError = true;
                }
            });
    }

    private isManagerObject(manager: any): boolean {
        return manager && typeof manager === 'object' && manager.firstName !== undefined;
    }

    get managerFullName(): string {
        if (this.primaryManager) {
            return `${this.primaryManager.firstName} ${this.primaryManager.lastName}`;
        }
        return 'Your Area Manager';
    }

    get managerPhone(): string | null {
        return this.primaryManager?.phoneNumber || null;
    }

    get managerEmail(): string | null {
        return this.primaryManager?.email || null;
    }

    get hasContactInfo(): boolean {
        return !!(this.managerPhone || this.managerEmail);
    }
}
