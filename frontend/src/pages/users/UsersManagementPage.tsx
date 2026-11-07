import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { UserRecord, PaginatedUsersResponse, CreateUserInput, UpdateUserInput } from '../../types/user.types';
import { useAuth } from '../../context/AuthContext';
import { UserModal } from '../../components/users/UserModal';
import { ResetPasswordModal } from '../../components/users/ResetPasswordModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MetricStrip } from '../../components/common/MetricStrip';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
            ADMIN
          </span>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">
            Quản Trị Người Dùng & Phân Quyền Chi Nhánh (RBAC)
          </h1>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            cluster.users
          </span>
        </div>

        {/* Tab switchers + Actions */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tài Khoản ({total})</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ma Trận RBAC</span>
            </button>
          </div>

          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="p-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded transition-colors cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => {
                setUserToEdit(null);
                setIsUserModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Thêm tài khoản</span>
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Metric Strip */}
      <MetricStrip
        items={[
          {
            label: 'Tổng người dùng',
            value: total,
            subText: 'Tài khoản toàn quốc',
            status: 'neutral',
          },
          {
            label: 'Đang hoạt động',
            value: users.filter((u) => u.isActive).length,
            subText: 'Cho phép đăng nhập',
            status: 'success',
          },
          {
            label: 'Miền Bắc (Hà Nội)',
            value: `${users.filter((u) => u.branch === 'HN').length} users`,
            subText: 'ZONE_HN · Shard 1 (27018)',
            status: 'info',
          },
          {
            label: 'Miền Nam (TP.HCM)',
            value: `${users.filter((u) => u.branch === 'HCM').length} users`,
            subText: 'ZONE_HCM · Shard 2 (27020)',
            status: 'warning',
          },
          {
            label: 'Ranh giới Shard',
            value: 'BranchGuard',
            subText: 'Ngăn vượt ranh giới chi nhánh',
            status: 'success',
          },
        ]}
      />

      {activeTab === 'users' ? (
        <>
          {/* Single-Row Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-md text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo họ tên hoặc email..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none"
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
                className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none"
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
                className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none"
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
                  className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
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
                <table className="data-table">
                  <thead className="sticky top-0 bg-slate-50 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Tài khoản & Định danh</th>
                      <th className="py-2.5 px-3">Vai trò (RBAC)</th>
                      <th className="py-2.5 px-3">Chi nhánh & Vùng Shard</th>
                      <th className="py-2.5 px-3">Số điện thoại</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3">Ngày tạo</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isCurrent = u._id === currentUser?.id;
                      return (
                        <tr
                          key={u._id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                                  <span>{u.fullName}</span>
                                  {isCurrent && (
                                    <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.2 rounded font-medium">
                                      BẠN
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-500 font-mono text-[11px]">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {getRoleBadge(u.role)}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {getBranchBadge(u.branch)}
                          </td>

                          <td className="py-2.5 px-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                            {u.phoneNumber || <span className="text-slate-400 italic font-sans text-xs">Chưa cập nhật</span>}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Đã khóa
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '-'}
                          </td>

                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {isSuperAdmin && (
                                <>
                                  <button
                                    onClick={() => {
                                      setUserToEdit(u);
                                      setIsUserModalOpen(true);
                                    }}
                                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                                    title="Chỉnh sửa thông tin"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setUserToResetPass(u);
                                      setIsResetPassModalOpen(true);
                                    }}
                                    className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
                                    title="Đặt lại mật khẩu"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleToggleStatus(u)}
                                    disabled={isCurrent}
                                    className={`p-1 rounded transition-colors ${
                                      isCurrent
                                        ? 'text-slate-300 cursor-not-allowed'
                                        : u.isActive
                                        ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                        : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                    title={u.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                                  >
                                    {u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
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
            <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="font-mono text-[11px]">
                Trang <span className="font-semibold text-slate-900">{page}</span> / {totalPages} (Tổng số{' '}
                <span className="font-semibold text-slate-900">{total}</span> người dùng)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-slate-200 rounded text-xs bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors"
                >
                  Trang trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 border border-slate-200 rounded text-xs bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors"
                >
                  Trang sau
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* RBAC Matrix Tab - Divided List Layout */
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Ma trận Phân quyền Vai trò & Ranh giới Shard (RBAC Policy)
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Quy tắc bảo mật được thực thi tại NestJS Guard (<code className="font-mono text-slate-700">@UseGuards(RolesGuard, BranchAccessGuard)</code>) kết hợp định tuyến Shard Key <code className="font-mono text-slate-700">branch</code>.
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shrink-0 self-start sm:self-auto">
              5 RBAC Roles Active
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {/* SUPER_ADMIN */}
            <div className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    SUPER_ADMIN
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">Tổng Giám đốc / Quản trị viên Tối cao</h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    ALL_BRANCHES
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Toàn quyền quản trị hệ thống, quản lý tài khoản người dùng, cấu hình cụm Sharding, xem báo cáo tổng hợp toàn quốc và điều phối luân chuyển vật tư liên chi nhánh (Two-Phase Commit).
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {['Quản trị người dùng & phân quyền', 'Giám sát Cluster & Topology', 'Duyệt chuyển kho 2PC liên Shard', 'Toàn quyền CRUD vật tư', 'Xem Audit Logs'].map((cap) => (
                    <span key={cap} className="inline-flex items-center text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ {cap}
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:w-60 shrink-0 flex flex-col gap-0.5 md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Target Shard Route</div>
                <div className="text-xs font-mono font-semibold text-purple-700">Tất cả Shards (Scatter-Gather)</div>
                <div className="text-[11px] font-mono text-slate-500">Mongos Port 27017</div>
              </div>
            </div>

            {/* MANAGER_HN */}
            <div className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    MANAGER_HN
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">Trưởng Tổng kho Miền Bắc (Hà Nội)</h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    ZONE_HN
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tạo và duyệt phiếu Nhập kho, Xuất kho, kiểm kê tồn kho và cảnh báo định mức tại kho Hà Nội. Tự động bị chặn (HTTP 403 Forbidden) nếu cố tình truy vấn hoặc thao tác vào dữ liệu thuộc Shard HCM.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {['Quản lý tồn kho Shard HN', 'Tạo & Duyệt phiếu Nhập/Xuất HN', 'Cấu hình định mức tồn kho an toàn HN', 'Yêu cầu luân chuyển hàng sang HCM'].map((cap) => (
                    <span key={cap} className="inline-flex items-center text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ {cap}
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:w-60 shrink-0 flex flex-col gap-0.5 md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Target Shard Route</div>
                <div className="text-xs font-mono font-semibold text-blue-700">Shard 1 (shard01 - Port 27018)</div>
                <div className="text-[11px] font-mono text-slate-500">Zone Tag: ZONE_HN [HN, MinKey - MaxKey]</div>
              </div>
            </div>

            {/* MANAGER_HCM */}
            <div className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    MANAGER_HCM
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">Trưởng Tổng kho Miền Nam (TP.HCM)</h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ZONE_HCM
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tạo và duyệt phiếu Nhập kho, Xuất kho, kiểm kê tồn kho và cảnh báo định mức tại kho Hồ Chí Minh. Tự động bị chặn (HTTP 403 Forbidden) nếu cố tình truy vấn hoặc thao tác vào dữ liệu thuộc Shard HN.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {['Quản lý tồn kho Shard HCM', 'Tạo & Duyệt phiếu Nhập/Xuất HCM', 'Cấu hình định mức tồn kho an toàn HCM', 'Tiếp nhận hàng luân chuyển từ HN'].map((cap) => (
                    <span key={cap} className="inline-flex items-center text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ {cap}
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:w-60 shrink-0 flex flex-col gap-0.5 md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Target Shard Route</div>
                <div className="text-xs font-mono font-semibold text-emerald-700">Shard 2 (shard02 - Port 27020)</div>
                <div className="text-[11px] font-mono text-slate-500">Zone Tag: ZONE_HCM [HCM, MinKey - MaxKey]</div>
              </div>
            </div>

            {/* QC_INSPECTOR */}
            <div className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    QC_INSPECTOR
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">Kiểm định Chất lượng (KCS / QC Specialist)</h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    GLOBAL_QC
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kiểm tra chất lượng lô hàng, xác nhận chứng chỉ CO/CQ của vật tư thiết bị mạng trên toàn hệ thống trước khi cho phép nhập kho hoặc xuất xưởng.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {['Kiểm tra thông số kỹ thuật vật tư', 'Ký nhận biên bản nghiệm thu QC', 'Đính kèm chứng chỉ xuất xứ CO/CQ', 'Từ chối lô hàng lỗi'].map((cap) => (
                    <span key={cap} className="inline-flex items-center text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ {cap}
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:w-60 shrink-0 flex flex-col gap-0.5 md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Target Shard Route</div>
                <div className="text-xs font-mono font-semibold text-amber-700">Global Read-Write QC Status</div>
                <div className="text-[11px] font-mono text-slate-500">Routed via Mongos 27017</div>
              </div>
            </div>

            {/* AUDITOR */}
            <div className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    AUDITOR
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">Kiểm toán viên Độc lập (Auditor)</h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    READ_ONLY
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Quyền chỉ đọc (Read-only) toàn bộ báo cáo tồn kho, định giá FIFO, phân tích chi phí và truy vết lịch sử kiểm toán bảo mật (Audit Trails) trên toàn bộ cụm phân tán.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {['Xem báo cáo tồn kho & định giá FIFO', 'Truy vết Audit Trail & lịch sử thao tác', 'Xuất dữ liệu kiểm toán CSV/Excel', 'Chặn toàn bộ quyền Ghi (Write-Blocked)'].map((cap) => (
                    <span key={cap} className="inline-flex items-center text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      ✓ {cap}
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:w-60 shrink-0 flex flex-col gap-0.5 md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Target Shard Route</div>
                <div className="text-xs font-mono font-semibold text-slate-700">Read-Only All Shards</div>
                <div className="text-[11px] font-mono text-slate-500">Mongos Secondary Preferred</div>
              </div>
            </div>
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
