import React from 'react';
import { formatINR, getDonutSlicePath } from '../../utils/formatters';

export default function CategoryPieChart({
  pieData,
  piePeriod,
  setPiePeriod,
  hoveredPieIndex,
  setHoveredPieIndex,
  computedMatrix
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Period Selector Toolbar for Pie Chart */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '14px 20px',
        border: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
            Show Pie Chart for:
          </span>

          <button
            type="button"
            onClick={() => setPiePeriod('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: piePeriod === 'all' ? '700' : '600',
              backgroundColor: piePeriod === 'all' ? '#0f172a' : '#f1f5f9',
              color: piePeriod === 'all' ? '#ffffff' : '#475569',
              border: piePeriod === 'all' ? '1px solid #0f172a' : '1px solid #cbd5e1',
              cursor: 'pointer'
            }}
          >
            All Cycles (5-Month Aggregate)
          </button>

          {computedMatrix?.periods?.map(p => {
            const isSel = piePeriod === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPiePeriod(p.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: isSel ? '700' : '600',
                  backgroundColor: isSel ? '#2563eb' : '#f1f5f9',
                  color: isSel ? '#ffffff' : '#475569',
                  border: isSel ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                  cursor: 'pointer'
                }}
              >
                {p.period_label}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
          Active View: {piePeriod === 'all' ? 'Full Aggregate Total' : computedMatrix?.periods?.find(p => p.id === piePeriod)?.period_label}
        </div>
      </div>

      {/* Main Pie & Legend Container */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #cbd5e1',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '30px',
        alignItems: 'center'
      }}>
        {/* SVG Donut Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '300px', height: '300px' }}>
            <svg viewBox="0 0 300 300" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              {pieData.map((slice, idx) => {
                const isHovered = hoveredPieIndex === idx;
                if (slice.value <= 0) return null;
                const rOuter = isHovered ? 132 : 124;
                const rInner = isHovered ? 68 : 74;
                const d = getDonutSlicePath(150, 150, rOuter, rInner, slice.startAngle, slice.endAngle);

                return (
                  <path
                    key={slice.id}
                    d={d}
                    fill={slice.color}
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 3 : 2}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: hoveredPieIndex !== null && !isHovered ? 0.6 : 1
                    }}
                    onMouseEnter={() => setHoveredPieIndex(idx)}
                    onMouseLeave={() => setHoveredPieIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Donut Center Hole Label */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              textAlign: 'center',
              padding: '10px'
            }}>
              {hoveredPieIndex !== null && pieData[hoveredPieIndex] ? (
                <>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    {pieData[hoveredPieIndex].name}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '2px 0' }} className="currency-font">
                    {formatINR(pieData[hoveredPieIndex].value)}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: pieData[hoveredPieIndex].color }}>
                    {pieData[hoveredPieIndex].percentage.toFixed(2)}%
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    {piePeriod === 'all' ? 'Aggregated Total' : computedMatrix?.periods?.find(p => p.id === piePeriod)?.period_label}
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '2px 0' }} className="currency-font">
                    {pieData.length > 0 ? formatINR(pieData[0].totalSum) : '—'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Hover slices for share
                  </span>
                </>
              )}
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', textAlign: 'center' }}>
            💡 Donut proportions automatically scale based on the selected cycle.
          </div>
        </div>

        {/* Interactive Legend with Breakdown Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            Category Proportions Breakdown
          </h3>

          {pieData.map((slice, idx) => {
            const isHovered = hoveredPieIndex === idx;
            return (
              <div
                key={slice.id}
                onMouseEnter={() => setHoveredPieIndex(idx)}
                onMouseLeave={() => setHoveredPieIndex(null)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: isHovered ? '#f1f5f9' : '#fafafa',
                  border: isHovered ? `1.5px solid ${slice.color}` : '1px solid #e2e8f0',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: slice.color, display: 'inline-block' }} />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{slice.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }} className="currency-font">
                      {formatINR(slice.value)}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', backgroundColor: '#eff6ff', padding: '1px 6px', borderRadius: '4px' }}>
                      {slice.percentage.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.max(0, slice.percentage))}%`, height: '100%', backgroundColor: slice.color, borderRadius: '3px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
