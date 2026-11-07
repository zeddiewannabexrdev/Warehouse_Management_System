import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  ArrowRightLeft,
  Server,
  ClipboardCheck,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api';

export interface NotificationItem {
  id: string;
  type: 'alert' | 'transfer' | 'cluster' | 'audit';
  title: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'alert',
    title: 'Cảnh báo định mức tồn kho',
    message: 'Thép Hòa Phát phi 20 (MAT-STEEL-D20) tại Kho Hà Nội dưới định mức an toàn tối thiểu (150/500 kg).',
    time: '5 phút trước',
    read: false,
    link: '/inventory',
  },
  {
    id: 'notif-2',
    type: 'transfer',
    title: 'Lệnh điều chuyển kho liên chi nhánh',
    message: 'Phiếu #TRF-2026-003 chuyển 200 cuộn cáp CADIVI từ Hà Nội sang TP.HCM đã hoàn tất cân bằng tồn.',
    time: '25 phút trước',
    read: false,
    link: '/stock-transfers',
  },
  {
    id: 'notif-3',
    type: 'cluster',
    title: 'Đồng bộ Sharded Cluster & Zone Locality',
    message: 'Range-Based Zone Sharding (ZONE_HN và ZONE_HCM) đã định tuyến và phân bổ dữ liệu cân bằng 100%.',
    time: '1 giờ trước',
    read: false,
    link: '/cluster/zone-sharding',
  },
  {
    id: 'notif-4',
    type: 'audit',
    title: 'Biên bản kiểm kê định kỳ',
    message: 'Biên bản đối soát kiểm kê kho #STK-2026-002 đã được chốt số liệu bởi phòng Kiểm toán (Auditor).',
    time: '2 giờ trước',
    read: true,
    link: '/stocktakes',
  },
];

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'alert' | 'transfer' | 'cluster'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Try to fetch real low stock alerts if available to enrich notifications
  useEffect(() => {
    let isMounted = true;
    const fetchLiveAlerts = async () => {
      try {
        const res: any = await api.get('/inventory/low-stock');
        if (isMounted && Array.isArray(res) && res.length > 0) {
          const liveAlerts: NotificationItem[] = res.slice(0, 2).map((item, idx) => ({
            id: `live-alert-${idx}-${item.materialCode || idx}`,
            type: 'alert',
            title: `Cảnh báo tồn kho [${item.materialCode || 'Vật tư'}]`,
            message: `Tồn khả dụng: ${item.availableQuantity ?? item.quantity ?? 0} ${item.unit || ''} (Ngưỡng an toàn: ${item.minQuantity || 0}).`,
            time: 'Vừa xong',
            read: false,
            link: '/inventory',
          }));

          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newOnes = liveAlerts.filter((n) => !existingIds.has(n.id));
            return [...newOnes, ...prev];
          });
        }
      } catch {
        // Fallback to default notifications
      }
    };
    fetchLiveAlerts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setIsOpen(false);
    navigate(item.link);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'transfer':
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      case 'cluster':
        return <Server className="w-4 h-4 text-emerald-600" />;
      case 'audit':
        return <ClipboardCheck className="w-4 h-4 text-purple-600" />;
    }
  };

  const getIconBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'alert':
        return 'bg-rose-50 border-rose-200';
      case 'transfer':
        return 'bg-blue-50 border-blue-200';
      case 'cluster':
        return 'bg-emerald-50 border-emerald-200';
      case 'audit':
        return 'bg-purple-50 border-purple-200';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded flex items-center justify-center relative transition-colors border border-transparent hover:border-slate-200"
        title="Thông báo hệ thống"
        aria-label="Thông báo hệ thống"
        aria-expanded={isOpen}
      >
        <Bell className="w-3.5 h-3.5 stroke-[1.5]" />
        {unreadCount > 0 && (
          <span className="min-w-3.5 h-3.5 px-0.5 bg-rose-500 text-white text-[9px] font-mono font-bold rounded-full absolute -top-0.5 -right-0.5 flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-white rounded-md shadow-xs border border-slate-200 z-50 overflow-hidden text-xs">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-semibold rounded-full text-[10px]">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium transition"
                  title="Đánh dấu tất cả là đã đọc"
                >
                  <Check className="w-3 h-3" />
                  Đã đọc
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600 transition"
                  title="Xóa tất cả thông báo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-1.5 bg-white text-[11px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                filter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('alert')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                filter === 'alert'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cảnh báo
            </button>
            <button
              onClick={() => setFilter('transfer')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                filter === 'transfer'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Điều chuyển
            </button>
            <button
              onClick={() => setFilter('cluster')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                filter === 'cluster'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cluster
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 text-xs">Không có thông báo nào</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Các cảnh báo tồn kho và giao dịch phân tán sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition hover:bg-slate-50 ${
                    !item.read ? 'bg-blue-50/30' : 'bg-white'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${getIconBg(
                      item.type
                    )}`}
                  >
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs truncate ${
                          !item.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                        }`}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  {!item.read && (
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/inventory');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 transition"
            >
              Quản trị tồn kho & định mức
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/reports');
              }}
              className="text-slate-500 hover:text-slate-800 font-medium transition"
            >
              Báo cáo phân tán
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
