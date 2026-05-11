# Inquiry Approval Workflow - Edge Cases & Refinement Handling

## Overview

This document addresses edge cases in the inquiry approval workflow, specifically focusing on scenarios where an inquiry needs editing or refinement before it can be approved.

---

## The Core Problem

When a **Client Administrator** reviews an inquiry submitted by a team member, the inquiry may not always be perfect. There are several possible scenarios:

### Scenario Analysis

| Scenario | Example | Desired Action |
|----------|---------|----------------|
| **Inquiry is correct** | All parts, quantities, and details are accurate | Approve and submit to Deckard |
| **Minor mistake** | Typo in part number: "STA-1234" should be "STA-12345" | Send back for correction, user fixes and resubmits |
| **Missing information** | Quantity not specified for one part | Send back to user to add the missing quantity |
| **Wrong machine selected** | User selected wrong machine from list | Send back to user to correct machine selection |
| **Duplicate inquiry** | Same parts already requested in another inquiry | Cancel (not reject) - neutral action |
| **Unauthorized request** | User requesting parts they shouldn't order | Reject with explanation |
| **Business decision** | Budget constraints, project canceled | Reject or Cancel depending on context |

### Current Limitation

With only **Approve** and **Reject** options:

| Action | Meaning | Problem |
|--------|---------|---------|
| **Approve** | Inquiry is perfect, send to Deckard | ✅ Works correctly |
| **Reject** | Inquiry is denied, final decision | ❌ Too harsh for fixable mistakes |

**"Reject" implies finality** - the inquiry is denied and cannot proceed. But in many cases, the admin just wants the user to **fix a small issue and try again**. Using "Reject" for this:
- Discourages users (feels like failure)
- Loses context (user must start over)
- Creates confusion about whether to resubmit

### The Gap

We need a **middle option** that says:
> "This inquiry has potential, but needs some corrections before I can approve it."

This is the **"Request Changes"** or **"Needs Revision"** flow.

---

## Proposed Solution: Request Changes Flow

### New Status: `needs_revision`

Add a new status that allows the inquiry to go back to the user for corrections without being rejected.

### Complete Status Flow Diagram

```
                                 ┌─────────────┐
                                 │    DRAFT    │
                                 │  (user is   │
                                 │  creating)  │
                                 └──────┬──────┘
                                        │
                    User clicks "Place Inquiry"
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │  PENDING_APPROVAL   │
                              │ (waiting for admin) │
                              └──────────┬──────────┘
                                         │
            ┌────────────────────────────┼────────────────────────────┐
            │                            │                            │
            │                            │                            │
            ▼                            ▼                            ▼
   ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
   │    APPROVED     │         │ NEEDS_REVISION  │         │    REJECTED     │
   │                 │         │                 │         │                 │
   │  Admin clicks   │         │  Admin clicks   │         │  Admin clicks   │
   │   "Approve"     │         │ "Request Change"│         │    "Reject"     │
   └────────┬────────┘         └────────┬────────┘         └─────────────────┘
            │                           │                           │
            │                           │                           │
            ▼                           ▼                           ▼
   ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
   │    SUBMITTED    │         │   User sees     │         │   FINAL END     │
   │                 │         │   feedback and  │         │                 │
   │  Sent to        │         │   edits inquiry │         │  User can clone │
   │  Deckard     │         │                 │         │  and start new  │
   └─────────────────┘         └────────┬────────┘         └─────────────────┘
                                        │
                          User clicks "Resubmit"
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │  PENDING_APPROVAL   │◀──────────────────────┐
                              │ (back for review)   │                       │
                              └──────────┬──────────┘                       │
                                         │                                  │
                                         │                        (cycle can repeat
                                         │                         if still needs
                                         ▼                          changes)
                                  Admin reviews
                                    again...
```

