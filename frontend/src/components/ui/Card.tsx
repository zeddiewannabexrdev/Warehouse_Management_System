import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, compact = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white border border-slate-200 rounded-md overflow-hidden text-slate-800',
          compact ? 'space-y-0' : '',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-xs font-semibold text-slate-900 tracking-tight leading-none', className)}
        {...props}
      >
        {children}
      </h3>
    );
  },
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ children, className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-[11px] text-slate-500 mt-1 leading-normal', className)}
      {...props}
    >
      {children}
    </p>
  );
});
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-3.5', className)} {...props}>
        {children}
      </div>
    );
  },
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-3.5 py-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-[11px] text-slate-500',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
CardFooter.displayName = 'CardFooter';
