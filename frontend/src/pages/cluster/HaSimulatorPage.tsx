import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MetricStrip } from '../../components/common/MetricStrip';
import {
  ShieldCheck,
  Activity,
  Zap,
  RefreshCw,
  CheckCircle2,
  Play,
  Radio,
} from 'lucide-react';

interface MemberNode {
  id: number;
  host: string;
  role: 'PRIMARY' | 'SECONDARY';
  health: number;
  stateStr: string;
  uptime: number;
  priority: number;
  votes: number;
  replicationLagSec: number;
  pingMs: number;
  lastHeartbeat: string;
}

interface ReplicaSetInfo {
  name: string;
  type: string;
  description: string;
  primaryNode: string;
  members: MemberNode[];
  settings: {
    heartbeatIntervalMillis: number;
    electionTimeoutMillis: number;
  };
}

interface HaStatusResponse {
  clusterHealthy: boolean;
  totalReplicaSets: number;
  consensusModel: string;
  defaultWriteConcern: string;
  defaultReadPreference: string;
  replicaSets: ReplicaSetInfo[];
  diagnosticTimestamp: string;
}

interface ConsensusStep {
  step: number;
  timeOffsetMs: number;
  action: string;
  message: string;
  status: 'INFO' | 'WARNING' | 'SUCCESS';
}

interface FailoverResult {
  simulationId: string;
  replicaSet: string;
  status: string;
  electionDurationMs: number;
  oldPrimary: string;
  newPrimary: string;
  consensusSteps: ConsensusStep[];
  recoveryRecommendation: string;
}

