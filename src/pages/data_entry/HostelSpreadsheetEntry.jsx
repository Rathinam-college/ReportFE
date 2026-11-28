import React, { useState, useEffect, useMemo } from 'react';
import { formatINR } from '../../utils/formatters';
import MonthlyAttachmentsModal from '../../components/attachments/MonthlyAttachmentsModal';
import { 
  Save, RefreshCw, FileSpreadsheet, CheckCircle2, Zap, Home, 
  AlertCircle, FileText, Check, Plus, Trash2, Edit2, Layers, Table, BedDouble, Users, Droplets, Wrench, ShieldCheck,
  ChevronRight, Calendar, ArrowRight, Settings, TrendingUp, TrendingDown, Paperclip
} from 'lucide-react';
import HostelCardSpreadsheet from './cards/HostelCardSpreadsheet';
import {
  HOSTEL_BUDGET_HEADS,
  TOTAL_SANCTIONED_BUDGET,
  TOTAL_MONTH_LIMIT,
  TOTAL_OCT_ACTUAL,
  getBudgetMonthCol
} from '../../utils/hostelBudgetConstants';

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
  fetchData,
  handleCloneFromPrev,
  handleToggleLock
}) {
  const [activeView, setActiveView] = useState('cards'); // 'cards' (card-based dashboard), 'sheet' (Image 1 Excel layout) or 'multi_month'
  const [parameters, setParameters] = useState([]);
  const [loadingParams, setLoadingParams] = useState(true);
  const [localMessage, setLocalMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);

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

    // 11. Official 9 Budget Heads Calculation for Active Month
    const activeMonthCol = getBudgetMonthCol(activePeriodObj, editingPeriodId);
    const trackingRows = computedMatrix?.hostel_budget_tracking || [];

    const budget_heads_breakdown = {};
    const budget_heads_sanctioned = {};
    const budget_heads_limit = {};
    let budget_heads_total = 0;
    let total_sanctioned_budget = 0;
    let total_month_limit = 0;

    HOSTEL_BUDGET_HEADS.forEach((h) => {
      const match = trackingRows.find(r => r.budget_head === h.head || Number(r.s_no) === h.s_no);

      // Sanctioned Amount: user draft > DB table value > constant fallback
      let sancVal = null;
      if (d['sanctioned_' + h.key] !== undefined && d['sanctioned_' + h.key] !== null && d['sanctioned_' + h.key] !== '') {
        sancVal = num(d['sanctioned_' + h.key], h.sanctioned);
      } else if (match && match.sanctioned_amount !== undefined && match.sanctioned_amount !== null && Number(match.sanctioned_amount) >= 0) {
        sancVal = num(match.sanctioned_amount, h.sanctioned);
      } else {
        sancVal = h.sanctioned;
      }
      budget_heads_sanctioned[h.key] = sancVal;
      total_sanctioned_budget += sancVal;

      // Month Limit: user draft > DB table value > constant fallback
      let limitVal = null;
      if (d['limit_' + h.key] !== undefined && d['limit_' + h.key] !== null && d['limit_' + h.key] !== '') {
        limitVal = num(d['limit_' + h.key], h.limit);
      } else if (match && match.month_limit !== undefined && match.month_limit !== null && Number(match.month_limit) >= 0) {
        limitVal = num(match.month_limit, h.limit);
      } else {
        limitVal = h.limit;
      }
      budget_heads_limit[h.key] = limitVal;
      total_month_limit += limitVal;

      // Actual Spend for this month: user draft > DB table month actual > 0
      let val = null;
      if (d[h.key] !== undefined && d[h.key] !== null && d[h.key] !== '') {
        val = num(d[h.key], 0);
      } else if (match && match[activeMonthCol] !== undefined && match[activeMonthCol] !== null) {
        val = num(match[activeMonthCol], 0);
      } else {
        val = 0;
      }
      budget_heads_breakdown[h.key] = val;
      budget_heads_total += val;
    });

    // Expenses occurred is driven by sum of 9 budget heads
    const expenses_occurred = budget_heads_total > 0 ? budget_heads_total : num(d.expenses_occurred, 0);

    // Approved Budget defaults to total_sanctioned_budget if not overridden
    const approved_budget = num(d.approved_budget, total_sanctioned_budget > 0 ? total_sanctioned_budget : TOTAL_SANCTIONED_BUDGET);

    // Cumulative spent: if set in draft use it; else if period 30 (Oct'26), defaults to expenses_occurred
    let cumulative_budget_spent = num(d.cumulative_budget_spent, 0);
    if (cumulative_budget_spent === 0 && expenses_occurred > 0) {
      cumulative_budget_spent = expenses_occurred;
    }
    const balance = (approved_budget > 0 || cumulative_budget_spent > 0) ? (approved_budget - cumulative_budget_spent) : 0;

    // 12. Area & Per Student Metrics
    const sq_feet = num(d.sq_feet, 0);
    const per_student_cost_month = total_occupied > 0 ? Math.round(expenses_occurred / total_occupied) : (students_total > 0 ? Math.round(expenses_occurred / students_total) : 0);
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
      budget_heads_breakdown, budget_heads_total, activeMonthCol,
      budget_heads_sanctioned, budget_heads_limit,
      total_sanctioned_budget, total_month_limit,
      sq_feet, per_student_cost_month, per_student_cost_day, sq_feet_per_occupant,
      normal_water_litres, normal_water_cost, normal_water_student_ltrs, normal_water_student_cost,
      power_cost_sqft, units_per_occupant, power_cost_occupant,
      normal_water_ltr_day, normal_water_cost_day,
      drinking_water_litres, drinking_water_cost, drinking_water_ltr_day, drinking_water_cost_day
    };
  }, [currData, computedMatrix, activePeriodObj, editingPeriodId]);

  // Update a field in the draft
  const handleValChange = (field, val) => {
    handleHostelCensusChange?.(field, val, editingPeriodId);
  };

  // Save current month to PostgreSQL backend
  const handleSaveMonth = async () => {
    try {
      setIsSaving(true);
      setLocalMessage(null);

      const activeMonthCol = getBudgetMonthCol(activePeriodObj, editingPeriodId);

      // 1. Sync 9 budget heads to PostgreSQL table hostel_budget_tracking
      const trackingItems = HOSTEL_BUDGET_HEADS.map(h => ({
        s_no: h.s_no,
        budget_head: h.head,
        sanctioned_amount: Number(metrics.budget_heads_sanctioned?.[h.key] ?? h.sanctioned),
        month_limit: Number(metrics.budget_heads_limit?.[h.key] ?? h.limit),
        [activeMonthCol]: Number(metrics.budget_heads_breakdown?.[h.key] ?? 0)
      }));

      try {
        await fetch('/api/hostel/budget-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: trackingItems })
        });
      } catch (trackErr) {
        console.warn('Hostel budget tracking API notice:', trackErr);
      }

      // 2. Save full census entry to /api/hostel-census/${editingPeriodId}
      const payload = {
        ...metrics,
        ...currData,
        ...metrics.budget_heads_breakdown,
        budget_heads_sanctioned: metrics.budget_heads_sanctioned,
        budget_heads_limit: metrics.budget_heads_limit,
        total_sanctioned_budget: metrics.total_sanctioned_budget,
        total_month_limit: metrics.total_month_limit,
        approved_budget: metrics.approved_budget,
        cumulative_budget_spent: metrics.cumulative_budget_spent,
        expenses_occurred: metrics.expenses_occurred,
        balance: metrics.balance
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
        text: `Hostel data & budget for ${activePeriodObj?.period_label || 'Active Month'} saved to PostgreSQL successfully!`
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
    return parameters.filter(p => !p.is_system && p.is_active !== false);
  }, [parameters]);

  // Known canonical sections
  const knownSections = [
    'occupancy & census',
    'maintenance & quality tickets',
    'utilities & operational expenses',
    'budget & financial balance',
    'per student & area metrics',
    'water & utilities deep dive'
  ];

  // Custom parameters outside known sections
  const uncategorizedCustomParams = useMemo(() => {
    return (parameters || []).filter(
      p => !p.is_system && p.is_active !== false && !knownSections.includes((p.section || '').toLowerCase().trim())
    );
  }, [parameters]);

  // Live parameter helpers synced with Master Data
  const isParamActive = (key) => {
    if (!parameters || parameters.length === 0) return true;
    return parameters.some(p => p.param_key === key && p.is_active !== false);
  };

  const getParamSNo = (key, defaultSNo = '') => {
    const found = parameters.find(p => p.param_key === key);
    return (found && found.s_no !== undefined && found.s_no !== null) ? found.s_no : defaultSNo;
  };

  const getParamName = (key, defaultName = '') => {
    const found = parameters.find(p => p.param_key === key);
    return (found && found.param_name) ? found.param_name : defaultName;
  };

  // Helper to render custom parameters that belong to a specific section
  const renderCustomParamsForSection = (sectionName) => {
    const list = (parameters || [])
      .filter(
        p => !p.is_system && p.is_active !== false && (p.section || '').toLowerCase().trim() === sectionName.toLowerCase().trim()
      )
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    if (!list.length) return null;
    return list.map((cp, cIdx) => {
      const cKey = cp.param_key;
      const cVal = currData[cKey] ?? '';

      return (
        <tr key={cp.id || cKey} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#faf5ff' }}>
          <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000', color: '#7e22ce', fontWeight: '700' }}>
            {cp.s_no || `+`}
          </td>
          <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{cp.param_name}</span>
              <span style={{ fontSize: '10px', color: '#7e22ce', backgroundColor: '#f3e8ff', padding: '1px 5px', borderRadius: '4px' }}>Custom</span>
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
              <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#fdf4ff' }}>
                {cp.formula && (
                  <span style={{ fontSize: '11px', color: '#7e22ce', fontStyle: 'italic', paddingLeft: '8px' }}>
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
                  style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #d8b4fe', borderRadius: '3px', fontWeight: '700' }}
                />
              </td>
            </>
          )}
        </tr>
      );
    });
  };

  if (activeView === 'cards') {
    return (
      <HostelCardSpreadsheet
        periods={periods}
        editingPeriodId={editingPeriodId}
        setEditingPeriodId={setEditingPeriodId}
        activePeriodObj={activePeriodObj}
        isClosed={isClosed}
        currData={currData}
        metrics={metrics}
        handleValChange={handleValChange}
        handleSaveMonth={handleSaveMonth}
        isSaving={isSaving}
        localMessage={localMessage}
        handleCloneFromPreviousMonth={handleCloneFromPreviousMonth}
        handleToggleLock={handleToggleLock}
        parameters={parameters}
        viewMode={activeView}
        setViewMode={setActiveView}
        computedMatrix={computedMatrix}
      />
    );
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      border: '1px solid #edf0f8',
      boxShadow: '0 4px 20px rgba(110, 80, 180, 0.05)',
      overflow: 'hidden',
      marginBottom: '24px'
    }}>
      
      {/* 1. TOP TOOLBAR & HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #0aa0e8 0%, #0670c9 100%)',
        padding: '18px 24px',
        borderRadius: '20px',
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
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            color: '#6c56db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
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
                borderRadius: '9999px',
                color: '#ffffff'
              }}>
                Excel Sheet
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
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
              padding: '9px 18px',
              borderRadius: '9999px',
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
            onClick={() => setShowAttachmentsModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '700',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Upload or view bills, presentations, documents & attachments for this month"
          >
            <Paperclip size={13} color="#ffffff" />
            <span>Attachments & Bills</span>
          </button>

          <button
            type="button"
            onClick={handleSaveMonth}
            disabled={isSaving || isClosed}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 22px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #ff7e9e 0%, #ff4b72 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '800',
              border: 'none',
              cursor: isSaving || isClosed ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(255, 96, 136, 0.35)',
              transition: 'all 0.15s ease'
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
                  padding: '6px 18px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: isSel ? '800' : '600',
                  border: 'none',
                  backgroundColor: isSel ? '#0aa0e8' : '#ffffff',
                  color: isSel ? '#ffffff' : '#6e768e',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: isSel ? '0 4px 12px rgba(10, 160, 232, 0.35)' : 'none'
                }}
              >
                <span>{p.period_label}</span>
                {isSel && <span style={{ fontSize: '11px', color: '#ffffff' }}>★</span>}
              </button>
            );
          })}
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffffff', padding: '3px', borderRadius: '9999px', border: '1px solid #edf0f8' }}>
          <button
            type="button"
            onClick={() => setActiveView('cards')}
            style={{
              padding: '5px 16px',
              borderRadius: '9999px',
              fontSize: '11.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeView === 'cards' ? '#0aa0e8' : 'transparent',
              color: activeView === 'cards' ? '#ffffff' : '#6e768e',
              transition: 'all 0.15s ease'
            }}
          >
            🗂️ Cards View
          </button>
          <button
            type="button"
            onClick={() => setActiveView('sheet')}
            style={{
              padding: '5px 16px',
              borderRadius: '9999px',
              fontSize: '11.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeView === 'sheet' ? '#6c56db' : 'transparent',
              color: activeView === 'sheet' ? '#ffffff' : '#6e768e',
              transition: 'all 0.15s ease'
            }}
          >
            📋 Excel Spreadsheet ({activePeriodObj?.period_label})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('multi_month')}
            style={{
              padding: '5px 16px',
              borderRadius: '9999px',
              fontSize: '11.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeView === 'multi_month' ? '#6c56db' : 'transparent',
              color: activeView === 'multi_month' ? '#ffffff' : '#6e768e',
              transition: 'all 0.15s ease'
            }}
          >
            📊 Multi-Month Ledger View
          </button>
        </div>
      </div>

      {/* 4. FORMULA BAR RIBBON */}
      <div style={{
        padding: '8px 22px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #edf0f8',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '12px'
      }}>
        <div style={{ fontWeight: '800', color: '#6c56db', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
              {isParamActive('bed_capacity') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('bed_capacity', '1')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('bed_capacity', 'Bed Capacity')}
                  </td>
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
              )}

              {/* Row 2: No. of students */}
              {isParamActive('students_count') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('students_count', '2')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('students_count', 'No. of students')}
                  </td>
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
              )}

              {/* Row 3: No. of staffs */}
              {isParamActive('staff_count') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('staff_count', '3')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('staff_count', 'No. of staffs')}
                  </td>
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
              )}

              {/* Row 4: Total Occupied */}
              {isParamActive('total_occupied') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('total_occupied', '4')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '800', color: '#0369a1', borderRight: '1px solid #000000' }}>
                    {getParamName('total_occupied', 'Total Occupied')}
                  </td>
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
              )}

              {/* Row 5: Vacant */}
              {isParamActive('vacant') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('vacant', '5')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('vacant', 'Vacant')}
                  </td>
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
              )}

              {/* Row 6: Vacant for college students */}
              {isParamActive('vacant_college') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('vacant_college', '6')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('vacant_college', 'Vacant for college students')}
                  </td>
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
              )}

              {/* Vacant for sports students */}
              {isParamActive('vacant_sports') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('vacant_sports', '')}
                  </td>
                  <td style={{ padding: '6px 14px', color: '#475569', borderRight: '1px solid #000000' }}>
                    {getParamName('vacant_sports', 'Vacant for college sports students (KPM hostel)')}
                  </td>
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
              )}

              {/* Vacant for school students */}
              {isParamActive('vacant_school') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('vacant_school', '')}
                  </td>
                  <td style={{ padding: '6px 14px', color: '#475569', borderRight: '1px solid #000000' }}>
                    {getParamName('vacant_school', 'Vacant for school students')}
                  </td>
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
              )}

              {/* Occupied % */}
              {isParamActive('occupied_pct') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f0fdf4' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('occupied_pct', '')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '800', color: '#166534', borderRight: '1px solid #000000' }}>
                    {getParamName('occupied_pct', 'Occupied %')}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '700', borderRight: '1px solid #000000' }}>{metrics.occupied_pct_boys}%</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '700', borderRight: '1px solid #000000' }}>{metrics.occupied_pct_girls}%</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', color: '#166534', backgroundColor: '#dcfce7', borderRight: '1px solid #000000' }}>
                    {metrics.occupied_pct}%
                  </td>
                  <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
                </tr>
              )}

              {/* Vacant % */}
              {isParamActive('vacant_pct') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('vacant_pct', '')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', color: '#64748b', borderRight: '1px solid #000000' }}>
                    {getParamName('vacant_pct', 'Vacant %')}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', borderRight: '1px solid #000000' }}>{metrics.vacant_pct_boys}%</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', borderRight: '1px solid #000000' }}>{metrics.vacant_pct_girls}%</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '700', backgroundColor: '#f1f5f9', borderRight: '1px solid #000000' }}>
                    {metrics.vacant_pct}%
                  </td>
                  <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
                </tr>
              )}

              {/* Students Vacated */}
              {isParamActive('students_vacated') && (
                <tr style={{ borderBottom: '2px solid #000000' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('students_vacated', '')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('students_vacated', 'Students Vacated')}
                  </td>
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
              )}

              {/* Custom Parameters dynamically added to Section 1 in Master Data */}
              {renderCustomParamsForSection('Occupancy & Census')}

              {/* ================================================================ */}
              {/* SECTION 2: MAINTENANCE & QUALITY TICKETS (Yellow / Orange in Image 1) */}
              {/* ================================================================ */}
              
              {/* Row 8: Maintenance Tickets Received */}
              {isParamActive('tickets_received') && (
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fed7aa' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('tickets_received', '8')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('tickets_received', 'No. of Maintenance Tickets Received')}
                  </td>
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
              )}

              {/* Row 9: Tickets Closed */}
              {isParamActive('tickets_closed') && (
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fed7aa' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('tickets_closed', '9')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('tickets_closed', 'No. of Maintenance Tickets closed')}
                  </td>
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
              )}

              {/* Row 10: Tickets Open */}
              {isParamActive('tickets_open') && (
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fed7aa' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('tickets_open', '10')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('tickets_open', 'No. of Maintenance Tickets in Open')}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', borderRight: '1px solid #000000' }}>
                    {metrics.tickets_open}
                  </td>
                  <td colSpan={2} style={{ borderRight: '1px solid #000000', backgroundColor: '#fed7aa' }}></td>
                  <td style={{ borderRight: 'none', backgroundColor: '#fed7aa' }}></td>
                </tr>
              )}

              {/* Row 11: Total Hours taken */}
              {isParamActive('total_hours_close') && (
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fed7aa' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('total_hours_close', '11')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('total_hours_close', 'Total Hours taken to close the tickets')}
                  </td>
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
              )}

              {/* Row 12: TAT Hours */}
              {isParamActive('tat_hours') && (
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fed7aa' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('tat_hours', '12')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('tat_hours', 'TAT (Turnaround Time)Hours')}
                  </td>
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
              )}

              {/* Row 13: Quality issues Received */}
              {isParamActive('quality_issues_received') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('quality_issues_received', '13')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('quality_issues_received', 'No. of Quality issues Received')}
                  </td>
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
              )}

              {/* Row 14: Quality issues Closed */}
              {isParamActive('quality_issues_closed') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('quality_issues_closed', '14')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('quality_issues_closed', 'No. of Quality issues Closed')}
                  </td>
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
              )}

              {/* Row 15: Quality issues Open */}
              {isParamActive('quality_issues_open') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('quality_issues_open', '15')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('quality_issues_open', 'No. of Quality issues in Open')}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800', borderRight: '1px solid #000000' }}>
                    {metrics.quality_issues_open}
                  </td>
                  <td colSpan={2} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                  <td style={{ borderRight: 'none', backgroundColor: '#f8fafc' }}></td>
                </tr>
              )}

              {/* Row 16: No. of Incidents */}
              {isParamActive('incidents_count') && (
                <tr style={{ borderBottom: '2px solid #000000' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('incidents_count', '16')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('incidents_count', 'No. of Incidents')}
                  </td>
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
              )}

              {/* Custom Parameters dynamically added to Section 2 in Master Data */}
              {renderCustomParamsForSection('Maintenance & Quality Tickets')}

              {/* ================================================================ */}
              {/* SECTION 3: UTILITIES & OPERATING EXPENSES (Salmon / Orange in Image 1) */}
              {/* ================================================================ */}
              
              {/* Row 17: Power Consumption */}
              {isParamActive('power_consumption') && (
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#ffedd5' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('power_consumption', '17')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('power_consumption', 'Power Consumption')}
                  </td>
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
              )}

              {/* Row 18: Water Purchase Expenses */}
              {isParamActive('water_purchase_cost') && (
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#ffedd5' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('water_purchase_cost', '18')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('water_purchase_cost', 'Water Purchase Expenses')}
                  </td>
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
              )}

              {/* Row: Maintenance Expenses */}
              {isParamActive('maintenance_expenses') && (
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#ffedd5' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('maintenance_expenses', '')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('maintenance_expenses', 'Maintenance Expenses')}
                  </td>
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
              )}

              {/* Row 20: Expenses occurred */}
              {isParamActive('expenses_occurred') && (
                <tr style={{ borderBottom: '2px solid #000000', backgroundColor: '#fed7aa' }}>
                  <td style={{ textAlign: 'center', fontWeight: '800', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('expenses_occurred', '20')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '800', borderRight: '1px solid #000000' }}>
                    {getParamName('expenses_occurred', 'Expenses occurred (Total Spend)')}
                  </td>
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
              )}

              {/* Custom Parameters dynamically added to Section 3 in Master Data */}
              {renderCustomParamsForSection('Utilities & Operational Expenses')}

              {/* ================================================================ */}
              {/* SECTION 4: BUDGET & FINANCIAL BALANCE (Green in Image 1) */}
              {/* ================================================================ */}
              
              {/* Row 22: Approved Budget */}
              {isParamActive('approved_budget') && (
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#bbf7d0' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('approved_budget', '22')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '800', borderRight: '1px solid #000000', color: '#166534' }}>
                    {getParamName('approved_budget', 'Approved Budget (Sanctioned)')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#bbf7d0', fontSize: '12px', fontWeight: '700', color: '#166534', padding: '6px 12px' }}>
                    Official 8-Month Cycle Baseline (Oct'26 – May'27)
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                    <input
                      type="number"
                      value={currData.approved_budget ?? metrics.approved_budget}
                      onChange={(e) => handleValChange('approved_budget', e.target.value)}
                      disabled={isClosed}
                      placeholder="142010789"
                      style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #16a34a', borderRadius: '3px', fontWeight: '900', backgroundColor: '#fff', color: '#14532d' }}
                      className="currency-font"
                    />
                  </td>
                </tr>
              )}

              {/* 9 Canonical Budget Heads Breakdown Sub-Table */}
              <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', borderBottom: '2px solid #000000' }}>
                <td style={{ textAlign: 'center', fontWeight: '800', padding: '6px 4px', borderRight: '1px solid rgba(255,255,255,0.2)', fontSize: '11px', color: '#93c5fd' }}>
                  22.*
                </td>
                <td style={{ padding: '6px 14px', fontWeight: '800', borderRight: '1px solid rgba(255,255,255,0.2)', fontSize: '12px', color: '#f8fafc' }}>
                  Hostel Budget Heads ({activePeriodObj?.period_label || 'Selected Month'})
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '700', borderRight: '1px solid rgba(255,255,255,0.2)', fontSize: '11px', color: '#86efac', width: '130px' }}>
                  Sanctioned (₹)
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '700', borderRight: '1px solid rgba(255,255,255,0.2)', fontSize: '11px', color: '#93c5fd', width: '130px' }}>
                  Share of Spend (%)
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '800', fontSize: '11.5px', color: '#ffffff', width: '160px' }}>
                  Actual Spend (₹)
                </td>
              </tr>

              {HOSTEL_BUDGET_HEADS.map((head) => {
                const headVal = metrics.budget_heads_breakdown[head.key] ?? 0;
                const headSanctioned = metrics.budget_heads_sanctioned?.[head.key] ?? head.sanctioned;
                const headLimit = metrics.budget_heads_limit?.[head.key] ?? head.limit;
                const diff = headLimit - headVal;
                const isUnder = diff >= 0;

                return (
                  <tr 
                    key={head.key} 
                    style={{ 
                      borderBottom: '1px solid #cbd5e1', 
                      backgroundColor: head.s_no % 2 === 0 ? '#f8fafc' : '#ffffff',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #e2e8f0', color: '#64748b', fontSize: '11.5px' }}>
                      22.{head.s_no}
                    </td>
                    <td style={{ padding: '6px 14px', fontWeight: '600', borderRight: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12.5px' }}>
                      {head.head}
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #e2e8f0', width: '130px' }}>
                      <input
                        type="number"
                        value={currData['sanctioned_' + head.key] ?? headSanctioned}
                        onChange={(e) => handleValChange('sanctioned_' + head.key, e.target.value)}
                        disabled={isClosed}
                        placeholder={String(head.sanctioned)}
                        style={{
                          width: '100%',
                          textAlign: 'right',
                          padding: '4px 6px',
                          border: '1px solid #94a3b8',
                          borderRadius: '4px',
                          fontWeight: '750',
                          backgroundColor: '#ffffff',
                          color: '#166534',
                          fontSize: '12px'
                        }}
                        className="currency-font"
                      />
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8'
                        }}
                      >
                        {metrics.budget_heads_total > 0 ? ((headVal / metrics.budget_heads_total) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                      <input
                        type="number"
                        value={currData[head.key] ?? headVal}
                        onChange={(e) => handleValChange(head.key, e.target.value)}
                        disabled={isClosed}
                        placeholder="0"
                        style={{
                          width: '100%',
                          textAlign: 'right',
                          padding: '4px 8px',
                          border: isUnder ? '1px solid #94a3b8' : '1.5px solid #ef4444',
                          borderRadius: '4px',
                          fontWeight: '800',
                          backgroundColor: isUnder ? '#ffffff' : '#fff1f2',
                          color: '#0f172a',
                          fontSize: '12.5px'
                        }}
                        className="currency-font"
                      />
                    </td>
                  </tr>
                );
              })}

              {/* Total Monthly 9 Heads Spend Row */}
              <tr style={{ borderBottom: '2px solid #000000', backgroundColor: '#fef08a' }}>
                <td style={{ textAlign: 'center', fontWeight: '900', padding: '6px 4px', borderRight: '1px solid #000000', fontSize: '11px', color: '#854d0e' }}>
                  ∑
                </td>
                <td style={{ padding: '6px 14px', fontWeight: '900', borderRight: '1px solid #000000', color: '#854d0e', fontSize: '13px' }}>
                  Total Monthly Expenses (9 Heads Sum)
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #000000', fontWeight: '900', color: '#166534', fontSize: '12.5px' }} className="currency-font">
                  {formatINR(metrics.total_sanctioned_budget ?? TOTAL_SANCTIONED_BUDGET)}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #000000', fontWeight: '900', color: '#c2410c', fontSize: '12.5px' }} className="currency-font">
                  {formatINR(metrics.total_month_limit ?? TOTAL_MONTH_LIMIT)}
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #000000' }}>
                  {(() => {
                    const totalLimit = metrics.total_month_limit ?? TOTAL_MONTH_LIMIT;
                    const totalDiff = totalLimit - metrics.budget_heads_total;
                    const isTotalUnder = totalDiff >= 0;
                    return (
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: '900',
                          backgroundColor: isTotalUnder ? '#bbf7d0' : '#fecaca',
                          color: isTotalUnder ? '#14532d' : '#991b1b'
                        }}
                      >
                        {isTotalUnder ? `✓ Under ${formatINR(totalDiff)}` : `⚠ Over ${formatINR(Math.abs(totalDiff))}`}
                      </span>
                    );
                  })()}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '900', color: '#000000', fontSize: '13.5px' }} className="currency-font">
                  {formatINR(metrics.budget_heads_total)}
                </td>
              </tr>

              {/* Row 23: Cumulative Budget spent */}
              {isParamActive('cumulative_budget_spent') && (
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#bbf7d0' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('cumulative_budget_spent', '23')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('cumulative_budget_spent', 'Cumulative Budget spent (Actual expenses) till now')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#bbf7d0', fontSize: '11.5px', color: '#166534', padding: '6px 12px' }}>
                    Auto-accumulated actual spend across periods
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                    <input
                      type="number"
                      value={currData.cumulative_budget_spent ?? metrics.cumulative_budget_spent}
                      onChange={(e) => handleValChange('cumulative_budget_spent', e.target.value)}
                      disabled={isClosed}
                      placeholder="0"
                      style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #000000', borderRadius: '3px', fontWeight: '800', backgroundColor: '#fff' }}
                      className="currency-font"
                    />
                  </td>
                </tr>
              )}

              {/* Row 24: Balance */}
              {isParamActive('balance') && (
                <tr style={{ borderBottom: '2px solid #000000', backgroundColor: '#86efac' }}>
                  <td style={{ textAlign: 'center', fontWeight: '800', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('balance', '24')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '800', borderRight: '1px solid #000000' }}>
                    {getParamName('balance', 'Balance')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#86efac' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '900', color: '#14532d', fontSize: '13.5px' }} className="currency-font">
                    {formatINR(metrics.balance)}
                  </td>
                </tr>
              )}

              {/* Custom Parameters dynamically added to Section 4 in Master Data */}
              {renderCustomParamsForSection('Budget & Financial Balance')}

              {/* ================================================================ */}
              {/* SECTION 5: PER STUDENT & AREA METRICS (White in Image 1) */}
              {/* ================================================================ */}
              
              {/* Row 25: Number of students */}
              {isParamActive('students_kpi') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('students_kpi', '25')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('students_kpi', 'Number of students')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>
                    {metrics.students_total.toLocaleString()}
                  </td>
                </tr>
              )}

              {/* Row 26: Per student cost per month */}
              {isParamActive('per_student_cost_month') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('per_student_cost_month', '26')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('per_student_cost_month', 'Per student cost per month')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }} className="currency-font">
                    ₹ {metrics.per_student_cost_month.toLocaleString()}
                  </td>
                </tr>
              )}

              {/* Row 27: Per student cost per day */}
              {isParamActive('per_student_cost_day') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', fontWeight: '700', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('per_student_cost_day', '27')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('per_student_cost_day', 'Per student cost per day')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }} className="currency-font">
                    ₹ {metrics.per_student_cost_day.toLocaleString()}
                  </td>
                </tr>
              )}

              {/* Sq feet */}
              {isParamActive('sq_feet') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('sq_feet', '')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('sq_feet', 'Sq feet (Hostel Area)')}
                  </td>
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
              )}

              {/* Sq feet per occupant */}
              {isParamActive('sq_feet_per_occupant') && (
                <tr style={{ borderBottom: '1px solid #000000' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('sq_feet_per_occupant', '')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('sq_feet_per_occupant', 'Sq feet per occupant in hostel')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>
                    {metrics.sq_feet_per_occupant}
                  </td>
                </tr>
              )}

              {/* Row 28: Normal water per student per month */}
              {isParamActive('normal_water_student_month') && (
                <tr style={{ borderBottom: '2px solid #000000', backgroundColor: '#fef08a' }}>
                  <td style={{ textAlign: 'center', fontWeight: '800', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('normal_water_student_month', '28')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '800', borderRight: '1px solid #000000' }}>
                    {getParamName('normal_water_student_month', 'Normal water per student per month (Ltrs & cost)')}
                  </td>
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
              )}

              {/* Custom Parameters dynamically added to Section 5 in Master Data */}
              {renderCustomParamsForSection('Per Student & Area Metrics')}

              {/* ================================================================ */}
              {/* SECTION 6: WATER & UTILITIES DEEP DIVE (Image 2 Metrics) */}
              {/* ================================================================ */}
              <tr style={{ backgroundColor: '#bae6fd', color: '#0369a1', fontWeight: '800', borderBottom: '2px solid #000000' }}>
                <td colSpan={6} style={{ padding: '8px 16px', fontSize: '12.5px', letterSpacing: '0.03em' }}>
                  ⚡ WATER, POWER CONSUMPTION & DAILY EFFICIENCY METRICS (IMAGE 2 LEDGER)
                </td>
              </tr>

              {/* Power consumption units(EB + DG) Hostel */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#eff6ff' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                  {getParamSNo('power_units', '34')}
                </td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                  {getParamName('power_units', 'Power consumption units(EB + DG) Hostel')}
                </td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#eff6ff' }}></td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.power_units ?? ''}
                    onChange={(e) => handleValChange('power_units', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                  />
                </td>
              </tr>

              {/* Power consumption cost(EB + DG) Hostel */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#eff6ff' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                  {getParamSNo('power_cost', '35')}
                </td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                  {getParamName('power_cost', 'Power consumption cost(EB + DG) Hostel')}
                </td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#eff6ff' }}></td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={currData.power_cost ?? ''}
                    onChange={(e) => handleValChange('power_cost', e.target.value)}
                    disabled={isClosed}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'right', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: '700' }}
                    className="currency-font"
                  />
                </td>
              </tr>

              {/* No of Students+ staff in Hostel */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#eff6ff' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                  {getParamSNo('occupants_power', '36')}
                </td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                  {getParamName('occupants_power', 'No of Students+ staff in Hostel')}
                </td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>{metrics.total_occupied}</td>
              </tr>

              {/* Sq feet Hostel */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#eff6ff' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                  {getParamSNo('sq_feet', '37')}
                </td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                  {getParamName('sq_feet', 'Sq feet Hostel')}
                </td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#eff6ff' }}></td>
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

              {/* Power cost per sqft */}
              {isParamActive('power_cost_sqft') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('power_cost_sqft', '•')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('power_cost_sqft', 'Power cost per sq feet')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>₹ {metrics.power_cost_sqft}</td>
                </tr>
              )}

              {/* Units per occupant */}
              {isParamActive('units_per_occupant') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('units_per_occupant', '•')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('units_per_occupant', 'Units per occupant per month - Hostel')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>{metrics.units_per_occupant} kWh</td>
                </tr>
              )}

              {/* Power cost per occupant */}
              {isParamActive('power_cost_occupant') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('power_cost_occupant', '•')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('power_cost_occupant', 'Power cost Per occupant per month - Hostel')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>₹ {metrics.power_cost_occupant}</td>
                </tr>
              )}

              {/* Normal Water Consumption Ltr */}
              {isParamActive('normal_water_litres') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f0fdf4' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('normal_water_litres', '•')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('normal_water_litres', 'Normal Water Consumption Ltr Hostels')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f0fdf4' }}></td>
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
              )}

              {/* Normal Water Consumption Cost */}
              {isParamActive('normal_water_cost') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f0fdf4' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('normal_water_cost', '•')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('normal_water_cost', 'Normal Water Consumption Cost Hostels')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f0fdf4' }}></td>
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
              )}

              {/* No of Students in Hostels (Normal Water) */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f0fdf4' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                  {getParamSNo('students_normal_water', '•')}
                </td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                  {getParamName('students_normal_water', 'No of Staff + Students in Hostels')}
                </td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>{metrics.total_occupied}</td>
              </tr>

              {/* Normal water Ltr per student per day */}
              {isParamActive('normal_water_ltr_day') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('normal_water_ltr_day', '•')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('normal_water_ltr_day', 'Normal water Ltr per student per day - Hostels')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>{metrics.normal_water_ltr_day} L</td>
                </tr>
              )}

              {/* Normal Water cost Per student per day */}
              {isParamActive('normal_water_cost_day') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('normal_water_cost_day', '•')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('normal_water_cost_day', 'Normal Water cost Per student per day Hostels')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>₹ {metrics.normal_water_cost_day}</td>
                </tr>
              )}

              {/* Drinking Water Consumption Litres */}
              {isParamActive('drinking_water_litres') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#ecfeff' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('drinking_water_litres', '•')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('drinking_water_litres', 'Drinking Water Consumption Litres Hostels')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#ecfeff' }}></td>
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
              )}

              {/* Drinking Water Consumption Cost */}
              {isParamActive('drinking_water_cost') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#ecfeff' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('drinking_water_cost', '•')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('drinking_water_cost', 'Drinking Water Consumption Cost Hostels')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#ecfeff' }}></td>
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
              )}

              {/* No of Students in Hostels (Drinking Water) */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#ecfeff' }}>
                <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                  {getParamSNo('students_drinking_water', '•')}
                </td>
                <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                  {getParamName('students_drinking_water', 'No of Staff + Students in Hostels')}
                </td>
                <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>{metrics.total_occupied}</td>
              </tr>

              {/* Drinking water Litres per student per day */}
              {isParamActive('drinking_water_ltr_day') && (
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('drinking_water_ltr_day', '•')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('drinking_water_ltr_day', 'Drinking water Litres per student per day- Hostels')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>{metrics.drinking_water_ltr_day} L</td>
                </tr>
              )}

              {/* Drinking Water cost Per student per day */}
              {isParamActive('drinking_water_cost_day') && (
                <tr style={{ borderBottom: '2px solid #000000' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000000' }}>
                    {getParamSNo('drinking_water_cost_day', '•')}
                  </td>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>
                    {getParamName('drinking_water_cost_day', 'Drinking Water cost Per student per day Hostels')}
                  </td>
                  <td colSpan={3} style={{ borderRight: '1px solid #000000', backgroundColor: '#f8fafc' }}></td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '800' }}>₹ {metrics.drinking_water_cost_day}</td>
                </tr>
              )}

              {/* Custom Parameters dynamically added to Section 6 in Master Data */}
              {renderCustomParamsForSection('Water & Utilities Deep Dive')}

              {/* ================================================================ */}
              {/* SECTION 7: OTHER DYNAMIC CUSTOM PARAMETERS ADDED IN MASTER DATA */}
              {/* ================================================================ */}
              {uncategorizedCustomParams.length > 0 && (
                <>
                  <tr style={{ backgroundColor: '#faf5ff', color: '#7e22ce', fontWeight: '800', borderBottom: '2px solid #000000' }}>
                    <td colSpan={6} style={{ padding: '8px 16px', fontSize: '12.5px', letterSpacing: '0.03em' }}>
                      ✨ CUSTOM PARAMETERS (CONFIGURED FROM MASTER DATA)
                    </td>
                  </tr>
                  {uncategorizedCustomParams.map((cp, cIdx) => {
                    const cKey = cp.param_key;
                    const cVal = currData[cKey] ?? '';

                    return (
                      <tr key={cp.id || cKey} style={{ borderBottom: '1px solid #cbd5e1' }}>
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
                  const b = num(d.bed_capacity_boys, 0);
                  const g = num(d.bed_capacity_girls, 0);
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
                  const sb = num(d.students_boys, 0);
                  const sg = num(d.students_girls, 0);
                  const fb = num(d.staff_boys, 0);
                  const fg = num(d.staff_girls, 0);
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
                  const b = num(d.bed_capacity_boys, 0) + num(d.bed_capacity_girls, 0);
                  const occ = num(d.students_boys, 0) + num(d.students_girls, 0) + num(d.staff_boys, 0) + num(d.staff_girls, 0);
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
                      {num(d.power_units, 0).toLocaleString()}
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
                      {formatINR(num(d.power_cost, 0))}
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
                      {formatINR(num(d.water_purchase_cost, 0))}
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
                      {formatINR(num(d.expenses_occurred, 0))}
                    </td>
                  );
                })}
              </tr>

              {/* Per student cost per month */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '8px 14px', fontWeight: '700', borderRight: '1px solid #000000' }}>Per student cost per month</td>
                {periods.map(p => {
                  const d = hostelCensusDraft[String(p.id)] || {};
                  const st = num(d.students_boys, 0) + num(d.students_girls, 0);
                  const exp = num(d.expenses_occurred, 0);
                  const psc = st > 0 ? Math.round(exp / st) : 0;
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
                  const ab = num(d.approved_budget, 0);
                  const cb = num(d.cumulative_budget_spent, 0);
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

      {/* MONTHLY ATTACHMENTS & BILLS MODAL */}
      {showAttachmentsModal && (
        <MonthlyAttachmentsModal
          isOpen={showAttachmentsModal}
          onClose={() => setShowAttachmentsModal(false)}
          module="hostel"
          periodId={editingPeriodId}
          periodLabel={activePeriodObj?.period_label || 'Current Period'}
          periods={periods}
        />
      )}
    </div>
  );
}
