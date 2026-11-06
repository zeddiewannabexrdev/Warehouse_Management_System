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
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
              Module B10
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Balancer: Cân Bằng Dữ Liệu
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            Phân Bổ Shard Data (Shard Distribution Viewer)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Theo dõi trực quan tỷ lệ phân bổ dữ liệu thực tế giữa Shard 1 (Miền Bắc) và Shard 2 (Miền Nam) theo từng Collection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCol}
            onChange={(e) => setSelectedCol(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="inventory_stocks">Collection: inventory_stocks</option>
            <option value="goods_receipts">Collection: goods_receipts</option>
            <option value="goods_issues">Collection: goods_issues</option>
          </select>

          <button
            onClick={() => fetchDistribution(selectedCol)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Tổng Tài Liệu (Docs)</span>
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data?.totalDocuments || 0}</div>
          <p className="text-xs text-slate-500 mt-1">Trong collection {selectedCol}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Dung Lượng Ước Tính</span>
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data?.totalEstimatedSizeKb || 0} KB</div>
          <p className="text-xs text-slate-500 mt-1">Khoảng 520 bytes / Document</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Shard 1 (Hà Nội)</span>
            <Server className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{shard1?.documentCount || 0} docs</div>
          <p className="text-xs text-slate-500 mt-1">{shard1?.percentage || 0}% toàn bộ dữ liệu</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Shard 2 (TP.HCM)</span>
            <Server className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{shard2?.documentCount || 0} docs</div>
          <p className="text-xs text-slate-500 mt-1">{shard2?.percentage || 0}% toàn bộ dữ liệu</p>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800">Số Lượng Document Từng Shard</h3>
            </div>
            <span className="text-xs text-slate-500">Đơn vị: Bản ghi</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(val: number) => [`${val} bản ghi`, 'Số lượng']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="documents" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-800">Tỷ Lệ Phân Bổ (%)</h3>
            </div>
            <span className="text-xs text-slate-500">Zone HN vs Zone HCM</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => [`${val} bản ghi`, 'Số lượng']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Shards Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Bảng Đối Chiếu Chi Tiết Từng Node Shard</h3>
          <p className="text-xs text-slate-500 mt-1">Thông tin kết xuất từ lệnh <code>db.collection.getShardDistribution()</code></p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Node Shard</th>
                <th className="px-6 py-3.5">Zone Tag</th>
                <th className="px-6 py-3.5">Cổng Dịch Vụ</th>
                <th className="px-6 py-3.5">Số Tài Liệu</th>
                <th className="px-6 py-3.5">Tỷ Lệ Phân Bổ</th>
                <th className="px-6 py-3.5">Dung Lượng</th>
                <th className="px-6 py-3.5">Số Chunks</th>
                <th className="px-6 py-3.5">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.shards.map((s) => (
                <tr key={s.shardId} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">{s.shardName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                      s.zoneTag === 'ZONE_HN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {s.zoneTag}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-700">{s.port}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{s.documentCount}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{s.percentage}%</td>
                  <td className="px-6 py-4 text-slate-600">{s.dataSizeKb} KB</td>
                  <td className="px-6 py-4 font-mono text-slate-700">{s.chunksCount} chunks</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
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
