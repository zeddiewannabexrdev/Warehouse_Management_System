import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Boxes,
  Layers,
  Warehouse,
  Truck,
  ArrowLeftRight,
  ClipboardList,
  Network,
  Server,
  Cpu,
  FileCode2,
  Shuffle,
  ShieldCheck,
  History,
  Users,
  Settings,
  Database,
  ArrowLeft,
  Terminal,
  CheckCircle2,
} from 'lucide-react';

interface ModuleConfig {
  title: string;
  subsystem: 'WMS' | 'DISTRIBUTED' | 'ADMIN';
  icon: React.ComponentType<{ className?: string }>;
  collectionName: string;
  isSharded: boolean;
  shardKey?: string;
  distributedTechnique: string;
  description: string;
  plannedEndpoints: string[];
}

const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  '/materials': {
    title: 'Danh mục Vật tư & Lược đồ Đa hình',
    subsystem: 'WMS',
    icon: Layers,
    collectionName: 'materials (Unsharded / Global)',
    isSharded: false,
    distributedTechnique: 'Global Catalog Management trên Primary Shard & Full-Text Search',
    description:
      'Quản lý danh mục hơn 1.000 chủng loại vật tư công nghiệp với cấu trúc Polymorphic Schema linh hoạt theo thông số kỹ thuật (specifications).',
    plannedEndpoints: [
      'GET /api/v1/materials (Search & Pagination)',
      'POST /api/v1/materials (Create Polymorphic Document)',
      'GET /api/v1/materials/search?keyword=... (Full-Text Search Index)',
    ],
  },
  '/warehouses': {
    title: 'Tổng kho & Vị trí Lưu trữ Ô kệ',
    subsystem: 'WMS',
    icon: Warehouse,
    collectionName: 'warehouses, storage_locations',
    isSharded: false,
    distributedTechnique: 'Chi nhánh hóa hạ tầng vật lý (Zone HN & Zone HCM)',
    description:
      'Quản lý mặt bằng kho bãi 2D layout, sơ đồ dãy kệ (Aisle), tầng kệ (Rack) và ngăn chứa (Bin) kèm hạn mức tải trọng max_weight_kg.',
    plannedEndpoints: [
      'GET /api/v1/warehouses (Danh sách kho theo chi nhánh)',
      'GET /api/v1/warehouses/:code/locations (Sơ đồ ô kệ)',
    ],
  },
  '/inventory': {
    title: 'Quản trị Tồn kho Khả dụng (Inventory Stocks)',
    subsystem: 'WMS',
    icon: Boxes,
    collectionName: 'inventory_stocks (Sharded Collection)',
    isSharded: true,
    shardKey: '{ warehouse_branch: 1, material_code: 1 }',
    distributedTechnique: 'Horizontal Range Sharding & Geo-Zone Tagging (ZONE_HN / ZONE_HCM)',
    description:
      'Lưu trữ số lượng tồn kho khả dụng, phân bổ cho công trình và tự động kích hoạt cảnh báo khi chạm ngưỡng tối thiểu min_threshold.',
    plannedEndpoints: [
      'GET /api/v1/inventory/stocks?branch=HN (Targeted Query)',
      'GET /api/v1/inventory/low-stock (Aggregation Alert Pipeline)',
      'POST /api/v1/inventory/reserve (Giữ chỗ cấp phát)',
    ],
  },
  '/goods-receipts': {
    title: 'Phiếu Nhập kho Vật tư (Goods Receipts)',
    subsystem: 'WMS',
    icon: Truck,
    collectionName: 'goods_receipts (Sharded Collection)',
    isSharded: true,
    shardKey: '{ warehouse_branch: 1, receipt_code: 1 }',
    distributedTechnique: 'Zone Sharding — Tự động định tuyến phiếu nhập về Shard vùng miền tương ứng',
    description:
      'Ghi nhận vật tư nhập về kho kèm số lô, hạn dùng, đơn giá và kết quả nghiệm thu chất lượng KCS đầu vào.',
    plannedEndpoints: [
      'GET /api/v1/goods-receipts (Lọc theo chi nhánh)',
      'POST /api/v1/goods-receipts (Tạo phiếu & Tăng tồn kho trong Transaction)',
    ],
  },
  '/goods-issues': {
    title: 'Phiếu Xuất kho & Cấp phát Công trình (Goods Issues)',
    subsystem: 'WMS',
    icon: Truck,
    collectionName: 'goods_issues (Sharded Collection)',
    isSharded: true,
    shardKey: '{ warehouse_branch: 1, issue_code: 1 }',
    distributedTechnique: 'Distributed Multi-document ACID Transaction với Majority Write Concern',
    description:
      'Xuất cấp phát vật tư thi công cho công trình: tự động trừ tồn kho khả dụng, tạo phiếu xuất và ghi nhật ký kiểm toán nguyên tử.',
    plannedEndpoints: [
      'POST /api/v1/goods-issues (Execute Distributed ACID Transaction)',
      'GET /api/v1/goods-issues/:code (Chi tiết phiếu xuất)',
    ],
  },
  '/stock-transfers': {
    title: 'Điều phối & Luân chuyển Liên kho (Stock Transfers)',
    subsystem: 'WMS',
    icon: ArrowLeftRight,
    collectionName: 'stock_transfers',
    isSharded: false,
    distributedTechnique: 'Cross-Zone Data Coordination & Trạng thái In-Transit liên Shard',
    description:
      'Điều phối hàng nghìn tấn thép, xi măng luân chuyển từ Tổng kho Miền Bắc (Shard 1) sang Tổng kho Miền Nam (Shard 2).',
    plannedEndpoints: [
      'POST /api/v1/stock-transfers/dispatch (Xuất điều chuyển từ Shard nguồn)',
      'POST /api/v1/stock-transfers/receive (Nhập kho ghi nhận tại Shard đích)',
    ],
  },
  '/stocktakes': {
    title: 'Kiểm kê Kho & Đối soát Thực tế (Stocktakes)',
    subsystem: 'WMS',
    icon: ClipboardList,
    collectionName: 'stocktakes',
    isSharded: false,
    distributedTechnique: 'Data Reconciliation & Điều chỉnh số dư tồn kho đồng nhất',
    description:
      'Lập biên bản đối soát số lượng tồn trên phần mềm so với kiểm đếm thực tế tại ô kệ và lập bút toán cân đối kho.',
    plannedEndpoints: [
      'POST /api/v1/stocktakes/submit (Nạp kết quả đếm thực tế)',
      'POST /api/v1/stocktakes/reconcile (Duyệt điều chỉnh tồn kho)',
    ],
  },
  '/cluster-topology': {
    title: 'Trực quan hóa Cụm Phân tán (Cluster Topology)',
    subsystem: 'DISTRIBUTED',
    icon: Network,
    collectionName: 'config.shards, config.databases',
    isSharded: false,
    distributedTechnique: 'Sharded Cluster Architecture Visualizer (Mongos -> ConfigSvr, Shard 1, Shard 2)',
    description:
      'Mô hình hóa trực quan luồng dữ liệu từ Client qua Mongos Query Router (27017) tới Shard 1 (HN 27018) và Shard 2 (HCM 27020).',
    plannedEndpoints: [
      'GET /api/v1/cluster/topology (Trạng thái sống/chết của từng Replica node)',
      'GET /api/v1/cluster/shards (Danh sách Shards và Zone Tags gán kèm)',
    ],
  },
  '/shard-distribution': {
    title: 'Phân tích Phân bổ Dữ liệu (Shard Distribution)',
    subsystem: 'DISTRIBUTED',
    icon: Server,
    collectionName: 'inventory_stocks, goods_receipts',
    isSharded: true,
    distributedTechnique: 'getShardDistribution() Analytics & Chunk Size Monitoring',
    description:
      'Theo dõi tỷ lệ phần trăm phân bổ document, dung lượng GB và số lượng Chunks trên từng Shard vật lý.',
    plannedEndpoints: [
      'GET /api/v1/cluster/distribution?collection=inventory_stocks (Live stats)',
    ],
  },
  '/query-analyzer': {
    title: 'Phân tích Định tuyến Truy vấn (Query Routing Analyzer)',
    subsystem: 'DISTRIBUTED',
    icon: Cpu,
    collectionName: 'Tất cả Sharded Collections',
    isSharded: true,
    distributedTechnique: 'Targeted Query (Single Shard) vs Scatter-Gather Query (Broadcast Merge)',
    description:
      'Sandbox thực nghiệm: So sánh thời gian phản hồi (latency) và chi phí mạng khi truy vấn có Shard Key vs không có Shard Key.',
    plannedEndpoints: [
      'POST /api/v1/cluster/explain (Chạy câu lệnh và trả về cây JSON explain plan)',
    ],
  },
  '/explain-plan': {
    title: 'Chi tiết Cây Thực thi Explain Execution Plan',
    subsystem: 'DISTRIBUTED',
    icon: FileCode2,
    collectionName: 'System Explain Engine',
    isSharded: true,
    distributedTechnique: 'Explain Plan Visualization (Stage: SINGLE_SHARD vs SHARD_MERGE)',
    description:
      'Trực quan hóa cây quyết định của bộ tối ưu hóa truy vấn MongoDB (Query Optimizer) dưới dạng sơ đồ cây trực quan.',
    plannedEndpoints: [
      'POST /api/v1/cluster/explain-visualize',
    ],
  },
  '/distributed-transactions': {
    title: 'Mô phỏng Giao dịch Phân tán ACID (Distributed Transactions)',
    subsystem: 'DISTRIBUTED',
    icon: Shuffle,
    collectionName: 'goods_issues, inventory_stocks, material_audit_logs',
    isSharded: true,
    distributedTechnique: 'Distributed Multi-document Two-Phase Commit & Rollback Mechanism',
    description:
      'Thực nghiệm trực tiếp: Demo commit giao dịch xuất kho thành công vs Cố tình kích hoạt lỗi thiếu hàng để xem hệ thống rollback an toàn.',
    plannedEndpoints: [
      'POST /api/v1/cluster/demo-transaction (Kịch bản thành công / thất bại)',
    ],
  },
  '/zone-sharding-lab': {
    title: 'Phòng Thí nghiệm Zone Sharding (Zone Sharding Lab)',
    subsystem: 'DISTRIBUTED',
    icon: Database,
    collectionName: 'goods_receipts, inventory_stocks',
    isSharded: true,
    shardKey: '{ warehouse_branch: 1, ... }',
    distributedTechnique: 'Geo-affinity & Locality of Reference (ZONE_HN -> Shard 1, ZONE_HCM -> Shard 2)',
    description:
      'Nạp dữ liệu mới theo từng chi nhánh và sử dụng công cụ kiểm tra document vật lý trên cổng 27018 và 27020.',
    plannedEndpoints: [
      'POST /api/v1/cluster/test-zone-route',
      'GET /api/v1/cluster/inspect-node-storage?docId=...',
    ],
  },
  '/ha-simulator': {
    title: 'Mô phỏng Tính Sẵn sàng cao & Chịu lỗi (High Availability)',
    subsystem: 'DISTRIBUTED',
    icon: ShieldCheck,
    collectionName: 'Replica Sets & Primary/Secondary Election',
    isSharded: true,
    distributedTechnique: 'Fault Tolerance, Automatic Failover, Read Preference & Majority Write Concern',
    description:
      'Đánh giá hành vi của hệ thống khi 1 Shard gặp sự cố: tính cô lập lỗi (Fault Isolation) và khả năng phục vụ độc lập của chi nhánh còn lại.',
    plannedEndpoints: [
      'GET /api/v1/cluster/replica-status',
      'POST /api/v1/cluster/simulate-failover',
    ],
  },
  '/audit-ttl-explorer': {
    title: 'Truy vết Kiểm toán & Cơ chế Tự hủy TTL Index',
    subsystem: 'DISTRIBUTED',
    icon: History,
    collectionName: 'material_audit_logs',
    isSharded: false,
    distributedTechnique: 'MongoDB TTL Index (Time-To-Live background eviction thread sau 365 ngày)',
    description:
      'Xem danh sách nhật ký thay đổi số liệu kho và kiểm tra cấu hình expireAfterSeconds: 31536000 tự động dọn dẹp dữ liệu.',
    plannedEndpoints: [
      'GET /api/v1/audit/logs (Lọc theo actor, hành động, ngày)',
    ],
  },
  '/users': {
    title: 'Quản lý Người dùng & Phân quyền RBAC',
    subsystem: 'ADMIN',
    icon: Users,
    collectionName: 'users (5 Role-based Accounts Initialized)',
    isSharded: false,
    distributedTechnique: 'Multi-Branch Security Boundary & JWT Branch Context',
    description:
      'Quản lý 5 vai trò hệ thống: SUPER_ADMIN, MANAGER_HN, MANAGER_HCM, QC_INSPECTOR, AUDITOR với quyền truy cập dữ liệu theo chi nhánh.',
    plannedEndpoints: [
      'GET /api/v1/users (Danh sách tài khoản)',
      'GET /api/v1/roles (Quy định phân quyền chi tiết)',
    ],
  },
  '/branches': {
    title: 'Cấu hình Chi nhánh & Ánh xạ Vùng phân tán',
    subsystem: 'ADMIN',
    icon: Database,
    collectionName: 'warehouses, config.tags',
    isSharded: false,
    distributedTechnique: 'Branch-to-Shard Mapping (HN -> Shard 1, HCM -> Shard 2, DN -> Primary)',
    description:
      'Cấu hình thông tin chi nhánh vùng miền và ánh xạ tương ứng tới các node MongoDB trong Docker cluster.',
    plannedEndpoints: [
      'GET /api/v1/branches (Danh sách chi nhánh đang kích hoạt)',
    ],
  },
  '/settings': {
    title: 'Thiết lập Chung Hệ thống',
    subsystem: 'ADMIN',
    icon: Settings,
    collectionName: 'System Config',
    isSharded: false,
    distributedTechnique: 'Application Configuration & Environment Variables',
    description:
      'Quản lý thông số kết nối Mongos Router, thời hạn JWT Token, thông báo định mức kho và chính sách sao lưu định kỳ.',
    plannedEndpoints: [
      'GET /api/v1/system/settings',
    ],
  },
};

