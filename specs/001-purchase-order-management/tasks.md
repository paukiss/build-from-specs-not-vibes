# Tasks: Purchase Order Management System

**Input**: Design documents from `/specs/001-purchase-order-management/`

**Prerequisites**: plan.md (tech stack, project structure), spec.md (user stories P1, P2, P3), research.md (design decisions), data-model.md (entities), contracts/openapi.yaml (API spec), quickstart.md (validation scenarios)

**Organization**: Tasks grouped by user story (P1, P2, P3) to enable independent implementation and testing. Each story is independently testable and deployable.

**Constitution Alignment**: Test-First (contract tests before implementation), Integration-First Testing (real SQLite), API-First (OpenAPI), Library-First (domain services reusable).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and express.js/TypeScript scaffold

- [ ] T001 Create Express.js application structure: `backend/src/index.ts`, `backend/src/api/`, `backend/src/services/`, `backend/src/models/`, `backend/src/repos/`, `backend/src/db/`, `backend/src/notifications/`
- [ ] T002 Setup TypeScript compiler and ts-node-dev for development in `backend/tsconfig.json`
- [ ] T003 [P] Configure ESLint and Prettier formatting in `backend/.eslintrc.json` and `.prettierrc`
- [ ] T004 [P] Setup environment configuration (`.env.example`, `backend/src/config/index.ts`) with DEBUG, DATABASE_PATH, NOTIFICATION_RETRY_INTERVAL, PORT

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure REQUIRED before any user story can start. All stories depend on these.

**⚠️ CRITICAL**: No user story work begins until Phase 2 is complete.

### Database & Schema

- [ ] T005 Create SQLite database initialization script `backend/src/db/sqlite.ts` (connection pool, error handling)
- [ ] T006 Create database schema migration `backend/src/db/migrations/001_init.sql` with tables:
  - `purchase_orders` (id, po_number, branch_id, buyer_id, supplier_id, status, total_amount, currency, created_at, updated_at, metadata JSON, notes)
  - `line_items` (id, po_id, product_id, product_name, quantity, expected_price, created_at)
  - `fulfillment_records` (id, line_item_id, quantity_fulfilled, timestamp, reference_document, notes)
  - `approvals` (id, po_id, approver_id, decision, timestamp, comment)
  - `status_history` (id, po_id, from_status, to_status, changed_by, timestamp, reason)
  - `notifications` (id, po_id, recipient, type, status, timestamp, retry_count, error_message)
- [ ] T007 Create database migration runner `backend/src/db/migrations.ts` (run migrations on app startup)

### Core Domain Models & Enums

- [ ] T008 [P] Create TypeScript enums in `backend/src/models/enums.ts`:
  - `PurchaseOrderStatus` (draft, submitted, approved, rejected, fulfilled, partially_fulfilled, cancelled)
  - `ApprovalDecision` (pending, approved, rejected)
  - `NotificationType` (submitted, approved, fulfilled, cancelled)
  - `NotificationStatus` (pending, sent, failed)
  - `NotificationChannel` (email, webhook)
- [ ] T009 [P] Create `backend/src/models/purchaseOrder.ts` with PurchaseOrder interface/class:
  - Fields: id, po_number (unique), branch_id, buyer_id, supplier_id, status, total_amount (calculated), currency, created_at, updated_at, metadata (JSON), notes
  - Methods: isEditable() returns true only if status === Draft; calculateTotal() sums line_items
- [ ] T010 [P] Create `backend/src/models/lineItem.ts` with LineItem interface/class:
  - Fields: id, po_id, product_id (nullable), product_name (immutable), quantity (> 0), expected_price (>= 0), created_at
  - Constraint validation: quantity must be positive integer, expected_price non-negative decimal
- [ ] T011 [P] Create `backend/src/models/fulfillmentRecord.ts` with FulfillmentRecord interface/class:
  - Fields: id, line_item_id, quantity_fulfilled (decimal, <= line_item.quantity), timestamp, reference_document, notes
