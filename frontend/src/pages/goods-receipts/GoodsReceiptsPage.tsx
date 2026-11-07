import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  GoodsReceipt,
  StockMovementListResponse,
  MovementOptionsResponse,
  CreateReceiptPayload,
} from '../../types/stock-movement.types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatNumber, formatDate } from '../../lib/utils';
import {
  Truck,
  Plus,
  RefreshCw,
  Eye,
  X,
  Server,
  Building2,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Trash2,
} from 'lucide-react';

interface ReceiptItemForm {
  material_code: string;
  quantity: number;
  unit_price: number;
}

export const GoodsReceiptsPage: React.FC = () => {
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
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  // Data states
  const [data, setData] = useState<StockMovementListResponse<GoodsReceipt> | null>(null);
  const [options, setOptions] = useState<MovementOptionsResponse>({ materials: [], warehouses: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Detail Modal State
  const [viewReceipt, setViewReceipt] = useState<GoodsReceipt | null>(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formBranch, setFormBranch] = useState<string>(isManagerHn ? 'HN' : isManagerHcm ? 'HCM' : 'HN');
  const [formWarehouse, setFormWarehouse] = useState<string>('');
  const [formReceiptCode, setFormReceiptCode] = useState<string>('');
  const [formReceiptDate, setFormReceiptDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formItems, setFormItems] = useState<ReceiptItemForm[]>([
    { material_code: '', quantity: 1, unit_price: 0 },
  ]);
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

  // Fetch Options (materials & warehouses)
  const fetchOptions = async () => {
    try {
      const branchParam = isManagerHn ? 'HN' : isManagerHcm ? 'HCM' : selectedBranch === 'ALL' ? undefined : selectedBranch;
      const res = await api.get<MovementOptionsResponse>('/goods-receipts/options', {
        params: { branch: branchParam },
      });
      setOptions(res);
      if (res.warehouses.length > 0 && !formWarehouse) {
        setFormWarehouse(res.warehouses[0].warehouse_code);
      }
    } catch (err: any) {
      console.warn('Could not load options:', err);
    }
  };

  // Fetch Receipts List
  const fetchReceipts = async () => {
    try {
      setErrorMsg(null);
      const params: Record<string, string | number | undefined> = {
        branch: selectedBranch === 'ALL' ? undefined : selectedBranch,
        warehouse_code: selectedWarehouse || undefined,
        material_code: selectedMaterial || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        limit,
      };
      const res = await api.get<StockMovementListResponse<GoodsReceipt>>('/goods-receipts', { params });
      setData(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tải danh sách phiếu nhập kho từ máy chủ.');
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
    fetchReceipts();
  }, [selectedBranch, selectedWarehouse, selectedMaterial, fromDate, toDate, page]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReceipts();
  };

  // Warehouse options filtered by formBranch
  const formWarehouses = useMemo(() => {
    return options.warehouses.filter((w) => w.branch === formBranch);
  }, [options.warehouses, formBranch]);

  // Reset & open create modal
  const handleOpenCreateModal = () => {
    const branch = isManagerHn ? 'HN' : isManagerHcm ? 'HCM' : 'HN';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `GR-${branch}-${randomSuffix}`;
    setFormBranch(branch);
    setFormReceiptCode(code);
    setFormReceiptDate(new Date().toISOString().slice(0, 10));

    const defaultWh = options.warehouses.find((w) => w.branch === branch)?.warehouse_code || 'WH-HN-01';
    setFormWarehouse(defaultWh);

    const firstMat = options.materials[0];
    setFormItems([
      {
        material_code: firstMat ? firstMat.material_code : 'MAT-STEEL-D20',
        quantity: 10,
        unit_price: firstMat?.standard_price || 15000000,
      },
    ]);
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleAddItemRow = () => {
    const firstMat = options.materials[0];
    setFormItems([
      ...formItems,
      {
        material_code: firstMat ? firstMat.material_code : '',
        quantity: 1,
        unit_price: firstMat?.standard_price || 0,
      },
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (formItems.length <= 1) return;
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof ReceiptItemForm, value: string | number) => {
    const updated = [...formItems];
    if (field === 'material_code') {
      const mat = options.materials.find((m) => m.material_code === value);
      updated[idx].material_code = String(value);
      if (mat?.standard_price) {
        updated[idx].unit_price = mat.standard_price;
      }
    } else {
      updated[idx][field] = Number(value) as never;
    }
    setFormItems(updated);
  };

  const totalCalculatedAmount = useMemo(() => {
    return formItems.reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0);
  }, [formItems]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formReceiptCode.trim()) {
      setFormError('Mã phiếu nhập không được để trống.');
      return;
    }
    if (!formWarehouse) {
      setFormError('Vui lòng chọn kho tiếp nhận vật tư.');
      return;
    }
    if (formItems.length === 0) {
      setFormError('Phiếu nhập phải có ít nhất 1 dòng vật tư.');
      return;
    }

    for (const item of formItems) {
      if (!item.material_code) {
        setFormError('Vui lòng chọn mã vật tư cho toàn bộ các dòng.');
        return;
      }
      if (item.quantity <= 0) {
        setFormError(`Số lượng nhập của vật tư ${item.material_code} phải lớn hơn 0.`);
        return;
      }
      if (item.unit_price < 0) {
        setFormError(`Đơn giá của vật tư ${item.material_code} không được âm.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload: CreateReceiptPayload = {
        receipt_code: formReceiptCode.trim(),
        warehouse_branch: formBranch,
        warehouse_code: formWarehouse,
        receipt_date: new Date(formReceiptDate).toISOString(),
        items: formItems.map((item) => ({
          material_code: item.material_code,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      };

      await api.post('/goods-receipts', payload);
      setSuccessMsg(`Nhập kho thành công! Phiếu ${payload.receipt_code} đã được ghi nhận trên Shard ${payload.warehouse_branch === 'HN' ? '1' : '2'}.`);
      setShowCreateModal(false);
      fetchReceipts();
    } catch (err: any) {
      setFormError(err?.message || 'Không thể tạo phiếu nhập kho. Vui lòng kiểm tra lại thông tin.');
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
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-md border bg-emerald-50 text-emerald-800 border-emerald-200">
                MODULE 06 · GOODS RECEIPTS
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Vùng sharding: <strong>{selectedBranch === 'ALL' ? 'Toàn quốc (Multi-Shard)' : `ZONE_${selectedBranch}`}</strong>
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quản Lý Phiếu Nhập Kho (Goods Receipts)
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Ghi nhận các đợt nhập vật tư từ nhà cung cấp, cập nhật tồn kho khả dụng tự động tại từng Shard và đồng bộ nhật ký kiểm toán.
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
                Tạo phiếu nhập
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium text-slate-500">Tổng số phiếu</span>
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {formatNumber(data?.total || 0)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Đã ghi nhận trong DB</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium text-slate-500">Chi nhánh thao tác</span>
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-bold text-emerald-700 font-mono">
              {selectedBranch === 'ALL' ? 'Tất cả chi nhánh' : `Chi nhánh ${selectedBranch}`}
            </div>
            <div className="text-[10px] text-emerald-600 font-mono">
              {selectedBranch === 'HN' ? 'Shard 1 (27018)' : selectedBranch === 'HCM' ? 'Shard 2 (27020)' : 'Router (27017)'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium text-slate-500">Cơ chế lưu trữ</span>
              <Server className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-sm font-bold text-slate-800 font-mono truncate">
              Compound Shard Key
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              &#123; warehouse_branch: 1, receipt_code: 1 &#125;
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium text-slate-500">Trạng thái ghi tồn</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-sm font-bold text-emerald-700 font-mono">
              Atomic Upsert ($set)
            </div>
            <div className="text-[10px] text-emerald-600 font-mono">
              Kèm log material_audit_logs
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
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
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Kho tiếp nhận</label>
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
              Danh Sách Phiếu Nhập Kho
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
              {data?.total || 0} bản ghi
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Collection: goods_receipts
          </div>
        </div>

        {loading ? (
          <div className="py-16">
            <LoadingSpinner label="Đang tải danh sách phiếu nhập kho từ MongoDB Cluster..." />
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-3 px-4 font-mono">Mã phiếu</th>
                  <th className="py-3 px-3">Chi nhánh</th>
                  <th className="py-3 px-3">Kho tiếp nhận</th>
                  <th className="py-3 px-3">Ngày nhập</th>
                  <th className="py-3 px-3">Người nhận</th>
                  <th className="py-3 px-3 text-center">Số mặt hàng</th>
                  <th className="py-3 px-3 text-right">Tổng tiền (VNĐ)</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((receipt, idx) => {
                  const itemCount = receipt.items?.length || 0;
                  const totalQty = receipt.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0;
                  return (
                    <tr key={receipt._id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {receipt.receipt_code}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {receipt.warehouse_branch}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {receipt.warehouse_code}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {formatDate(receipt.receipt_date)}
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[130px]">
                        {receipt.receiver || 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="font-semibold text-slate-900">{itemCount}</span> loại ({formatNumber(totalQty)})
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {receipt.total_amount ? formatNumber(receipt.total_amount) : '---'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge
                          status={receipt.status || 'COMPLETED'}
                          variant={
                            receipt.status === 'COMPLETED'
                              ? 'success'
                              : receipt.status === 'PENDING'
                              ? 'warning'
                              : 'neutral'
                          }
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewReceipt(receipt)}
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
            <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>Không tìm thấy phiếu nhập kho nào phù hợp với bộ lọc hiện tại.</p>
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
      {viewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Phiếu Nhập Kho:</span>
                  <span className="font-mono text-blue-700">{viewReceipt.receipt_code}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lưu trữ tại Shard: <strong>{viewReceipt.warehouse_branch === 'HN' ? 'Shard 1 (Hà Nội)' : 'Shard 2 (TP.HCM)'}</strong>
                </p>
              </div>
              <button
                onClick={() => setViewReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px]">Chi nhánh:</span>
                <span className="font-semibold text-slate-800">{viewReceipt.warehouse_branch}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Kho tiếp nhận:</span>
                <span className="font-semibold text-slate-800">{viewReceipt.warehouse_code}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ngày lập phiếu:</span>
                <span className="font-mono text-slate-800">{formatDate(viewReceipt.receipt_date)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Người nhận hàng:</span>
                <span className="font-medium text-slate-800">{viewReceipt.receiver}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Trạng thái:</span>
                <StatusBadge status={viewReceipt.status || 'COMPLETED'} variant="success" />
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tổng giá trị:</span>
                <span className="font-bold font-mono text-blue-700">
                  {viewReceipt.total_amount ? `${formatNumber(viewReceipt.total_amount)} đ` : '---'}
                </span>
              </div>
            </div>

            {/* Items list */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">Chi tiết danh mục vật tư nhập</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                      <th className="py-2.5 px-3">Mã VT</th>
                      <th className="py-2.5 px-3 text-right">Số lượng</th>
                      <th className="py-2.5 px-3 text-right">Đơn giá (VNĐ)</th>
                      <th className="py-2.5 px-3 text-right">Thành tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewReceipt.items?.map((it, idx) => {
                      const amount = (it.quantity || 0) * (it.unit_price || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-medium text-blue-700">
                            {it.material_code}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatNumber(it.quantity)} {it.unit || ''}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {formatNumber(it.unit_price)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                            {formatNumber(amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewReceipt(null)}
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Lập Phiếu Nhập Kho Mới (Goods Receipt)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dữ liệu sẽ được lưu trực tiếp vào Shard tương ứng với chi nhánh và cập nhật tồn kho tức thời.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Branch */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Chi nhánh đích <span className="text-rose-500">*</span>
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
                    Kho tiếp nhận <span className="text-rose-500">*</span>
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

                {/* Receipt Code */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Mã phiếu nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formReceiptCode}
                    onChange={(e) => setFormReceiptCode(e.target.value)}
                    placeholder="VD: GR-HN-001"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Receipt Date */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Ngày nhập kho <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formReceiptDate}
                    onChange={(e) => setFormReceiptDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Items List Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Danh sách vật tư nhập kho ({formItems.length} dòng)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm dòng vật tư
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex-1">
                        <select
                          value={item.material_code}
                          onChange={(e) => handleItemChange(idx, 'material_code', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                        >
                          <option value="">-- Chọn vật tư --</option>
                          {options.materials.map((m) => (
                            <option key={m.material_code} value={m.material_code}>
                              {m.material_code} - {m.name} ({m.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          min="1"
                          placeholder="Số lượng"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded font-mono text-right text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>

                      <div className="w-36">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="Đơn giá"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded font-mono text-right text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={formItems.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded disabled:opacity-30 disabled:hover:text-slate-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center justify-between font-mono text-xs text-blue-900">
                  <span>Tổng tiền dự tính:</span>
                  <span className="font-bold text-sm text-blue-800">
                    {formatNumber(totalCalculatedAmount)} VNĐ
                  </span>
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
                  Xác nhận Nhập kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
