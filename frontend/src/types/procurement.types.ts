export interface SupplierContract {
  _id?: string;
  contract_code: string;
  supplier_id: string;
  start_date: string;
  end_date: string;
  contract_value: number;
  payment_terms?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
}

export interface SupplierEvaluation {
  _id?: string;
  supplier_id: string;
  period: string;
  quality_score: number;
  delivery_score: number;
  overall_score: number;
  comments?: string;
  evaluated_at?: string;
}

export interface Supplier {
  _id: string;
  supplier_code: string;
  company_name: string;
  tax_id: string;
  phone: string;
  email: string;
  address?: string;
  rating_score: number;
  active_contracts_count?: number;
  total_contract_value?: number;
  latest_evaluation?: SupplierEvaluation;
  contracts?: SupplierContract[];
  evaluations?: SupplierEvaluation[];
  created_at?: string;
}

export interface PurchaseOrderItem {
  material_code: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface PurchaseOrder {
  _id: string;
  po_code: string;
  supplier_id: string;
  warehouse_branch: 'HN' | 'HCM' | 'DN';
  order_date: string;
  expected_delivery_date?: string;
  total_amount: number;
  items: PurchaseOrderItem[];
  status: 'DRAFT' | 'APPROVED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  created_by?: string;
  created_at?: string;
  supplier_info?: {
    supplier_code: string;
    company_name: string;
    phone?: string;
    email?: string;
  };
}

export interface RoutingStats {
  routing_type: 'SINGLE_SHARD_TARGETED' | 'SCATTER_GATHER_BROADCAST';
  actual_shards_queried: string[];
  execution_time_ms: number;
  total_docs_examined: number;
  is_sharded: boolean;
  shard_key_used: string | null;
}

export interface PurchaseOrderListResponse {
  success: boolean;
  routing_stats: RoutingStats;
  total: number;
  items: PurchaseOrder[];
}

export interface SpendBySupplier {
  _id: string;
  supplier_code: string;
  company_name: string;
  total_orders: number;
  total_spend: number;
}

export interface StatusBreakdown {
  _id: string;
  count: number;
  total_value: number;
}

export interface BranchBreakdown {
  _id: string;
  count: number;
  total_value: number;
}

export interface ProcurementAnalytics {
  summary: {
    total_suppliers: number;
    total_active_contracts: number;
    grand_total_spend: number;
  };
  spend_by_supplier: SpendBySupplier[];
  status_breakdown: StatusBreakdown[];
  branch_breakdown: BranchBreakdown[];
}

export interface CreateSupplierPayload {
  supplier_code: string;
  company_name: string;
  tax_id: string;
  phone: string;
  email: string;
  address?: string;
  rating_score?: number;
}

export interface CreatePOPayload {
  po_code?: string;
  supplier_id: string;
  warehouse_branch: 'HN' | 'HCM' | 'DN';
  expected_delivery_date?: string;
  items: {
    material_code: string;
    quantity: number;
    unit_price: number;
  }[];
}

