# Inquiry Approval Workflow Implementation Plan

## Overview

This document outlines the implementation of a new approval workflow for inquiries. When a user with role `["ROLE_USER", "ROLE_CLIENT"]` submits an inquiry, it will require approval from a user with role `["ROLE_USER", "ROLE_CLIENT_ADMIN"]` before being officially submitted.

---

## Current State Analysis

### Current Flow
```
User (ROLE_CLIENT) clicks "Place Inquiry"
    ↓
Inquiry created with status = "submitted"
    ↓
User sees "Thanks for placing your Inquiry"
```

### Target Flow
```
User (ROLE_CLIENT) clicks "Place Inquiry"
    ↓
Inquiry created with status = "pending_approval"
    ↓
User sees "Your inquiry has been sent for approval"
    ↓
Client Admin (ROLE_CLIENT_ADMIN) sees inquiry in approval queue
    ↓
Client Admin approves → status = "submitted"
    ↓
Original user notified: "Thanks for placing your Inquiry"
    ↓
OR Client Admin rejects → status = "rejected" / inquiry deleted
```

---

## Part 1: Backend API Changes

### Location: `/Users/nikolagrdanjski/Code/www/deckard/deckard_inquiry_tool_backend_api`

---

### Step 1.1: Add New Status Constant to Inquiry Entity

**File:** `src/Entity/Inquiry.php`

Add new status constants:
```php
// Existing constants
public const STATUS_DRAFT = 'draft';
public const STATUS_SUBMITTED = 'submitted';
// ... other statuses

// NEW: Add these constants
public const STATUS_PENDING_APPROVAL = 'pending_approval';
public const STATUS_REJECTED = 'rejected';
```

---

### Step 1.2: Update Workflow Configuration

**File:** `config/packages/workflow.yaml`

Update the inquiry state machine:

```yaml
framework:
    workflows:
        inquiry:
            type: 'state_machine'
            audit_trail:
                enabled: true
            marking_store:
                type: 'method'
                property: 'status'
            supports:
                - App\Entity\Inquiry
            initial_marking: draft
            places:
                - draft
                - pending_approval    # NEW
                - submitted
                - in_review
                - more_info
                - information_provided
                - in_progress
                - completed
                - canceled
                - rejected            # NEW
            transitions:
                # NEW: Regular user submits for approval
                submit_for_approval:
                    from: draft
                    to: pending_approval

                # NEW: Client admin approves
                approve:
                    from: pending_approval
                    to: submitted

                # NEW: Client admin rejects
                reject:
                    from: pending_approval
                    to: rejected

                # MODIFIED: Direct submit only for admins
                submit:
                    from: draft
                    to: submitted

                # Existing transitions (unchanged)
                review:
                    from: submitted
                    to: in_review
                request_more_info:
                    from: [submitted, in_review, information_provided]
                    to: more_info
                provide_information:
                    from: more_info
                    to: information_provided
                start_progress:
                    from: [submitted, in_review, information_provided]
                    to: in_progress
                complete:
                    from: in_progress
                    to: completed
                cancel:
                    from: [draft, pending_approval, submitted, in_review, more_info, information_provided, in_progress]
                    to: canceled
```

---

### Step 1.3: Create Approval Controller

**File:** `src/Controller/InquiryApprovalController.php` (NEW)

