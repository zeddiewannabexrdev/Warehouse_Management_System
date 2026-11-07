import React, { useState } from 'react';
import {
  Sliders,
  Database,
  ShieldCheck,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { MetricStrip, MetricItemProps } from '../../components/common/MetricStrip';

export const SettingsPage: React.FC = () => {
  const [telemetryActive, setTelemetryActive] = useState(true);
  const [compactDensity, setCompactDensity] = useState(true);
  const [pingInterval, setPingInterval] = useState('5');
  const [connPoolSize, setConnPoolSize] = useState('100');
  const [transactionTimeout, setTransactionTimeout] = useState('60');
  const [ttlRetentionDays, setTtlRetentionDays] = useState('90');
  const [strictBranchGuard, setStrictBranchGuard] = useState(true);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState('8');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const metricItems: MetricItemProps[] = [
    {
      label: 'Giao Thức Engine',
      value: 'WiredTiger',
      subText: 'MongoDB 7.0 Enterprise',
      status: 'neutral',
    },
    {
      label: 'Cụm Sharding',
      value: '2 Shards (Zone)',
      subText: 'HN (27018) + HCM (27020)',
      status: 'success',
    },
    {
      label: 'Security Guard',
      value: strictBranchGuard ? 'Strict Enforced' : 'Permissive',
      subText: 'BranchGuard @UseGuards',
      status: strictBranchGuard ? 'success' : 'warning',
    },
    {
      label: 'TTL Retention',
      value: `${ttlRetentionDays} ngày`,
      subText: 'Tự động purge audit logs',
      status: 'info',
    },
    {
      label: 'Mật độ giao diện',
      value: compactDensity ? 'Operate Mode' : 'Standard',
      subText: 'Row height: 32px crisp',
      status: 'neutral',
    },
  ];

  return (
    <div className="space-y-3 font-sans">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
            SYSTEM
          </span>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">
            Cài Đặt Hệ Thống & Cấu Hình Cụm (System Settings)
          </h1>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            cluster.config.env
          </span>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Đã lưu cấu hình
            </span>
          )}

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu Thay Đổi</span>
          </button>
        </div>
      </div>

      {/* 2. Telemetry Metric Strip */}
      <MetricStrip items={metricItems} />

      {/* 3. Divided List Section 1: Giao diện & Hiển thị viễn trắc */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">
              Tùy Chọn Giao Diện & Mật Độ Thông Tin (UI Display)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Operate Mode Tokens</span>
        </div>

        <div className="divide-y divide-slate-200 text-xs">
          {/* Item 1: High Density */}
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900">Mật độ hiển thị bảng cao (High-Density Data Table)</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Giảm chiều cao dòng xuống 32px, cố định thanh tiêu đề bảng (sticky header) và hiển thị số lượng theo phông Monospace tabular-nums.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={compactDensity}
                onChange={(e) => setCompactDensity(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>

          {/* Item 2: Telemetry Inline Status */}
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900">Hiển thị viễn trắc MongoS thời gian thực (Inline Routing Telemetry)</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Tự động đo đạc độ trễ mạng và winning stage của truy vấn nhắm đích (Targeted) trên thanh tiêu đề các trang kho.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={telemetryActive}
                onChange={(e) => setTelemetryActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>

          {/* Item 3: Ping Interval */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900">Chu kỳ Ping kiểm tra sức khỏe Shard (Heartbeat)</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Tần suất Mongos Gateway thăm dò tình trạng kết nối tới các container Shard 1 (27018) và Shard 2 (27020).
              </p>
            </div>
            <select
              value={pingInterval}
              onChange={(e) => setPingInterval(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800 focus:outline-none shrink-0"
            >
              <option value="5">5 giây (Khuyến nghị thực nghiệm)</option>
              <option value="15">15 giây</option>
              <option value="30">30 giây</option>
              <option value="60">60 giây (Tiết kiệm I/O)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Divided List Section 2: Tham số Cụm Phân Tán (Cluster Storage) */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">
              Tham Số Kết Nối & Động Cơ Lưu Trữ (Cluster Telemetry)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">MongoS 27017</span>
        </div>

        <div className="divide-y divide-slate-200 text-xs">
          {/* Connection Pool */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900">Kích thước Connection Pool (Mongos to Shards)</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Số lượng kết nối đồng thời tối đa duy trì giữa Router và từng ReplicaSet thành viên.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min="10"
                max="500"
                value={connPoolSize}
                onChange={(e) => setConnPoolSize(e.target.value)}
                className="w-24 px-2.5 py-1 border border-slate-200 rounded text-xs font-mono text-slate-900 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 font-mono">conns</span>
            </div>
          </div>

          {/* 2PC Transaction Timeout */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900">Thời gian giới hạn Giao dịch Phân tán (2PC Timeout)</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Thời gian tối đa chờ xác nhận pha chuẩn bị (Prepare Phase) và pha hoàn tất (Commit Phase) trong giao dịch điều chuyển kho xuyên Shard.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min="10"
                max="300"
                value={transactionTimeout}
                onChange={(e) => setTransactionTimeout(e.target.value)}
                className="w-24 px-2.5 py-1 border border-slate-200 rounded text-xs font-mono text-slate-900 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 font-mono">giây</span>
            </div>
          </div>

          {/* TTL Index Retention */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900">Thời hạn lưu trữ Nhật ký Kiểm toán (TTL Index Purge)</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Background worker của MongoDB tự động xóa bản ghi trong collection <code>material_audit_logs</code> sau khi quá hạn.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min="7"
                max="365"
                value={ttlRetentionDays}
                onChange={(e) => setTtlRetentionDays(e.target.value)}
                className="w-24 px-2.5 py-1 border border-slate-200 rounded text-xs font-mono text-slate-900 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 font-mono">ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Divided List Section 3: Ranh Giới Bảo Mật & RBAC (Security & Boundary Guards) */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">
              Chính Sách Bảo Mật Ranh Giới Shard (RBAC & Boundary Guards)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 font-semibold">Security V1</span>
        </div>

        <div className="divide-y divide-slate-200 text-xs">
          {/* Strict BranchGuard */}
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900">Chế độ kiểm duyệt chi nhánh nghiêm ngặt (Strict BranchGuard)</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Chặn mọi thao tác ghi dữ liệu của thủ kho có chi nhánh không trùng khớp với tài khoản đăng nhập (ném mã lỗi HTTP 403 Forbidden).
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={strictBranchGuard}
                onChange={(e) => setStrictBranchGuard(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>

          {/* Session Expiry */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900">Thời hạn phiên làm việc JWT (Session Expiration)</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Thời gian hiệu lực của mã truy cập JWT trước khi hệ thống yêu cầu xác thực lại.
              </p>
            </div>
            <select
              value={sessionTimeoutHours}
              onChange={(e) => setSessionTimeoutHours(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800 focus:outline-none shrink-0"
            >
              <option value="4">4 giờ</option>
              <option value="8">8 giờ (Chuẩn ca làm việc)</option>
              <option value="24">24 giờ</option>
            </select>
          </div>

          {/* 2FA for Super Admin */}
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900">Bắt buộc xác thực hai yếu tố (2FA for Super Admin)</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Yêu cầu mã TOTP Authenticator khi đăng nhập bằng quyền quản trị tối cao toàn quốc.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={twoFactorRequired}
                onChange={(e) => setTwoFactorRequired(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
