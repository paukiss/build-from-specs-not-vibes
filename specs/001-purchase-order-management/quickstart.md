# Quickstart & Validation Scenarios

**Phase**: 1 (Design) | **Date**: 2026-09-09 | **Status**: Complete

This guide demonstrates how to validate the Purchase Order Management feature end-to-end. Each scenario maps to user stories in [spec.md](spec.md) and exercises the API contract defined in [contracts/openapi.yaml](contracts/openapi.yaml).

---

## Prerequisites

- Backend server running locally or in test environment (`npm run dev` or CI environment).
- API base URL: `http://localhost:3000/api/v1` (or configured test environment).
- Test data: Branch, Buyer (User), Supplier, and Product catalog entries pre-seeded in SQLite.
- HTTP client (curl, Postman, or test framework like Jest/Supertest).

---

## Scenario 1: Create and Submit a Purchase Order (User Story 1)

**Objective**: Validate that a Buyer can create a Draft PO, add line items, and submit it.

### Setup

```bash
# Pre-seed test data
export BRANCH_ID="branch-001"
export BUYER_ID="user-buyer-1"
export SUPPLIER_ID="supplier-001"
export PRODUCT_ID="product-sku-123"
```

### Steps

#### 1a. Create a Draft PO

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "branch-001",
    "buyer_id": "user-buyer-1",
    "supplier_id": "supplier-001",
    "currency": "USD",
    "notes": "Test PO for office supplies"
  }'
```

**Expected Response** (201 Created):
```json
{
  "id": "po-uuid-1",
  "po_number": "PO-2026-09-001",
  "branch_id": "branch-001",
  "buyer_id": "user-buyer-1",
  "supplier_id": "supplier-001",
  "status": "draft",
  "total_amount": 0,
  "currency": "USD",
  "created_at": "2026-09-09T10:00:00Z",
  "updated_at": "2026-09-09T10:00:00Z",
  "notes": "Test PO for office supplies",
  "line_items": [],
  "approval": null,
  "status_history": [
    { "from_status": null, "to_status": "draft", "changed_by": "user-buyer-1", "timestamp": "2026-09-09T10:00:00Z" }
  ]
}
```

Save `po-uuid-1` for subsequent calls.

#### 1b. Add Line Items

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-1/line-items \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "product-sku-123",
    "product_name": "Office Chair",
    "quantity": 5,
    "expected_price": 299.99
  }'
```

**Expected Response** (201 Created):
```json
{
  "id": "line-item-uuid-1",
  "po_id": "po-uuid-1",
  "product_id": "product-sku-123",
  "product_name": "Office Chair",
  "quantity": 5,
  "expected_price": 299.99,
  "line_total": 1499.95,
  "created_at": "2026-09-09T10:01:00Z",
  "fulfillment_records": []
}
```

Add a second line item:
```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-1/line-items \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Desk Lamp",
    "quantity": 10,
    "expected_price": 45.00
  }'
```

**Expected Response** (201 Created): Line item with line_total = 450.00.

#### 1c. Verify PO Total Updated

```bash
curl -X GET http://localhost:3000/api/v1/purchase-orders/po-uuid-1
```

**Expected Response** (200 OK):
- `total_amount`: 1949.95 (1499.95 + 450.00)
- `line_items`: array with 2 items

#### 1d. Submit the PO

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-1/submit \
  -H "Content-Type: application/json" \
  -d '{
    "idempotency_key": "idempotency-uuid-1"
  }'
```

**Expected Response** (200 OK):
- `status`: "submitted"
- `updated_at`: current timestamp
- `status_history`: includes Draft → Submitted transition
- **Side Effect**: Notification record created for supplier with type="submitted" and status="pending".

#### 1e. Verify Supplier Notification Sent

Wait ~30s for background worker to process notifications, then query:

```bash
curl -X GET "http://localhost:3000/api/v1/notifications?po_id=po-uuid-1"
```

**Expected Response** (assuming endpoint exists):
- Notification with type="submitted" and status="sent" (or "pending" if retry in progress).

#### 1f. Test Idempotency

Re-submit with same idempotency_key:

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-1/submit \
  -H "Content-Type: application/json" \
  -d '{
    "idempotency_key": "idempotency-uuid-1"
  }'
```

**Expected Response** (409 Conflict or 200 with cached result):
- Message indicates duplicate submission detected.

---

## Scenario 2: Approval Workflow for High-Value POs (User Story 2)

**Objective**: Validate that POs over $10,000 require approval.

### Setup

```bash
export APPROVER_ID="user-manager-1"
```

### Steps

#### 2a. Create High-Value PO (> $10,000)

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "branch-001",
    "buyer_id": "user-buyer-1",
    "supplier_id": "supplier-001",
    "currency": "USD"
  }'
```

Save as `po-uuid-2`.

#### 2b. Add High-Value Line Items

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-2/line-items \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Enterprise Server",
    "quantity": 1,
    "expected_price": 12500.00
  }'
```

Total: 12,500 USD (> $10,000 threshold).

#### 2c. Submit PO

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-2/submit \
  -H "Content-Type: application/json" \
  -d '{ "idempotency_key": "idempotency-uuid-2" }'
```

**Expected Response** (200 OK):
- `status`: "submitted" (not yet approved)
- `approval`: object with decision="pending", approver_id="user-manager-1"

#### 2d. Verify Approval Required

Try to transition to Fulfilled without approval:

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-2/fulfill \
  -H "Content-Type: application/json" \
  -d '{ "line_item_id": "line-item-uuid-2", "quantity_fulfilled": 1 }'
```

