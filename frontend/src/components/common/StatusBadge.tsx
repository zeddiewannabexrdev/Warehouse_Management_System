import React from 'react';
import { cn } from '../../lib/utils';

export interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  dot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'neutral',
  dot = true,
  className,
}) => {
  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400',
  };

  const textColors = {
    success: 'text-emerald-800',
    warning: 'text-amber-800',
    danger: 'text-rose-800',
    info: 'text-blue-800',
    neutral: 'text-slate-600',
  };

  if (dot) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-mono font-medium leading-none', className)}>
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
        <span className={textColors[variant]}>{status}</span>
      </span>
    );
  }

  const chipStyles = {
    success: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50/80 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50/80 text-rose-800 border-rose-200/80',
    info: 'bg-blue-50/80 text-blue-800 border-blue-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border tracking-wide uppercase',
        chipStyles[variant],
        className,
      )}
    >
      {status}
    </span>
  );
};
