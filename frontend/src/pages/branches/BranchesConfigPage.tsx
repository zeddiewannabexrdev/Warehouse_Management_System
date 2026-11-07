import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Server,
  Network,
  Cpu,
  MapPin,
  User,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { MetricStrip, MetricItemProps } from '../../components/common/MetricStrip';

interface BranchInfo {
  code: string;
  name: string;
  region: string;
  assignedShard: string;
  zoneTag: string;
  address: string;
  manager: string;
  isSharded: boolean;
}

export const BranchesConfigPage: React.FC = () => {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBranches = async () => {
    try {
      setRefreshing(true);
      const data = await api.get<BranchInfo[]>('/branches');
      setBranches(data);
    } catch {
      // Fallback static
      setBranches([
        {
          code: 'HN',
          name: 'Tổng kho Vật tư Miền Bắc (Long Biên)',
          region: 'Miền Bắc',
          assignedShard: 'shard1 (port 27018)',
          zoneTag: 'ZONE_HN',
          address: 'Cụm Công nghiệp Sài Đồng, Long Biên, Hà Nội',
          manager: 'Nguyễn Văn Hùng',
          isSharded: true,
        },
        {
          code: 'HCM',
          name: 'Tổng kho Vật tư Miền Nam (Cát Lái)',
          region: 'Miền Nam',
          assignedShard: 'shard2 (port 27020)',
          zoneTag: 'ZONE_HCM',
          address: 'Khu cảng Cát Lái, P. Thạnh Mỹ Lợi, TP. Thủ Đức, TP.HCM',
          manager: 'Lê Minh Trí',
          isSharded: true,
        },
        {
          code: 'DN',
          name: 'Kho Vật tư Khu vực Miền Trung (Hòa Cầm)',
          region: 'Miền Trung',
          assignedShard: 'Primary Shard (Port 27018)',
          zoneTag: 'UNTAGGED',
          address: 'KCN Hòa Cầm, Cẩm Lệ, TP. Đà Nẵng',
          manager: 'Phan Đình Hoàng',
          isSharded: false,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const metricItems: MetricItemProps[] = [
    {
      label: 'Tổng số chi nhánh',
      value: branches.length,
      subText: 'Mạng lưới kho quốc gia',
      status: 'neutral',
    },
    {
      label: 'Zone HN (Miền Bắc)',
      value: 'Shard 1',
      subText: 'Port 27018 · shard1ReplSet',
      status: 'success',
    },
    {
      label: 'Zone HCM (Miền Nam)',
      value: 'Shard 2',
      subText: 'Port 27020 · shard2ReplSet',
      status: 'warning',
    },
    {
      label: 'Khóa phân mảnh',
      value: 'warehouse_branch',
      subText: 'Compound Prefix Locality',
      status: 'info',
    },
    {
      label: 'RBAC BranchGuard',
      value: 'Enforced',
      subText: 'Chống vượt ranh giới Shard',
      status: 'success',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner label="Đang tải dữ liệu cấu hình chi nhánh..." />
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
            CONFIG
          </span>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">
            Cấu Hình Chi Nhánh & Ánh Xạ Shard (Branch Mapping)
          </h1>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            cluster.branches
          </span>
        </div>

        <button
          onClick={loadBranches}
          disabled={refreshing}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors cursor-pointer self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>Tải lại</span>
        </button>
      </div>

      {/* 2. Telemetry Metric Strip */}
      <MetricStrip items={metricItems} />

      {/* 3. Divided List: Branch & Shard Mapping (Replaces disconnected bulky cards) */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">
              Danh Sách Chi Nhánh & Ánh Xạ Node Phân Tán
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {branches.length} chi nhánh đang cấu hình
          </span>
        </div>

        {/* Divided List Container */}
        <div className="divide-y divide-slate-200">
          {branches.map((b) => {
            const isHN = b.code === 'HN';
            const isHCM = b.code === 'HCM';

            return (
              <div
                key={b.code}
                className="p-3.5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
              >
                {/* Left: Branch Identity & Location */}
                <div className="flex items-start gap-3 min-w-[280px]">
                  <div
                    className={`w-9 h-9 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      isHN
                        ? 'bg-blue-600 text-white'
                        : isHCM
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {b.code}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-xs">
                        {b.name}
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {b.region}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{b.address}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Thủ kho phụ trách: <strong className="text-slate-800">{b.manager}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Middle: Shard & Zone Routing Meta */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">Node Shard</span>
                    <div className="flex items-center gap-1.5 text-slate-800 font-semibold mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{b.assignedShard}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">Zone Tag</span>
                    <div className="mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          isHN
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : isHCM
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Network className="w-3 h-3" />
                        {b.zoneTag}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">Phân Vùng</span>
                    <span
                      className={`inline-block mt-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                        b.isSharded
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {b.isSharded ? 'SHARDED' : 'UNSHARDED'}
                    </span>
                  </div>
                </div>

                {/* Right: Chunk Boundaries Context */}
                <div className="text-[11px] font-mono text-slate-500 lg:text-right border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase">Chunk Range</span>
                  <span className="font-semibold text-slate-800">
                    {isHN ? 'MinKey ≤ branch < "HCM"' : isHCM ? '"HCM" ≤ branch < MaxKey' : 'Global Reference Data'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Divided List: RBAC Guard & Security Enforcements */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">
              Quy Tắc Khóa Phân Mảnh & Ranh Giới Bảo Mật (RBAC Guard)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            BranchGuard Active
          </span>
        </div>

        <div className="divide-y divide-slate-200 text-xs">
          {/* Rule Item 1 */}
          <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900">1. Compound Shard Key Enforce</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Tất cả các tài liệu trong các collection có phân mảnh (như tồn kho, phiếu nhập, phiếu xuất) bắt buộc gắn tiền tố chi nhánh.
              </p>
            </div>
            <div className="p-2 bg-slate-950 text-emerald-400 rounded font-mono text-[11px] shrink-0">
              sh.shardCollection("...", &#123; "warehouse_branch": 1, ... &#125;)
            </div>
          </div>

          {/* Rule Item 2 */}
          <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900">2. Backend Boundary Guard</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Thủ kho chỉ có quyền tạo và chỉnh sửa trên chi nhánh được cấp (MANAGER_HN chỉ ghi vào Shard 1). Mọi request giả lập sai chi nhánh bị ném lỗi 403 Forbidden.
              </p>
            </div>
            <div className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200 font-mono text-[11px] text-slate-700 shrink-0">
              @UseGuards(BranchAccessGuard)
            </div>
          </div>

          {/* Rule Item 3 */}
          <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900">3. Targeted Query Optimization</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Mongos Router phân tích trực tiếp trường <code>warehouse_branch</code> để chuyển tiếp truy vấn đến đúng 1 Shard đích, bỏ qua phát tán broadcast.
              </p>
            </div>
            <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded font-mono text-[11px] shrink-0 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Winning Stage: SINGLE_SHARD
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
