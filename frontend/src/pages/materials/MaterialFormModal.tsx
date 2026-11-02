import React, { useState, useEffect } from 'react';
import { Material, MaterialCategory } from '../../types/material.types';
import { X, Plus, Trash2, Layers, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  categories: MaterialCategory[];
  initialData?: Material | null;
}

export const MaterialFormModal: React.FC<MaterialFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialData,
}) => {
  const isEdit = !!initialData;

  const [materialCode, setMaterialCode] = useState('');
  const [name, setName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [unit, setUnit] = useState('Tấn');
  const [standardPrice, setStandardPrice] = useState<number>(100000);
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Specifications
  const [specs, setSpecs] = useState<Record<string, any>>({});
  // Custom extra key-values
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Category Template
  const activeCategory = categories.find((c) => c.category_code === categoryCode);

  useEffect(() => {
    if (initialData) {
      setMaterialCode(initialData.material_code);
      setName(initialData.name);
      setCategoryCode(initialData.category_code);
      setUnit(initialData.unit);
      setStandardPrice(initialData.standard_price);
      setBarcode(initialData.barcode || '');
      setDescription(initialData.description || '');
      setIsActive(initialData.is_active ?? true);

      // Separate predefined specs and custom specs
      const initialSpecs = initialData.specifications || {};
      setSpecs({ ...initialSpecs });
      setCustomFields([]);
    } else {
      // Default to first category
      const firstCat = categories[0]?.category_code || 'CAT-STEEL';
      setMaterialCode(`MAT-${Date.now().toString().slice(-6)}`);
      setName('');
      setCategoryCode(firstCat);
      setUnit('Tấn');
      setStandardPrice(15000000);
      setBarcode('');
      setDescription('');
      setIsActive(true);
      setSpecs({});
      setCustomFields([]);
    }
    setError(null);
  }, [initialData, isOpen, categories]);

  // When category changes in Create mode, initialize specs with default template values
  const handleCategoryChange = (newCatCode: string) => {
    setCategoryCode(newCatCode);
    const cat = categories.find((c) => c.category_code === newCatCode);
    if (cat && !isEdit) {
      const defaultSpecs: Record<string, any> = {};
      cat.specification_template.forEach((field) => {
        defaultSpecs[field.field] = field.type === 'number' ? 0 : '';
      });
      setSpecs(defaultSpecs);

      // Suggest appropriate unit
      if (newCatCode === 'CAT-STEEL') setUnit('Tấn');
      else if (newCatCode === 'CAT-CABLE') setUnit('Mét');
      else if (newCatCode === 'CAT-CEMENT') setUnit('Bao (50kg)');
      else if (newCatCode === 'CAT-PAINT') setUnit('Thùng (20L)');
    }
  };

  const handleSpecChange = (field: string, value: any) => {
    setSpecs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddCustomField = () => {
    setCustomFields((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleCustomFieldChange = (index: number, key: string, value: string) => {
    setCustomFields((prev) => {
      const next = [...prev];
      next[index] = { key, value };
      return next;
    });
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!materialCode.trim()) {
      setError('Mã vật tư không được để trống');
      return;
    }
    if (!name.trim()) {
      setError('Tên vật tư không được để trống');
      return;
    }

    // Merge specs with custom fields
    const finalSpecs: Record<string, any> = { ...specs };
    customFields.forEach(({ key, value }) => {
      if (key.trim()) {
        finalSpecs[key.trim()] = value;
      }
    });

    try {
      setSubmitting(true);
      await onSubmit({
        material_code: materialCode.trim(),
        name: name.trim(),
        category_code: categoryCode,
        unit: unit.trim(),
        standard_price: Number(standardPrice),
        barcode: barcode.trim() || undefined,
        description: description.trim() || undefined,
        specifications: finalSpecs,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu vật tư');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEdit ? 'Chỉnh sửa Vật tư' : 'Thêm mới Vật tư vào Danh mục'}
              </h3>
              <p className="text-xs text-slate-500">
                Áp dụng Lược đồ Đa hình (Polymorphic Schema Pattern) trên MongoDB Sharded Cluster
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Thông tin cơ bản */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
              <span>1. Thông tin Định danh & Phân loại</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã vật tư <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={materialCode}
                  disabled={isEdit}
                  onChange={(e) => setMaterialCode(e.target.value)}
                  placeholder="MAT-STEEL-D20"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhóm vật tư <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryCode}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.category_code} value={c.category_code}>
                      {c.name} ({c.category_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đơn vị tính <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Tấn, Mét, Bao, Thùng..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên vật tư <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên gọi quy chuẩn của vật tư..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đơn giá định mức (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={standardPrice}
                  onChange={(e) => setStandardPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã vạch Barcode / QR</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="8934567890123"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả chi tiết</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mục đích sử dụng, vị trí ứng dụng..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Thông số kỹ thuật đa hình (Polymorphic Specifications) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>2. Thông số Kỹ thuật Đa hình (Polymorphic Specifications)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Các trường kỹ thuật tự động thay đổi tương thích với nhóm <b>{activeCategory?.name}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm thuộc tính tự do</span>
              </button>
            </div>

            {/* Template dynamic fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCategory?.specification_template?.map((field) => (
                <div key={field.field} className="bg-white p-3 rounded-lg border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {field.label} {field.unit && <span className="text-slate-400 font-normal">({field.unit})</span>}
                    {field.required && <span className="text-rose-500"> *</span>}
                    <span className="font-mono text-[10px] text-slate-400 block">{field.field}</span>
                  </label>
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={specs[field.field] ?? ''}
                    placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
                    onChange={(e) =>
                      handleSpecChange(
                        field.field,
                        field.type === 'number' ? Number(e.target.value) : e.target.value,
                      )
                    }
                    className="w-full px-3 py-1.5 text-sm rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>

            {/* Custom dynamic key-values */}
            {customFields.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Các thuộc tính mở rộng tự do:</span>
                {customFields.map((field, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Tên trường (vd: coating_type)"
                      value={field.key}
                      onChange={(e) => handleCustomFieldChange(idx, e.target.value, field.value)}
                      className="w-1/3 px-3 py-1.5 text-xs rounded border border-slate-300 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Giá trị (vd: Mạ kẽm nhúng nóng)"
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(idx, field.key, e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded border border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(idx)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trạng thái hoạt động */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
              Kích hoạt đưa vật tư vào sử dụng giao dịch kho (is_active)
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 italic">
            * Lưu trữ trực tiếp vào collection <b>materials</b> tại Primary Shard
          </span>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật Vật tư' : 'Lưu vào MongoDB'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
