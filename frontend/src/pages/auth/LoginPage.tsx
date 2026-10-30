import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Database, ShieldAlert, ArrowRight, CheckCircle2, Lock, Mail, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    {
      role: 'Super Admin (Toàn quốc)',
      email: 'admin@wms.enterprise.vn',
      pass: 'Admin@Distributed2026',
      badge: 'ALL SHARDS',
    },
    {
      role: 'Thủ kho Miền Bắc (Hà Nội)',
      email: 'manager.hn@wms.enterprise.vn',
      pass: 'Wms@123456',
      badge: 'ZONE_HN',
    },
    {
      role: 'Thủ kho Miền Nam (TP.HCM)',
      email: 'manager.hcm@wms.enterprise.vn',
      pass: 'Wms@123456',
      badge: 'ZONE_HCM',
    },
    {
      role: 'Kiểm định KCS / QC',
      email: 'qc.lead@wms.enterprise.vn',
      pass: 'Wms@123456',
      badge: 'QC_INSPECTOR',
    },
    {
      role: 'Kiểm toán viên',
      email: 'auditor@wms.enterprise.vn',
      pass: 'Wms@123456',
      badge: 'AUDITOR',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0b121e] flex flex-col justify-center items-center p-4 antialiased font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-brand-700 border border-brand-500/30 text-white shadow-lg mb-3">
            <Database className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide uppercase">
            DISTRIBUTED WMS
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Hệ thống Quản trị & Điều phối Vật tư Doanh nghiệp Phân tán
          </p>
        </div>

        <div className="bg-[#121c2d] border border-slate-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-sm font-semibold text-slate-200 mb-1">Đăng nhập tài khoản</h2>
          <p className="text-xs text-slate-400 mb-6">
            Nhập thông tin xác thực để truy cập hệ thống điều hành kho đa vùng miền.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/80 rounded flex items-start gap-2.5 text-xs text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email tài khoản
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@wms.enterprise.vn"
                  className="w-full bg-[#0a111c] border border-slate-700 rounded text-xs text-slate-100 pl-9 pr-3 py-2.5 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">Mật khẩu</label>
                <span className="text-[11px] text-slate-500 hover:text-slate-400 cursor-pointer">
                  Quên mật khẩu?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0a111c] border border-slate-700 rounded text-xs text-slate-100 pl-9 pr-3 py-2.5 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-[#0a111c] text-brand-600 focus:ring-0"
                />
                Ghi nhớ phiên đăng nhập
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-700 hover:bg-brand-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-2.5 px-4 rounded text-xs transition-colors flex items-center justify-center gap-2 shadow-sm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  Đăng nhập vào hệ thống
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Tài khoản Demo RBAC (Click điền nhanh)
              </span>
            </div>
            <div className="space-y-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillCredentials(acc.email, acc.pass)}
                  className="w-full text-left p-2 rounded bg-[#0a111c] hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    <div>
                      <div className="text-xs font-medium text-slate-300">{acc.role}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{acc.email}</div>
                    </div>
                  </div>
                  <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                    {acc.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-400 font-mono">
          MongoDB 6.0 Sharded Cluster • Multi-Branch WMS Architecture
        </div>
      </div>
    </div>
  );
};
