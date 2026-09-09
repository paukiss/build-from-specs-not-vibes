# Data Model: Purchase Order Management

**Phase**: 1 (Design) | **Date**: 2026-09-09 | **Status**: Complete

## Entity Relationship Diagram

```
Branch (1) ←─────→ (N) PurchaseOrder
  ├─ id (PK)      ├─ id (PK)
  ├─ name         ├─ po_number (unique)
  ├─ location     ├─ branch_id (FK) → Branch
  └─ manager_id   ├─ buyer_id (FK) → User
                  ├─ supplier_id (FK) → Supplier
                  ├─ status (enum)
                  ├─ total_amount (decimal)
                  ├─ currency (varchar)
                  ├─ created_at
                  ├─ updated_at
                  ├─ metadata (JSON)
                  └─ notes (text)

Supplier (1) ←─────→ (N) PurchaseOrder
  ├─ id (PK)
  ├─ name
  ├─ contact_email
  ├─ contact_phone
  └─ preferred_notification_channel (enum)

PurchaseOrder (1) ←─────→ (N) LineItem
  ├─ id (PK)
  ├─ po_id (FK)
  ├─ product_id (nullable FK)
  ├─ product_name (immutable)
  ├─ quantity (int)
  ├─ expected_price (decimal)
  ├─ line_total (calculated: quantity × expected_price)
  └─ created_at

LineItem (1) ←─────→ (N) FulfillmentRecord
  ├─ id (PK)
  ├─ line_item_id (FK)
  ├─ quantity_fulfilled (decimal)
  ├─ timestamp
  ├─ reference_document (varchar)
  └─ notes (text)

PurchaseOrder (1) ←─────→ (N) Approval
  ├─ id (PK)
  ├─ po_id (FK)
  ├─ approver_id (FK) → User
  ├─ decision (enum: pending, approved, rejected)
  ├─ timestamp
  └─ comment (text)

PurchaseOrder (1) ←─────→ (N) StatusHistory
  ├─ id (PK)
  ├─ po_id (FK)
  ├─ from_status (enum)
  ├─ to_status (enum)
  ├─ changed_by (FK) → User
  ├─ timestamp
  └─ reason (text)

PurchaseOrder (1) ←─────→ (N) Notification
  ├─ id (PK)
  ├─ po_id (FK)
  ├─ recipient (varchar)
  ├─ type (enum: submitted, approved, fulfilled, cancelled)
  ├─ status (enum: pending, sent, failed)
  ├─ timestamp
  ├─ retry_count (int)
  └─ error_message (text)
```

---

## Entity Definitions

### PurchaseOrder

Core aggregate root representing a PO.

```typescript
interface PurchaseOrder {
  id: string;                        // UUID
  po_number: string;                 // Human-readable (e.g., PO-2026-09-001)
  branch_id: string;                 // FK → Branch
  buyer_id: string;                  // FK → User (creator)
  supplier_id: string;               // FK → Supplier
  status: PurchaseOrderStatus;       // enum: Draft, Submitted, Approved, Rejected, Fulfilled, PartiallyFulfilled, Cancelled
  total_amount: number;              // Decimal (calculated from line_items)
  currency: string;                  // ISO 4217 code (e.g., USD, EUR)
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;     // JSON field: { idempotency_key?, ... }
  notes?: string;                    // Optional user notes
}
```

**Validations**:
- `po_number` is unique within branch and cannot change after creation.
- `total_amount` is re-calculated from line_items sum; not directly updatable.
- `status` transitions must follow defined state graph (see [[research.md]]).
- Draft PO can be edited; Submitted+ cannot be edited (immutable for audit).

**State Transitions**:
```
Draft ──submit──> Submitted ──approve──> Approved ──fulfill──> Fulfilled
                      │                        │                    ▲
                      │                        │                    │
                      └──reject──> Rejected   │                    │
                      └──cancel──> Cancelled  └──fulfill──> PartiallyFulfilled ──fulfill──> Fulfilled
```

---

### LineItem

Individual line in a PO; immutable after creation.

```typescript
interface LineItem {
  id: string;                        // UUID
  po_id: string;                     // FK → PurchaseOrder
  product_id?: string;               // Nullable FK to external catalog
  product_name: string;              // Snapshot of product name (immutable for audit)
  quantity: number;                  // Positive integer (validation: > 0)
  expected_price: number;            // Non-negative decimal (validation: >= 0)
  line_total?: number;               // Calculated: quantity × expected_price (read-only)
  created_at: Date;
}
```

**Validations**:
- `quantity` must be a positive integer (> 0).
- `expected_price` must be non-negative decimal (>= 0).
- `product_name` is required and immutable.
- Cannot be deleted; only archived via PO cancellation.

