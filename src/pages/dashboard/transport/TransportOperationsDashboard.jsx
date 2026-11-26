import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Bus, Users, Fuel, Wrench, ShieldCheck, DollarSign, Download, 
  ArrowRight, FileSpreadsheet, Calendar, ChevronDown, Check,
  Sparkles, FileText, Printer, Paperclip, LayoutDashboard, Table, Layers,
  TrendingUp, Calculator, Gauge, MapPin, AlertCircle, RefreshCw, Search,
  CheckCircle2, ArrowUpRight, BarChart3, PieChart, LayoutGrid, ChevronUp
} from 'lucide-react';
import { formatINR, formatLakhs, formatPeriodLabel, formatIndianCompact } from '../../../utils/formatters';
import { TRANSPORT_BRANCHES, CANONICAL_TRANSPORT_PARAMETERS, DEFAULT_BRANCH_BUDGETS } from '../../data_entry/TransportSpreadsheetEntry';
import TransportVehicleExpensesTable from '../../data_entry/TransportVehicleExpensesTable';
import TransportDashboardCensusView from '../TransportDashboardCensusView';
import HeroSummary from '../charts/HeroSummary';
import CategoryCard from '../charts/CategoryCard';
import TransportVehicleDetailsModal from './TransportVehicleDetailsModal';
import MonthlyAttachmentsDashboardSection from '../../../components/attachments/MonthlyAttachmentsDashboardSection';

