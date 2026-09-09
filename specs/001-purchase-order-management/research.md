# Research: Purchase Order Management Design Decisions

**Phase**: 0 (Research) | **Date**: 2026-09-09 | **Status**: Complete

## Design Decisions Resolved

### 1. Status Transition State Machine

**Decision**: Implement explicit state transitions via enum with validated state graph.

**Rationale**: Status transitions in spec are linear but constrained (e.g., Draft → Submitted → Approved → Fulfilled, but also → Cancelled at any pre-fulfilled stage). Explicit validation prevents invalid state transitions and makes audit trail unambiguous.

**Alternatives considered**:
- Simple string status in DB: rejected because it allows invalid transitions at runtime without validation.
- Event-sourcing: rejected for v1 due to added complexity; immutable audit trail already provided by status_history table.

**Implementation**: Enum `PurchaseOrderStatus { Draft, Submitted, Approved, Rejected, Fulfilled, PartiallyFulfilled, Cancelled }` with `isValidTransition(from, to)` method in service layer.

---

### 2. Approval Workflow Pattern

**Decision**: Approval is synchronous approval-on-submit. POs over $10,000 auto-flag and require explicit approver action before transitioning to Approved.

**Rationale**: Spec requires "blocked final approval until an approver acts." Synchronous check at submission time simplifies audit trail and eliminates dangling async approval requests.

**Alternatives considered**:
- Async approval queue (e.g., approver polls for pending requests): rejected because sync workflow is simpler, spec doesn't mandate async UI, and audit trail is clearer.
- Fallback approver (if primary unavailable): deferred to v2 per spec assumptions—v1 assumes approver is always available.

**Implementation**: On PO submit:
1. Calculate total (sum of line_item quantities × expected prices).
2. If total > $10,000, create Approval record (approver_id = branch manager, status = pending).
3. Return PO in Submitted state but block transition to Approved until approver_id acts.

---

### 3. Notification Dispatch Strategy

**Decision**: Synchronous notification with async retry loop (using setTimeout/queue). Notifications are fire-and-forget but logged.

**Rationale**: Spec requires 1-minute delivery SLA for 95% of submissions. Synchronous dispatch at PO event time (submit, approve, fulfill, cancel) ensures tight coupling to business logic; async retry absorbs transient failures without blocking PO state transitions.

**Alternatives considered**:
- Queue-based (e.g., Bull, RabbitMQ): rejected for v1 due to added deployment complexity; Nodemailer with retry loop sufficient for test environment.
- Synchronous blocking dispatch: rejected because network timeouts could block PO operations.

**Implementation**: On PO event (submit, approve, etc.), create Notification record with status=pending. Background worker (setInterval every 30s) retries failed notifications up to 3 times.

---

### 4. Idempotency Pattern for PO Submit

**Decision**: Idempotency key (client-provided UUID or request fingerprint) stored in PO metadata.

**Rationale**: Network retries could result in duplicate submissions. Spec requires "guardrails to prevent duplicate submissions (idempotency)."

**Alternatives considered**:
- No idempotency (accept duplicates): rejected—violates spec FR-013.
- Database-level unique constraint on (buyer_id, supplier_id, created_at, hash(line_items)): rejected because client retries arrive within ms, hash is fragile.

**Implementation**: Client sends `Idempotency-Key` header on POST/PATCH. Server stores key in PO metadata. If key seen before, return cached response (200 with existing PO) rather than creating duplicate.

---

### 5. Fulfillment Record Tracking

**Decision**: Granular per-line-item fulfillment records with quantity_fulfilled field (decimal).

**Rationale**: Spec requires partial fulfillment support and multi-shipment tracking. Per-line-item records enable precise reconciliation and state transition to PartiallyFulfilled.

**Alternatives considered**:
- Single fulfillment record per PO: rejected—can't track which line items are partial vs. complete.
- Automatic state transitions: rejected—supplier must explicitly record fulfillment; system calculates state based on aggregated fulfillment_records.

**Implementation**: FulfillmentRecord table: (id, line_item_id, quantity_fulfilled, timestamp, reference_document). On insert, system recalculates PO status:
- If all line_items have quantity_fulfilled ≥ quantity: status = Fulfilled.
- If any line_item has 0 < quantity_fulfilled < quantity: status = PartiallyFulfilled.
- Else: no change.

---

### 6. Immutable Product Details in Line Items

**Decision**: Line items snapshot product_name, expected_price, product_id at creation; never update. Catalog changes don't affect existing POs.

**Rationale**: Spec edge case: "What if product is removed from catalog?" Immutability ensures audit trail is complete and historical POs are reconcilable.

**Alternatives considered**:
- Reference product_id and look up name/price from Catalog at query time: rejected—if catalog entry deleted, historical PO details become unresolvable.

**Implementation**: LineItem fields: (id, po_id, product_id [nullable], product_name [immutable], quantity, expected_price [immutable]). No updates to product_name or expected_price after creation.

---

## Technology Choices Confirmed

- **TypeScript 5.4 + Express.js 4.18.2**: Aligns with project stack; lightweight, battle-tested.
- **SQLite3**: Matches constitution requirement for lightweight, file-based DB. Sufficient for v1; scaling beyond 10k concurrent users may require PostgreSQL in v2.
- **Vitest + Supertest**: Standard Node.js testing stack; integration tests run against real SQLite.
- **Nodemailer**: Stub implementation for v1; easily swappable for SendGrid/AWS SES in production.
- **OpenAPI 3.0**: Spec-first design; machine-readable contracts for client generation.

---

## Open Questions for Phase 1

None—all major design decisions resolved. Phase 1 will lock down OpenAPI contract, data model, and quickstart scenarios.
