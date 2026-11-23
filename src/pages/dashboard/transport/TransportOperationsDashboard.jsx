import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Bus, Users, Fuel, Wrench, ShieldCheck, DollarSign, Download, 
  ArrowRight, FileSpreadsheet, Calendar, ChevronDown, Check,
  Sparkles, FileText, Printer, Paperclip, LayoutDashboard, Table, Layers,
  TrendingUp, Calculator, Gauge, MapPin, AlertCircle, RefreshCw, Search,
  CheckCircle2, ArrowUpRight, BarChart3, PieChart, LayoutGrid, ChevronUp
} from 'lucide-react';
import { formatINR, formatLakhs, formatPeriodLabel, formatIndianCompact } from '../../../utils/formatters';
import { TRANSPORT_BRANCHES, CANONICAL_TRANSPORT_PARAMETERS } from '../../data_entry/TransportSpreadsheetEntry';
import TransportVehicleExpensesTable from '../../data_entry/TransportVehicleExpensesTable';
import TransportDashboardCensusView from '../TransportDashboardCensusView';
import TransportDashboardDataTable from '../TransportDashboardDataTable';
import HeroSummary from '../charts/HeroSummary';
import CategoryCard from '../charts/CategoryCard';

export default function TransportOperationsDashboard({
  computedMatrix: propComputedMatrix,
  periods: propPeriods = [],
  categories = [],
  activePeriod = 'all',
  setActivePeriod,
  onOpenDataEntry,
  handleExportReport
}) {
  const [activeBranch, setActiveBranch] = useState('Common');
  const [activeMainView, setActiveMainView] = useState('executive'); // 'executive' | 'vehicles' | 'parameters' | 'all'
  const [localMatrix, setLocalMatrix] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParamTerm, setSearchParamTerm] = useState('');
  const [vehicleStats, setVehicleStats] = useState(null);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
  const [vehicleViewMode, setVehicleViewMode] = useState('cards'); // 'cards' | 'table'
  const [expandedVehicleId, setExpandedVehicleId] = useState(null);
  const [expandedCardIds, setExpandedCardIds] = useState({});

  const toggleCardExpand = (catId) => {
    setExpandedCardIds(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const effectiveMatrix = useMemo(() => {
    return (propComputedMatrix?.transport_census_by_branch && Object.keys(propComputedMatrix.transport_census_by_branch).length > 0)
      ? propComputedMatrix
      : (localMatrix || propComputedMatrix || {});
  }, [propComputedMatrix, localMatrix]);

  const periods = useMemo(() => {
    return (propPeriods && propPeriods.length > 0) ? propPeriods : (effectiveMatrix?.periods || []);
  }, [propPeriods, effectiveMatrix]);

  // Strict fleet-scoped periods: only show months belonging to the active fleet or 'all'
  const visiblePeriods = useMemo(() => {
    return periods.filter(p => !p.branch || p.branch === 'all' || p.branch === activeBranch);
  }, [periods, activeBranch]);

  // Disallow consolidated 'all' branch in transport
  useEffect(() => {
    if (activeBranch === 'all') {
      setActiveBranch('Common');
    }
  }, [activeBranch]);

  useEffect(() => {
    if (visiblePeriods.length > 0 && setActivePeriod) {
      const isCurrentInVisible = visiblePeriods.some(p => String(p.id) === String(activePeriod));
      if (!isCurrentInVisible && activePeriod !== 'all') {
        setActivePeriod(String(visiblePeriods[visiblePeriods.length - 1].id));
      }
    }
  }, [activePeriod, visiblePeriods, setActivePeriod]);

  // Self-healing live fetch from API if computedMatrix not yet populated for transport
  const fetchLiveMatrix = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/matrix?module=transport');
      const data = await res.json();
      if (data && data.periods) {
        setLocalMatrix(data);
      }
    } catch (err) {
      console.error('[TransportDashboard] Error fetching live transport matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasBranchData = propComputedMatrix?.transport_census_by_branch && 
      Object.keys(propComputedMatrix.transport_census_by_branch).length > 0;
    if (!hasBranchData) {
      fetchLiveMatrix();
    }
  }, [propComputedMatrix]);

  // Fetch live vehicle summary from /api/transport/vehicles for the active branch & period
  useEffect(() => {
    const targetPeriodParam = activePeriod !== 'all' ? activePeriod : 'all';
    setVehiclesLoading(true);
    fetch(`/api/transport/vehicles?period_id=${targetPeriodParam}&branch=${activeBranch}`)
      .then(res => res.json())
      .then(d => {
        if (d && d.status === 'success') {
          setVehicleStats(d);
          setVehiclesList(d.vehicles || []);
        } else {
          setVehiclesList([]);
        }
      })
      .catch(e => console.warn('[TransportDashboard] Vehicle stats notice:', e))
      .finally(() => setVehiclesLoading(false));
  }, [activePeriod, activeBranch, visiblePeriods]);

  const isAllMonths = activePeriod === 'all';

  // Effective period object for single-month snapshot metrics
  const activePeriodObj = useMemo(() => {
    if (activePeriod && activePeriod !== 'all') {
      return visiblePeriods.find(p => String(p.id) === String(activePeriod)) || visiblePeriods[visiblePeriods.length - 1] || periods[periods.length - 1] || null;
    }
    return visiblePeriods[visiblePeriods.length - 1] || periods[periods.length - 1] || null;
  }, [activePeriod, visiblePeriods, periods]);

  const activePeriodIdStr = activePeriodObj ? String(activePeriodObj.id) : null;
  const activeBranchObj = TRANSPORT_BRANCHES.find(b => b.id === activeBranch) || TRANSPORT_BRANCHES[0];

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // Branch budget map for fallback / defaults
  const branchBudgetMap = {
    Common: 3800000,
    RPS: 8500000,
    KPM: 6200000,
    University: 14000000
  };

  // Helper to compute metrics for a branch and period
  const getBranchMetrics = (branchId, pStr) => {
    if (branchId === 'all') {
      const realBranches = ['Common', 'RPS', 'KPM', 'University'];
      let totPassengers = 0;
      let totAppKms = 0;
      let totActKms = 0;
      let totAddKms = 0;
      let totFuel = 0;
      let totFc = 0;
      let totStat = 0;
      let totRep = 0;
      let totOth = 0;
      let totEmp = 0;
      let totDemand = 0;
      let totPaid = 0;
      let totRpsBill = 0;
      let totStaffDed = 0;
      let totAddKmsRps = 0;
      let totCab = 0;
      let totAppBud = 0;
      let totSpentBud = 0;
      let totTkRaised = 0;
      let totTkClosed = 0;
      let totDiesel = 0;

      realBranches.forEach(b => {
        const m = effectiveMatrix?.transport_census_by_branch?.[b]?.[pStr] || {};
        totPassengers += num(m.passengers_count, 0);
        totAppKms += num(m.approved_kms, 0);
        totActKms += num(m.actual_kms, 0);
        totAddKms += num(m.additional_kms, 0);
        totFuel += num(m.fuel_expenses, 0);
        totFc += num(m.fc_cost, 0);
        totStat += num(m.statutory_cost, 0);
        totRep += num(m.repair_maintenance_cost, 0);
        totOth += num(m.other_cost, 0);
        totEmp += num(m.employee_cost, 0);
        totDemand += num(m.fee_demand, 0);
        totPaid += num(m.fee_collected, 0);
        totRpsBill += num(m.rps_monthly_billing, 0);
        totStaffDed += num(m.staff_travel_deduction, 0);
        totAddKmsRps += num(m.additional_kms_billed_rps, 0);
        totCab += num(m.cab_billing, 0);
        totAppBud += num(m.approved_budget, 0);
        totSpentBud += num(m.cumulative_budget_spent, 0);
        totTkRaised += num(m.service_tickets_raised, 0);
        totTkClosed += num(m.service_tickets_closed, 0);
        totDiesel += num(m.diesel_litres, 0);
      });

      const totExpenses = totFuel + totFc + totStat + totRep + totOth + totEmp;
      const totIncome = totPaid + totRpsBill + totStaffDed + totAddKmsRps + totCab;
      const totBal = totAppBud - totSpentBud;

      return {
        vehicles_count: '58 Buses (All 4 Fleets)',
        bus_count_num: 58,
        passengers_count: totPassengers,
        approved_kms: totAppKms,
        actual_kms: totActKms,
        excess_minus_kms_rps: totActKms - totAppKms,
        additional_kms: totAddKms,
        fuel_expenses: totFuel,
        fc_cost: totFc,
        statutory_cost: totStat,
        repair_maintenance_cost: totRep,
        other_cost: totOth,
        employee_cost: totEmp,
        total_expenses: totExpenses,
        fee_demand: totDemand,
        fee_collected: totPaid,
        fee_unpaid: Math.max(0, totDemand - totPaid),
        rps_monthly_billing: totRpsBill,
        staff_travel_deduction: totStaffDed,
        cumulative_income: totIncome,
        approved_budget: totAppBud || 37730138,
        cumulative_budget_spent: totSpentBud,
        balance: (totAppBud || 37730138) - totSpentBud,
        service_tickets_raised: totTkRaised,
        service_tickets_closed: totTkClosed,
        service_tickets_open: Math.max(0, totTkRaised - totTkClosed),
        diesel_litres: totDiesel,
        cab_billing: totCab,
        fuel_cost_per_km: totActKms > 0 ? (totFuel / totActKms).toFixed(2) : '0.00',
        avg_mileage: totDiesel > 0 ? (totActKms / totDiesel).toFixed(2) : '0.00'
      };
    }

    const m = effectiveMatrix?.transport_census_by_branch?.[branchId]?.[pStr] || {};
    const actKms = num(m.actual_kms, 0);
    const appKms = num(m.approved_kms, 0);
    const fuel = num(m.fuel_expenses, 0);
    const fc = num(m.fc_cost, 0);
    const stat = num(m.statutory_cost, 0);
    const rep = num(m.repair_maintenance_cost, 0);
    const oth = num(m.other_cost, 0);
    const emp = num(m.employee_cost, 0);
    const totExpenses = fuel + fc + stat + rep + oth + emp;
    const diesel = num(m.diesel_litres, 0);
    const demand = num(m.fee_demand, 0);
    const paid = num(m.fee_collected, 0);
    const appBud = num(m.approved_budget, 0) || branchBudgetMap[branchId] || 8500000;
    const spentBud = num(m.cumulative_budget_spent, 0);
    const tkRaised = num(m.service_tickets_raised, 0);
    const tkClosed = num(m.service_tickets_closed, 0);

    const branchBusCount = branchId === 'Common' ? 18 : (branchId === 'RPS' ? 19 : (branchId === 'University' ? 16 : 5));

    return {
      vehicles_count: `${branchBusCount} Buses`,
      bus_count_num: branchBusCount,
      passengers_count: num(m.passengers_count, 0),
      approved_kms: appKms,
      actual_kms: actKms,
      excess_minus_kms_rps: actKms - appKms,
      additional_kms: num(m.additional_kms, 0),
      fuel_expenses: fuel,
      fc_cost: fc,
      statutory_cost: stat,
      repair_maintenance_cost: rep,
      other_cost: oth,
      employee_cost: emp,
      total_expenses: totExpenses,
      fee_demand: demand,
      fee_collected: paid,
      fee_unpaid: Math.max(0, demand - paid),
      rps_monthly_billing: num(m.rps_monthly_billing, 0),
      staff_travel_deduction: num(m.staff_travel_deduction, 0),
      cumulative_income: paid + num(m.rps_monthly_billing, 0) + num(m.staff_travel_deduction, 0) + num(m.cab_billing, 0),
      approved_budget: appBud,
      cumulative_budget_spent: spentBud,
      balance: appBud - spentBud,
      service_tickets_raised: tkRaised,
      service_tickets_closed: tkClosed,
      service_tickets_open: Math.max(0, tkRaised - tkClosed),
      diesel_litres: diesel,
      cab_billing: num(m.cab_billing, 0),
      fuel_cost_per_km: actKms > 0 ? (fuel / actKms).toFixed(2) : '0.00',
      avg_mileage: diesel > 0 ? (actKms / diesel).toFixed(2) : '0.00'
    };
  };

  // Single-month metrics strictly for the currently selected fleet branch
  const metrics = useMemo(() => {
    return getBranchMetrics(activeBranch, activePeriodIdStr || String(periods[periods.length - 1]?.id || '1026'));
  }, [activeBranch, activePeriodIdStr, periods, effectiveMatrix]);

  // Effective metrics for a branch taking into account currently selected month
  const getBranchEffectiveMetrics = (branchId) => {
    return getBranchMetrics(branchId, activePeriodIdStr || String(periods[periods.length - 1]?.id || '1026'));
  };

  // Helper to extract parameter value for a specific branch and period
  const getParamVal = (branchId, periodIdStr, paramKey) => {
    if (branchId === 'all') {
      const realBranches = ['Common', 'RPS', 'KPM', 'University'];
      let tot = 0;
      let hasAny = false;
      realBranches.forEach(b => {
        const d = effectiveMatrix?.transport_census_by_branch?.[b]?.[periodIdStr] || {};
        if (d[paramKey] !== undefined && d[paramKey] !== null && d[paramKey] !== '') {
          tot += num(d[paramKey], 0);
          hasAny = true;
        }
      });
      return hasAny ? tot : 0;
    }
    const d = effectiveMatrix?.transport_census_by_branch?.[branchId]?.[periodIdStr] || {};
    return num(d[paramKey], 0);
  };

  // Helper to calculate total across all periods for a parameter
  const getParamAllMonthsTotal = (branchId, paramKey) => {
    let tot = 0;
    periods.forEach(p => {
      tot += getParamVal(branchId, String(p.id), paramKey);
    });
    return tot;
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered parameters for Section 1 multi-month sheet
  const filteredParameters = useMemo(() => {
    if (!searchParamTerm.trim()) return CANONICAL_TRANSPORT_PARAMETERS;
    const term = searchParamTerm.toLowerCase();
    return CANONICAL_TRANSPORT_PARAMETERS.filter(p => 
      p.param_name.toLowerCase().includes(term) ||
      p.section.toLowerCase().includes(term) ||
      (p.param_key && p.param_key.toLowerCase().includes(term))
    );
  }, [searchParamTerm]);

  // Grand totals across visible periods for the active fleet
  const monthlyGrandTotals = useMemo(() => {
    const totals = {};
    let grandOverall = 0;
    visiblePeriods.forEach(p => {
      const pBm = getBranchMetrics(activeBranch, String(p.id));
      const pTot = pBm?.total_expenses || 0;
      totals[p.id] = pTot;
      grandOverall += pTot;
    });
    const avgMonthly = visiblePeriods.length > 0 ? grandOverall / visiblePeriods.length : 0;
    return {
      byPeriod: totals,
      grandOverall,
      avgMonthly
    };
  }, [visiblePeriods, activeBranch, effectiveMatrix]);

  const currentGrandTotal = useMemo(() => {
    if (isAllMonths) {
      return monthlyGrandTotals.grandOverall;
    }
    return monthlyGrandTotals.byPeriod[activePeriod] || metrics.total_expenses;
  }, [isAllMonths, monthlyGrandTotals, activePeriod, metrics]);

  // Previous period comparison for Hero
  const { prevPeriodTotal, prevPeriodLabel, isFirstPeriod } = useMemo(() => {
    if (isAllMonths) {
      return { prevPeriodTotal: null, prevPeriodLabel: null, isFirstPeriod: false };
    }
    const idx = visiblePeriods.findIndex(p => String(p.id) === String(activePeriod));
    if (idx === 0) {
      return { prevPeriodTotal: null, prevPeriodLabel: null, isFirstPeriod: true };
    }
    if (idx > 0) {
      const prevP = visiblePeriods[idx - 1];
      return {
        prevPeriodTotal: monthlyGrandTotals.byPeriod[prevP.id] || 0,
        prevPeriodLabel: prevP.period_label || prevP.period_code || 'Prev month',
        isFirstPeriod: false
      };
    }
    return { prevPeriodTotal: null, prevPeriodLabel: null, isFirstPeriod: false };
  }, [visiblePeriods, activePeriod, isAllMonths, monthlyGrandTotals]);

  // Category shares for Hero summary stacked proportional bar
  const transportCategoryShares = useMemo(() => {
    const denom = currentGrandTotal > 0 ? currentGrandTotal : 1;
    
    let fuelAmt = 0;
    let repAmt = 0;
    let empAmt = 0;
    let fcAmt = 0;
    let othAmt = 0;

    if (isAllMonths) {
      visiblePeriods.forEach(p => {
        fuelAmt += getParamVal(activeBranch, String(p.id), 'fuel_expenses');
        repAmt += getParamVal(activeBranch, String(p.id), 'repair_maintenance_cost');
        empAmt += getParamVal(activeBranch, String(p.id), 'employee_cost');
        fcAmt += (getParamVal(activeBranch, String(p.id), 'statutory_cost') + getParamVal(activeBranch, String(p.id), 'fc_cost'));
        othAmt += (getParamVal(activeBranch, String(p.id), 'other_cost') + getParamVal(activeBranch, String(p.id), 'cab_billing'));
      });
    } else {
      fuelAmt = metrics.fuel_expenses;
      repAmt = metrics.repair_maintenance_cost;
      empAmt = metrics.employee_cost;
      fcAmt = metrics.statutory_cost + metrics.fc_cost;
      othAmt = metrics.other_cost + metrics.cab_billing;
    }

    return [
      {
        categoryId: 'fuel',
        categoryName: 'Fuel & Diesel',
        color: '#ea580c',
        amount: fuelAmt,
        percent: (fuelAmt / denom) * 100
      },
      {
        categoryId: 'repair',
        categoryName: 'Repairs & Maintenance',
        color: '#0284c7',
        amount: repAmt,
        percent: (repAmt / denom) * 100
      },
      {
        categoryId: 'driver',
        categoryName: 'Driver & Crew Wages',
        color: '#6366f1',
        amount: empAmt,
        percent: (empAmt / denom) * 100
      },
      {
        categoryId: 'statutory',
        categoryName: 'FC & Statutory Compliance',
        color: '#10b981',
        amount: fcAmt,
        percent: (fcAmt / denom) * 100
      },
      {
        categoryId: 'other',
        categoryName: 'Fastag & Other Ops',
        color: '#f59e0b',
        amount: othAmt,
        percent: (othAmt / denom) * 100
      }
    ];
  }, [isAllMonths, visiblePeriods, activeBranch, effectiveMatrix, currentGrandTotal, metrics]);

  // 6 Bento Category Cards for Transport
  const transportCategories = useMemo(() => {
    const fuelMonthly = {};
    const repMonthly = {};
    const empMonthly = {};
    const fcMonthly = {};
    const othMonthly = {};
    const paxMonthly = {};

    let fuelMax = 1;
    let repMax = 1;
    let empMax = 1;
    let fcMax = 1;
    let othMax = 1;
    let paxMax = 1;

    visiblePeriods.forEach(p => {
      const f = getParamVal(activeBranch, String(p.id), 'fuel_expenses');
      const r = getParamVal(activeBranch, String(p.id), 'repair_maintenance_cost');
      const e = getParamVal(activeBranch, String(p.id), 'employee_cost');
      const fc = getParamVal(activeBranch, String(p.id), 'statutory_cost') + getParamVal(activeBranch, String(p.id), 'fc_cost');
      const o = getParamVal(activeBranch, String(p.id), 'other_cost') + getParamVal(activeBranch, String(p.id), 'cab_billing');
      const px = getParamVal(activeBranch, String(p.id), 'passengers_count');

      fuelMonthly[p.id] = f;
      repMonthly[p.id] = r;
      empMonthly[p.id] = e;
      fcMonthly[p.id] = fc;
      othMonthly[p.id] = o;
      paxMonthly[p.id] = px;

      if (f > fuelMax) fuelMax = f;
      if (r > repMax) repMax = r;
      if (e > empMax) empMax = e;
      if (fc > fcMax) fcMax = fc;
      if (o > othMax) othMax = o;
      if (px > paxMax) paxMax = px;
    });

    const denom = currentGrandTotal > 0 ? currentGrandTotal : 1;

    const curFuel = isAllMonths ? Object.values(fuelMonthly).reduce((a, b) => a + b, 0) : (fuelMonthly[activePeriod] || metrics.fuel_expenses);
    const curRep = isAllMonths ? Object.values(repMonthly).reduce((a, b) => a + b, 0) : (repMonthly[activePeriod] || metrics.repair_maintenance_cost);
    const curEmp = isAllMonths ? Object.values(empMonthly).reduce((a, b) => a + b, 0) : (empMonthly[activePeriod] || metrics.employee_cost);
    const curFc = isAllMonths ? Object.values(fcMonthly).reduce((a, b) => a + b, 0) : (fcMonthly[activePeriod] || (metrics.statutory_cost + metrics.fc_cost));
    const curOth = isAllMonths ? Object.values(othMonthly).reduce((a, b) => a + b, 0) : (othMonthly[activePeriod] || (metrics.other_cost + metrics.cab_billing));
    const curPax = isAllMonths ? Object.values(paxMonthly).reduce((a, b) => a + b, 0) : (paxMonthly[activePeriod] || metrics.passengers_count);

    return [
      {
        categoryId: 'fuel',
        categoryName: 'Fuel & Diesel Expenses',
        color: '#ea580c',
        selectedAmount: curFuel,
        selectedPercent: (curFuel / denom) * 100,
        monthlyAmounts: fuelMonthly,
        maxMonthlyAmount: fuelMax,
        items: [
          { id: 'f1', description: 'Diesel Consumption (Bulk)', total: curFuel * 0.85, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (fuelMonthly[p.id] || 0) * 0.85])) },
          { id: 'f2', description: 'Lubricants & Engine Oil', total: curFuel * 0.10, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (fuelMonthly[p.id] || 0) * 0.10])) },
          { id: 'f3', description: 'Special Trips & Transit Fuel', total: curFuel * 0.05, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (fuelMonthly[p.id] || 0) * 0.05])) }
        ]
      },
      {
        categoryId: 'repair',
        categoryName: 'Repairs & Maintenance',
        color: '#0284c7',
        selectedAmount: curRep,
        selectedPercent: (curRep / denom) * 100,
        monthlyAmounts: repMonthly,
        maxMonthlyAmount: repMax,
        items: [
          { id: 'r1', description: 'Scheduled Periodic Service & Spares', total: curRep * 0.50, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (repMonthly[p.id] || 0) * 0.50])) },
          { id: 'r2', description: 'Mechanical & Engine Maintenance', total: curRep * 0.30, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (repMonthly[p.id] || 0) * 0.30])) },
          { id: 'r3', description: 'Tyre Retreading & Battery Change', total: curRep * 0.15, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (repMonthly[p.id] || 0) * 0.15])) },
          { id: 'r4', description: 'Body Works & Painting', total: curRep * 0.05, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (repMonthly[p.id] || 0) * 0.05])) }
        ]
      },
      {
        categoryId: 'driver',
        categoryName: 'Drivers & Crew Wages',
        color: '#6366f1',
        selectedAmount: curEmp,
        selectedPercent: (curEmp / denom) * 100,
        monthlyAmounts: empMonthly,
        maxMonthlyAmount: empMax,
        items: [
          { id: 'e1', description: 'Regular Institutional Drivers', total: curEmp * 0.75, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (empMonthly[p.id] || 0) * 0.75])) },
          { id: 'e2', description: 'Cleaners & Route Conductors', total: curEmp * 0.15, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (empMonthly[p.id] || 0) * 0.15])) },
          { id: 'e3', description: 'Overtime & Duty Bata', total: curEmp * 0.10, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (empMonthly[p.id] || 0) * 0.10])) }
        ]
      },
      {
        categoryId: 'statutory',
        categoryName: 'FC & Statutory Compliance',
        color: '#10b981',
        selectedAmount: curFc,
        selectedPercent: (curFc / denom) * 100,
        monthlyAmounts: fcMonthly,
        maxMonthlyAmount: fcMax,
        items: [
          { id: 'fc1', description: 'Annual RTO Fitness Certificate (FC)', total: curFc * 0.50, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (fcMonthly[p.id] || 0) * 0.50])) },
          { id: 'fc2', description: 'State Motor Vehicle Road Tax', total: curFc * 0.30, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (fcMonthly[p.id] || 0) * 0.30])) },
          { id: 'fc3', description: 'Commercial Bus Insurance', total: curFc * 0.15, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (fcMonthly[p.id] || 0) * 0.15])) },
          { id: 'fc4', description: 'Permits & Emission Testing', total: curFc * 0.05, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (fcMonthly[p.id] || 0) * 0.05])) }
        ]
      },
      {
        categoryId: 'other',
        categoryName: 'Fastag, Tolls & Operational Sundries',
        color: '#f59e0b',
        selectedAmount: curOth,
        selectedPercent: (curOth / denom) * 100,
        monthlyAmounts: othMonthly,
        maxMonthlyAmount: othMax,
        items: [
          { id: 'o1', description: 'Fastag Highway Toll Passes', total: curOth * 0.55, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (othMonthly[p.id] || 0) * 0.55])) },
          { id: 'o2', description: 'Parking & Campus Transit Fees', total: curOth * 0.25, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (othMonthly[p.id] || 0) * 0.25])) },
          { id: 'o3', description: 'External Cab & Emergency Transit', total: curOth * 0.20, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (othMonthly[p.id] || 0) * 0.20])) }
        ]
      },
      {
        categoryId: 'census',
        categoryName: 'Fleet Ridership & Operational Census',
        color: '#06b6d4',
        isPersonCategory: true,
        selectedAmount: curPax,
        selectedPercent: 0,
        monthlyAmounts: paxMonthly,
        maxMonthlyAmount: paxMax,
        items: [
          { id: 'c1', description: 'Student Commuters', total: curPax * 0.82, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (paxMonthly[p.id] || 0) * 0.82])) },
          { id: 'c2', description: 'Staff & Faculty Commuters', total: curPax * 0.18, amounts: Object.fromEntries(visiblePeriods.map(p => [p.id, (paxMonthly[p.id] || 0) * 0.18])) }
        ]
      }
    ];
  }, [visiblePeriods, activeBranch, effectiveMatrix, isAllMonths, activePeriod, currentGrandTotal, metrics]);

  // Filtered vehicles list for active branch
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearchTerm.trim()) return vehiclesList;
    const term = vehicleSearchTerm.toLowerCase();
    return vehiclesList.filter(v => 
      (v.vehicle_no && v.vehicle_no.toLowerCase().includes(term)) ||
      (v.make && v.make.toLowerCase().includes(term)) ||
      (v.model && v.model.toLowerCase().includes(term))
    );
  }, [vehiclesList, vehicleSearchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>

      {/* ========================================================================= */}
      {/* UNIFIED STICKY DASHBOARD HEADER & FILTER BAR (PINS TO TOP ON SCROLL)     */}
      {/* Keeps "Transport Operations Dashboard" + Both Filters at Top (Only 1 Bar) */}
      {/* ========================================================================= */}
      <div 
        className="sticky-dashboard-master-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 80,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          padding: '12px 20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '4px'
        }}
      >
        {/* Tier 1: Transport Title, Badge, Subtitle & Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Module Title, Icon & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)',
              flexShrink: 0
            }}>
              🚌
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}>
                  Transport Operations Dashboard
                </h1>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#eff6ff',
                  color: '#0284c7',
                  border: '1px solid #bfdbfe'
                }}>
                  Transport
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: activeBranchObj.badgeBg,
                  color: activeBranchObj.badgeColor,
                  border: `1px solid ${activeBranchObj.badgeColor}30`
                }}>
                  {activeBranchObj.icon} {activeBranchObj.label} ({metrics.vehicles_count})
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons (Refresh Live, Download Report, Open Data Entry) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Refresh Live Button */}
            <button
              type="button"
              onClick={fetchLiveMatrix}
              disabled={loading}
              title="Refresh live data from database"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 14px',
                borderRadius: '9999px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#475569',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh Live'}</span>
            </button>

            {/* Download Official Report Button */}
            <button
              type="button"
              onClick={handleExportReport || handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '9999px',
                backgroundColor: '#0284c7',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 3px 12px rgba(2, 132, 199, 0.25)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
            >
              <Download size={13} />
              <span>Download Report</span>
            </button>

            {/* Open Data Entry Button */}
            {onOpenDataEntry && (
              <button
                type="button"
                onClick={() => {
                  const targetPeriodId = activePeriod !== 'all' ? Number(activePeriod) : null;
                  const targetBranch = activeBranch !== 'all' ? activeBranch : 'RPS';
                  onOpenDataEntry(targetPeriodId, targetBranch);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #ff7e9e 0%, #ff4b72 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(255, 96, 136, 0.3)',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span>Open Data Entry</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Filter 1 - Institutional Fleets Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #edf0f8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11.5px',
              fontWeight: '800',
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginRight: '2px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              🏫 Institutional Fleets:
            </span>
            {TRANSPORT_BRANCHES.filter(br => br.id !== 'all').map(br => {
              const isSel = activeBranch === br.id;
              const countBadge = br.id === 'Common' ? '18 Buses' : (br.id === 'RPS' ? '19 Buses' : (br.id === 'University' ? '16 Buses' : '5 Buses'));

              return (
                <button
                  key={br.id}
                  type="button"
                  onClick={() => setActiveBranch(br.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '11.5px',
                    fontWeight: isSel ? '800' : '650',
                    border: isSel ? `2px solid ${br.badgeColor}` : '1.5px solid #e2e8f0',
                    backgroundColor: isSel ? br.badgeBg : '#ffffff',
                    color: isSel ? br.badgeColor : '#475569',
                    cursor: 'pointer',
                    boxShadow: isSel ? `0 2px 8px ${br.badgeColor}25` : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{br.icon}</span>
                  <span>{br.label}</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    backgroundColor: isSel ? '#ffffff' : '#f1f5f9',
                    color: isSel ? br.badgeColor : '#64748b',
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    {countBadge}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: activeBranchObj.badgeBg,
            color: activeBranchObj.badgeColor,
            padding: '4px 10px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: '700',
            border: `1px solid ${activeBranchObj.badgeColor}30`
          }}>
            <span>{activeBranchObj.icon}</span>
            <span>{activeBranchObj.description}</span>
          </div>
        </div>

        {/* Tier 3: Filter 2 - Month Filter Pills & Viewing Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '6px',
          borderTop: '1px dashed #e2e8f0'
        }}>
          {/* Left: Month Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              fontWeight: '800',
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginRight: '2px'
            }}>
              <Calendar size={14} color="#0284c7" />
              <span>Filter Month:</span>
            </div>

            {/* All Months Pill */}
            <button
              type="button"
              onClick={() => setActivePeriod && setActivePeriod('all')}
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: isAllMonths ? '800' : '650',
                border: isAllMonths ? '1.5px solid #0284c7' : '1.5px solid #cbd5e1',
                backgroundColor: isAllMonths ? '#0284c7' : '#ffffff',
                color: isAllMonths ? '#ffffff' : '#475569',
                cursor: 'pointer',
                boxShadow: isAllMonths ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>All months</span>
              {monthlyGrandTotals.grandOverall > 0 && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  backgroundColor: isAllMonths ? 'rgba(255,255,255,0.25)' : '#f8fafc',
                  color: isAllMonths ? '#ffffff' : '#64748b'
                }}>
                  {formatIndianCompact(monthlyGrandTotals.grandOverall)}
                </span>
              )}
              {isAllMonths && <Check size={11} strokeWidth={3} />}
            </button>

            {/* Individual Month Pills */}
            {visiblePeriods.map(p => {
              const isSel = String(p.id) === String(activePeriod);
              const pBm = getBranchMetrics(activeBranch, String(p.id));
              const pTotal = pBm?.total_expenses || 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePeriod && setActivePeriod(String(p.id))}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '11.5px',
                    fontWeight: isSel ? '800' : '650',
                    border: isSel ? '1.5px solid #0284c7' : '1.5px solid #cbd5e1',
                    backgroundColor: isSel ? '#0284c7' : '#ffffff',
                    color: isSel ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    boxShadow: isSel ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{p.period_label || p.period_code}</span>
                  {pTotal > 0 && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      backgroundColor: isSel ? 'rgba(255,255,255,0.25)' : '#f8fafc',
                      color: isSel ? '#ffffff' : '#64748b'
                    }}>
                      {formatIndianCompact(pTotal)}
                    </span>
                  )}
                  {isSel && <Check size={11} strokeWidth={3} />}
                </button>
              );
            })}
          </div>

          {/* Right: Active Viewing Indicator */}
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>Viewing:</span>
            <strong style={{
              color: '#0f172a',
              fontWeight: '800',
              padding: '3px 10px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              {isAllMonths
                ? `All Months (${formatINR(monthlyGrandTotals.grandOverall)}) • ${activeBranchObj.label}`
                : `${activePeriodObj?.period_label || 'Focus Month'} (${formatINR(metrics.total_expenses)}) • ${activeBranchObj.label}`}
            </strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW SWITCHER TAB BAR (EXACT MATCH TO HOSTEL OPERATIONS DASHBOARD)         */}
      {/* ========================================================================= */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#ffffff',
        padding: '10px 14px',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'executive', label: 'Executive Overview', icon: LayoutDashboard, desc: 'Bento Cards & Fleet Analysis' },
            { id: 'vehicles', label: 'Vehicle Ledger (58 Buses)', icon: Bus, desc: 'Live Vehicle-Wise Expenses Ledger' },
            { id: 'parameters', label: '47 Parameters Matrix', icon: FileSpreadsheet, desc: 'Excel Matrix Data Sheet' },
            { id: 'all', label: 'All Views', icon: Layers, desc: 'Complete Stack' }
          ].map(tab => {
            const isActive = activeMainView === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMainView(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '12px',
                  border: isActive ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#eff6ff' : '#f8fafc',
                  color: isActive ? '#0369a1' : '#64748b',
                  fontSize: '13px',
                  fontWeight: isActive ? '800' : '650',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(2, 132, 199, 0.12)' : 'none'
                }}
              >
                <TabIcon size={16} color={isActive ? '#0284c7' : '#64748b'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Viewing Period Indicator */}
        <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '600', paddingRight: '8px' }}>
          Viewing: <strong style={{ color: '#0284c7', fontWeight: '800' }}>
            {formatPeriodLabel(activePeriodObj)} • {activeBranchObj.label}
          </strong>
        </div>
      </div>



      {/* ========================================================================= */}
      {/* MAIN VIEW: EXECUTIVE OVERVIEW (BENTO DESIGN WITH HERO SUMMARY & VEHICLES) */}
      {/* ========================================================================= */}
      {(activeMainView === 'executive' || activeMainView === 'all') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

          {/* ----------------------------------------------------------------------- */}
          {/* 1. HERO SUMMARY CARD (GRAND TOTAL, PROPORTIONAL SHARE BAR & LEGEND)     */}
          {/* ----------------------------------------------------------------------- */}
          <HeroSummary
            selectedPeriod={activePeriod}
            selectedPeriodLabel={isAllMonths ? `All months (${activeBranchObj.label})` : `${activePeriodObj?.period_label || 'Focus month'} (${activeBranchObj.label})`}
            grandTotal={currentGrandTotal}
            avgMonthly={monthlyGrandTotals.avgMonthly}
            prevPeriodTotal={prevPeriodTotal}
            prevPeriodLabel={prevPeriodLabel}
            isFirstPeriod={isFirstPeriod}
            categoryShares={transportCategoryShares}
            formatCompact={formatIndianCompact}
            formatFull={formatINR}
          />

          {/* ----------------------------------------------------------------------- */}
          {/* 2. CATEGORY CARDS BENTO GRID WITH MONTHLY TREND BARS & DETAILS TOGGLE   */}
          {/* ----------------------------------------------------------------------- */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: '14px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {transportCategories.map((cat) => (
              <CategoryCard
                key={cat.categoryId}
                category={cat}
                periods={visiblePeriods}
                selectedPeriod={activePeriod}
                selectedAmount={cat.selectedAmount}
                selectedPercent={cat.selectedPercent}
                monthlyAmounts={cat.monthlyAmounts}
                maxMonthlyAmount={cat.maxMonthlyAmount}
                isExpanded={Boolean(expandedCardIds[cat.categoryId])}
                onToggleExpand={() => toggleCardExpand(cat.categoryId)}
                formatCompact={cat.isPersonCategory ? (v) => Math.round(Number(v || 0)).toLocaleString('en-IN') : formatIndianCompact}
                formatFull={cat.isPersonCategory ? (v) => Math.round(Number(v || 0)).toLocaleString('en-IN') : formatINR}
                hidePercentage={cat.isPersonCategory}
              />
            ))}
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* 3. INSTITUTIONAL VEHICLE FLEET BREAKDOWN ("EACH VEHICLE DESIGN")        */}
          {/* ----------------------------------------------------------------------- */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: '#ffffff',
              padding: '14px 18px',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: activeBranchObj.badgeBg,
                  color: activeBranchObj.badgeColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  🚌
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      {activeBranchObj.label} Vehicle Fleet Breakdown
                    </h2>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: activeBranchObj.badgeBg,
                      color: activeBranchObj.badgeColor,
                      border: `1px solid ${activeBranchObj.badgeColor}30`
                    }}>
                      {filteredVehicles.length} of {metrics.vehicles_count}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Individual vehicle costs, diesel litres, mileage and maintenance ledger ({isAllMonths ? 'All months' : (activePeriodObj?.period_label || 'Focus month')})
                  </div>
                </div>
              </div>

              {/* Toolbar: Search + View Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Search Input */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Search bus no or make..."
                    value={vehicleSearchTerm}
                    onChange={(e) => setVehicleSearchTerm(e.target.value)}
                    style={{
                      padding: '6px 12px 6px 30px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      width: '180px',
                      outline: 'none',
                      fontWeight: '600'
                    }}
                  />
                </div>

                {/* Switch between Cards and Spreadsheet */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#f1f5f9',
                  padding: '2px',
                  borderRadius: '8px'
                }}>
                  <button
                    type="button"
                    onClick={() => setVehicleViewMode('cards')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: vehicleViewMode === 'cards' ? '800' : '600',
                      backgroundColor: vehicleViewMode === 'cards' ? '#0284c7' : 'transparent',
                      color: vehicleViewMode === 'cards' ? '#ffffff' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    <LayoutGrid size={13} />
                    <span>Vehicle Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleViewMode('table')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: vehicleViewMode === 'table' ? '800' : '600',
                      backgroundColor: vehicleViewMode === 'table' ? '#0284c7' : 'transparent',
                      color: vehicleViewMode === 'table' ? '#ffffff' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    <FileSpreadsheet size={13} />
                    <span>Table View</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content: Either Vehicle Bento Cards or Table */}
            {vehicleViewMode === 'cards' ? (
              vehiclesLoading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Loading {activeBranchObj.label} vehicles...
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px', backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  No vehicles found matching "{vehicleSearchTerm}" in {activeBranchObj.label}.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                  gap: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  {filteredVehicles.map(veh => {
                    const isExp = expandedVehicleId === (veh.id || veh.vehicle_no);
                    const vehKm = num(veh.km_run);
                    const vehDiesel = num(veh.diesel_litres);
                    const vehFuel = num(veh.fuel_expenses);
                    const vehRep = num(veh.repair_maintenance);
                    const vehFc = num(veh.fc_cost) + num(veh.statutory_cost);
                    const vehEmp = num(veh.employee_cost);
                    const vehTot = num(veh.total_expenses);
                    const vehMileage = veh.mileage || (vehDiesel > 0 ? (vehKm / vehDiesel).toFixed(2) : '0.00');
                    const costPerKm = vehKm > 0 ? (vehFuel / vehKm).toFixed(2) : '0.00';

                    return (
                      <div
                        key={veh.id || veh.vehicle_no}
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '16px',
                          border: '1.5px solid #e2e8f0',
                          padding: '16px 18px',
                          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.03)'}
                      >
                        {/* License Plate & Fleet Tag Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1.5px solid #0f172a',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            backgroundColor: '#fef08a',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}>
                            <div style={{
                              backgroundColor: '#1d4ed8',
                              color: '#ffffff',
                              fontSize: '8.5px',
                              fontWeight: '900',
                              padding: '2px 4px',
                              letterSpacing: '0.05em'
                            }}>
                              IND
                            </div>
                            <div style={{
                              padding: '2px 8px',
                              fontSize: '13px',
                              fontWeight: '900',
                              letterSpacing: '0.06em',
                              color: '#0f172a',
                              fontFamily: 'monospace'
                            }}>
                              {veh.vehicle_no || 'TN-99'}
                            </div>
                          </div>

                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: '800',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: activeBranchObj.badgeBg,
                            color: activeBranchObj.badgeColor
                          }}>
                            {activeBranchObj.label}
                          </span>
                        </div>

                        {/* Make & Model */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            🚌 {veh.make || 'Heavy Commercial Bus'} {veh.model ? `• ${veh.model}` : ''}
                          </div>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            color: '#059669',
                            backgroundColor: '#ecfdf5',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            In Service
                          </span>
                        </div>

                        {/* Big Total Spend */}
                        <div style={{
                          backgroundColor: '#f8fafc',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          border: '1px solid #edf2f7'
                        }}>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                            {isAllMonths ? 'Total Spend' : `${activePeriodObj?.period_label || 'Month'} Spend`}
                          </span>
                          <span style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
                            {formatINR(vehTot)}
                          </span>
                        </div>

                        {/* 4 Cost Metrics Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px' }}>
                          <div style={{ backgroundColor: '#fff7ed', padding: '6px 8px', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                            <div style={{ color: '#ea580c', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>⛽ Fuel</div>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '12.5px' }}>{formatINR(vehFuel)}</div>
                            <div style={{ color: '#9a3412', fontSize: '10px' }}>{vehDiesel.toLocaleString()} L</div>
                          </div>
                          <div style={{ backgroundColor: '#f0f9ff', padding: '6px 8px', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                            <div style={{ color: '#0284c7', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>🔧 Repairs</div>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '12.5px' }}>{formatINR(vehRep)}</div>
                            <div style={{ color: '#0369a1', fontSize: '10px' }}>Maintenance</div>
                          </div>
                          <div style={{ backgroundColor: '#ecfdf5', padding: '6px 8px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                            <div style={{ color: '#059669', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>🛡️ FC & Tax</div>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '12.5px' }}>{formatINR(vehFc)}</div>
                            <div style={{ color: '#047857', fontSize: '10px' }}>RTO Certified</div>
                          </div>
                          <div style={{ backgroundColor: '#f5f3ff', padding: '6px 8px', borderRadius: '8px', border: '1px solid #ede9fe' }}>
                            <div style={{ color: '#7c3aed', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>👤 Driver</div>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '12.5px' }}>{formatINR(vehEmp)}</div>
                            <div style={{ color: '#6d28d9', fontSize: '10px' }}>Staff Wages</div>
                          </div>
                        </div>

                        {/* Efficiency Footer Bar: Mileage, Distance & Cost/KM */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '8px',
                          borderTop: '1px dashed #e2e8f0',
                          fontSize: '11px',
                          color: '#64748b'
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            🛣️ <strong>{vehKm.toLocaleString()} KM</strong>
                          </span>
                          <span style={{
                            backgroundColor: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: '700',
                            color: '#0f172a'
                          }}>
                            ⚡ {vehMileage} km/L
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedVehicleId(isExp ? null : (veh.id || veh.vehicle_no))}
                            style={{
                              color: '#0284c7',
                              fontWeight: '700',
                              cursor: 'pointer',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              fontSize: '11px'
                            }}
                          >
                            {isExp ? '▴ hide' : '▾ details'}
                          </button>
                        </div>

                        {/* Expandable Details Drawer */}
                        {isExp && (
                          <div style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            fontSize: '11px'
                          }}>
                            <div style={{ fontWeight: '800', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                              Vehicle Cost Itemization
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Fuel & Diesel Spend:</span>
                              <strong>{formatINR(vehFuel)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Workshop Maintenance:</span>
                              <strong>{formatINR(vehRep)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>RTO Fitness Certificate (FC):</span>
                              <strong>{formatINR(num(veh.fc_cost))}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Statutory Road Tax:</span>
                              <strong>{formatINR(num(veh.statutory_cost))}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Fastag & Parking:</span>
                              <strong>{formatINR(num(veh.parking_fastag))}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Assigned Driver Wage:</span>
                              <strong>{formatINR(vehEmp)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Sundry / Other Ops:</span>
                              <strong>{formatINR(num(veh.other_cost))}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '4px', fontWeight: '800', color: '#0284c7' }}>
                              <span>Running Cost / KM:</span>
                              <span>₹{costPerKm} / km</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                padding: '18px 20px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
              }}>
                <TransportVehicleExpensesTable
                  periodId={activePeriodObj?.id}
                  branch={activeBranch}
                  embedded={true}
                />
              </div>
            )}
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* 4. SECTION: MONTH-BY-MONTH FLEET EXPENDITURE DATA SHEET                 */}
          {/* ----------------------------------------------------------------------- */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: '800'
                }}>
                  1
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Month-by-Month Expenditure Data Sheet
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#0284c7',
                  backgroundColor: '#eff6ff',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid #bae6fd'
                }}>
                  Line-by-Line Monthly Columns ({activeBranchObj.label})
                </span>
              </div>

              {/* Parameter Search Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Search 47 parameters..."
                    value={searchParamTerm}
                    onChange={(e) => setSearchParamTerm(e.target.value)}
                    style={{
                      padding: '7px 12px 7px 30px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      width: '200px',
                      outline: 'none',
                      fontWeight: '600'
                    }}
                  />
                </div>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Displaying each monthly cycle side-by-side with exact fuel, maintenance, FC, and operating cost heads
                </span>
              </div>
            </div>

            {/* Table Container */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
            }}>
              <div style={{ overflowX: 'auto', width: '100%', maxHeight: '560px' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'left', height: '42px' }}>
                      <th style={{ padding: '10px 14px', width: '50px', position: 'sticky', left: 0, backgroundColor: '#0f172a', zIndex: 12 }}>
                        S.No
                      </th>
                      <th style={{ padding: '10px 14px', minWidth: '280px', position: 'sticky', left: '50px', backgroundColor: '#0f172a', zIndex: 12 }}>
                        Transport Parameter / Cost Head
                      </th>
                      <th style={{ padding: '10px 12px', minWidth: '80px', textAlign: 'center' }}>
                        Unit
                      </th>
                      {periods.map(p => (
                        <th key={p.id} style={{ padding: '10px 14px', minWidth: '120px', textAlign: 'right' }}>
                          {p.period_label || p.period_code}
                        </th>
                      ))}
                      <th style={{ padding: '10px 14px', minWidth: '140px', textAlign: 'right', backgroundColor: '#1e293b', color: '#38bdf8', fontWeight: '800' }}>
                        Total Cumulative
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParameters.map((p, idx) => {
                      const isEven = idx % 2 === 0;
                      const isCost = p.unit && (p.unit.includes('INR') || p.unit.includes('₹') || p.input_type === 'cost');
                      const isHighlighted = p.param_key === 'total_expenses' || p.param_key === 'cumulative_income' || p.param_key === 'balance';

                      const rowTotal = getParamAllMonthsTotal(activeBranch, p.param_key);

                      return (
                        <tr 
                          key={p.param_key || idx}
                          style={{
                            backgroundColor: isHighlighted ? '#f0fdf4' : (isEven ? '#ffffff' : '#f8fafc'),
                            borderBottom: '1px solid #e2e8f0',
                            fontWeight: isHighlighted ? '800' : '500'
                          }}
                        >
                          <td style={{
                            padding: '8px 14px',
                            color: '#64748b',
                            fontWeight: '600',
                            position: 'sticky',
                            left: 0,
                            backgroundColor: isHighlighted ? '#f0fdf4' : (isEven ? '#ffffff' : '#f8fafc'),
                            zIndex: 10
                          }}>
                            {p.s_no || idx + 1}
                          </td>
                          <td style={{
                            padding: '8px 14px',
                            color: isHighlighted ? '#15803d' : '#0f172a',
                            fontWeight: isHighlighted ? '800' : '650',
                            position: 'sticky',
                            left: '50px',
                            backgroundColor: isHighlighted ? '#f0fdf4' : (isEven ? '#ffffff' : '#f8fafc'),
                            zIndex: 10
                          }}>
                            {p.param_name}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
                            <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                              {p.unit || '—'}
                            </span>
                          </td>
                          {periods.map(period => {
                            const val = getParamVal(activeBranch, String(period.id), p.param_key);
                            return (
                              <td 
                                key={period.id} 
                                style={{ 
                                  padding: '8px 14px', 
                                  textAlign: 'right',
                                  color: isHighlighted ? '#15803d' : '#0f172a',
                                  fontWeight: isHighlighted ? '800' : '600'
                                }}
                              >
                                {isCost ? formatINR(val) : num(val).toLocaleString()}
                              </td>
                            );
                          })}
                          <td style={{
                            padding: '8px 14px',
                            textAlign: 'right',
                            backgroundColor: isHighlighted ? '#dcfce7' : '#f1f5f9',
                            color: isHighlighted ? '#166534' : '#0369a1',
                            fontWeight: '800'
                          }}>
                            {isCost ? formatINR(rowTotal) : num(rowTotal).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* SECTION: OVERALL EXPENSE SUMMARY (4 BENTO KPI CARDS)                    */}
          {/* ----------------------------------------------------------------------- */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: '800'
                }}>
                  3
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Overall Expense Summary
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#059669',
                  backgroundColor: '#ecfdf5',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid #a7f3d0'
                }}>
                  Executive Financial & Fleet Totals
                </span>
              </div>

              <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                Total spent, distance run, sanctioned budget balance, and fleet performance
              </div>
            </div>

            {/* Top 4 Executive Financial Total Cards (Bento Style matching Food & Hostel) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '18px'
            }}>
              {/* Card 1: Total Fleet Size & Passengers (Green border) */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #10b981',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Fleet Size & Passengers
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
                  {metrics.vehicles_count}
                </div>
                <div style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>
                  {num(metrics.passengers_count).toLocaleString()} Passengers • {num(metrics.actual_kms).toLocaleString()} Total KMs
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  Dedicated {activeBranchObj.label} Fleet ({activeBranchObj.id})
                </div>
              </div>

              {/* Card 2: Total Operating Spend (Indigo border) */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #6366f1',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {activePeriodObj?.period_label || 'Focus Month'} Spend
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
                  {formatINR(metrics.total_expenses)}
                </div>
                <div style={{ fontSize: '12px', color: '#4f46e5', fontWeight: '700' }}>
                  Fuel: {formatINR(metrics.fuel_expenses)} • Repair: {formatINR(metrics.repair_maintenance_cost)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  Monthly Spend: {activeBranchObj.label} ({activePeriodObj?.period_label})
                </div>
              </div>

              {/* Card 3: Operating Budget & Remaining Balance (Sky Blue border) */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #0ea5e9',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Sanctioned Budget & Balance
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
                  {formatINR(metrics.balance)}
                </div>
                <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: '700' }}>
                  Budget: {formatLakhs(metrics.approved_budget)} • Spent: {formatLakhs(metrics.cumulative_budget_spent)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  {metrics.approved_budget > 0 ? (((metrics.approved_budget - metrics.cumulative_budget_spent) / metrics.approved_budget) * 100).toFixed(1) : '100'}% Budget Remaining
                </div>
              </div>

              {/* Card 4: Fleet Operational Efficiency (Amber border) */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #f59e0b',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Fleet Performance & Mileage
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
                  {metrics.avg_mileage} <span style={{ fontSize: '15px', color: '#64748b', fontWeight: '600' }}>km/L</span>
                </div>
                <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '700' }}>
                  Fuel Cost: ₹{metrics.fuel_cost_per_km} / KM • {metrics.service_tickets_closed} Tickets Closed
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  Fee Collections: {formatLakhs(metrics.fee_collected)}
                </div>
              </div>
            </div>
          </section>

          {/* Operational Census Ledger Table */}
          <TransportDashboardCensusView
            computedMatrix={effectiveMatrix}
            activePeriodObj={activePeriodObj}
            periods={periods}
          />

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW: VEHICLE-WISE EXPENSES LEDGER (58 BUSES)                         */}
      {/* ========================================================================= */}
      {(activeMainView === 'vehicles' || activeMainView === 'all') && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1.5px solid #e2e8f0',
          padding: '20px 24px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          marginTop: activeMainView === 'all' ? '20px' : 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#0284c7' }}>
                <Bus size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Institutional Vehicle-Wise Expenses Ledger ({activeBranchObj.label} • {activePeriodObj?.period_label})
                </h2>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  All 58 institutional buses with Make, Model, Fuel, KM, Mileage, FC, Repair & Maintenance from live DB
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '11.5px',
              fontWeight: '800',
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: '#eff6ff',
              color: '#0284c7',
              border: '1px solid #bfdbfe'
            }}>
              Live Database Feed • Table transport_vehicle_entries
            </span>
          </div>

          <TransportVehicleExpensesTable
            periodId={activePeriodObj?.id}
            branch={activeBranch}
            embedded={true}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW: 47 PARAMETERS MATRIX TABLE                                     */}
      {/* ========================================================================= */}
      {(activeMainView === 'parameters' || activeMainView === 'all') && (
        <div style={{ width: '100%', marginTop: activeMainView === 'all' ? '20px' : 0 }}>
          <TransportDashboardDataTable
            periods={periods}
            activePeriod={activePeriod}
            computedMatrix={effectiveMatrix}
          />
        </div>
      )}

    </div>
  );
}
