# Curl Test Commands for Purchase Order API

Copy and paste these commands to test the API. Make sure the server is running: `npm run dev`

---

## Setup Variables

```bash
# Set these at the top of your terminal session
BASE_URL="http://localhost:3000"
BRANCH_ID="branch-001"
BUYER_ID="buyer-001"
SUPPLIER_ID="supplier-001"
IDEMPOTENCY_KEY=$(uuidgen)  # Generates unique UUID

# Save returned PO ID for later commands
PO_ID=""
```

---

## 1. Health Check

```bash
curl -X GET $BASE_URL/health
```

✅ Expected: `{"status":"ok",...}`

---

## 2. Create Draft PO

```bash
curl -X POST $BASE_URL/api/v1/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "'$BRANCH_ID'",
    "buyer_id": "'$BUYER_ID'",
    "supplier_id": "'$SUPPLIER_ID'",
    "currency": "USD",
    "notes": "Test purchase order"
  }' | jq .
```

✅ Expected: 201 Created with `status: "draft"`, `total_amount: 0`

**Save the `id` from response:**
```bash
# After running above, copy the ID and set it:
PO_ID="paste-id-here"
```

---

## 3. Add First Line Item (Laptop)

```bash
curl -X POST $BASE_URL/api/v1/purchase-orders/$PO_ID/line-items \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Laptop Computer",
    "quantity": 3,
    "expected_price": 1299.99,
    "product_id": "sku-laptop-001"
  }' | jq .
```

✅ Expected: 201 Created  
- `line_total: 3899.97` (3 × 1299.99)

---

## 4. Add Second Line Item (Monitor)

```bash
curl -X POST $BASE_URL/api/v1/purchase-orders/$PO_ID/line-items \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "4K Monitor",
    "quantity": 3,
    "expected_price": 499.99,
    "product_id": "sku-monitor-001"
  }' | jq .
```

✅ Expected: 201 Created  
- `line_total: 1499.97` (3 × 499.99)

---

## 5. Get PO (Verify Total)

```bash
curl -X GET $BASE_URL/api/v1/purchase-orders/$PO_ID | jq .
```

✅ Expected: 200 OK
- `status: "draft"`
- `total_amount: 5399.94` (3899.97 + 1499.97)
- `line_items`: array with 2 items

---

## 6. Submit PO

```bash
curl -X POST $BASE_URL/api/v1/purchase-orders/$PO_ID/submit \
  -H "Content-Type: application/json" \
  -d '{
    "idempotency_key": "'$IDEMPOTENCY_KEY'"
  }' | jq .
```

✅ Expected: 200 OK
- `status: "submitted"` (changed from "draft")
- `total_amount: 5399.94` (persisted)
- `line_items`: array with 2 items
- Notification created for supplier

---

## 7. Verify Submitted PO

```bash
curl -X GET $BASE_URL/api/v1/purchase-orders/$PO_ID | jq .
```

✅ Expected: 200 OK
- `status: "submitted"`
- Full details preserved

---

## Test High-Value PO (Requires Approval)

This tests the approval workflow for POs over $10,000.

### 1. Create High-Value PO

```bash
curl -X POST $BASE_URL/api/v1/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "'$BRANCH_ID'",
    "buyer_id": "'$BUYER_ID'",
    "supplier_id": "'$SUPPLIER_ID'",
    "currency": "USD",
    "notes": "High-value order requiring approval"
  }' | jq .
```

Save this `id` as `PO_ID_HV`

### 2. Add High-Value Item

```bash
curl -X POST $BASE_URL/api/v1/purchase-orders/$PO_ID_HV/line-items \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Server Hardware",
    "quantity": 1,
    "expected_price": 15000.00,
    "product_id": "sku-server-001"
  }' | jq .
```

✅ Total: $15,000 (exceeds $10,000 threshold)

### 3. Submit High-Value PO

```bash
curl -X POST $BASE_URL/api/v1/purchase-orders/$PO_ID_HV/submit \
  -H "Content-Type: application/json" \
  -d '{
    "idempotency_key": "'$(uuidgen)'"
  }' | jq .
```

✅ Expected: 200 OK
- `approval.decision: "pending"` (approval required!)
- `approval.approver_id: "manager-001"`

### 4. Get High-Value PO

```bash
curl -X GET $BASE_URL/api/v1/purchase-orders/$PO_ID_HV | jq .
```

✅ Expected: Approval object with `decision: "pending"`

---

## Error Testing

### Test 1: Invalid Input (Negative Quantity)

