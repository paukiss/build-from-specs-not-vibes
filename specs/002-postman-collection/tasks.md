# Tasks: Postman API Testing Collection

**Input**: Design documents from `/specs/002-postman-collection/`

**Prerequisites**: plan.md (tech stack, project structure), spec.md (user stories P1, P2, P3), research.md (design decisions), data-model.md (collection structure), quickstart.md (validation scenarios)

**Organization**: Tasks grouped by user story (P1, P2, P3) to enable independent implementation and testing. Collection includes 20-25 requests, 8+ pre-request scripts, 60-80 test assertions.

**Note**: Postman collection is JSON artifact; tasks focus on defining requests, scripts, and assertions rather than code implementation.

---

## Phase 1: Setup (Collection Initialization)

**Purpose**: Create project structure and foundational collection files

- [ ] T001 Create postman/ directory structure: `postman/`, `postman/newman/`, documentation files
- [ ] T002 Create postman_collection.json skeleton with collection metadata (name: "Purchase Order Management API", schema v2.1)
- [ ] T003 [P] Create postman_environment.json with 6-8 shared variables: base_url, branch_id, supplier_id, buyer_id, approver_id, product_id, po_id, line_item_id
- [ ] T004 Create README.md in postman/ directory with setup instructions, import steps, and usage guide (reference quickstart.md scenarios)
- [ ] T005 Create newman/run-collection.sh script for CI/CD execution with Newman CLI

---

## Phase 2: Foundational (Cross-cutting Requests & Scripts)

**Purpose**: Core infrastructure shared by all user stories

**⚠️ CRITICAL**: No user story work begins until Phase 2 complete

- [ ] T006 Create Setup folder in collection with 1-2 requests:
  - T006a: "Verify Backend Running" request (GET /health or GET /api/v1/purchase-orders with limit=1) to check API is accessible
  - Validation: HTTP 200 or connection success message
- [ ] T007 [P] Create pre-request script templates in collection (scripts directory) for:
  - T007a: UUID generation script (pm.variables.set("{{variable}}", pm.variables.replaceIn('{{$randomUUID}}')))
  - T007b: Timestamp generation script (pm.variables.set("timestamp", new Date().toISOString()))
  - T007c: Response value extraction script (extract po_id from previous response body)
  - T007d: Idempotency key generation (generate unique UUID for each request)
- [ ] T008 Create common test assertion patterns in collection (tests directory):
  - T008a: Status code validation (pm.test("Status is 201", () => pm.response.code === 201))
  - T008b: Required field validation (pm.expect(pm.response.json()).to.have.property('id'))
  - T008c: Schema validation pattern (tv4.validateMultiple for response structure)
  - T008d: Business logic validation (pm.expect(pm.response.json().status).to.equal('draft'))
- [ ] T009 [P] Create error handling response tests (global):
  - Test for 400 Bad Request with error message
  - Test for 404 Not Found with resource identifier
  - Test for 409 Conflict with reason

**Checkpoint**: Foundation ready. User story requests can now be created with consistent structure.

---

## Phase 3: User Story 1 - Import and Run Tests (Priority: P1) 🎯 MVP

**Goal**: Enable QA engineers to import collection and run all tests in Postman UI with passing results.

**Independent Test**: Collection imports without errors → Run Collection executes all US1 requests → All tests pass (HTTP 200/201, response schemas valid, data structures correct).

### Pre-request Scripts for US1

- [ ] T010 [P] [US1] Create pre-request script for "Create Draft PO" request in postman_collection.json:
  - Generate po_id (UUID): `pm.variables.set("po_id", pm.utils.uuid())`
  - Generate timestamp
  - Set request body with branch_id, buyer_id, supplier_id, currency (from environment)
  - File location: request body pre-request tab

- [ ] T011 [P] [US1] Create pre-request script for "Add Line Item" request:
  - Generate line_item_id (UUID)
  - Generate product_id (UUID or from environment)
  - Calculate expected_price (e.g., 299.99)
  - Set quantity (e.g., 5)
  - Inject po_id from previous response (extracted in T012)

