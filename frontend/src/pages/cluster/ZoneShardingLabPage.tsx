import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Search,
  ShieldCheck,
  Send,
  Terminal,
} from 'lucide-react';
import { MetricStrip, MetricItemProps } from '../../components/common/MetricStrip';

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
  const [note, setNote] = useState<string>('Ghi dữ liệu kiểm thử Zone Sharding');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [insertResult, setInsertResult] = useState<InsertResult | null>(null);

  const [inspecting, setInspecting] = useState<boolean>(false);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);

  const fetchZoneConfig = async () => {
    try {
      const res = await api.get<ZoneTagConfig>('/cluster/zone-sharding/tags');
      setZoneConfig(res);
    } catch {
      // Handled by API error toast
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

  const metricItems: MetricItemProps[] = [
    {
      label: 'Zone 1 (Miền Bắc)',
      value: 'ZONE_HN',
      subText: 'vattu-shard1:27018 (Hà Nội)',
      status: 'success',
    },
    {
      label: 'Zone 2 (Miền Nam)',
      value: 'ZONE_HCM',
      subText: 'vattu-shard2:27020 (TP.HCM)',
      status: 'warning',
    },
    {
      label: 'Range Rule',
      value: 'sh.addTagRange()',
      subText: 'Key Prefix: Min "HN" / Max "HCM"',
      status: 'neutral',
    },
    {
      label: 'Locality Strategy',
      value: 'Single Shard Targeted',
      subText: 'Mongos bypass broadcast',
      status: 'info',
    },
  ];

  return (
    <div className="space-y-3 font-sans">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
            MODULE 14
          </span>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">
            Thực Nghiệm Phân Vùng Dữ Liệu (Zone Sharding Lab)
          </h1>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Range-based Zone Sharding
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Active Zones:</span>
          <strong className="text-slate-800">ZONE_HN, ZONE_HCM</strong>
        </div>
      </div>

      {/* 2. Telemetry Metric Strip */}
      <MetricStrip items={metricItems} />

      {/* 3. Main Workspace: Form & Terminal Proof */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left Column: Test Record Generator (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-blue-600" />
              <h2 className="font-semibold text-slate-900">
                Tạo Bản Ghi Kiểm Thử Định Tuyến
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">writeConcern: 1</span>
          </div>

          <form onSubmit={handleInsert} className="p-3.5 space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Bộ sưu tập mục tiêu
              </label>
              <select
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-slate-400"
              >
                <option value="inventory_stocks">inventory_stocks (Tồn kho vật tư)</option>
                <option value="goods_receipts">goods_receipts (Phiếu nhập kho)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Chi nhánh phát sinh (Shard Key Prefix)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBranch('HN')}
                  className={`p-2 rounded border text-left transition-colors cursor-pointer ${
                    branch === 'HN'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs">Hà Nội (HN)</div>
                  <div className="text-[10px] font-mono text-slate-500">Shard 1 (Port 27018)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBranch('HCM')}
                  className={`p-2 rounded border text-left transition-colors cursor-pointer ${
                    branch === 'HCM'
                      ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs">TP.HCM (HCM)</div>
                  <div className="text-[10px] font-mono text-slate-500">Shard 2 (Port 27020)</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Mã vật tư thao tác
              </label>
              <select
                value={materialCode}
                onChange={(e) => setMaterialCode(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-slate-400"
              >
                <option value="MAT-STEEL-D20">MAT-STEEL-D20 (Thép Hòa Phát D20)</option>
                <option value="MAT-CABLE-3X4">MAT-CABLE-3X4 (Cáp CADIVI 3x4mm2)</option>
                <option value="MAT-CEMENT-PCB40">MAT-CEMENT-PCB40 (Xi măng Vicem)</option>
                <option value="MAT-PAINT-EP01">MAT-PAINT-EP01 (Sơn Epoxy Jotun)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Số lượng
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              {submitting ? (
                <LoadingSpinner label="Đang ghi bản ghi..." />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Ghi Dữ Liệu Kiểm Thử</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Routing Results & Terminal Inspection (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Result Card */}
          {insertResult ? (
            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Kết Quả Định Tuyến MongoS
                </span>
                <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                  {insertResult.documentCode}
                </span>
              </div>

              <div className="p-3 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-500 block">Target Zone Tag:</span>
                    <strong className="text-emerald-700 text-xs">{insertResult.targetZone}</strong>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-500 block">Physical Target Shard:</span>
                    <strong className="text-slate-900 text-xs">{insertResult.targetShard}</strong>
                  </div>
                </div>

                <div className="p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-700">
                  <div>Range: <strong>{insertResult.routingDetails.matchedTagRange}</strong></div>
                  <div className="text-blue-700 mt-0.5">Action: {insertResult.routingDetails.mongosAction}</div>
                </div>

                <button
                  type="button"
                  onClick={handleInspect}
                  disabled={inspecting}
                  className="w-full py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  <span>{inspecting ? 'Đang trích xuất shard vật lý...' : 'Kiểm chứng vị trí lưu trữ vật lý (Inspect)'}</span>
                </button>
              </div>

              {/* Physical Storage Terminal Proof */}
              {inspectResult && (
                <div className="border-t border-slate-200 bg-slate-950 p-3 text-xs font-mono text-emerald-400">
                  <div className="flex items-center gap-1.5 text-slate-200 pb-1.5 border-b border-slate-800 text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Physical Storage Proof (WiredTiger Verification)</span>
                  </div>
                  <div className="mt-2 text-[11px] leading-relaxed text-slate-300">
                    {inspectResult.proof}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px] text-emerald-400">
                    <div>Host: <span className="text-white">{inspectResult.physicalLocation.container}</span></div>
                    <div>Port: <span className="text-white">{inspectResult.physicalLocation.port}</span></div>
                    <div>Zone: <span className="text-white">{inspectResult.physicalLocation.zoneTag}</span></div>
                    <div>ReplSet: <span className="text-white">{inspectResult.physicalLocation.replicaSet}</span></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-md p-6 text-center text-xs text-slate-500">
              <Terminal className="w-6 h-6 mx-auto mb-2 text-slate-400" />
              <div className="font-semibold text-slate-800">Sẵn sàng kiểm thử định tuyến phân vùng</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Chọn chi nhánh (HN hoặc HCM) và bấm "Ghi Dữ Liệu Kiểm Thử" để quan sát đường truyền từ MongoS vào từng Shard.
              </p>
            </div>
          )}

          {/* Zone Tags Reference Table */}
          <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">
                Quy Tắc Phân Vùng Range Tags Hiện Hành (sh.addTagRange)
              </span>
              <span className="font-mono text-[10px] text-slate-400">ConfigDB</span>
            </div>

            <div className="p-2 space-y-1.5 text-xs font-mono">
              {zoneConfig?.zones?.map((z) => (
                <div key={z.zoneTag} className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                  <div>
                    <span className={`font-bold ${z.zoneTag === 'ZONE_HN' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {z.zoneTag} ({z.region})
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Min: {z.keyRange.minKey} · Max: {z.keyRange.maxKey}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-700 font-semibold">{z.shardHost}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
