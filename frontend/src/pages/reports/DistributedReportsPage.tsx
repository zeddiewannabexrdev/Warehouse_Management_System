import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  DistributedAnalyticsResponse,
  ValuationsResponse,
  CalculateValuationPayload,
} from '../../types/report.types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatNumber, formatDate } from '../../lib/utils';

const formatCurrency = (val: number) => `${formatNumber(Math.round(val || 0))} ₫`;
import {
  BarChart3,
  Calculator,
  AlertTriangle,
  RefreshCw,
  Server,
  Layers,
  CheckCircle2,
  AlertCircle,
  Building2,
  TrendingUp,
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

export const DistributedReportsPage: React.FC = () => {
  const { activeBranch } = useAuth();
  const [activeTab, setActiveTab] = useState<'VALUATIONS' | 'AGGREGATIONS' | 'LOW_STOCK'>(
    'VALUATIONS',
  );

  const [analytics, setAnalytics] = useState<DistributedAnalyticsResponse | null>(null);
  const [valuations, setValuations] = useState<ValuationsResponse | null>(null);
  const [valuationMethod, setValuationMethod] = useState<
    'FIFO' | 'WEIGHTED_AVERAGE' | 'SPECIFIC_IDENTIFICATION'
  >('FIFO');

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate & Save Valuation Form
  const [calcBranch, setCalcBranch] = useState<'HN' | 'HCM' | 'DN'>('HN');
  const [calcPeriod, setCalcPeriod] = useState<string>('2026-11');
  const [calcMethod, setCalcMethod] = useState<
    'FIFO' | 'WEIGHTED_AVERAGE' | 'SPECIFIC_IDENTIFICATION'
  >('FIFO');
  const [calculating, setCalculating] = useState<boolean>(false);

  const fetchAllReports = async () => {
    try {
      setErrorMsg(null);
      const [anaRes, valRes] = await Promise.all([
        api.get<DistributedAnalyticsResponse>('/reports/distributed-analytics', {
          params: { branch: activeBranch },
        }),
        api.get<ValuationsResponse>('/reports/valuations', {
          params: { branch: activeBranch, valuation_method: valuationMethod },
        }),
      ]);
      setAnalytics(anaRes);
      setValuations(valRes);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tải dữ liệu báo cáo thống kê phân tán.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAllReports();
  }, [activeBranch, valuationMethod]);

  const handleCalculateValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCalculating(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const payload: CalculateValuationPayload = {
        warehouse_branch: calcBranch,
        period: calcPeriod,
        valuation_method: calcMethod,
      };

      const res = await api.post<any>('/reports/valuations/calculate', payload);
      setSuccessMsg(
        `Đã chốt kỳ định giá [${res.valuation.valuation_code}] cho chi nhánh [${calcBranch}] theo phương pháp [${calcMethod}] — Tổng giá trị: ${formatCurrency(res.valuation.total_stock_value)}!`,
      );
      await fetchAllReports();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tính toán báo cáo định giá tồn kho.');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Đang thực thi các Aggregation Pipelines phân tán trên Cluster..." />;
  }

  const telemetry = analytics?.routing_telemetry;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Báo cáo Thống kê & Định giá Tồn kho
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp dữ liệu đa chiều bằng Aggregation Pipelines và định giá tài sản tồn kho theo chuẩn kế toán FIFO / Bình quân gia quyền.
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            fetchAllReports();
          }}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          Làm mới báo cáo
        </button>
      </div>

      {/* Distributed Query Status Bar */}
      <div className="bg-slate-50 text-slate-700 rounded-lg border border-slate-200 p-3 text-xs space-y-1.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-900">
              Chiến lược thực thi: {telemetry?.execution_mode || 'PARALLEL_SHARD_AGGREGATION'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-medium">
              {telemetry?.execution_time_ms || 4} ms
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Stage: <strong className="text-slate-800">{telemetry?.winning_plan_stage || 'SHARD_MERGE'}</strong>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">{telemetry?.optimization_note || 'Pipeline phân tán thực thi song song trên các Shard và gộp kết quả tại Router.'}</p>
      </div>

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

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Tổng Giá trị Vốn Tồn kho
            </span>
            <Calculator className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-xl font-bold text-brand-700 font-mono">
            {formatCurrency(valuations?.grand_total_value || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Phương pháp: {valuations?.selected_method}
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Kỳ Định giá Đã chốt
            </span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(valuations?.valuation_history?.length || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Collection: inventory_valuations
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Đối tác Nhập kho ($lookup)
            </span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(analytics?.supplier_procurement?.length || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            goods_receipts ⋈ suppliers
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Vật tư Cảnh báo Định mức
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {formatNumber(analytics?.low_stock_alerts?.length || 0)}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-mono">
            quantity &lt;= min_threshold
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('VALUATIONS')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'VALUATIONS'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>1. Định giá Vốn Tồn kho (inventory_valuations — FIFO / Weighted Avg)</span>
        </button>

        <button
          onClick={() => setActiveTab('AGGREGATIONS')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'AGGREGATIONS'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>2. Phân tích Đa chiều Mua sắm & Xuất cấp Dự án ($facet & $lookup)</span>
        </button>

        <button
          onClick={() => setActiveTab('LOW_STOCK')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'LOW_STOCK'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>3. Báo cáo Cảnh báo Định mức An toàn Tồn kho</span>
        </button>
      </div>

      {activeTab === 'VALUATIONS' && (
        <div className="space-y-6">
          {/* Top Row: Chart + Calculate Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Valuation Comparison Chart */}
            <div className="lg:col-span-2 bg-white p-5 rounded border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      So sánh Giá trị Vốn Tồn kho theo Vùng Phân mảnh (ZONE_HN vs ZONE_HCM)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tổng hợp trực tiếp từ số lượng tồn trên từng Shard nhân với đơn giá theo phương pháp kế toán.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(['FIFO', 'WEIGHTED_AVERAGE', 'SPECIFIC_IDENTIFICATION'] as const).map(
                      (m) => (
                        <button
                          key={m}
                          onClick={() => setValuationMethod(m)}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-colors ${
                            valuationMethod === m
                              ? 'bg-brand-700 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {m}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={valuations?.branch_summary || []}
                      margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${Math.round(Number(v) / 1000000)}M`}
                      />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(Number(value))}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#fff',
                        }}
                      />
                      <Bar
                        dataKey="total_stock_value"
                        name="Giá trị tồn kho (VNĐ)"
                        fill="#1b3f65"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                {valuations?.branch_summary.map((b) => (
                  <div
                    key={b.branch}
                    className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between font-mono"
                  >
                    <div>
                      <span className="font-bold text-slate-800">Chi nhánh {b.branch}</span>
                      <div className="text-[10px] text-slate-500">{b.shard_node}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand-700">
                        {formatCurrency(b.total_stock_value)}
                      </div>
                      <div className="text-[10px] text-slate-500">{b.item_count} mặt hàng</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculate & Save Valuation Snapshot Form */}
            <div className="bg-white p-5 rounded border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Calculator className="w-4 h-4 text-brand-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Chốt Kỳ Định giá Tồn kho Mới
                </h3>
              </div>

              <form onSubmit={handleCalculateValuation} className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chi nhánh Tổng kho (Shard)
                  </label>
                  <select
                    value={calcBranch}
                    onChange={(e) => setCalcBranch(e.target.value as 'HN' | 'HCM' | 'DN')}
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white font-medium"
                  >
                    <option value="HN">HN — Tổng kho Miền Bắc (Shard 1)</option>
                    <option value="HCM">HCM — Tổng kho Miền Nam (Shard 2)</option>
                    <option value="DN">DN — Kho Miền Trung (Primary)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kỳ Kế toán (YYYY-MM)
                  </label>
                  <input
                    type="text"
                    required
                    value={calcPeriod}
                    onChange={(e) => setCalcPeriod(e.target.value)}
                    placeholder="2026-11"
                    className="w-full border border-slate-300 rounded px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phương pháp Định giá
                  </label>
                  <select
                    value={calcMethod}
                    onChange={(e) =>
                      setCalcMethod(
                        e.target.value as
                          | 'FIFO'
                          | 'WEIGHTED_AVERAGE'
                          | 'SPECIFIC_IDENTIFICATION',
                      )
                    }
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white font-mono"
                  >
                    <option value="FIFO">FIFO (Nhập trước - Xuất trước)</option>
                    <option value="WEIGHTED_AVERAGE">
                      WEIGHTED_AVERAGE (Bình quân gia quyền)
                    </option>
                    <option value="SPECIFIC_IDENTIFICATION">
                      SPECIFIC_IDENTIFICATION (Đích danh theo lô)
                    </option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                  Hệ thống sẽ quét số lượng tồn trên Shard <strong>{calcBranch}</strong>, kết hợp đơn giá lô nhập từ <code className="font-mono">goods_receipts</code> và lưu bản ghi chuẩn hóa vào <code className="font-mono">inventory_valuations</code>.
                </div>

                <button
                  type="submit"
                  disabled={calculating}
                  className="w-full py-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold rounded shadow-2xs transition-colors"
                >
                  {calculating
                    ? 'Đang tính toán & ghi Shard...'
                    : 'Tính toán & Lưu Báo cáo Định giá'}
                </button>
              </form>
            </div>
          </div>

          {/* Item-by-Item Valuation Breakdown */}
          <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Bảng Chi tiết Định giá Vốn Từng Mặt hàng Tồn kho ({valuations?.selected_method})
                </h3>
                <p className="text-xs text-slate-500">
                  Chi tiết số lượng khả dụng, số lượng đã giữ chỗ cho công trình và tổng thành tiền vốn tồn kho.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-white">
                    <th className="py-3 px-4">Chi nhánh / Shard</th>
                    <th className="py-3 px-4">Mã Vật tư</th>
                    <th className="py-3 px-4">Tên Vật tư</th>
                    <th className="py-3 px-4 text-right">Tổng Tồn</th>
                    <th className="py-3 px-4 text-right">Đã Phân bổ</th>
                    <th className="py-3 px-4 text-right">Khả dụng</th>
                    <th className="py-3 px-4 text-right">Đơn giá Áp dụng</th>
                    <th className="py-3 px-4 text-right">Thành tiền Vốn Tồn kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {valuations?.item_breakdown.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-semibold text-slate-800">
                          {it.warehouse_branch} ({it.warehouse_code})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-brand-700">
                        {it.material_code}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{it.material_name}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatNumber(it.quantity)} {it.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-700">
                        {formatNumber(it.allocated_quantity)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                        {formatNumber(it.available_quantity)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(it.applied_unit_price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-brand-800">
                        {formatCurrency(it.total_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Valuation Snapshots (inventory_valuations collection) */}
          <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Lịch sử Báo cáo Định giá Đã Lưu (Collection: inventory_valuations)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">Mã Định giá</th>
                    <th className="py-2.5 px-4">Kỳ Kế toán</th>
                    <th className="py-2.5 px-4">Chi nhánh</th>
                    <th className="py-2.5 px-4">Phương pháp</th>
                    <th className="py-2.5 px-4 text-right">Tổng Giá trị Vốn Tồn kho</th>
                    <th className="py-2.5 px-4 text-right">Thời điểm chốt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {valuations?.valuation_history.map((v) => (
                    <tr key={v._id || v.valuation_code} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-brand-700">
                        {v.valuation_code}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-700">{v.period}</td>
                      <td className="py-2.5 px-4 font-mono">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-semibold">
                          {v.warehouse_branch}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={v.valuation_method} variant="info" />
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(v.total_stock_value)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                        {formatDate(v.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'AGGREGATIONS' && (
        <div className="space-y-6">
          {/* Pipeline 1: Supplier Procurement Value ($lookup goods_receipts -> suppliers) */}
          <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  [Pipeline 1] Thống kê Giá trị Nhập kho & Sản lượng theo Nhà Cung cấp ($lookup & $unwind)
                </h3>
                <p className="text-xs text-slate-500">
                  Kết nối dữ liệu phiếu nhập phân mảnh (<code className="font-mono">goods_receipts</code>) với danh mục đối tác toàn cục (<code className="font-mono">suppliers</code>).
                </p>
              </div>
              <span className="text-[11px] font-mono bg-white border border-slate-200 px-2.5 py-1 rounded text-brand-700">
                $lookup → $unwind → $group → $sort
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Mã Nhà Cung cấp</th>
                    <th className="py-3 px-4">Tên Doanh nghiệp Cung ứng</th>
                    <th className="py-3 px-4">Chi nhánh Nhập (Shard)</th>
                    <th className="py-3 px-4 text-right">Số dòng Hàng nhập</th>
                    <th className="py-3 px-4 text-right">Tổng Khối lượng Nhập</th>
                    <th className="py-3 px-4 text-right">Tổng Giá trị Nghiệm thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics?.supplier_procurement.map((sp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-brand-700">
                        {sp.supplier_code}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{sp.company_name}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-semibold">
                          ZONE_{sp.branch}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {formatNumber(sp.total_items_count)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {formatNumber(sp.total_quantity_received)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(sp.total_receipt_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pipeline 2 ($facet) & Pipeline 4 (Project Consumption) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Multi-dimensional $facet */}
            <div className="bg-white rounded border border-slate-200 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    [Pipeline 2] Phân tích Đa chiều Đơn Mua hàng ($facet)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chạy song song 2 nhánh thống kê trong một lần quét collection <code className="font-mono">purchase_orders</code>.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded">
                  $facet
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="font-semibold text-slate-700">
                  Nhánh 1: Chi tiêu Mua sắm theo Chi nhánh (spending_by_branch)
                </div>
                {analytics?.procurement_facet?.spending_by_branch.map((b) => (
                  <div
                    key={b._id}
                    className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between font-mono"
                  >
                    <div>
                      <span className="font-bold text-slate-800">Tổng kho {b._id}</span>
                      <span className="text-slate-500 ml-2">({b.order_count} đơn PO)</span>
                    </div>
                    <div className="font-bold text-brand-700">{formatCurrency(b.total_spend)}</div>
                  </div>
                ))}

                <div className="font-semibold text-slate-700 pt-2">
                  Nhánh 2: Tỷ lệ Thực hiện Hợp đồng / Đơn hàng (order_status_summary)
                </div>
                {analytics?.procurement_facet?.order_status_summary.map((st) => (
                  <div
                    key={st._id}
                    className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between font-mono"
                  >
                    <StatusBadge
                      status={st._id}
                      variant={st._id === 'DELIVERED' ? 'success' : 'info'}
                    />
                    <span className="text-slate-600">{st.total_orders} đơn</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(st.total_value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Material Consumption */}
            <div className="bg-white rounded border border-slate-200 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    [Pipeline 3] Thống kê Xuất cấp Vật tư theo Dự án Trọng điểm
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kết nối <code className="font-mono">goods_issues</code> phân mảnh với <code className="font-mono">projects_departments</code>.
                  </p>
                </div>
                <Building2 className="w-4 h-4 text-brand-600" />
              </div>

              <div className="space-y-3 text-xs">
                {analytics?.project_consumption.map((prj, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-brand-700">
                        {prj.project_code}
                      </span>
                      <span className="font-mono text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded">
                        Chi nhánh cấp: {prj.branch}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900">{prj.project_name}</div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 font-mono text-[11px]">
                      <div>
                        <div className="text-slate-400">Số phiếu xuất</div>
                        <div className="font-bold text-slate-800">{prj.issue_vouchers_count}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Tổng SL cấp</div>
                        <div className="font-bold text-slate-800">
                          {formatNumber(prj.total_quantity_issued)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400">Giá trị vật tư xuất</div>
                        <div className="font-bold text-emerald-700">
                          {formatCurrency(prj.estimated_material_cost)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'LOW_STOCK' && (
        <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-rose-50/70 border-b border-rose-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-rose-950">
                [Pipeline Cảnh báo] Mặt hàng Dưới Ngưỡng Định mức Tối thiểu ($expr: quantity &lt;= min_threshold)
              </h3>
              <p className="text-xs text-rose-800">
                Tự động tính toán lượng thiếu hụt (deficit) và chi phí dự kiến cần đặt mua bổ sung cho từng chi nhánh.
              </p>
            </div>
            <StatusBadge status="LOW STOCK ALERT" variant="danger" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="py-3 px-4">Chi nhánh Kho</th>
                  <th className="py-3 px-4">Mã Vật tư</th>
                  <th className="py-3 px-4">Tên Vật tư</th>
                  <th className="py-3 px-4 text-right">Hiện tồn</th>
                  <th className="py-3 px-4 text-right">Ngưỡng tối thiểu</th>
                  <th className="py-3 px-4 text-right">Lượng thiếu hụt</th>
                  <th className="py-3 px-4">Mức độ Cảnh báo</th>
                  <th className="py-3 px-4 text-right">Chi phí Mua bù Dự kiến</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics?.low_stock_alerts && analytics.low_stock_alerts.length > 0 ? (
                  analytics.low_stock_alerts.map((al, idx) => (
                    <tr key={idx} className="hover:bg-rose-50/30">
                      <td className="py-3 px-4 font-mono">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-semibold">
                          {al.warehouse_branch} ({al.warehouse_code})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-brand-700">
                        {al.material_code}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{al.material_name}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {formatNumber(al.current_quantity)} {al.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatNumber(al.min_threshold)} {al.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                        +{formatNumber(al.deficit)} {al.unit}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={al.warning_level}
                          variant={al.warning_level.includes('KHẨN CẤP') ? 'danger' : 'warning'}
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(al.estimated_restock_cost)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-emerald-700 font-medium">
                      ✔ Mức tồn kho tất cả vật tư tại các chi nhánh đều trên ngưỡng an toàn.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