```php
<?php

namespace App\Controller;

use App\Entity\Inquiry;
use App\Service\InquiryLogService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Workflow\WorkflowInterface;

#[AsController]
class InquiryApprovalController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private WorkflowInterface $inquiryStateMachine,
        private InquiryLogService $logService
    ) {}

    /**
     * Get all inquiries pending approval for the current user's client
     */
    #[Route('/api/v1/inquiries/pending-approval', name: 'inquiry_pending_approval', methods: ['GET'])]
    #[IsGranted('ROLE_CLIENT_ADMIN')]
    public function getPendingApprovals(): JsonResponse
    {
        $user = $this->getUser();
        $clientCode = $user->getClient()?->getCode();

        if (!$clientCode) {
            return $this->json(['error' => 'No client associated with user'], 400);
        }

        $inquiries = $this->entityManager->getRepository(Inquiry::class)
            ->findBy([
                'status' => Inquiry::STATUS_PENDING_APPROVAL,
            ]);

        // Filter by client code
        $filteredInquiries = array_filter($inquiries, function($inquiry) use ($clientCode) {
            return $inquiry->getUser()?->getClient()?->getCode() === $clientCode;
        });

        return $this->json(array_values($filteredInquiries), 200, [], [
            'groups' => ['inquiry:read', 'inquiry:item:read']
        ]);
    }

    /**
     * Approve an inquiry (change status from pending_approval to submitted)
     */
    #[Route('/api/v1/inquiries/{id}/approve', name: 'inquiry_approve', methods: ['POST'])]
    #[IsGranted('ROLE_CLIENT_ADMIN')]
    public function approveInquiry(Inquiry $inquiry, Request $request): JsonResponse
    {
        $user = $this->getUser();

        // Verify the inquiry belongs to the same client
        $userClientCode = $user->getClient()?->getCode();
        $inquiryClientCode = $inquiry->getUser()?->getClient()?->getCode();

        if ($userClientCode !== $inquiryClientCode) {
            return $this->json(['error' => 'You can only approve inquiries from your organization'], 403);
        }

        // Check if transition is allowed
        if (!$this->inquiryStateMachine->can($inquiry, 'approve')) {
            return $this->json([
                'error' => 'Cannot approve this inquiry',
                'currentStatus' => $inquiry->getStatus()
            ], 400);
        }

        // Apply the transition
        $this->inquiryStateMachine->apply($inquiry, 'approve');
        $inquiry->setIsDraft(false);

        // Log the approval
        $this->logService->logStatusChange(
            $inquiry,
            Inquiry::STATUS_PENDING_APPROVAL,
            Inquiry::STATUS_SUBMITTED,
            'Inquiry approved by client admin',
            $user
        );

        $this->entityManager->flush();

        // TODO: Send notification to original user

        return $this->json([
            'message' => 'Inquiry approved successfully',
            'inquiry' => $inquiry
        ], 200, [], ['groups' => ['inquiry:read']]);
    }

    /**
     * Reject an inquiry
     */
    #[Route('/api/v1/inquiries/{id}/reject', name: 'inquiry_reject', methods: ['POST'])]
    #[IsGranted('ROLE_CLIENT_ADMIN')]
    public function rejectInquiry(Inquiry $inquiry, Request $request): JsonResponse
    {
        $user = $this->getUser();

        // Verify the inquiry belongs to the same client
        $userClientCode = $user->getClient()?->getCode();
        $inquiryClientCode = $inquiry->getUser()?->getClient()?->getCode();

        if ($userClientCode !== $inquiryClientCode) {
            return $this->json(['error' => 'You can only reject inquiries from your organization'], 403);
        }

        // Check if transition is allowed
        if (!$this->inquiryStateMachine->can($inquiry, 'reject')) {
            return $this->json([
                'error' => 'Cannot reject this inquiry',
                'currentStatus' => $inquiry->getStatus()
            ], 400);
        }

        // Get rejection reason from request
        $data = json_decode($request->getContent(), true);
        $reason = $data['reason'] ?? null;

        // Apply the transition
        $this->inquiryStateMachine->apply($inquiry, 'reject');

        if ($reason) {
            $inquiry->setCancellationReason($reason);
        }
        $inquiry->setCancelledAt(new \DateTimeImmutable());
        $inquiry->setCancelledBy($user);

        // Log the rejection
        $this->logService->logStatusChange(
            $inquiry,
            Inquiry::STATUS_PENDING_APPROVAL,
            Inquiry::STATUS_REJECTED,
            $reason ?? 'Inquiry rejected by client admin',
            $user
        );

        $this->entityManager->flush();

        // TODO: Send notification to original user

        return $this->json([
            'message' => 'Inquiry rejected',
            'inquiry' => $inquiry
        ], 200, [], ['groups' => ['inquiry:read']]);
    }
}
```

