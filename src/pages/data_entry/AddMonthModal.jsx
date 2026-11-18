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
        borderRadius: '28px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 30px 80px rgba(108, 86, 219, 0.2)',
        overflow: 'hidden',
        border: '1px solid rgba(108, 86, 219, 0.15)'
      }}>
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #6c52d6 0%, #5439ba 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.01em' }}>Add New Billing Month / Cycle</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ color: '#e0f2fe', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleAddNewMonth} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Start Date to End Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Start Date *
              </label>
              <input
                type="date"
                value={newMonthForm.start_date}
                onChange={(e) => handleStartDateChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                End Date *
              </label>
              <input
                type="date"
                value={newMonthForm.end_date}
                onChange={(e) => setNewMonthForm({ ...newMonthForm, end_date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc'
                }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Month / Cycle Label *
            </label>
            <input
              type="text"
              placeholder="e.g. Dec'26, Jan'27"
              value={newMonthForm.period_label}
              onChange={(e) => setNewMonthForm({ ...newMonthForm, period_label: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1.5px solid #e2e8f0',
                fontSize: '14px',
                fontWeight: '600',
                color: '#0f172a',
                backgroundColor: '#f8fafc'
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
            padding: '12px 16px',
            backgroundColor: '#efeefc',
            borderRadius: '14px',
            border: '1px solid #dcd7fc',
            fontSize: '12.5px',
            color: '#4338ca',
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
                padding: '10px 20px',
                borderRadius: '9999px',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #ff7e9e 0%, #ff4b72 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(255, 96, 136, 0.35)'
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
