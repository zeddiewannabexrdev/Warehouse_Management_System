import React, { useState } from 'react';
import { UserRecord } from '../../types/user.types';
import { X, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserRecord | null;
  onResetPassword: (id: string, newPassword?: string) => Promise<void>;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onResetPassword,
}) => {
  const [newPassword, setNewPassword] = useState('Wms@123456');
  const [useDefault, setUseDefault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pass = useDefault ? 'Wms@123456' : newPassword;
    if (!pass || pass.length < 6) {
      setError('Mật khẩu mới phải từ 6 ký tự trở lên');
      return;
    }

    setLoading(true);
    try {
      await onResetPassword(user._id, pass);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-sm">Đặt lại Mật khẩu Người dùng</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Đặt lại mật khẩu thành công!</span>
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1">
            <div className="text-slate-500">Tài khoản được chọn:</div>
            <div className="font-semibold text-slate-800">{user.fullName}</div>
            <div className="font-mono text-slate-600">{user.email}</div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
              <input
                type="radio"
                name="passChoice"
                checked={useDefault}
                onChange={() => setUseDefault(true)}
                className="text-brand-600"
              />
              <span>Sử dụng mật khẩu mặc định của hệ thống: <strong className="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">Wms@123456</strong></span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
              <input
                type="radio"
                name="passChoice"
                checked={!useDefault}
                onChange={() => setUseDefault(false)}
                className="text-brand-600"
              />
              <span>Chỉ định mật khẩu mới tùy chỉnh:</span>
            </label>
          </div>

          {!useDefault && (
            <div>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 font-mono"
                required={!useDefault}
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>Xác nhận đặt lại</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