---

### Step 1.4: Update InquiryDraftController Submit Logic

**File:** `src/Controller/InquiryDraftController.php`

Modify the `submitDraft` method to check user role:

```php
public function submitDraft(Inquiry $inquiry, Request $request): JsonResponse
{
    $user = $this->getUser();

    // Existing validation...

    // Check user role to determine which transition to use
    $isClientAdmin = in_array('ROLE_CLIENT_ADMIN', $user->getRoles(), true);

    if ($isClientAdmin) {
        // Client admins can submit directly
        $transition = 'submit';
        $newStatus = Inquiry::STATUS_SUBMITTED;
    } else {
        // Regular users need approval
        $transition = 'submit_for_approval';
        $newStatus = Inquiry::STATUS_PENDING_APPROVAL;
    }

    // Apply appropriate transition
    if (!$this->inquiryStateMachine->can($inquiry, $transition)) {
        return $this->json(['error' => 'Cannot submit this inquiry'], 400);
    }

    $this->inquiryStateMachine->apply($inquiry, $transition);
    $inquiry->setIsDraft(false);

    // Log the change
    $this->logService->logStatusChange(
        $inquiry,
        Inquiry::STATUS_DRAFT,
        $newStatus,
        $isClientAdmin ? 'Submitted by client admin' : 'Submitted for approval',
        $user
    );

    $this->entityManager->flush();

    return $this->json([
        'inquiry' => $inquiry,
        'requiresApproval' => !$isClientAdmin
    ], 200, [], ['groups' => ['inquiry:read']]);
}
```

---

### Step 1.5: Update Security Voter for New Status

**File:** `src/Security/Voter/InquiryVoter.php`

Add handling for pending_approval status:

```php
// In voteOnAttribute method, update EDIT and DELETE logic:

private function canEdit(Inquiry $inquiry, User $user): bool
{
    // Admins can always edit
    if (in_array('ROLE_ADMIN', $user->getRoles(), true)) {
        return true;
    }

    // Client admins can edit pending_approval inquiries from their client
    if (in_array('ROLE_CLIENT_ADMIN', $user->getRoles(), true)) {
        $userClientCode = $user->getClient()?->getCode();
        $inquiryClientCode = $inquiry->getUser()?->getClient()?->getCode();

        if ($userClientCode === $inquiryClientCode &&
            $inquiry->getStatus() === Inquiry::STATUS_PENDING_APPROVAL) {
            return true;
        }
    }

    // Regular users can only edit their own drafts
    return $inquiry->getUser() === $user &&
           in_array($inquiry->getStatus(), [
               Inquiry::STATUS_DRAFT,
               Inquiry::STATUS_PENDING_APPROVAL
           ]);
}
```

---

### Step 1.6: Add API Filter for Pending Approval Status

**File:** `src/Entity/Inquiry.php`

Ensure the status filter includes the new status. No changes needed if using SearchFilter on status field.

---

### Step 1.7: Create Database Migration

Run after entity changes:
```bash
php bin/console doctrine:migrations:diff
php bin/console doctrine:migrations:migrate
```

---

### Step 1.8: Add Email Notifications (Optional)

**File:** `src/MessageHandler/InquiryApprovalNotificationHandler.php` (NEW)

Create message handlers for:
- Notify client admin when new inquiry needs approval
- Notify original user when inquiry is approved
- Notify original user when inquiry is rejected

---

## Part 2: Frontend Client Changes

### Location: `/Users/nikolagrdanjski/Code/www/deckard/deckard_inquiry_tool_client`

---

### Step 2.1: Update Inquiry Service

**File:** `src/app/core/services/http/inquiry.service.ts`

Add new methods:

