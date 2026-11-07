import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  StocktakeListResponse,
  BranchStockSnapshotResponse,
  MaterialBatchRecord,
  QualityInspectionRecord,
  SubmitStocktakePayload,
} from '../../types/stocktake.types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricStrip } from '../../components/common/MetricStrip';
import { formatNumber, formatDate } from '../../lib/utils';

const formatCurrency = (val: number) => `${formatNumber(Math.round(val || 0))} ₫`;
import {
  ClipboardList,
  CheckCircle2,
  Scale,
  RefreshCw,
  Server,
  ShieldCheck,
  FileSpreadsheet,
  Award,
  AlertCircle,
} from 'lucide-react';

export const StocktakesPage: React.FC = () => {
  const { activeBranch } = useAuth();
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'WORKSHEET' | 'QUALITY'>('RECORDS');

  const [listData, setListData] = useState<StocktakeListResponse | null>(null);
  const [snapshotData, setSnapshotData] = useState<BranchStockSnapshotResponse | null>(null);
  const [qualityData, setQualityData] = useState<{
    batches: MaterialBatchRecord[];
    inspections: QualityInspectionRecord[];
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [worksheetBranch, setWorksheetBranch] = useState<'HN' | 'HCM' | 'DN'>(
    activeBranch === 'HCM' || activeBranch === 'DN' ? activeBranch : 'HN',
  );
  const [auditorName, setAuditorName] = useState<string>('Ban Kiểm toán Nội bộ - Đỗ Thu Hương');
  const [countsMap, setCountsMap] = useState<
    Record<string, { actual_qty: number; explanation: string }>
  >({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [reconcileProof, setReconcileProof] = useState<any | null>(null);

  const fetchStocktakes = async () => {
    try {
      setErrorMsg(null);
      const [stRes, qbRes] = await Promise.all([
        api.get<StocktakeListResponse>('/stocktakes', {
          params: { branch: activeBranch, status: statusFilter },
        }),
        api.get<{ batches: MaterialBatchRecord[]; inspections: QualityInspectionRecord[] }>(
          '/stocktakes/quality-batches',
        ),
      ]);
      setListData(stRes);
      setQualityData(qbRes);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tải dữ liệu kiểm kê đối soát từ Backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBranchSnapshot = async (targetBranch: 'HN' | 'HCM' | 'DN') => {
    try {
      const snap = await api.get<BranchStockSnapshotResponse>('/stocktakes/snapshot', {
        params: { branch: targetBranch },
      });
      setSnapshotData(snap);
      const initialCounts: Record<string, { actual_qty: number; explanation: string }> = {};
      snap.items.forEach((item) => {
        initialCounts[item.material_code] = {
          actual_qty: item.system_qty,
          explanation: 'Khớp 100% thẻ kho',
        };
      });
      setCountsMap(initialCounts);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể chụp nhanh dữ liệu tồn kho trên Shard.');
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStocktakes();
    if (activeBranch === 'HN' || activeBranch === 'HCM' || activeBranch === 'DN') {
      setWorksheetBranch(activeBranch);
      fetchBranchSnapshot(activeBranch);
    } else {
      fetchBranchSnapshot(worksheetBranch);
    }
  }, [activeBranch, statusFilter]);

  const handleWorksheetBranchChange = (br: 'HN' | 'HCM' | 'DN') => {
    setWorksheetBranch(br);
    fetchBranchSnapshot(br);
  };

  const handleCountChange = (materialCode: string, actualQty: number) => {
    const sysItem = snapshotData?.items.find((i) => i.material_code === materialCode);
    const sysQty = sysItem?.system_qty ?? 0;
    const diff = actualQty - sysQty;

    let autoNote = 'Khớp 100% thẻ kho';
    if (diff > 0) autoNote = `Phát hiện thừa +${diff} ${sysItem?.unit || ''} tại ô kệ`;
    if (diff < 0) autoNote = `Phát hiện hao hụt ${diff} ${sysItem?.unit || ''} khi kiểm đếm`;

    setCountsMap((prev) => ({
      ...prev,
      [materialCode]: {
        actual_qty: actualQty,
        explanation: autoNote,
      },
    }));
  };

  const handleExplanationChange = (materialCode: string, explanation: string) => {
    setCountsMap((prev) => ({
      ...prev,
      [materialCode]: {
        ...(prev[materialCode] || { actual_qty: 0 }),
        explanation,
      },
    }));
  };

  const handleSubmitWorksheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotData || snapshotData.items.length === 0) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const payload: SubmitStocktakePayload = {
        warehouse_branch: worksheetBranch,
        warehouse_code: snapshotData.warehouse_code,
        auditor: auditorName,
        items: snapshotData.items.map((item) => ({
          material_code: item.material_code,
          actual_qty: Number(countsMap[item.material_code]?.actual_qty ?? item.system_qty),
          explanation: countsMap[item.material_code]?.explanation || 'Khớp 100% thẻ kho',
        })),
      };

      const res = await api.post<any>('/stocktakes/submit', payload);
      setSuccessMsg(
        `Đã nạp biên bản kiểm kê [${res.stocktake.stocktake_code}] với trạng thái [${res.stocktake.status}] trên ${res.shard_queried}!`,
      );
      setActiveTab('RECORDS');
      await fetchStocktakes();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi nạp biên bản kiểm kê thực tế.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReconcile = async (stocktakeCode: string) => {
    try {
      setRefreshing(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await api.post<any>(`/stocktakes/${stocktakeCode}/reconcile`, {});
      setReconcileProof(res.transaction_proof);
      setSuccessMsg(
        `Đã duyệt điều chỉnh cân đối kho cho biên bản [${stocktakeCode}] bằng giao dịch ACID thành công!`,
      );
      await fetchStocktakes();
      await fetchBranchSnapshot(worksheetBranch);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi thực thi đối soát điều chỉnh tồn kho.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Đang tải dữ liệu kiểm kê kho & đối soát phân tán..." />;
  }

  const routing = listData?.routing_stats;
  const summary = listData?.summary;

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-white px-4 py-3 rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded border bg-blue-50 text-blue-700 border-blue-200">
              AUDIT & RECONCILIATION
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Single-Shard Targeted Query
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Kiểm kê Kho & Đối soát Tồn kho Thực tế
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chụp nhanh tồn kho từ Shard chi nhánh, đối chiếu số lượng kiểm đếm thực tế tại ô kệ và điều chỉnh số dư nguyên tử.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchStocktakes();
            }}
            disabled={refreshing}
            className="p-1.5 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setActiveTab('WORKSHEET')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Lập bảng kiểm đếm</span>
          </button>
        </div>
      </div>

      {/* Distributed Status Bar */}
      <div className="bg-white px-3.5 py-2 rounded-md border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-semibold text-slate-900">Định tuyến đối soát tồn kho:</span>
          <span className="text-slate-500">{routing?.description || 'Truy vấn định tuyến trực tiếp vào Shard chi nhánh tương ứng.'}</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700">
            Node: <strong className="text-emerald-700">{routing?.executing_shard || 'Shard 1'}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700">
            Độ trễ: <strong className="text-blue-700">{routing?.execution_time_ms || 2} ms</strong>
          </span>
        </div>
      </div>

      {reconcileProof && (
        <div className="bg-emerald-50 border border-emerald-200 rounded p-4 text-xs text-emerald-950 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Bút toán Điều chỉnh Cân đối Kho ACID ({reconcileProof.transaction_id}) —{' '}
                {reconcileProof.status}
              </span>
            </div>
            <button
              onClick={() => setReconcileProof(null)}
              className="text-emerald-700 hover:text-emerald-950 font-mono text-[11px]"
            >
              Đóng [x]
            </button>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-emerald-800">
            {reconcileProof.operations_executed?.map((op: string, idx: number) => (
              <div key={idx}>{op}</div>
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
            label: 'Tổng Đợt Kiểm kê',
            value: summary?.total_stocktakes || 0,
            subText: 'Collection: stocktakes',
          },
          {
            label: 'Khớp 100% Sổ sách',
            value: summary?.balanced_count || 0,
            subText: 'Status: BALANCED',
            status: 'success',
          },
          {
            label: 'Phát hiện Chênh lệch',
            value: summary?.discrepancy_count || 0,
            subText: 'Status: DISCREPANCY',
            status: (summary?.discrepancy_count || 0) > 0 ? 'danger' : 'success',
          },
          {
            label: 'Đã Cân đối ACID',
            value: summary?.adjusted_count || 0,
            subText: 'Status: ADJUSTED',
            status: 'info',
          },
        ]}
      />

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('RECORDS')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'RECORDS'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>1. Biên bản Kiểm kê & Cân đối Kho (stocktakes)</span>
        </button>

        <button
          onClick={() => setActiveTab('WORKSHEET')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'WORKSHEET'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>2. Bàn Kiểm đếm Thực tế & Chụp nhanh Tồn kho (Live Snapshot)</span>
        </button>

        <button
          onClick={() => setActiveTab('QUALITY')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'QUALITY'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>3. Hồ sơ Lô CO/CQ & Kiểm định KCS (material_batches & quality_inspections)</span>
        </button>
      </div>

      {activeTab === 'RECORDS' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {['ALL', 'BALANCED', 'DISCREPANCY_FOUND', 'ADJUSTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-brand-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st === 'ALL' ? 'Tất cả biên bản' : st}
              </button>
            ))}
          </div>

          {listData?.items && listData.items.length > 0 ? (
            <div className="space-y-4">
              {listData.items.map((record) => (
                <div
                  key={record._id || record.stocktake_code}
                  className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden"
                >
                  <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-mono font-bold text-sm text-brand-700">
                        {record.stocktake_code}
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono font-semibold text-slate-700">
                        Chi nhánh: {record.warehouse_branch} ({record.warehouse_code})
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {record.shard_node}
                      </span>
                      <span className="text-slate-500">
                        Kiểm toán viên: <strong className="text-slate-700">{record.auditor}</strong>
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {formatDate(record.check_date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge
                        status={record.status}
                        variant={
                          record.status === 'BALANCED'
                            ? 'success'
                            : record.status === 'ADJUSTED'
                            ? 'info'
                            : 'danger'
                        }
                      />
                      {record.status === 'DISCREPANCY_FOUND' && (
                        <button
                          onClick={() => handleReconcile(record.stocktake_code)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded shadow-2xs transition-colors"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          Duyệt Điều chỉnh Cân đối Kho (ACID)
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-medium bg-white">
                          <th className="py-2.5 px-4">Mã Vật tư</th>
                          <th className="py-2.5 px-4">Tên Vật tư</th>
                          <th className="py-2.5 px-4 text-right">Tồn Sổ sách (Shard)</th>
                          <th className="py-2.5 px-4 text-right">Kiểm đếm Thực tế</th>
                          <th className="py-2.5 px-4 text-right">Chênh lệch (Variance)</th>
                          <th className="py-2.5 px-4 text-right">Giá trị Lệch (Ước tính)</th>
                          <th className="py-2.5 px-4">Giải trình Kiểm toán</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {record.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-4 font-mono font-semibold text-brand-700">
                              {it.material_code}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-slate-800">
                              {it.material_name}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                              {formatNumber(it.system_qty)} {it.unit}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                              {formatNumber(it.actual_qty)} {it.unit}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold">
                              {it.variance === 0 ? (
                                <span className="text-emerald-600">0 (Khớp)</span>
                              ) : it.variance > 0 ? (
                                <span className="text-sky-600">+{it.variance}</span>
                              ) : (
                                <span className="text-rose-600">{it.variance}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                              {formatCurrency(it.variance_value || 0)}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">{it.explanation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-10 rounded border border-slate-200 text-center text-xs text-slate-400">
              Không có biên bản kiểm kê nào khớp bộ lọc.
            </div>
          )}
        </div>
      )}

      {activeTab === 'WORKSHEET' && (
        <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bàn Kiểm đếm Thực tế & Đối chiếu Tồn kho Trực tiếp trên Shard (Targeted Snapshot)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập số lượng kiểm đếm thực tế tại kệ để hệ thống tự động tính toán độ lệch (variance) và phân loại trạng thái đối soát.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-slate-700">Chọn Chi nhánh Kiểm kê:</span>
              {(['HN', 'HCM', 'DN'] as const).map((br) => (
                <button
                  key={br}
                  type="button"
                  onClick={() => handleWorksheetBranchChange(br)}
                  className={`px-3 py-1.5 rounded font-mono font-semibold transition-colors ${
                    worksheetBranch === br
                      ? 'bg-brand-700 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Kho {br}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmitWorksheet} className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded bg-slate-50 border border-slate-200 font-mono">
                <div className="text-slate-400 text-[10px] uppercase">Shard Đích Truy vấn</div>
                <div className="font-bold text-slate-800 mt-0.5">{snapshotData?.shard_target}</div>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200 font-mono">
                <div className="text-slate-400 text-[10px] uppercase">Kế hoạch Thực thi</div>
                <div className="font-bold text-emerald-700 mt-0.5">
                  {snapshotData?.winning_stage}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Trưởng đoàn Kiểm toán / Kiểm kê
                </label>
                <input
                  type="text"
                  required
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Vị trí Ô kệ</th>
                    <th className="py-3 px-4">Mã Vật tư</th>
                    <th className="py-3 px-4">Tên Vật tư</th>
                    <th className="py-3 px-4 text-right">Tồn Hệ thống (system_qty)</th>
                    <th className="py-3 px-4 text-right w-40">Đếm Thực tế (actual_qty)</th>
                    <th className="py-3 px-4 text-right">Độ lệch (variance)</th>
                    <th className="py-3 px-4">Giải trình nguyên nhân chênh lệch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {snapshotData?.items.map((item) => {
                    const currentActual =
                      countsMap[item.material_code]?.actual_qty ?? item.system_qty;
                    const variance = currentActual - item.system_qty;

                    return (
                      <tr key={item.material_code} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {item.location_code}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-brand-700">
                          {item.material_code}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {item.material_name}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                          {formatNumber(item.system_qty)} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            min={0}
                            value={currentActual}
                            onChange={(e) =>
                              handleCountChange(item.material_code, Number(e.target.value))
                            }
                            className="w-28 text-right border border-slate-300 rounded px-2.5 py-1 font-mono font-bold text-slate-900 focus:ring-1 focus:ring-brand-600"
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {variance === 0 ? (
                            <span className="text-emerald-600">0 (BALANCED)</span>
                          ) : variance > 0 ? (
                            <span className="text-sky-600">+{variance} (Thừa)</span>
                          ) : (
                            <span className="text-rose-600">{variance} (Thiếu)</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={countsMap[item.material_code]?.explanation || ''}
                            onChange={(e) =>
                              handleExplanationChange(item.material_code, e.target.value)
                            }
                            className="w-full border border-slate-200 rounded px-2.5 py-1 text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Mẹo Demo: Hãy thử thay đổi số lượng Đếm Thực tế khác với Tồn Hệ thống để tạo biên bản{' '}
                <strong className="font-mono text-rose-600">DISCREPANCY_FOUND</strong> và thử nghiệm nút{' '}
                <strong>Duyệt Điều chỉnh Cân đối Kho (ACID)</strong>.
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold rounded shadow-2xs"
              >
                {submitting ? 'Đang ghi nhận...' : 'Nạp Biên bản Kiểm kê Kho'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'QUALITY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Material Batches */}
          <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Quản lý Lô Sản xuất & Chứng chỉ Xuất xứ CO/CQ (material_batches)
              </h3>
              <p className="text-xs text-slate-500">
                Đối chiếu số lô, ngày sản xuất, hạn sử dụng khi kiểm kê vật tư tại kệ.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">Số Lô (Batch)</th>
                    <th className="py-2.5 px-4">Vật tư</th>
                    <th className="py-2.5 px-4">Chứng chỉ CO/CQ</th>
                    <th className="py-2.5 px-4">Xuất xứ</th>
                    <th className="py-2.5 px-4">Trạng thái QC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {qualityData?.batches.map((b) => (
                    <tr key={b._id || b.batch_number} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-brand-700">
                        {b.batch_number}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-800">{b.material_name}</div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {b.material_code}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-700">{b.co_cq_number}</td>
                      <td className="py-2.5 px-4 text-slate-600">{b.origin_country}</td>
                      <td className="py-2.5 px-4">
                        <StatusBadge
                          status={b.inspection_status}
                          variant={b.inspection_status === 'PASSED' ? 'success' : 'warning'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quality Inspections */}
          <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Biên bản Nghiệm thu Kỹ thuật KCS / QC (quality_inspections)
              </h3>
              <p className="text-xs text-slate-500">
                Kết quả thử nghiệm tiêu chuẩn kỹ thuật đầu vào và định kỳ của từng lô hàng.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">Mã KCS</th>
                    <th className="py-2.5 px-4">Lô / Vật tư</th>
                    <th className="py-2.5 px-4">Tiêu chí Thử nghiệm</th>
                    <th className="py-2.5 px-4">Kỹ sư KCS</th>
                    <th className="py-2.5 px-4">Kết luận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {qualityData?.inspections.map((q) => (
                    <tr key={q._id || q.inspection_code} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-brand-700">
                        {q.inspection_code}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-mono font-semibold text-slate-800">
                          {q.batch_number}
                        </div>
                        <div className="text-[11px] text-slate-500">{q.material_code}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(q.test_criteria || []).map((c, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-700"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{q.inspector}</td>
                      <td className="py-2.5 px-4">
                        <StatusBadge
                          status={q.result}
                          variant={q.result === 'PASSED' ? 'success' : 'danger'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
