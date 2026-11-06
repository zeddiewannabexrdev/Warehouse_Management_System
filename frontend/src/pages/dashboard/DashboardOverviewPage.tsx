import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { DashboardOverview } from '../../types/dashboard.types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatNumber, formatDate } from '../../lib/utils';
import {
  Boxes,
  Warehouse,
  Layers,
  AlertTriangle,
  Server,
  ArrowUpRight,
  RefreshCw,
  Activity,
  Truck,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export const DashboardOverviewPage: React.FC = () => {
  const { activeBranch } = useAuth();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchOverview = async () => {
    try {
      setError(null);
      const res = await api.get<DashboardOverview>('/dashboard/overview', {
        params: { branch: activeBranch },
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu tổng quan từ Backend Gateway.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOverview();
  }, [activeBranch]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOverview();
  };

  if (loading) {
    return <LoadingSpinner label="Đang tải dữ liệu tổng quan từ MongoDB Cluster..." />;
  }

  const isDbConnected = data?.connection.status === 'CONNECTED';

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Tổng quan Quản trị & Điều phối Kho (WMS)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi trạng thái phân tán, tồn kho khả dụng và cảnh báo định mức an toàn giữa các tổng kho vùng miền.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
        isDbConnected
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <div>
            <span className="font-semibold">
              {isDbConnected ? 'MongoDB Sharded Cluster Đang Hoạt Động Ổn Định' : 'Mất Kết Nối Tới MongoDB'}
            </span>
            <span className="text-slate-500 ml-2 font-mono">
              Database: <strong className="text-slate-700">{data?.connection.database || 'material_inventory_db'}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-600">
          <span className="bg-white px-2.5 py-1 rounded border border-slate-200">
            Router: <strong>27017</strong>
          </span>
          <span className="bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 text-emerald-800">
            Zone HN: <strong>Shard 1 (27018)</strong>
          </span>
          <span className="bg-blue-50 px-2.5 py-1 rounded border border-blue-200 text-blue-800">
            Zone HCM: <strong>Shard 2 (27020)</strong>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium text-slate-500">
              Vật tư toàn quốc
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(data?.metrics.totalMaterials || 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Global Unsharded</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium text-slate-500">
              Tổng kho vùng miền
            </span>
            <Warehouse className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(data?.metrics.totalWarehouses || 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">HN, HCM, DN</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium text-slate-500">
              Mặt hàng tồn kho
            </span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {formatNumber(data?.metrics.totalStockItems || 0)}
          </div>
          <div className="text-[10px] text-amber-700 mt-1 font-mono font-medium">Sharded Collection</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium text-slate-500">
              Dưới ngưỡng an toàn
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {formatNumber(data?.metrics.lowStockAlertsCount || 0)}
          </div>
          <div className="text-[10px] text-rose-500 mt-1 font-mono">Cần mua bổ sung</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium text-slate-500">
              Phiếu nhập chờ
            </span>
            <Truck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(data?.metrics.pendingReceiptsCount || 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Chờ nghiệm thu KCS</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium text-slate-500">
              Phiếu xuất chờ
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(data?.metrics.pendingIssuesCount || 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Cấp phát công trường</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-slate-900">
                Phân bổ Tồn kho theo Chi nhánh & Shards
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono border border-slate-200">
                Zone Sharding
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Dữ liệu tồn kho được lưu trữ vật lý tại Shard 1 (Hà Nội) và Shard 2 (TP.HCM).
            </p>

            {data?.branchComparison && data.branchComparison.length > 0 ? (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.branchComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="stockItemCount" name="Số mặt hàng tồn" fill="#1b3f65" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="totalQuantity" name="Tổng sản lượng" fill="#6196c5" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded text-slate-400 text-xs">
                <Server className="w-6 h-6 mb-2 text-slate-300" />
                Chưa có dữ liệu phân bổ tồn kho trên các Shard
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-slate-50 rounded border border-slate-100 font-mono text-[11px]">
              <div className="text-slate-400 font-sans">Chi nhánh HN:</div>
              <span className="font-semibold text-slate-700">vattu-shard1 (ZONE_HN)</span>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100 font-mono text-[11px]">
              <div className="text-slate-400 font-sans">Chi nhánh HCM:</div>
              <span className="font-semibold text-slate-700">vattu-shard2 (ZONE_HCM)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-slate-900">
                Cảnh báo Vật tư Dưới Định mức An toàn
              </h3>
              <StatusBadge status="QUAN TRỌNG" variant="danger" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Truy vấn Aggregation phát hiện mặt hàng có số lượng khả dụng &lt;= ngưỡng tối thiểu.
            </p>

            {data?.lowStockAlerts && data.lowStockAlerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-medium">
                      <th className="pb-2">Mã VT</th>
                      <th className="pb-2">Tên vật tư</th>
                      <th className="pb-2">Chi nhánh</th>
                      <th className="pb-2 text-right">Hiện có</th>
                      <th className="pb-2 text-right">Định mức</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.lowStockAlerts.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 font-mono text-brand-700 font-medium">
                          {item.material_code}
                        </td>
                        <td className="py-2.5 text-slate-800 font-medium truncate max-w-[140px]">
                          {item.material_name || item.material_code}
                        </td>
                        <td className="py-2.5">
                          <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {item.warehouse_branch}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-rose-600">
                          {formatNumber(item.quantity)} {item.unit || ''}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-500">
                          {formatNumber(item.min_threshold)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                Mức tồn kho tất cả vật tư tại các chi nhánh đều đạt ngưỡng an toàn.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Truy vấn Targeted Query theo Shard Key</span>
            <span className="font-mono text-brand-700 font-medium">Stage: SINGLE_SHARD</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-900">
            Nhật ký Hoạt động Kho & Truy vết Kiểm toán Gần nhất
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Collection: material_audit_logs (TTL Index 365d)
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Ghi nhận toàn bộ thao tác xuất, nhập, chuyển kho và sửa đổi dữ liệu phục vụ đối soát an toàn.
        </p>

        {data?.recentActivities && data.recentActivities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium font-mono text-[11px]">
                  <th className="pb-2">Mã Log</th>
                  <th className="pb-2">Hành động</th>
                  <th className="pb-2">Người thực hiện</th>
                  <th className="pb-2">Tài liệu tác động</th>
                  <th className="pb-2 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentActivities.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono text-slate-600">{log.log_code}</td>
                    <td className="py-2.5">
                      <StatusBadge
                        status={log.action}
                        variant={
                          log.action === 'RECEIVE'
                            ? 'info'
                            : log.action === 'ISSUE'
                            ? 'success'
                            : log.action === 'TRANSFER'
                            ? 'warning'
                            : 'neutral'
                        }
                      />
                    </td>
                    <td className="py-2.5 text-slate-700 font-medium">{log.actor}</td>
                    <td className="py-2.5 font-mono text-slate-600">
                      {log.collection_name} / {log.document_id}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400 text-[11px]">
                      {formatDate(log.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded">
            <Activity className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            Chưa có thao tác xuất nhập kho mới nào được ghi nhận trong phiên làm việc.
          </div>
        )}
      </div>
    </div>
  );
};
