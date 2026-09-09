# Implementation Plan: Purchase Order Management

**Branch**: `001-purchase-order-management` | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-purchase-order-management/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Build a Purchase Order management system enabling branch Buyers to create, submit, and track POs to suppliers. Core workflow: create Draft PO → add line items → submit (triggers supplier notification) → auto-require approval if total > $10,000 → record fulfillment and track status through completion. Implement as Express.js REST API with SQLite persistence, OpenAPI contracts, and integration tests per project constitution.

## Technical Context

**Language/Version**: TypeScript 5.4, Node.js 18+ (Express.js 4.18.2)

**Primary Dependencies**: Express.js, SQLite3, Nodemailer (notifications)

**Storage**: SQLite3 (persistent file-based DB matching constitution requirement for lightweight infrastructure)

**Testing**: Vitest (unit/integration), contract tests via OpenAPI/Jest supertest

**Target Platform**: Linux/macOS backend server (REST API)

**Project Type**: Web service (backend API) + library (core domain logic)

**Performance Goals**: API response <200ms p95; notification delivery within 1 minute; support 100+ concurrent PO operations

**Constraints**: No external services assumed (Nodemailer local); idempotent submit operations; immutable audit trail

**Scale/Scope**: v1 supports single-tenant/single-branch operations; extensible to multi-branch in v2

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Library-First ✓
- PurchaseOrder domain logic extracted into `services/purchaseOrderService.ts` (reusable library pattern).
- Public contracts via OpenAPI spec (see Phase 1).

### Test-First (TDD + Contract Tests) ✓
- Contract tests written for API endpoints before implementation (integration tests via supertest).
- Unit tests for business logic (status transitions, calculations, approval workflow).

### Integration-First Testing ✓
- Integration tests use real SQLite instance (on-disk, per constitution).
- No extensive mocks; real database state tested.

### Simplicity Over Abstraction ✓
- Use Express.js routing directly; explicit repository pattern for DB access (no complex ORM abstractions).
- Minimal dependencies; avoid extra layers.

### API-First (OpenAPI) ✓
- OpenAPI contract defined in Phase 1 (`contracts/openapi.yaml`).
- Endpoints: POST /po, GET /po/:id, PATCH /po/:id/submit, PATCH /po/:id/approve, POST /po/:id/fulfill.
- CI check to validate implementation matches spec.

