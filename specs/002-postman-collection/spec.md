# Feature Specification: Postman API Testing Collection

**Feature Branch**: `002-postman-collection`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "I want to create a postman collection to test all backend apis and features"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import and Run Tests (Priority: P1)

As a QA Engineer or Backend Developer, I want to import a Postman collection and run all API tests in one click so that I can quickly validate the backend is working correctly without writing code.

**Why this priority**: Essential for rapid testing and validation of all endpoints.

**Independent Test**: Import the collection → run collection runner → all tests execute with passing results (HTTP 200/201 responses, valid JSON schemas, expected data).

**Acceptance Scenarios**:

1. **Given** the Postman collection is imported into Postman, **When** I click "Run Collection", **Then** all requests execute in sequence with correct HTTP status codes and response bodies match expected schemas.
2. **Given** a PO creation request, **When** I send POST /api/v1/purchase-orders, **Then** response contains valid PO object with id, po_number, status=draft, and all required fields.

---

### User Story 2 - Test All User Stories (Priority: P1)

As a Developer, I want test requests for all three user stories (Create PO, Approval Workflow, Fulfillment) organized in folders so that I can validate each feature independently without manual API calls.

**Why this priority**: Ensures all backend features are exercisable and testable via the collection.

**Independent Test**: Each folder (US1, US2, US3) contains requests that execute the full user story flow (create → submit → approve/fulfill). Running each folder's requests in sequence completes the story workflow.

**Acceptance Scenarios**:

1. **Given** folder "User Story 1 - Create & Submit PO" with 4 requests, **When** executed in order (Create → Add Items → Get → Submit), **Then** PO successfully transitions from Draft to Submitted status.
2. **Given** folder "User Story 2 - Approval Workflow" with 3 requests, **When** executed with PO total > $10,000, **Then** Approval is created (pending), Approver approves, and PO transitions to Approved.
3. **Given** folder "User Story 3 - Fulfillment & Cancel", **When** requests are executed, **Then** fulfillment records are created and status transitions to PartiallyFulfilled/Fulfilled; cancellation sends notification.

---

### User Story 3 - Pre-configured Test Data (Priority: P2)

As a Tester, I want Postman variables and pre-request scripts that automatically set up test data (branch, supplier, buyer IDs) so that I don't have to manually copy-paste IDs between requests.

**Why this priority**: Reduces manual setup overhead and improves test reliability.

**Independent Test**: Collection has variables (branch_id, supplier_id, buyer_id, po_id) pre-populated. Pre-request scripts on Create PO automatically generate UUIDs for idempotency. Tests use {{variable}} syntax and pass.

**Acceptance Scenarios**:

1. **Given** Postman collection with environment variables, **When** I set branch_id, supplier_id, buyer_id in the environment, **Then** all requests automatically use these values (visible in request URLs and bodies).
2. **Given** a Create PO request, **When** I send it multiple times without changing idempotency_key, **Then** subsequent requests return 409 or cached response (idempotency verified).

---

### Edge Cases

- What if the backend is not running? Collection should document setup steps (run `npm run dev`) and provide connection test request.
- How to handle authentication? Spec assumes no auth for v1; if needed, collection can be updated with Bearer token support later.
- What about pagination? List endpoints support limit/offset; collection includes examples with different pagination parameters.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Collection MUST contain folders organized by user story (US1, US2, US3) and cross-cutting concerns (Setup, Validation, Cleanup).
- **FR-002**: Collection MUST include all 9 API endpoints from openapi.yaml (create, get, list, update, submit, approve, reject, cancel, fulfill).
- **FR-003**: Collection MUST include pre-request scripts and tests for each request:
  - Pre-request: Set up request data (generate IDs, timestamps, calculate totals).
  - Tests: Validate HTTP status codes, response schema, data integrity.
- **FR-004**: Collection MUST define Postman variables for reusable values: branch_id, supplier_id, buyer_id, po_id, approver_id, product_id, base_url.
- **FR-005**: Collection MUST include an environment file (JSON) with default values for base_url, branch_id, supplier_id, buyer_id.
- **FR-006**: Collection MUST include collection-level documentation explaining setup, how to run, and interpretation of results.
- **FR-007**: Collection MUST support both manual execution (in Postman UI) and automated execution (via Newman CLI).
- **FR-008**: Collection MUST validate response schemas match openapi.yaml contracts (using JSON schema validation in Postman Tests tab).
- **FR-009**: Collection MUST include tests for edge cases (invalid input, 409 conflicts, 404 not found, 403 unauthorized).
- **FR-010**: Collection MUST include test data cleanup requests (optional post-test cleanup endpoints, e.g., DELETE to remove test POs).

## Key Entities *(include if feature involves data)*

- **Postman Collection**: JSON artifact (`postman_collection.json`) containing all requests, folders, variables, pre-request scripts, and tests.
- **Postman Environment**: JSON artifact (`postman_environment.json`) containing environment variables (base_url, branch_id, supplier_id, etc.).
- **Request Folder**: Organized groups (User Story 1, User Story 2, User Story 3, Setup, Validation, Cleanup).
- **Request**: HTTP request with method, URL, headers, body, pre-request script, and test assertions.
- **Test Assertions**: JavaScript code validating response status, schema, and data values.
- **Pre-request Script**: JavaScript code generating test data (IDs, timestamps, payloads).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Collection is importable into Postman (no parse errors) and loads successfully in Postman UI.
- **SC-002**: Running the full collection (all folders) completes without errors; 95%+ of tests pass on first run (assuming backend is running).
- **SC-003**: Each user story folder (US1, US2, US3) can be run independently and exercises the complete story flow (create → submit → approve/fulfill).
- **SC-004**: All 9 API endpoints have at least one happy-path request and one edge-case request (validation error, conflict, not found).
- **SC-005**: Collection variables are defined and documented; requests use {{variable}} syntax consistently.
- **SC-006**: Newman CLI can execute the collection with `newman run postman_collection.json -e postman_environment.json` without errors.
- **SC-007**: Response validations in tests catch at least 80% of common API errors (missing fields, wrong status codes, invalid types).
- **SC-008**: Collection documentation (README + in-collection docs) is clear enough that a new developer can run the collection in <5 minutes.

## Assumptions

- Backend server is running locally on http://localhost:3000 (configurable via environment variable).
- Test data (branches, suppliers, users) are pre-seeded or created on-the-fly by the collection.
- No API authentication required for v1 (Bearer tokens can be added later if needed).
- Postman desktop app (v10+) or Postman web app is available.
- Newman CLI (Postman's CLI runner) will be used for CI/CD integration (script or GitHub Actions).
- PO IDs are UUIDs; collection generates them via `{{$randomUUID}}` built-in variable.
- Idempotency is managed by client-provided keys; collection includes examples.
