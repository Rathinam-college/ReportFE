import React, { useState } from 'react';
import { formatINR, DASH_COLORS } from '../../../utils/formatters';

export default function BarChart({ data = [], title = "Category Expenditure (Horizontal Bar Chart)" }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No data available for Bar Chart</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const totalSum = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{title}</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Ranked horizontal bars • Total: <strong>{formatINR(totalSum)}</strong>
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '4px' }}>
          • Bar Chart Style
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {data.map((item, idx) => {
          const pctOfMax = (item.value / maxValue) * 100;
          const pctOfTotal = totalSum > 0 ? (item.value / totalSum) * 100 : 0;
          const isHovered = hoveredIndex === idx;
          const color = item.color || DASH_COLORS[idx % DASH_COLORS.length];

          return (
            <div
              key={item.id || idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: isHovered ? '#f8fafc' : '#ffffff',
                border: isHovered ? `1.5px solid ${color}` : '1px solid #f1f5f9',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', width: '22px' }}>#{idx + 1}</span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color }} />
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>{item.name}</span>
                  {item.remarks && item.remarks.length > 0 && (
                    <span
                      title={`Operational Remarks:\n${item.remarks.join('\n')}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'help'
                      }}
                    >
                      💬 {item.remarks.length === 1 ? item.remarks[0] : `${item.remarks.length} remarks`}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }} className="currency-font">
                    {formatINR(item.value)}
                  </span>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#2563eb', backgroundColor: '#eff6ff', padding: '2px 7px', borderRadius: '4px' }}>
                    {pctOfTotal.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div style={{ width: '100%', height: '14px', backgroundColor: '#f1f5f9', borderRadius: '7px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.max(pctOfMax, 1.5)}%`,
                    height: '100%',
                    backgroundColor: color,
                    borderRadius: '7px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

