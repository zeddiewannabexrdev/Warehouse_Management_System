export type BinStatus = 'EMPTY' | 'OCCUPIED' | 'OVERLOAD' | 'MAINTENANCE';

export interface Warehouse {
  warehouse_code: string;
  name: string;
  branch: string;
  address: string;
  manager: string;
  capacity_sqm: number;
  is_active: boolean;
  assignedShard?: string;
  zoneTag?: string;
}

export interface StorageLocation {
  location_code: string;
  warehouse_code: string;
  warehouse_branch: string;
  aisle: string;
  rack: number;
  bin: number;
  max_weight_kg: number;
  occupied_weight_kg: number;
  status: BinStatus;
  is_occupied: boolean;
  current_material_code?: string | null;
  current_quantity?: number | null;
  batch_number?: string | null;
  last_inspected?: string | null;
  material_name?: string;
  unit?: string;
  storage_condition?: string;
}

export interface RoutingAnalysis {
  mode: 'TARGETED_QUERY' | 'SCATTER_GATHER';
  executingShard: string;
  shardsContacted: number;
  executionTimeMs: number;
  winningStage: string;
  description: string;
}

export interface WarehouseMapResponse {
  items: StorageLocation[];
  total: number;
  summary: {
    totalBins: number;
    occupiedCount: number;
    emptyCount: number;
    overloadCount: number;
    maintenanceCount: number;
    occupancyRate: number;
  };
  routing: RoutingAnalysis;
}

export interface AllocateLocationPayload {
  location_code: string;
  warehouse_branch: string;
  material_code: string;
  quantity: number;
  occupied_weight_kg: number;
  batch_number?: string;
}

