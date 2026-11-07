import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  RefreshCw,
  Server,
  Layers,
  Terminal,
} from 'lucide-react';
import { MetricStrip, MetricItemProps } from '../../components/common/MetricStrip';

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
  const [selectedNodeId, setSelectedNodeId] = useState<string>('mongos-router');

  const fetchTopology = async () => {
    try {
      setRefreshing(true);
      const res = await api.get<TopologyData>('/cluster/topology');
      setData(res);
      if (res.nodes && res.nodes.length > 0 && !selectedNodeId) {
        setSelectedNodeId(res.nodes[0].id);
      }
    } catch {
      // Handled by API interceptor
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

  const selectedNode = data?.nodes.find((n) => n.id === selectedNodeId) || data?.nodes[0];

  const metricItems: MetricItemProps[] = [
    {
      label: 'Query Router',
      value: 'Port 27017',
      subText: 'Mongos Routing Gateway',
      status: 'info',
    },
    {
      label: 'Config Server',
      value: 'Port 27019',
      subText: 'configsvr (configReplSet)',
      status: 'neutral',
    },
    {
      label: 'Shard 1 (Zone HN)',
      value: 'Port 27018',
      subText: 'vattu-shard1 (shard1ReplSet)',
      status: 'success',
    },
    {
      label: 'Shard 2 (Zone HCM)',
      value: 'Port 27020',
      subText: 'vattu-shard2 (shard2ReplSet)',
      status: 'success',
    },
    {
      label: 'Kiến Trúc Phân Mảnh',
      value: 'Zone Sharding',
      subText: 'Range-based Locality',
      status: 'neutral',
    },
  ];

  return (
    <div className="space-y-3 font-sans">
      {/* 1. Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
            MODULE 11
          </span>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">
            Kiến Trúc Cụm Phân Tán (Cluster Topology)
          </h1>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            cluster: "{data?.clusterName || 'distributed-material-cluster'}"
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Topology:</span>
            <strong className="text-slate-800">ShardedCluster (2 Shards)</strong>
          </div>

          <button
            onClick={fetchTopology}
            disabled={refreshing}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors cursor-pointer"
            title="Kiểm tra kết nối toàn bộ nodes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Ping Cụm</span>
          </button>
        </div>
      </div>

      {/* 2. Telemetry Metric Strip */}
      <MetricStrip items={metricItems} />

      {/* 3. Compact Architecture Flow Pipeline */}
      <div className="p-3 bg-white border border-slate-200 rounded-md">
        <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
          <span>Luồng Định Tuyến Dữ Liệu (Data Locality Pipeline)</span>
          <span className="text-slate-400 font-normal">Bấm vào node để xem chi tiết thông số</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center text-xs font-mono">
          {/* Client Application */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">CLIENT LAYER</div>
            <div className="font-bold text-slate-900 mt-0.5">Frontend + NestJS</div>
            <div className="text-[10px] text-slate-400">Port 5000 / 3000</div>
          </div>

          {/* Router */}
          <div
            onClick={() => setSelectedNodeId('mongos-router')}
            className={`p-2.5 border rounded cursor-pointer transition-colors text-center ${
              selectedNodeId === 'mongos-router'
                ? 'bg-blue-50/70 border-blue-400 text-blue-900 ring-1 ring-blue-300'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ROUTER (MONGOS)
            </div>
            <div className="font-bold text-slate-900 mt-0.5">vattu-mongos:27017</div>
            <div className="text-[10px] text-slate-500">Targeted Query Engine</div>
          </div>

          {/* Config Server */}
          <div
            onClick={() => setSelectedNodeId('config-server')}
            className={`p-2.5 border rounded cursor-pointer transition-colors text-center ${
              selectedNodeId === 'config-server'
                ? 'bg-purple-50/70 border-purple-400 text-purple-900 ring-1 ring-purple-300'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-purple-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              CONFIG METADATA
            </div>
            <div className="font-bold text-slate-900 mt-0.5">configsvr:27019</div>
            <div className="text-[10px] text-slate-500">Chunk & Zone Ranges</div>
          </div>

          {/* Shards Stack */}
          <div className="flex flex-col gap-1.5">
            <div
              onClick={() => setSelectedNodeId('shard-01-hn')}
              className={`p-1.5 border rounded cursor-pointer transition-colors flex items-center justify-between ${
                selectedNodeId === 'shard-01-hn'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-[11px]">Shard 1 (HN)</span>
              </div>
              <span className="text-[10px] text-slate-500">Port 27018</span>
            </div>

            <div
              onClick={() => setSelectedNodeId('shard-02-hcm')}
              className={`p-1.5 border rounded cursor-pointer transition-colors flex items-center justify-between ${
                selectedNodeId === 'shard-02-hcm'
                  ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-[11px]">Shard 2 (HCM)</span>
              </div>
              <span className="text-[10px] text-slate-500">Port 27020</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. High-Density Node Status Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">
              Bảng Trạng Thái Các Nút Phân Tán (Cluster Nodes Status)
            </h2>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            {data?.nodes?.length || 0} nodes online
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-36 font-mono">Node ID</th>
                <th className="w-36">Vai Trò (Role)</th>
                <th className="w-40 font-mono">Container Name</th>
                <th className="num w-24">Port</th>
                <th className="w-36 font-mono">Replica Set</th>
                <th className="w-32">Zone Tag</th>
                <th className="num w-24">Latency</th>
                <th className="w-24 text-center">Trạng Thái</th>
                <th className="w-20 text-right pr-3">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.nodes?.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <tr
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="font-mono font-semibold text-blue-700">
                      {node.name}
                    </td>
                    <td>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        {node.role}
                      </span>
                    </td>
                    <td className="font-mono text-slate-700 text-xs">
                      {node.containerName}
                    </td>
                    <td className="num font-semibold text-slate-900">
                      {node.port}
                    </td>
                    <td className="font-mono text-xs text-slate-600">
                      {node.replicaSet || '---'}
                    </td>
                    <td>
                      {node.zone ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {node.zone} ({node.region})
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">GLOBAL</span>
                      )}
                    </td>
                    <td className="num font-bold text-emerald-700">
                      {node.latencyMs} ms
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {node.status}
                      </span>
                    </td>
                    <td className="text-right pr-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeId(node.id);
                        }}
                        className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Node Inspector Terminal / Technical Spec & Sharding Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Node Detail Spec */}
        <div className="bg-slate-950 border border-slate-800 rounded-md p-3 text-xs font-mono text-slate-300">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
            <div className="flex items-center gap-2 text-slate-200">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">Node Telemetry: {selectedNode?.name}</span>
            </div>
            <span className="text-emerald-400 font-semibold">{selectedNode?.status}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 py-2.5 text-[11px]">
            <div>
              <span className="text-slate-500">Container Host:</span>{' '}
              <strong className="text-white">{selectedNode?.containerName}</strong>
            </div>
            <div>
              <span className="text-slate-500">Internal Port:</span>{' '}
              <strong className="text-emerald-400">{selectedNode?.port}</strong>
            </div>
            <div>
              <span className="text-slate-500">Cluster Role:</span>{' '}
              <strong className="text-blue-400">{selectedNode?.role}</strong>
            </div>
            <div>
              <span className="text-slate-500">Network Latency:</span>{' '}
              <strong className="text-white">{selectedNode?.latencyMs} ms</strong>
            </div>
            {selectedNode?.replicaSet && (
              <div>
                <span className="text-slate-500">Replica Set:</span>{' '}
                <strong className="text-purple-400">{selectedNode?.replicaSet}</strong>
              </div>
            )}
            {selectedNode?.zone && (
              <div>
                <span className="text-slate-500">Assigned Zone:</span>{' '}
                <strong className="text-amber-400">{selectedNode?.zone} ({selectedNode?.region})</strong>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            <span className="text-slate-500">Mô tả tác vụ:</span> {selectedNode?.description}
          </div>
        </div>

        {/* Sharding Catalog & Key Strategy */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col justify-between">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">
                Chính Sách Phân Mảnh Dữ Liệu (Catalog Rules)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Zone Ranges</span>
          </div>

          <div className="p-3 space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                Sharded Collections (Zone Sharding Theo Chi Nhánh)
              </span>
              <div className="space-y-1 font-mono text-xs">
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                  <span className="font-bold text-slate-900">inventory_stocks</span>
                  <code className="text-blue-700 text-[11px]">&#123; warehouse_branch: 1, material_code: 1 &#125;</code>
                </div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                  <span className="font-bold text-slate-900">goods_receipts</span>
                  <code className="text-blue-700 text-[11px]">&#123; warehouse_branch: 1, receipt_code: 1 &#125;</code>
                </div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                  <span className="font-bold text-slate-900">goods_issues</span>
                  <code className="text-blue-700 text-[11px]">&#123; warehouse_branch: 1, issue_code: 1 &#125;</code>
                </div>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                Global Reference Collections (Unsharded - Primary Shard 1)
              </span>
              <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                {['materials', 'material_categories', 'warehouses', 'suppliers', 'users'].map((col) => (
                  <span key={col} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
