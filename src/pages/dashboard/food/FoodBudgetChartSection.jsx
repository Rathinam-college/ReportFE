import React, { useState, useEffect, useMemo } from 'react';
import { formatINR, formatLakhs, formatPeriodLabel } from '../../../utils/formatters';
import { Wallet } from 'lucide-react';
import { CANONICAL_FOOD_BUDGET_HEADS, FOOD_MONTH_COLS } from '../../data_entry/food_budget/FoodBudgetEntrySection';

const mapFoodPeriodToColKey = (pObj) => {
  if (!pObj) return null;
  const found = FOOD_MONTH_COLS.find(c => String(c.periodId) === String(pObj.id));
  if (found) return found.key;
  const code = (pObj.period_code || pObj.period_label || '').toLowerCase();
  if (code.includes('jun')) return 'jun_26_actual';
  if (code.includes('jul')) return 'jul_26_actual';
  if (code.includes('aug')) return 'aug_26_actual';
  if (code.includes('sep')) return 'sep_26_actual';
  if (code.includes('oct')) return 'oct_26_actual';
  if (code.includes('nov')) return 'nov_26_actual';
  if (code.includes('dec')) return 'dec_26_actual';
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
    } else {
      fetchBudget();
    }
  }, [computedMatrix?.food_budget_tracking]);

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
      
      {/* 1. Header Toolbar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '16px 22px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Title & Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#eef2ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.2)'
          }}>
            <Wallet size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Food Operations Budget Allocation & Tracking
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: '#dbeafe',
                color: '#1e40af'
              }}>
                8 Budget Heads
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: isOverallUnderBudget ? '#dcfce7' : '#fee2e2',
                color: isOverallUnderBudget ? '#166534' : '#991b1b'
              }}>
                {isOverallUnderBudget ? 'Under Budget' : 'Exceeding Budget'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Comparison of Sanctioned Target vs Actual Expenses for {activePeriodLabel}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Executive Financial KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '14px'
      }}>
        {/* Card 1: Budget Target */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #4f46e5',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#4338ca', textTransform: 'uppercase' }}>
            {activeColKey === 'all' ? 'Annual Sanctioned Budget' : `${activePeriodLabel} Budget Target`}
          </span>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '4px 0 2px 0' }} className="currency-font">
            {formatINR(currentBudgetTarget)}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {formatLakhs(currentBudgetTarget)} allocated limit
          </span>
        </div>

        {/* Card 2: Actual Spent */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #0284c7',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase' }}>
            {activeColKey === 'all' ? 'Total Cumulative Spent' : `${activePeriodLabel} Actual Spent`}
          </span>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '4px 0 2px 0' }} className="currency-font">
            {formatINR(totalCurrentActual)}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {formatLakhs(totalCurrentActual)} recorded ({overallUtilizationPct}% of budget)
          </span>
        </div>

        {/* Card 3: Utilization Gauge */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #f59e0b',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase' }}>
              Budget Utilization
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              padding: '1px 6px',
              borderRadius: '9999px',
              backgroundColor: Number(overallUtilizationPct) <= 100 ? '#dcfce7' : '#fee2e2',
              color: Number(overallUtilizationPct) <= 100 ? '#166534' : '#991b1b'
            }}>
              {overallUtilizationPct}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '10px',
            backgroundColor: '#f1f5f9',
            borderRadius: '9999px',
            margin: '10px 0 6px 0',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(100, Number(overallUtilizationPct))}%`,
              height: '100%',
              backgroundColor: Number(overallUtilizationPct) <= 90 ? '#10b981' : Number(overallUtilizationPct) <= 100 ? '#f59e0b' : '#ef4444',
              borderRadius: '9999px',
              transition: 'width 0.4s ease'
            }} />
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Target threshold: 100% of sanctioned limit
          </span>
        </div>
      </div>

      {/* 3. OFFICIAL FOOD BUDGET TRACKING LEDGER */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.07)'
      }}>
        {/* Formal Ledger Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
          padding: '18px 24px 14px 24px',
          borderBottom: '3px solid #fbbf24',
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
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#fbbf24', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '2px' }}>
                Official Food Operations Budget Tracking Ledger ({periodRangeLabel})
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                Budget Allocation &amp; Expenditure Ledger
              </div>
              <div style={{ fontSize: '11.5px', color: '#a5b4fc', marginTop: '3px', fontWeight: '600' }}>
                {budgetData.length} Budget Heads &nbsp;&bull;&nbsp; {visibleMonthCols.length} Months &nbsp;&bull;&nbsp; Focus: <span style={{ color: '#fbbf24' }}>{activePeriodLabel}</span>
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
                    <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: '800', color: isOver ? '#dc2626' : '#166534', backgroundColor: isOver ? '#fef2f2' : '#f0fdf4' }} className="currency-font">
                      {isOver ? `-${formatINR(Math.abs(balance))}` : formatINR(balance)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', backgroundColor: '#faf5ff' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: '9999px',
                        fontSize: '11.5px', fontWeight: '800',
                        backgroundColor: isOver ? '#fee2e2' : utilPct > 80 ? '#fef3c7' : '#dcfce7',
                        color: isOver ? '#991b1b' : utilPct > 80 ? '#92400e' : '#166534',
                        border: `1px solid ${isOver ? '#fca5a5' : utilPct > 80 ? '#fde68a' : '#86efac'}`
                      }}>
                        {utilPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#fef08a', borderTop: '3px solid #ca8a04', fontWeight: '900', color: '#713f12' }}>
                <td style={{ padding: '13px 10px', textAlign: 'center', fontSize: '14px' }}>&sum;</td>
                <td style={{ padding: '13px 14px', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Grand Total &mdash; All Budget Heads
                </td>
                <td style={{ padding: '13px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '900', color: '#166534', backgroundColor: '#dcfce7', borderRight: '2px solid #bbf7d0' }} className="currency-font">
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
                      backgroundColor: isActive ? '#fef9c3' : '#fefce8',
                      color: mSum > 0 ? '#713f12' : '#a16207',
                      borderRight: '1px solid rgba(202,138,4,0.3)'
                    }} className="currency-font">
                      {mSum > 0 ? formatINR(mSum) : '—'}
                    </td>
                  );
                })}
                <td style={{ padding: '13px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '900', color: '#0369a1', backgroundColor: '#e0f2fe', borderLeft: '2px solid #7dd3fc' }} className="currency-font">
                  {formatINR(allVisibleMonthsActualSum)}
                </td>
                <td style={{ padding: '13px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '900', color: allVisibleMonthsActualSum <= totalSanctionedBudget ? '#166534' : '#dc2626', backgroundColor: allVisibleMonthsActualSum <= totalSanctionedBudget ? '#dcfce7' : '#fee2e2' }} className="currency-font">
                  {allVisibleMonthsActualSum <= totalSanctionedBudget ? formatINR(totalSanctionedBudget - allVisibleMonthsActualSum) : `-${formatINR(Math.abs(totalSanctionedBudget - allVisibleMonthsActualSum))}`}
                </td>
                <td style={{ padding: '13px 14px', textAlign: 'center', backgroundColor: '#fef9c3' }}>
                  <span style={{
                    display: 'inline-block', padding: '4px 12px', borderRadius: '9999px',
                    fontSize: '12px', fontWeight: '900',
                    backgroundColor: '#fbbf24', color: '#451a03',
                    border: '2px solid #d97706'
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