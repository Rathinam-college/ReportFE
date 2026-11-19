import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, ChevronDown, ChevronUp, Layers, PieChart,
  Calendar, Download, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle,
  Building, Zap, Droplets, Wrench, Users, Wallet, Table, Check,
  LayoutGrid, BarChart3, AlertTriangle, Sparkles, Landmark, FileText,
  BadgePercent, Eye, ArrowUpRight, ArrowDownRight, IndianRupee
} from 'lucide-react';
import { formatINR } from '../../../utils/formatters';
import { 
  HOSTEL_BUDGET_HEADS, 
  TOTAL_SANCTIONED_BUDGET, 
  TOTAL_MONTH_LIMIT, 
  TOTAL_OCT_ACTUAL 
} from '../../../utils/hostelBudgetConstants';

export default function HostelExpensesBudgetSection({
  census = {},
  computedMatrix = {},
  categories = [],
  periods = [],
  activePeriod = 'all',
  onExportReport,
  remarksDraft = {}
}) {
  const [budgetScope, setBudgetScope] = useState('monthly'); // 'monthly' | 'fy'
  const [trackingViewMode, setTrackingViewMode] = useState('matrix'); // 'matrix' | 'cards' | 'distribution'
  const [budgetTrackingData, setBudgetTrackingData] = useState([]);

  useEffect(() => {
    if (computedMatrix?.hostel_budget_tracking && computedMatrix.hostel_budget_tracking.length > 0) {
      setBudgetTrackingData(computedMatrix.hostel_budget_tracking);
    } else {
      fetch('/api/hostel/budget-tracking')
        .then(res => res.json())
        .then(d => {
          if (d?.items && d.items.length > 0) {
            setBudgetTrackingData(d.items);
          } else {
            setBudgetTrackingData(HOSTEL_BUDGET_HEADS.map(h => ({
              s_no: h.s_no,
              budget_head: h.head,
              sanctioned_amount: h.sanctioned,
              month_limit: h.limit,
              oct_26_actual: h.defaultOct
            })));
          }
        })
        .catch(() => {
          setBudgetTrackingData(HOSTEL_BUDGET_HEADS.map(h => ({
            s_no: h.s_no,
            budget_head: h.head,
            sanctioned_amount: h.sanctioned,
            month_limit: h.limit,
            oct_26_actual: h.defaultOct
          })));
        });
    }
  }, [computedMatrix]);

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // Merge canonical definitions with database records
  const activeBudgetHeads = useMemo(() => {
    return HOSTEL_BUDGET_HEADS.map((canon) => {
      const match = budgetTrackingData.find(
        r => r.budget_head === canon.head || Number(r.s_no) === canon.s_no
      );
      return {
        s_no: canon.s_no,
        budget_head: canon.head,
        sanctioned_amount: match ? num(match.sanctioned_amount, canon.sanctioned) : canon.sanctioned,
        month_limit: match ? num(match.month_limit, canon.limit) : canon.limit,
        oct_26_actual: match ? num(match.oct_26_actual, canon.defaultOct) : canon.defaultOct,
        nov_26_actual: match ? num(match.nov_26_actual, 0) : 0,
        dec_26_actual: match ? num(match.dec_26_actual, 0) : 0,
        jan_27_actual: match ? num(match.jan_27_actual, 0) : 0,
        feb_27_actual: match ? num(match.feb_27_actual, 0) : 0,
        mar_27_actual: match ? num(match.mar_27_actual, 0) : 0,
        apr_27_actual: match ? num(match.apr_27_actual, 0) : 0,
        may_27_actual: match ? num(match.may_27_actual, 0) : 0,
      };
    });
  }, [budgetTrackingData]);

  // Executive Budget Baseline (Official 8-Month Cycle Oct'26 – May'27)
  const approvedBudgetFY = num(census.approved_budget, TOTAL_SANCTIONED_BUDGET);
  const actualCumulativeSpent = num(census.cumulative_budget_spent, TOTAL_OCT_ACTUAL);
  const remainingBudgetFY = num(census.balance, approvedBudgetFY - actualCumulativeSpent);
  const budgetUtilizationPctFY = approvedBudgetFY > 0 ? (actualCumulativeSpent / approvedBudgetFY) * 100 : 9.44;

  // Monthly Calculations
  const monthlyExpenseOccurred = num(census.expenses_occurred, TOTAL_OCT_ACTUAL);
  const approvedMonthlyBudget = Math.round(approvedBudgetFY / 8) || TOTAL_MONTH_LIMIT;
  const remainingMonthlyBudget = approvedMonthlyBudget - monthlyExpenseOccurred;
  const monthlyUtilizationPct = approvedMonthlyBudget > 0 ? (monthlyExpenseOccurred / approvedMonthlyBudget) * 100 : 75.5;

  const activeApproved = budgetScope === 'monthly' ? approvedMonthlyBudget : approvedBudgetFY;
  const activeActual = budgetScope === 'monthly' ? monthlyExpenseOccurred : actualCumulativeSpent;
  const activeRemaining = budgetScope === 'monthly' ? remainingMonthlyBudget : remainingBudgetFY;
  const activeUtilization = budgetScope === 'monthly' ? monthlyUtilizationPct : budgetUtilizationPctFY;

  // Totals for the 9 Heads
  const totalSanctionedSum = activeBudgetHeads.reduce((acc, h) => acc + num(h.sanctioned_amount, 0), 0);
  const totalMonthLimitSum = activeBudgetHeads.reduce((acc, h) => acc + num(h.month_limit, 0), 0);
  const totalOctActualSum = activeBudgetHeads.reduce((acc, h) => acc + num(h.oct_26_actual, 0), 0);
  const totalOctDiff = totalOctActualSum - totalMonthLimitSum;

  // Helper icons for each budget head
  const getHeadIcon = (sNo) => {
    switch (sNo) {
      case 1: return <Building size={16} color="#2563eb" />;
      case 2: return <FileText size={16} color="#0891b2" />;
      case 3: return <Landmark size={16} color="#7c3aed" />;
      case 4: return <Users size={16} color="#d97706" />;
      case 5: return <ShieldCheck size={16} color="#4338ca" />;
      case 6: return <Zap size={16} color="#ea580c" />;
      case 7: return <Droplets size={16} color="#0284c7" />;
      case 8: return <Wrench size={16} color="#dc2626" />;
      case 9: return <Sparkles size={16} color="#db2777" />;
      default: return <Wallet size={16} color="#64748b" />;
    }
  };

  // Ranked cost heads for distribution view
  const rankedCostHeads = useMemo(() => {
    return [...activeBudgetHeads]
      .filter(h => num(h.oct_26_actual, 0) > 0)
      .sort((a, b) => num(b.oct_26_actual, 0) - num(a.oct_26_actual, 0));
  }, [activeBudgetHeads]);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* 1. EXECUTIVE HEADER BANNER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '16px 22px',
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        border: '1.5px solid #e0e7ff',
        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            backgroundColor: '#4338ca',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(67, 56, 202, 0.25)'
          }}>
            <IndianRupee size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e1b4b', margin: 0 }}>
                Expenses & Budget Tracking
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: '#e0e7ff',
                color: '#4338ca',
                padding: '2px 9px',
                borderRadius: '9999px'
              }}>
                8-Month Accounting Horizon
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Official Hostel Budget Tracking • Sanctioned ₹14.20 Cr • Oct'26 – May'27 Cycle
            </p>
          </div>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 14px',
          borderRadius: '9999px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          <span style={{ color: '#475569' }}>Spent: <strong style={{ color: '#1e1b4b' }}>{formatINR(monthlyExpenseOccurred)}</strong></span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span style={{ color: '#16a34a' }}>Balance: <strong>{formatINR(remainingBudgetFY)}</strong></span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span style={{ color: '#2563eb' }}>Utilized: <strong>{budgetUtilizationPctFY.toFixed(1)}%</strong></span>
        </div>
      </div>

      {/* 2. EXECUTIVE FINANCIAL KPIs & HORIZON OVERVIEW */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        border: '1.5px solid #e2e8f0',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Operating Budget vs Actual Spend
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0 0' }}>
              Remaining Available Balance = Approved Budget ({formatINR(activeApproved)}) − Total Spent ({formatINR(activeActual)})
            </p>
          </div>

          {/* Monthly vs Full Year Scope Switcher */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#f1f5f9',
            borderRadius: '9999px',
            padding: '4px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => setBudgetScope('monthly')}
              style={{
                border: 'none',
                padding: '6px 16px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: budgetScope === 'monthly' ? '800' : '600',
                backgroundColor: budgetScope === 'monthly' ? '#4338ca' : 'transparent',
                color: budgetScope === 'monthly' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Current Month (Oct'26)
            </button>
            <button
              type="button"
              onClick={() => setBudgetScope('fy')}
              style={{
                border: 'none',
                padding: '6px 16px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: budgetScope === 'fy' ? '800' : '600',
                backgroundColor: budgetScope === 'fy' ? '#4338ca' : 'transparent',
                color: budgetScope === 'fy' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              8-Month Horizon (Oct'26 – May'27)
            </button>
          </div>
        </div>

        {/* 4 Primary Executive Stat Bento Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}>
          {/* Card 1: Approved Budget */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '14px',
            padding: '16px 18px',
            border: '1.5px solid #e2e8f0',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {budgetScope === 'monthly' ? 'Monthly Limit (Ceiling)' : 'Sanctioned Budget (8-Mo)'}
              </span>
              <Building size={16} color="#64748b" />
            </div>
            <div style={{ fontSize: '23px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0' }} className="currency-font">
              {formatINR(activeApproved)}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
              {budgetScope === 'monthly' ? '₹1.77 Cr ceiling per month' : '₹14.20 Cr total approved'}
            </div>
          </div>

          {/* Card 2: Actual Expenses */}
          <div style={{
            backgroundColor: '#f5f3ff',
            borderRadius: '14px',
            padding: '16px 18px',
            border: '1.5px solid #ddd6fe'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {budgetScope === 'monthly' ? 'Actual Expenses' : 'Cumulative Spend (YTD)'}
              </span>
              <TrendingUp size={16} color="#7c3aed" />
            </div>
            <div style={{ fontSize: '23px', fontWeight: '900', color: '#4c1d95', margin: '6px 0 2px 0' }} className="currency-font">
              {formatINR(activeActual)}
            </div>
            <div style={{ fontSize: '11.5px', color: '#6d28d9', fontWeight: '700' }}>
              {budgetScope === 'monthly' ? '9 heads actual spend' : `${(activeUtilization).toFixed(1)}% of total budget spent`}
            </div>
          </div>

          {/* Card 3: Remaining Balance */}
          <div style={{
            backgroundColor: '#f0fdf4',
            borderRadius: '14px',
            padding: '16px 18px',
            border: '1.5px solid #bbf7d0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {budgetScope === 'monthly' ? 'Monthly Savings' : 'Available Balance'}
              </span>
              <CheckCircle2 size={16} color="#16a34a" />
            </div>
            <div style={{ fontSize: '23px', fontWeight: '900', color: '#166534', margin: '6px 0 2px 0' }} className="currency-font">
              {formatINR(activeRemaining)}
            </div>
            <div style={{ fontSize: '11.5px', color: '#15803d', fontWeight: '700' }}>
              {activeRemaining >= 0 ? `✓ Under ceiling by ${formatINR(activeRemaining)}` : `⚠ Deficit of ${formatINR(Math.abs(activeRemaining))}`}
            </div>
          </div>

          {/* Card 4: Utilization Rate */}
          <div style={{
            backgroundColor: '#eff6ff',
            borderRadius: '14px',
            padding: '16px 18px',
            border: '1.5px solid #bfdbfe'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Budget Utilization
              </span>
              <BadgePercent size={16} color="#2563eb" />
            </div>
            <div style={{ fontSize: '23px', fontWeight: '900', color: '#1e40af', margin: '6px 0 2px 0' }}>
              {activeUtilization.toFixed(1)}%
            </div>
            <div style={{ fontSize: '11.5px', color: '#1d4ed8' }}>
              {budgetScope === 'monthly' ? '24.5% savings rate achieved' : `${(100 - activeUtilization).toFixed(1)}% budget reserve untouched`}
            </div>
          </div>
        </div>

        {/* Global Horizon Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: '#475569', fontWeight: '700' }}>
              {budgetScope === 'monthly' ? "Oct'26 Monthly Ceiling Utilization:" : '8-Month Sanctioned Budget Utilization:'}
            </span>
            <span style={{ color: '#0f172a', fontWeight: '800' }}>
              {formatINR(activeActual)} spent of {formatINR(activeApproved)} ({activeUtilization.toFixed(1)}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, activeUtilization)}%`,
                height: '100%',
                background: activeUtilization > 100 
                  ? 'linear-gradient(90deg, #ea580c, #ef4444)' 
                  : 'linear-gradient(90deg, #4338ca, #3b82f6)',
                borderRadius: '9999px',
                transition: 'width 0.5s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. REDESIGNED: HOSTEL BUDGET TRACKING SUMMARY (Oct'26 – May'27)           */}
      {/* ========================================================================= */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #cbd5e1',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)'
      }}>
        {/* Modern Header Banner with View Switcher */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          color: '#ffffff',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
              <Table size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '900', margin: 0, color: '#ffffff', letterSpacing: '0.02em' }}>
                  HOSTEL BUDGET TRACKING SUMMARY
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  backgroundColor: '#22c55e',
                  color: '#ffffff',
                  padding: '2px 10px',
                  borderRadius: '9999px'
                }}>
                  Oct'26 – May'27
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#c7d2fe' }}>
                9 Official Budget Heads • Sanctioned vs Monthly Ceiling vs Actual Expenditure
              </p>
            </div>
          </div>

          {/* Interactive View Switcher Toggles */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '9999px',
            padding: '3px',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <button
              type="button"
              onClick={() => setTrackingViewMode('matrix')}
              style={{
                border: 'none',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: '800',
                backgroundColor: trackingViewMode === 'matrix' ? '#ffffff' : 'transparent',
                color: trackingViewMode === 'matrix' ? '#1e1b4b' : '#c7d2fe',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Table size={13} />
              <span>8-Month Ledger</span>
            </button>
            <button
              type="button"
              onClick={() => setTrackingViewMode('cards')}
              style={{
                border: 'none',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: '800',
                backgroundColor: trackingViewMode === 'cards' ? '#ffffff' : 'transparent',
                color: trackingViewMode === 'cards' ? '#1e1b4b' : '#c7d2fe',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={13} />
              <span>9 Heads Bento</span>
            </button>
            <button
              type="button"
              onClick={() => setTrackingViewMode('distribution')}
              style={{
                border: 'none',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: '800',
                backgroundColor: trackingViewMode === 'distribution' ? '#ffffff' : 'transparent',
                color: trackingViewMode === 'distribution' ? '#1e1b4b' : '#c7d2fe',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <BarChart3 size={13} />
              <span>Cost Drivers</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: FULL 8-MONTH LEDGER MATRIX TABLE                       */}
        {/* ------------------------------------------------------------- */}
        {trackingViewMode === 'matrix' && (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', minWidth: '980px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#1e293b' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '45px', fontWeight: '800' }}>#</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '800', minWidth: '220px' }}>Budget Head</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', backgroundColor: '#ecfdf5', color: '#065f46', minWidth: '130px' }}>
                    SANCTIONED (₹)
                  </th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', backgroundColor: '#fff7ed', color: '#9a3412', minWidth: '125px' }}>
                    Month Limit (₹)
                  </th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', backgroundColor: '#eff6ff', color: '#1e40af', minWidth: '125px' }}>
                    Oct'26 Actual (₹)
                  </th>
                  <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '700', color: '#64748b' }}>Nov'26</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '700', color: '#64748b' }}>Dec'26</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '700', color: '#64748b' }}>Jan'27</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '700', color: '#64748b' }}>Feb – May'27</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '800', minWidth: '150px' }}>
                    Pace & Limit Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeBudgetHeads.map((head, idx) => {
                  const sanc = num(head.sanctioned_amount, 0);
                  const limit = num(head.month_limit, 0);
                  const oct = num(head.oct_26_actual, 0);
                  const diff = oct - limit;
                  const isOver = oct > limit;
                  const pct = limit > 0 ? (oct / limit) * 100 : 0;

                  return (
                    <tr 
                      key={head.budget_head || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '700', color: '#94a3b8' }}>
                        {head.s_no}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {getHeadIcon(head.s_no)}
                          </div>
                          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '13px' }}>
                            {head.budget_head}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: '#166534', backgroundColor: '#f0fdf4' }} className="currency-font">
                        {formatINR(sanc)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: '#c2410c', backgroundColor: '#fffbeb' }} className="currency-font">
                        {formatINR(limit)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', color: '#1e40af', backgroundColor: '#eff6ff' }} className="currency-font">
                        {oct > 0 ? formatINR(oct) : '₹0'}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', color: '#94a3b8' }}>
                        {num(head.nov_26_actual, 0) > 0 ? formatINR(head.nov_26_actual) : '—'}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', color: '#94a3b8' }}>
                        {num(head.dec_26_actual, 0) > 0 ? formatINR(head.dec_26_actual) : '—'}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', color: '#94a3b8' }}>
                        {num(head.jan_27_actual, 0) > 0 ? formatINR(head.jan_27_actual) : '—'}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', color: '#94a3b8' }}>
                        —
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        {oct === 0 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: '#f1f5f9',
                            color: '#64748b'
                          }}>
                            Reserved (0%)
                          </span>
                        ) : isOver ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '10.5px',
                              fontWeight: '800',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fca5a5'
                            }}>
                              <ArrowUpRight size={11} /> Over by {formatINR(Math.abs(diff))} ({pct.toFixed(1)}%)
                            </span>
                            <div style={{ width: '80px', height: '4px', backgroundColor: '#fee2e2', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: '100%', height: '100%', backgroundColor: '#dc2626' }} />
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '10.5px',
                              fontWeight: '800',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              border: '1px solid #86efac'
                            }}>
                              <ArrowDownRight size={11} /> Saved {formatINR(Math.abs(diff))} ({pct.toFixed(1)}%)
                            </span>
                            <div style={{ width: '80px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', backgroundColor: '#16a34a' }} />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Bottom Total Summary Row */}
                <tr style={{
                  backgroundColor: '#fef08a',
                  borderTop: '2px solid #ca8a04',
                  fontWeight: '900',
                  color: '#713f12'
                }}>
                  <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '13px' }}>∑</td>
                  <td style={{ padding: '14px 16px', fontSize: '13.5px', textTransform: 'uppercase' }}>
                    Total Budget Tracking (9 Heads)
                  </td>
                  <td style={{ padding: '14px 14px', textAlign: 'right', fontSize: '14.5px', color: '#166534' }} className="currency-font">
                    {formatINR(totalSanctionedSum)}
                  </td>
                  <td style={{ padding: '14px 14px', textAlign: 'right', fontSize: '14.5px', color: '#9a3412' }} className="currency-font">
                    {formatINR(totalMonthLimitSum)}
                  </td>
                  <td style={{ padding: '14px 14px', textAlign: 'right', fontSize: '14.5px', color: '#1e40af' }} className="currency-font">
                    {formatINR(totalOctActualSum)}
                  </td>
                  <td style={{ padding: '14px 10px', textAlign: 'right', color: '#854d0e' }}>—</td>
                  <td style={{ padding: '14px 10px', textAlign: 'right', color: '#854d0e' }}>—</td>
                  <td style={{ padding: '14px 10px', textAlign: 'right', color: '#854d0e' }}>—</td>
                  <td style={{ padding: '14px 10px', textAlign: 'right', color: '#854d0e' }}>—</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '11.5px',
                      fontWeight: '900',
                      backgroundColor: '#bbf7d0',
                      color: '#14532d',
                      border: '1px solid #86efac'
                    }}>
                      ✓ Saved {formatINR(Math.abs(totalOctDiff))} (75.5% utilized)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: 9 BUDGET HEADS VISUAL BENTO CARDS                     */}
        {/* ------------------------------------------------------------- */}
        {trackingViewMode === 'cards' && (
          <div style={{
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            backgroundColor: '#f8fafc'
          }}>
            {activeBudgetHeads.map((head) => {
              const sanc = num(head.sanctioned_amount, 0);
              const limit = num(head.month_limit, 0);
              const oct = num(head.oct_26_actual, 0);
              const diff = oct - limit;
              const isOver = oct > limit;
              const pct = limit > 0 ? (oct / limit) * 100 : 0;

              return (
                <div
                  key={head.budget_head}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1.5px solid #e2e8f0',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getHeadIcon(head.s_no)}
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>Head #{head.s_no}</span>
                        <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                          {head.budget_head}
                        </h4>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: oct === 0 ? '#f1f5f9' : isOver ? '#fee2e2' : '#dcfce7',
                      color: oct === 0 ? '#64748b' : isOver ? '#b91c1c' : '#15803d'
                    }}>
                      {oct === 0 ? '0% Used' : isOver ? `▲ Over by ${formatINR(Math.abs(diff))}` : `✓ Saved ${formatINR(Math.abs(diff))}`}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Oct'26 Actual Spend</div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#1e40af', margin: '2px 0 6px 0' }} className="currency-font">
                      {oct > 0 ? formatINR(oct) : '₹0'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#475569', marginBottom: '6px' }}>
                      <span>Limit: <strong style={{ color: '#c2410c' }}>{formatINR(limit)}</strong></span>
                      <span>Sanctioned: <strong style={{ color: '#166534' }}>{formatINR(sanc)}</strong></span>
                    </div>

                    {/* Mini Pace Bar */}
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          height: '100%',
                          backgroundColor: isOver ? '#dc2626' : pct > 80 ? '#3b82f6' : '#16a34a',
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: COST DRIVERS & SPEND DISTRIBUTION                      */}
        {/* ------------------------------------------------------------- */}
        {trackingViewMode === 'distribution' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                Hostel Spend Distribution (Oct'26 Active Heads)
              </h4>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Proportional breakdown of total monthly expenditure across active operational heads
              </p>
            </div>

            {/* Stacked Visual Bar */}
            <div style={{ width: '100%', height: '22px', borderRadius: '8px', overflow: 'hidden', display: 'flex', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
              {rankedCostHeads.map((head, idx) => {
                const oct = num(head.oct_26_actual, 0);
                const share = totalOctActualSum > 0 ? (oct / totalOctActualSum) * 100 : 0;
                const colors = ['#2563eb', '#4338ca', '#0284c7', '#d97706', '#dc2626', '#ea580c'];
                const bg = colors[idx % colors.length];

                return (
                  <div
                    key={head.budget_head}
                    title={`${head.budget_head}: ${share.toFixed(1)}% (${formatINR(oct)})`}
                    style={{
                      width: `${share}%`,
                      height: '100%',
                      backgroundColor: bg,
                      transition: 'width 0.3s ease'
                    }}
                  />
                );
              })}
            </div>

            {/* Ranked List Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {rankedCostHeads.map((head, idx) => {
                const oct = num(head.oct_26_actual, 0);
                const limit = num(head.month_limit, 0);
                const share = totalOctActualSum > 0 ? (oct / totalOctActualSum) * 100 : 0;

                return (
                  <div
                    key={head.budget_head}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: '#1e1b4b',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '900',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{head.budget_head}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Limit: {formatINR(limit)}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#1e40af' }}>{formatINR(oct)}</div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#4338ca' }}>{share.toFixed(1)}% Share</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
