import React from 'react';

/**
 * HeroSummary Component
 * 3. Hero summary card (white, 20px radius, 1px soft border):
 *  - Small muted label: "Total expense · <period or selected month>"
 *  - Large number (~38px, bold, tight letter-spacing) = grand total for the selection
 *  - Under it, a muted line: avg per month for "All months" or ▲/▼ % change vs previous month
 *  - Full-width stacked share bar (16px tall, fully rounded, 2px gaps) with category colours and tooltips
 *  - Legend below with coloured dot, category name and % share
 */
export default function HeroSummary({
  selectedPeriod = 'all',
  selectedPeriodLabel = 'All months',
  grandTotal = 0,
  avgMonthly = 0,
  prevPeriodTotal = null,
  prevPeriodLabel = null,
  isFirstPeriod = false,
  categoryShares = [],
  formatCompact = (v) => String(v),
  formatFull = (v) => String(v)
}) {
  // Compute Month-over-Month change if a specific month is selected and previous month exists
  let momChangeNode = null;
  if (selectedPeriod === 'all') {
    momChangeNode = (
      <span title={`Average monthly expenditure across all cycles: ${formatFull(avgMonthly)}`}>
        Avg. <strong style={{ color: 'var(--text-main, #14172b)' }}>{formatCompact(avgMonthly)}</strong> / month
      </span>
    );
  } else if (isFirstPeriod) {
    momChangeNode = <span>First month of the period</span>;
  } else if (prevPeriodTotal !== null && prevPeriodTotal !== undefined) {
    if (prevPeriodTotal > 0) {
      const diff = grandTotal - prevPeriodTotal;
      const pct = ((grandTotal - prevPeriodTotal) / prevPeriodTotal) * 100;
      const isUp = pct > 0;
      const isZero = pct === 0;

      momChangeNode = (
        <span
          title={`Previous cycle (${prevPeriodLabel}): ${formatFull(prevPeriodTotal)} → Current: ${formatFull(grandTotal)}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <span style={{ color: isZero ? 'var(--text-muted, #6b7090)' : isUp ? '#10b981' : '#f43f5e', fontWeight: '700' }}>
            {isZero ? '— 0.0%' : isUp ? `▲ ${pct.toFixed(1)}%` : `▼ ${Math.abs(pct).toFixed(1)}%`}
          </span>
          <span>vs {prevPeriodLabel}</span>
        </span>
      );
    } else {
      momChangeNode = <span>New expenditure cycle</span>;
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card, #ffffff)',
        borderRadius: '20px',
        border: '1px solid var(--border-card, #e6e8f2)',
        padding: '24px 26px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Header & Big Total Row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'var(--text-muted, #6b7090)'
        }}>
          Total expense · {selectedPeriodLabel}
        </div>

        <div
          title={formatFull(grandTotal)}
          style={{
            fontSize: '38px',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: 'var(--text-main, #14172b)',
            cursor: 'default'
          }}
        >
          {formatCompact(grandTotal)}
        </div>

        {/* Subtitle / MoM comparison line */}
        <div style={{
          fontSize: '13px',
          color: 'var(--text-muted, #6b7090)',
          marginTop: '2px'
        }}>
          {momChangeNode}
        </div>
      </div>

      {/* Full-Width Stacked Share Bar (16px tall, fully rounded, 2px gaps) */}
      <div
        role="progressbar"
        aria-label="Category expenditure breakdown"
        aria-valuenow={100}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          width: '100%',
          height: '16px',
          borderRadius: '9999px',
          backgroundColor: 'var(--bg-pill, #eceefa)',
          display: 'flex',
          overflow: 'hidden',
          gap: '2px',
          padding: '0',
          boxSizing: 'border-box'
        }}
      >
        {categoryShares.map((cat) => {
          if (cat.percent <= 0) return null;

          return (
            <div
              key={cat.categoryId || cat.categoryName}
              title={`${cat.categoryName}: ${formatCompact(cat.amount)} (${cat.percent.toFixed(1)}%)`}
              style={{
                width: `${Math.max(0.5, cat.percent)}%`,
                height: '100%',
                backgroundColor: cat.color || '#5b5bf0',
                transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
            />
          );
        })}
      </div>

      {/* Category Legend with Coloured Dot, Name and % Share */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px 20px',
          paddingTop: '2px'
        }}
      >
        {categoryShares.map((cat) => (
          <div
            key={cat.categoryId || cat.categoryName}
            title={`${cat.categoryName}: ${formatFull(cat.amount)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              fontSize: '12.5px',
              cursor: 'default'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: cat.color || '#5b5bf0',
                flexShrink: 0
              }}
            />
            <span style={{ fontWeight: '600', color: 'var(--text-main, #14172b)' }}>
              {cat.categoryName}
            </span>
            <span style={{ color: 'var(--text-muted, #6b7090)', fontWeight: '500' }}>
              {cat.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