### Revision Cycle Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REVISION CYCLE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                         ┌──────────────────┐         │
│  │  PENDING_APPROVAL │ ◀─────────────────────│   NEEDS_REVISION  │         │
│  │                   │        User            │                   │         │
│  │  Admin reviews    │      resubmits         │  User makes       │         │
│  │  the inquiry      │                        │  corrections      │         │
│  └─────────┬─────────┘                        └─────────▲─────────┘         │
│            │                                            │                   │
│            │                                            │                   │
│            │  Admin clicks                              │                   │
│            │  "Request Changes"                         │                   │
│            │  with feedback                             │                   │
│            │                                            │                   │
│            └────────────────────────────────────────────┘                   │
│                                                                             │
│  This cycle can repeat until:                                               │
│  • Admin approves → SUBMITTED                                               │
│  • Admin rejects → REJECTED                                                 │
│  • User cancels → CANCELED                                                  │
│  • Admin cancels → CANCELED                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Action Comparison

| Action | When to Use | Result | Can User Resubmit? |
|--------|-------------|--------|-------------------|
| **Approve** | Inquiry is correct and complete | → SUBMITTED (sent to Deckard) | N/A |
| **Request Changes** | Fixable issues, needs corrections | → NEEDS_REVISION (back to user) | ✅ Yes, same inquiry |
| **Reject** | Should not proceed, serious issues | → REJECTED (final) | ❌ Must clone as new |
| **Cancel** | No longer needed, duplicate, neutral | → CANCELED (final) | ❌ Must clone as new |

---

## Bypassing Approval: Trusted Users

### The Question

Can some users with `["ROLE_USER", "ROLE_CLIENT"]` submit inquiries **without** requiring `["ROLE_USER", "ROLE_CLIENT_ADMIN"]` approval?

### Answer: Yes!

There are several approaches to achieve this:

---

### Approach 1: New Role - `ROLE_CLIENT_TRUSTED`

Add a new role that grants direct submission privileges.

**User Roles Comparison:**

| Role Combination | Can Submit Directly? | Needs Approval? |
|------------------|---------------------|-----------------|
| `ROLE_USER, ROLE_CLIENT` | ❌ No | ✅ Yes |
| `ROLE_USER, ROLE_CLIENT, ROLE_CLIENT_TRUSTED` | ✅ Yes | ❌ No |
| `ROLE_USER, ROLE_CLIENT_ADMIN` | ✅ Yes | ❌ No |

**Implementation:**

```php
// Backend: InquiryDraftController.php
public function submitDraft(Inquiry $inquiry): JsonResponse
{
    $user = $this->getUser();
    $roles = $user->getRoles();

    // Check if user can submit directly
    $canSubmitDirectly =
        in_array('ROLE_CLIENT_ADMIN', $roles) ||
        in_array('ROLE_CLIENT_TRUSTED', $roles);

    if ($canSubmitDirectly) {
        // Direct submission
        $this->workflow->apply($inquiry, 'submit');
    } else {
        // Needs approval
        $this->workflow->apply($inquiry, 'submit_for_approval');
    }
}
```

**Pros:**
- ✅ Simple to implement
- ✅ Clear permission model
- ✅ Easy to audit who has this privilege

**Cons:**
- ❌ All-or-nothing per user
- ❌ Requires role management in admin panel

---

### Approach 2: User Flag - `canSubmitWithoutApproval`

Add a boolean field to the User entity.

**Database Change:**

```php
// User.php Entity
#[ORM\Column(type: 'boolean', options: ['default' => false])]
private bool $canSubmitWithoutApproval = false;
```

**Implementation:**

```php
// Backend: InquiryDraftController.php
$canSubmitDirectly =
    in_array('ROLE_CLIENT_ADMIN', $user->getRoles()) ||
    $user->canSubmitWithoutApproval();
```

**UI for Client Admin:**

