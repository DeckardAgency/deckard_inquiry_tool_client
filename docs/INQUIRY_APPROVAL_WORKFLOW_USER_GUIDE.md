# Inquiry Approval Workflow

## New Feature Update

We've introduced a new **Inquiry Approval Workflow** to give your organization better control over part inquiries before they are submitted to Deckard.

---

## What's Changing?

### Before
When you submitted an inquiry, it was sent directly to Deckard for processing.

### Now
When you submit an inquiry, it first goes to your **Client Administrator** for review and approval. Once approved, it's then sent to Deckard.

---

## How It Works

### For Team Members (Standard Users)

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│  You submit an  │ ───▶ │  Your Admin reviews  │ ───▶ │  Inquiry sent   │
│    inquiry      │      │    and approves      │      │  to Deckard  │
└─────────────────┘      └──────────────────────┘      └─────────────────┘
```

**Step 1:** Create your inquiry as usual
- Select machines
- Add parts with quantities
- Attach any supporting documents

**Step 2:** Click "Place Inquiry"
- Your inquiry is saved and sent for approval
- You'll see a confirmation: *"Your Inquiry Has Been Sent for Approval"*

**Step 3:** Wait for approval
- Your Client Administrator will review the inquiry
- You'll be notified once it's approved or if changes are needed

**Step 4:** After approval
- Once approved, you'll receive confirmation
- The inquiry is officially submitted to Deckard

---

### For Client Administrators

As a Client Administrator, you have the authority to review and approve all inquiries from your team before they are sent to Deckard.

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│  Team member    │ ───▶ │  You review inquiry  │ ───▶ │  Inquiry sent   │
│  submits        │      │  Approve or Reject   │      │  to Deckard  │
└─────────────────┘      └──────────────────────┘      └─────────────────┘
```

#### Accessing Pending Approvals

1. Log in to the Deckard Inquiry Tool
2. In the sidebar, click **"Approvals"** under Client Admin section
3. You'll see a list of all inquiries waiting for your review

#### Reviewing an Inquiry

For each pending inquiry, you can see:
- **Inquiry Number** - Unique reference
- **Submitted By** - Team member who created it
- **Submission Date** - When it was submitted
- **Machines & Parts** - Summary of the request

Click **"View Details"** to see the complete inquiry including:
- All machines and their parts
- Quantities requested
- Attached documents and files
- Contact information

#### Approving an Inquiry

1. Review the inquiry details
2. Click **"Approve"**
3. Confirm your decision
4. The inquiry is immediately submitted to Deckard
5. The team member is notified of the approval

#### Rejecting an Inquiry

If an inquiry needs corrections or shouldn't be submitted:

1. Click **"Reject"**
2. Enter a reason for rejection (optional but recommended)
3. Confirm your decision
4. The team member is notified with your feedback

---

## Inquiry Status Guide

| Status | Description | Who Sees It |
|--------|-------------|-------------|
| **Draft** | Inquiry saved but not yet submitted | Creator only |
| **Pending Approval** | Awaiting Client Administrator review | Creator & Client Admin |
| **Rejected** | Declined by Client Administrator | Creator & Client Admin |
| **Submitted** | Approved and sent to Deckard | Everyone |
| **In Review** | Being reviewed by Deckard team | Everyone |
| **More Info** | Deckard requested additional information | Everyone |
| **Information Provided** | Customer provided requested information | Everyone |
| **In Progress** | Deckard is actively working on it | Everyone |
| **Completed** | Inquiry has been fulfilled | Everyone |
| **Canceled** | Inquiry was canceled | Everyone |

### Status Flow Diagram

```
                                    ┌─────────────┐
                                    │   DRAFT     │
                                    └──────┬──────┘
                                           │
                          ┌────────────────┼────────────────┐
                          │                │                │
                          ▼                │                ▼
                 ┌─────────────────┐       │       ┌─────────────────┐
                 │ PENDING APPROVAL│       │       │    CANCELED     │
                 │  (Regular User) │       │       └─────────────────┘
                 └────────┬────────┘       │
                          │                │
            ┌─────────────┼─────────────┐  │
            │                           │  │
            ▼                           ▼  ▼
   ┌─────────────────┐         ┌─────────────────┐
   │    REJECTED     │         │    SUBMITTED    │
   └─────────────────┘         │  (Client Admin) │
                               └────────┬────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │   IN REVIEW     │
                               └────────┬────────┘
                                        │
                          ┌─────────────┼─────────────┐
                          │                           │
                          ▼                           ▼
                 ┌─────────────────┐         ┌─────────────────┐
                 │   MORE INFO     │◀───────▶│  IN PROGRESS    │
                 └────────┬────────┘         └────────┬────────┘
                          │                           │
                          ▼                           │
                 ┌─────────────────┐                  │
                 │  INFORMATION    │                  │
                 │    PROVIDED     │──────────────────┤
                 └─────────────────┘                  │
                                                      ▼
                                             ┌─────────────────┐
                                             │   COMPLETED     │
                                             └─────────────────┘
```

