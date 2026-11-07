import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  RefreshCw,
  Database,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { MetricStrip, MetricItemProps } from '../../components/common/MetricStrip';
import { formatNumber } from '../../lib/utils';

interface ShardInfo {
  shardId: string;
  shardName: string;
  zoneTag: string;
  port: number;
  branch: string;
  documentCount: number;
  percentage: number;
  dataSizeKb: number;
  chunksCount: number;
  status: string;
}

interface DistributionResponse {
  collection: string;
  totalDocuments: number;
  totalEstimatedSizeKb: number;
  shards: ShardInfo[];
  distributionByCollection: Record<string, any>;
  balancerState: string;
}

export const ShardDistributionPage: React.FC = () => {
  const [data, setData] = useState<DistributionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCol, setSelectedCol] = useState<string>('inventory_stocks');

  const fetchDistribution = async (colName: string) => {
    try {
      setRefreshing(true);
      const res = await api.get<DistributionResponse>('/cluster/distribution', {
        params: { collection: colName },
      });
      setData(res);
    } catch {
      // Handled by API interceptor
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDistribution(selectedCol);
  }, [selectedCol]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner label="Đang tải dữ liệu phân bổ Shard..." />
      </div>
    );
  }

  const shard1 = data?.shards.find((s) => s.shardId === 'shard1');
  const shard2 = data?.shards.find((s) => s.shardId === 'shard2');

  const chartData = [
    {
      name: 'Shard 1 (Zone HN)',
      documents: shard1?.documentCount || 0,
      sizeKb: shard1?.dataSizeKb || 0,
      fill: '#0f766e',
    },
    {
      name: 'Shard 2 (Zone HCM)',
      documents: shard2?.documentCount || 0,
      sizeKb: shard2?.dataSizeKb || 0,
      fill: '#d97706',
    },
  ];

  const metricItems: MetricItemProps[] = [
    {
      label: 'Tổng số Documents',
      value: formatNumber(data?.totalDocuments || 0),
      subText: `Collection ${selectedCol}`,
      status: 'neutral',
    },
    {
      label: 'Dung Lượng Ước Tính',
      value: `${formatNumber(data?.totalEstimatedSizeKb || 0)} KB`,
      subText: '~520 bytes / doc',
      status: 'neutral',
    },
    {
      label: 'Shard 1 (Zone HN)',
      value: `${formatNumber(shard1?.documentCount || 0)} docs`,
      subText: `${shard1?.percentage || 0}% toàn cụm (Port 27018)`,
      status: 'success',
    },
    {
      label: 'Shard 2 (Zone HCM)',
      value: `${formatNumber(shard2?.documentCount || 0)} docs`,
      subText: `${shard2?.percentage || 0}% toàn cụm (Port 27020)`,
      status: 'warning',
    },
    {
      label: 'Balancer State',
      value: data?.balancerState || 'BALANCED',
      subText: 'Không có Chunk migration',
      status: 'info',
    },
  ];

  return (
    <div className="space-y-3 font-sans">
      {/* 1. Top Bar Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
            MODULE 13
          </span>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">
            Phân Bổ Dữ Liệu Shard (Data Distribution)
          </h1>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            getShardDistribution()
          </span>
        </div>

        {/* Toolbar: Collection Picker & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded px-2 py-1 text-xs">
            <span className="text-[11px] text-slate-500 mr-1.5 font-mono">Collection:</span>
            <select
              value={selectedCol}
              onChange={(e) => setSelectedCol(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="inventory_stocks">inventory_stocks (Tồn kho)</option>
              <option value="goods_receipts">goods_receipts (Nhập kho)</option>
              <option value="goods_issues">goods_issues (Xuất kho)</option>
            </select>
          </div>

          <button
            onClick={() => fetchDistribution(selectedCol)}
            disabled={refreshing}
            className="p-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded transition-colors cursor-pointer"
            title="Làm mới phân bổ Shard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Telemetry Metric Strip */}
      <MetricStrip items={metricItems} />

      {/* 3. Distribution Ratio Strip (Visual Progress Bar) */}
      <div className="p-3 bg-white border border-slate-200 rounded-md">
        <div className="flex items-center justify-between text-xs font-mono text-slate-600 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            <span>Shard 1 (Zone HN): <strong className="text-slate-900">{shard1?.percentage || 0}%</strong> ({shard1?.documentCount || 0} docs)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Shard 2 (Zone HCM): <strong className="text-slate-900">{shard2?.percentage || 0}%</strong> ({shard2?.documentCount || 0} docs)</span>
          </div>
        </div>

        <div className="w-full h-2 rounded bg-slate-100 overflow-hidden flex">
          <div
            className="h-full bg-teal-600 transition-all duration-500"
            style={{ width: `${shard1?.percentage || 50}%` }}
            title={`Shard 1: ${shard1?.percentage}%`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${shard2?.percentage || 50}%` }}
            title={`Shard 2: ${shard2?.percentage}%`}
          />
        </div>
      </div>

      {/* 4. High-Density Shard Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">
              Bảng Đối Chiếu Phân Bổ Documents & Chunks Từng Node
            </h2>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Source: sh.status() / getShardDistribution()
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-32 font-mono">Shard ID</th>
                <th className="w-48">Tên Node & ReplicaSet</th>
                <th className="w-32">Zone Tag</th>
                <th className="num w-24">Port</th>
                <th className="num w-32">Số Documents</th>
                <th className="num w-28">Tỷ Lệ (%)</th>
                <th className="num w-32">Dung Lượng (KB)</th>
                <th className="num w-28">Số Chunks</th>
                <th className="w-24 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {data?.shards?.map((shard) => (
                <tr key={shard.shardId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="font-mono font-semibold text-blue-700">
                    {shard.shardId}
                  </td>
                  <td className="font-medium text-slate-900">
                    {shard.shardName}
                  </td>
                  <td>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                        shard.zoneTag === 'ZONE_HN'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {shard.zoneTag}
                    </span>
                  </td>
                  <td className="num font-mono">
                    {shard.port}
                  </td>
                  <td className="num font-bold text-slate-900">
                    {formatNumber(shard.documentCount)}
                  </td>
                  <td className="num font-bold text-blue-700">
                    {shard.percentage}%
                  </td>
                  <td className="num text-slate-600">
                    {formatNumber(shard.dataSizeKb)} KB
                  </td>
                  <td className="num font-mono font-semibold text-slate-800">
                    {shard.chunksCount} chunks
                  </td>
                  <td className="text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {shard.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Compact Telemetry Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-md p-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 text-xs">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-900">
              Trực Quan Dung Lượng Documents Theo Shard
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">Đơn vị: Bản ghi</span>
        </div>

        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                formatter={(val: number) => [`${val} bản ghi`, 'Số lượng']}
                contentStyle={{
                  backgroundColor: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '11px',
                }}
              />
              <Bar dataKey="documents" radius={[3, 3, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