- [ ] T012 [US1] Create test assertions for "Create Draft PO" request:
  - Validate HTTP status 201
  - Validate response has properties: id, po_number, branch_id, buyer_id, supplier_id, status
  - Validate status === "draft"
  - Validate total_amount === 0
  - Extract po_id from response for next request: `pm.variables.set("po_id", pm.response.json().id)`
  - Test count: 6 assertions

### Implementation for US1

- [ ] T013 [P] [US1] Create "User Story 1 - Create & Submit PO" folder in postman_collection.json with 4 requests:
  - Request 1: Create Draft PO (POST /api/v1/purchase-orders)
  - Request 2: Add Line Item (POST /api/v1/purchase-orders/{{po_id}}/line-items)
  - Request 3: Get PO (GET /api/v1/purchase-orders/{{po_id}})
  - Request 4: Submit PO (POST /api/v1/purchase-orders/{{po_id}}/submit)

- [ ] T014 [P] [US1] Create request: "Add Line Item" in US1 folder:
  - Method: POST
  - URL: `{{base_url}}/api/v1/purchase-orders/{{po_id}}/line-items`
  - Headers: Content-Type: application/json
  - Body: { product_name, quantity, expected_price, product_id (optional) }
  - Pre-request script: Generate line item ID and data (T011)
  - Tests: HTTP 201, response has id, po_id, product_name, quantity, line_total (T015)
  - File: postman_collection.json, folder: "User Story 1 - Create & Submit PO"

- [ ] T015 [P] [US1] Create test assertions for "Add Line Item" request:
  - Validate HTTP status 201
  - Validate response has properties: id, po_id, product_name, quantity, expected_price, line_total
  - Validate line_total === quantity × expected_price
  - Extract line_item_id: `pm.variables.set("line_item_id", pm.response.json().id)`
  - Test count: 5 assertions

- [ ] T016 [P] [US1] Create test assertions for "Get PO" request:
  - Validate HTTP status 200
  - Validate response has properties: id, po_number, status, total_amount, line_items (array)
  - Validate total_amount > 0 (sum of line items)
  - Validate line_items.length > 0
  - Validate status still === "draft"
  - Test count: 5 assertions

- [ ] T017 [US1] Create request: "Submit PO" in US1 folder:
  - Method: POST
  - URL: `{{base_url}}/api/v1/purchase-orders/{{po_id}}/submit`
  - Headers: Content-Type: application/json
  - Body: { idempotency_key (generated UUID) }
  - Pre-request script: Generate idempotency_key (T018)
  - Tests: HTTP 200, status transitions to submitted, notification created (T019)
  - File: postman_collection.json, folder: "User Story 1 - Create & Submit PO"

- [ ] T018 [US1] Create pre-request script for "Submit PO" request:
  - Generate idempotency_key (UUID): `pm.variables.set("idempotency_key", pm.utils.uuid())`
  - Inject po_id from environment variable set by previous request
  - Generate timestamp for audit trail

- [ ] T019 [US1] Create test assertions for "Submit PO" request:
  - Validate HTTP status 200
  - Validate response status === "submitted"
  - Validate approval field exists (null if total <= $10k, object if > $10k)
  - Validate status_history array includes transition record (from_status: draft, to_status: submitted)
  - Validate updated_at timestamp is recent
  - Test count: 5 assertions

**Checkpoint**: User Story 1 complete. Requests defined, scripts created, assertions validated. Run Scenario 1 from quickstart.md. All tests pass.

---

## Phase 4: User Story 2 - Test All User Stories (Priority: P1)

**Goal**: Enable developers to validate all three backend user stories via organized test folders.

**Independent Test**: US2 folder contains 3 requests (submit high-value PO, approve, verify) → executing in order → PO transitions Draft → Submitted → Approved with approval object created and updated.

### Pre-request Scripts for US2

- [ ] T020 [P] [US2] Create pre-request script for "Submit High-Value PO" request:
  - Generate po_id (UUID)
  - Set quantity and expected_price to ensure total > $10,000 (e.g., quantity=2, price=5500 = $11,000)
  - Generate idempotency_key
  - Pre-populate branch_id, buyer_id, supplier_id from environment

- [ ] T021 [P] [US2] Create pre-request script for "Add High-Value Line Item" request:
  - Generate line_item_id (UUID)
  - Set product_name, quantity, expected_price to exceed $10,000 threshold

