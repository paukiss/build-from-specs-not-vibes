# Feature Specification: Purchase Order Management

**Feature Branch**: `001-purchase-order-management`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "Create a Purchase Order management system. Buyers at branches can create purchase orders to suppliers for products. Each PO contains multiple line items with quantities and expected prices. Track PO status (Draft, Submitted, Approved, Fulfilled, Cancelled). Suppliers receive notifications when POs are submitted. Include approval workflow for POs over $10,000."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and submit a Purchase Order (Priority: P1)

As a branch Buyer, I want to create a Purchase Order (PO) with multiple line items and submit it to the supplier so that the supplier receives the request and the organization can begin fulfillment.

**Why this priority**: This is the core user value: raising orders to suppliers.

**Independent Test**: A Buyer can create a PO, add at least one line item, save as Draft, then submit; submission results in supplier notification and the PO transitions to Submitted state.

**Acceptance Scenarios**:

1. **Given** a Buyer at a branch with supplier and product available, **When** the Buyer creates a PO with at least one line item and selects "Submit", **Then** the PO status changes from Draft to Submitted and a notification is sent to the supplier.
2. **Given** a Draft PO, **When** the Buyer edits quantities or expected prices, **Then** changes persist and are reflected in the PO total.

---

### User Story 2 - Approval workflow for high-value POs (Priority: P1)

As a Branch Manager (approver), I want to receive approval requests for POs over $10,000 so that large purchases are reviewed before being approved.

**Why this priority**: Controls spend and enforces review for material purchases.

**Independent Test**: Submit a PO with total > $10,000: system creates an approval request and blocks final approval until an approver acts; after approval, PO transitions to Approved and supplier is notified of approval.

**Acceptance Scenarios**:

1. **Given** a PO with total > $10,000 in Submitted state, **When** the Branch Manager approves the request, **Then** PO transitions to Approved and supplier receives an approval notification.
2. **Given** a PO with total > $10,000, **When** no approval is granted, **Then** PO remains in Submitted state and cannot be marked Approved or Fulfilled.

---

### User Story 3 - Fulfillment and cancellation (Priority: P2)

As a Supplier or Buyer, I want to mark a PO as Fulfilled or Cancelled to reflect real-world completion or cancellation of orders.

**Why this priority**: Tracks lifecycle to completion and enables reconciliation.

**Independent Test**: Transition an Approved PO to Fulfilled and confirm status history records the change; Cancel a Draft or Submitted PO and confirm supplier receives cancellation notice if previously notified.

**Acceptance Scenarios**:

1. **Given** an Approved PO, **When** the supplier confirms delivery, **Then** PO transitions to Fulfilled.
2. **Given** a Submitted PO, **When** the Buyer cancels it before approval/fulfillment, **Then** PO transitions to Cancelled and supplier receives a cancellation notification if already notified.

---

### Edge Cases

- What happens when a product referenced on a line item is removed from catalog after PO creation? The PO must retain immutable line-item details (product name/code, expected price) for audit.
- How to handle partial fulfillment (supplier ships partial quantities)? The system MUST record fulfillment records per line item and allow partial finalization.
- What if the approver is unavailable? Approval queue semantics (fallback approver) are out of scope for v1 — see Assumptions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a Buyer to create a Purchase Order (PO) containing: supplier reference, branch reference, one or more line items (product identifier, product name, quantity, expected price), currency, and optional notes.
- **FR-002**: System MUST allow saving a PO in `Draft` state and allow edits while Draft.
- **FR-003**: System MUST allow submitting a Draft PO to move it into `Submitted` state.
- **FR-004**: System MUST calculate the PO total as the sum of (line item quantity × expected price) and surface total to users.
- **FR-005**: System MUST send a notification to the referenced supplier when a PO is Submitted, and optionally when Approved, Fulfilled, or Cancelled.
- **FR-006**: System MUST enforce an approval workflow for POs with total strictly greater than $10,000: Submitted POs above threshold MUST be flagged as pending approval and require an explicit Approver action to reach Approved.
- **FR-007**: System MUST record the following PO statuses and transitions: Draft → Submitted → Approved → Fulfilled; Draft/Submitted → Cancelled; Submitted → Rejected (if approver rejects) → Cancelled (business interpretation).
- **FR-008**: System MUST allow an Approver to Approve or Reject a Submitted PO and record the approver's identity, timestamp, and optional comment.
- **FR-009**: System MUST maintain an immutable audit/history trail of status changes and edits to line items (who, when, what changed).
- **FR-010**: System MUST allow queries for POs by branch, supplier, status, date range, and PO number.
- **FR-011**: System MUST validate line item quantities are positive integers and expected prices are non-negative decimals.
- **FR-012**: System MUST record fulfillment records per line item (quantity fulfilled, timestamp, reference document) to support partial fulfillments.
- **FR-013**: System MUST provide guardrails to prevent duplicate submissions (idempotency) from client retries.
- **FR-014**: System MUST expose the API contract (OpenAPI) for PO create/modify/submit/approve/query actions (contract-first requirement per governance).

## Key Entities *(include if feature involves data)*

- **PurchaseOrder (PO)**: id, PO number, branch_id, buyer_id, supplier_id, created_at, updated_at, currency, total_amount, status (Draft, Submitted, Approved, Fulfilled, Cancelled), metadata.
- **LineItem**: id, po_id, product_id (if available), product_name, quantity, expected_price, line_total, fulfillment_records.
- **Supplier**: id, name, contact_info (for notifications), preferred_notification_channel (email/webhook) — contact details are stored as references not implementation specifics.
- **Branch**: id, name, location, manager_id.
- **Approval**: id, po_id, approver_id, decision (approved/rejected), timestamp, comment.
- **FulfillmentRecord**: id, line_item_id, quantity_fulfilled, timestamp, reference_document.
- **Notification**: id, po_id, recipient (supplier contact), type (submitted/approved/fulfilled/cancelled), status (sent/failed), timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Buyers can create and submit a PO in under 5 minutes for typical orders (3–10 line items) as measured in usability testing.
- **SC-002**: Notifications to suppliers are delivered within 1 minute of PO submission in 95% of test runs (integration test environment with mocked delivery channel is acceptable for validation).
- **SC-003**: POs over $10,000 cannot reach `Approved` without an explicit approval action; automated checks must block approval in 100% of test cases.
- **SC-004**: The system records and surfaces a complete status history for 100% of POs in audit logs.
- **SC-005**: Integration tests covering create → submit → approve/fulfill flows pass in CI using a lightweight DB instance.

## Assumptions

- The project governance prefers `API-First` contracts and test-first development; the spec assumes an OpenAPI contract will be produced and contract/integration tests will be written before implementation.
- Approval role mapping: by default, the Branch Manager is the approver for branch-originated POs; fallback approver flows are out of scope for v1.
- Supplier contacts exist and are reachable via a stored contact method; delivery of notifications may be retried on transient failures.
- Partial fulfillment is supported via per-line-item fulfillment records; reconciliation procedures live outside this feature.
- Per the project constitution, integration tests should run against a lightweight DB (e.g., on-disk SQLite) in CI.
