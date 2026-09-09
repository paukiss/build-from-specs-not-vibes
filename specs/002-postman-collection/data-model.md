# Data Model: Postman Collection Structure

**Phase**: 1 (Design) | **Date**: 2026-09-09 | **Status**: Complete

## Collection Hierarchy

```
Postman Collection: "Purchase Order Management API"
├── Variables (6-8 shared environment variables)
├── Folder: "Setup"
│   ├── Request: Verify Backend Running (GET /health or similar)
│   └── Request: Create Test References (POST to setup initial data)
├── Folder: "User Story 1 - Create & Submit PO"
│   ├── Request: Create Draft PO (POST /api/v1/purchase-orders)
│   ├── Request: Add Line Item (POST /api/v1/purchase-orders/{po_id}/line-items)
│   ├── Request: Get PO (GET /api/v1/purchase-orders/{po_id})
│   └── Request: Submit PO (POST /api/v1/purchase-orders/{po_id}/submit)
├── Folder: "User Story 2 - Approval Workflow"
│   ├── Request: Submit High-Value PO (POST /api/v1/purchase-orders/{po_id}/submit, total > $10k)
│   ├── Request: Approve PO (POST /api/v1/purchase-orders/{po_id}/approve)
│   └── Request: Verify Approved (GET /api/v1/purchase-orders/{po_id})
├── Folder: "User Story 3 - Fulfillment & Cancel"
│   ├── Request: Record Fulfillment (POST /api/v1/purchase-orders/{po_id}/fulfill)
│   ├── Request: Verify Status (GET /api/v1/purchase-orders/{po_id})
│   ├── Request: Cancel PO (POST /api/v1/purchase-orders/{po_id}/cancel)
│   └── Request: Verify Cancelled (GET /api/v1/purchase-orders/{po_id})
├── Folder: "Validation (Edge Cases)"
│   ├── Request: Invalid Input (POST with missing required field)
│   ├── Request: Not Found (GET non-existent PO)
│   ├── Request: Conflict (POST approve already-approved PO)
│   └── Request: Unauthorized (POST approve as non-approver)
└── Folder: "Cleanup (Optional)"
    └── Request: Delete Test Data (if backend supports)
```

## Request Structure

Each request contains:

```json
{
  "name": "Request name",
  "request": {
    "method": "GET|POST|PATCH|DELETE",
    "url": "{{base_url}}/api/v1/endpoint",
    "header": [{ "key": "Content-Type", "value": "application/json" }],
    "body": { "mode": "raw", "raw": "{...}" }
  },
  "event": [
    {
      "listen": "prerequest",
      "script": { "exec": ["// Generate test data"] }
    },
    {
      "listen": "test",
      "script": { "exec": ["// Validate response"] }
    }
  ]
}
```

## Variables

### Environment Variables (postman_environment.json)

```json
{
  "name": "Purchase Order Management",
  "values": [
    { "key": "base_url", "value": "http://localhost:3000" },
    { "key": "branch_id", "value": "branch-001" },
    { "key": "supplier_id", "value": "supplier-001" },
    { "key": "buyer_id", "value": "buyer-001" },
    { "key": "approver_id", "value": "manager-001" },
    { "key": "product_id", "value": "product-sku-001" }
  ]
}
```

### Request-level Variables (set by pre-request scripts)

- `po_id`: UUID extracted from POST /purchase-orders response
- `line_item_id`: UUID extracted from POST /line-items response
- `idempotency_key`: UUID generated for idempotency testing
- `timestamp`: ISO 8601 timestamp
- `quantity_fulfilled`: Numeric value for fulfillment

## Pre-request Scripts

### Types

1. **UUID Generation**: `pm.variables.set("po_id", pm.utils.uuid())`
2. **Timestamp Generation**: `pm.variables.set("timestamp", new Date().toISOString())`
3. **Response Parsing**: Extract IDs from previous responses for chaining
4. **Data Calculation**: Calculate PO totals from line items
5. **Idempotency Key**: Generate for duplicate submission testing

### Example Script

```javascript
// Generate test data
const po_id = pm.variables.replaceIn('{{$randomUUID}}');
const timestamp = new Date().toISOString();
const idempotency_key = pm.variables.replaceIn('{{$randomUUID}}');

pm.variables.set("po_id", po_id);
pm.variables.set("timestamp", timestamp);
pm.variables.set("idempotency_key", idempotency_key);
```

## Test Assertions

### Assertion Types

1. **HTTP Status**: `pm.response.code === 201`
2. **Content-Type**: `pm.response.headers.get("content-type").includes("application/json")`
3. **Schema Validation**: `tv4.validateMultiple(pm.response.json(), schema)`
4. **Required Fields**: `pm.expect(pm.response.json()).to.have.property('id')`
5. **Business Logic**: `pm.expect(pm.response.json().status).to.equal('submitted')`

### Example Test

```javascript
pm.test("PO created with draft status", () => {
  pm.response.to.have.status(201);
  pm.expect(pm.response.json()).to.have.property('id');
  pm.expect(pm.response.json().status).to.equal('draft');
});
```

## Request Flow Examples

### User Story 1: Create & Submit

```
POST /purchase-orders
  ↓ Extracts po_id
  ↓
POST /purchase-orders/{po_id}/line-items
  ↓
GET /purchase-orders/{po_id}
  ↓ Verify total calculated
  ↓
POST /purchase-orders/{po_id}/submit
  ↓ Verify status = submitted
```

### User Story 2: Approval (High-Value PO)

```
POST /purchase-orders/{po_id}/submit (total > $10,000)
  ↓ Verify Approval created (pending)
  ↓
POST /purchase-orders/{po_id}/approve
  ↓ Verify status = approved
  ↓
GET /purchase-orders/{po_id}
  ↓ Verify approval.decision = approved
```

### User Story 3: Fulfillment

```
POST /purchase-orders/{po_id}/fulfill
  ↓ Verify status = partially_fulfilled (50% fulfilled)
  ↓
POST /purchase-orders/{po_id}/fulfill (remaining 50%)
  ↓ Verify status = fulfilled (100% fulfilled)
  ↓
POST /purchase-orders/{po_id}/cancel
  ↓ Verify status = cancelled
```

## Collection Metadata

- **Name**: "Purchase Order Management API"
- **Description**: "Comprehensive test collection for PO API (create, submit, approve, fulfill, cancel)"
- **Version**: 1.0.0
- **Schema**: Postman Collection v2.1
- **Requests**: 20-25 requests (happy path + edge cases)
- **Folders**: 6 (Setup, US1, US2, US3, Validation, Cleanup)
- **Pre-request Scripts**: 8-10
- **Test Assertions**: 60-80 total across all requests
