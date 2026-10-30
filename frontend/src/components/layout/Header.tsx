import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BranchSelector } from './BranchSelector';
import { Search, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbTitle = pathSegments.length === 0
    ? 'Tổng quan hệ thống'
    : pathSegments[pathSegments.length - 1].replace(/-/g, ' ').toUpperCase();

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Distributed WMS</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-semibold">{breadcrumbTitle}</span>
      </div>

      <div className="hidden md:flex items-center w-72 max-w-xs">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã vật tư, phiếu kho..."
            className="w-full bg-slate-50 border border-slate-200 rounded text-xs pl-8 pr-12 py-1.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
            readOnly
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white border border-slate-200 text-[10px] text-slate-400 px-1 py-0.5 rounded font-mono shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <BranchSelector />

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <button
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded relative transition-colors"
          title="Thông báo hệ thống"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full absolute top-1 right-1" />
        </button>

        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 bg-brand-50 border border-brand-200 text-brand-800 rounded flex items-center justify-center font-semibold text-xs">
            <UserIcon className="w-4 h-4 text-brand-700" />
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.fullName?.split('(')[0]?.trim() || user?.email}
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-tight">
              {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors ml-1"
          title="Đăng xuất"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
