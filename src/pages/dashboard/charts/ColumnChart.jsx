import React, { useState } from 'react';
import { formatINR, formatLakhs, DASH_COLORS } from '../../../utils/formatters';

export default function ColumnChart({ periods = [], categories = [], activePeriod = 'all' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Compute column points based on periods
  const columnData = periods.map((p, idx) => {
    let periodTotal = 0;
    const periodRemarks = [];
    categories.forEach(cat => {
      periodTotal += (cat.subtotal.amounts[p.id] ?? cat.subtotal.amounts[String(p.id)] ?? 0);
      cat.items?.forEach(it => {
        const t = it.remarks?.[p.id] ?? it.remarks?.[String(p.id)];
        if (t && !t.startsWith('Entry via Operational Matrix') && !t.startsWith('Cloned from')) {
          periodRemarks.push(`${it.description}: ${t}`);
        }
      });
    });
    return {
      id: p.id,
      label: p.period_label,
      code: p.period_code,
      days: p.operating_days || 30,
      value: periodTotal,
      color: DASH_COLORS[idx % DASH_COLORS.length],
      remarks: periodRemarks
    };
  });

  const maxValue = Math.max(...columnData.map(d => d.value), 1);
  const totalSpend = columnData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            Monthly Expenditure (Vertical Column Chart)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Discrete monthly billing actuals • Total 5-Month Spend: <strong>{formatINR(totalSpend)}</strong>
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '4px' }}>
          • Column Chart Style
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: '280px',
        borderBottom: '2px solid #cbd5e1',
        paddingBottom: '16px',
        paddingTop: '30px'
      }}>
        {columnData.map((col, idx) => {
          const colHeight = (col.value / maxValue) * 200;
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={col.id}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              {col.remarks.length > 0 && (
                <span
                  title={`Operational Remarks for ${col.label}:\n${col.remarks.join('\n')}`}
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#92400e',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    marginBottom: '2px'
                  }}
                >
                  💬 {col.remarks.length} note{col.remarks.length > 1 ? 's' : ''}
                </span>
              )}

              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '800',
                  color: isHovered ? '#2563eb' : '#0f172a',
                  transition: 'color 0.15s ease'
                }}
                className="currency-font"
              >
                {formatINR(col.value)}
              </span>

              <div
                style={{
                  width: '64px',
                  height: `${Math.max(colHeight, 8)}px`,
                  backgroundColor: isHovered ? '#1d4ed8' : col.color,
                  borderRadius: '6px 6px 0 0',
                  boxShadow: isHovered ? '0 8px 16px -2px rgba(37,99,235,0.4)' : '0 2px 4px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease'
                }}
              />

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>{col.label}</div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>{col.days} Days</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '18px', fontSize: '12px', flexWrap: 'wrap' }}>
        {columnData.map((col) => (
          <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: col.color }} />
            <span style={{ color: '#475569', fontWeight: '600' }}>{col.label}: <strong>{formatLakhs(col.value)}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

