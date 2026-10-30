import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface DashboardOverviewResponse {
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
  lowStockAlerts: any[];
  recentActivities: any[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly dbService: DatabaseService) {}

  async getOverview(selectedBranch?: string): Promise<DashboardOverviewResponse> {
    const isHealthy = await this.dbService.isHealthy();
    const dbName = this.dbService.getDb().databaseName;

    if (!isHealthy) {
      return {
        connection: {
          status: 'DISCONNECTED',
          database: dbName,
          isShardedCluster: false,
          activeNodes: [],
        },
        metrics: {
          totalMaterials: 0,
          totalWarehouses: 0,
          totalStockItems: 0,
          lowStockAlertsCount: 0,
          pendingReceiptsCount: 0,
          pendingIssuesCount: 0,
        },
        branchComparison: [],
        lowStockAlerts: [],
        recentActivities: [],
      };
    }

    const db = this.dbService.getDb();

    let totalMaterials = 0;
    let totalWarehouses = 0;
    let totalStockItems = 0;
    let lowStockAlertsCount = 0;
    let pendingReceiptsCount = 0;
    let pendingIssuesCount = 0;

    try {
      totalMaterials = await db.collection('materials').countDocuments();
      totalWarehouses = await db.collection('warehouses').countDocuments();

      const stockBranchFilter = selectedBranch && selectedBranch !== 'ALL'
        ? { warehouse_branch: selectedBranch }
        : {};

      totalStockItems = await db.collection('inventory_stocks').countDocuments(stockBranchFilter);

      lowStockAlertsCount = await db.collection('inventory_stocks').countDocuments({
        ...stockBranchFilter,
        $expr: { $lte: ['$quantity', '$min_threshold'] },
      });

      pendingReceiptsCount = await db.collection('goods_receipts').countDocuments({
        ...(selectedBranch && selectedBranch !== 'ALL' ? { warehouse_branch: selectedBranch } : {}),
        status: 'PENDING',
      });

      pendingIssuesCount = await db.collection('goods_issues').countDocuments({
        ...(selectedBranch && selectedBranch !== 'ALL' ? { warehouse_branch: selectedBranch } : {}),
        status: 'APPROVED',
      });
    } catch {}

    let branchComparison: any[] = [];
    try {
      branchComparison = await db
        .collection('inventory_stocks')
        .aggregate([
          {
            $group: {
              _id: '$warehouse_branch',
              stockItemCount: { $sum: 1 },
              totalQuantity: { $sum: '$quantity' },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray();

      branchComparison = branchComparison.map((item) => ({
        branch: item._id,
        branchName:
          item._id === 'HN'
            ? 'Tổng kho Miền Bắc (Hà Nội)'
            : item._id === 'HCM'
            ? 'Tổng kho Miền Nam (TP.HCM)'
            : 'Kho Miền Trung (Đà Nẵng)',
        shardTarget: item._id === 'HN' ? 'Shard 1 (ZONE_HN)' : item._id === 'HCM' ? 'Shard 2 (ZONE_HCM)' : 'Primary Shard',
        stockItemCount: item.stockItemCount,
        totalQuantity: item.totalQuantity,
      }));
    } catch {
      branchComparison = [];
    }

    let lowStockAlerts: any[] = [];
    try {
      const matchFilter: any = {
        $expr: { $lte: ['$quantity', '$min_threshold'] },
      };
      if (selectedBranch && selectedBranch !== 'ALL') {
        matchFilter.warehouse_branch = selectedBranch;
      }

      lowStockAlerts = await db
        .collection('inventory_stocks')
        .aggregate([
          { $match: matchFilter },
          {
            $lookup: {
              from: 'materials',
              localField: 'material_code',
              foreignField: 'material_code',
              as: 'materialInfo',
            },
          },
          { $unwind: { path: '$materialInfo', preserveNullAndEmptyArrays: true } },
          { $limit: 5 },
          {
            $project: {
              _id: 0,
              material_code: 1,
              material_name: '$materialInfo.name',
              warehouse_branch: 1,
              warehouse_code: 1,
              quantity: 1,
              min_threshold: 1,
              unit: 1,
            },
          },
        ])
        .toArray();
    } catch {
      lowStockAlerts = [];
    }

    let recentActivities: any[] = [];
    try {
      recentActivities = await db
        .collection('material_audit_logs')
        .find({})
        .sort({ timestamp: -1 })
        .limit(6)
        .toArray();
    } catch {
      recentActivities = [];
    }

    return {
      connection: {
        status: 'CONNECTED',
        database: dbName,
        isShardedCluster: true,
        activeNodes: ['router:27017', 'configsvr:27019', 'shard1:27018', 'shard2:27020'],
      },
      metrics: {
        totalMaterials,
        totalWarehouses,
        totalStockItems,
        lowStockAlertsCount,
        pendingReceiptsCount,
        pendingIssuesCount,
      },
      branchComparison,
      lowStockAlerts,
      recentActivities,
    };
  }
}
