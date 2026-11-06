import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Network,
  Server,
  Database,
  RefreshCw,
  CheckCircle2,
  Layers,
  ArrowRight,
  Cpu,
  Radio,
} from 'lucide-react';

interface TopologyNode {
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

interface TopologyData {
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
}

export const ClusterTopologyPage: React.FC = () => {
  const [data, setData] = useState<TopologyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

  const fetchTopology = async () => {
    try {
      setRefreshing(true);
      const res = await api.get<TopologyData>('/cluster/topology');
      setData(res);
      if (res.nodes && res.nodes.length > 0 && !selectedNode) {
        setSelectedNode(res.nodes[0]);
      }
    } catch {
      // Handled by api error toast
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTopology();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner label="Đang kiểm tra kết nối cụm phân tán..." />
      </div>
    );
  }

  const routerNode = data?.nodes.find((n) => n.role === 'QUERY_ROUTER');
  const configNode = data?.nodes.find((n) => n.role === 'CONFIG_SERVER');
  const shard1Node = data?.nodes.find((n) => n.id === 'shard-01-hn');
  const shard2Node = data?.nodes.find((n) => n.id === 'shard-02-hcm');

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Kiến Trúc Cụm Phân Tán (Cluster Topology)
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cụm Đang Hoạt Động
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mô hình phân mảnh ngang đa vùng: Mongos Router (Port 27017), Config Server (Port 27019) và 2 Zone Shards vật lý.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTopology}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Kiểm tra kết nối
          </button>
        </div>
      </div>

