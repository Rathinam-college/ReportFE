import React from 'react';
import { formatPeriodLabel } from '../../../utils/formatters';

/**
 * MonthPills Component
 * Horizontally scrollable row of rounded pill buttons: "All months" + one pill per month from data.
 * Active pill: solid indigo (#5b5bf0) with white text.
 * Inactive pills: light grey-lavender background (#eceefa).
 */
export default function MonthPills({
  periods = [],
  selectedPeriod = 'all',
  onSelectPeriod
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter expenditure by month"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        padding: '4px 2px 8px 2px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        width: '100%'
      }}
    >
      {/* "All months" Pill Button */}
      <button
        type="button"
        role="tab"
        aria-selected={selectedPeriod === 'all'}
        aria-pressed={selectedPeriod === 'all'}
        onClick={() => onSelectPeriod && onSelectPeriod('all')}
        style={{
          flexShrink: 0,
          padding: '8px 20px',
          borderRadius: '9999px',
          fontSize: '13px',
          fontWeight: selectedPeriod === 'all' ? '700' : '600',
          backgroundColor: selectedPeriod === 'all' ? 'var(--pill-active-bg, #5b5bf0)' : 'var(--bg-pill, #eceefa)',
          color: selectedPeriod === 'all' ? 'var(--pill-active-text, #ffffff)' : 'var(--text-main, #14172b)',
          border: '1px solid transparent',
          cursor: 'pointer',
          boxShadow: selectedPeriod === 'all' ? '0 4px 14px rgba(91, 91, 240, 0.35)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (selectedPeriod !== 'all') {
            e.currentTarget.style.backgroundColor = 'var(--bg-pill-hover, #e0e4f5)';
          }
        }}
        onMouseLeave={(e) => {
          if (selectedPeriod !== 'all') {
            e.currentTarget.style.backgroundColor = 'var(--bg-pill, #eceefa)';
          }
        }}
      >
        All months
      </button>

      {/* Dynamic Month Pills from Data */}
      {periods.map((period) => {
        const isSelected = String(selectedPeriod) === String(period.id);
        const rawLabel = period.period_label || period.label || period.period_code || 'Month';
        const label = (rawLabel.length <= 10 && rawLabel.includes("'")) ? rawLabel : formatPeriodLabel(period);

        return (
          <button
            key={period.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-pressed={isSelected}
            title={period.period_label || period.period_code}
            onClick={() => onSelectPeriod && onSelectPeriod(period.id)}
            style={{
              flexShrink: 0,
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: isSelected ? '700' : '600',
              backgroundColor: isSelected ? 'var(--pill-active-bg, #5b5bf0)' : 'var(--bg-pill, #eceefa)',
              color: isSelected ? 'var(--pill-active-text, #ffffff)' : 'var(--text-main, #14172b)',
              border: '1px solid transparent',
              cursor: 'pointer',
              boxShadow: isSelected ? '0 4px 14px rgba(91, 91, 240, 0.35)' : 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'var(--bg-pill-hover, #e0e4f5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'var(--bg-pill, #eceefa)';
              }
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
