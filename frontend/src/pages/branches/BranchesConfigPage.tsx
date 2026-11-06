import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Server,
  Network,
  Cpu,
  MapPin,
  User,
} from 'lucide-react';

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

  useEffect(() => {
    async function loadBranches() {
      try {
        const data = await api.get<BranchInfo[]>('/branches');
        setBranches(data);
      } catch {
        // Fallback static if offline
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
            assignedShard: 'Primary Shard',
            zoneTag: 'UNTAGGED',
            address: 'KCN Hòa Cầm, Cẩm Lệ, TP. Đà Nẵng',
            manager: 'Phan Đình Hoàng',
            isSharded: false,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadBranches();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Cấu hình Chi nhánh & Ánh xạ Vùng phân tán
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          Định nghĩa thông tin mạng lưới kho bãi toàn quốc và cơ chế ánh xạ từng chi nhánh vào các Node Shard vật lý trong cụm MongoDB.
        </p>
      </div>

      {/* Concept Architecture Info Bar */}
      <div className="bg-slate-50 text-slate-700 p-4 rounded-lg border border-slate-200 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Server className="w-4 h-4 text-blue-600" />
            <span>Định tuyến truy vấn theo chi nhánh (Targeted Routing)</span>
          </div>
          <p className="text-[11px] text-slate-500 max-w-2xl leading-relaxed">
            Mỗi nhân sự khi phát sinh giao dịch mang theo khóa phân mảnh <code>warehouse_branch</code>. Router tự động chuyển tiếp trực tiếp đến Shard lưu trữ tương ứng.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-white rounded border border-slate-200 text-center shrink-0 font-mono text-[11px]">
          <span className="text-slate-500">Router Port:</span> <strong className="text-emerald-700">27017</strong>
        </div>
      </div>

      {/* Branch Cards Grid */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <LoadingSpinner label="Đang tải dữ liệu cấu hình chi nhánh..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {branches.map((b) => {
            const isHN = b.code === 'HN';
            const isHCM = b.code === 'HCM';

            return (
              <div
                key={b.code}
                className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-shadow"
              >
                <div>
                  {/* Card Header */}
                  <div
                    className={`p-4 border-b flex items-center justify-between ${
                      isHN
                        ? 'bg-blue-50/50 border-blue-100'
                        : isHCM
                        ? 'bg-emerald-50/50 border-emerald-100'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs ${
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
                        <h4 className="text-xs font-bold text-slate-900">{b.name}</h4>
                        <span className="text-[11px] text-slate-500">{b.region}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        b.isSharded
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {b.isSharded ? 'SHARDED' : 'UNSHARDED'}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3.5 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-1 font-medium">Shard vật lý tương ứng:</span>
                      <div className="flex items-center gap-1.5 font-mono text-slate-800 font-semibold bg-slate-50 p-2 rounded border border-slate-200">
                        <Server className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>{b.assignedShard}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px] mb-1 font-medium">Zone Tag MongoDB:</span>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200">
                        <Network className="w-3.5 h-3.5" />
                        {b.zoneTag}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2 text-slate-600">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-relaxed">{b.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px]">Trưởng chi nhánh: <strong>{b.manager}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Chunk boundary:</span>
                  <span className="font-semibold text-slate-800">MinKey ≤ branch &lt; MaxKey</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Distributed Shard Key Rule Reference */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand-600" />
          Quy tắc Khóa phân mảnh kết hợp Phân quyền (Shard Key & RBAC Context)
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Tất cả các tài liệu trong các collection có phân mảnh như <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-brand-700">goods_receipts</code> (Phiếu nhập kho), <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-brand-700">goods_issues</code> (Phiếu xuất kho), <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-brand-700">inventory_stock</code> (Tồn kho) đều sử dụng Compound Shard Key:
        </p>
        <div className="p-3 bg-slate-900 text-slate-100 rounded font-mono text-xs overflow-x-auto">
          <code>sh.shardCollection("vattu_db.goods_receipts", &#123; "warehouse_branch": 1, "receipt_code": 1 &#125;)</code>
        </div>
        <p className="text-[11px] text-slate-500">
          Khi Thủ kho Miền Bắc (<span className="font-medium text-slate-700">MANAGER_HN</span>) tạo phiếu, hệ thống tự động gán <code className="font-mono text-slate-700">warehouse_branch: "HN"</code>. Nếu cố ý sửa đổi thành <code className="font-mono text-slate-700">"HCM"</code>, <strong className="text-red-600">BranchGuard</strong> tại Backend API sẽ ném ngoại lệ <code className="font-mono text-red-600">403 Forbidden</code> ngay tại tầng ứng dụng trước khi lệnh tới MongoDB.
        </p>
      </div>
    </div>
  );
};
