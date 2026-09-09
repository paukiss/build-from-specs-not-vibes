# Purchase Order Management API

A TypeScript/Express.js REST API for managing purchase orders with approval workflows and fulfillment tracking.

## Features

✅ **Create & Submit POs** - Draft management with state transitions  
✅ **Line Item Management** - Multiple products per order with calculated totals  
✅ **Auto Approval Gate** - POs over $10,000 require manager approval  
✅ **Fulfillment Tracking** - Partial and complete shipment recording  
✅ **Audit Trail** - Immutable status history for all operations  
✅ **Notifications** - Supplier notifications with retry queue  

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
cd backend
npm install
npm run build
```

### Running the Server

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

Server runs on `http://localhost:3000`

### Health Check

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok","timestamp":"..."}`

---

## API Endpoints (MVP)

### Create Draft Purchase Order
```bash
POST /api/v1/purchase-orders
Content-Type: application/json

{
  "branch_id": "branch-001",
  "buyer_id": "buyer-001",
  "supplier_id": "supplier-001",
  "currency": "USD",
  "notes": "Office supplies order"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid-here",
  "po_number": "PO-2026-ABC123",
  "status": "draft",
  "total_amount": 0,
  "line_items": []
}
```

### Get Purchase Order
```bash
GET /api/v1/purchase-orders/{po_id}
```

**Response**: `200 OK` - Full PO with line items, approvals, status history

### Add Line Item
```bash
POST /api/v1/purchase-orders/{po_id}/line-items
Content-Type: application/json

{
  "product_name": "Office Chair",
  "quantity": 5,
  "expected_price": 299.99,
  "product_id": "product-001"
}
```

**Response**: `201 Created`
```json
{
  "id": "line-item-uuid",
  "po_id": "po-uuid",
  "product_name": "Office Chair",
  "quantity": 5,
  "expected_price": 299.99,
  "line_total": 1499.95
}
```

### Submit Purchase Order
```bash
POST /api/v1/purchase-orders/{po_id}/submit
Content-Type: application/json

{
  "idempotency_key": "unique-uuid-here"
}
```

**Response**: `200 OK`
```json
{
  "id": "po-uuid",
  "status": "submitted",
  "total_amount": 1499.95,
  "approval": null,
  "line_items": [...]
}
```

---

## Testing with Postman/curl

### Complete Workflow Example

**1. Create Draft PO**
```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "branch-001",
    "buyer_id": "buyer-001",
    "supplier_id": "supplier-001",
    "currency": "USD",
    "notes": "Test order"
  }' | jq .
```

Save the returned `id` as `PO_ID`

**2. Add Line Item 1**
```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/$PO_ID/line-items \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Laptop",
    "quantity": 2,
    "expected_price": 1200.00
  }' | jq .
```

**3. Add Line Item 2**
```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/$PO_ID/line-items \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Monitor",
    "quantity": 2,
    "expected_price": 350.00
  }' | jq .
```

**4. Get PO (verify total calculated)**
```bash
curl http://localhost:3000/api/v1/purchase-orders/$PO_ID | jq .
```

Expected total: 2×1200 + 2×350 = **3100.00**

**5. Submit PO**
```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders/$PO_ID/submit \
  -H "Content-Type: application/json" \
  -d '{"idempotency_key": "idempotency-001"}' | jq .
```

Expected status: `submitted`

---

## Project Structure

```
backend/
├── src/
│   ├── index.ts                    # Main app
│   ├── config/index.ts             # Configuration
│   ├── models/                     # Domain models
│   ├── services/                   # Business logic
│   ├── repos/                      # Data repositories
│   ├── api/purchaseOrders.ts       # Express routes
│   ├── db/
│   │   ├── sqlite.ts               # Database connection
│   │   └── migrations/001_init.sql # Schema
│   ├── notifications/              # Email/notifications
│   ├── workers/                    # Background jobs
│   ├── middleware/                 # Express middleware
│   └── utils/                      # Utilities
├── tests/                          # Test files (WIP)
├── package.json
└── tsconfig.json
```

---

## Database

### Schema

- `purchase_orders` - Main PO records
- `line_items` - Products in each PO
- `approvals` - Approval workflow
- `status_history` - Audit trail
- `notifications` - Notification queue

Database location: `./data/purchase_orders.db` (auto-created)

### Reset Database

```bash
rm -rf backend/data/
npm run dev
# Database will be recreated with schema
```

---

## Environment Variables

Create `.env` in `backend/`:

```
DEBUG=true
DATABASE_PATH=./data/purchase_orders.db
NOTIFICATION_RETRY_INTERVAL=30000
PORT=3000
NOTIFICATION_EMAIL_FROM=noreply@example.com
```

---

## Development

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Test (when available)

```bash
npm run test
```

---


## API Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation error) |
| 404 | Not found |
| 409 | Conflict (state error, duplicate submission) |
| 500 | Server error |

---

## Next Features (In Progress)

- [ ] User Story 2: Approval workflow for high-value POs
- [ ] User Story 3: Fulfillment tracking and cancellation
- [ ] Comprehensive test suite
- [ ] Authentication/authorization
- [ ] Advanced filtering and search

---

## Troubleshooting

**Port 3000 already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Database locked**
```bash
# Remove database and restart
rm -rf data/
npm run dev
```

**Connection refused**
```bash
# Make sure server is running
npm run dev
# In another terminal
curl http://localhost:3000/health
```

---

## License

MIT

---

## See Also

- [Postman Collection](../postman/README.md) - API test suite
- [Data Model](../specs/001-purchase-order-management/data-model.md) - Entity definitions
- [Implementation Plan](../specs/001-purchase-order-management/plan.md) - Architecture & design