- [ ] T012 [P] Create `backend/src/models/approval.ts` with Approval interface/class:
  - Fields: id, po_id, approver_id, decision (enum), timestamp, comment
  - Constraint: decision immutable once set
- [ ] T013 [P] Create `backend/src/models/statusHistory.ts` with StatusHistory interface/class:
  - Fields: id, po_id, from_status, to_status, changed_by, timestamp, reason
  - Immutable audit trail

### State Machine & Validation

- [ ] T014 Create state transition validator `backend/src/services/stateTransitions.ts` with:
  - `isValidTransition(from: PurchaseOrderStatus, to: PurchaseOrderStatus): boolean`
  - Validates per research.md#1: Draft→Submitted, Submitted→Approved/Rejected, Approved→Fulfilled, PartiallyFulfilled→Fulfilled, any→Cancelled
  - Unit tests for all valid and invalid transitions

### Error Handling & Logging

- [ ] T015 [P] Create error handling middleware `backend/src/middleware/errorHandler.ts` (catch Express errors, return 400/403/404/409 with error schema)
- [ ] T016 [P] Create logging utility `backend/src/utils/logger.ts` (use console or Winston; log PO events at info level, errors at error level)

### Notification Infrastructure

- [ ] T017 Create notification channel abstraction `backend/src/notifications/notificationChannel.ts` with interface:
  - `sendNotification(recipient: string, type: NotificationType, po: PurchaseOrder): Promise<boolean>`
  - Implementations: email (Nodemailer), webhook stub
- [ ] T018 Create Nodemailer stub implementation `backend/src/notifications/nodemailerStub.ts`:
  - Mock email sending (log to console, return success)
  - Used for test/dev environments
- [ ] T019 Create notification retry worker `backend/src/workers/notificationRetry.ts`:
  - Every 30s, query Notification records with status=pending
  - Retry up to 3 times; mark as sent/failed
  - Background worker runs on app startup via setInterval

**Checkpoint**: Foundation complete. Database schema, models, state machine, and notification infra ready. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Create and Submit a Purchase Order (Priority: P1) 🎯 MVP

**Goal**: Buyers can create Draft POs, add line items, and submit them. Supplier receives notification on submission.

**Independent Test**: Per quickstart.md Scenario 1: Create Draft PO → add 2 line items → verify total calculated → submit → verify status=submitted, notification pending, idempotency works.

### Contract Tests for US1

- [ ] T020 [P] [US1] Create contract test `backend/tests/contract/purchaseOrder.spec.ts` (use supertest):
  - POST /purchase-orders: creates Draft PO
  - POST /purchase-orders/{id}/line-items: adds line item
  - GET /purchase-orders/{id}: returns PO with calculated total
  - POST /purchase-orders/{id}/submit: transitions to Submitted
- [ ] T021 [P] [US1] Create integration test `backend/tests/integration/purchaseOrder.spec.ts` (real SQLite):
  - Full create → add items → submit flow
  - Verify status_history recorded
  - Verify idempotency (duplicate submit with same key returns cached result)
  - Verify notifications created (status=pending)

### Implementation for US1

- [ ] T022 Create Purchase Order repository `backend/src/repos/purchaseOrderRepo.ts` with methods:
  - `create(branch_id, buyer_id, supplier_id, currency, notes): Promise<PurchaseOrder>`
  - `getById(id): Promise<PurchaseOrder | null>`
  - `updateNotes(id, notes): Promise<void>` (Draft only)
  - `updateStatus(id, from_status, to_status, changed_by, reason): Promise<void>` (creates status_history record)
  - All DB operations use sqlite3 prepared statements
- [ ] T023 Create Line Item repository `backend/src/repos/lineItemRepo.ts` with methods:
  - `create(po_id, product_id, product_name, quantity, expected_price): Promise<LineItem>`
  - `getByPoId(po_id): Promise<LineItem[]>`
  - Validation per data-model.md: quantity > 0, expected_price >= 0
