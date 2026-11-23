import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Bus, Users, Fuel, Wrench, ShieldCheck, DollarSign, Download, 
  ArrowRight, FileSpreadsheet, Calendar, ChevronDown, Check,
  Sparkles, FileText, Printer, Paperclip, LayoutDashboard, Table, Layers,
  TrendingUp, Calculator, Gauge, MapPin, AlertCircle, RefreshCw, Search,
  CheckCircle2, ArrowUpRight, BarChart3, PieChart
} from 'lucide-react';
import { formatINR, formatLakhs, formatPeriodLabel, formatIndianCompact } from '../../../utils/formatters';
import { TRANSPORT_BRANCHES, CANONICAL_TRANSPORT_PARAMETERS } from '../../data_entry/TransportSpreadsheetEntry';
import TransportVehicleExpensesTable from '../../data_entry/TransportVehicleExpensesTable';
import TransportDashboardCensusView from '../TransportDashboardCensusView';
import TransportDashboardDataTable from '../TransportDashboardDataTable';

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

  // Disallow consolidated 'all' branch and 'all' period in transport
  useEffect(() => {
    if (activeBranch === 'all') {
      setActiveBranch('Common');
    }
  }, [activeBranch]);

  useEffect(() => {
    if (visiblePeriods.length > 0 && setActivePeriod) {
      const isCurrentInVisible = visiblePeriods.some(p => String(p.id) === String(activePeriod));
      if (!isCurrentInVisible || activePeriod === 'all') {
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

  // Fetch live vehicle summary from /api/transport/vehicles
  useEffect(() => {
    const pId = activePeriod !== 'all' ? activePeriod : (visiblePeriods[visiblePeriods.length - 1]?.id || periods[periods.length - 1]?.id || 1026);
    fetch(`/api/transport/vehicles?period_id=${pId}&branch=all`)
      .then(res => res.json())
      .then(d => {
        if (d && d.status === 'success') {
          setVehicleStats(d);
        }
      })
      .catch(e => console.warn('[TransportDashboard] Vehicle stats notice:', e));
  }, [activePeriod, visiblePeriods, periods]);

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
              {`${activePeriodObj?.period_label || 'Focus Month'} (${formatINR(metrics.total_expenses)}) • ${activeBranchObj.label}`}
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
      {/* MAIN VIEW: EXECUTIVE OVERVIEW (3 NUMBERED SECTIONS MATCHING FOOD/HOSTEL)  */}
      {/* ========================================================================= */}
      {(activeMainView === 'executive' || activeMainView === 'all') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>

          {/* ----------------------------------------------------------------------- */}
          {/* SECTION 1 (LINE 1): MONTH-BY-MONTH FLEET EXPENDITURE DATA SHEET         */}
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
          {/* SECTION 2 (LINE 2): MONTHLY EXPENSE & COST DRIVERS BREAKDOWN            */}
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
                  2
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Monthly Expense & Cost Category Breakdown
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#7c3aed',
                  backgroundColor: '#f3e8ff',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid #d8b4fe'
                }}>
                  Visual Cost Drivers & Category Mix
                </span>
              </div>

              <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                Breakdown of Fuel, Maintenance, Statutory/FC, Driver/Employee, and Cab expenses with cost/km metrics
              </div>
            </div>

            {/* 5 Major Cost Drivers Bento Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}>
              {/* Cost Head 1: Fuel Expenses */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1.5px solid #fed7aa',
                padding: '18px 20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase' }}>
                    1. Fuel & Diesel
                  </span>
                  <Fuel size={18} color="#ea580c" />
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                  {formatINR(metrics.fuel_expenses)}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {metrics.total_expenses > 0 ? ((metrics.fuel_expenses / metrics.total_expenses) * 100).toFixed(1) : '0'}% of total spend
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', backgroundColor: '#ffedd5', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, metrics.total_expenses > 0 ? (metrics.fuel_expenses / metrics.total_expenses) * 100 : 0)}%`,
                    height: '100%',
                    backgroundColor: '#ea580c'
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span>Qty: {num(metrics.diesel_litres).toLocaleString()} L</span>
                  <span>Cost/km: ₹{metrics.fuel_cost_per_km}</span>
                </div>
              </div>

              {/* Cost Head 2: Repairs & Maintenance */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1.5px solid #bae6fd',
                padding: '18px 20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>
                    2. Repairs & Maintenance
                  </span>
                  <Wrench size={18} color="#0284c7" />
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                  {formatINR(metrics.repair_maintenance_cost)}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {metrics.total_expenses > 0 ? ((metrics.repair_maintenance_cost / metrics.total_expenses) * 100).toFixed(1) : '0'}% of total spend
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#e0f2fe', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, metrics.total_expenses > 0 ? (metrics.repair_maintenance_cost / metrics.total_expenses) * 100 : 0)}%`,
                    height: '100%',
                    backgroundColor: '#0284c7'
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span>FC: {formatINR(metrics.fc_cost)}</span>
                  <span>Work orders done</span>
                </div>
              </div>

              {/* Cost Head 3: Employee & Drivers */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1.5px solid #d8b4fe',
                padding: '18px 20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase' }}>
                    3. Drivers & Manpower
                  </span>
                  <Users size={18} color="#7c3aed" />
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                  {formatINR(metrics.employee_cost)}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {metrics.total_expenses > 0 ? ((metrics.employee_cost / metrics.total_expenses) * 100).toFixed(1) : '0'}% of total spend
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#f3e8ff', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, metrics.total_expenses > 0 ? (metrics.employee_cost / metrics.total_expenses) * 100 : 0)}%`,
                    height: '100%',
                    backgroundColor: '#7c3aed'
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span>Staff transit deducted</span>
                  <span>Full crew wages</span>
                </div>
              </div>

              {/* Cost Head 4: Statutory & Taxes */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1.5px solid #a7f3d0',
                padding: '18px 20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#059669', textTransform: 'uppercase' }}>
                    4. Statutory & FC
                  </span>
                  <ShieldCheck size={18} color="#059669" />
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                  {formatINR(metrics.statutory_cost + metrics.fc_cost)}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {metrics.total_expenses > 0 ? (((metrics.statutory_cost + metrics.fc_cost) / metrics.total_expenses) * 100).toFixed(1) : '0'}% of total spend
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#ecfdf5', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, metrics.total_expenses > 0 ? ((metrics.statutory_cost + metrics.fc_cost) / metrics.total_expenses) * 100 : 0)}%`,
                    height: '100%',
                    backgroundColor: '#059669'
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span>100% RTO compliance</span>
                  <span>Fitness certified</span>
                </div>
              </div>
            </div>

            {/* Branch Split Comparative Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '14px'
            }}>
              {[
                { id: 'Common', label: 'Common Fleet', icon: '🚌', count: 18, color: '#d97706', bg: '#fef3c7' },
                { id: 'RPS', label: 'RPS Branch', icon: '🏫', count: 19, color: '#7c3aed', bg: '#f3e8ff' },
                { id: 'University', label: 'University Fleet', icon: '🎓', count: 16, color: '#dc2626', bg: '#fee2e2' },
                { id: 'KPM', label: 'KPM Branch', icon: '🏫', count: 5, color: '#059669', bg: '#d1fae5' }
              ].map(b => {
                const bMetrics = getBranchEffectiveMetrics(b.id);
                const isCurrent = activeBranch === b.id;

                return (
                  <div
                    key={b.id}
                    onClick={() => setActiveBranch(b.id)}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '14px',
                      border: isCurrent ? `2.5px solid ${b.color}` : '1.5px solid #e2e8f0',
                      padding: '16px 18px',
                      boxShadow: isCurrent ? `0 4px 14px ${b.color}25` : '0 1px 3px rgba(0,0,0,0.02)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{b.icon}</span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{b.label}</span>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        backgroundColor: b.bg,
                        color: b.color,
                        padding: '2px 8px',
                        borderRadius: '9999px'
                      }}>
                        {b.count} Buses
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px' }}>
                      <div style={{ backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '6px' }}>
                        <div style={{ color: '#64748b' }}>Distance</div>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13px' }}>
                          {num(bMetrics.actual_kms).toLocaleString()} KM
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '6px' }}>
                        <div style={{ color: '#64748b' }}>Diesel Qty</div>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13px' }}>
                          {num(bMetrics.diesel_litres).toLocaleString()} L
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '6px' }}>
                        <div style={{ color: '#64748b' }}>Fuel Expense</div>
                        <div style={{ fontWeight: '800', color: '#ea580c', fontSize: '13px' }}>
                          {formatINR(bMetrics.fuel_expenses)}
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '6px' }}>
                        <div style={{ color: '#64748b' }}>Total Expenses</div>
                        <div style={{ fontWeight: '800', color: '#16a34a', fontSize: '13px' }}>
                          {formatINR(bMetrics.total_expenses)}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                      <span>Mileage: <strong>{bMetrics.avg_mileage} km/L</strong></span>
                      <span style={{ color: b.color, fontWeight: '700' }}>Click to view branch →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* SECTION 3 (LINE 3): OVERALL EXPENSE SUMMARY (4 BENTO KPI CARDS)        */}
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
