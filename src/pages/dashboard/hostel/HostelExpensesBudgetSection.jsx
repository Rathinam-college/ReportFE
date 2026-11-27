import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, ChevronDown, ChevronUp, Layers, PieChart,
  Calendar, Download, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle,
  Building, Zap, Droplets, Wrench, Users, Wallet, Table, Check,
  LayoutGrid, BarChart3, AlertTriangle, Sparkles, Landmark, FileText,
  BadgePercent, Eye, ArrowUpRight, ArrowDownRight, IndianRupee
} from 'lucide-react';
import { formatINR, formatPeriodLabel, formatIndianCompact } from '../../../utils/formatters';
import CategoryCard from '../charts/CategoryCard';
import { 
  HOSTEL_BUDGET_HEADS, 
  getBudgetMonthCol,
  ALL_BUDGET_MONTH_COLS
} from '../../../utils/hostelBudgetConstants';

export default function HostelExpensesBudgetSection({
  census = {},
  computedMatrix = {},
  categories = [],
  periods = [],
  activePeriod = 'all',
  onExportReport,
  remarksDraft = {},
  monthFilter: propMonthFilter,
  onMonthFilterChange,
  trackingViewMode: propTrackingViewMode,
  onTrackingViewModeChange,
  hideTopToggles = false
}) {
  const [internalTrackingViewMode, setInternalTrackingViewMode] = useState('cards'); // 'both' | 'cards' | 'matrix' | 'distribution'
  const [internalMonthFilter, setInternalMonthFilter] = useState('all'); // 'all' | 'recorded'
  const trackingViewMode = propTrackingViewMode !== undefined ? propTrackingViewMode : internalTrackingViewMode;
  const setTrackingViewMode = onTrackingViewModeChange || setInternalTrackingViewMode;
  const monthFilter = propMonthFilter !== undefined ? propMonthFilter : internalMonthFilter;
  const setMonthFilter = onMonthFilterChange || setInternalMonthFilter;
  const [budgetTrackingData, setBudgetTrackingData] = useState([]);
  const [expandedCardIds, setExpandedCardIds] = useState({});

  const handleToggleExpand = (id) => {
    setExpandedCardIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Fetch real budget tracking records from PostgreSQL database
  const fetchBudgetTracking = () => {
    fetch('/api/hostel/budget-tracking')
      .then(res => res.json())
      .then(d => {
        if (d?.items && d.items.length > 0) {
          setBudgetTrackingData(d.items);
        }
      })
      .catch(err => console.warn('Hostel budget tracking load notice:', err));
  };

  useEffect(() => {
    fetchBudgetTracking();
  }, []);

  useEffect(() => {
    if (computedMatrix?.hostel_budget_tracking && computedMatrix.hostel_budget_tracking.length > 0) {
      setBudgetTrackingData(computedMatrix.hostel_budget_tracking);
    }
  }, [computedMatrix?.hostel_budget_tracking]);

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // Identify currently selected active month
  const activePeriodObj = useMemo(() => {
    if (activePeriod && activePeriod !== 'all') {
      return periods.find(p => String(p.id) === String(activePeriod)) || periods[0] || {};
    }
    // Default to the period that has actual recorded spend (e.g. Period 30 Oct'26)
    const withSpend = periods.find(p => {
      const col = getBudgetMonthCol(p, p.id);
      return (budgetTrackingData || []).some(h => num(h[col], 0) > 0);
    });
    if (withSpend) return withSpend;

    const oct = periods.find(p => String(p.id) === '30' || (p.period_label || '').toLowerCase().includes('oct'));
    return oct || periods[0] || {};
  }, [periods, activePeriod, budgetTrackingData]);

  const activeMonthCol = useMemo(() => {
    return getBudgetMonthCol(activePeriodObj, activePeriod);
  }, [activePeriodObj, activePeriod]);

  const activePeriodName = useMemo(() => {
    if (activePeriod === 'all') return 'All Months (Cumulative)';
    return activePeriodObj ? formatPeriodLabel(activePeriodObj) : (activePeriodObj?.period_label || activePeriodObj?.period_code || "Oct'25");
  }, [activePeriod, activePeriodObj]);

  // Connect 9 heads directly to DB rows
  const activeBudgetHeads = useMemo(() => {
    if (budgetTrackingData && budgetTrackingData.length > 0) {
      return budgetTrackingData.map((r, idx) => ({
        s_no: Number(r.s_no || idx + 1),
        budget_head: r.budget_head,
        sanctioned_amount: num(r.sanctioned_amount, 0),
        month_limit: num(r.month_limit, 0),
        sep_25_actual: num(r.sep_25_actual, 0),
        oct_26_actual: num(r.oct_26_actual, 0),
        nov_26_actual: num(r.nov_26_actual, 0),
        dec_26_actual: num(r.dec_26_actual, 0),
        jan_27_actual: num(r.jan_27_actual, 0),
        feb_27_actual: num(r.feb_27_actual, 0),
        mar_27_actual: num(r.mar_27_actual, 0),
        apr_27_actual: num(r.apr_27_actual, 0),
        may_27_actual: num(r.may_27_actual, 0),
        jun_27_actual: num(r.jun_27_actual, 0),
        jul_27_actual: num(r.jul_27_actual, 0),
        aug_27_actual: num(r.aug_27_actual, 0),
        sep_27_actual: num(r.sep_27_actual, 0),
      }));
    }
    return HOSTEL_BUDGET_HEADS.map((canon) => ({
      s_no: canon.s_no,
      budget_head: canon.head,
      sanctioned_amount: canon.sanctioned,
      month_limit: canon.limit,
      sep_25_actual: 0,
      oct_26_actual: 0,
      nov_26_actual: 0,
      dec_26_actual: 0,
      jan_27_actual: 0,
      feb_27_actual: 0,
      mar_27_actual: 0,
      apr_27_actual: 0,
      may_27_actual: 0,
      jun_27_actual: 0,
      jul_27_actual: 0,
      aug_27_actual: 0,
      sep_27_actual: 0,
    }));
  }, [budgetTrackingData]);

  // Totals for the 9 Heads from DB
  const totalSanctionedSum = useMemo(() => {
    return activeBudgetHeads.reduce((acc, h) => acc + num(h.sanctioned_amount, 0), 0);
  }, [activeBudgetHeads]);

  const totalMonthLimitSum = useMemo(() => {
    return activeBudgetHeads.reduce((acc, h) => acc + num(h.month_limit, 0), 0);
  }, [activeBudgetHeads]);

  const activeMonthActualSum = useMemo(() => {
    return activeBudgetHeads.reduce((acc, h) => acc + num(h[activeMonthCol], 0), 0);
  }, [activeBudgetHeads, activeMonthCol]);

  // Dynamically derive columns from hostel periods passed from live DB
  const allHostelMonthCols = useMemo(() => {
    if (periods && periods.length > 0) {
      return periods.map(p => ({
        key: getBudgetMonthCol(p, p.id),
        label: formatPeriodLabel(p),
        periodId: p.id
      }));
    }
    return ALL_BUDGET_MONTH_COLS;
  }, [periods]);

  // Filter columns: if monthFilter === 'recorded', show only columns that have data or are currently active
  const visibleMonthCols = useMemo(() => {
    if (monthFilter === 'recorded') {
      return allHostelMonthCols.filter(m => {
        const isCurrentActive = m.key === activeMonthCol;
        const hasSpend = activeBudgetHeads.some(h => num(h[m.key], 0) > 0);
        return isCurrentActive || hasSpend;
      });
    }
    return allHostelMonthCols;
  }, [allHostelMonthCols, monthFilter, activeMonthCol, activeBudgetHeads]);

  const allMonthsActualSum = useMemo(() => {
    return activeBudgetHeads.reduce((acc, h) => {
      return acc + (visibleMonthCols || []).reduce((mAcc, m) => mAcc + num(h[m.key], 0), 0);
    }, 0);
  }, [activeBudgetHeads, visibleMonthCols]);

  const periodRangeLabel = useMemo(() => {
    if (visibleMonthCols && visibleMonthCols.length > 0) {
      return `${visibleMonthCols[0].label} – ${visibleMonthCols[visibleMonthCols.length - 1].label}`;
    }
    return "Sep'25 – Sep'26";
  }, [visibleMonthCols]);

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

  // Ranked cost heads for distribution view (ranked by active month spend from DB)
  const rankedCostHeads = useMemo(() => {
    return [...activeBudgetHeads]
      .filter(h => num(h[activeMonthCol], 0) > 0)
      .sort((a, b) => num(b[activeMonthCol], 0) - num(a[activeMonthCol], 0));
  }, [activeBudgetHeads, activeMonthCol]);

  // Colors for the 9 Budget Heads aligning with CategoryCard design
  const HEAD_COLORS = [
    '#5b5bf0', // 1. Indigo - Rent
    '#06b6d4', // 2. Cyan - Printing
    '#8b5cf6', // 3. Violet - Rates & Taxes
    '#f59e0b', // 4. Amber - Employee Cost
    '#6366f1', // 5. Purple - Hostel Management
    '#ea580c', // 6. Orange - Utility
    '#0284c7', // 7. Sky Blue - Laundry
    '#ef4444', // 8. Red - Repairs
    '#ec4899'  // 9. Pink - Events
  ];

  // All Census Map for month-by-month live breakdown from PostgreSQL DB
  const allHostelCensusMap = useMemo(() => {
    return computedMatrix?.hostel_census || {};
  }, [computedMatrix]);

  // Operational Person / Occupancy Card
  const personCategory = useMemo(() => {
    const isAll = activePeriod === 'all';
    const selCensus = !isAll
      ? (allHostelCensusMap[String(activePeriod)] || allHostelCensusMap[activePeriod] || census || {})
      : census;

    const monthlyPersons = {};
    let totalOccupantsSum = 0;
    let totalStudentsSum = 0;
    let totalStaffSum = 0;
    let totalVacantSum = 0;
    let countWithData = 0;

    (periods || []).forEach(p => {
      const c = allHostelCensusMap[String(p.id)] || allHostelCensusMap[p.id] || {};
      const occ = num(c.total_occupied, 0);
      monthlyPersons[p.id] = occ;

      if (occ > 0) {
        totalOccupantsSum += occ;
        totalStudentsSum += num(c.students_total, 0);
        totalStaffSum += num(c.staff_total, 0);
        totalVacantSum += num(c.vacant_total, 0);
        countWithData += 1;
      }
    });

    const avgOccupants = countWithData > 0 ? Math.round(totalOccupantsSum / countWithData) : 0;
    const avgStudents = countWithData > 0 ? Math.round(totalStudentsSum / countWithData) : 0;
    const avgStaff = countWithData > 0 ? Math.round(totalStaffSum / countWithData) : 0;
    const avgVacant = countWithData > 0 ? Math.round(totalVacantSum / countWithData) : 0;

    // For single month: that month's occupied count.
    // For 'all': do not show total cumulative occupants across cycles
    const selectedAmount = isAll
      ? 0
      : num(selCensus?.total_occupied, 0);

    const students = isAll ? 0 : num(selCensus?.students_total, 0);
    const staff = isAll ? 0 : num(selCensus?.staff_total, 0);
    const vacant = isAll ? 0 : num(selCensus?.vacant_total, 0);

    const maxMonth = Math.max(...Object.values(monthlyPersons), 1);

    return {
      categoryId: 'hostel_person_card',
      categoryName: 'Person (Resident Occupants)',
      color: '#06b6d4',
      isPersonCategory: true,
      selectedAmount: selectedAmount,
      selectedPercent: 0,
      monthlyAmounts: monthlyPersons,
      maxMonthlyAmount: maxMonth,
      items: [
        { id: 'p_students', name: isAll ? 'Total Students (Cumulative)' : 'Students count', amount: students },
        { id: 'p_staff', name: isAll ? 'Total Staff (Cumulative)' : 'Staff count', amount: staff },
        { id: 'p_vacant', name: isAll ? 'Total Vacant Beds' : 'Vacant Bed Capacity', amount: vacant },
        ...(isAll ? [{ id: 'p_avg', name: 'Monthly Average Occupancy', amount: avgOccupants }] : [])
      ]
    };
  }, [census, periods, activePeriod, allHostelCensusMap]);

  // Cost Per Occupant Card
  const costPerPersonCategory = useMemo(() => {
    const isAll = activePeriod === 'all';
    const selCensus = !isAll
      ? (allHostelCensusMap[String(activePeriod)] || allHostelCensusMap[activePeriod] || census || {})
      : census;

    const monthlyCostPerPerson = {};
    let sumCostMonth = 0;
    let sumCostDay = 0;
    let countWithCost = 0;

    (periods || []).forEach(p => {
      const c = allHostelCensusMap[String(p.id)] || allHostelCensusMap[p.id] || {};
      const mCol = getBudgetMonthCol(p, p.id);
      const pSpend = (activeBudgetHeads || []).reduce((sum, h) => sum + num(h[mCol], 0), 0) || num(c.expenses_occurred, 0);
      const occ = num(c.total_occupied, num(c.students_total, 0) + num(c.staff_total, 0));
      const costMonth = occ > 0 ? (pSpend / occ) : (num(c.students_total, 0) > 0 ? (pSpend / num(c.students_total, 0)) : num(c.per_student_cost_month, 0));
      const costDay = costMonth > 0 ? (costMonth / 30) : num(c.per_student_cost_day, 0);

      monthlyCostPerPerson[p.id] = costMonth;

      if (costMonth > 0) {
        sumCostMonth += costMonth;
        sumCostDay += costDay;
        countWithCost += 1;
      }
    });

    const avgCostMonth = countWithCost > 0 ? (sumCostMonth / countWithCost) : 0;
    const avgCostDay = countWithCost > 0 ? (sumCostDay / countWithCost) : 0;

    const selCol = activeMonthCol;
    const selSpend = (activeBudgetHeads || []).reduce((sum, h) => sum + (selCol ? num(h[selCol], 0) : 0), 0) || num(selCensus?.expenses_occurred, 0);
    const selOcc = num(selCensus?.total_occupied, num(selCensus?.students_total, 0) + num(selCensus?.staff_total, 0));
    const selCostMonth = isAll ? avgCostMonth : (selOcc > 0 ? (selSpend / selOcc) : (num(selCensus?.students_total, 0) > 0 ? (selSpend / num(selCensus?.students_total, 0)) : num(selCensus?.per_student_cost_month, 0)));
    const selCostDay = isAll ? avgCostDay : (selCostMonth > 0 ? (selCostMonth / 30) : num(selCensus?.per_student_cost_day, 0));

    const selectedAmount = isAll ? avgCostMonth : selCostMonth;
    const costMonth = isAll ? avgCostMonth : selCostMonth;
    const costDay = isAll ? avgCostDay : selCostDay;

    const maxMonth = Math.max(...Object.values(monthlyCostPerPerson), 1);

    return {
      categoryId: 'hostel_cost_per_person',
      categoryName: 'Cost Per Occupant',
      color: '#f43f5e',
      isPersonCategory: false,
      isCostPerPerson: true,
      selectedAmount: Math.round(selectedAmount * 100) / 100,
      selectedPercent: 0,
      monthlyAmounts: monthlyCostPerPerson,
      maxMonthlyAmount: maxMonth,
      items: [
        { id: 'cpp_month', name: isAll ? 'Avg Cost Per Resident (Month)' : 'Cost Per Resident (Month)', amount: Math.round(costMonth * 100) / 100 },
        { id: 'cpp_day', name: isAll ? 'Avg Cost Per Resident (Day)' : 'Cost Per Resident (Day)', amount: Math.round(costDay * 100) / 100 }
      ]
    };
  }, [census, periods, activePeriod, allHostelCensusMap, activeBudgetHeads, activeMonthCol]);

  // Filtered periods for category sparkline bars aligning with monthFilter
  const cardPeriods = useMemo(() => {
    if (monthFilter === 'recorded') {
      return (periods || []).filter(p => visibleMonthCols.some(v => v.periodId === p.id));
    }
    return periods || [];
  }, [monthFilter, periods, visibleMonthCols]);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* HOSTEL BUDGET TRACKING SUMMARY */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #cbd5e1',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)'
      }}>
        {/* ------------------------------------------------------------- */}
        {/* VIEW A: CATEGORY CARDS GRID                                    */}
        {/* Rendered when trackingViewMode === 'both' or 'cards'           */}
        {/* ------------------------------------------------------------- */}
        {(trackingViewMode === 'all' || trackingViewMode === 'both' || trackingViewMode === 'cards') && (
          <div style={{
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderBottom: (trackingViewMode === 'all' || trackingViewMode === 'both') ? '2px solid #e2e8f0' : 'none'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}>
              {activeBudgetHeads.map((head, idx) => {
                const monthlyAmounts = {};
                (periods || []).forEach(p => {
                  const colKey = getBudgetMonthCol(p, p.id);
                  monthlyAmounts[p.id] = num(head[colKey], 0);
                });

                const isAll = activePeriod === 'all';
                const selAmount = isAll
                  ? Object.values(monthlyAmounts).reduce((a, b) => a + b, 0)
                  : num(head[activeMonthCol], 0);

                const totalSelectionSpend = isAll
                  ? (allMonthsActualSum > 0 ? allMonthsActualSum : 1)
                  : (activeMonthActualSum > 0 ? activeMonthActualSum : 1);

                const selPercent = totalSelectionSpend > 0
                  ? Number(((selAmount / totalSelectionSpend) * 100).toFixed(1))
                  : 0;

                const maxMonth = Math.max(...Object.values(monthlyAmounts), 1);
                const cardColor = HEAD_COLORS[(head.s_no - 1) % HEAD_COLORS.length];

                const categoryObj = {
                  categoryId: `head_${head.s_no}`,
                  categoryName: head.budget_head,
                  color: cardColor,
                  items: [],
                  hideDetails: true,
                  isPersonCategory: false
                };

                return (
                  <CategoryCard
                    key={head.budget_head || idx}
                    category={categoryObj}
                    periods={cardPeriods}
                    selectedPeriod={activePeriod}
                    selectedAmount={selAmount}
                    selectedPercent={selPercent}
                    monthlyAmounts={monthlyAmounts}
                    maxMonthlyAmount={maxMonth}
                    isExpanded={false}
                    onToggleExpand={() => {}}
                    formatCompact={formatIndianCompact}
                    formatFull={formatINR}
                    hideDetails={true}
                    remarksDraft={remarksDraft}
                  />
                );
              })}
              {(() => {
                const totMonthly = {};
                (periods || []).forEach(p => {
                  const colKey = getBudgetMonthCol(p, p.id);
                  totMonthly[p.id] = (activeBudgetHeads || []).reduce((sum, h) => sum + num(h[colKey], 0), 0);
                });
                const isAll = activePeriod === 'all';
                const totAmount = isAll ? allMonthsActualSum : activeMonthActualSum;
                const totMax = Math.max(...Object.values(totMonthly), 1);
                return (
                  <CategoryCard
                    key="hostel_total_expenses"
                    category={{
                      categoryId: 'hostel_total_expenses',
                      categoryName: 'Total Expenses',
                      color: '#14245C',
                      items: [],
                      hideDetails: true,
                      isPersonCategory: false
                    }}
                    periods={cardPeriods}
                    selectedPeriod={activePeriod}
                    selectedAmount={totAmount}
                    selectedPercent={totAmount > 0 ? 100 : 0}
                    monthlyAmounts={totMonthly}
                    maxMonthlyAmount={totMax}
                    isExpanded={false}
                    onToggleExpand={() => {}}
                    formatCompact={formatIndianCompact}
                    formatFull={formatINR}
                    hideDetails={true}
                    remarksDraft={remarksDraft}
                  />
                );
              })()}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: '16px'
            }}>
              <CategoryCard
                category={{ ...personCategory, hideDetails: true }}
                periods={cardPeriods}
                selectedPeriod={activePeriod}
                selectedAmount={personCategory.selectedAmount}
                selectedPercent={0}
                monthlyAmounts={personCategory.monthlyAmounts}
                maxMonthlyAmount={personCategory.maxMonthlyAmount}
                isExpanded={false}
                onToggleExpand={() => {}}
                formatCompact={formatIndianCompact}
                formatFull={formatINR}
                hidePercentage={true}
                hideDetails={true}
                remarksDraft={remarksDraft}
              />
              <CategoryCard
                category={{ ...costPerPersonCategory, hideDetails: true }}
                periods={cardPeriods}
                selectedPeriod={activePeriod}
                selectedAmount={costPerPersonCategory.selectedAmount}
                selectedPercent={0}
                monthlyAmounts={costPerPersonCategory.monthlyAmounts}
                maxMonthlyAmount={costPerPersonCategory.maxMonthlyAmount}
                isExpanded={false}
                onToggleExpand={() => {}}
                formatCompact={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                formatFull={formatINR}
                hidePercentage={true}
                hideDetails={true}
                remarksDraft={remarksDraft}
              />

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* OFFICIAL HOSTEL BUDGET TRACKING LEDGER — Formal Ledger Header  */}
        {/* ============================================================== */}
        {(trackingViewMode === 'all' || trackingViewMode === 'both' || trackingViewMode === 'matrix') && (
          <div style={{ overflowX: 'auto', width: '100%' }}>

            {/* Formal Ledger Title Header */}
            <div style={{
              backgroundColor: 'var(--primary, #14245C)',
              padding: '18px 24px 14px 24px',
              borderBottom: '3px solid var(--accent, #F5A524)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              {/* Left: Ledger Title Block */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(251,191,36,0.15)',
                  border: '2px solid rgba(251,191,36,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Landmark size={22} color="#fbbf24" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#fbbf24', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '2px' }}>
                    Official Hostel Budget Tracking Ledger
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                    Budget Allocation &amp; Expenditure Ledger
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#a5b4fc', marginTop: '3px', fontWeight: '600' }}>
                    9 Budget Heads &nbsp;•&nbsp; Period: <span style={{ color: '#fbbf24' }}>{periodRangeLabel}</span>
                  </div>
                </div>
              </div>
              {/* Right: Month filter + KPI */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase' }}>Sanctioned Budget</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#86efac' }} className="currency-font">{formatINR(totalSanctionedSum)}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase' }}>Total Spent</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#fbbf24' }} className="currency-font">{formatINR(allMonthsActualSum)}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase' }}>Balance</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#67e8f9' }} className="currency-font">{formatINR(totalSanctionedSum - allMonthsActualSum)}</div>
                  </div>
                </div>
                <div style={{
                  fontSize: '10.5px',
                  fontWeight: '700',
                  color: allMonthsActualSum <= totalSanctionedSum ? '#86efac' : '#fca5a5',
                  backgroundColor: allMonthsActualSum <= totalSanctionedSum ? 'rgba(134,239,172,0.12)' : 'rgba(252,165,165,0.12)',
                  border: `1px solid ${allMonthsActualSum <= totalSanctionedSum ? 'rgba(134,239,172,0.3)' : 'rgba(252,165,165,0.3)'}`,
                  padding: '2px 10px',
                  borderRadius: '9999px'
                }}>
                  {totalSanctionedSum > 0 ? ((allMonthsActualSum / totalSanctionedSum) * 100).toFixed(1) : '0.0'}% Utilized &nbsp;{allMonthsActualSum <= totalSanctionedSum ? '✓ Within Budget' : '⚠ Over Budget'}
                </div>
              </div>
            </div>

            {/* Ledger Matrix Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '980px' }}>
              <thead>
                {/* Sub-header: group labels */}
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <th colSpan={3} style={{ padding: '7px 14px', textAlign: 'left', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', borderRight: '2px solid #cbd5e1' }}>
                    Budget Head Details
                  </th>
                  <th colSpan={visibleMonthCols.length} style={{ padding: '7px 14px', textAlign: 'center', fontSize: '10px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em', borderRight: '2px solid #cbd5e1', backgroundColor: '#eff6ff' }}>
                    Month-wise Actual Expenditure (₹)
                  </th>
                  <th colSpan={3} style={{ padding: '7px 14px', textAlign: 'center', fontSize: '10px', fontWeight: '800', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: '#ecfdf5' }}>
                    Summary
                  </th>
                </tr>
                {/* Column Headers */}
                <tr style={{ backgroundColor: '#1e293b', color: '#f8fafc', fontWeight: '800', fontSize: '11px' }}>
                  <th style={{ padding: '11px 10px', textAlign: 'center', width: '40px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>S.No</th>
                  <th style={{ padding: '11px 14px', textAlign: 'left', minWidth: '210px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Budget Head</th>
                  <th style={{ padding: '11px 14px', textAlign: 'right', minWidth: '130px', backgroundColor: '#064e3b', color: '#6ee7b7', borderRight: '2px solid rgba(255,255,255,0.15)' }}>
                    Sanctioned Amount (₹)
                  </th>
                  {visibleMonthCols.map((m) => {
                    const isActive = activePeriod !== 'all' && m.key === activeMonthCol;
                    return (
                      <th key={m.key} style={{
                        padding: '11px 10px',
                        textAlign: 'right',
                        minWidth: '90px',
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
                  {/* Summary Columns */}
                  <th style={{ padding: '11px 14px', textAlign: 'right', minWidth: '120px', backgroundColor: '#0c4a6e', color: '#7dd3fc', borderLeft: '2px solid rgba(255,255,255,0.15)' }}>
                    TOTAL SPENT (₹)
                  </th>
                  <th style={{ padding: '11px 14px', textAlign: 'right', minWidth: '120px', backgroundColor: '#064e3b', color: '#6ee7b7' }}>
                    BALANCE (₹)
                  </th>
                  <th style={{ padding: '11px 14px', textAlign: 'center', minWidth: '90px', backgroundColor: '#3b0764', color: '#d8b4fe' }}>
                    % UTILIZED
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeBudgetHeads.map((head, idx) => {
                  const sanc = num(head.sanctioned_amount, 0);
                  const totalSpent = visibleMonthCols.reduce((acc, m) => acc + num(head[m.key], 0), 0);
                  const balance = sanc - totalSpent;
                  const utilPct = sanc > 0 ? ((totalSpent / sanc) * 100) : 0;
                  const isOver = totalSpent > sanc && sanc > 0;

                  return (
                    <tr key={head.budget_head || idx} style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      transition: 'background-color 0.15s ease'
                    }}>
                      <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '700', color: '#94a3b8', fontSize: '11px', borderRight: '1px solid #f1f5f9' }}>
                        {head.s_no}
                      </td>
                      <td style={{ padding: '12px 14px', borderRight: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '8px',
                            backgroundColor: '#f1f5f9', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            {getHeadIcon(head.s_no)}
                          </div>
                          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '12.5px' }}>
                            {head.budget_head}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: '#166534', backgroundColor: '#f0fdf4', borderRight: '2px solid #bbf7d0' }} className="currency-font">
                        {formatINR(sanc)}
                      </td>

                      {/* Month columns */}
                      {visibleMonthCols.map((m) => {
                        const mVal = num(head[m.key], 0);
                        const isActive = activePeriod !== 'all' && m.key === activeMonthCol;
                        return (
                          <td key={m.key} style={{
                            padding: '12px 10px', textAlign: 'right',
                            fontWeight: isActive ? '900' : '500',
                            backgroundColor: isActive ? '#eff6ff' : 'transparent',
                            color: mVal > 0 ? (isActive ? '#1e40af' : '#334155') : '#cbd5e1',
                            borderRight: '1px solid #f1f5f9'
                          }} className="currency-font">
                            {mVal > 0 ? formatINR(mVal) : '—'}
                          </td>
                        );
                      })}

                      {/* Total Spent */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: totalSpent > 0 ? '#0369a1' : '#94a3b8', backgroundColor: '#f0f9ff', borderLeft: '2px solid #bae6fd' }} className="currency-font">
                        {totalSpent > 0 ? formatINR(totalSpent) : '₹0'}
                      </td>

                      {/* Balance */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: isOver ? '#dc2626' : '#166534', backgroundColor: isOver ? '#fef2f2' : '#f0fdf4' }} className="currency-font">
                        {formatINR(Math.abs(balance))}{isOver ? ' OVR' : ''}
                      </td>

                      {/* % Utilized */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', backgroundColor: '#faf5ff' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11.5px',
                          fontWeight: '800',
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
                {/* Grand Total Row */}
                <tr style={{ backgroundColor: '#FFF8EA', borderTop: '3px solid var(--accent, #F5A524)', borderBottom: '2px solid var(--accent, #F5A524)', fontWeight: '900', color: 'var(--primary, #14245C)' }}>
                  <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px' }}>∑</td>
                  <td style={{ padding: '14px 14px', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Grand Total — All Budget Heads
                  </td>
                  <td style={{ padding: '14px 14px', textAlign: 'right', fontSize: '13.5px', color: '#0F6B3A', backgroundColor: '#E4F6EC', fontWeight: '900', borderRight: '2px solid #b7e8cc' }} className="currency-font">
                    {formatINR(totalSanctionedSum)}
                  </td>
                  {visibleMonthCols.map((m) => {
                    const mSum = activeBudgetHeads.reduce((acc, h) => acc + num(h[m.key], 0), 0);
                    const isActive = activePeriod !== 'all' && m.key === activeMonthCol;
                    return (
                      <td key={m.key} style={{
                        padding: '14px 10px', textAlign: 'right', fontSize: '13px', fontWeight: '900',
                        backgroundColor: isActive ? '#FEF0C7' : '#FFF8EA',
                        color: mSum > 0 ? 'var(--primary, #14245C)' : '#8A4A00',
                        borderRight: '1px solid rgba(245, 165, 36, 0.35)'
                      }} className="currency-font">
                        {mSum > 0 ? formatINR(mSum) : '—'}
                      </td>
                    );
                  })}
                  <td style={{ padding: '14px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '900', color: 'var(--primary, #14245C)', backgroundColor: '#EDF2FF', borderLeft: '2px solid #cbd5e1' }} className="currency-font">
                    {formatINR(allMonthsActualSum)}
                  </td>
                  <td style={{ padding: '14px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '900', color: allMonthsActualSum <= totalSanctionedSum ? '#0F6B3A' : '#A32626', backgroundColor: allMonthsActualSum <= totalSanctionedSum ? '#E4F6EC' : '#FBE3E3' }} className="currency-font">
                    {formatINR(Math.abs(totalSanctionedSum - allMonthsActualSum))}
                  </td>
                  <td style={{ padding: '14px 14px', textAlign: 'center', backgroundColor: '#FFF8EA' }}>
                    <span style={{
                      display: 'inline-block', padding: '4px 12px', borderRadius: '9999px',
                      fontSize: '12px', fontWeight: '900',
                      backgroundColor: 'var(--accent, #F5A524)', color: 'var(--primary, #14245C)',
                      border: '1.5px solid #d98a0b'
                    }}>
                      {totalSanctionedSum > 0 ? ((allMonthsActualSum / totalSanctionedSum) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

      </div>
    </section>
  );
}
