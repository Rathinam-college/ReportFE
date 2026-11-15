import React, { useState, useMemo } from 'react';
import { formatLakhs, formatINR } from '../../utils/formatters';

export default function StackedCategoryCard({
  periods = [],
  categories = [],
  activePeriod = 'all',
  selectedModule = 'transport',
  onSwitchChart = null,
  activeChart = 'stacked'
}) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Category Color Palette matching user's image (Blue, Purple, Orange, Green, Pink)
  const categoryPalette = [
    { fill: '#2563eb', name: 'Blue' },
    { fill: '#8b5cf6', name: 'Purple' },
    { fill: '#f97316', name: 'Orange' },
    { fill: '#10b981', name: 'Green' },
    { fill: '#ec4899', name: 'Pink' },
    { fill: '#06b6d4', name: 'Cyan' }
  ];

  // Calculate total for each period
  const periodTotals = useMemo(() => {
    return periods.map(p => {
      let tot = 0;
      categories.forEach(c => {
        tot += Number(c.subtotal?.amounts?.[p.id] ?? c.subtotal?.amounts?.[String(p.id)] ?? 0);
      });
      return tot;
    });
  }, [periods, categories]);

  // Max total across periods for scaling
  const maxPeriodTotal = useMemo(() => {
    const m = Math.max(...periodTotals, 1);
    return Math.ceil(m * 1.15); // Add 15% headroom for top label
  }, [periodTotals]);

  // Calculate category totals across all periods for legend
  const categorySummary = useMemo(() => {
    return categories.map((cat, idx) => {
      const color = categoryPalette[idx % categoryPalette.length].fill;
      let catTotal = 0;
      periods.forEach(p => {
        catTotal += Number(cat.subtotal?.amounts?.[p.id] ?? cat.subtotal?.amounts?.[String(p.id)] ?? 0);
      });
      return {
        id: cat.category_id,
        name: cat.category_name,
        color,
        total: catTotal
      };
    });
  }, [categories, periods]);

  // Generate 4-5 nice round Y-axis ticks in Lakhs
  const yTicks = useMemo(() => {
    const maxVal = maxPeriodTotal;
    const step = maxVal / 4;
    return [
      0,
      Math.round(step * 1),
      Math.round(step * 2),
      Math.round(step * 3),
      Math.round(maxVal)
    ];
  }, [maxPeriodTotal]);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '20px 22px 18px 22px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 1. CARD HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Monthly Expense by Category
          </h3>
          <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
            Stacked totals per month
          </p>
        </div>

        {onSwitchChart && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={() => onSwitchChart(activeChart === 'stacked' ? 'pie' : 'stacked')}
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              {activeChart === 'stacked' ? 'View Pie' : 'View Stacked'}
            </button>
          </div>
        )}
      </div>

      {/* 2. CHART AREA WITH Y-AXIS TICKS */}
      <div style={{
        position: 'relative',
        height: '240px',
        display: 'flex',
        alignItems: 'stretch',
        paddingLeft: '38px',
        paddingRight: '10px',
        paddingTop: '20px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {/* Y-Axis Labels */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: '20px',
          bottom: '24px',
          width: '32px',
          display: 'flex',
          flexDirection: 'column-reverse',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontSize: '10.5px',
          color: '#94a3b8',
          fontWeight: '600',
          paddingRight: '6px'
        }}>
          {yTicks.map((tick, tIdx) => (
            <span key={tIdx}>
              {tick === 0 ? '0L' : `${(tick / 100000).toFixed(0)}L`}
            </span>
          ))}
        </div>

        {/* Stacked Bars per Period */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          height: '100%',
          paddingBottom: '24px'
        }}>
          {periods.map((p, pIdx) => {
            const tot = periodTotals[pIdx];
            const barHeightPct = maxPeriodTotal > 0 ? (tot / maxPeriodTotal) * 100 : 0;

            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '58px',
                  position: 'relative'
                }}
              >
                {/* Total label above each stacked column */}
                <div style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#0f172a',
                  marginBottom: '6px',
                  whiteSpace: 'nowrap'
                }} className="currency-font">
                  {formatLakhs(tot)}
                </div>

                {/* Stacked bar cylinder */}
                <div style={{
                  width: '38px',
                  height: `${Math.max(barHeightPct * 1.7, 4)}px`,
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  borderRadius: '4px 4px 0 0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                }}>
                  {categories.map((cat, cIdx) => {
                    const val = Number(cat.subtotal?.amounts?.[p.id] ?? 0);
                    const segHeight = tot > 0 ? (val / tot) * 100 : 0;
                    const color = categoryPalette[cIdx % categoryPalette.length].fill;
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
                          opacity: hoveredCategory && !isHovered ? 0.45 : 1,
                          transition: 'all 0.15s ease',
                          cursor: 'pointer'
                        }}
                      />
                    );
                  })}
                </div>

                {/* X-Axis month label */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#475569'
                }}>
                  {p.period_label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CATEGORY LEGEND AT BOTTOM */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px 16px',
        alignItems: 'center',
        paddingTop: '2px'
      }}>
        {categorySummary.map((cat) => {
          const isHovered = hoveredCategory === cat.id;

          // Format spend: If >= 1 Cr, show Cr; else show Lakhs
          const formattedSpend = cat.total >= 10000000
            ? `₹${(cat.total / 10000000).toFixed(2)} Cr`
            : formatLakhs(cat.total);

          return (
            <div
              key={cat.id}
              onMouseEnter={() => setHoveredCategory(cat.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                cursor: 'pointer',
                opacity: hoveredCategory && !isHovered ? 0.5 : 1,
                transition: 'opacity 0.15s ease'
              }}
            >
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                backgroundColor: cat.color,
                display: 'inline-block'
              }} />
              <span style={{ color: '#334155', fontWeight: '600' }}>
                {cat.name} <strong style={{ color: '#0f172a' }}>({formattedSpend})</strong>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
