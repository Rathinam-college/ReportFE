import React from 'react';
import { X } from 'lucide-react';

export default function EditPeriodModal({
  isOpen,
  onClose,
  editingPeriodItem,
  editPeriodForm,
  setEditPeriodForm,
  handleSavePeriodEdit
}) {
  if (!isOpen || !editingPeriodItem) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 22px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
            Edit Billing Month: {editingPeriodItem.period_label}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSavePeriodEdit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Month / Cycle Label *
            </label>
            <input
              type="text"
              value={editPeriodForm.period_label}
              onChange={(e) => setEditPeriodForm({ ...editPeriodForm, period_label: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                fontWeight: '600',
                color: '#0f172a'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Period Code (YYYY-MM) *
            </label>
            <input
              type="text"
              value={editPeriodForm.period_code}
              onChange={(e) => setEditPeriodForm({ ...editPeriodForm, period_code: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                fontWeight: '600',
                color: '#0f172a'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <input
              type="checkbox"
              id="lockPeriodCheckModal"
              checked={editPeriodForm.is_closed}
              onChange={(e) => setEditPeriodForm({ ...editPeriodForm, is_closed: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
            />
            <label htmlFor="lockPeriodCheckModal" style={{ fontSize: '13px', color: '#334155', cursor: 'pointer', fontWeight: '500' }}>
              Lock / Close this period (freezes edits in Data Entry)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 20px',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
