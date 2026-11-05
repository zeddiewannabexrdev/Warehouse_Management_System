export type StockAlert = 'URGENT' | 'LOW' | 'OVER' | 'OK';

export interface StockRow {
  warehouse_branch: string;
  warehouse_code: string;
  material_code: string;
  material_name?: string;
  quantity: number;
  allocated_quantity: number;
  available_quantity: number;
  min_threshold: number;
  max_threshold?: number;
  unit?: string;
  alert: StockAlert;
  stock_value: number;
}

export interface StockSummary {
  total_items: number;
  total_value: number;
  urgent: number;
  low: number;
  over: number;
  by_branch: { branch: string; items: number; value: number }[];
}
