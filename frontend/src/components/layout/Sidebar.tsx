import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  superAdminOnly?: boolean;
}

interface MenuGroup {
  groupName: string;
  superAdminOnly?: boolean;
  items: MenuItem[];
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

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
      groupName: 'NGHIỆP VỤ KHO BÃI',
      items: [
        {
          name: 'Danh mục Vật tư',
          path: '/materials',
          icon: Layers,
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
        },
        {
          name: 'Tồn kho Chi nhánh',
          path: '/inventory',
          icon: Boxes,
          isSharded: true,
        },
        {
          name: 'Phiếu Nhập kho',
          path: '/goods-receipts',
          icon: Truck,
          isSharded: true,
        },
        {
          name: 'Phiếu Xuất kho',
          path: '/goods-issues',
          icon: Truck,
          isSharded: true,
        },
        {
          name: 'Luân chuyển Liên kho',
          path: '/stock-transfers',
          icon: ArrowLeftRight,
        },
        {
          name: 'Kiểm kê Kho',
          path: '/stocktakes',
          icon: ClipboardList,
        },
        {
          name: 'Báo cáo & Định giá Kho',
          path: '/reports',
          icon: FileCode2,
          isSharded: true,
        },
      ],
    },
    {
      groupName: 'THỰC NGHIỆM PHÂN TÁN (DEMO)',
      superAdminOnly: true,
      items: [
        {
          name: 'Cấu trúc Cụm Cluster',
          path: '/cluster-topology',
          icon: Network,
        },
        {
          name: 'Phân bổ Shard Data',
          path: '/shard-distribution',
          icon: Server,
        },
        {
          name: 'Định tuyến & Semi-Join',
          path: '/query-analyzer',
          icon: Cpu,
        },
        {
          name: 'Giao dịch Phân tán ACID',
          path: '/distributed-transactions',
          icon: Shuffle,
        },
        {
          name: 'Zone Sharding Lab',
          path: '/zone-sharding-lab',
          icon: Building2,
        },
        {
          name: 'Mô phỏng Chịu lỗi HA',
          path: '/ha-simulator',
          icon: ShieldCheck,
        },
        {
          name: 'Truy vết Audit & TTL',
          path: '/audit-ttl-explorer',
          icon: History,
        },
      ],
    },
    {
      groupName: 'QUẢN TRỊ HỆ THỐNG',
      superAdminOnly: true,
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

  const visibleGroups = menuGroups
    .filter((group) => !group.superAdminOnly || isSuperAdmin)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.superAdminOnly || isSuperAdmin),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="w-60 bg-[#0e1726] text-slate-300 flex flex-col shrink-0 h-screen border-r border-slate-800 select-none">
      <div className="h-12 px-4 flex items-center gap-2.5 border-b border-slate-800 bg-[#0a111c]">
        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
          <Database className="w-3.5 h-3.5 stroke-[1.5] text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[11px] tracking-wider text-white uppercase leading-tight">
            DISTRIBUTED WMS
          </span>
          <span className="text-[9px] text-slate-400 font-mono leading-none mt-0.5">
            {isSuperAdmin ? 'MongoDB Sharded Cluster' : 'Hệ Thống Kho Bãi Doanh Nghiệp'}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        {visibleGroups.map((group) => (
          <div key={group.groupName}>
            <div className="px-2 mb-1 text-[9px] font-semibold text-slate-400 tracking-wider font-mono uppercase">
              {group.groupName}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2 truncate">
                    <item.icon className="w-3.5 h-3.5 shrink-0 stroke-[1.5] text-slate-400 group-hover:text-slate-200" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.isSharded && (
                    <span
                      title="Phân mảnh ngang (Sharded Collection theo chi nhánh)"
                      className="px-1 py-0.2 text-[8px] font-mono font-semibold rounded bg-amber-400/10 text-amber-300 border border-amber-400/25 shrink-0 leading-tight tracking-tight"
                    >
                      SHARD
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="h-8 px-3 border-t border-slate-800/80 bg-[#0a111c] text-[10px] text-slate-400 flex items-center justify-between font-mono">
        {isSuperAdmin ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Router: 27017
            </span>
            <span className="text-[9px] text-slate-400">CLUSTER</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {user?.branch === 'HN'
                ? 'Tổng kho Hà Nội'
                : user?.branch === 'HCM'
                ? 'Tổng kho TP.HCM'
                : `Chi nhánh ${user?.branch || 'Toàn quốc'}`}
            </span>
            <span className="text-[9px] text-slate-400 shrink-0 font-sans font-medium">
              {user?.role === 'MANAGER_HN' || user?.role === 'MANAGER_HCM'
                ? 'Trưởng Kho'
                : user?.role === 'QC_INSPECTOR'
                ? 'KCS'
                : user?.role === 'AUDITOR'
                ? 'Kiểm Toán'
                : user?.role}
            </span>
          </>
        )}
      </div>
    </aside>
  );
};
