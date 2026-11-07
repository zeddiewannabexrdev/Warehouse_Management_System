import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { DashboardOverview } from '../../types/dashboard.types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricStrip, MetricItemProps } from '../../components/common/MetricStrip';
import { formatNumber, formatDate } from '../../lib/utils';
import {
  Server,
  RefreshCw,
  Activity,
  CheckCircle,
  ExternalLink,
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
  const { activeBranch, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const role = user?.role || 'SUPER_ADMIN';

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

  // Role metadata configurations
  const getRoleHeaderInfo = () => {
    switch (role) {
      case 'MANAGER_HN':
        return {
          title: 'Bảng Điều Phối Tổng Kho Miền Bắc (Shard 1 - Hà Nội)',
          subtitle: 'Giám sát định mức khả dụng, tình trạng lấp đầy ô kệ kho Long Biên và cảnh báo an toàn cục bộ.',
          badge: 'ZONE_HN · Shard 1 (27018)',
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          actions: [
            { label: 'Lập lệnh chuyển sang HCM', link: '/stock-transfers', primary: true },
            { label: 'Cập nhật định mức tồn', link: '/inventory' },
            { label: 'Bản đồ ô kệ Hà Nội', link: '/warehouses' },
            { label: 'Kiểm kê kho HN', link: '/stocktakes' },
          ],
        };
      case 'MANAGER_HCM':
        return {
          title: 'Bảng Điều Phối Tổng Kho Miền Nam (Shard 2 - TP.HCM)',
          subtitle: 'Giám sát định mức khả dụng, tình trạng lấp đầy ô kệ kho Cát Lái và tiếp nhận điều chuyển liên vùng.',
          badge: 'ZONE_HCM · Shard 2 (27020)',
          badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
          actions: [
            { label: 'Xác nhận nhập kho liên vùng', link: '/stock-transfers', primary: true },
            { label: 'Cập nhật định mức tồn', link: '/inventory' },
            { label: 'Bản đồ ô kệ Cát Lái', link: '/warehouses' },
            { label: 'Kiểm kê kho HCM', link: '/stocktakes' },
          ],
        };
      case 'QC_INSPECTOR':
        return {
          title: 'Trung Tâm Điều Hành Kiểm Định Chất Lượng & KCS',
          subtitle: 'Theo dõi tiến độ nghiệm thu vật tư nhập kho, cấp chứng chỉ CO/CQ và xử lý thu hồi vật tư lỗi từ công trình.',
          badge: 'KCS / QC · QUALITY CONTROL',
          badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
          actions: [
            { label: 'Nghiệm thu lô nhập kho', link: '/stocktakes', primary: true },
            { label: 'Phiếu thu hồi công trình', link: '/stock-transfers' },
            { label: 'Tiêu chuẩn kỹ thuật vật tư', link: '/materials' },
          ],
        };
      case 'AUDITOR':
        return {
          title: 'Bảng Điều Hành Kiểm Toán & Đối Soát Tài Sản Kho',
          subtitle: 'Theo dõi định giá tài sản tồn kho (FIFO), phê duyệt bút toán điều chỉnh cân đối và truy vết nhật ký kiểm toán.',
          badge: 'AUDITOR · READ-ONLY ALL SHARDS',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
          actions: [
            { label: 'Duyệt đối soát cân đối kho', link: '/stocktakes', primary: true },
            { label: 'Báo cáo định giá vốn FIFO', link: '/reports' },
            { label: 'Truy vết Audit Logs', link: '/cluster-topology' },
          ],
        };
      default: // SUPER_ADMIN
        return {
          title: 'Tổng quan Quản trị & Điều phối Toàn quốc',
          subtitle: 'Giám sát toàn diện cụm Sharded Cluster, cân bằng dữ liệu đa vùng miền và kiểm soát lưu lượng nghiệp vụ toàn quốc.',
          badge: 'SUPER ADMIN · FULL CLUSTER ACCESS',
          badgeColor: 'bg-slate-900 text-white border-slate-900',
          actions: [
            { label: 'Cấu trúc Topology Cụm', link: '/cluster-topology', primary: true },
            { label: 'Phân bổ Shard Data', link: '/shard-distribution' },
            { label: 'Quản trị Người dùng', link: '/users' },
            { label: 'Báo cáo toàn quốc', link: '/reports' },
          ],
        };
    }
  };

  const headerInfo = getRoleHeaderInfo();

  const getRoleMetrics = (): MetricItemProps[] => {
    switch (role) {
      case 'QC_INSPECTOR':
        return [
          {
            label: 'Chờ KCS nghiệm thu',
            value: data?.metrics.pendingReceiptsCount || 0,
            subText: 'Lô hàng mới nhập',
            status: (data?.metrics.pendingReceiptsCount || 0) > 0 ? 'warning' : 'neutral',
          },
          {
            label: 'Tỷ lệ đạt chuẩn',
            value: '98.5%',
            subText: 'Đủ tem kiểm định CO/CQ',
            status: 'success',
          },
          {
            label: 'Vật tư có chứng chỉ',
            value: data?.metrics.totalMaterials || 0,
            subText: 'Hồ sơ kỹ thuật hợp lệ',
          },
          {
            label: 'Lô cần thẩm định lại',
            value: 2,
            subText: 'Cảnh báo lỗi KCS',
            status: 'warning',
          },
          {
            label: 'Thu hồi công trình',
            value: 4,
            subText: 'Đang lưu bãi chờ xử lý',
          },
          {
            label: 'Nhóm quy chuẩn',
            value: '4 nhóm',
            subText: 'Thép, Cáp, Xi măng, Sơn',
          },
        ];
      case 'AUDITOR':
        return [
          {
            label: 'Giá trị vốn kho (FIFO)',
            value: '1.82 tỷ',
            subText: 'Định giá tồn kho thời gian thực',
            status: 'info',
          },
          {
            label: 'Kỳ kiểm kê hoàn tất',
            value: '3 đợt',
            subText: 'Đã chốt đối soát sổ sách',
            status: 'success',
          },
          {
            label: 'Chênh lệch chờ duyệt',
            value: '1 phiếu',
            subText: 'Cần bút toán cân đối ACID',
            status: 'warning',
          },
          {
            label: 'Độ chuẩn xác thẻ kho',
            value: '99.4%',
            subText: 'Khớp vị trí ô kệ 2D',
            status: 'success',
          },
          {
            label: 'Nhật ký Audit 24h',
            value: data?.recentActivities?.length || 0,
            subText: 'Bản ghi truy vết nhạy cảm',
          },
          {
            label: 'Chỉ mục TTL Index',
            value: '90 ngày',
            subText: 'Tự động purge log cũ',
          },
        ];
      case 'MANAGER_HN':
      case 'MANAGER_HCM':
        return [
          {
            label: 'Mặt hàng tại kho',
            value: data?.metrics.totalStockItems || 0,
            subText: role === 'MANAGER_HN' ? 'Tổng kho Long Biên (HN)' : 'Tổng kho Cát Lái (HCM)',
            status: 'info',
          },
          {
            label: 'Dưới ngưỡng an toàn',
            value: data?.metrics.lowStockAlertsCount || 0,
            subText: 'Cần mua bổ sung',
            status: (data?.metrics.lowStockAlertsCount || 0) > 0 ? 'danger' : 'success',
          },
          {
            label: 'Phiếu nhập chờ',
            value: data?.metrics.pendingReceiptsCount || 0,
            subText: 'Chờ nghiệm thu KCS',
            status: (data?.metrics.pendingReceiptsCount || 0) > 0 ? 'warning' : 'neutral',
          },
          {
            label: 'Phiếu xuất chờ',
            value: data?.metrics.pendingIssuesCount || 0,
            subText: 'Cấp phát thi công công trường',
          },
          {
            label: 'Điều chuyển liên kho',
            value: role === 'MANAGER_HN' ? '2 đang xuất' : '2 đang đến',
            subText: 'Giao dịch phân tán 2PC',
            status: 'info',
          },
          {
            label: 'Shard đích vật lý',
            value: role === 'MANAGER_HN' ? 'Shard 1' : 'Shard 2',
            subText: role === 'MANAGER_HN' ? 'Port 27018 (ZONE_HN)' : 'Port 27020 (ZONE_HCM)',
            status: 'success',
          },
        ];
      default: // SUPER_ADMIN
        return [
          {
            label: 'Vật tư toàn quốc',
            value: data?.metrics.totalMaterials || 0,
            subText: 'Global Reference Data',
          },
          {
            label: 'Tổng kho vùng miền',
            value: data?.metrics.totalWarehouses || 0,
            subText: 'HN, HCM, Đà Nẵng',
          },
          {
            label: 'Mặt hàng tồn kho',
            value: data?.metrics.totalStockItems || 0,
            subText: 'Sharded Collections',
            status: 'info',
          },
          {
            label: 'Cảnh báo tồn an toàn',
            value: data?.metrics.lowStockAlertsCount || 0,
            subText: 'Số mặt hàng thiếu hụt',
            status: (data?.metrics.lowStockAlertsCount || 0) > 0 ? 'danger' : 'success',
          },
          {
            label: 'Phiếu nhập chờ',
            value: data?.metrics.pendingReceiptsCount || 0,
            subText: 'Chờ KCS nghiệm thu',
            status: (data?.metrics.pendingReceiptsCount || 0) > 0 ? 'warning' : 'neutral',
          },
          {
            label: 'Phiếu xuất chờ',
            value: data?.metrics.pendingIssuesCount || 0,
            subText: 'Cấp phát ra công trường',
          },
        ];
    }
  };

  return (
    <div className="space-y-4 font-sans max-w-7xl mx-auto">
      {/* Role-Specific Header */}
      <div className="bg-white px-4 py-3 rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${headerInfo.badgeColor}`}>
              {headerInfo.badge}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Phiên: <strong className="text-slate-800">{user?.fullName || user?.email}</strong>
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            {headerInfo.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            {headerInfo.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center shrink-0">
          {headerInfo.actions.map((act, idx) => (
            <button
              key={idx}
              onClick={() => navigate(act.link)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                act.primary
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              {act.label}
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>
          ))}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-md transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cluster Telemetry Status Strip */}
      <div className="bg-white px-3.5 py-2 rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="font-semibold text-slate-900">
            {isDbConnected ? 'MongoDB Sharded Cluster Đang Hoạt Động Ổn Định' : 'Mất Kết Nối Tới MongoDB'}
          </span>
          <span className="text-slate-400 font-mono text-[11px] hidden md:inline">|</span>
          <span className="text-slate-500 font-mono text-[11px] hidden md:inline">
            DB: <span className="font-semibold text-slate-700">{data?.connection.database || 'material_inventory_db'}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          <span className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            Router: <strong>27017</strong>
          </span>
          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
            Zone HN: <strong>Shard 1 (27018)</strong>
          </span>
          <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
            Zone HCM: <strong>Shard 2 (27020)</strong>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Role-Tailored Telemetry Metric Strip */}
      <MetricStrip items={getRoleMetrics()} />

      {/* Main Content Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Panel: Chart */}
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {role === 'MANAGER_HN'
                    ? 'Phân Bổ Tồn Kho Hà Nội (Shard 1)'
                    : role === 'MANAGER_HCM'
                    ? 'Phân Bổ Tồn Kho TP.HCM (Shard 2)'
                    : 'Phân Bổ Tồn Kho Theo Chi Nhánh & Shards'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {role === 'MANAGER_HN'
                    ? 'Lưu trữ và truy vấn trên Shard 1 (Port 27018).'
                    : role === 'MANAGER_HCM'
                    ? 'Lưu trữ và truy vấn trên Shard 2 (Port 27020).'
                    : 'Lưu trữ phân tán tại Shard 1 (Hà Nội) và Shard 2 (TP.HCM).'}
                </p>
              </div>
              <span className="text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded font-mono border border-slate-200">
                Zone Sharding
              </span>
            </div>

            <div className="p-4">
              {data?.branchComparison && data.branchComparison.length > 0 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.branchComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="stockItemCount" name="Số mặt hàng tồn" fill="#1b3f65" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="totalQuantity" name="Tổng sản lượng" fill="#6196c5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded text-slate-400 text-xs">
                  <Server className="w-5 h-5 mb-1.5 text-slate-300" />
                  Chưa có dữ liệu phân bổ tồn kho trên các Shard
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
            <div className="p-1.5 bg-white rounded border border-slate-200 font-mono text-[11px]">
              <span className="text-slate-400 font-sans mr-1">HN:</span>
              <span className="font-semibold text-emerald-800">Shard 1 (ZONE_HN: 27018)</span>
            </div>
            <div className="p-1.5 bg-white rounded border border-slate-200 font-mono text-[11px]">
              <span className="text-slate-400 font-sans mr-1">HCM:</span>
              <span className="font-semibold text-blue-800">Shard 2 (ZONE_HCM: 27020)</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Alerts and Warnings */}
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Cảnh Báo Dưới Định Mức An Toàn
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mặt hàng có tồn kho khả dụng ≤ ngưỡng tối thiểu
                </p>
              </div>
              <StatusBadge status="QUAN TRỌNG" variant="danger" />
            </div>

            <div className="p-0">
              {data?.lowStockAlerts && data.lowStockAlerts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã VT</th>
                        <th>Tên vật tư</th>
                        <th>Chi nhánh</th>
                        <th className="num">Hiện có</th>
                        <th className="num">Định mức</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.lowStockAlerts.map((item, idx) => (
                        <tr key={idx}>
                          <td className="font-mono text-blue-700 font-medium">
                            {item.material_code}
                          </td>
                          <td className="text-slate-800 font-medium truncate max-w-[140px]">
                            {item.material_name || item.material_code}
                          </td>
                          <td>
                            <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              {item.warehouse_branch}
                            </span>
                          </td>
                          <td className="num font-bold text-rose-600">
                            {formatNumber(item.quantity)} {item.unit || ''}
                          </td>
                          <td className="num text-slate-500">
                            {formatNumber(item.min_threshold)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  Mức tồn kho tất cả vật tư tại các chi nhánh đều đạt ngưỡng an toàn.
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Truy vấn Targeted Query theo Shard Key</span>
            <span className="font-mono text-blue-700 font-medium">Stage: SINGLE_SHARD</span>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Activity Log Table */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {role === 'AUDITOR'
                ? 'Nhật Ký Kiểm Toán & Bút Toán Đối Soát Gần Nhất'
                : role === 'QC_INSPECTOR'
                ? 'Nhật Ký Nghiệm Thu & Kiểm Định Chất Lượng Gần Nhất'
                : 'Nhật Ký Hoạt Động Kho & Truy Vết Gần Nhất'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ghi nhận toàn bộ thao tác xuất, nhập, chuyển kho và sửa đổi dữ liệu phục vụ đối soát an toàn.
            </p>
          </div>
          <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
            Collection: material_audit_logs (TTL: 90d)
          </span>
        </div>

        {data?.recentActivities && data.recentActivities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã Log</th>
                  <th>Hành động</th>
                  <th>Người thực hiện</th>
                  <th>Tài liệu tác động</th>
                  <th className="num">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActivities.map((log, idx) => (
                  <tr key={idx}>
                    <td className="font-mono text-slate-600">{log.log_code}</td>
                    <td>
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
                    <td className="text-slate-800 font-medium">{log.actor}</td>
                    <td className="font-mono text-slate-600">
                      {log.collection_name} / {log.document_id}
                    </td>
                    <td className="num text-slate-400 text-[11px]">
                      {formatDate(log.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            <Activity className="w-5 h-5 mx-auto mb-1.5 text-slate-300" />
            Chưa có thao tác xuất nhập kho mới nào được ghi nhận trong phiên làm việc.
          </div>
        )}
      </div>
    </div>
  );
};