      {/* Cluster Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Query Router</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-800">Mongos : 27017</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Tiếp nhận và điều phối 100% request</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Config Server</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-800">configsvr : 27019</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Lưu trữ Metadata & Bảng Chunks</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Shard 1 (Zone HN)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-800">vattu-shard1 : 27018</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Tổng kho Miền Bắc (Hà Nội)</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Shard 2 (Zone HCM)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-800">vattu-shard2 : 27020</div>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5">Tổng kho Miền Nam (TP.HCM)</p>
        </div>
      </div>

      {/* Visual Cluster Topology Flow */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Sơ Đồ Luồng Định Tuyến Cụm Phân Tán</h2>
            <p className="text-xs text-slate-500 mt-0.5">Chọn từng node để xem chi tiết thông số kỹ thuật</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            Range-based Zone Sharding
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Client & Router Column */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                APP
              </div>
              <h3 className="font-bold text-slate-800 text-xs">Client Web Application</h3>
              <p className="text-[11px] text-slate-500">React Frontend + NestJS Gateway (Port 5000)</p>
            </div>

            <div className="flex justify-center text-slate-300">
              <ArrowRight className="w-4 h-4 rotate-90" />
            </div>

            {/* Mongos Router Node */}
            {routerNode && (
              <div
                onClick={() => setSelectedNode(routerNode)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedNode?.id === routerNode.id
                    ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">
                    ROUTER
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> ONLINE
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{routerNode.name}</h4>
                <div className="text-xs text-slate-500 mt-1">Cổng dịch vụ: <span className="font-semibold text-slate-800">{routerNode.port}</span></div>
                <div className="text-xs text-slate-500">Container: <span className="font-mono text-slate-700">{routerNode.containerName}</span></div>
              </div>
            )}
          </div>

          {/* Config Server Column */}
          <div className="flex flex-col justify-center">
            {configNode && (
              <div
                onClick={() => setSelectedNode(configNode)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedNode?.id === configNode.id
                    ? 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-100'
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700">
                    METADATA CATALOG
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> ONLINE
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{configNode.name}</h4>
                <div className="text-xs text-slate-500 mt-1">Cổng dịch vụ: <span className="font-semibold text-slate-800">{configNode.port}</span></div>
                <div className="text-xs text-slate-500">Replica Set: <span className="font-semibold text-slate-700">{configNode.replicaSet}</span></div>
                <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg">Cung cấp bảng định tuyến Chunks và quy tắc Zone Tags cho Router</p>
              </div>
            )}
          </div>

          {/* Shard Nodes Column */}
          <div className="flex flex-col justify-between space-y-4">
            {/* Shard 1 Card */}
            {shard1Node && (
              <div
                onClick={() => setSelectedNode(shard1Node)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedNode?.id === shard1Node.id
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-100'
                    : 'border-slate-200 hover:border-emerald-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                    ZONE_HN (Miền Bắc)
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> ONLINE
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{shard1Node.name}</h4>
                <div className="text-xs text-slate-500 mt-1">Cổng: <span className="font-semibold text-slate-800">{shard1Node.port}</span> | Host: <span className="font-mono text-slate-700">{shard1Node.containerName}</span></div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">Shard Key: warehouse_branch = "HN"</div>
              </div>
            )}

            {/* Shard 2 Card */}
            {shard2Node && (
              <div
                onClick={() => setSelectedNode(shard2Node)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedNode?.id === shard2Node.id
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-100'
                    : 'border-slate-200 hover:border-amber-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                    ZONE_HCM (Miền Nam)
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> ONLINE
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{shard2Node.name}</h4>
                <div className="text-xs text-slate-500 mt-1">Cổng: <span className="font-semibold text-slate-800">{shard2Node.port}</span> | Host: <span className="font-mono text-slate-700">{shard2Node.containerName}</span></div>
                <div className="text-[11px] text-amber-700 font-medium mt-1">Shard Key: warehouse_branch = "HCM"</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Node Details & Sharding Policy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Node Technical Spec */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Thông Số Kỹ Thuật Node Đang Chọn</h3>
          </div>
          {selectedNode ? (
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tên Node:</span>
                <span className="font-semibold text-slate-800">{selectedNode.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Vai trò (Role):</span>
                <span className="font-semibold text-blue-600">{selectedNode.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Cổng Dịch Vụ:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedNode.port}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Container:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedNode.containerName}</span>
              </div>
              {selectedNode.replicaSet && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Replica Set:</span>
                  <span className="font-semibold text-purple-600">{selectedNode.replicaSet}</span>
                </div>
              )}
              {selectedNode.zone && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Zone Gán:</span>
                  <span className="font-semibold text-emerald-600">{selectedNode.zone} ({selectedNode.region})</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Độ Trễ Phản Hồi:</span>
                <span className="font-semibold text-slate-800">{selectedNode.latencyMs} ms</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Mô tả chức năng:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Chọn một node trên sơ đồ để xem thông số.</p>
          )}
        </div>

        {/* Sharding Policies */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Chính Sách Phân Mảnh Dữ Liệu</h3>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Bộ sưu tập phân mảnh ngang (Sharded Collections - Range/Zone)
              </span>
              <div className="space-y-1.5">
                <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs">
                  <span className="font-bold text-emerald-900">inventory_stocks</span>
                  <span className="text-emerald-700 text-[11px] ml-2">Shard Key: <code>&#123; warehouse_branch: 1, material_code: 1 &#125;</code></span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs">
                  <span className="font-bold text-emerald-900">goods_receipts</span>
                  <span className="text-emerald-700 text-[11px] ml-2">Shard Key: <code>&#123; warehouse_branch: 1, receipt_code: 1 &#125;</code></span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs">
                  <span className="font-bold text-emerald-900">goods_issues</span>
                  <span className="text-emerald-700 text-[11px] ml-2">Shard Key: <code>&#123; warehouse_branch: 1, issue_code: 1 &#125;</code></span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Bộ sưu tập toàn cục (Global Unsharded Collections)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['materials', 'material_categories', 'warehouses', 'suppliers', 'users'].map((c) => (
                  <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono">
                    {c}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Lưu trữ tập trung tại Primary Shard (Shard 1), được đồng bộ truy vấn dùng chung cho cả 2 miền.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
