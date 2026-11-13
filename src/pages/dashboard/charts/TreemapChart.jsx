import React, { useState } from 'react';
import { formatINR, formatLakhs, DASH_COLORS } from '../../../utils/formatters';

export default function TreemapChart({ items = [] }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  if (!items || items.length === 0) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No data available for Treemap</div>;
  }

  // Sort descending
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const totalSum = sorted.reduce((acc, it) => acc + it.value, 0);

  // Group by category to color code
  const catColorMap = {};
  let colorIdx = 0;
  sorted.forEach(it => {
    if (!catColorMap[it.category]) {
      catColorMap[it.category] = DASH_COLORS[colorIdx % DASH_COLORS.length];
      colorIdx++;
    }
  });

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            Expenditure Distribution (Treemap)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Tile size proportional to total expense volume • Total: <strong>{formatINR(totalSum)}</strong>
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', backgroundColor: '#ecfdf5', padding: '3px 8px', borderRadius: '4px' }}>
          • Treemap Style
        </span>
      </div>

      {/* Treemap Grid Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridAutoRows: '75px',
        gap: '6px',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {sorted.map((item, idx) => {
          const pct = totalSum > 0 ? (item.value / totalSum) * 100 : 0;
          const color = catColorMap[item.category] || '#2563eb';
          const isHovered = hoveredItem === item.name;

          // Compute grid span based on percentage share
          let colSpan = 3;
          let rowSpan = 2;
          if (pct >= 50) {
            colSpan = 8;
            rowSpan = 4;
          } else if (pct >= 20) {
            colSpan = 4;
            rowSpan = 4;
          } else if (pct >= 10) {
            colSpan = 4;
            rowSpan = 2;
          } else if (pct >= 5) {
            colSpan = 3;
            rowSpan = 2;
          } else if (pct >= 2) {
            colSpan = 3;
            rowSpan = 1;
          } else {
            colSpan = 2;
            rowSpan = 1;
          }

          return (
            <div
              key={item.id || idx}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                gridColumn: `span ${colSpan}`,
                gridRow: `span ${rowSpan}`,
                backgroundColor: color,
                borderRadius: '6px',
                padding: '10px 12px',
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                filter: isHovered ? 'brightness(1.15) contrast(1.1)' : 'none',
                boxShadow: isHovered ? '0 8px 16px rgba(0,0,0,0.2)' : 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div>
                <span style={{ fontSize: '10px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                  {item.category}
                </span>
                <strong style={{ fontSize: pct > 20 ? '14px' : '12px', fontWeight: '800', lineHeight: 1.2, display: 'block', marginTop: '2px' }}>
                  {item.name}
                </strong>
              </div>

              <div>
                <div style={{ fontSize: pct > 20 ? '16px' : '13px', fontWeight: '800' }} className="currency-font">
                  {formatINR(item.value)}
                </div>
                <span style={{ fontSize: '11px', opacity: 0.9, fontWeight: '700' }}>
                  {pct.toFixed(1)}% Share
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Color Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
        {Object.entries(catColorMap).map(([catName, color]) => (
          <div key={catName} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: color }} />
            <span style={{ color: '#475569', fontWeight: '600' }}>{catName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

