import React, { useState } from 'react';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Shuffle,
  CheckCircle2,
  RotateCcw,
  Lock,
  Clock,
} from 'lucide-react';

interface StepLog {
  step: number;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  detail: string;
  timestamp: string;
}

interface TransactionResult {
  mode: 'SUCCESS' | 'FAIL_ROLLBACK';
  transactionStatus: 'COMMITTED' | 'ABORTED';
  isCommitted: boolean;
  isRolledBack: boolean;
  reason?: string;
  preStock: { quantity: number; available_quantity: number };
  postStock: { quantity: number; available_quantity: number };
  integrityPreserved: boolean;
  steps: StepLog[];
}

export const DistributedTransactionsPage: React.FC = () => {
  const [mode, setMode] = useState<'SUCCESS' | 'FAIL_ROLLBACK'>('SUCCESS');
  const [branch, setBranch] = useState<'HN' | 'HCM'>('HN');
  const [materialCode, setMaterialCode] = useState<string>('MAT-STEEL-D20');
  const [quantity, setQuantity] = useState<number>(5);
  const [errorType, setErrorType] = useState<'INSUFFICIENT_STOCK' | 'VALIDATION_ERROR' | 'MID_TXN_ABORT'>('INSUFFICIENT_STOCK');

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TransactionResult | null>(null);

  const runSimulation = async () => {
    try {
      setLoading(true);
      const res = await api.post<TransactionResult>('/cluster/transaction/simulate', {
        mode,
        warehouseBranch: branch,
        materialCode,
        quantity: Number(quantity),
        errorType: mode === 'FAIL_ROLLBACK' ? errorType : undefined,
      });
      setResult(res);
    } catch {
      // Handled by api error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans">
      {/* Header Bar */}
      <div className="bg-white px-4 py-3 rounded-md border border-slate-200 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold rounded border bg-blue-50 text-blue-700 border-blue-200">
              <Lock className="w-3 h-3" />
              Snapshot Isolation
            </span>
            <span className="text-xs text-slate-500 font-mono">
              2PC Coordinator
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Giao Dịch Phân Tán (Distributed ACID Transactions)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mô phỏng quy trình cấp phát vật tư đa tài liệu: Xuất kho + Trừ tồn kho + Ghi nhật ký với cơ chế Commit hoặc Rollback an toàn.
          </p>
        </div>
      </div>

      {/* Simulator Control Panel */}
      <div className="bg-white p-4 rounded-md border border-slate-200">
        <h2 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          Cấu Hình Phiên Giao Dịch Mô Phỏng
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mode Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Chế Độ Giao Dịch
            </label>
            <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
              <button
                type="button"
                onClick={() => setMode('SUCCESS')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                  mode === 'SUCCESS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Commit Thành Công
              </button>
              <button
                type="button"
                onClick={() => setMode('FAIL_ROLLBACK')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                  mode === 'FAIL_ROLLBACK'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Kích Hoạt Rollback
              </button>
            </div>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Chi Nhánh Tổng Kho
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value as 'HN' | 'HCM')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="HN">Miền Bắc (Hà Nội - Shard 1)</option>
              <option value="HCM">Miền Nam (TP.HCM - Shard 2)</option>
            </select>
          </div>

          {/* Material Code */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Vật Tư Thao Tác
            </label>
            <select
              value={materialCode}
              onChange={(e) => setMaterialCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="MAT-STEEL-D20">MAT-STEEL-D20 (Thép cuộn D20)</option>
              <option value="MAT-CABLE-3X4">MAT-CABLE-3X4 (Cáp điện 3x4mm2)</option>
              <option value="MAT-CEMENT-PCB40">MAT-CEMENT-PCB40 (Xi măng Vicem)</option>
            </select>
          </div>

          {/* Quantity or Error Type */}
          <div>
            {mode === 'SUCCESS' ? (
              <>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Số Lượng Cấp Phát
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </>
            ) : (
              <>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Lý Do Gây Lỗi Rollback
                </label>
                <select
                  value={errorType}
                  onChange={(e) => setErrorType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="INSUFFICIENT_STOCK">Xuất vượt quá tồn kho khả dụng</option>
                  <option value="VALIDATION_ERROR">Vi phạm quy định an toàn vật tư</option>
                  <option value="MID_TXN_ABORT">Ngắt kết nối mạng giữa chừng</option>
                </select>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={runSimulation}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-xs transition ${
              mode === 'SUCCESS'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {loading ? (
              <LoadingSpinner label="Đang thực thi phiên giao dịch..." />
            ) : (
              <>
                <Shuffle className="w-3.5 h-3.5" />
                {mode === 'SUCCESS' ? 'Bắt Đầu Giao Dịch ACID (Commit)' : 'Mô Phỏng Lỗi & Rollback Tự Động'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transaction Result & Pre/Post Stock Comparison */}
      {result && (
        <div className="space-y-6">
          {/* Status Alert Banner */}
          <div
            className={`p-3 rounded-md border flex items-center justify-between text-xs ${
              result.isCommitted
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {result.isCommitted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <RotateCcw className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <h3 className="font-bold text-xs">
                  {result.isCommitted
                    ? 'Giao Dịch ACID Thành Công (Transaction Committed)'
                    : 'Giao Dịch Đã Hoàn Tác An Toàn (Transaction Aborted & Rolled Back)'}
                </h3>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {result.isCommitted
                    ? 'Tồn kho được trừ, phiếu xuất được tạo và nhật ký kiểm toán được đồng bộ đa tài liệu.'
                    : `Nguyên nhân ngắt: ${result.reason || 'Kích hoạt hoàn tác'}. Tồn kho không bị trừ, không phát sinh dữ liệu rác.`}
                </p>
              </div>
            </div>

            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
              result.isCommitted ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              {result.transactionStatus}
            </span>
          </div>

          {/* Stock Integrity Verification Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white p-3.5 rounded-md border border-slate-200">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                Số Lượng Tồn Kho Trước Giao Dịch
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-slate-900">
                  {result.preStock.quantity}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  (Khả dụng: {result.preStock.available_quantity})
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Snapshot Session bắt đầu</p>
            </div>

            <div className="bg-white p-3.5 rounded-md border border-slate-200">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                Số Lượng Tồn Kho Sau Giao Dịch (Kiểm Chứng)
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold font-mono ${
                  result.isCommitted ? 'text-emerald-600' : 'text-blue-600'
                }`}>
                  {result.postStock.quantity}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  (Khả dụng: {result.postStock.available_quantity})
                </span>
              </div>
              <p className="text-[10px] text-emerald-700 font-mono font-medium mt-0.5">
                {result.isCommitted
                  ? `Đã cập nhật trừ chính xác ${quantity} đơn vị`
                  : '✔ Tính toàn vẹn được bảo toàn 100%: Số lượng giữ nguyên!'}
              </p>
            </div>
          </div>

          {/* Execution Stepper / Timeline Log */}
          <div className="bg-white p-4 rounded-md border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-slate-500" />
              Nhật Ký Thực Thi Các Bước Trong Phiên Giao Dịch (Execution Stepper)
            </h3>

            <div className="space-y-3">
              {result.steps.map((st) => (
                <div key={st.step} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${
                    st.status === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : st.status === 'ROLLED_BACK'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {st.step}
                  </div>
                  <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-800 text-xs">{st.action}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{st.timestamp.slice(11, 19)}</span>
                    </div>
                    <p className="text-slate-600 mt-1 font-mono text-[11px]">{st.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