```typescript
// Add new methods

/**
 * Get inquiries pending approval (for client admins)
 */
getPendingApprovalInquiries(): Observable<InquiryCollectionResponse> {
  return this.http.get<InquiryCollectionResponse>(
    `${this.apiUrl}/inquiries/pending-approval`
  );
}

/**
 * Approve an inquiry (client admin only)
 */
approveInquiry(inquiryId: string): Observable<InquiryResponse> {
  return this.http.post<InquiryResponse>(
    `${this.apiUrl}/inquiries/${inquiryId}/approve`,
    {}
  );
}

/**
 * Reject an inquiry (client admin only)
 */
rejectInquiry(inquiryId: string, reason?: string): Observable<InquiryResponse> {
  return this.http.post<InquiryResponse>(
    `${this.apiUrl}/inquiries/${inquiryId}/reject`,
    { reason }
  );
}
```

---

### Step 2.2: Update Inquiry API Models

**File:** `src/app/core/models/api/inquiry-api.model.ts`

Add new status and response fields:

```typescript
// Add to status types
export type InquiryStatus =
  | 'draft'
  | 'pending_approval'  // NEW
  | 'submitted'
  | 'in_review'
  | 'more_info'
  | 'information_provided'
  | 'in_progress'
  | 'completed'
  | 'canceled'
  | 'rejected';  // NEW

// Update response interface
export interface InquirySubmitResponse {
  inquiry: Inquiry;
  requiresApproval: boolean;  // NEW
}
```

---

### Step 2.3: Update Manual Entry Cart Component

**File:** `src/app/features/manual-entry-cart/manual-entry-cart.component.ts`

Modify the `placeInquiry` method:

```typescript
placeInquiry(): void {
  // ... existing validation code ...

  this.manualQuickCartService.submitInquiry(
    this.cartItems,
    this.referenceNumber || undefined
  )
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        this.logger.debug('Inquiry submitted', { response });

        // Clear the cart after successful submission
        this.manualQuickCartService.clearCart();

        // Clear reference number from sessionStorage
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.removeItem('manualInquiryReferenceNumber');
        }

        // Navigate to confirmation page with approval status
        this.router.navigate(['/inquiry-confirmation'], {
          queryParams: {
            inquiryId: response.id || response['@id'] || '',
            inquiryNumber: response.inquiryNumber || '',
            requiresApproval: response.requiresApproval || false  // NEW
          }
        });
      },
      error: (error) => {
        this.logger.error('Error submitting inquiry', error);
        alert('Failed to submit inquiry. Please try again.');
      }
    });
}
```

---

### Step 2.4: Update Inquiry Confirmation Component

**File:** `src/app/features/inquiry-confirmation/inquiry-confirmation.component.ts`

Add handling for approval status:

```typescript
export class InquiryConfirmationComponent implements OnInit {
  // Existing properties...

  requiresApproval: boolean = false;  // NEW

  ngOnInit(): void {
    // Get route params
    this.route.queryParams.subscribe(params => {
      this.inquiryId = params['inquiryId'];
      this.inquiryNumber = params['inquiryNumber'];
      this.requiresApproval = params['requiresApproval'] === 'true';  // NEW
    });

    // Load area manager...
  }
}
```

**File:** `src/app/features/inquiry-confirmation/inquiry-confirmation.component.html`

Update the template:

```html
<div class="inquiry-confirmation">
  <div class="inquiry-confirmation__icon">
    <!-- Show different icon based on status -->
    @if (requiresApproval) {
      <!-- Clock/waiting icon -->
      <svg>...</svg>
    } @else {
      <!-- Checkmark icon -->
      <svg>...</svg>
    }
  </div>

  <h1 class="inquiry-confirmation__title">
    @if (requiresApproval) {
      Your Inquiry Has Been Sent for Approval
    } @else {
      Thanks for Placing Your Inquiry
    }
  </h1>

  <p class="inquiry-confirmation__message">
    @if (requiresApproval) {
      Your inquiry <strong>{{ inquiryNumber }}</strong> has been submitted and is
      awaiting approval from your organization's administrator. You will be
      notified once it has been reviewed.
    } @else {
      Your inquiry <strong>{{ inquiryNumber }}</strong> has been successfully
      submitted. Our team will review it and get back to you shortly.
    }
  </p>

  <!-- Rest of the template... -->
</div>
```

