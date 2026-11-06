import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import {
  History,
  ShieldCheck,
  Search,
  RefreshCw,
  Plus,
  Clock,
  Database,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sliders,
} from 'lucide-react';

interface AuditLogItem {
  _id: string;
  action: string;
  resource: string;
  details: string;
  warehouse_branch: string;
  user_email: string;
  user_role?: string;
  ip_address?: string;
  timestamp: string;
  status: string;
}

interface TtlStatusResponse {
  collection: string;
  indexName: string;
  indexedField: string;
  expireAfterSeconds: number;
  expireDays: number;
  ttlMonitorThreadStatus: string;
  totalActiveRecords: number;
  retentionPolicy: string;
}

interface AuditListResponse {
  items: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const AuditTtlExplorerPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [ttlInfo, setTtlInfo] = useState<TtlStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters & Pagination
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(12);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Simulate Modal & Config State
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);
  const [simAction, setSimAction] = useState<string>('INVENTORY_THRESHOLD_UPDATE');
  const [simBranch, setSimBranch] = useState<'HN' | 'HCM' | 'DN'>('HN');
  const [simResource, setSimResource] = useState<string>('MAT-STEEL-D20');
  const [simDetails, setSimDetails] = useState<string>('Điều chỉnh định mức an toàn tối thiểu lên 800 kg');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // TTL Config Modal
  const [isTtlConfigOpen, setIsTtlConfigOpen] = useState<boolean>(false);
  const [newTtlDays, setNewTtlDays] = useState<number>(90);
  const [updatingTtl, setUpdatingTtl] = useState<boolean>(false);

  const fetchTtlStatus = async () => {
    try {
      const res = await api.get<TtlStatusResponse>('/cluster/audit/ttl-status');
      setTtlInfo(res);
      if (res?.expireDays) {
        setNewTtlDays(res.expireDays);
      }
    } catch {
      // Handled
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get<AuditListResponse>('/cluster/audit/logs', {
        params: {
          page,
          limit,
          action: actionFilter !== 'ALL' ? actionFilter : undefined,
          branch: branchFilter !== 'ALL' ? branchFilter : undefined,
          search: searchKeyword.trim() || undefined,
        },
      });
      setLogs(res.items || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch {
      // Handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTtlStatus();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [page, actionFilter, branchFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleSimulateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/cluster/audit/simulate-event', {
        action: simAction,
        branch: simBranch,
        resource: simResource,
        details: simDetails,
      });
      setIsSimulateModalOpen(false);
      setActionSuccessMsg('Đã tạo bản ghi kiểm toán mới thành công. Bản ghi đã ghi nhận vào MongoDB.');
      await fetchLogs();
      await fetchTtlStatus();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch {
      // Handled
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTtlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingTtl(true);
      const res: any = await api.post('/cluster/audit/update-ttl', { days: Number(newTtlDays) });
      setIsTtlConfigOpen(false);
      setActionSuccessMsg(res.message || 'Đã cập nhật chỉ mục TTL Index thành công.');
      await fetchTtlStatus();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch {
      // Handled
    } finally {
      setUpdatingTtl(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('LOGIN') || action.includes('AUTH')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (action.includes('TRANSFER') || action.includes('DISPATCH')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('STOCKTAKE') || action.includes('RECONCILE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('THRESHOLD') || action.includes('ALERT')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  if (loading && logs.length === 0) {
    return <LoadingSpinner label="Đang tải nhật ký kiểm toán phân tán & chỉ mục TTL..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Nhật Ký Kiểm Toán Phân Tán & Tự Động Thu Hồi TTL
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Lưu vết toàn bộ giao dịch nghiệp vụ nhạy cảm trên cụm phân tán và tự động giải phóng dung lượng theo cơ chế TTL Index (Time-To-Live).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo bản ghi thử nghiệm
          </button>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchLogs();
              fetchTtlStatus();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tổng Sự Kiện Đã Lưu Vết</span>
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {totalCount} Bản ghi
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Collection: material_audit_logs
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Chính Sách Lưu Trữ TTL</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {ttlInfo?.expireDays || 90} Ngày
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {ttlInfo?.expireAfterSeconds?.toLocaleString()} giây
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Luồng Nền TTL Monitor</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            Active
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Chu kỳ dọn dẹp: 60 giây/lần
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Cấu Hình Chu Kỳ TTL</span>
            <Sliders className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <button
              onClick={() => setIsTtlConfigOpen(true)}
              className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
            >
              Chỉnh sửa thời gian TTL
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo email, mã vật tư, phiếu điều chuyển, chi tiết..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Tất cả hành động</option>
            <option value="AUTH_LOGIN">AUTH_LOGIN (Đăng nhập)</option>
            <option value="STOCK_TRANSFER_CREATE">STOCK_TRANSFER_CREATE (Lập điều chuyển)</option>
            <option value="STOCK_TRANSFER_COMMIT">STOCK_TRANSFER_COMMIT (Giao dịch ACID)</option>
            <option value="STOCKTAKE_SUBMIT">STOCKTAKE_SUBMIT (Kiểm kê kho)</option>
            <option value="INVENTORY_THRESHOLD_UPDATE">INVENTORY_THRESHOLD_UPDATE (Định mức)</option>
            <option value="HA_FAILOVER_SIMULATION">HA_FAILOVER_SIMULATION (Mô phỏng HA)</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Tất cả chi nhánh</option>
            <option value="HN">Chi nhánh Hà Nội (HN)</option>
            <option value="HCM">Chi nhánh TP.HCM (HCM)</option>
            <option value="DN">Chi nhánh Đà Nẵng (DN)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="p-3.5">Thời Gian</th>
                <th className="p-3.5">Người Thực Hiện</th>
                <th className="p-3.5">Chi Nhánh</th>
                <th className="p-3.5">Hành Động</th>
                <th className="p-3.5">Đối Tượng (Resource)</th>
                <th className="p-3.5">Chi Tiết Hành Động</th>
                <th className="p-3.5 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Không tìm thấy bản ghi kiểm toán phù hợp.
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDate(item.timestamp)}
                    </td>
                    <td className="p-3.5 font-medium text-slate-900 whitespace-nowrap">
                      <div>{item.user_email || 'Hệ thống tự động'}</div>
                      {item.user_role && (
                        <span className="text-[10px] text-slate-400 font-mono">{item.user_role}</span>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {item.warehouse_branch || 'ALL'}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold border ${getActionBadgeColor(item.action)}`}>
                        {item.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                      {item.resource || '—'}
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate" title={item.details}>
                      {item.details || '—'}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {item.status || 'SUCCESS'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị trang <strong>{page}</strong> trên <strong>{totalPages}</strong> ({totalCount} sự kiện)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TTL Index Explanation & Proof */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Cơ Chế Kỹ Thuật Chỉ Mục TTL Index (MongoDB WiredTiger Engine)</span>
        </div>
        <p className="leading-relaxed">
          Chỉ mục TTL Index được định nghĩa bằng chỉ lệnh: <code className="bg-white px-2 py-0.5 rounded border font-mono text-[11px] text-blue-800">db.material_audit_logs.createIndex({'{'} timestamp: 1 {'}'}, {'{'} expireAfterSeconds: {ttlInfo?.expireAfterSeconds || 7776000} {'}'})</code>.
        </p>
        <p className="text-slate-500 leading-relaxed text-[11px]">
          Luồng nền ngầm (Background Thread) của MongoDB tự động kích hoạt mỗi 60 giây, quét trường <code>timestamp</code> và thực thi xóa nguyên tử các tài liệu quá hạn {ttlInfo?.expireDays || 90} ngày nhằm bảo đảm an toàn dữ liệu, chống phân mảnh đĩa cứng và tuân thủ quy chuẩn kiểm toán an ninh thông tin ISO 27001.
        </p>
      </div>

      {/* Simulate Event Modal */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Tạo Bản Ghi Kiểm Toán Thử Nghiệm
            </h3>
            <form onSubmit={handleSimulateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Mã hành động</label>
                <select
                  value={simAction}
                  onChange={(e) => setSimAction(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="INVENTORY_THRESHOLD_UPDATE">INVENTORY_THRESHOLD_UPDATE (Sửa định mức tồn)</option>
                  <option value="STOCK_TRANSFER_CREATE">STOCK_TRANSFER_CREATE (Tạo điều chuyển)</option>
                  <option value="STOCKTAKE_SUBMIT">STOCKTAKE_SUBMIT (Chốt kiểm kê)</option>
                  <option value="SECURITY_PRIVILEGE_ELEVATION">SECURITY_PRIVILEGE_ELEVATION (Đổi vai trò)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Chi nhánh</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['HN', 'HCM', 'DN'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSimBranch(b)}
                      className={`py-1.5 rounded-lg border font-semibold ${
                        simBranch === b
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Mã đối tượng (Resource)</label>
                <input
                  type="text"
                  value={simResource}
                  onChange={(e) => setSimResource(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Chi tiết hành động</label>
                <input
                  type="text"
                  value={simDetails}
                  onChange={(e) => setSimDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  {submitting ? 'Đang tạo...' : 'Xác nhận tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update TTL Modal */}
      {isTtlConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Cập Nhật Chu Kỳ Lưu Trữ TTL Index
            </h3>
            <form onSubmit={handleUpdateTtlSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Số ngày tự động xóa sau khi hết hạn
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setNewTtlDays(days)}
                      className={`py-2 rounded-lg border font-semibold ${
                        newTtlDays === days
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {days} Ngày
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Giá trị quy đổi: <strong>{(newTtlDays * 86400).toLocaleString()}</strong> giây. Chỉ mục TTL sẽ được cập nhật lại trực tiếp trên MongoDB.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTtlConfigOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updatingTtl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  {updatingTtl ? 'Đang cập nhật...' : 'Lưu cấu hình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
