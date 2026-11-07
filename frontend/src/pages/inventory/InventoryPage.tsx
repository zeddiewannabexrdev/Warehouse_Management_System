import React, { useCallback, useEffect, useState } from 'react';
import {
  PackageSearch,
  Search,
  RefreshCw,
  BarChart2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../../lib/api';
import { cn, formatNumber } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/common/EmptyState';
import { MetricStrip, MetricItemProps } from '../../components/common/MetricStrip';
import { StockAlert, StockRow, StockSummary } from '../../types/inventory.types';
import { ThresholdModal } from './ThresholdModal';
import {
  AlertBadge,
  BRANCH_NAME,
  BranchTag,
  BranchSwitcher,
  PageSkeleton,
  SegmentedTabs,
  ToastView,
  formatCompactMoney,
  formatMoney,
  inputClass,
  useCanEditThresholds,
  useToast,
} from './InventoryUi';

const BAR_COLOR: Record<StockAlert, string> = {
  URGENT: 'bg-rose-500',
  LOW: 'bg-amber-500',
  OVER: 'bg-blue-500',
  OK: 'bg-emerald-500',
};

const CHART_COLOR: Record<string, string> = { HN: '#1b3f65', HCM: '#0d9488', DN: '#7c3aed' };

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

// Mini level bar
const StockLevel: React.FC<{ stock: StockRow }> = ({ stock }) => {
  const scale = Math.max(stock.max_threshold || 0, stock.quantity, stock.min_threshold, 1);
  return (
    <div className="w-28" title={`Tối thiểu: ${formatNumber(stock.min_threshold)}`}>
      <div className="relative h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full', BAR_COLOR[stock.alert])}
          style={{ width: `${Math.min(100, (stock.quantity / scale) * 100)}%` }}
        />
      </div>
      <div className="mt-0.5 text-[10px] font-mono text-slate-400">
        min {formatNumber(stock.min_threshold)}
        {stock.max_threshold != null && ` · max ${formatNumber(stock.max_threshold)}`}
      </div>
    </div>
  );
};

export const InventoryPage: React.FC = () => {
  const { activeBranch } = useAuth();
  const canEdit = useCanEditThresholds();
  const { toast, show } = useToast();
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState('ALL');
  const [editing, setEditing] = useState<StockRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = { branch: activeBranch };
      const [stockRows, summaryData] = await Promise.all([
        api.get<StockRow[]>('/inventory/stocks', { params }),
        api.get<StockSummary>('/inventory/summary', { params }),
      ]);
      setStocks(stockRows);
      setSummary(summaryData);
    } catch (err: any) {
      show('error', err?.message || 'Không tải được dữ liệu tồn kho');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBranch, show]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  if (loading) return <PageSkeleton />;

  const alerts = stocks
    .filter((s) => s.alert === 'URGENT' || s.alert === 'LOW')
    .sort((a, b) => a.quantity / (a.min_threshold || 1) - b.quantity / (b.min_threshold || 1));

  const needle = normalize(keyword.trim());
  const visible = stocks.filter(
    (s) =>
      (level === 'ALL' || s.alert === level) &&
      (!needle || normalize(`${s.material_name || ''} ${s.material_code}`).includes(needle)),
  );

  const safeCount = (summary?.total_items || 0) - (summary?.urgent || 0) - (summary?.low || 0);
  const chartData = (summary?.by_branch || []).map((row) => ({
    ...row,
    label: BRANCH_NAME[row.branch] || row.branch,
  }));

  // Metric Strip Items
  const metricItems: MetricItemProps[] = [
    {
      label: 'Giá trị tồn kho',
      value: formatCompactMoney(summary?.total_value || 0),
      subText: 'Theo đơn giá chuẩn',
      status: 'neutral',
    },
    {
      label: 'Dòng tồn kho',
      value: formatNumber(summary?.total_items || 0),
      subText: `${stocks.length} bản ghi hiển thị`,
      status: 'neutral',
    },
    {
      label: 'Cần xử lý ngay',
      value: formatNumber((summary?.urgent || 0) + (summary?.low || 0)),
      subText: `${summary?.urgent || 0} khẩn cấp · ${summary?.low || 0} thiếu hàng`,
      status: (summary?.urgent || 0) + (summary?.low || 0) > 0 ? 'danger' : 'success',
    },
    {
      label: 'Mức an toàn',
      value: formatNumber(safeCount),
      subText: 'Trên ngưỡng tối thiểu',
      status: 'success',
    },
    {
      label: 'Định tuyến Zone Sharding',
      value: activeBranch === 'ALL' ? 'Toàn quốc (Multi-Shard)' : `ZONE_${activeBranch}`,
      subText: activeBranch === 'HN' ? 'Shard 1 (27018)' : activeBranch === 'HCM' ? 'Shard 2 (27020)' : 'Router (27017)',
      status: 'info',
    },
  ];

  return (
    <div className="space-y-3 font-sans">
      {/* 1. Top Bar: Lean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
            MODULE 04
          </span>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">
            Tồn Kho & Cảnh Báo An Toàn
          </h1>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            &#123; warehouse_branch: 1, material_code: 1 &#125;
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowTelemetry(!showTelemetry)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Phân tích Shard</span>
            {showTelemetry ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              setRefreshing(true);
              load();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin text-blue-600')} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Slim Metric Strip (Replaces 4 bulky KPI cards) */}
      <MetricStrip items={metricItems} />

      {/* 3. Collapsible Telemetry / Shard Distribution (Optional Drawer) */}
      {showTelemetry && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 p-3 bg-white border border-slate-200 rounded-md animate-fade-in">
          <div className="lg:col-span-3">
            <div className="text-xs font-semibold text-slate-800 mb-1">
              Phân bổ giá trị tồn theo Shard / Chi nhánh
            </div>
            <div className="h-44">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Chưa có dữ liệu thống kê
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="40%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={65}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickFormatter={formatCompactMoney}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      formatter={(value) => [formatMoney(Number(value)), 'Giá trị tồn']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((row) => (
                        <Cell key={row.branch} fill={CHART_COLOR[row.branch] || '#334155'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-3 flex flex-col">
            <div className="text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
              <span>Cảnh báo ngưỡng an toàn</span>
              <span className="font-mono text-[11px] text-rose-600">{alerts.length} vật tư</span>
            </div>
            {alerts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-emerald-700 py-6">
                Mức tồn kho tất cả vật tư đều an toàn
              </div>
            ) : (
              <div className="space-y-1.5 overflow-y-auto max-h-40 pr-1">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={`${alert.warehouse_branch}-${alert.material_code}`}
                    className="p-1.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-slate-800 leading-tight">
                        {alert.material_name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Kho {alert.warehouse_branch}: tồn{' '}
                        <strong className="text-rose-600">{formatNumber(alert.quantity)}</strong> / min{' '}
                        {formatNumber(alert.min_threshold)} {alert.unit}
                      </div>
                    </div>
                    <AlertBadge alert={alert.alert} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Unified Single-Row Toolbar (Filters + Search + Branch) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-md">
        {/* Left: Filter Tabs */}
        <div className="flex items-center gap-2">
          <SegmentedTabs
            value={level}
            onChange={setLevel}
            options={[
              { value: 'ALL', label: 'Tất cả', count: stocks.length },
              { value: 'URGENT', label: 'Khẩn cấp', count: summary?.urgent || 0 },
              { value: 'LOW', label: 'Thiếu hàng', count: summary?.low || 0 },
              { value: 'OK', label: 'An toàn', count: safeCount },
            ]}
          />
        </div>

        {/* Right: Search & Branch Selector */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              aria-label="Tìm mã hoặc tên vật tư"
              className={`${inputClass} pl-8`}
              placeholder="Tìm mã hoặc tên vật tư..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <BranchSwitcher />
        </div>
      </div>

      {/* 5. Maximized Data Table (High-Density & Sticky Header) */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        {visible.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={PackageSearch}
              title="Không tìm thấy vật tư"
              description="Không có bản ghi tồn kho nào phù hợp với bộ lọc hiện tại."
            />
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
            <table className="data-table">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr>
                  <th className="w-28">Mã VT</th>
                  <th className="min-w-[200px]">Tên Vật Tư</th>
                  <th className="w-28">Chi Nhánh</th>
                  <th className="num w-24">Tồn Thực</th>
                  <th className="num w-24">Đã Phân Bổ</th>
                  <th className="num w-24">Khả Dụng</th>
                  <th className="w-16">ĐVT</th>
                  <th className="w-32">Mức Tồn</th>
                  <th className="w-28">Trạng Thái</th>
                  {canEdit && <th className="w-20 text-right pr-3">Thao Tác</th>}
                </tr>
              </thead>
              <tbody>
                {visible.map((stock) => (
                  <tr
                    key={`${stock.warehouse_branch}-${stock.material_code}`}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="font-mono text-xs font-semibold text-blue-700 whitespace-nowrap">
                      {stock.material_code}
                    </td>
                    <td>
                      <span className="font-medium text-slate-900 leading-tight">
                        {stock.material_name}
                      </span>
                    </td>
                    <td>
                      <BranchTag branch={stock.warehouse_branch} />
                    </td>
                    <td className="num font-semibold text-slate-900">
                      {formatNumber(stock.quantity)}
                    </td>
                    <td className="num text-slate-500">
                      {formatNumber(stock.allocated_quantity || 0)}
                    </td>
                    <td className="num font-bold text-slate-900">
                      {formatNumber(stock.available_quantity || 0)}
                    </td>
                    <td className="text-slate-500 text-xs font-mono">
                      {stock.unit}
                    </td>
                    <td>
                      <StockLevel stock={stock} />
                    </td>
                    <td>
                      <AlertBadge alert={stock.alert} />
                    </td>
                    {canEdit && (
                      <td className="text-right pr-3">
                        <button
                          onClick={() => setEditing(stock)}
                          className="px-2 py-0.5 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
                        >
                          Sửa ngưỡng
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Summary */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div>
            Hiển thị <strong className="text-slate-800">{visible.length}</strong> / {stocks.length} vật tư
          </div>
          <div>
            Shard Key: <code className="text-slate-700">&#123; warehouse_branch: "{activeBranch}", material_code: ... &#125;</code>
          </div>
        </div>
      </div>

      {editing && (
        <ThresholdModal
          stock={editing}
          onClose={() => setEditing(null)}
          onError={(message) => show('error', message)}
          onSaved={() => {
            setEditing(null);
            show('success', 'Đã cập nhật ngưỡng an toàn vật tư');
            load();
          }}
        />
      )}
      <ToastView toast={toast} />
    </div>
  );
};