```
┌─────────────────────────────────────────────────────────────┐
│  USER MANAGEMENT                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Name: John Smith                                           │
│  Email: john@company.com                                    │
│  Role: Standard User                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Can submit inquiries without approval              │   │
│  │                                                      │   │
│  │   When enabled, this user's inquiries will be sent  │   │
│  │   directly to Deckard without admin review.      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Granular control per user
- ✅ Client Admin can manage this
- ✅ No new role needed

**Cons:**
- ❌ Another field to manage
- ❌ Could be forgotten when setting up users

---

### Approach 3: Client-Level Setting

Enable/disable approval workflow for the entire company.

**Database Change:**

```php
// Client.php Entity
#[ORM\Column(type: 'boolean', options: ['default' => true])]
private bool $requiresInquiryApproval = true;
```

**Implementation:**

```php
// Backend: InquiryDraftController.php
$client = $user->getClient();
$requiresApproval = $client?->requiresInquiryApproval() ?? true;

$canSubmitDirectly =
    in_array('ROLE_CLIENT_ADMIN', $user->getRoles()) ||
    !$requiresApproval;
```

**UI for Deckard Admin or Client Admin:**

```
┌─────────────────────────────────────────────────────────────┐
│  COMPANY SETTINGS                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Company: ACME Corporation                                  │
│                                                             │
│  Inquiry Approval Workflow:                                 │
│                                                             │
│  ○ Enabled  - All inquiries require admin approval         │
│  ● Disabled - Users can submit directly to Deckard      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Simple on/off for entire company
- ✅ Some companies may not need approval
- ✅ Reduces complexity for small teams

**Cons:**
- ❌ All-or-nothing for company
- ❌ No per-user control

---

### Approach 4: Combined - Role + User Flag + Client Setting

The most flexible solution combines all approaches:

**Decision Logic:**

```php
public function requiresApproval(User $user): bool
{
    // 1. Client Admins never need approval
    if (in_array('ROLE_CLIENT_ADMIN', $user->getRoles())) {
        return false;
    }

    // 2. Trusted role users don't need approval
    if (in_array('ROLE_CLIENT_TRUSTED', $user->getRoles())) {
        return false;
    }

    // 3. Users with explicit flag don't need approval
    if ($user->canSubmitWithoutApproval()) {
        return false;
    }

    // 4. Check company-level setting
    $client = $user->getClient();
    if ($client && !$client->requiresInquiryApproval()) {
        return false;
    }

    // 5. Default: requires approval
    return true;
}
```

**Priority Order:**

```
┌────────────────────────────────────────────────────────────────┐
│                    APPROVAL DECISION TREE                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Is user ROLE_CLIENT_ADMIN?                                    │
│      │                                                         │
│      ├── YES ──▶ Submit directly (no approval needed)         │
│      │                                                         │
│      └── NO                                                    │
│           │                                                    │
│           ▼                                                    │
│  Is user ROLE_CLIENT_TRUSTED?                                  │
│      │                                                         │
│      ├── YES ──▶ Submit directly (no approval needed)         │
│      │                                                         │
│      └── NO                                                    │
│           │                                                    │
│           ▼                                                    │
│  Does user have canSubmitWithoutApproval = true?               │
│      │                                                         │
│      ├── YES ──▶ Submit directly (no approval needed)         │
│      │                                                         │
│      └── NO                                                    │
│           │                                                    │
│           ▼                                                    │
│  Is company approval disabled?                                 │
│      │                                                         │
│      ├── YES ──▶ Submit directly (no approval needed)         │
│      │                                                         │
│      └── NO                                                    │
│           │                                                    │
│           ▼                                                    │
│  ┌─────────────────────────────────────────────┐              │
│  │  REQUIRES APPROVAL                           │              │
│  │  Submit to pending_approval status           │              │
│  └─────────────────────────────────────────────┘              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Approach 5: Threshold-Based Approval

Approval required based on inquiry characteristics.

**Rules Examples:**

| Condition | Requires Approval? |
|-----------|-------------------|
| Inquiry has ≤ 5 parts | ❌ No |
| Inquiry has > 5 parts | ✅ Yes |
| Total quantity ≤ 10 | ❌ No |
| Total quantity > 10 | ✅ Yes |
| Contains "urgent" note | ✅ Yes |
| First inquiry from user | ✅ Yes |
| User has > 10 approved inquiries | ❌ No |

**Implementation:**

```php
public function requiresApproval(Inquiry $inquiry, User $user): bool
{
    // Admin check first
    if (in_array('ROLE_CLIENT_ADMIN', $user->getRoles())) {
        return false;
    }

    // Get threshold settings from client
    $client = $user->getClient();
    $maxPartsWithoutApproval = $client->getMaxPartsWithoutApproval() ?? 5;
    $maxQuantityWithoutApproval = $client->getMaxQuantityWithoutApproval() ?? 10;

    // Count parts and quantity
    $totalParts = $inquiry->getTotalPartsCount();
    $totalQuantity = $inquiry->getTotalQuantity();

    // Check thresholds
    if ($totalParts > $maxPartsWithoutApproval) {
        return true;
    }

    if ($totalQuantity > $maxQuantityWithoutApproval) {
        return true;
    }

    return false;
}
```

**Pros:**
- ✅ Automatic decision based on risk
- ✅ Small inquiries flow quickly
- ✅ Large inquiries get reviewed

**Cons:**
- ❌ More complex logic
- ❌ Thresholds need configuration
- ❌ Users might not understand when approval is needed

---

### Recommendation

**For MVP (Phase 1):** Use **Approach 2 - User Flag**

| Reason | Explanation |
|--------|-------------|
| Simple | Just one boolean field |
| Flexible | Per-user control |
| Admin-managed | Client Admin can grant/revoke |
| No role changes | Works with existing roles |

**For Future (Phase 2+):** Add **Approach 3 - Client Setting**

Allow companies to disable approval entirely if they don't need it.

---

### Implementation Summary for User Flag Approach

#### Backend Changes

**1. Update User Entity:**

```php
// src/Entity/User.php

