export interface LineItem {
  id: string;
  po_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  expected_price: number;
  line_total: number;
}
