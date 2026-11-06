import React, { useState } from 'react';
import { api } from '../../lib/api';
import {
  Zap,
  Radio,
  FileCode2,
} from 'lucide-react';

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
  const [activeExplainModal, setActiveExplainModal] = useState<ExplainResult | null>(null);

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
      // Ignored
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
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const runBothScenarios = async () => {
    await runScenarioA();
    await runScenarioB();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
              Module B11
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
              Explain Execution Plan Sandbox
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            Phân Tích & Định Tuyến Truy Vấn (Query Analyzer)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Thực nghiệm đối chiếu hiệu năng giữa <b>Targeted Query (Nhắm đích)</b> và <b>Scatter-Gather Query (Phát tán gom tụ)</b> trên MongoDB Sharded Cluster.
          </p>
        </div>
        <div>
          <button
            onClick={runBothScenarios}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <Zap className="w-4 h-4" />
            Chạy Thử Nghiệm Đối Chiếu
          </button>
        </div>
      </div>

      {/* Two Interactive Scenario Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario A: Targeted Query */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  A
                </span>
                <h3 className="font-bold text-slate-900">Targeted Query (Truy Vấn Nhắm Đích)</h3>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                Có Shard Key
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-700">
                <span className="text-slate-400">// Tìm vật tư kèm chi nhánh Tổng kho</span>
                <br />
                <span className="text-blue-600 font-semibold">db.inventory_stocks.find</span>({'{'}
                <br />
                &nbsp;&nbsp;<b>warehouse_branch</b>: <span className="text-emerald-600">"HN"</span>,
                <br />
                &nbsp;&nbsp;<b>material_code</b>: <span className="text-amber-600">"MAT-STEEL-D20"</span>
                <br />
                {'}'})
              </div>

              <button
                onClick={runScenarioA}
                disabled={loading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Thực Thi Kịch Bản A
              </button>
            </div>

            {/* Results A */}
            {resultA && (
              <div className="mt-5 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase">Kết quả Explain Plan:</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-600 text-white">
                    {resultA.targetStage}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block">Thời gian phản hồi:</span>
                    <span className="font-bold text-emerald-700 text-sm">{resultA.executionStats.executionTimeMillis} ms</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block">Số Shard định tuyến:</span>
                    <span className="font-bold text-slate-800 text-sm">{resultA.targetShards.length} Shard (Chỉ Shard 1)</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-emerald-100">
                  {resultA.analysisSummary}
                </p>

                <button
                  onClick={() => setActiveExplainModal(resultA)}
                  className="w-full text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center justify-center gap-1.5 py-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5" /> Xem Cây Explain JSON
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scenario B: Scatter-Gather Query */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  B
                </span>
                <h3 className="font-bold text-slate-900">Scatter-Gather Query (Phát Tán - Gom Tụ)</h3>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                Thiếu Shard Key
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-700">
                <span className="text-slate-400">// Tìm theo số lượng toàn quốc (không truyền chi nhánh)</span>
                <br />
                <span className="text-blue-600 font-semibold">db.inventory_stocks.find</span>({'{'}
                <br />
                &nbsp;&nbsp;<b>quantity</b>: {'{'} $lte: <span className="text-purple-600">500</span> {'}'}
                <br />
                {'}'})
              </div>

              <button
                onClick={runScenarioB}
                disabled={loading}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4" />
                Thực Thi Kịch Bản B
              </button>
            </div>

            {/* Results B */}
            {resultB && (
              <div className="mt-5 p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase">Kết quả Explain Plan:</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-600 text-white">
                    {resultB.targetStage}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-amber-100">
                    <span className="text-slate-500 block">Thời gian phản hồi:</span>
                    <span className="font-bold text-amber-700 text-sm">{resultB.executionStats.executionTimeMillis} ms</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-amber-100">
                    <span className="text-slate-500 block">Số Shard định tuyến:</span>
                    <span className="font-bold text-slate-800 text-sm">{resultB.targetShards.length} Shards (Broadcast tất cả)</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-amber-100">
                  {resultB.analysisSummary}
                </p>

                <button
                  onClick={() => setActiveExplainModal(resultB)}
                  className="w-full text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center justify-center gap-1.5 py-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5" /> Xem Cây Explain JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">Bảng So Sánh Kỹ Thuật Định Tuyến</h3>
            <p className="text-xs text-slate-500 mt-1">Đánh giá tác động của Shard Key lên hiệu năng hệ thống phân tán</p>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
            Khuyến nghị thiết kế CSDLPT
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Tiêu chí đánh giá</th>
                <th className="px-6 py-3.5">Targeted Query (Có Shard Key)</th>
                <th className="px-6 py-3.5">Scatter-Gather Query (Không Shard Key)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-6 py-4 font-semibold text-slate-800">Cơ chế Mongos Router</td>
                <td className="px-6 py-4 text-emerald-700 font-medium">Định tuyến trực tiếp đến Shard chứa dữ liệu</td>
                <td className="px-6 py-4 text-amber-700 font-medium">Phát tán request đến toàn bộ Shards trong cụm</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-slate-800">Giai đoạn Execution Stage</td>
                <td className="px-6 py-4 font-mono font-semibold text-emerald-600">SINGLE_SHARD</td>
                <td className="px-6 py-4 font-mono font-semibold text-amber-600">SHARD_MERGE</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-slate-800">Độ trễ trung bình (Latency)</td>
                <td className="px-6 py-4 text-slate-700 font-semibold">1 - 3 ms (Cực nhanh)</td>
                <td className="px-6 py-4 text-slate-700 font-semibold">15 - 30 ms (Gấp 8 - 15 lần)</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-slate-800">Tiêu tốn băng thông mạng</td>
                <td className="px-6 py-4 text-emerald-700 font-medium">Tối thiểu (1 Round-trip)</td>
                <td className="px-6 py-4 text-amber-700 font-medium">Lãng phí (N Round-trips theo số nodes)</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-slate-800">Khả năng mở rộng (Scalability)</td>
                <td className="px-6 py-4 text-emerald-700 font-semibold">Tuyến tính (Linear) - Không bị nghẽn</td>
                <td className="px-6 py-4 text-amber-700 font-semibold">Giảm dần khi số lượng Shard tăng cao</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Explain JSON Modal */}
      {activeExplainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Chi Tiết Cây Explain Plan JSON</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Kịch bản: {activeExplainModal.routingType} - Stage: {activeExplainModal.targetStage}
                </p>
              </div>
              <button
                onClick={() => setActiveExplainModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-slate-950 rounded-b-xl text-emerald-400 font-mono text-xs">
              <pre>{JSON.stringify(activeExplainModal.rawExplainOutput, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
