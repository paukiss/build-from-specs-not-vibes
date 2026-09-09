# Quickstart: Validate Purchase Order Flow (Integration Smoke)

Prerequisites:

- Node.js (16+)
- SQLite available on PATH (or use in-process file)

Steps:

1. Install dependencies

```bash
npm install
```

2. Start the backend in dev mode (uses local SQLite DB file)

```bash
npm run dev --workspace=backend
```

3. Run integration smoke test (create → submit → approve flow)

```bash
npm run test:integration --workspace=backend -- --grep "purchase order"
```

Expected outcome:

- Create a PO via POST /purchase-orders returns 201 and PO in Draft state.
- Submitting the PO transitions it to Submitted and sends a supplier notification (stubbed).
- Approving a PO > $10,000 requires approver action and transitions to Approved.
