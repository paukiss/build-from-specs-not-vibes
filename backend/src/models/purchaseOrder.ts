import { PurchaseOrderStatus } from './enums';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  branch_id: string;
  buyer_id: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  total_amount: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
  notes?: string;
}

export class PurchaseOrderModel {
  static isEditable(status: PurchaseOrderStatus): boolean {
    return status === PurchaseOrderStatus.Draft;
  }

  static calculateTotal(lineItems: Array<{ quantity: number; expected_price: number }>): number {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.expected_price), 0);
  }
}
