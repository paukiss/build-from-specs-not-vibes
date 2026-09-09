import { ApprovalDecision } from './enums';

export interface Approval {
  id: string;
  po_id: string;
  approver_id: string;
  decision: ApprovalDecision;
  timestamp: Date;
  comment?: string;
}
