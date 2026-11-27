import React, { useState, useEffect, useMemo } from 'react';
import { formatINR, formatLakhs, formatPeriodLabel } from '../../../utils/formatters';
import { Wallet } from 'lucide-react';
import { CANONICAL_FOOD_BUDGET_HEADS, FOOD_MONTH_COLS } from '../../data_entry/food_budget/FoodBudgetEntrySection';

const mapFoodPeriodToColKey = (pObj) => {
  if (!pObj) return null;
  const label = `${pObj.period_code || ''} ${pObj.period_label || ''}`.toLowerCase();
  if (label.includes('jun') || label.includes('-06')) return 'jun_26_actual';
  if (label.includes('jul') || label.includes('-07')) return 'jul_26_actual';
  if (label.includes('aug') || label.includes('-08')) return 'aug_26_actual';
  if (label.includes('sep') || label.includes('-09')) return 'sep_26_actual';
  if (label.includes('oct') || label.includes('-10')) return 'oct_26_actual';
  if (label.includes('nov') || label.includes('-11')) return 'nov_26_actual';
  if (label.includes('dec') || label.includes('-12')) return 'dec_26_actual';
  const found = FOOD_MONTH_COLS.find(c => String(c.periodId) === String(pObj.id));
  if (found) return found.key;
  return `period_${pObj.id}_actual`;
};

const getFoodMonthVal = (row, col) => {
  if (!row || !col) return 0;
  if (row[col.key] !== undefined && row[col.key] !== null) {
    return Number(row[col.key]) || 0;
  }
  if (row.monthly_actuals && col.periodId && row.monthly_actuals[String(col.periodId)] !== undefined) {
    return Number(row.monthly_actuals[String(col.periodId)]) || 0;
  }
  return 0;
};

