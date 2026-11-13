import React, { useState } from 'react';
import { formatINR, formatLakhs, DASH_COLORS } from '../../../utils/formatters';

export default function ScatterPlotChart({ items = [] }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!items || items.length === 0) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No data available for Scatter Plot</div>;
  }

  const width = 800;
  const height = 340;
  const paddingX = 70;
  const paddingY = 50;

  // X = Base Amount, Y = Target Amount
  const maxX = Math.max(...items.map(it => it.amtBase || 0), 1000000) * 1.1;
  const maxY = Math.max(...items.map(it => it.amtTarget || 0), 1000000) * 1.1;
  const maxCoordinate = Math.max(maxX, maxY);

  const points = items.map((it, idx) => {
    const x = paddingX + ((it.amtBase || 0) / maxCoordinate) * (width - 2 * paddingX);
    const y = height - paddingY - ((it.amtTarget || 0) / maxCoordinate) * (height - 2 * paddingY);
    return {
      ...it,
      x,
      y,
      color: DASH_COLORS[idx % DASH_COLORS.length]
    };
  });

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            Cost Head Correlation & Variance (Scatter Plot)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            X-Axis: Base Period Spend • Y-Axis: Target Period Spend • Above diagonal = Cost escalation
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#f59e0b', backgroundColor: '#fffbeb', padding: '3px 8px', borderRadius: '4px' }}>
          • Scatter Plot Style
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '600px' }}>
          {/* Axis Grid lines */}
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

          {/* 45-degree Equilibrium line (y = x) */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x={width - paddingX - 10} y={paddingY + 14} textAnchor="end" fontSize="10" fill="#94a3b8">
            y = x (0% Delta Line)
          </text>

          {/* Scatter Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredPoint === idx;
            const isSurge = (pt.diff || 0) > 0;

            return (
              <g
                key={pt.cost_head_id || idx}
                onMouseEnter={() => setHoveredPoint(idx)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 9 : 6}
                  fill={isSurge ? '#ef4444' : '#10b981'}
                  stroke="#ffffff"
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

      {hoveredPoint !== null && (
        <div style={{
          marginTop: '14px',
          padding: '12px 18px',
          borderRadius: '8px',
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{points[hoveredPoint].description}</strong>
            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>({points[hoveredPoint].category})</span>
          </div>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', color: '#475569' }}>
              Base: <strong>{formatINR(points[hoveredPoint].amtBase)}</strong>
            </span>
            <span style={{ fontSize: '12.5px', color: '#0f172a' }}>
              Target: <strong>{formatINR(points[hoveredPoint].amtTarget)}</strong>
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: points[hoveredPoint].diff >= 0 ? '#fef2f2' : '#f0fdf4',
              color: points[hoveredPoint].diff >= 0 ? '#b91c1c' : '#15803d'
            }}>
              {points[hoveredPoint].diff >= 0 ? '+' : ''}{formatINR(points[hoveredPoint].diff)} ({points[hoveredPoint].pct?.toFixed(1)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

