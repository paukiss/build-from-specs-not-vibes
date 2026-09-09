# OctoCAT Supply Chain Constitution
<!--
Sync Impact Report

Version change: UNSET -> 1.0.0

Modified principles:
- [PRINCIPLE_1_NAME] -> Library-First
- [PRINCIPLE_2_NAME] -> Test-First (TDD + Contract Tests)
- [PRINCIPLE_3_NAME] -> Integration-First Testing
- [PRINCIPLE_4_NAME] -> Simplicity Over Abstraction
- [PRINCIPLE_5_NAME] -> API-First (OpenAPI)

Added sections:
- Technology Constraints
- Development Workflow

Removed sections:
- none

Deferred TODOs:
- RATIFICATION_DATE: unknown — needs ratification date from project maintainers
-->

## Core Principles

### Library-First
Libraries are the primary unit of design and release. Every feature MUST begin as or be expressed as a focused, well-documented library that is independently buildable, versioned, and testable. Libraries MUST have a clear public contract and accompanying examples demonstrating intended reuse. Rationale: maximizes reusability across services and UIs and reduces duplicated work.

### Test-First (TDD + Contract Tests)
All new functionality MUST be specified by tests before implementation. Contract tests for public library and service interfaces MUST be written and checked into the repository prior to implementation PRs. Tests are the accepted specification for behavior; implementation MUST satisfy the tests. Rationale: prevents regressions and clarifies expected behavior for consumers.

### Integration-First Testing
Integration tests using real, lightweight infrastructure (e.g., an on-disk SQLite instance) MUST be used in preference to extensive mocking for end-to-end or inter-component verification. Mocks are permitted only for rare unit-level isolation when integration tests are infeasible. Rationale: catches integration regressions earlier and ensures tests exercise realistic I/O paths.

### Simplicity Over Abstraction
Prefer direct use of well-understood frameworks and explicit code over layered abstractions. Add abstractions only when they demonstrably reduce duplication or complexity and are backed by tests. Rationale: simpler code is easier to review, maintain, and reason about.

### API-First (OpenAPI)
Public HTTP APIs MUST be designed and documented with OpenAPI specifications before implementation. OpenAPI docs are the source of truth for API contracts and MUST be kept in sync with implementation via CI checks. Rationale: explicit contracts ease integration and client generation.

## Technology Constraints

- **Language**: TypeScript is the required language for application code and libraries where practicable. TypeScript types and compiler checks MUST be used to enforce API contracts.
- **Dependencies**: Keep dependencies minimal. New dependencies MUST be evaluated for security, maintenance, size, and licensing before inclusion. Additions require PR justification and a README note.

## Development Workflow

- Follow Test-First development: write contract and integration tests first, then implement.
- Integration tests MUST run in CI using a real SQLite database instance (or equivalent lightweight DB) for integration-level verification.
- Code reviews MUST verify adherence to this constitution: library boundaries, tests present, OpenAPI synced, dependency rationale provided.

## Governance

Amendments to this constitution require a documented change proposal and approval by the project maintainers or governance group. Changes that alter or remove existing non-negotiable principles (for example, changing Test-First into optional testing) MUST be treated as a MAJOR version bump and require migration guidance and at least one release cycle for adoption.

Versioning policy:

- Follow semantic versioning for the constitution itself: MAJOR for incompatible governance changes, MINOR for added principles or expanded guidance, PATCH for wording clarifications.
- Compliance: All PRs that implement features or change architecture MUST include a short checklist of constitution items they affect and evidence of compliance (tests, OpenAPI updates, dependency rationale).

Compliance reviews and audits will be scheduled periodically and triggered for large cross-cutting changes.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): provide ratification date | **Last Amended**: 2026-09-09
