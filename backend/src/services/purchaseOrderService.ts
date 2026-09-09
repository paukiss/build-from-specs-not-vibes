import { v4 as uuid } from 'uuid';
import { getDatabase, runAsync, getAsync, allAsync } from '../db/sqlite';
import { PurchaseOrder, PurchaseOrderModel } from '../models/purchaseOrder';
import { PurchaseOrderStatus } from '../models/enums';
import { validateLineItem } from '../models/lineItem';
import { StateTransitionValidator } from './stateTransitions';
import { logger } from '../utils/logger';

export class PurchaseOrderService {
  async createPO(
    branch_id: string,
    buyer_id: string,
    supplier_id: string,
    currency: string = 'USD',
    notes?: string
  ): Promise<PurchaseOrder> {
    const id = uuid();
    const po_number = `PO-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const now = new Date().toISOString();

    await runAsync(
      `INSERT INTO purchase_orders (id, po_number, branch_id, buyer_id, supplier_id, status, total_amount, currency, created_at, updated_at, metadata, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, po_number, branch_id, buyer_id, supplier_id, PurchaseOrderStatus.Draft, 0, currency, now, now, JSON.stringify({}), notes || null]
    );

    // Record initial status history
    await runAsync(
      `INSERT INTO status_history (id, po_id, from_status, to_status, changed_by, timestamp, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), id, null, PurchaseOrderStatus.Draft, buyer_id, now, 'PO created']
    );

    logger.info('PO created', { id, po_number, branch_id, supplier_id });
    return this.getPO(id) as Promise<PurchaseOrder>;
  }

  async addLineItem(
    po_id: string,
    product_name: string,
    quantity: number,
    expected_price: number,
    product_id?: string
  ) {
    validateLineItem(quantity, expected_price);

    const po = await this.getPO(po_id);
    if (!PurchaseOrderModel.isEditable(po.status)) {
      throw { status: 409, message: 'Cannot edit submitted or approved PO' };
    }

    const id = uuid();
    await runAsync(
      `INSERT INTO line_items (id, po_id, product_id, product_name, quantity, expected_price, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, po_id, product_id || null, product_name, quantity, expected_price, new Date().toISOString()]
    );

    logger.info('Line item added', { id, po_id, product_name, quantity });
    return { id, po_id, product_id, product_name, quantity, expected_price };
  }

  async getPO(po_id: string): Promise<PurchaseOrder> {
    const po = await getAsync('SELECT * FROM purchase_orders WHERE id = ?', [po_id]);
    if (!po) throw { status: 404, message: 'PO not found' };

    const lineItems = await allAsync('SELECT * FROM line_items WHERE po_id = ?', [po_id]);
    const approval = await getAsync('SELECT * FROM approvals WHERE po_id = ?', [po_id]);
    const statusHistory = await allAsync('SELECT * FROM status_history WHERE po_id = ?', [po_id]);

    return {
      ...po,
      total_amount: PurchaseOrderModel.calculateTotal(lineItems),
      metadata: po.metadata ? JSON.parse(po.metadata) : {},
      line_items: lineItems,
      approval: approval || null,
      status_history: statusHistory,
    };
  }

  async submitPO(po_id: string, idempotency_key: string): Promise<PurchaseOrder> {
    const po = await this.getPO(po_id);

    if (po.status !== PurchaseOrderStatus.Draft) {
      throw { status: 409, message: 'Only Draft POs can be submitted' };
    }

    const lineItems = await allAsync('SELECT * FROM line_items WHERE po_id = ?', [po_id]);
    const total = PurchaseOrderModel.calculateTotal(lineItems);

    // Update metadata with idempotency key
    const metadata = { ...po.metadata, idempotency_key };
    const now = new Date().toISOString();

    // Transition to Submitted
    await runAsync(
      `UPDATE purchase_orders SET status = ?, total_amount = ?, metadata = ?, updated_at = ? WHERE id = ?`,
      [PurchaseOrderStatus.Submitted, total, JSON.stringify(metadata), now, po_id]
    );

    // Record status history
    await runAsync(
      `INSERT INTO status_history (id, po_id, from_status, to_status, changed_by, timestamp, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), po_id, PurchaseOrderStatus.Draft, PurchaseOrderStatus.Submitted, po.buyer_id, now, 'PO submitted by buyer']
    );

    // Check if approval needed (total > $10,000)
    if (total > 10000) {
      await runAsync(
        `INSERT INTO approvals (id, po_id, approver_id, decision, timestamp)
         VALUES (?, ?, ?, ?, ?)`,
        [uuid(), po_id, 'manager-001', 'pending', now]
      );
    }

    // Create notification for supplier
    await runAsync(
      `INSERT INTO notifications (id, po_id, recipient, type, status, timestamp, retry_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), po_id, 'supplier@example.com', 'submitted', 'pending', now, 0]
    );

    logger.info('PO submitted', { po_id, total, approval_required: total > 10000 });
    return this.getPO(po_id);
  }
}
