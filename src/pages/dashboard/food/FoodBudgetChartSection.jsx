import React, { useState, useEffect, useMemo } from 'react';
import { formatINR, formatLakhs } from '../../../utils/formatters';
import { Wallet, Table } from 'lucide-react';
import { CANONICAL_FOOD_BUDGET_HEADS, FOOD_MONTH_COLS } from '../../data_entry/food_budget/FoodBudgetEntrySection';

export default function FoodBudgetChartSection({
  computedMatrix,
  periods = [],
  activePeriod = 'all',
  onPeriodChange
}) {
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // Determine active month column
  const activeColKey = useMemo(() => {
    if (!activePeriod || activePeriod === 'all') return 'all';
    const found = FOOD_MONTH_COLS.find(c => String(c.periodId) === String(activePeriod));
    if (found) return found.key;
    // Fallback based on period code/label
    const pObj = periods.find(p => String(p.id) === String(activePeriod));
    if (pObj) {
      const code = (pObj.period_code || pObj.period_label || '').toLowerCase();
      if (code.includes('jun')) return 'jun_26_actual';
      if (code.includes('jul')) return 'jul_26_actual';
      if (code.includes('aug')) return 'aug_26_actual';
      if (code.includes('sep')) return 'sep_26_actual';
      if (code.includes('oct')) return 'oct_26_actual';
    }
    return 'oct_26_actual';
  }, [activePeriod, periods]);

  // Period label for display
  const activePeriodLabel = useMemo(() => {
    if (activePeriod === 'all') return 'All Months (Cumulative)';
    const pObj = periods.find(p => String(p.id) === String(activePeriod));
    return pObj?.period_label || pObj?.period_code || "Oct'26";
  }, [activePeriod, periods]);

  // Calculate actual spend for a row depending on active month filter
  const getHeadActual = (row) => {
    if (activeColKey === 'all') {
      return FOOD_MONTH_COLS.reduce((sum, col) => sum + (Number(row[col.key]) || 0), 0);
    }
    return Number(row[activeColKey]) || 0;
  };

  // Calculate budget target for a row depending on active month filter
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
  }, [budgetData, activeColKey]);

  const currentBudgetTarget = activeColKey === 'all' ? totalSanctionedBudget : totalMonthlyLimit;
  const currentVariance = currentBudgetTarget - totalCurrentActual; // Positive = Under Budget (Savings)
  const isOverallUnderBudget = currentVariance >= 0;
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
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

        {/* Card 3: Variance / Balance */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          borderLeft: `4px solid ${isOverallUnderBudget ? '#16a34a' : '#ef4444'}`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: isOverallUnderBudget ? '#16a34a' : '#ef4444', textTransform: 'uppercase' }}>
            {isOverallUnderBudget ? 'Budget Savings / Balance' : 'Budget Deficit / Overrun'}
          </span>
          <div style={{ fontSize: '22px', fontWeight: '900', color: isOverallUnderBudget ? '#16a34a' : '#dc2626', margin: '4px 0 2px 0' }} className="currency-font">
            {isOverallUnderBudget ? '+' : ''}{formatINR(currentVariance)}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {isOverallUnderBudget ? `${formatLakhs(currentVariance)} unspent cushion` : 'Expenditure exceeded target'}
          </span>
        </div>

        {/* Card 4: Utilization Gauge */}
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

      {/* 3. MATRIX TABLE */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#f8fafc',
          borderBottom: '1.5px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table size={16} style={{ color: '#4f46e5' }} />
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
              Budget Allocation & Expenditure Ledger
            </span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
            Period: <strong style={{ color: '#0f172a' }}>{activePeriodLabel}</strong>
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1', color: '#334155', fontWeight: '800' }}>
              <th style={{ padding: '12px 14px', width: '50px', textAlign: 'center' }}>#</th>
              <th style={{ padding: '12px 16px' }}>Budget Head Name</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Annual Sanctioned</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>{activePeriodLabel} Actual</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Variance / Balance</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>Utilization</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {budgetData.map((row, idx) => {
              const bTarget = getHeadBudget(row);
              const actual = getHeadActual(row);
              const balance = bTarget - actual;
              const isOver = actual > bTarget && bTarget > 0;
              const utilPct = bTarget > 0 ? ((actual / bTarget) * 100).toFixed(1) : 0;
              const theme = HEAD_COLORS[idx % HEAD_COLORS.length];

              return (
                <tr key={row.budget_head || idx} style={{
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafbfc'
                }}>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      backgroundColor: theme.bg,
                      color: theme.primary,
                      fontSize: '11px',
                      fontWeight: '800',
                      border: `1px solid ${theme.border}`
                    }}>
                      {idx + 1}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontWeight: '700', color: '#0f172a' }}>{row.budget_head}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }} className="currency-font">
                    {formatINR(row.sanctioned_amount)}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: isOver ? '#dc2626' : '#0f172a' }} className="currency-font">
                    {formatINR(actual)}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: balance >= 0 ? '#16a34a' : '#dc2626' }} className="currency-font">
                    {balance >= 0 ? '+' : ''}{formatINR(balance)}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: isOver ? '#fee2e2' : '#dcfce7',
                      color: isOver ? '#991b1b' : '#166534'
                    }}>
                      {utilPct}%
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: isOver ? '#fef2f2' : '#f0fdf4',
                      color: isOver ? '#dc2626' : '#16a34a',
                      border: `1px solid ${isOver ? '#fecaca' : '#bbf7d0'}`
                    }}>
                      {isOver ? 'Over Target' : 'Under Target'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{
              backgroundColor: '#f8fafc',
              borderTop: '2px solid #cbd5e1',
              fontWeight: '800',
              color: '#0f172a'
            }}>
              <td style={{ padding: '12px 14px', textAlign: 'center', color: '#4f46e5' }}>Σ</td>
              <td style={{ padding: '12px 16px' }}>Total Operations Budget</td>
              <td style={{ padding: '12px 14px', textAlign: 'right' }} className="currency-font">
                {formatINR(totalSanctionedBudget)}
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'right', color: isOverallUnderBudget ? '#0f172a' : '#dc2626' }} className="currency-font">
                {formatINR(totalCurrentActual)}
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'right', color: isOverallUnderBudget ? '#16a34a' : '#dc2626' }} className="currency-font">
                {isOverallUnderBudget ? '+' : ''}{formatINR(currentVariance)}
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: Number(overallUtilizationPct) <= 100 ? '#dcfce7' : '#fee2e2',
                  color: Number(overallUtilizationPct) <= 100 ? '#166534' : '#991b1b'
                }}>
                  {overallUtilizationPct}%
                </span>
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: isOverallUnderBudget ? '#f0fdf4' : '#fef2f2',
                  color: isOverallUnderBudget ? '#16a34a' : '#dc2626',
                  border: `1px solid ${isOverallUnderBudget ? '#bbf7d0' : '#fecaca'}`
                }}>
                  {isOverallUnderBudget ? 'Under Target' : 'Over Target'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

    </section>
  );
}
