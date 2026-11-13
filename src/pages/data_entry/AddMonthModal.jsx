import React from 'react';
import { X } from 'lucide-react';

export default function AddMonthModal({
  isOpen,
  onClose,
  newMonthForm,
  setNewMonthForm,
  handleStartDateChange,
  handleAddNewMonth
}) {
  if (!isOpen) return null;

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
        maxWidth: '480px',
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
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Add New Billing Month / Cycle</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleAddNewMonth} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Start Date to End Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Start Date *
              </label>
              <input
                type="date"
                value={newMonthForm.start_date}
                onChange={(e) => handleStartDateChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: '#0f172a',
                  backgroundColor: '#ffffff'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                End Date *
              </label>
              <input
                type="date"
                value={newMonthForm.end_date}
                onChange={(e) => setNewMonthForm({ ...newMonthForm, end_date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: '#0f172a',
                  backgroundColor: '#ffffff'
                }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Month / Cycle Label *
            </label>
            <input
              type="text"
              placeholder="e.g. Dec'26, Jan'27"
              value={newMonthForm.period_label}
              onChange={(e) => setNewMonthForm({ ...newMonthForm, period_label: e.target.value })}
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
            <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Automatically generated from Start Date (e.g. <strong>Dec'26</strong>), or customize as needed
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 14px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '12.5px',
            color: '#475569',
            lineHeight: '1.4'
          }}>
            <span style={{ fontSize: '15px', marginTop: '1px' }}>📋</span>
            <span>
              New month starts with <strong>blank entries (₹0.00)</strong>. Enter values manually, or use the <strong>Clone from Prev</strong> button in Data Entry whenever needed.
            </span>
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
              Create & Open for Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
