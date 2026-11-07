import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  dot = true,
  className,
  ...props
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
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-[11px] font-mono font-medium leading-none select-none',
          textColors[variant],
          className,
        )}
        {...props}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
        <span>{children}</span>
      </span>
    );
  }

  const chipStyles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
    info: 'bg-blue-50 text-blue-800 border-blue-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border tracking-wide uppercase select-none',
        chipStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};
