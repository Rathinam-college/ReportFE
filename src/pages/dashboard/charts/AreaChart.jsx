import React, { useState } from 'react';
import { formatINR, formatLakhs } from '../../../utils/formatters';

export default function AreaChart({ periods = [], categories = [] }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const points = periods.map(p => {
    let tot = 0;
    categories.forEach(c => { tot += (c.subtotal.amounts[p.id] || 0); });
    return {
      id: p.id,
      label: p.period_label,
      value: tot
    };
  });

  const width = 800;
  const height = 300;
  const paddingX = 60;
  const paddingY = 40;

  const maxVal = Math.max(...points.map(p => p.value), 1) * 1.15;
  const minVal = 0;
  const range = maxVal - minVal;

  const svgPoints = points.map((p, idx) => {
    const x = paddingX + (idx / Math.max(points.length - 1, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (p.value / range) * (height - 2 * paddingY);
    return { ...p, x, y };
  });

  const lineD = svgPoints.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${lineD} L ${svgPoints[svgPoints.length - 1].x} ${height - paddingY} L ${svgPoints[0].x} ${height - paddingY} Z`;

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            Cumulative Spending Volume (Area Chart)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Filled volume curve showing overall cost expansion across June to October
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '3px 8px', borderRadius: '4px' }}>
          • Area Chart Style
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '600px' }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = height - paddingY - pct * (height - 2 * paddingY);
            const val = pct * maxVal;
            return (
              <g key={i}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeDasharray="2 2" />
                <text x={paddingX - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                  {formatLakhs(val)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Top Line */}
          <path d={lineD} fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {svgPoints.map((pt, idx) => {
            const isHovered = hoveredPoint === idx;
            return (
              <g
                key={pt.id}
                onMouseEnter={() => setHoveredPoint(idx)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : 4.5}
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                />
                <text x={pt.x} y={height - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">
                  {pt.label}
                </text>
                <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a">
                  {formatLakhs(pt.value)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

