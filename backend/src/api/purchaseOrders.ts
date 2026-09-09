import express from 'express';
import { createDraft, submitPO } from '../services/purchaseOrderService';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const po = req.body;
    const created = await createDraft(po);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:poId/submit', async (req, res) => {
  try {
    const { poId } = req.params;
    await submitPO(poId);
    res.status(200).json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:poId/fulfillment-history', async (req, res) => {
  try {
    const { poId } = req.params;
    // TODO: query fulfillment records by PO via joins on line_items
    res.status(200).json({ poId, fulfillment_history: [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
