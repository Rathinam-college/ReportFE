import React from 'react';
import { formatINR } from '../../utils/formatters';

export default function CostMixSidebar({
  computedMatrix,
  editingPeriodId,
  activePeriodObj,
  isDirty,
  handleSaveActiveMonth,
  savingBatch
}) {
  if (!computedMatrix) return null;

  const periods = computedMatrix.periods || [];
  const categories = computedMatrix.categories || [];

  // Compute category shares for active period
  let periodGrandTotal = 0;
  const catShares = categories.map((cat, idx) => {
    const amt = cat.subtotal?.amounts?.[editingPeriodId] || 0;
    periodGrandTotal += amt;
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    return {
      id: cat.category_id,
      name: cat.category_name,
      amount: amt,
      color: colors[idx % colors.length]
    };
  });

  const catSharesWithPct = catShares.map(c => ({
    ...c,
    pct: periodGrandTotal > 0 ? (c.amount / periodGrandTotal) * 100 : 0
  }));

  // Count filled cost heads
  let totalHeads = 0;
  let filledHeads = 0;
  categories.forEach(cat => {
    cat.items.forEach(it => {
      totalHeads++;
      const val = it.amounts?.[editingPeriodId];
      if (val !== null && val !== undefined && val !== '') {
        filledHeads++;
      }
    });
  });

  const isClosed = !!activePeriodObj?.is_closed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      
      {/* CARD 1: COST MIX */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #eef2f6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 14px 0' }}>
          Cost mix • {activePeriodObj?.period_label || 'Current'}
        </h4>

        {/* Multi-segment horizontal progress bar */}
        <div style={{
          width: '100%',
          height: '10px',
          backgroundColor: '#f1f5f9',
          borderRadius: '9999px',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: '16px'
        }}>
          {catSharesWithPct.map(c => (
            <div
              key={c.id}
              style={{
                width: `${c.pct}%`,
                height: '100%',
                backgroundColor: c.color,
                transition: 'width 0.3s ease'
              }}
              title={`${c.name}: ${c.pct.toFixed(1)}%`}
            />
          ))}
        </div>

        {/* Category Breakdown List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {catSharesWithPct.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: c.color }} />
                <span style={{ color: '#334155', fontWeight: '500' }}>{c.name}</span>
              </div>
              <span style={{ fontWeight: '700', color: '#0f172a' }}>
                {c.pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CARD 2: ENTRY STATUS */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #eef2f6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 14px 0' }}>
          Entry status
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
            <span style={{ color: '#64748b' }}>Cycle</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: '#eef2ff',
              color: '#4f46e5',
              fontWeight: '700',
              fontSize: '11.5px'
            }}>
              {activePeriodObj?.period_label}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
            <span style={{ color: '#64748b' }}>Cost heads to fill</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              fontWeight: '700',
              fontSize: '11.5px'
            }}>
              {filledHeads} of {totalHeads}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
            <span style={{ color: '#64748b' }}>Month lock</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: isClosed ? '#f1f5f9' : '#fffbeb',
              color: isClosed ? '#64748b' : '#d97706',
              fontWeight: '700',
              fontSize: '11.5px'
            }}>
              {isClosed ? 'Locked (Read Only)' : 'Unlocked'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
            <span style={{ color: '#64748b' }}>Unsaved changes</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: isDirty ? '#fef2f2' : '#f8fafc',
              color: isDirty ? '#ef4444' : '#64748b',
              fontWeight: '700',
              fontSize: '11.5px',
              border: `1px solid ${isDirty ? '#fecaca' : '#e2e8f0'}`
            }}>
              {isDirty ? 'Pending (Ctrl+S)' : 'None'}
            </span>
          </div>
        </div>

        {/* Full-width purple Save button */}
        <button
          type="button"
          onClick={handleSaveActiveMonth}
          disabled={savingBatch || isClosed}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: '8px',
            backgroundColor: isClosed ? '#cbd5e1' : '#4f46e5',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '700',
            border: 'none',
            cursor: isClosed ? 'not-allowed' : 'pointer',
            boxShadow: isClosed ? 'none' : '0 2px 8px rgba(79, 70, 229, 0.35)',
            transition: 'all 0.15s ease'
          }}
        >
          {savingBatch ? 'Saving...' : `Save ${activePeriodObj?.period_label || 'Month'} Entries`}
        </button>
      </div>

    </div>
  );
}

