-- Purchase Orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  branch_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT,
  notes TEXT
);

-- Line Items table
CREATE TABLE IF NOT EXISTS line_items (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  expected_price REAL NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
);

-- Fulfillment Records table
CREATE TABLE IF NOT EXISTS fulfillment_records (
  id TEXT PRIMARY KEY,
  line_item_id TEXT NOT NULL,
  quantity_fulfilled REAL NOT NULL,
  timestamp TEXT NOT NULL,
  reference_document TEXT,
  notes TEXT,
  FOREIGN KEY (line_item_id) REFERENCES line_items(id)
);

-- Approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL UNIQUE,
  approver_id TEXT NOT NULL,
  decision TEXT NOT NULL DEFAULT 'pending',
  timestamp TEXT NOT NULL,
  comment TEXT,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
);

-- Status History table
CREATE TABLE IF NOT EXISTS status_history (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  reason TEXT,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL,
  recipient TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  timestamp TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
);

CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_branch ON purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_line_po ON line_items(po_id);
CREATE INDEX IF NOT EXISTS idx_notif_pending ON notifications(status);
