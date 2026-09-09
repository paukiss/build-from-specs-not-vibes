import { createPurchaseOrder, findPurchaseOrderById } from '../repos/purchaseOrderRepo';
import { PurchaseOrder } from '../models/purchaseOrder';
import { sendNotification } from '../notifications/nodemailerStub';

export async function createDraft(po: PurchaseOrder) {
  // compute totals should be done by caller; keep simple here
  return createPurchaseOrder(po);
}

export async function submitPO(poId: string) {
  const po = await findPurchaseOrderById(poId);
  if (!po) throw new Error('PO not found');
  if (po.status !== 'Draft') throw new Error('Only Draft POs can be submitted');
  // Update status in DB (left as exercise) and send notification
  await sendNotification(po.supplier_id, `PO ${po.po_number} submitted`, `PO ${po.po_number} was submitted.`);
  return { ok: true };
}