**Expected Response** (409 Conflict):
- Message: "PO cannot be fulfilled; approval pending or denied."

#### 2e. Approver Approves PO

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-2/approve \
  -H "Content-Type: application/json" \
  -d '{ "comment": "Approved for procurement." }'
```

**Expected Response** (200 OK):
- `status`: "approved"
- `approval.decision`: "approved"
- `approval.timestamp`: current time
- **Side Effect**: Notification sent to supplier with type="approved".

#### 2f. Verify Approval Blocks Duplicate Approvals

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-2/approve \
  -H "Content-Type: application/json" \
  -d '{ "comment": "Attempting duplicate approval." }'
```

**Expected Response** (409 Conflict):
- Message: "Approval already recorded."

---

## Scenario 3: Fulfillment and Cancellation (User Story 3)

**Objective**: Validate partial fulfillment, state transitions, and cancellation notifications.

### Setup

Use `po-uuid-2` from Scenario 2 (now in Approved status).

### Steps

#### 3a. Record Partial Fulfillment

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-2/fulfill \
  -H "Content-Type: application/json" \
  -d '{
    "line_item_id": "line-item-uuid-2",
    "quantity_fulfilled": 0.5,
    "reference_document": "SHIPMENT-2026-001"
  }'
```

**Expected Response** (200 OK):
- `status`: "partially_fulfilled" (50% delivered)
- LineItem shows fulfillment_record with quantity_fulfilled=0.5.

#### 3b. Record Complete Fulfillment

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-2/fulfill \
  -H "Content-Type: application/json" \
  -d '{
    "line_item_id": "line-item-uuid-2",
    "quantity_fulfilled": 0.5,
    "reference_document": "SHIPMENT-2026-002"
  }'
```

**Expected Response** (200 OK):
- `status`: "fulfilled" (100% cumulative)
- **Side Effect**: Notification sent to supplier with type="fulfilled".

#### 3c. Test Cancellation Notifications

Create a new Draft PO and submit it:

```bash
# Create
curl -X POST http://localhost:3000/api/v1/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "branch-001",
    "buyer_id": "user-buyer-1",
    "supplier_id": "supplier-001"
  }'
# Save as po-uuid-3

# Add line item
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-3/line-items \
  -H "Content-Type: application/json" \
  -d '{ "product_name": "Test Product", "quantity": 1, "expected_price": 100 }'

# Submit
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-3/submit \
  -H "Content-Type: application/json" \
  -d '{ "idempotency_key": "idempotency-uuid-3" }'
```

#### 3d. Cancel the PO

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-3/cancel \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Order no longer needed" }'
```

**Expected Response** (200 OK):
- `status`: "cancelled"
- **Side Effect**: Notification sent to supplier with type="cancelled" (because PO was submitted before cancellation).

---

## Edge Cases

### Case 1: Prevent Edits to Submitted PO

Attempt to update a Submitted PO:

```bash
curl -X PATCH http://localhost:3000/api/v1/purchase-orders/po-uuid-2 \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Updated notes" }'
```

**Expected Response** (409 Conflict):
- Message: "Cannot edit Submitted or Approved PO."

### Case 2: Reject PO and Verify Cancellation Path

```bash
# Create another PO over threshold
curl -X POST http://localhost:3000/api/v1/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "branch-001",
    "buyer_id": "user-buyer-1",
    "supplier_id": "supplier-001"
  }'
# Save as po-uuid-4

# Add high-value item and submit
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-4/line-items \
  -H "Content-Type: application/json" \
  -d '{ "product_name": "Expensive Item", "quantity": 1, "expected_price": 15000 }'

curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-4/submit \
  -H "Content-Type: application/json" \
  -d '{ "idempotency_key": "idempotency-uuid-4" }'

# Reject it
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-4/reject \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Budget not approved this quarter" }'
```

**Expected Response** (200 OK):
- `status`: "rejected"
- Approval record shows decision="rejected".

Now cancel:

```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/po-uuid-4/cancel \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Rejected PO cancelled." }'
```

**Expected Response** (200 OK):
- `status`: "cancelled"

---

## Success Criteria Checklist

- [ ] Scenario 1: PO create → add line items → submit → supplier notified (1 min SLA).
- [ ] Scenario 2: High-value PO requires approval; approval gate blocks premature fulfillment.
- [ ] Scenario 3: Partial fulfillment records tracked; cumulative fulfillment transitions status correctly.
- [ ] Edge Case 1: Submitted PO cannot be edited.
- [ ] Edge Case 2: Rejected PO can be cancelled; notifications sent.
- [ ] Idempotency: Duplicate submit with same key returns cached result.
- [ ] Audit Trail: All status transitions recorded in status_history.
- [ ] Data Model: All constraints validated (positive quantities, decimal prices, immutable line items).

---

## Test Execution

Run integration tests to validate all scenarios:

```bash
npm run test

# Or filtered to PO tests
npm run test -- purchase-order
```

Expected: All integration tests pass; no database state corruption; clean SQLite instance for each test.

---

## References

- [Data Model](data-model.md) — Entity definitions and constraints
- [OpenAPI Contract](contracts/openapi.yaml) — Full API specification
- [Research](research.md) — Design decisions (state machine, approval workflow, notifications)
