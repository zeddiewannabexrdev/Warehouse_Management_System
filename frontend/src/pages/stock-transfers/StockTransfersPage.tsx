import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  StockTransfersListResponse,
  TransactionProof,
  MaterialReturn,
  DispatchTransferPayload,
  CreateReturnPayload,
} from '../../types/stock-transfer.types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricStrip } from '../../components/common/MetricStrip';
import { formatNumber, formatDate } from '../../lib/utils';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Search,
  RotateCcw,
  ArrowRight,
  AlertCircle,
  Boxes,
  X,
} from 'lucide-react';

export const StockTransfersPage: React.FC = () => {
  const { activeBranch } = useAuth();
  const [activeTab, setActiveTab] = useState<'TRANSFERS' | 'RETURNS'>('TRANSFERS');

  const [transferData, setTransferData] = useState<StockTransfersListResponse | null>(null);
  const [returnsData, setReturnsData] = useState<{
    items: MaterialReturn[];
    projects: { _id: string; project_code: string; name: string; branch: string }[];
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [latestTxnProof, setLatestTxnProof] = useState<TransactionProof | null>(null);

  // Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fromBranch, setFromBranch] = useState<'HN' | 'HCM' | 'DN'>('HN');
  const [toBranch, setToBranch] = useState<'HN' | 'HCM' | 'DN'>('HCM');
  const [transportMethod, setTransportMethod] = useState<string>(
    'Vận chuyển đường sắt container liên vận Bắc - Nam',
  );
  const [selectedMaterial, setSelectedMaterial] = useState<string>('MAT-STEEL-D20');
  const [transferQty, setTransferQty] = useState<number>(5);

  // Material Return Modal State
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [returnBranch, setReturnBranch] = useState<'HN' | 'HCM' | 'DN'>('HN');
  const [returnProjectCode, setReturnProjectCode] = useState<string>('PRJ-EXPRESS-01');
  const [returnReason, setReturnReason] = useState<
    'EXCESS_MATERIAL' | 'DEFECTIVE' | 'WRONG_SPECIFICATION'
  >('EXCESS_MATERIAL');
  const [returnMaterialCode, setReturnMaterialCode] = useState<string>('MAT-STEEL-D20');
  const [returnQuantity, setReturnQuantity] = useState<number>(2);
  const [returnCondition, setReturnCondition] = useState<string>('Nguyên vẹn, đủ tem CO/CQ');

  const fetchAllData = async () => {
    try {
      setErrorMsg(null);
      const [trfRes, retRes] = await Promise.all([
        api.get<StockTransfersListResponse>('/stock-transfers', {
          params: {
            branch: activeBranch,
            status: statusFilter,
            search: searchKeyword || undefined,
          },
        }),
        api.get<{
          items: MaterialReturn[];
          projects: { _id: string; project_code: string; name: string; branch: string }[];
        }>('/stock-transfers/returns', {
          params: { branch: activeBranch },
        }),
      ]);
      setTransferData(trfRes);
      setReturnsData(retRes);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tải dữ liệu điều phối liên kho từ Backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAllData();
  }, [activeBranch, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setRefreshing(true);
    fetchAllData();
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromBranch === toBranch) {
      setErrorMsg('Chi nhánh kho xuất và chi nhánh kho nhận phải khác nhau!');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const matObj = transferData?.materials_catalog?.find(
        (m) => m.material_code === selectedMaterial,
      );

      const payload: DispatchTransferPayload = {
        from_branch: fromBranch,
        to_branch: toBranch,
        transport_method: transportMethod,
        items: [
          {
            material_code: selectedMaterial,
            quantity: Number(transferQty),
            unit: matObj?.unit || 'Đơn vị',
          },
        ],
      };

      const res = await api.post<{ transfer: any; transaction_proof: TransactionProof }>(
        '/stock-transfers/dispatch',
        payload,
      );

      setLatestTxnProof(res.transaction_proof);
      setSuccessMsg(
        `Đã phát lệnh xuất điều chuyển [${res.transfer.transfer_code}] từ ${fromBranch} sang ${toBranch} thành công!`,
      );
      setShowDispatchModal(false);
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi thực thi giao dịch xuất điều chuyển liên kho.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveTransfer = async (transferCode: string) => {
    try {
      setRefreshing(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await api.post<{ transfer: any; transaction_proof: TransactionProof }>(
        `/stock-transfers/${transferCode}/receive`,
        {},
      );
      setLatestTxnProof(res.transaction_proof);
      setSuccessMsg(
        `Đã xác nhận tiếp nhận lô hàng [${transferCode}] vào Shard đích [${res.transfer.to_branch}] thành công!`,
      );
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tiếp nhận phiếu điều chuyển.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelTransfer = async (transferCode: string) => {
    try {
      setRefreshing(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await api.post<{ transfer: any; transaction_proof: TransactionProof }>(
        `/stock-transfers/${transferCode}/cancel`,
        {},
      );
      setLatestTxnProof(res.transaction_proof);
      setSuccessMsg(
        `Đã hủy phiếu [${transferCode}] và hoàn trả tồn kho về Shard nguồn [${res.transfer.from_branch}].`,
      );
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể hủy phiếu điều chuyển.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const payload: CreateReturnPayload = {
        warehouse_branch: returnBranch,
        project_code: returnProjectCode,
        reason: returnReason,
        items: [
          {
            material_code: returnMaterialCode,
            quantity: Number(returnQuantity),
            condition: returnCondition,
          },
        ],
      };

      const res = await api.post<any>('/stock-transfers/returns', payload);
      setSuccessMsg(
        `Đã lập biên bản thu hồi vật tư [${res.return_code}] về kho [${returnBranch}] thành công!`,
      );
      setShowReturnModal(false);
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tạo phiếu thu hồi vật tư.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Đang tải dữ liệu điều phối & luân chuyển liên kho..." />;
  }

  const routing = transferData?.routing_stats;
  const summary = transferData?.summary;
  const availableInSourceBranch =
    transferData?.branch_stocks?.find(
      (s) => s.warehouse_branch === fromBranch && s.material_code === selectedMaterial,
    )?.available_quantity ?? 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-white px-4 py-3 rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded border bg-blue-50 text-blue-700 border-blue-200">
              CROSS-ZONE 2PC
            </span>
            <span className="text-xs text-slate-500 font-mono">
              HN (27018) ⇄ HCM (27020)
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Điều phối & Luân chuyển Vật tư Liên kho
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Điều phối luân chuyển vật tư giữa Tổng kho Miền Bắc (Shard 1) và Tổng kho Miền Nam (Shard 2) kèm thu hồi công trình.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchAllData();
            }}
            disabled={refreshing}
            className="p-1.5 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {activeTab === 'TRANSFERS' ? (
            <button
              onClick={() => setShowDispatchModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lập lệnh điều chuyển</span>
            </button>
          ) : (
            <button
              onClick={() => setShowReturnModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lập phiếu thu hồi</span>
            </button>
          )}
        </div>
      </div>

      {/* Cross-Zone Status Bar */}
      <div className="bg-white px-3.5 py-2 rounded-md border border-slate-200 text-xs flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-semibold text-slate-900">Cơ chế điều phối liên vùng (Cross-Zone Sharding):</span>
          <span className="text-slate-500 hidden sm:inline">{routing?.description || 'Giao dịch ACID 2 pha bảo đảm cân bằng tồn kho tức thời giữa 2 Shard.'}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
            Shard 1: Hà Nội (27018)
          </span>
          <ArrowLeftRight className="w-3 h-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700">
            Router (27017)
          </span>
          <ArrowLeftRight className="w-3 h-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-semibold">
            Shard 2: TP.HCM (27020)
          </span>
        </div>
      </div>

      {/* Latest Distributed ACID Transaction Proof */}
      {latestTxnProof && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded p-4 text-xs text-emerald-950 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Bằng chứng Giao dịch Phân tán ACID ({latestTxnProof.transaction_id}) —{' '}
                {latestTxnProof.status}
              </span>
            </div>
            <button
              onClick={() => setLatestTxnProof(null)}
              className="text-emerald-700 hover:text-emerald-950 text-[11px] font-mono"
            >
              Đóng [x]
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px]">
            <div className="bg-white/80 p-2 rounded border border-emerald-200">
              <span className="text-slate-500">Read/Write Concern:</span>{' '}
              <strong>
                {latestTxnProof.read_concern} / {latestTxnProof.write_concern}
              </strong>
            </div>
            <div className="bg-white/80 p-2 rounded border border-emerald-200">
              <span className="text-slate-500">Audit Log TTL:</span>{' '}
              <strong>{latestTxnProof.audit_log_code}</strong>
            </div>
            <div className="bg-white/80 p-2 rounded border border-emerald-200">
              <span className="text-slate-500">Shards tham gia:</span>{' '}
              <strong>{latestTxnProof.participating_shards.join(' + ')}</strong>
            </div>
          </div>
          <div className="pt-1 space-y-1 text-[11px] font-mono text-emerald-800">
            {latestTxnProof.operations_executed.map((op, i) => (
              <div key={i}>{op}</div>
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Metric Strip */}
      <MetricStrip
        items={[
          {
            label: 'Tổng Lệnh Điều chuyển',
            value: summary?.total_transfers || 0,
            subText: 'Collection: stock_transfers',
          },
          {
            label: 'Đang Vận chuyển',
            value: summary?.in_transit_count || 0,
            subText: 'Status: IN_TRANSIT',
            status: (summary?.in_transit_count || 0) > 0 ? 'warning' : 'neutral',
          },
          {
            label: 'Đã Nhập Kho Đích',
            value: summary?.received_count || 0,
            subText: 'Status: RECEIVED',
            status: 'success',
          },
          {
            label: 'Biên bản Thu hồi',
            value: returnsData?.items?.length || 0,
            subText: 'Collection: material_returns',
            status: 'info',
          },
        ]}
      />

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('TRANSFERS')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'TRANSFERS'
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Phiếu Điều chuyển Liên kho (stock_transfers)</span>
          </button>
          <button
            onClick={() => setActiveTab('RETURNS')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'RETURNS'
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thu hồi Vật tư Công trình (material_returns)</span>
          </button>
        </div>
      </div>

      {activeTab === 'TRANSFERS' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-2.5 rounded-md border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-xs font-medium font-mono transition-colors ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'Tất cả trạng thái' : st}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="flex items-center gap-1.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm mã phiếu TRF, mã VT..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors"
              >
                Lọc
              </button>
            </form>
          </div>

          {/* Stock Transfers Table */}
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr>
                    <th>Mã Điều chuyển</th>
                    <th>Lộ trình Liên Vùng (Cross-Zone)</th>
                    <th>Danh mục Vật tư & Khối lượng</th>
                    <th>Phương thức Vận tải</th>
                    <th className="num">Ngày xuất</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {transferData?.items && transferData.items.length > 0 ? (
                    transferData.items.map((trf) => (
                      <tr key={trf._id || trf.transfer_code}>
                        <td className="font-mono font-bold text-blue-700">
                          {trf.transfer_code}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 font-semibold text-slate-800">
                              {trf.from_branch}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 border border-blue-200 font-semibold text-blue-800">
                              {trf.to_branch}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {trf.source_shard} → {trf.destination_shard}
                          </div>
                        </td>
                        <td>
                          <div className="space-y-0.5">
                            {trf.items.map((it, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
                                  {it.material_code}
                                </span>
                                <span className="text-xs text-slate-800">
                                  {it.material_name}
                                </span>
                                <span className="font-mono font-bold text-blue-700 text-xs">
                                  x {formatNumber(it.quantity)} {it.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="text-slate-600 max-w-[180px] truncate text-xs">
                          {trf.transport_method}
                        </td>
                        <td className="num text-slate-500 text-[11px]">
                          {formatDate(trf.transfer_date)}
                        </td>
                        <td>
                          <StatusBadge
                            status={trf.status}
                            variant={
                              trf.status === 'RECEIVED'
                                ? 'success'
                                : trf.status === 'IN_TRANSIT'
                                ? 'warning'
                                : 'danger'
                            }
                          />
                        </td>
                        <td className="text-right">
                          {trf.status === 'IN_TRANSIT' ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleReceiveTransfer(trf.transfer_code)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded transition-colors"
                                title="Xác nhận hàng đã tới kho đích và cộng tồn kho trên Shard đích"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Nhập Kho Đích ({trf.to_branch})
                              </button>
                              <button
                                onClick={() => handleCancelTransfer(trf.transfer_code)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-medium rounded transition-colors"
                                title="Hủy điều chuyển và hoàn lại tồn kho cho Shard nguồn"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-400">
                              Đã chốt giao dịch ACID
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Không có phiếu điều chuyển liên kho nào khớp bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Branch Stock Matrix for Dispatch Reference */}
          <div className="bg-white p-5 rounded border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-brand-700" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Số dư Tồn kho Khả dụng theo Vùng Phân mảnh (Cơ sở Điều phối Liên kho)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Shard Key: {'{ warehouse_branch: 1, material_code: 1 }'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {transferData?.branch_stocks?.map((st, i) => (
                <div
                  key={i}
                  className="p-3 rounded border border-slate-200 bg-slate-50/70 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-bold text-brand-700">{st.material_code}</span>
                      <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-semibold">
                        ZONE_{st.warehouse_branch}
                      </span>
                    </div>
                    <div className="font-medium text-slate-800 mt-1 truncate">
                      {st.material_name}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between font-mono">
                    <span className="text-slate-500 text-[11px]">Khả dụng xuất:</span>
                    <span className="font-bold text-emerald-700">
                      {formatNumber(st.available_quantity)} / {formatNumber(st.quantity)} {st.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Material Returns */
        <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Danh sách Biên bản Hoàn trả / Thu hồi Vật tư từ Công trường (material_returns)
              </h3>
              <p className="text-xs text-slate-500">
                Vật tư dư thừa nguyên vẹn (EXCESS_MATERIAL) khi thu hồi sẽ tự động cộng lại vào tồn kho Shard chi nhánh.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Mã Thu hồi</th>
                  <th className="py-3 px-4">Chi nhánh Nhập lại</th>
                  <th className="py-3 px-4">Dự án / Công trình</th>
                  <th className="py-3 px-4">Vật tư Hoàn trả</th>
                  <th className="py-3 px-4">Lý do Thu hồi</th>
                  <th className="py-3 px-4">Người tiếp nhận</th>
                  <th className="py-3 px-4 text-right">Ngày thu hồi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returnsData?.items && returnsData.items.length > 0 ? (
                  returnsData.items.map((ret) => (
                    <tr key={ret._id || ret.return_code} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-brand-700">
                        {ret.return_code}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold">
                          {ret.warehouse_branch} ({ret.warehouse_code})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {ret.project_name}
                      </td>
                      <td className="py-3 px-4">
                        {ret.items.map((it, idx) => (
                          <div key={idx} className="font-mono text-xs">
                            <strong>{it.material_code}</strong>: {formatNumber(it.quantity)}{' '}
                            {it.unit || ''} ({it.condition || 'Nguyên vẹn'})
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={ret.reason}
                          variant={
                            ret.reason === 'EXCESS_MATERIAL'
                              ? 'success'
                              : ret.reason === 'DEFECTIVE'
                              ? 'danger'
                              : 'warning'
                          }
                        />
                      </td>
                      <td className="py-3 px-4 text-slate-700">{ret.accepted_by}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {formatDate(ret.return_date)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Chưa có biên bản thu hồi vật tư công trình nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Dispatch Cross-Warehouse Stock Transfer */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 bg-[#0e1726] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">
                  Lập Lệnh Điều chuyển Vật tư Liên kho (Cross-Shard ACID)
                </h3>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kho Nguồn (Xuất đi)
                  </label>
                  <select
                    value={fromBranch}
                    onChange={(e) => setFromBranch(e.target.value as 'HN' | 'HCM' | 'DN')}
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white font-medium"
                  >
                    <option value="HN">HN - Tổng kho Miền Bắc (Shard 1)</option>
                    <option value="HCM">HCM - Tổng kho Miền Nam (Shard 2)</option>
                    <option value="DN">DN - Kho Miền Trung (Primary)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kho Đích (Tiếp nhận)
                  </label>
                  <select
                    value={toBranch}
                    onChange={(e) => setToBranch(e.target.value as 'HN' | 'HCM' | 'DN')}
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white font-medium"
                  >
                    <option value="HCM">HCM - Tổng kho Miền Nam (Shard 2)</option>
                    <option value="HN">HN - Tổng kho Miền Bắc (Shard 1)</option>
                    <option value="DN">DN - Kho Miền Trung (Primary)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vật tư Điều chuyển
                </label>
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 bg-white font-mono"
                >
                  {transferData?.materials_catalog?.map((m) => (
                    <option key={m.material_code} value={m.material_code}>
                      {m.material_code} — {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-[11px] font-mono text-slate-500">
                  Tồn kho khả dụng tại [{fromBranch}]:{' '}
                  <strong className="text-emerald-700">{availableInSourceBranch}</strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số lượng xuất điều chuyển
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phương thức vận tải liên vùng
                </label>
                <input
                  type="text"
                  required
                  value={transportMethod}
                  onChange={(e) => setTransportMethod(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] text-slate-600">
                Giao dịch sẽ khóa & trừ trực tiếp số lượng khả dụng tại{' '}
                <strong>ZONE_{fromBranch}</strong> và tạo vận đơn <strong>IN_TRANSIT</strong> chờ{' '}
                <strong>ZONE_{toBranch}</strong> nghiệm thu.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold rounded"
                >
                  {submitting ? 'Đang thực thi ACID Txn...' : 'Xác nhận Phát lệnh Xuất'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Material Return */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 bg-[#0e1726] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  Lập Biên bản Thu hồi Vật tư Công trình (material_returns)
                </h3>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chi nhánh Kho tiếp nhận
                  </label>
                  <select
                    value={returnBranch}
                    onChange={(e) => setReturnBranch(e.target.value as 'HN' | 'HCM' | 'DN')}
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white"
                  >
                    <option value="HN">HN - Tổng kho Miền Bắc</option>
                    <option value="HCM">HCM - Tổng kho Miền Nam</option>
                    <option value="DN">DN - Kho Miền Trung</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lý do hoàn trả
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) =>
                      setReturnReason(
                        e.target.value as
                          | 'EXCESS_MATERIAL'
                          | 'DEFECTIVE'
                          | 'WRONG_SPECIFICATION',
                      )
                    }
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white font-mono"
                  >
                    <option value="EXCESS_MATERIAL">EXCESS_MATERIAL (Dư thừa công trình)</option>
                    <option value="DEFECTIVE">DEFECTIVE (Hư hỏng / Lỗi kỹ thuật)</option>
                    <option value="WRONG_SPECIFICATION">WRONG_SPECIFICATION (Sai quy cách)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dự án / Công trình hoàn trả
                </label>
                <select
                  value={returnProjectCode}
                  onChange={(e) => setReturnProjectCode(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 bg-white"
                >
                  {returnsData?.projects?.map((p) => (
                    <option key={p.project_code} value={p.project_code}>
                      {p.project_code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã vật tư</label>
                  <select
                    value={returnMaterialCode}
                    onChange={(e) => setReturnMaterialCode(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white font-mono"
                  >
                    {transferData?.materials_catalog?.map((m) => (
                      <option key={m.material_code} value={m.material_code}>
                        {m.material_code} ({m.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số lượng hoàn trả
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tình trạng vật tư khi thu hồi
                </label>
                <input
                  type="text"
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold rounded"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Biên bản Thu hồi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
