import React from 'react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { StockAlert } from '../../types/inventory.types';

export const inputClass =
  'w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1.5 transition-colors placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400';
export const labelClass = 'block text-[11px] font-medium text-slate-600 mb-1';
export const thClass = 'px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500 whitespace-nowrap bg-slate-50';
export const tdClass = 'px-3 py-2 text-xs text-slate-700 align-middle';
export const primaryButton =
  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors';
export const secondaryButton =
  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-colors';
export const cardClass = 'bg-white border border-slate-200 rounded-md';

export const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(Math.round(value || 0))} đ`;

export function formatCompactMoney(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
  if (value >= 1e6) return `${(value / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`;
  return formatMoney(value);
}

const ALERT_CONFIG: Record<StockAlert, { label: string; dotClass: string; textClass: string }> = {
  URGENT: { label: 'Khẩn cấp', dotClass: 'bg-rose-500', textClass: 'text-rose-700' },
  LOW: { label: 'Thiếu hàng', dotClass: 'bg-amber-500', textClass: 'text-amber-700' },
  OVER: { label: 'Vượt định mức', dotClass: 'bg-blue-500', textClass: 'text-blue-700' },
  OK: { label: 'An toàn', dotClass: 'bg-emerald-500', textClass: 'text-emerald-700' },
};

export const AlertBadge: React.FC<{ alert: StockAlert }> = ({ alert }) => {
  const config = ALERT_CONFIG[alert] || ALERT_CONFIG.OK;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium whitespace-nowrap">
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotClass)} />
      <span className={config.textClass}>{config.label}</span>
    </span>
  );
};

export const BRANCH_NAME: Record<string, string> = { HN: 'Hà Nội', HCM: 'TP.HCM', DN: 'Đà Nẵng' };

const BRANCH_SHARD_TAG: Record<string, string> = {
  HN: 'Shard 1 (27018)',
  HCM: 'Shard 2 (27020)',
  DN: 'Shard Trung',
};

export const BranchTag: React.FC<{ branch: string }> = ({ branch }) => (
  <span
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
    title={BRANCH_SHARD_TAG[branch] || branch}
  >
    <span className="w-1 h-1 rounded-full bg-slate-400" />
    {BRANCH_NAME[branch] || branch}
  </span>
);

const SWITCH_OPTIONS = [
  { code: 'ALL', label: 'Toàn quốc' },
  { code: 'HN', label: 'Hà Nội (S1)' },
  { code: 'HCM', label: 'TP.HCM (S2)' },
];

export const BranchSwitcher: React.FC = () => {
  const { user, activeBranch, setActiveBranch } = useAuth();
  const lockedBranch = user?.branch && user.branch !== 'ALL' ? user.branch : null;
  if (lockedBranch) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200">
        Chi nhánh {BRANCH_NAME[lockedBranch] ?? lockedBranch}
      </span>
    );
  }
  return (
    <div role="tablist" aria-label="Chọn chi nhánh" className="inline-flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
      {SWITCH_OPTIONS.map((option) => {
        const active = activeBranch === option.code;
        return (
          <button
            key={option.code}
            role="tab"
            aria-selected={active}
            onClick={() => setActiveBranch(option.code)}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer',
              active ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export const SegmentedTabs: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; count?: number }[];
}> = ({ value, onChange, options }) => (
  <div role="tablist" className="inline-flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          role="tab"
          aria-selected={active}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer',
            active ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          <span>{option.label}</span>
          {option.count !== undefined && (
            <span
              className={cn(
                'px-1 py-0.2 font-mono text-[10px] rounded',
                active ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/70 text-slate-500',
              )}
            >
              {option.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-10 bg-slate-200/60 rounded-md" />
    <div className="h-14 bg-slate-200/60 rounded-md" />
    <div className="h-9 bg-slate-200/60 rounded-md" />
    <div className="h-96 bg-slate-200/60 rounded-md" />
  </div>
);

export const ToastView: React.FC<{ toast: { type: 'success' | 'error'; message: string } | null }> = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      role="status"
      className={cn(
        'fixed bottom-5 right-5 z-50 px-3.5 py-2 rounded-md border text-xs font-medium shadow-md flex items-center gap-2',
        toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200',
      )}
    >
      <span>{toast.message}</span>
    </div>
  );
};

export function useToast() {
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const timer = React.useRef<number | undefined>(undefined);

  const show = React.useCallback((type: 'success' | 'error', message: string) => {
    window.clearTimeout(timer.current);
    setToast({ type, message });
    timer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  return { toast, show };
}

export function useCanEditThresholds(): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return ['SUPER_ADMIN', 'MANAGER_HN', 'MANAGER_HCM'].includes(user.role);
}
