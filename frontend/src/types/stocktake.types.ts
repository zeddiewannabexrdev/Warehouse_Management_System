export interface StocktakeVarianceItem {
  material_code: string;
  material_name?: string;
  unit?: string;
  standard_price?: number;
  system_qty: number;
  actual_qty: number;
  variance: number;
  variance_value?: number;
  explanation: string;
}

export interface StocktakeRecord {
  _id: string;
  stocktake_code: string;
  warehouse_branch: 'HN' | 'HCM' | 'DN';
  warehouse_code: string;
  check_date: string;
  auditor: string;
  shard_node?: string;
  items: StocktakeVarianceItem[];
  status: 'BALANCED' | 'DISCREPANCY_FOUND' | 'ADJUSTED';
}

export interface StocktakeListResponse {
  routing_stats: {
    routing_type: 'SINGLE_SHARD_TARGETED' | 'SCATTER_GATHER_GLOBAL';
    executing_shard: string;
    shards_contacted: number;
    execution_time_ms: number;
    winning_stage: string;
    description: string;
  };
  summary: {
    total_stocktakes: number;
    balanced_count: number;
    discrepancy_count: number;
    adjusted_count: number;
  };
  items: StocktakeRecord[];
}

export interface BranchStockSnapshotItem {
  material_code: string;
  material_name: string;
  category_code: string;
  unit: string;
  standard_price: number;
  system_qty: number;
  allocated_quantity: number;
  available_quantity: number;
  min_threshold: number;
  location_code: string;
  last_updated?: string;
}

export interface BranchStockSnapshotResponse {
  branch: string;
  warehouse_code: string;
  shard_target: string;
  execution_time_ms: number;
  winning_stage: string;
  snapshot_timestamp: string;
  items: BranchStockSnapshotItem[];
}

export interface MaterialBatchRecord {
  _id: string;
  batch_number: string;
  material_code: string;
  material_name: string;
  mfg_date: string;
  exp_date: string | null;
  co_cq_number: string;
  origin_country: string;
  inspection_status: 'PASSED' | 'PENDING_QC' | 'REJECTED';
}

export interface QualityInspectionRecord {
  _id: string;
  inspection_code: string;
  material_code: string;
  material_name: string;
  batch_number: string;
  sample_size: number;
  defect_count: number;
  test_criteria: string[];
  result: 'PASSED' | 'REJECTED' | 'CONDITIONAL_APPROVAL';
  inspector: string;
  inspected_date: string;
}

export interface SubmitStocktakePayload {
  stocktake_code?: string;
  warehouse_branch: 'HN' | 'HCM' | 'DN';
  warehouse_code?: string;
  auditor?: string;
  items: {
    material_code: string;
    actual_qty: number;
    explanation?: string;
  }[];
}
