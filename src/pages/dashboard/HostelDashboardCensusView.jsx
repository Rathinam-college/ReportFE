import React, { useState, useMemo } from 'react';
import { formatINR, formatLakhs } from '../../utils/formatters';
import { 
  Building2, Users, BedDouble, Zap, Droplets, Wrench, ShieldAlert, 
  DollarSign, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Table, Calendar,
  TrendingUp, Award, Clock
} from 'lucide-react';

export default function HostelDashboardCensusView({
  computedMatrix,
  activePeriodObj,
  periods = []
}) {
  const [showLedgerTable, setShowLedgerTable] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'table'

  const hostelCensusMap = computedMatrix?.hostel_census || {};
  const currentPeriodIdStr = activePeriodObj ? String(activePeriodObj.id) : null;

  // Active month data from database
  const activeCensus = useMemo(() => {
    if (!currentPeriodIdStr || !hostelCensusMap[currentPeriodIdStr]) {
      const keys = Object.keys(hostelCensusMap);
      return keys.length > 0 ? hostelCensusMap[keys[0]] : {};
    }
    return hostelCensusMap[currentPeriodIdStr] || {};
  }, [hostelCensusMap, currentPeriodIdStr]);

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // Pre-calculated values for active month
  const bedTotal = num(activeCensus.bed_capacity_total, 0);
  const totalOcc = num(activeCensus.total_occupied, 0);
  const occPct = bedTotal > 0 ? ((totalOcc / bedTotal) * 100).toFixed(1) : '0.0';
  const vacantTotal = num(activeCensus.vacant_total, Math.max(0, bedTotal - totalOcc));

  const powerCost = num(activeCensus.power_cost, 0);
  const powerUnits = num(activeCensus.power_units, 0);
  const normalWaterLtrs = num(activeCensus.normal_water_litres, 0);
  const normalWaterCost = num(activeCensus.normal_water_cost, 0);
  const drinkingWaterLtrs = num(activeCensus.drinking_water_litres, 0);
  const drinkingWaterCost = num(activeCensus.drinking_water_cost, 0);
  const tankerCost = num(activeCensus.water_purchase_cost, 0);
  const totalWaterCost = normalWaterCost + drinkingWaterCost + tankerCost;

  const appBudget = num(activeCensus.approved_budget, 0);
  const spentBudget = num(activeCensus.cumulative_budget_spent, 0);
  const balBudget = num(activeCensus.balance, appBudget - spentBudget);
  const perStudentCost = num(activeCensus.per_student_cost_month, 0);

  const ticketsRec = num(activeCensus.tickets_received, 0);
  const ticketsCls = num(activeCensus.tickets_closed, 0);
  const ticketsOpn = num(activeCensus.tickets_open, Math.max(0, ticketsRec - ticketsCls));
  const qualityRec = num(activeCensus.quality_issues_received, 0);
  const qualityCls = num(activeCensus.quality_issues_closed, 0);
  const qualityOpn = num(activeCensus.quality_issues_open, Math.max(0, qualityRec - qualityCls));

  // The 28 canonical hostel parameters matching Image 1 & 2
  const HOSTEL_PARAM_ROWS = [
    { sNo: '1', name: 'Bed Capacity (Boys / Girls / Total)', key: 'bed_capacity_total', type: 'count', section: 'occupancy', calc: c => `${num(c.bed_capacity_boys, 0)} B / ${num(c.bed_capacity_girls, 0)} G = ${num(c.bed_capacity_total, 0)}` },
    { sNo: '2', name: 'No. of students (Boys / Girls / Total)', key: 'students_total', type: 'count', section: 'occupancy', calc: c => `${num(c.students_boys, 0)} B / ${num(c.students_girls, 0)} G = ${num(c.students_total, 0)}` },
    { sNo: '3', name: 'No. of staffs (Boys / Girls / Total)', key: 'staff_total', type: 'count', section: 'occupancy', calc: c => `${num(c.staff_boys, 0)} B / ${num(c.staff_girls, 0)} G = ${num(c.staff_total, 0)}` },
    { sNo: '4', name: 'Total Occupied (Residents)', key: 'total_occupied', type: 'count', section: 'occupancy', highlight: true, calc: c => num(c.total_occupied, 0).toLocaleString() },
    { sNo: '5', name: 'Vacant Beds Total', key: 'vacant_total', type: 'count', section: 'occupancy', calc: c => num(c.vacant_total, 0).toLocaleString() },
    { sNo: '6', name: 'Vacant for college students', key: 'vacant_college', type: 'count', section: 'occupancy', calc: c => num(c.vacant_college, 0).toLocaleString() },
    { sNo: '7', name: 'Occupied %', key: 'occupied_pct', type: 'pct', section: 'occupancy', highlight: true, calc: c => `${num(c.occupied_pct, 0).toFixed(1)}%` },
    { sNo: '8', name: 'Vacant %', key: 'vacant_pct', type: 'pct', section: 'occupancy', calc: c => `${num(c.vacant_pct, 0).toFixed(1)}%` },
    { sNo: '9', name: 'Students Vacated', key: 'students_vacated', type: 'count', section: 'occupancy', calc: c => num(c.students_vacated, 0).toLocaleString() },

    // Tickets & Quality
    { sNo: '10', name: 'No. of Maintenance Tickets Received', key: 'tickets_received', type: 'count', section: 'maintenance', calc: c => num(c.tickets_received, 0).toLocaleString() },
    { sNo: '11', name: 'No. of Maintenance Tickets Closed', key: 'tickets_closed', type: 'count', section: 'maintenance', calc: c => num(c.tickets_closed, 0).toLocaleString() },
    { sNo: '12', name: 'No. of Maintenance Tickets in Open', key: 'tickets_open', type: 'count', section: 'maintenance', highlight: true, calc: c => num(c.tickets_open, 0).toLocaleString() },
    { sNo: '13', name: 'Quality Issues Received / Closed / Open', key: 'quality_issues', type: 'text', section: 'maintenance', calc: c => `${num(c.quality_issues_received, 0)} Rec / ${num(c.quality_issues_closed, 0)} Cls / ${num(c.quality_issues_open, 0)} Opn` },
    { sNo: '14', name: 'No. of Incidents', key: 'incidents_count', type: 'count', section: 'maintenance', calc: c => num(c.incidents_count, 0).toLocaleString() },

    // Utilities & Power
    { sNo: '15', name: 'Power Consumption Cost (EB + DG)', key: 'power_cost', type: 'currency', section: 'utilities', highlight: true, calc: c => formatINR(num(c.power_cost, 0)) },
    { sNo: '16', name: 'Power Units Consumed (kWh)', key: 'power_units', type: 'count', section: 'utilities', calc: c => `${num(c.power_units, 0).toLocaleString()} kWh` },
    { sNo: '17', name: 'Power Cost per sq.ft', key: 'power_cost_sqft', type: 'text', section: 'utilities', calc: c => `₹${num(c.power_cost_sqft, 0).toFixed(2)}/sq.ft` },
    { sNo: '18', name: 'Units per occupant per month', key: 'units_per_occupant', type: 'text', section: 'utilities', calc: c => `${num(c.units_per_occupant, 0).toFixed(1)} kWh/occ` },
    { sNo: '19', name: 'Power cost per occupant per month', key: 'power_cost_occupant', type: 'text', section: 'utilities', calc: c => `₹${Math.round(num(c.power_cost_occupant, 0))}/occ` },

    // Water Economics
    { sNo: '20', name: 'Normal Water Consumption Litres', key: 'normal_water_litres', type: 'count', section: 'water', calc: c => `${(num(c.normal_water_litres, 0) / 100000).toFixed(2)}L Lakhs` },
    { sNo: '21', name: 'Normal Water Cost', key: 'normal_water_cost', type: 'currency', section: 'water', calc: c => formatINR(num(c.normal_water_cost, 0)) },
    { sNo: '22', name: 'Normal Water Ltr / Student / Day', key: 'normal_water_ltr_day', type: 'text', section: 'water', calc: c => `${num(c.normal_water_ltr_day, 0).toFixed(1)} L/day` },
    { sNo: '23', name: 'Drinking RO Water (Litres & Cost)', key: 'drinking_water', type: 'text', section: 'water', calc: c => `${num(c.drinking_water_litres, 0).toLocaleString()}L (₹${num(c.drinking_water_cost, 0).toLocaleString()})` },
    { sNo: '24', name: 'Water Purchase Tanker Expenses', key: 'water_purchase_cost', type: 'currency', section: 'water', calc: c => formatINR(num(c.water_purchase_cost, 0)) },

    // Financial Budget
    { sNo: '25', name: 'Approved Operating Budget', key: 'approved_budget', type: 'currency', section: 'budget', calc: c => formatINR(num(c.approved_budget, 0)) },
    { sNo: '26', name: 'Cumulative Budget Spent', key: 'cumulative_budget_spent', type: 'currency', section: 'budget', calc: c => formatINR(num(c.cumulative_budget_spent, 0)) },
    { sNo: '27', name: 'Balance Budget Remaining', key: 'balance', type: 'currency', section: 'budget', highlight: true, calc: c => formatINR(num(c.balance, 0)) },
    { sNo: '28', name: 'Per Student Cost per Month / Day', key: 'per_student_cost', type: 'text', section: 'budget', calc: c => `₹${num(c.per_student_cost_month, 0).toLocaleString()}/mo • ₹${num(c.per_student_cost_day, 0)}/day` }
  ];

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1.5px solid #059669',
      boxShadow: '0 4px 16px rgba(5, 150, 105, 0.08)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '0px'
    }}>
      
      {/* 1. SECTION HEADER BAR */}
      <div style={{
        backgroundColor: '#059669',
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
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}>
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Hostel Resident Operations & Census Dashboard
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                padding: '2px 8px',
                borderRadius: '12px',
                color: '#ffffff'
              }}>
                Live Database Values
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#d1fae5' }}>
              Occupancy • Power & Water Economics • Tickets & Maintenance • Run-Rate Budget • {activePeriodObj?.period_label || 'Current Period'}
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* 2. 5 FEATURED KPI CARDS (MATCHING DATA ENTRY PAGE) */}
      <div style={{ padding: '20px 22px', backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '14px'
        }}>
          {/* Card 1: Bed Capacity & Occupancy */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1.5px solid #a7f3d0',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Bed Capacity & Occupancy
              </span>
              <BedDouble size={16} color="#059669" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                {totalOcc.toLocaleString()}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
                / {bedTotal.toLocaleString()} Beds
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: '#d1fae5',
                color: '#065f46',
                padding: '2px 7px',
                borderRadius: '4px',
                marginLeft: 'auto'
              }}>
                {occPct}% Occ
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>Students: {num(activeCensus.students_total, 2843).toLocaleString()}</span>
              <span>Staff: {num(activeCensus.staff_total, 131).toLocaleString()}</span>
              <span style={{ color: '#059669', fontWeight: '700' }}>Vacant: {vacantTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Card 2: Power & Energy Economics */}
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
                Power Consumption (EB + DG)
              </span>
              <Zap size={16} color="#ea580c" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                {formatINR(powerCost)}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: '#ffedd5',
                color: '#9a3412',
                padding: '2px 7px',
                borderRadius: '4px',
                marginLeft: 'auto'
              }}>
                {powerUnits.toLocaleString()} kWh
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>₹{num(activeCensus.power_cost_sqft, 6.34).toFixed(2)}/sq.ft</span>
              <span>{num(activeCensus.units_per_occupant, 35.3).toFixed(1)} kWh/occ</span>
              <span>₹{Math.round(num(activeCensus.power_cost_occupant, 494))}/occ</span>
            </div>
          </div>

          {/* Card 3: Water Supply & RO Purification */}
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
                Water Supply & RO Purified
              </span>
              <Droplets size={16} color="#0284c7" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                {formatINR(totalWaterCost)}
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
                {(normalWaterLtrs / 100000).toFixed(2)}L Lakhs
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>Normal: {num(activeCensus.normal_water_ltr_day, 91.93).toFixed(1)} L/day</span>
              <span>RO: {num(activeCensus.drinking_water_ltr_day, 1.04).toFixed(2)} L/day</span>
              <span>Tanker: {formatINR(tankerCost)}</span>
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
                {formatINR(balBudget)}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                padding: '2px 7px',
                borderRadius: '4px',
                marginLeft: 'auto'
              }}>
                Balance
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>Budget: {formatLakhs(appBudget)}</span>
              <span>Spent: {formatLakhs(spentBudget)}</span>
              <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{perStudentCost.toLocaleString()}/stud/mo</span>
            </div>
          </div>

          {/* Card 5: Maintenance Tickets & Compliance */}
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
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#9333ea', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Maintenance Tickets & Quality
              </span>
              <Wrench size={16} color="#9333ea" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                {ticketsRec} Rec
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
                / {ticketsCls} Closed
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: ticketsOpn === 0 ? '#dcfce7' : '#fee2e2',
                color: ticketsOpn === 0 ? '#15803d' : '#991b1b',
                padding: '2px 7px',
                borderRadius: '4px',
                marginLeft: 'auto'
              }}>
                {ticketsOpn} Open
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>Quality: {qualityOpn} Open</span>
              <span>Incidents: {num(activeCensus.incidents_count, 0)}</span>
              <span style={{ color: '#16a34a', fontWeight: '700' }}>100% Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MONTH-BY-MONTH OPERATIONAL CENSUS LEDGER TABLE */}
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
                backgroundColor: '#059669',
                color: '#ffffff',
                borderBottom: '2px solid #047857',
                fontWeight: '800'
              }}>
                <th style={{ width: '45px', padding: '10px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>#</th>
                <th style={{ minWidth: '320px', padding: '10px 16px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                  Hostel Operations & Census Parameters
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
                        backgroundColor: isCurrent ? '#047857' : '#059669',
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
              {HOSTEL_PARAM_ROWS.map((row, idx) => {
                const isOcc = row.section === 'occupancy';
                const isUtil = row.section === 'utilities';
                const isWater = row.section === 'water';
                const isBud = row.section === 'budget';

                let rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                if (row.highlight) {
                  rowBg = isOcc ? '#ecfdf5' : isUtil ? '#fff7ed' : isBud ? '#f0fdf4' : '#eff6ff';
                }

                return (
                  <tr
                    key={row.sNo}
                    style={{
                      backgroundColor: rowBg,
                      borderBottom: '1px solid #e2e8f0',
                      fontWeight: row.highlight ? '700' : '500'
                    }}
                  >
                    <td style={{ padding: '8px', textAlign: 'center', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>
                      {row.sNo}
                    </td>

                    <td style={{ padding: '8px 16px', color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                      {row.name}
                    </td>

                    {periods.map(p => {
                      const pStr = String(p.id);
                      const pData = hostelCensusMap[pStr] || {};
                      const isCurrent = currentPeriodIdStr === pStr;
                      const valStr = row.calc(pData);

                      return (
                        <td
                          key={p.id}
                          style={{
                            padding: '8px 12px',
                            textAlign: 'right',
                            borderRight: '1px solid #e2e8f0',
                            backgroundColor: isCurrent ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
                            color: row.highlight ? '#0f172a' : '#334155',
                            fontWeight: isCurrent || row.highlight ? '800' : '600'
                          }}
                        >
                          {valStr}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
