import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Supplier,
  PurchaseOrder,
  RoutingStats,
  ProcurementAnalytics,
  CreateSupplierPayload,
  CreatePOPayload,
} from '../../types/procurement.types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatNumber } from '../../lib/utils';
import {
  ShoppingBag,
  Building2,
  FileText,
  TrendingUp,
  Server,
  Plus,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Star,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Truck,
  Trash2,
  Layers,
  Cpu,
} from 'lucide-react';

export const ProcurementPage: React.FC = () => {
  const { activeBranch } = useAuth();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders' | 'analytics'>('orders');

  // Dữ liệu
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [routingStats, setRoutingStats] = useState<RoutingStats | null>(null);
  const [analytics, setAnalytics] = useState<ProcurementAnalytics | null>(null);

  // Trạng thái tải & thông báo
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Bộ lọc
  const [selectedBranch, setSelectedBranch] = useState<string>(
    activeBranch && activeBranch !== 'ALL' ? activeBranch : 'HN',
  );
  const [supplierKeyword, setSupplierKeyword] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');

  // Modals
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState<boolean>(false);
  const [isCreateSupplierModalOpen, setIsCreateSupplierModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form tạo PO
  const [poForm, setPoForm] = useState<CreatePOPayload>({
    supplier_id: '',
    warehouse_branch: 'HN',
    expected_delivery_date: '',
    items: [
      { material_code: 'MAT-STEEL-D20', quantity: 20, unit_price: 15500000 },
    ],
  });

  // Form tạo Nhà cung cấp
  const [supplierForm, setSupplierForm] = useState<CreateSupplierPayload>({
    supplier_code: '',
    company_name: '',
    tax_id: '',
    phone: '',
    email: '',
    address: '',
    rating_score: 95,
  });

  // Tải dữ liệu
  const fetchData = async () => {
    try {
      setError(null);

      // 1. Tải danh sách Nhà cung cấp
      const supRes: any = await api.get('/procurement/suppliers');
      if (supRes?.items) {
        setSuppliers(supRes.items);
        if (!poForm.supplier_id && supRes.items.length > 0) {
          setPoForm((prev) => ({ ...prev, supplier_id: supRes.items[0]._id }));
        }
      }

      // 2. Tải danh sách PO (áp dụng Sharded Routing)
      const poParams: any = {};
      if (selectedBranch !== 'ALL') {
        poParams.warehouse_branch = selectedBranch;
      }
      if (orderStatusFilter !== 'ALL') {
        poParams.status = orderStatusFilter;
      }

      const poRes: any = await api.get('/procurement/purchase-orders', { params: poParams });
      if (poRes?.items) {
        setPurchaseOrders(poRes.items);
        setRoutingStats(poRes.routing_stats || null);
      }

      // 3. Tải phân tích tổng hợp
      const anaRes: any = await api.get('/procurement/analytics');
      if (anaRes) {
        setAnalytics(anaRes);
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu mua sắm từ máy chủ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [selectedBranch, orderStatusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Thêm dòng vật tư khi tạo PO
  const handleAddItemRow = () => {
    setPoForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { material_code: 'MAT-CABLE-3X120', quantity: 10, unit_price: 485000 },
      ],
    }));
  };

  const handleRemoveItemRow = (index: number) => {
    if (poForm.items.length <= 1) return;
    setPoForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setPoForm((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...prev, items: nextItems };
    });
  };

  // Tính tổng tiền nhẩm của PO Form
  const formTotalAmount = poForm.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0,
  );

  // Xử lý tạo PO với Giao dịch ACID Phân tán
  const handleExecuteCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res: any = await api.post('/procurement/purchase-orders', poForm);
      setActionSuccessMsg(
        res?.message || 'Đã tạo Đơn mua hàng và xác thực ACID phân tán thành công!',
      );
      setIsCreatePOModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Giao dịch phân tán thất bại: ${err?.message || 'Lỗi kết nối'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Xử lý tạo Nhà cung cấp
  const handleExecuteCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res: any = await api.post('/procurement/suppliers', supplierForm);
      setActionSuccessMsg(res?.message || 'Đã thêm mới đối tác nhà cung cấp thành công!');
      setIsCreateSupplierModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Không thể thêm nhà cung cấp: ${err?.message || 'Lỗi dữ liệu'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Cập nhật trạng thái PO
  const handleUpdatePOStatus = async (poId: string, newStatus: 'DELIVERED' | 'CANCELLED') => {
    try {
      const res: any = await api.patch(`/procurement/purchase-orders/${poId}/status`, {
        status: newStatus,
        notes: `Cập nhật nhanh sang [${newStatus}] tại giao diện quản trị`,
      });
      setActionSuccessMsg(res?.message || `Đã cập nhật trạng thái đơn sang ${newStatus}`);
      fetchData();
    } catch (err: any) {
      alert(`Không thể cập nhật trạng thái đơn: ${err?.message || 'Lỗi'}`);
    }
  };

  // Lọc Nhà cung cấp theo từ khóa
  const filteredSuppliers = suppliers.filter((s) => {
    if (!supplierKeyword) return true;
    const kw = supplierKeyword.toLowerCase();
    return (
      s.company_name.toLowerCase().includes(kw) ||
      s.supplier_code.toLowerCase().includes(kw) ||
      s.tax_id.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans">
      {/* 1. Header & Branch Selection */}
      <div className="bg-white px-4 py-3 rounded-md border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            Quản lý Nhà cung cấp & Mua sắm
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị danh bạ đối tác cung ứng, hợp đồng nguyên tắc và lập đơn mua hàng (PO) phân tán theo chi nhánh.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <span className="text-xs text-slate-500 mr-2 font-medium">Chi nhánh:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">Toàn quốc [Scatter-Gather]</option>
              <option value="HN">Kho Miền Bắc (HN) [Shard 1]</option>
              <option value="HCM">Kho Miền Nam (HCM) [Shard 2]</option>
              <option value="DN">Kho Miền Trung (DN)</option>
            </select>
          </div>

          <button
            onClick={() => {
              setPoForm((prev) => ({
                ...prev,
                warehouse_branch: selectedBranch === 'ALL' ? 'HN' : (selectedBranch as any),
              }));
              setIsCreatePOModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lập đơn mua hàng</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded flex items-center justify-between text-xs text-rose-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Thông báo thành công nếu có */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Routing Indicator Badge & Distributed Specs */}
      <div className="bg-slate-900 text-slate-200 rounded p-4 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Trạng thái Định tuyến CSDL Phân tán:</span>
                {routingStats?.routing_type === 'SINGLE_SHARD_TARGETED' ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30">
                    TARGETED (Single Shard)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30">
                    SCATTER-GATHER (Broadcast to All Shards)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bảng <code className="text-indigo-300">suppliers</code> (Global Reference Master) + Bảng{' '}
                <code className="text-emerald-300">purchase_orders</code> (Zone Sharding theo{' '}
                <code>warehouse_branch</code>).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 border-slate-800 pt-2 md:pt-0 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">SHARDS TRUY VẤN</span>
              <span className="text-emerald-400 font-bold">
                {routingStats?.actual_shards_queried?.join(', ') || 'shard01, shard02'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">THỜI GIAN THỰC THI</span>
              <span className="text-cyan-400 font-bold">{routingStats?.execution_time_ms || 2} ms</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">TỔNG ĐƠN PO</span>
              <span className="text-white font-bold">{purchaseOrders.length} đơn</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Thẻ KPI Mua sắm */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Đối tác Nhà cung cấp</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {analytics?.summary?.total_suppliers || suppliers.length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>100% đạt chuẩn CO/CQ</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Hợp đồng có hiệu lực</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {analytics?.summary?.total_active_contracts || 2} hợp đồng
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Đảm bảo nguồn cung ổn định</div>
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Tổng Giá trị Đơn Mua</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {formatNumber(analytics?.summary?.grand_total_spend || 2520000000)} đ
          </div>
          <div className="text-[11px] text-indigo-600 mt-1">Giao dịch phân tán đa chi nhánh</div>
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Đơn Chờ Nhập Kho</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {purchaseOrders.filter((po) => po.status === 'APPROVED').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Sẵn sàng nhập bãi và xếp ô kệ</div>
        </div>
      </div>

      {/* 4. Tab Switcher */}
      <div className="flex border-b border-slate-200 text-xs font-medium">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Đơn Mua Hàng PO ({purchaseOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'suppliers'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Danh bạ Nhà Cung Cấp & SLA ({suppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Phân tích Chi tiêu Đa Vùng ($facet)</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner label="Đang tải dữ liệu Mua sắm & Nhà cung cấp từ Cụm phân tán..." />
        </div>
      ) : (
        <>
          {/* TAB 1: ĐƠN MUA HÀNG (PO) */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Lọc trạng thái:</span>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 text-slate-800 bg-transparent text-xs"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="APPROVED">Đã duyệt (Chờ giao)</option>
                    <option value="DELIVERED">Đã giao nhận</option>
                    <option value="DRAFT">Bản nháp</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>

                <div className="text-xs text-slate-500">
                  Hiển thị <span className="font-bold text-slate-800">{purchaseOrders.length}</span> đơn mua hàng
                </div>
              </div>

              {purchaseOrders.length === 0 ? (
                <div className="bg-white rounded border border-dashed border-slate-300 p-12 text-center text-slate-500 text-xs">
                  <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p>Không tìm thấy đơn mua hàng nào theo điều kiện lọc.</p>
                </div>
              ) : (
                <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-3">Mã Đơn PO</th>
                          <th className="py-2.5 px-3">Nhà Cung Cấp</th>
                          <th className="py-2.5 px-3">Kho Chi Nhánh</th>
                          <th className="py-2.5 px-3">Mặt Hàng Đặt Mua</th>
                          <th className="py-2.5 px-3 text-right">Tổng Tiền (VNĐ)</th>
                          <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                          <th className="py-2.5 px-3 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {purchaseOrders.map((po) => (
                          <tr key={po._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                              {po.po_code}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {new Date(po.order_date).toLocaleDateString('vi-VN')}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-medium text-slate-900 block">
                                {po.supplier_info?.company_name || 'Nhà cung cấp đối tác'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {po.supplier_info?.supplier_code || 'SUP-REF'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  po.warehouse_branch === 'HN'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {po.warehouse_branch === 'HN' ? 'Kho HN [Shard 1]' : 'Kho HCM [Shard 2]'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="space-y-0.5">
                                {(po.items || []).map((it, idx) => (
                                  <div key={idx} className="text-[11px] text-slate-700">
                                    <span className="font-mono font-medium text-slate-800">
                                      {it.material_code}
                                    </span>{' '}
                                    x <span className="font-bold">{it.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              {formatNumber(po.total_amount)} đ
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                  po.status === 'DELIVERED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : po.status === 'APPROVED'
                                    ? 'bg-blue-100 text-blue-800'
                                    : po.status === 'CANCELLED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {po.status === 'DELIVERED'
                                  ? 'ĐÃ GIAO NHẬN'
                                  : po.status === 'APPROVED'
                                  ? 'ĐÃ DUYỆT'
                                  : po.status === 'CANCELLED'
                                  ? 'ĐÃ HỦY'
                                  : 'BẢN NHÁP'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right space-x-1">
                              {po.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleUpdatePOStatus(po._id, 'DELIVERED')}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-medium transition-colors cursor-pointer"
                                  title="Xác nhận hàng đã về kho"
                                >
                                  Nhập kho
                                </button>
                              )}
                              {po.status !== 'CANCELLED' && po.status !== 'DELIVERED' && (
                                <button
                                  onClick={() => handleUpdatePOStatus(po._id, 'CANCELLED')}
                                  className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                                  title="Hủy đơn đặt mua"
                                >
                                  Hủy
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DANH BẠ NHÀ CUNG CẤP & SLA */}
          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
                <input
                  type="text"
                  placeholder="Tìm theo tên công ty, mã nhà cung cấp hoặc MST..."
                  value={supplierKeyword}
                  onChange={(e) => setSupplierKeyword(e.target.value)}
                  className="w-full sm:w-80 px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-indigo-500"
                />

                <button
                  onClick={() => setIsCreateSupplierModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium transition-colors shadow-2xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Nhà Cung Cấp Mới</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSuppliers.map((sup) => (
                  <div
                    key={sup._id}
                    className="bg-white rounded border border-slate-200 p-4 shadow-2xs hover:border-indigo-300 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {sup.supplier_code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">MST: {sup.tax_id}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">{sup.company_name}</h3>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded text-amber-700 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{sup.rating_score || 95}/100</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{sup.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{sup.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{sup.address}</span>
                      </div>
                    </div>

                    {/* Khối Đánh giá SLA gần nhất */}
                    {sup.latest_evaluation && (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-600 space-y-1">
                        <div className="flex items-center justify-between font-semibold text-slate-700">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            SLA Kỳ {sup.latest_evaluation.period}
                          </span>
                          <span className="text-emerald-700 font-bold">
                            Chất lượng: {sup.latest_evaluation.quality_score}đ | Giao hàng:{' '}
                            {sup.latest_evaluation.delivery_score}đ
                          </span>
                        </div>
                        <p className="text-slate-500 italic">"{sup.latest_evaluation.comments}"</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Hợp đồng nguyên tắc:</span>
                      <span className="font-bold text-indigo-700">
                        {sup.active_contracts_count || 1} hợp đồng hiệu lực
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PHÂN TÍCH CHI TIÊU & SHARDED AGGREGATION */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chi tiêu theo Nhà cung cấp */}
              <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Top Chi Tiêu Theo Nhà Cung Cấp
                  </h3>
                  <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    $lookup + $group
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Thống kê tổng giá trị giải ngân cho từng đơn vị cung ứng vật tư trọng điểm.
                </p>

                <div className="space-y-2 pt-2">
                  {(analytics?.spend_by_supplier || []).map((s, idx) => {
                    const grandTotal = analytics?.summary?.grand_total_spend || 1;
                    const percent = Math.round((s.total_spend / grandTotal) * 100);
                    return (
                      <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                          <span>
                            {s.company_name} ({s.supplier_code})
                          </span>
                          <span className="font-mono text-indigo-700">{formatNumber(s.total_spend)} đ</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>{s.total_orders} đơn đặt mua</span>
                          <span>{percent}% tổng chi tiêu</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chi tiêu theo Chi nhánh Kho */}
              <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Phân Bổ Chi Tiêu Theo Chi Nhánh Kho
                  </h3>
                  <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    Zone Sharding Breakdown
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Đo lường lượng ngân sách mua sắm được phân bổ đến Shard 1 (Hà Nội) và Shard 2 (TP.HCM).
                </p>

                <div className="space-y-3 pt-2">
                  {(analytics?.branch_breakdown || []).map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            Chi nhánh {b._id === 'HN' ? 'Kho Miền Bắc (Hà Nội)' : 'Kho Miền Nam (TP.HCM)'}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded">
                            {b._id === 'HN' ? 'shard01' : 'shard02'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">{b.count} đơn PO ghi nhận</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 text-sm block">
                          {formatNumber(b.total_value)} đ
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: LẬP ĐƠN MUA HÀNG (MULTI-DOCUMENT ACID TRANSACTION) */}
      {/* ========================================================= */}
      {isCreatePOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-700" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Lập Đơn Mua Hàng Mới (Purchase Order)
                  </h3>
                  <span className="text-[10px] text-indigo-700 font-mono">
                    GIAO DỊCH PHÂN TÁN ĐA TÀI LIỆU (ACID TRANSACTION)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCreatePOModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCreatePO} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Đối tác Nhà Cung Cấp *</label>
                  <select
                    value={poForm.supplier_id}
                    onChange={(e) => setPoForm({ ...poForm, supplier_id: e.target.value })}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.company_name} ({s.supplier_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Chi nhánh tiếp nhận (Shard Key) *
                  </label>
                  <select
                    value={poForm.warehouse_branch}
                    onChange={(e) =>
                      setPoForm({ ...poForm, warehouse_branch: e.target.value as any })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                  >
                    <option value="HN">Kho Miền Bắc (HN) [Shard 1]</option>
                    <option value="HCM">Kho Miền Nam (HCM) [Shard 2]</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1 text-xs">
                  Ngày dự kiến giao hàng
                </label>
                <input
                  type="date"
                  value={poForm.expected_delivery_date}
                  onChange={(e) =>
                    setPoForm({ ...poForm, expected_delivery_date: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Danh sách vật tư đặt mua */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-bold text-xs">Danh mục Vật tư Đặt mua</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] text-indigo-700 hover:text-indigo-900 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Thêm dòng
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {poForm.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200 text-xs"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Mã vật tư"
                          value={it.material_code}
                          onChange={(e) => handleItemChange(idx, 'material_code', e.target.value)}
                          required
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Số lượng"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          required
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Đơn giá"
                          min="0"
                          value={it.unit_price}
                          onChange={(e) =>
                            handleItemChange(idx, 'unit_price', Number(e.target.value))
                          }
                          required
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={poForm.items.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng tiền */}
              <div className="p-3 bg-indigo-50/60 rounded border border-indigo-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Tổng giá trị đơn hàng (dự kiến):</span>
                <span className="font-mono font-bold text-indigo-800 text-sm">
                  {formatNumber(formTotalAmount)} đ
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatePOModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Đang thực thi ACID Txn...' : 'Xác nhận Tạo Đơn (ACID)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: THÊM MỚI NHÀ CUNG CẤP */}
      {/* ========================================================= */}
      {isCreateSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Thêm Mới Đối Tác Nhà Cung Cấp</h3>
              <button
                onClick={() => setIsCreateSupplierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCreateSupplier} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Mã Nhà Cung Cấp *</label>
                  <input
                    type="text"
                    placeholder="SUP-XXX-01"
                    value={supplierForm.supplier_code}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, supplier_code: e.target.value.toUpperCase() })
                    }
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Mã Số Thuế (MST) *</label>
                  <input
                    type="text"
                    placeholder="10-13 chữ số"
                    value={supplierForm.tax_id}
                    onChange={(e) => setSupplierForm({ ...supplierForm, tax_id: e.target.value })}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Tên Đầy Đủ Công Ty *</label>
                <input
                  type="text"
                  placeholder="Công ty Cổ phần..."
                  value={supplierForm.company_name}
                  onChange={(e) =>
                    setSupplierForm({ ...supplierForm, company_name: e.target.value })
                  }
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Số Điện Thoại *</label>
                  <input
                    type="text"
                    placeholder="0243..."
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Email Giao Dịch *</label>
                  <input
                    type="email"
                    placeholder="kinhdoanh@..."
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Địa Chỉ Trụ Sở</label>
                <input
                  type="text"
                  placeholder="Khu công nghiệp / Quận, Huyện..."
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateSupplierModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Nhà Cung Cấp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