#[ORM\Column(type: 'boolean', options: ['default' => false])]
private bool $canSubmitWithoutApproval = false;

public function canSubmitWithoutApproval(): bool
{
    return $this->canSubmitWithoutApproval;
}

public function setCanSubmitWithoutApproval(bool $value): self
{
    $this->canSubmitWithoutApproval = $value;
    return $this;
}
```

**2. Update Submit Logic:**

```php
// src/Controller/InquiryDraftController.php

$canSubmitDirectly =
    in_array('ROLE_CLIENT_ADMIN', $user->getRoles()) ||
    $user->canSubmitWithoutApproval();

$transition = $canSubmitDirectly ? 'submit' : 'submit_for_approval';
$this->workflow->apply($inquiry, $transition);
```

**3. Add API Field:**

```php
// Serialization groups to expose field
#[Groups(['user:read', 'user:write', 'user:admin'])]
private bool $canSubmitWithoutApproval = false;
```

#### Frontend Changes

**1. Update User Management UI:**

In Client Admin → Users, add checkbox:

```html
<div class="form-field">
  <label>
    <input
      type="checkbox"
      [(ngModel)]="user.canSubmitWithoutApproval"
    />
    Can submit inquiries without approval
  </label>
  <p class="hint">
    When enabled, this user's inquiries will be sent
    directly to Deckard without admin review.
  </p>
</div>
```

**2. Update User Model:**

```typescript
// auth.model.ts
export interface User {
  // ... existing fields
  canSubmitWithoutApproval?: boolean;
}
```

**3. Show Indicator in Confirmation:**

```typescript
// Check if user needed approval
const currentUser = this.authService.getCurrentUser();
const requiresApproval =
  !currentUser?.roles?.includes('ROLE_CLIENT_ADMIN') &&
  !currentUser?.canSubmitWithoutApproval;
```

---

### User Experience Summary

**For Client Admin Managing Users:**

```
┌─────────────────────────────────────────────────────────────┐
│  USERS                                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 John Smith                                        │   │
│  │    john@company.com                                  │   │
│  │    Role: Standard User                               │   │
│  │    ✓ Can submit without approval                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 Jane Doe                                          │   │
│  │    jane@company.com                                  │   │
│  │    Role: Standard User                               │   │
│  │    ○ Requires approval                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 Admin User                                        │   │
│  │    admin@company.com                                 │   │
│  │    Role: Client Admin                                │   │
│  │    ✓ Can submit without approval (always)            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**For User Submitting Inquiry:**