---

## Frequently Asked Questions

### For Team Members

**Q: Why does my inquiry need approval?**
> This workflow ensures all inquiries are reviewed before being sent to Deckard, reducing errors and ensuring proper authorization for part requests.

**Q: How long does approval take?**
> This depends on your organization. Contact your Client Administrator if you need urgent approval.

**Q: Can I edit my inquiry after submitting for approval?**
> No, once submitted for approval, the inquiry is locked. If changes are needed, ask your administrator to reject it so you can make corrections.

**Q: What happens if my inquiry is rejected?**
> You'll receive a notification with the reason. You can then create a new inquiry with the necessary corrections.

**Q: Who is my Client Administrator?**
> Contact your organization's system administrator or check the Users section in Client Admin (if you have access).

---

### For Client Administrators

**Q: Do I need to approve inquiries one by one?**
> Yes, each inquiry requires individual review and approval to ensure accuracy.

**Q: Can I edit an inquiry before approving?**
> Currently, you can only approve or reject. If changes are needed, reject the inquiry with feedback and ask the team member to resubmit.

**Q: What if I'm on vacation?**
> Ensure another Client Administrator is available, or consider delegating admin rights temporarily to a trusted team member.

**Q: Can I see who approved past inquiries?**
> Yes, the inquiry history logs all status changes including who performed each action.

**Q: Do my own inquiries need approval?**
> No! As a Client Administrator, your inquiries are submitted directly to Deckard without requiring additional approval.

---

## Quick Reference

### Team Members Workflow

| Action | Result |
|--------|--------|
| Click "Place Inquiry" | Sent to admin for approval |
| Click "Save as Draft" | Saved for later (no approval needed) |

### Client Admin Workflow

| Action | Result |
|--------|--------|
| Click "Approve" | Inquiry submitted to Deckard |
| Click "Reject" | Inquiry returned to team member |
| Click "Place Inquiry" (your own) | Submitted directly to Deckard |

---

## Notification Summary

### Team Members Receive:
- ✅ Confirmation when inquiry is sent for approval
- ✅ Notification when inquiry is approved
- ✅ Notification when inquiry is rejected (with reason)

### Client Administrators Receive:
- ✅ Alert when new inquiries need approval
- ✅ Badge count showing pending approvals in sidebar

---

## Need Help?

If you have questions about this new workflow:

1. **Client Administrators** - Contact Deckard Support
2. **Team Members** - Contact your Client Administrator first

For technical issues, please reach out to your system administrator or Deckard technical support.

---

## Visual Guide

### Submitting an Inquiry (Team Member View)

```
┌────────────────────────────────────────────────────────────────┐
│                     INQUIRY CONFIRMATION                        │
│                                                                 │
│                         ⏳                                      │
│                                                                 │
│           Your Inquiry Has Been Sent for Approval               │
│                                                                 │
│   Your inquiry INQ-ABC12345 has been submitted and is           │
│   awaiting approval from your organization's administrator.     │
│   You will be notified once it has been reviewed.               │
│                                                                 │
│              [Go to Dashboard]  [View My Inquiries]             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Approving an Inquiry (Client Admin View)

```
┌────────────────────────────────────────────────────────────────┐
│  PENDING APPROVALS                                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ INQ-ABC12345                           Dec 18, 2025      │  │
│  │ Submitted by: John Smith (john@company.com)              │  │
│  │ 2 machine(s), 5 parts                                    │  │
│  │                                                          │  │
│  │ [View Details]        [Reject]        [✓ Approve]        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ INQ-DEF67890                           Dec 17, 2025      │  │
│  │ Submitted by: Jane Doe (jane@company.com)                │  │
│  │ 1 machine(s), 3 parts                                    │  │
│  │                                                          │  │
│  │ [View Details]        [Reject]        [✓ Approve]        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Sidebar with Approval Badge (Client Admin)

```
┌─────────────────────────┐
│  CLIENT ADMIN           │
├─────────────────────────┤
│  📋 Approvals    (3)    │  ◀── Badge shows pending count
│  📜 History             │
│  📝 Drafts              │
│  🔧 My Machines         │
│  👥 Users               │
└─────────────────────────┘
```

---

*Last Updated: December 2025*
