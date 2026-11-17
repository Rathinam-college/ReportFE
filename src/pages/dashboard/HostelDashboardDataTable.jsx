import React, { useState, useMemo, useRef, useEffect } from 'react';
import { formatINR } from '../../utils/formatters';
import { 
  Search, X, Maximize2, Minimize2, Download, Building2, BedDouble, 
  Users, Zap, Droplets, Wrench, DollarSign, Calculator, ChevronRight, Check
} from 'lucide-react';

export default function HostelDashboardDataTable({
  periods: propPeriods = [],
  activePeriod = 'all',
  computedMatrix: propComputedMatrix,
  isFullScreen: propIsFullScreen,
  onToggleFullScreen: propOnToggleFullScreen
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [internalFullScreen, setInternalFullScreen] = useState(false);
  const [localMatrix, setLocalMatrix] = useState(null);
  const [loadingLocal, setLoadingLocal] = useState(false);

  const isFullScreen = propIsFullScreen !== undefined ? propIsFullScreen : internalFullScreen;
  const containerRef = useRef(null);

  // Self-healing fallback: If parent periods or computedMatrix is empty, fetch directly from live database!
  useEffect(() => {
    const hasParentPeriods = propPeriods && propPeriods.length > 0;
    const hasParentCensus = propComputedMatrix?.hostel_census && Object.keys(propComputedMatrix.hostel_census).length > 0;
    
    if (!hasParentPeriods || !hasParentCensus) {
      setLoadingLocal(true);
      fetch('/api/matrix?module=hostel')
        .then(res => res.json())
        .then(data => {
          if (data && data.periods && data.periods.length > 0) {
            setLocalMatrix(data);
          }
          setLoadingLocal(false);
        })
        .catch(err => {
          console.error('[HostelDashboardDataTable] Fallback fetch error:', err);
          setLoadingLocal(false);
        });
    }
  }, [propPeriods, propComputedMatrix]);

  const periods = (propPeriods && propPeriods.length > 0) ? propPeriods : (localMatrix?.periods || []);
  const computedMatrix = (propComputedMatrix?.hostel_census && Object.keys(propComputedMatrix.hostel_census).length > 0)
    ? propComputedMatrix
    : (localMatrix || {});
  const hostelCensusMap = computedMatrix?.hostel_census || {};

  const currentPeriodIdStr = activePeriod !== 'all' ? String(activePeriod) : String(periods[0]?.id || '220');

  const toggleFullScreen = () => {
    const nextState = !isFullScreen;
    if (propOnToggleFullScreen) {
      propOnToggleFullScreen(nextState);
    } else {
      setInternalFullScreen(nextState);
    }
  };

  const [masterParams, setMasterParams] = useState([]);
  const [loadingParams, setLoadingParams] = useState(true);

  // Fetch parameters from Hostel Master Data API
  const fetchMasterParams = async () => {
    try {
      setLoadingParams(true);
      const res = await fetch('/api/hostel/parameters');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMasterParams(data);
        }
      }
    } catch (err) {
      console.error('[HostelDashboardDataTable] Error fetching parameters:', err);
    } finally {
      setLoadingParams(false);
    }
  };

  useEffect(() => {
    fetchMasterParams();
  }, []);

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  const fmtVal = (val, unit = '') => {
    if (val === undefined || val === null || val === '') return '—';
    const n = Number(val);
    if (isNaN(n)) return String(val);
    return unit ? `${n.toLocaleString()} ${unit}` : n.toLocaleString();
  };

  const fmtCost = (val) => {
    if (val === undefined || val === null || val === '') return '—';
    const n = Number(val);
    if (isNaN(n)) return '—';
    return formatINR(n);
  };

  const fmtPercent = (val) => {
    if (val === undefined || val === null || val === '') return '—';
    const n = Number(val);
    if (isNaN(n)) return '—';
    return `${n.toFixed(1)}%`;
  };

  // Evaluate any parameter (standard or dynamic custom parameter) for a given month's census entry
  const getHostelParamValue = (param, c) => {
    if (!c || Object.keys(c).length === 0) return '—';
    const k = param.param_key;

    // 1. Bed Capacity
    if (k === 'bed_capacity') {
      const tot = c.bed_capacity_total ?? (c.bed_capacity_boys !== undefined && c.bed_capacity_girls !== undefined ? (num(c.bed_capacity_boys) + num(c.bed_capacity_girls)) : undefined);
      return fmtVal(tot);
    }
    if (k === 'bed_capacity_boys') return fmtVal(c.bed_capacity_boys);
    if (k === 'bed_capacity_girls') return fmtVal(c.bed_capacity_girls);

    // 2. Students Count
    if (k === 'students_count' || k === 'students_kpi') {
      const tot = c.students_total ?? (c.students_boys !== undefined && c.students_girls !== undefined ? (num(c.students_boys) + num(c.students_girls)) : undefined);
      return fmtVal(tot);
    }
    if (k === 'students_boys') return fmtVal(c.students_boys);
    if (k === 'students_girls') return fmtVal(c.students_girls);

    // 3. Staff Count
    if (k === 'staff_count') {
      const tot = c.staff_total ?? (c.staff_boys !== undefined && c.staff_girls !== undefined ? (num(c.staff_boys) + num(c.staff_girls)) : undefined);
      return fmtVal(tot);
    }
    if (k === 'staff_boys') return fmtVal(c.staff_boys);
    if (k === 'staff_girls') return fmtVal(c.staff_girls);

    // 4. Total Occupied
    if (k === 'total_occupied') return fmtVal(c.total_occupied);

    // 5. Vacancy Breakdown
    if (k === 'vacant') return fmtVal(c.vacant_total);
    if (k === 'vacant_college') return fmtVal(c.vacant_college);
    if (k === 'vacant_sports') return fmtVal(c.vacant_sports_total);
    if (k === 'vacant_school') return fmtVal(c.vacant_school_total);

    // 6. Percentages & Turnout
    if (k === 'occupied_pct') return fmtPercent(c.occupied_pct);
    if (k === 'vacant_pct') return fmtPercent(c.vacant_pct);
    if (k === 'students_vacated') return fmtVal(c.students_vacated);

    // 7. Service Tickets & Quality
    if (k === 'tickets_received') return fmtVal(c.tickets_received);
    if (k === 'tickets_closed') return fmtVal(c.tickets_closed);
    if (k === 'tickets_open') return fmtVal(c.tickets_open);
    if (k === 'total_hours_close') return fmtVal(c.total_hours_close);
    if (k === 'tat_hours') return (c.tat_hours !== undefined && c.tat_hours !== null && c.tat_hours !== '') ? `${num(c.tat_hours).toFixed(1)} hrs` : '—';
    if (k === 'quality_issues_received') return fmtVal(c.quality_issues_received);
    if (k === 'quality_issues_closed') return fmtVal(c.quality_issues_closed);
    if (k === 'quality_issues_open') return fmtVal(c.quality_issues_open);
    if (k === 'incidents_count') return fmtVal(c.incidents_count);

    // 8. Power Consumption
    if (k === 'power_consumption') return fmtVal(c.power_units, 'kWh');
    if (k === 'power_units') return fmtVal(c.power_units, 'kWh');
    if (k === 'power_cost') return fmtCost(c.power_cost);
    if (k === 'power_cost_sqft') return (c.power_cost_sqft !== undefined && c.power_cost_sqft !== null && c.power_cost_sqft !== '') ? `₹${num(c.power_cost_sqft).toFixed(2)} / sq.ft` : '—';
    if (k === 'units_per_occupant') return (c.units_per_occupant !== undefined && c.units_per_occupant !== null && c.units_per_occupant !== '') ? `${num(c.units_per_occupant).toFixed(1)} kWh/occ` : '—';
    if (k === 'power_cost_occupant') return (c.power_cost_occupant !== undefined && c.power_cost_occupant !== null && c.power_cost_occupant !== '') ? `₹${Math.round(num(c.power_cost_occupant)).toLocaleString()} / occ` : '—';

    // 9. Water Supply & Drinking RO
    if (k === 'water_purchase_cost') return fmtCost(c.water_purchase_cost);
    if (k === 'normal_water_litres') return (c.normal_water_litres !== undefined && c.normal_water_litres !== null && c.normal_water_litres !== '') ? `${(num(c.normal_water_litres) / 100000).toFixed(2)} Lakh L` : '—';
    if (k === 'normal_water_cost') return fmtCost(c.normal_water_cost);
    if (k === 'normal_water_ltr_day') return (c.normal_water_ltr_day !== undefined && c.normal_water_ltr_day !== null && c.normal_water_ltr_day !== '') ? `${num(c.normal_water_ltr_day).toFixed(1)} L/day` : '—';
    if (k === 'normal_water_cost_day') return (c.normal_water_cost_day !== undefined && c.normal_water_cost_day !== null && c.normal_water_cost_day !== '') ? `₹${num(c.normal_water_cost_day).toFixed(2)}/day` : '—';
    if (k === 'drinking_water_litres') return fmtVal(c.drinking_water_litres, 'L');
    if (k === 'drinking_water_cost') return fmtCost(c.drinking_water_cost);
    if (k === 'drinking_water_ltr_day') return (c.drinking_water_ltr_day !== undefined && c.drinking_water_ltr_day !== null && c.drinking_water_ltr_day !== '') ? `${num(c.drinking_water_ltr_day).toFixed(1)} L/day` : '—';
    if (k === 'drinking_water_cost_day') return (c.drinking_water_cost_day !== undefined && c.drinking_water_cost_day !== null && c.drinking_water_cost_day !== '') ? `₹${num(c.drinking_water_cost_day).toFixed(2)}/day` : '—';
    if (k === 'normal_water_student_month') return fmtCost(c.normal_water_cost);

    // 10. Financial Budget & Operational Expenses
    if (k === 'maintenance_expenses') return fmtCost(c.maintenance_expenses);
    if (k === 'expenses_occurred') return fmtCost(c.expenses_occurred);
    if (k === 'approved_budget') return fmtCost(c.approved_budget);
    if (k === 'cumulative_budget_spent') return fmtCost(c.cumulative_budget_spent);
    if (k === 'balance') return fmtCost(c.balance);

    // 11. Per Student Cost & Area
    if (k === 'sq_feet') return fmtVal(c.sq_feet, 'sq.ft');
    if (k === 'sq_feet_per_occupant') return (c.sq_feet_per_occupant !== undefined && c.sq_feet_per_occupant !== null && c.sq_feet_per_occupant !== '') ? `${num(c.sq_feet_per_occupant).toFixed(1)} sq.ft/occ` : '—';
    if (k === 'per_student_cost_month') return (c.per_student_cost_month !== undefined && c.per_student_cost_month !== null && c.per_student_cost_month !== '') ? `₹ ${Math.round(num(c.per_student_cost_month)).toLocaleString()} / mo` : '—';
    if (k === 'per_student_cost_day') return (c.per_student_cost_day !== undefined && c.per_student_cost_day !== null && c.per_student_cost_day !== '') ? `₹ ${num(c.per_student_cost_day).toFixed(2)} / day` : '—';

    // 12. Dynamic custom parameters added in Master Data
    const rawVal = c[k] !== undefined ? c[k] : (c.custom_metrics && c.custom_metrics[k]);
    if (rawVal === undefined || rawVal === null || rawVal === '') return '—';
    if (param.input_type === 'cost') return fmtCost(rawVal);
    if (param.input_type === 'percentage') return fmtPercent(rawVal);
    return fmtVal(rawVal, param.unit);
  };

  // Canonical fallback parameters if Master Data API is still connecting
  const CANONICAL_HOSTEL_FALLBACK = [
    { s_no: '1', param_key: 'bed_capacity', param_name: 'Bed Capacity', section: 'Occupancy & Census', input_type: 'boys_girls_total', formula: 'Boys + Girls' },
    { s_no: '2', param_key: 'students_count', param_name: 'No. of students', section: 'Occupancy & Census', input_type: 'boys_girls_total', formula: 'Boys + Girls' },
    { s_no: '3', param_key: 'staff_count', param_name: 'No. of staffs', section: 'Occupancy & Census', input_type: 'boys_girls_total', formula: 'Boys + Girls' },
    { s_no: '4', param_key: 'total_occupied', param_name: 'Total Occupied', section: 'Occupancy & Census', input_type: 'boys_girls_total', formula: 'Students + Staffs' },
    { s_no: '5', param_key: 'vacant', param_name: 'Vacant', section: 'Occupancy & Census', input_type: 'boys_girls_total', formula: 'Bed Capacity - Total Occupied' },
    { s_no: '6', param_key: 'vacant_college', param_name: 'Vacant for college students', section: 'Occupancy & Census', input_type: 'boys_girls_total' },
    { s_no: '7', param_key: 'vacant_sports', param_name: 'Vacant for college sports students (KPM hostel)', section: 'Occupancy & Census', input_type: 'boys_girls_total' },
    { s_no: '8', param_key: 'vacant_school', param_name: 'Vacant for school students', section: 'Occupancy & Census', input_type: 'boys_girls_total' },
    { s_no: '9', param_key: 'occupied_pct', param_name: 'Occupied %', section: 'Occupancy & Census', input_type: 'percentage', formula: '(Total Occupied / Bed Capacity) * 100' },
    { s_no: '10', param_key: 'vacant_pct', param_name: 'Vacant %', section: 'Occupancy & Census', input_type: 'percentage', formula: '(Vacant / Bed Capacity) * 100' },
    { s_no: '11', param_key: 'students_vacated', param_name: 'Students Vacated', section: 'Occupancy & Census', input_type: 'single_count' },
    { s_no: '12', param_key: 'tickets_received', param_name: 'No. of Maintenance Tickets Received', section: 'Maintenance & Quality Tickets', input_type: 'single_count' },
    { s_no: '13', param_key: 'tickets_closed', param_name: 'No. of Maintenance Tickets closed', section: 'Maintenance & Quality Tickets', input_type: 'single_count' },
    { s_no: '14', param_key: 'tickets_open', param_name: 'No. of Maintenance Tickets in Open', section: 'Maintenance & Quality Tickets', input_type: 'single_count', formula: 'Tickets Received - Tickets Closed' },
    { s_no: '15', param_key: 'total_hours_close', param_name: 'Total Hours taken to close the tickets', section: 'Maintenance & Quality Tickets', input_type: 'single_number' },
    { s_no: '16', param_key: 'tat_hours', param_name: 'TAT (Turnaround Time)Hours', section: 'Maintenance & Quality Tickets', input_type: 'single_number', formula: 'Total Hours / Tickets Closed' },
    { s_no: '17', param_key: 'quality_issues_received', param_name: 'No. of Quality issues Received', section: 'Maintenance & Quality Tickets', input_type: 'single_count' },
    { s_no: '18', param_key: 'quality_issues_closed', param_name: 'No. of Quality issues Closed', section: 'Maintenance & Quality Tickets', input_type: 'single_count' },
    { s_no: '19', param_key: 'quality_issues_open', param_name: 'No. of Quality issues in Open', section: 'Maintenance & Quality Tickets', input_type: 'single_count', formula: 'Received - Closed' },
    { s_no: '20', param_key: 'incidents_count', param_name: 'No. of Incidents', section: 'Maintenance & Quality Tickets', input_type: 'single_count' },
    { s_no: '21', param_key: 'power_consumption', param_name: 'Power Consumption', section: 'Utilities & Operational Expenses', input_type: 'units_and_cost' },
    { s_no: '22', param_key: 'water_purchase_cost', param_name: 'Water Purchase Expenses', section: 'Utilities & Operational Expenses', input_type: 'cost' },
    { s_no: '23', param_key: 'maintenance_expenses', param_name: 'Maintenance Expenses', section: 'Utilities & Operational Expenses', input_type: 'cost' },
    { s_no: '24', param_key: 'expenses_occurred', param_name: 'Expenses occurred (Total Spend)', section: 'Utilities & Operational Expenses', input_type: 'cost', formula: 'Sum of Monthly Operational Expenses' },
    { s_no: '25', param_key: 'approved_budget', param_name: 'Approved Budget', section: 'Budget & Financial Balance', input_type: 'cost' },
    { s_no: '26', param_key: 'cumulative_budget_spent', param_name: 'Cumulative Budget spent (Actual expenses) till now', section: 'Budget & Financial Balance', input_type: 'cost' },
    { s_no: '27', param_key: 'balance', param_name: 'Balance', section: 'Budget & Financial Balance', input_type: 'cost', formula: 'Approved Budget - Cumulative Budget Spent' },
    { s_no: '28', param_key: 'students_kpi', param_name: 'Number of students', section: 'Per Student & Area Metrics', input_type: 'single_count' },
    { s_no: '29', param_key: 'per_student_cost_month', param_name: 'Per student cost per month', section: 'Per Student & Area Metrics', input_type: 'cost', formula: 'Expenses occurred / Number of students' },
    { s_no: '30', param_key: 'per_student_cost_day', param_name: 'Per student cost per day', section: 'Per Student & Area Metrics', input_type: 'cost', formula: 'Per student cost per month / 30' },
    { s_no: '31', param_key: 'sq_feet', param_name: 'Sq feet (Hostel Area)', section: 'Per Student & Area Metrics', input_type: 'single_number' },
    { s_no: '32', param_key: 'sq_feet_per_occupant', param_name: 'Sq feet per occupant in hostel', section: 'Per Student & Area Metrics', input_type: 'single_number', formula: 'Sq feet / Total Occupied' },
    { s_no: '33', param_key: 'normal_water_student_month', param_name: 'Normal water per student per month (Ltrs & cost)', section: 'Per Student & Area Metrics', input_type: 'units_and_cost' },
    { s_no: '34', param_key: 'power_cost_sqft', param_name: 'Power cost per sq feet', section: 'Water & Utilities Deep Dive', input_type: 'cost', formula: 'Power cost / Sq feet' },
    { s_no: '35', param_key: 'units_per_occupant', param_name: 'Units per occupant per month - Hostel', section: 'Water & Utilities Deep Dive', input_type: 'single_number', formula: 'Power units / Total Occupied' },
    { s_no: '36', param_key: 'power_cost_occupant', param_name: 'Power cost Per occupant per month - Hostel', section: 'Water & Utilities Deep Dive', input_type: 'cost', formula: 'Power cost / Total Occupied' },
    { s_no: '37', param_key: 'normal_water_litres', param_name: 'Normal Water Consumption Ltr Hostels', section: 'Water & Utilities Deep Dive', input_type: 'single_number' },
    { s_no: '38', param_key: 'normal_water_cost', param_name: 'Normal Water Consumption Cost Hostels', section: 'Water & Utilities Deep Dive', input_type: 'cost' },
    { s_no: '39', param_key: 'normal_water_ltr_day', param_name: 'Normal water Ltr per student per day - Hostels', section: 'Water & Utilities Deep Dive', input_type: 'single_number', formula: 'Normal Water Ltr / Total Students / 30' },
    { s_no: '40', param_key: 'normal_water_cost_day', param_name: 'Normal Water cost Per student per day Hostels', section: 'Water & Utilities Deep Dive', input_type: 'cost', formula: 'Normal Water Cost / Total Students / 30' },
    { s_no: '41', param_key: 'drinking_water_litres', param_name: 'Drinking Water Consumption Litres Hostels', section: 'Water & Utilities Deep Dive', input_type: 'single_number' },
    { s_no: '42', param_key: 'drinking_water_cost', param_name: 'Drinking Water Consumption Cost Hostels', section: 'Water & Utilities Deep Dive', input_type: 'cost' },
    { s_no: '43', param_key: 'drinking_water_ltr_day', param_name: 'Drinking water Litres per student per day- Hostels', section: 'Water & Utilities Deep Dive', input_type: 'single_number', formula: 'Drinking Water Ltr / Total Students / 30' },
    { s_no: '44', param_key: 'drinking_water_cost_day', param_name: 'Drinking Water cost Per student per day Hostels', section: 'Water & Utilities Deep Dive', input_type: 'cost', formula: 'Drinking Water Cost / Total Students / 30' }
  ];

  // Dynamic parameters built directly from live Master Data (updates automatically when added or removed)
  const PARAMETERS = useMemo(() => {
    const sourceList = (masterParams && masterParams.length > 0) ? masterParams : CANONICAL_HOSTEL_FALLBACK;
    
    return sourceList.map((p, idx) => {
      const sNo = p.s_no !== undefined && p.s_no !== null && p.s_no !== '' ? String(p.s_no) : String(idx + 1);
      const name = p.param_name;
      const sec = p.section || 'General Operations';
      const isHeaderVal = p.param_key === 'bed_capacity' || p.param_key === 'total_occupied' || p.param_key === 'balance' || p.param_key === 'expenses_occurred';
      const highlight = isHeaderVal || p.param_key === 'occupied_pct';
      const highlightBg = (p.param_key === 'total_occupied' || p.param_key === 'balance') ? '#f0fdf4' : (p.param_key === 'expenses_occurred') ? '#fed7aa' : undefined;
      const highlightColor = (p.param_key === 'total_occupied' || p.param_key === 'balance') ? '#166534' : (p.param_key === 'expenses_occurred') ? '#7c2d12' : undefined;

      return {
        id: p.id || idx,
        sNo,
        name,
        section: sec,
        unit: p.unit || '',
        formula: p.formula,
        highlight,
        highlightBg,
        highlightColor,
        isHeaderVal,
        calc: (c) => getHostelParamValue(p, c)
      };
    });
  }, [masterParams]);

  // Extract unique sections dynamically from the active parameters
  const dynamicSections = useMemo(() => {
    const list = [];
    const seen = new Set();
    PARAMETERS.forEach(p => {
      if (p.section && !seen.has(p.section)) {
        seen.add(p.section);
        list.push(p.section);
      }
    });
    return list;
  }, [PARAMETERS]);

  // Filtered parameters by search term and section
  const filteredParameters = useMemo(() => {
    return PARAMETERS.filter(p => {
      const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sNo.includes(searchTerm);
      const matchesSec = selectedSection === 'all' || p.section === selectedSection;
      return matchesSearch && matchesSec;
    });
  }, [PARAMETERS, searchTerm, selectedSection]);

  // Export table to CSV
  const handleExportCSV = () => {
    let csv = `S.No,Parameter,Section,${periods.map(p => `"${p.period_label}"`).join(',')}\n`;
    PARAMETERS.forEach(p => {
      const vals = periods.map(per => {
        const d = hostelCensusMap[String(per.id)] || {};
        return `"${p.calc(d)}"`;
      });
      csv += `"${p.sNo}","${p.name}","${p.section}",${vals.join(',')}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Hostel_Operations_Monthly_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div 
      ref={containerRef}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1.5px solid #cbd5e1',
        boxShadow: isFullScreen ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: isFullScreen ? 'fixed' : 'relative',
        top: isFullScreen ? 0 : 'auto',
        left: isFullScreen ? 0 : 'auto',
        right: isFullScreen ? 0 : 'auto',
        bottom: isFullScreen ? 0 : 'auto',
        width: isFullScreen ? '100vw' : '100%',
        maxWidth: '100%',
        height: isFullScreen ? '100vh' : 'auto',
        zIndex: isFullScreen ? 99999 : 1,
        boxSizing: 'border-box'
      }}
    >
      {/* 1. TOP UTILITY HEADER */}
      <div style={{
        padding: '12px 18px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: '#059669',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <Building2 size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Hostel Operations & Census Master Spreadsheet
              </h3>
              <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#065f46', backgroundColor: '#d1fae5', padding: '1px 7px', borderRadius: '4px' }}>
                Live Database Values • Matches Data Entry
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748b' }}>
              All 44 operational parameters side-by-side across all {periods.length || 13} recorded monthly billing cycles
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '4px 10px',
            width: '210px'
          }}>
            <Search size={14} color="#64748b" style={{ marginRight: '6px' }} />
            <input
              type="text"
              placeholder="Search parameters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                width: '100%',
                color: '#0f172a'
              }}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
              >
                <X size={13} color="#94a3b8" />
              </button>
            )}
          </div>

          {/* Section Filter */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">All Sections ({PARAMETERS.length} Rows)</option>
            {dynamicSections.map(secName => (
              <option key={secName} value={secName}>{secName}</option>
            ))}
          </select>

          {/* CSV Export Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Download full spreadsheet as CSV"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            <Download size={13} />
            <span>CSV</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullScreen}
            title={isFullScreen ? 'Exit Fullscreen' : 'View Fullscreen'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* 2. THE MULTI-MONTH DATA TABLE WITH STICKY LEFT COLUMNS */}
      <div style={{
        overflowX: 'auto',
        overflowY: 'auto',
        maxHeight: isFullScreen ? 'calc(100vh - 65px)' : '650px',
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        <table style={{
          width: 'max-content',
          minWidth: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
          fontSize: '12.5px',
          fontFamily: 'Calibri, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
        }}>
          <thead>
            <tr>
              {/* Sticky S.No Column */}
              <th style={{
                width: '50px',
                minWidth: '50px',
                maxWidth: '50px',
                padding: '10px 6px',
                textAlign: 'center',
                backgroundColor: '#059669',
                color: '#ffffff',
                fontWeight: '800',
                borderBottom: '2px solid #000000',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                position: 'sticky',
                top: 0,
                left: 0,
                zIndex: 30
              }}>
                S.No
              </th>

              {/* Sticky Parameter Name Column */}
              <th style={{
                width: '320px',
                minWidth: '320px',
                maxWidth: '320px',
                padding: '10px 14px',
                textAlign: 'left',
                backgroundColor: '#059669',
                color: '#ffffff',
                fontWeight: '800',
                borderBottom: '2px solid #000000',
                borderRight: '2px solid rgba(0,0,0,0.2)',
                position: 'sticky',
                top: 0,
                left: '50px',
                zIndex: 30,
                boxShadow: '3px 0 6px rgba(0,0,0,0.1)'
              }}>
                Hostel Operations & Census Parameters
              </th>

              {/* Each Monthly Cycle Column */}
              {periods.map(p => {
                const isSelected = String(p.id) === currentPeriodIdStr;
                return (
                  <th
                    key={p.id}
                    style={{
                      minWidth: '135px',
                      padding: '10px 12px',
                      textAlign: 'center',
                      borderBottom: '2px solid #000000',
                      borderRight: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: isSelected ? '#047857' : '#059669',
                      color: '#ffffff',
                      fontWeight: '800',
                      position: 'sticky',
                      top: 0,
                      zIndex: 20,
                      boxShadow: isSelected ? 'inset 0 -3px 0 #86efac' : 'none'
                    }}
                  >
                    <div>{p.period_label}</div>
                    {isSelected && (
                      <span style={{ fontSize: '9px', fontWeight: '800', backgroundColor: '#86efac', color: '#064e3b', padding: '1px 6px', borderRadius: '4px', marginTop: '2px', display: 'inline-block' }}>
                        ACTIVE
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {periods.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #059669', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span>Loading Hostel Operational Ledger & monthly cycles from database...</span>
                  </div>
                </td>
              </tr>
            ) : filteredParameters.length === 0 ? (
              <tr>
                <td colSpan={periods.length + 2} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No parameters match your search query "{searchTerm}"
                </td>
              </tr>
            ) : (
              filteredParameters.map((param, idx) => {
                const isTotalRow = param.highlight;
                const rowBg = param.highlightBg || (idx % 2 === 1 ? '#f8fafc' : '#ffffff');

                return (
                  <tr
                    key={`${param.sNo}-${param.name}`}
                    style={{
                      height: '28px'
                    }}
                  >
                    {/* S.No - Sticky Left */}
                    <td style={{
                      position: 'sticky',
                      left: 0,
                      backgroundColor: rowBg,
                      zIndex: 10,
                      padding: '5px 6px',
                      textAlign: 'center',
                      borderBottom: isTotalRow ? '1.5px solid #000000' : '1px solid #e2e8f0',
                      borderRight: '1px solid #cbd5e1',
                      color: '#64748b',
                      fontWeight: '700',
                      fontSize: '11.5px',
                      width: '50px',
                      minWidth: '50px'
                    }}>
                      {param.sNo}
                    </td>

                    {/* Parameter Name - Sticky Left */}
                    <td style={{
                      position: 'sticky',
                      left: '50px',
                      backgroundColor: rowBg,
                      zIndex: 10,
                      padding: '5px 12px',
                      borderBottom: isTotalRow ? '1.5px solid #000000' : '1px solid #e2e8f0',
                      borderRight: '2px solid #94a3b8',
                      color: param.highlightColor || '#0f172a',
                      fontWeight: isTotalRow ? '800' : '600',
                      width: '320px',
                      minWidth: '320px',
                      boxShadow: '3px 0 6px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{param.name}</span>
                        {param.unit && (
                          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginLeft: '6px' }}>
                            {param.unit}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Each Month Column */}
                    {periods.map(p => {
                      const pStr = String(p.id);
                      const d = hostelCensusMap[pStr] || {};
                      const valStr = param.calc(d);
                      const isSelected = pStr === currentPeriodIdStr;

                      return (
                        <td
                          key={p.id}
                          style={{
                            padding: '4px 12px',
                            textAlign: 'right',
                            borderBottom: isTotalRow ? '1.5px solid #000000' : '1px solid #e2e8f0',
                            borderRight: '1px solid #cbd5e1',
                            fontWeight: isTotalRow ? '800' : '600',
                            color: param.highlightColor || (isSelected ? '#0f172a' : '#334155'),
                            backgroundColor: isSelected ? 'rgba(5, 150, 105, 0.05)' : (isTotalRow ? rowBg : 'transparent'),
                            fontSize: isTotalRow ? '13px' : '12.5px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {valStr}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. TABLE FOOTER INFO */}
      <div style={{
        padding: '8px 18px',
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11.5px',
        color: '#64748b'
      }}>
        <span>Showing {filteredParameters.length} of {PARAMETERS.length} operational parameters across {periods.length} monthly cycles</span>
        <span>Values match Hostel Data Entry & PostgreSQL live database</span>
      </div>
    </div>
  );
}
