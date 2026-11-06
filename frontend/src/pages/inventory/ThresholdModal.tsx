import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';
import { StockRow } from '../../types/inventory.types';
import { inputClass, labelClass, primaryButton, secondaryButton } from './InventoryUi';

export const ThresholdModal: React.FC<{
  stock: StockRow;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}> = ({ stock, onClose, onSaved, onError }) => {
  const [min, setMin] = useState(String(stock.min_threshold));
  const [max, setMax] = useState(String(stock.max_threshold ?? ''));
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put(
        `/inventory/stocks/${stock.warehouse_branch}/${encodeURIComponent(stock.material_code)}/thresholds`,
        { min_threshold: Number(min), max_threshold: Number(max) },
      );
      onSaved();
    } catch (err: any) {
      onError(err?.message || 'Không lưu được ngưỡng');
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
      <form role="dialog" aria-modal="true" aria-label="Sửa ngưỡng tồn kho" onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Sửa ngưỡng tồn kho</h2>
          <p className="mt-1 text-sm text-slate-500">{stock.material_name}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="min-threshold">Ngưỡng tối thiểu</label>
            <input id="min-threshold" className={inputClass} type="number" min="0" step="any" required value={min} onChange={(e) => setMin(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="max-threshold">Ngưỡng tối đa</label>
            <input id="max-threshold" className={inputClass} type="number" min="0" step="any" required value={max} onChange={(e) => setMax(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2.5 pt-1">
          <button type="button" onClick={onClose} className={secondaryButton}>Hủy</button>
          <button type="submit" disabled={saving} className={primaryButton}>Lưu thay đổi</button>
        </div>
      </form>
    </div>,
    document.body,
  );
};