- [ ] T022 [P] [US2] Create pre-request script for "Approve PO" request:
  - Extract po_id from previous response
  - Set approver_id from environment (manager-001)
  - Generate approval comment (optional)

### Implementation for US2

- [ ] T023 [US2] Create "User Story 2 - Approval Workflow" folder in postman_collection.json with 3 requests:
  - Request 1: Create Draft High-Value PO (POST /api/v1/purchase-orders)
  - Request 2: Add High-Value Line Item (POST /api/v1/purchase-orders/{{po_id}}/line-items)
  - Request 3: Submit High-Value PO (POST /api/v1/purchase-orders/{{po_id}}/submit, total > $10,000)
  - Request 4: Approve PO (POST /api/v1/purchase-orders/{{po_id}}/approve)
  - Request 5: Verify Approved Status (GET /api/v1/purchase-orders/{{po_id}})
  - File: postman_collection.json, folder: "User Story 2 - Approval Workflow"

- [ ] T024 [P] [US2] Create request: "Submit High-Value PO" in US2 folder:
  - Method: POST
  - URL: `{{base_url}}/api/v1/purchase-orders/{{po_id}}/submit`
  - Pre-request script: Generate idempotency_key, ensure total > $10k (T020)
  - Tests: HTTP 200, status = submitted, approval created with decision = pending (T025)

- [ ] T025 [P] [US2] Create test assertions for "Submit High-Value PO" request:
  - Validate HTTP status 200
  - Validate response status === "submitted"
  - Validate response.approval exists and decision === "pending"
  - Validate response.approval.approver_id === "manager-001"
  - Validate total_amount > 10000
  - Extract po_id for next request
  - Test count: 6 assertions

- [ ] T026 [P] [US2] Create request: "Approve PO" in US2 folder:
  - Method: POST
  - URL: `{{base_url}}/api/v1/purchase-orders/{{po_id}}/approve`
  - Headers: Content-Type: application/json
  - Body: { comment: "Approved for procurement" }
  - Pre-request script: Inject po_id, approver_id (T022)
  - Tests: HTTP 200, approval.decision = approved (T027)
  - File: postman_collection.json, folder: "User Story 2 - Approval Workflow"

- [ ] T027 [P] [US2] Create test assertions for "Approve PO" request:
  - Validate HTTP status 200
  - Validate response.approval.decision === "approved"
  - Validate response.status === "approved"
  - Validate response.approval.timestamp is recent
  - Validate status_history includes transition from submitted to approved
  - Test count: 5 assertions

- [ ] T028 [US2] Create test assertions for "Verify Approved Status" request:
  - Validate HTTP status 200
  - Validate response.status === "approved"
  - Validate response.approval.decision === "approved"
  - Validate response.approval exists with approver_id
  - Test count: 4 assertions

**Checkpoint**: User Story 2 complete. High-value approval workflow tested independently. Run Scenario 2 from quickstart.md.

---

## Phase 5: User Story 3 - Pre-configured Test Data (Priority: P2)

**Goal**: Enable testers to validate fulfillment tracking and cancellation with automatic data setup.

**Independent Test**: US3 folder contains 4 requests (record partial fulfillment, complete fulfillment, verify status, cancel) → executing in order → PO transitions Approved → PartiallyFulfilled → Fulfilled → Cancelled with proper status_history and notifications.

### Pre-request Scripts for US3

- [ ] T029 [P] [US3] Create pre-request script for "Record Fulfillment (50%)" request:
  - Extract line_item_id from previous response
  - Set quantity_fulfilled = 50% of line item quantity
  - Generate fulfillment record data (reference_document, timestamp)

- [ ] T030 [P] [US3] Create pre-request script for "Record Fulfillment (100%)" request:
  - Extract line_item_id from previous response
  - Set quantity_fulfilled = remaining 50% (cumulative 100%)
  - Generate reference_document and timestamp

- [ ] T031 [P] [US3] Create pre-request script for "Cancel PO" request:
  - Extract po_id from environment
  - Generate cancellation reason

### Implementation for US3

