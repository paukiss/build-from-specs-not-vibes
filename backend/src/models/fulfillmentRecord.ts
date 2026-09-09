export interface FulfillmentRecord {
  id: string;
  line_item_id: string;
  quantity_fulfilled: number;
  timestamp: Date;
  reference_document?: string;
  notes?: string;
}
