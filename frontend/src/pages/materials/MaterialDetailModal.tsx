import React from 'react';
import { Material } from '../../types/material.types';
import { X, Code, FileText, Layers } from 'lucide-react';
import { formatNumber, formatDate } from '../../lib/utils';
import { StatusBadge } from '../../components/common/StatusBadge';

interface MaterialDetailModalProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({
  material,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = React.useState<'specs' | 'json'>('specs');

  if (!isOpen || !material) return null;

  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    'CAT-STEEL': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'CAT-CABLE': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'CAT-CEMENT': { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200' },
    'CAT-PAINT': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  };

  const currentTheme = categoryColors[material.category_code] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const formatKeyName = (key: string): string => {
    const keyMap: Record<string, string> = {
      standard: 'Tiêu chuẩn kỹ thuật',
      diameter_mm: 'Đường kính (mm)',
      grade: 'Mác vật liệu / Thép',
      tensile_strength_mpa: 'Độ bền kéo (MPa)',
      material: 'Vật liệu chế tạo',
      voltage_kv: 'Điện áp định mức (kV)',
      conductor: 'Ruột dẫn điện',
      cores: 'Số lõi dẫn',
      cross_section_sqmm: 'Tiết diện lõi (mm²)',
      strength_grade: 'Mác cường độ',
      curing_days: 'Thời gian bảo dưỡng (ngày)',
      package_weight_kg: 'Trọng lượng bao (kg)',
      base: 'Gốc nhựa / Dung môi',
      solid_volume_pct: 'Hàm lượng chất rắn (%)',
      pot_life_hours: 'Thời gian đóng rắn (giờ)',
      voc_g_l: 'Hàm lượng VOC (g/L)',
    };
    return keyMap[key] || key.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg border ${currentTheme.bg} ${currentTheme.border} ${currentTheme.text}`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                  {material.material_code}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border}`}>
                  {material.category_code}
                </span>
                <StatusBadge
                  status={material.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                  variant={material.is_active ? 'success' : 'danger'}
                />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-1 leading-snug">
                {material.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-3 border-b border-slate-200 flex space-x-4 bg-white">
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'specs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Thông số Kỹ thuật (Polymorphic Specs)</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'json'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Cấu trúc MongoDB BSON Document</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'specs' ? (
            <>
              {/* General Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Đơn vị tính</span>
                  <span className="font-semibold text-slate-800">{material.unit}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Đơn giá định mức</span>
                  <span className="font-semibold text-emerald-700">{formatNumber(material.standard_price)} VNĐ</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Mã vạch / QR</span>
                  <span className="font-mono text-xs text-slate-700">{material.barcode || 'Chưa gán'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Lưu trữ phân tán</span>
                  <span className="text-xs font-medium text-indigo-700">Primary Shard (Global)</span>
                </div>
              </div>

              {material.description && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Mô tả quy chuẩn</h4>
                  <p className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                    {material.description}
                  </p>
                </div>
              )}

              {/* Polymorphic Specifications Display */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Thuộc tính kỹ thuật đa hình (`specifications`)
                  </h4>
                  <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                    Polymorphic Pattern
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {material.specifications && Object.keys(material.specifications).length > 0 ? (
                    Object.entries(material.specifications).map(([key, val]) => (
                      <div
                        key={key}
                        className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between"
                      >
                        <span className="text-xs font-medium text-slate-500 mb-1">
                          {formatKeyName(key)}
                          <span className="font-mono text-[10px] text-slate-400 block mt-0.5">{key}</span>
                        </span>
                        <span className="text-sm font-semibold text-slate-900 break-words">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-6 text-slate-400 text-sm italic border rounded-lg">
                      Không có thông số kỹ thuật nào được khai báo
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center justify-between border-t pt-3">
                <span>Khởi tạo: {material.created_at ? formatDate(material.created_at) : 'N/A'}</span>
                <span>Cập nhật gần nhất: {material.updated_at ? formatDate(material.updated_at) : 'N/A'}</span>
              </div>
            </>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Dữ liệu tài liệu JSON lưu trữ trực tiếp trong MongoDB Collection <code className="text-indigo-600 font-mono font-bold">materials</code>:
                </p>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                  BSON Document
                </span>
              </div>
              <pre className="p-4 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                {JSON.stringify(material, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