---

### Step 2.5: Create Client Admin Approvals Component

**File:** `src/app/features/client-admin/approvals/client-admin-approvals.component.ts` (NEW)

```typescript
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { InquiryService } from '@services/http/inquiry.service';
import { BreadcrumbsComponent } from '@shared/components/ui/breadcrumbs/breadcrumbs.component';
import { Inquiry } from '@core/models';

@Component({
  selector: 'app-client-admin-approvals',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbsComponent],
  templateUrl: './client-admin-approvals.component.html',
  styleUrls: ['./client-admin-approvals.component.scss']
})
export class ClientAdminApprovalsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  pendingInquiries: Inquiry[] = [];
  loading = true;
  error: string | null = null;

  selectedInquiry: Inquiry | null = null;
  showRejectModal = false;
  rejectReason = '';

  breadcrumbs = [
    { label: 'Client Admin' },
    { label: 'Pending Approvals' }
  ];

  constructor(private inquiryService: InquiryService) {}

  ngOnInit(): void {
    this.loadPendingApprovals();
  }

  loadPendingApprovals(): void {
    this.loading = true;
    this.inquiryService.getPendingApprovalInquiries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.pendingInquiries = response.member;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load pending approvals';
          this.loading = false;
        }
      });
  }

  viewInquiryDetails(inquiry: Inquiry): void {
    this.selectedInquiry = inquiry;
  }

  approveInquiry(inquiry: Inquiry): void {
    if (!confirm('Are you sure you want to approve this inquiry?')) {
      return;
    }

    this.inquiryService.approveInquiry(inquiry.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Remove from list and show success message
          this.pendingInquiries = this.pendingInquiries.filter(i => i.id !== inquiry.id);
          this.selectedInquiry = null;
          // Show success toast/notification
        },
        error: (error) => {
          alert('Failed to approve inquiry. Please try again.');
        }
      });
  }

  openRejectModal(inquiry: Inquiry): void {
    this.selectedInquiry = inquiry;
    this.showRejectModal = true;
    this.rejectReason = '';
  }

  confirmReject(): void {
    if (!this.selectedInquiry) return;

    this.inquiryService.rejectInquiry(this.selectedInquiry.id, this.rejectReason)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pendingInquiries = this.pendingInquiries.filter(
            i => i.id !== this.selectedInquiry!.id
          );
          this.showRejectModal = false;
          this.selectedInquiry = null;
          this.rejectReason = '';
        },
        error: (error) => {
          alert('Failed to reject inquiry. Please try again.');
        }
      });
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
  }
}
```

---

### Step 2.6: Create Approvals Component Template

**File:** `src/app/features/client-admin/approvals/client-admin-approvals.component.html` (NEW)

