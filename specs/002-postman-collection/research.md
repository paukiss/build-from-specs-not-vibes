# Research: Postman Collection Design Decisions

**Phase**: 0 (Research) | **Date**: 2026-09-09 | **Status**: Complete

## Design Decisions Resolved

### 1. Collection Organization by User Story

**Decision**: Organize requests in folders by user story (US1, US2, US3) with clear flow (create → submit → approve/fulfill).

**Rationale**: User stories from spec.md are independently testable. Each folder contains a complete flow that can be run standalone without prerequisites from other stories.

**Alternatives considered**:
- Flat list of all requests: Rejected—hard to follow, no visual grouping by feature.
- Organization by HTTP method (GET, POST, PATCH): Rejected—mixes concerns, hard to test business flows.

**Implementation**: Top-level folders: Setup, User Story 1, User Story 2, User Story 3, Validation, Cleanup.

---

### 2. Variables Strategy (Environment + Request-level)

**Decision**: Environment file contains shared, reusable variables (base_url, branch_id, supplier_id, buyer_id). Request-level variables store request-specific data (po_id from response, line_item_id from previous request).

**Rationale**: Shared variables reduce duplication and enable easy switching between environments (dev, staging, prod). Request-level variables allow data chaining across requests.

**Alternatives considered**:
- All data hardcoded in requests: Rejected—not reusable, breaks on data changes.
- Only global variables: Rejected—doesn't support dynamic response parsing.

**Implementation**: Postman environment file with 6-8 core variables. Pre-request scripts extract response values into request-level variables.

---

### 3. Pre-request Scripts for Auto-generated Test Data

**Decision**: Use Postman pre-request scripts to generate UUIDs, timestamps, and calculate totals. Scripts automatically inject data into request bodies.

**Rationale**: Reduces manual test data setup; ensures unique IDs for each test run; prevents collisions and cached responses.

**Alternatives considered**:
- Manual data entry: Rejected—time-consuming, error-prone.
- Server-side fixtures: Rejected—out of scope; collection must be self-contained.

**Implementation**: Pre-request scripts use `pm.variables.set()` and Postman built-ins (`$randomUUID`, `$timestamp`).

---

### 4. Test Assertions per Request

**Decision**: Each request includes 3-5 test assertions validating: HTTP status, response schema, required fields, data types, business logic.

**Rationale**: Validates API contract (openapi.yaml), catches regressions, proves business logic works.

**Alternatives considered**:
- No tests: Rejected—collection wouldn't validate anything.
- Minimal tests (status code only): Rejected—misses schema/logic validation.

**Implementation**: Postman Tests tab with JavaScript assertions using `pm.test()` and `pm.expect()`.

---

### 5. Execution Modes: Postman UI + Newman CLI

**Decision**: Collection designed to run in both Postman UI (manual) and Newman CLI (automated/CI).

**Rationale**: Postman UI for exploratory testing; Newman for CI/CD pipelines and automated regression testing.

**Alternatives considered**:
- Postman UI only: Rejected—no CI/CD integration.
- Newman only: Rejected—loses interactive debugging in Postman UI.

**Implementation**: Collection uses Postman-standard features (no UI-specific extensions). Newman runner script at `postman/newman/run-collection.sh`.

---

### 6. Idempotency Key Generation

**Decision**: Pre-request scripts auto-generate UUID for idempotency_key on CREATE/SUBMIT requests. Collection includes tests to verify duplicate submissions are rejected or return cached response.

**Rationale**: Tests idempotency requirement (FR-013 from spec). Ensures API correctly handles retries.

**Alternatives considered**:
- Manual idempotency keys: Rejected—defeats the purpose of testing idempotency.
- No idempotency testing: Rejected—would miss this critical requirement.

**Implementation**: Pre-request script generates UUID; test verifies 409 or 200 (cached) on duplicate.

---

## Technology Stack Decisions

- **Postman Version**: v10+ (uses modern collection format 2.1, supports all features)
- **Newman Version**: Latest (for CI/CD compatibility)
- **JSON Schema Validation**: Built-in Postman schema validation (tv4)
- **Environment Variables**: Postman environment JSON format

All decisions align with project constitution (API-First, Test-First, Integration-First).
