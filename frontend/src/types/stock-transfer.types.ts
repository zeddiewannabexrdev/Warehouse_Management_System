export interface StockTransferItem {
  material_code: string;
  material_name?: string;
  quantity: number;
  unit: string;
  standard_price?: number;
}

export interface StockTransfer {
  _id: string;
  transfer_code: string;
  from_branch: 'HN' | 'HCM' | 'DN';
  to_branch: 'HN' | 'HCM' | 'DN';
  from_warehouse: string;
  to_warehouse: string;
  transfer_date: string;
  source_shard?: string;
  destination_shard?: string;
  items: StockTransferItem[];
  transport_method: string;
  status: 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
}

export interface CrossZoneRoutingStats {
  routing_type: 'SINGLE_SHARD_TARGETED' | 'SCATTER_GATHER_CROSS_ZONE';
  source_shard: string;
  target_shard: string;
  actual_shards_queried: string[];
  execution_time_ms: number;
  winning_stage: string;
  description: string;
}

export interface CrossShardLane {
  lane: string;
  from_branch: string;
  to_branch: string;
  count: number;
  total_qty: number;
}

export interface BranchStockBrief {
  warehouse_branch: string;
  warehouse_code: string;
  material_code: string;
  material_name: string;
  quantity: number;
  available_quantity: number;
  allocated_quantity: number;
  unit: string;
}

export interface MaterialCatalogBrief {
  material_code: string;
  name: string;
  unit: string;
  standard_price: number;
}

export interface StockTransfersListResponse {
  routing_stats: CrossZoneRoutingStats;
  summary: {
    total_transfers: number;
    in_transit_count: number;
    received_count: number;
    cancelled_count: number;
    cross_shard_lanes: CrossShardLane[];
  };
  branch_stocks: BranchStockBrief[];
  materials_catalog: MaterialCatalogBrief[];
  items: StockTransfer[];
}

export interface TransactionProof {
  transaction_id: string;
  status: 'COMMITTED' | 'ROLLED_BACK';
  read_concern: string;
  write_concern: string;
  participating_shards: string[];
  operations_executed: string[];
  audit_log_code: string;
  committed_at: string;
}

export interface MaterialReturnItem {
  material_code: string;
  material_name?: string;
  quantity: number;
  unit?: string;
  condition?: string;
}

export interface MaterialReturn {
  _id: string;
  return_code: string;
  warehouse_branch: 'HN' | 'HCM' | 'DN';
  warehouse_code: string;
  project_code?: string;
  project_name?: string;
  return_date: string;
  items: MaterialReturnItem[];
  reason: 'EXCESS_MATERIAL' | 'DEFECTIVE' | 'WRONG_SPECIFICATION';
  accepted_by: string;
}

export interface DispatchTransferPayload {
  transfer_code?: string;
  from_branch: 'HN' | 'HCM' | 'DN';
  to_branch: 'HN' | 'HCM' | 'DN';
  from_warehouse?: string;
  to_warehouse?: string;
  transport_method?: string;
  items: {
    material_code: string;
    quantity: number;
    unit?: string;
  }[];
}

export interface CreateReturnPayload {
  return_code?: string;
  warehouse_branch: 'HN' | 'HCM' | 'DN';
  warehouse_code?: string;
  project_code?: string;
  reason: 'EXCESS_MATERIAL' | 'DEFECTIVE' | 'WRONG_SPECIFICATION';
  items: {
    material_code: string;
    quantity: number;
    condition?: string;
  }[];
}