```html
<div class="client-admin-approvals">
  <app-breadcrumbs [breadcrumbs]="breadcrumbs"></app-breadcrumbs>

  <div class="client-admin-approvals__header">
    <h1>Pending Approvals</h1>
    <p class="client-admin-approvals__subtitle">
      Review and approve inquiries submitted by your team members
    </p>
  </div>

  @if (loading) {
    <div class="client-admin-approvals__loading">
      Loading pending approvals...
    </div>
  } @else if (error) {
    <div class="client-admin-approvals__error">
      {{ error }}
      <button (click)="loadPendingApprovals()">Retry</button>
    </div>
  } @else if (pendingInquiries.length === 0) {
    <div class="client-admin-approvals__empty">
      <svg><!-- Empty state icon --></svg>
      <h2>No Pending Approvals</h2>
      <p>All inquiries from your team have been reviewed.</p>
    </div>
  } @else {
    <div class="client-admin-approvals__list">
      @for (inquiry of pendingInquiries; track inquiry.id) {
        <div class="approval-card">
          <div class="approval-card__header">
            <span class="approval-card__number">{{ inquiry.inquiryNumber }}</span>
            <span class="approval-card__date">
              {{ inquiry.createdAt | date:'medium' }}
            </span>
          </div>

          <div class="approval-card__submitter">
            Submitted by: {{ inquiry.user?.firstName }} {{ inquiry.user?.lastName }}
            ({{ inquiry.user?.email }})
          </div>

          <div class="approval-card__summary">
            {{ inquiry.machines?.length || 0 }} machine(s),
            <!-- Calculate total parts -->
            parts
          </div>

          <div class="approval-card__actions">
            <button
              class="btn btn--secondary"
              (click)="viewInquiryDetails(inquiry)">
              View Details
            </button>
            <button
              class="btn btn--danger"
              (click)="openRejectModal(inquiry)">
              Reject
            </button>
            <button
              class="btn btn--primary"
              (click)="approveInquiry(inquiry)">
              Approve
            </button>
          </div>
        </div>
      }
    </div>
  }

  <!-- Inquiry Details Side Panel -->
  @if (selectedInquiry && !showRejectModal) {
    <div class="details-panel">
      <div class="details-panel__header">
        <h2>Inquiry Details</h2>
        <button (click)="selectedInquiry = null">Close</button>
      </div>

      <div class="details-panel__content">
        <div class="details-panel__field">
          <label>Inquiry Number</label>
          <span>{{ selectedInquiry.inquiryNumber }}</span>
        </div>

        <div class="details-panel__field">
          <label>Submitted By</label>
          <span>
            {{ selectedInquiry.user?.firstName }} {{ selectedInquiry.user?.lastName }}
          </span>
        </div>

        <div class="details-panel__field">
          <label>Contact Email</label>
          <span>{{ selectedInquiry.contactEmail }}</span>
        </div>

        <div class="details-panel__field">
          <label>Contact Phone</label>
          <span>{{ selectedInquiry.contactPhone }}</span>
        </div>

        <!-- Machines and Parts -->
        @for (machine of selectedInquiry.machines; track machine.id) {
          <div class="details-panel__machine">
            <h3>{{ machine.machine?.articleDescription || machine.customMachineId }}</h3>

            @for (part of machine.products; track part.id) {
              <div class="details-panel__part">
                <span>{{ part.partNumber }}</span>
                <span>{{ part.partName }}</span>
                <span>Qty: {{ part.quantity }}</span>
              </div>
            }
          </div>
        }

        <div class="details-panel__actions">
          <button
            class="btn btn--danger"
            (click)="openRejectModal(selectedInquiry)">
            Reject
          </button>
          <button
            class="btn btn--primary"
            (click)="approveInquiry(selectedInquiry)">
            Approve & Submit
          </button>
        </div>
      </div>
    </div>
  }

  <!-- Reject Modal -->
  @if (showRejectModal) {
    <div class="modal-overlay" (click)="closeRejectModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal__header">
          <h2>Reject Inquiry</h2>
          <button (click)="closeRejectModal()">×</button>
        </div>

        <div class="modal__content">
          <p>Are you sure you want to reject inquiry
            <strong>{{ selectedInquiry?.inquiryNumber }}</strong>?
          </p>

          <label for="rejectReason">Reason (optional)</label>
          <textarea
            id="rejectReason"
            [(ngModel)]="rejectReason"
            placeholder="Enter reason for rejection...">
          </textarea>
        </div>

        <div class="modal__actions">
          <button class="btn btn--secondary" (click)="closeRejectModal()">
            Cancel
          </button>
          <button class="btn btn--danger" (click)="confirmReject()">
            Reject Inquiry
          </button>
        </div>
      </div>
    </div>
  }
</div>
```

---

### Step 2.7: Add Route for Approvals

**File:** `src/app/app.routes.ts`

Add the new route under client-admin:

