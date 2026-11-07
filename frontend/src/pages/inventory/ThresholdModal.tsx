import React, { useState } from 'react';
import { api } from '../../lib/api';
import { StockRow } from '../../types/inventory.types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { inputClass, labelClass } from './InventoryUi';

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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Sửa ngưỡng tồn kho"
      description={`${stock.material_code} · ${stock.material_name} (Chi nhánh ${stock.warehouse_branch})`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button variant="primary" onClick={submit} loading={saving}>
            Lưu thay đổi
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="min-threshold">
              Ngưỡng tối thiểu ({stock.unit})
            </label>
            <input
              id="min-threshold"
              className={inputClass}
              type="number"
              min="0"
              step="any"
              required
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="max-threshold">
              Ngưỡng tối đa ({stock.unit})
            </label>
            <input
              id="max-threshold"
              className={inputClass}
              type="number"
              min="0"
              step="any"
              required
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono text-slate-600">
          <div>Tồn hiện tại: <strong className="text-slate-900">{stock.quantity} {stock.unit}</strong></div>
          <div className="text-slate-500 mt-0.5">Khả dụng: {stock.available_quantity} · Đã phân bổ: {stock.allocated_quantity}</div>
        </div>
      </form>
    </Modal>
  );
};
