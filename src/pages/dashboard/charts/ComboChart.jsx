import React, { useState } from 'react';
import { formatINR, formatLakhs } from '../../../utils/formatters';

export default function ComboChart({ periods = [], categories = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Compute spend and MoM growth
  const items = periods.map((p, idx) => {
    let tot = 0;
    categories.forEach(c => { tot += (c.subtotal.amounts[p.id] || 0); });
    return {
      id: p.id,
      label: p.period_label,
      value: tot
    };
  });

  const comboData = items.map((it, idx) => {
    let growth = 0;
    if (idx > 0 && items[idx - 1].value > 0) {
      growth = ((it.value - items[idx - 1].value) / items[idx - 1].value) * 100;
    }
    return { ...it, growth };
  });

  const width = 800;
  const height = 300;
  const paddingX = 60;
  const paddingY = 40;

  const maxVal = Math.max(...comboData.map(d => d.value), 1) * 1.15;
  const maxGrowth = 40;
  const minGrowth = -10;
  const growthRange = maxGrowth - minGrowth;

  const colWidth = 44;
  const points = comboData.map((d, idx) => {
    const x = paddingX + (idx / Math.max(comboData.length - 1, 1)) * (width - 2 * paddingX);
    const colH = (d.value / maxVal) * (height - 2 * paddingY);
    const lineY = height - paddingY - ((d.growth - minGrowth) / growthRange) * (height - 2 * paddingY);
    return { ...d, x, colH, lineY };
  });

  const lineD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.lineY}` : `${acc} L ${curr.x} ${curr.lineY}`;
  }, '');

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            Expenditure vs Growth Rate (Combo Chart: Column + Line)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Bars = Total Monthly Spend (₹) • Line = MoM Percentage Growth Rate (%)
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', backgroundColor: '#f5f3ff', padding: '3px 8px', borderRadius: '4px' }}>
          • Combo Chart Style
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '600px' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = height - paddingY - pct * (height - 2 * paddingY);
            return (
              <line key={i} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
            );
          })}

          {/* Left Axis: Values in Lakhs */}
          <text x={paddingX - 10} y={paddingY - 5} textAnchor="end" fontSize="10.5" fill="#2563eb" fontWeight="700">Spend (₹)</text>
          {/* Right Axis: Growth % */}
          <text x={width - paddingX + 10} y={paddingY - 5} textAnchor="start" fontSize="10.5" fill="#dc2626" fontWeight="700">MoM %</text>

          {/* Columns */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={pt.id} onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
                <rect
                  x={pt.x - colWidth / 2}
                  y={height - paddingY - pt.colH}
                  width={colWidth}
                  height={pt.colH}
                  fill={isHovered ? '#1d4ed8' : '#3b82f6'}
                  rx={4}
                  style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
                />
                <text x={pt.x} y={height - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">
                  {pt.label}
                </text>
                <text x={pt.x} y={height - paddingY - pt.colH - 6} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#1e293b">
                  {formatLakhs(pt.value)}
                </text>
              </g>
            );
          })}

          {/* Line Overlay */}
          <path d={lineD} fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Line Markers */}
          {points.map((pt, idx) => (
            <g key={`marker-${pt.id}`}>
              <circle cx={pt.x} cy={pt.lineY} r={5} fill="#ffffff" stroke="#dc2626" strokeWidth={2.5} />
              <text x={pt.x} y={pt.lineY - 8} textAnchor="middle" fontSize="10" fontWeight="800" fill="#dc2626">
                {idx === 0 ? 'Base' : `${pt.growth >= 0 ? '+' : ''}${pt.growth.toFixed(1)}%`}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '14px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#3b82f6' }} />
          <span style={{ color: '#475569', fontWeight: '600' }}>Monthly Spend Column (Left Axis)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', backgroundColor: '#dc2626' }} />
          <span style={{ color: '#475569', fontWeight: '600' }}>MoM Growth % Overlay (Right Axis)</span>
        </div>
      </div>
    </div>
  );
}