```typescript
{
  path: 'client-admin',
  canActivate: [AuthGuard],
  children: [
    {
      path: 'approvals',  // NEW
      component: ClientAdminApprovalsComponent
    },
    { path: 'history', component: ClientAdminHistoryComponent },
    { path: 'drafts', component: ClientAdminDraftsComponent },
    { path: 'my-machines', component: ClientAdminMyMachinesComponent },
    { path: 'users', component: ClientAdminUsersComponent }
  ]
}
```

---

### Step 2.8: Update Sidebar Navigation

**File:** `src/app/layout/sidebar/sidebar.component.html`

Add link to approvals page for client admins:

```html
@if (hasRole('CLIENT_ADMIN')) {
  <nav class="sidebar__nav">
    <li>
      <!-- NEW: Approvals link with badge -->
      <a routerLink="/client-admin/approvals" routerLinkActive="active">
        <svg><!-- Approval icon --></svg>
        Approvals
        @if (pendingApprovalsCount > 0) {
          <span class="badge">{{ pendingApprovalsCount }}</span>
        }
      </a>
    </li>
    <li>
      <a routerLink="/client-admin/history">History</a>
    </li>
    <!-- ... other links ... -->
  </nav>
}
```

---

### Step 2.9: Add Pending Approvals Count to Sidebar

**File:** `src/app/layout/sidebar/sidebar.component.ts`

Add logic to fetch pending approvals count:

```typescript
pendingApprovalsCount: number = 0;

ngOnInit(): void {
  // Existing code...

  // Load pending approvals count for client admins
  if (this.hasRole('CLIENT_ADMIN')) {
    this.loadPendingApprovalsCount();
  }
}

private loadPendingApprovalsCount(): void {
  this.inquiryService.getPendingApprovalInquiries()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        this.pendingApprovalsCount = response.member.length;
      },
      error: () => {
        this.pendingApprovalsCount = 0;
      }
    });
}
```

---

### Step 2.10: Update Status Display Mapping

**File:** `src/app/core/services/data-mapper.service.ts`

Add mapping for new statuses:

```typescript
private normalizeStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'completed': 'Completed',
    'confirmed': 'Confirmed',
    'processing': 'Processing',
    'cancelled': 'Canceled',
    'canceled': 'Canceled',
    'submitted': 'Submitted',
    'pending': 'Processing',
    'pending_approval': 'Pending Approval',  // NEW
    'rejected': 'Rejected'  // NEW
  };

  return statusMap[status.toLowerCase()] || 'Processing';
}
```

---

### Step 2.11: Update Order Status Constants

**File:** `src/app/shared/components/order-inquiry-table/order-inquiry-table.types.ts`

Add new status constants:

```typescript
export const ORDER_STATUS = {
  CANCELED: 'Canceled',
  COMPLETED: 'Completed',
  DISPATCHED: 'Dispatched',
  CONFIRMED: 'Confirmed',
  SUBMITTED: 'Submitted',
  PENDING_APPROVAL: 'Pending Approval',  // NEW
  REJECTED: 'Rejected'  // NEW
}
```

---

## Part 3: Testing Checklist

### Backend Tests

- [ ] Test workflow transitions (draft → pending_approval → submitted)
- [ ] Test workflow transitions (draft → pending_approval → rejected)
- [ ] Test that ROLE_CLIENT users get pending_approval status
- [ ] Test that ROLE_CLIENT_ADMIN users get submitted status directly
- [ ] Test approval endpoint access control (only client admin)
- [ ] Test rejection endpoint access control (only client admin)
- [ ] Test client isolation (can't approve other client's inquiries)
- [ ] Test API filter for pending_approval status

### Frontend Tests

- [ ] Test inquiry submission shows correct confirmation message
- [ ] Test client admin can see pending approvals
- [ ] Test client admin can view inquiry details
- [ ] Test client admin can approve inquiry
- [ ] Test client admin can reject inquiry with reason
- [ ] Test sidebar shows approval count badge
- [ ] Test status display mapping for new statuses

---