- [ ] T024 [P] [US1] Create PurchaseOrderService `backend/src/services/purchaseOrderService.ts` (core business logic):
  - `createPO(branch_id, buyer_id, supplier_id, currency, notes): Promise<PurchaseOrder>`
  - `addLineItem(po_id, product_id, product_name, quantity, expected_price): Promise<LineItem>` (only if PO.status === draft)
  - `submitPO(po_id, idempotency_key): Promise<PurchaseOrder>`:
    - Validate PO is in Draft status
    - Calculate total from line_items
    - Check idempotency_key: if seen before, return cached PO (409 if different content, 200 if same)
    - Determine if total > $10,000 (approval required)
    - Transition to Submitted
    - Create Approval record if needed (decision=pending, approver_id = branch manager)
    - Create Notification record (type=submitted, status=pending, recipient=supplier.contact_email)
    - Store idempotency_key in PO.metadata
  - `getPO(po_id): Promise<PurchaseOrder>` with nested line_items, approvals, status_history
  - `listPOs(filters: {branch_id?, supplier_id?, status?, created_from?, created_to?}, limit, offset): Promise<{data: PurchaseOrder[], total: number}>`
- [ ] T025 Create Notification repository `backend/src/repos/notificationRepo.ts` with methods:
  - `create(po_id, recipient, type, status): Promise<Notification>`
  - `getByPoId(po_id): Promise<Notification[]>`
  - `updateStatus(id, status, error_message?): Promise<void>`
  - `getPending(limit): Promise<Notification[]>` (for retry worker)
  - `incrementRetry(id): Promise<void>`
- [ ] T026 [P] [US1] Create Express API routes `backend/src/api/purchaseOrders.ts`:
  - POST /api/v1/purchase-orders: Call PurchaseOrderService.createPO()
  - GET /api/v1/purchase-orders: Call PurchaseOrderService.listPOs() with query filters
  - GET /api/v1/purchase-orders/:id: Call PurchaseOrderService.getPO()
  - PATCH /api/v1/purchase-orders/:id: Call PurchaseOrderService.updateNotes() (Draft only)
  - POST /api/v1/purchase-orders/:id/line-items: Call PurchaseOrderService.addLineItem()
  - POST /api/v1/purchase-orders/:id/submit: Call PurchaseOrderService.submitPO()
  - Error handling: return error schema per openapi.yaml on validation failure
- [ ] T027 [US1] Integrate PurchaseOrderService with notification retry worker:
  - Worker calls NotificationService.retryPendingNotifications() every 30s
  - Notifications sent via NotificationChannel.sendNotification()
- [ ] T028 [US1] Add comprehensive validation and logging:
  - Validate line_item quantities > 0, prices >= 0
  - Log PO creation, submission, notification dispatch at info level
  - Log errors at error level

**Checkpoint**: User Story 1 fully functional. Buyers can create, edit (Draft), and submit POs. Supplier notifications sent. Run Scenario 1 from quickstart.md to validate independently.

---

## Phase 4: User Story 2 - Approval Workflow for High-Value POs (Priority: P1)

**Goal**: POs over $10,000 require Branch Manager approval before progressing to Fulfilled. Approval decision blocks or allows fulfillment.

**Independent Test**: Per quickstart.md Scenario 2: Submit PO with total > $10,000 → auto-creates Approval (pending) → approver cannot fulfill until approved → approve → PO transitions to Approved, supplier notified.

### Contract Tests for US2

- [ ] T029 [P] [US2] Create approval contract tests `backend/tests/contract/approval.spec.ts`:
  - POST /purchase-orders/{id}/approve: approver only, transitions Submitted→Approved
  - POST /purchase-orders/{id}/reject: approver only, transitions Submitted→Rejected
  - Verify error 409 if trying to fulfill without approval (PO pending approval)
  - Verify error 403 if non-approver tries to approve
- [ ] T030 [P] [US2] Create approval integration tests `backend/tests/integration/approval.spec.ts`:
  - Create high-value PO (> $10,000) → submit → verify Approval.decision=pending
  - Attempt fulfill before approval → error 409
  - Approve → verify Approval.decision=approved, notification sent to supplier, status=Approved
  - Attempt approve again → error 409 (already approved)

