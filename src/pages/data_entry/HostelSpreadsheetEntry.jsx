import React, { useState } from 'react';
import { formatINR } from '../../utils/formatters';
import { Save, RefreshCw, FileSpreadsheet, CheckCircle2, Zap, Droplets, BedDouble, AlertCircle, FileText } from 'lucide-react';

export default function HostelSpreadsheetEntry({
  activePeriodObj,
  computedMatrix,
  editingPeriodId,
  setEditingPeriodId,
  hostelCensusDraft = {},
  handleHostelCensusChange,
  handleSaveActiveMonth,
  savingBatch,
  isDirty
}) {
  const [activeSubTab, setActiveSubTab] = useState('combined'); // 'combined', 'template', 'utilities'
  const [localMessage, setLocalMessage] = useState(null);

  const currStr = String(editingPeriodId);
  const currH = hostelCensusDraft?.[currStr] || {};
  const isClosed = !!activePeriodObj?.is_closed;

  // Helper to update draft
  const updateField = (field, value) => {
    if (isClosed) return;
    handleHostelCensusChange?.(field, value);
  };

  // --- 1. RESIDENT CENSUS VALUES & AUTO-CALCULATIONS ---
  const bed_capacity_boys = parseInt(currH.bed_capacity_boys !== undefined ? currH.bed_capacity_boys : 2223, 10) || 0;
  const bed_capacity_girls = parseInt(currH.bed_capacity_girls !== undefined ? currH.bed_capacity_girls : 896, 10) || 0;
  const bed_capacity_total = bed_capacity_boys + bed_capacity_girls; // 3,119

  const students_boys = parseInt(currH.students_boys !== undefined ? currH.students_boys : 2075, 10) || 0;
  const students_girls = parseInt(currH.students_girls !== undefined ? currH.students_girls : 768, 10) || 0;
  const students_total = students_boys + students_girls; // 2,843

  const staff_boys = parseInt(currH.staff_boys !== undefined ? currH.staff_boys : 72, 10) || 0;
  const staff_girls = parseInt(currH.staff_girls !== undefined ? currH.staff_girls : 59, 10) || 0;
  const staff_total = staff_boys + staff_girls; // 131

  const total_occupied_boys = students_boys + staff_boys; // 2,147
  const total_occupied_girls = students_girls + staff_girls; // 827
  const total_occupied = total_occupied_boys + total_occupied_girls; // 2,974

  const vacant_boys = bed_capacity_boys - total_occupied_boys; // 76
  const vacant_girls = bed_capacity_girls - total_occupied_girls; // 69
  const vacant_total = bed_capacity_total - total_occupied; // 145

  const vacant_college_boys = currH.vacant_college_boys !== undefined ? currH.vacant_college_boys : -41;
  const vacant_college_girls = currH.vacant_college_girls !== undefined ? currH.vacant_college_girls : 69;
  const vacant_college_total = (parseInt(vacant_college_boys, 10) || 0) + (parseInt(vacant_college_girls, 10) || 0); // 28

  const vacant_sports_boys = currH.vacant_sports_boys !== undefined ? currH.vacant_sports_boys : '';
  const vacant_sports_girls = currH.vacant_sports_girls !== undefined ? currH.vacant_sports_girls : '';
  const vacant_sports_total = (parseInt(vacant_sports_boys, 10) || 0) + (parseInt(vacant_sports_girls, 10) || 0);

  const vacant_school_boys = currH.vacant_school_boys !== undefined ? currH.vacant_school_boys : '';
  const vacant_school_girls = currH.vacant_school_girls !== undefined ? currH.vacant_school_girls : '';
  const vacant_school_total = (parseInt(vacant_school_boys, 10) || 0) + (parseInt(vacant_school_girls, 10) || 0);

  const occupied_pct_boys = bed_capacity_boys > 0 ? ((total_occupied_boys / bed_capacity_boys) * 100).toFixed(1) : '#VALUE!';
  const occupied_pct_girls = bed_capacity_girls > 0 ? ((total_occupied_girls / bed_capacity_girls) * 100).toFixed(0) + '%' : '0%';
  const occupied_pct_total = bed_capacity_total > 0 ? ((total_occupied / bed_capacity_total) * 100).toFixed(0) + '%' : '0%';

  const vacant_pct_boys = bed_capacity_boys > 0 ? ((vacant_boys / bed_capacity_boys) * 100).toFixed(0) + '%' : '0%';
  const vacant_pct_girls = bed_capacity_girls > 0 ? ((vacant_girls / bed_capacity_girls) * 100).toFixed(0) + '%' : '0%';
  const vacant_pct_total = bed_capacity_total > 0 ? ((vacant_total / bed_capacity_total) * 100).toFixed(0) + '%' : '0%';

  const students_vacated = currH.students_vacated !== undefined ? currH.students_vacated : 86;

  // --- 2. MAINTENANCE & QUALITY TICKETS VALUES ---
  const tickets_received = parseInt(currH.tickets_received !== undefined ? currH.tickets_received : 176, 10) || 0;
  const tickets_closed = parseInt(currH.tickets_closed !== undefined ? currH.tickets_closed : 176, 10) || 0;
  const tickets_open = Math.max(0, tickets_received - tickets_closed); // 0
  const total_hours_close = currH.total_hours_close !== undefined ? currH.total_hours_close : '';
  const tat_hours = currH.tat_hours !== undefined ? currH.tat_hours : 62.29;

  const quality_issues_received = parseInt(currH.quality_issues_received !== undefined ? currH.quality_issues_received : 5, 10) || 0;
  const quality_issues_closed = parseInt(currH.quality_issues_closed !== undefined ? currH.quality_issues_closed : 3, 10) || 0;
  const quality_issues_open = Math.max(0, quality_issues_received - quality_issues_closed); // 2
  const incidents_count = parseInt(currH.incidents_count !== undefined ? currH.incidents_count : 0, 10) || 0;

  // --- 3. UTILITIES & BUDGET VALUES ---
  const power_units = currH.power_units !== undefined ? currH.power_units : 108201;
  const power_cost = currH.power_cost !== undefined ? currH.power_cost : 1325151;
  const water_purchase_cost = currH.water_purchase_cost !== undefined ? currH.water_purchase_cost : 248765;
  const maintenance_expenses = currH.maintenance_expenses !== undefined ? currH.maintenance_expenses : 119394;
  const expenses_occurred = currH.expenses_occurred !== undefined ? currH.expenses_occurred : 9349172;

  const approved_budget = currH.approved_budget !== undefined ? currH.approved_budget : 131788118;
  const cumulative_budget_spent = currH.cumulative_budget_spent !== undefined ? currH.cumulative_budget_spent : 34527814;
  const balance = (parseFloat(approved_budget) || 0) - (parseFloat(cumulative_budget_spent) || 0); // 9,72,60,304

  // --- 4. UNIT ECONOMICS & EFFICIENCY ---
  const sq_feet = parseFloat(currH.sq_feet !== undefined ? currH.sq_feet : 231701) || 231701;
  const per_student_cost_month = students_total > 0 ? Math.round((parseFloat(expenses_occurred) || 0) / students_total) : 3288;
  const per_student_cost_day = Math.round(per_student_cost_month / 30); // 110
  const sq_feet_per_occupant = total_occupied > 0 ? (sq_feet / total_occupied).toFixed(0) : '81';

  const normal_water_litres = parseFloat(currH.normal_water_litres !== undefined ? currH.normal_water_litres : 8202000) || 0;
  const normal_water_cost = parseFloat(currH.normal_water_cost !== undefined ? currH.normal_water_cost : 820200) || 0;
  const drinking_water_litres = parseFloat(currH.drinking_water_litres !== undefined ? currH.drinking_water_litres : 92800) || 0;
  const drinking_water_cost = parseFloat(currH.drinking_water_cost !== undefined ? currH.drinking_water_cost : 23200) || 0;

  const normal_water_student_ltrs = currH.normal_water_student_ltrs !== undefined ? currH.normal_water_student_ltrs : 0;
  const normal_water_student_cost = currH.normal_water_student_cost !== undefined ? currH.normal_water_student_cost : 88;

  // Detailed Efficiency Metrics for Image 1:
  const power_cost_sqft = sq_feet > 0 ? ((parseFloat(power_cost) || 0) / sq_feet).toFixed(1) : '6.3';
  const units_per_occupant = total_occupied > 0 ? ((parseFloat(power_units) || 0) / total_occupied).toFixed(1) : '35.3';
  const power_cost_occupant = total_occupied > 0 ? Math.round((parseFloat(power_cost) || 0) / total_occupied) : 494;

  const normal_water_ltr_day = total_occupied > 0 ? (normal_water_litres / total_occupied / 30).toFixed(2) : '91.93';
  const normal_water_cost_day = total_occupied > 0 ? (normal_water_cost / total_occupied / 30).toFixed(2) : '9.19';

  const drinking_water_ltr_day = total_occupied > 0 ? (drinking_water_litres / total_occupied / 30).toFixed(2) : '1.04';
  const drinking_water_cost_day = total_occupied > 0 ? (drinking_water_cost / total_occupied / 30).toFixed(2) : '0.26';

  // Dedicated Save Handler for Hostel Template
  const handleDirectSave = async () => {
    try {
      setLocalMessage(null);
      // Synchronize all computed values to draft
      handleHostelCensusChange?.({
        bed_capacity_boys,
        bed_capacity_girls,
        bed_capacity_total,
        students_boys,
        students_girls,
        students_total,
        staff_boys,
        staff_girls,
        staff_total,
        total_occupied,
        vacant_total,
        vacant_college: vacant_college_total,
        vacant_college_boys: parseInt(vacant_college_boys, 10) || 0,
        vacant_college_girls: parseInt(vacant_college_girls, 10) || 0,
        vacant_sports_boys: parseInt(vacant_sports_boys, 10) || 0,
        vacant_sports_girls: parseInt(vacant_sports_girls, 10) || 0,
        vacant_sports_total,
        vacant_school_boys: parseInt(vacant_school_boys, 10) || 0,
        vacant_school_girls: parseInt(vacant_school_girls, 10) || 0,
        vacant_school_total,
        occupied_pct: parseFloat(occupied_pct_total) || 95.35,
        vacant_pct: parseFloat(vacant_pct_total) || 4.65,
        students_vacated: parseInt(students_vacated, 10) || 0,
        tickets_received,
        tickets_closed,
        tickets_open,
        total_hours_close: parseFloat(total_hours_close) || 0,
        tat_hours: parseFloat(tat_hours) || 62.29,
        quality_issues_received,
        quality_issues_closed,
        quality_issues_open,
        incidents_count,
        power_units: parseInt(power_units, 10) || 0,
        power_cost: parseFloat(power_cost) || 0,
        water_purchase_cost: parseFloat(water_purchase_cost) || 0,
        maintenance_expenses: parseFloat(maintenance_expenses) || 0,
        expenses_occurred: parseFloat(expenses_occurred) || 0,
        approved_budget: parseFloat(approved_budget) || 0,
        cumulative_budget_spent: parseFloat(cumulative_budget_spent) || 0,
        sq_feet,
        normal_water_litres,
        normal_water_cost,
        drinking_water_litres,
        drinking_water_cost,
        normal_water_student_ltrs: parseFloat(normal_water_student_ltrs) || 0,
        normal_water_student_cost: parseFloat(normal_water_student_cost) || 88
      });

      // Call parent handleSaveActiveMonth
      if (handleSaveActiveMonth) {
        await handleSaveActiveMonth();
        setLocalMessage({ type: 'success', text: `Hostel operational parameters saved to PostgreSQL successfully!` });
        setTimeout(() => setLocalMessage(null), 4000);
      }
    } catch (err) {
      setLocalMessage({ type: 'error', text: err.message || 'Error saving hostel operational parameters' });
    }
  };

  // Reusable inline editable input cell
  const renderCellInput = (field, currentVal, placeholder = '', isNumeric = true, width = '100%') => (
    <input
      type={isNumeric ? 'number' : 'text'}
      value={currentVal !== undefined && currentVal !== null ? currentVal : ''}
      placeholder={placeholder}
      onChange={(e) => updateField(field, isNumeric ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
      disabled={isClosed}
      style={{
        width: width,
        padding: '3px 6px',
        border: '1px solid #cbd5e1',
        borderRadius: '4px',
        textAlign: isNumeric ? 'center' : 'left',
        fontSize: '13px',
        fontWeight: '600',
        backgroundColor: isClosed ? '#f8fafc' : '#ffffff',
        color: '#0f172a',
        outline: 'none',
        boxSizing: 'border-box'
      }}
    />
  );

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1.5px solid #059669',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.08)',
      overflow: 'hidden',
      marginBottom: '20px'
    }}>
      {/* 1. TOP SPREADSHEET HEADER & ACTION BAR */}
      <div style={{
        padding: '12px 18px',
        backgroundColor: '#ecfdf5',
        borderBottom: '1.5px solid #a7f3d0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#064e3b', margin: 0 }}>
                Hostel Operations & Resident Census Master Ledger
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#047857',
                backgroundColor: '#d1fae5',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid #6ee7b7'
              }}>
                hostel.xlsx (Sheet 1)
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: '#047857', margin: '2px 0 0 0' }}>
              Editing Cycle: <strong>{activePeriodObj?.period_label}</strong> • Auto-calculates Bed Occupancy, Utilities, Tickets, & Budget Balance
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#d1fae5',
            borderRadius: '6px',
            padding: '2px',
            border: '1px solid #a7f3d0'
          }}>
            <button
              type="button"
              onClick={() => setActiveSubTab('combined')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: activeSubTab === 'combined' ? '700' : '500',
                backgroundColor: activeSubTab === 'combined' ? '#ffffff' : 'transparent',
                color: activeSubTab === 'combined' ? '#065f46' : '#047857',
                border: 'none',
                cursor: 'pointer',
                boxShadow: activeSubTab === 'combined' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Combined View
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('template')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: activeSubTab === 'template' ? '700' : '500',
                backgroundColor: activeSubTab === 'template' ? '#ffffff' : 'transparent',
                color: activeSubTab === 'template' ? '#065f46' : '#047857',
                border: 'none',
                cursor: 'pointer',
                boxShadow: activeSubTab === 'template' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Master Template (Image 2)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('utilities')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: activeSubTab === 'utilities' ? '700' : '500',
                backgroundColor: activeSubTab === 'utilities' ? '#ffffff' : 'transparent',
                color: activeSubTab === 'utilities' ? '#065f46' : '#047857',
                border: 'none',
                cursor: 'pointer',
                boxShadow: activeSubTab === 'utilities' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Power & Water Analytics (Image 1)
            </button>
          </div>

          <button
            type="button"
            onClick={handleDirectSave}
            disabled={savingBatch || isClosed}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              backgroundColor: isClosed ? '#94a3b8' : '#059669',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: isClosed ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 5px rgba(5, 150, 105, 0.25)'
            }}
          >
            <Save size={14} />
            <span>{savingBatch ? 'Saving Data...' : '💾 Save Hostel Operational Parameters'}</span>
          </button>
        </div>
      </div>

      {localMessage && (
        <div style={{
          padding: '8px 18px',
          backgroundColor: localMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: localMessage.type === 'success' ? '#15803d' : '#b91c1c',
          fontSize: '12px',
          fontWeight: '700',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
          {localMessage.text}
        </div>
      )}

      {/* 2. MASTER HOSTEL TEMPLATE (IMAGE 2 REPLICA) */}
      {(activeSubTab === 'combined' || activeSubTab === 'template') && (
        <div style={{ overflowX: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
              📊 Excel Template Grid: Hostel Resident Census, Tickets & Budget
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Interactive editable cells • Auto-recalculates all sums and ratios live
            </span>
          </div>

          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12.5px',
            fontFamily: 'inherit',
            border: '1.5px solid #000000',
            backgroundColor: '#ffffff'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '1.5px solid #000000' }}>
                <th style={{ width: '45px', borderRight: '1px solid #000000', padding: '8px 4px', textAlign: 'center', fontWeight: '800' }}>S.No</th>
                <th style={{ width: '360px', borderRight: '1px solid #000000', padding: '8px 10px', textAlign: 'left', fontWeight: '800' }}>Parameters</th>
                <th style={{ width: '110px', borderRight: '1px solid #000000', padding: '8px 6px', textAlign: 'center', fontWeight: '800' }}>Boys</th>
                <th style={{ width: '110px', borderRight: '1px solid #000000', padding: '8px 6px', textAlign: 'center', fontWeight: '800' }}>Girls</th>
                <th style={{ width: '120px', borderRight: '1px solid #000000', padding: '8px 6px', textAlign: 'center', fontWeight: '800' }}>Total</th>
                <th style={{ width: '220px', padding: '8px 10px', textAlign: 'center', fontWeight: '800' }}>Cost / Notes</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Bed Capacity */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}>1</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '600' }}>Bed Capacity</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('bed_capacity_boys', bed_capacity_boys, '2223')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('bed_capacity_girls', bed_capacity_girls, '896')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', backgroundColor: '#f8fafc' }}>
                  {bed_capacity_total.toLocaleString()}
                </td>
                <td style={{ padding: '6px 10px', color: '#94a3b8', textAlign: 'center' }}>—</td>
              </tr>

              {/* Row 2: No. of students */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}>2</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '600' }}>No. of students</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('students_boys', students_boys, '2075')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('students_girls', students_girls, '768')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', backgroundColor: '#f8fafc' }}>
                  {students_total.toLocaleString()}
                </td>
                <td style={{ padding: '6px 10px', color: '#94a3b8', textAlign: 'center' }}>—</td>
              </tr>

              {/* Row 3: No. of staffs */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}>3</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '600' }}>No. of staffs</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('staff_boys', staff_boys, '72')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('staff_girls', staff_girls, '59')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', backgroundColor: '#f8fafc' }}>
                  {staff_total.toLocaleString()}
                </td>
                <td style={{ padding: '6px 10px', color: '#94a3b8', textAlign: 'center' }}>—</td>
              </tr>

              {/* Row 4: Total Occupied */}
              <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#f8fafc' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800' }}>4</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '800', color: '#0f172a' }}>Total Occupied</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#0f172a' }}>
                  {total_occupied_boys.toLocaleString()}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#0f172a' }}>
                  {total_occupied_girls.toLocaleString()}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#047857', backgroundColor: '#dcfce7' }}>
                  {total_occupied.toLocaleString()}
                </td>
                <td style={{ padding: '6px 10px', color: '#64748b', fontSize: '11px', textAlign: 'center' }}>Auto: Students + Staff</td>
              </tr>

              {/* Row 5: Vacant */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}>5</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '600' }}>Vacant</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>
                  {vacant_boys}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>
                  {vacant_girls}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800' }}>
                  {vacant_total}
                </td>
                <td style={{ padding: '6px 10px', color: '#64748b', fontSize: '11px', textAlign: 'center' }}>Auto: Capacity - Occupied</td>
              </tr>

              {/* Row 6: Vacant for college students */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}>6</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '600' }}>Vacant for college students</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('vacant_college_boys', vacant_college_boys, '-41')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('vacant_college_girls', vacant_college_girls, '69')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>
                  {vacant_college_total}
                </td>
                <td style={{ padding: '6px 10px', color: '#94a3b8', textAlign: 'center' }}>—</td>
              </tr>

              {/* Row 7: Vacant for college sports students */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', color: '#475569' }}>Vacant for college sports students (KPM hostel)</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('vacant_sports_boys', vacant_sports_boys, '0')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('vacant_sports_girls', vacant_sports_girls, '0')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}>
                  {vacant_sports_total || '—'}
                </td>
                <td style={{ padding: '6px 10px', color: '#94a3b8', textAlign: 'center' }}>—</td>
              </tr>

              {/* Row 8: Vacant for school students */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', color: '#475569' }}>Vacant for school students</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('vacant_school_boys', vacant_school_boys, '0')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('vacant_school_girls', vacant_school_girls, '0')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}>
                  {vacant_school_total || '—'}
                </td>
                <td style={{ padding: '6px 10px', color: '#94a3b8', textAlign: 'center' }}>—</td>
              </tr>

              {/* Row 9: Occupied % */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700' }}>Occupied %</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700', color: '#047857' }}>
                  {occupied_pct_boys !== '#VALUE!' ? `${occupied_pct_boys}%` : '#VALUE!'}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700', color: '#047857' }}>
                  {occupied_pct_girls}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#047857' }}>
                  {occupied_pct_total}
                </td>
                <td style={{ padding: '6px 10px', color: '#64748b', fontSize: '11px', textAlign: 'center' }}>Auto: Occupied / Capacity</td>
              </tr>

              {/* Row 10: Vacant % */}
              <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700' }}>Vacant %</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700', color: '#b45309' }}>
                  {vacant_pct_boys}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700', color: '#b45309' }}>
                  {vacant_pct_girls}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#b45309' }}>
                  {vacant_pct_total}
                </td>
                <td style={{ padding: '6px 10px', color: '#64748b', fontSize: '11px', textAlign: 'center' }}>Auto: Vacant / Capacity</td>
              </tr>

              {/* Row 11: Students Vacated */}
              <tr style={{ borderBottom: '1.5px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '600' }}>Students Vacated</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>—</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>—</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('students_vacated', students_vacated, '86')}
                </td>
                <td style={{ padding: '6px 10px', color: '#94a3b8', textAlign: 'center' }}>—</td>
              </tr>

              {/* --- YELLOW BLOCK: SPACE BASIC TICKETS (Rows 8 to 16) --- */}
              {/* Row 8: Maintenance Tickets Received */}
              <tr style={{ backgroundColor: '#fff3a8', borderBottom: '1px solid #eab308' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>8</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#713f12' }}>
                  No. of Maintenance Tickets Received
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('tickets_received', tickets_received, '176')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td rowSpan={5} style={{
                  verticalAlign: 'middle',
                  textAlign: 'center',
                  padding: '10px',
                  backgroundColor: '#fef08a',
                  borderLeft: '1px solid #000000',
                  borderBottom: '1px solid #eab308'
                }}>
                  <a
                    href="#tickets-log"
                    onClick={(e) => { e.preventDefault(); alert("Referencing Space basic tickets log for active period."); }}
                    style={{
                      color: '#2563eb',
                      textDecoration: 'underline',
                      fontWeight: '700',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FileText size={13} />
                    Space basic tickets {activePeriodObj?.period_label}.csv
                  </a>
                </td>
              </tr>

              {/* Row 9: Maintenance Tickets closed */}
              <tr style={{ backgroundColor: '#fff3a8', borderBottom: '1px solid #eab308' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>9</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#713f12' }}>
                  No. of Maintenance Tickets closed
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('tickets_closed', tickets_closed, '176')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
              </tr>

              {/* Row 10: Maintenance Tickets in Open */}
              <tr style={{ backgroundColor: '#fff3a8', borderBottom: '1px solid #eab308' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>10</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#713f12' }}>
                  No. of Maintenance Tickets in Open
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: tickets_open > 0 ? '#b91c1c' : '#15803d' }}>
                  {tickets_open}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
              </tr>

              {/* Row 11: Total Hours taken to close tickets */}
              <tr style={{ backgroundColor: '#fff3a8', borderBottom: '1px solid #eab308' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>11</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#713f12' }}>
                  Total Hours taken to close the tickets
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('total_hours_close', total_hours_close, 'Hours')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
              </tr>

              {/* Row 12: TAT Hours */}
              <tr style={{ backgroundColor: '#fff3a8', borderBottom: '1px solid #eab308' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>12</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#713f12' }}>
                  TAT (Turnaround Time)Hours
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('tat_hours', tat_hours, '62.29')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
              </tr>

              {/* Row 13: Quality issues Received */}
              <tr style={{ backgroundColor: '#fff3a8', borderBottom: '1px solid #eab308' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>13</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#713f12' }}>
                  No. of Quality issues Received
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('quality_issues_received', quality_issues_received, '5')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ padding: '6px 10px', color: '#94a3b8', textAlign: 'center' }}></td>
              </tr>

              {/* Row 14: Quality issues Closed */}
              <tr style={{ backgroundColor: '#fff3a8', borderBottom: '1px solid #eab308' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>14</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#713f12' }}>
                  No. of Quality issues Closed
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('quality_issues_closed', quality_issues_closed, '3')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ padding: '6px 10px', color: '#94a3b8', textAlign: 'center' }}></td>
              </tr>

              {/* Row 15: Quality issues in Open */}
              <tr style={{ backgroundColor: '#fff3a8', borderBottom: '1px solid #eab308' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>15</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#713f12' }}>
                  No. of Quality issues in Open
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: quality_issues_open > 0 ? '#b91c1c' : '#15803d' }}>
                  {quality_issues_open}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ padding: '6px 10px', color: '#94a3b8', textAlign: 'center' }}></td>
              </tr>

              {/* Row 16: No. of Incidents */}
              <tr style={{ backgroundColor: '#fff3a8', borderBottom: '1.5px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>16</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#713f12' }}>
                  No. of Incidents
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  {renderCellInput('incidents_count', incidents_count, '0')}
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ padding: '6px 10px', color: '#94a3b8', textAlign: 'center' }}></td>
              </tr>

              {/* --- ORANGE BLOCK: UTILITIES & CONSUMPTION EXPENSES (Rows 17 to 20) --- */}
              {/* Row 17: Power Consumption */}
              <tr style={{ backgroundColor: '#fed7aa', borderBottom: '1px solid #ea580c' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>17</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#7c2d12' }}>
                  Power Consumption
                </td>
                <td colSpan={2} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#7c2d12', fontWeight: '700' }}>Units:</span>
                    {renderCellInput('power_units', power_units, '108201', true, '110px')}
                  </div>
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#7c2d12' }}>
                  ₹
                </td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('power_cost', power_cost, '1325151', true, '140px')}
                </td>
              </tr>

              {/* Row 18: Water Purchase Expenses */}
              <tr style={{ backgroundColor: '#fed7aa', borderBottom: '1px solid #ea580c' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>18</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#7c2d12' }}>
                  Water Purchase Expenses
                </td>
                <td colSpan={2} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#7c2d12' }}>
                  ₹
                </td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('water_purchase_cost', water_purchase_cost, '248765', true, '140px')}
                </td>
              </tr>

              {/* Row: Maintenance Expenses */}
              <tr style={{ backgroundColor: '#fed7aa', borderBottom: '1px solid #ea580c' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#7c2d12' }}>
                  Maintenance Expenses
                </td>
                <td colSpan={2} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800', color: '#7c2d12' }}>
                  ₹
                </td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('maintenance_expenses', maintenance_expenses, '119394', true, '140px')}
                </td>
              </tr>

              {/* Row 20: Expenses occurred (Pinkish/Salmon Row) */}
              <tr style={{ backgroundColor: '#fecdd3', borderBottom: '1.5px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '800' }}>20</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '800', color: '#881337' }}>
                  Expenses occurred
                </td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', color: '#881337', fontSize: '11px', fontWeight: '600' }}>
                  Total Operational Outflow
                </td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('expenses_occurred', expenses_occurred, '9349172', true, '140px')}
                </td>
              </tr>

              {/* --- GREEN BLOCK: APPROVED BUDGET & BALANCE (Rows 22 to 24) --- */}
              {/* Row 22: Approved Budget */}
              <tr style={{ backgroundColor: '#bbf7d0', borderBottom: '1px solid #16a34a' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>22</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#14532d' }}>
                  Approved Budget
                </td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('approved_budget', approved_budget, '131788118', true, '140px')}
                </td>
              </tr>

              {/* Row 23: Cumulative Budget spent */}
              <tr style={{ backgroundColor: '#bbf7d0', borderBottom: '1px solid #16a34a' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', fontWeight: '700' }}>23</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#14532d' }}>
                  Cumulative Budget spent (Actual expenses) till now
                </td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('cumulative_budget_spent', cumulative_budget_spent, '34527814', true, '140px')}
                </td>
              </tr>

              {/* Row 24: Balance */}
              <tr style={{ backgroundColor: '#86efac', borderBottom: '1.5px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '7px', fontWeight: '900' }}>24</td>
                <td style={{ borderRight: '1px solid #000000', padding: '7px 10px', fontWeight: '900', color: '#052e16', fontSize: '13.5px' }}>
                  Balance
                </td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', color: '#14532d', fontSize: '11px', fontWeight: '700' }}>
                  Auto: Approved Budget - Cumulative Spent
                </td>
                <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: '900', fontSize: '14px', color: balance >= 0 ? '#052e16' : '#991b1b' }}>
                  {formatINR(balance)}
                </td>
              </tr>

              {/* --- WHITE BLOCK: UNIT ECONOMICS & AREA (Rows 25 to 27) --- */}
              {/* Row 25: Number of students */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}>25</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '600' }}>Number of students</td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', color: '#64748b', fontSize: '11.5px' }}>
                  Synced from Row 2 Total Students
                </td>
                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                  {students_total.toLocaleString()}
                </td>
              </tr>

              {/* Row 26: Per student cost per month */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}>26</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '600' }}>Per student cost per month</td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', color: '#64748b', fontSize: '11.5px' }}>
                  Expenses occurred / Number of students
                </td>
                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                  ₹{per_student_cost_month.toLocaleString()}
                </td>
              </tr>

              {/* Row 27: Per student cost per day */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}>27</td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '600' }}>Per student cost per day</td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', color: '#64748b', fontSize: '11.5px' }}>
                  Per student month cost / 30 days
                </td>
                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                  ₹{per_student_cost_day}
                </td>
              </tr>

              {/* Row: Sq feet */}
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '600' }}>Sq feet</td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  {renderCellInput('sq_feet', sq_feet, '231701', true, '140px')}
                </td>
              </tr>

              {/* Row: Sq feet per occupant in hostel */}
              <tr style={{ borderBottom: '1.5px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px' }}></td>
                <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', fontWeight: '600' }}>Sq feet per occupant in hostel</td>
                <td colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '6px', color: '#64748b', fontSize: '11.5px' }}>
                  Sq feet / Total Occupied
                </td>
                <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                  {sq_feet_per_occupant} sq.ft
                </td>
              </tr>

              {/* --- YELLOW BLOCK: WATER METRIC (Row 28) --- */}
              <tr style={{ backgroundColor: '#fef08a', borderBottom: '1.5px solid #000000' }}>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '7px', fontWeight: '800' }}>28</td>
                <td style={{ borderRight: '1px solid #000000', padding: '7px 10px', fontWeight: '800', color: '#713f12' }}>
                  Normal water per student per month(Ltrs& cost)
                </td>
                <td colSpan={2} style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#713f12', fontWeight: '700' }}>Ltrs:</span>
                    {renderCellInput('normal_water_student_ltrs', normal_water_student_ltrs, '0', true, '80px')}
                  </div>
                </td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #000000', padding: '4px' }}></td>
                <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#713f12', fontWeight: '700' }}>Cost ₹:</span>
                    {renderCellInput('normal_water_student_cost', normal_water_student_cost, '88', true, '100px')}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 3. DETAILED POWER & WATER CONSUMPTION BREAKDOWN (IMAGE 1 REPLICA) */}
      {(activeSubTab === 'combined' || activeSubTab === 'utilities') && (
        <div style={{ padding: '16px', borderTop: activeSubTab === 'combined' ? '1.5px solid #e2e8f0' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e293b' }}>
                ⚡ Image 1: Hostel Utilities & Unit Efficiency Metrics Breakdown
              </span>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                Granular power consumption, normal water, RO drinking water, and per-day occupancy costs
              </p>
            </div>
            <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#047857', backgroundColor: '#dcfce7', padding: '3px 10px', borderRadius: '4px' }}>
              Cycle: {activePeriodObj?.period_label}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
            alignItems: 'start'
          }}>
            {/* Table A: Power Consumption (Blue Block) */}
            <div style={{
              borderRadius: '8px',
              border: '1.5px solid #3b82f6',
              overflow: 'hidden',
              backgroundColor: '#ffffff'
            }}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#93c5fd',
                color: '#1e3a8a',
                fontWeight: '800',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Zap size={15} color="#1d4ed8" />
                <span>Power Consumption & Efficiency (EB + DG)</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                  <tr style={{ backgroundColor: '#dbeafe', borderBottom: '1px solid #bfdbfe' }}>
                    <td style={{ padding: '7px 12px', fontWeight: '600', color: '#1e3a8a', width: '65%' }}>
                      Power consumption units(EB + DG) Hostel
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '700', borderLeft: '1px solid #bfdbfe' }}>
                      {renderCellInput('power_units', power_units, '105116', true, '110px')}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#dbeafe', borderBottom: '1px solid #bfdbfe' }}>
                    <td style={{ padding: '7px 12px', fontWeight: '600', color: '#1e3a8a' }}>
                      Power consumption cost(EB + DG) Hostel
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '700', borderLeft: '1px solid #bfdbfe' }}>
                      {renderCellInput('power_cost', power_cost, '1469211', true, '110px')}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                    <td style={{ padding: '7px 12px', color: '#334155' }}>No of Students+ staff in Hostel</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: '700', borderLeft: '1px solid #bfdbfe' }}>
                      {total_occupied.toLocaleString()}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                    <td style={{ padding: '7px 12px', color: '#334155' }}>Sq feet Hostel</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '700', borderLeft: '1px solid #bfdbfe' }}>
                      {renderCellInput('sq_feet', sq_feet, '231701', true, '110px')}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#dbeafe', borderBottom: '1px solid #bfdbfe' }}>
                    <td style={{ padding: '7px 12px', fontWeight: '800', color: '#0f172a' }}>Power cost per sq feet</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: '800', color: '#1e40af', borderLeft: '1px solid #bfdbfe' }}>
                      {power_cost_sqft}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#dbeafe', borderBottom: '1px solid #bfdbfe' }}>
                    <td style={{ padding: '7px 12px', fontWeight: '800', color: '#0f172a' }}>Units per occupant per month - Hostel</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: '800', color: '#1e40af', borderLeft: '1px solid #bfdbfe' }}>
                      {units_per_occupant}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#bfdbfe', borderBottom: '1px solid #93c5fd' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '900', color: '#1e3a8a' }}>Power cost Per occupant per month - Hostel</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '900', color: '#1e3a8a', fontSize: '13px', borderLeft: '1px solid #93c5fd' }}>
                      ₹{power_cost_occupant}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table B: Normal Water Consumption (Green Block) */}
            <div style={{
              borderRadius: '8px',
              border: '1.5px solid #22c55e',
              overflow: 'hidden',
              backgroundColor: '#ffffff'
            }}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#86efac',
                color: '#14532d',
                fontWeight: '800',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Droplets size={15} color="#15803d" />
                <span>Normal Water Consumption & Daily Usage</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                  <tr style={{ backgroundColor: '#dcfce7', borderBottom: '1px solid #bbf7d0' }}>
                    <td style={{ padding: '7px 12px', fontWeight: '600', color: '#14532d', width: '65%' }}>
                      Normal Water Consumption Ltr Hostels
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '700', borderLeft: '1px solid #bbf7d0' }}>
                      {renderCellInput('normal_water_litres', normal_water_litres, '8202000', true, '110px')}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#dcfce7', borderBottom: '1px solid #bbf7d0' }}>
                    <td style={{ padding: '7px 12px', fontWeight: '600', color: '#14532d' }}>
                      Normal Water Consumption Cost Hostels
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '700', borderLeft: '1px solid #bbf7d0' }}>
                      {renderCellInput('normal_water_cost', normal_water_cost, '820200', true, '110px')}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                    <td style={{ padding: '7px 12px', color: '#334155' }}>No of Students in Hostels</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: '700', borderLeft: '1px solid #bbf7d0' }}>
                      {total_occupied.toLocaleString()}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#dcfce7', borderBottom: '1px solid #bbf7d0' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '900', color: '#14532d' }}>
                      Normal water Ltr per student per day - Hostels
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '900', color: '#15803d', fontSize: '13px', borderLeft: '1px solid #bbf7d0' }}>
                      {normal_water_ltr_day} Ltrs
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#bbf7d0', borderBottom: '1px solid #86efac' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '900', color: '#14532d' }}>
                      Normal Water cost Per student per day Hostels
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '900', color: '#14532d', fontSize: '13px', borderLeft: '1px solid #86efac' }}>
                      ₹{normal_water_cost_day}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table C: Drinking Water Consumption (Cyan Block) */}
            <div style={{
              borderRadius: '8px',
              border: '1.5px solid #06b6d4',
              overflow: 'hidden',
              backgroundColor: '#ffffff'
            }}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#67e8f9',
                color: '#164e63',
                fontWeight: '800',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Droplets size={15} color="#0891b2" />
                <span>Drinking Water Consumption (RO Purified)</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                  <tr style={{ backgroundColor: '#cffafe', borderBottom: '1px solid #a5f3fc' }}>
                    <td style={{ padding: '7px 12px', fontWeight: '600', color: '#164e63', width: '65%' }}>
                      Drinking Water Consumption Litres Hostels
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '700', borderLeft: '1px solid #a5f3fc' }}>
                      {renderCellInput('drinking_water_litres', drinking_water_litres, '92800', true, '110px')}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#cffafe', borderBottom: '1px solid #a5f3fc' }}>
                    <td style={{ padding: '7px 12px', fontWeight: '600', color: '#164e63' }}>
                      Drinking Water Consumption Cost Hostels
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '700', borderLeft: '1px solid #a5f3fc' }}>
                      {renderCellInput('drinking_water_cost', drinking_water_cost, '23200', true, '110px')}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#ecfeff', borderBottom: '1px solid #a5f3fc' }}>
                    <td style={{ padding: '7px 12px', color: '#334155' }}>No of Students in Hostels</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: '700', borderLeft: '1px solid #a5f3fc' }}>
                      {total_occupied.toLocaleString()}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#cffafe', borderBottom: '1px solid #a5f3fc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '900', color: '#164e63' }}>
                      Drinking water Litres per student per day- Hostels
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '900', color: '#0e7490', fontSize: '13px', borderLeft: '1px solid #a5f3fc' }}>
                      {drinking_water_ltr_day} Ltrs
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#a5f3fc', borderBottom: '1px solid #67e8f9' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '900', color: '#164e63' }}>
                      Drinking Water cost Per student per day Hostels
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '900', color: '#164e63', fontSize: '13px', borderLeft: '1px solid #67e8f9' }}>
                      ₹{drinking_water_cost_day}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. FOOTER STATUS BAR WITH DEDICATED SAVE BUTTON */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#f8fafc',
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
            gap: '4px',
            color: isDirty ? '#ea580c' : '#15803d',
            fontWeight: '700'
          }}>
            {isDirty ? (
              <>
                <AlertCircle size={14} color="#ea580c" />
                <span>Pending unsaved edits in hostel operational parameters</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} color="#15803d" />
                <span>All hostel operational metrics synced with PostgreSQL</span>
              </>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleDirectSave}
            disabled={savingBatch || isClosed}
            style={{
              padding: '7px 20px',
              borderRadius: '6px',
              backgroundColor: isClosed ? '#94a3b8' : '#059669',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '700',
              border: 'none',
              cursor: isClosed ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
            }}
          >
            <Save size={15} />
            <span>{savingBatch ? 'Saving...' : `Save Hostel Data for ${activePeriodObj?.period_label || 'Month'}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
