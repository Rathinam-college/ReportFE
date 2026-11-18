import React, { useState } from 'react';
import { formatINR, formatLakhs } from '../../../utils/formatters';

export default function ColumnChart({ periods = [], categories = [], activePeriod = 'all' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Compute column points based on periods
  const columnData = periods.map((p) => {
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
      remarks: periodRemarks
    };
  });

  const maxValue = Math.max(...columnData.map(d => d.value), 1);
  const totalSpend = columnData.reduce((acc, d) => acc + d.value, 0);

  // Active highlighted period: either hovered, or activePeriod matching id, or latest period
  const defaultHighlightIdx = columnData.findIndex(d => String(d.id) === String(activePeriod));
  const activeIdx = hoveredIndex !== null 
    ? hoveredIndex 
    : (defaultHighlightIdx !== -1 ? defaultHighlightIdx : (columnData.length > 0 ? columnData.length - 1 : 0));

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Monthly Expenditure Trend (Vertical Column Chart)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Discrete monthly billing actuals • Total Spend: <strong>{formatINR(totalSpend)}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff6088' }} />
            <span style={{ fontWeight: '600', color: '#1a1d36' }}>Focus Cycle</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6c56db' }} />
            <span style={{ fontWeight: '600', color: '#6e768e' }}>Recorded Actuals</span>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: '280px',
        borderBottom: '2px solid #f1f5f9',
        paddingBottom: '16px',
        paddingTop: '40px',
        position: 'relative'
      }}>
        {columnData.map((col, idx) => {
          const colHeight = (col.value / maxValue) * 190;
          const isHighlighted = idx === activeIdx;

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
                transition: 'all 0.2s ease',
                position: 'relative',
                transform: isHighlighted ? 'scale(1.03)' : 'scale(1)'
              }}
            >
              {/* PinHome Floating Tooltip Card above focus bar */}
              {isHighlighted && (
                <div style={{
                  position: 'absolute',
                  bottom: `${Math.max(colHeight, 12) + 50}px`,
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  border: '1px solid #f1f5f9',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#6c56db' }} className="currency-font">
                    {formatINR(col.value)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#8f9bb3', fontWeight: '600' }}>
                    Total per cycle
                  </div>
                </div>
              )}

              {col.remarks.length > 0 && !isHighlighted && (
                <span
                  title={`Operational Remarks for ${col.label}:\n${col.remarks.join('\n')}`}
                  style={{
                    fontSize: '10.5px',
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
                  fontSize: '11.5px',
                  fontWeight: '800',
                  color: isHighlighted ? '#ff6088' : '#8f9bb3',
                  transition: 'color 0.15s ease'
                }}
                className="currency-font"
              >
                {formatINR(col.value)}
              </span>

              {/* Column Bar */}
              <div
                style={{
                  width: '58px',
                  height: `${Math.max(colHeight, 10)}px`,
                  backgroundColor: isHighlighted ? '#ff6088' : '#6c56db',
                  borderRadius: '12px 12px 0 0',
                  boxShadow: isHighlighted ? '0 8px 18px rgba(255, 96, 136, 0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              />

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: isHighlighted ? '800' : '700', color: isHighlighted ? '#0f172a' : '#475569' }}>
                  {col.label}
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  {col.days} Days
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '18px', fontSize: '12px', flexWrap: 'wrap' }}>
        {columnData.map((col, idx) => (
          <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '2px',
              backgroundColor: idx === activeIdx ? '#fcd34d' : '#bfe8f6'
            }} />
            <span style={{ color: '#475569', fontWeight: '600' }}>
              {col.label}: <strong>{formatLakhs(col.value)}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
