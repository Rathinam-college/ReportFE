import React, { useState } from 'react';
import { formatINR } from '../../utils/formatters';
import { 
  Save, RefreshCw, FileSpreadsheet, CheckCircle2, Zap, Droplets, 
  BedDouble, AlertCircle, FileText, Check, ArrowRight, Layers, Table
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
  const [activeSubTab, setActiveSubTab] = useState('combined'); // 'combined', 'template', 'utilities'
  const [localMessage, setLocalMessage] = useState(null);
  const [isSavingLocal, setIsSavingLocal] = useState(false);

  const isClosed = !!activePeriodObj?.is_closed;
  const periods = computedMatrix?.periods || [];
  const currStr = String(editingPeriodId);

  // --- HELPER: Parse numeric safely ---
  const num = (v, defaultVal = 0) => {
    if (v === undefined || v === null || v === '') return defaultVal;
    if (typeof v === 'number') return isNaN(v) ? defaultVal : v;
    const cleaned = String(v).replace(/,/g, '').replace(/%/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  // --- PURE FORMULA ENGINE: Calculates all formulas matching hostel.xlsx ---
  const getHostelMetrics = (periodId) => {
    const pStr = String(periodId);
    const d = hostelCensusDraft[pStr] || {};

    // 1. Bed Capacity (Row 3)
    const bed_capacity_boys = num(d.bed_capacity_boys, 2223);
    const bed_capacity_girls = num(d.bed_capacity_girls, 896);
    const bed_capacity_total = bed_capacity_boys + bed_capacity_girls; // 3,119

    // 2. Students (Row 4)
    const students_boys = num(d.students_boys, 2075);
    const students_girls = num(d.students_girls, 768);
    const students_total = students_boys + students_girls; // 2,843

    // 3. Staffs (Row 5)
    const staff_boys = num(d.staff_boys, 72);
    const staff_girls = num(d.staff_girls, 59);
    const staff_total = staff_boys + staff_girls; // 131

    // 4. Total Occupied (Row 6)
    const total_occupied_boys = students_boys + staff_boys; // 2,147
    const total_occupied_girls = students_girls + staff_girls; // 827
    const total_occupied = total_occupied_boys + total_occupied_girls; // 2,974

    // 5. Vacant (Row 7)
    const vacant_boys = bed_capacity_boys - total_occupied_boys; // 76
    const vacant_girls = bed_capacity_girls - total_occupied_girls; // 69
    const vacant_total = vacant_boys + vacant_girls; // 145

    // 6. Vacant for College Students (Row 8)
    const vacant_college_boys = d.vacant_college_boys !== undefined && d.vacant_college_boys !== '' 
      ? num(d.vacant_college_boys) 
      : (vacant_boys - 41); // 35
    const vacant_college_girls = d.vacant_college_girls !== undefined && d.vacant_college_girls !== '' 
      ? num(d.vacant_college_girls) 
      : vacant_girls; // 69
    const vacant_college_total = vacant_college_boys + vacant_college_girls; // 104

    // 7. Vacant for College Sports (Row 9)
    const vacant_sports_boys = num(d.vacant_sports_boys, 0);
    const vacant_sports_girls = num(d.vacant_sports_girls, 0);
    const vacant_sports_total = vacant_sports_boys + vacant_sports_girls;

    // 8. Vacant for School Students (Row 10)
    const vacant_school_boys = num(d.vacant_school_boys, 0);
    const vacant_school_girls = num(d.vacant_school_girls, 0);
    const vacant_school_total = vacant_school_boys + vacant_school_girls;

    // 9. Occupied % (Row 11)
    const occupied_pct_boys = bed_capacity_boys > 0 ? (total_occupied_boys / bed_capacity_boys * 100) : 0;
    const occupied_pct_girls = bed_capacity_girls > 0 ? (total_occupied_girls / bed_capacity_girls * 100) : 0;
    const occupied_pct_total = bed_capacity_total > 0 ? (total_occupied / bed_capacity_total * 100) : 0;

    // 10. Vacant % (Row 12)
    const vacant_pct_boys = bed_capacity_boys > 0 ? (vacant_boys / bed_capacity_boys * 100) : 0;
    const vacant_pct_girls = bed_capacity_girls > 0 ? (vacant_girls / bed_capacity_girls * 100) : 0;
    const vacant_pct_total = bed_capacity_total > 0 ? (vacant_total / bed_capacity_total * 100) : 0;

    // 11. Students Vacated (Row 13)
    const students_vacated = num(d.students_vacated, 86);

    // 12. Maintenance Tickets (Rows 14-18)
    const tickets_received = num(d.tickets_received, 176);
    const tickets_closed = num(d.tickets_closed, 176);
    const tickets_open = Math.max(0, tickets_received - tickets_closed);
    const total_hours_close = num(d.total_hours_close, 0);
    const tat_hours = d.tat_hours !== undefined && d.tat_hours !== '' 
      ? num(d.tat_hours) 
      : (total_hours_close > 0 && tickets_closed > 0 ? (total_hours_close / tickets_closed) : 62.29);

    // 13. Quality Issues (Rows 19-21)
    const quality_issues_received = num(d.quality_issues_received, 5);
    const quality_issues_closed = num(d.quality_issues_closed, 3);
    const quality_issues_open = Math.max(0, quality_issues_received - quality_issues_closed);
    const incidents_count = num(d.incidents_count, 0);

    // 14. Consumption & Expenses (Rows 23-26)
    const power_units = num(d.power_units, 105116);
    const power_cost = num(d.power_cost, 1469211);
    const water_purchase_cost = num(d.water_purchase_cost, 248765);
    const maintenance_expenses = num(d.maintenance_expenses, 119394);
    const expenses_occurred = num(d.expenses_occurred, 9349172);

    // 15. Budget & Balance (Rows 27-29)
    const approved_budget = num(d.approved_budget, 131788118);
    const cumulative_budget_spent = num(d.cumulative_budget_spent, 34527814);
    const balance = approved_budget - cumulative_budget_spent; // 9,72,60,304

    // 16. Unit Economics (Rows 30-34)
    const number_of_students = students_total;
    const per_student_cost_month = number_of_students > 0 ? Math.round(expenses_occurred / number_of_students) : 3288;
    const per_student_cost_day = Math.round(per_student_cost_month / 30); // 110
    const sq_feet = num(d.sq_feet, 231701);
    const sq_feet_per_occupant = total_occupied > 0 ? (sq_feet / total_occupied).toFixed(1) : '81.5';

    // 17. Water Consumption (Rows 35 & 45-54)
    const normal_water_litres = num(d.normal_water_litres, 8202000);
    const normal_water_cost = num(d.normal_water_cost, 820200);
    const drinking_water_litres = num(d.drinking_water_litres, 92800);
    const drinking_water_cost = num(d.drinking_water_cost, 23200);

    const normal_water_student_ltrs = number_of_students > 0 ? Math.round(normal_water_litres / number_of_students) : 0;
    const normal_water_student_cost = number_of_students > 0 ? Math.round(normal_water_cost / number_of_students) : num(d.normal_water_student_cost, 88);

    // 18. Multi-Month Analytics (Rows 38-54)
    const power_cost_sqft = sq_feet > 0 ? (power_cost / sq_feet).toFixed(2) : '6.34';
    const units_per_occupant = total_occupied > 0 ? (power_units / total_occupied).toFixed(1) : '35.3';
    const power_cost_occupant = total_occupied > 0 ? Math.round(power_cost / total_occupied) : 494;

    const normal_water_ltr_day = total_occupied > 0 ? (normal_water_litres / total_occupied / 30).toFixed(2) : '91.93';
    const normal_water_cost_day = total_occupied > 0 ? (normal_water_cost / total_occupied / 30).toFixed(2) : '9.19';

    const drinking_water_ltr_day = total_occupied > 0 ? (drinking_water_litres / total_occupied / 30).toFixed(2) : '1.04';
    const drinking_water_cost_day = total_occupied > 0 ? (drinking_water_cost / total_occupied / 30).toFixed(2) : '0.26';

    return {
      raw: d,
      bed_capacity_boys,
      bed_capacity_girls,
      bed_capacity_total,
      students_boys,
      students_girls,
      students_total,
      staff_boys,
      staff_girls,
      staff_total,
      total_occupied_boys,
      total_occupied_girls,
      total_occupied,
      vacant_boys,
      vacant_girls,
      vacant_total,
      vacant_college_boys,
      vacant_college_girls,
      vacant_college_total,
      vacant_sports_boys,
      vacant_sports_girls,
      vacant_sports_total,
      vacant_school_boys,
      vacant_school_girls,
      vacant_school_total,
      occupied_pct_boys,
      occupied_pct_girls,
      occupied_pct_total,
      vacant_pct_boys,
      vacant_pct_girls,
      vacant_pct_total,
      students_vacated,
      tickets_received,
      tickets_closed,
      tickets_open,
      total_hours_close,
      tat_hours,
      quality_issues_received,
      quality_issues_closed,
      quality_issues_open,
      incidents_count,
      power_units,
      power_cost,
      water_purchase_cost,
      maintenance_expenses,
      expenses_occurred,
      approved_budget,
      cumulative_budget_spent,
      balance,
      number_of_students,
      per_student_cost_month,
      per_student_cost_day,
      sq_feet,
      sq_feet_per_occupant,
      normal_water_litres,
      normal_water_cost,
      drinking_water_litres,
      drinking_water_cost,
      normal_water_student_ltrs,
      normal_water_student_cost,
      power_cost_sqft,
      units_per_occupant,
      power_cost_occupant,
      normal_water_ltr_day,
      normal_water_cost_day,
      drinking_water_ltr_day,
      drinking_water_cost_day
    };
  };

  // Current active period metrics
  const activeM = getHostelMetrics(editingPeriodId);

  // --- CELL INPUT HANDLER ---
  const handleUpdate = (field, value, targetPeriodId = null) => {
    if (isClosed && (!targetPeriodId || targetPeriodId === editingPeriodId)) return;
    const pid = targetPeriodId || editingPeriodId;
    handleHostelCensusChange?.(field, value, pid);
  };

  // --- DIRECT SAVE HANDLER FOR ACTIVE MONTH ---
  const handleDirectSaveActive = async () => {
    try {
      setIsSavingLocal(true);
      setLocalMessage(null);

      const m = getHostelMetrics(editingPeriodId);
      const payload = {
        bed_capacity_boys: m.bed_capacity_boys,
        bed_capacity_girls: m.bed_capacity_girls,
        bed_capacity_total: m.bed_capacity_total,
        students_boys: m.students_boys,
        students_girls: m.students_girls,
        students_total: m.students_total,
        staff_boys: m.staff_boys,
        staff_girls: m.staff_girls,
        staff_total: m.staff_total,
        total_occupied_boys: m.total_occupied_boys,
        total_occupied_girls: m.total_occupied_girls,
        total_occupied: m.total_occupied,
        vacant_boys: m.vacant_boys,
        vacant_girls: m.vacant_girls,
        vacant_total: m.vacant_total,
        vacant_college_boys: m.vacant_college_boys,
        vacant_college_girls: m.vacant_college_girls,
        vacant_college: m.vacant_college_total,
        vacant_sports_boys: m.vacant_sports_boys,
        vacant_sports_girls: m.vacant_sports_girls,
        vacant_sports_total: m.vacant_sports_total,
        vacant_school_boys: m.vacant_school_boys,
        vacant_school_girls: m.vacant_school_girls,
        vacant_school_total: m.vacant_school_total,
        occupied_pct_boys: m.occupied_pct_boys,
        occupied_pct_girls: m.occupied_pct_girls,
        occupied_pct: m.occupied_pct_total,
        vacant_pct_boys: m.vacant_pct_boys,
        vacant_pct_girls: m.vacant_pct_girls,
        vacant_pct: m.vacant_pct_total,
        students_vacated: m.students_vacated,
        tickets_received: m.tickets_received,
        tickets_closed: m.tickets_closed,
        tickets_open: m.tickets_open,
        total_hours_close: m.total_hours_close,
        tat_hours: m.tat_hours,
        quality_issues_received: m.quality_issues_received,
        quality_issues_closed: m.quality_issues_closed,
        quality_issues_open: m.quality_issues_open,
        incidents_count: m.incidents_count,
        power_units: m.power_units,
        power_cost: m.power_cost,
        water_purchase_cost: m.water_purchase_cost,
        maintenance_expenses: m.maintenance_expenses,
        expenses_occurred: m.expenses_occurred,
        approved_budget: m.approved_budget,
        cumulative_budget_spent: m.cumulative_budget_spent,
        balance: m.balance,
        normal_water_litres: m.normal_water_litres,
        normal_water_cost: m.normal_water_cost,
        drinking_water_litres: m.drinking_water_litres,
        drinking_water_cost: m.drinking_water_cost,
        sq_feet: m.sq_feet,
        per_student_cost_month: m.per_student_cost_month,
        per_student_cost_day: m.per_student_cost_day,
        sq_feet_per_occupant: parseFloat(m.sq_feet_per_occupant) || 0,
        normal_water_student_ltrs: m.normal_water_student_ltrs,
        normal_water_student_cost: m.normal_water_student_cost,
        power_cost_sqft: parseFloat(m.power_cost_sqft) || 0,
        units_per_occupant: parseFloat(m.units_per_occupant) || 0,
        power_cost_occupant: m.power_cost_occupant,
        normal_water_ltr_day: parseFloat(m.normal_water_ltr_day) || 0,
        normal_water_cost_day: parseFloat(m.normal_water_cost_day) || 0,
        drinking_water_ltr_day: parseFloat(m.drinking_water_ltr_day) || 0,
        drinking_water_cost_day: parseFloat(m.drinking_water_cost_day) || 0
      };

      const res = await fetch(`/api/hostel-census/${editingPeriodId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to save hostel census data');
      }

      setLocalMessage({
        type: 'success',
        text: `✓ Successfully saved all parameters, formulas, and totals for ${activePeriodObj?.period_label} into PostgreSQL database!`
      });

      if (fetchData) await fetchData();
      setTimeout(() => setLocalMessage(null), 5000);
    } catch (err) {
      setLocalMessage({ type: 'error', text: err.message || 'Error saving hostel parameters' });
    } finally {
      setIsSavingLocal(false);
    }
  };

  // --- BULK SAVE HANDLER FOR ALL MONTHS IN MULTI-MONTH TABLE ---
  const handleBulkSaveAllMonths = async () => {
    try {
      setIsSavingLocal(true);
      setLocalMessage(null);

      const monthsMap = {};
      periods.forEach(p => {
        const m = getHostelMetrics(p.id);
        monthsMap[p.id] = {
          bed_capacity_boys: m.bed_capacity_boys,
          bed_capacity_girls: m.bed_capacity_girls,
          bed_capacity_total: m.bed_capacity_total,
          students_boys: m.students_boys,
          students_girls: m.students_girls,
          students_total: m.students_total,
          staff_boys: m.staff_boys,
          staff_girls: m.staff_girls,
          staff_total: m.staff_total,
          total_occupied: m.total_occupied,
          vacant_total: m.vacant_total,
          vacant_college_boys: m.vacant_college_boys,
          vacant_college_girls: m.vacant_college_girls,
          power_units: m.power_units,
          power_cost: m.power_cost,
          water_purchase_cost: m.water_purchase_cost,
          maintenance_expenses: m.maintenance_expenses,
          expenses_occurred: m.expenses_occurred,
          approved_budget: m.approved_budget,
          cumulative_budget_spent: m.cumulative_budget_spent,
          normal_water_litres: m.normal_water_litres,
          normal_water_cost: m.normal_water_cost,
          drinking_water_litres: m.drinking_water_litres,
          drinking_water_cost: m.drinking_water_cost,
          sq_feet: m.sq_feet
        };
      });

      const res = await fetch('/api/hostel-census-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months: monthsMap })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to bulk save all months');
      }

      setLocalMessage({
        type: 'success',
        text: `✓ Successfully saved all ${periods.length} months of hostel operational parameters & formulas into PostgreSQL database!`
      });

      if (fetchData) await fetchData();
      setTimeout(() => setLocalMessage(null), 5000);
    } catch (err) {
      setLocalMessage({ type: 'error', text: err.message || 'Error saving months in bulk' });
    } finally {
      setIsSavingLocal(false);
    }
  };

  // Reusable inline input cell component
  const renderCellInput = (field, currentVal, placeholder = '', isNumeric = true, width = '100%', targetPeriodId = null) => {
    const rawVal = targetPeriodId 
      ? hostelCensusDraft[String(targetPeriodId)]?.[field] 
      : hostelCensusDraft[currStr]?.[field];
    const displayVal = rawVal !== undefined && rawVal !== null ? rawVal : (currentVal !== undefined ? currentVal : '');

    return (
      <input
        type={isNumeric ? 'number' : 'text'}
        value={displayVal}
        placeholder={placeholder}
        onChange={(e) => {
          const val = isNumeric ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
          handleUpdate(field, val, targetPeriodId);
        }}
        disabled={isClosed && (!targetPeriodId || targetPeriodId === editingPeriodId)}
        style={{
          width: width,
          padding: '4px 6px',
          border: '1px solid #000000',
          borderRadius: '3px',
          textAlign: isNumeric ? 'center' : 'left',
          fontSize: '13px',
          fontWeight: '700',
          backgroundColor: '#fff2df',
          color: '#000000',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.15s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#00a2e8';
          e.target.style.backgroundColor = '#ffffff';
          e.target.style.boxShadow = '0 0 0 2px rgba(0, 162, 232, 0.25)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#000000';
          e.target.style.backgroundColor = '#fff2df';
          e.target.style.boxShadow = 'none';
        }}
      />
    );
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1.5px solid #00a2e8',
      boxShadow: '0 4px 16px rgba(0, 162, 232, 0.1)',
      overflow: 'hidden',
      marginBottom: '22px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 1. TOP SPREADSHEET HEADER & ACTION BAR */}
      <div style={{
        backgroundColor: '#00a2e8',
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        color: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00a2e8',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}>
            <BedDouble size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '16.5px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                Hostel Operations Master Spreadsheet
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                color: '#0284c7'
              }}>
                Rathinam Report Excel Grid
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: '#e0f2fe', margin: '2px 0 0 0' }}>
              Full Editable Matrix • Resident Census, Bed Capacity & Utilities • Direct DB Save
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <button
              type="button"
              onClick={() => setActiveSubTab('combined')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: '700',
                backgroundColor: activeSubTab === 'combined' ? '#ffffff' : 'transparent',
                color: activeSubTab === 'combined' ? '#0087c2' : '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              All Tables (Combined)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('template')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: '700',
                backgroundColor: activeSubTab === 'template' ? '#ffffff' : 'transparent',
                color: activeSubTab === 'template' ? '#0087c2' : '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Table 1: Master Parameters
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('utilities')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: '700',
                backgroundColor: activeSubTab === 'utilities' ? '#ffffff' : 'transparent',
                color: activeSubTab === 'utilities' ? '#0087c2' : '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Table 2: Utilities Multi-Month
            </button>
          </div>

          <button
            type="button"
            onClick={handleDirectSaveActive}
            disabled={savingBatch || isSavingLocal || isClosed}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#0087c2',
              fontSize: '13px',
              fontWeight: '800',
              border: 'none',
              cursor: isClosed ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
            }}
          >
            <Save size={14} />
            <span>{isSavingLocal || savingBatch ? 'Saving...' : `💾 Save ${activePeriodObj?.period_label || 'Month'} to DB`}</span>
          </button>
        </div>
      </div>

      {/* 2. MONTH SELECTOR PILL ROW */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            📅 Active Focus Month:
          </span>
          {periods.map(p => {
            const isSel = p.id === editingPeriodId;
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
                  gap: '6px',
                  boxShadow: isSel ? '0 2px 4px rgba(0, 162, 232, 0.25)' : 'none'
                }}
              >
                <span>{p.period_label}</span>
                {isSel && <Check size={12} color="#ffffff" />}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: isDirty ? '#fff7ed' : '#f0fdf4',
            color: isDirty ? '#c2410c' : '#166534',
            border: `1px solid ${isDirty ? '#ffedd5' : '#bbf7d0'}`
          }}>
            {isDirty ? '● Unsaved Edits' : '✓ Synced with PostgreSQL'}
          </span>
        </div>
      </div>

      {/* 3. FORMULA BAR RIBBON */}
      <div style={{
        padding: '8px 20px',
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
        <div style={{ fontFamily: 'monospace', color: '#475569', fontSize: '11.5px', flex: 1 }}>
          <strong>Total Occupied:</strong> =SUM(Students + Staff) | <strong>Vacant:</strong> =Bed Capacity - Total Occupied | <strong>Balance:</strong> =Approved Budget - Cumulative Budget Spent | <strong>Per Student Cost:</strong> =Expenses Occurred / Students
        </div>
      </div>

      {/* SUCCESS / ERROR NOTIFICATION BANNER */}
      {localMessage && (
        <div style={{
          padding: '10px 18px',
          backgroundColor: localMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: localMessage.type === 'success' ? '#15803d' : '#b91c1c',
          fontSize: '12.5px',
          fontWeight: '700',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {localMessage.type === 'success' ? <CheckCircle2 size={16} color="#15803d" /> : <AlertCircle size={16} color="#b91c1c" />}
          <span>{localMessage.text}</span>
        </div>
      )}

      {/* 2. TABLE 1: MASTER HOSTEL PARAMETERS TEMPLATE (EXCEL ROWS 1-35) */}
      {(activeSubTab === 'combined' || activeSubTab === 'template') && (
        <div style={{ overflowX: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e293b' }}>
              📊 Table 1: Master Parameters, Resident Census & Operational Expenses (Rows 1 to 35)
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Cycle: <strong style={{ color: '#059669' }}>{activePeriodObj?.period_label}</strong> • All SUMs, Occupancy %, TAT & Balances recalculate live
            </span>
          </div>

          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            border: '2px solid #000000',
            backgroundColor: '#ffffff'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#00a2e8',
                color: '#000000',
                borderBottom: '2px solid #000000',
                fontWeight: '800',
                fontSize: '13px'
              }}>
                <th style={{ width: '50px', borderRight: '1px solid #000000', padding: '10px 4px', textAlign: 'center' }}>S.No</th>
                <th style={{ minWidth: '320px', borderRight: '1px solid #000000', padding: '10px 12px', textAlign: 'left' }}>Parameters / Operational Census</th>
                <th style={{ width: '120px', borderRight: '1px solid #000000', padding: '10px 8px', textAlign: 'center' }}>Boys</th>
                <th style={{ width: '120px', borderRight: '1px solid #000000', padding: '10px 8px', textAlign: 'center' }}>Girls</th>
                <th style={{ width: '130px', borderRight: '1px solid #000000', padding: '10px 8px', textAlign: 'center', backgroundColor: '#0284c7', color: '#ffffff' }}>Total</th>
                <th style={{ width: '260px', padding: '10px 12px', textAlign: 'center' }}>Cost / Standard Reference</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Bed Capacity */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>1</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>Bed Capacity</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('bed_capacity_boys', activeM.bed_capacity_boys, '2223')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('bed_capacity_girls', activeM.bed_capacity_girls, '896')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#000000' }}>
                  {activeM.bed_capacity_total.toLocaleString()}
                </td>
                <td style={{ padding: '6px 10px', color: '#475569', textAlign: 'center', fontSize: '11.5px', fontFamily: 'monospace' }}>
                  =SUM(Boys + Girls)
                </td>
              </tr>

              {/* Row 2: No. of students */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>2</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>No. of students</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('students_boys', activeM.students_boys, '2075')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('students_girls', activeM.students_girls, '768')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#000000' }}>
                  {activeM.students_total.toLocaleString()}
                </td>
                <td style={{ padding: '6px 10px', color: '#475569', textAlign: 'center', fontSize: '11.5px', fontFamily: 'monospace' }}>
                  =SUM(Boys + Girls)
                </td>
              </tr>

              {/* Row 3: No. of staffs */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>3</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>No. of staffs</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('staff_boys', activeM.staff_boys, '72')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('staff_girls', activeM.staff_girls, '59')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#000000' }}>
                  {activeM.staff_total.toLocaleString()}
                </td>
                <td style={{ padding: '6px 10px', color: '#475569', textAlign: 'center', fontSize: '11.5px', fontFamily: 'monospace' }}>
                  =SUM(Boys + Girls)
                </td>
              </tr>

              {/* Row 4: Total Occupied (SUBTOTAL: BRIGHT LIME GREEN) */}
              <tr style={{ backgroundColor: '#00ff00', borderBottom: '2px solid #000000', color: '#000000', fontWeight: '800' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '7px', fontWeight: '900' }}>4</td>
                <td style={{ borderRight: '1px solid #000000', padding: '7px 12px', fontWeight: '900', color: '#000000' }}>Total Occupied</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '900', color: '#000000' }}>
                  {activeM.total_occupied_boys.toLocaleString()}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '900', color: '#000000' }}>
                  {activeM.total_occupied_girls.toLocaleString()}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '900', color: '#000000', fontSize: '13.5px' }}>
                  {activeM.total_occupied.toLocaleString()}
                </td>
                <td style={{ padding: '6px 10px', color: '#000000', fontSize: '12px', textAlign: 'center', fontWeight: '800' }}>
                  =Students + Staff ({activeM.students_total} + {activeM.staff_total})
                </td>
              </tr>

              {/* Row 5: Vacant */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>5</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>Vacant</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>
                  {activeM.vacant_boys}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>
                  {activeM.vacant_girls}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800' }}>
                  {activeM.vacant_total}
                </td>
                <td style={{ padding: '6px 10px', color: '#475569', fontSize: '11.5px', textAlign: 'center', fontFamily: 'monospace' }}>
                  =Bed Capacity - Total Occupied
                </td>
              </tr>

              {/* Row 6: Vacant for college students */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>6</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '600', color: '#000000' }}>Vacant for college students</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('vacant_college_boys', activeM.vacant_college_boys, '35')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('vacant_college_girls', activeM.vacant_college_girls, '69')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>
                  {activeM.vacant_college_total}
                </td>
                <td style={{ padding: '6px 10px', color: '#475569', fontSize: '11.5px', textAlign: 'center' }}>
                  Boys (=Vacant-41) | Girls (=Vacant)
                </td>
              </tr>

              {/* Row 7: Vacant for college sports students */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}>—</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', color: '#334155' }}>Vacant for college sports students (KPM hostel)</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('vacant_sports_boys', activeM.vacant_sports_boys, '0')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('vacant_sports_girls', activeM.vacant_sports_girls, '0')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '600' }}>
                  {activeM.vacant_sports_total || '—'}
                </td>
                <td style={{ padding: '6px 10px', color: '#94a3b8', textAlign: 'center' }}>—</td>
              </tr>

              {/* Row 8: Vacant for school students */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}>—</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', color: '#334155' }}>Vacant for school students</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('vacant_school_boys', activeM.vacant_school_boys, '0')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('vacant_school_girls', activeM.vacant_school_girls, '0')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '600' }}>
                  {activeM.vacant_school_total || '—'}
                </td>
                <td style={{ padding: '6px 10px', color: '#94a3b8', textAlign: 'center' }}>—</td>
              </tr>

              {/* Row 9: Occupied % (SILVER / GREY CATEGORY STYLE) */}
              <tr style={{ backgroundColor: '#dcdde1', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>—</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '800', color: '#000000' }}>Occupied %</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#000000' }}>
                  {activeM.occupied_pct_boys.toFixed(1)}%
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#000000' }}>
                  {activeM.occupied_pct_girls.toFixed(1)}%
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '900', color: '#000000' }}>
                  {activeM.occupied_pct_total.toFixed(2)}%
                </td>
                <td style={{ padding: '6px 10px', color: '#000000', fontSize: '11.5px', textAlign: 'center', fontWeight: '700', fontFamily: 'monospace' }}>
                  =Total Occupied / Bed Capacity
                </td>
              </tr>

              {/* Row 10: Vacant % (SILVER / GREY CATEGORY STYLE) */}
              <tr style={{ backgroundColor: '#dcdde1', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>—</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '800', color: '#000000' }}>Vacant %</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#000000' }}>
                  {activeM.vacant_pct_boys.toFixed(1)}%
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#000000' }}>
                  {activeM.vacant_pct_girls.toFixed(1)}%
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '900', color: '#000000' }}>
                  {activeM.vacant_pct_total.toFixed(2)}%
                </td>
                <td style={{ padding: '6px 10px', color: '#000000', fontSize: '11.5px', textAlign: 'center', fontWeight: '700', fontFamily: 'monospace' }}>
                  =Vacant / Bed Capacity
                </td>
              </tr>

              {/* Row 11: Students Vacated */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '2px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>7</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>Students Vacated</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>—</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>—</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('students_vacated', activeM.students_vacated, '86')}
                </td>
                <td style={{ padding: '6px 10px', color: '#475569', textAlign: 'center', fontSize: '11.5px' }}>Hostel departures count</td>
              </tr>

              {/* --- SECTION BANNER: MAINTENANCE & SERVICE TICKETS (GOLDEN YELLOW) --- */}
              <tr style={{ backgroundColor: '#ffc90e', borderBottom: '1px solid #000000', color: '#000000', fontWeight: '800' }}>
                <td colSpan={6} style={{ padding: '8px 14px', letterSpacing: '0.03em', fontSize: '12.5px' }}>
                  🛠️ MAINTENANCE & SERVICE TICKETS (SPACE BASIC)
                </td>
              </tr>

              {/* Row 8: Maintenance Tickets Received */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>8</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>
                  No. of Maintenance Tickets Received
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('tickets_received', activeM.tickets_received, '176')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td rowSpan={5} style={{
                  verticalAlign: 'middle',
                  textAlign: 'center',
                  padding: '10px',
                  backgroundColor: '#fff2df',
                  borderLeft: '1px solid #000000',
                  borderBottom: '1px solid #000000'
                }}>
                  <div style={{
                    color: '#00a2e8',
                    fontWeight: '800',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <FileText size={14} />
                    <span>Space basic tickets {activePeriodObj?.period_label}.csv</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#000000', marginTop: '4px', fontWeight: '700' }}>
                    Open Tickets: <strong>{activeM.tickets_open}</strong> • TAT: <strong>{activeM.tat_hours} hrs</strong>
                  </div>
                </td>
              </tr>

              {/* Row 9: Maintenance Tickets closed */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>9</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>
                  No. of Maintenance Tickets closed
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('tickets_closed', activeM.tickets_closed, '176')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
              </tr>

              {/* Row 10: Maintenance Tickets in Open */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>10</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '800', color: '#000000' }}>
                  No. of Maintenance Tickets in Open
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '900', color: activeM.tickets_open > 0 ? '#b91c1c' : '#15803d' }}>
                  {activeM.tickets_open}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
              </tr>

              {/* Row 11: Total Hours taken to close tickets */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>11</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>
                  Total Hours taken to close the tickets
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('total_hours_close', activeM.total_hours_close, '0')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
              </tr>

              {/* Row 12: TAT Hours */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>12</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>
                  TAT (Turnaround Time)Hours
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('tat_hours', activeM.tat_hours, '62.29')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
              </tr>

              {/* Row 13: Quality issues Received */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>13</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>
                  No. of Quality issues Received
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('quality_issues_received', activeM.quality_issues_received, '5')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ padding: '6px 10px', color: '#475569', textAlign: 'center' }}>Hostel amenities complaints</td>
              </tr>

              {/* Row 14: Quality issues Closed */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>14</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>
                  No. of Quality issues Closed
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('quality_issues_closed', activeM.quality_issues_closed, '3')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ padding: '6px 10px', color: '#475569', textAlign: 'center' }}>Resolved complaints</td>
              </tr>

              {/* Row 15: Quality issues in Open */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>15</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '800', color: '#000000' }}>
                  No. of Quality issues in Open
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '900', color: activeM.quality_issues_open > 0 ? '#b91c1c' : '#15803d' }}>
                  {activeM.quality_issues_open}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ padding: '6px 10px', color: '#000000', fontSize: '11.5px', textAlign: 'center', fontWeight: '700', fontFamily: 'monospace' }}>
                  =Received - Closed
                </td>
              </tr>

              {/* Row 16: No. of Incidents */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '2px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>16</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>
                  No. of Incidents
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('incidents_count', activeM.incidents_count, '0')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ padding: '6px 10px', color: '#475569', textAlign: 'center' }}>Safety & disciplinary incidents</td>
              </tr>

              {/* --- SECTION BANNER: UTILITIES & CONSUMPTION EXPENSES (GOLDEN YELLOW) --- */}
              <tr style={{ backgroundColor: '#ffc90e', borderBottom: '1px solid #000000', color: '#000000', fontWeight: '800' }}>
                <td colSpan={6} style={{ padding: '8px 14px', letterSpacing: '0.03em', fontSize: '12.5px' }}>
                  ⚡ UTILITIES & CONSUMPTION EXPENSES (POWER & WATER)
                </td>
              </tr>

              {/* Row 17: Power Consumption */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>17</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>
                  Power Consumption
                </td>
                <td colSpan={2} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11.5px', color: '#000000', fontWeight: '700' }}>Units:</span>
                    {renderCellInput('power_units', activeM.power_units, '105116', true, '110px')}
                  </div>
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#000000' }}>
                  ₹
                </td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('power_cost', activeM.power_cost, '1469211', true, '150px')}
                </td>
              </tr>

              {/* Row 18: Water Purchase Expenses */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>18</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>
                  Water Purchase Expenses
                </td>
                <td colSpan={2} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#000000' }}>
                  ₹
                </td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('water_purchase_cost', activeM.water_purchase_cost, '248765', true, '150px')}
                </td>
              </tr>

              {/* Row: Maintenance Expenses */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>19</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>
                  Maintenance Expenses
                </td>
                <td colSpan={2} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#000000' }}>
                  ₹
                </td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('maintenance_expenses', activeM.maintenance_expenses, '119394', true, '150px')}
                </td>
              </tr>

              {/* Row 20: Expenses occurred (SUBTOTAL: BRIGHT LIME GREEN) */}
              <tr style={{ backgroundColor: '#00ff00', borderBottom: '2px solid #000000', color: '#000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '7px', fontWeight: '900' }}>20</td>
                <td style={{ borderRight: '1px solid #000000', padding: '7px 12px', fontWeight: '900', color: '#000000' }}>
                  Total Expenses Occurred
                </td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', color: '#000000', fontSize: '12px', fontWeight: '800' }}>
                  Total Operational Outflow
                </td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('expenses_occurred', activeM.expenses_occurred, '9349172', true, '150px')}
                </td>
              </tr>

              {/* --- SECTION BANNER: APPROVED BUDGET & BALANCE (SKY BLUE) --- */}
              <tr style={{ backgroundColor: '#a8d8ea', borderBottom: '1px solid #000000', color: '#000000', fontWeight: '800' }}>
                <td colSpan={6} style={{ padding: '8px 14px', letterSpacing: '0.03em', fontSize: '12.5px' }}>
                  💰 APPROVED BUDGET & REMAINING BALANCE
                </td>
              </tr>

              {/* Row 22: Approved Budget */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>22</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>
                  Approved Budget
                </td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('approved_budget', activeM.approved_budget, '131788118', true, '150px')}
                </td>
              </tr>

              {/* Row 23: Cumulative Budget spent */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>23</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>
                  Cumulative Budget spent (Actual expenses) till now
                </td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('cumulative_budget_spent', activeM.cumulative_budget_spent, '34527814', true, '150px')}
                </td>
              </tr>

              {/* Row 24: Balance (GRAND TOTAL: DEEP TEAL) */}
              <tr style={{ backgroundColor: '#00a896', borderBottom: '2px solid #000000', color: '#000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '8px', fontWeight: '900' }}>24</td>
                <td style={{ borderRight: '1px solid #000000', padding: '8px 12px', fontWeight: '900', color: '#000000', fontSize: '13.5px' }}>
                  Balance Budget
                </td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', color: '#000000', fontSize: '12px', fontWeight: '800' }}>
                  =Approved Budget - Cumulative Budget spent
                </td>
                <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '900', fontSize: '14.5px', color: '#000000' }}>
                  {formatINR(activeM.balance)}
                </td>
              </tr>

              {/* --- SECTION BANNER: UNIT ECONOMICS & EFFICIENCY (SOFT MINT) --- */}
              <tr style={{ backgroundColor: '#d4edda', borderBottom: '1px solid #000000', color: '#000000', fontWeight: '800' }}>
                <td colSpan={6} style={{ padding: '8px 14px', letterSpacing: '0.03em', fontSize: '12.5px' }}>
                  📐 UNIT ECONOMICS, OCCUPANT SPEND & WATER METRICS
                </td>
              </tr>

              {/* Row 25: Number of students */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>25</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '600', color: '#000000' }}>Number of students</td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', color: '#475569', fontSize: '11.5px', fontFamily: 'monospace' }}>
                  =Row 2 Total Students (Boys + Girls)
                </td>
                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '800', color: '#000000' }}>
                  {activeM.number_of_students.toLocaleString()}
                </td>
              </tr>

              {/* Row 26: Per student cost per month */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>26</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>Per student cost per month</td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', color: '#475569', fontSize: '11.5px', fontFamily: 'monospace' }}>
                  =Expenses occurred / Number of students
                </td>
                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '800', color: '#000000' }}>
                  ₹{activeM.per_student_cost_month.toLocaleString()}
                </td>
              </tr>

              {/* Row 27: Per student cost per day */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>27</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '700', color: '#000000' }}>Per student cost per day</td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', color: '#475569', fontSize: '11.5px', fontFamily: 'monospace' }}>
                  =Per student month cost / 30 days
                </td>
                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '800', color: '#000000' }}>
                  ₹{activeM.per_student_cost_day}
                </td>
              </tr>

              {/* Row: Sq feet */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>—</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '600', color: '#000000' }}>Sq feet Hostel</td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', color: '#475569', fontSize: '11.5px' }}>Campus Hostel Built-up Area</td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('sq_feet', activeM.sq_feet, '231701', true, '150px')}
                </td>
              </tr>

              {/* Row: Sq feet per occupant in hostel */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>—</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 12px', fontWeight: '600', color: '#000000' }}>Sq feet per occupant in hostel</td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', color: '#475569', fontSize: '11.5px', fontFamily: 'monospace' }}>
                  =Sq feet / Total Occupied
                </td>
                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '800', color: '#000000' }}>
                  {activeM.sq_feet_per_occupant} sq.ft
                </td>
              </tr>

              {/* Row 28: Normal Water Metric */}
              <tr style={{ backgroundColor: '#fff2df', borderBottom: '2px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '7px', fontWeight: '800' }}>28</td>
                <td style={{ borderRight: '1px solid #000000', padding: '7px 12px', fontWeight: '800', color: '#000000' }}>
                  Normal water per student per month(Ltrs & cost)
                </td>
                <td colSpan={2} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11.5px', color: '#000000', fontWeight: '700' }}>Ltrs:</span>
                    {renderCellInput('normal_water_student_ltrs', activeM.normal_water_student_ltrs, '0', true, '80px')}
                  </div>
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    <span style={{ fontSize: '11.5px', color: '#000000', fontWeight: '700' }}>Cost ₹:</span>
                    {renderCellInput('normal_water_student_cost', activeM.normal_water_student_cost, '88', true, '100px')}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 3. TABLE 2: POWER & WATER ANALYTICS MULTI-MONTH COMPARISON GRID (EXCEL ROWS 37-54) */}
      {(activeSubTab === 'combined' || activeSubTab === 'utilities') && (
        <div style={{
          padding: '16px',
          borderTop: activeSubTab === 'combined' ? '2px solid #bae6fd' : 'none',
          backgroundColor: '#ffffff'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={16} color="#00a2e8" />
                  <span>Table 2: Multi-Month Power & Water Consumption & Unit Efficiency Ledger (Rows 37 to 54)</span>
                </h3>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                  hostel.xlsx Grid
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '3px 0 0 0' }}>
                Side-by-side comparison across all periods • Direct in-cell editing for any month • Recalculates all daily usage and per-occupant costs live
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleBulkSaveAllMonths}
                disabled={savingBatch || isSavingLocal}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#00a2e8',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '800',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(0, 162, 232, 0.25)'
                }}
              >
                <Save size={14} />
                <span>Save All Months (Bulk)</span>
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '8px', border: '2px solid #000000' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#00a2e8', color: '#000000', borderBottom: '2px solid #000000' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', minWidth: '320px', borderRight: '1px solid #000000', fontWeight: '800', color: '#000000' }}>
                    Utilities & Efficiency Parameter
                  </th>
                  {periods.map(p => {
                    const isSel = p.id === editingPeriodId;
                    return (
                      <th
                        key={p.id}
                        style={{
                          padding: '10px 10px',
                          textAlign: 'center',
                          minWidth: '125px',
                          borderRight: '1px solid #000000',
                          fontWeight: '800',
                          backgroundColor: isSel ? '#0ea5e9' : '#00a2e8',
                          color: '#000000'
                        }}
                      >
                        <div>{p.period_label.toUpperCase()} {isSel && '★'}</div>
                        {isSel && (
                          <span style={{ fontSize: '10px', fontWeight: '800', color: '#000000', textTransform: 'uppercase' }}>
                            (Active Edit)
                          </span>
                        )}
                      </th>
                    );
                  })}
                  <th style={{ padding: '10px 14px', textAlign: 'left', minWidth: '180px', fontWeight: '800', backgroundColor: '#0284c7', color: '#ffffff' }}>
                    Formula Specification
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* --- SECTION A: POWER CONSUMPTION (GOLDEN YELLOW) --- */}
                <tr style={{ backgroundColor: '#ffc90e', borderBottom: '1px solid #000000', color: '#000000', fontWeight: '800' }}>
                  <td colSpan={periods.length + 2} style={{ padding: '8px 14px', fontWeight: '800', color: '#000000', fontSize: '12.5px', letterSpacing: '0.03em' }}>
                    ⚡ SECTION A: POWER CONSUMPTION & EFFICIENCY (EB + DG)
                  </td>
                </tr>

                {/* Row 38: Power units */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000', color: '#000000' }}>
                    Power consumption units(EB + DG) Hostel
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #000000' }}>
                        {renderCellInput('power_units', m.power_units, 'Units', true, '110px', p.id)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569' }}>
                    Total EB + DG Units
                  </td>
                </tr>

                {/* Row 39: Power cost */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000', color: '#000000' }}>
                    Power consumption cost(EB + DG) Hostel
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #000000' }}>
                        {renderCellInput('power_cost', m.power_cost, 'Cost ₹', true, '110px', p.id)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569' }}>
                    Total EB + DG Electricity Bill (₹)
                  </td>
                </tr>

                {/* Row 40: Students + staff */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '6px 14px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>
                    No of Students+ staff in Hostel
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '6px 10px', textAlign: 'center', fontWeight: '800', borderRight: '1px solid #000000', color: '#000000' }}>
                        {m.total_occupied.toLocaleString()}
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569', fontFamily: 'monospace' }}>
                    =Total Occupied (Students + Staff)
                  </td>
                </tr>

                {/* Row 41: Sq feet */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '6px 14px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>
                    Sq feet Hostel
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #000000' }}>
                        {renderCellInput('sq_feet', m.sq_feet, '231701', true, '110px', p.id)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569' }}>
                    Campus Hostel Built-up Area
                  </td>
                </tr>

                {/* Row 42: Power cost per sq feet */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '7px 14px', fontWeight: '800', borderRight: '1px solid #000000', color: '#000000' }}>
                    Power cost per sq feet
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '7px 10px', textAlign: 'center', fontWeight: '800', borderRight: '1px solid #000000', color: '#000000' }}>
                        ₹{m.power_cost_sqft}
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569', fontFamily: 'monospace' }}>
                    =Power cost / Sq feet
                  </td>
                </tr>

                {/* Row 43: Units per occupant */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '7px 14px', fontWeight: '800', borderRight: '1px solid #000000', color: '#000000' }}>
                    Units per occupant per month - Hostel
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '7px 10px', textAlign: 'center', fontWeight: '800', borderRight: '1px solid #000000', color: '#000000' }}>
                        {m.units_per_occupant}
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569', fontFamily: 'monospace' }}>
                    =Power units / Total Occupants
                  </td>
                </tr>

                {/* Row 44: Power cost per occupant (SUBTOTAL: BRIGHT LIME GREEN) */}
                <tr style={{ backgroundColor: '#00ff00', borderBottom: '2px solid #000000', color: '#000000' }}>
                  <td style={{ padding: '8px 14px', fontWeight: '900', borderRight: '1px solid #000000', color: '#000000' }}>
                    Power cost Per occupant per month - Hostel
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '900', borderRight: '1px solid #000000', color: '#000000', fontSize: '13.5px' }}>
                        ₹{m.power_cost_occupant.toLocaleString()}
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 14px', fontSize: '12px', color: '#000000', fontWeight: '800', fontFamily: 'monospace' }}>
                    =Power cost / Total Occupants
                  </td>
                </tr>

                {/* --- SECTION B: NORMAL WATER CONSUMPTION (SILVER / GREY) --- */}
                <tr style={{ backgroundColor: '#dcdde1', borderBottom: '1px solid #000000', color: '#000000', fontWeight: '800' }}>
                  <td colSpan={periods.length + 2} style={{ padding: '8px 14px', fontWeight: '800', color: '#000000', fontSize: '12.5px', letterSpacing: '0.03em' }}>
                    💧 SECTION B: NORMAL WATER CONSUMPTION & DAILY USAGE (ROWS 45 TO 49)
                  </td>
                </tr>

                {/* Row 45: Normal water litres */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000', color: '#000000' }}>
                    Normal Water Consumption Ltr Hostels
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #000000' }}>
                        {renderCellInput('normal_water_litres', m.normal_water_litres, 'Litres', true, '110px', p.id)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569' }}>
                    Metered / Borewell normal water (Ltrs)
                  </td>
                </tr>

                {/* Row 46: Normal water cost */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000', color: '#000000' }}>
                    Normal Water Consumption Cost Hostels
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #000000' }}>
                        {renderCellInput('normal_water_cost', m.normal_water_cost, 'Cost ₹', true, '110px', p.id)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569' }}>
                    Total normal water spend (₹)
                  </td>
                </tr>

                {/* Row 47: No of students */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '6px 14px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>
                    No of Students in Hostels
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '6px 10px', textAlign: 'center', fontWeight: '800', borderRight: '1px solid #000000', color: '#000000' }}>
                        {m.total_occupied.toLocaleString()}
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569', fontFamily: 'monospace' }}>
                    =Total Residents (Occupants)
                  </td>
                </tr>

                {/* Row 48: Normal water Ltr per student per day */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '7px 14px', fontWeight: '800', borderRight: '1px solid #000000', color: '#000000' }}>
                    Normal water Ltr per student per day - Hostels
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '7px 10px', textAlign: 'center', fontWeight: '800', borderRight: '1px solid #000000', color: '#000000' }}>
                        {m.normal_water_ltr_day} Ltrs
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569', fontFamily: 'monospace' }}>
                    =Normal Ltrs / Occupants / 30
                  </td>
                </tr>

                {/* Row 49: Normal water cost per student per day (SUBTOTAL: BRIGHT LIME GREEN) */}
                <tr style={{ backgroundColor: '#00ff00', borderBottom: '2px solid #000000', color: '#000000' }}>
                  <td style={{ padding: '8px 14px', fontWeight: '900', borderRight: '1px solid #000000', color: '#000000' }}>
                    Normal Water cost Per student per day Hostels
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '900', borderRight: '1px solid #000000', color: '#000000', fontSize: '13.5px' }}>
                        ₹{m.normal_water_cost_day}
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 14px', fontSize: '12px', color: '#000000', fontWeight: '800', fontFamily: 'monospace' }}>
                    =Normal Cost / Occupants / 30
                  </td>
                </tr>

                {/* --- SECTION C: DRINKING WATER CONSUMPTION (SOFT SKY BLUE) --- */}
                <tr style={{ backgroundColor: '#a8d8ea', borderBottom: '1px solid #000000', color: '#000000', fontWeight: '800' }}>
                  <td colSpan={periods.length + 2} style={{ padding: '8px 14px', fontWeight: '800', color: '#000000', fontSize: '12.5px', letterSpacing: '0.03em' }}>
                    🚰 SECTION C: DRINKING WATER CONSUMPTION (RO PURIFIED) (ROWS 50 TO 54)
                  </td>
                </tr>

                {/* Row 50: Drinking water litres */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000', color: '#000000' }}>
                    Drinking Water Consumption Litres Hostels
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #000000' }}>
                        {renderCellInput('drinking_water_litres', m.drinking_water_litres, 'Litres', true, '110px', p.id)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569' }}>
                    RO Purified drinking water volume (Ltrs)
                  </td>
                </tr>

                {/* Row 51: Drinking water cost */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '6px 14px', fontWeight: '700', borderRight: '1px solid #000000', color: '#000000' }}>
                    Drinking Water Consumption Cost Hostels
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #000000' }}>
                        {renderCellInput('drinking_water_cost', m.drinking_water_cost, 'Cost ₹', true, '110px', p.id)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569' }}>
                    Total RO water purchase cost (₹)
                  </td>
                </tr>

                {/* Row 52: No of students */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '6px 14px', fontWeight: '600', borderRight: '1px solid #000000', color: '#000000' }}>
                    No of Students in Hostels
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '6px 10px', textAlign: 'center', fontWeight: '800', borderRight: '1px solid #000000', color: '#000000' }}>
                        {m.total_occupied.toLocaleString()}
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569', fontFamily: 'monospace' }}>
                    =Total Residents (Occupants)
                  </td>
                </tr>

                {/* Row 53: Drinking water litres per student per day */}
                <tr style={{ backgroundColor: '#fff2df', borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '7px 14px', fontWeight: '800', borderRight: '1px solid #000000', color: '#000000' }}>
                    Drinking water Litres per student per day- Hostels
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '7px 10px', textAlign: 'center', fontWeight: '800', borderRight: '1px solid #000000', color: '#000000' }}>
                        {m.drinking_water_ltr_day} Ltrs
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 14px', fontSize: '11.5px', color: '#475569', fontFamily: 'monospace' }}>
                    =Drinking Ltrs / Occupants / 30
                  </td>
                </tr>

                {/* Row 54: Drinking water cost per student per day (SUBTOTAL: BRIGHT LIME GREEN) */}
                <tr style={{ backgroundColor: '#00ff00', borderBottom: '2px solid #000000', color: '#000000' }}>
                  <td style={{ padding: '8px 14px', fontWeight: '900', borderRight: '1px solid #000000', color: '#000000' }}>
                    Drinking Water cost Per student per day Hostels
                  </td>
                  {periods.map(p => {
                    const m = getHostelMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '900', borderRight: '1px solid #000000', color: '#000000', fontSize: '13.5px' }}>
                        ₹{m.drinking_water_cost_day}
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 14px', fontSize: '12px', color: '#000000', fontWeight: '800', fontFamily: 'monospace' }}>
                    =Drinking Cost / Occupants / 30
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. FOOTER STATUS BAR WITH DEDICATED SAVE BUTTON */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#ffffff',
        borderTop: '1.5px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: isDirty ? '#ea580c' : '#0284c7',
            fontWeight: '700'
          }}>
            {isDirty ? (
              <>
                <AlertCircle size={15} color="#ea580c" />
                <span>Pending unsaved edits in hostel operational parameters</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} color="#0284c7" />
                <span>All hostel operational metrics & formulas synced with PostgreSQL database</span>
              </>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleBulkSaveAllMonths}
            disabled={savingBatch || isSavingLocal}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #00a2e8',
              color: '#0087c2',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}
          >
            <Table size={14} />
            <span>Save All Months (Bulk)</span>
          </button>

          <button
            type="button"
            onClick={handleDirectSaveActive}
            disabled={savingBatch || isSavingLocal || isClosed}
            style={{
              padding: '8px 22px',
              borderRadius: '6px',
              backgroundColor: isClosed ? '#cbd5e1' : '#00a2e8',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '800',
              border: 'none',
              cursor: isClosed ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isClosed ? 'none' : '0 2px 6px rgba(0, 162, 232, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <Save size={15} />
            <span>{isSavingLocal || savingBatch ? 'Saving...' : `💾 Save Hostel Data for ${activePeriodObj?.period_label || 'Month'}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
