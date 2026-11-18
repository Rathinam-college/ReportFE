import React from 'react';

export default function MonthlyExpenseTable({
  months = [],
  categories = [],
  matrixValues = {}, // { [monthId]: { [categoryId]: number } }
  monthTotals = {},  // { [monthId]: number }
  categoryTotals = {}, // { [categoryId]: number }
  cycleTotal = 0,
  monthlyAverage = 0,
  formatValue,
  monthPalette = ['#6c5ce7', '#ff6b9d', '#1fbf8f', '#3fb8ff', '#f5a524']
}) {
  const monthCount = months.length || 1;

  return (
    <div
      style={{
        width: '100%',
        marginTop: '16px',
        borderTop: '1px solid #e4e8f5',
        paddingTop: '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#141a33', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Monthly Expense Values Sheet
        </h4>
        <span style={{ fontSize: '11px', color: '#6a7392', fontWeight: '600' }}>
          Scroll horizontally for all categories
        </span>
      </div>

      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          borderRadius: '12px',
          border: '1px solid #e4e8f5',
          backgroundColor: '#ffffff',
          scrollbarWidth: 'thin'
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: `${Math.max(680, 200 + categories.length * 140)}px`,
            borderCollapse: 'collapse',
            fontSize: '12.5px',
            textAlign: 'left'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
              <th
                style={{
                  padding: '10px 14px',
                  fontWeight: '800',
                  color: '#475569',
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#f8fafc',
                  zIndex: 2,
                  boxShadow: '1px 0 0 #e2e8f0'
                }}
              >
                Billing period / cycle
              </th>
              {categories.map((cat) => (
                <th
                  key={cat.category_id || cat.id}
                  style={{
                    padding: '10px 14px',
                    fontWeight: '800',
                    color: '#475569',
                    textAlign: 'right',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat.category_name || cat.name}
                </th>
              ))}
              <th
                style={{
                  padding: '10px 14px',
                  fontWeight: '800',
                  color: '#0f172a',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  backgroundColor: '#f1f5f9'
                }}
              >
                Period Total (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {months.map((m, mIdx) => {
              const mId = m.id;
              const pTotal = monthTotals[mId] || 0;
              const squareColor = monthPalette[mIdx % monthPalette.length];

              return (
                <tr
                  key={mId || mIdx}
                  style={{
                    borderBottom: '1px solid #f1f4fb',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafbfe')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Period Label with Coloured Square */}
                  <td
                    style={{
                      padding: '10px 14px',
                      fontWeight: '700',
                      color: '#141a33',
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: '#ffffff',
                      zIndex: 1,
                      boxShadow: '1px 0 0 #f1f4fb'
                    }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '3px',
                          backgroundColor: squareColor,
                          display: 'inline-block',
                          flexShrink: 0
                        }}
                      />
                      <span>{m.period_label || m.period_code || `Month ${mIdx + 1}`}</span>
                    </div>
                  </td>

                  {/* Category Cells */}
                  {categories.map((cat) => {
                    const cId = cat.category_id || cat.id;
                    const val = matrixValues[mId]?.[cId] ?? 0;
                    const isZero = !val || Number(val) === 0;

                    // Collect remarks for this category in this month
                    const cellRemarks = [];
                    (cat.items || []).forEach((it) => {
                      const r = it.remarks?.[mId] ?? it.remarks?.[String(mId)];
                      if (r && typeof r === 'string' && r.trim() && !r.startsWith('Entry via Operational Matrix') && !r.startsWith('Cloned from') && !r.startsWith('Re-cloned')) {
                        cellRemarks.push({
                          name: it.description || it.name || 'Item',
                          text: r.trim()
                        });
                      }
                    });
                    const hasCellRemarks = cellRemarks.length > 0;
                    const cellTooltip = hasCellRemarks
                      ? `${cat.category_name || cat.name}: ${formatValue(val)}\n\n💬 Operational Remarks:\n${cellRemarks.map(cr => `• ${cr.name}: "${cr.text}"`).join('\n')}`
                      : `${cat.category_name || cat.name}: ${formatValue(val)}`;

                    return (
                      <td
                        key={cId}
                        title={cellTooltip}
                        style={{
                          padding: '10px 14px',
                          textAlign: 'right',
                          fontWeight: isZero ? '500' : '600',
                          color: isZero ? '#94a3b8' : '#141a33',
                          fontVariantNumeric: 'tabular-nums',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                          {hasCellRemarks && (
                            <span style={{ fontSize: '10.5px', color: '#d97706', cursor: 'help' }} title={cellTooltip}>💬</span>
                          )}
                          <span>{isZero ? '₹0' : formatValue(val)}</span>
                        </div>
                      </td>
                    );
                  })}

                  {/* Period Total */}
                  <td
                    style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      fontWeight: '800',
                      color: '#0f172a',
                      backgroundColor: '#f8fafc',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatValue(pTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer Rows: Monthly Average & Cycle Total */}
          <tfoot>
            {/* 1. Monthly Average */}
            <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
              <td
                style={{
                  padding: '10px 14px',
                  fontWeight: '800',
                  color: '#475569',
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#f8fafc',
                  zIndex: 1,
                  boxShadow: '1px 0 0 #e2e8f0'
                }}
              >
                Monthly Average
              </td>
              {categories.map((cat) => {
                const cId = cat.category_id || cat.id;
                const cTot = categoryTotals[cId] || 0;
                const cAvg = monthCount > 0 ? cTot / monthCount : 0;
                const isZero = !cAvg || Number(cAvg) === 0;

                return (
                  <td
                    key={cId}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      fontWeight: '700',
                      color: isZero ? '#94a3b8' : '#334155',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isZero ? '₹0' : formatValue(cAvg)}
                  </td>
                );
              })}
              <td
                style={{
                  padding: '10px 14px',
                  textAlign: 'right',
                  fontWeight: '800',
                  color: '#0f172a',
                  backgroundColor: '#eef2ff',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap'
                }}
              >
                {formatValue(monthlyAverage)}
              </td>
            </tr>

            {/* 2. Cycle Total (Highlighted in Accent #5b5bf0) */}
            <tr
              style={{
                backgroundColor: '#eff2fe',
                borderTop: '1px solid #c7d2fe',
                borderBottom: '1px solid #c7d2fe'
              }}
            >
              <td
                style={{
                  padding: '12px 14px',
                  fontWeight: '900',
                  color: '#5b5bf0',
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#eff2fe',
                  zIndex: 1,
                  boxShadow: '1px 0 0 #c7d2fe',
                  fontSize: '13px'
                }}
              >
                Cycle Total
              </td>
              {categories.map((cat) => {
                const cId = cat.category_id || cat.id;
                const cTot = categoryTotals[cId] || 0;
                const isZero = !cTot || Number(cTot) === 0;

                return (
                  <td
                    key={cId}
                    style={{
                      padding: '12px 14px',
                      textAlign: 'right',
                      fontWeight: '800',
                      color: isZero ? '#94a3b8' : '#141a33',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isZero ? '₹0' : formatValue(cTot)}
                  </td>
                );
              })}
              <td
                style={{
                  padding: '12px 14px',
                  textAlign: 'right',
                  fontWeight: '900',
                  color: '#5b5bf0',
                  backgroundColor: '#e0e7ff',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                  fontSize: '13.5px'
                }}
              >
                {formatValue(cycleTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
