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
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
              Module B10
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Cụm Đang Hoạt Động
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            Kiến Trúc Cụm Phân Tán (Cluster Topology)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Trực quan hóa cấu trúc vật lý MongoDB Sharded Cluster gồm Mongos Router, Config Server Replica Set và 2 Zone Shards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTopology}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Kiểm tra kết nối
          </button>
        </div>
      </div>

      {/* Cluster Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Query Router</span>
            <Network className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-800">Mongos : 27017</div>
          <p className="text-xs text-slate-500 mt-1">100% Client Request qua cổng này</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Config Server</span>
            <Database className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-800">configsvr : 27019</div>
          <p className="text-xs text-slate-500 mt-1">Replica Set lưu Metadata & Chunks</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Shard 1 (Zone HN)</span>
            <Server className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-800">vattu-shard1 : 27018</div>
          <p className="text-xs text-emerald-600 font-medium mt-1">Tổng kho Miền Bắc (Hà Nội)</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Shard 2 (Zone HCM)</span>
            <Server className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-800">vattu-shard2 : 27020</div>
          <p className="text-xs text-amber-600 font-medium mt-1">Tổng kho Miền Nam (TP.HCM)</p>
        </div>
      </div>

      {/* Visual Cluster Topology Diagram */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Sơ Đồ Luồng Định Tuyến Cụm Phân Tán</h2>
            <p className="text-sm text-slate-500">Nhấp vào từng node để xem thông số kỹ thuật chi tiết</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            Định tuyến Shard Key tự động qua Range Tag
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Client & Router Column */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                UI
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Client Web Application</h3>
              <p className="text-xs text-slate-500 mt-0.5">Frontend React + Backend NestJS Gateway</p>
            </div>

            <div className="flex justify-center text-slate-400">
              <ArrowRight className="w-5 h-5 rotate-90" />
            </div>

            {/* Mongos Router Card */}
            {routerNode && (
              <div
                onClick={() => setSelectedNode(routerNode)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedNode?.id === routerNode.id
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
                    : 'border-slate-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700">
                    Router
                  </span>
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE
                  </span>
                </div>
                <h4 className="font-bold text-slate-900">{routerNode.name}</h4>
                <div className="text-xs text-slate-500 mt-1">Cổng: <span className="font-semibold text-slate-700">{routerNode.port}</span></div>
                <div className="text-xs text-slate-500">Container: <span className="font-mono text-slate-700">{routerNode.containerName}</span></div>
              </div>
            )}
          </div>

          {/* Connectors & Config Server Column */}
          <div className="flex flex-col items-center justify-center space-y-4">
            {configNode && (
              <div
                onClick={() => setSelectedNode(configNode)}
                className={`w-full p-4 rounded-xl border cursor-pointer transition ${
                  selectedNode?.id === configNode.id
                    ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-200'
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-700">
                    Metadata Catalog
                  </span>
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE
                  </span>
                </div>
                <h4 className="font-bold text-slate-900">{configNode.name}</h4>
                <div className="text-xs text-slate-500 mt-1">Cổng: <span className="font-semibold text-slate-700">{configNode.port}</span></div>
                <div className="text-xs text-slate-500">Replica Set: <span className="font-semibold text-slate-700">{configNode.replicaSet}</span></div>
                <p className="text-xs text-slate-500 mt-2 italic">Cung cấp bảng định tuyến chunks cho Router</p>
              </div>
            )}
          </div>

          {/* Shard Nodes Column */}
          <div className="space-y-4">
            {/* Shard 1 Card */}
            {shard1Node && (
              <div
                onClick={() => setSelectedNode(shard1Node)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedNode?.id === shard1Node.id
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200'
                    : 'border-slate-200 hover:border-emerald-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">
                    ZONE_HN (Miền Bắc)
                  </span>
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE
                  </span>
                </div>
                <h4 className="font-bold text-slate-900">{shard1Node.name}</h4>
                <div className="text-xs text-slate-500 mt-1">Cổng: <span className="font-semibold text-slate-700">{shard1Node.port}</span></div>
                <div className="text-xs text-slate-500">Container: <span className="font-mono text-slate-700">{shard1Node.containerName}</span></div>
                <div className="text-xs text-emerald-700 font-medium mt-1">Shard Key Range: warehouse_branch = "HN"</div>
              </div>
            )}

            {/* Shard 2 Card */}
            {shard2Node && (
              <div
                onClick={() => setSelectedNode(shard2Node)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedNode?.id === shard2Node.id
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-200'
                    : 'border-slate-200 hover:border-amber-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                    ZONE_HCM (Miền Nam)
                  </span>
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE
                  </span>
                </div>
                <h4 className="font-bold text-slate-900">{shard2Node.name}</h4>
                <div className="text-xs text-slate-500 mt-1">Cổng: <span className="font-semibold text-slate-700">{shard2Node.port}</span></div>
                <div className="text-xs text-slate-500">Container: <span className="font-mono text-slate-700">{shard2Node.containerName}</span></div>
                <div className="text-xs text-amber-700 font-medium mt-1">Shard Key Range: warehouse_branch = "HCM"</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Node Details & Sharding Policy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Node Technical Spec */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800">Thông Số Kỹ Thuật Node Đang Chọn</h3>
          </div>
          {selectedNode ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Tên Node:</span>
                <span className="font-semibold text-slate-800">{selectedNode.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Vai trò (Role):</span>
                <span className="font-semibold text-blue-600">{selectedNode.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Cổng Dịch Vụ:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedNode.port}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Container Tương Ứng:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedNode.containerName}</span>
              </div>
              {selectedNode.replicaSet && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Replica Set:</span>
                  <span className="font-semibold text-purple-600">{selectedNode.replicaSet}</span>
                </div>
              )}
              {selectedNode.zone && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Zone Gán:</span>
                  <span className="font-semibold text-emerald-600">{selectedNode.zone} ({selectedNode.region})</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Độ Trễ Phản Hồi:</span>
                <span className="font-semibold text-slate-800">{selectedNode.latencyMs} ms</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Mô tả chức năng:</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Chọn một node trên sơ đồ để xem thông số.</p>
          )}
        </div>

        {/* Sharding Policies */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">Chính Sách Phân Mảnh Dữ Liệu</h3>
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Bộ sưu tập phân mảnh (Sharded Collections - Range/Zone)
              </span>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs">
                  <span className="font-bold text-emerald-900">inventory_stocks</span>
                  <p className="text-emerald-700 mt-0.5">Shard Key: <code>&#123; warehouse_branch: 1, material_code: 1 &#125;</code></p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs">
                  <span className="font-bold text-emerald-900">goods_receipts</span>
                  <p className="text-emerald-700 mt-0.5">Shard Key: <code>&#123; warehouse_branch: 1, receipt_code: 1 &#125;</code></p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs">
                  <span className="font-bold text-emerald-900">goods_issues</span>
                  <p className="text-emerald-700 mt-0.5">Shard Key: <code>&#123; warehouse_branch: 1, issue_code: 1 &#125;</code></p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Bộ sưu tập toàn cục (Global Unsharded Collections)
              </span>
              <div className="flex flex-wrap gap-2">
                {['materials', 'material_categories', 'warehouses', 'suppliers', 'users'].map((c) => (
                  <span key={c} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-medium">
                    {c}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Lưu trữ tập trung tại Primary Shard (Shard 1), được đồng bộ truy vấn dùng chung cho cả 2 miền.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
