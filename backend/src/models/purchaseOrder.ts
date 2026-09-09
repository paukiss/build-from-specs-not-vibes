export type POStatus = 'Draft' | 'Submitted' | 'Approved' | 'Fulfilled' | 'Cancelled';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  branch_id: string;
  buyer_id: string;
  supplier_id: string;
  currency: string;
  total_amount: number;
  status: POStatus;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}