export default function TransportOperationsDashboard({
  computedMatrix: propComputedMatrix,
  periods: propPeriods = [],
  categories = [],
  activePeriod = 'all',
  setActivePeriod,
  onOpenDataEntry,
  handleExportReport
}) {
  const [activeBranch, setActiveBranch] = useState('University');
  const [activeMainView, setActiveMainView] = useState('executive'); // 'executive' | 'vehicles' | 'parameters' | 'all'
  const [localMatrix, setLocalMatrix] = useState(null);
  const [dbBranchBudgets, setDbBranchBudgets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParamTerm, setSearchParamTerm] = useState('');
  const [vehicleStats, setVehicleStats] = useState(null);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
  const [vehicleViewMode, setVehicleViewMode] = useState('cards'); // 'cards' | 'table'
  const [expandedVehicleId, setExpandedVehicleId] = useState(null);
  const [expandedCardIds, setExpandedCardIds] = useState({});
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [modalMetricFocus, setModalMetricFocus] = useState('all');

  const handleOpenVehicleModal = (focus = 'all') => {
    setModalMetricFocus(focus);
    setIsVehicleModalOpen(true);
  };

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
      setActiveBranch('University');
    }
  }, [activeBranch]);

  useEffect(() => {
    if (visiblePeriods.length > 0 && setActivePeriod) {
      const isCurrentInVisible = visiblePeriods.some(p => String(p.id) === String(activePeriod));
      const currentPeriodData = effectiveMatrix?.transport_census_by_branch?.[activeBranch]?.[String(activePeriod)];
      const hasDataInCurrent = currentPeriodData && (
        (Number(currentPeriodData.actual_kms) || 0) > 0 ||
        (Number(currentPeriodData.total_expenses) || 0) > 0 ||
        (Number(currentPeriodData.fuel_expenses) || 0) > 0 ||
        (Number(currentPeriodData.diesel_litres) || 0) > 0
      );

      if ((!isCurrentInVisible || (!hasDataInCurrent && activePeriod !== 'all')) && activePeriod !== 'all') {
        let lastEntered = null;
        for (let i = visiblePeriods.length - 1; i >= 0; i--) {
          const p = visiblePeriods[i];
          const pid = String(p.id);
          const d = effectiveMatrix?.transport_census_by_branch?.[activeBranch]?.[pid];
          if (d && (
            (Number(d.actual_kms) || 0) > 0 || 
            (Number(d.total_expenses) || 0) > 0 || 
            (Number(d.fuel_expenses) || 0) > 0 ||
            (Number(d.diesel_litres) || 0) > 0
          )) {
            lastEntered = p;
            break;
          }
        }
        const octPeriod = visiblePeriods.find(p => p.period_code === '2026-10' || (p.period_label && p.period_label.toLowerCase().includes('oct')));
        const target = lastEntered || octPeriod || visiblePeriods[visiblePeriods.length - 1];
        if (target && String(target.id) !== String(activePeriod)) {
          setActivePeriod(String(target.id));
        }
      }
    }
  }, [activePeriod, visiblePeriods, activeBranch, effectiveMatrix, setActivePeriod]);

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

  useEffect(() => {
    if (propComputedMatrix?.transport_branch_budgets) {
      setDbBranchBudgets(propComputedMatrix.transport_branch_budgets);
    } else {
      fetch('/api/transport/budget-tracking')
        .then(res => res.json())
        .then(d => {
          if (d?.status === 'success' && d?.budgets) {
            setDbBranchBudgets(d.budgets);
          }
        })
        .catch(err => console.warn('[TransportDashboard] Budget tracking fetch notice:', err));
    }
  }, [propComputedMatrix]);

  const isAllMonths = activePeriod === 'all';

  // Effective period object for single-month snapshot metrics
  const activePeriodObj = useMemo(() => {
    if (activePeriod && activePeriod !== 'all') {
      return visiblePeriods.find(p => String(p.id) === String(activePeriod)) || 
             visiblePeriods.find(p => p.period_code === '2026-10') || 
             visiblePeriods[visiblePeriods.length - 1] || 
             periods[periods.length - 1] || 
             null;
    }
    return visiblePeriods.find(p => p.period_code === '2026-10') || visiblePeriods[visiblePeriods.length - 1] || periods[periods.length - 1] || null;
  }, [activePeriod, visiblePeriods, periods]);

  const activePeriodIdStr = activePeriodObj ? String(activePeriodObj.id) : null;

  // Fetch live vehicle summary from /api/transport/vehicles for the active branch & period
  useEffect(() => {
    const effectivePeriodId = activePeriod !== 'all' ? (activePeriodObj?.id || activePeriod || '1026') : 'all';
    setVehiclesLoading(true);
    fetch(`/api/transport/vehicles?period_id=${effectivePeriodId}&branch=${activeBranch}`)
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
  }, [activePeriod, activePeriodObj, activeBranch, visiblePeriods]);
  const activeBranchObj = TRANSPORT_BRANCHES.find(b => b.id === activeBranch) || TRANSPORT_BRANCHES[0];

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // Official Branch Sanctioned Budgets matching user's authoritative ledger (FY 2026-2027)
  const branchBudgetMap = {
    University: 16670553,
    RPS: 14107491,
    KPM: 4000000,
    Common: 5552143
  };

  // Helper to compute metrics for a branch and period
  const getBranchMetrics = (branchId, pStr) => {
    if (branchId === 'all') {
      const realBranches = ['University', 'RPS', 'KPM', 'Common'];
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
      let totCctv = 0;
      let totPark = 0;
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
        totCctv += num(m.cctv_replacement, 0);
        totEmp += num(m.employee_cost, 0);
        totPark += num(m.parking_fastag, 0);
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

      const totExpenses = totFuel + totFc + totStat + totRep + totOth + totEmp + totCctv + totPark;
      const totIncome = totPaid + totRpsBill + totStaffDed + totAddKmsRps + totCab;
      const sanctionedTotal = 40330187; // Authentic consolidated total (16.67M + 14.11M + 4.00M + 5.55M)
      const totBal = sanctionedTotal - totSpentBud;

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
        cctv_replacement: totCctv,
        employee_cost: totEmp,
        parking_fastag: totPark,
        total_expenses: totExpenses,
        fee_demand: totDemand,
        fee_collected: totPaid,
        fee_unpaid: Math.max(0, totDemand - totPaid),
        rps_monthly_billing: totRpsBill,
        staff_travel_deduction: totStaffDed,
        cumulative_income: totIncome,
        approved_budget: sanctionedTotal,
        cumulative_budget_spent: totSpentBud,
        balance: totBal,
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
    const cctv = num(m.cctv_replacement, 0);
    const emp = num(m.employee_cost, 0);
    const park = num(m.parking_fastag, 0);
    const totExpenses = fuel + fc + stat + rep + oth + emp + cctv + park;
    const diesel = num(m.diesel_litres, 0);
    const demand = num(m.fee_demand, 0);
    const paid = num(m.fee_collected, 0);
    const appBud = branchBudgetMap[branchId] || num(m.approved_budget, 0) || 8500000;
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
      cctv_replacement: cctv,
      employee_cost: emp,
      parking_fastag: park,
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
    return getBranchMetrics(activeBranch, activePeriodIdStr || String(visiblePeriods[visiblePeriods.length - 1]?.id || periods[periods.length - 1]?.id || '1026'));
  }, [activeBranch, activePeriodIdStr, visiblePeriods, periods, effectiveMatrix]);

  // Effective metrics for a branch taking into account currently selected month
  const getBranchEffectiveMetrics = (branchId) => {
    const branchVisiblePeriods = periods.filter(p => !p.branch || p.branch === 'all' || p.branch === branchId);
    return getBranchMetrics(branchId, activePeriodIdStr || String(branchVisiblePeriods[branchVisiblePeriods.length - 1]?.id || periods[periods.length - 1]?.id || '1026'));
  };

  // Helper to extract parameter value for a specific branch and period
  const getParamVal = (branchId, periodIdStr, paramKey) => {
    if (branchId === 'all') {
      const realBranches = ['University', 'RPS', 'KPM', 'Common'];
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
    const branchVisiblePeriods = periods.filter(p => !p.branch || p.branch === 'all' || p.branch === branchId);
    branchVisiblePeriods.forEach(p => {
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
        othAmt += (getParamVal(activeBranch, String(p.id), 'other_cost') + getParamVal(activeBranch, String(p.id), 'cab_billing') + getParamVal(activeBranch, String(p.id), 'parking_fastag') + getParamVal(activeBranch, String(p.id), 'cctv_replacement'));
      });
    } else {
      fuelAmt = metrics.fuel_expenses;
      repAmt = metrics.repair_maintenance_cost;
      empAmt = metrics.employee_cost;
      fcAmt = metrics.statutory_cost + metrics.fc_cost;
      othAmt = metrics.other_cost + metrics.cab_billing + (metrics.parking_fastag || 0) + (metrics.cctv_replacement || 0);
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
      const o = getParamVal(activeBranch, String(p.id), 'other_cost') + getParamVal(activeBranch, String(p.id), 'cab_billing') + getParamVal(activeBranch, String(p.id), 'parking_fastag') + getParamVal(activeBranch, String(p.id), 'cctv_replacement');
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
    const curOth = isAllMonths ? Object.values(othMonthly).reduce((a, b) => a + b, 0) : (othMonthly[activePeriod] || (metrics.other_cost + metrics.cab_billing + (metrics.parking_fastag || 0) + (metrics.cctv_replacement || 0)));
    const curPax = isAllMonths ? 0 : (paxMonthly[activePeriod] || metrics.passengers_count);

    return [
      {
        categoryId: 'fuel',
        categoryName: 'Fuel & Diesel Expenses',
        color: '#ea580c',
        selectedAmount: curFuel,
        selectedPercent: (curFuel / denom) * 100,
        monthlyAmounts: fuelMonthly,
        maxMonthlyAmount: fuelMax,
        hideDetails: true
      },
      {
        categoryId: 'repair',
        categoryName: 'Repairs & Maintenance',
        color: '#0284c7',
        selectedAmount: curRep,
        selectedPercent: (curRep / denom) * 100,
        monthlyAmounts: repMonthly,
        maxMonthlyAmount: repMax,
        hideDetails: true
      },
      {
        categoryId: 'driver',
        categoryName: 'Drivers & Crew Wages',
        color: '#6366f1',
        selectedAmount: curEmp,
        selectedPercent: (curEmp / denom) * 100,
        monthlyAmounts: empMonthly,
        maxMonthlyAmount: empMax,
        hideDetails: true
      },
      {
        categoryId: 'statutory',
        categoryName: 'FC & Statutory Compliance',
        color: '#10b981',
        selectedAmount: curFc,
        selectedPercent: (curFc / denom) * 100,
        monthlyAmounts: fcMonthly,
        maxMonthlyAmount: fcMax,
        hideDetails: true
      },
      {
        categoryId: 'other',
        categoryName: 'Fastag, Tolls & Operational Sundries',
        color: '#f59e0b',
        selectedAmount: curOth,
        selectedPercent: (curOth / denom) * 100,
        monthlyAmounts: othMonthly,
        maxMonthlyAmount: othMax,
        hideDetails: true
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
        hideDetails: true
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

  // Operational Fleet Performance Stats (Diesel Cons, KM Run, Mileage & Averages)
  const opDieselLitres = (vehicleStats?.summary?.diesel_litres && Number(vehicleStats.summary.diesel_litres) > 0)
    ? num(vehicleStats.summary.diesel_litres) 
    : (num(metrics.diesel_litres) || num(vehicleStats?.summary?.diesel_litres));

  const opKmRun = (vehicleStats?.summary?.km_run && Number(vehicleStats.summary.km_run) > 0)
    ? num(vehicleStats.summary.km_run) 
    : (num(metrics.actual_kms) || num(vehicleStats?.summary?.km_run));

  const opMileage = opDieselLitres > 0 
    ? (opKmRun / opDieselLitres) 
    : ((vehicleStats?.summary?.mileage && Number(vehicleStats.summary.mileage) > 0) ? num(vehicleStats.summary.mileage) : (num(metrics.avg_mileage) || 4.0));

  const opBusCount = vehiclesList.length || (vehicleStats?.summary?.bus_count) || (activeBranchObj.busCount) || 18;

  const opAvgDieselPerBus = opBusCount > 0 ? (opDieselLitres / opBusCount).toFixed(1) : '0';
  const opAvgKmPerBus = opBusCount > 0 ? (opKmRun / opBusCount).toFixed(1) : '0';
  const opFuelExpenses = (vehicleStats?.summary?.fuel_expenses && Number(vehicleStats.summary.fuel_expenses) > 0)
    ? num(vehicleStats.summary.fuel_expenses)
    : (num(metrics.fuel_expenses) || num(vehicleStats?.summary?.fuel_expenses));
  const opFuelCostPerKm = opKmRun > 0 ? (opFuelExpenses / opKmRun).toFixed(2) : '0.00';
  const opPeriodLabel = isAllMonths ? 'All Months' : (activePeriodObj?.period_label || "Oct'26");

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-canvas, #F3F5FA)' }}>
      {/* ========================================================================= */}
      {/* STICKY TOP FILTER BAR (WHITE, BOTTOM BORDER, SOFT SHADOW, 3 ROWS)         */}
      {/* ========================================================================= */}
      <div
        className="sticky-dashboard-master-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 80,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #E1E6F2',
          padding: '16px 28px',
          boxShadow: '0 4px 16px rgba(20, 36, 92, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* ROW 1: Title + Transport badge + Red Fleet badge | Refresh, Download Report, Open Data Entry (Gold) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{
              fontSize: '21px',
              fontWeight: '800',
              color: 'var(--primary, #14245C)',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              Transport Operations Dashboard
            </h1>
            <span style={{
              fontSize: '11.5px',
              fontWeight: '800',
              padding: '3px 11px',
              borderRadius: '9999px',
              backgroundColor: '#EAF0FF',
              color: '#2F4BB8',
              border: '1px solid #c7d6ff'
            }}>
              Transport
            </span>
            <span style={{
              fontSize: '11.5px',
              fontWeight: '800',
              padding: '3px 11px',
              borderRadius: '9999px',
              backgroundColor: '#FBE3E3',
              color: '#A32626',
              border: '1px solid #f5bcbc'
            }}>
              {activeBranchObj.label} ({metrics.vehicles_count})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={fetchLiveMatrix}
              disabled={loading}
              style={{
                minHeight: '38px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #CBD5E1',
                color: 'var(--primary, #14245C)',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportReport || handlePrint}
              style={{
                minHeight: '38px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 15px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #CBD5E1',
                color: 'var(--primary, #14245C)',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Download Report</span>
            </button>

            {onOpenDataEntry && (
              <button
                type="button"
                onClick={() => {
                  const targetPeriodId = activePeriod !== 'all' ? Number(activePeriod) : null;
                  const targetBranch = activeBranch !== 'all' ? activeBranch : 'RPS';
                  onOpenDataEntry(targetPeriodId, targetBranch);
                }}
                style={{
                  minHeight: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent, #F5A524)',
                  color: 'var(--primary, #14245C)',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(245, 165, 36, 0.28)'
                }}
              >
                <span>Open Data Entry</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: VIEW segmented control + FLEET chips */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              VIEW
            </span>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-canvas, #F3F5FA)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid #E1E6F2',
              flexWrap: 'wrap',
              gap: '2px'
            }}>
              {[
                { id: 'executive', label: 'Executive overview' },
                { id: 'vehicles', label: 'Vehicle ledger (58 buses)' },
                { id: 'all', label: 'All views' }
              ].map(tab => {
                const isActive = activeMainView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveMainView(tab.id)}
                    style={{
                      minHeight: '34px',
                      padding: '5px 13px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isActive ? 'var(--primary, #14245C)' : 'transparent',
                      color: isActive ? '#ffffff' : '#475569',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '2px' }}>
              FLEET
            </span>
            {TRANSPORT_BRANCHES.filter(br => br.id !== 'all').map(br => {
              const isSel = activeBranch === br.id;
              const countBadge = br.id === 'Common' ? '18 buses' : (br.id === 'RPS' ? '19' : (br.id === 'University' ? '16' : '5'));
              return (
                <button
                  key={br.id}
                  type="button"
                  onClick={() => setActiveBranch(br.id)}
                  style={{
                    minHeight: '34px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: isSel ? '700' : '600',
                    border: isSel ? '1px solid var(--primary, #14245C)' : '1px solid #E1E6F2',
                    backgroundColor: isSel ? 'var(--primary, #14245C)' : '#ffffff',
                    color: isSel ? '#ffffff' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  <span>{br.label}</span>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    padding: '1px 6px',
                    borderRadius: '6px',
                    backgroundColor: isSel ? 'rgba(255,255,255,0.18)' : 'var(--bg-canvas, #F3F5FA)',
                    color: isSel ? 'var(--accent, #F5A524)' : '#64748b'
                  }}>
                    {countBadge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ROW 3: MONTH chips + Fleet Period / Viewing */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '6px',
          borderTop: '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '2px' }}>
              MONTH
            </span>
            <button
              type="button"
              onClick={() => setActivePeriod && setActivePeriod('all')}
              style={{
                minHeight: '34px',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                border: isAllMonths ? '1px solid var(--primary, #14245C)' : '1px solid #E1E6F2',
                backgroundColor: isAllMonths ? 'var(--primary, #14245C)' : '#ffffff',
                color: isAllMonths ? '#ffffff' : '#475569',
                cursor: 'pointer'
              }}
            >
              All months
            </button>
            {visiblePeriods.map(p => {
              const isSel = !isAllMonths && String(p.id) === String(activePeriod);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePeriod && setActivePeriod(String(p.id))}
                  style={{
                    minHeight: '34px',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: isSel ? '700' : '600',
                    border: isSel ? '1px solid var(--primary, #14245C)' : '1px solid #E1E6F2',
                    backgroundColor: isSel ? 'var(--primary, #14245C)' : '#ffffff',
                    color: isSel ? '#ffffff' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {p.period_label || p.period_code}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
            Fleet period / Viewing <strong style={{ color: 'var(--primary, #14245C)' }}>{activeBranchObj.label}</strong>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT ON var(--bg-canvas, #F3F5FA) CANVAS (28px padding, 28px gap) */}
      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', boxSizing: 'border-box' }}>
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
          {/* 1.5. CATEGORY CARDS BENTO GRID WITH MONTHLY TREND BARS & DETAILS TOGGLE */}
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
                hideDetails={true}
                formatCompact={cat.isPersonCategory ? (v) => Math.round(Number(v || 0)).toLocaleString('en-IN') : formatIndianCompact}
                formatFull={cat.isPersonCategory ? (v) => Math.round(Number(v || 0)).toLocaleString('en-IN') : formatINR}
                hidePercentage={cat.isPersonCategory}
              />
            ))}
          </div>

{/* ----------------------------------------------------------------------- */}
          {/* 2. OPERATIONAL FLEET PERFORMANCE KPI CARDS (DIESEL, KM RUN, MILEAGE)    */}
          {/* Live DB connection • Click to inspect individual vehicles & averages   */}
          {/* ----------------------------------------------------------------------- */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: '14px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {/* KPI 1: Diesel cons */}
            <div
              onClick={() => handleOpenVehicleModal('diesel')}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '18px 20px',
                border: '1.5px solid #fed7aa',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.08)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 22px rgba(245, 158, 11, 0.18)';
                e.currentTarget.style.borderColor = '#f59e0b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.08)';
                e.currentTarget.style.borderColor = '#fed7aa';
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#f59e0b' }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#fef3c7',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      ⛽
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        Diesel cons
                      </h3>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#92400e' }}>
                        Diesel Consumption • {opPeriodLabel}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    backgroundColor: '#fffbeb',
                    color: '#b45309',
                    border: '1px solid #fde68a'
                  }}>
                    Operational KPI
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '12px 0 10px 0' }}>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.8px', lineHeight: 1 }}>
                    {opDieselLitres.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#d97706' }}>
                    Litres
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <TrendingUp size={13} />
                    Avg: <strong>{opAvgDieselPerBus} L / bus</strong>
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Fuel Cost: <strong>₹{formatIndianCompact(opFuelExpenses)}</strong>
                  </span>
                </div>
              </div>

              <div style={{
                paddingTop: '10px',
                borderTop: '1px solid #fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#d97706',
                fontSize: '11.5px',
                fontWeight: '700'
              }}>
                <span>Click to view {opBusCount} vehicle litres & avg</span>
                <ArrowRight size={14} />
              </div>
            </div>

            {/* KPI 2: KM run Oct */}
            <div
              onClick={() => handleOpenVehicleModal('km')}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '18px 20px',
                border: '1.5px solid #bfdbfe',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.08)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 22px rgba(2, 132, 199, 0.18)';
                e.currentTarget.style.borderColor = '#0284c7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.08)';
                e.currentTarget.style.borderColor = '#bfdbfe';
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#0284c7' }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#eff6ff',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      🛣️
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        {isAllMonths ? 'KM run (All Months)' : `KM run ${opPeriodLabel.split("'")[0]}`}
                      </h3>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#0369a1' }}>
                        Distance Logged • {opPeriodLabel}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    backgroundColor: '#eff6ff',
                    color: '#0369a1',
                    border: '1px solid #bfdbfe'
                  }}>
                    Fleet Distance
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '12px 0 10px 0' }}>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.8px', lineHeight: 1 }}>
                    {Math.round(opKmRun).toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#0284c7' }}>
                    KM
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#e0f2fe',
                    color: '#075985',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Gauge size={13} />
                    Avg: <strong>{opAvgKmPerBus} KM / bus</strong>
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Active: <strong>{opBusCount} buses active</strong>
                  </span>
                </div>
              </div>

              <div style={{
                paddingTop: '10px',
                borderTop: '1px solid #e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#0284c7',
                fontSize: '11.5px',
                fontWeight: '700'
              }}>
                <span>Click to view {opBusCount} vehicle KMs & avg</span>
                <ArrowRight size={14} />
              </div>
            </div>

            {/* KPI 3: Oct'26 Mileage */}
            <div
              onClick={() => handleOpenVehicleModal('mileage')}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '18px 20px',
                border: '1.5px solid #a7f3d0',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 22px rgba(16, 185, 129, 0.18)';
                e.currentTarget.style.borderColor = '#10b981';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.08)';
                e.currentTarget.style.borderColor = '#a7f3d0';
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#10b981' }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      ⚡
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        {isAllMonths ? 'Fleet Mileage' : `${opPeriodLabel} Mileage`}
                      </h3>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#065f46' }}>
                        Fuel Efficiency • {opPeriodLabel}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    backgroundColor: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0'
                  }}>
                    Efficiency
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '12px 0 10px 0' }}>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: '#059669', letterSpacing: '-0.8px', lineHeight: 1 }}>
                    {Number(opMileage).toFixed(2)}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#047857' }}>
                    km/L
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Sparkles size={13} />
                    Fleet Avg: <strong>{Number(opMileage).toFixed(2)} km/L</strong>
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Cost: <strong>₹{opFuelCostPerKm} / km</strong>
                  </span>
                </div>
              </div>

              <div style={{
                paddingTop: '10px',
                borderTop: '1px solid #d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#059669',
                fontSize: '11.5px',
                fontWeight: '700'
              }}>
                <span>Click to view {opBusCount} vehicle mileage & avg</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>



          {/* 2B. VEHICLE FLEET OPERATIONAL ANALYTICS (3-ROW TABLE + SIDE CHART) */}
          <TransportVehicleDetailsModal
            embedded={true}
            isOpen={true}
            isAllMonths={isAllMonths}
            vehicles={vehiclesList}
            initialFocus={modalMetricFocus}
            activeBranch={activeBranch}
            activePeriodLabel={isAllMonths ? 'All Months' : (activePeriodObj?.period_label || "Oct'26")}
            summary={vehicleStats?.summary || {}}
            branches={TRANSPORT_BRANCHES}
            onBranchChange={(newBranch) => setActiveBranch(newBranch)}
            onJumpToLedger={() => setActiveMainView('vehicles')}
          />


                    {/* ----------------------------------------------------------------------- */}
          {/* MULTI-MONTH SANCTIONED BUDGET PARAMETERS & UTILIZATION TABLE           */}
          {/* Matching User's Image Design with live spend across all recorded months */}
          {/* ----------------------------------------------------------------------- */}
          {(() => {
            const activeBranchBudget = dbBranchBudgets?.[activeBranch] || 
                                       propComputedMatrix?.transport_branch_budgets?.[activeBranch] || 
                                       DEFAULT_BRANCH_BUDGETS[activeBranch];
            if (!activeBranchBudget?.lineItems) return null;
            const lineItems = activeBranchBudget.lineItems;
            const branchSanctioned = activeBranchBudget.sanctioned || 0;

            // Multi-month table periods: display all visible fleet periods across columns (matching Image 5)
            const tablePeriods = (visiblePeriods && visiblePeriods.length > 0) ? visiblePeriods : [];

            const getParamKeyFromItem = (pName) => {
              const p = (pName || '').toLowerCase();
              if (p.includes('fuel')) return 'fuel_expenses';
              if (p.includes('fc')) return 'fc_cost';
              if (p.includes('statutory')) return 'statutory_cost';
              if (p.includes('repair') || p.includes('maintenance')) return 'repair_maintenance_cost';
              if (p.includes('cctv')) return 'cctv_replacement';
              if (p.includes('parking') || p.includes('fastag')) return 'parking_fastag';
              if (p.includes('employee') || p.includes('driver')) return 'employee_cost';
              if (p.includes('other')) return 'other_cost';
              if (p.includes('total')) return 'total_expenses';
              return null;
            };

            const getParamMonthSpend = (pId, paramName) => {
              const key = getParamKeyFromItem(paramName);
              const cleanParamKey = (paramName || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
              if (activeBranch === 'all') {
                const realBranches = ['University', 'RPS', 'KPM', 'Common'];
                return realBranches.reduce((sum, b) => {
                  const d = effectiveMatrix?.transport_census_by_branch?.[b]?.[String(pId)] || {};
                  const cm = d.custom_metrics || {};
                  const val = key ? (Number(d[key]) || 0) : 0;
                  const cmVal = Number(cm[key]) || Number(cm[cleanParamKey]) || Number(d[cleanParamKey]) || 0;
                  return sum + (val || cmVal || 0);
                }, 0);
              }
              const d = effectiveMatrix?.transport_census_by_branch?.[activeBranch]?.[String(pId)] || {};
              const cm = d.custom_metrics || {};
              const val = key ? (Number(d[key]) || 0) : 0;
              const cmVal = Number(cm[key]) || Number(cm[cleanParamKey]) || Number(d[cleanParamKey]) || 0;
              return val || cmVal || 0;
            };

            const branchTotalSpent = tablePeriods.reduce((sum, p) => sum + getParamMonthSpend(p.id, 'Total Expenses'), 0);
            const branchBalance = branchSanctioned > 0 ? (branchSanctioned - branchTotalSpent) : 0;
            const branchPctUtilized = branchSanctioned > 0 ? ((branchTotalSpent / branchSanctioned) * 100) : 0;

            return (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: `1.5px solid ${activeBranchObj.badgeColor}40`,
                padding: '18px 22px',
                boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                {/* Header Strip with Summary KPIs matching image layout */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: activeBranchObj.badgeBg,
                      color: activeBranchObj.badgeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      boxShadow: `0 2px 6px ${activeBranchObj.badgeColor}30`
                    }}>
                      {activeBranchObj.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                          {activeBranchObj.label} — Sanctioned Budget Parameters & Utilization
                        </h4>
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          fontWeight: '700',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe'
                        }}>
                          Table: transport_budget_{activeBranch.toLowerCase()}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: isAllMonths ? '#eff6ff' : activeBranchObj.badgeBg,
                          color: isAllMonths ? '#1d4ed8' : activeBranchObj.badgeColor,
                          border: `1px solid ${isAllMonths ? '#bfdbfe' : activeBranchObj.badgeColor + '40'}`
                        }}>
                          {isAllMonths ? 'All Months Consolidated' : `${opPeriodLabel} Active`}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                        Authoritative management budget allocation (FY 2026-2027) • Multi-month spend tracking across all {tablePeriods.length} cycles (shows values where connected, dashes where unrecorded)
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: '#f0fdf4',
                      color: '#166534',
                      border: '1.5px solid #bbf7d0'
                    }}>
                      Sanctioned: <strong>{formatINR(branchSanctioned)}</strong>
                    </span>

                    <span style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: '#fff7ed',
                      color: '#c2410c',
                      border: '1.5px solid #fed7aa'
                    }}>
                      Spent: <strong>{formatINR(branchTotalSpent)}</strong>
                    </span>

                    <span style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: branchBalance >= 0 ? '#f0fdf4' : '#fef2f2',
                      color: branchBalance >= 0 ? '#166534' : '#991b1b',
                      border: `1.5px solid ${branchBalance >= 0 ? '#bbf7d0' : '#fecaca'}`
                    }}>
                      Balance: <strong>{formatINR(branchBalance)}</strong>
                    </span>

                    <span style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: branchPctUtilized > 100 ? '#fef2f2' : '#eff6ff',
                      color: branchPctUtilized > 100 ? '#b91c1c' : '#1d4ed8',
                      border: `1.5px solid ${branchPctUtilized > 100 ? '#fecaca' : '#bfdbfe'}`
                    }}>
                      Utilized: <strong>{branchPctUtilized.toFixed(1)}%</strong>
                    </span>
                  </div>
                </div>

                {/* Multi-Month Table matching Image Design */}
                <div style={{
                  overflowX: 'auto',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--primary, #14245C)', color: '#ffffff', borderBottom: '2px solid var(--primary, #14245C)' }}>
                        {/* 1. Parameters Column (Sticky Left) */}
                        <th style={{
                          padding: '10px 14px',
                          fontWeight: '800',
                          color: '#ffffff',
                          position: 'sticky',
                          left: 0,
                          backgroundColor: 'var(--primary, #14245C)',
                          zIndex: 20,
                          minWidth: '240px',
                          boxShadow: '2px 0 5px rgba(0,0,0,0.04)'
                        }}>
                          Parameters
                        </th>

                        {/* 2. Sanctioned (₹) Column (Green text matching image) */}
                        <th style={{
                          padding: '10px 14px',
                          fontWeight: '800',
                          color: '#166534',
                          backgroundColor: '#f0fdf4',
                          textAlign: 'right',
                          minWidth: '135px',
                          borderLeft: '1px solid #e2e8f0',
                          borderRight: '1.5px solid #cbd5e1'
                        }}>
                          SANCTIONED (₹)
                        </th>

                        {/* 3. Monthly Spend Columns */}
                        {tablePeriods.map((p) => {
                          const isActiveMonth = !isAllMonths && (String(p.id) === String(activePeriod) || p.period_label === opPeriodLabel);
                          return (
                            <th
                              key={p.id}
                              onClick={() => setActivePeriod && setActivePeriod(String(p.id))}
                              title={`Click to set ${p.period_label} as active cycle`}
                              style={{
                                padding: '8px 12px',
                                fontWeight: '800',
                                textAlign: 'right',
                                minWidth: '110px',
                                cursor: 'pointer',
                                backgroundColor: isActiveMonth ? '#eff6ff' : '#f8fafc',
                                color: isActiveMonth ? '#1d4ed8' : '#475569',
                                borderTop: isActiveMonth ? '3px solid #2563eb' : 'none',
                                borderLeft: '1px solid #e2e8f0',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span>{p.period_label}</span>
                                {isActiveMonth && (
                                  <span style={{
                                    fontSize: '8.5px',
                                    fontWeight: '800',
                                    backgroundColor: '#2563eb',
                                    color: '#ffffff',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    marginTop: '2px',
                                    letterSpacing: '0.04em'
                                  }}>
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}

                        {/* 4. Total Spent Column */}
                        <th style={{
                          padding: '10px 14px',
                          fontWeight: '800',
                          color: '#0f172a',
                          textAlign: 'right',
                          minWidth: '125px',
                          backgroundColor: '#f1f5f9',
                          borderLeft: '1.5px solid #cbd5e1'
                        }}>
                          TOTAL SPENT (₹)
                        </th>

                        {/* 5. Balance Column */}
                        <th style={{
                          padding: '10px 14px',
                          fontWeight: '800',
                          color: '#0f172a',
                          textAlign: 'right',
                          minWidth: '120px',
                          backgroundColor: '#f1f5f9',
                          borderLeft: '1px solid #e2e8f0'
                        }}>
                          BALANCE (₹)
                        </th>

                        {/* 6. % Utilized Column */}
                        <th style={{
                          padding: '10px 12px',
                          fontWeight: '800',
                          color: '#0f172a',
                          textAlign: 'center',
                          minWidth: '95px',
                          backgroundColor: '#f1f5f9',
                          borderLeft: '1px solid #e2e8f0'
                        }}>
                          % UTILIZED
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {lineItems.map((item, idx) => {
                        const rowSanctioned = item.amount || 0;
                        const rowTotalSpent = tablePeriods.reduce((sum, p) => sum + getParamMonthSpend(p.id, item.param), 0);
                        const rowBalance = rowSanctioned > 0 ? (rowSanctioned - rowTotalSpent) : 0;
                        const rowPct = rowSanctioned > 0 ? ((rowTotalSpent / rowSanctioned) * 100) : 0;

                        return (
                          <tr
                            key={idx}
                            style={{
                              backgroundColor: item.isTotal ? '#fef08a' : (idx % 2 === 0 ? '#ffffff' : '#fcfcfd'),
                              borderBottom: item.isTotal ? '2.5px solid #ca8a04' : '1px solid #e2e8f0',
                              borderTop: item.isTotal ? '2.5px solid #ca8a04' : 'none'
                            }}
                          >
                            {/* Parameters Column (Sticky Left) */}
                            <td style={{
                              padding: item.isTotal ? '11px 14px' : '9px 14px',
                              fontWeight: item.isTotal ? '900' : '700',
                              color: item.isTotal ? '#854d0e' : '#1e293b',
                              fontSize: item.isTotal ? '13.5px' : '12.5px',
                              position: 'sticky',
                              left: 0,
                              backgroundColor: item.isTotal ? '#fef08a' : (idx % 2 === 0 ? '#ffffff' : '#fcfcfd'),
                              zIndex: 10,
                              boxShadow: '2px 0 5px rgba(0,0,0,0.03)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: item.color || '#3b82f6',
                                  display: item.isTotal ? 'none' : 'inline-block',
                                  flexShrink: 0
                                }} />
                                {item.param}
                              </div>
                            </td>

                            {/* SANCTIONED (₹) Column (Green text matching image) */}
                            <td style={{
                              padding: item.isTotal ? '11px 14px' : '9px 14px',
                              fontWeight: item.isTotal ? '900' : '800',
                              color: item.isTotal ? '#854d0e' : '#166534',
                              textAlign: 'right',
                              fontSize: item.isTotal ? '14px' : '12.5px',
                              backgroundColor: item.isTotal ? '#fef08a' : '#f0fdf4',
                              borderLeft: '1px solid #e2e8f0',
                              borderRight: '1.5px solid #cbd5e1'
                            }}>
                              {item.isBlank || item.param === 'EMI' ? '—' : (item.amount > 0 ? formatINR(item.amount) : '0')}
                            </td>

                            {/* Monthly Spend Columns */}
                            {tablePeriods.map((p) => {
                              const monthSpend = getParamMonthSpend(p.id, item.param);
                              const isActiveMonth = !isAllMonths && (String(p.id) === String(activePeriod) || p.period_label === opPeriodLabel);

                              return (
                                <td
                                  key={p.id}
                                  style={{
                                    padding: item.isTotal ? '11px 12px' : '9px 12px',
                                    fontWeight: item.isTotal ? '900' : (monthSpend > 0 ? '700' : '400'),
                                    color: item.isTotal ? '#854d0e' : (monthSpend > 0 ? '#0f172a' : '#94a3b8'),
                                    textAlign: 'right',
                                    fontSize: item.isTotal ? '13.5px' : '12.5px',
                                    backgroundColor: item.isTotal ? '#fef08a' : (isActiveMonth ? '#eff6ff50' : 'transparent'),
                                    borderLeft: '1px solid #f1f5f9'
                                  }}
                                >
                                  {monthSpend > 0 ? formatINR(monthSpend) : '—'}
                                </td>
                              );
                            })}

                            {/* Total Spent Column */}
                            <td style={{
                              padding: item.isTotal ? '11px 14px' : '9px 14px',
                              fontWeight: item.isTotal ? '900' : '800',
                              color: item.isTotal ? '#854d0e' : '#0f172a',
                              textAlign: 'right',
                              fontSize: item.isTotal ? '14px' : '12.5px',
                              backgroundColor: item.isTotal ? '#fef08a' : '#f8fafc',
                              borderLeft: '1.5px solid #cbd5e1'
                            }}>
                              {rowTotalSpent > 0 ? formatINR(rowTotalSpent) : (item.isBlank || item.param === 'EMI' ? '—' : '₹0')}
                            </td>

                            {/* Balance Column */}
                            <td style={{
                              padding: item.isTotal ? '11px 14px' : '9px 14px',
                              fontWeight: item.isTotal ? '900' : '800',
                              color: rowBalance >= 0 ? '#15803d' : '#dc2626',
                              textAlign: 'right',
                              fontSize: item.isTotal ? '14px' : '12.5px',
                              backgroundColor: item.isTotal ? '#fef08a' : '#f8fafc',
                              borderLeft: '1px solid #e2e8f0'
                            }}>
                              {item.isTotal || rowSanctioned > 0 ? formatINR(rowBalance) : '—'}
                            </td>

                            {/* % Utilized Column */}
                            <td style={{
                              padding: item.isTotal ? '11px 12px' : '9px 12px',
                              textAlign: 'center',
                              fontSize: '11.5px',
                              backgroundColor: item.isTotal ? '#fef08a' : '#f8fafc',
                              borderLeft: '1px solid #e2e8f0'
                            }}>
                              {rowSanctioned > 0 ? (
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 7px',
                                  borderRadius: '9999px',
                                  fontWeight: '800',
                                  fontSize: '11px',
                                  backgroundColor: rowPct > 100 ? '#fef2f2' : rowPct > 80 ? '#fffbeb' : '#ecfdf5',
                                  color: rowPct > 100 ? '#b91c1c' : rowPct > 80 ? '#b45309' : '#047857',
                                  border: `1px solid ${rowPct > 100 ? '#fecaca' : rowPct > 80 ? '#fed7aa' : '#a7f3d0'}`
                                }}>
                                  {rowPct.toFixed(1)}%
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}




        </div>
      )}

      {/* ========================================================================= */}
      {/* EMBEDDED FLEET VEHICLE CARDS & 3-MONTH PERFORMANCE ANALYTICS              */}
      {/* ========================================================================= */}
      {(activeMainView === 'vehicles') && (
        <TransportVehicleDetailsModal
          embedded={true}
          isOpen={true}
          isAllMonths={isAllMonths}
          vehicles={vehiclesList}
          initialFocus={modalMetricFocus}
          activeBranch={activeBranch}
          activePeriodLabel={isAllMonths ? 'All Months' : (activePeriodObj?.period_label || "Oct'26")}
          summary={vehicleStats?.summary || {}}
          branches={TRANSPORT_BRANCHES}
          onBranchChange={(newBranch) => setActiveBranch(newBranch)}
          onJumpToLedger={() => setActiveMainView('vehicles')}
        />
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
            readOnly={true}
          />
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* SECTION: OVERALL EXPENSE SUMMARY (4 BENTO KPI CARDS) - MOVED TO BOTTOM    */}
      {/* ----------------------------------------------------------------------- */}
      {(activeMainView === 'executive' || activeMainView === 'all') && (
        <div style={{ marginTop: '20px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sanctioned Budget & Balance
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: activeBranchObj.badgeBg,
                    color: activeBranchObj.badgeColor
                  }}>
                    {activeBranchObj.label}
                  </span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
                  {formatINR(metrics.balance)}
                </div>
                <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: '700' }}>
                  Budget: {formatLakhs(metrics.approved_budget)} • Spent: {formatLakhs(metrics.cumulative_budget_spent || metrics.total_expenses)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                    <span>Budget Balance:</span>
                    <strong style={{ color: '#0284c7' }}>
                      {metrics.approved_budget > 0 ? (((metrics.approved_budget - (metrics.cumulative_budget_spent || metrics.total_expenses)) / metrics.approved_budget) * 100).toFixed(1) : '100'}% Remaining
                    </strong>
                  </div>
                  <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${metrics.approved_budget > 0 ? Math.min(100, Math.max(0, ((metrics.cumulative_budget_spent || metrics.total_expenses) / metrics.approved_budget) * 100)) : 0}%`,
                      height: '100%',
                      backgroundColor: '#0284c7',
                      borderRadius: '9999px'
                    }} />
                  </div>
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
        </div>
      )}

      {/* MONTHLY SUPPORTING ATTACHMENTS, PRESENTATIONS & BILLS FOR ACTIVE MONTH */}
      <div style={{ marginTop: '18px' }}>
        <MonthlyAttachmentsDashboardSection
          module="transport"
          periodId={isAllMonths ? 'all' : (activePeriodObj?.id || activePeriod)}
          periodLabel={isAllMonths ? 'All Months' : (activePeriodObj?.period_label || "Oct'26")}
          periods={visiblePeriods}
          branch={activeBranch}
          currentUser={null}
        />
      </div>

      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* VEHICLE DETAILS & FLEET AVERAGES MODAL (DB CONNECTED)                    */}
      {/* ----------------------------------------------------------------------- */}
      {isVehicleModalOpen && (
        <TransportVehicleDetailsModal
          isOpen={isVehicleModalOpen}
          isAllMonths={isAllMonths}
          onClose={() => setIsVehicleModalOpen(false)}
          vehicles={vehiclesList}
          initialFocus={modalMetricFocus}
          activeBranch={activeBranch}
          activePeriodLabel={isAllMonths ? 'All Months' : (activePeriodObj?.period_label || "Oct'26")}
          summary={vehicleStats?.summary || {}}
          branches={TRANSPORT_BRANCHES}
          onBranchChange={(newBranch) => setActiveBranch(newBranch)}
          onJumpToLedger={() => {
            setIsVehicleModalOpen(false);
            setActiveMainView('vehicles');
          }}
        />
      )}

    </div>
  );
}
