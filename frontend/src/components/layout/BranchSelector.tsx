import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Lock } from 'lucide-react';

export const BranchSelector: React.FC = () => {
  const { user, activeBranch, setActiveBranch } = useAuth();

  const isRestricted = user?.role === 'MANAGER_HN' || user?.role === 'MANAGER_HCM';

  const branchOptions = [
    { code: 'ALL', label: 'Toàn quốc (Tất cả Shards)', badge: 'GLOBAL' },
    { code: 'HN', label: 'Tổng kho Miền Bắc (Hà Nội)', badge: 'ZONE_HN' },
    { code: 'HCM', label: 'Tổng kho Miền Nam (TP.HCM)', badge: 'ZONE_HCM' },
    { code: 'DN', label: 'Kho Miền Trung (Đà Nẵng)', badge: 'PRIMARY' },
  ];

  if (isRestricted) {
    const current = branchOptions.find((b) => b.code === user?.branch);
    return (
      <div className="h-8 flex items-center gap-1.5 px-2.5 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700 font-medium">
        <Lock className="w-3 h-3 text-slate-400 stroke-[1.5]" />
        <span>{current?.label || user?.branch}</span>
        <span className="text-[9px] bg-white text-slate-600 border border-slate-200 px-1 py-0.2 rounded font-mono">
          {current?.badge}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1 text-slate-400 text-xs">
        <MapPin className="w-3.5 h-3.5 stroke-[1.5] text-slate-400" />
        <span className="hidden sm:inline text-xs font-medium text-slate-500">Chi nhánh:</span>
      </div>
      <select
        value={activeBranch}
        onChange={(e) => setActiveBranch(e.target.value)}
        className="h-8 bg-white border border-slate-200 text-slate-800 text-xs rounded px-2.5 py-1 font-medium hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
      >
        {branchOptions.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.label} ({opt.badge})
          </option>
        ))}
      </select>
    </div>
  );
};
