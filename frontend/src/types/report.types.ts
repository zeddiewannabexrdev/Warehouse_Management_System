export interface SupplierProcurementStat {
  supplier_code: string;
  company_name: string;
  branch: string;
  total_receipt_value: number;
  total_items_count: number;
  total_quantity_received: number;
}

export interface BranchSpendingFacet {
  _id: string;
  order_count: number;
  total_spend: number;
  avg_order_value: number;
}

export interface OrderStatusFacet {
  _id: string;
  total_orders: number;
  total_value: number;
}

export interface LowStockAlertStat {
  warehouse_branch: string;
  warehouse_code: string;
  material_code: string;
  material_name: string;
  standard_price: number;
  current_quantity: number;
  min_threshold: number;
  deficit: number;
  unit: string;
  warning_level: string;
  estimated_restock_cost: number;
}

export interface ProjectConsumptionStat {
  project_code: string;
  project_name: string;
  branch: string;
  allocated_budget: number;
  issue_vouchers_count: number;
  total_quantity_issued: number;
  estimated_material_cost: number;
}

export interface DistributedAnalyticsResponse {
  routing_telemetry: {
    execution_mode: 'TARGETED_AGGREGATION' | 'DISTRIBUTED_SHARD_MERGE_FACET';
    selected_branch: string;
    shards_involved: string[];
    winning_plan_stage: string;
    execution_time_ms: number;
    optimization_note: string;
  };
  supplier_procurement: SupplierProcurementStat[];
  procurement_facet: {
    spending_by_branch: BranchSpendingFacet[];
    order_status_summary: OrderStatusFacet[];
  };
  low_stock_alerts: LowStockAlertStat[];
  project_consumption: ProjectConsumptionStat[];
}

export interface InventoryValuationRecord {
  _id: string;
  valuation_code: string;
  period: string;
  warehouse_branch: 'HN' | 'HCM' | 'DN';
  shard_node?: string;
  total_stock_value: number;
  valuation_method: 'FIFO' | 'WEIGHTED_AVERAGE' | 'SPECIFIC_IDENTIFICATION';
  created_at: string;
}

export interface ItemValuationBreakdown {
  warehouse_branch: string;
  warehouse_code: string;
  shard_node: string;
  material_code: string;
  material_name: string;
  category_code: string;
  unit: string;
  quantity: number;
  available_quantity: number;
  allocated_quantity: number;
  applied_unit_price: number;
  standard_price: number;
  valuation_method: 'FIFO' | 'WEIGHTED_AVERAGE' | 'SPECIFIC_IDENTIFICATION';
  total_value: number;
}

export interface ValuationsResponse {
  selected_method: 'FIFO' | 'WEIGHTED_AVERAGE' | 'SPECIFIC_IDENTIFICATION';
  grand_total_value: number;
  branch_summary: {
    branch: string;
    shard_node: string;
    item_count: number;
    total_quantity: number;
    total_stock_value: number;
  }[];
  valuation_history: InventoryValuationRecord[];
  item_breakdown: ItemValuationBreakdown[];
}

export interface CalculateValuationPayload {
  valuation_code?: string;
  period: string;
  warehouse_branch: 'HN' | 'HCM' | 'DN';
  valuation_method: 'FIFO' | 'WEIGHTED_AVERAGE' | 'SPECIFIC_IDENTIFICATION';
}
