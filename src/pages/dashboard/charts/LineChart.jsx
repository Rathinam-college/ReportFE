import React, { useState } from 'react';
import { formatINR, formatLakhs } from '../../../utils/formatters';

export default function LineChart({ periods = [], categories = [] }) {
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

  const maxVal = Math.max(...points.map(p => p.value), 1) * 1.1;
  const minVal = Math.min(...points.map(p => p.value), 0) * 0.9;
  const range = maxVal - minVal || 1;

  const svgPoints = points.map((p, idx) => {
    const x = paddingX + (idx / Math.max(points.length - 1, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((p.value - minVal) / range) * (height - 2 * paddingY);
    return { ...p, x, y };
  });

  const pathD = svgPoints.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  // Average
  const avgVal = points.reduce((acc, p) => acc + p.value, 0) / (points.length || 1);
  const avgY = height - paddingY - ((avgVal - minVal) / range) * (height - 2 * paddingY);

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            Spending Trajectory & Run-Rate (Line Chart)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            5-Month cost curvature with baseline average: <strong>{formatINR(avgVal)}</strong>
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '4px' }}>
          • Line Chart Style
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '600px' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = height - paddingY - pct * (height - 2 * paddingY);
            const val = minVal + pct * range;
            return (
              <g key={i}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x={paddingX - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                  {formatLakhs(val)}
                </text>
              </g>
            );
          })}

          {/* Average Reference Line */}
          <line x1={paddingX} y1={avgY} x2={width - paddingX} y2={avgY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" />
          <text x={width - paddingX} y={avgY - 6} textAnchor="end" fontSize="10.5" fill="#d97706" fontWeight="700">
            5-Mo Avg Baseline ({formatLakhs(avgVal)})
          </text>

          {/* Main Trajectory Line */}
          <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
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
                  r={isHovered ? 8 : 5}
                  fill="#ffffff"
                  stroke="#2563eb"
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  style={{ transition: 'all 0.15s ease' }}
                />

                <text x={pt.x} y={height - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">
                  {pt.label}
                </text>

                <text x={pt.x} y={pt.y - 12} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a" fontFamily="monospace">
                  {formatLakhs(pt.value)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hoveredPoint !== null && (
        <div style={{
          marginTop: '12px',
          padding: '10px 16px',
          borderRadius: '8px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>
            Selected: {points[hoveredPoint].label}
          </span>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e40af' }} className="currency-font">
            Verified Total: {formatINR(points[hoveredPoint].value)}
          </span>
        </div>
      )}
    </div>
  );
}

