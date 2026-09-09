# Implementation Plan: Postman API Testing Collection

**Branch**: `002-postman-collection` | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-postman-collection/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Create a comprehensive Postman collection for testing all Purchase Order Management API endpoints and user story flows. Collection includes 40+ requests organized by user story (US1, US2, US3), pre-request scripts for data setup, and test assertions for validation. Deliverables: `postman_collection.json` and `postman_environment.json` for both Postman UI and Newman CLI execution.

## Technical Context

**Language/Version**: JSON (Postman collection format v2.1)

**Primary Dependencies**: Postman app (v10+) or Newman CLI (npm package)

**Storage**: Two JSON files (postman_collection.json, postman_environment.json)

**Testing**: Postman test assertions (JavaScript), response schema validation, HTTP status codes

**Target Platform**: Cross-platform (Windows/macOS/Linux) via Postman desktop, web app, or Newman CLI

**Project Type**: Testing artifact (collection of API test requests and assertions)

**Performance Goals**: All tests complete within 5 minutes; each request responds within 2 seconds

**Constraints**: No external dependencies (Postman built-ins only); no database modifications (read/query operations only for validation)

**Scale/Scope**: 40-50 API requests, 3 user story folders, 8+ test suites, 15+ pre-request scripts, 200+ test assertions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Project Constitution Alignment ✓

**Test-First (TDD + Contract Tests)** ✓
- Postman collection IS the test suite; all endpoints exercised before manual testing
- Pre-request scripts set up test contracts (valid JSON schemas, required fields)
- Tests validate response schemas match OpenAPI contracts

**Integration-First Testing** ✓
- Collection tests against real backend API (http://localhost:3000)
- No mocks; real database queries via API
- Tests verify end-to-end flows (create → submit → approve/fulfill)

**API-First (OpenAPI)** ✓
- Collection mirrors OpenAPI spec endpoints exactly
- Request/response structures match openapi.yaml contracts
- Tests validate schemas per OpenAPI definitions

**Simplicity Over Abstraction** ✓
- Postman native features (variables, scripts, tests)
- No custom frameworks or abstractions
- Clear, readable request/test structure

**All gates PASS.** No violations or exceptions to justify.

## Project Structure

### Documentation (this feature)

```text
specs/002-postman-collection/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Deliverables (repository root)

```text
postman/
├── postman_collection.json      # Postman collection with all requests/tests
├── postman_environment.json     # Environment variables (base_url, branch_id, etc.)
├── README.md                    # Setup and usage instructions
└── newman/
    └── run-collection.sh        # Script to run collection via Newman CLI
```

**Structure Decision**: Postman collection artifacts stored in `postman/` directory at repo root. Collection mirrors OpenAPI spec structure (9 endpoints organized by user story flow). Environment JSON pre-seeds variables for immediate use. Newman runner script enables CI/CD integration.

## Complexity Tracking

No violations. All constitution gates pass cleanly.

---

## Phase 0: Research & Design Decisions

**Status**: ✅ Complete | **Output**: [research.md](research.md)

Key design decisions for Postman collection structure and execution:

1. **Collection Organization**: Folders by user story (US1: Create & Submit, US2: Approval Workflow, US3: Fulfillment & Cancel) + cross-cutting (Setup, Validation, Cleanup)
2. **Variables Strategy**: Environment file with shared variables (base_url, branch_id, supplier_id, buyer_id); request-level variables for request-specific data
3. **Pre-request Scripts**: Auto-generate test data (UUIDs for IDs, timestamps, calculate totals) to reduce manual setup
4. **Test Assertions**: Validate HTTP status, response schema, required fields, data types, and business logic constraints
5. **Execution Modes**: Support both Postman UI (manual click-to-run) and Newman CLI (automated, CI/CD friendly)
6. **Idempotency Testing**: Pre-request scripts generate idempotency keys; verify duplicate submissions are rejected or cached

See [research.md](research.md) for rationale and alternatives.

---

## Phase 1: Design & Contracts

**Status**: ✅ Complete | **Outputs**:
- [data-model.md](data-model.md) — Collection structure and request organization
- [quickstart.md](quickstart.md) — Setup, import, and validation scenarios

### Collection Data Model

**Postman Collection Structure**:
- Root: "Purchase Order Management API" collection
- Folders: User Story 1 (4 requests), User Story 2 (3 requests), User Story 3 (4 requests), Setup (1), Cleanup (optional)
- Requests per folder: Happy path + edge cases
- Variables: base_url, branch_id, supplier_id, buyer_id, po_id, approver_id, product_id
- Pre-request Scripts: 8+ scripts for data generation, UUID creation, timestamp generation
- Tests: Each request has 3-5 test assertions (status code, schema validation, field presence)

### Request Organization

| Folder | Requests | Purpose |
|--------|----------|---------|
| **Setup** | 1-2 | Verify backend is running, create test data references |
| **US1: Create & Submit PO** | 4 | Create Draft → Add Line Items → Get PO → Submit |
| **US2: Approval Workflow** | 3 | Submit high-value PO → Approve → Verify transition |
| **US3: Fulfillment & Cancel** | 4 | Record fulfillment → Verify status change → Cancel |
| **Validation** | 3+ | Edge cases: invalid inputs, 404, 409 conflicts |
| **Cleanup** | 1 | Optional: Delete test data (if DELETE endpoint exists) |

### Test Assertions

Each request validates:
1. HTTP status code (200, 201, 400, 403, 404, 409)
2. Response content-type is JSON
3. Response schema matches expected structure (required fields present)
4. Data types are correct (string, number, boolean, date)
5. Business logic (e.g., PO status transitions, totals calculated)

### Newman CLI Support

Collection is executable via Newman:
```bash
newman run postman_collection.json -e postman_environment.json --reporters cli,json
```

Script located at `postman/newman/run-collection.sh`.

---

## Next Steps: Phase 2 (Implementation Planning)

Run `/speckit-tasks` to generate `tasks.md`:

```bash
speckit-tasks
```

This will produce an ordered task list for:
- Create Postman collection JSON structure
- Define all 40+ API requests
- Write pre-request scripts
- Write test assertions
- Create environment file
- Document setup and usage
- Test collection import and execution