## Part 4: Database Migration Notes

### New Status Values
- `pending_approval` - Inquiry awaiting client admin approval
- `rejected` - Inquiry rejected by client admin

### Index Considerations
- Existing `idx_inquiry_status` index will cover new statuses
- Consider adding composite index on `(status, user.client.code)` for faster approval queries

---

## Part 5: Notification Requirements (Future Enhancement)

### Email Notifications to Implement

1. **To Client Admin** - When new inquiry needs approval
   - Subject: "New inquiry requires your approval"
   - Body: Inquiry details, link to approve

2. **To Original User** - When inquiry is approved
   - Subject: "Your inquiry has been approved"
   - Body: Confirmation, inquiry number, next steps

3. **To Original User** - When inquiry is rejected
   - Subject: "Your inquiry requires attention"
   - Body: Rejection reason, option to resubmit

---

## Implementation Order

### Phase 1: Backend Core (API)
1. Add status constants to Inquiry entity
2. Update workflow configuration
3. Create InquiryApprovalController
4. Update InquiryDraftController submit logic
5. Update InquiryVoter
6. Run database migration
7. Test API endpoints

### Phase 2: Frontend Core (Client)
1. Update inquiry service with new methods
2. Update API models
3. Update manual-entry-cart submission
4. Update inquiry-confirmation page
5. Test submission flow

### Phase 3: Admin Interface (Client)
1. Create client-admin-approvals component
2. Add routing
3. Update sidebar navigation
4. Add pending count badge
5. Test approval/rejection flow

### Phase 4: Polish & Notifications
1. Add email notifications
2. Add success/error toasts
3. Improve UI/UX
4. Add loading states
5. Comprehensive testing

---

## Files to Create/Modify Summary

### Backend (API)

| Action | File |
|--------|------|
| MODIFY | `src/Entity/Inquiry.php` |
| MODIFY | `config/packages/workflow.yaml` |
| CREATE | `src/Controller/InquiryApprovalController.php` |
| MODIFY | `src/Controller/InquiryDraftController.php` |
| MODIFY | `src/Security/Voter/InquiryVoter.php` |
| CREATE | `migrations/VersionXXX.php` (auto-generated) |

### Frontend (Client)

| Action | File |
|--------|------|
| MODIFY | `src/app/core/services/http/inquiry.service.ts` |
| MODIFY | `src/app/core/models/api/inquiry-api.model.ts` |
| MODIFY | `src/app/features/manual-entry-cart/manual-entry-cart.component.ts` |
| MODIFY | `src/app/features/inquiry-confirmation/inquiry-confirmation.component.ts` |
| MODIFY | `src/app/features/inquiry-confirmation/inquiry-confirmation.component.html` |
| CREATE | `src/app/features/client-admin/approvals/client-admin-approvals.component.ts` |
| CREATE | `src/app/features/client-admin/approvals/client-admin-approvals.component.html` |
| CREATE | `src/app/features/client-admin/approvals/client-admin-approvals.component.scss` |
| MODIFY | `src/app/app.routes.ts` |
| MODIFY | `src/app/layout/sidebar/sidebar.component.ts` |
| MODIFY | `src/app/layout/sidebar/sidebar.component.html` |
| MODIFY | `src/app/core/services/data-mapper.service.ts` |
| MODIFY | `src/app/shared/components/order-inquiry-table/order-inquiry-table.types.ts` |

---

## Security Considerations

1. **Client Isolation** - Client admins can only approve/reject inquiries from their own organization
2. **Role Verification** - All approval endpoints require ROLE_CLIENT_ADMIN
3. **Audit Trail** - All status changes are logged via InquiryLog
4. **Workflow Enforcement** - Status transitions validated by Symfony Workflow

---

## Rollback Plan

If issues arise:
1. Revert workflow.yaml to remove new transitions
2. Update InquiryDraftController to always use 'submit' transition
3. Hide client-admin/approvals route
4. Keep status constants for backward compatibility with any inquiries in pending_approval state