export const HaSimulatorPage: React.FC = () => {
  const [data, setData] = useState<HaStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedReplSet, setSelectedReplSet] = useState<string>('shard1ReplSet');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<FailoverResult | null>(null);
  const [pingData, setPingData] = useState<any | null>(null);
  const [pinging, setPinging] = useState<boolean>(false);

  const fetchHaStatus = async () => {
    try {
      const res = await api.get<HaStatusResponse>('/cluster/ha/status');
      setData(res);
    } catch {
      // Handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHaStatus();
  }, []);

  const handleSimulateFailover = async () => {
    try {
      setSimulating(true);
      setSimulationResult(null);
      const res = await api.post<FailoverResult>('/cluster/ha/simulate-failover', {
        replicaSet: selectedReplSet,
      });
      setSimulationResult(res);
    } catch {
      // Handled
    } finally {
      setSimulating(false);
    }
  };

  const handlePingNodes = async () => {
    try {
      setPinging(true);
      const res = await api.get('/cluster/ha/ping');
      setPingData(res);
    } catch {
      // Handled
    } finally {
      setPinging(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Đang kiểm tra trạng thái Replica Set & High Availability..." />;
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-white px-4 py-3 rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded border bg-emerald-50 text-emerald-800 border-emerald-200">
              HIGH AVAILABILITY
            </span>
            <span className="text-xs text-slate-500 font-mono">
              3 Replica Sets Active
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Mô Phỏng Chịu Lỗi & Tính Sẵn Sàng Cao (High Availability)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            Trực quan hóa cấu trúc Replica Set (Config Server, Shard 1, Shard 2), cơ chế bầu cử tự động (Heartbeat Election) và chính sách Write-Concern an toàn.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <button
            onClick={handlePingNodes}
            disabled={pinging}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition-colors"
            title="Đo round-trip latency và heartbeat giữa các node"
          >
            <Activity className={`w-3.5 h-3.5 ${pinging ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Ping Nodes</span>
          </button>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchHaStatus();
            }}
            disabled={refreshing}
            className="p-1.5 text-slate-500 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition-colors"
            title="Làm mới trạng thái"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Ping Results Bar if available */}
      {pingData && (
        <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-md text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="font-semibold text-slate-900">Ping Node thời gian thực:</span>
            <span className="text-slate-500">Độ trễ TB: <strong className="text-slate-800">{pingData.meanLagSec}s</strong></span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            {pingData.nodes?.map((n: any) => (
              <span key={n.host} className="px-1.5 py-0.2 bg-slate-50 border border-slate-200 rounded text-slate-700">
                {n.host}: <strong className="text-emerald-700">{n.pingMs} ms</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Overview Metric Strip */}
      <MetricStrip
        items={[
          {
            label: 'Replica Sets Đang Chạy',
            value: `${data?.totalReplicaSets || 3} Bộ`,
            subText: 'ConfigRS, Shard1RS, Shard2RS',
            status: 'info',
          },
          {
            label: 'Mô hình Đồng Thuận',
            value: 'Majority',
            subText: 'Raft-like Quorum Votes >= 50%+1',
            status: 'success',
          },
          {
            label: 'Chu Kỳ Heartbeat',
            value: '2,000 ms',
            subText: 'Election Timeout: 10,000 ms',
          },
          {
            label: 'Write Concern Chuẩn',
            value: 'Majority',
            subText: 'Read: primaryPreferred',
            status: 'success',
          },
        ]}
      />

      {/* Main Grid: Interactive Replica Sets vs Failover Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Replica Sets Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">
              Danh sách Replica Set Trong Cụm Phân Tán
            </h2>
            <span className="text-xs text-slate-500">
              Đồng bộ dữ liệu thời gian thực
            </span>
          </div>

          <div className="space-y-4">
            {data?.replicaSets.map((rs) => (
              <div
                key={rs.name}
                className={`bg-white rounded-md border transition-all p-4 ${
                  selectedReplSet === rs.name
                    ? 'border-blue-500 ring-1 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm font-mono">{rs.name}</span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700">
                        {rs.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{rs.description}</p>
                  </div>

                  <button
                    onClick={() => setSelectedReplSet(rs.name)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      selectedReplSet === rs.name
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {selectedReplSet === rs.name ? 'Đang chọn mô phỏng' : 'Chọn giả lập'}
                  </button>
                </div>

                {/* Node Members List */}
                <div className="mt-3.5 space-y-2">
                  {rs.members.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            member.role === 'PRIMARY' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                          }`}
                        />
                        <div>
                          <span className="font-mono font-semibold text-slate-800">{member.host}</span>
                          <span className="text-[10px] text-slate-500 ml-2 font-mono">
                            Priority: {member.priority} · Votes: {member.votes}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            member.role === 'PRIMARY'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {member.role}
                        </span>
                        <span className="text-slate-500">
                          Lag: <strong>{member.replicationLagSec}s</strong>
                        </span>
                        <span className="text-slate-500">
                          Ping: <strong>{member.pingMs}ms</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Failover Simulator Console (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-md border border-slate-200 p-4 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-600" />
                Mô Phỏng Sự Cố & Bầu Cử Thủ Lĩnh (Election)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Kích hoạt ngắt kết nối node Primary để quan sát cơ chế tự động bầu chọn Secondary lên thay thế mà không gián đoạn dịch vụ WMS.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Mục tiêu kiểm thử:</span>
                <span className="font-mono font-bold text-blue-700">{selectedReplSet}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cơ chế phát hiện sự cố:</span>
                <span className="font-medium text-slate-700">Heartbeat Timeout &gt; 10,000ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tiêu chí đắc cử:</span>
                <span className="font-medium text-slate-700">OpTime mới nhất + Đa số phiếu</span>
              </div>
            </div>

            <button
              onClick={handleSimulateFailover}
              disabled={simulating}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {simulating ? (
                <LoadingSpinner label="Đang kích hoạt bầu cử Raft Consensus..." />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Kích hoạt kịch bản ngắt Primary & Bầu cử mới
                </>
              )}
            </button>

            {/* Simulation Steps Output */}
            {simulationResult && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Bầu cử hoàn tất ({simulationResult.electionDurationMs} ms)
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {simulationResult.simulationId}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {simulationResult.consensusSteps.map((step) => (
                    <div
                      key={step.step}
                      className={`p-2.5 rounded-lg border ${
                        step.status === 'WARNING'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : step.status === 'INFO'
                          ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                          : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] pb-1 border-b border-black/5">
                        <span className="font-bold">BƯỚC {step.step}: {step.action}</span>
                        <span>+{step.timeOffsetMs} ms</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed">{step.message}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-500">Primary Cũ:</span>
                    <span className="line-through text-slate-500">{simulationResult.oldPrimary}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-500">Primary Mới:</span>
                    <span className="font-bold text-emerald-700">{simulationResult.newPrimary}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200/60">
                  💡 {simulationResult.recoveryRecommendation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