```bash
curl -X POST $BASE_URL/api/v1/purchase-orders/$PO_ID/line-items \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Invalid Product",
    "quantity": -5,
    "expected_price": 100.00
  }' | jq .
```

❌ Expected: 400 Bad Request  
Message: "Quantity must be a positive integer"

### Test 2: Missing Required Fields

```bash
curl -X POST $BASE_URL/api/v1/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_id": "'$BUYER_ID'"
  }' | jq .
```

❌ Expected: 400 Bad Request  
Message: "Missing required fields"

### Test 3: Non-Existent PO

```bash
curl -X GET $BASE_URL/api/v1/purchase-orders/invalid-uuid-123 | jq .
```

❌ Expected: 404 Not Found  
Message: "PO not found"

### Test 4: Cannot Submit Non-Draft PO

```bash
# Try to submit the same PO twice
curl -X POST $BASE_URL/api/v1/purchase-orders/$PO_ID/submit \
  -H "Content-Type: application/json" \
  -d '{"idempotency_key": "'$IDEMPOTENCY_KEY'"}' | jq .
```

❌ Expected: 409 Conflict  
Message: "Only Draft POs can be submitted"

### Test 5: Idempotency (Duplicate Submission)

```bash
# Store the idempotency key
IDEM_KEY="test-idem-key-$(date +%s)"

# Create new PO
NEW_PO=$(curl -s -X POST $BASE_URL/api/v1/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "branch_id": "'$BRANCH_ID'",
    "buyer_id": "'$BUYER_ID'",
    "supplier_id": "'$SUPPLIER_ID'",
    "currency": "USD"
  }' | jq -r '.id')

# Add item
curl -s -X POST $BASE_URL/api/v1/purchase-orders/$NEW_PO/line-items \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Test Item",
    "quantity": 1,
    "expected_price": 100.00
  }' > /dev/null

# Submit with unique key
curl -X POST $BASE_URL/api/v1/purchase-orders/$NEW_PO/submit \
  -H "Content-Type: application/json" \
  -d '{"idempotency_key": "'$IDEM_KEY'"}' | jq .

# Try submit again with SAME key (should be idempotent)
curl -X POST $BASE_URL/api/v1/purchase-orders/$NEW_PO/submit \
  -H "Content-Type: application/json" \
  -d '{"idempotency_key": "'$IDEM_KEY'"}' | jq .
```

✅ Expected: Both return same PO (idempotency works)

---

## Batch Test Script

Save this as `test.sh` and run `bash test.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
BRANCH_ID="branch-001"
BUYER_ID="buyer-001"
SUPPLIER_ID="supplier-001"

echo "🧪 Testing Purchase Order API..."

# 1. Health check
echo -e "\n1️⃣ Health check..."
curl -s $BASE_URL/health | jq .

# 2. Create PO
echo -e "\n2️⃣ Creating PO..."
PO=$(curl -s -X POST $BASE_URL/api/v1/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{"branch_id":"'$BRANCH_ID'","buyer_id":"'$BUYER_ID'","supplier_id":"'$SUPPLIER_ID'","currency":"USD"}')
PO_ID=$(echo $PO | jq -r '.id')
echo "PO ID: $PO_ID"
echo $PO | jq .

# 3. Add item
echo -e "\n3️⃣ Adding line item..."
curl -s -X POST $BASE_URL/api/v1/purchase-orders/$PO_ID/line-items \
  -H "Content-Type: application/json" \
  -d '{"product_name":"Laptop","quantity":1,"expected_price":1200}' | jq .

# 4. Get PO
echo -e "\n4️⃣ Getting PO..."
curl -s -X GET $BASE_URL/api/v1/purchase-orders/$PO_ID | jq .

# 5. Submit
echo -e "\n5️⃣ Submitting PO..."
curl -s -X POST $BASE_URL/api/v1/purchase-orders/$PO_ID/submit \
  -H "Content-Type: application/json" \
  -d '{"idempotency_key":"test-'$(date +%s)'"}' | jq .

echo -e "\n✅ Test complete!"
```

---

## Useful jq Filters

Extract just the ID:
```bash
curl -s ... | jq -r '.id'
```

Extract total amount:
```bash
curl -s ... | jq '.total_amount'
```

Pretty print all line items:
```bash
curl -s ... | jq '.line_items'
```

Check status:
```bash
curl -s ... | jq '.status'
```

---

## Notes

- Replace `$PO_ID` with actual ID from responses
- Use `jq .` to pretty-print JSON
- Use `jq -r '.id'` to extract raw values
- Timestamps are ISO 8601 format
- All amounts are decimal (e.g., 1299.99)
- UUIDs are used for all IDs
