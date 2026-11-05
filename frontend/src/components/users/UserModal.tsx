import React, { useState, useEffect } from 'react';
import { UserRecord, CreateUserInput, UpdateUserInput } from '../../types/user.types';
import { UserRole } from '../../types/auth.types';
import { X, UserPlus, Save, AlertCircle, Building2, Shield, Mail, Lock, Phone, User as UserIcon } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCreate: (data: CreateUserInput) => Promise<void>;
  onSubmitUpdate: (id: string, data: UpdateUserInput) => Promise<void>;
  userToEdit: UserRecord | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
  userToEdit,
}) => {
  const isEditing = Boolean(userToEdit);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('MANAGER_HN');
  const [branch, setBranch] = useState<'HN' | 'HCM' | 'DN' | 'ALL'>('HN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setFullName(userToEdit.fullName || '');
      setEmail(userToEdit.email || '');
      setRole(userToEdit.role);
      setBranch(userToEdit.branch);
      setPhoneNumber(userToEdit.phoneNumber || '');
      setIsActive(userToEdit.isActive);
      setPassword('');
      setError(null);
    } else {
      setFullName('');
      setEmail('');
      setPassword('Wms@123456');
      setRole('MANAGER_HN');
      setBranch('HN');
      setPhoneNumber('');
      setIsActive(true);
      setError(null);
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'MANAGER_HN') {
      setBranch('HN');
    } else if (selectedRole === 'MANAGER_HCM') {
      setBranch('HCM');
    } else if (selectedRole === 'SUPER_ADMIN' || selectedRole === 'AUDITOR' || selectedRole === 'QC_INSPECTOR') {
      setBranch('ALL');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên người dùng');
      return;
    }

    if (!isEditing) {
      if (!email.trim()) {
        setError('Vui lòng nhập địa chỉ email');
        return;
      }
      if (!password || password.length < 6) {
        setError('Mật khẩu khởi tạo phải từ 6 ký tự trở lên');
        return;
      }
    }

    setLoading(true);
    try {
      if (isEditing && userToEdit) {
        await onSubmitUpdate(userToEdit._id, {
          fullName: fullName.trim(),
          role,
          branch,
          phoneNumber: phoneNumber.trim() || undefined,
          isActive,
        });
      } else {
        await onSubmitCreate({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          branch,
          phoneNumber: phoneNumber.trim() || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isEditing ? (
              <Save className="w-5 h-5 text-brand-400" />
            ) : (
              <UserPlus className="w-5 h-5 text-brand-400" />
            )}
            <div>
              <h3 className="font-semibold text-base">
                {isEditing ? 'Cập nhật Thông tin Tài khoản' : 'Khởi tạo Tài khoản Mới'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Điều chỉnh quyền hạn và phân bổ chi nhánh' : 'Phân quyền Role-based & Gắn vùng Shard'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn Hùng"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email đăng nhập <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isEditing}
                placeholder="username@wms.enterprise.vn"
                className={`w-full pl-9 pr-3 py-2 text-xs border rounded focus:outline-none ${
                  isEditing
                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                    : 'border-slate-300 focus:ring-1 focus:ring-brand-500 focus:border-brand-500'
                }`}
                required
              />
            </div>
            {isEditing && (
              <p className="text-[11px] text-slate-400 mt-1">Email là định danh duy nhất và không thể thay đổi.</p>
            )}
          </div>

          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu khởi tạo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Mặc định gợi ý: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Wms@123456</code></p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vai trò (RBAC) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white"
                >
                  <option value="SUPER_ADMIN">Tổng Giám đốc (Super Admin)</option>
                  <option value="MANAGER_HN">Thủ kho Miền Bắc (Hà Nội)</option>
                  <option value="MANAGER_HCM">Thủ kho Miền Nam (TP.HCM)</option>
                  <option value="QC_INSPECTOR">Kiểm định Chất lượng (QC / KCS)</option>
                  <option value="AUDITOR">Kiểm toán viên Hệ thống</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chi nhánh phụ trách <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value as any)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white"
                >
                  <option value="ALL">Toàn quốc (Tất cả Shards)</option>
                  <option value="HN">Miền Bắc (HN - ZONE_HN - Shard 1)</option>
                  <option value="HCM">Miền Nam (HCM - ZONE_HCM - Shard 2)</option>
                  <option value="DN">Miền Trung (Đà Nẵng - Primary)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số điện thoại liên hệ
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ví dụ: 0912345678"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          {isEditing && (
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700">
                  Tài khoản đang hoạt động (cho phép đăng nhập vào hệ thống)
                </span>
              </label>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded text-xs font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{isEditing ? 'Lưu thay đổi' : 'Tạo tài khoản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
