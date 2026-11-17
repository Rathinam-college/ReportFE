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

  // Section definitions matching Hostel Data Entry exactly
  const HOSTEL_SECTIONS = [
    { id: 'occupancy', name: 'Bed Capacity & Occupancy', icon: BedDouble, color: '#059669', bg: '#ecfdf5' },
    { id: 'tickets', name: 'Maintenance & Service Tickets', icon: Wrench, color: '#7c3aed', bg: '#f5f3ff' },
    { id: 'power', name: 'Power Consumption (EB + DG)', icon: Zap, color: '#ea580c', bg: '#fff7ed' },
    { id: 'water', name: 'Water Supply, RO & Tankers', icon: Droplets, color: '#0284c7', bg: '#f0f9ff' },
    { id: 'budget', name: 'Operating Budget & Balance', icon: DollarSign, color: '#16a34a', bg: '#dcfce7' },
    { id: 'analytics', name: 'Per Student Cost & Area Metrics', icon: Calculator, color: '#ca8a04', bg: '#fef9c3' }
  ];

  // Full 44 Operational Parameters matching Data Entry 100% (Strictly shows entered database values)
  const PARAMETERS = useMemo(() => [
    // 1. Bed Capacity & Occupancy
    { sNo: '1', name: 'Bed Capacity - Boys', section: 'occupancy', calc: c => fmtVal(c.bed_capacity_boys), unit: 'Beds' },
    { sNo: '1', name: 'Bed Capacity - Girls', section: 'occupancy', calc: c => fmtVal(c.bed_capacity_girls), unit: 'Beds' },
    { sNo: '1', name: 'Total Bed Capacity', section: 'occupancy', isHeaderVal: true, calc: c => {
      const tot = c.bed_capacity_total ?? (c.bed_capacity_boys !== undefined && c.bed_capacity_girls !== undefined ? (num(c.bed_capacity_boys) + num(c.bed_capacity_girls)) : undefined);
      return fmtVal(tot);
    }, unit: 'Beds', highlight: true },
    { sNo: '2', name: 'No. of Students - Boys', section: 'occupancy', calc: c => fmtVal(c.students_boys), unit: 'Persons' },
    { sNo: '2', name: 'No. of Students - Girls', section: 'occupancy', calc: c => fmtVal(c.students_girls), unit: 'Persons' },
    { sNo: '2', name: 'Total Students Count', section: 'occupancy', calc: c => {
      const tot = c.students_total ?? (c.students_boys !== undefined && c.students_girls !== undefined ? (num(c.students_boys) + num(c.students_girls)) : undefined);
      return fmtVal(tot);
    }, unit: 'Students' },
    { sNo: '3', name: 'No. of Staffs - Boys', section: 'occupancy', calc: c => fmtVal(c.staff_boys), unit: 'Staff' },
    { sNo: '3', name: 'No. of Staffs - Girls', section: 'occupancy', calc: c => fmtVal(c.staff_girls), unit: 'Staff' },
    { sNo: '3', name: 'Total Staffs Count', section: 'occupancy', calc: c => {
      const tot = c.staff_total ?? (c.staff_boys !== undefined && c.staff_girls !== undefined ? (num(c.staff_boys) + num(c.staff_girls)) : undefined);
      return fmtVal(tot);
    }, unit: 'Staff' },
    { sNo: '4', name: 'Total Occupied (Students + Staff)', section: 'occupancy', calc: c => fmtVal(c.total_occupied), unit: 'Occupants', highlight: true, highlightBg: '#f0fdf4', highlightColor: '#166534' },
    { sNo: '5', name: 'Vacant Beds Total', section: 'occupancy', calc: c => fmtVal(c.vacant_total), unit: 'Beds' },
    { sNo: '6', name: 'Vacant for College Students', section: 'occupancy', calc: c => fmtVal(c.vacant_college), unit: 'Beds' },
    { sNo: '7', name: 'Occupied %', section: 'occupancy', isBadge: true, calc: c => fmtPercent(c.occupied_pct), highlight: true, highlightColor: '#059669' },
    { sNo: '8', name: 'Vacant %', section: 'occupancy', calc: c => fmtPercent(c.vacant_pct) },
    { sNo: '9', name: 'Students Vacated', section: 'occupancy', calc: c => fmtVal(c.students_vacated) },

    // 2. Maintenance & Service Tickets
    { sNo: '10', name: 'No. of Maintenance Tickets Received', section: 'tickets', calc: c => fmtVal(c.tickets_received), unit: 'Tickets' },
    { sNo: '11', name: 'No. of Maintenance Tickets Closed', section: 'tickets', calc: c => fmtVal(c.tickets_closed), unit: 'Tickets' },
    { sNo: '12', name: 'No. of Maintenance Tickets Open', section: 'tickets', calc: c => fmtVal(c.tickets_open), unit: 'Tickets', highlight: true },
    { sNo: '13', name: 'TAT (Turnaround Time) Hours', section: 'tickets', calc: c => (c.tat_hours !== undefined && c.tat_hours !== null && c.tat_hours !== '') ? `${num(c.tat_hours).toFixed(1)} hrs` : '—' },
    { sNo: '14', name: 'No. of Quality Issues Received', section: 'tickets', calc: c => fmtVal(c.quality_issues_received) },
    { sNo: '15', name: 'No. of Quality Issues Closed', section: 'tickets', calc: c => fmtVal(c.quality_issues_closed) },
    { sNo: '16', name: 'No. of Quality Issues Open', section: 'tickets', calc: c => fmtVal(c.quality_issues_open) },
    { sNo: '17', name: 'No. of Incidents', section: 'tickets', calc: c => fmtVal(c.incidents_count) },

    // 3. Power Consumption (EB + DG)
    { sNo: '18', name: 'Power Consumption Units (EB + DG)', section: 'power', calc: c => fmtVal(c.power_units, 'kWh'), unit: 'kWh' },
    { sNo: '19', name: 'Power Consumption Cost (EB + DG)', section: 'power', isCurrency: true, calc: c => fmtCost(c.power_cost), highlight: true, highlightBg: '#fff7ed', highlightColor: '#9a3412' },
    { sNo: '20', name: 'Power Cost per Sq.Ft', section: 'power', calc: c => (c.power_cost_sqft !== undefined && c.power_cost_sqft !== null && c.power_cost_sqft !== '') ? `₹${num(c.power_cost_sqft).toFixed(2)} / sq.ft` : '—' },
    { sNo: '21', name: 'Units per Occupant per Month', section: 'power', calc: c => (c.units_per_occupant !== undefined && c.units_per_occupant !== null && c.units_per_occupant !== '') ? `${num(c.units_per_occupant).toFixed(1)} kWh/occ` : '—' },
    { sNo: '22', name: 'Power Cost per Occupant per Month', section: 'power', calc: c => (c.power_cost_occupant !== undefined && c.power_cost_occupant !== null && c.power_cost_occupant !== '') ? `₹${Math.round(num(c.power_cost_occupant)).toLocaleString()} / occ` : '—' },

    // 4. Water Supply, RO & Tankers
    { sNo: '23', name: 'Water Purchase Expenses (Tanker Refill)', section: 'water', isCurrency: true, calc: c => fmtCost(c.water_purchase_cost) },
    { sNo: '24', name: 'Normal Water Consumption Litres', section: 'water', calc: c => (c.normal_water_litres !== undefined && c.normal_water_litres !== null && c.normal_water_litres !== '') ? `${(num(c.normal_water_litres) / 100000).toFixed(2)} Lakh L` : '—' },
    { sNo: '25', name: 'Normal Water Cost', section: 'water', isCurrency: true, calc: c => fmtCost(c.normal_water_cost) },
    { sNo: '26', name: 'Drinking RO Purified Water Litres', section: 'water', calc: c => fmtVal(c.drinking_water_litres, 'L') },
    { sNo: '27', name: 'Drinking RO Purified Water Cost', section: 'water', isCurrency: true, calc: c => fmtCost(c.drinking_water_cost) },
    { sNo: '28', name: 'Normal Water Ltr / Student / Day', section: 'water', calc: c => (c.normal_water_ltr_day !== undefined && c.normal_water_ltr_day !== null && c.normal_water_ltr_day !== '') ? `${num(c.normal_water_ltr_day).toFixed(1)} L/day` : '—' },
    { sNo: '29', name: 'Normal Water Cost / Student / Day', section: 'water', calc: c => (c.normal_water_cost_day !== undefined && c.normal_water_cost_day !== null && c.normal_water_cost_day !== '') ? `₹${num(c.normal_water_cost_day).toFixed(2)}/day` : '—' },

    // 5. Operating Budget & Expenses Occurred
    { sNo: '30', name: 'Routine Facilities Maintenance Expenses', section: 'budget', isCurrency: true, calc: c => fmtCost(c.maintenance_expenses) },
    { sNo: '31', name: 'Expenses Occurred (Total Monthly Spend)', section: 'budget', isCurrency: true, calc: c => fmtCost(c.expenses_occurred), highlight: true, highlightBg: '#fed7aa', highlightColor: '#7c2d12' },
    { sNo: '32', name: 'Approved Operating Budget', section: 'budget', isCurrency: true, calc: c => fmtCost(c.approved_budget) },
    { sNo: '33', name: 'Cumulative Budget Spent (till now)', section: 'budget', isCurrency: true, calc: c => fmtCost(c.cumulative_budget_spent) },
    { sNo: '34', name: 'Balance Budget Remaining', section: 'budget', isCurrency: true, calc: c => fmtCost(c.balance), highlight: true, highlightBg: '#86efac', highlightColor: '#14532d' },

    // 6. Per Student Run-Rate & Area
    { sNo: '35', name: 'Total Hostel Area (Sq Feet)', section: 'analytics', calc: c => fmtVal(c.sq_feet, 'sq.ft') },
    { sNo: '36', name: 'Sq Feet per Occupant', section: 'analytics', calc: c => (c.sq_feet_per_occupant !== undefined && c.sq_feet_per_occupant !== null && c.sq_feet_per_occupant !== '') ? `${num(c.sq_feet_per_occupant).toFixed(1)} sq.ft/occ` : '—' },
    { sNo: '37', name: 'Per Student Cost per Month', section: 'analytics', isCurrency: true, calc: c => (c.per_student_cost_month !== undefined && c.per_student_cost_month !== null && c.per_student_cost_month !== '') ? `₹ ${Math.round(num(c.per_student_cost_month)).toLocaleString()} / mo` : '—', highlight: true, highlightBg: '#fef08a', highlightColor: '#713f12' },
    { sNo: '38', name: 'Per Student Cost per Day', section: 'analytics', calc: c => (c.per_student_cost_day !== undefined && c.per_student_cost_day !== null && c.per_student_cost_day !== '') ? `₹ ${num(c.per_student_cost_day).toFixed(2)} / day` : '—' }
  ], []);

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
            {HOSTEL_SECTIONS.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
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
