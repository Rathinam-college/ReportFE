import React, { useState, useEffect, useMemo } from 'react';
import { formatINR } from '../../utils/formatters';
import { 
  Save, RefreshCw, FileSpreadsheet, CheckCircle2, Zap, Home, 
  AlertCircle, FileText, Check, Plus, Trash2, Edit2, Layers, Table, BedDouble, Users, Droplets, Wrench, ShieldCheck,
  ChevronRight, Calendar, ArrowRight, Settings
} from 'lucide-react';

export default function HostelSpreadsheetEntry({
  activePeriodObj,
  computedMatrix,
  editingPeriodId,
  setEditingPeriodId,
  hostelCensusDraft = {},
  handleHostelCensusChange,
  handleSaveActiveMonth,
  savingBatch,
  isDirty,
  fetchData
}) {
  const [activeView, setActiveView] = useState('sheet'); // 'sheet' (Image 1 Excel layout) or 'multi_month'
  const [parameters, setParameters] = useState([]);
  const [loadingParams, setLoadingParams] = useState(true);
  const [localMessage, setLocalMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const isClosed = !!activePeriodObj?.is_closed;
  const periods = computedMatrix?.periods || [];
  const currPeriodIdStr = String(editingPeriodId);

  // Fetch parameters from Master Data API
  const fetchParameters = async () => {
    try {
      setLoadingParams(true);
      const res = await fetch('/api/hostel/parameters');
      if (res.ok) {
        const data = await res.json();
        setParameters(data);
      }
    } catch (err) {
      console.error('Error fetching hostel parameters:', err);
    } finally {
      setLoadingParams(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, []);

  // --- Helper: Parse numeric safely ---
  const num = (v, defaultVal = 0) => {
    if (v === undefined || v === null || v === '') return defaultVal;
    if (typeof v === 'number') return isNaN(v) ? defaultVal : v;
    const cleaned = String(v).replace(/,/g, '').replace(/%/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  // --- Get current values for the selected period ---
  const currData = hostelCensusDraft[currPeriodIdStr] || {};

  // --- Calculate Live Metrics with Real-time Formulas ---
  const metrics = useMemo(() => {
    const d = currData;

    // 1. Bed Capacity
    const bed_capacity_boys = num(d.bed_capacity_boys, 0);
    const bed_capacity_girls = num(d.bed_capacity_girls, 0);
    const bed_capacity_total = bed_capacity_boys + bed_capacity_girls;

    // 2. Students Count
    const students_boys = num(d.students_boys, 0);
    const students_girls = num(d.students_girls, 0);
    const students_total = students_boys + students_girls;

    // 3. Staffs Count
    const staff_boys = num(d.staff_boys, 0);
    const staff_girls = num(d.staff_girls, 0);
    const staff_total = staff_boys + staff_girls;

    // 4. Total Occupied
    const total_occupied_boys = students_boys + staff_boys;
    const total_occupied_girls = students_girls + staff_girls;
    const total_occupied = total_occupied_boys + total_occupied_girls;

    // 5. Vacant
    const vacant_boys = bed_capacity_boys > 0 ? (bed_capacity_boys - total_occupied_boys) : 0;
    const vacant_girls = bed_capacity_girls > 0 ? (bed_capacity_girls - total_occupied_girls) : 0;
    const vacant_total = (bed_capacity_total > 0 || total_occupied > 0) ? (bed_capacity_total - total_occupied) : 0;

    // 6. Specific Vacancy breakdowns
    const vacant_college_boys = num(d.vacant_college_boys, 0);
    const vacant_college_girls = num(d.vacant_college_girls, 0);
    const vacant_college = vacant_college_boys + vacant_college_girls;

    const vacant_sports_boys = num(d.vacant_sports_boys, 0);
    const vacant_sports_girls = num(d.vacant_sports_girls, 0);
    const vacant_sports_total = vacant_sports_boys + vacant_sports_girls;

    const vacant_school_boys = num(d.vacant_school_boys, 0);
    const vacant_school_girls = num(d.vacant_school_girls, 0);
    const vacant_school_total = vacant_school_boys + vacant_school_girls;

    // 7. Percentages
    const occupied_pct_boys = bed_capacity_boys > 0 ? ((total_occupied_boys / bed_capacity_boys) * 100).toFixed(1) : '0.0';
    const occupied_pct_girls = bed_capacity_girls > 0 ? ((total_occupied_girls / bed_capacity_girls) * 100).toFixed(1) : '0.0';
    const occupied_pct = bed_capacity_total > 0 ? ((total_occupied / bed_capacity_total) * 100).toFixed(1) : '0.0';

    const vacant_pct_boys = bed_capacity_boys > 0 ? ((vacant_boys / bed_capacity_boys) * 100).toFixed(1) : '0.0';
    const vacant_pct_girls = bed_capacity_girls > 0 ? ((vacant_girls / bed_capacity_girls) * 100).toFixed(1) : '0.0';
    const vacant_pct = bed_capacity_total > 0 ? ((vacant_total / bed_capacity_total) * 100).toFixed(1) : '0.0';

    const students_vacated = num(d.students_vacated, 0);

    // 8. Maintenance Tickets
    const tickets_received = num(d.tickets_received, 0);
    const tickets_closed = num(d.tickets_closed, 0);
    const tickets_open = Math.max(0, tickets_received - tickets_closed);
    const total_hours_close = num(d.total_hours_close, 0);
    const tat_hours = num(d.tat_hours, 0);

    // 9. Quality Issues & Incidents
    const quality_issues_received = num(d.quality_issues_received, 0);
    const quality_issues_closed = num(d.quality_issues_closed, 0);
    const quality_issues_open = Math.max(0, quality_issues_received - quality_issues_closed);
    const incidents_count = num(d.incidents_count, 0);

    // 10. Expenses & Utilities
    const power_units = num(d.power_units, 0);
    const power_cost = num(d.power_cost, 0);
    const water_purchase_cost = num(d.water_purchase_cost, 0);
    const maintenance_expenses = num(d.maintenance_expenses, 0);
    const expenses_occurred = num(d.expenses_occurred, 0);

    // 11. Budget
    const approved_budget = num(d.approved_budget, 0);
    const cumulative_budget_spent = num(d.cumulative_budget_spent, 0);
    const balance = (approved_budget > 0 || cumulative_budget_spent > 0) ? (approved_budget - cumulative_budget_spent) : 0;

    // 12. Area & Per Student Metrics
    const sq_feet = num(d.sq_feet, 0);
    const per_student_cost_month = students_total > 0 ? Math.round(expenses_occurred / students_total) : 0;
    const per_student_cost_day = per_student_cost_month > 0 ? Math.round(per_student_cost_month / 30) : 0;
    const sq_feet_per_occupant = total_occupied > 0 ? Math.round(sq_feet / total_occupied) : 0;

    // 13. Water Metrics (Image 2)
    const normal_water_litres = num(d.normal_water_litres, 0);
    const normal_water_cost = num(d.normal_water_cost, 0);
    const normal_water_student_ltrs = num(d.normal_water_student_ltrs, 0);
    const normal_water_student_cost = num(d.normal_water_student_cost, 0);

    const power_cost_sqft = sq_feet > 0 ? (power_cost / sq_feet).toFixed(1) : '0.0';
    const units_per_occupant = total_occupied > 0 ? (power_units / total_occupied).toFixed(1) : '0.0';
    const power_cost_occupant = total_occupied > 0 ? Math.round(power_cost / total_occupied) : 0;

    const normal_water_ltr_day = total_occupied > 0 ? (normal_water_litres / total_occupied / 30).toFixed(2) : '0.00';
    const normal_water_cost_day = total_occupied > 0 ? (normal_water_cost / total_occupied / 30).toFixed(2) : '0.00';

    const drinking_water_litres = num(d.drinking_water_litres, 0);
    const drinking_water_cost = num(d.drinking_water_cost, 0);
    const drinking_water_ltr_day = total_occupied > 0 ? (drinking_water_litres / total_occupied / 30).toFixed(2) : '0.00';
    const drinking_water_cost_day = total_occupied > 0 ? (drinking_water_cost / total_occupied / 30).toFixed(2) : '0.00';

    return {
      bed_capacity_boys, bed_capacity_girls, bed_capacity_total,
      students_boys, students_girls, students_total,
      staff_boys, staff_girls, staff_total,
      total_occupied_boys, total_occupied_girls, total_occupied,
      vacant_boys, vacant_girls, vacant_total,
      vacant_college_boys, vacant_college_girls, vacant_college,
      vacant_sports_boys, vacant_sports_girls, vacant_sports_total,
      vacant_school_boys, vacant_school_girls, vacant_school_total,
      occupied_pct_boys, occupied_pct_girls, occupied_pct,
      vacant_pct_boys, vacant_pct_girls, vacant_pct,
      students_vacated,
      tickets_received, tickets_closed, tickets_open, total_hours_close, tat_hours,
      quality_issues_received, quality_issues_closed, quality_issues_open, incidents_count,
      power_units, power_cost, water_purchase_cost, maintenance_expenses, expenses_occurred,
      approved_budget, cumulative_budget_spent, balance,
      sq_feet, per_student_cost_month, per_student_cost_day, sq_feet_per_occupant,
      normal_water_litres, normal_water_cost, normal_water_student_ltrs, normal_water_student_cost,
      power_cost_sqft, units_per_occupant, power_cost_occupant,
      normal_water_ltr_day, normal_water_cost_day,
      drinking_water_litres, drinking_water_cost, drinking_water_ltr_day, drinking_water_cost_day
    };
  }, [currData]);

  // Update a field in the draft
  const handleValChange = (field, val) => {
    handleHostelCensusChange?.(field, val, editingPeriodId);
  };

  // Save current month to PostgreSQL backend
  const handleSaveMonth = async () => {
    try {
      setIsSaving(true);
      setLocalMessage(null);

      // Merge metrics and all custom fields
      const payload = {
        ...metrics,
        ...currData
      };

      const res = await fetch(`/api/hostel-census/${editingPeriodId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save hostel data');
      }

      setLocalMessage({
        type: 'success',
        text: `Hostel spreadsheet data for ${activePeriodObj?.period_label || 'Active Month'} saved to PostgreSQL successfully!`
      });

      if (fetchData) fetchData();
    } catch (err) {
      setLocalMessage({
        type: 'error',
        text: err.message || 'Error saving hostel spreadsheet'
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setLocalMessage(null), 5000);
    }
  };

  // Copy values from immediately preceding month
  const handleCloneFromPreviousMonth = () => {
    const curIdx = periods.findIndex(p => String(p.id) === currPeriodIdStr);
    if (curIdx <= 0) {
      setLocalMessage({
        type: 'error',
        text: 'No previous month found to copy from.'
      });
      setTimeout(() => setLocalMessage(null), 4000);
      return;
    }

    const prevP = periods[curIdx - 1];
    const prevData = hostelCensusDraft[String(prevP.id)];
    if (!prevData || Object.keys(prevData).length === 0) {
      setLocalMessage({
        type: 'error',
        text: `Previous month (${prevP.period_label}) has no saved data to copy.`
      });
      setTimeout(() => setLocalMessage(null), 4000);
      return;
    }

    // Cleanly copy data to active month
    handleHostelCensusChange?.(prevData, null, editingPeriodId);
    setLocalMessage({
      type: 'success',
      text: `Values copied from ${prevP.period_label}. Review and click Save.`
    });
    setTimeout(() => setLocalMessage(null), 5000);
  };

  // Group custom parameters added in Master Data
  const customParameters = useMemo(() => {
    return parameters.filter(p => !p.is_system);
  }, [parameters]);

  // Live parameter helpers synced with Master Data
  const isParamActive = (key) => {
    if (!parameters || parameters.length === 0) return true;
    return parameters.some(p => p.param_key === key && p.is_active !== false);
  };

  const getParamSNo = (key, defaultSNo) => {
    const found = parameters.find(p => p.param_key === key);
    return (found && found.s_no) ? found.s_no : defaultSNo;
  };

  const getParamName = (key, defaultName) => {
    const found = parameters.find(p => p.param_key === key);
    return (found && found.param_name) ? found.param_name : defaultName;
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '2px solid #00a2e8',
      boxShadow: '0 4px 16px rgba(0, 162, 232, 0.08)',
      overflow: 'hidden',
      marginBottom: '24px'
    }}>
      
      {/* 1. TOP TOOLBAR & HEADER */}
      <div style={{
        backgroundColor: '#00a2e8',
        padding: '14px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        color: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            color: '#00a2e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}>
            <Home size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Hostel Operations & Census Master Spreadsheet
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                padding: '2px 8px',
                borderRadius: '12px',
                color: '#ffffff'
              }}>
                Excel Sheet
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#e0f2fe' }}>
              Exact multi-parameter spreadsheet format • Live calculation formulas • Saves directly to PostgreSQL
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCloneFromPreviousMonth}
            disabled={isClosed}
            title="Copy values from previous month into this month"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 15px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '700',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              cursor: isClosed ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            📋 Copy Previous Month
          </button>

          <button
            type="button"
            onClick={handleSaveMonth}
            disabled={isSaving || isClosed}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 20px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#0087c2',
              fontSize: '13px',
              fontWeight: '800',
              border: 'none',
              cursor: isSaving || isClosed ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
            }}
          >
            {isSaving ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}
            <span>💾 Save Month Data</span>
          </button>
        </div>
      </div>

      {/* 2. NOTIFICATION BANNER */}
      {localMessage && (
        <div style={{
          padding: '10px 20px',
          backgroundColor: localMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
          borderBottom: `1px solid ${localMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: localMessage.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '12.5px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {localMessage.type === 'success' ? <CheckCircle2 size={16} color="#059669" /> : <AlertCircle size={16} color="#dc2626" />}
          <span>{localMessage.text}</span>
        </div>
      )}

      {/* 3. CYCLE SWITCHER & VIEW TOGGLE */}
      <div style={{
        backgroundColor: '#f0f9ff',
        padding: '10px 20px',
        borderBottom: '1px solid #bae6fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Billing Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            📅 Active Month:
          </span>
          {periods.map(p => {
            const isSel = String(p.id) === currPeriodIdStr;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setEditingPeriodId(p.id)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '800',
                  border: isSel ? '2px solid #00a2e8' : '1px solid #cbd5e1',
                  backgroundColor: isSel ? '#00a2e8' : '#ffffff',
                  color: isSel ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: isSel ? '0 2px 4px rgba(0, 162, 232, 0.25)' : 'none'
                }}
              >
                <span>{p.period_label}</span>
                {isSel && <Check size={12} color="#ffffff" />}
              </button>
            );
          })}
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffffff', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <button
            type="button"
            onClick={() => setActiveView('sheet')}
            style={{
              padding: '4px 14px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeView === 'sheet' ? '#00a2e8' : 'transparent',
              color: activeView === 'sheet' ? '#ffffff' : '#64748b'
            }}
          >
            📋 Excel Spreadsheet ({activePeriodObj?.period_label})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('multi_month')}
            style={{
              padding: '4px 14px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeView === 'multi_month' ? '#00a2e8' : 'transparent',
              color: activeView === 'multi_month' ? '#ffffff' : '#64748b'
            }}
          >
            📊 Multi-Month Ledger View
          </button>
        </div>
      </div>

      {/* 4. FORMULA BAR RIBBON */}
      <div style={{
        padding: '7px 20px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '12px'
      }}>
        <div style={{ fontWeight: '800', color: '#00a2e8', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>fx</span>
        </div>
        <div style={{ height: '14px', width: '1px', backgroundColor: '#e2e8f0' }} />
        <div style={{ fontFamily: 'monospace', color: '#475569', fontSize: '11.5px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <strong>Occupied:</strong> =Students + Staffs | <strong>Vacant:</strong> =Bed Capacity - Occupied | <strong>Balance:</strong> =Budget - Spent | <strong>Per Student Cost:</strong> =Expenses / Students
        </div>
      </div>

      {/* 5. MAIN SPREADSHEET (IMAGE 1 & IMAGE 2 EXACT DESIGN) */}
      {activeView === 'sheet' && (
        <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            border: '2px solid #000000',
            backgroundColor: '#ffffff'
          }}>
            {/* Header: S.No | Parameters | [Selected Month: Boys | Girls | Total] | Cost */}
            <thead>
              <tr style={{
                backgroundColor: '#f1f5f9',
                color: '#000000',
                borderBottom: '2px solid #000000',
                fontWeight: '800',
                fontSize: '13px'
              }}>
                <th rowSpan={2} style={{ width: '55px', textAlign: 'center', padding: '8px 4px', borderRight: '1px solid #000000' }}>
                  S.No
                </th>
                <th rowSpan={2} style={{ minWidth: '320px', textAlign: 'left', padding: '8px 16px', borderRight: '1px solid #000000' }}>
                  Parameters
                </th>
                <th colSpan={3} style={{ textAlign: 'center', padding: '8px 12px', borderRight: '1px solid #000000', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                  {activePeriodObj?.period_label || 'Selected Month'}
                </th>
                <th rowSpan={2} style={{ width: '160px', textAlign: 'center', padding: '8px 12px' }}>
                  Cost (₹)
                </th>
              </tr>
              <tr style={{
                backgroundColor: '#f8fafc',
                color: '#000000',
                borderBottom: '2px solid #000000',
                fontWeight: '800',
                fontSize: '12.5px'
              }}>
                <th style={{ width: '110px', textAlign: 'center', padding: '6px 8px', borderRight: '1px solid #000000', backgroundColor: '#e0f2fe' }}>
                  Boys
                </th>
                <th style={{ width: '110px', textAlign: 'center', padding: '6px 8px', borderRight: '1px solid #000000', backgroundColor: '#e0f2fe' }}>
                  Girls
                </th>
                <th style={{ width: '120px', textAlign: 'center', padding: '6px 8px', borderRight: '1px solid #000000', backgroundColor: '#bae6fd', color: '#0369a1' }}>
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {/* ================================================================ */}
              {/* SECTION 1: CENSUS & OCCUPANCY (Image 1 Rows 1 - 7) */}
              {/* ================================================================ */}
              
              {/* Row 1: Bed Capacity */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>1</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Bed Capacity</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.bed_capacity_boys ?? ''}
                    onChange={(e) => handleValChange('bed_capacity_boys', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.bed_capacity_girls ?? ''}
                    onChange={(e) => handleValChange('bed_capacity_girls', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', backgroundColor: '#f1f5f9', borderRight: '1px solid #000000' }}>
                  {metrics.bed_capacity_total}
                </td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* Row 2: No. of students */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>2</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>No. of students</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.students_boys ?? ''}
                    onChange={(e) => handleValChange('students_boys', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.students_girls ?? ''}
                    onChange={(e) => handleValChange('students_girls', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', backgroundColor: '#f1f5f9', borderRight: '1px solid #000000' }}>
                  {metrics.students_total}
                </td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* Row 3: No. of staffs */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>3</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>No. of staffs</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.staff_boys ?? ''}
                    onChange={(e) => handleValChange('staff_boys', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.staff_girls ?? ''}
                    onChange={(e) => handleValChange('staff_girls', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', backgroundColor: '#f1f5f9', borderRight: '1px solid #000000' }}>
                  {metrics.staff_total}
                </td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* Row 4: Total Occupied */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>4</td>
                <td style={{ padding: '6px 14px', fontWeight: '800', color: '#0369a1', borderRight: '1px solid #000000' }}>Total Occupied</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', borderRight: '1px solid #000000' }}>
                  {metrics.total_occupied_boys}
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', borderRight: '1px solid #000000' }}>
                  {metrics.total_occupied_girls}
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', backgroundColor: '#e0f2fe', color: '#0369a1', borderRight: '1px solid #000000' }}>
                  {metrics.total_occupied}
                </td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* Row 5: Vacant */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>5</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Vacant</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '700', borderRight: '1px solid #000000' }}>
                  {metrics.vacant_boys}
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '700', borderRight: '1px solid #000000' }}>
                  {metrics.vacant_girls}
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', backgroundColor: '#f1f5f9', borderRight: '1px solid #000000' }}>
                  {metrics.vacant_total}
                </td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* Row 6: Vacant for college students */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>6</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Vacant for college students</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.vacant_college_boys ?? ''}
                    onChange={(e) => handleValChange('vacant_college_boys', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.vacant_college_girls ?? ''}
                    onChange={(e) => handleValChange('vacant_college_girls', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', backgroundColor: '#f1f5f9', borderRight: '1px solid #000000' }}>
                  {metrics.vacant_college}
                </td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* Vacant for sports students */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}></td>
                <td style={{ padding: '6px 14px', color: '#475569', borderRight: '1px solid #000000' }}>Vacant for college sports students (KPM hostel)</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.vacant_sports_boys ?? ''}
                    onChange={(e) => handleValChange('vacant_sports_boys', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                  />
                </td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.vacant_sports_girls ?? ''}
                    onChange={(e) => handleValChange('vacant_sports_girls', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                  />
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right', borderRight: '1px solid #000000', backgroundColor: '#f1f5f9' }}>
                  {metrics.vacant_sports_total || '—'}
                </td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* Vacant for school students */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}></td>
                <td style={{ padding: '6px 14px', color: '#475569', borderRight: '1px solid #000000' }}>Vacant for school students</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.vacant_school_boys ?? ''}
                    onChange={(e) => handleValChange('vacant_school_boys', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                  />
                </td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.vacant_school_girls ?? ''}
                    onChange={(e) => handleValChange('vacant_school_girls', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                  />
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right', borderRight: '1px solid #000000', backgroundColor: '#f1f5f9' }}>
                  {metrics.vacant_school_total || '—'}
                </td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* Occupied % */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f0fdf4' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}></td>
                <td style={{ padding: '6px 14px', fontWeight: '800', color: '#166534', borderRight: '1px solid #000000' }}>Occupied %</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '700', borderRight: '1px solid #000000' }}>{metrics.occupied_pct_boys}%</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '700', borderRight: '1px solid #000000' }}>{metrics.occupied_pct_girls}%</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', color: '#166534', backgroundColor: '#dcfce7', borderRight: '1px solid #000000' }}>
                  {metrics.occupied_pct}%
                </td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* Vacant % */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}></td>
                <td style={{ padding: '6px 14px', fontWeight: '700', color: '#64748b', borderRight: '1px solid #000000' }}>Vacant %</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', borderRight: '1px solid #000000' }}>{metrics.vacant_pct_boys}%</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', borderRight: '1px solid #000000' }}>{metrics.vacant_pct_girls}%</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '700', backgroundColor: '#f1f5f9', borderRight: '1px solid #000000' }}>
                  {metrics.vacant_pct}%
                </td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* Students Vacated */}
              <tr style={{ borderBottom: '2px solid #000000' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}></td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Students Vacated</td>
                <td colSpan={2} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.students_vacated ?? ''}
                    onChange={(e) => handleValChange('students_vacated', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* ================================================================ */}
              {/* SECTION 2: MAINTENANCE & QUALITY TICKETS (Yellow / Orange in Image 1) */}
              {/* ================================================================ */}
              
              {/* Row 8: Maintenance Tickets Received */}
              <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fed7aa' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>8</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>No. of Maintenance Tickets Received</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.tickets_received ?? ''}
                    onChange={(e) => handleValChange('tickets_received', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #000000', borderRadius: '3px', fontWeight: '700', backgroundColor: '#fff' }}
                  />
                </td>
                <td colSpan={2} style={{ borderRight: '1px solid #000000', backgroundColor: '#fed7aa' }}></td>
                <td style={{ borderRight: 'none', backgroundColor: '#fed7aa', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#1d4ed8' }}>
                  Space basic tickets
                </td>
              </tr>

              {/* Row 9: Tickets Closed */}
              <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fed7aa' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>9</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>No. of Maintenance Tickets closed</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.tickets_closed ?? ''}
                    onChange={(e) => handleValChange('tickets_closed', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #000000', borderRadius: '3px', fontWeight: '700', backgroundColor: '#fff' }}
                  />
                </td>
                <td colSpan={2} style={{ borderRight: '1px solid #000000', backgroundColor: '#fed7aa' }}></td>
                <td style={{ borderRight: 'none', backgroundColor: '#fed7aa' }}></td>
              </tr>

              {/* Row 10: Tickets Open */}
              <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fed7aa' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>10</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>No. of Maintenance Tickets in Open</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', borderRight: '1px solid #000000' }}>
                  {metrics.tickets_open}
                </td>
                <td colSpan={2} style={{ borderRight: '1px solid #000000', backgroundColor: '#fed7aa' }}></td>
                <td style={{ borderRight: 'none', backgroundColor: '#fed7aa' }}></td>
              </tr>

              {/* Row 11: Total Hours taken */}
              <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fed7aa' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>11</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Total Hours taken to close the tickets</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={currData.total_hours_close ?? ''}
                    onChange={(e) => handleValChange('total_hours_close', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #000000', borderRadius: '3px', fontWeight: '700', backgroundColor: '#fff' }}
                  />
                </td>
                <td colSpan={2} style={{ borderRight: '1px solid #000000', backgroundColor: '#fed7aa' }}></td>
                <td style={{ borderRight: 'none', backgroundColor: '#fed7aa' }}></td>
              </tr>

              {/* Row 12: TAT Hours */}
              <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fed7aa' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>12</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>TAT (Turnaround Time)Hours</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={currData.tat_hours ?? ''}
                    onChange={(e) => handleValChange('tat_hours', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #000000', borderRadius: '3px', fontWeight: '700', backgroundColor: '#fff' }}
                  />
                </td>
                <td colSpan={2} style={{ borderRight: '1px solid #000000', backgroundColor: '#fed7aa' }}></td>
                <td style={{ borderRight: 'none', backgroundColor: '#fed7aa' }}></td>
              </tr>

              {/* Row 13: Quality issues Received */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>13</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>No. of Quality issues Received</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.quality_issues_received ?? ''}
                    onChange={(e) => handleValChange('quality_issues_received', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
                <td colSpan={2} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* Row 14: Quality issues Closed */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>14</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>No. of Quality issues Closed</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.quality_issues_closed ?? ''}
                    onChange={(e) => handleValChange('quality_issues_closed', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
                <td colSpan={2} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* Row 15: Quality issues Open */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>15</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>No. of Quality issues in Open</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', borderRight: '1px solid #000000' }}>
                  {metrics.quality_issues_open}
                </td>
                <td colSpan={2} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* Row 16: No. of Incidents */}
              <tr style={{ borderBottom: '2px solid #000000' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>16</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>No. of Incidents</td>
                <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                  <input
                    type="number"
                    value={currData.incidents_count ?? ''}
                    onChange={(e) => handleValChange('incidents_count', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
                <td colSpan={2} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
              </tr>

              {/* ================================================================ */}
              {/* SECTION 3: UTILITIES & OPERATING EXPENSES (Salmon / Orange in Image 1) */}
              {/* ================================================================ */}
              
              {/* Row 17: Power Consumption */}
              <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#ffedd5' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>17</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Power Consumption</td>
                <td colSpan={3} style={{ padding: '4px 8px', borderRight: '1px solid #000000', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Units:</span>
                    <input
                      type="number"
                      value={currData.power_units ?? ''}
                      onChange={(e) => handleValChange('power_units', e.target.value)}
                      disabled={isClosed}
                      placeholder="0"
                      style={{ width: '130px', textAlign: 'right', padding: '4px 6px', border: '1px solid #000000', borderRadius: '3px', fontWeight: '700', backgroundColor: '#fff' }}
                    />
                  </div>
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.power_cost ?? ''}
                    onChange={(e) => handleValChange('power_cost', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #000000', borderRadius: '3px', fontWeight: '800', backgroundColor: '#fff' }}
                    className="currency-font"
                  />
                </td>
              </tr>

              {/* Row 18: Water Purchase Expenses */}
              <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#ffedd5' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>18</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Water Purchase Expenses</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#ffedd5' }}></td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.water_purchase_cost ?? ''}
                    onChange={(e) => handleValChange('water_purchase_cost', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #000000', borderRadius: '3px', fontWeight: '800', backgroundColor: '#fff' }}
                    className="currency-font"
                  />
                </td>
              </tr>

              {/* Row: Maintenance Expenses */}
              <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#ffedd5' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}></td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Maintenance Expenses</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#ffedd5' }}></td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.maintenance_expenses ?? ''}
                    onChange={(e) => handleValChange('maintenance_expenses', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #000000', borderRadius: '3px', fontWeight: '800', backgroundColor: '#fff' }}
                    className="currency-font"
                  />
                </td>
              </tr>

              {/* Row 20: Expenses occurred */}
              <tr style={{ borderBottom: '2px solid #000000', backgroundColor: '#fed7aa' }}>
                <td style={{ textAlign: 'center', fontWeight: '800', padding: '6px 4px', borderRight: '1px solid #000000' }}>20</td>
                <td style={{ padding: '6px 14px', fontWeight: '800', borderRight: '1px solid #000000' }}>Expenses occurred</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#fed7aa' }}></td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.expenses_occurred ?? ''}
                    onChange={(e) => handleValChange('expenses_occurred', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #000000', borderRadius: '3px', fontWeight: '900', backgroundColor: '#fff', color: '#000' }}
                    className="currency-font"
                  />
                </td>
              </tr>

              {/* ================================================================ */}
              {/* SECTION 4: BUDGET & FINANCIAL BALANCE (Green in Image 1) */}
              {/* ================================================================ */}
              
              {/* Row 22: Approved Budget */}
              <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#bbf7d0' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>22</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Approved Budget</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#bbf7d0' }}></td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.approved_budget ?? ''}
                    onChange={(e) => handleValChange('approved_budget', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #000000', borderRadius: '3px', fontWeight: '800', backgroundColor: '#fff' }}
                    className="currency-font"
                  />
                </td>
              </tr>

              {/* Row 23: Cumulative Budget spent */}
              <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#bbf7d0' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>23</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Cumulative Budget spent (Actual expenses) till now</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#bbf7d0' }}></td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.cumulative_budget_spent ?? ''}
                    onChange={(e) => handleValChange('cumulative_budget_spent', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #000000', borderRadius: '3px', fontWeight: '800', backgroundColor: '#fff' }}
                    className="currency-font"
                  />
                </td>
              </tr>

              {/* Row 24: Balance */}
              <tr style={{ borderBottom: '2px solid #000000', backgroundColor: '#86efac' }}>
                <td style={{ textAlign: 'center', fontWeight: '800', padding: '6px 4px', borderRight: '1px solid #000000' }}>24</td>
                <td style={{ padding: '6px 14px', fontWeight: '800', borderRight: '1px solid #000000' }}>Balance</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#86efac' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '900', color: '#14532d', fontSize: '13.5px' }} className="currency-font">
                  {formatINR(metrics.balance)}
                </td>
              </tr>

              {/* ================================================================ */}
              {/* SECTION 5: PER STUDENT & AREA METRICS (White in Image 1) */}
              {/* ================================================================ */}
              
              {/* Row 25: Number of students */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>25</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Number of students</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>
                  {metrics.students_total.toLocaleString()}
                </td>
              </tr>

              {/* Row 26: Per student cost per month */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>26</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Per student cost per month</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }} className="currency-font">
                  ₹ {metrics.per_student_cost_month.toLocaleString()}
                </td>
              </tr>

              {/* Row 27: Per student cost per day */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>27</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Per student cost per day</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }} className="currency-font">
                  ₹ {metrics.per_student_cost_day.toLocaleString()}
                </td>
              </tr>

              {/* Sq feet */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}></td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Sq feet</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.sq_feet ?? ''}
                    onChange={(e) => handleValChange('sq_feet', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
              </tr>

              {/* Sq feet per occupant */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}></td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Sq feet per occupant in hostel</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>
                  {metrics.sq_feet_per_occupant}
                </td>
              </tr>

              {/* Row 28: Normal water per student per month */}
              <tr style={{ borderBottom: '2px solid #000000', backgroundColor: '#fef08a' }}>
                <td style={{ textAlign: 'center', fontWeight: '800', padding: '6px 4px', borderRight: '1px solid #000000' }}>28</td>
                <td style={{ padding: '6px 14px', fontWeight: '800', borderRight: '1px solid #000000' }}>Normal water per student per month(Ltrs& cost)</td>
                <td colSpan={3} style={{ padding: '4px 8px', borderRight: '1px solid #000000', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Ltrs:</span>
                    <input
                      type="number"
                      value={currData.normal_water_student_ltrs ?? ''}
                      onChange={(e) => handleValChange('normal_water_student_ltrs', e.target.value)}
                      disabled={isClosed}
                      placeholder="0"
                      style={{ width: '100px', textAlign: 'right', padding: '4px 6px', border: '1px solid #000', borderRadius: '3px', fontWeight: '700', backgroundColor: '#fff' }}
                    />
                  </div>
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.normal_water_student_cost ?? ''}
                    onChange={(e) => handleValChange('normal_water_student_cost', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #000', borderRadius: '3px', fontWeight: '800', backgroundColor: '#fff' }}
                  />
                </td>
              </tr>

              {/* ================================================================ */}
              {/* SECTION 6: WATER & UTILITIES DEEP DIVE (Image 2 Metrics) */}
              {/* ================================================================ */}
              <tr style={{ backgroundColor: '#bae6fd', color: '#0369a1', fontWeight: '800', borderBottom: '2px solid #000000' }}>
                <td colSpan={6} style={{ padding: '8px 16px', fontSize: '12.5px', letterSpacing: '0.03em' }}>
                  ⚡ WATER, POWER CONSUMPTION & DAILY EFFICIENCY METRICS (IMAGE 2 LEDGER)
                </td>
              </tr>

              {/* Power cost per sqft */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>•</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Power cost per sq feet</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>₹ {metrics.power_cost_sqft}</td>
              </tr>

              {/* Units per occupant */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>•</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Units per occupant per month - Hostel</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>{metrics.units_per_occupant} kWh</td>
              </tr>

              {/* Power cost per occupant */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>•</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Power cost Per occupant per month - Hostel</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>₹ {metrics.power_cost_occupant}</td>
              </tr>

              {/* Normal Water Consumption Ltr */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f0f9ff' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>•</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Normal Water Consumption Ltr Hostels</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f0f9ff' }}></td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.normal_water_litres ?? ''}
                    onChange={(e) => handleValChange('normal_water_litres', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
              </tr>

              {/* Normal Water Consumption Cost */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f0f9ff' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>•</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Normal Water Consumption Cost Hostels</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f0f9ff' }}></td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.normal_water_cost ?? ''}
                    onChange={(e) => handleValChange('normal_water_cost', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                    className="currency-font"
                  />
                </td>
              </tr>

              {/* Normal water Ltr per student per day */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>•</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Normal water Ltr per student per day - Hostels</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>{metrics.normal_water_ltr_day} L</td>
              </tr>

              {/* Normal Water cost Per student per day */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>•</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Normal Water cost Per student per day Hostels</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>₹ {metrics.normal_water_cost_day}</td>
              </tr>

              {/* Drinking Water Consumption Litres */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f0fdf4' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>•</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Drinking Water Consumption Litres Hostels</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f0fdf4' }}></td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.drinking_water_litres ?? ''}
                    onChange={(e) => handleValChange('drinking_water_litres', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
              </tr>

              {/* Drinking Water Consumption Cost */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f0fdf4' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>•</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Drinking Water Consumption Cost Hostels</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f0fdf4' }}></td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.drinking_water_cost ?? ''}
                    onChange={(e) => handleValChange('drinking_water_cost', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                    className="currency-font"
                  />
                </td>
              </tr>

              {/* Drinking water Litres per student per day */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>•</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Drinking water Litres per student per day- Hostels</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>{metrics.drinking_water_ltr_day} L</td>
              </tr>

              {/* Drinking Water cost Per student per day */}
              <tr style={{ borderBottom: '2px solid #000000' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>•</td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Drinking Water cost Per student per day Hostels</td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>₹ {metrics.drinking_water_cost_day}</td>
              </tr>

              {/* ================================================================ */}
              {/* SECTION 7: DYNAMIC CUSTOM PARAMETERS ADDED IN MASTER DATA */}
              {/* ================================================================ */}
              {customParameters.length > 0 && (
                <>
                  <tr style={{ backgroundColor: '#faf5ff', color: '#7e22ce', fontWeight: '800', borderBottom: '2px solid #000000' }}>
                    <td colSpan={6} style={{ padding: '8px 16px', fontSize: '12.5px', letterSpacing: '0.03em' }}>
                      ✨ CUSTOM PARAMETERS (CONFIGURED FROM MASTER DATA)
                    </td>
                  </tr>
                  {customParameters.map((cp, cIdx) => {
                    const cKey = cp.param_key;
                    const cVal = currData[cKey] ?? '';

                    return (
                      <tr key={cp.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000', color: '#7e22ce', fontWeight: '700' }}>
                          {cp.s_no || `C${cIdx + 1}`}
                        </td>
                        <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{cp.param_name}</span>
                            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>({cp.section})</span>
                          </div>
                        </td>

                        {cp.input_type === 'boys_girls_total' ? (
                          <>
                            <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                              <input
                                type="number"
                                value={currData[`${cKey}_boys`] ?? ''}
                                onChange={(e) => handleValChange(`${cKey}_boys`, e.target.value)}
                                disabled={isClosed}
                                style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                              />
                            </td>
                            <td style={{ padding: '4px 6px', borderRight: '1px solid #000000' }}>
                              <input
                                type="number"
                                value={currData[`${cKey}_girls`] ?? ''}
                                onChange={(e) => handleValChange(`${cKey}_girls`, e.target.value)}
                                disabled={isClosed}
                                style={{ width: '100%', textAlign: 'right', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                              />
                            </td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', backgroundColor: '#f1f5f9', borderRight: '1px solid #000000' }}>
                              {(num(currData[`${cKey}_boys`]) + num(currData[`${cKey}_girls`])) || '—'}
                            </td>
                            <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
                          </>
                        ) : (
                          <>
                            <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}>
                              {cp.formula && (
                                <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', paddingLeft: '8px' }}>
                                  Formula: = {cp.formula}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                              <input
                                type={cp.input_type === 'cost' || cp.input_type === 'single_number' ? 'number' : 'text'}
                                value={cVal}
                                onChange={(e) => handleValChange(cKey, e.target.value)}
                                disabled={isClosed}
                                placeholder={cp.unit ? `0 ${cp.unit}` : 'Enter value'}
                                style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. MULTI-MONTH LEDGER VIEW (Comparison across all billing cycles) */}
      {activeView === 'multi_month' && (
        <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12.5px',
            border: '2px solid #000000',
            backgroundColor: '#ffffff'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#00a2e8',
                color: '#ffffff',
                borderBottom: '2px solid #000000',
                fontWeight: '800'
              }}>
                <th style={{ padding: '10px 14px', minWidth: '220px', textAlign: 'left', borderRight: '1px solid #000000' }}>
                  Parameters
                </th>
                {periods.map(p => {
                  const isSel = String(p.id) === currPeriodIdStr;
                  return (
                    <th
                      key={p.id}
                      style={{
                        padding: '10px 12px',
                        minWidth: '120px',
                        textAlign: 'center',
                        borderRight: '1px solid #000000',
                        backgroundColor: isSel ? '#0ea5e9' : '#00a2e8',
                        color: '#ffffff',
                        fontWeight: '800'
                      }}
                    >
                      {p.period_label} {isSel && '★'}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Bed Capacity Total */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '8px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Bed Capacity</td>
                {periods.map(p => {
                  const d = hostelCensusDraft[String(p.id)] || {};
                  const b = num(d.bed_capacity_boys, 2223);
                  const g = num(d.bed_capacity_girls, 896);
                  return (
                    <td key={p.id} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', borderRight: '1px solid #000000' }}>
                      {b + g}
                    </td>
                  );
                })}
              </tr>

              {/* Total Occupied */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f0fdf4' }}>
                <td style={{ padding: '8px 14px', fontWeight: '800', color: '#166534', borderRight: '1px solid #000000' }}>Total Occupied</td>
                {periods.map(p => {
                  const d = hostelCensusDraft[String(p.id)] || {};
                  const sb = num(d.students_boys, 2075);
                  const sg = num(d.students_girls, 768);
                  const fb = num(d.staff_boys, 72);
                  const fg = num(d.staff_girls, 59);
                  return (
                    <td key={p.id} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '800', color: '#166534', borderRight: '1px solid #000000' }}>
                      {sb + sg + fb + fg}
                    </td>
                  );
                })}
              </tr>

              {/* Occupied % */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '8px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Occupied %</td>
                {periods.map(p => {
                  const d = hostelCensusDraft[String(p.id)] || {};
                  const b = num(d.bed_capacity_boys, 2223) + num(d.bed_capacity_girls, 896);
                  const occ = num(d.students_boys, 2075) + num(d.students_girls, 768) + num(d.staff_boys, 72) + num(d.staff_girls, 59);
                  const pct = b > 0 ? ((occ / b) * 100).toFixed(1) : '0';
                  return (
                    <td key={p.id} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', borderRight: '1px solid #000000' }}>
                      {pct}%
                    </td>
                  );
                })}
              </tr>

              {/* Power Units */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#ffedd5' }}>
                <td style={{ padding: '8px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Power Consumption (Units)</td>
                {periods.map(p => {
                  const d = hostelCensusDraft[String(p.id)] || {};
                  return (
                    <td key={p.id} style={{ padding: '8px 12px', textAlign: 'right', borderRight: '1px solid #000000' }}>
                      {num(d.power_units, 108201).toLocaleString()}
                    </td>
                  );
                })}
              </tr>

              {/* Power Cost */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#ffedd5' }}>
                <td style={{ padding: '8px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Power Cost (₹)</td>
                {periods.map(p => {
                  const d = hostelCensusDraft[String(p.id)] || {};
                  return (
                    <td key={p.id} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', borderRight: '1px solid #000000' }} className="currency-font">
                      {formatINR(num(d.power_cost, 1325151))}
                    </td>
                  );
                })}
              </tr>

              {/* Water Purchase Expenses */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '8px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Water Purchase Expenses</td>
                {periods.map(p => {
                  const d = hostelCensusDraft[String(p.id)] || {};
                  return (
                    <td key={p.id} style={{ padding: '8px 12px', textAlign: 'right', borderRight: '1px solid #000000' }} className="currency-font">
                      {formatINR(num(d.water_purchase_cost, 248765))}
                    </td>
                  );
                })}
              </tr>

              {/* Expenses occurred */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#fed7aa' }}>
                <td style={{ padding: '8px 14px', fontWeight: '800', borderRight: '1px solid #000000' }}>Expenses occurred (Total Spend)</td>
                {periods.map(p => {
                  const d = hostelCensusDraft[String(p.id)] || {};
                  return (
                    <td key={p.id} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '800', borderRight: '1px solid #000000' }} className="currency-font">
                      {formatINR(num(d.expenses_occurred, 9349172))}
                    </td>
                  );
                })}
              </tr>

              {/* Per student cost per month */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '8px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Per student cost per month</td>
                {periods.map(p => {
                  const d = hostelCensusDraft[String(p.id)] || {};
                  const st = num(d.students_boys, 2075) + num(d.students_girls, 768);
                  const exp = num(d.expenses_occurred, 9349172);
                  const psc = st > 0 ? Math.round(exp / st) : 3288;
                  return (
                    <td key={p.id} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', borderRight: '1px solid #000000' }} className="currency-font">
                      ₹ {psc.toLocaleString()}
                    </td>
                  );
                })}
              </tr>

              {/* Balance */}
              <tr style={{ borderBottom: '2px solid #000000', backgroundColor: '#86efac' }}>
                <td style={{ padding: '8px 14px', fontWeight: '900', borderRight: '1px solid #000000' }}>Balance Budget</td>
                {periods.map(p => {
                  const d = hostelCensusDraft[String(p.id)] || {};
                  const ab = num(d.approved_budget, 131788118);
                  const cb = num(d.cumulative_budget_spent, 34527814);
                  return (
                    <td key={p.id} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '900', color: '#14532d', borderRight: '1px solid #000000' }} className="currency-font">
                      {formatINR(ab - cb)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 7. FOOTER BAR WITH DIRECT LINK TO MASTER DATA */}
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '12px 20px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
          <span>💡 Need to add or change parameters?</span>
          <span style={{ fontWeight: '700', color: '#0f172a' }}>
            Go to Master Data → Hostel Occupancy → Add Parameter / Row
          </span>
        </div>

        <button
          type="button"
          onClick={handleSaveMonth}
          disabled={isSaving || isClosed}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 18px',
            borderRadius: '6px',
            backgroundColor: '#00a2e8',
            color: '#ffffff',
            fontSize: '12.5px',
            fontWeight: '700',
            border: 'none',
            cursor: isSaving || isClosed ? 'not-allowed' : 'pointer'
          }}
        >
          {isSaving ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
          <span>Save Active Month ({activePeriodObj?.period_label})</span>
        </button>
      </div>

    </div>
  );
}
