export interface FulfillmentRecord {
  id: string;
  line_item_id: string;
  quantity_fulfilled: number;
  timestamp: string;
  reference_document?: string;
}
