import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'secondary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const variantStyles = {
      primary:
        'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border border-blue-600 shadow-2xs font-semibold',
      secondary:
        'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs font-medium',
      outline:
        'bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium',
      danger:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-600 shadow-2xs font-semibold',
      ghost:
        'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 font-medium',
    };

    const sizeStyles = {
      sm: 'h-7 px-2.5 text-[11px] gap-1.5 rounded',
      md: 'h-8 px-3 text-xs gap-1.5 rounded-md',
      lg: 'h-9 px-3.5 text-xs gap-2 rounded-md',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center transition-colors select-none focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        <span>{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';
