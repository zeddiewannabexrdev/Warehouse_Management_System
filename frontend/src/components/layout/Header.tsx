import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BranchSelector } from './BranchSelector';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { NotificationDropdown } from './NotificationDropdown';
import {
  Search,
  LogOut,
  User as UserIcon,
  KeyRound,
  ChevronDown,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbTitle =
    pathSegments.length === 0
      ? 'Tổng quan hệ thống'
      : pathSegments[pathSegments.length - 1].replace(/-/g, ' ').toUpperCase();

  const [searchVal, setSearchVal] = useState('');

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Distributed WMS</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-semibold">{breadcrumbTitle}</span>
      </div>

      {/* Global Search bar */}
      <div className="hidden md:flex items-center w-72 max-w-xs">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Tìm mã vật tư, phiếu kho..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs pl-8 pr-4 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Multi-Branch Zone Switcher */}
        <BranchSelector />

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Notifications Popover */}
        <NotificationDropdown />

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none text-left"
          >
            <div className="w-7 h-7 bg-blue-50 border border-blue-200 text-blue-800 rounded-md flex items-center justify-center font-semibold text-xs shrink-0">
              <UserIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.fullName?.split('(')[0]?.trim() || user?.email}
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-tight">
                {user?.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
              {/* Profile summary header */}
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70">
                <p className="font-semibold text-slate-900 truncate">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    {user?.role}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    {user?.branch}
                  </span>
                </div>
              </div>

              {/* Action items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsChangePassOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors text-left font-medium"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <span>Đổi mật khẩu</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
      />
    </header>
  );
};
