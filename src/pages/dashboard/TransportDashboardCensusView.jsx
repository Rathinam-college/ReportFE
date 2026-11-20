import React, { useState, useMemo } from 'react';
import { formatINR, formatLakhs } from '../../utils/formatters';
import { 
  Bus, Users, Fuel, Wrench, ShieldCheck, DollarSign, 
  ChevronDown, ChevronUp, Table, Check, Layers, AlertCircle, TrendingUp, Calculator
} from 'lucide-react';
import { TRANSPORT_BRANCHES } from '../data_entry/TransportSpreadsheetEntry';
import TransportVehicleExpensesTable from '../data_entry/TransportVehicleExpensesTable';

export default function TransportDashboardCensusView({
  computedMatrix,
  activePeriodObj,
  periods = []
}) {
  const [activeBranch, setActiveBranch] = useState('all');
  const [showLedgerTable, setShowLedgerTable] = useState(true);
  const [showVehiclesTable, setShowVehiclesTable] = useState(true);

  const currentPeriodIdStr = activePeriodObj ? String(activePeriodObj.id) : null;
  const activeBranchObj = TRANSPORT_BRANCHES.find(b => b.id === activeBranch) || TRANSPORT_BRANCHES[0];

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // Helper to compute metrics for a branch and period
  const getBranchMetricsForPeriod = (branchId, pStr) => {
    if (branchId === 'all') {
      const realBranches = ['Common', 'RPS', 'KPM', 'University'];
      let totVeh = [];
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
      let totQRec = 0;
      let totQCls = 0;
      let totInc = 0;
      let totDiesel = 0;

      realBranches.forEach(b => {
        const m = computedMatrix?.transport_census_by_branch?.[b]?.[pStr] || {};
        if (m.vehicles_count && m.vehicles_count !== '0') totVeh.push(`${b}: ${m.vehicles_count}`);
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
        totQRec += num(m.quality_issues_received, 0);
        totQCls += num(m.quality_issues_closed, 0);
        totInc += num(m.incidents_count, 0);
        totDiesel += num(m.diesel_litres, 0);
      });

      const totExpenses = totFuel + totFc + totStat + totRep + totOth + totEmp;
      const totIncome = totPaid + totRpsBill + totStaffDed + totAddKmsRps + totCab;
      const totBal = totAppBud - totSpentBud;
      const totUnpaid = Math.max(0, totDemand - totPaid);
      const totTkOpen = Math.max(0, totTkRaised - totTkClosed);
      const totQOpen = Math.max(0, totQRec - totQCls);

      return {
        vehicles_count: totVeh.join(' / ') || '0 fleet',
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
        fee_unpaid: totUnpaid,
        rps_monthly_billing: totRpsBill,
        staff_travel_deduction: totStaffDed,
        cumulative_income: totIncome,
        approved_budget: totAppBud,
        cumulative_budget_spent: totSpentBud,
        balance: totBal,
        service_tickets_raised: totTkRaised,
        service_tickets_closed: totTkClosed,
        service_tickets_open: totTkOpen,
        quality_issues_open: totQOpen,
        incidents_count: totInc,
        diesel_litres: totDiesel,
        cab_billing: totCab,
        per_student_cost_expenses: totPassengers > 0 ? Math.round(totExpenses / totPassengers) : 0,
        per_student_fee_year: totPassengers > 0 ? Math.round(totDemand / totPassengers) : 0,
        fuel_cost_per_km: totActKms > 0 ? (totFuel / totActKms).toFixed(2) : '0.00',
        diesel_per_100km: totActKms > 0 ? ((totDiesel / totActKms) * 100).toFixed(2) : '0.00'
      };
    }

    // Specific branch data
    const m = computedMatrix?.transport_census_by_branch?.[branchId]?.[pStr] || {};
    const veh = String(m.vehicles_count ?? '0');
    const pass = num(m.passengers_count, 0);
    const appKms = num(m.approved_kms, 0);
    const actKms = num(m.actual_kms, 0);
    const addKms = num(m.additional_kms, 0);
    const excessKms = actKms - appKms;

    const fuel = num(m.fuel_expenses, 0);
    const fc = num(m.fc_cost, 0);
    const stat = num(m.statutory_cost, 0);
    const rep = num(m.repair_maintenance_cost, 0);
    const oth = num(m.other_cost, 0);
    const emp = num(m.employee_cost, 0);
    const totExpenses = fuel + fc + stat + rep + oth + emp;

    const demand = num(m.fee_demand, 0);
    const paid = num(m.fee_collected, 0);
    const unpaid = Math.max(0, demand - paid);
    const rpsBill = num(m.rps_monthly_billing, 0);
    const staffDed = num(m.staff_travel_deduction, 0);
    const cab = num(m.cab_billing, 0);
    const cumulativeIncome = paid + rpsBill + staffDed + cab;

    const appBud = num(m.approved_budget, 0);
    const spentBud = num(m.cumulative_budget_spent, 0);
    const bal = appBud - spentBud;

    const tkRaised = num(m.service_tickets_raised, 0);
    const tkClosed = num(m.service_tickets_closed, 0);
    const tkOpen = Math.max(0, tkRaised - tkClosed);
    const diesel = num(m.diesel_litres, 0);

    return {
      vehicles_count: veh,
      passengers_count: pass,
      approved_kms: appKms,
      actual_kms: actKms,
      excess_minus_kms_rps: excessKms,
      additional_kms: addKms,
      fuel_expenses: fuel,
      fc_cost: fc,
      statutory_cost: stat,
      repair_maintenance_cost: rep,
      other_cost: oth,
      employee_cost: emp,
      total_expenses: totExpenses,
      fee_demand: demand,
      fee_collected: paid,
      fee_unpaid: unpaid,
      rps_monthly_billing: rpsBill,
      staff_travel_deduction: staffDed,
      cumulative_income: cumulativeIncome,
      approved_budget: appBud,
      cumulative_budget_spent: spentBud,
      balance: bal,
      service_tickets_raised: tkRaised,
      service_tickets_closed: tkClosed,
      service_tickets_open: tkOpen,
      quality_issues_open: 0,
      incidents_count: num(m.incidents_count, 1),
      diesel_litres: diesel,
      cab_billing: cab,
      per_student_cost_expenses: pass > 0 ? Math.round(totExpenses / pass) : 0,
      per_student_fee_year: pass > 0 ? Math.round(demand / pass) : 0,
      fuel_cost_per_km: actKms > 0 ? (fuel / actKms).toFixed(2) : '0.00',
      diesel_per_100km: actKms > 0 ? ((diesel / actKms) * 100).toFixed(2) : '0.00'
    };
  };

  // Metrics for active period and branch
  const activeMetrics = useMemo(() => {
    return getBranchMetricsForPeriod(activeBranch, currentPeriodIdStr || '29');
  }, [activeBranch, currentPeriodIdStr, computedMatrix]);

  // Canonical parameter definitions from Image 3
  const TRANSPORT_SECTIONS = [
    {
      title: '1. Fleet Operations & Distance',
      bg: '#f8fafc',
      rows: [
        { sNo: '1', name: 'Number of vehicles', key: 'vehicles_count', calc: m => m.vehicles_count },
        { sNo: '2', name: 'Students & staff travelling', key: 'passengers_count', calc: m => num(m.passengers_count).toLocaleString() },
        { sNo: '3', name: 'Approved trip KMs', key: 'approved_kms', calc: m => `${num(m.approved_kms).toLocaleString()} KMs` },
        { sNo: '4', name: 'Actual trip KMs run', key: 'actual_kms', calc: m => `${num(m.actual_kms).toLocaleString()} KMs` },
        { sNo: '5', name: 'Excess/ minus KMs run for RPS', key: 'excess_minus_kms_rps', calc: m => `${num(m.excess_minus_kms_rps).toLocaleString()} KMs` },
        { sNo: '7', name: 'Additional KMs run', key: 'additional_kms', calc: m => `${num(m.additional_kms).toLocaleString()} KMs` }
      ]
    },
    {
      title: '2. Fleet Expenses & Operations',
      bg: '#ffedd5',
      rows: [
        { sNo: '8', name: 'Fuel expenses (Rs)', key: 'fuel_expenses', calc: m => formatINR(m.fuel_expenses) },
        { sNo: '9', name: 'FC 2025-2026', key: 'fc_cost', calc: m => formatINR(m.fc_cost) },
        { sNo: '10', name: 'Vehicle Statutory', key: 'statutory_cost', calc: m => formatINR(m.statutory_cost) },
        { sNo: '11', name: 'Repair & Maintenance', key: 'repair_maintenance_cost', calc: m => formatINR(m.repair_maintenance_cost) },
        { sNo: '12', name: 'Others', key: 'other_cost', calc: m => formatINR(m.other_cost) },
        { sNo: '13', name: 'Transport Employees Cost', key: 'employee_cost', calc: m => formatINR(m.employee_cost) },
        { sNo: '14', name: 'Total Fleet Expenses', key: 'total_expenses', highlight: true, isTotal: true, calc: m => formatINR(m.total_expenses) }
      ]
    },
    {
      title: '3. Revenue, Deductions & Cumulative Income',
      bg: '#fef3c7',
      rows: [
        { sNo: '17', name: 'Pass Fee Demand', key: 'fee_demand', calc: m => formatINR(m.fee_demand) },
        { sNo: '18', name: 'Pass Fee Collected (Paid)', key: 'fee_collected', calc: m => formatINR(m.fee_collected) },
        { sNo: '19', name: 'Fee Outstanding (Unpaid)', key: 'fee_unpaid', calc: m => formatINR(m.fee_unpaid) },
        { sNo: '20', name: 'RPS monthly billing', key: 'rps_monthly_billing', calc: m => formatINR(m.rps_monthly_billing) },
        { sNo: '21', name: 'Staff Travel Deduction', key: 'staff_travel_deduction', calc: m => formatINR(m.staff_travel_deduction) },
        { sNo: '37', name: 'Cab request Billing', key: 'cab_billing', calc: m => formatINR(m.cab_billing) },
        { sNo: '24', name: 'Cumulative Income', key: 'cumulative_income', highlight: true, isTotal: true, calc: m => formatINR(m.cumulative_income) }
      ]
    },
    {
      title: '4. Operating Budget & Financial Balance',
      bg: '#dcfce7',
      rows: [
        { sNo: '25', name: 'Approved Fleet Budget', key: 'approved_budget', calc: m => formatINR(m.approved_budget) },
        { sNo: '26', name: 'Cumulative Budget Spent', key: 'cumulative_budget_spent', calc: m => formatINR(m.cumulative_budget_spent) },
        { sNo: '27', name: 'Balance Budget Remaining', key: 'balance', highlight: true, isTotal: true, calc: m => formatINR(m.balance) }
      ]
    },
    {
      title: '5. Service Tickets & Compliance',
      bg: '#f3e8ff',
      rows: [
        { sNo: '30', name: 'No. of Service Tickets Raised', key: 'service_tickets_raised', calc: m => num(m.service_tickets_raised).toLocaleString() },
        { sNo: '31', name: 'No. of Service Tickets Closed', key: 'service_tickets_closed', calc: m => num(m.service_tickets_closed).toLocaleString() },
        { sNo: '32', name: 'No. of Service Tickets in Open', key: 'service_tickets_open', highlight: true, calc: m => num(m.service_tickets_open).toLocaleString() },
        { sNo: '28', name: 'Statutory compliance', key: 'statutory_compliance', calc: () => '100% Compliant' },
        { sNo: '29', name: 'No. of Incidents', key: 'incidents_count', calc: m => num(m.incidents_count).toLocaleString() }
      ]
    },
    {
      title: '6. Fuel Purchase & Unit Economics',
      bg: '#fef08a',
      rows: [
        { sNo: '36', name: 'Diesel Purchase Qty (Litres)', key: 'diesel_litres', calc: m => `${num(m.diesel_litres).toLocaleString()} L` },
        { sNo: '34', name: 'Per student cost expenses', key: 'per_student_cost_expenses', highlight: true, calc: m => formatINR(m.per_student_cost_expenses) },
        { sNo: '43', name: 'Per student fee per year', key: 'per_student_fee_year', calc: m => formatINR(m.per_student_fee_year) },
        { sNo: '44', name: 'Fuel Cost per KM', key: 'fuel_cost_per_km', calc: m => `₹${m.fuel_cost_per_km}/KM` }
      ]
    }
  ];

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1.5px solid #ea580c',
      boxShadow: '0 4px 16px rgba(234, 88, 12, 0.08)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '0px'
    }}>
      
      {/* 1. TOP HEADER & TOOLBAR */}
      <div style={{
        backgroundColor: '#ea580c',
        color: '#ffffff',
        padding: '14px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#ffffff',
            color: '#ea580c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}>
            <Bus size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Transport Fleet Operations & Analytics Dashboard
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                padding: '2px 8px',
                borderRadius: '12px',
                color: '#ffffff'
              }}>
                Multi-Branch Division
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#ffedd5' }}>
              RPS • KPM • Common • University Fleet • Consolidated • {activePeriodObj?.period_label || 'Current Period'}
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowVehiclesTable(!showVehiclesTable)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: showVehiclesTable ? '#0284c7' : 'rgba(255, 255, 255, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: showVehiclesTable ? '0 2px 6px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            <Bus size={14} />
            <span>{showVehiclesTable ? 'Hide Vehicle Wise Expenses' : 'Show Vehicle Wise Expenses'}</span>
            {showVehiclesTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={() => setShowLedgerTable(!showLedgerTable)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Table size={14} />
            <span>{showLedgerTable ? 'Hide Operational Ledger' : 'Show Month-by-Month Ledger Table'}</span>
            {showLedgerTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* 2. FLEET BRANCH SELECTOR PILL BAR */}
      <div style={{
        backgroundColor: '#fff7ed',
        padding: '12px 22px',
        borderBottom: '1.5px solid #fed7aa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            🏫 Fleet Branch:
          </span>
          {TRANSPORT_BRANCHES.map(br => {
            const isSel = activeBranch === br.id;
            return (
              <button
                key={br.id}
                type="button"
                onClick={() => setActiveBranch(br.id)}
                title={br.description}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '800',
                  border: isSel ? `2px solid ${br.badgeColor}` : '1.5px solid #cbd5e1',
                  backgroundColor: isSel ? br.badgeColor : '#ffffff',
                  color: isSel ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isSel ? `0 3px 8px ${br.badgeColor}40` : '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{br.icon}</span>
                <span>{br.label}</span>
                {isSel && <Check size={12} color="#ffffff" />}
              </button>
            );
          })}
        </div>

        {/* Selected Branch Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: activeBranchObj.badgeBg,
          color: activeBranchObj.badgeColor,
          padding: '5px 12px',
          borderRadius: '16px',
          fontSize: '11px',
          fontWeight: '700',
          border: `1px solid ${activeBranchObj.badgeColor}40`
        }}>
          <span>{activeBranchObj.icon}</span>
          <span>{activeBranchObj.description}</span>
        </div>
      </div>

      {/* 3. TOP 5 EXECUTIVE KPI CARDS */}
      <div style={{ padding: '20px 22px', backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '14px'
        }}>
          {/* Card 1: Fleet Operations & Transit */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1.5px solid #bae6fd',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Fleet Operations & KMs
              </span>
              <Bus size={16} color="#0284c7" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                {num(activeMetrics.actual_kms).toLocaleString()}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
                Actual KMs
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                padding: '2px 7px',
                borderRadius: '4px',
                marginLeft: 'auto'
              }}>
                {activeMetrics.vehicles_count}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>Appr: {num(activeMetrics.approved_kms).toLocaleString()} KM</span>
              <span>Pass: {num(activeMetrics.passengers_count).toLocaleString()}</span>
              <span style={{ color: '#0284c7', fontWeight: '700' }}>Add: +{num(activeMetrics.additional_kms).toLocaleString()} KM</span>
            </div>
          </div>

          {/* Card 2: Fleet Expenses & Operations */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1.5px solid #fed7aa',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Fleet Total Expenses
              </span>
              <Wrench size={16} color="#ea580c" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                {formatINR(activeMetrics.total_expenses)}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: '#86efac',
                color: '#166534',
                padding: '2px 7px',
                borderRadius: '4px',
                marginLeft: 'auto'
              }}>
                Total Spend
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>Fuel: {formatINR(activeMetrics.fuel_expenses)}</span>
              <span>Crew: {formatINR(activeMetrics.employee_cost)}</span>
              <span>Rep: {formatINR(activeMetrics.repair_maintenance_cost)}</span>
            </div>
          </div>

          {/* Card 3: Revenue & Cumulative Income */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1.5px solid #fde68a',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cumulative Fleet Income
              </span>
              <DollarSign size={16} color="#d97706" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                {formatINR(activeMetrics.cumulative_income)}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                padding: '2px 7px',
                borderRadius: '4px',
                marginLeft: 'auto'
              }}>
                Income
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>Demand: {formatLakhs(activeMetrics.fee_demand)}</span>
              <span>Paid: {formatLakhs(activeMetrics.fee_collected)}</span>
              <span style={{ color: '#dc2626', fontWeight: '700' }}>Unpaid: {formatLakhs(activeMetrics.fee_unpaid)}</span>
            </div>
          </div>

          {/* Card 4: Operating Budget & Balance */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1.5px solid #bbf7d0',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Approved Budget & Balance
              </span>
              <DollarSign size={16} color="#16a34a" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                {formatINR(activeMetrics.balance)}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: '#86efac',
                color: '#166534',
                padding: '2px 7px',
                borderRadius: '4px',
                marginLeft: 'auto'
              }}>
                Balance
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>Budget: {formatLakhs(activeMetrics.approved_budget)}</span>
              <span>Spent: {formatLakhs(activeMetrics.cumulative_budget_spent)}</span>
              <span style={{ fontWeight: '700', color: '#16a34a' }}>₹{num(activeMetrics.per_student_cost_expenses).toLocaleString()}/stud</span>
            </div>
          </div>

          {/* Card 5: Service Tickets & Fuel Stats */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1.5px solid #d8b4fe',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Service Tickets & Diesel
              </span>
              <Fuel size={16} color="#7c3aed" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                {num(activeMetrics.diesel_litres).toLocaleString()} L
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: activeMetrics.service_tickets_open === 0 ? '#dcfce7' : '#fee2e2',
                color: activeMetrics.service_tickets_open === 0 ? '#15803d' : '#991b1b',
                padding: '2px 7px',
                borderRadius: '4px',
                marginLeft: 'auto'
              }}>
                {activeMetrics.service_tickets_open} Open Tk
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>Tk: {activeMetrics.service_tickets_raised} Raised</span>
              <span>₹{activeMetrics.fuel_cost_per_km}/KM</span>
              <span style={{ color: '#16a34a', fontWeight: '700' }}>100% Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* VEHICLE-WISE FLEET EXPENSES & MILEAGE TABLE (MATCHING COLLEGE CAB EXPENSES IMAGE) */}
      {showVehiclesTable && (
        <div style={{ padding: '20px 22px', backgroundColor: '#f8fafc', borderBottom: '1.5px solid #fed7aa' }}>
          <TransportVehicleExpensesTable
            periodId={activePeriodObj?.id}
            branch={activeBranch}
            embedded={true}
          />
        </div>
      )}

      {/* 4. MONTH-BY-MONTH TRANSPORT FLEET LEDGER TABLE */}
      {showLedgerTable && (
        <div style={{ overflowX: 'auto', width: '100%', maxHeight: '600px', backgroundColor: '#ffffff' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12.5px',
            fontFamily: 'inherit'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#ea580c',
                color: '#ffffff',
                borderBottom: '2px solid #c2410c',
                fontWeight: '800'
              }}>
                <th style={{ width: '45px', padding: '10px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>#</th>
                <th style={{ minWidth: '320px', padding: '10px 16px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                  Transport Parameters ({activeBranchObj.label})
                </th>
                {periods.map(p => {
                  const isCurrent = currentPeriodIdStr === String(p.id);
                  return (
                    <th
                      key={p.id}
                      style={{
                        minWidth: '125px',
                        padding: '10px 12px',
                        textAlign: 'center',
                        borderRight: '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: isCurrent ? '#c2410c' : '#ea580c',
                        fontWeight: '800'
                      }}
                    >
                      {p.period_label} {isCurrent && '★'}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {TRANSPORT_SECTIONS.map((sec, secIdx) => (
                <React.Fragment key={secIdx}>
                  {/* Section Title */}
                  <tr style={{
                    backgroundColor: sec.bg,
                    borderTop: '2px solid #cbd5e1',
                    borderBottom: '1px solid #cbd5e1',
                    fontWeight: '800',
                    fontSize: '12px',
                    color: '#1e293b'
                  }}>
                    <td colSpan={periods.length + 2} style={{ padding: '8px 14px' }}>
                      {sec.title}
                    </td>
                  </tr>

                  {/* Section Rows */}
                  {sec.rows.map((r, rIdx) => {
                    const isTotal = !!r.isTotal;
                    let rowBg = isTotal ? '#86efac' : (rIdx % 2 === 0 ? '#ffffff' : '#f8fafc');

                    return (
                      <tr
                        key={r.sNo}
                        style={{
                          backgroundColor: rowBg,
                          borderBottom: isTotal ? '2px solid #16a34a' : '1px solid #e2e8f0',
                          fontWeight: isTotal ? '800' : (r.highlight ? '700' : '500')
                        }}
                      >
                        <td style={{ padding: '7px', textAlign: 'center', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>
                          {r.sNo}
                        </td>

                        <td style={{ padding: '7px 16px', color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                          {r.name}
                        </td>

                        {periods.map(p => {
                          const pStr = String(p.id);
                          const pMetrics = getBranchMetricsForPeriod(activeBranch, pStr);
                          const isCurrent = currentPeriodIdStr === pStr;
                          const valStr = r.calc(pMetrics);

                          return (
                            <td
                              key={p.id}
                              style={{
                                padding: '7px 12px',
                                textAlign: 'right',
                                borderRight: '1px solid #e2e8f0',
                                backgroundColor: isCurrent ? (isTotal ? '#4ade80' : 'rgba(234, 88, 12, 0.08)') : 'transparent',
                                color: isTotal ? '#166534' : '#0f172a',
                                fontWeight: isTotal || isCurrent ? '800' : '600'
                              }}
                            >
                              {valStr}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
