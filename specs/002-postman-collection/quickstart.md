# Quickstart: Postman Collection Setup & Validation

**Phase**: 1 (Design) | **Date**: 2026-09-09 | **Status**: Complete

## Prerequisites

- Postman desktop app (v10+) or Postman web app (postman.com)
- Backend API running locally: `npm run dev` (from backend/ directory)
- API available at http://localhost:3000
- Import files: `postman_collection.json`, `postman_environment.json`

---

## Step 1: Import Collection into Postman

1. Open Postman desktop or web app
2. Click "Import" (top-left)
3. Select file: `postman_collection.json`
4. Click "Import" button
5. Collection appears in left sidebar: "Purchase Order Management API"

**Expected**: Collection loads without errors; all folders and requests visible.

---

## Step 2: Import Environment

1. Click "Environments" (left sidebar)
2. Click "Import" or "+" → "Import from file"
3. Select file: `postman_environment.json`
4. Environment appears in dropdown: "Purchase Order Management"
5. Select environment from dropdown (top-right)

**Expected**: Environment variables visible in "Manage Environments" popup.

---

## Step 3: Verify Backend Connection

1. Navigate to folder: "Setup"
2. Click request: "Verify Backend Running"
3. Click "Send"
4. Check response: Should be 200 OK or appropriate health check response

**Expected**: Response shows backend is accessible and responding.

---

## Step 4: Run User Story 1 (MVP)

### Scenario: Create, Edit, and Submit PO

1. **Create Draft PO**
   - Folder: "User Story 1 - Create & Submit PO"
   - Request: "Create Draft PO"
   - Click "Send"
   - Check: Status 201, response contains `id`, `status=draft`, `total_amount=0`
   - **System extracts po_id** for next request

2. **Add Line Item**
   - Request: "Add Line Item"
   - Click "Send"
   - Check: Status 201, response contains `line_total`, `product_name`

3. **Get PO (verify total calculated)**
   - Request: "Get PO"
   - Click "Send"
   - Check: Status 200, `total_amount > 0` (calculated from line items)

4. **Submit PO**
   - Request: "Submit PO"
   - Click "Send"
   - Check: Status 200, `status=submitted`, notification created

**Expected**: PO transitions Draft → Submitted. All tests pass (green checkmarks).

---

## Step 5: Run User Story 2 (Approval)

### Scenario: High-Value PO Requires Approval

1. **Submit High-Value PO** (total > $10,000)
   - Folder: "User Story 2 - Approval Workflow"
   - Request: "Submit High-Value PO"
   - Click "Send"
   - Check: Status 200, `approval` object created with `decision=pending`

2. **Approve PO**
   - Request: "Approve PO"
   - Click "Send"
   - Check: Status 200, `approval.decision=approved`

3. **Verify Status**
   - Request: "Verify Approved"
   - Click "Send"
   - Check: Status 200, `status=approved`

**Expected**: High-value PO requires approval; approval workflow completes.

---

## Step 6: Run User Story 3 (Fulfillment & Cancel)

### Scenario: Partial Fulfillment

1. **Record Partial Fulfillment** (50%)
   - Folder: "User Story 3 - Fulfillment & Cancel"
   - Request: "Record Fulfillment (50%)"
   - Click "Send"
   - Check: Status 200, `status=partially_fulfilled`

2. **Record Complete Fulfillment** (remaining 50%)
   - Request: "Record Fulfillment (100%)"
   - Click "Send"
   - Check: Status 200, `status=fulfilled`

3. **Verify Fulfilled**
   - Request: "Verify Fulfilled"
   - Click "Send"
   - Check: Status 200, all line items have `quantity_fulfilled >= quantity`

**Expected**: PO transitions Approved → PartiallyFulfilled → Fulfilled.

---

## Step 7: Run Edge Cases (Validation)

### Scenario: Error Handling

1. **Invalid Input**
   - Folder: "Validation (Edge Cases)"
   - Request: "Invalid Input (negative quantity)"
   - Click "Send"
   - Check: Status 400, error message describes validation failure

2. **Not Found**
   - Request: "Not Found (non-existent PO)"
   - Click "Send"
   - Check: Status 404, error message

3. **Conflict (Duplicate Approval)**
   - Request: "Conflict (approve already-approved)"
   - Click "Send"
   - Check: Status 409, error message indicates conflict

**Expected**: API returns appropriate error codes and messages.

---

## Step 8: Run Full Collection

1. Click collection: "Purchase Order Management API"
2. Click "..." (three dots) → "Run collection"
3. Select environment: "Purchase Order Management"
4. Click "Run Purchase Order Management API"
5. Watch requests execute in order (should take 1-2 minutes)

**Expected**: All requests complete; collection runner shows summary (passed vs failed tests).

---

## Step 9: Run via Newman CLI (Automated)

For CI/CD integration:

```bash
cd postman
./newman/run-collection.sh
```

Or manually:

```bash
newman run postman_collection.json -e postman_environment.json --reporters cli,json
```

**Expected**: Newman outputs test summary; exit code 0 if all tests pass.

---

## Success Criteria Checklist

- [ ] Collection imports without errors
- [ ] Environment loads and variables are accessible
- [ ] Backend connection verified (Setup request passes)
- [ ] User Story 1 completes: PO created, submitted
- [ ] User Story 2 completes: High-value PO approved
- [ ] User Story 3 completes: Fulfillment tracked, cancelled
- [ ] Edge cases tested: Invalid input, 404, 409
- [ ] Full collection run: All tests pass
- [ ] Newman CLI execution: Exit code 0

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" | Ensure backend is running: `npm run dev` from backend/ |
| "Undefined variable" | Check environment is selected in dropdown (top-right) |
| "400 Bad Request" | Verify request body has required fields; check pre-request script |
| "409 Conflict" | This is expected for duplicate submissions; test validates idempotency |
| "Newman not found" | Install globally: `npm install -g newman` |

---

## Next Steps

1. **Integrate with CI/CD**: Add Newman run to GitHub Actions or CI pipeline
2. **Expand edge cases**: Add more validation tests for specific error conditions
3. **Performance testing**: Use Newman with higher concurrency for load testing
4. **Monitor changes**: Re-run collection whenever backend changes