The user doesn't need to know about this setting - the system automatically routes their inquiry based on their permissions.

---

## Edge Case Scenarios

### Scenario 1: Inquiry Needs Minor Changes

**Situation:** Team member submits inquiry with a typo in part number or wrong quantity.

**From Client Admin Perspective:**

1. Admin sees inquiry in approval queue
2. Admin clicks **"Request Changes"** (not Reject)
3. Admin enters specific feedback:
   - "Part number STA-12345 should be STA-12346"
   - "Please verify quantity for item #3"
4. Inquiry status changes to `needs_revision`
5. Original user is notified

**From Team Member Perspective:**

1. User receives notification: "Your inquiry needs revision"
2. User sees inquiry in "My Inquiries" with status "Needs Revision"
3. User clicks to view feedback from admin
4. User clicks **"Edit & Resubmit"**
5. Inquiry opens in editable mode
6. User makes corrections
7. User clicks **"Resubmit for Approval"**
8. Status returns to `pending_approval`
9. Admin is notified of resubmission

---

### Scenario 2: Admin Wants to Fix It Themselves

**Situation:** Admin notices a small issue and wants to correct it directly rather than sending back.

**Option A: Admin Can Edit Before Approving**

1. Admin clicks **"Edit"** on pending inquiry
2. Admin makes corrections
3. Admin clicks **"Save & Approve"**
4. Inquiry is submitted with admin's corrections
5. Log records: "Edited by [Admin Name] before approval"

**Option B: Admin Cannot Edit (Simpler)**

1. Admin must use "Request Changes"
2. Original user always makes the corrections
3. Maintains clear ownership and audit trail

**Recommendation:** Start with Option B (simpler), add Option A later if needed.

---

### Scenario 3: Team Member Wants to Cancel Pending Inquiry

**Situation:** User submitted inquiry but realized they made a mistake or no longer need it.

**Flow:**

1. User goes to "My Inquiries"
2. User sees inquiry with status "Pending Approval"
3. User clicks **"Cancel Inquiry"**
4. User confirms cancellation (optional reason)
5. Status changes to `canceled`
6. Admin is notified (optional)

**Rules:**
- User can only cancel their own inquiries
- User can only cancel if status is `pending_approval` or `needs_revision`
- Cannot cancel once approved/submitted

---

### Scenario 4: Admin Wants to Cancel (Not Reject)

**Situation:** Admin decides inquiry shouldn't proceed but "reject" sounds too negative.

**Options:**

| Action | Use When | Tone |
|--------|----------|------|
| **Reject** | Inquiry has issues, user should fix and try again | Corrective |
| **Cancel** | Inquiry no longer needed, duplicate, or business decision | Neutral |

**Flow for Cancel:**

1. Admin clicks **"Cancel"** instead of "Reject"
2. Admin optionally enters reason
3. Status changes to `canceled`
4. User is notified

---

### Scenario 5: Multiple Revision Cycles

**Situation:** Inquiry goes back and forth multiple times.

```
User Submits → Admin: "Fix part number" → User Fixes →
Admin: "Also fix quantity" → User Fixes → Admin Approves
```

**Handling:**

1. Each revision creates a log entry
2. Revision counter tracks cycles (optional)
3. After N revisions (e.g., 3), show warning to admin
4. Full history visible to both parties

**Implementation:**
- Add `revisionCount` field to inquiry (optional)
- Each `needs_revision` → `pending_approval` cycle increments counter
- Display revision history in inquiry details

---

### Scenario 6: No Admin Available

**Situation:** Client Admin is on vacation, no one to approve.

**Options:**

| Solution | Pros | Cons |
|----------|------|------|
| Multiple admins per client | Backup coverage | Complexity |
| Escalation to Deckard | Always available | Bypasses client control |
| Time-based auto-approval | No blockage | Risk of unapproved orders |
| Delegation feature | Flexible | Implementation effort |

