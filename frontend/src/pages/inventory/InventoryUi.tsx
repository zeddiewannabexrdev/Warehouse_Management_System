import React, { useCallback, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, LucideIcon, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { StockAlert } from '../../types/inventory.types';

export const inputClass =
  'w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 transition-shadow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500';
export const labelClass = 'block text-xs font-semibold text-slate-600 mb-1.5';
export const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap';
export const tdClass = 'px-4 py-3.5 text-sm text-slate-700 align-middle';
export const primaryButton =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors';
export const secondaryButton =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors';
export const cardClass = 'bg-white border border-slate-200/80 rounded-xl shadow-sm';

export const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(Math.round(value || 0))} đ`;

export function formatCompactMoney(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
  if (value >= 1e6) return `${(value / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`;
  return formatMoney(value);
}

type Tone = 'rose' | 'amber' | 'sky' | 'emerald' | 'slate';

const TONES: Record<Tone, { badge: string; dot: string; icon: string }> = {
  rose: { badge: 'bg-rose-50 text-rose-700 ring-rose-600/15', dot: 'bg-rose-500', icon: 'bg-rose-50 text-rose-600' },
  amber: { badge: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500', icon: 'bg-amber-50 text-amber-600' },
  sky: { badge: 'bg-sky-50 text-sky-700 ring-sky-600/15', dot: 'bg-sky-500', icon: 'bg-sky-50 text-sky-600' },
  emerald: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', dot: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-600' },
  slate: { badge: 'bg-slate-100 text-slate-600 ring-slate-500/15', dot: 'bg-slate-400', icon: 'bg-slate-100 text-slate-600' },
};

const ALERT_STYLE: Record<StockAlert, { label: string; tone: Tone }> = {
  URGENT: { label: 'Khẩn cấp', tone: 'rose' },
  LOW: { label: 'Thiếu hàng', tone: 'amber' },
  OVER: { label: 'Vượt định mức', tone: 'sky' },
  OK: { label: 'An toàn', tone: 'emerald' },
};

export const AlertBadge: React.FC<{ alert: StockAlert }> = ({ alert }) => {
  const item = ALERT_STYLE[alert] ?? ALERT_STYLE.OK;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset whitespace-nowrap', TONES[item.tone].badge)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', TONES[item.tone].dot)} />
      {item.label}
    </span>
  );
};

export const BRANCH_NAME: Record<string, string> = { HN: 'Hà Nội', HCM: 'TP.HCM', DN: 'Đà Nẵng' };

const BRANCH_STYLE: Record<string, string> = {
  HN: 'bg-brand-50 text-brand-700',
  HCM: 'bg-teal-50 text-teal-700',
  DN: 'bg-violet-50 text-violet-700',
};

export const BranchTag: React.FC<{ branch: string }> = ({ branch }) => (
  <span className={cn('inline-flex px-2.5 py-0.5 rounded-md text-xs font-bold whitespace-nowrap', BRANCH_STYLE[branch] ?? 'bg-slate-100 text-slate-600')}>
    {BRANCH_NAME[branch] ?? branch}
  </span>
);

const AVATAR_COLORS = [
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
];

// Ô chữ cái đầu, màu cố định theo tên để cùng một vật tư luôn cùng màu
export const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const words = name.replace(/[()]/g, '').split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || '?';
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (
    <span
      aria-hidden="true"
      className={cn('flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold', AVATAR_COLORS[hash % AVATAR_COLORS.length])}
    >
      {initials}
    </span>
  );
};

const SWITCH_OPTIONS = [
  { code: 'ALL', label: 'Toàn quốc' },
  { code: 'HN', label: 'Hà Nội' },
  { code: 'HCM', label: 'TP.HCM' },
];

// Đổi nhanh chi nhánh ngay trên trang; tài khoản thủ kho chỉ thấy chi nhánh của mình
export const BranchSwitcher: React.FC = () => {
  const { user, activeBranch, setActiveBranch } = useAuth();
  const lockedBranch = user?.branch && user.branch !== 'ALL' ? user.branch : null;
  if (lockedBranch) {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/10 text-sm font-semibold">
        Chi nhánh {BRANCH_NAME[lockedBranch] ?? lockedBranch}
      </span>
    );
  }
  return (
    <div role="tablist" aria-label="Chọn chi nhánh" className="inline-flex gap-1 p-1 rounded-xl bg-white/10">
      {SWITCH_OPTIONS.map((option) => {
        const active = activeBranch === option.code;
        return (
          <button
            key={option.code}
            role="tab"
            aria-selected={active}
            onClick={() => setActiveBranch(option.code)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors',
              active ? 'bg-white text-brand-800 shadow-sm' : 'text-brand-100 hover:bg-white/10 hover:text-white',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export const PageHero: React.FC<{
  eyebrow: string;
  title: string;
  description: string;
  refreshing?: boolean;
  onRefresh: () => void;
}> = ({ eyebrow, title, description, refreshing, onRefresh }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 px-6 py-7 sm:px-8 text-white shadow-md">
    <div className="absolute -right-16 -top-24 w-72 h-72 rounded-full bg-white/5" />
    <div className="absolute right-32 -bottom-28 w-56 h-56 rounded-full bg-white/5" />
    <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">{eyebrow}</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-brand-100/80 leading-relaxed">{description}</p>
        <div className="mt-5">
          <BranchSwitcher />
        </div>
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="self-start lg:self-center inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
      >
        <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
        Làm mới
      </button>
    </div>
  </div>
);

export const StatCard: React.FC<{
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}> = ({ icon: Icon, label, value, hint, tone = 'slate' }) => (
  <div className={cn(cardClass, 'p-5 flex items-start gap-4')}>
    <div className={cn('flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center', TONES[tone].icon)}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-slate-900 tracking-tight truncate">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  </div>
);

export const SegmentedTabs: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; count?: number }[];
}> = ({ value, onChange, options }) => (
  <div role="tablist" className="inline-flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          role="tab"
          aria-selected={active}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors',
            active ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span className={cn('px-1.5 rounded-md text-xs', active ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-500')}>
              {option.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

const Bone: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('rounded-lg bg-slate-200/70 animate-pulse', className)} />
);

export const PageSkeleton: React.FC = () => (
  <div className="space-y-6" aria-label="Đang tải dữ liệu">
    <Bone className="h-44 rounded-2xl" />
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((index) => <Bone key={index} className="h-24 rounded-xl" />)}
    </div>
    <div className={cn(cardClass, 'p-5 space-y-4')}>
      {[0, 1, 2, 3, 4].map((index) => (
        <div key={index} className="flex items-center gap-4">
          <Bone className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Bone className="h-3.5 w-2/5" />
            <Bone className="h-3 w-1/4" />
          </div>
          <Bone className="h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export interface Toast {
  type: 'success' | 'error';
  message: string;
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number>();
  const show = useCallback((type: Toast['type'], message: string) => {
    setToast({ type, message });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 4500);
  }, []);
  return { toast, show };
}

export const ToastView: React.FC<{ toast: Toast | null }> = ({ toast }) => {
  if (!toast) return null;
  const isError = toast.type === 'error';
  const Icon = isError ? AlertTriangle : CheckCircle2;
  return (
    <div role="status" className="fixed z-[60] right-5 bottom-5 max-w-sm">
      <div className={cn('flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white', isError ? 'bg-rose-600' : 'bg-emerald-600')}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span>{toast.message}</span>
      </div>
    </div>
  );
};

// Chỉ thủ kho và Super Admin được sửa ngưỡng, khớp với @Roles ở backend
export function useCanEditThresholds(): boolean {
  const { user } = useAuth();
  return user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER_HN' || user?.role === 'MANAGER_HCM';
}
