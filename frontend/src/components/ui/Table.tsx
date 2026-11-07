import React from 'react';
import { cn } from '../../lib/utils';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  compact?: boolean;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto">
        <table
          ref={ref}
          className={cn('data-table w-full text-left text-xs border-collapse', className)}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ children, className, ...props }, ref) => {
  return (
    <thead
      ref={ref}
      className={cn('bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-slate-500 font-medium', className)}
      {...props}
    >
      {children}
    </thead>
  );
});
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ children, className, ...props }, ref) => {
  return (
    <tbody ref={ref} className={cn('divide-y divide-slate-100', className)} {...props}>
      {children}
    </tbody>
  );
});
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ children, className, ...props }, ref) => {
  return (
    <tr
      ref={ref}
      className={cn(
        'hover:bg-slate-50/80 transition-colors duration-150 h-[34px] group',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
});
TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  isNumeric?: boolean;
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ children, className, isNumeric = false, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          'py-2 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-600 select-none',
          isNumeric ? 'text-right font-mono' : 'text-left',
          className,
        )}
        {...props}
      >
        {children}
      </th>
    );
  },
);
TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  isNumeric?: boolean;
  isCode?: boolean;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ children, className, isNumeric = false, isCode = false, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn(
          'py-2 px-3 text-slate-800 text-xs leading-tight',
          isNumeric ? 'text-right font-mono tabular-nums font-semibold' : '',
          isCode ? 'font-mono font-medium text-blue-700' : '',
          className,
        )}
        {...props}
      >
        {children}
      </td>
    );
  },
);
TableCell.displayName = 'TableCell';
