export interface LineItem {
  id: string;
  po_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  expected_price: number;
  created_at: Date;
}

export function validateLineItem(quantity: number, expected_price: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Quantity must be a positive integer');
  }
  if (expected_price < 0) {
    throw new Error('Expected price must be non-negative');
  }
}
