import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { UserRecord, PaginatedUsersResponse, CreateUserInput, UpdateUserInput } from '../../types/user.types';
import { useAuth } from '../../context/AuthContext';
import { UserModal } from '../../components/users/UserModal';
import { ResetPasswordModal } from '../../components/users/ResetPasswordModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Edit,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserRecord | null>(null);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [userToResetPass, setUserToResetPass] = useState<UserRecord | null>(null);

  // View mode tab: Users Table vs RBAC Matrix
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (branchFilter && branchFilter !== 'ALL_FILTER') params.branch = branchFilter;
      if (roleFilter && roleFilter !== 'ALL_FILTER') params.role = roleFilter;
      if (statusFilter && statusFilter !== 'ALL_FILTER') params.status = statusFilter;

      const res = await api.get<PaginatedUsersResponse>('/users', { params });
      setUsers(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      showNotification('error', err?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, branchFilter, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (data: CreateUserInput) => {
    await api.post('/users', data);
    showNotification('success', `Đã tạo thành công tài khoản [${data.email}]`);
    fetchUsers();
  };

  const handleUpdateUser = async (id: string, data: UpdateUserInput) => {
    await api.put(`/users/${id}`, data);
    showNotification('success', 'Đã cập nhật thông tin tài khoản thành công');
    fetchUsers();
  };

  const handleToggleStatus = async (user: UserRecord) => {
    if (user._id === currentUser?.id) {
      showNotification('error', 'Bạn không thể tự vô hiệu hóa tài khoản của chính mình');
      return;
    }

    try {
      const res = await api.patch<{ success: boolean; isActive: boolean; message: string }>(
        `/users/${user._id}/toggle-status`,
      );
      showNotification('success', res.message);
      fetchUsers();
    } catch (err: any) {
      showNotification('error', err?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleResetPassword = async (id: string, newPassword?: string) => {
    await api.post(`/users/${id}/reset-password`, { newPassword });
    showNotification('success', 'Đã đặt lại mật khẩu thành công');
  };

  // Helper render badge for role
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            Super Admin
          </span>
        );
      case 'MANAGER_HN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Building2 className="w-3 h-3 text-blue-600" />
            Thủ kho HN
          </span>
        );
      case 'MANAGER_HCM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Building2 className="w-3 h-3 text-emerald-600" />
            Thủ kho HCM
          </span>
        );
      case 'QC_INSPECTOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            Kiểm định QC
          </span>
        );
      case 'AUDITOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <ShieldCheck className="w-3 h-3 text-slate-600" />
            Kiểm toán viên
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{role}</span>;
    }
  };

  // Helper render badge for branch
  const getBranchBadge = (branch: string) => {
    switch (branch) {
      case 'HN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            HN (ZONE_HN - Shard 1)
          </span>
        );
      case 'HCM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            HCM (ZONE_HCM - Shard 2)
          </span>
        );
      case 'DN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-cyan-50 text-cyan-800 border border-cyan-200">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
            DN (Primary Shard)
          </span>
        );
      case 'ALL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-800 border border-slate-300">
            <Database className="w-3 h-3 text-slate-500" />
            Toàn quốc (All Shards)
          </span>
        );
    }
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-xs font-medium border animate-in slide-in-from-bottom duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            HỆ THỐNG QUẢN TRỊ NỀN TẢNG
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quản trị Người dùng & Phân quyền Đa chi nhánh
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Quản lý định danh nhân sự, phân bổ 5 vai trò hệ thống (RBAC) và xác lập ranh giới dữ liệu an toàn 
            gắn liền với cấu trúc Zone Sharding của cụm MongoDB phân tán.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchUsers()}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-medium rounded shadow-sm hover:bg-slate-50 transition-colors"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => {
                setUserToEdit(null);
                setIsUserModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded shadow-sm transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Thêm tài khoản</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh sách Người dùng ({total})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'matrix'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ma trận Phân quyền Vai trò (RBAC Matrix)</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Tổng tài khoản</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tất cả chi nhánh</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Đang hoạt động</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {users.filter((u) => u.isActive).length}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Cho phép đăng nhập</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Miền Bắc (Hà Nội)</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {users.filter((u) => u.branch === 'HN').length}
                </p>
                <p className="text-[11px] text-blue-600 mt-0.5 font-mono">ZONE_HN / Shard 1</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Miền Nam (TP.HCM)</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {users.filter((u) => u.branch === 'HCM').length}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5 font-mono">ZONE_HCM / Shard 2</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm theo họ tên hoặc email..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="px-2.5 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-700"
                >
                  <option value="ALL_FILTER">Tất cả chi nhánh</option>
                  <option value="HN">Chi nhánh Hà Nội (ZONE_HN)</option>
                  <option value="HCM">Chi nhánh TP.HCM (ZONE_HCM)</option>
                  <option value="DN">Chi nhánh Đà Nẵng (Primary)</option>
                  <option value="ALL">Toàn quốc (All Shards)</option>
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2.5 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-700"
                >
                  <option value="ALL_FILTER">Tất cả vai trò</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="MANAGER_HN">Thủ kho Hà Nội</option>
                  <option value="MANAGER_HCM">Thủ kho TP.HCM</option>
                  <option value="QC_INSPECTOR">Kiểm định QC</option>
                  <option value="AUDITOR">Kiểm toán viên</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-700"
                >
                  <option value="ALL_FILTER">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Đã khóa</option>
                </select>

                {(search || branchFilter || roleFilter || statusFilter) && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setBranchFilter('');
                      setRoleFilter('');
                      setStatusFilter('');
                    }}
                    className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 font-medium transition-colors"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 flex justify-center">
                <LoadingSpinner label="Đang tải danh sách tài khoản..." />
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">Không tìm thấy người dùng phù hợp</p>
                <p className="text-xs text-slate-400 mt-1">Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Tài khoản & Định danh</th>
                      <th className="py-3 px-4">Vai trò (RBAC)</th>
                      <th className="py-3 px-4">Chi nhánh & Vùng Shard</th>
                      <th className="py-3 px-4">Số điện thoại</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Ngày tạo</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const isCurrent = u._id === currentUser?.id;
                      return (
                        <tr
                          key={u._id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  <span>{u.fullName}</span>
                                  {isCurrent && (
                                    <span className="text-[10px] bg-brand-100 text-brand-800 px-1.5 py-0.2 rounded font-medium">
                                      Bạn
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-500 font-mono text-[11px]">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {getRoleBadge(u.role)}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {getBranchBadge(u.branch)}
                          </td>

                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {u.phoneNumber || <span className="text-slate-400 italic">Chưa cập nhật</span>}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                Đã khóa
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '-'}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {isSuperAdmin && (
                                <>
                                  <button
                                    onClick={() => {
                                      setUserToEdit(u);
                                      setIsUserModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded transition-colors"
                                    title="Chỉnh sửa thông tin"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setUserToResetPass(u);
                                      setIsResetPassModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
                                    title="Đặt lại mật khẩu"
                                  >
                                    <KeyRound className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => handleToggleStatus(u)}
                                    disabled={isCurrent}
                                    className={`p-1.5 rounded transition-colors ${
                                      isCurrent
                                        ? 'text-slate-300 cursor-not-allowed'
                                        : u.isActive
                                        ? 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                                        : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                    title={u.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                                  >
                                    {u.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Hiển thị trang <span className="font-semibold text-slate-800">{page}</span> / {totalPages} (Tổng số{' '}
                <span className="font-semibold text-slate-800">{total}</span> người dùng)
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  Trang trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  Trang sau
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* RBAC Matrix Tab */
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Ma trận Phân quyền & Giới hạn Chi nhánh (RBAC)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Quy tắc phân quyền được thực thi trực tiếp tại tầng NestJS Security Guards và Mongo Router để đảm bảo tính an toàn dữ liệu trên cụm phân tán.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Vai trò (Role Code)</th>
                  <th className="py-3 px-4">Tên hiển thị</th>
                  <th className="py-3 px-4">Ranh giới Chi nhánh</th>
                  <th className="py-3 px-4">Shard vật lý</th>
                  <th className="py-3 px-4">Quyền hạn chính</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-purple-700">SUPER_ADMIN</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">Tổng Giám đốc / Super Admin</td>
                  <td className="py-3 px-4">{getBranchBadge('ALL')}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">Tất cả Shards (Scatter-Gather / Targeted)</td>
                  <td className="py-3 px-4 text-slate-700">Toàn quyền hệ thống, quản trị User, xem báo cáo toàn quốc, điều phối luân chuyển.</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">MANAGER_HN</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">Trưởng Tổng kho Miền Bắc (Hà Nội)</td>
                  <td className="py-3 px-4">{getBranchBadge('HN')}</td>
                  <td className="py-3 px-4 text-blue-700 font-mono">Shard 1 (Port 27018 - ZONE_HN)</td>
                  <td className="py-3 px-4 text-slate-700">Tạo/Duyệt phiếu Nhập kho, Xuất kho, Kiểm kê tồn kho tại chi nhánh Miền Bắc. Chặn thao tác Shard 2.</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">MANAGER_HCM</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">Trưởng Tổng kho Miền Nam (TP.HCM)</td>
                  <td className="py-3 px-4">{getBranchBadge('HCM')}</td>
                  <td className="py-3 px-4 text-emerald-700 font-mono">Shard 2 (Port 27020 - ZONE_HCM)</td>
                  <td className="py-3 px-4 text-slate-700">Tạo/Duyệt phiếu Nhập kho, Xuất kho, Kiểm kê tồn kho tại chi nhánh Miền Nam. Chặn thao tác Shard 1.</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-amber-700">QC_INSPECTOR</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">Kiểm định Chất lượng (KCS / QC)</td>
                  <td className="py-3 px-4">{getBranchBadge('ALL')}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">Global Read-Write QC</td>
                  <td className="py-3 px-4 text-slate-700">Nghiệm thu chất lượng lô hàng, kiểm tra chứng chỉ CO/CQ của vật tư trên toàn quốc.</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">AUDITOR</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">Kiểm toán viên Tài chính & Kho</td>
                  <td className="py-3 px-4">{getBranchBadge('ALL')}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">Read-Only All Shards</td>
                  <td className="py-3 px-4 text-slate-700">Chỉ đọc (Read-only) báo cáo tồn kho, định giá FIFO và truy vết lịch sử kiểm toán Audit Logs.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmitCreate={handleCreateUser}
        onSubmitUpdate={handleUpdateUser}
        userToEdit={userToEdit}
      />

      <ResetPasswordModal
        isOpen={isResetPassModalOpen}
        onClose={() => setIsResetPassModalOpen(false)}
        user={userToResetPass}
        onResetPassword={handleResetPassword}
      />
    </div>
  );
};