**Immutability Rationale**: See [[research.md#6-immutable-product-details]].

---

### FulfillmentRecord

Tracks partial/complete fulfillment of line items.

```typescript
interface FulfillmentRecord {
  id: string;                        // UUID
  line_item_id: string;              // FK → LineItem
  quantity_fulfilled: number;        // Decimal; cumulative across multiple shipments
  timestamp: Date;
  reference_document?: string;       // e.g., invoice number, shipment tracking ID
  notes?: string;                    // Optional context
}
```

**Validations**:
- `quantity_fulfilled` must be <= LineItem.quantity.
- Cumulative fulfillment across all records must not exceed LineItem.quantity.
- Cannot be deleted; only marked as voided (if needed for adjustments).

**State Calculation**:
On insert, system recalculates PO status:
- If all LineItems have cumulative fulfilled ≥ quantity → PO.status = Fulfilled.
- If any LineItem has 0 < cumulative fulfilled < quantity → PO.status = PartiallyFulfilled.
- Else no change (remains Approved or previous state).

---

### Approval

Approval request for POs over $10,000.

```typescript
interface Approval {
  id: string;                        // UUID
  po_id: string;                     // FK → PurchaseOrder
  approver_id: string;               // FK → User (Branch Manager)
  decision: ApprovalDecision;        // enum: pending, approved, rejected
  timestamp: Date;
  comment?: string;                  // Optional approver comment
}
```

**Validations**:
- Only created for PO.total_amount > $10,000.
- Once decision is set (approved/rejected), cannot be changed.
- If rejected, PO transitions to Rejected (then can be cancelled by buyer).

**Notification Trigger**:
- On creation: notify buyer that approval is pending.
- On decision: notify buyer of approval result; if approved, notify supplier.

---

### StatusHistory

Immutable audit trail of PO status changes.

```typescript
interface StatusHistory {
  id: string;                        // UUID
  po_id: string;                     // FK → PurchaseOrder
  from_status: PurchaseOrderStatus;
  to_status: PurchaseOrderStatus;
  changed_by: string;                // FK → User (who initiated the change)
  timestamp: Date;
  reason?: string;                   // Optional context
}
```

**Behavior**:
- Automatically created on every PO.status change.
- Never edited or deleted (immutable audit trail).

---

### Notification

Outbound notification record for suppliers and internal stakeholders.

```typescript
interface Notification {
  id: string;                        // UUID
  po_id: string;                     // FK → PurchaseOrder
  recipient: string;                 // Email or contact endpoint
  type: NotificationType;            // enum: submitted, approved, fulfilled, cancelled
  status: NotificationStatus;        // enum: pending, sent, failed
  timestamp: Date;
  retry_count: number;               // Default 0; incremented on retry
  error_message?: string;            // Reason for failure (if status = failed)
}
```

**Validations**:
- `recipient` must be valid email (if channel = email).
- `retry_count` max 3; after 3 retries, mark as failed.

**Behavior**:
- Created on PO events (submit, approve, fulfill, cancel).
- Background worker polls pending records every 30s; retries on failure.
- See [[research.md#3-notification-dispatch-strategy]].

---

### Supplier, Branch, User

Reference entities (assumed to exist in external systems or shared models).

```typescript
interface Supplier {
  id: string;
  name: string;
  contact_email: string;
  contact_phone?: string;
  preferred_notification_channel: NotificationChannel; // enum: email, webhook
}

interface Branch {
  id: string;
  name: string;
  location: string;
  manager_id: string;               // FK → User
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;                   // enum: buyer, manager, admin
}
```

---

## Enums

```typescript
enum PurchaseOrderStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  Approved = 'approved',
  Rejected = 'rejected',
  Fulfilled = 'fulfilled',
  PartiallyFulfilled = 'partially_fulfilled',
  Cancelled = 'cancelled',
}

enum ApprovalDecision {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

enum NotificationType {
  Submitted = 'submitted',
  Approved = 'approved',
  Fulfilled = 'fulfilled',
  Cancelled = 'cancelled',
}

enum NotificationStatus {
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed',
}

enum NotificationChannel {
  Email = 'email',
  Webhook = 'webhook',
}
```

---

## Key Constraints & Rules

1. **Idempotency**: PO.metadata.idempotency_key prevents duplicate submissions (see [[research.md#4-idempotency-pattern]]).
2. **Immutability**: LineItem fields (product_name, expected_price) cannot be edited after PO creation.
3. **Status Lock**: Draft PO can be edited; Submitted+ is immutable for audit.
4. **Approval Gate**: POs > $10,000 cannot reach Approved status without explicit Approval.decision = approved.
5. **Fulfillment Calculation**: System auto-calculates PO.status based on sum of FulfillmentRecords.

---

## Glossary

- **PO**: Purchase Order (the aggregate root).
- **Line Item**: Individual product entry within a PO.
- **Fulfillment Record**: Shipment/delivery record for a line item (supports partial fulfillment).
- **Approval**: Review checkpoint for high-value POs.
- **Idempotency Key**: Client-provided UUID to prevent duplicate submissions.
- **Status History**: Immutable audit trail of PO state changes.
