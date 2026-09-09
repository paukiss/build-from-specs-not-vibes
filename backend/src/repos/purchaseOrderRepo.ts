import { openDb } from '../db/sqlite';
import { PurchaseOrder } from '../models/purchaseOrder';

export async function createPurchaseOrder(po: PurchaseOrder) {
  const db = await openDb();
  await db.run(
    `INSERT INTO purchase_orders (id, po_number, branch_id, buyer_id, supplier_id, currency, total_amount, status, created_at, updated_at, metadata) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    po.id,
    po.po_number,
    po.branch_id,
    po.buyer_id,
    po.supplier_id,
    po.currency,
    po.total_amount,
    po.status,
    po.created_at,
    po.updated_at,
    JSON.stringify(po.metadata || {})
  );
  return po;
}

export async function findPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  const db = await openDb();
  const row = await db.get(`SELECT * FROM purchase_orders WHERE id = ?`, id);
  if (!row) return null;
  return {
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  } as PurchaseOrder;
}
