import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Warehouse,
  Boxes,
  Truck,
  ArrowLeftRight,
  ClipboardList,
  Network,
  Server,
  Cpu,
  FileCode2,
  Shuffle,
  ShieldCheck,
  History,
  Users,
  Settings,
  Database,
  Building2,
  ShoppingBag,
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isSharded?: boolean;
}

interface MenuGroup {
  groupName: string;
  items: MenuItem[];
}

export const Sidebar: React.FC = () => {
  const menuGroups: MenuGroup[] = [
    {
      groupName: 'TỔNG QUAN',
      items: [
        {
          name: 'Dashboard Điều hành',
          path: '/dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupName: 'NGHIỆP VỤ KHO BÃI (WMS)',
      items: [
        {
          name: 'Danh mục Vật tư',
          path: '/materials',
          icon: Layers,
          badge: 'Global',
        },
        {
          name: 'Tổng kho & Ô kệ',
          path: '/warehouses',
          icon: Warehouse,
        },
        {
          name: 'Nhà cung cấp & Mua sắm',
          path: '/procurement',
          icon: ShoppingBag,
          badge: 'Hybrid',
        },
        {
          name: 'Tồn kho Chi nhánh',
          path: '/inventory',
          icon: Boxes,
          isSharded: true,
          badge: 'Sharded',
        },
        {
          name: 'Phiếu Nhập kho',
          path: '/goods-receipts',
          icon: Truck,
          isSharded: true,
          badge: 'Zone HN/HCM',
        },
        {
          name: 'Phiếu Xuất kho',
          path: '/goods-issues',
          icon: Truck,
          isSharded: true,
          badge: 'ACID Txn',
        },
        {
          name: 'Luân chuyển Liên kho',
          path: '/stock-transfers',
          icon: ArrowLeftRight,
          badge: 'Cross-Zone',
        },
        {
          name: 'Kiểm kê Kho',
          path: '/stocktakes',
          icon: ClipboardList,
        },
      ],
    },
    {
      groupName: 'CƠ SỞ DỮ LIỆU PHÂN TÁN (DEMO)',
      items: [
        {
          name: 'Cấu trúc Cụm Cluster',
          path: '/cluster-topology',
          icon: Network,
          badge: '4 Nodes',
        },
        {
          name: 'Phân bổ Shard Data',
          path: '/shard-distribution',
          icon: Server,
          badge: 'Stats',
        },
        {
          name: 'Phân tích Định tuyến',
          path: '/query-analyzer',
          icon: Cpu,
          badge: 'Targeted vs Scatter',
        },
        {
          name: 'Explain Execution Plan',
          path: '/explain-plan',
          icon: FileCode2,
        },
        {
          name: 'Giao dịch Phân tán ACID',
          path: '/distributed-transactions',
          icon: Shuffle,
          badge: 'Rollback Demo',
        },
        {
          name: 'Zone Sharding Lab',
          path: '/zone-sharding-lab',
          icon: Building2,
          badge: 'HN vs HCM',
        },
        {
          name: 'Mô phỏng Chịu lỗi HA',
          path: '/ha-simulator',
          icon: ShieldCheck,
          badge: 'Failover',
        },
        {
          name: 'Truy vết Audit & TTL',
          path: '/audit-ttl-explorer',
          icon: History,
          badge: 'TTL 365d',
        },
      ],
    },
    {
      groupName: 'QUẢN TRỊ HỆ THỐNG',
      items: [
        {
          name: 'Người dùng & RBAC',
          path: '/users',
          icon: Users,
        },
        {
          name: 'Cấu hình Chi nhánh',
          path: '/branches',
          icon: Database,
        },
        {
          name: 'Thiết lập Chung',
          path: '/settings',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#0e1726] text-slate-300 flex flex-col shrink-0 h-screen border-r border-slate-800 select-none">
      <div className="h-14 px-5 flex items-center gap-3 border-b border-slate-800 bg-[#0a111c]">
        <div className="w-8 h-8 rounded bg-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
          <Database className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xs tracking-wider text-white uppercase">
            DISTRIBUTED WMS
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            MongoDB Sharded Cluster
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {menuGroups.map((group) => (
          <div key={group.groupName}>
            <div className="px-3 mb-2 text-[10px] font-semibold text-slate-400 tracking-wider font-mono">
              {group.groupName}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-700/80 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <item.icon className="w-4 h-4 shrink-0 text-slate-400" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-normal tracking-tight shrink-0 border ${
                        item.isSharded
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/80'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800/80 bg-[#0a111c] text-[11px] text-slate-400 flex items-center justify-between font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Router: 27017
        </span>
        <span className="text-[10px] text-slate-400">v1.0</span>
      </div>
    </aside>
  );
};
