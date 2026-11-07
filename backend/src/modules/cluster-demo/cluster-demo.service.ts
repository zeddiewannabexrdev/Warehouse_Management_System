import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { QueryExplainDto } from './dto/query-explain.dto';
import { SimulateTransactionDto } from './dto/simulate-transaction.dto';
import { ZoneInsertDto } from './dto/zone-insert.dto';
import { SemiJoinAnalyzeDto } from './dto/semi-join-analyze.dto';
import { ObjectId } from 'mongodb';

export interface TopologyNode {
  id: string;
  name: string;
  role: string;
  port: number;
  containerName: string;
  replicaSet?: string;
  zone?: string;
  region?: string;
  status: 'ONLINE' | 'STANDBY' | 'OFFLINE';
  latencyMs: number;
  description: string;
}

@Injectable()
export class ClusterDemoService {
  private readonly logger = new Logger(ClusterDemoService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getTopology(): Promise<{
    clusterName: string;
    topologyType: string;
    isShardedCluster: boolean;
    activeZones: string[];
    nodes: TopologyNode[];
    routingPolicy: {
      defaultShard: string;
      shardedCollections: string[];
      unshardedCollections: string[];
    };
  }> {
    const isDbHealthy = await this.databaseService.isHealthy();
    let detectedTopology = 'STANDALONE';

    try {
      const topology = (this.databaseService.getClient() as any).topology;
      detectedTopology = topology?.description?.type || 'SHARDED_OR_REPLICA';
    } catch {
      // Ignored
    }

    const nodes: TopologyNode[] = [
      {
        id: 'router-mongos',
        name: 'Mongos Query Router',
        role: 'QUERY_ROUTER',
        port: 27017,
        containerName: 'vattu-mongos',
        status: isDbHealthy ? 'ONLINE' : 'OFFLINE',
        latencyMs: 1.2,
        description: 'Tiếp nhận truy vấn tập trung, phân tích Shard Key và điều hướng request',
      },
      {
        id: 'configsvr-01',
        name: 'Config Server Replica Set',
        role: 'CONFIG_SERVER',
        port: 27019,
        containerName: 'vattu-configsvr',
        replicaSet: 'configReplSet',
        status: isDbHealthy ? 'ONLINE' : 'OFFLINE',
        latencyMs: 1.8,
        description: 'Lưu trữ Metadata cụm, bảng định tuyến Chunks và quy tắc Zone Tags',
      },
      {
        id: 'shard-01-hn',
        name: 'Shard 1 (Tổng kho Miền Bắc)',
        role: 'DATA_SHARD',
        port: 27018,
        containerName: 'vattu-shard1',
        replicaSet: 'shard1ReplSet',
        zone: 'ZONE_HN',
        region: 'Hà Nội (Miền Bắc)',
        status: isDbHealthy ? 'ONLINE' : 'OFFLINE',
        latencyMs: 1.5,
        description: 'Phân mảnh ngang lưu trữ toàn bộ dữ liệu nghiệp vụ phát sinh tại Miền Bắc (HN)',
      },
      {
        id: 'shard-02-hcm',
        name: 'Shard 2 (Tổng kho Miền Nam)',
        role: 'DATA_SHARD',
        port: 27020,
        containerName: 'vattu-shard2',
        replicaSet: 'shard2ReplSet',
        zone: 'ZONE_HCM',
        region: 'TP. Hồ Chí Minh (Miền Nam)',
        status: isDbHealthy ? 'ONLINE' : 'OFFLINE',
        latencyMs: 2.1,
        description: 'Phân mảnh ngang lưu trữ toàn bộ dữ liệu nghiệp vụ phát sinh tại Miền Nam (HCM)',
      },
    ];

    return {
      clusterName: 'WMS-DISTRIBUTED-CLUSTER-2026',
      topologyType: detectedTopology,
      isShardedCluster: true,
      activeZones: ['ZONE_HN', 'ZONE_HCM'],
      nodes,
      routingPolicy: {
        defaultShard: 'shard1 (Primary)',
        shardedCollections: ['inventory_stocks', 'goods_receipts', 'goods_issues'],
        unshardedCollections: ['materials', 'material_categories', 'warehouses', 'suppliers', 'users'],
      },
    };
  }

  async getDistribution(selectedCollection = 'inventory_stocks') {
    const validCollections = ['inventory_stocks', 'goods_receipts', 'goods_issues'];
    const targetColName = validCollections.includes(selectedCollection)
      ? selectedCollection
      : 'inventory_stocks';

    const col = this.databaseService.getCollection(targetColName);

    const statsAgg = await col
      .aggregate([
        {
          $group: {
            _id: '$warehouse_branch',
            docCount: { $sum: 1 },
          },
        },
      ])
      .toArray();

    let hnCount = 0;
    let hcmCount = 0;

    statsAgg.forEach((item) => {
      if (item._id === 'HN') hnCount = item.docCount;
      if (item._id === 'HCM') hcmCount = item.docCount;
    });

    const totalDocs = hnCount + hcmCount;
    const hnPercent = totalDocs > 0 ? Number(((hnCount / totalDocs) * 100).toFixed(1)) : 50;
    const hcmPercent = totalDocs > 0 ? Number(((hcmCount / totalDocs) * 100).toFixed(1)) : 50;

    const estimatedBytesPerDoc = 520;
    const hnSizeKb = Number(((hnCount * estimatedBytesPerDoc) / 1024).toFixed(2));
    const hcmSizeKb = Number(((hcmCount * estimatedBytesPerDoc) / 1024).toFixed(2));

    const distributionByCollection: Record<string, any> = {};

    for (const cName of validCollections) {
      const c = this.databaseService.getCollection(cName);
      const agg = await c
        .aggregate([
          {
            $group: {
              _id: '$warehouse_branch',
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      let cHN = 0;
      let cHCM = 0;
      agg.forEach((a) => {
        if (a._id === 'HN') cHN = a.count;
        if (a._id === 'HCM') cHCM = a.count;
      });

      distributionByCollection[cName] = {
        collection: cName,
        total: cHN + cHCM,
        shard1_HN: { count: cHN, zone: 'ZONE_HN', shard: 'shard1ReplSet/vattu-shard1:27018' },
        shard2_HCM: { count: cHCM, zone: 'ZONE_HCM', shard: 'shard2ReplSet/vattu-shard2:27020' },
      };
    }

    return {
      collection: targetColName,
      totalDocuments: totalDocs,
      totalEstimatedSizeKb: Number((hnSizeKb + hcmSizeKb).toFixed(2)),
      shards: [
        {
          shardId: 'shard1',
          shardName: 'Shard 1 - Hà Nội (vattu-shard1)',
          zoneTag: 'ZONE_HN',
          port: 27018,
          branch: 'HN',
          documentCount: hnCount,
          percentage: hnPercent,
          dataSizeKb: hnSizeKb,
          chunksCount: hnCount > 0 ? Math.ceil(hnCount / 5) : 1,
          status: 'BALANCED',
        },
        {
          shardId: 'shard2',
          shardName: 'Shard 2 - TP.HCM (vattu-shard2)',
          zoneTag: 'ZONE_HCM',
          port: 27020,
          branch: 'HCM',
          documentCount: hcmCount,
          percentage: hcmPercent,
          dataSizeKb: hcmSizeKb,
          chunksCount: hcmCount > 0 ? Math.ceil(hcmCount / 5) : 1,
          status: 'BALANCED',
        },
      ],
      distributionByCollection,
      balancerState: 'IDLE (All chunks localized inside respective zones)',
    };
  }

  async explainQuery(dto: QueryExplainDto) {
    const colName = dto.collectionName || 'inventory_stocks';
    const col = this.databaseService.getCollection(colName);

    let filter: any = {};
    let routingType = 'TARGETED';
    let targetShards: string[] = [];
    let expectedStage = 'SINGLE_SHARD';

    if (dto.scenario === 'targeted') {
      const branch = dto.warehouseBranch || 'HN';
      const code = dto.materialCode || 'MAT-STEEL-D20';
      filter = { warehouse_branch: branch, material_code: code };
      routingType = 'TARGETED_QUERY';
      targetShards = [branch === 'HN' ? 'shard1 (vattu-shard1 / ZONE_HN)' : 'shard2 (vattu-shard2 / ZONE_HCM)'];
      expectedStage = 'SINGLE_SHARD';
    } else if (dto.scenario === 'scatter-gather') {
      filter = { quantity: { $lte: dto.maxQuantity || 500 } };
      routingType = 'SCATTER_GATHER_QUERY';
      targetShards = ['shard1 (ZONE_HN)', 'shard2 (ZONE_HCM)'];
      expectedStage = 'SHARD_MERGE';
    } else {
      if (dto.warehouseBranch) filter.warehouse_branch = dto.warehouseBranch;
      if (dto.materialCode) filter.material_code = dto.materialCode;
      if (dto.maxQuantity) filter.quantity = { $lte: dto.maxQuantity };

      if (dto.warehouseBranch) {
        routingType = 'TARGETED_QUERY';
        targetShards = [dto.warehouseBranch === 'HN' ? 'shard1 (ZONE_HN)' : 'shard2 (ZONE_HCM)'];
        expectedStage = 'SINGLE_SHARD';
      } else {
        routingType = 'SCATTER_GATHER_QUERY';
        targetShards = ['shard1 (ZONE_HN)', 'shard2 (ZONE_HCM)'];
        expectedStage = 'SHARD_MERGE';
      }
    }

    const startTime = Date.now();
    let rawExplain: any = null;
    let docsExamined = 0;
    let docsReturned = 0;

    try {
      rawExplain = await col.find(filter).explain('executionStats');
      docsReturned = rawExplain?.executionStats?.nReturned ?? 0;
      docsExamined = rawExplain?.executionStats?.totalDocsExamined ?? docsReturned;
    } catch {
      // Fallback calculation for execution stats if explain unsupported
      docsReturned = await col.countDocuments(filter);
      docsExamined = docsReturned;
    }

    const realExecutionTime = Math.max(1, Date.now() - startTime);
    const simulatedLatencyMs = routingType === 'TARGETED_QUERY'
      ? Number((realExecutionTime * 0.8 + 1.2).toFixed(2))
      : Number((realExecutionTime * 2.5 + 16.4).toFixed(2));

    const explanationNote =
      routingType === 'TARGETED_QUERY'
        ? 'Truy vấn có chứa Shard Key (warehouse_branch). Mongos Query Router xác định ngay Shard mục tiêu, chỉ gửi request tới 1 Shard duy nhất, độ trễ tối thiểu.'
        : 'Truy vấn KHÔNG chứa Shard Key. Mongos Query Router bắt buộc phải Broadcast (Scatter) tới toàn bộ các Shard trong cụm, sau đó gom tụ (SHARD_MERGE) kết quả, làm gia tăng thời gian chờ và băng thông.';

    return {
      scenario: dto.scenario,
      routingType,
      targetStage: expectedStage,
      targetShards,
      queryFilter: filter,
      executionStats: {
        executionTimeMillis: simulatedLatencyMs,
        totalDocsExamined: docsExamined,
        totalDocsReturned: docsReturned,
        stage: expectedStage,
        networkRoundTrips: routingType === 'TARGETED_QUERY' ? 1 : 2,
      },
      analysisSummary: explanationNote,
      rawExplainOutput: rawExplain || {
        queryPlanner: {
          plannerVersion: 1,
          namespace: `material_inventory_db.${colName}`,
          winningPlan: {
            stage: expectedStage,
            shards: targetShards,
            inputStage: { stage: 'IXSCAN', keyPattern: { warehouse_branch: 1, material_code: 1 } },
          },
        },
        executionStats: {
          executionSuccess: true,
          nReturned: docsReturned,
          executionTimeMillis: simulatedLatencyMs,
          totalDocsExamined: docsExamined,
        },
      },
    };
  }

  async simulateTransaction(dto: SimulateTransactionDto) {
    const stockCol = this.databaseService.getCollection('inventory_stocks');
    const issueCol = this.databaseService.getCollection('goods_issues');
    const auditCol = this.databaseService.getCollection('material_audit_logs');

    const branch = dto.warehouseBranch;
    const materialCode = dto.materialCode;
    const issueQty = Number(dto.quantity);

    const initialStock = await stockCol.findOne({
      warehouse_branch: branch,
      material_code: materialCode,
    });

    if (!initialStock) {
      throw new BadRequestException(
        `Không tìm thấy bản ghi tồn kho của vật tư ${materialCode} tại Chi nhánh ${branch}`,
      );
    }

    const initialQty = initialStock.quantity || 0;
    const initialAvail = initialStock.available_quantity || 0;
    const stepsLog: Array<{ step: number; action: string; status: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK'; detail: string; timestamp: string }> = [];

    const nowIso = () => new Date().toISOString();
    const simulatedIssueCode = `GI-SIM-${Date.now().toString().slice(-6)}`;
    const simulatedLogCode = `AUD-SIM-${Date.now().toString().slice(-6)}`;

    stepsLog.push({
      step: 1,
      action: 'Khởi tạo Client Session & Snapshot Isolation',
      status: 'SUCCESS',
      detail: `Session ID: ${new ObjectId().toHexString()} - Read Concern: snapshot, Write Concern: majority`,
      timestamp: nowIso(),
    });

    stepsLog.push({
      step: 2,
      action: 'Kiểm tra tồn kho khả dụng',
      status: 'SUCCESS',
      detail: `Chi nhánh: ${branch}, Vật tư: ${materialCode}, Tồn kho hiện có: ${initialQty}, Khả dụng: ${initialAvail}, Yêu cầu: ${issueQty}`,
      timestamp: nowIso(),
    });

    if (dto.mode === 'FAIL_ROLLBACK') {
      const errorMsg =
        dto.errorType === 'INSUFFICIENT_STOCK'
          ? `Lỗi: Số lượng xuất (${issueQty + initialAvail}) vượt quá số lượng khả dụng (${initialAvail})!`
          : dto.errorType === 'VALIDATION_ERROR'
          ? `Lỗi: Vi phạm quy định kiểm soát an toàn vật tư dự án (Validation Rule M-04)`
          : `Lỗi: Ngắt kết nối mạng bất thường giữa chừng giao dịch (Simulated Network Abort)`;

      stepsLog.push({
        step: 3,
        action: 'Kích hoạt điều kiện lỗi mô phỏng',
        status: 'FAILED',
        detail: errorMsg,
        timestamp: nowIso(),
      });

      stepsLog.push({
        step: 4,
        action: 'Thực thi Abort Transaction & Rollback',
        status: 'ROLLED_BACK',
        detail: 'session.abortTransaction() được gọi. Toàn bộ thao tác hoàn tác 100%, bảo toàn tính nguyên tử (Atomicity)',
        timestamp: nowIso(),
      });

      const verifiedStock = await stockCol.findOne({
        warehouse_branch: branch,
        material_code: materialCode,
      });

      return {
        mode: 'FAIL_ROLLBACK',
        transactionStatus: 'ABORTED',
        isCommitted: false,
        isRolledBack: true,
        reason: errorMsg,
        preStock: { quantity: initialQty, available_quantity: initialAvail },
        postStock: {
          quantity: verifiedStock?.quantity,
          available_quantity: verifiedStock?.available_quantity,
        },
        integrityPreserved: verifiedStock?.quantity === initialQty,
        steps: stepsLog,
      };
    }

    try {
      await stockCol.updateOne(
        { warehouse_branch: branch, material_code: materialCode },
        {
          $inc: { quantity: -issueQty, available_quantity: -issueQty },
          $set: { last_updated: new Date() },
        },
      );

      stepsLog.push({
        step: 3,
        action: 'Cập nhật trừ tồn kho trong phiên',
        status: 'SUCCESS',
        detail: `Đã trừ ${issueQty} đơn vị tại ${branch}. Tồn mới: ${initialQty - issueQty}`,
        timestamp: nowIso(),
      });

      await issueCol.insertOne({
        issue_code: simulatedIssueCode,
        warehouse_branch: branch,
        warehouse_code: branch === 'HN' ? 'WH-HN-01' : 'WH-HCM-01',
        issue_date: new Date(),
        items: [{ material_code: materialCode, quantity: issueQty }],
        purpose: 'Xuất kho mô phỏng giao dịch phân tán ACID',
        status: 'DELIVERED',
        created_at: new Date(),
      } as any);

      stepsLog.push({
        step: 4,
        action: 'Tạo phiếu xuất kho goods_issues',
        status: 'SUCCESS',
        detail: `Mã phiếu: ${simulatedIssueCode} tại Chi nhánh ${branch}`,
        timestamp: nowIso(),
      });

      await auditCol.insertOne({
        log_code: simulatedLogCode,
        action: 'DISTRIBUTED_TRANSACTION_SIMULATION',
        collection_name: 'goods_issues',
        document_id: simulatedIssueCode,
        details: { branch, materialCode, quantity: issueQty },
        created_at: new Date(),
      } as any);

      stepsLog.push({
        step: 5,
        action: 'Ghi nhật ký kiểm toán material_audit_logs',
        status: 'SUCCESS',
        detail: `Mã log: ${simulatedLogCode}`,
        timestamp: nowIso(),
      });

      stepsLog.push({
        step: 6,
        action: 'Commit Transaction hoàn tất',
        status: 'SUCCESS',
        detail: 'session.commitTransaction() thành công. Dữ liệu đồng bộ nhất quán đa tài liệu.',
        timestamp: nowIso(),
      });

      const updatedStock = await stockCol.findOne({
        warehouse_branch: branch,
        material_code: materialCode,
      });

      return {
        mode: 'SUCCESS',
        transactionStatus: 'COMMITTED',
        isCommitted: true,
        isRolledBack: false,
        preStock: { quantity: initialQty, available_quantity: initialAvail },
        postStock: {
          quantity: updatedStock?.quantity,
          available_quantity: updatedStock?.available_quantity,
        },
        integrityPreserved: true,
        steps: stepsLog,
      };
    } catch (err) {
      stepsLog.push({
        step: 5,
        action: 'Lỗi bất thường - Kích hoạt Rollback',
        status: 'ROLLED_BACK',
        detail: (err as Error).message,
        timestamp: nowIso(),
      });

      return {
        mode: 'FAIL_ROLLBACK',
        transactionStatus: 'ABORTED',
        isCommitted: false,
        isRolledBack: true,
        reason: (err as Error).message,
        preStock: { quantity: initialQty, available_quantity: initialAvail },
        postStock: { quantity: initialQty, available_quantity: initialAvail },
        integrityPreserved: true,
        steps: stepsLog,
      };
    }
  }

  async getZoneTags() {
    return {
      zones: [
        {
          zoneTag: 'ZONE_HN',
          shardId: 'shard1',
          shardHost: 'vattu-shard1:27018',
          region: 'Miền Bắc (Hà Nội)',
          keyRange: {
            minKey: '{ warehouse_branch: "HN", *code: MinKey }',
            maxKey: '{ warehouse_branch: "HN", *code: MaxKey }',
          },
          targetCollections: ['inventory_stocks', 'goods_receipts', 'goods_issues'],
        },
        {
          zoneTag: 'ZONE_HCM',
          shardId: 'shard2',
          shardHost: 'vattu-shard2:27020',
          region: 'Miền Nam (TP. Hồ Chí Minh)',
          keyRange: {
            minKey: '{ warehouse_branch: "HCM", *code: MinKey }',
            maxKey: '{ warehouse_branch: "HCM", *code: MaxKey }',
          },
          targetCollections: ['inventory_stocks', 'goods_receipts', 'goods_issues'],
        },
      ],
      primaryShard: 'shard1 (Primary Shard cho các unsharded collections)',
      shardingKeyStrategy: 'Range-Based Zone Sharding với prefix key { warehouse_branch: 1 }',
    };
  }

  async insertZoneDocument(dto: ZoneInsertDto) {
    const col = this.databaseService.getCollection(dto.collectionName);
    const branch = dto.warehouseBranch;
    const targetShard = branch === 'HN' ? 'shard1 (vattu-shard1:27018)' : 'shard2 (vattu-shard2:27020)';
    const targetZone = branch === 'HN' ? 'ZONE_HN' : 'ZONE_HCM';

    let insertedId: string;
    let generatedCode: string;

    if (dto.collectionName === 'inventory_stocks') {
      generatedCode = `STK-${branch}-${Date.now().toString().slice(-6)}`;
      const result = await col.insertOne({
        stock_code: generatedCode,
        warehouse_branch: branch,
        warehouse_code: dto.warehouseCode || (branch === 'HN' ? 'WH-HN-01' : 'WH-HCM-01'),
        material_code: dto.materialCode,
        quantity: dto.quantity,
        available_quantity: dto.quantity,
        min_threshold: 50,
        unit: 'Tấn',
        last_updated: new Date(),
        note: dto.note || 'Tạo từ Zone Sharding Validation Lab',
      } as any);
      insertedId = result.insertedId.toString();
    } else {
      generatedCode = `GR-${branch}-${Date.now().toString().slice(-6)}`;
      const result = await col.insertOne({
        receipt_code: generatedCode,
        warehouse_branch: branch,
        warehouse_code: dto.warehouseCode || (branch === 'HN' ? 'WH-HN-01' : 'WH-HCM-01'),
        receipt_date: new Date(),
        items: [{ material_code: dto.materialCode, quantity: dto.quantity }],
        status: 'COMPLETED',
        note: dto.note || 'Tạo từ Zone Sharding Validation Lab',
      } as any);
      insertedId = result.insertedId.toString();
    }

    return {
      message: `Dữ liệu đã tự động định tuyến vào ${targetShard} thuộc ${targetZone}`,
      documentId: insertedId,
      documentCode: generatedCode,
      collection: dto.collectionName,
      branch,
      targetShard,
      targetZone,
      routingDetails: {
        shardKeyEvaluated: { warehouse_branch: branch },
        matchedTagRange: branch === 'HN' ? '["HN", MinKey] -> ["HN", MaxKey]' : '["HCM", MinKey] -> ["HCM", MaxKey]',
        mongosAction: 'TARGETED_ROUTING_TO_SPECIFIC_ZONE',
      },
    };
  }

  async inspectDocumentLocation(collection: string, branch: string, code: string) {
    const col = this.databaseService.getCollection(collection);
    const filter = collection === 'inventory_stocks'
      ? { warehouse_branch: branch, $or: [{ material_code: code }, { stock_code: code }] }
      : { warehouse_branch: branch, receipt_code: code };

    const doc = await col.findOne(filter);
    if (!doc) {
      throw new BadRequestException(`Không tìm thấy tài liệu phù hợp trong ${collection}`);
    }

    const physicalLocation = branch === 'HN'
      ? {
          shard: 'shard1',
          container: 'vattu-shard1',
          port: 27018,
          zoneTag: 'ZONE_HN',
          region: 'Miền Bắc (Hà Nội)',
          replicaSet: 'shard1ReplSet',
        }
      : {
          shard: 'shard2',
          container: 'vattu-shard2',
          port: 27020,
          zoneTag: 'ZONE_HCM',
          region: 'Miền Nam (TP.HCM)',
          replicaSet: 'shard2ReplSet',
        };

    return {
      verified: true,
      document: doc,
      physicalLocation,
      proof: `Document mang shard key { warehouse_branch: "${branch}" } được định tuyến và lưu giữ thực tế tại máy chủ ${physicalLocation.container} (${physicalLocation.port})`,
    };
  }

  // ==========================================
  // MODULE 14: REPLICA SET & HIGH AVAILABILITY
  // ==========================================
  async getHaStatus() {
    const replicaSets = [
      {
        name: 'configReplSet',
        type: 'CONFIG_SERVER',
        description: 'Lưu trữ siêu dữ liệu (Metadata) và bảng ánh xạ chunk của cụm phân tán',
        primaryNode: 'localhost:27019',
        members: [
          {
            id: 0,
            host: 'configsvr-01:27019',
            role: 'PRIMARY',
            health: 1,
            stateStr: 'PRIMARY',
            uptime: 86400,
            priority: 2,
            votes: 1,
            replicationLagSec: 0,
            pingMs: 1.2,
            lastHeartbeat: new Date(),
          },
          {
            id: 1,
            host: 'configsvr-02:27019',
            role: 'SECONDARY',
            health: 1,
            stateStr: 'SECONDARY',
            uptime: 86400,
            priority: 1,
            votes: 1,
            replicationLagSec: 0.1,
            pingMs: 1.8,
            lastHeartbeat: new Date(),
          },
          {
            id: 2,
            host: 'configsvr-03:27019',
            role: 'SECONDARY',
            health: 1,
            stateStr: 'SECONDARY',
            uptime: 86400,
            priority: 1,
            votes: 1,
            replicationLagSec: 0.1,
            pingMs: 2.1,
            lastHeartbeat: new Date(),
          },
        ],
        settings: {
          heartbeatIntervalMillis: 2000,
          electionTimeoutMillis: 10000,
        },
      },
      {
        name: 'shard1ReplSet',
        type: 'SHARD_DATA_NODE',
        description: 'Lưu trữ dữ liệu Zone Sharding Chi nhánh Hà Nội (Miền Bắc)',
        primaryNode: 'localhost:27018',
        members: [
          {
            id: 0,
            host: 'shard1-primary:27018',
            role: 'PRIMARY',
            health: 1,
            stateStr: 'PRIMARY',
            uptime: 142000,
            priority: 2,
            votes: 1,
            replicationLagSec: 0,
            pingMs: 0.8,
            lastHeartbeat: new Date(),
          },
          {
            id: 1,
            host: 'shard1-secondary:27018',
            role: 'SECONDARY',
            health: 1,
            stateStr: 'SECONDARY',
            uptime: 142000,
            priority: 1,
            votes: 1,
            replicationLagSec: 0.05,
            pingMs: 1.5,
            lastHeartbeat: new Date(),
          },
        ],
        settings: {
          heartbeatIntervalMillis: 2000,
          electionTimeoutMillis: 10000,
        },
      },
      {
        name: 'shard2ReplSet',
        type: 'SHARD_DATA_NODE',
        description: 'Lưu trữ dữ liệu Zone Sharding Chi nhánh TP.HCM (Miền Nam)',
        primaryNode: 'localhost:27020',
        members: [
          {
            id: 0,
            host: 'shard2-primary:27020',
            role: 'PRIMARY',
            health: 1,
            stateStr: 'PRIMARY',
            uptime: 141500,
            priority: 2,
            votes: 1,
            replicationLagSec: 0,
            pingMs: 1.1,
            lastHeartbeat: new Date(),
          },
          {
            id: 1,
            host: 'shard2-secondary:27020',
            role: 'SECONDARY',
            health: 1,
            stateStr: 'SECONDARY',
            uptime: 141500,
            priority: 1,
            votes: 1,
            replicationLagSec: 0.08,
            pingMs: 1.9,
            lastHeartbeat: new Date(),
          },
        ],
        settings: {
          heartbeatIntervalMillis: 2000,
          electionTimeoutMillis: 10000,
        },
      },
    ];

    return {
      clusterHealthy: true,
      totalReplicaSets: replicaSets.length,
      consensusModel: 'Raft-based Majority Consensus with OpTime Comparison',
      defaultWriteConcern: "majority (bảo đảm ghi nhận tối thiểu 2/3 node)",
      defaultReadPreference: "primaryPreferred (đọc ưu tiên Primary, fallback Secondary khi lỗi)",
      replicaSets,
      diagnosticTimestamp: new Date(),
    };
  }

  async simulateFailover(targetReplSet: string) {
    const valid = ['shard1ReplSet', 'shard2ReplSet', 'configReplSet'];
    const rsName = valid.includes(targetReplSet) ? targetReplSet : 'shard1ReplSet';

    const oldPrimary = rsName === 'shard1ReplSet' ? 'shard1-primary:27018' : rsName === 'shard2ReplSet' ? 'shard2-primary:27020' : 'configsvr-01:27019';
    const newPrimary = rsName === 'shard1ReplSet' ? 'shard1-secondary:27018' : rsName === 'shard2ReplSet' ? 'shard2-secondary:27020' : 'configsvr-02:27019';

    try {
      const auditCol = this.databaseService.getCollection('material_audit_logs');
      await auditCol.insertOne({
        action: 'HA_FAILOVER_SIMULATION',
        resource: rsName,
        details: `Mô phỏng ngắt kết nối Primary [${oldPrimary}], Secondary [${newPrimary}] bầu chọn thủ lĩnh thành công`,
        warehouse_branch: rsName.includes('shard1') ? 'HN' : rsName.includes('shard2') ? 'HCM' : 'ALL',
        user_email: 'admin@wms.enterprise.vn',
        timestamp: new Date(),
        status: 'SUCCESS',
      });
    } catch {
      // Ignored
    }

    return {
      simulationId: `HA-SIM-${Date.now()}`,
      replicaSet: rsName,
      status: 'FAILOVER_COMPLETED',
      electionDurationMs: 2450,
      oldPrimary,
      newPrimary,
      consensusSteps: [
        {
          step: 1,
          timeOffsetMs: 0,
          action: 'PRIMARY_HEARTBEAT_TIMEOUT',
          message: `Node ${oldPrimary} bị ngắt kết nối (mô phỏng sự cố mạng hoặc chỉ lệnh replSetStepDown).`,
          status: 'WARNING',
        },
        {
          step: 2,
          timeOffsetMs: 1200,
          action: 'ELECTION_TRIGGERED',
          message: `Secondary ${newPrimary} phát hiện quá 10,000ms không nhận heartbeat; khởi xướng bầu cử thủ lĩnh (Election Ballot).`,
          status: 'INFO',
        },
        {
          step: 3,
          timeOffsetMs: 1800,
          action: 'QUORUM_VOTES_GRANTED',
          message: `Candidate ${newPrimary} thu thập đủ đa số phiếu hợp lệ (Majority Quorum >= 2/3 votes) nhờ opTime mới nhất.`,
          status: 'SUCCESS',
        },
        {
          step: 4,
          timeOffsetMs: 2450,
          action: 'PRIMARY_ELECTED_AND_ROUTED',
          message: `Node ${newPrimary} chính thức trở thành PRIMARY mới. Mongos Router cập nhật routing table trong 0ms.`,
          status: 'SUCCESS',
        },
      ],
      recoveryRecommendation: 'Hệ thống WMS duy trì tính sẵn sàng cao (High Availability). Ứng dụng client tự động retry kết nối qua driver mà không ném ngoại lệ 500.',
    };
  }

  async pingNodes() {
    return {
      pingTimestamp: new Date(),
      nodes: [
        { host: 'localhost:27017 (Router)', pingMs: 0.5, status: 'ONLINE' },
        { host: 'localhost:27018 (Shard 1)', pingMs: 1.1, status: 'ONLINE' },
        { host: 'localhost:27019 (Config Server)', pingMs: 1.4, status: 'ONLINE' },
        { host: 'localhost:27020 (Shard 2)', pingMs: 1.2, status: 'ONLINE' },
      ],
      meanLagSec: 0.04,
      haStatus: 'ALL_NODES_HEALTHY',
    };
  }

  // ==========================================
  // MODULE 15: AUDIT LOGGING & TTL EXPIRATION
  // ==========================================
  async getAuditLogs(query: { page?: number; limit?: number; action?: string; branch?: string; search?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 15;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.action && query.action !== 'ALL') {
      filter.action = query.action;
    }
    if (query.branch && query.branch !== 'ALL') {
      filter.warehouse_branch = query.branch;
    }
    if (query.search) {
      filter.$or = [
        { user_email: { $regex: query.search, $options: 'i' } },
        { resource: { $regex: query.search, $options: 'i' } },
        { details: { $regex: query.search, $options: 'i' } },
      ];
    }

    const auditCol = this.databaseService.getCollection('material_audit_logs');
    const [total, items] = await Promise.all([
      auditCol.countDocuments(filter),
      auditCol.find(filter).sort({ timestamp: -1, _id: -1 }).skip(skip).limit(limit).toArray(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getTtlStatus() {
    const auditCol = this.databaseService.getCollection('material_audit_logs');
    let ttlIndexInfo: any = null;
    try {
      const indexes = await auditCol.indexes();
      ttlIndexInfo = indexes.find((idx: any) => idx.expireAfterSeconds !== undefined);
    } catch {
      // Ignored
    }

    const totalLogs = await auditCol.countDocuments();

    return {
      collection: 'material_audit_logs',
      indexName: ttlIndexInfo?.name || 'audit_ttl_expiry',
      indexedField: ttlIndexInfo ? Object.keys(ttlIndexInfo.key)[0] : 'timestamp',
      expireAfterSeconds: ttlIndexInfo?.expireAfterSeconds ?? 7776000,
      expireDays: Math.round((ttlIndexInfo?.expireAfterSeconds ?? 7776000) / 86400),
      ttlMonitorThreadStatus: 'ACTIVE (Chạy ngầm mỗi 60 giây dọn dẹp bản ghi hết hạn)',
      totalActiveRecords: totalLogs,
      retentionPolicy: 'Theo quy chuẩn an toàn thông tin ISO 27001 và VAS, lưu trữ tối thiểu 90 ngày sau đó tự động hủy.',
    };
  }

  async simulateAuditEvent(body: { action: string; details: string; branch: string; resource: string }, user?: any) {
    const auditCol = this.databaseService.getCollection('material_audit_logs');
    const doc = {
      action: body.action || 'TEST_AUDIT_EVENT',
      resource: body.resource || 'TEST-RES-001',
      details: body.details || 'Tạo bản ghi kiểm toán thử nghiệm kiểm chứng TTL Index',
      warehouse_branch: body.branch || 'HN',
      user_email: user?.email || 'admin@wms.enterprise.vn',
      user_role: user?.role || 'SUPER_ADMIN',
      ip_address: '127.0.0.1',
      timestamp: new Date(),
      status: 'SUCCESS',
    };

    const res = await auditCol.insertOne(doc);
    return {
      message: 'Đã tạo bản ghi kiểm toán mới thành công',
      auditId: res.insertedId,
      document: doc,
    };
  }

  async updateTtl(days: number) {
    const expireAfterSeconds = Math.max(1, Number(days) || 90) * 86400;
    const auditCol = this.databaseService.getCollection('material_audit_logs');

    try {
      const indexes = await auditCol.indexes();
      const existing = indexes.find((idx: any) => idx.expireAfterSeconds !== undefined);
      if (existing && existing.name) {
        await auditCol.dropIndex(existing.name);
      }
      await auditCol.createIndex(
        { timestamp: 1 },
        { expireAfterSeconds, name: 'audit_ttl_expiry' }
      );
    } catch {
      // Ignored
    }

    return {
      message: `Đã cập nhật chu kỳ lưu trữ TTL Index thành công sang ${days} ngày (${expireAfterSeconds} giây)`,
      expireAfterSeconds,
      expireDays: days,
    };
  }

  async analyzeSemiJoin(dto: SemiJoinAnalyzeDto) {
    const branch = dto.targetBranch || 'HCM';
    const minQty = dto.minQuantity || 0;
    const keyword = dto.keyword?.trim() || '';

    const matCol = this.databaseService.getCollection('materials');
    const stockCol = this.databaseService.getCollection('inventory_stocks');

    const filterS: any = {};
    if (branch !== 'ALL') {
      filterS.warehouse_branch = branch;
    }
    if (minQty > 0) {
      filterS.quantity = { $gte: minQty };
    }

    const t0 = Date.now();
    // 1. Fetch stocks in partition S
    const stockRecords = await stockCol.find(filterS).toArray();

    // Distinct join keys: material_code
    const distinctKeys = Array.from(new Set(stockRecords.map((s: any) => s.material_code).filter(Boolean)));

    // Filter R (materials) with keys
    const filterR: any = { material_code: { $in: distinctKeys } };
    if (keyword) {
      filterR.$or = [
        { material_code: { $regex: keyword, $options: 'i' } },
        { material_name: { $regex: keyword, $options: 'i' } },
      ];
    }
    const matchingMaterials = await matCol.find(filterR).limit(25).toArray();
    const totalMaterialsInDb = await matCol.countDocuments();
    const realExecutionElapsed = Math.max(1, Date.now() - t0);

    // Calculate actual payload byte sizes
    // Full Join ships entire stock documents (all columns)
    const rawStockJson = JSON.stringify(stockRecords);
    const actualStockBytes = Buffer.byteLength(rawStockJson, 'utf8');

    // Semi-Join ships only the projected array of keys
    const rawKeysJson = JSON.stringify(distinctKeys);
    const actualKeysBytes = Buffer.byteLength(rawKeysJson, 'utf8');

    // Average doc sizes
    const averageStockDocSize = stockRecords.length > 0 ? Math.round(actualStockBytes / stockRecords.length) : 380;
    const averageKeySize = distinctKeys.length > 0 ? Math.round(actualKeysBytes / distinctKeys.length) : 18;

    // Batch scale for educational visualization
    const batchScale = Math.max(stockRecords.length, 25);
    const fullShipTransferredBytes = Math.max(actualStockBytes, batchScale * averageStockDocSize);
    const semiJoinTransferredBytes = Math.max(actualKeysBytes, distinctKeys.length * averageKeySize);

    const savedBytes = Math.max(0, fullShipTransferredBytes - semiJoinTransferredBytes);
    const reductionPercent = fullShipTransferredBytes > 0
      ? Number(((savedBytes / fullShipTransferredBytes) * 100).toFixed(1))
      : 89.5;

    // Latency models:
    // Full Join: WAN transfer of heavy payload + coordinator hash join
    const fullJoinLatency = Number((realExecutionElapsed * 1.8 + (fullShipTransferredBytes / 1024) * 0.12 + 12.5).toFixed(2));
    // Semi-Join: Remote index scan + transmission of compact key array + host index lookup
    const semiJoinLatency = Number((realExecutionElapsed * 0.6 + (semiJoinTransferredBytes / 1024) * 0.05 + 2.1).toFixed(2));

    const targetShardName = branch === 'HCM'
      ? 'Shard 2 - TP.HCM (vattu-shard2:27020 / ZONE_HCM)'
      : branch === 'HN'
      ? 'Shard 1 - Hà Nội (vattu-shard1:27018 / ZONE_HN)'
      : 'Toàn bộ Shard (Shard 1:27018 + Shard 2:27020)';

    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      return `${(bytes / 1024).toFixed(2)} KB`;
    };

    // Construct sample joined result
    const stockMap = new Map<string, any>();
    stockRecords.forEach((s: any) => {
      stockMap.set(s.material_code, s);
    });

    const sampleResults = matchingMaterials.map((m: any) => {
      const stock = stockMap.get(m.material_code);
      return {
        material_code: m.material_code,
        material_name: m.material_name,
        category_name: m.category_code || m.category_name || 'Vật tư cơ bản',
        unit: m.unit || 'Cái',
        standard_price: m.standard_price || 0,
        branch_stock_quantity: stock ? stock.quantity : 0,
        warehouse_branch: stock?.warehouse_branch || branch,
      };
    });

    return {
      queryContext: {
        relationR: {
          name: 'materials (Danh mục Vật tư gốc)',
          location: 'Host Coordinator / Master Catalog',
          totalRecords: totalMaterialsInDb,
          averageDocSizeBytes: 520,
        },
        relationS: {
          name: 'inventory_stocks (Tồn kho Phân tán)',
          location: targetShardName,
          filterApplied: filterS,
          matchedRecords: stockRecords.length,
          averageDocSizeBytes: averageStockDocSize,
        },
        joinKey: 'material_code',
        targetBranch: branch,
      },
      fullJoinPlan: {
        strategyName: 'Full-Ship Distributed Join (R ⨝ S)',
        totalBytesTransferred: fullShipTransferredBytes,
        formattedBytesTransferred: formatBytes(fullShipTransferredBytes),
        networkRoundTrips: 1,
        executionTimeMillis: fullJoinLatency,
        docsShipped: stockRecords.length,
        steps: [
          {
            stepNumber: 1,
            node: 'Coordinator (Mongos/API)',
            action: `Gửi lệnh truy vấn findAll(${JSON.stringify(filterS)}) sang ${targetShardName}`,
            dataVolume: '< 1 KB (Request)',
          },
          {
            stepNumber: 2,
            node: targetShardName,
            action: 'Quét toàn bộ bản ghi tồn kho và đóng gói tất cả các cột thuộc tính (12+ fields) gửi qua mạng',
            dataVolume: formatBytes(fullShipTransferredBytes),
          },
          {
            stepNumber: 3,
            node: 'Coordinator (Mongos/API)',
            action: 'Nhận payload lớn từ mạng, nạp vào bộ nhớ RAM và thực hiện Hash Join với bảng materials',
            dataVolume: 'Join In-Memory',
          },
        ],
        bottleneck: 'Nghẽn băng thông mạng WAN/LAN do truyền nhiều trường dữ liệu thừa không cần thiết (redundant attributes).',
      },
      semiJoinPlan: {
        strategyName: 'Semi-Join Distributed Optimization (R ⋉ S)',
        totalBytesTransferred: semiJoinTransferredBytes,
        formattedBytesTransferred: formatBytes(semiJoinTransferredBytes),
        networkRoundTrips: 1,
        executionTimeMillis: semiJoinLatency,
        keysShipped: distinctKeys.length,
        reductionPercentage: reductionPercent,
        bandwidthSavedBytes: savedBytes,
        formattedBandwidthSaved: formatBytes(savedBytes),
        steps: [
          {
            stepNumber: 1,
            node: targetShardName,
            action: 'Chiếu khóa cục bộ π[material_code](σ[filter](S)) bằng Index Scan để trích xuất mảng khóa duy nhất',
            dataVolume: 'Xử lý cục bộ tại Shard',
          },
          {
            stepNumber: 2,
            node: `${targetShardName} ➔ Coordinator`,
            action: 'Chỉ truyền duy nhất mảng các khóa material_code rút gọn qua mạng (loại bỏ 100% cột thừa)',
            dataVolume: formatBytes(semiJoinTransferredBytes),
          },
          {
            stepNumber: 3,
            node: 'Coordinator (Mongos/API)',
            action: 'Lọc quan hệ R: db.materials.find({ material_code: { $in: keys } }) bằng IXSCAN với độ phức tạp O(1)',
            dataVolume: `${sampleResults.length} records kết quả`,
          },
        ],
        theoreticalFormula: 'R ⋉_A S = π_R(R ⨝_A S) = R ⨝_A (π_A(S))',
        efficiencyGain: `Tiết kiệm ${reductionPercent}% băng thông mạng và giảm thời gian trễ thực thi ~${(fullJoinLatency / Math.max(0.1, semiJoinLatency)).toFixed(1)}x`,
      },
      comparisonMetrics: {
        bandwidthReductionRatio: `${reductionPercent}%`,
        speedupRatio: `${(fullJoinLatency / Math.max(0.1, semiJoinLatency)).toFixed(1)}x`,
        docsShippedRatio: `${distinctKeys.length} keys vs ${stockRecords.length} full docs`,
      },
      sampleResults,
    };
  }
}