- [ ] T032 [US3] Create "User Story 3 - Fulfillment & Cancel" folder in postman_collection.json with 4 requests:
  - Request 1: Record Partial Fulfillment (POST /api/v1/purchase-orders/{{po_id}}/fulfill)
  - Request 2: Record Complete Fulfillment (POST /api/v1/purchase-orders/{{po_id}}/fulfill)
  - Request 3: Verify Fulfilled Status (GET /api/v1/purchase-orders/{{po_id}})
  - Request 4: Cancel PO (POST /api/v1/purchase-orders/{{po_id}}/cancel)
  - File: postman_collection.json, folder: "User Story 3 - Fulfillment & Cancel"

- [ ] T033 [P] [US3] Create request: "Record Partial Fulfillment (50%)" in US3 folder:
  - Method: POST
  - URL: `{{base_url}}/api/v1/purchase-orders/{{po_id}}/fulfill`
  - Body: { line_item_id, quantity_fulfilled (50%), reference_document, notes }
  - Pre-request script: Set quantity_fulfilled to 50% (T029)
  - Tests: HTTP 200, status = partially_fulfilled (T034)

- [ ] T034 [P] [US3] Create test assertions for "Record Partial Fulfillment" request:
  - Validate HTTP status 200
  - Validate response.status === "partially_fulfilled"
  - Validate response.line_items[0].fulfillment_records length > 0
  - Validate cumulative fulfilled < total quantity
  - Test count: 4 assertions

- [ ] T035 [P] [US3] Create request: "Record Complete Fulfillment (100%)" in US3 folder:
  - Method: POST
  - URL: `{{base_url}}/api/v1/purchase-orders/{{po_id}}/fulfill`
  - Body: { line_item_id, quantity_fulfilled (remaining 50%), reference_document }
  - Pre-request script: Set quantity_fulfilled to 50% more (T030)
  - Tests: HTTP 200, status = fulfilled (T036)

- [ ] T036 [P] [US3] Create test assertions for "Record Complete Fulfillment" request:
  - Validate HTTP status 200
  - Validate response.status === "fulfilled"
  - Validate cumulative fulfilled === total quantity for all line items
  - Validate response.line_items.every(li => sumFulfilled(li) === li.quantity)
  - Test count: 4 assertions

- [ ] T037 [P] [US3] Create request: "Cancel PO" in US3 folder:
  - Method: POST
  - URL: `{{base_url}}/api/v1/purchase-orders/{{po_id}}/cancel`
  - Body: { reason: "Order no longer needed" }
  - Pre-request script: Inject po_id, generate reason (T031)
  - Tests: HTTP 200, status = cancelled (T038)

- [ ] T038 [P] [US3] Create test assertions for "Cancel PO" request:
  - Validate HTTP status 200
  - Validate response.status === "cancelled"
  - Validate status_history includes transition to cancelled
  - Validate cancelled_at or timestamp is present
  - Test count: 4 assertions

**Checkpoint**: User Story 3 complete. Fulfillment and cancellation workflows tested independently. Run Scenario 3 from quickstart.md.

---

## Phase 6: Validation (Edge Cases & Error Handling)

**Purpose**: Test API error handling and edge case scenarios

- [ ] T039 [P] Create "Validation" folder in postman_collection.json with 4-5 edge case requests:
  - T039a: "Invalid Input (negative quantity)" - POST /line-items with quantity = -1 → expect 400
  - T039b: "Invalid Input (missing required field)" - POST /purchase-orders without buyer_id → expect 400
  - T039c: "Not Found (non-existent PO)" - GET /purchase-orders/invalid-uuid → expect 404
  - T039d: "Conflict (duplicate submission)" - POST /submit with same idempotency_key twice → expect 409 or 200 (cached)
  - T039e: "Unauthorized (non-approver approval)" - POST /approve as non-approver → expect 403 (optional if auth implemented)
  - File: postman_collection.json, folder: "Validation"

- [ ] T040 [P] Create test assertions for edge case requests:
  - T040a: Validate 400 status, error message contains "quantity must be positive"
  - T040b: Validate 400 status, error message indicates missing field
  - T040c: Validate 404 status, error message contains "not found"
  - T040d: Validate 409 status or cached 200 response on duplicate
  - T040e: Validate 403 status if auth is enabled

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and collection optimization

