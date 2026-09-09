import { Router, Request, Response, NextFunction } from 'express';
import { PurchaseOrderService } from '../services/purchaseOrderService';

const router = Router();
const poService = new PurchaseOrderService();

// Create Draft PO
router.post('/purchase-orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branch_id, buyer_id, supplier_id, currency, notes } = req.body;
    if (!branch_id || !buyer_id || !supplier_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const po = await poService.createPO(branch_id, buyer_id, supplier_id, currency, notes);
    res.status(201).json(po);
  } catch (err) {
    next(err);
  }
});

// Get PO
router.get('/purchase-orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const po = await poService.getPO(req.params.id);
    res.json(po);
  } catch (err) {
    next(err);
  }
});

// Add Line Item
router.post('/purchase-orders/:id/line-items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { product_name, quantity, expected_price, product_id } = req.body;
    if (!product_name || !quantity || expected_price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const lineItem = await poService.addLineItem(req.params.id, product_name, quantity, expected_price, product_id);
    res.status(201).json(lineItem);
  } catch (err) {
    next(err);
  }
});

// Submit PO
router.post('/purchase-orders/:id/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idempotency_key } = req.body;
    if (!idempotency_key) {
      return res.status(400).json({ error: 'idempotency_key required' });
    }
    const po = await poService.submitPO(req.params.id, idempotency_key);
    res.json(po);
  } catch (err) {
    next(err);
  }
});

export default router;