**Recommended Approach:**

1. **Encourage multiple Client Admins** per organization
2. **Admin can delegate** temporarily to another user
3. **No auto-approval** (too risky)

---

### Scenario 7: Partial Approval (Advanced)

**Situation:** Inquiry has 5 machines. Admin wants to approve 3, request changes on 2.

**Options:**

| Approach | Description |
|----------|-------------|
| **All or nothing** | Entire inquiry approved or needs revision |
| **Split inquiry** | Approved parts become new inquiry, rest stays for revision |
| **Item-level status** | Each machine/part has own approval status |

**Recommended:** Start with "All or nothing" for simplicity.

**Future Enhancement:** Add ability to split inquiry if needed.

---

### Scenario 8: Conflicting Actions

**Situation:** Admin clicks "Approve" at same moment user clicks "Cancel".

**Handling:**
- Use optimistic locking (version field)
- First action wins
- Second action shows error: "Inquiry status has changed. Please refresh."

---

### Scenario 9: Resubmission After Rejection

**Situation:** User's inquiry was rejected, but they want to try again.

**Options:**

| Approach | Flow |
|----------|------|
| **Clone rejected inquiry** | User clicks "Clone", gets copy to edit and resubmit |
| **Reopen rejected inquiry** | Change status back to draft (messy audit trail) |
| **Start fresh** | User creates entirely new inquiry |

**Recommended:** **Clone approach**
- Preserves original rejected inquiry for records
- User gets pre-filled data to modify
- Clear audit trail

---

## Updated Status Definitions

| Status | Description | Can User Edit? | Can User Cancel? |
|--------|-------------|----------------|------------------|
| `draft` | Saved, not submitted | ✅ Yes | ✅ Yes (delete) |
| `pending_approval` | Awaiting admin review | ❌ No | ✅ Yes |
| `needs_revision` | Admin requested changes | ✅ Yes | ✅ Yes |
| `rejected` | Admin declined | ❌ No | ❌ No |
| `submitted` | Sent to Deckard | ❌ No | ⚠️ Request only |
| `in_review` | Deckard reviewing | ❌ No | ⚠️ Request only |
| `more_info` | Info requested | ✅ Respond only | ⚠️ Request only |
| `information_provided` | User responded | ❌ No | ⚠️ Request only |
| `in_progress` | Being processed | ❌ No | ❌ No |
| `completed` | Done | ❌ No | ❌ No |
| `canceled` | Canceled | ❌ No | ❌ No |

---

## Updated Workflow Transitions

### Backend Workflow Configuration

```yaml
framework:
    workflows:
        inquiry:
            type: 'state_machine'
            places:
                - draft
                - pending_approval
                - needs_revision      # NEW
                - rejected
                - submitted
                - in_review
                - more_info
                - information_provided
                - in_progress
                - completed
                - canceled

            transitions:
                # User submits for approval
                submit_for_approval:
                    from: draft
                    to: pending_approval

                # Admin requests changes
                request_changes:          # NEW
                    from: pending_approval
                    to: needs_revision

                # User resubmits after changes
                resubmit:                 # NEW
                    from: needs_revision
                    to: pending_approval

                # Admin approves
                approve:
                    from: pending_approval
                    to: submitted

                # Admin rejects (final)
                reject:
                    from: pending_approval
                    to: rejected

                # Direct submit (admin's own inquiry)
                submit:
                    from: draft
                    to: submitted

                # Cancel (from multiple states)
                cancel:
                    from: [draft, pending_approval, needs_revision]
                    to: canceled

                # ... other existing transitions
```

---

## API Endpoints

### New Endpoints Needed

| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| POST | `/inquiries/{id}/request-changes` | Admin requests changes | CLIENT_ADMIN |
| POST | `/inquiries/{id}/resubmit` | User resubmits after changes | USER (owner) |
| PATCH | `/inquiries/{id}` | Edit inquiry (when allowed) | USER (owner) |
| POST | `/inquiries/{id}/clone` | Clone a rejected inquiry | USER |