- [ ] T041 [P] Add collection-level documentation in postman_collection.json:
  - Description explaining purpose (testing PO API)
  - Setup instructions (import environment, select environment from dropdown)
  - How to run (click Run Collection, select environment)
  - Test structure (per-request tests, schema validation)
  - Expected outcomes (all tests pass)
  - File: postman_collection.json (description field)

- [ ] T042 [P] Create comprehensive README.md in postman/ directory:
  - Quick start section (3 steps: import, select env, run)
  - Detailed setup (Postman app installation, collection import steps)
  - Environment variables explanation (base_url, branch_id, etc.)
  - Request organization (by user story folder)
  - Running tests (UI method, CLI method)
  - Expected results (all 20+ tests pass)
  - Troubleshooting (connection errors, undefined variables, 409 conflicts)
  - File: postman/README.md

- [ ] T043 Validate collection import in Postman (manual or via Postman CLI):
  - Import postman_collection.json
  - Verify no parse errors
  - Verify all folders appear in left sidebar
  - Verify all requests are present
  - File: postman_collection.json

- [ ] T044 Validate environment import:
  - Import postman_environment.json
  - Verify environment appears in "Environments" tab
  - Verify all 8 variables are present with correct values
  - Select environment and verify it's active (dropdown shows environment name)
  - File: postman_environment.json

- [ ] T045 Test full collection execution in Postman UI:
  - Click collection "Purchase Order Management API"
  - Click "Run" (three dots) → "Run collection"
  - Select environment from dropdown
  - Click "Run Purchase Order Management API"
  - Monitor test results (should see 20-25 tests pass)
  - Verify collection runner shows summary (e.g., "20 passed, 0 failed")

- [ ] T046 Test Newman CLI execution:
  - Run: `cd postman && ./newman/run-collection.sh`
  - Verify output shows collection execution progress
  - Verify exit code is 0 (success)
  - Verify JSON report generated (if configured)
  - File: postman/newman/run-collection.sh

- [ ] T047 Validate against quickstart.md scenarios:
  - Run Scenario 1 (Create & Submit) - verify all 4 requests execute
  - Run Scenario 2 (Approval) - verify 3-5 requests execute
  - Run Scenario 3 (Fulfillment) - verify 4 requests execute
  - Verify each scenario independently validates the respective user story
  - Cross-reference: postman_collection.json vs quickstart.md step-by-step

- [ ] T048 Final collection review:
  - Verify 20-25 requests defined across 6 folders
  - Verify 8+ pre-request scripts (UUID, timestamp, response parsing, idempotency)
  - Verify 60-80 test assertions (status, schema, required fields, business logic)
  - Verify variables used consistently ({{base_url}}, {{po_id}}, etc.)
  - Verify no hardcoded values in requests (all dynamic via variables or scripts)
  - File: postman_collection.json

- [ ] T049 [P] Documentation compliance check:
  - Verify postman/README.md covers all setup steps
  - Verify postman/README.md references quickstart.md
  - Verify postman/newman/run-collection.sh is executable
  - Verify postman_environment.json contains all required variables
  - Verify collection description is accurate and helpful

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1
- **Phase 3 (US1)**: Depends on Phase 2 ✅ BLOCKS US2/US3
- **Phase 4 (US2)**: Depends on Phase 2 + Phase 3 (can reference US1 patterns but independent)
- **Phase 5 (US3)**: Depends on Phase 2 + Phase 3 (can reference US1 patterns but independent)
- **Phase 6 (Validation)**: Depends on Phase 2 (edge cases test API independently)
- **Phase 7 (Polish)**: Depends on Phase 3-6 (final assembly and validation)

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - MVP
- **User Story 2 (P1)**: Can start after Phase 2; independent from US1 (different scenario: high-value POs)
- **User Story 3 (P2)**: Can start after Phase 2; independent from US1/US2 (different workflow: fulfillment)

### Within Each User Story

- Pre-request scripts → Request definition → Test assertions → Validation

### Parallel Opportunities

