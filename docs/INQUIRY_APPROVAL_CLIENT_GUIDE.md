# Deckard Inquiry Tool
## Inquiry Approval Workflow - Client Guide

---

## What's New?

We're introducing an **Inquiry Approval Workflow** that gives your organization control over part inquiries before they're sent to Deckard.

### Before
```
User submits inquiry ──────────────────────▶ Sent to Deckard
```

### Now
```
User submits inquiry ──▶ Admin reviews ──▶ Approves ──▶ Sent to Deckard
```

---

## How It Works

### User Roles

| Role | Description | Approval Required? |
|------|-------------|-------------------|
| **Standard User** | Regular team member | ✅ Yes - needs admin approval |
| **Trusted User** | Experienced team member | ❌ No - can submit directly |
| **Client Admin** | Organization administrator | ❌ No - can submit directly |

---

## For Standard Users

### Submitting an Inquiry

1. Create your inquiry as usual (select machine, add parts)
2. Click **"Place Inquiry"**
3. Your inquiry goes to your admin for review
4. You'll see: *"Your inquiry has been sent for approval"*

### What Happens Next?

| Admin Action | What You See | What To Do |
|--------------|--------------|------------|
| **Approved** | "Inquiry submitted" notification | Nothing - it's sent to Deckard |
| **Changes Requested** | "Revision needed" with feedback | Edit and resubmit |
| **Rejected** | "Inquiry declined" with reason | Create new inquiry if needed |

### If Changes Are Requested

1. Go to **My Inquiries**
2. Find your inquiry with status **"Needs Revision"**
3. Read the admin's feedback
4. Click **"Edit & Resubmit"**
5. Make corrections
6. Click **"Resubmit for Approval"**

---

## For Client Administrators

### Your Responsibilities

- Review and approve inquiries from your team
- Request changes for fixable issues
- Reject inappropriate requests
- Manage which users can bypass approval

### Approval Queue

Access via: **Client Admin → Approvals**

```
┌────────────────────────────────────────────────────────┐
│  PENDING APPROVALS                              (3)    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  INQ-12345 • John Smith • 2 machines, 5 parts         │
│  [View Details]  [Request Changes]  [Reject]  [Approve]│
│                                                        │
│  INQ-12346 • Jane Doe • 1 machine, 3 parts            │
│  [View Details]  [Request Changes]  [Reject]  [Approve]│
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Which Action to Use?

| Situation | Action | Result |
|-----------|--------|--------|
| Everything correct | **Approve** | Sent to Deckard |
| Minor mistake (typo, wrong quantity) | **Request Changes** | Back to user to fix |
| Missing information | **Request Changes** | Back to user to add |
| Should not proceed | **Reject** | Declined (final) |
| Duplicate or no longer needed | **Cancel** | Closed (neutral) |

### Requesting Changes

When you request changes:

1. Click **"Request Changes"**
2. Enter specific feedback:
   - *"Part number STA-1234 should be STA-12345"*
   - *"Please add quantity for the third item"*
3. User receives notification and can edit
4. You'll be notified when they resubmit

---

## Trusted Users

### What is a Trusted User?

A standard user who can submit inquiries **without** admin approval.

### Setting Up Trusted Users

**Client Admin → Users → Edit User**

```
┌────────────────────────────────────────────────────────┐
│  EDIT USER                                             │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Name: John Smith                                      │
│  Email: john@company.com                               │
│                                                        │
│  ☑ Can submit inquiries without approval               │
│                                                        │
│    When enabled, this user's inquiries go directly     │
│    to Deckard without your review.                  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### When to Grant This Permission?

| Grant To | Don't Grant To |
|----------|----------------|
| Experienced team members | New employees |
| Users with good track record | Users who make frequent errors |
| Senior staff | Temporary staff |

---

## Inquiry Statuses