**All gates PASS.** No violations or exceptions to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-purchase-order-management/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── openapi.yaml
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   ├── purchaseOrder.ts       # Domain model (PO, LineItem, FulfillmentRecord)
│   │   ├── lineItem.ts
│   │   └── fulfillmentRecord.ts
│   ├── services/
│   │   └── purchaseOrderService.ts   # Core business logic (status transitions, approvals, calcs)
│   ├── api/
│   │   └── purchaseOrders.ts         # Express routes (POST/PATCH/GET)
│   ├── repos/
│   │   └── purchaseOrderRepo.ts      # SQLite persistence layer
│   ├── notifications/
│   │   └── nodemailerStub.ts         # Notification dispatch (supplier email/webhook)
│   ├── db/
│   │   ├── sqlite.ts                 # DB connection pool
│   │   └── migrations/
│   │       └── 001_init.sql          # Schema (PO, LineItem, FulfillmentRecord, Approval, Notification)
│   └── index.ts                      # Express app setup
├── tests/
│   ├── integration/                  # Real SQLite integration tests
│   │   ├── purchaseOrder.spec.ts
│   │   └── approval.spec.ts
│   ├── contract/                     # OpenAPI contract tests (supertest)
│   │   └── api.spec.ts
│   └── unit/                         # Business logic unit tests
│       └── purchaseOrderService.spec.ts
├── package.json
└── tsconfig.json
```

**Structure Decision**: Single backend project (web service) with domain library pattern. Services layer (`purchaseOrderService`) extracts core business logic for reuse; API layer routes requests; repos handle persistence. Tests layer follows integration-first pattern with real SQLite. This aligns with Library-First principle (domain logic is independently testable) and Simplicity Over Abstraction (no complex ORMs, direct Express routing).

## Complexity Tracking

No violations to justify—all constitution gates pass cleanly.

---

## Phase 0: Research & Design Decisions

**Status**: ✅ Complete | **Output**: [research.md](research.md)

All technical unknowns resolved. Key design decisions locked:

1. **Status Transition State Machine**: Enum-based validation prevents invalid transitions.
2. **Approval Workflow**: Synchronous approval-on-submit for POs > $10,000.
3. **Notification Strategy**: Synchronous dispatch with async retry loop (30s intervals, max 3 retries).
4. **Idempotency**: Client-provided key stored in metadata; prevents duplicate submissions.
5. **Fulfillment Tracking**: Per-line-item records; system auto-calculates PO status (Fulfilled, PartiallyFulfilled).
6. **Immutable Line Items**: Product name/price snapshot at creation; never updated.

See [research.md](research.md) for rationale, alternatives evaluated, and implementation details.

---

## Phase 1: Design & Contracts

**Status**: ✅ Complete | **Outputs**:
- [data-model.md](data-model.md) — Entity definitions, relationships, constraints
- [contracts/openapi.yaml](contracts/openapi.yaml) — API contract (9 endpoints)
- [quickstart.md](quickstart.md) — Validation scenarios and success criteria

### Data Model

Entities: PurchaseOrder (aggregate root), LineItem, FulfillmentRecord, Approval, StatusHistory, Notification, Supplier, Branch, User.

Key constraints:
- Draft PO editable; Submitted+ immutable.
- PO total auto-calculated from line items.
- Approval required for POs > $10,000.
- Fulfillment records cumulative; system calculates completion %.
- Status history immutable audit trail.

See [data-model.md](data-model.md) for full schema, enums, and relationships.

### API Contract

Nine endpoints covering PO lifecycle:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/purchase-orders` | POST | Create Draft PO |
| `/purchase-orders` | GET | Query POs (by branch, supplier, status, date range) |
| `/purchase-orders/{id}` | GET | Fetch PO details |
| `/purchase-orders/{id}` | PATCH | Update Draft PO |
| `/purchase-orders/{id}/submit` | POST | Transition Draft → Submitted |
| `/purchase-orders/{id}/approve` | POST | Approver: transition Submitted → Approved |
| `/purchase-orders/{id}/reject` | POST | Approver: transition Submitted → Rejected |
| `/purchase-orders/{id}/cancel` | POST | Buyer: transition to Cancelled |
| `/purchase-orders/{id}/line-items` | POST | Add line item to Draft PO |
| `/purchase-orders/{id}/fulfill` | POST | Record fulfillment |

All endpoints return standard response schema (PurchaseOrderResponse with nested line_items, approval, status_history).

Error handling: 400 (validation), 403 (authorization), 404 (not found), 409 (state conflict, idempotency).

See [contracts/openapi.yaml](contracts/openapi.yaml) for full OpenAPI 3.0 specification.

### Validation Scenarios

Three primary scenarios map to user stories:

1. **Scenario 1** (User Story 1): Create → add line items → submit → supplier notified. Validates core PO workflow.
2. **Scenario 2** (User Story 2): High-value PO (> $10,000) auto-flags approval; approval blocks premature fulfillment.
3. **Scenario 3** (User Story 3): Partial fulfillment records; cumulative fulfillment transitions state; cancellation sends notification.

Plus edge cases: prevent edits to Submitted PO, rejection → cancellation path, idempotency.

See [quickstart.md](quickstart.md) for step-by-step curl commands, expected responses, and success criteria.

---

## Next Steps: Phase 2 (Implementation Planning)

After `/speckit-plan` completes, run `/speckit-tasks` to generate `tasks.md`:

```bash
speckit-tasks
```

This will produce an ordered, dependency-annotated task list for implementing:
- Database schema and migrations
- Domain service layer (business logic)
- Express API routes
- Notification background worker
- Contract and integration tests

---

## Glossary

- **PO**: Purchase Order (aggregate root).
- **Line Item**: Individual product entry in a PO; immutable after creation.
- **Fulfillment Record**: Shipment/delivery record for a line item (supports partial fulfillment).
- **Approval**: Review checkpoint for POs > $10,000.
- **Idempotency Key**: Client-provided UUID to prevent duplicate submissions.
- **Status History**: Immutable audit trail of PO state changes.
- **Notification**: Outbound message to supplier (email/webhook) on PO events.