- Phase 1: T003, T004, T005 can run in parallel
- Phase 2: T007, T008, T009 can run in parallel
- Phase 3: T010, T011, T014, T015, T016 can run in parallel (different requests)
- Phase 4: T020, T021, T022 can run in parallel (scripts for different requests)
- Phase 5: T029, T030, T031 can run in parallel (scripts for different requests)
- Phase 6: T039, T040 can run in parallel (different edge cases)
- Phase 7: T041, T042, T043, T044, T049 can run in parallel (docs and validation)

---

## Parallel Example: User Story 1

```bash
# Parallel pre-request script creation:
Task: "Create pre-request script for Create Draft PO (T010)"
Task: "Create pre-request script for Add Line Item (T011)"

# Parallel test assertion creation:
Task: "Create test assertions for Create Draft PO (T012)"
Task: "Create test assertions for Add Line Item (T015)"
Task: "Create test assertions for Get PO (T016)"

# Then sequentially add request definitions (T013, T014, T017, T018, T019)
# as scripts and assertions are ready
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Target**: 3-4 hours

1. Complete Phase 1: Setup (30 min)
2. Complete Phase 2: Foundational (1 hour)
3. Complete Phase 3: User Story 1 (1.5-2 hours)
   - Define 4 requests
   - Create 3 pre-request scripts
   - Create 16+ test assertions
4. **Validate**: Run Scenario 1 from quickstart.md
   - Import collection and environment
   - Run all 4 requests in sequence
   - Verify all tests pass (green checkmarks)

At this point, system provides MVP value: QA engineers can test PO creation/submission via Postman.

### Incremental Delivery

After MVP (US1) validated:

1. **Phase 4 (US2)** - 1.5-2 hours
   - High-value approval workflow testing
   - Validates approval gate logic
   - Deploy/demo: Approval workflow now testable

2. **Phase 5 (US3)** - 1.5-2 hours
   - Fulfillment and cancellation testing
   - Validates fulfillment state transitions
   - Deploy/demo: Complete PO lifecycle testable

3. **Phase 6 (Validation)** - 1 hour
   - Edge cases and error scenarios
   - Validates error handling

4. **Phase 7 (Polish)** - 1-1.5 hours
   - Documentation, final review, CI/CD setup

Total: 8-10 hours for complete collection (vs. 12+ hours sequential)

### Team Execution

```
Day 1 (3 hours): Phase 1 + Phase 2 (Setup + Foundational)
Day 2 (2 hours): Phase 3 (US1) + Validate
Day 2 (2 hours): Phase 4 (US2) + Phase 5 (US3) in parallel
Day 3 (1-2 hours): Phase 6 (Validation) + Phase 7 (Polish)
```

---

## Success Criteria Checklist

- [ ] Phase 1: postman/ directory, collection skeleton, environment file, README created
- [ ] Phase 2: Setup request, pre-request script templates, test assertions, error handling setup
- [ ] Phase 3 (US1): 4 requests + 3 scripts + 16 assertions, Scenario 1 passes, collection runnable
- [ ] Phase 4 (US2): 5 requests + 3 scripts + 15 assertions, Scenario 2 passes, approval workflow tested
- [ ] Phase 5 (US3): 4 requests + 3 scripts + 12 assertions, Scenario 3 passes, fulfillment tracked
- [ ] Phase 6: 4-5 edge case requests + error validation tests
- [ ] Phase 7: Collection imports cleanly, 20-25 requests + 60-80 assertions, README complete, Newman CLI works
- [ ] All tasks follow checklist format (checkbox, ID, [P]/[Story] labels, file paths)

---

## Glossary

- **Collection**: Postman JSON file containing all requests, folders, scripts, and tests
- **Environment**: Postman JSON file with shared variables (base_url, IDs, etc.)
- **Request**: HTTP request with method, URL, headers, body, pre-request script, tests
- **Pre-request Script**: JavaScript code (Postman) that runs before request, sets up test data
- **Test Assertion**: JavaScript code (Postman) that validates response after request completes
- **Folder**: Organizational group of requests (by user story, setup, validation, etc.)
- **Variable**: Reusable value (environment-level or request-level) injected via {{variable}} syntax
- **Newman**: Postman CLI tool for running collections programmatically
- **Schema Validation**: Using tv4 to validate response JSON against expected structure
- **Idempotency Key**: UUID sent with request to prevent duplicate processing on retries
