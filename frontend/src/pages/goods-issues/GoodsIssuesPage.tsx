import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  GoodsIssue,
  StockMovementListResponse,
  MovementOptionsResponse,
  CreateIssuePayload,
} from '../../types/stock-movement.types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatNumber, formatDate } from '../../lib/utils';
import {
  Plus,
  RefreshCw,
  Search,
  Eye,
  X,
  Server,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const GoodsIssuesPage: React.FC = () => {
  const { user, activeBranch } = useAuth();
  const role = user?.role || 'SUPER_ADMIN';

  const isManagerHn = role === 'MANAGER_HN';
  const isManagerHcm = role === 'MANAGER_HCM';
  const isManager = isManagerHn || isManagerHcm;
  const canWrite = role === 'SUPER_ADMIN' || isManager;

  const defaultBranch = isManagerHn ? 'HN' : isManagerHcm ? 'HCM' : activeBranch || 'ALL';

  // Filters state
  const [selectedBranch, setSelectedBranch] = useState<string>(defaultBranch);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [purposeKeyword, setPurposeKeyword] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  // Data states
  const [data, setData] = useState<StockMovementListResponse<GoodsIssue> | null>(null);
  const [options, setOptions] = useState<MovementOptionsResponse>({ materials: [], warehouses: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Detail Modal State
  const [viewIssue, setViewIssue] = useState<GoodsIssue | null>(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formBranch, setFormBranch] = useState<string>(isManagerHn ? 'HN' : isManagerHcm ? 'HCM' : 'HN');
  const [formWarehouse, setFormWarehouse] = useState<string>('');
  const [formIssueCode, setFormIssueCode] = useState<string>('');
  const [formIssueDate, setFormIssueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formMaterialCode, setFormMaterialCode] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formPurpose, setFormPurpose] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Synchronize branch if manager role changes
  useEffect(() => {
    if (isManagerHn) {
      setSelectedBranch('HN');
      setFormBranch('HN');
    } else if (isManagerHcm) {
      setSelectedBranch('HCM');
      setFormBranch('HCM');
    }
  }, [isManagerHn, isManagerHcm]);

  // Fetch Options
  const fetchOptions = async () => {
    try {
      const branchParam = isManagerHn ? 'HN' : isManagerHcm ? 'HCM' : selectedBranch === 'ALL' ? undefined : selectedBranch;
      const res = await api.get<MovementOptionsResponse>('/goods-issues/options', {
        params: { branch: branchParam },
      });
      setOptions(res);
      if (res.warehouses.length > 0 && !formWarehouse) {
        setFormWarehouse(res.warehouses[0].warehouse_code);
      }
      if (res.materials.length > 0 && !formMaterialCode) {
        setFormMaterialCode(res.materials[0].material_code);
      }
    } catch (err: any) {
      console.warn('Could not load options:', err);
    }
  };

  // Fetch Issues List
  const fetchIssues = async () => {
    try {
      setErrorMsg(null);
      const params: Record<string, string | number | undefined> = {
        branch: selectedBranch === 'ALL' ? undefined : selectedBranch,
        warehouse_code: selectedWarehouse || undefined,
        material_code: selectedMaterial || undefined,
        purpose: purposeKeyword.trim() || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        limit,
      };
      const res = await api.get<StockMovementListResponse<GoodsIssue>>('/goods-issues', { params });
      setData(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tải danh sách phiếu xuất kho từ máy chủ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [selectedBranch]);

  useEffect(() => {
    setLoading(true);
    fetchIssues();
  }, [selectedBranch, selectedWarehouse, selectedMaterial, purposeKeyword, fromDate, toDate, page]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchIssues();
  };

  // Warehouse options filtered by formBranch
  const formWarehouses = useMemo(() => {
    return options.warehouses.filter((w) => w.branch === formBranch);
  }, [options.warehouses, formBranch]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const branch = isManagerHn ? 'HN' : isManagerHcm ? 'HCM' : 'HN';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `GI-${branch}-${randomSuffix}`;
    setFormBranch(branch);
    setFormIssueCode(code);
    setFormIssueDate(new Date().toISOString().slice(0, 10));

    const defaultWh = options.warehouses.find((w) => w.branch === branch)?.warehouse_code || 'WH-HN-01';
    setFormWarehouse(defaultWh);

    const firstMat = options.materials[0];
    setFormMaterialCode(firstMat ? firstMat.material_code : 'MAT-STEEL-D20');
    setFormQuantity(5);
    setFormPurpose('Cấp phát thi công công trình hạ tầng kỹ thuật');
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formIssueCode.trim()) {
      setFormError('Mã phiếu xuất không được để trống.');
      return;
    }
    if (!formWarehouse) {
      setFormError('Vui lòng chọn kho xuất vật tư.');
      return;
    }
    if (!formMaterialCode) {
      setFormError('Vui lòng chọn vật tư cần xuất.');
      return;
    }
    if (formQuantity <= 0) {
      setFormError('Số lượng xuất phải lớn hơn 0.');
      return;
    }
    if (!formPurpose.trim()) {
      setFormError('Vui lòng nhập mục đích cấp phát thi công.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateIssuePayload = {
        issue_code: formIssueCode.trim(),
        warehouse_branch: formBranch,
        warehouse_code: formWarehouse,
        issue_date: new Date(formIssueDate).toISOString(),
        material_code: formMaterialCode,
        quantity: Number(formQuantity),
        purpose: formPurpose.trim(),
      };

      await api.post('/goods-issues', payload);
      setSuccessMsg(`Xuất kho thành công! Phiếu ${payload.issue_code} đã trừ tồn kho nguyên tử trên Shard ${payload.warehouse_branch === 'HN' ? '1' : '2'}.`);
      setShowCreateModal(false);
      fetchIssues();
    } catch (err: any) {
      setFormError(err?.message || 'Không thể tạo phiếu xuất kho. Vui lòng kiểm tra tồn kho khả dụng.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) || 1 : 1;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-md border bg-blue-50 text-blue-800 border-blue-200">
                MODULE 07 · GOODS ISSUES
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Vùng sharding: <strong>{selectedBranch === 'ALL' ? 'Toàn quốc (Multi-Shard)' : `ZONE_${selectedBranch}`}</strong>
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quản Lý Phiếu Xuất Kho (Goods Issues)
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Cấp phát vật tư phục vụ thi công công trình, áp dụng kiểm soát điều kiện tồn kho an toàn ($gte) và cập nhật số dư Shard nguyên tử.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              Làm mới
            </button>

            {canWrite && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                Tạo phiếu xuất
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium text-slate-500">Tổng phiếu xuất</span>
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {formatNumber(data?.total || 0)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Ghi nhận trong DB</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium text-slate-500">Chi nhánh thao tác</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-800 font-mono">
              {selectedBranch === 'ALL' ? 'Tất cả chi nhánh' : `Chi nhánh ${selectedBranch}`}
            </div>
            <div className="text-[10px] text-blue-600 font-mono">
              {selectedBranch === 'HN' ? 'Shard 1 (27018)' : selectedBranch === 'HCM' ? 'Shard 2 (27020)' : 'Router (27017)'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium text-slate-500">Bảo vệ âm tồn</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-sm font-bold text-emerald-700 font-mono truncate">
              Atomic $gte Guard
            </div>
            <div className="text-[10px] text-emerald-600 font-mono">
              Chống xuất âm / Race Conditions
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium text-slate-500">Truy vết Audit</span>
              <Server className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-sm font-bold text-slate-800 font-mono">
              material_audit_logs
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              TTL Index 90 ngày tự động
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          {/* Branch filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Chi nhánh (Branch)</label>
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setPage(1);
              }}
              disabled={isManager}
              className={`w-full px-2.5 py-1.5 border rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                isManager ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'border-slate-200'
              }`}
            >
              {!isManager && <option value="ALL">Toàn quốc (Tất cả Shard)</option>}
              <option value="HN">Miền Bắc - Hà Nội (Shard 1)</option>
              <option value="HCM">Miền Nam - TP.HCM (Shard 2)</option>
              <option value="DN">Miền Trung - Đà Nẵng</option>
            </select>
          </div>

          {/* Warehouse filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Kho xuất hàng</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => {
                setSelectedWarehouse(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">Tất cả các kho</option>
              {options.warehouses.map((wh) => (
                <option key={wh.warehouse_code} value={wh.warehouse_code}>
                  {wh.warehouse_code} - {wh.name}
                </option>
              ))}
            </select>
          </div>

          {/* Material filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Vật tư</label>
            <select
              value={selectedMaterial}
              onChange={(e) => {
                setSelectedMaterial(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">Tất cả vật tư</option>
              {options.materials.map((m) => (
                <option key={m.material_code} value={m.material_code}>
                  {m.material_code} - {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Purpose keyword search */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Mục đích cấp phát</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm công trình..."
                value={purposeKeyword}
                onChange={(e) => {
                  setPurposeKeyword(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-7 pr-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>

          {/* Date range from */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Date range to */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Danh Sách Phiếu Xuất Kho Cấp Phát
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
              {data?.total || 0} bản ghi
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Collection: goods_issues
          </div>
        </div>

        {loading ? (
          <div className="py-16">
            <LoadingSpinner label="Đang tải danh sách phiếu xuất kho từ MongoDB Cluster..." />
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-3 px-4 font-mono">Mã phiếu xuất</th>
                  <th className="py-3 px-3">Chi nhánh</th>
                  <th className="py-3 px-3">Kho xuất</th>
                  <th className="py-3 px-3">Ngày xuất</th>
                  <th className="py-3 px-3">Người xuất</th>
                  <th className="py-3 px-3">Vật tư & Sản lượng</th>
                  <th className="py-3 px-3">Mục đích cấp phát</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((issue, idx) => {
                  const firstItem = issue.items?.[0];
                  return (
                    <tr key={issue._id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {issue.issue_code}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {issue.warehouse_branch}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {issue.warehouse_code}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {formatDate(issue.issue_date)}
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[130px]">
                        {issue.issuer || 'N/A'}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {firstItem ? (
                          <span>
                            <strong className="text-slate-900">{firstItem.material_code}</strong>: {formatNumber(firstItem.quantity)}
                          </span>
                        ) : (
                          '---'
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium truncate max-w-[180px]">
                        {issue.purpose}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge
                          status={issue.status || 'DELIVERED'}
                          variant={
                            issue.status === 'DELIVERED'
                              ? 'success'
                              : issue.status === 'PENDING'
                              ? 'warning'
                              : 'neutral'
                          }
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewIssue(issue)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 text-xs">
            <ArrowUpRight className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>Không tìm thấy phiếu xuất kho nào phù hợp với bộ lọc hiện tại.</p>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> ({data?.total || 0} phiếu)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {viewIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Phiếu Xuất Kho:</span>
                  <span className="font-mono text-blue-700">{viewIssue.issue_code}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lưu trữ tại Shard: <strong>{viewIssue.warehouse_branch === 'HN' ? 'Shard 1 (Hà Nội)' : 'Shard 2 (TP.HCM)'}</strong>
                </p>
              </div>
              <button
                onClick={() => setViewIssue(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px]">Chi nhánh:</span>
                <span className="font-semibold text-slate-800">{viewIssue.warehouse_branch}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Kho xuất:</span>
                <span className="font-semibold text-slate-800">{viewIssue.warehouse_code}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ngày lập phiếu:</span>
                <span className="font-mono text-slate-800">{formatDate(viewIssue.issue_date)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Người xuất:</span>
                <span className="font-medium text-slate-800">{viewIssue.issuer}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[11px]">Mục đích cấp phát:</span>
                <span className="font-semibold text-slate-900">{viewIssue.purpose}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Trạng thái giao:</span>
                <StatusBadge status={viewIssue.status || 'DELIVERED'} variant="success" />
              </div>
            </div>

            {/* Items list */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">Chi tiết vật tư xuất kho</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                      <th className="py-2.5 px-3">Mã VT</th>
                      <th className="py-2.5 px-3 text-right">Số lượng xuất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewIssue.items?.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-medium text-blue-700">
                          {it.material_code}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatNumber(it.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewIssue(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Lập Phiếu Xuất Kho Cấp Phát Mới
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hệ thống áp dụng cơ chế nguyên tử để kiểm tra và trừ tồn khả dụng trực tiếp trên Shard.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Branch */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Chi nhánh xuất <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formBranch}
                    onChange={(e) => {
                      const br = e.target.value;
                      setFormBranch(br);
                      const matchingWh = options.warehouses.find((w) => w.branch === br)?.warehouse_code || '';
                      setFormWarehouse(matchingWh);
                    }}
                    disabled={isManager}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100"
                  >
                    <option value="HN">Hà Nội (Shard 1)</option>
                    <option value="HCM">TP.HCM (Shard 2)</option>
                    <option value="DN">Đà Nẵng</option>
                  </select>
                </div>

                {/* Warehouse */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Kho xuất hàng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formWarehouse}
                    onChange={(e) => setFormWarehouse(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    {formWarehouses.map((wh) => (
                      <option key={wh.warehouse_code} value={wh.warehouse_code}>
                        {wh.warehouse_code} - {wh.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Issue Code */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Mã phiếu xuất <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formIssueCode}
                    onChange={(e) => setFormIssueCode(e.target.value)}
                    placeholder="VD: GI-HN-001"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Issue Date */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Ngày xuất kho <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Material Code */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Vật tư cần xuất <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formMaterialCode}
                    onChange={(e) => setFormMaterialCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    {options.materials.map((m) => (
                      <option key={m.material_code} value={m.material_code}>
                        {m.material_code} - {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Số lượng xuất <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Purpose */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Mục đích cấp phát công trình <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    placeholder="VD: Cấp phát thi công trụ T12 cầu cạn cao tốc..."
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Xác nhận Xuất kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