### Implementation for US2

- [ ] T031 Create Approval repository `backend/src/repos/approvalRepo.ts`:
  - `create(po_id, approver_id): Promise<Approval>` (decision=pending by default)
  - `getByPoId(po_id): Promise<Approval | null>`
  - `updateDecision(po_id, approver_id, decision, comment): Promise<void>` (immutable check: throw if decision already set)
- [ ] T032 Extend PurchaseOrderService for approval workflow:
  - `approvePO(po_id, approver_id, comment): Promise<PurchaseOrder>`:
    - Validate PO.status === submitted and Approval exists
    - Validate current approver_id matches Approval.approver_id
    - Set Approval.decision = approved
    - Transition PO to Approved
    - Create Notification (type=approved, recipient=supplier.contact_email)
    - Record status_history transition
  - `rejectPO(po_id, approver_id, reason): Promise<PurchaseOrder>`:
    - Validate PO.status === submitted and Approval exists
    - Set Approval.decision = rejected
    - Transition PO to Rejected
    - Create Notification (type=rejected, optional, internal only)
    - Record status_history transition
  - `canTransitionToApproved(po_id): Promise<boolean>`:
    - Return false if total > $10,000 and Approval.decision !== approved
    - Return true if total <= $10,000
  - `canFulfill(po_id): Promise<boolean>`:
    - Return false if Approval exists and Approval.decision !== approved
    - Return true otherwise
- [ ] T033 [P] [US2] Add approval endpoints to Express routes `backend/src/api/purchaseOrders.ts`:
  - POST /api/v1/purchase-orders/:id/approve: Call approvePO()
  - POST /api/v1/purchase-orders/:id/reject: Call rejectPO()
  - Both check authorization (approver_id from request context/JWT)
  - Error 403 if not approver, 409 if state invalid
- [ ] T034 [US2] Add approval logic to submitPO workflow:
  - When submitPO() called and total > $10,000, auto-create Approval (per T024 extension)
  - Verify this creates correct records in integration test

**Checkpoint**: User Story 2 complete. High-value POs require approval. Run Scenario 2 from quickstart.md. Both US1 and US2 now work independently.

---

## Phase 5: User Story 3 - Fulfillment and Cancellation (Priority: P2)

**Goal**: Record partial/complete fulfillment for line items. PO transitions to PartiallyFulfilled or Fulfilled based on cumulative fulfillment. Cancellation sends notifications.

**Independent Test**: Per quickstart.md Scenario 3: Record partial fulfillment (50%) → PO status=PartiallyFulfilled; complete fulfillment (remaining 50%) → status=Fulfilled. Cancel Draft/Submitted PO → notification sent.

### Contract Tests for US3

- [ ] T035 [P] [US3] Create fulfillment contract tests `backend/tests/contract/fulfillment.spec.ts`:
  - POST /purchase-orders/{id}/fulfill: record fulfillment for line_item
  - GET /purchase-orders/{id}: line_items include fulfillment_records
  - Verify status transitions: Approved→PartiallyFulfilled (on partial), →Fulfilled (on complete)
  - Error 400 if quantity_fulfilled > line_item.quantity
- [ ] T036 [P] [US3] Create cancellation contract tests `backend/tests/contract/cancellation.spec.ts`:
  - POST /purchase-orders/{id}/cancel: transitions to Cancelled
  - Verify notification sent if status was Submitted or later
  - Error 409 if already Fulfilled

### Implementation for US3

- [ ] T037 [P] [US3] Create Fulfillment repository `backend/src/repos/fulfillmentRepo.ts`:
  - `create(line_item_id, quantity_fulfilled, reference_document, notes): Promise<FulfillmentRecord>`
    - Validation: quantity_fulfilled > 0, <= line_item.quantity
  - `getByLineItemId(line_item_id): Promise<FulfillmentRecord[]>`
  - `sumFulfilled(line_item_id): Promise<number>` (sum quantity_fulfilled)
