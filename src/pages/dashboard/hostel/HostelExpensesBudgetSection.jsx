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
  remarksDraft = {}
}) {
  const [trackingViewMode, setTrackingViewMode] = useState('both'); // 'both' | 'cards' | 'matrix' | 'distribution'
  const [monthFilter, setMonthFilter] = useState('all'); // 'all' | 'recorded'
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
                  {periodRangeLabel} ({visibleMonthCols.length} Months)
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#c7d2fe' }}>
                9 Official Budget Heads • Sanctioned Budget vs Monthly Actual Expenditure
              </p>
            </div>
          </div>

          {/* Interactive Month Filter & View Switcher Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Filter: All Months vs Recorded Spend */}
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
                All Months ({allHostelMonthCols.length})
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
                Active & Recorded Only
              </button>
            </div>

            {/* View Switcher Toggles: Both (Default), Cards, Matrix Table, Cost Drivers */}
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
                onClick={() => setTrackingViewMode('both')}
                style={{
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  backgroundColor: trackingViewMode === 'both' ? '#ffffff' : 'transparent',
                  color: trackingViewMode === 'both' ? '#1e1b4b' : '#c7d2fe',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Layers size={13} />
                <span>Both (Cards & Table)</span>
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
                <span>Cards View</span>
              </button>
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
                <span>Hostel Ledger</span>
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
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW A: CATEGORY CARDS GRID (Food Dashboard Design)            */}
        {/* Rendered when trackingViewMode === 'both' or 'cards'          */}
        {/* ------------------------------------------------------------- */}
        {(trackingViewMode === 'both' || trackingViewMode === 'cards') && (
          <div style={{
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderBottom: trackingViewMode === 'both' ? '2px solid #e2e8f0' : 'none'
          }}>
            {/* Row 1: 9 Operating Budget Heads CategoryCards */}
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
            </div>

            {/* Row 2: Operational Census & Unit Economics Cards (matching Food Dashboard) */}
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
        {(trackingViewMode === 'both' || trackingViewMode === 'matrix') && (
          <div style={{ overflowX: 'auto', width: '100%' }}>

            {/* Formal Ledger Title Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
              padding: '18px 24px 14px 24px',
              borderBottom: '3px solid #fbbf24',
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
                <tr style={{ backgroundColor: '#fef08a', borderTop: '3px solid #ca8a04', fontWeight: '900', color: '#713f12' }}>
                  <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '14px' }}>∑</td>
                  <td style={{ padding: '14px 14px', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Grand Total — All Budget Heads
                  </td>
                  <td style={{ padding: '14px 14px', textAlign: 'right', fontSize: '13.5px', color: '#166534', backgroundColor: '#dcfce7', fontWeight: '900', borderRight: '2px solid #bbf7d0' }} className="currency-font">
                    {formatINR(totalSanctionedSum)}
                  </td>
                  {visibleMonthCols.map((m) => {
                    const mSum = activeBudgetHeads.reduce((acc, h) => acc + num(h[m.key], 0), 0);
                    const isActive = activePeriod !== 'all' && m.key === activeMonthCol;
                    return (
                      <td key={m.key} style={{
                        padding: '14px 10px', textAlign: 'right', fontSize: '13px', fontWeight: '900',
                        backgroundColor: isActive ? '#fef9c3' : '#fefce8',
                        color: mSum > 0 ? '#713f12' : '#a16207',
                        borderRight: '1px solid rgba(202,138,4,0.3)'
                      }} className="currency-font">
                        {mSum > 0 ? formatINR(mSum) : '—'}
                      </td>
                    );
                  })}
                  <td style={{ padding: '14px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '900', color: '#0369a1', backgroundColor: '#e0f2fe', borderLeft: '2px solid #7dd3fc' }} className="currency-font">
                    {formatINR(allMonthsActualSum)}
                  </td>
                  <td style={{ padding: '14px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '900', color: allMonthsActualSum <= totalSanctionedSum ? '#166534' : '#dc2626', backgroundColor: allMonthsActualSum <= totalSanctionedSum ? '#dcfce7' : '#fee2e2' }} className="currency-font">
                    {formatINR(Math.abs(totalSanctionedSum - allMonthsActualSum))}
                  </td>
                  <td style={{ padding: '14px 14px', textAlign: 'center', backgroundColor: '#fef9c3' }}>
                    <span style={{
                      display: 'inline-block', padding: '4px 12px', borderRadius: '9999px',
                      fontSize: '12px', fontWeight: '900',
                      backgroundColor: '#fbbf24', color: '#451a03',
                      border: '2px solid #d97706'
                    }}>
                      {totalSanctionedSum > 0 ? ((allMonthsActualSum / totalSanctionedSum) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW C: COST DRIVERS & SPEND DISTRIBUTION                      */}
        {/* ------------------------------------------------------------- */}
        {trackingViewMode === 'distribution' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                Hostel Spend Distribution ({activePeriodName} Active Heads)
              </h4>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Proportional breakdown of total monthly expenditure across active operational heads directly from DB
              </p>
            </div>

            {/* Stacked Visual Bar */}
            <div style={{ width: '100%', height: '22px', borderRadius: '8px', overflow: 'hidden', display: 'flex', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
              {rankedCostHeads.map((head, idx) => {
                const actSpend = num(head[activeMonthCol], 0);
                const share = activeMonthActualSum > 0 ? (actSpend / activeMonthActualSum) * 100 : 0;
                const colors = ['#2563eb', '#4338ca', '#0284c7', '#d97706', '#dc2626', '#ea580c'];
                const bg = colors[idx % colors.length];

                return (
                  <div
                    key={head.budget_head}
                    title={`${head.budget_head}: ${share.toFixed(1)}% (${formatINR(actSpend)})`}
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
                const actSpend = num(head[activeMonthCol], 0);
                const sanc = num(head.sanctioned_amount, 0);
                const share = activeMonthActualSum > 0 ? (actSpend / activeMonthActualSum) * 100 : 0;

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
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Sanctioned: {formatINR(sanc)}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#1e40af' }}>
                        {formatINR(actSpend)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                        {share.toFixed(1)}% of total
                      </div>
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
