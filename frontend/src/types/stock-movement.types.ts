export interface ReceiptItem {
  material_code: string;
  quantity: number;
  unit_price: number;
  unit?: string;
  material_name?: string;
}

export interface GoodsReceipt {
  _id?: string;
  receipt_code: string;
  warehouse_branch: string;
  warehouse_code: string;
  receipt_date: string;
  supplier_id?: string | null;
  supplier_name?: string;
  items: ReceiptItem[];
  total_amount?: number;
  receiver: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED' | string;
  notes?: string;
  created_at?: string;
}

export interface GoodsIssueItem {
  material_code: string;
  quantity: number;
  unit?: string;
  material_name?: string;
}

export interface GoodsIssue {
  _id?: string;
  issue_code: string;
  warehouse_branch: string;
  warehouse_code: string;
  issue_date: string;
  items: GoodsIssueItem[];
  purpose: string;
  issuer: string;
  status: 'DELIVERED' | 'PENDING' | 'CANCELLED' | string;
  created_at?: string;
}

export interface StockMovementListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface MovementOptionsResponse {
  materials: {
    material_code: string;
    name: string;
    unit: string;
    standard_price?: number;
  }[];
  warehouses: {
    warehouse_code: string;
    name: string;
    branch: string;
  }[];
}

export interface CreateReceiptPayload {
  receipt_code: string;
  warehouse_branch: string;
  warehouse_code: string;
  receipt_date: string;
  supplier_id?: string;
  items: {
    material_code: string;
    quantity: number;
    unit_price: number;
  }[];
}

export interface CreateIssuePayload {
  issue_code: string;
  warehouse_branch: string;
  warehouse_code: string;
  issue_date: string;
  material_code: string;
  quantity: number;
  purpose: string;
}
