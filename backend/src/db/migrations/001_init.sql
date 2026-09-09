-- Create Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT UNIQUE,
  branch_id TEXT,
  buyer_id TEXT,
  supplier_id TEXT,
  currency TEXT,
  total_amount NUMERIC,
  status TEXT,
  created_at TEXT,
  updated_at TEXT,
  metadata TEXT
);

-- Line items
CREATE TABLE IF NOT EXISTS line_items (
  id TEXT PRIMARY KEY,
  po_id TEXT,
  product_id TEXT,
  product_name TEXT,
  quantity INTEGER,
  expected_price NUMERIC,
  line_total NUMERIC
);

-- Fulfillment records
CREATE TABLE IF NOT EXISTS fulfillment_records (
  id TEXT PRIMARY KEY,
  line_item_id TEXT,
  quantity_fulfilled INTEGER,
  timestamp TEXT,
  reference_document TEXT
);

-- Approvals
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  po_id TEXT,
  approver_id TEXT,
  decision TEXT,
  timestamp TEXT,
  comment TEXT
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  po_id TEXT,
  recipient TEXT,
  type TEXT,
  status TEXT,
  timestamp TEXT
);
