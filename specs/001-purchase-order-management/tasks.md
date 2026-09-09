## Tasks: Purchase Order Management

**Input**: Design documents from `/specs/001-purchase-order-management/`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create project structure per implementation plan (backend/, frontend/, tests/) — path: backend/, frontend/, tests/
- [ ] T002 Initialize Node + TypeScript project for backend (create backend/package.json, backend/tsconfig.json)
- [ ] T003 [P] Install core dependencies and devDependencies (express, sqlite3, typeorm/knex or chosen ORM, nodemailer (stub), vitest, playwright) — path: backend/package.json
- [ ] T004 [P] Configure linting and formatting (ESLint, Prettier) — path: backend/.eslintrc.cjs, backend/.prettierrc
- [ ] T005 [P] Add test harness and CI scaffold for running Vitest and Playwright (config files) — path: backend/vitest.config.ts, backend/playwright.config.ts

 - [X] T001 Create project structure per implementation plan (backend/, frontend/, tests/) — path: backend/, frontend/, tests/
 - [X] T002 Initialize Node + TypeScript project for backend (create backend/package.json, backend/tsconfig.json)
 - [X] T003 [P] Install core dependencies and devDependencies (express, sqlite3, typeorm/knex or chosen ORM, nodemailer (stub), vitest, playwright) — path: backend/package.json
 - [ ] T004 [P] Configure linting and formatting (ESLint, Prettier) — path: backend/.eslintrc.cjs, backend/.prettierrc
 - [ ] T005 [P] Add test harness and CI scaffold for running Vitest and Playwright (config files) — path: backend/vitest.config.ts, backend/playwright.config.ts

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T006 Setup SQLite DB helper and connection pool — path: backend/src/db/sqlite.ts
- [ ] T007 Create initial DB schema and migrations for PO entities — path: backend/src/db/migrations/001_init.sql
- [ ] T008 Create repository layer interfaces for PurchaseOrder and LineItem — path: backend/src/repos/purchaseOrderRepo.ts
- [ ] T009 Implement a nodemailer stub and notification interface (configurable) — path: backend/src/notifications/nodemailerStub.ts
- [ ] T010 Configure OpenAPI generation pipeline and place contract at specs/001-purchase-order-management/contracts/openapi.yaml

 - [X] T006 Setup SQLite DB helper and connection pool — path: backend/src/db/sqlite.ts
 - [X] T007 Create initial DB schema and migrations for PO entities — path: backend/src/db/migrations/001_init.sql
 - [X] T008 Create repository layer interfaces for PurchaseOrder and LineItem — path: backend/src/repos/purchaseOrderRepo.ts
 - [X] T009 Implement a nodemailer stub and notification interface (configurable) — path: backend/src/notifications/nodemailerStub.ts
 - [X] T010 Configure OpenAPI generation pipeline and place contract at specs/001-purchase-order-management/contracts/openapi.yaml

## Phase 3: User Story 1 - Create and submit a Purchase Order (Priority: P1)

**Goal**: Buyers can create a PO with line items, save as Draft, and submit to notify supplier.

**Independent Test**: Create → Submit flow returns 201 and PO in Submitted state; supplier notification stub recorded.

- [ ] T011 [P] [US1] Add contract tests for POST /purchase-orders and POST /purchase-orders/{poId}/submit — path: tests/contract/purchaseOrder.contract.test.ts
- [ ] T012 [P] [US1] Add integration smoke test for create→submit flow (SQLite) — path: tests/integration/purchaseOrder.integration.test.ts
- [ ] T013 [US1] Create PurchaseOrder model/entity with fields and validation per data-model.md (`total_amount` computed) — path: backend/src/models/purchaseOrder.ts
- [ ] T014 [US1] Create LineItem model/entity and ensure immutable snapshot fields (product_name, expected_price) — path: backend/src/models/lineItem.ts
- [ ] T015 [US1] Implement PurchaseOrder repository methods: create, update, find, query by branch/supplier/status — path: backend/src/repos/purchaseOrderRepo.ts
- [ ] T016 [US1] Implement PurchaseOrderService: createDraft, updateDraft, submitPO (enforce idempotency) — path: backend/src/services/purchaseOrderService.ts
- [ ] T017 [US1] Implement API endpoints: POST /purchase-orders, GET /purchase-orders, GET /purchase-orders/{poId}, POST /purchase-orders/{poId}/submit — path: backend/src/api/purchaseOrders.ts
- [ ] T018 [US1] Wire supplier notification on Submit using notification interface (stubbed) and record Notification entity — path: backend/src/notifications/notify.ts

## Phase 4: User Story 2 - Approval workflow for high-value POs (Priority: P1)

**Goal**: POs > $10,000 require explicit approver action before Approved state.

