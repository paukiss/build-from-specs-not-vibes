import { PurchaseOrderStatus } from './enums';

export interface StatusHistory {
  id: string;
  po_id: string;
  from_status: PurchaseOrderStatus | null;
  to_status: PurchaseOrderStatus;
  changed_by: string;
  timestamp: Date;
  reason?: string;
}
