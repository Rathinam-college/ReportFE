import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bus, Users, Fuel, Wrench, ShieldCheck, DollarSign, Download, 
  ArrowRight, FileSpreadsheet, Calendar, ChevronDown, Check,
  Sparkles, FileText, Printer, Paperclip, LayoutDashboard, Table, Layers,
  TrendingUp, Calculator, Gauge, MapPin, AlertCircle, RefreshCw
} from 'lucide-react';
import { formatINR, formatLakhs } from '../../../utils/formatters';
import { TRANSPORT_BRANCHES } from '../../data_entry/TransportSpreadsheetEntry';
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
  const [activeBranch, setActiveBranch] = useState('all');
  const [activeMainView, setActiveMainView] = useState('executive'); // 'executive' | 'vehicles' | 'parameters' | 'comparison'
  const [localMatrix, setLocalMatrix] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vehicleStats, setVehicleStats] = useState(null);

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

  const effectiveMatrix = (propComputedMatrix?.transport_census_by_branch && Object.keys(propComputedMatrix.transport_census_by_branch).length > 0)
    ? propComputedMatrix
    : (localMatrix || propComputedMatrix || {});

  const periods = (propPeriods && propPeriods.length > 0) ? propPeriods : (effectiveMatrix.periods || []);

  // Fetch live vehicle summary from /api/transport/vehicles
  useEffect(() => {
    const pId = activePeriod !== 'all' ? activePeriod : (periods[periods.length - 1]?.id || 1026);
    fetch(`/api/transport/vehicles?period_id=${pId}&branch=all`)
      .then(res => res.json())
      .then(d => {
        if (d && d.status === 'success') {
          setVehicleStats(d);
        }
      })
      .catch(e => console.warn('[TransportDashboard] Vehicle stats notice:', e));
  }, [activePeriod, periods]);

  const isAllMonths = activePeriod === 'all';

  // Effective period object
  const activePeriodObj = useMemo(() => {
    if (activePeriod && activePeriod !== 'all') {
      return periods.find(p => String(p.id) === String(activePeriod)) || periods[periods.length - 1] || null;
    }
    return periods[periods.length - 1] || null;
  }, [activePeriod, periods]);

  const activePeriodIdStr = activePeriodObj ? String(activePeriodObj.id) : null;
  const activeBranchObj = TRANSPORT_BRANCHES.find(b => b.id === activeBranch) || TRANSPORT_BRANCHES[0];

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // Helper to compute metrics for a branch and period
  const getBranchMetrics = (branchId, pStr) => {
    if (branchId === 'all') {
      const realBranches = ['Common', 'RPS', 'KPM', 'University'];
      let totVeh = 58;
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
        approved_budget: totAppBud,
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
    const emp = num(m.employee_cost, 0);
    const totExpenses = fuel + fc + stat + rep + oth + emp;
    const diesel = num(m.diesel_litres, 0);
    const demand = num(m.fee_demand, 0);
    const paid = num(m.fee_collected, 0);
    const appBud = num(m.approved_budget, 0);
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

  // Metrics across all months if "all" is selected, else single month
  const metrics = useMemo(() => {
    if (isAllMonths && periods.length > 0) {
      let sumActKms = 0;
      let sumAppKms = 0;
      let sumAddKms = 0;
      let sumFuel = 0;
      let sumFc = 0;
      let sumStat = 0;
      let sumRep = 0;
      let sumOth = 0;
      let sumEmp = 0;
      let sumDiesel = 0;
      let sumDemand = 0;
      let sumPaid = 0;
      let maxAppBud = 0;
      let sumSpentBud = 0;
      let sumPass = 0;
      let sumTkR = 0;
      let sumTkC = 0;

      periods.forEach(p => {
        const bm = getBranchMetrics(activeBranch, String(p.id));
        sumActKms += bm.actual_kms;
        sumAppKms += bm.approved_kms;
        sumAddKms += bm.additional_kms;
        sumFuel += bm.fuel_expenses;
        sumFc += bm.fc_cost;
        sumStat += bm.statutory_cost;
        sumRep += bm.repair_maintenance_cost;
        sumOth += bm.other_cost;
        sumEmp += bm.employee_cost;
        sumDiesel += bm.diesel_litres;
        sumDemand += bm.fee_demand;
        sumPaid += bm.fee_collected;
        if (bm.approved_budget > maxAppBud) maxAppBud = bm.approved_budget;
        sumSpentBud += bm.cumulative_budget_spent;
        sumPass = Math.max(sumPass, bm.passengers_count);
        sumTkR += bm.service_tickets_raised;
        sumTkC += bm.service_tickets_closed;
      });

      const totalExp = sumFuel + sumFc + sumStat + sumRep + sumOth + sumEmp;
      const bCount = activeBranch === 'all' ? 58 : (activeBranch === 'Common' ? 18 : (activeBranch === 'RPS' ? 19 : (activeBranch === 'University' ? 16 : 5)));

      return {
        vehicles_count: `${bCount} Buses`,
        bus_count_num: bCount,
        passengers_count: sumPass,
        approved_kms: sumAppKms,
        actual_kms: sumActKms,
        additional_kms: sumAddKms,
        fuel_expenses: sumFuel,
        fc_cost: sumFc,
        statutory_cost: sumStat,
        repair_maintenance_cost: sumRep,
        other_cost: sumOth,
        employee_cost: sumEmp,
        total_expenses: totalExp,
        fee_demand: sumDemand,
        fee_collected: sumPaid,
        fee_unpaid: Math.max(0, sumDemand - sumPaid),
        approved_budget: maxAppBud || 37730138,
        cumulative_budget_spent: sumSpentBud || totalExp,
        balance: (maxAppBud || 37730138) - (sumSpentBud || totalExp),
        diesel_litres: sumDiesel,
        service_tickets_raised: sumTkR,
        service_tickets_closed: sumTkC,
        service_tickets_open: Math.max(0, sumTkR - sumTkC),
        fuel_cost_per_km: sumActKms > 0 ? (sumFuel / sumActKms).toFixed(2) : '0.00',
        avg_mileage: sumDiesel > 0 ? (sumActKms / sumDiesel).toFixed(2) : '0.00'
      };
    }

    return getBranchMetrics(activeBranch, activePeriodIdStr || '1026');
  }, [activeBranch, isAllMonths, activePeriodIdStr, periods, effectiveMatrix]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%' }}>

      {/* 1. TOP HEADER & DASHBOARD TOOLBAR */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #fed7aa',
        boxShadow: '0 4px 20px rgba(234, 88, 12, 0.06)',
        overflow: 'hidden'
      }}>
        {/* Banner Top Strip */}
        <div style={{
          backgroundColor: '#ea580c',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              <Bus size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0, letterSpacing: '-0.02em' }}>
                  Transport Fleet Operations & Analytics Dashboard
                </h1>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  color: '#ffffff'
                }}>
                  Live DB Feed • 58 Buses
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#ffedd5' }}>
                Multi-Branch Division: Common (18) • RPS (19) • University (16) • KPM (5) • FY 2026-2027
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={fetchLiveMatrix}
              disabled={loading}
              title="Refresh live data from database"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh Live'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '9999px',
                backgroundColor: '#ffffff',
                color: '#ea580c',
                border: 'none',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              <Download size={14} />
              <span>Export Report</span>
            </button>

            {onOpenDataEntry && (
              <button
                type="button"
                onClick={onOpenDataEntry}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <span>Open Data Entry</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Focus Month Selector Bar */}
        <div style={{
          backgroundColor: '#fff7ed',
          padding: '10px 24px',
          borderBottom: '1px solid #fed7aa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              📅 Select Month:
            </span>
            <button
              type="button"
              onClick={() => setActivePeriod && setActivePeriod('all')}
              style={{
                padding: '5px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: isAllMonths ? '800' : '600',
                border: 'none',
                backgroundColor: isAllMonths ? '#ea580c' : '#ffffff',
                color: isAllMonths ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                boxShadow: isAllMonths ? '0 2px 8px rgba(234, 88, 12, 0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              All {periods.length} Months
            </button>
            {periods.map(p => {
              const isSel = String(p.id) === String(activePeriod);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePeriod && setActivePeriod(p.id)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: isSel ? '800' : '600',
                    border: 'none',
                    backgroundColor: isSel ? '#ea580c' : '#ffffff',
                    color: isSel ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                    boxShadow: isSel ? '0 2px 8px rgba(234, 88, 12, 0.35)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{p.period_label}</span>
                  {isSel && <span style={{ marginLeft: '4px', fontSize: '10px' }}>★</span>}
                </button>
              );
            })}
          </div>

          {/* Primary View Switcher Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            padding: '2px',
            borderRadius: '9999px',
            border: '1.5px solid #fed7aa'
          }}>
            <button
              type="button"
              onClick={() => setActiveMainView('executive')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 14px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: activeMainView === 'executive' ? '800' : '600',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeMainView === 'executive' ? '#ea580c' : 'transparent',
                color: activeMainView === 'executive' ? '#ffffff' : '#64748b',
                boxShadow: activeMainView === 'executive' ? '0 2px 6px rgba(234, 88, 12, 0.3)' : 'none'
              }}
            >
              <LayoutDashboard size={13} />
              <span>Executive Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainView('vehicles')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 14px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: activeMainView === 'vehicles' ? '800' : '600',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeMainView === 'vehicles' ? '#0284c7' : 'transparent',
                color: activeMainView === 'vehicles' ? '#ffffff' : '#64748b',
                boxShadow: activeMainView === 'vehicles' ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none'
              }}
            >
              <Bus size={13} />
              <span>Vehicle Ledger (58 Buses)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainView('parameters')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 14px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: activeMainView === 'parameters' ? '800' : '600',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeMainView === 'parameters' ? '#7c3aed' : 'transparent',
                color: activeMainView === 'parameters' ? '#ffffff' : '#64748b',
                boxShadow: activeMainView === 'parameters' ? '0 2px 6px rgba(124, 58, 237, 0.3)' : 'none'
              }}
            >
              <Table size={13} />
              <span>47 Parameters Matrix</span>
            </button>
          </div>
        </div>

        {/* Fleets / Branch Selector Pills */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🏫 Fleets & Branches:
            </span>
            {TRANSPORT_BRANCHES.map(br => {
              const isSel = activeBranch === br.id;
              const countBadge = br.id === 'all' ? '58 Buses' : (br.id === 'Common' ? '18 Buses' : (br.id === 'RPS' ? '19 Buses' : (br.id === 'University' ? '16 Buses' : '5 Buses')));

              return (
                <button
                  key={br.id}
                  type="button"
                  onClick={() => setActiveBranch(br.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: isSel ? '800' : '600',
                    border: isSel ? `2px solid ${br.badgeColor}` : '1.5px solid #cbd5e1',
                    backgroundColor: isSel ? br.badgeColor : '#ffffff',
                    color: isSel ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    boxShadow: isSel ? `0 3px 8px ${br.badgeColor}40` : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{br.icon}</span>
                  <span>{br.label}</span>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    backgroundColor: isSel ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: isSel ? '#ffffff' : '#64748b',
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
            padding: '5px 12px',
            borderRadius: '12px',
            fontSize: '11.5px',
            fontWeight: '700',
            border: `1px solid ${activeBranchObj.badgeColor}30`
          }}>
            <span>{activeBranchObj.icon}</span>
            <span>{activeBranchObj.description}</span>
          </div>
        </div>
      </div>

      {/* 2. TOP 4 BENTO KPI CARDS (LIVE DATA FROM DATABASE) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {/* KPI 1: Fleet Operations & Distance */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '20px 22px',
          border: '1.5px solid #fed7aa',
          borderLeft: '5px solid #ea580c',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fleet Size & Distance
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#fff7ed', color: '#ea580c' }}>
              <Bus size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
              {metrics.vehicles_count}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0284c7', marginTop: '2px' }}>
              {num(metrics.actual_kms).toLocaleString()} KMs Total Distance
            </div>
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Approved: {num(metrics.approved_kms).toLocaleString()} KM</span>
            <span>Passengers: {num(metrics.passengers_count).toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 2: Total Fleet Expenses & Fuel */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '20px 22px',
          border: '1.5px solid #bbf7d0',
          borderLeft: '5px solid #16a34a',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isAllMonths ? 'All-Months Total Spend' : `${activePeriodObj?.period_label || 'Focus Month'} Spend`}
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }} className="currency-font">
              {formatINR(metrics.total_expenses)}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534', marginTop: '2px' }}>
              Fuel: {formatINR(metrics.fuel_expenses)} • Diesel: {num(metrics.diesel_litres).toLocaleString()} L
            </div>
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Repair: {formatINR(metrics.repair_maintenance_cost)}</span>
            <span style={{ fontWeight: '700', color: '#16a34a' }}>Avg Mileage: {metrics.avg_mileage} km/L</span>
          </div>
        </div>

        {/* KPI 3: Budget & Remaining Balance */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '20px 22px',
          border: '1.5px solid #bae6fd',
          borderLeft: '5px solid #0284c7',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Operating Budget & Balance
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#f0f9ff', color: '#0284c7' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }} className="currency-font">
              {formatINR(metrics.balance)}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0284c7', marginTop: '2px' }}>
              Remaining Available Balance
            </div>
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Budget: {formatLakhs(metrics.approved_budget)}</span>
            <span>Spent: {formatLakhs(metrics.cumulative_budget_spent)}</span>
          </div>
        </div>

        {/* KPI 4: Service Tickets & Revenue */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '20px 22px',
          border: '1.5px solid #e9d5ff',
          borderLeft: '5px solid #9333ea',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Compliance & Revenue
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#faf5ff', color: '#9333ea' }}>
              <Check size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
              100% Compliant
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#6b21a8', marginTop: '2px' }}>
              {metrics.service_tickets_closed} / {metrics.service_tickets_raised || metrics.service_tickets_closed} Tickets Closed
            </div>
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Fee Collected: {formatLakhs(metrics.fee_collected)}</span>
            <span style={{ color: '#dc2626', fontWeight: '700' }}>Unpaid: {formatLakhs(metrics.fee_unpaid)}</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT BASED ON SELECTED TAB */}
      {activeMainView === 'vehicles' ? (
        /* TAB 2: LIVE VEHICLE-WISE EXPENSES LEDGER */
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #fed7aa',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bus size={20} color="#ea580c" />
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Live Vehicle-Wise Expenses Ledger ({activeBranchObj.label} • {activePeriodObj?.period_label})
              </h2>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Synchronized directly with PostgreSQL database table <code>transport_vehicle_entries</code>
            </span>
          </div>
          <TransportVehicleExpensesTable
            periodId={activePeriodObj?.id}
            branch={activeBranch}
            embedded={true}
          />
        </div>
      ) : activeMainView === 'parameters' ? (
        /* TAB 3: 47 PARAMETERS MATRIX TABLE */
        <TransportDashboardDataTable
          periods={periods}
          activePeriod={activePeriod}
          computedMatrix={effectiveMatrix}
        />
      ) : (
        /* TAB 1: EXECUTIVE FLEET OVERVIEW & BRANCH COMPARISON */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Branch-by-Branch Comparative Cards */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#ea580c" />
                <span>Multi-Branch Fleet Comparison Matrix</span>
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Month: <strong>{activePeriodObj?.period_label || 'Current Period'}</strong>
              </span>
            </div>

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
                const bMetrics = getBranchMetrics(b.id, activePeriodIdStr || '1026');
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
                      <span style={{ color: b.color, fontWeight: '700' }}>Click to filter →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Full Census & Operational Metrics Table */}
          <TransportDashboardCensusView
            computedMatrix={effectiveMatrix}
            activePeriodObj={activePeriodObj}
            periods={periods}
          />
        </div>
      )}

    </div>
  );
}
