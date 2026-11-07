import React from 'react';
import { cn } from '../../lib/utils';

export interface MetricItemProps {
  label: string;
  value: string | number;
  subText?: string;
  status?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  highlight?: boolean;
}

export interface MetricStripProps {
  items: MetricItemProps[];
  className?: string;
}

export const MetricStrip: React.FC<MetricStripProps> = ({ items, className }) => {
  return (
    <div className={cn('metric-strip', className)}>
      {items.map((item, idx) => (
        <div key={idx} className="metric-item">
          <div className="flex items-center justify-between">
            <span className="metric-label">{item.label}</span>
            {item.status && (
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  item.status === 'success' && 'bg-emerald-500',
                  item.status === 'warning' && 'bg-amber-500',
                  item.status === 'danger' && 'bg-rose-500',
                  item.status === 'info' && 'bg-blue-500',
                  item.status === 'neutral' && 'bg-slate-400',
                )}
              />
            )}
          </div>
          <div
            className={cn(
              'metric-value',
              item.status === 'danger' && 'text-rose-600',
              item.status === 'success' && 'text-emerald-700',
              item.status === 'info' && 'text-blue-700',
            )}
          >
            {item.value}
          </div>
          {item.subText && <div className="metric-sub">{item.subText}</div>}
        </div>
      ))}
    </div>
  );
};