- [ ] T038 Extend PurchaseOrderService for fulfillment:
  - `recordFulfillment(po_id, line_item_id, quantity_fulfilled, reference_document, notes): Promise<PurchaseOrder>`:
    - Validate PO.status === Approved or PartiallyFulfilled
    - Validate quantity_fulfilled > 0, cumulative fulfillment <= line_item.quantity
    - Create FulfillmentRecord
    - Recalculate PO.status:
      - If all line_items have cumulative fulfilled ≥ quantity → status = Fulfilled
      - Else if any line_item has 0 < cumulative fulfilled < quantity → status = PartiallyFulfilled
      - Create status_history record
    - If transitioning to Fulfilled, create Notification (type=fulfilled, recipient=supplier)
- [ ] T039 [P] [US3] Extend Express routes for fulfillment `backend/src/api/purchaseOrders.ts`:
  - POST /api/v1/purchase-orders/:id/fulfill: Call recordFulfillment()
  - Validation: quantity_fulfilled > 0, no negative values
- [ ] T040 Extend PurchaseOrderService for cancellation:
  - `cancelPO(po_id, reason, user_id): Promise<PurchaseOrder>`:
    - Validate PO.status is not Fulfilled (cannot cancel completed orders)
    - Transition to Cancelled
    - If status was Submitted or later (submitted before cancellation), create Notification (type=cancelled, recipient=supplier)
    - Create status_history record
- [ ] T041 [P] [US3] Add cancellation endpoint to Express routes `backend/src/api/purchaseOrders.ts`:
  - POST /api/v1/purchase-orders/:id/cancel: Call cancelPO()
  - Include reason in request body
- [ ] T042 [US3] Update notification retry worker to handle fulfillment/cancellation notifications:
  - Verify notifications for all types (submitted, approved, fulfilled, cancelled) are retried

**Checkpoint**: User Story 3 complete. Fulfillment tracked; status transitions to PartiallyFulfilled/Fulfilled. Cancellation sends notifications. Run Scenario 3 from quickstart.md. All three user stories now work independently and together.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Test coverage, documentation, and refinements

- [ ] T043 [P] Add unit tests for stateTransitions.ts `backend/tests/unit/stateTransitions.spec.ts` (valid/invalid transitions)
- [ ] T044 [P] Add unit tests for PurchaseOrderService `backend/tests/unit/purchaseOrderService.spec.ts` (calculation logic, status transitions)
- [ ] T045 Run full test suite `npm run test` and verify all tests pass:
  - Contract tests (supertest): 7+ tests
  - Integration tests: 6+ tests
  - Unit tests: 5+ tests
- [ ] T046 Validate OpenAPI spec compliance `backend/src/api/openapi.yaml`:
  - Ensure all endpoints match openapi.yaml
  - Verify request/response schemas align
  - Generate OpenAPI docs (optional: swagger-ui or similar)
- [ ] T047 [P] Create database seed script `backend/scripts/seed.ts` (test data: branches, suppliers, users)
- [ ] T048 Update README `README.md` with:
  - Feature overview, user stories, implementation status
  - Setup instructions (npm install, npm run dev)
  - Running tests (npm run test)
  - API documentation link
- [ ] T049 [P] Add comprehensive logging throughout service layer:
  - Log PO creation, submission, approval, fulfillment at info level
  - Log all errors and validation failures at error level
- [ ] T050 Run quickstart.md Scenarios 1-3 manually (or via integration tests) and verify all pass:
  - Scenario 1: Create → submit → notify
  - Scenario 2: High-value approval flow
  - Scenario 3: Partial/complete fulfillment, cancellation
- [ ] T051 Code cleanup and refactoring:
  - Remove dead code
  - Ensure consistent error messages
  - Review all TODOs/FIXMEs
  - Lint check: `npm run lint`
