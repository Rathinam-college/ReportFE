import React, { useState, useEffect, useMemo } from 'react';
import { formatINR, formatLakhs, formatIndianCompact } from '../../../utils/formatters';
import { 
  BarChart3, Layers, Wallet, TrendingUp, PieChart, 
  Calendar, Table, Check, ArrowUpRight, ArrowDownRight, 
  ShieldCheck, AlertTriangle, CheckCircle2, Sparkles, Filter
} from 'lucide-react';
import { CANONICAL_FOOD_BUDGET_HEADS, FOOD_MONTH_COLS } from '../../data_entry/food_budget/FoodBudgetEntrySection';

export default function FoodBudgetChartSection({
  computedMatrix,
  periods = [],
  activePeriod = 'all',
  onPeriodChange
}) {
  const [budgetData, setBudgetData] = useState([]);
  const [chartView, setChartView] = useState('bars'); // 'bars' | 'cards' | 'matrix'
  const [loading, setLoading] = useState(false);

  // 1. Fetch live budget data from PostgreSQL or computedMatrix
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
      return Number(row.sanctioned_amount) || (Number(row.month_limit) * FOOD_MONTH_COLS.length) || 0;
    }
    return Number(row.month_limit) || 0;
  };

  // Executive Totals
  const totalSanctionedBudget = useMemo(() => {
    return budgetData.reduce((acc, r) => acc + (Number(r.sanctioned_amount) || 0), 0);
  }, [budgetData]);

  const totalMonthlyLimit = useMemo(() => {
    return budgetData.reduce((acc, r) => acc + (Number(r.month_limit) || 0), 0);
  }, [budgetData]);

  const totalCurrentActual = useMemo(() => {
    return budgetData.reduce((acc, r) => acc + getHeadActual(r), 0);
  }, [budgetData, activeColKey]);

  const currentBudgetTarget = activeColKey === 'all' ? totalSanctionedBudget : totalMonthlyLimit;
  const currentVariance = currentBudgetTarget - totalCurrentActual; // Positive = Under Budget (Savings)
  const isOverallUnderBudget = currentVariance >= 0;
  const overallUtilizationPct = currentBudgetTarget > 0 ? ((totalCurrentActual / currentBudgetTarget) * 100).toFixed(1) : 0;

  // Max value for chart bar scaling
  const maxBarValue = useMemo(() => {
    let max = 0;
    budgetData.forEach(r => {
      const b = getHeadBudget(r);
      const a = getHeadActual(r);
      if (b > max) max = b;
      if (a > max) max = a;
    });
    return max > 0 ? max * 1.15 : 10000000;
  }, [budgetData, activeColKey]);

  // Palette for 8 Heads
  const HEAD_COLORS = [
    { primary: '#ffc90e', border: '#eab308', bg: '#fefce8' }, // 1. Food Material (Golden)
    { primary: '#6366f1', border: '#4f46e5', bg: '#eef2ff' }, // 2. Salary (Indigo)
    { primary: '#0284c7', border: '#0369a1', bg: '#f0f9ff' }, // 3. Contract Labour (Sky Blue)
    { primary: '#ec4899', border: '#db2777', bg: '#fdf2f8' }, // 4. Catering Vendor (Pink)
    { primary: '#f97316', border: '#ea580c', bg: '#fff7ed' }, // 5. FC Maint/Power (Orange)
    { primary: '#8b5cf6', border: '#7c3aed', bg: '#f5f3ff' }, // 6. Event/Add Food (Purple)
    { primary: '#10b981', border: '#059669', bg: '#ecfdf5' }, // 7. Food Festival (Emerald)
    { primary: '#14b8a6', border: '#0d9488', bg: '#f0fdfa' }  // 8. Staff Welfare (Teal)
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Food Operations Budget vs Actual Expenditure Chart
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
              Side-by-side comparison of Sanctioned Target vs Actual Expenses for {activePeriodLabel}
            </p>
          </div>
        </div>

        {/* View Model Toggle Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setChartView('bars')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: chartView === 'bars' ? '800' : '600',
              backgroundColor: chartView === 'bars' ? '#4f46e5' : '#f8fafc',
              color: chartView === 'bars' ? '#ffffff' : '#64748b',
              border: chartView === 'bars' ? '1px solid #4f46e5' : '1px solid #cbd5e1',
              cursor: 'pointer'
            }}
          >
            <BarChart3 size={13} />
            <span>Clustered Bars</span>
          </button>

          <button
            type="button"
            onClick={() => setChartView('cards')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: chartView === 'cards' ? '800' : '600',
              backgroundColor: chartView === 'cards' ? '#4f46e5' : '#f8fafc',
              color: chartView === 'cards' ? '#ffffff' : '#64748b',
              border: chartView === 'cards' ? '1px solid #4f46e5' : '1px solid #cbd5e1',
              cursor: 'pointer'
            }}
          >
            <Layers size={13} />
            <span>Progress Gauges</span>
          </button>

          <button
            type="button"
            onClick={() => setChartView('matrix')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: chartView === 'matrix' ? '800' : '600',
              backgroundColor: chartView === 'matrix' ? '#4f46e5' : '#f8fafc',
              color: chartView === 'matrix' ? '#ffffff' : '#64748b',
              border: chartView === 'matrix' ? '1px solid #4f46e5' : '1px solid #cbd5e1',
              cursor: 'pointer'
            }}
          >
            <Table size={13} />
            <span>Matrix Table</span>
          </button>
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

      {/* 3. CHART VIEW: CLUSTERED SIDE-BY-SIDE BARS */}
      {chartView === 'bars' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {/* Chart Subtitle & Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
              8-Head Expenditure vs Target Comparison ({activePeriodLabel})
            </span>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#6366f1' }} />
                <span style={{ fontWeight: '600', color: '#475569' }}>Budget Limit (₹)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10b981' }} />
                <span style={{ fontWeight: '600', color: '#475569' }}>Actual Spent (Under Budget)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ef4444' }} />
                <span style={{ fontWeight: '600', color: '#475569' }}>Exceeding Budget</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
            {budgetData.map((row, idx) => {
              const budgetVal = getHeadBudget(row);
              const actualVal = getHeadActual(row);
              const budgetPct = (budgetVal / maxBarValue) * 100;
              const actualPct = (actualVal / maxBarValue) * 100;
              const isOver = actualVal > budgetVal && budgetVal > 0;
              const utilPct = budgetVal > 0 ? ((actualVal / budgetVal) * 100).toFixed(1) : 0;
              const theme = HEAD_COLORS[idx % HEAD_COLORS.length];

              return (
                <div key={row.budget_head || idx} style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #edf2f7',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {/* Row Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        backgroundColor: theme.bg,
                        color: theme.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '800',
                        border: `1px solid ${theme.border}`
                      }}>
                        {idx + 1}
                      </span>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{row.budget_head}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Budget: <strong>{formatINR(budgetVal)}</strong> ({formatLakhs(budgetVal)})
                      </span>
                      <span>•</span>
                      <span style={{ fontSize: '12px', color: isOver ? '#dc2626' : '#16a34a' }}>
                        Actual: <strong>{formatINR(actualVal)}</strong> ({formatLakhs(actualVal)})
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: isOver ? '#fee2e2' : '#dcfce7',
                        color: isOver ? '#991b1b' : '#166534'
                      }}>
                        {utilPct}% Utilized
                      </span>
                    </div>
                  </div>

                  {/* Dual Comparison Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                    {/* Bar 1: Budget Target */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '48px', fontSize: '10.5px', fontWeight: '700', color: '#6366f1', textAlign: 'right' }}>
                        Target
                      </span>
                      <div style={{ flex: 1, height: '10px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, Math.max(2, budgetPct))}%`,
                          height: '100%',
                          backgroundColor: '#6366f1',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>

                    {/* Bar 2: Actual Spent */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '48px', fontSize: '10.5px', fontWeight: '700', color: isOver ? '#dc2626' : '#16a34a', textAlign: 'right' }}>
                        Actual
                      </span>
                      <div style={{ flex: 1, height: '10px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, Math.max(2, actualPct))}%`,
                          height: '100%',
                          backgroundColor: isOver ? '#ef4444' : '#10b981',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. CARDS VIEW: 8 BENTO PROGRESS GAUGES */}
      {chartView === 'cards' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px'
        }}>
          {budgetData.map((row, idx) => {
            const budgetVal = getHeadBudget(row);
            const actualVal = getHeadActual(row);
            const balance = budgetVal - actualVal;
            const isOver = actualVal > budgetVal && budgetVal > 0;
            const utilPct = budgetVal > 0 ? ((actualVal / budgetVal) * 100).toFixed(1) : 0;
            const theme = HEAD_COLORS[idx % HEAD_COLORS.length];

            return (
              <div key={row.budget_head || idx} style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '18px',
                border: '1px solid #e2e8f0',
                borderTop: `4px solid ${theme.primary}`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: theme.bg,
                      color: theme.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800'
                    }}>
                      {idx + 1}
                    </span>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{row.budget_head}</strong>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: isOver ? '#fee2e2' : '#dcfce7',
                    color: isOver ? '#991b1b' : '#166534'
                  }}>
                    {utilPct}%
                  </span>
                </div>

                {/* Actual vs Target Amounts */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Actual Spent</span>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: isOver ? '#dc2626' : '#0f172a' }} className="currency-font">
                      {formatINR(actualVal)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Budget Limit</span>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#475569' }} className="currency-font">
                      {formatINR(budgetVal)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, Number(utilPct))}%`,
                    height: '100%',
                    backgroundColor: isOver ? '#ef4444' : Number(utilPct) > 85 ? '#f59e0b' : '#10b981',
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>

                {/* Footer Balance */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '8px'
                }}>
                  <span style={{ color: '#64748b' }}>Remaining Balance:</span>
                  <strong style={{ color: balance >= 0 ? '#16a34a' : '#dc2626' }} className="currency-font">
                    {formatINR(balance)}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MATRIX TABLE VIEW */}
      {chartView === 'matrix' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #cbd5e1', color: '#334155', fontWeight: '800' }}>
                <th style={{ padding: '12px 14px', width: '50px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '12px 16px' }}>Budget Head Name</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Annual Sanctioned</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Monthly Target</th>
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

                return (
                  <tr key={row.budget_head || idx} style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafbfc'
                  }}>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 16px', fontWeight: '700', color: '#0f172a' }}>{row.budget_head}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }} className="currency-font">
                      {formatINR(row.sanctioned_amount)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }} className="currency-font">
                      {formatINR(row.month_limit)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: isOver ? '#dc2626' : '#0f172a' }} className="currency-font">
                      {formatINR(actual)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: balance >= 0 ? '#16a34a' : '#dc2626' }} className="currency-font">
                      {formatINR(balance)}
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
          </table>
        </div>
      )}

    </section>
  );
}
