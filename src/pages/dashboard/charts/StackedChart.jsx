import React, { useState } from 'react';
import { formatINR, formatLakhs, DASH_COLORS } from '../../../utils/formatters';

export default function StackedChart({ periods = [], categories = [] }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Compute total for each period
  const periodTotals = periods.map(p => {
    let tot = 0;
    categories.forEach(c => { tot += (c.subtotal.amounts[p.id] || 0); });
    return tot;
  });
  const maxPeriodTotal = Math.max(...periodTotals, 1);

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            Category Breakdown (Stacked Column / Bar Chart)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Stacked composition showing raw material, manpower, and maintenance proportions per month
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#8b5cf6', backgroundColor: '#f5f3ff', padding: '3px 8px', borderRadius: '4px' }}>
          • Stacked Bar / Column Style
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: '300px',
        borderBottom: '2px solid #cbd5e1',
        paddingBottom: '16px',
        paddingTop: '30px'
      }}>
        {periods.map((p, pIdx) => {
          const tot = periodTotals[pIdx];

          return (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }} className="currency-font">
                {formatLakhs(tot)}
              </span>

              {/* Stacked bar container */}
              <div style={{
                width: '60px',
                height: `${(tot / maxPeriodTotal) * 210}px`,
                display: 'flex',
                flexDirection: 'column-reverse',
                borderRadius: '6px 6px 0 0',
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}>
                {categories.map((cat, cIdx) => {
                  const val = cat.subtotal.amounts[p.id] || 0;
                  const segHeight = tot > 0 ? (val / tot) * 100 : 0;
                  const color = DASH_COLORS[cIdx % DASH_COLORS.length];
                  const isHovered = hoveredCategory === cat.category_id;

                  return (
                    <div
                      key={cat.category_id}
                      onMouseEnter={() => setHoveredCategory(cat.category_id)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      title={`${cat.category_name} (${p.period_label}): ${formatINR(val)}`}
                      style={{
                        height: `${segHeight}%`,
                        backgroundColor: color,
                        opacity: isHovered ? 1 : 0.9,
                        filter: isHovered ? 'brightness(1.15)' : 'none',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer'
                      }}
                    />
                  );
                })}
              </div>

              <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                {p.period_label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
        {categories.map((cat, idx) => {
          const color = DASH_COLORS[idx % DASH_COLORS.length];
          const isHovered = hoveredCategory === cat.category_id;

          return (
            <div
              key={cat.category_id}
              onMouseEnter={() => setHoveredCategory(cat.category_id)}
              onMouseLeave={() => setHoveredCategory(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: isHovered ? '#f1f5f9' : 'transparent',
                cursor: 'pointer'
              }}
            >
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color }} />
              <span style={{ fontSize: '12px', fontWeight: isHovered ? '800' : '600', color: '#334155' }}>
                {cat.category_name} ({formatLakhs(cat.subtotal.total)})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

