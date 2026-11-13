import React from 'react';
import { formatINR } from '../../utils/formatters';

export default function ModulesGrid({ onOpenDataEntry, activePeriodTotal = '₹0.00', periodLabel = 'Current Cycle', hasPeriods = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
        Modules
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {/* Module 1: Food & Dining (Active) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px 22px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#6366f1' }} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Food & Dining</span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: hasPeriods ? '#fffbeb' : '#f1f5f9',
                color: hasPeriods ? '#b45309' : '#64748b',
                border: hasPeriods ? '1px solid #fef3c7' : '1px solid #e2e8f0'
              }}>
                {hasPeriods ? `Draft • ${periodLabel}` : 'No data yet'}
              </span>
            </div>

            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }} className="currency-font">
              {activePeriodTotal}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
              {hasPeriods ? `${periodLabel} total • Active operational ledger` : 'No operational entries recorded'}
            </div>

            {/* Mini 5-bar sparklines */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '24px', marginTop: '12px' }}>
              <span style={{ width: '14px', height: '10px', backgroundColor: '#cbd5e1', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '14px', backgroundColor: '#cbd5e1', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '12px', backgroundColor: '#cbd5e1', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '20px', backgroundColor: '#94a3b8', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '24px', backgroundColor: '#4f46e5', borderRadius: '2px' }} />
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDataEntry}
            style={{
              width: '100%',
              padding: '9px 0',
              borderRadius: '8px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.28)'
            }}
          >
            Open Data Entry
          </button>
        </div>

        {/* Module 2: Hostel Occupancy (Placeholder) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px 22px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#06b6d4' }} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Hostel Occupancy</span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: '#f1f5f9',
                color: '#64748b'
              }}>
                No data yet
              </span>
            </div>

            <div style={{
              height: '80px',
              border: '1px dashed #e2e8f0',
              borderRadius: '8px',
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: '12px'
            }}>
              Occupancy entries will show here
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDataEntry}
            style={{
              width: '100%',
              padding: '9px 0',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '600',
              border: '1px solid #cbd5e1',
              cursor: 'pointer'
            }}
          >
            Start Data Entry
          </button>
        </div>

        {/* Module 3: Transport Fleet (Placeholder) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px 22px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#ec4899' }} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Transport Fleet</span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: '#f1f5f9',
                color: '#64748b'
              }}>
                No data yet
              </span>
            </div>

            <div style={{
              height: '80px',
              border: '1px dashed #e2e8f0',
              borderRadius: '8px',
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: '12px'
            }}>
              Fleet entries will show here
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDataEntry}
            style={{
              width: '100%',
              padding: '9px 0',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '600',
              border: '1px solid #cbd5e1',
              cursor: 'pointer'
            }}
          >
            Start Data Entry
          </button>
        </div>
      </div>
    </div>
  );
}