export default function FoodBudgetChartSection({
  computedMatrix,
  periods = [],
  activePeriod = 'all',
  onPeriodChange
}) {
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [monthFilter, setMonthFilter] = useState('all'); // 'all' | 'recorded'

  // 1. Fetch live budget data from PostgreSQL or fallback
  const fetchBudget = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/food/budget-tracking');
      const data = await res.json();
      if (data && data.status === 'success' && Array.isArray(data.items)) {
        setBudgetData(data.items);
      } else {
        setBudgetData(CANONICAL_FOOD_BUDGET_HEADS);
      }
    } catch (err) {
      console.warn('[FoodBudgetChart] Fetch error, using canonical:', err);
      setBudgetData(CANONICAL_FOOD_BUDGET_HEADS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (computedMatrix?.food_budget_tracking && Array.isArray(computedMatrix.food_budget_tracking) && computedMatrix.food_budget_tracking.length > 0) {
      setBudgetData(computedMatrix.food_budget_tracking);
    }
    fetchBudget();
  }, [computedMatrix?.food_budget_tracking, activePeriod]);

  // Dynamic month columns derived from live periods (or canonical FOOD_MONTH_COLS fallback)
  const allFoodMonthCols = useMemo(() => {
    if (periods && periods.length > 0) {
      return periods.map(p => ({
        key: mapFoodPeriodToColKey(p),
        label: formatPeriodLabel(p),
        periodId: String(p.id)
      }));
    }
    return FOOD_MONTH_COLS;
  }, [periods]);

  // Determine active month column
  const activeColKey = useMemo(() => {
    if (!activePeriod || activePeriod === 'all') return 'all';
    const byId = allFoodMonthCols.find(c => String(c.periodId) === String(activePeriod));
    if (byId) return byId.key;
    const pObj = periods.find(p => String(p.id) === String(activePeriod));
    return mapFoodPeriodToColKey(pObj) || 'oct_26_actual';
  }, [activePeriod, periods, allFoodMonthCols]);

  // Visible month columns based on filter pill ('all' shows every month, 'recorded' hides empty non-active months)
  const visibleMonthCols = useMemo(() => {
    if (monthFilter === 'recorded') {
      return allFoodMonthCols.filter(m => {
        const isCurrentActive = activeColKey !== 'all' && m.key === activeColKey;
        const hasSpend = budgetData.some(r => getFoodMonthVal(r, m) > 0);
        return isCurrentActive || hasSpend;
      });
    }
    return allFoodMonthCols;
  }, [allFoodMonthCols, monthFilter, activeColKey, budgetData]);

  // Period label for display
  const activePeriodLabel = useMemo(() => {
    if (activePeriod === 'all') return 'All Months (Cumulative)';
    const pObj = periods.find(p => String(p.id) === String(activePeriod));
    return pObj ? formatPeriodLabel(pObj) : "Oct'26";
  }, [activePeriod, periods]);

  const periodRangeLabel = useMemo(() => {
    if (visibleMonthCols && visibleMonthCols.length > 0) {
      return `${visibleMonthCols[0].label} – ${visibleMonthCols[visibleMonthCols.length - 1].label}`;
    }
    return "Jun'26 – Oct'26";
  }, [visibleMonthCols]);

  // Calculate actual spend for a row depending on active month filter (for KPI cards)
  const getHeadActual = (row) => {
    if (activeColKey === 'all') {
      return allFoodMonthCols.reduce((sum, col) => sum + getFoodMonthVal(row, col), 0);
    }
    const colObj = allFoodMonthCols.find(c => c.key === activeColKey) || { key: activeColKey, periodId: String(activePeriod) };
    return getFoodMonthVal(row, colObj);
  };

  // Calculate budget target for a row depending on active month filter (for KPI cards)
  const getHeadBudget = (row) => {
    if (activeColKey === 'all') {
      return Number(row.sanctioned_amount) || 0;
    }
    return Number(row.sanctioned_amount ? row.sanctioned_amount / 12 : (row.month_limit || 0));
  };

  // Executive Totals
  const totalSanctionedBudget = useMemo(() => {
    return budgetData.reduce((acc, r) => acc + (Number(r.sanctioned_amount) || 0), 0);
  }, [budgetData]);

  const totalMonthlyLimit = useMemo(() => {
    return totalSanctionedBudget / 12;
  }, [totalSanctionedBudget]);

  const totalCurrentActual = useMemo(() => {
    return budgetData.reduce((acc, r) => acc + getHeadActual(r), 0);
  }, [budgetData, activeColKey, allFoodMonthCols]);

  const allVisibleMonthsActualSum = useMemo(() => {
    return budgetData.reduce((acc, r) => {
      return acc + visibleMonthCols.reduce((mAcc, m) => mAcc + getFoodMonthVal(r, m), 0);
    }, 0);
  }, [budgetData, visibleMonthCols]);

  const currentBudgetTarget = activeColKey === 'all' ? totalSanctionedBudget : totalMonthlyLimit;
  const isOverallUnderBudget = totalCurrentActual <= currentBudgetTarget;
  const overallUtilizationPct = currentBudgetTarget > 0 ? ((totalCurrentActual / currentBudgetTarget) * 100).toFixed(1) : 0;

  // Palette for 8 Heads
  const HEAD_COLORS = [
    { primary: '#d97706', border: '#f59e0b', bg: '#fefce8' }, // 1. Food Material (Golden)
    { primary: '#4f46e5', border: '#6366f1', bg: '#eef2ff' }, // 2. Salary (Indigo)
    { primary: '#0284c7', border: '#38bdf8', bg: '#f0f9ff' }, // 3. Contract Labour (Sky Blue)
    { primary: '#db2777', border: '#f472b6', bg: '#fdf2f8' }, // 4. Catering Vendor (Pink)
    { primary: '#ea580c', border: '#fb923c', bg: '#fff7ed' }, // 5. FC Maint/Power (Orange)
    { primary: '#7c3aed', border: '#a78bfa', bg: '#f5f3ff' }, // 6. Event/Add Food (Purple)
    { primary: '#059669', border: '#34d399', bg: '#ecfdf5' }, // 7. Food Festival (Emerald)
    { primary: '#0d9488', border: '#2dd4bf', bg: '#f0fdfa' }  // 8. Staff Welfare (Teal)
  ];

  return (
    <section style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      
      {/* 3. OFFICIAL FOOD BUDGET TRACKING LEDGER */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #E1E6F2',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(20, 36, 92, 0.04)'
      }}>
        {/* Formal Ledger Header */}
        <div style={{
          backgroundColor: 'var(--primary, #14245C)',
          padding: '20px 24px 16px 24px',
          borderBottom: '3px solid var(--accent, #F5A524)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: 'rgba(251,191,36,0.15)',
              border: '2px solid rgba(251,191,36,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Wallet size={22} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                Budget Allocation &amp; Expenditure Ledger
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Month Column Filter Toggle */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.28)',
              borderRadius: '9999px',
              padding: '3px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <button
                type="button"
                onClick={() => setMonthFilter('all')}
                style={{
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: monthFilter === 'all' ? '800' : '600',
                  backgroundColor: monthFilter === 'all' ? '#ffffff' : 'transparent',
                  color: monthFilter === 'all' ? '#1e1b4b' : '#c7d2fe',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                All Months ({allFoodMonthCols.length})
              </button>
              <button
                type="button"
                onClick={() => setMonthFilter('recorded')}
                style={{
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: monthFilter === 'recorded' ? '800' : '600',
                  backgroundColor: monthFilter === 'recorded' ? '#ffffff' : 'transparent',
                  color: monthFilter === 'recorded' ? '#1e1b4b' : '#c7d2fe',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Active &amp; Recorded Only
              </button>
            </div>

            {/* KPI Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase' }}>Sanctioned Budget</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#86efac' }} className="currency-font">{formatINR(totalSanctionedBudget)}</div>
                </div>
                <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase' }}>Total Spent</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#fbbf24' }} className="currency-font">{formatINR(allVisibleMonthsActualSum)}</div>
                </div>
                <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase' }}>Balance</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#67e8f9' }} className="currency-font">{formatINR(totalSanctionedBudget - allVisibleMonthsActualSum)}</div>
                </div>
              </div>
              <div style={{
                fontSize: '10.5px', fontWeight: '700',
                color: allVisibleMonthsActualSum <= totalSanctionedBudget ? '#86efac' : '#fca5a5',
                backgroundColor: allVisibleMonthsActualSum <= totalSanctionedBudget ? 'rgba(134,239,172,0.12)' : 'rgba(252,165,165,0.12)',
                border: `1px solid ${allVisibleMonthsActualSum <= totalSanctionedBudget ? 'rgba(134,239,172,0.3)' : 'rgba(252,165,165,0.3)'}`,
                padding: '2px 10px', borderRadius: '9999px'
              }}>
                {totalSanctionedBudget > 0 ? ((allVisibleMonthsActualSum / totalSanctionedBudget) * 100).toFixed(1) : '0.0'}% Utilized &nbsp;{allVisibleMonthsActualSum <= totalSanctionedBudget ? '\u2713 Within Budget' : '\u26a0 Over Budget'}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Ledger Matrix Table */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '980px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                <th colSpan={3} style={{ padding: '7px 14px', textAlign: 'left', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', borderRight: '2px solid #cbd5e1' }}>
                  Budget Head Details
                </th>
                <th colSpan={visibleMonthCols.length} style={{ padding: '7px 14px', textAlign: 'center', fontSize: '10px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em', borderRight: '2px solid #cbd5e1', backgroundColor: '#eff6ff' }}>
                  Month-wise Actual Expenditure (&#8377;)
                </th>
                <th colSpan={3} style={{ padding: '7px 14px', textAlign: 'center', fontSize: '10px', fontWeight: '800', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: '#ecfdf5' }}>
                  Summary
                </th>
              </tr>
              <tr style={{ backgroundColor: '#1e293b', color: '#f8fafc', fontWeight: '800', fontSize: '11px' }}>
                <th style={{ padding: '11px 10px', width: '44px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>S.No</th>
                <th style={{ padding: '11px 14px', textAlign: 'left', minWidth: '220px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Budget Head Name</th>
                <th style={{ padding: '11px 14px', textAlign: 'right', minWidth: '130px', backgroundColor: '#064e3b', color: '#6ee7b7', borderRight: '2px solid rgba(255,255,255,0.15)' }}>
                  Sanctioned Amount (&#8377;)
                </th>
                {visibleMonthCols.map((m) => {
                  const isActive = activeColKey !== 'all' && m.key === activeColKey;
                  return (
                    <th key={m.key} style={{
                      padding: '11px 10px',
                      textAlign: 'right',
                      minWidth: '96px',
                      fontWeight: isActive ? '900' : '700',
                      backgroundColor: isActive ? '#1e3a8a' : 'transparent',
                      color: isActive ? '#93c5fd' : '#94a3b8',
                      borderBottom: isActive ? '3px solid #3b82f6' : 'none',
                      borderRight: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span>{m.label}</span>
                        {isActive && (
                          <span style={{ fontSize: '8px', fontWeight: '900', backgroundColor: '#3b82f6', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                <th style={{ padding: '11px 14px', textAlign: 'right', minWidth: '125px', backgroundColor: '#0c4a6e', color: '#7dd3fc', borderLeft: '2px solid rgba(255,255,255,0.15)' }}>
                  TOTAL SPENT (&#8377;)
                </th>
                <th style={{ padding: '11px 14px', textAlign: 'right', minWidth: '125px', backgroundColor: '#064e3b', color: '#6ee7b7' }}>
                  BALANCE (&#8377;)
                </th>
                <th style={{ padding: '11px 14px', textAlign: 'center', minWidth: '95px', backgroundColor: '#3b0764', color: '#d8b4fe' }}>
                  % UTILIZED
                </th>
              </tr>
            </thead>
            <tbody>
              {budgetData.map((row, idx) => {
                const sanc = Number(row.sanctioned_amount) || 0;
                const totalSpent = visibleMonthCols.reduce((acc, m) => acc + getFoodMonthVal(row, m), 0);
                const balance = sanc - totalSpent;
                const isOver = totalSpent > sanc && sanc > 0;
                const utilPct = sanc > 0 ? ((totalSpent / sanc) * 100) : 0;
                const theme = HEAD_COLORS[idx % HEAD_COLORS.length];

                return (
                  <tr key={row.budget_head || idx} style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafbfc',
                    transition: 'background 0.12s ease'
                  }}>
                    <td style={{ padding: '11px 10px', textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '24px', height: '24px', borderRadius: '7px',
                        backgroundColor: theme.bg, color: theme.primary,
                        fontSize: '11px', fontWeight: '800', border: `1px solid ${theme.border}`
                      }}>
                        {idx + 1}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: '700', color: '#0f172a', borderRight: '1px solid #f1f5f9' }}>
                      {row.budget_head}
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: '800', color: '#166534', backgroundColor: '#f0fdf4', borderRight: '2px solid #bbf7d0' }} className="currency-font">
                      {formatINR(sanc)}
                    </td>

                    {/* Individual Month Columns */}
                    {visibleMonthCols.map((m) => {
                      const mVal = getFoodMonthVal(row, m);
                      const isActive = activeColKey !== 'all' && m.key === activeColKey;
                      return (
                        <td key={m.key} style={{
                          padding: '11px 10px',
                          textAlign: 'right',
                          fontWeight: isActive ? '900' : (mVal > 0 ? '600' : '500'),
                          backgroundColor: isActive ? '#eff6ff' : 'transparent',
                          color: mVal > 0 ? (isActive ? '#1e40af' : '#334155') : '#cbd5e1',
                          borderRight: '1px solid #f1f5f9'
                        }} className="currency-font">
                          {mVal > 0 ? formatINR(mVal) : '—'}
                        </td>
                      );
                    })}

                    {/* Summary Columns */}
                    <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: '800', color: totalSpent > 0 ? '#0369a1' : '#94a3b8', backgroundColor: '#f0f9ff', borderLeft: '2px solid #bae6fd' }} className="currency-font">
                      {totalSpent > 0 ? formatINR(totalSpent) : '₹0'}
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: '800', color: isOver ? '#A32626' : '#0F6B3A', backgroundColor: isOver ? '#FBE3E3' : '#E4F6EC' }} className="currency-font">
                      {isOver ? `-${formatINR(Math.abs(balance))}` : formatINR(balance)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', backgroundColor: '#fafbff' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: '9999px',
                        fontSize: '11.5px', fontWeight: '800',
                        backgroundColor: utilPct > 100 ? '#FBE3E3' : utilPct >= 80 ? '#FFF1DD' : '#E4F6EC',
                        color: utilPct > 100 ? '#A32626' : utilPct >= 80 ? '#8A4A00' : '#0F6B3A',
                        border: `1px solid ${utilPct > 100 ? '#f5bcbc' : utilPct >= 80 ? '#f7d7a3' : '#b7e8cc'}`
                      }}>
                        {utilPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#FFF8EA', borderTop: '3px solid var(--accent, #F5A524)', borderBottom: '2px solid var(--accent, #F5A524)', fontWeight: '900', color: 'var(--primary, #14245C)' }}>
                <td style={{ padding: '13px 10px', textAlign: 'center', fontSize: '14px' }}>&sum;</td>
                <td style={{ padding: '13px 14px', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Grand Total &mdash; All Budget Heads
                </td>
                <td style={{ padding: '13px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '900', color: '#0F6B3A', backgroundColor: '#E4F6EC', borderRight: '2px solid #b7e8cc' }} className="currency-font">
                  {formatINR(totalSanctionedBudget)}
                </td>
                {visibleMonthCols.map((m) => {
                  const mSum = budgetData.reduce((acc, r) => acc + getFoodMonthVal(r, m), 0);
                  const isActive = activeColKey !== 'all' && m.key === activeColKey;
                  return (
                    <td key={m.key} style={{
                      padding: '13px 10px',
                      textAlign: 'right',
                      fontSize: '13px',
                      fontWeight: '900',
                      backgroundColor: isActive ? '#FEF0C7' : '#FFF8EA',
                      color: mSum > 0 ? 'var(--primary, #14245C)' : '#8A4A00',
                      borderRight: '1px solid rgba(245, 165, 36, 0.35)'
                    }} className="currency-font">
                      {mSum > 0 ? formatINR(mSum) : '—'}
                    </td>
                  );
                })}
                <td style={{ padding: '13px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '900', color: 'var(--primary, #14245C)', backgroundColor: '#EDF2FF', borderLeft: '2px solid #cbd5e1' }} className="currency-font">
                  {formatINR(allVisibleMonthsActualSum)}
                </td>
                <td style={{ padding: '13px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '900', color: allVisibleMonthsActualSum <= totalSanctionedBudget ? '#0F6B3A' : '#A32626', backgroundColor: allVisibleMonthsActualSum <= totalSanctionedBudget ? '#E4F6EC' : '#FBE3E3' }} className="currency-font">
                  {allVisibleMonthsActualSum <= totalSanctionedBudget ? formatINR(totalSanctionedBudget - allVisibleMonthsActualSum) : `-${formatINR(Math.abs(totalSanctionedBudget - allVisibleMonthsActualSum))}`}
                </td>
                <td style={{ padding: '13px 14px', textAlign: 'center', backgroundColor: '#FFF8EA' }}>
                  <span style={{
                    display: 'inline-block', padding: '4px 12px', borderRadius: '9999px',
                    fontSize: '12px', fontWeight: '900',
                    backgroundColor: 'var(--accent, #F5A524)', color: 'var(--primary, #14245C)',
                    border: '1.5px solid #d98a0b'
                  }}>
                    {totalSanctionedBudget > 0 ? ((allVisibleMonthsActualSum / totalSanctionedBudget) * 100).toFixed(1) : '0.0'}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </section>
  );
}