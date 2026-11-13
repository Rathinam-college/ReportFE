import React from 'react';
import { formatINR } from '../../utils/formatters';
import { MessageSquare } from 'lucide-react';

export default function MatrixTable({
  computedMatrix,
  editingPeriodId,
  setEditingPeriodId,
  activePeriodObj,
  matrixDraft,
  remarksDraft = {},
  handleCellChange,
  handleRemarkChange
}) {
  if (!computedMatrix || !computedMatrix.categories) return null;

  const periods = computedMatrix.periods || [];
  const currentIdx = periods.findIndex(p => p.id === editingPeriodId);
  const prevPeriod = currentIdx > 0 ? periods[currentIdx - 1] : null;

  // Category Color Map
  const getCategoryTheme = (idx) => {
    const themes = [
      { dot: '#6366f1', badgeBg: '#eef2ff', badgeText: '#4338ca' }, // Food Material (Purple)
      { dot: '#10b981', badgeBg: '#ecfdf5', badgeText: '#047857' }, // Food Labour (Green)
      { dot: '#f59e0b', badgeBg: '#fffbeb', badgeText: '#b45309' }, // FC Maintenance (Amber)
      { dot: '#ec4899', badgeBg: '#fdf2f8', badgeText: '#be185d' }, // Events (Pink)
      { dot: '#8b5cf6', badgeBg: '#f5f3ff', badgeText: '#6d28d9' }  // Festival (Violet)
    ];
    return themes[idx % themes.length];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {computedMatrix.categories.map((cat, catIdx) => {
        const theme = getCategoryTheme(catIdx);
        const subtotalEditing = cat.subtotal?.amounts?.[editingPeriodId] || 0;

        return (
          <div
            key={cat.category_id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #eef2f6',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              overflow: 'hidden'
            }}
          >
            {/* CATEGORY CARD HEADER */}
            <div style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: theme.dot }} />
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {cat.category_name}
                </h3>
              </div>

              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '3px 12px',
                borderRadius: '9999px',
                backgroundColor: theme.badgeBg,
                color: theme.badgeText
              }}>
                Subtotal {activePeriodObj?.period_label?.replace(/'\d+/, '') || ''} <span className="currency-font">{formatINR(subtotalEditing)}</span>
              </div>
            </div>

            {/* CATEGORY ITEMS TABLE */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '11.5px', fontWeight: '600' }}>
                    <th style={{ padding: '10px 20px', textAlign: 'left', width: '22%' }}>Cost Head</th>
                    
                    {/* Previous Period Column */}
                    {prevPeriod && (
                      <th style={{ padding: '10px 14px', textAlign: 'right', width: '13%' }}>
                        {prevPeriod.period_label}
                      </th>
                    )}

                    {/* Active Editing Month Column */}
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '16%', color: '#4f46e5', fontWeight: '700' }}>
                      {activePeriodObj?.period_label} • Edit
                    </th>

                    {/* 5-mo trend mini sparkline */}
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: '11%' }}>
                      5-mo trend
                    </th>

                    {/* 5-mo total */}
                    <th style={{ padding: '10px 14px', textAlign: 'right', width: '13%' }}>
                      5-mo total
                    </th>

                    {/* Avg / mo */}
                    <th style={{ padding: '10px 14px', textAlign: 'right', width: '11%' }}>
                      Avg / mo
                    </th>

                    {/* Side Remark Column (Optional) */}
                    <th style={{ padding: '10px 16px', textAlign: 'left', width: '14%' }}>
                      Remark (Optional)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cat.items.map((row, idx) => {
                    const prevVal = prevPeriod ? (row.amounts[prevPeriod.id] || 0) : null;
                    const draftVal = matrixDraft[row.cost_head_id]?.[editingPeriodId];
                    const currentVal = row.amounts[editingPeriodId];
                    const activeVal = (draftVal !== undefined && draftVal !== null) ? draftVal : (currentVal !== null && currentVal !== undefined ? currentVal : '');

                    const rawRemark = remarksDraft[row.cost_head_id]?.[editingPeriodId] ?? 
                                      remarksDraft[row.cost_head_id]?.[String(editingPeriodId)] ?? 
                                      row.remarks?.[editingPeriodId] ?? 
                                      row.remarks?.[String(editingPeriodId)] ?? '';
                    const remarkVal = (rawRemark && !rawRemark.startsWith('Entry via Operational Matrix') && !rawRemark.startsWith('Cloned from')) ? rawRemark : '';

                    // Generate mini 5-bar heights based on history
                    const sparkHeights = periods.slice(0, 5).map(p => {
                      const v = row.amounts[p.id] || 0;
                      return v > 0 ? Math.max(6, Math.min(20, Math.round((v / (row.total || 1)) * 36))) : 4;
                    });

                    return (
                      <tr
                        key={row.cost_head_id}
                        style={{
                          borderBottom: idx === cat.items.length - 1 ? 'none' : '1px solid #f8fafc',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* Cost Head Name */}
                        <td style={{ padding: '12px 20px', fontWeight: '600', color: '#1e293b' }}>
                          {row.description}
                        </td>

                        {/* Previous Month Value */}
                        {prevPeriod && (
                          <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }} className="currency-font">
                            {formatINR(prevVal)}
                          </td>
                        )}

                        {/* Active Editing Month Input */}
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={activeVal}
                            onChange={(e) => handleCellChange(row.cost_head_id, editingPeriodId, e.target.value)}
                            disabled={activePeriodObj?.is_closed}
                            style={{
                              width: '100%',
                              maxWidth: '130px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1.5px solid #6366f1',
                              backgroundColor: '#ffffff',
                              textAlign: 'right',
                              fontWeight: '700',
                              fontSize: '13px',
                              color: '#0f172a',
                              outline: 'none',
                              boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.08)'
                            }}
                            className="currency-font"
                          />
                        </td>

                        {/* 5-mo trend Sparkline */}
                        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '3px', height: '20px' }}>
                            {sparkHeights.map((h, sIdx) => {
                              const isCurrent = sIdx === sparkHeights.length - 1;
                              return (
                                <span
                                  key={sIdx}
                                  style={{
                                    width: '5px',
                                    height: `${h}px`,
                                    backgroundColor: isCurrent ? '#4f46e5' : '#cbd5e1',
                                    borderRadius: '2px'
                                  }}
                                  title={`${periods[sIdx]?.period_label}: ${formatINR(row.amounts[periods[sIdx]?.id])}`}
                                />
                              );
                            })}
                          </div>
                        </td>

                        {/* 5-mo total */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }} className="currency-font">
                          {formatINR(row.total)}
                        </td>

                        {/* Avg / mo */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }} className="currency-font">
                          {formatINR(row.avg)}
                        </td>

                        {/* Side Remark Input (Optional) */}
                        <td style={{ padding: '8px 16px', textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="text"
                              placeholder="Add remark..."
                              value={remarkVal}
                              onChange={(e) => handleRemarkChange?.(row.cost_head_id, editingPeriodId, e.target.value)}
                              disabled={activePeriodObj?.is_closed}
                              style={{
                                width: '100%',
                                padding: '5px 8px',
                                borderRadius: '4px',
                                border: remarkVal ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                                backgroundColor: remarkVal ? '#f5f7ff' : '#ffffff',
                                fontSize: '11.5px',
                                color: '#1e293b',
                                outline: 'none'
                              }}
                            />
                            {remarkVal && (
                              <span title={`Remark: ${remarkVal}`} style={{ color: '#4f46e5', display: 'flex', alignItems: 'center' }}>
                                <MessageSquare size={13} />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        );
      })}
    </div>
  );
}