### Request Changes Payload

```json
POST /api/v1/inquiries/{id}/request-changes

{
  "feedback": "Please correct the part number for item #2. Should be STA-12346.",
  "affectedItems": ["machine-uuid-1", "part-uuid-3"]  // optional
}
```

### Resubmit Payload

```json
POST /api/v1/inquiries/{id}/resubmit

{
  "notes": "Corrected part numbers as requested."  // optional
}
```

---

## UI Components Needed

### For Client Admin

1. **Approval Queue** (existing, enhanced)
   - Add "Request Changes" button alongside Approve/Reject
   - Add feedback text area when requesting changes

2. **Revision History Panel**
   - Show all previous feedback
   - Show revision count
   - Show timeline of status changes

### For Team Member

1. **My Inquiries** (existing, enhanced)
   - Show "Needs Revision" status prominently
   - Show admin feedback
   - Add "Edit & Resubmit" button

2. **Edit Inquiry Page** (new or enhanced)
   - Pre-filled with existing data
   - Highlight fields mentioned in feedback (optional)
   - "Resubmit for Approval" button

3. **Inquiry Clone** (new)
   - Copy data from rejected inquiry
   - Open as new draft
   - Clear any rejection-related metadata

---

## Notification Matrix

| Event | Notify User | Notify Admin |
|-------|-------------|--------------|
| Inquiry submitted for approval | ✅ Confirmation | ✅ New pending |
| Admin requests changes | ✅ Action required | - |
| User resubmits | - | ✅ Review again |
| Admin approves | ✅ Success | - |
| Admin rejects | ✅ With reason | - |
| User cancels | ✅ Confirmation | ⚠️ Optional |
| Admin cancels | ✅ With reason | - |

---

## Audit Trail Requirements

Every action must be logged:

```
| Timestamp | Action | By | Details |
|-----------|--------|----|---------|
| 2025-12-18 10:00 | Created | john@company.com | Draft created |
| 2025-12-18 10:15 | Submitted for approval | john@company.com | - |
| 2025-12-18 11:00 | Changes requested | admin@company.com | "Fix part number" |
| 2025-12-18 11:30 | Edited | john@company.com | Part number updated |
| 2025-12-18 11:31 | Resubmitted | john@company.com | - |
| 2025-12-18 12:00 | Approved | admin@company.com | - |
```

---

## Implementation Priority

### Phase 1: Core Flow (MVP)
1. ✅ `pending_approval` status
2. ✅ Approve action
3. ✅ Reject action (final)
4. ⭐ User can cancel pending inquiry

### Phase 2: Refinement Flow
1. ⭐ `needs_revision` status
2. ⭐ Request Changes action
3. ⭐ Edit & Resubmit flow
4. ⭐ Feedback display

### Phase 3: Enhanced Features
1. Clone rejected inquiry
2. Admin edit before approve
3. Revision counter/history
4. Partial approval (split inquiry)

### Phase 4: Advanced
1. Delegation
2. Escalation
3. Time-based reminders

---

## Decision Points for Implementation

Before implementing, decide:

| Question | Options | Recommendation |
|----------|---------|----------------|
| Can admin edit inquiry directly? | Yes / No | No (for MVP) |
| Can user cancel pending inquiry? | Yes / No | Yes |
| Is "needs_revision" separate from "rejected"? | Yes / No | Yes |
| Track revision count? | Yes / No | Yes (simple counter) |
| Show feedback history? | Latest only / All | All |
| Clone rejected inquiries? | Yes / No | Yes (Phase 3) |

---

## User Guide: Handling Revisions

### For Team Members

#### Your Inquiry Needs Changes

1. You'll receive a notification when your admin requests changes
2. Go to **My Inquiries** and find the inquiry with status **"Needs Revision"**
3. Click on the inquiry to see the admin's feedback
4. Click **"Edit & Resubmit"**
5. Make the requested changes
6. Add a note explaining your corrections (optional)
7. Click **"Resubmit for Approval"**
8. Your inquiry returns to "Pending Approval" status

