import React, { useState } from 'react';
import { formatINR, getPieSlicePath, getDonutSlicePath, DASH_COLORS } from '../../../utils/formatters';

export default function PieChart({ data = [], isDonut = false }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No data available for Pie Chart</div>;
  }

  const totalSum = data.reduce((acc, d) => acc + d.value, 0);

  // Compute angles
  let currentAngle = -Math.PI / 2;
  const slices = data.map((d, idx) => {
    const pct = totalSum > 0 ? (d.value / totalSum) * 100 : 0;
    const angle = totalSum > 0 ? (d.value / totalSum) * (2 * Math.PI) : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const path = isDonut
      ? getDonutSlicePath(160, 160, 130, 75, startAngle, endAngle)
      : getPieSlicePath(160, 160, 130, startAngle, endAngle);

    return {
      ...d,
      pct,
      color: d.color || DASH_COLORS[idx % DASH_COLORS.length],
      path
    };
  });

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            {isDonut ? 'Proportional Distribution (Doughnut Chart)' : 'Category Allocation (Pie Chart)'}
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Total Spend: <strong>{formatINR(totalSum)}</strong> • Hover over slices for details
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '4px' }}>
          • {isDonut ? 'Doughnut Chart Style' : 'Pie Chart Style'}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '30px',
        alignItems: 'center'
      }}>
        {/* SVG Circle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '320px', height: '320px' }}>
            <svg viewBox="0 0 320 320" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {slices.map((slice, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <path
                    key={slice.id || idx}
                    d={slice.path}
                    fill={slice.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      transformOrigin: '160px 160px',
                      transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : 'none'
                    }}
                  />
                );
              })}
            </svg>

            {/* Donut Center Display */}
            {isDonut && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                {hoveredIndex !== null ? (
                  <>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                      {slices[hoveredIndex].name}
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }} className="currency-font">
                      {formatINR(slices[hoveredIndex].value)}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb' }}>
                      {slices[hoveredIndex].pct.toFixed(1)}% Share
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Total Spend
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }} className="currency-font">
                      {formatINR(totalSum)}
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                      100% Volume
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Legend Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            Expenditure Proportions
          </h4>

          {slices.map((slice, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={slice.id || idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: isHovered ? '#f1f5f9' : '#fafafa',
                  border: isHovered ? `1.5px solid ${slice.color}` : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: slice.color }} />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{slice.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }} className="currency-font">
                      {formatINR(slice.value)}
                    </span>
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#2563eb', backgroundColor: '#eff6ff', padding: '1px 6px', borderRadius: '4px' }}>
                      {slice.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, slice.pct)}%`, height: '100%', backgroundColor: slice.color, borderRadius: '3px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

