import React, { useState } from 'react';
import { formatPeriodLabel } from '../../../utils/formatters';

/**
 * CategoryCard Component
 * 4. Category cards grid:
 *  - Top row: coloured dot + category name on left, "xx.x% of total" on right in muted text
 *  - Big amount (~24px, bold) = category total for selection
 *  - Mini sparkline (46px tall), one bar per month, bar height relative to that category's max month.
 *    Selected month: full opacity (1). Others: 28% opacity (0.28). "All months": all full opacity.
 *    Tooltip: "<Month>: ₹<full value>"
 *  - "▾ details" hint at bottom right
 *  - On click expands in place (with dashed divider) to show line items with thin 7px progress bars
 *  - Lift card by 2px on hover
 *  - Keyboard focusable (Enter / Space toggles)
 */
export default function CategoryCard({
  category,
  periods = [],
  selectedPeriod = 'all',
  selectedAmount = 0,
  selectedPercent = 0,
  monthlyAmounts = {},
  maxMonthlyAmount = 1,
  isExpanded = false,
  onToggleExpand,
  formatCompact = (v) => String(v),
  formatFull = (v) => String(v),
  hidePercentage = false,
  remarksDraft = {}
}) {
  const color = category.color || '#5b5bf0';
  const categoryName = category.categoryName || category.name || 'Category';
  const items = category.items || [];
  const [hoveredBarPeriod, setHoveredBarPeriod] = useState(null);

  // Collect all user remarks/comments for a given period across items in this category
  const getMonthRemarks = (pId) => {
    const list = [];
    items.forEach((it) => {
      const chId = it.cost_head_id || it.id;
      const r = remarksDraft?.[chId]?.[pId] ??
                remarksDraft?.[chId]?.[String(pId)] ??
                it.remarks?.[pId] ??
                it.remarks?.[String(pId)];
      if (r && typeof r === 'string' && r.trim() && !r.startsWith('Entry via Operational Matrix') && !r.startsWith('Cloned from') && !r.startsWith('Re-cloned')) {
        list.push({
          itemName: it.description || it.name || 'Cost Head',
          text: r.trim()
        });
      }
    });
    return list;
  };

  // Keyboard accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleExpand && onToggleExpand(category.categoryId);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card, #ffffff)',
        borderRadius: '18px',
        border: '1px solid var(--border-card, #e6e8f2)',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        outline: 'none',
        transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
        boxSizing: 'border-box'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div>
        {/* Top Row: Coloured Dot + Category Name on Left, % of Total on Right */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflow: 'hidden'
          }}>
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: color,
                flexShrink: 0
              }}
            />
            <span
              title={categoryName}
              style={{
                fontSize: '14px',
                fontWeight: '700',
                color: 'var(--text-main, #14172b)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {categoryName}
            </span>
          </div>

          {!hidePercentage && (
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-muted, #6b7090)',
              flexShrink: 0
            }}>
              {selectedPercent > 0 ? `${selectedPercent.toFixed(1)}% of total` : '0.0% of total'}
            </span>
          )}
        </div>

        {/* Big Amount: Category Total for Selection */}
        <div
          title={formatFull(selectedAmount)}
          style={{
            fontSize: '24px',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            color: 'var(--text-main, #14172b)',
            lineHeight: 1.25,
            marginTop: '4px'
          }}
        >
          {selectedAmount > 0 ? formatCompact(selectedAmount) : '—'}
        </div>

        {/* Monthly Trend Bars: Value on Top, Bar in Middle, Month Label Under */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '6px',
            marginTop: '12px',
            marginBottom: '8px',
            padding: '2px 0'
          }}
        >
          {periods.map((p, mIdx) => {
            const mVal = Number(monthlyAmounts[p.id] || 0);
            const isCurrentMonthSelected = String(selectedPeriod) === String(p.id);
            const isAllSelected = selectedPeriod === 'all';
            const opacity = (isAllSelected || isCurrentMonthSelected) ? 1 : 0.35;
            const safeMax = maxMonthlyAmount > 0 ? maxMonthlyAmount : 1;
            const barHeightPct = Math.min(100, Math.max(12, (mVal / safeMax) * 100));

            // Extract any remarks/comments for this month in this category
            const monthRemarks = getMonthRemarks(p.id);
            const hasRemarks = monthRemarks.length > 0;
            const remarkSummary = hasRemarks
              ? monthRemarks.map(m => `• ${m.itemName}: "${m.text}"`).join('\n')
              : 'No remarks recorded';
            const tooltipTitle = hasRemarks
              ? `${p.period_label || p.period_code}: ${formatFull(mVal)}\n\n💬 Remarks / Comments:\n${remarkSummary}`
              : `${p.period_label || p.period_code}: ${formatFull(mVal)}`;

            // Smart tooltip positioning so it never clips off-card
            const isFirstBar = mIdx === 0;
            const isLastBar = mIdx === periods.length - 1;
            let tooltipLeft = '50%';
            let tooltipTransform = 'translateX(-50%)';
            let tooltipRight = 'auto';

            if (isFirstBar) {
              tooltipLeft = '0';
              tooltipRight = 'auto';
              tooltipTransform = 'none';
            } else if (isLastBar) {
              tooltipLeft = 'auto';
              tooltipRight = '0';
              tooltipTransform = 'none';
            }

            return (
              <div
                key={p.id}
                title={tooltipTitle}
                onMouseEnter={() => setHoveredBarPeriod(p.id)}
                onMouseLeave={() => setHoveredBarPeriod(null)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  minWidth: 0,
                  position: 'relative'
                }}
              >
                {/* Floating Tooltip Card with Remarks on Hover */}
                {hoveredBarPeriod === p.id && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: tooltipLeft,
                      right: tooltipRight,
                      transform: tooltipTransform,
                      marginBottom: '8px',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      zIndex: 100,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      pointerEvents: 'none',
                      minWidth: '160px',
                      maxWidth: '260px',
                      whiteSpace: 'normal',
                      textAlign: 'left',
                      border: '1px solid #334155'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      borderBottom: '1px solid #334155',
                      paddingBottom: '5px',
                      marginBottom: '5px'
                    }}>
                      <span style={{ fontWeight: '800', color: '#94a3b8', fontSize: '11.5px' }}>
                        {p.period_label || p.period_code}
                        {formatPeriodLabel(p) !== (p.period_label || p.period_code) ? ` (${formatPeriodLabel(p)})` : ''}
                      </span>
                      <span style={{ fontWeight: '900', color: '#38bdf8', fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>
                        {formatFull(mVal)}
                      </span>
                    </div>

                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '10px' }}>💬</span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          color: hasRemarks ? '#fbbf24' : '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          {hasRemarks ? 'Remarks / Notes:' : 'Remarks:'}
                        </span>
                      </div>

                      {hasRemarks ? (
                        monthRemarks.map((r, rIdx) => (
                          <div key={rIdx} style={{ fontSize: '10.5px', color: '#f1f5f9', lineHeight: '1.35', paddingLeft: '4px' }}>
                            <span style={{ fontWeight: '700', color: '#cbd5e1' }}>{r.itemName}: </span>
                            <span style={{ fontStyle: 'italic', color: '#fef08a' }}>"{r.text}"</span>
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', paddingLeft: '4px' }}>
                          No remarks recorded for {p.period_label || 'this month'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Top: Value of that month */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '9.5px',
                    fontWeight: '700',
                    color: isCurrentMonthSelected ? color : 'var(--text-main, #14172b)',
                    opacity: opacity,
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}
                >
                  {hasRemarks && <span style={{ fontSize: '9px', lineHeight: 1 }} title="Has operational remarks">💬</span>}
                  <span>{mVal > 0 ? formatCompact(mVal) : '₹0'}</span>
                </span>

                {/* Middle Bar Container */}
                <div
                  style={{
                    width: '100%',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'flex-end'
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${barHeightPct}%`,
                      backgroundColor: color,
                      opacity: opacity,
                      borderRadius: '4px 4px 2px 2px',
                      transition: 'height 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease'
                    }}
                  />
                </div>

                {/* Under: Month label */}
                <span
                  style={{
                    fontSize: periods.length > 8 ? '8.5px' : '9.5px',
                    fontWeight: isCurrentMonthSelected ? '800' : '600',
                    color: isCurrentMonthSelected ? color : 'var(--text-muted, #6b7090)',
                    opacity: opacity,
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}
                  title={p.period_label || p.period_code}
                >
                  {formatPeriodLabel(p)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Line Items View - Always Open */}
      <div
        style={{
          marginTop: '14px',
          paddingTop: '14px',
          borderTop: '1px dashed var(--border-card, #e6e8f2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {items.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #6b7090)', fontStyle: 'italic' }}>
            No individual line items
          </div>
        ) : (
          items.map((it) => {
            let itAmount = 0;
            if (selectedPeriod === 'all') {
              itAmount = Number(it.total || 0);
            } else {
              itAmount = Number(it.amounts?.[selectedPeriod] ?? it.amounts?.[String(selectedPeriod)] ?? 0);
            }

            const safeCategoryTotal = selectedAmount > 0 ? selectedAmount : 1;
            const itemSharePct = selectedAmount > 0 ? Math.min(100, Math.max(0, (itAmount / safeCategoryTotal) * 100)) : 0;
            const hasValue = itAmount > 0;

            // Collect remarks for this line item
            const itemRemarks = [];
            const chId = it.cost_head_id || it.id;
            if (selectedPeriod === 'all') {
              periods.forEach((p) => {
                const pid = p.id;
                const rText = remarksDraft?.[chId]?.[pid] ??
                              remarksDraft?.[chId]?.[String(pid)] ??
                              it.remarks?.[pid] ??
                              it.remarks?.[String(pid)];
                if (rText && typeof rText === 'string' && rText.trim() && !rText.startsWith('Entry via Operational Matrix') && !rText.startsWith('Cloned from') && !rText.startsWith('Re-cloned')) {
                  itemRemarks.push({
                    periodLabel: p.period_label || p.period_code || pid,
                    text: rText.trim()
                  });
                }
              });
            } else {
              const rText = remarksDraft?.[chId]?.[selectedPeriod] ??
                            remarksDraft?.[chId]?.[String(selectedPeriod)] ??
                            it.remarks?.[selectedPeriod] ??
                            it.remarks?.[String(selectedPeriod)];
              if (rText && typeof rText === 'string' && rText.trim() && !rText.startsWith('Entry via Operational Matrix') && !rText.startsWith('Cloned from') && !rText.startsWith('Re-cloned')) {
                const pObj = periods.find(p => String(p.id) === String(selectedPeriod));
                itemRemarks.push({
                  periodLabel: pObj?.period_label || pObj?.period_code || selectedPeriod,
                  text: rText.trim()
                });
              }
            }

            const hasItemRemarks = itemRemarks.length > 0;
            const itemTooltip = hasItemRemarks
              ? `${it.description || it.name}: ${formatFull(itAmount)}\n\n💬 Remarks: ${itemRemarks.map(r => `[${r.periodLabel}] "${r.text}"`).join('; ')}`
              : `${it.description || it.name}: ${formatFull(itAmount)}`;

            return (
              <div key={it.cost_head_id || it.id || it.description} title={itemTooltip} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12.5px'
                }}>
                  <span style={{
                    color: 'var(--text-main, #14172b)',
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '65%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {hasItemRemarks && <span style={{ fontSize: '10px' }} title="Has remark">💬</span>}
                    <span>{it.description || it.name}</span>
                  </span>
                  <span
                    style={{
                      fontWeight: '700',
                      color: hasValue ? 'var(--text-main, #14172b)' : 'var(--text-muted, #6b7090)'
                    }}
                  >
                    {hasValue ? formatCompact(itAmount) : '—'}
                  </span>
                </div>

                {/* Thin 7px Progress Bar */}
                <div
                  style={{
                    width: '100%',
                    height: '7px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--bg-pill, #eceefa)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    title={`${it.description}: ${itemSharePct.toFixed(1)}% of ${categoryName}`}
                    style={{
                      width: hasValue ? `${itemSharePct}%` : '0%',
                      height: '100%',
                      borderRadius: '9999px',
                      backgroundColor: color,
                      transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                </div>

                {/* Inline Remark Pill if Present */}
                {hasItemRemarks && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    color: '#92400e',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '5px',
                    padding: '2px 8px',
                    marginTop: '2px'
                  }}>
                    <span style={{ fontSize: '9px' }}>💬</span>
                    <span style={{ fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {itemRemarks.map(r => `${r.periodLabel ? `${r.periodLabel}: ` : ''}"${r.text}"`).join(' • ')}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
