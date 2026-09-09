# Data Model: Purchase Order Management

## Entities

- **PurchaseOrder**
  - `id` (string)
  - `po_number` (string, unique)
  - `branch_id` (string)
  - `buyer_id` (string)
  - `supplier_id` (string)
  - `currency` (string)
  - `total_amount` (decimal)
  - `status` (enum: Draft, Submitted, Approved, Fulfilled, Cancelled)
  - `created_at` (ISO datetime)
  - `updated_at` (ISO datetime)
  - `metadata` (JSON)

- **LineItem**
  - `id` (string)
  - `po_id` (string)
  - `product_id` (string, optional)
  - `product_name` (string)
  - `quantity` (integer, >0)
  - `expected_price` (decimal, >=0)
  - `line_total` (decimal)

- **FulfillmentRecord**
  - `id` (string)
  - `line_item_id` (string)
  - `quantity_fulfilled` (integer)
  - `timestamp` (ISO datetime)
  - `reference_document` (string, optional)

## New: PO-level partial status

- `Partially Fulfilled`: PO-level status when at least one line item has fulfillment records but not all line items have reached their ordered quantities. PO becomes `Fulfilled` when all line items' fulfilled quantities equal their ordered quantities.

- **Approval**
  - `id` (string)
  - `po_id` (string)
  - `approver_id` (string)
  - `decision` (enum: approved, rejected)
  - `timestamp` (ISO datetime)
  - `comment` (string, optional)

- **Supplier**
  - `id`, `name`, `contact_info` (email/webhook reference), `preferred_notification_channel`

## State transitions

- Draft → Submitted (on submit)
- Submitted → Approved (on approver action) OR Submitted → Rejected → Cancelled
- Approved → Fulfilled (when all line items fulfilled)
- Draft/Submitted → Cancelled (on cancel)

## Validation Rules

- `quantity` MUST be positive integer
- `expected_price` MUST be non-negative decimal
- `total_amount` MUST equal sum(line_total) computed as `quantity × expected_price`
