import React from 'react';
import { Package, Calendar } from 'lucide-react';
import MonthlyAttachmentsDashboardSection from '../../components/attachments/MonthlyAttachmentsDashboardSection';

export default function StoreSpreadsheetEntry({
  activePeriodObj,
  computedMatrix,
  editingPeriodId,
  setEditingPeriodId,
  fetchData
}) {
  const periods = computedMatrix?.periods || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{
        backgroundColor: '#14245C',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#F5A524',
            color: '#14245C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>
              Store Operations — Monthly Data Entry
            </h2>
            <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '2px 0 0 0' }}>
              Active Period: {activePeriodObj?.period_label || 'Select Month'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Calendar size={15} color="#F5A524" />
          <select
            value={editingPeriodId || ''}
            onChange={(e) => setEditingPeriodId?.(Number(e.target.value))}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {periods.length === 0 ? (
              <option value="" style={{ color: '#0f172a' }}>No billing periods</option>
            ) : (
              periods.map(p => (
                <option key={p.id} value={p.id} style={{ color: '#0f172a' }}>
                  {p.period_label}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #E1E6F2',
        padding: '32px 24px',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#14245C', margin: '0 0 6px 0' }}>
          Store Spreadsheet Entry Ready
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Ready to connect your Store parameters, inputs, and live database save endpoints.
        </p>
      </div>

      {editingPeriodId && (
        <MonthlyAttachmentsDashboardSection
          module="store"
          periodId={editingPeriodId}
          periodLabel={activePeriodObj?.period_label || ''}
          periods={periods}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}
