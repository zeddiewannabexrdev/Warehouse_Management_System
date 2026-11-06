import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Boxes, CheckCircle2, PackageSearch, Search, ShieldAlert, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../lib/api';
import { cn, formatNumber } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/common/EmptyState';
import { StockAlert, StockRow, StockSummary } from '../../types/inventory.types';
import { ThresholdModal } from './ThresholdModal';
import {
  AlertBadge,
  Avatar,
  BRANCH_NAME,
  BranchTag,
  PageHero,
  PageSkeleton,
  SegmentedTabs,
  StatCard,
  ToastView,
  cardClass,
  formatCompactMoney,
  formatMoney,
  inputClass,
  tdClass,
  thClass,
  useCanEditThresholds,
  useToast,
} from './InventoryUi';

const BAR_COLOR: Record<StockAlert, string> = {
  URGENT: 'bg-rose-500',
  LOW: 'bg-amber-500',
  OVER: 'bg-sky-500',
  OK: 'bg-emerald-500',
};

const CHART_COLOR: Record<string, string> = { HN: '#1b3f65', HCM: '#0d9488', DN: '#7c3aed' };

// Bỏ dấu tiếng Việt để gõ "xi mang" vẫn tìm ra "Xi măng"
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

// Thanh mức tồn: vạch đứng là ngưỡng tối thiểu trên thang tới ngưỡng tối đa
const StockLevel: React.FC<{ stock: StockRow }> = ({ stock }) => {
  const scale = Math.max(stock.max_threshold || 0, stock.quantity, stock.min_threshold, 1);
  return (
    <div className="w-36" title={`Tối thiểu ${formatNumber(stock.min_threshold)}`}>
      <div className="relative h-2.5 rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full', BAR_COLOR[stock.alert])} style={{ width: `${Math.min(100, (stock.quantity / scale) * 100)}%` }} />
        <div className="absolute -top-0.5 w-0.5 h-3 bg-slate-500" style={{ left: `${(stock.min_threshold / scale) * 100}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-slate-400">
        Tối thiểu {formatNumber(stock.min_threshold)}
        {stock.max_threshold != null && ` · Tối đa ${formatNumber(stock.max_threshold)}`}
      </p>
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
    (s) => (level === 'ALL' || s.alert === level) && (!needle || normalize(`${s.material_name || ''} ${s.material_code}`).includes(needle)),
  );
  const safeCount = (summary?.total_items || 0) - (summary?.urgent || 0) - (summary?.low || 0);
  const chartData = (summary?.by_branch || []).map((row) => ({ ...row, label: BRANCH_NAME[row.branch] || row.branch }));

  return (
    <div className="space-y-6 font-sans">
      <PageHero
        title="Tồn kho & Cảnh báo An toàn"
        description="Theo dõi lượng tồn thực tế, phần đã phân bổ cho công trình và các vật tư chạm ngưỡng tối thiểu."
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Wallet} tone="sky" label="Giá trị tồn kho" value={formatCompactMoney(summary?.total_value || 0)} hint="Theo giá chuẩn" />
        <StatCard icon={Boxes} tone="slate" label="Dòng tồn kho" value={formatNumber(summary?.total_items || 0)} hint="Vật tư theo chi nhánh" />
        <StatCard icon={ShieldAlert} tone="rose" label="Cần xử lý ngay" value={formatNumber((summary?.urgent || 0) + (summary?.low || 0))} hint={`${summary?.urgent || 0} khẩn cấp, ${summary?.low || 0} thiếu hàng`} />
        <StatCard icon={CheckCircle2} tone="emerald" label="Ở mức an toàn" value={formatNumber(safeCount)} hint="Trên ngưỡng tối thiểu" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <section className={cn(cardClass, 'lg:col-span-3 p-5')}>
          <h2 className="text-base font-bold text-slate-900">Giá trị tồn theo chi nhánh</h2>
          <p className="text-sm text-slate-500">Tính theo đơn giá chuẩn của vật tư</p>
          <div className="mt-4 h-56">
            {chartData.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} width={72} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={formatCompactMoney} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value) => [formatMoney(Number(value)), 'Giá trị tồn']} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((row) => <Cell key={row.branch} fill={CHART_COLOR[row.branch] || '#3c79b0'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className={cn(cardClass, 'lg:col-span-2 p-5 flex flex-col')}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Cảnh báo an toàn</h2>
          </div>
          {alerts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              <p className="mt-2 text-sm font-semibold text-slate-700">Mức tồn kho đều an toàn</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2.5 overflow-y-auto max-h-56 pr-1">
              {alerts.map((alert) => (
                <li key={`${alert.warehouse_branch}-${alert.material_code}`} className="p-3 rounded-xl bg-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{alert.material_name}</p>
                    <AlertBadge alert={alert.alert} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Kho {BRANCH_NAME[alert.warehouse_branch] || alert.warehouse_branch}: còn <b className="text-slate-700">{formatNumber(alert.quantity)}</b> / tối thiểu {formatNumber(alert.min_threshold)} {alert.unit}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={cardClass}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <SegmentedTabs
            value={level}
            onChange={setLevel}
            options={[
              { value: 'ALL', label: 'Tất cả', count: stocks.length },
              { value: 'URGENT', label: 'Khẩn cấp', count: summary?.urgent || 0 },
              { value: 'LOW', label: 'Thiếu hàng', count: summary?.low || 0 },
              { value: 'OK', label: 'An toàn', count: stocks.filter((s) => s.alert === 'OK').length },
            ]}
          />
          <div className="relative w-full xl:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input aria-label="Tìm vật tư" className={`${inputClass} pl-9`} placeholder="Tìm tên vật tư" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="p-5"><EmptyState icon={PackageSearch} title="Không có dữ liệu" description="Không tìm thấy vật tư phù hợp với bộ lọc." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thClass}>Vật tư</th>
                  <th className={thClass}>Chi nhánh</th>
                  <th className={`${thClass} text-right`}>Tồn thực</th>
                  <th className={`${thClass} text-right`}>Đã phân bổ</th>
                  <th className={`${thClass} text-right`}>Khả dụng</th>
                  <th className={thClass}>Mức tồn</th>
                  <th className={thClass}>Trạng thái</th>
                  {canEdit && <th className={thClass} />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((stock) => (
                  <tr key={`${stock.warehouse_branch}-${stock.material_code}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className={tdClass}>
                      <div className="flex items-center gap-3 min-w-[240px]">
                        <Avatar name={stock.material_name || '?'} />
                        <p className="font-semibold text-slate-800 leading-snug">{stock.material_name}</p>
                      </div>
                    </td>
                    <td className={tdClass}><BranchTag branch={stock.warehouse_branch} /></td>
                    <td className={`${tdClass} text-right whitespace-nowrap`}>
                      <b className="text-slate-900">{formatNumber(stock.quantity)}</b> <span className="text-xs text-slate-400">{stock.unit}</span>
                    </td>
                    <td className={`${tdClass} text-right`}>{formatNumber(stock.allocated_quantity || 0)}</td>
                    <td className={`${tdClass} text-right font-semibold text-slate-800`}>{formatNumber(stock.available_quantity || 0)}</td>
                    <td className={tdClass}><StockLevel stock={stock} /></td>
                    <td className={tdClass}><AlertBadge alert={stock.alert} /></td>
                    {canEdit && (
                      <td className={`${tdClass} text-right`}>
                        <button onClick={() => setEditing(stock)} className="text-sm font-semibold text-brand-600 hover:text-brand-800 whitespace-nowrap">Sửa ngưỡng</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <ThresholdModal
          stock={editing}
          onClose={() => setEditing(null)}
          onError={(message) => show('error', message)}
          onSaved={() => {
            setEditing(null);
            show('success', 'Đã cập nhật ngưỡng tồn kho');
            load();
          }}
        />
      )}
      <ToastView toast={toast} />
    </div>
  );
};
