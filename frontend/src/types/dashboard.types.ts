export interface DashboardOverview {
  connection: {
    status: 'CONNECTED' | 'DISCONNECTED';
    database: string;
    isShardedCluster: boolean;
    activeNodes: string[];
  };
  metrics: {
    totalMaterials: number;
    totalWarehouses: number;
    totalStockItems: number;
    lowStockAlertsCount: number;
    pendingReceiptsCount: number;
    pendingIssuesCount: number;
  };
  branchComparison: {
    branch: string;
    branchName: string;
    shardTarget: string;
    stockItemCount: number;
    totalQuantity: number;
  }[];
  lowStockAlerts: {
    material_code: string;
    material_name?: string;
    warehouse_branch: string;
    warehouse_code: string;
    quantity: number;
    min_threshold: number;
    unit?: string;
  }[];
  recentActivities: {
    _id?: string;
    log_code: string;
    action: string;
    actor: string;
    collection_name: string;
    document_id: string;
    timestamp: string;
  }[];
}
