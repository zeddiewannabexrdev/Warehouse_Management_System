import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  StorageLocation,
  Warehouse,
  WarehouseMapResponse,
  AllocateLocationPayload,
} from '../../types/warehouse.types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MetricStrip } from '../../components/common/MetricStrip';
import { formatNumber } from '../../lib/utils';
import {
  Layers,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Plus,
  RefreshCw,
  X,
  Cpu,
} from 'lucide-react';

export const WarehouseMapPage: React.FC = () => {
  const { activeBranch } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWhCode, setSelectedWhCode] = useState<string>('WH-HN-01');
  const [mapData, setMapData] = useState<WarehouseMapResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedAisle, setSelectedAisle] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals & Drawer
  const [selectedBin, setSelectedBin] = useState<StorageLocation | null>(null);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState<boolean>(false);
  const [isScatterModalOpen, setIsScatterModalOpen] = useState<boolean>(false);
  const [scatterResults, setScatterResults] = useState<any | null>(null);
  const [scatterLoading, setScatterLoading] = useState<boolean>(false);

  // Allocation Form State
  const [allocateForm, setAllocateForm] = useState<AllocateLocationPayload>({
    location_code: '',
    warehouse_branch: 'HN',
    material_code: 'MAT-STEEL-D20',
    quantity: 20,
    occupied_weight_kg: 3000,
    batch_number: 'BATCH-2026-ALLOC-01',
  });
  const [allocating, setAllocating] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // 1. Tải danh mục kho khi khởi động
  useEffect(() => {
    async function loadWarehouses() {
      try {
        const res = await api.get<Warehouse[]>('/warehouses', {
          params: { branch: activeBranch },
        });
        setWarehouses(res || []);
        if (res && res.length > 0) {
          // Ưu tiên chọn kho theo chi nhánh active
          const matched = res.find((w) => w.branch === activeBranch) || res[0];
          setSelectedWhCode(matched.warehouse_code);
        }
      } catch {
        // Fallback default
        setWarehouses([
          {
            warehouse_code: 'WH-HN-01',
            name: 'Tổng kho Vật tư Miền Bắc (Long Biên)',
            branch: 'HN',
            address: 'Cụm Công nghiệp Sài Đồng, Long Biên, Hà Nội',
            manager: 'Nguyễn Văn Hùng',
            capacity_sqm: 12000,
            is_active: true,
            assignedShard: 'shard1ReplSet (Port 27018)',
            zoneTag: 'ZONE_HN',
          },
          {
            warehouse_code: 'WH-HCM-01',
            name: 'Tổng kho Vật tư Miền Nam (Cát Lái)',
            branch: 'HCM',
            address: 'Khu cảng Cát Lái, P. Thạnh Mỹ Lợi, TP. Thủ Đức, TP.HCM',
            manager: 'Lê Minh Trí',
            capacity_sqm: 18000,
            is_active: true,
            assignedShard: 'shard2ReplSet (Port 27020)',
            zoneTag: 'ZONE_HCM',
          },
        ]);
        setSelectedWhCode(activeBranch === 'HCM' ? 'WH-HCM-01' : 'WH-HN-01');
      }
    }
    loadWarehouses();
  }, [activeBranch]);

  // 2. Tải mặt bằng ô kệ theo tổng kho đã chọn (TARGETED QUERY)
  const fetchStorageLocations = async () => {
    try {
      setError(null);
      const currentWh = warehouses.find((w) => w.warehouse_code === selectedWhCode);
      const branchParam = currentWh?.branch || (selectedWhCode.includes('HCM') ? 'HCM' : 'HN');

      const res = await api.get<WarehouseMapResponse>('/warehouses/locations', {
        params: {
          warehouse_code: selectedWhCode,
          branch: branchParam,
        },
      });
      setMapData(res);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải sơ đồ ô kệ từ server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedWhCode) {
      setLoading(true);
      fetchStorageLocations();
    }
  }, [selectedWhCode]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStorageLocations();
  };

  // 3. Xử lý mở Modal Xếp hàng vào ô (ACID Transaction)
  const handleOpenAllocate = (bin?: StorageLocation) => {
    const targetBin = bin || selectedBin;
    if (!targetBin) return;

    setAllocateForm({
      location_code: targetBin.location_code,
      warehouse_branch: targetBin.warehouse_branch,
      material_code: targetBin.current_material_code || 'MAT-STEEL-D20',
      quantity: 15,
      occupied_weight_kg: Math.min(3000, targetBin.max_weight_kg),
      batch_number: `BATCH-2026-ACID-${Date.now().toString().slice(-4)}`,
    });
    setIsAllocateModalOpen(true);
  };

  const handleExecuteAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllocating(true);
    try {
      const res: any = await api.post('/warehouses/locations/allocate', allocateForm);
      setActionSuccessMsg(res?.message || 'Giao dịch ACID phân tán thành công!');
      setIsAllocateModalOpen(false);
      setSelectedBin(null);
      // Tải lại sơ đồ để cập nhật trạng thái mới
      await fetchStorageLocations();
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Giao dịch ACID thất bại: ${err?.message}`);
    } finally {
      setAllocating(false);
    }
  };

  // 4. Xử lý tìm kiếm ô trống toàn quốc (SCATTER-GATHER DEMO)
  const handleScatterGatherSearch = async () => {
    setScatterLoading(true);
    setIsScatterModalOpen(true);
    try {
      const res = await api.get('/warehouses/locations/search-empty', {
        params: { min_weight_kg: 2000 },
      });
      setScatterResults(res);
    } catch (err: any) {
      alert(`Lỗi truy vấn Scatter-Gather: ${err?.message}`);
    } finally {
      setScatterLoading(false);
    }
  };

  // Lọc ô kệ hiển thị trên giao diện
  const filteredItems = (mapData?.items || []).filter((item) => {
    if (selectedAisle !== 'ALL' && !item.aisle.startsWith(selectedAisle)) return false;
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
    return true;
  });

  // Nhóm theo Dãy kệ (Aisle)
  const aislesGrouped = filteredItems.reduce((acc, item) => {
    if (!acc[item.aisle]) {
      acc[item.aisle] = [];
    }
    acc[item.aisle].push(item);
    return acc;
  }, {} as Record<string, StorageLocation[]>);

  const currentWarehouse = warehouses.find((w) => w.warehouse_code === selectedWhCode);

  return (
    <div className="space-y-3 font-sans">
      {/* 1. Header & Shard Telemetry Inline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
            MODULE 02
          </span>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">
            Bản Đồ Tổng Kho & Quản Lý Ô Kệ
          </h1>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            &#123; warehouse_code: "{selectedWhCode}" &#125;
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-slate-500">MongoS:</span>
            <strong className="text-slate-800">{mapData?.routing?.winningStage || 'SINGLE_SHARD'}</strong>
          </div>
          <div className="text-slate-300">|</div>
          <div>
            <span className="text-slate-500">Shard:</span>{' '}
            <strong className="text-slate-800">{mapData?.routing?.executingShard || currentWarehouse?.assignedShard || 'shard1ReplSet'}</strong>
          </div>
          <div className="text-slate-300">|</div>
          <div>
            <span className="text-slate-500">Latency:</span>{' '}
            <strong className="text-emerald-700">{mapData?.routing?.executionTimeMs || 8} ms</strong>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Thông báo thành công nếu có */}
      {actionSuccessMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Slim Metric Strip (Replaces 6 bulky KPI cards) */}
      <MetricStrip
        items={[
          {
            label: 'Tổng ô kệ',
            value: formatNumber(mapData?.summary?.totalBins || 0),
            subText: '100% diện tích thiết kế',
            status: 'neutral',
          },
          {
            label: 'Ô trống',
            value: formatNumber(mapData?.summary?.emptyCount || 0),
            subText: 'Sẵn sàng tiếp nhận',
            status: 'success',
          },
          {
            label: 'Có hàng',
            value: formatNumber(mapData?.summary?.occupiedCount || 0),
            subText: 'Đang lưu giữ vật tư',
            status: 'info',
          },
          {
            label: 'Quá tải trọng',
            value: formatNumber(mapData?.summary?.overloadCount || 0),
            subText: '> 100% tải thiết kế',
            status: (mapData?.summary?.overloadCount || 0) > 0 ? 'danger' : 'neutral',
          },
          {
            label: 'Bảo trì',
            value: formatNumber(mapData?.summary?.maintenanceCount || 0),
            subText: 'Khóa tạm thời',
            status: (mapData?.summary?.maintenanceCount || 0) > 0 ? 'warning' : 'neutral',
          },
          {
            label: 'Tỷ lệ lấp đầy',
            value: `${mapData?.summary?.occupancyRate || 0}%`,
            subText: 'Dung lượng thực tế',
            status: (mapData?.summary?.occupancyRate || 0) > 90 ? 'warning' : 'neutral',
          },
        ]}
      />

      {/* 3. Unified Single-Row Toolbar (Kho + Dãy kệ + Trạng thái + Actions) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-md text-xs">
        {/* Left: Dropdown selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Warehouse Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-2 py-1">
            <span className="text-[11px] text-slate-500 mr-1.5 font-medium font-mono">Kho:</span>
            <select
              value={selectedWhCode}
              onChange={(e) => setSelectedWhCode(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {warehouses.map((wh) => (
                <option key={wh.warehouse_code} value={wh.warehouse_code}>
                  {wh.name} [{wh.branch}]
                </option>
              ))}
            </select>
          </div>

          {/* Aisle Selector */}
          <select
            value={selectedAisle}
            onChange={(e) => setSelectedAisle(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 text-xs font-medium cursor-pointer focus:outline-none"
          >
            <option value="ALL">Tất cả Dãy kệ</option>
            {Object.keys(aislesGrouped).map((aisle) => (
              <option key={aisle} value={aisle}>
                Dãy {aisle}
              </option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 text-xs font-medium cursor-pointer focus:outline-none"
          >
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="EMPTY">Ô Trống (EMPTY)</option>
            <option value="OCCUPIED">Đang chứa hàng (OCCUPIED)</option>
            <option value="OVERLOAD">Cảnh báo Quá tải (OVERLOAD)</option>
            <option value="MAINTENANCE">Đang bảo trì (MAINTENANCE)</option>
          </select>
        </div>

        {/* Right: Legend & Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2.5 text-[11px] text-slate-600 font-mono pr-2 border-r border-slate-200">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Trống
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Có hàng
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Quá tải
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Bảo trì
            </span>
          </div>

          <button
            onClick={handleScatterGatherSearch}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-xs font-medium transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>Tìm ô trống toàn quốc</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5. Interactive 2D Layout Map */}
      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded border border-slate-200">
          <LoadingSpinner label="Đang tải dữ liệu ô kệ từ Shard..." />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(aislesGrouped).map(([aisleName, bins]) => (
            <div key={aisleName} className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-700" />
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                    DÃY KỆ (AISLE): {aisleName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({bins.length} ô kệ)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Sức chứa thiết kế: 5.000 kg/ô
                </span>
              </div>

              {/* Bins Grid: 3 Tầng Rack x 4 Ngăn Bin */}
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 bg-[#fafbfc]">
                {bins.map((bin) => {
                  const pct = bin.max_weight_kg > 0 ? Math.min(100, Math.round((bin.occupied_weight_kg / bin.max_weight_kg) * 100)) : 0;
                  const isOver = bin.status === 'OVERLOAD' || pct >= 100;
                  const isEmpty = bin.status === 'EMPTY';
                  const isMaint = bin.status === 'MAINTENANCE';

                  let cardBorder = 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-400';
                  let statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  let barColor = 'bg-emerald-500';

                  if (isMaint) {
                    cardBorder = 'border-slate-200 bg-slate-100/60 opacity-60';
                    statusBadge = 'bg-slate-200 text-slate-600 border-slate-300';
                  } else if (isOver) {
                    cardBorder = 'border-amber-300 bg-amber-50/50 hover:border-amber-500 ring-1 ring-amber-300';
                    statusBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                    barColor = 'bg-amber-500';
                  } else if (!isEmpty) {
                    cardBorder = 'border-rose-200 bg-rose-50/40 hover:border-rose-400';
                    statusBadge = 'bg-rose-100 text-rose-800 border-rose-300';
                    barColor = 'bg-rose-500';
                  }

                  return (
                    <div
                      key={bin.location_code}
                      onClick={() => setSelectedBin(bin)}
                      className={`p-3 rounded border text-xs cursor-pointer transition-all hover:shadow-md ${cardBorder}`}
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                        <span className="font-bold font-mono text-slate-800 tracking-tight">
                          {bin.location_code}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium border ${statusBadge}`}>
                          {bin.status}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        {isEmpty ? (
                          <div className="text-[11px] text-emerald-700 font-mono py-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ô trống - sẵn sàng
                          </div>
                        ) : isMaint ? (
                          <div className="text-[11px] text-slate-500 font-mono py-1 flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-slate-400" /> Đang bảo trì
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-slate-800 truncate" title={bin.material_name || bin.current_material_code || ''}>
                              {bin.material_name || bin.current_material_code}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono">
                              <span>SL: {formatNumber(bin.current_quantity || 0)} {bin.unit || 'đv'}</span>
                              <span className={isOver ? 'text-amber-700 font-bold' : ''}>
                                {formatNumber(bin.occupied_weight_kg)} / {formatNumber(bin.max_weight_kg)} kg
                              </span>
                            </div>

                            {/* Capacity bar */}
                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div className={`${barColor} h-1 rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. Bin Details Drawer / Modal */}
      {selectedBin && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-end z-50 animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-sm">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm font-mono">{selectedBin.location_code}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Tổng kho: {selectedBin.warehouse_code} [{selectedBin.warehouse_branch}]
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBin(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 flex-1 text-xs">
              {/* Shard Placement Info */}
              <div className="p-3 bg-slate-900 text-slate-300 rounded text-xs space-y-1 font-mono">
                <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                  Vị trí Vật lý trong Cụm Phân Tán
                </div>
                <div>Server Shard: <strong className="text-white">{selectedBin.warehouse_branch === 'HN' ? 'Shard 1 (Port 27018)' : 'Shard 2 (Port 27020)'}</strong></div>
                <div>Zone Tag: <strong className="text-white">ZONE_{selectedBin.warehouse_branch}</strong></div>
              </div>

              {/* Status & Capacity */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] font-mono">
                  Thông số Kỹ thuật Ô Kệ
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
                  <div>Tầng kệ (Rack): <strong className="text-slate-900">Tầng {selectedBin.rack}</strong></div>
                  <div>Ngăn chứa (Bin): <strong className="text-slate-900">Ngăn {selectedBin.bin}</strong></div>
                  <div>Tải tối đa: <strong className="text-slate-900">{formatNumber(selectedBin.max_weight_kg)} kg</strong></div>
                  <div>Tải hiện tại: <strong className="text-slate-900">{formatNumber(selectedBin.occupied_weight_kg)} kg</strong></div>
                </div>
              </div>

              {/* Material Details if Occupied */}
              {selectedBin.is_occupied && selectedBin.current_material_code ? (
                <div className="space-y-2">
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] font-mono">
                    Vật tư Đang Lưu Trữ
                  </span>
                  <div className="p-3 bg-blue-50/50 border border-blue-200 rounded space-y-2 text-slate-700">
                    <div className="font-bold text-slate-900">{selectedBin.material_name || selectedBin.current_material_code}</div>
                    <div>Mã vật tư: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-blue-700">{selectedBin.current_material_code}</code></div>
                    <div>Số lượng: <strong className="text-slate-900">{formatNumber(selectedBin.current_quantity || 0)} {selectedBin.unit || 'đơn vị'}</strong></div>
                    <div>Mã lô kiểm định: <code className="font-mono text-slate-600">{selectedBin.batch_number || 'N/A'}</code></div>
                    {selectedBin.storage_condition && (
                      <div>Điều kiện bảo quản: <strong className="text-indigo-700">{selectedBin.storage_condition}</strong></div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-center text-emerald-800 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <div className="font-semibold">Ô kệ đang còn trống</div>
                  <div className="text-[11px] text-emerald-600">Sẵn sàng điều phối xếp vật tư mới vào vị trí này.</div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
              <button
                onClick={() => handleOpenAllocate()}
                className="flex-1 py-2 px-3 bg-brand-700 hover:bg-brand-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Xếp hàng vào ô (ACID Transaction)</span>
              </button>
              <button
                onClick={() => setSelectedBin(null)}
                className="py-2 px-3 bg-white border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Xếp hàng vào ô kệ (DISTRIBUTED ACID TRANSACTION) */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-[#0a111c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider font-mono">
                  Giao dịch Phân tán ACID: Xếp hàng vào Ô kệ
                </h3>
              </div>
              <button onClick={() => setIsAllocateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteAllocate} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] leading-relaxed">
                ℹ <strong>Cơ chế Distributed ACID:</strong> Thao tác này sẽ mở 1 phiên ClientSession với <code>writeConcern: majority</code>, đồng thời cập nhật:
                1) Trạng thái ô kệ; 2) Tồn kho khả dụng <code>inventory_stocks</code>; 3) Ghi nhật ký kiểm toán <code>material_audit_logs</code>.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mã vị trí ô kệ:</label>
                  <input
                    type="text"
                    disabled
                    value={allocateForm.location_code}
                    className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Chi nhánh Tổng kho:</label>
                  <input
                    type="text"
                    disabled
                    value={allocateForm.warehouse_branch}
                    className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mã vật tư:</label>
                <select
                  value={allocateForm.material_code}
                  onChange={(e) => setAllocateForm({ ...allocateForm, material_code: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 font-mono"
                >
                  <option value="MAT-STEEL-D20">MAT-STEEL-D20 (Thép thanh vằn D20 CB400V Hòa Phát)</option>
                  <option value="MAT-CABLE-3X120">MAT-CABLE-3X120 (Cáp ngầm trung thế 3x120 Cadivi)</option>
                  <option value="MAT-CEMENT-PCB40">MAT-CEMENT-PCB40 (Xi măng bao PCB40 Vicem)</option>
                  <option value="MAT-PAINT-EPX01">MAT-PAINT-EPX01 (Sơn Epoxy lót 2 thành phần Jotun)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số lượng xếp dỡ:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={allocateForm.quantity}
                    onChange={(e) => setAllocateForm({ ...allocateForm, quantity: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Khối lượng chiếm dụng (kg):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={allocateForm.occupied_weight_kg}
                    onChange={(e) => setAllocateForm({ ...allocateForm, occupied_weight_kg: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mã lô kiểm định (Batch):</label>
                <input
                  type="text"
                  value={allocateForm.batch_number}
                  onChange={(e) => setAllocateForm({ ...allocateForm, batch_number: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={allocating}
                  className="px-4 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {allocating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang commit transaction...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Thực thi Transaction (Commit Majority)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal: Kết quả Scatter-Gather Query Inspector */}
      {isScatterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-[#0a111c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider font-mono">
                  Minh Chứng Phân Tán: Scatter-Gather Query Inspector
                </h3>
              </div>
              <button onClick={() => setIsScatterModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {scatterLoading ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner label="Mongos đang phát tán truy vấn tới tất cả Shards..." />
                </div>
              ) : (
                <>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded space-y-1 text-indigo-900">
                    <div className="font-bold font-mono text-[11px] uppercase">
                      Kết quả Định tuyến Scatter-Gather:
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      {scatterResults?.routing?.description}
                    </div>
                    <div className="flex items-center gap-4 pt-1 font-mono text-[10px] text-indigo-700">
                      <span>Giai đoạn: <strong>{scatterResults?.routing?.winningStage}</strong></span>
                      <span>Số Shards tham gia: <strong>{scatterResults?.routing?.shardsContacted} Shards</strong></span>
                      <span>Thời gian: <strong>{scatterResults?.routing?.executionTimeMs} ms</strong></span>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] font-mono block mb-2">
                      Danh sách Ô Kệ Trống Tìm Thấy Trên Toàn Quốc ({scatterResults?.total || 0} vị trí):
                    </span>
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                      {(scatterResults?.items || []).map((loc: StorageLocation) => (
                        <div
                          key={loc.location_code}
                          className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between"
                        >
                          <div>
                            <strong className="text-slate-800">{loc.location_code}</strong>
                            <span className="text-slate-500 ml-2 font-sans">
                              (Kho: {loc.warehouse_code} - Dãy {loc.aisle}, Tầng {loc.rack}, Ngăn {loc.bin})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600">Tải: {formatNumber(loc.max_weight_kg)} kg</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              loc.warehouse_branch === 'HN' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {loc.warehouse_branch === 'HN' ? 'Shard 1 (HN)' : 'Shard 2 (HCM)'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsScatterModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-medium cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