- [ ] T052 [P] Performance validation:
  - Test concurrent PO submissions (basic load test)
  - Verify responses < 200ms p95
  - Notification retry worker doesn't block API

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1
- **Phase 3 (US1)**: Depends on Phase 2 ✅ BLOCKS US2/US3
- **Phase 4 (US2)**: Depends on Phase 2 + Phase 3 (shares PO repository, service)
- **Phase 5 (US3)**: Depends on Phase 2 + Phase 3 (shares PO repository, service)
- **Phase 6 (Polish)**: Depends on all user stories

### Within-Phase Parallelization

**Phase 1**:
- T003, T004 can run in parallel with T002

**Phase 2**:
- T008-T013 (Models): All [P] can run in parallel
- T015-T016 (Error handling/logging): Can run in parallel
- T005-T007 (Database): Sequential (migration runner needs schema)

**Phase 3 (US1)**:
- T020, T021 (Tests): Can run in parallel, but must fail before implementation
- T022, T023 (Repos): Can run in parallel
- T024, T025 (Service): T024 depends on T022-T023, T025 is independent [P]
- T026 (Routes): Depends on T024-T025

**Phase 4 (US2)**:
- T029, T030 (Tests): Parallel
- T031 (Repo): Independent [P]
- T032-T033 (Service/Routes): Parallel

**Phase 5 (US3)**:
- T035, T036 (Tests): Parallel
- T037-T039 (Fulfillment): Parallel
- T040-T041 (Cancellation): Parallel

**Phase 6**:
- T043-T044 (Unit tests): Parallel [P]
- T047, T049, T051 (Scripts, logging, cleanup): Parallel [P]

### Parallel Execution Example: Full Team

```
Phase 1 (Setup) - 1 developer, 1 day
└─ Phase 2 (Foundational) - 2-3 developers, 2 days
   ├─ T005-T007 (Database): Dev A
   └─ T008-T019 (Models, State Machine, Notification Infra): Dev B + Dev C
└─ Once Phase 2 complete:
   ├─ Phase 3 (US1): Dev A - 2-3 days
   ├─ Phase 4 (US2): Dev B - 1-2 days (starts after US1 contracts written)
   └─ Phase 5 (US3): Dev C - 1-2 days (starts after US1 contracts written)
└─ Phase 6 (Polish): All - 1 day
```

Total: ~8-10 days with 3 developers (vs. 15+ days sequentially)

---

## Implementation Strategy

### MVP First (Minimum Viable Product)

**Target**: User Story 1 only (3-4 days)

1. Complete Phase 1: Setup (1 day)
2. Complete Phase 2: Foundational (1 day) — **CRITICAL BLOCKER**
3. Complete Phase 3: User Story 1 (1-2 days)
4. **VALIDATE**: Run Scenario 1 from quickstart.md independently
5. **Deploy/Demo**: Show buyers can create, edit, and submit POs; suppliers notified

At this point, the system has core value. US2 and US3 are enhancements.

### Incremental Delivery

After MVP (US1) validated:

1. **Day 5**: Add Phase 4 (US2) — Approval workflow for large orders (+1 day)
   - Validate: Run Scenario 2
   - Deploy: High-value orders now require approval
2. **Day 6**: Add Phase 5 (US3) — Fulfillment tracking (+1 day)
   - Validate: Run Scenario 3
   - Deploy: Track shipments, partial fulfillment, cancellations
3. **Day 7**: Phase 6 (Polish) — Comprehensive testing, docs, optimization (+1 day)

Each increment adds independent value without breaking prior stories.

### Testing Strategy (Test-First per Constitution)

Before implementing any story:

1. Write contract tests (using supertest against express routes)
2. Write integration tests (using real SQLite)
3. Verify tests **FAIL** without implementation
4. Implement service/repository/endpoint
5. Verify tests **PASS**
6. Run full suite to ensure no regressions

Example for US1:
```bash
# Write tests first (T020, T021) - these FAIL initially
npm run test -- purchaseOrder

# Implement (T022-T028)
# Run tests - now they PASS
npm run test -- purchaseOrder
```

---

## File Structure Summary

