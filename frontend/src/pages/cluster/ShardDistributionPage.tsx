import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Server,
  RefreshCw,
  PieChart as PieIcon,
  BarChart3,
  Database,
  Layers,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

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

const COLORS = ['#10b981', '#f59e0b', '#3b82f6'];

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
      // Ignored
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
      fill: '#10b981',
    },
    {
      name: 'Shard 2 (Zone HCM)',
      documents: shard2?.documentCount || 0,
      sizeKb: shard2?.dataSizeKb || 0,
      fill: '#f59e0b',
    },
  ];

  const pieData = [
    { name: 'Shard 1 (Hà Nội)', value: shard1?.documentCount || 0 },
    { name: 'Shard 2 (TP.HCM)', value: shard2?.documentCount || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Phân Bổ Dữ Liệu Shard (Data Distribution)
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Balancer: Cân Bằng Dữ Liệu
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kết xuất trực tiếp từ <code>db.collection.getShardDistribution()</code> đo lường tỷ lệ phân bổ documents và chunks giữa 2 Shard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCol}
            onChange={(e) => setSelectedCol(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="inventory_stocks">inventory_stocks (Tồn kho)</option>
            <option value="goods_receipts">goods_receipts (Nhập kho)</option>
            <option value="goods_issues">goods_issues (Xuất kho)</option>
          </select>

          <button
            onClick={() => fetchDistribution(selectedCol)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Tổng Tài Liệu (Docs)</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{data?.totalDocuments || 0}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Collection {selectedCol}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Dung Lượng Ước Tính</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{data?.totalEstimatedSizeKb || 0} KB</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Khoảng 520 bytes / Document</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Shard 1 (Hà Nội)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{shard1?.documentCount || 0} docs</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{shard1?.percentage || 0}% toàn bộ dữ liệu</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Shard 2 (TP.HCM)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{shard2?.documentCount || 0} docs</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{shard2?.percentage || 0}% toàn bộ dữ liệu</p>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Số Lượng Document Từng Shard</h3>
            </div>
            <span className="text-[11px] text-slate-500">Đơn vị: Bản ghi</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [`${val} bản ghi`, 'Số lượng']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="documents" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-slate-800 text-sm">Tỷ Lệ Phân Bổ (%)</h3>
            </div>
            <span className="text-[11px] text-slate-500">Zone HN vs Zone HCM</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => [`${val} bản ghi`, 'Số lượng']} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Shards Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">Bảng Đối Chiếu Chi Tiết Từng Node Shard</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Số liệu thực nghiệm kết xuất từ <code>getShardDistribution()</code></p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Node Shard</th>
                <th className="px-5 py-3">Zone Tag</th>
                <th className="px-5 py-3">Cổng Port</th>
                <th className="px-5 py-3">Số Tài Liệu</th>
                <th className="px-5 py-3">Tỷ Lệ Phân Bổ</th>
                <th className="px-5 py-3">Dung Lượng</th>
                <th className="px-5 py-3">Số Chunks</th>
                <th className="px-5 py-3">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.shards.map((s) => (
                <tr key={s.shardId} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{s.shardName}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      s.zoneTag === 'ZONE_HN' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {s.zoneTag}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-700">{s.port}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{s.documentCount}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{s.percentage}%</td>
                  <td className="px-5 py-3.5 text-slate-600">{s.dataSizeKb} KB</td>
                  <td className="px-5 py-3.5 font-mono text-slate-700">{s.chunksCount} chunks</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
