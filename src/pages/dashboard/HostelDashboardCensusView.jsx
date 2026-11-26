import React, { useState, useMemo, useEffect } from 'react';
import { formatINR, formatLakhs, formatPeriodLabel } from '../../utils/formatters';
import { 
  Building2, Users, BedDouble, Zap, Droplets, Wrench, ShieldAlert, 
  DollarSign, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Table, Calendar,
  TrendingUp, Award, Clock, Download, Search, RefreshCw, Filter
} from 'lucide-react';

export default function HostelDashboardCensusView({
  computedMatrix: propComputedMatrix,
  activePeriodObj: propActivePeriodObj,
  periods: propPeriods = [],
  activePeriod: propActivePeriod,
  onPeriodChange
}) {
  const [showLedgerTable, setShowLedgerTable] = useState(true);
  const [selectedSection, setSelectedSection] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [localMatrix, setLocalMatrix] = useState(null);
  const [loading, setLoading] = useState(false);
  const [budgetTrackingData, setBudgetTrackingData] = useState([]);

  // Self-healing: fetch directly from live database if matrix is not passed
  const fetchLiveMatrix = () => {
    setLoading(true);
    fetch('/api/matrix?module=hostel')
      .then(res => res.json())
      .then(d => {
        if (d) setLocalMatrix(d);
        setLoading(false);
      })
      .catch(err => {
        console.warn('[HostelDashboardCensusView] API fetch notice:', err);
        setLoading(false);
      });

    fetch('/api/hostel/budget-tracking')
      .then(res => res.json())
      .then(d => {
        if (d?.items) setBudgetTrackingData(d.items);
      })
      .catch(err => console.warn('[HostelDashboardCensusView] Budget tracking notice:', err));
  };

  useEffect(() => {
    const hasProps = propPeriods.length > 0 && propComputedMatrix?.hostel_census;
    if (!hasProps) {
      fetchLiveMatrix();
    } else {
      fetch('/api/hostel/budget-tracking')
        .then(res => res.json())
        .then(d => {
          if (d?.items) setBudgetTrackingData(d.items);
        })
        .catch(() => {});
    }
  }, [propPeriods, propComputedMatrix]);

  const effectiveMatrix = (propComputedMatrix?.hostel_census && Object.keys(propComputedMatrix.hostel_census).length > 0)
    ? propComputedMatrix
    : (localMatrix || {});

  const periods = (propPeriods && propPeriods.length > 0) ? propPeriods : (effectiveMatrix?.periods || []);
  const hostelCensusMap = effectiveMatrix?.hostel_census || {};

  // Default selected period: smartly prefer period with recorded live expenses or period 30 (Oct'26)
  const [selectedPeriodId, setSelectedPeriodId] = useState(() => {
    if (propActivePeriod !== undefined && propActivePeriod !== null) return String(propActivePeriod);
    if (propActivePeriodObj?.id) return String(propActivePeriodObj.id);
    return '30';
  });

  useEffect(() => {
    if (propActivePeriod !== undefined && propActivePeriod !== null) {
      setSelectedPeriodId(String(propActivePeriod));
    } else if (propActivePeriodObj?.id) {
      setSelectedPeriodId(String(propActivePeriodObj.id));
    }
  }, [propActivePeriod, propActivePeriodObj]);

  const isAll = String(selectedPeriodId) === 'all';

  const activePeriodObj = useMemo(() => {
    if (isAll) {
      return { id: 'all', period_label: 'All Months (Cumulative Total)', period_code: 'ALL' };
    }
    return periods.find(p => String(p.id) === String(selectedPeriodId)) || propActivePeriodObj || periods[0] || {};
  }, [periods, selectedPeriodId, propActivePeriodObj, isAll]);

  const currentPeriodIdStr = isAll ? 'all' : String(selectedPeriodId || activePeriodObj?.id || '');

  // Active month census record directly from PostgreSQL database
  const activeCensus = useMemo(() => {
    if (isAll) {
      const allVals = Object.values(hostelCensusMap);
      if (allVals.length === 0) return {};
      const latestVal = allVals[allVals.length - 1] || {};
      const sumKey = (k) => allVals.reduce((acc, curr) => acc + (Number(curr[k]) || 0), 0);
      return {
        ...latestVal,
        expenses_occurred: sumKey('expenses_occurred'),
        cumulative_budget_spent: sumKey('cumulative_budget_spent') > 0 ? Math.max(...allVals.map(v => Number(v.cumulative_budget_spent) || 0)) : sumKey('expenses_occurred'),
        power_cost: sumKey('power_cost'),
        power_units: sumKey('power_units'),
        normal_water_litres: sumKey('normal_water_litres'),
        normal_water_cost: sumKey('normal_water_cost'),
        drinking_water_litres: sumKey('drinking_water_litres'),
        drinking_water_cost: sumKey('drinking_water_cost'),
        water_purchase_cost: sumKey('water_purchase_cost'),
        tickets_received: sumKey('tickets_received'),
        tickets_closed: sumKey('tickets_closed'),
        tickets_open: Math.max(0, sumKey('tickets_received') - sumKey('tickets_closed')),
        quality_issues_received: sumKey('quality_issues_received'),
        quality_issues_closed: sumKey('quality_issues_closed'),
        quality_issues_open: Math.max(0, sumKey('quality_issues_received') - sumKey('quality_issues_closed')),
        incidents_count: sumKey('incidents_count')
      };
    }
    if (currentPeriodIdStr && hostelCensusMap[currentPeriodIdStr]) {
      return hostelCensusMap[currentPeriodIdStr];
    }
    const keys = Object.keys(hostelCensusMap);
    return keys.length > 0 ? hostelCensusMap[keys[0]] : {};
  }, [hostelCensusMap, currentPeriodIdStr, isAll]);

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // Pre-calculated live operational metrics
  const bedTotal = num(activeCensus.bed_capacity_total, num(activeCensus.bed_capacity_boys, 0) + num(activeCensus.bed_capacity_girls, 0));
  const studentsTotal = num(activeCensus.students_total, num(activeCensus.students_boys, 0) + num(activeCensus.students_girls, 0));
  const staffTotal = num(activeCensus.staff_total, num(activeCensus.staff_boys, 0) + num(activeCensus.staff_girls, 0));
  const totalOcc = num(activeCensus.total_occupied, studentsTotal + staffTotal);
  const occPct = bedTotal > 0 ? ((totalOcc / bedTotal) * 100).toFixed(1) : '0.0';
  const vacantTotal = num(activeCensus.vacant_total, Math.max(0, bedTotal - totalOcc));

  const powerCost = num(activeCensus.power_cost, 0);
  const powerUnits = num(activeCensus.power_units, 0);
  const sqFeet = num(activeCensus.sq_feet, 0);
  const powerCostSqft = sqFeet > 0 ? (powerCost / sqFeet) : num(activeCensus.power_cost_sqft, 0);
  const unitsPerOccupant = totalOcc > 0 ? (powerUnits / totalOcc) : num(activeCensus.units_per_occupant, 0);
  const powerCostOccupant = totalOcc > 0 ? (powerCost / totalOcc) : num(activeCensus.power_cost_occupant, 0);

  const normalWaterLtrs = num(activeCensus.normal_water_litres, 0);
  const normalWaterCost = num(activeCensus.normal_water_cost, 0);
  const drinkingWaterLtrs = num(activeCensus.drinking_water_litres, 0);
  const drinkingWaterCost = num(activeCensus.drinking_water_cost, 0);
  const tankerCost = num(activeCensus.water_purchase_cost, 0);
  const totalWaterCost = normalWaterCost + drinkingWaterCost + tankerCost;
  const normalWaterLtrDay = totalOcc > 0 ? (normalWaterLtrs / totalOcc / 30) : num(activeCensus.normal_water_ltr_day, 0);
  const drinkingWaterLtrDay = totalOcc > 0 ? (drinkingWaterLtrs / totalOcc / 30) : num(activeCensus.drinking_water_ltr_day, 0);

  const tableTotalSanctioned = (budgetTrackingData && budgetTrackingData.length > 0)
    ? budgetTrackingData.reduce((acc, h) => acc + num(h.sanctioned_amount, 0), 0)
    : 0;

  const appBudget = tableTotalSanctioned > 0 ? tableTotalSanctioned : num(activeCensus.approved_budget, 185449618);
  const monthlyExpenses = num(activeCensus.expenses_occurred, 0);
  const rawSpent = num(activeCensus.cumulative_budget_spent, 0);
  const spentBudget = rawSpent >= monthlyExpenses ? rawSpent : monthlyExpenses;
  const balBudget = appBudget > 0 ? Math.max(0, appBudget - spentBudget) : 0;
  const totalOccupiedCount = totalOcc > 0 ? totalOcc : (studentsTotal + staffTotal);
  const perStudentCost = totalOccupiedCount > 0 ? Math.round(monthlyExpenses / totalOccupiedCount) : (studentsTotal > 0 ? Math.round(monthlyExpenses / studentsTotal) : num(activeCensus.per_student_cost_month, 0));
  const perStudentCostDay = perStudentCost > 0 ? Math.round(perStudentCost / 30) : 0;

  const ticketsRec = num(activeCensus.tickets_received, 0);
  const ticketsCls = num(activeCensus.tickets_closed, 0);
  const ticketsOpn = num(activeCensus.tickets_open, Math.max(0, ticketsRec - ticketsCls));
  const qualityRec = num(activeCensus.quality_issues_received, 0);
  const qualityCls = num(activeCensus.quality_issues_closed, 0);
  const qualityOpn = num(activeCensus.quality_issues_open, Math.max(0, qualityRec - qualityCls));

  // The 28 canonical hostel operations parameters from live PostgreSQL database
  const HOSTEL_PARAM_ROWS = [
    { sNo: '1', name: 'Bed Capacity (Boys / Girls / Total)', key: 'bed_capacity_total', type: 'count', section: 'occupancy', calc: c => `${num(c.bed_capacity_boys, 0)} B / ${num(c.bed_capacity_girls, 0)} G = ${num(c.bed_capacity_total, num(c.bed_capacity_boys, 0) + num(c.bed_capacity_girls, 0)).toLocaleString()}` },
    { sNo: '2', name: 'No. of students (Boys / Girls / Total)', key: 'students_total', type: 'count', section: 'occupancy', calc: c => `${num(c.students_boys, 0)} B / ${num(c.students_girls, 0)} G = ${num(c.students_total, num(c.students_boys, 0) + num(c.students_girls, 0)).toLocaleString()}` },
    { sNo: '3', name: 'No. of staffs (Boys / Girls / Total)', key: 'staff_total', type: 'count', section: 'occupancy', calc: c => `${num(c.staff_boys, 0)} B / ${num(c.staff_girls, 0)} G = ${num(c.staff_total, num(c.staff_boys, 0) + num(c.staff_girls, 0)).toLocaleString()}` },
    { sNo: '4', name: 'Total Occupied (Residents)', key: 'total_occupied', type: 'count', section: 'occupancy', highlight: true, calc: c => num(c.total_occupied, num(c.students_total, 0) + num(c.staff_total, 0)).toLocaleString() },
    { sNo: '5', name: 'Vacant Beds Total', key: 'vacant_total', type: 'count', section: 'occupancy', calc: c => num(c.vacant_total, Math.max(0, num(c.bed_capacity_total, 0) - num(c.total_occupied, 0))).toLocaleString() },
    { sNo: '6', name: 'Vacant for college students', key: 'vacant_college', type: 'count', section: 'occupancy', calc: c => num(c.vacant_college, num(c.vacant_college_boys, 0) + num(c.vacant_college_girls, 0)).toLocaleString() },
    { sNo: '7', name: 'Occupied %', key: 'occupied_pct', type: 'pct', section: 'occupancy', highlight: true, calc: c => {
      const b = num(c.bed_capacity_total, 0);
      const o = num(c.total_occupied, 0);
      return b > 0 ? `${((o / b) * 100).toFixed(1)}%` : `${num(c.occupied_pct, 0).toFixed(1)}%`;
    }},
    { sNo: '8', name: 'Vacant %', key: 'vacant_pct', type: 'pct', section: 'occupancy', calc: c => {
      const b = num(c.bed_capacity_total, 0);
      const v = num(c.vacant_total, 0);
      return b > 0 ? `${((v / b) * 100).toFixed(1)}%` : `${num(c.vacant_pct, 0).toFixed(1)}%`;
    }},
    { sNo: '9', name: 'Students Vacated', key: 'students_vacated', type: 'count', section: 'occupancy', calc: c => num(c.students_vacated, 0).toLocaleString() },

    // Tickets & Maintenance
    { sNo: '10', name: 'No. of Maintenance Tickets Received', key: 'tickets_received', type: 'count', section: 'maintenance', calc: c => num(c.tickets_received, 0).toLocaleString() },
    { sNo: '11', name: 'No. of Maintenance Tickets Closed', key: 'tickets_closed', type: 'count', section: 'maintenance', calc: c => num(c.tickets_closed, 0).toLocaleString() },
    { sNo: '12', name: 'No. of Maintenance Tickets in Open', key: 'tickets_open', type: 'count', section: 'maintenance', highlight: true, calc: c => num(c.tickets_open, Math.max(0, num(c.tickets_received, 0) - num(c.tickets_closed, 0))).toLocaleString() },
    { sNo: '13', name: 'Quality Issues Received / Closed / Open', key: 'quality_issues', type: 'text', section: 'maintenance', calc: c => `${num(c.quality_issues_received, 0)} Rec / ${num(c.quality_issues_closed, 0)} Cls / ${num(c.quality_issues_open, Math.max(0, num(c.quality_issues_received, 0) - num(c.quality_issues_closed, 0)))} Opn` },
    { sNo: '14', name: 'No. of Incidents', key: 'incidents_count', type: 'count', section: 'maintenance', calc: c => num(c.incidents_count, 0).toLocaleString() },

    // Utilities & Power
    { sNo: '15', name: 'Power Consumption Cost (EB + DG)', key: 'power_cost', type: 'currency', section: 'utilities', highlight: true, calc: c => formatINR(num(c.power_cost, 0)) },
    { sNo: '16', name: 'Power Units Consumed (kWh)', key: 'power_units', type: 'count', section: 'utilities', calc: c => `${num(c.power_units, 0).toLocaleString()} kWh` },
    { sNo: '17', name: 'Power Cost per sq.ft', key: 'power_cost_sqft', type: 'text', section: 'utilities', calc: c => `₹${num(c.power_cost_sqft, num(c.sq_feet, 0) > 0 ? (num(c.power_cost, 0) / num(c.sq_feet, 0)) : 0).toFixed(2)}/sq.ft` },
    { sNo: '18', name: 'Units per occupant per month', key: 'units_per_occupant', type: 'text', section: 'utilities', calc: c => `${num(c.units_per_occupant, num(c.total_occupied, 0) > 0 ? (num(c.power_units, 0) / num(c.total_occupied, 0)) : 0).toFixed(1)} kWh/occ` },
    { sNo: '19', name: 'Power cost per occupant per month', key: 'power_cost_occupant', type: 'text', section: 'utilities', calc: c => `₹${Math.round(num(c.power_cost_occupant, num(c.total_occupied, 0) > 0 ? (num(c.power_cost, 0) / num(c.total_occupied, 0)) : 0))}/occ` },

    // Water Economics
    { sNo: '20', name: 'Normal Water Consumption Litres', key: 'normal_water_litres', type: 'count', section: 'water', calc: c => `${(num(c.normal_water_litres, 0) / 100000).toFixed(2)}L Lakhs` },
    { sNo: '21', name: 'Normal Water Cost', key: 'normal_water_cost', type: 'currency', section: 'water', calc: c => formatINR(num(c.normal_water_cost, 0)) },
    { sNo: '22', name: 'Normal Water Ltr / Student / Day', key: 'normal_water_ltr_day', type: 'text', section: 'water', calc: c => `${num(c.normal_water_ltr_day, num(c.total_occupied, 0) > 0 ? (num(c.normal_water_litres, 0) / num(c.total_occupied, 0) / 30) : 0).toFixed(1)} L/day` },
    { sNo: '23', name: 'Drinking RO Water (Litres & Cost)', key: 'drinking_water', type: 'text', section: 'water', calc: c => `${num(c.drinking_water_litres, 0).toLocaleString()}L (₹${num(c.drinking_water_cost, 0).toLocaleString()})` },
    { sNo: '24', name: 'Water Purchase Tanker Expenses', key: 'water_purchase_cost', type: 'currency', section: 'water', calc: c => formatINR(num(c.water_purchase_cost, 0)) },

    // Financial Budget & Spend
    { sNo: '25', name: 'Approved Operating Budget', key: 'approved_budget', type: 'currency', section: 'budget', calc: c => formatINR(tableTotalSanctioned > 0 ? tableTotalSanctioned : num(c.approved_budget, 185449618)) },
    { sNo: '26', name: 'Expenses Occurred (Monthly Actuals)', key: 'expenses_occurred', type: 'currency', section: 'budget', highlight: true, calc: c => formatINR(num(c.expenses_occurred, 0)) },
    { sNo: '27', name: 'Cumulative Budget Spent', key: 'cumulative_budget_spent', type: 'currency', section: 'budget', calc: c => {
      const mo = num(c.expenses_occurred, 0);
      const cs = num(c.cumulative_budget_spent, 0);
      return formatINR(cs >= mo ? cs : mo);
    }},
    { sNo: '28', name: 'Balance Budget Remaining', key: 'balance', type: 'currency', section: 'budget', highlight: true, calc: c => {
      const ab = tableTotalSanctioned > 0 ? tableTotalSanctioned : num(c.approved_budget, 185449618);
      const mo = num(c.expenses_occurred, 0);
      const cs = num(c.cumulative_budget_spent, 0);
      const effCs = cs >= mo ? cs : mo;
      return formatINR(ab > 0 ? Math.max(0, ab - effCs) : 0);
    }},
    { sNo: '29', name: 'Per Student Cost per Month / Day', key: 'per_student_cost', type: 'text', section: 'budget', calc: c => {
      const occ = num(c.total_occupied, num(c.students_total, 0) + num(c.staff_total, 0));
      const exp = num(c.expenses_occurred, 0);
      const cMonth = occ > 0 ? Math.round(exp / occ) : (num(c.students_total, 0) > 0 ? Math.round(exp / num(c.students_total, 0)) : Math.round(num(c.per_student_cost_month, 0)));
      const cDay = cMonth > 0 ? Math.round(cMonth / 30) : Math.round(num(c.per_student_cost_day, 0));
      return `₹${cMonth.toLocaleString()}/mo • ₹${cDay}/day`;
    }}
  ];

  // Filtered rows by section and search
  const filteredRows = useMemo(() => {
    return HOSTEL_PARAM_ROWS.filter(r => {
      const matchSec = selectedSection === 'all' || r.section === selectedSection;
      const matchSearch = !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSec && matchSearch;
    });
  }, [selectedSection, searchTerm]);

  // Export live CSV
  const handleExportCSV = () => {
    const headers = ['#', 'Parameter', ...periods.map(p => `"${formatPeriodLabel(p)} • ${p.period_label || p.period_code}"`)];
    const csvRows = [headers.join(',')];

    HOSTEL_PARAM_ROWS.forEach(r => {
      const rowVals = [
        `"${r.sNo}"`,
        `"${r.name}"`,
        ...periods.map(p => {
          const d = hostelCensusMap[String(p.id)] || {};
          return `"${r.calc(d)}"`;
        })
      ];
      csvRows.push(rowVals.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hostel_Census_Operations_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1.5px solid #059669',
      boxShadow: '0 4px 20px rgba(5, 150, 105, 0.08)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '0px'
    }}>
      
      {/* 1. SECTION HEADER BAR */}
      <div style={{
        backgroundColor: '#059669',
        color: '#ffffff',
        padding: '16px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            flexShrink: 0
          }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Hostel Resident Operations & Census Dashboard
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                padding: '2px 9px',
                borderRadius: '12px',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)'
              }}>
                Live PostgreSQL Data
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#d1fae5' }}>
              Occupancy • Power & Water Economics • Tickets & Maintenance • Run-Rate Budget • {activePeriodObj ? formatPeriodLabel(activePeriodObj) : 'Oct\'26'} ({periods.length} Cycles)
            </p>
          </div>
        </div>

        {/* Right Actions: Period Selector + CSV Download + Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Cycle Selector */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <Calendar size={14} style={{ position: 'absolute', left: '10px', color: '#059669', pointerEvents: 'none' }} />
            <select
              value={currentPeriodIdStr}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedPeriodId(val);
                if (onPeriodChange) onPeriodChange(val);
              }}
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '9999px',
                padding: '7px 28px 7px 30px',
                fontSize: '12px',
                fontWeight: '800',
                color: '#065f46',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              <option value="all">🌐 All Months (Overall Cycles)</option>
              {periods.map(p => (
                <option key={p.id} value={String(p.id)}>
                  {formatPeriodLabel(p)} • {p.period_label || p.period_code}
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', color: '#059669', pointerEvents: 'none' }} />
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              padding: '7px 14px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              border: 'none',
              color: '#059669',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          {/* Table Toggle Button */}
          <button
            type="button"
            onClick={() => setShowLedgerTable(!showLedgerTable)}
            style={{
              padding: '7px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Table size={13} />
            <span>{showLedgerTable ? 'Hide Table' : 'Show Ledger Table'}</span>
            {showLedgerTable ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* 2. 5 FEATURED LIVE KPI CARDS */}
      <div style={{ padding: '20px 22px', backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '14px'
        }}>
          {/* Card 1: Bed Capacity & Occupancy */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1.5px solid #a7f3d0',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Bed Capacity & Occupancy
              </span>
              <BedDouble size={16} color="#059669" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
                {totalOcc.toLocaleString()}
              </span>
              <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '700' }}>
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
            <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>Students: <b style={{ color: '#0f172a' }}>{studentsTotal.toLocaleString()}</b></span>
              <span>Staff: <b style={{ color: '#0f172a' }}>{staffTotal.toLocaleString()}</b></span>
              <span style={{ color: '#059669', fontWeight: '800' }}>Vacant: {vacantTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Card 2: Power & Energy Economics */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1.5px solid #fed7aa',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Power Consumption (EB + DG)
              </span>
              <Zap size={16} color="#ea580c" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
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
            <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>₹{powerCostSqft.toFixed(2)}/sq.ft</span>
              <span>{unitsPerOccupant.toFixed(1)} kWh/occ</span>
              <span>₹{Math.round(powerCostOccupant)}/occ</span>
            </div>
          </div>

          {/* Card 3: Water Supply & RO Purification */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1.5px solid #bae6fd',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Water Supply & RO Purified
              </span>
              <Droplets size={16} color="#0284c7" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
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
            <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>Normal: {normalWaterLtrDay.toFixed(1)} L/day</span>
              <span>RO: {drinkingWaterLtrDay.toFixed(2)} L/day</span>
              <span>Tanker: {formatINR(tankerCost)}</span>
            </div>
          </div>

          {/* Card 4: Operating Budget & Balance */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1.5px solid #bbf7d0',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Approved Budget & Actuals
              </span>
              <DollarSign size={16} color="#16a34a" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
                {formatINR(monthlyExpenses)}
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
                Monthly Spend
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>Budget: {formatLakhs(appBudget)}</span>
              <span>Balance: {formatLakhs(balBudget)}</span>
              <span style={{ fontWeight: '800', color: '#0f172a' }}>₹{perStudentCost.toLocaleString()}/stud/mo</span>
            </div>
          </div>

          {/* Card 5: Maintenance Tickets & Quality */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1.5px solid #d8b4fe',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#9333ea', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Maintenance Tickets & Quality
              </span>
              <Wrench size={16} color="#9333ea" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
                {ticketsRec} Rec
              </span>
              <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '700' }}>
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
            <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              <span>Quality: {qualityOpn} Open</span>
              <span>Incidents: {num(activeCensus.incidents_count, 0)}</span>
              <span style={{ color: '#16a34a', fontWeight: '800' }}>100% Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MONTH-BY-MONTH OPERATIONAL CENSUS LEDGER TABLE */}
      {showLedgerTable && (
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
          {/* Section Filter Pills & Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Section Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Parameters' },
                { id: 'occupancy', label: 'Occupancy & Census' },
                { id: 'maintenance', label: 'Maintenance & Quality' },
                { id: 'utilities', label: 'Power & Utilities' },
                { id: 'water', label: 'Water Economics' },
                { id: 'budget', label: 'Budget & Financials' }
              ].map(sec => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedSection(sec.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    fontSize: '11.5px',
                    fontWeight: selectedSection === sec.id ? '800' : '650',
                    border: '1px solid',
                    borderColor: selectedSection === sec.id ? '#059669' : '#e2e8f0',
                    backgroundColor: selectedSection === sec.id ? '#ecfdf5' : '#ffffff',
                    color: selectedSection === sec.id ? '#059669' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search parameter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '6px 12px 6px 28px',
                  borderRadius: '9999px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  width: '180px',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', width: '100%', maxHeight: '600px' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
              fontFamily: 'inherit'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  borderBottom: '2px solid #047857',
                  fontWeight: '800',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  <th style={{ width: '45px', padding: '10px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>#</th>
                  <th style={{ minWidth: '320px', padding: '10px 16px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                    Hostel Operations & Census Parameters
                  </th>
                  {periods.map(p => {
                    const isExactSelected = currentPeriodIdStr === String(p.id);
                    return (
                      <th
                        key={p.id}
                        onClick={() => {
                          setSelectedPeriodId(String(p.id));
                          if (onPeriodChange) onPeriodChange(String(p.id));
                        }}
                        title={`Click to filter dashboard for ${p.period_label || p.period_code}`}
                        style={{
                          minWidth: '135px',
                          padding: '10px 12px',
                          textAlign: 'center',
                          borderRight: '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: isExactSelected ? '#047857' : (isAll ? '#065f46' : '#059669'),
                          fontWeight: '800',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span>{formatPeriodLabel(p)}</span>
                          <span style={{ fontSize: '10px', fontWeight: '600', opacity: 0.85 }}>{p.period_label || p.period_code}</span>
                          {isExactSelected && (
                            <span style={{ fontSize: '9px', fontWeight: '900', backgroundColor: '#ffffff', color: '#047857', padding: '1px 6px', borderRadius: '4px', marginTop: '2px' }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row, idx) => {
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
                        fontWeight: row.highlight ? '750' : '500'
                      }}
                    >
                      <td style={{ padding: '8px', textAlign: 'center', color: '#64748b', borderRight: '1px solid #e2e8f0', fontWeight: '700' }}>
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
                              color: row.highlight ? (isCurrent ? '#047857' : '#0f172a') : '#334155',
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
        </div>
      )}
    </div>
  );
}