```
backend/
├── src/
│   ├── index.ts                          # Express app setup
│   ├── config/
│   │   └── index.ts                      # Env configuration
│   ├── models/                           # Domain models (T008-T013)
│   │   ├── enums.ts
│   │   ├── purchaseOrder.ts
│   │   ├── lineItem.ts
│   │   ├── fulfillmentRecord.ts
│   │   ├── approval.ts
│   │   └── statusHistory.ts
│   ├── services/
│   │   ├── purchaseOrderService.ts       # Core business logic (T024, T032, T038, T040)
│   │   └── stateTransitions.ts           # State machine (T014)
│   ├── repos/
│   │   ├── purchaseOrderRepo.ts          # PO persistence (T022)
│   │   ├── lineItemRepo.ts               # Line item persistence (T023)
│   │   ├── approvalRepo.ts               # Approval persistence (T031)
│   │   ├── fulfillmentRepo.ts            # Fulfillment persistence (T037)
│   │   └── notificationRepo.ts           # Notification persistence (T025)
│   ├── api/
│   │   └── purchaseOrders.ts             # Express routes (T026, T033, T039, T041)
│   ├── notifications/
│   │   ├── notificationChannel.ts        # Channel abstraction (T017)
│   │   ├── nodemailerStub.ts             # Email implementation (T018)
│   │   └── notificationService.ts        # Dispatch logic
│   ├── workers/
│   │   └── notificationRetry.ts          # Retry background job (T019)
│   ├── db/
│   │   ├── sqlite.ts                     # DB connection (T005)
│   │   ├── migrations.ts                 # Migration runner (T007)
│   │   └── migrations/
│   │       └── 001_init.sql              # Schema (T006)
│   ├── middleware/
│   │   └── errorHandler.ts               # Error handling (T015)
│   └── utils/
│       └── logger.ts                     # Logging (T016)
├── tests/
│   ├── contract/
│   │   ├── purchaseOrder.spec.ts         # US1 contracts (T020)
│   │   ├── approval.spec.ts              # US2 contracts (T029)
│   │   ├── fulfillment.spec.ts           # US3 contracts (T035)
│   │   └── cancellation.spec.ts          # US3 cancellation (T036)
│   ├── integration/
│   │   ├── purchaseOrder.spec.ts         # US1 integration (T021)
│   │   ├── approval.spec.ts              # US2 integration (T030)
│   │   └── fulfillment.spec.ts           # US3 integration
│   └── unit/
│       ├── stateTransitions.spec.ts      # State machine (T043)
│       └── purchaseOrderService.spec.ts  # Service logic (T044)
├── scripts/
│   └── seed.ts                           # Test data seed (T047)
├── package.json
├── tsconfig.json
└── README.md                             # Documentation (T048)
```

---

## Success Criteria Checklist

- [ ] Phase 1: Express/TypeScript scaffold complete, env configured
- [ ] Phase 2: Database schema created, models defined, state machine implemented
- [ ] Phase 3 (US1): Create → add items → submit → notify. Scenario 1 passes. Idempotency verified.
- [ ] Phase 4 (US2): High-value POs auto-flagged. Approval workflow works. Scenario 2 passes.
- [ ] Phase 5 (US3): Fulfillment tracked, status transitions correct. Cancellation notifies. Scenario 3 passes.
- [ ] Phase 6: All tests pass (contract + integration + unit). Docs complete. Performance validated.
- [ ] All tasks follow checklist format (checkbox, ID, [P]/[Story] labels, file paths)
- [ ] Code adheres to constitution (test-first, integration-first, API-first)

---

## Glossary

- **[P]**: Parallelizable task (different files, no blocked dependencies)
- **[US#]**: User Story label (US1, US2, US3)
- **Idempotency Key**: UUID to prevent duplicate PO submissions
- **Status History**: Immutable audit trail of PO state changes
- **State Machine**: Enum-based validation per research.md#1
- **Line Item**: Individual product entry in PO; immutable after creation
- **Fulfillment Record**: Shipment record for partial/complete delivery
- **Approval**: Review gate for POs > $10,000
- **Notification**: Outbound message to supplier (email/webhook)
