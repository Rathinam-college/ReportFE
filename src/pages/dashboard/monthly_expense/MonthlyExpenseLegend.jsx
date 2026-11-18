import React from 'react';
import { formatPeriodLabel } from '../../../utils/formatters';

export default function MonthlyExpenseLegend({
  chartModel,
  months = [],
  categories = [],
  monthPalette = ['#6c5ce7', '#ff6b9d', '#1fbf8f', '#3fb8ff', '#f5a524'],
  categoryPalette = ['#6c5ce7', '#ff6b9d', '#1fbf8f', '#3fb8ff', '#f5a524']
}) {
  // Determine if this chart model uses month series or category series
  const isMonthSeries = chartModel === 'clustered_columns' || chartModel === 'radar_profile';

  const legendItems = isMonthSeries
    ? months.map((m, idx) => ({
        id: m.id || idx,
        label: formatPeriodLabel(m),
        fullLabel: m.period_label || m.period_code || `Month ${idx + 1}`,
        color: monthPalette[idx % monthPalette.length]
      }))
    : categories.map((cat, idx) => ({
        id: cat.category_id || cat.id || idx,
        label: cat.category_name || cat.name,
        color: categoryPalette[idx % categoryPalette.length]
      }));

  if (legendItems.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '10px 14px',
        borderTop: '1px solid #f1f4fb',
        marginTop: '6px'
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#6a7392',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}
      >
        {isMonthSeries ? 'Recorded Cycles:' : 'Categories:'}
      </span>
      {legendItems.map((item) => (
        <div
          key={item.id}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#141a33',
            fontWeight: '600'
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '3px',
              backgroundColor: item.color,
              display: 'inline-block'
            }}
          />
          <span title={item.fullLabel || item.label}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