| Status | Meaning |
|--------|---------|
| **Draft** | Saved, not yet submitted |
| **Pending Approval** | Waiting for admin review |
| **Needs Revision** | Admin requested changes |
| **Rejected** | Admin declined (final) |
| **Submitted** | Approved, sent to Deckard |
| **In Review** | Deckard is reviewing |
| **More Info** | Deckard needs information |
| **In Progress** | Deckard working on it |
| **Completed** | Finished |
| **Canceled** | Closed |

---

## Common Scenarios

### Scenario 1: Simple Approval

```
John (Standard User)          Admin                    Deckard
       │                        │                          │
       │  Submits inquiry       │                          │
       │───────────────────────▶│                          │
       │                        │                          │
       │                        │  Reviews, clicks Approve │
       │                        │─────────────────────────▶│
       │                        │                          │
       │  "Inquiry approved"    │                          │
       │◀───────────────────────│                          │
```

### Scenario 2: Changes Needed

```
John (Standard User)          Admin
       │                        │
       │  Submits inquiry       │
       │───────────────────────▶│
       │                        │
       │                        │  Notices wrong part number
       │                        │  Clicks "Request Changes"
       │                        │
       │  "Revision needed"     │
       │◀───────────────────────│
       │                        │
       │  Fixes part number     │
       │  Clicks "Resubmit"     │
       │───────────────────────▶│
       │                        │
       │                        │  Reviews, clicks Approve
       │  "Inquiry approved"    │
       │◀───────────────────────│
```

### Scenario 3: Trusted User

```
Jane (Trusted User)                               Deckard
       │                                               │
       │  Submits inquiry                              │
       │──────────────────────────────────────────────▶│
       │                                               │
       │  "Inquiry submitted"                          │
       │  (No approval needed)                         │
```

### Scenario 4: User Cancels

```
John (Standard User)          Admin
       │                        │
       │  Submits inquiry       │
       │───────────────────────▶│
       │                        │
       │  Realizes mistake      │
       │  Clicks "Cancel"       │
       │                        │
       │  Inquiry canceled      │
       │  (Can create new one)  │
```

---

## Quick Reference

### For Users

| I want to... | How to do it |
|--------------|--------------|
| Submit an inquiry | Click "Place Inquiry" |
| Check my inquiry status | Go to "My Inquiries" |
| Edit after revision request | Click "Edit & Resubmit" |
| Cancel my pending inquiry | Click "Cancel Inquiry" |
| Resubmit after rejection | Click "Clone Inquiry" (creates new) |

### For Admins

| I want to... | How to do it |
|--------------|--------------|
| See pending approvals | Client Admin → Approvals |
| Approve an inquiry | Click "Approve" |
| Request changes | Click "Request Changes" + add feedback |
| Reject an inquiry | Click "Reject" + add reason |
| Grant trusted status | Client Admin → Users → Edit → Check box |

---

## FAQ

**Q: How long should approval take?**
> We recommend reviewing pending inquiries within 24 hours.

**Q: Can I edit a user's inquiry before approving?**
> No. If changes are needed, use "Request Changes" to send it back to the user.

**Q: What if I'm the only admin and I'm unavailable?**
> Consider having at least two Client Admins, or granting trusted status to key users.

**Q: Can a user cancel their pending inquiry?**
> Yes, users can cancel inquiries that are "Pending Approval" or "Needs Revision".

**Q: What's the difference between Reject and Cancel?**
> **Reject** = the inquiry has issues and should not proceed.
> **Cancel** = the inquiry is no longer needed (neutral, no fault implied).

**Q: Can standard users see each other's inquiries?**
> No. Users only see their own inquiries. Admins see all company inquiries.

---

## Benefits

| For Your Organization | For Your Team |
|-----------------------|---------------|
| ✅ Control over what gets ordered | ✅ Clear feedback when changes needed |
| ✅ Catch errors before submission | ✅ Guidance from experienced admins |
| ✅ Audit trail of approvals | ✅ Trusted users work faster |
| ✅ Reduce incorrect orders | ✅ Easy to track inquiry status |