#### Canceling Your Inquiry

If you no longer need the inquiry:

1. Go to **My Inquiries**
2. Find your inquiry (must be "Pending Approval" or "Needs Revision")
3. Click **"Cancel Inquiry"**
4. Confirm cancellation
5. Your inquiry is marked as "Canceled"

#### After Rejection

If your inquiry was rejected:

1. Read the rejection reason carefully
2. If you want to try again, click **"Clone Inquiry"**
3. A new draft is created with the same data
4. Make necessary corrections
5. Submit the new inquiry for approval

---

### For Client Administrators

#### Requesting Changes (Instead of Rejecting)

Use **"Request Changes"** when:
- Minor corrections needed (typos, wrong quantities)
- Missing information that user can provide
- Clarification needed on specific items

Use **"Reject"** when:
- Inquiry should not proceed at all
- Major issues that require starting over
- Business reasons to decline

#### How to Request Changes

1. Open the inquiry in approval queue
2. Review all details
3. Click **"Request Changes"**
4. Enter specific feedback:
   - Be clear about what needs to change
   - Reference specific parts/machines if applicable
   - Provide correct values if known
5. Click **"Send Feedback"**
6. User is notified and can make corrections

#### Reviewing Resubmissions

1. You'll be notified when user resubmits
2. Open the inquiry
3. Review changes made
4. Check revision history to see what was changed
5. Approve, request more changes, or reject

#### Best Practices

- ✅ Be specific in feedback
- ✅ Respond promptly to pending inquiries
- ✅ Use "Request Changes" for fixable issues
- ✅ Use "Reject" only when inquiry shouldn't proceed
- ❌ Don't leave inquiries pending for too long
- ❌ Don't reject for minor fixable issues

---

## Visual Flow Summary

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Create Inquiry ──▶ Submit ──▶ Waiting... ──▶ Approved! ✓              │
│         │                           │              │                     │
│         │                           │              └──▶ Sent to          │
│         │                           │                   Deckard       │
│         │                           ▼                                    │
│         │                    Needs Revision                              │
│         │                           │                                    │
│         │                           ▼                                    │
│         │                    Edit & Fix ──▶ Resubmit ──▶ (back to       │
│         │                                               waiting)         │
│         │                                                                │
│         └──────────────────────── OR ─────────────────────────────────▶ │
│                                                                          │
│                              Cancel                                      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                         ADMIN JOURNEY                                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   New Pending ──▶ Review ──┬──▶ Approve ──▶ Done ✓                      │
│     Inquiry         │      │                                             │
│                     │      ├──▶ Request Changes ──▶ Wait for user       │
│                     │      │         │                                   │
│                     │      │         └──▶ User resubmits ──▶ Review     │
│                     │      │                                 again       │
│                     │      │                                             │
│                     │      ├──▶ Reject ──▶ Done (with reason)           │
│                     │      │                                             │
│                     │      └──▶ Cancel ──▶ Done (neutral)               │
│                     │                                                    │
│                     └──────────────────────────────────────────────────▶│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Summary of All Statuses (Final)

| Status | Code | Description |
|--------|------|-------------|
| Draft | `draft` | Saved, not yet submitted |
| Pending Approval | `pending_approval` | Waiting for admin review |
| Needs Revision | `needs_revision` | Admin requested changes |
| Rejected | `rejected` | Admin declined (final) |
| Submitted | `submitted` | Approved, sent to Deckard |
| In Review | `in_review` | Deckard is reviewing |
| More Info | `more_info` | Deckard needs information |
| Information Provided | `information_provided` | User provided info |
| In Progress | `in_progress` | Deckard working on it |
| Completed | `completed` | Finished |
| Canceled | `canceled` | Canceled by user or admin |

**Total: 11 statuses**

---

*Document Version: 1.0*
*Created: December 2025*
