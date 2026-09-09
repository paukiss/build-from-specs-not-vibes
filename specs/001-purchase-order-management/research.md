# Research: Purchase Order Management

## Decisions and Unknowns

- Decision: Technology stack — TypeScript/Express backend, React frontend, SQLite for integration tests and lightweight DB. Rationale: aligns with project constitution (TypeScript, minimal dependencies) and user's requested stack.
- Unknown: Supplier notification delivery channel reliability and retry policy. (Assume simple email via Nodemailer stub for v1.)
- Unknown: Approval escalation/fallback — out of scope for v1 per assumptions.

## Alternatives Considered

- Webhooks vs Email for supplier notifications: Email (Nodemailer) chosen as default stubbed channel; webhooks considered for future extensibility.
- PO Fulfillment status model: chosen to require all line items fulfilled for PO-level `Fulfilled` to reduce reconciliation complexity (see spec clarification). Option to add `Partially Fulfilled` later.

## Rationale Summary

- The selected stack matches governance (TypeScript, OpenAPI-first) and enables rapid development with strong typing and familiar tooling (Vitest/Playwright).
