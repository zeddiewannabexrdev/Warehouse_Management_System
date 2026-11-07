import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Material, MaterialCategory, MaterialCategoryStats, MaterialListResponse } from '../../types/material.types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatNumber } from '../../lib/utils';
import { MaterialDetailModal } from './MaterialDetailModal';
import { MaterialFormModal } from './MaterialFormModal';
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Server,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [stats, setStats] = useState<MaterialCategoryStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [dataSource, setDataSource] = useState<string>('MONGODB');

  // Modals
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const fetchCategories = async () => {
    try {
      const cats = await api.get<MaterialCategory[]>('/materials/categories');
      setCategories(cats || []);
    } catch (err: any) {
      console.warn('Could not load categories:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get<MaterialCategoryStats[]>('/materials/stats');
      setStats(res || []);
    } catch (err: any) {
      console.warn('Could not load stats:', err);
    }
  };

  const fetchMaterials = async () => {
    try {
      setError(null);
      const params: Record<string, any> = {
        page,
        limit,
      };
      if (selectedCategory) params.category_code = selectedCategory;
      if (selectedStatus) params.is_active = selectedStatus;
      if (searchKeyword.trim()) params.search = searchKeyword.trim();

      const res = await api.get<MaterialListResponse>('/materials', { params });
      setMaterials(res.items || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
      setDataSource(res.dataSource || 'MONGODB_SHARDED_CLUSTER');
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi tải danh sách vật tư');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchMaterials();
  }, [page, limit, selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    fetchMaterials();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMaterials();
    fetchStats();
  };

  const handleCreateOrUpdate = async (formData: any) => {
    if (editingMaterial) {
      await api.put(`/materials/${editingMaterial.material_code}`, formData);
    } else {
      await api.post('/materials', formData);
    }
    fetchMaterials();
    fetchStats();
  };

  const handleDelete = async (mat: Material) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vật tư "${mat.name}" (${mat.material_code})?`)) {
      try {
        await api.delete(`/materials/${mat.material_code}`);
        fetchMaterials();
        fetchStats();
      } catch (err: any) {
        alert(err?.message || 'Không thể xóa vật tư');
      }
    }
  };

  const openCreateModal = () => {
    setEditingMaterial(null);
    setIsFormOpen(true);
  };

  const openEditModal = (mat: Material) => {
    setEditingMaterial(mat);
    setIsFormOpen(true);
  };

  const openDetailModal = (mat: Material) => {
    setSelectedMaterial(mat);
    setIsDetailOpen(true);
  };

  const getCategoryBadgeColor = (code: string) => {
    switch (code) {
      case 'CAT-STEEL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CAT-CABLE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CAT-CEMENT':
        return 'bg-stone-50 text-stone-700 border-stone-200';
      case 'CAT-PAINT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans">
      {/* Page Header */}
      <div className="bg-white px-4 py-3 rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded border bg-blue-50 text-blue-700 border-blue-200">
              GLOBAL UNSHARDED
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Primary Shard · Shard 1 (27018)
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Quản lý Danh mục Vật tư
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh mục vật tư dùng chung toàn quốc (Global Reference Collection) lưu trữ tập trung trên Primary Shard.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 text-slate-500 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm vật tư</span>
          </button>
        </div>
      </div>

      {/* Info Bar */}
      <div className="px-3.5 py-2 bg-white rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Lược đồ đa hình (Polymorphic Schema) lưu trữ linh hoạt các thông số kỹ thuật đặc thù trong cùng một collection.</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500 shrink-0">
          Source: <strong className="text-slate-800">{dataSource}</strong>
        </div>
      </div>

      {/* Category Stats Metric Strip */}
      {stats.length > 0 && (
        <div className="metric-strip">
          {stats.map((s) => {
            const isSelected = selectedCategory === s.category_code;
            return (
              <div
                key={s.category_code}
                onClick={() => {
                  setSelectedCategory(isSelected ? '' : s.category_code);
                  setPage(1);
                }}
                className={`metric-item cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="metric-label">{s.category_name}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${getCategoryBadgeColor(s.category_code)}`}>
                    {s.category_code}
                  </span>
                </div>
                <div className="metric-value">{s.count} <span className="text-xs font-normal text-slate-500 font-sans">mục</span></div>
                <div className="metric-sub">Định mức TB: {formatNumber(s.avgPrice)} đ</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Single-Row Filter Toolbar */}
      <div className="p-2.5 bg-white rounded-md border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm mã VT, tên, barcode..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
          >
            Tìm
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tất cả Nhóm</option>
            {categories.map((c) => (
              <option key={c.category_code} value={c.category_code}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tất cả Trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Tạm dừng</option>
          </select>

          {(selectedCategory || selectedStatus || searchKeyword) && (
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedStatus('');
                setSearchKeyword('');
                setPage(1);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Materials Data Table */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner label="Đang truy xuất danh mục vật tư từ MongoDB..." />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Không tìm thấy vật tư nào"
              description="Thử thay đổi bộ lọc hoặc thêm mới vật tư vào hệ thống danh mục."
              actionText="Thêm Vật tư mới"
              onAction={openCreateModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr>
                  <th>Mã Vật tư</th>
                  <th>Tên Vật tư & Nhóm</th>
                  <th>Đơn vị</th>
                  <th className="num">Đơn giá Định mức</th>
                  <th>Thông số Đa hình (Specs)</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((mat) => {
                  const specsKeys = Object.keys(mat.specifications || {});
                  return (
                    <tr key={mat.material_code}>
                      {/* Code */}
                      <td className="font-mono font-semibold text-slate-900">
                        {mat.material_code}
                      </td>

                      {/* Name & Category */}
                      <td>
                        <div className="font-semibold text-slate-900 text-xs">{mat.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${getCategoryBadgeColor(
                              mat.category_code,
                            )}`}
                          >
                            {mat.category_code}
                          </span>
                          {mat.barcode && (
                            <span className="text-[10px] font-mono text-slate-400">
                              Barcode: {mat.barcode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="font-medium text-slate-600">{mat.unit}</td>

                      {/* Price */}
                      <td className="num font-semibold text-emerald-700">
                        {formatNumber(mat.standard_price)} đ
                      </td>

                      {/* Polymorphic Specs Preview */}
                      <td className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {specsKeys.slice(0, 3).map((key) => (
                            <span
                              key={key}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200"
                              title={`${key}: ${mat.specifications[key]}`}
                            >
                              <b className="font-mono mr-1">{key}:</b> {String(mat.specifications[key])}
                            </span>
                          ))}
                          {specsKeys.length > 3 && (
                            <span className="text-[10px] text-blue-600 font-mono font-medium self-center ml-0.5">
                              +{specsKeys.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge
                          status={mat.is_active ? 'Hoạt động' : 'Tạm dừng'}
                          variant={mat.is_active ? 'success' : 'danger'}
                        />
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetailModal(mat)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="Xem chi tiết & Schema BSON"
                            aria-label="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(mat)}
                            className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                            title="Chỉnh sửa thông số"
                            aria-label="Chỉnh sửa thông số"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(mat)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa vật tư"
                            aria-label="Xóa vật tư"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-3.5 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Hiển thị</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-1.5 py-0.5 border border-slate-200 rounded text-xs bg-white text-slate-700 font-medium"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>/ {totalCount} vật tư</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]">
              Trang <b>{page}</b> / <b>{totalPages}</b>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                aria-label="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                aria-label="Trang sau"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MaterialDetailModal
        material={selectedMaterial}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      <MaterialFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateOrUpdate}
        categories={categories}
        initialData={editingMaterial}
      />
    </div>
  );
};
