import React, { useState } from 'react';
import { api } from '../../lib/api';
import {
  Zap,
  Play,
  Terminal,
  Code2,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MetricStrip, MetricItemProps } from '../../components/common/MetricStrip';

interface ExplainResult {
  scenario: string;
  routingType: string;
  targetStage: string;
  targetShards: string[];
  queryFilter: Record<string, any>;
  executionStats: {
    executionTimeMillis: number;
    totalDocsExamined: number;
    totalDocsReturned: number;
    stage: string;
    networkRoundTrips: number;
  };
  analysisSummary: string;
  rawExplainOutput: any;
}

export const QueryAnalyzerPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [resultA, setResultA] = useState<ExplainResult | null>(null);
  const [resultB, setResultB] = useState<ExplainResult | null>(null);
  const [activeJsonTab, setActiveJsonTab] = useState<'A' | 'B'>('A');
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  const runScenarioA = async () => {
    try {
      setLoading(true);
      const res = await api.post<ExplainResult>('/cluster/explain', {
        scenario: 'targeted',
        warehouseBranch: 'HN',
        materialCode: 'MAT-STEEL-D20',
      });
      setResultA(res);
    } catch {
      // Handled by API error toast
    } finally {
      setLoading(false);
    }
  };

  const runScenarioB = async () => {
    try {
      setLoading(true);
      const res = await api.post<ExplainResult>('/cluster/explain', {
        scenario: 'scatter-gather',
        maxQuantity: 500,
      });
      setResultB(res);
    } catch {
      // Handled by API error toast
    } finally {
      setLoading(false);
    }
  };

  const runBothScenarios = async () => {
    setLoading(true);
    await Promise.all([runScenarioA(), runScenarioB()]);
    setLoading(false);
  };

  const metricItems: MetricItemProps[] = [
    {
      label: 'Targeted Latency (Scenario A)',
      value: resultA ? `${resultA.executionStats.executionTimeMillis} ms` : 'Chưa chạy',
      subText: 'Định tuyến đích Shard 1 (27018)',
      status: resultA ? 'success' : 'neutral',
    },
    {
      label: 'Scatter Latency (Scenario B)',
      value: resultB ? `${resultB.executionStats.executionTimeMillis} ms` : 'Chưa chạy',
      subText: 'Broadcast toàn bộ Shard (27018 + 27020)',
      status: resultB ? 'warning' : 'neutral',
    },
    {
      label: 'Stage Scenario A',
      value: resultA?.targetStage || 'SINGLE_SHARD',
      subText: 'Bỏ qua giai đoạn SHARD_MERGE',
      status: 'success',
    },
    {
      label: 'Stage Scenario B',
      value: resultB?.targetStage || 'SHARD_MERGE',
      subText: 'Router tổng hợp đa luồng',
      status: 'warning',
    },
  ];

  return (
    <div className="space-y-3 font-sans">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
            MODULE 12
          </span>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">
            Phân Tích & Định Tuyến Truy Vấn (Query Analyzer)
          </h1>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            explain("executionStats")
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runBothScenarios}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 ${loading ? 'animate-pulse text-amber-400' : 'text-amber-400'}`} />
            <span>Chạy Đối Chiếu Cặp Truy Vấn</span>
          </button>
        </div>
      </div>

      {/* 2. Telemetry Metric Strip */}
      <MetricStrip items={metricItems} />

      {/* 3. Terminal Query Consoles (Scenario A & Scenario B) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Scenario A Terminal */}
        <div className="bg-slate-950 border border-slate-800 rounded-md overflow-hidden flex flex-col justify-between">
          <div>
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-white">Scenario A: Targeted Query</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                Shard Key Included
              </span>
            </div>

            {/* Code Body */}
            <div className="p-3 text-xs font-mono leading-relaxed text-slate-300">
              <div className="text-slate-500">// Mongos Router: Điều hướng chính xác theo Zone Shard</div>
              <div className="text-slate-400 mt-1">$ mongos&gt; db.inventory_stocks.find({'{'}</div>
              <div className="pl-4 text-emerald-400 font-semibold">
                warehouse_branch: "HN", <span className="text-slate-500">// Zone prefix = Shard 1</span>
              </div>
              <div className="pl-4 text-emerald-400 font-semibold">
                material_code: "MAT-STEEL-D20"
              </div>
              <div className="text-slate-400">{'}'}).explain("executionStats")</div>
            </div>
          </div>

          {/* Terminal Footer Action */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              Target: <strong className="text-slate-200">shard1ReplSet (Port 27018)</strong>
            </span>
            <button
              onClick={runScenarioA}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Chạy Kịch Bản A</span>
            </button>
          </div>
        </div>

        {/* Scenario B Terminal */}
        <div className="bg-slate-950 border border-slate-800 rounded-md overflow-hidden flex flex-col justify-between">
          <div>
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-white">Scenario B: Scatter-Gather Query</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px]">
                Missing Shard Key
              </span>
            </div>

            {/* Code Body */}
            <div className="p-3 text-xs font-mono leading-relaxed text-slate-300">
              <div className="text-slate-500">// Mongos Router: Buộc phải phát tán tới toàn bộ Shards</div>
              <div className="text-slate-400 mt-1">$ mongos&gt; db.inventory_stocks.find({'{'}</div>
              <div className="pl-4 text-amber-400 font-semibold">
                quantity: {'{'} $lte: 500 {'}'} <span className="text-slate-500">// Không có Shard Key</span>
              </div>
              <div className="text-slate-400">{'}'}).explain("executionStats")</div>
            </div>
          </div>

          {/* Terminal Footer Action */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              Target: <strong className="text-amber-300">Broadcast ALL (Shard 1 + Shard 2)</strong>
            </span>
            <button
              onClick={runScenarioB}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Chạy Kịch Bản B</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. High-Density Execution Stats Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">
              Bảng Thông Số Kỹ Thuật Đối Chiếu (Execution Stats)
            </h2>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Engine: WiredTiger · Protocol: OP_MSG
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-48">Tiêu Chí Đo Đạc</th>
                <th className="w-64">Scenario A: Targeted (Có Key)</th>
                <th className="w-64">Scenario B: Scatter-Gather (Không Key)</th>
                <th>Phân Tích Kỹ Thuật / Đánh Giá</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold text-slate-900">Winning Execution Stage</td>
                <td className="font-mono text-xs font-bold text-emerald-700">
                  {resultA?.targetStage || 'SINGLE_SHARD'}
                </td>
                <td className="font-mono text-xs font-bold text-amber-700">
                  {resultB?.targetStage || 'SHARD_MERGE'}
                </td>
                <td className="text-slate-600">
                  Targeted xử lý trực tiếp tại node Shard đích; Scatter-Gather buộc Router phải tổng hợp kết quả đa luồng.
                </td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-900">Thời gian phản hồi (Latency)</td>
                <td className="num font-bold text-emerald-700">
                  {resultA?.executionStats?.executionTimeMillis !== undefined
                    ? `${resultA.executionStats.executionTimeMillis} ms`
                    : '1 - 3 ms (Ước tính)'}
                </td>
                <td className="num font-bold text-amber-700">
                  {resultB?.executionStats?.executionTimeMillis !== undefined
                    ? `${resultB.executionStats.executionTimeMillis} ms`
                    : '15 - 28 ms (Ước tính)'}
                </td>
                <td className="text-slate-600">
                  Targeted đạt tốc độ tối đa nhờ không chịu độ trễ mạng phát tán qua nhiều nút.
                </td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-900">Số Shard tham gia truy vấn</td>
                <td className="font-mono text-slate-900">
                  {resultA?.targetShards?.length || 1} Shard <span className="text-slate-500 font-mono">(shard1ReplSet)</span>
                </td>
                <td className="font-mono text-slate-900">
                  {resultB?.targetShards?.length || 2} Shards <span className="text-slate-500 font-mono">(shard1 + shard2)</span>
                </td>
                <td className="text-slate-600">
                  Chỉ kích hoạt I/O trên node liên quan, bảo toàn tài nguyên cho các node còn lại.
                </td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-900">Số Documents kiểm tra (Examined)</td>
                <td className="num text-slate-900">
                  {resultA?.executionStats?.totalDocsExamined ?? 1} docs
                </td>
                <td className="num text-slate-900">
                  {resultB?.executionStats?.totalDocsExamined ?? 32} docs
                </td>
                <td className="text-slate-600">
                  Chỉ số kiểm tra khớp chính xác chỉ mục Compound Shard Key `{'{ warehouse_branch: 1, material_code: 1 }'}`.
                </td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-900">Network Round-Trips</td>
                <td className="num text-emerald-700 font-bold">1 trip</td>
                <td className="num text-amber-700 font-bold">2 trips (Parallel)</td>
                <td className="text-slate-600">
                  Tiết kiệm băng thông nội bộ giữa Mongos Router và các Shard nodes.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Terminal Raw JSON Inspector (Progressive Disclosure) */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div
          onClick={() => setShowRawJson(!showRawJson)}
          className="px-3 py-2 bg-slate-50 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100/70 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-800">
              Khung Terminal: Cây Explain Output JSON Chi Tiết
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              (Raw MongoDB Engine Telemetry)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono">
              {showRawJson ? 'Thu gọn' : 'Mở rộng console'}
            </span>
            {showRawJson ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
          </div>
        </div>

        {showRawJson && (
          <div className="border-t border-slate-200 bg-slate-950 text-slate-200">
            {/* Tab header */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs font-mono">
              <button
                onClick={() => setActiveJsonTab('A')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  activeJsonTab === 'A'
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Explain Plan (Scenario A)
              </button>
              <button
                onClick={() => setActiveJsonTab('B')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  activeJsonTab === 'B'
                    ? 'bg-slate-800 text-amber-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Explain Plan (Scenario B)
              </button>
            </div>

            {/* Terminal Pre */}
            <div className="p-3 max-h-80 overflow-y-auto text-xs font-mono leading-relaxed text-emerald-400">
              <pre>
                {activeJsonTab === 'A'
                  ? JSON.stringify(resultA?.rawExplainOutput || { message: 'Chưa chạy Scenario A. Bấm "Chạy Kịch Bản A" để tải dữ liệu explain plan từ mongos.' }, null, 2)
                  : JSON.stringify(resultB?.rawExplainOutput || { message: 'Chưa chạy Scenario B. Bấm "Chạy Kịch Bản B" để tải dữ liệu explain plan từ mongos.' }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
