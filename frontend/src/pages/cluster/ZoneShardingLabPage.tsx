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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Kiểm Chứng Phân Vùng Dữ Liệu (Zone Sharding Lab)
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Kiểm chứng định tuyến theo vùng địa lý (Range-based Zone Sharding): Dữ liệu chi nhánh Hà Nội định tuyến trực tiếp vào Shard 1, dữ liệu TP.HCM định tuyến vào Shard 2.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            Range-Based Locality
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" />
            Tạo bản ghi kiểm thử định tuyến
          </h2>

          <form onSubmit={handleInsert} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Bộ sưu tập mục tiêu
              </label>
              <select
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 transition focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="inventory_stocks">inventory_stocks (Tồn kho vật tư)</option>
                <option value="goods_receipts">goods_receipts (Phiếu nhập kho)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Chi nhánh phát sinh (Shard Key Prefix)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBranch('HN')}
                  className={`p-3 rounded-lg border text-left transition ${
                    branch === 'HN'
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-xs text-emerald-900">Chi nhánh Hà Nội</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Shard 1 (Zone HN)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBranch('HCM')}
                  className={`p-3 rounded-lg border text-left transition ${
                    branch === 'HCM'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-xs text-blue-900">Chi nhánh TP.HCM</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Shard 2 (Zone HCM)</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Mã vật tư thao tác
              </label>
              <select
                value={materialCode}
                onChange={(e) => setMaterialCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 transition focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="MAT-STEEL-D20">MAT-STEEL-D20 (Thép Hòa Phát phi 20)</option>
                <option value="MAT-CABLE-3X4">MAT-CABLE-3X4 (Cáp CADIVI 3x4mm2)</option>
                <option value="MAT-CEMENT-PCB40">MAT-CEMENT-PCB40 (Xi măng Vicem)</option>
                <option value="MAT-PAINT-EP01">MAT-PAINT-EP01 (Sơn Epoxy Jotun)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Số lượng kiểm thử
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 transition focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Ghi chú thao tác
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 transition focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {submitting ? (
                <LoadingSpinner label="Đang định tuyến..." />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Ghi dữ liệu kiểm thử
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
                <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Định tuyến Shard thành công
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {insertResult.documentCode}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mục tiêu Zone Tag:</span>
                  <span className="font-semibold text-emerald-700">{insertResult.targetZone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Node Shard vật lý:</span>
                  <span className="font-semibold text-slate-900">{insertResult.targetShard}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Khoảng Range Shard Key:</span>
                  <span className="font-mono text-slate-700">{insertResult.routingDetails.matchedTagRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hành động Router:</span>
                  <span className="font-medium text-blue-600">{insertResult.routingDetails.mongosAction}</span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleInspect}
                  disabled={inspecting}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
                >
                  <Search className="w-4 h-4 text-slate-500" />
                  {inspecting ? 'Đang trích xuất vị trí vật lý...' : 'Kiểm chứng vị trí lưu trữ thực tế (Inspect Physical Location)'}
                </button>
              </div>

              {/* Physical Location Proof */}
              {inspectResult && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-emerald-900 pb-1.5 border-b border-emerald-200/60">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Bằng chứng lưu trữ vật lý (Physical Storage Proof)
                  </div>
                  <p className="text-emerald-900 leading-relaxed font-mono text-[11px] bg-white/70 p-2.5 rounded border border-emerald-100">
                    {inspectResult.proof}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-emerald-800">
                    <div>Container: <span className="font-semibold text-slate-900">{inspectResult.physicalLocation.container}</span></div>
                    <div>Port: <span className="font-semibold text-slate-900">{inspectResult.physicalLocation.port}</span></div>
                    <div>Zone: <span className="font-semibold text-slate-900">{inspectResult.physicalLocation.zoneTag}</span></div>
                    <div>ReplSet: <span className="font-semibold text-slate-900">{inspectResult.physicalLocation.replicaSet}</span></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center h-64">
              <Radio className="w-8 h-8 text-slate-300 mb-2.5" />
              <h3 className="font-semibold text-slate-800 text-sm">Chờ thao tác kiểm thử</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Chọn chi nhánh (Hà Nội hoặc TP.HCM) và nhấn "Ghi dữ liệu kiểm thử" để quan sát hành trình phân vùng dữ liệu qua MongoS router.
              </p>
            </div>
          )}

          {/* Zone Tags Reference Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Cấu hình Range-Based Zone Tags hiện hành</h3>
              <p className="text-xs text-slate-500 mt-0.5">Thiết lập phân vùng theo chỉ lệnh <code>sh.addTagRange()</code></p>
            </div>
            <div className="p-4 space-y-2.5">
              {zoneConfig?.zones.map((z) => (
                <div key={z.zoneTag} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-medium">
                    <span className={z.zoneTag === 'ZONE_HN' ? 'text-emerald-700 font-semibold' : 'text-blue-700 font-semibold'}>
                      {z.zoneTag} ({z.region})
                    </span>
                    <span className="font-mono text-slate-600 text-[11px]">{z.shardHost}</span>
                  </div>
                  <div className="text-slate-500 font-mono text-[11px] bg-white p-2 rounded border border-slate-200/60">
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