**Independent Test**: Submit PO > $10,000 remains Submitted; Approver action transitions to Approved and notification is sent.

- [ ] T019 [P] [US2] Add contract tests for POST /purchase-orders/{poId}/approve — path: tests/contract/purchaseOrderApproval.contract.test.ts
- [ ] T020 [US2] Add integration test for approval workflow (approval recorded, state transitions) — path: tests/integration/purchaseOrder.approval.test.ts
- [ ] T021 [US2] Create Approval model/entity and store approver identity, decision, timestamp, comment — path: backend/src/models/approval.ts
- [ ] T022 [US2] Implement ApprovalService and integrate with PurchaseOrderService to enforce > $10,000 rule — path: backend/src/services/approvalService.ts
- [ ] T023 [US2] Implement API endpoint: POST /purchase-orders/{poId}/approve (approve/reject) with audit info — path: backend/src/api/purchaseOrders.ts
- [ ] T024 [US2] Add guardrail unit tests validating that POs > $10,000 cannot be Approved without an Approver action — path: backend/tests/unit/approval.guard.test.ts

## Phase 5: User Story 3 - Fulfillment and cancellation (Priority: P2)

**Goal**: Record per-line-item fulfillment records; allow marking PO Cancelled; PO becomes Fulfilled when all items fully fulfilled.

**Independent Test**: Record fulfillment entries and verify Approved → Fulfilled when all quantities met; cancelling drafts/submitted sends cancellation notification if supplier was notified.

- [ ] T025 [P] [US3] Create FulfillmentRecord model/entity and repo — path: backend/src/models/fulfillmentRecord.ts
- [ ] T026 [US3] Implement fulfillment recording API: POST /purchase-orders/{poId}/fulfill (per-line-item) — path: backend/src/api/purchaseOrders.ts
- [ ] T027 [US3] Implement service logic to transition Approved → Fulfilled only when all line items fully fulfilled (per spec decision) — path: backend/src/services/purchaseOrderService.ts
- [ ] T028 [US3] Add integration test for partial and full fulfillment flows and cancellation notifications — path: tests/integration/purchaseOrder.fulfillment.test.ts

 - [ ] T025 [P] [US3] Create FulfillmentRecord model/entity and repo — path: backend/src/models/fulfillmentRecord.ts
 - [ ] T026 [US3] Implement fulfillment recording API: POST /purchase-orders/{poId}/fulfill (per-line-item) — path: backend/src/api/purchaseOrders.ts
 - [ ] T027 [US3] Implement service logic to transition Approved → Partially Fulfilled → Fulfilled based on accumulated FulfillmentRecords — path: backend/src/services/purchaseOrderService.ts
 - [ ] T028 [US3] Add integration test for partial and full fulfillment flows and cancellation notifications — path: tests/integration/purchaseOrder.fulfillment.test.ts
 - [ ] T029 [US3] Implement GET /purchase-orders/{poId}/fulfillment-history to return per-line-item fulfillment records — path: backend/src/api/purchaseOrders.ts

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T029 [P] Documentation: Update specs/001-purchase-order-management/research.md and data-model.md with any final decisions and examples — path: specs/001-purchase-order-management/research.md
- [ ] T030 [P] Add API OpenAPI documentation generation step wired to runtime (ensure specs/001-purchase-order-management/contracts/openapi.yaml is authoritative) — path: backend/src/openapi/generate.ts
- [ ] T031 [P] Add CI integration to run contract tests, integration smoke, and quickstart validation — path: .github/workflows/po-feature.yml

 - [ ] T030 [P] Documentation: Update specs/001-purchase-order-management/research.md and data-model.md with partial fulfillment decisions — path: specs/001-purchase-order-management/research.md
 - [ ] T031 [P] Add API OpenAPI documentation generation step wired to runtime (ensure specs/001-purchase-order-management/contracts/openapi.yaml is authoritative) — path: backend/src/openapi/generate.ts
 - [ ] T032 [P] Add CI integration to run contract tests, integration smoke, and quickstart validation — path: .github/workflows/po-feature.yml

---

## Dependencies & Execution Order

- Setup (Phase 1) must complete before Foundational (Phase 2).
- Foundational (Phase 2) blocks User Stories (Phase 3+).
- User Stories (Phase 3+) can be implemented in parallel once Foundational is ready; within each story: tests (contract/integration) → models → repos → services → endpoints.

## Parallel Opportunities

- Tasks marked `[P]` can be worked on concurrently (installing deps, lint config, test harness, contract tests, model file creation when non-conflicting).

## Suggested MVP Scope

- MVP = Phase 1 + Phase 2 + Phase 3 (User Story 1). Deliver create → submit flow with contract and integration tests.