export const ModulePlaceholderPage: React.FC = () => {
  const location = useLocation();
  const config = MODULE_REGISTRY[location.pathname] || {
    title: 'Phân hệ Đang Phát triển',
    subsystem: 'WMS',
    icon: Database,
    collectionName: 'Chưa xác định',
    isSharded: false,
    distributedTechnique: 'Distributed System Component',
    description: 'Module này nằm trong lộ trình hoàn thiện tiếp theo của đồ án.',
    plannedEndpoints: [],
  };

  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Trở về Dashboard Tổng quan
        </Link>
      </div>

      {/* Main Spec Card */}
      <div className="bg-white rounded border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-slate-100 text-brand-700 flex items-center justify-center border border-slate-200">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">{config.title}</h1>
                <span className="text-[10px] bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded font-mono font-medium">
                  {config.subsystem}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{config.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              SẴN SÀNG TÍCH HỢP (PHASE 2)
            </span>
          </div>
        </div>

        {/* Database & Distributed Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Cơ sở Dữ liệu & Phân mảnh
            </span>
            <div className="space-y-1.5 pt-1">
              <div>
                <span className="text-slate-500">Collection MongoDB:</span>{' '}
                <strong className="text-slate-800 font-mono">{config.collectionName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Trạng thái Sharding:</span>{' '}
                {config.isSharded ? (
                  <span className="font-semibold text-amber-700">SHARDED (Zone-based)</span>
                ) : (
                  <span className="text-slate-600">UNSHARDED (Global Primary)</span>
                )}
              </div>
              {config.shardKey && (
                <div>
                  <span className="text-slate-500">Compound Shard Key:</span>{' '}
                  <code className="text-brand-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {config.shardKey}
                  </code>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Kỹ thuật Phân tán Minh chứng
            </span>
            <div className="pt-1">
              <div className="font-medium text-slate-800 leading-relaxed">
                {config.distributedTechnique}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Đã chuẩn bị sẵn Schema Validation & Index chuyên sâu trong file{' '}
                <code className="text-slate-700">scripts/01_init_schema_and_indexes.js</code>
              </div>
            </div>
          </div>
        </div>

        {/* Planned REST APIs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <Terminal className="w-4 h-4 text-slate-500" />
            <span>Kế hoạch Endpoints API Chuẩn bị Kết nối:</span>
          </div>

          <div className="space-y-1.5 bg-[#0a111c] p-3 rounded border border-slate-800 font-mono text-xs text-slate-300">
            {config.plannedEndpoints.map((ep, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{ep}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Nền tảng Web Base & Kết nối Mongos Router đã hoàn tất.</span>
          <span>Sẵn sàng viết Business Logic & Giao diện tương ứng.</span>
        </div>
      </div>
    </div>
  );
};
