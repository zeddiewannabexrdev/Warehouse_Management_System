import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Building2,
  CheckCircle2,
  Search,
  ShieldCheck,
  Send,
  Radio,
} from 'lucide-react';

interface ZoneTagConfig {
  zones: Array<{
    zoneTag: string;
    shardId: string;
    shardHost: string;
    region: string;
    keyRange: { minKey: string; maxKey: string };
    targetCollections: string[];
  }>;
  primaryShard: string;
  shardingKeyStrategy: string;
}

interface InsertResult {
  message: string;
  documentId: string;
  documentCode: string;
  collection: string;
  branch: string;
  targetShard: string;
  targetZone: string;
  routingDetails: {
    shardKeyEvaluated: Record<string, any>;
    matchedTagRange: string;
    mongosAction: string;
  };
}

interface InspectResult {
  verified: boolean;
  document: any;
  physicalLocation: {
    shard: string;
    container: string;
    port: number;
    zoneTag: string;
    region: string;
    replicaSet: string;
  };
  proof: string;
}

export const ZoneShardingLabPage: React.FC = () => {
  const [zoneConfig, setZoneConfig] = useState<ZoneTagConfig | null>(null);

  // Form states
  const [collectionName, setCollectionName] = useState<'inventory_stocks' | 'goods_receipts'>('inventory_stocks');
  const [branch, setBranch] = useState<'HN' | 'HCM'>('HN');
  const [materialCode, setMaterialCode] = useState<string>('MAT-STEEL-D20');
  const [quantity, setQuantity] = useState<number>(100);
  const [note, setNote] = useState<string>('Ghi dữ liệu kiểm thử Zone Sharding Miền Bắc - Miền Nam');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [insertResult, setInsertResult] = useState<InsertResult | null>(null);

  const [inspecting, setInspecting] = useState<boolean>(false);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);

  const fetchZoneConfig = async () => {
    try {
      const res = await api.get<ZoneTagConfig>('/cluster/zone-sharding/tags');
      setZoneConfig(res);
    } catch {
      // Handled by api error toast
    }
  };

  useEffect(() => {
    fetchZoneConfig();
  }, []);

  const handleInsert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setInspectResult(null);
      const res = await api.post<InsertResult>('/cluster/zone-sharding/insert', {
        collectionName,
        warehouseBranch: branch,
        materialCode,
        quantity: Number(quantity),
        note,
      });
      setInsertResult(res);
    } catch {
      // Handled
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspect = async () => {
    if (!insertResult) return;
    try {
      setInspecting(true);
      const res = await api.get<InspectResult>('/cluster/zone-sharding/inspect', {
        params: {
          collection: insertResult.collection,
          branch: insertResult.branch,
          code: insertResult.documentCode,
        },
      });
      setInspectResult(res);
    } catch {
      // Handled
    } finally {
      setInspecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
              Module B13
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              Geo-Zone Locality Sharding
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            Kiểm Chứng Phân Vùng Dữ Liệu (Zone Sharding Validation Lab)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Kiểm chứng cơ chế Range-based Zone Sharding: Dữ liệu phát sinh tại Hà Nội tự động bay vào Shard 1, dữ liệu TP.HCM tự động lưu tại Shard 2.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" />
            Tạo Bản Ghi Kiểm Thử Định Tuyến
          </h2>

          <form onSubmit={handleInsert} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Bộ Sưu Tập Mục Tiêu
              </label>
              <select
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="inventory_stocks">inventory_stocks (Tồn kho vật tư)</option>
                <option value="goods_receipts">goods_receipts (Phiếu nhập kho)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Chi Nhánh Phát Sinh (Shard Key Prefix)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBranch('HN')}
                  className={`p-3 rounded-xl border text-left transition ${
                    branch === 'HN'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-sm text-emerald-800">Zone HN (Hà Nội)</div>
                  <div className="text-xs text-slate-500 mt-0.5">Đích: Shard 1 (27018)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBranch('HCM')}
                  className={`p-3 rounded-xl border text-left transition ${
                    branch === 'HCM'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-sm text-amber-800">Zone HCM (TP.HCM)</div>
                  <div className="text-xs text-slate-500 mt-0.5">Đích: Shard 2 (27020)</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Vật Tư Thao Tác
              </label>
              <select
                value={materialCode}
                onChange={(e) => setMaterialCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MAT-STEEL-D20">MAT-STEEL-D20 (Thép Hòa Phát phi 20)</option>
                <option value="MAT-CABLE-3X4">MAT-CABLE-3X4 (Cáp CADIVI 3x4mm2)</option>
                <option value="MAT-CEMENT-PCB40">MAT-CEMENT-PCB40 (Xi măng Vicem)</option>
                <option value="MAT-PAINT-EP01">MAT-PAINT-EP01 (Sơn Epoxy Jotun)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Số Lượng
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Ghi Chú Đợt Ghi
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <LoadingSpinner label="Đang định tuyến..." />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Ghi Dữ Liệu Phân Vùng (Zone Routing)
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results & Inspection Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Insert Routing Result */}
          {insertResult ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Định Tuyến Shard Thành Công
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {insertResult.documentCode}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mục tiêu Zone Tag:</span>
                  <span className="font-bold text-emerald-700">{insertResult.targetZone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Node Shard Vật Lý:</span>
                  <span className="font-bold text-slate-900">{insertResult.targetShard}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Khoảng Range Shard Key:</span>
                  <span className="font-mono font-medium text-slate-700">{insertResult.routingDetails.matchedTagRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hành Động Mongos:</span>
                  <span className="font-semibold text-blue-600">{insertResult.routingDetails.mongosAction}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleInspect}
                  disabled={inspecting}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {inspecting ? 'Đang trích xuất vị trí...' : 'Inspect Document Location (Kiểm chứng vị trí vật lý)'}
                </button>
              </div>

              {/* Physical Location Proof */}
              {inspectResult && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 pb-1 border-b border-emerald-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Bằng Chứng Lưu Trữ Thực Tế (Physical Storage Proof)
                  </div>
                  <p className="text-emerald-800 leading-relaxed font-mono">
                    {inspectResult.proof}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-emerald-900">
                    <div>Container: <b>{inspectResult.physicalLocation.container}</b></div>
                    <div>Port: <b>{inspectResult.physicalLocation.port}</b></div>
                    <div>Zone: <b>{inspectResult.physicalLocation.zoneTag}</b></div>
                    <div>ReplSet: <b>{inspectResult.physicalLocation.replicaSet}</b></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center h-64">
              <Radio className="w-10 h-10 text-slate-300 mb-3 animate-pulse" />
              <h3 className="font-bold text-slate-700 text-sm">Chờ Thao Tác Ghi Phân Vùng</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Chọn Chi nhánh Hà Nội hoặc TP.HCM và bấm "Ghi Dữ Liệu Phân Vùng" ở bên trái để kiểm tra đường đi thực tế của document.
              </p>
            </div>
          )}

          {/* Zone Tags Reference Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Cấu Hình Range-Based Zone Tags Trong Cụm</h3>
              <p className="text-xs text-slate-500 mt-0.5">Thiết lập theo chuẩn <code>sh.addTagRange()</code></p>
            </div>
            <div className="p-4 space-y-3">
              {zoneConfig?.zones.map((z) => (
                <div key={z.zoneTag} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className={z.zoneTag === 'ZONE_HN' ? 'text-emerald-700' : 'text-amber-700'}>
                      {z.zoneTag} ({z.region})
                    </span>
                    <span className="font-mono text-slate-600">{z.shardHost}</span>
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    Min: {z.keyRange.minKey} <br />
                    Max: {z.keyRange.maxKey}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
