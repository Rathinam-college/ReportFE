import React, { useState } from 'react';
import { formatINR, formatLakhs, DASH_COLORS } from '../../../utils/formatters';

export default function BubbleChart({ items = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!items || items.length === 0) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No data available for Bubble Chart</div>;
  }

  const width = 800;
  const height = 340;
  const paddingX = 70;
  const paddingY = 50;

  const maxX = Math.max(...items.map(it => it.amtBase || 0), 1000000) * 1.15;
  const maxY = Math.max(...items.map(it => it.amtTarget || 0), 1000000) * 1.15;
  const maxCoordinate = Math.max(maxX, maxY);
  const maxTotal = Math.max(...items.map(it => (it.amtBase || 0) + (it.amtTarget || 0)), 1);

  // Categories
  const catColorMap = {};
  let colorIdx = 0;
  items.forEach(it => {
    if (!catColorMap[it.category]) {
      catColorMap[it.category] = DASH_COLORS[colorIdx % DASH_COLORS.length];
      colorIdx++;
    }
  });

  const bubbles = items.map((it, idx) => {
    const x = paddingX + ((it.amtBase || 0) / maxCoordinate) * (width - 2 * paddingX);
    const y = height - paddingY - ((it.amtTarget || 0) / maxCoordinate) * (height - 2 * paddingY);
    const totalVolume = (it.amtBase || 0) + (it.amtTarget || 0);
    // Radius between 6 and 28 px
    const r = 6 + (totalVolume / maxTotal) * 22;
    return {
      ...it,
      x,
      y,
      r,
      totalVolume,
      color: catColorMap[it.category] || '#2563eb'
    };
  });

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            Multi-Dimensional Expense Weight (Bubble Chart)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            X = Base Spend • Y = Target Spend • Bubble Radius = Cumulative Volume • Color = Category
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#ec4899', backgroundColor: '#fdf2f8', padding: '3px 8px', borderRadius: '4px' }}>
          • Bubble Chart Style
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '600px' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = height - paddingY - pct * (height - 2 * paddingY);
            const x = paddingX + pct * (width - 2 * paddingX);
            const val = pct * maxCoordinate;
            return (
              <g key={i}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1={x} y1={paddingY} x2={x} y2={height - paddingY} stroke="#f1f5f9" strokeDasharray="3 3" />
                <text x={paddingX - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                  {formatLakhs(val)}
                </text>
                <text x={x} y={height - paddingY + 16} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                  {formatLakhs(val)}
                </text>
              </g>
            );
          })}

          {/* Bubbles */}
          {bubbles.map((b, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g
                key={b.cost_head_id || idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={b.x}
                  cy={b.y}
                  r={isHovered ? b.r + 3 : b.r}
                  fill={b.color}
                  fillOpacity={isHovered ? 0.85 : 0.65}
                  stroke={b.color}
                  strokeWidth={2}
                  style={{ transition: 'all 0.15s ease' }}
                />
              </g>
            );
          })}

          {/* Axis Labels */}
          <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#475569">
            Base Period Spend (₹)
          </text>
          <text x={20} y={height / 2} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#475569" transform={`rotate(-90 20 ${height / 2})`}>
            Target Period Spend (₹)
          </text>
        </svg>
      </div>

      {hoveredIndex !== null && (
        <div style={{
          marginTop: '14px',
          padding: '12px 18px',
          borderRadius: '8px',
          backgroundColor: '#fdf2f8',
          border: '1px solid #fbcfe8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <strong style={{ fontSize: '13.5px', color: '#831843' }}>{bubbles[hoveredIndex].description}</strong>
            <span style={{ fontSize: '12px', color: '#9d174d', marginLeft: '8px' }}>({bubbles[hoveredIndex].category})</span>
          </div>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', color: '#475569' }}>
              Base: <strong>{formatINR(bubbles[hoveredIndex].amtBase)}</strong>
            </span>
            <span style={{ fontSize: '12.5px', color: '#0f172a' }}>
              Target: <strong>{formatINR(bubbles[hoveredIndex].amtTarget)}</strong>
            </span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#be185d' }}>
              Volume: {formatINR(bubbles[hoveredIndex].totalVolume)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

