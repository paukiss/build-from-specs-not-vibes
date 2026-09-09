# Postman Collection - Purchase Order API

Quick-start test collection for the Purchase Order Management API.

## Quick Import (30 seconds)

### Option 1: Import into Postman UI

1. Open Postman desktop app
2. Click **Import** (top-left)
3. Select **File** tab
4. Choose `postman_collection.json`
5. Click **Import**

### Option 2: Import Environment

1. In Postman, click **Environments**
2. Click **Import**
3. Select `postman_environment.json`
4. Click **Import**

### Option 3: Select Environment

1. Top-right dropdown showing environment name
2. Select **"Purchase Order Management"**
3. Ready to go!

---

## Test the API (5 minutes)

### Start Backend

```bash
cd backend
npm run dev
```

You should see: `API listening on port 3000`

### Run Collection in Postman

1. Click collection: **"Purchase Order Management API"**
2. Click three dots (...) → **Run collection**
3. Select environment: **"Purchase Order Management"**
4. Click **Run Purchase Order Management API**
5. Watch requests execute ✅

### Expected Results

All 4 requests should execute:
- ✅ Health Check (verify backend running)
- ✅ Create Draft PO (HTTP 201)
- ✅ Add Line Item (HTTP 201)
- ✅ Get PO (HTTP 200, verify total calculated)
- ✅ Submit PO (HTTP 200, status → submitted)

---

## Manual Testing in Postman UI

### 1. Create Draft PO

- Request: `POST /api/v1/purchase-orders`
- Expected: `201 Created`, `status: "draft"`, `total_amount: 0`
- **Save the `id`** for next requests

### 2. Add Line Item

- Request: `POST /api/v1/purchase-orders/{{po_id}}/line-items`
- Body: Adjust quantity/price as needed
- Expected: `201 Created`, `line_total` calculated

### 3. Get PO

- Request: `GET /api/v1/purchase-orders/{{po_id}}`
- Expected: `200 OK`, `total_amount > 0`
- Verify total = sum of line items

### 4. Submit PO

- Request: `POST /api/v1/purchase-orders/{{po_id}}/submit`
- Body: `{"idempotency_key": "{{$randomUUID}}"}`
- Expected: `200 OK`, `status: "submitted"`

---

## Using Environment Variables

The collection uses these variables (editable in Environment tab):

| Variable | Value | Purpose |
|----------|-------|---------|
| `base_url` | http://localhost:3000 | API endpoint |
| `branch_id` | branch-001 | Branch identifier |
| `buyer_id` | buyer-001 | Buyer identifier |
| `supplier_id` | supplier-001 | Supplier identifier |
| `po_id` | (empty) | PO ID - auto-populated after Create |

Change any value in the Environment tab, all requests use updated values automatically.

---

## Test Data

### Low-Value PO (Testing MVP)
```
- Product: Office Chair
- Quantity: 5
- Price: $299.99
- Total: $1,499.95
```

### High-Value PO (Testing Approval)
```
- Product: Server Hardware
- Quantity: 1
- Price: $15,000.00
- Total: $15,000.00 (requires approval)
```

---

## Troubleshooting

### "Connection refused"
- Make sure backend is running: `npm run dev` in terminal
- Check port 3000 is available

### "Undefined variable"
- Make sure environment is selected in top-right dropdown
- Check Environment tab has all variables populated

### "Cannot find {{po_id}}"
- Run "Create Draft PO" request first
- The response should auto-populate `po_id` variable
- Or manually copy ID from Create response into Environment

### "Idempotency conflict"
- This is expected! Postman generates new `{{$randomUUID}}` each time
- Try same UUID twice to test idempotency (409 or 200 cached response)

---

## CLI Testing (Newman)

Run collection from command line:

```bash
# Install Newman (one time)
npm install -g newman

# Run collection
newman run postman_collection.json \
  -e postman_environment.json \
  --reporters cli,json
```

Expected: Exit code 0 (success)

---

## Next Steps

After testing MVP (US1), expand collection with:
- User Story 2: High-value POs requiring approval
- User Story 3: Fulfillment tracking and cancellation
- Edge cases: Invalid input, not found, conflicts

See `/specs/002-postman-collection/tasks.md` for complete implementation plan.

---

## Resources

- [Backend README](../backend/README.md) - Server setup and architecture
- [Curl Tests](../backend/CURL_TESTS.md) - CLI testing commands
- [API Design](../specs/001-purchase-order-management/plan.md) - Technical architecture
- [Data Model](../specs/001-purchase-order-management/data-model.md) - Entity definitions
- [Quickstart Guide](../specs/001-purchase-order-management/quickstart.md) - Detailed scenarios

---

## Quick Reference

```bash
# Start backend
cd backend && npm run dev

# Test one request
curl -X GET http://localhost:3000/health

# Run full collection (CLI)
newman run postman_collection.json -e postman_environment.json
```

---

**Happy testing! 🚀**
