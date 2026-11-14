import React, { useState } from 'react';
import { formatINR } from '../../utils/formatters';
import { 
  Save, RefreshCw, FileSpreadsheet, CheckCircle2, Zap, Bus,
  AlertCircle, FileText, Check, ArrowRight, Layers, Table, Fuel, DollarSign, Gauge
} from 'lucide-react';

export default function TransportSpreadsheetEntry({
  activePeriodObj,
  computedMatrix,
  editingPeriodId,
  setEditingPeriodId,
  transportCensusDraft = {},
  handleTransportCensusChange,
  handleSaveActiveMonth,
  savingBatch,
  isDirty,
  fetchData
}) {
  const [activeSubTab, setActiveSubTab] = useState('combined'); // 'combined', 'template', 'multi_month'
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

  // --- PURE FORMULA ENGINE: Calculates all formulas matching transport.xlsx ---
  const getTransportMetrics = (periodId) => {
    const pStr = String(periodId);
    const d = transportCensusDraft[pStr] || {};

    // 1. Fleet & Commuters (Rows 2-3)
    const vehicles_count = d.vehicles_count !== undefined && d.vehicles_count !== '' ? String(d.vehicles_count) : '18+1';
    const passengers_count = num(d.passengers_count, 447);
    const students_count = num(d.students_count, 412);
    const staff_count = num(d.staff_count, 35);

    // 2. Trip Mileage (Rows 4-8)
    const approved_kms = num(d.approved_kms, 26691);
    const actual_kms = num(d.actual_kms, 25777);
    const additional_kms = num(d.additional_kms, 2481);
    const excess_kms_rps = num(d.excess_kms_rps, 0);
    const excess_km_billed_rps = num(d.excess_km_billed_rps, 0);

    // 3. Operating Expenses (Rows 9-14)
    const fuel_expenses = num(d.fuel_expenses, 487375);
    const fc_cost = num(d.fc_cost, 0);
    const statutory_cost = num(d.statutory_cost, 0);
    const repair_maintenance_cost = num(d.repair_maintenance_cost, 0);
    const other_cost = num(d.other_cost, 0);
    const employee_cost = num(d.employee_cost, 0);

    // Row 15: Total Expenses = SUM(fuel + fc + statutory + repair + other + employee)
    const total_expenses = fuel_expenses + fc_cost + statutory_cost + repair_maintenance_cost + other_cost + employee_cost;

    // 4. Revenue & Collections (Rows 16-25 & 38-42)
    const fee_demand = num(d.fee_demand, 0);
    const fee_discount = num(d.fee_discount, 0);
    const fee_collected = num(d.fee_collected, 0);
    const fee_unpaid = Math.max(0, fee_demand - fee_discount - fee_collected);

    const rps_monthly_billing = num(d.rps_monthly_billing, 0);
    const staff_travel_deduction = num(d.staff_travel_deduction, 0);
    const additional_kms_billed_rps = num(d.additional_kms_billed_rps, 0);
    const additional_kms_others_billing = num(d.additional_kms_others_billing, 0);
    const cab_billing = num(d.cab_billing, 0);

    // Row 25: Cumulative Income
    const cumulative_income = fee_collected + rps_monthly_billing + staff_travel_deduction + 
                              additional_kms_billed_rps + additional_kms_others_billing + cab_billing;

    // 5. Budget & Balance (Rows 26-28)
    const approved_budget = num(d.approved_budget, 13730137.73);
    const cumulative_budget_spent = num(d.cumulative_budget_spent, total_expenses > 0 ? total_expenses : 6600000);
    const balance = approved_budget - cumulative_budget_spent;

    // 6. Tickets & Quality (Rows 29-34)
    const service_tickets_raised = num(d.service_tickets_raised, 38);
    const service_tickets_closed = num(d.service_tickets_closed, 38);
    const service_tickets_open = Math.max(0, service_tickets_raised - service_tickets_closed);

    const quality_issues_received = num(d.quality_issues_received, 0);
    const quality_issues_closed = num(d.quality_issues_closed, 0);
    const quality_issues_open = Math.max(0, quality_issues_received - quality_issues_closed);

    // 7. Safety & Compliance (Rows 35-37)
    const statutory_compliance = num(d.statutory_compliance, 1);
    const incidents_count = num(d.incidents_count, 1);
    const diesel_litres = num(d.diesel_litres, 5184.84);

    // 8. Unit Economics & Efficiency Ratios (Rows 43-49)
    const per_student_cost_expenses = passengers_count > 0 ? (total_expenses / passengers_count).toFixed(2) : '0.00';
    const per_student_fee_year = students_count > 0 ? (fee_demand / students_count).toFixed(2) : '0.00';
    const demand_per_km_day = actual_kms > 0 ? (fee_demand / (actual_kms * 30)).toFixed(2) : '0.00';
    const km_per_veh_day = (actual_kms / (19 * 30)).toFixed(2);
    const fuel_cost_per_km = actual_kms > 0 ? (fuel_expenses / actual_kms).toFixed(2) : '0.00';
    const diesel_per_100km = actual_kms > 0 ? ((diesel_litres / actual_kms) * 100).toFixed(2) : '0.00';

    return {
      vehicles_count,
      passengers_count,
      students_count,
      staff_count,
      approved_kms,
      actual_kms,
      additional_kms,
      excess_kms_rps,
      excess_km_billed_rps,
      fuel_expenses,
      fc_cost,
      statutory_cost,
      repair_maintenance_cost,
      other_cost,
      employee_cost,
      total_expenses,
      fee_demand,
      fee_discount,
      fee_collected,
      fee_unpaid,
      rps_monthly_billing,
      staff_travel_deduction,
      additional_kms_billed_rps,
      additional_kms_others_billing,
      cab_billing,
      cumulative_income,
      approved_budget,
      cumulative_budget_spent,
      balance,
      service_tickets_raised,
      service_tickets_closed,
      service_tickets_open,
      quality_issues_received,
      quality_issues_closed,
      quality_issues_open,
      statutory_compliance,
      incidents_count,
      diesel_litres,
      per_student_cost_expenses,
      per_student_fee_year,
      demand_per_km_day,
      km_per_veh_day,
      fuel_cost_per_km,
      diesel_per_100km,
      remarks: d.remarks || ''
    };
  };

  const currM = getTransportMetrics(editingPeriodId);

  // Field change handler for active month
  const handleChange = (field, value) => {
    handleTransportCensusChange(field, value, editingPeriodId);
  };

  // Field change handler for arbitrary target month
  const handleCellChange = (periodId, field, value) => {
    handleTransportCensusChange(field, value, periodId);
  };

  // Save current month directly to DB
  const handleSaveCurrentMonthDirect = async () => {
    setIsSavingLocal(true);
    setLocalMessage(null);
    try {
      const payload = {
        ...transportCensusDraft[currStr],
        ...currM
      };
      const res = await fetch(`/api/transport-census/${editingPeriodId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save transport fleet data');
      }
      setLocalMessage({ type: 'success', text: `Saved transport fleet metrics for ${activePeriodObj?.period_label || 'current cycle'} directly to DB!` });
      if (fetchData) fetchData();
    } catch (err) {
      setLocalMessage({ type: 'error', text: err.message || 'Save error' });
    } finally {
      setIsSavingLocal(false);
      setTimeout(() => setLocalMessage(null), 5000);
    }
  };

  // Save all months in multi-month grid
  const handleSaveAllMonthsBulk = async () => {
    setIsSavingLocal(true);
    setLocalMessage(null);
    try {
      const allDrafts = {};
      periods.forEach(p => {
        const pStr = String(p.id);
        const m = getTransportMetrics(p.id);
        allDrafts[pStr] = {
          ...(transportCensusDraft[pStr] || {}),
          ...m
        };
      });

      const res = await fetch('/api/transport-census-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months: allDrafts })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Bulk save failed');
      }
      const data = await res.json();
      setLocalMessage({ type: 'success', text: `Bulk Save Success: ${data.message || 'All transport fleet periods saved to DB!'}` });
      if (fetchData) fetchData();
    } catch (err) {
      setLocalMessage({ type: 'error', text: err.message || 'Bulk save failed' });
    } finally {
      setIsSavingLocal(false);
      setTimeout(() => setLocalMessage(null), 5000);
    }
  };

  // Clear / Reset Active Month
  const handleClearMonth = () => {
    if (window.confirm(`Are you sure you want to reset transport entries for ${activePeriodObj?.period_label}?`)) {
      handleTransportCensusChange({
        vehicles_count: '18+1',
        passengers_count: 447,
        students_count: 412,
        staff_count: 35,
        approved_kms: 26691,
        actual_kms: 25777,
        additional_kms: 2481,
        excess_kms_rps: 0,
        fuel_expenses: 487375,
        diesel_litres: 5184.84,
        fc_cost: 0,
        statutory_cost: 0,
        repair_maintenance_cost: 0,
        employee_cost: 0,
        other_cost: 0,
        service_tickets_raised: 38,
        service_tickets_closed: 38,
        quality_issues_received: 0,
        quality_issues_closed: 0,
        statutory_compliance: 1,
        incidents_count: 1,
        approved_budget: 13730137.73,
        cumulative_budget_spent: 0,
        remarks: ''
      }, null, editingPeriodId);
      setLocalMessage({ type: 'success', text: `Reset ${activePeriodObj?.period_label} to transport baseline!` });
    }
  };

  // Reusable inline input cell component matching Excel Grid style
  const renderCellInput = (field, currentVal, placeholder = '', isNumeric = true, width = '140px') => {
    return (
      <input
        type={isNumeric ? 'number' : 'text'}
        step={isNumeric ? '0.01' : undefined}
        value={currentVal !== undefined && currentVal !== null ? currentVal : ''}
        placeholder={placeholder}
        onChange={(e) => {
          const val = isNumeric ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
          handleChange(field, val);
        }}
        disabled={isClosed}
        style={{
          width: width,
          padding: '4px 8px',
          border: '1px solid #000000',
          borderRadius: '3px',
          textAlign: isNumeric ? 'right' : 'center',
          fontSize: '12.5px',
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
      {/* 1. SPREADSHEET HEADER & ACTION BAR */}
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
            <Bus size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '16.5px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                Transport Fleet Master Spreadsheet
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
              Full Excel formula calculations • Rows 1–50 Master Parameters • Multi-Month Comparison & Persistence
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleClearMonth}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <span>Clear / Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAllMonthsBulk}
            disabled={isSavingLocal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '800',
              cursor: isSavingLocal ? 'not-allowed' : 'pointer'
            }}
          >
            <Layers size={13} />
            <span>Save All Months (Bulk)</span>
          </button>

          <button
            type="button"
            onClick={handleSaveCurrentMonthDirect}
            disabled={isSavingLocal}
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
              cursor: isSavingLocal ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
            }}
          >
            {isSavingLocal ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
            <span>💾 Save All Rows & Values to DB</span>
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

      {/* 3. MONTH SELECTOR SUBBAR */}
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
            📅 Active Month:
          </span>
          {periods.map(p => {
            const isSel = String(p.id) === currStr;
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
                  border: isSel ? '2px solid #00a2e8' : '1px solid #bae6fd',
                  backgroundColor: isSel ? '#00a2e8' : '#ffffff',
                  color: isSel ? '#ffffff' : '#0369a1',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isSel ? '0 2px 4px rgba(0, 162, 232, 0.3)' : 'none'
                }}
              >
                <span>{p.period_label}</span>
                {isSel && <Check size={12} color="#ffffff" />}
              </button>
            );
          })}
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffffff', padding: '3px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('combined')}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'combined' ? '#00a2e8' : 'transparent',
              color: activeSubTab === 'combined' ? '#ffffff' : '#0369a1'
            }}
          >
            All Views
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('template')}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'template' ? '#00a2e8' : 'transparent',
              color: activeSubTab === 'template' ? '#ffffff' : '#0369a1'
            }}
          >
            Table 1: Master Parameters
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('multi_month')}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'multi_month' ? '#00a2e8' : 'transparent',
              color: activeSubTab === 'multi_month' ? '#ffffff' : '#0369a1'
            }}
          >
            Table 2: Multi-Month Grid
          </button>
        </div>
      </div>

      {/* 4. FORMULA BAR RIBBON */}
      <div style={{
        padding: '8px 20px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '12px'
      }}>
        <div style={{ fontWeight: '800', color: '#00a2e8', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>fx</span>
        </div>
        <div style={{ height: '14px', width: '1px', backgroundColor: '#cbd5e1' }} />
        <div style={{ fontFamily: 'monospace', color: '#334155', fontSize: '11.5px', flex: 1 }}>
          <strong>Total Expenses:</strong> =SUM(Fuel + FC + Statutory + Repair + Other + Employee) | <strong>Unpaid:</strong> =Demand - Discount - Paid | <strong>Balance:</strong> =Approved Budget - Budget Spent
        </div>
      </div>

      {/* 5. TABLE 1: MASTER PARAMETERS & TRIP METRICS (transport.xlsx Rows 1-50) */}
      {(activeSubTab === 'combined' || activeSubTab === 'template') && (
        <div style={{ padding: '16px 20px', borderBottom: '2px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={16} color="#00a2e8" />
              <span>Table 1: Transport Parameters Specification & Operational Census ({activePeriodObj?.period_label})</span>
            </h3>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Editable inputs recalculate all formulas live in real time
            </span>
          </div>

          <div style={{ overflowX: 'auto', border: '2px solid #000000', borderRadius: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', backgroundColor: '#ffffff' }}>
              <thead>
                <tr style={{ backgroundColor: '#00a2e8', borderBottom: '2px solid #000000', color: '#000000', fontWeight: '800' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'center', width: '60px', borderRight: '1px solid #000000' }}>S.No</th>
                  <th style={{ padding: '8px 16px', textAlign: 'left', borderRight: '1px solid #000000' }}>Parameters</th>
                  <th style={{ padding: '8px 16px', textAlign: 'center', width: '220px', backgroundColor: '#00a2e8', color: '#000000', borderRight: '1px solid #000000' }}>
                    {activePeriodObj?.period_label} • Value / Input
                  </th>
                  <th style={{ padding: '8px 16px', textAlign: 'left', width: '240px', color: '#000000' }}>
                    Excel Formula / Reference
                  </th>
                </tr>
              </thead>
              <tbody>

                {/* --- SECTION: FLEET SIZE & COMMUTERS --- */}
                <tr style={{ backgroundColor: '#ffc90e', fontWeight: '800', color: '#000000', borderBottom: '1px solid #000000' }}>
                  <td colSpan={4} style={{ padding: '6px 14px', letterSpacing: '0.04em', fontSize: '11.5px' }}>
                    🚌 FLEET ASSETS & COMMUTER VOLUME
                  </td>
                </tr>

                {/* Row 2: Number of vehicles */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>1</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Number of vehicles</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('vehicles_count', currM.vehicles_count, '18+1', false, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Fleet configuration (18 buses + 1 spare)</td>
                </tr>

                {/* Row 3: Number of students & staff travelling */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>2</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Number of students & staff travelling</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('passengers_count', currM.passengers_count, '447', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Total Commuter Pass Holders</td>
                </tr>

                {/* --- SECTION: TRIP MILEAGE & RPS RUNS --- */}
                <tr style={{ backgroundColor: '#dcdde1', fontWeight: '800', color: '#000000', borderBottom: '1px solid #000000' }}>
                  <td colSpan={4} style={{ padding: '6px 14px', letterSpacing: '0.04em', fontSize: '11.5px' }}>
                    🗺️ TRIP DISTANCE & KILOMETERS LOG
                  </td>
                </tr>

                {/* Row 4: Approved trip KMs */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>3</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Approved trip KMs</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('approved_kms', currM.approved_kms, '26691', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Monthly approved route mileage target</td>
                </tr>

                {/* Row 5: Actual trip KMs */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>4</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Actual trip KMs</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('actual_kms', currM.actual_kms, '25777', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Odometer verified actual run KMs</td>
                </tr>

                {/* Row 6: Excess/minus KMs run for RPS */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>5</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Excess/ minus KMs run for RPS</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('excess_kms_rps', currM.excess_kms_rps, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>RPS excess/deficit adjustment</td>
                </tr>

                {/* Row 7: Excess KM to be billed for RPS */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>6</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Excess KM to be billed for RPS</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('excess_km_billed_rps', currM.excess_km_billed_rps, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Billed to Rathinam Public School</td>
                </tr>

                {/* Row 8: Additional KMs run */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>7</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Additional KMs run</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('additional_kms', currM.additional_kms, '2481', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Extra academic, athletic & special trips</td>
                </tr>

                {/* --- SECTION: OPERATIONAL EXPENSES (ROWS 9-15) --- */}
                <tr style={{ backgroundColor: '#ffc90e', fontWeight: '800', color: '#000000', borderBottom: '1px solid #000000' }}>
                  <td colSpan={4} style={{ padding: '6px 14px', letterSpacing: '0.04em', fontSize: '11.5px' }}>
                    ⛽ OPERATIONAL EXPENSES (RS)
                  </td>
                </tr>

                {/* Row 9: Fuel expenses (Rs) */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>8</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Fuel expenses (Rs)</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('fuel_expenses', currM.fuel_expenses, '487375', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Sheet1!$H$4 (Diesel bulk purchase cost)</td>
                </tr>

                {/* Row 10: FC 2025-2026 */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>9</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>FC 2025-2026</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('fc_cost', currM.fc_cost, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Fitness certificate compliance fee</td>
                </tr>

                {/* Row 11: Vehicle Statutory */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>10</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Vehicle Statutory</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('statutory_cost', currM.statutory_cost, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>RTO taxes, road permits & insurance</td>
                </tr>

                {/* Row 12: Repair & Maintenance */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>11</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Repair & Maintenance</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('repair_maintenance_cost', currM.repair_maintenance_cost, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Fleet service, tyres, batteries & parts</td>
                </tr>

                {/* Row 13: Others */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>12</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Others</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('other_cost', currM.other_cost, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Tolls, fastag, washing & miscellaneous</td>
                </tr>

                {/* Row 14: Transport Employees Cost */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>13</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Transport Employees Cost</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('employee_cost', currM.employee_cost, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Drivers & cleaners salaries</td>
                </tr>

                {/* Row 15: Total Expenses = SUM(C9:C14) */}
                <tr style={{ backgroundColor: '#00ff00', borderTop: '2px solid #000000', borderBottom: '2px solid #000000', fontWeight: '800' }}>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: '#000000', borderRight: '1px solid #000000' }}>14</td>
                  <td style={{ padding: '8px 16px', color: '#000000', fontSize: '13px', borderRight: '1px solid #000000' }}>
                    Total Expenses
                  </td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#000000', fontSize: '14px', borderRight: '1px solid #000000' }} className="currency-font">
                    <strong>{formatINR(currM.total_expenses)}</strong>
                  </td>
                  <td style={{ padding: '8px 16px', color: '#000000', fontWeight: '700', fontFamily: 'monospace' }}>
                    =SUM(C9:C14)
                  </td>
                </tr>

                {/* --- SECTION: REVENUE, BILLING & COLLECTIONS (ROWS 16-25 & 38-42) --- */}
                <tr style={{ backgroundColor: '#a8d8ea', fontWeight: '800', color: '#000000', borderBottom: '1px solid #000000' }}>
                  <td colSpan={4} style={{ padding: '6px 14px', letterSpacing: '0.04em', fontSize: '11.5px' }}>
                    💰 COMMUTER BILLING & REVENUE COLLECTION
                  </td>
                </tr>

                {/* Row 18/39: Demand */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>17</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Fee Demand</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('fee_demand', currM.fee_demand, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Total student & staff transport fees demanded</td>
                </tr>

                {/* Row 40: Discount */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>31</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Discount / Concession</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('fee_discount', currM.fee_discount, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Scholarship & staff concessions</td>
                </tr>

                {/* Row 19/41: Paid */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>18</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Paid (Collected)</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('fee_collected', currM.fee_collected, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Fees realized in transport account</td>
                </tr>

                {/* Row 20/42: Unpaid */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', borderRight: '1px solid #000000' }}>19</td>
                  <td style={{ padding: '6px 16px', fontWeight: '800', color: '#000000', borderRight: '1px solid #000000' }}>Unpaid Outstanding</td>
                  <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '800', color: '#000000', borderRight: '1px solid #000000' }} className="currency-font">
                    {formatINR(currM.fee_unpaid)}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontWeight: '700', fontFamily: 'monospace' }}>
                    =Demand - Discount - Paid
                  </td>
                </tr>

                {/* Row 21: RPS monthly billing */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>20</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>RPS monthly billing</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('rps_monthly_billing', currM.rps_monthly_billing, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Rathinam Public School contract invoice</td>
                </tr>

                {/* Row 22: Staff Travel Deduction */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>21</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Staff Travel Deduction</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('staff_travel_deduction', currM.staff_travel_deduction, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Payroll transport deductions</td>
                </tr>

                {/* Row 23: Additional KMs Billed for RPS */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>22</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Additional KMs Billed for RPS</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('additional_kms_billed_rps', currM.additional_kms_billed_rps, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Special events & weekend trips billed</td>
                </tr>

                {/* Row 24: Additional KMs run for others Billing */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>23</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Additional KMs run for others Billing</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('additional_kms_others_billing', currM.additional_kms_others_billing, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>External hires & corporate booking</td>
                </tr>

                {/* Row 50: Cab request Billing */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>37</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Cab request Billing</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('cab_billing', currM.cab_billing, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Sheet1!$E$12 (Airport & VIP cabs)</td>
                </tr>

                {/* Row 25: Cumulative Income */}
                <tr style={{ backgroundColor: '#00ff00', borderTop: '2px solid #000000', borderBottom: '2px solid #000000', fontWeight: '800' }}>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: '#000000', borderRight: '1px solid #000000' }}>24</td>
                  <td style={{ padding: '8px 16px', color: '#000000', fontSize: '13px', borderRight: '1px solid #000000' }}>
                    Cumulative Income
                  </td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#000000', fontSize: '14px', borderRight: '1px solid #000000' }} className="currency-font">
                    <strong>{formatINR(currM.cumulative_income)}</strong>
                  </td>
                  <td style={{ padding: '8px 16px', color: '#000000', fontWeight: '700', fontFamily: 'monospace' }}>
                    =SUM(Paid + RPS + Staff + Addl KMs + Cabs)
                  </td>
                </tr>

                {/* --- SECTION: BUDGET & BALANCE (ROWS 26-28) --- */}
                <tr style={{ backgroundColor: '#d4edda', fontWeight: '800', color: '#000000', borderBottom: '1px solid #000000' }}>
                  <td colSpan={4} style={{ padding: '6px 14px', letterSpacing: '0.04em', fontSize: '11.5px' }}>
                    📊 APPROVED BUDGET & REMAINING BALANCE
                  </td>
                </tr>

                {/* Row 26: Approved Budget */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>25</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Approved Budget</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('approved_budget', currM.approved_budget, '13730137.73', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Annual Approved Transport Operating Budget</td>
                </tr>

                {/* Row 27: Cumulative Budget spent */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>26</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Cumulative Budget spent (till now)</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('cumulative_budget_spent', currM.cumulative_budget_spent, '0', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Actual expenses utilized to date</td>
                </tr>

                {/* Row 28: Balance = C26-C27 */}
                <tr style={{ backgroundColor: '#00a896', borderTop: '2px solid #000000', borderBottom: '2px solid #000000', fontWeight: '800' }}>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: '#000000', borderRight: '1px solid #000000' }}>27</td>
                  <td style={{ padding: '8px 16px', color: '#000000', fontSize: '13px', borderRight: '1px solid #000000' }}>
                    Balance Budget
                  </td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#000000', fontSize: '14px', borderRight: '1px solid #000000' }} className="currency-font">
                    <strong>{formatINR(currM.balance)}</strong>
                  </td>
                  <td style={{ padding: '8px 16px', color: '#000000', fontWeight: '700', fontFamily: 'monospace' }}>
                    =C26 - C27 (Approved - Spent)
                  </td>
                </tr>

                {/* --- SECTION: TICKETS, QUALITY & SAFETY (ROWS 29-37) --- */}
                <tr style={{ backgroundColor: '#ffc90e', fontWeight: '800', color: '#000000', borderBottom: '1px solid #000000' }}>
                  <td colSpan={4} style={{ padding: '6px 14px', letterSpacing: '0.04em', fontSize: '11.5px' }}>
                    🛠️ SERVICE TICKETS, QUALITY ISSUES & FUEL CONSUMPTION
                  </td>
                </tr>

                {/* Row 29: No. of Service Tickets Raised */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>30</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>No. of Service Tickets Raised</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('service_tickets_raised', currM.service_tickets_raised, '38', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Maintenance & repair breakdown requests</td>
                </tr>

                {/* Row 30: No. of Service Tickets closed */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>31</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>No. of Service Tickets closed</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('service_tickets_closed', currM.service_tickets_closed, '38', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Repairs resolved & buses back on road</td>
                </tr>

                {/* Row 31: No. of Service Tickets in Open */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', borderRight: '1px solid #000000' }}>32</td>
                  <td style={{ padding: '6px 16px', fontWeight: '800', color: '#000000', borderRight: '1px solid #000000' }}>No. of Service Tickets in Open</td>
                  <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '800', color: currM.service_tickets_open > 0 ? '#dc2626' : '#000000', borderRight: '1px solid #000000' }}>
                    {currM.service_tickets_open} Tickets
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontWeight: '700', fontFamily: 'monospace' }}>
                    =C29 - C30 (Raised - Closed)
                  </td>
                </tr>

                {/* Row 32-34: Quality issues */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', borderRight: '1px solid #000000' }}>33-35</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Quality issues (Rec / Cls / Opn)</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="number"
                        placeholder="Rec"
                        title="Quality issues Received"
                        value={currM.quality_issues_received}
                        onChange={(e) => handleChange('quality_issues_received', e.target.value)}
                        disabled={isClosed}
                        style={{
                          width: '44px',
                          textAlign: 'center',
                          padding: '4px 2px',
                          borderRadius: '3px',
                          border: '1px solid #000000',
                          backgroundColor: '#fff2df',
                          color: '#000000',
                          fontWeight: '700'
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Cls"
                        title="Quality issues Closed"
                        value={currM.quality_issues_closed}
                        onChange={(e) => handleChange('quality_issues_closed', e.target.value)}
                        disabled={isClosed}
                        style={{
                          width: '44px',
                          textAlign: 'center',
                          padding: '4px 2px',
                          borderRadius: '3px',
                          border: '1px solid #000000',
                          backgroundColor: '#fff2df',
                          color: '#000000',
                          fontWeight: '700'
                        }}
                      />
                      <span style={{ padding: '4px 6px', fontWeight: '800', color: currM.quality_issues_open > 0 ? '#dc2626' : '#000000' }}>
                        Opn: {currM.quality_issues_open}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Passenger comfort & route complaints</td>
                </tr>

                {/* Row 35: Statutory compliance */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', borderRight: '1px solid #000000' }}>28</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Statutory compliance</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    <select
                      value={currM.statutory_compliance}
                      onChange={(e) => handleChange('statutory_compliance', parseInt(e.target.value, 10))}
                      disabled={isClosed}
                      style={{
                        width: '140px',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        border: '1px solid #000000',
                        fontWeight: '700',
                        backgroundColor: '#fff2df',
                        color: '#000000'
                      }}
                    >
                      <option value={1}>1 - Compliant</option>
                      <option value={0}>0 - Pending Review</option>
                    </select>
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>1 = Valid FC, Insurance & Pollution</td>
                </tr>

                {/* Row 36: No. of Incidents */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', borderRight: '1px solid #000000' }}>29</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>No. of Incidents</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('incidents_count', currM.incidents_count, '1', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px' }}>Minor breakdowns or route delays</td>
                </tr>

                {/* Row 37: Diesel Purchase Qty (Litres) */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', fontWeight: '700', borderRight: '1px solid #000000' }}>36</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Diesel Purchase Qty (Litres)</td>
                  <td style={{ padding: '4px 10px', textAlign: 'center', backgroundColor: '#fff2df', borderRight: '1px solid #000000' }}>
                    {renderCellInput('diesel_litres', currM.diesel_litres, '5184.84', true, '140px')}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px', fontWeight: '700' }}>
                    Total litres pumped for active fleet
                  </td>
                </tr>

                {/* --- SECTION: UNIT METRICS & RATIOS (ROWS 43-49) --- */}
                <tr style={{ backgroundColor: '#dcdde1', fontWeight: '800', color: '#000000', borderBottom: '1px solid #000000' }}>
                  <td colSpan={4} style={{ padding: '6px 14px', letterSpacing: '0.04em', fontSize: '11.5px' }}>
                    📐 UNIT METRICS & FUEL EFFICIENCY RATIOS
                  </td>
                </tr>

                {/* Row 43: Per student cost expenses */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', borderRight: '1px solid #000000' }}>34</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Per student cost expenses</td>
                  <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '800', color: '#000000', borderRight: '1px solid #000000' }} className="currency-font">
                    {formatINR(currM.per_student_cost_expenses)}
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px', fontFamily: 'monospace' }}>
                    =Total Expenses / Commuters ({currM.passengers_count})
                  </td>
                </tr>

                {/* Row 46: km/veh/day */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', borderRight: '1px solid #000000' }}>—</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>km/veh/day</td>
                  <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '800', color: '#000000', borderRight: '1px solid #000000' }}>
                    {currM.km_per_veh_day} KM / day
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px', fontFamily: 'monospace' }}>
                    =Actual KMs / (19 vehicles * 30 days)
                  </td>
                </tr>

                {/* Fuel cost / KM */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', borderRight: '1px solid #000000' }}>—</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Fuel cost / KM</td>
                  <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '800', color: '#000000', borderRight: '1px solid #000000' }}>
                    ₹{currM.fuel_cost_per_km} / KM
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px', fontFamily: 'monospace' }}>
                    =Fuel Expenses / Actual trip KMs
                  </td>
                </tr>

                {/* Diesel / 100 KM */}
                <tr style={{ backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#000000', borderRight: '1px solid #000000' }}>—</td>
                  <td style={{ padding: '6px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>Diesel / 100 KM</td>
                  <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '800', color: '#000000', borderRight: '1px solid #000000' }}>
                    {currM.diesel_per_100km} L / 100 KM
                  </td>
                  <td style={{ padding: '6px 16px', color: '#000000', fontSize: '11.5px', fontFamily: 'monospace' }}>
                    =(Diesel Litres / Actual KMs) * 100
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TABLE 2: MULTI-MONTH FLEET & FUEL COMPARISON GRID */}
      {(activeSubTab === 'combined' || activeSubTab === 'multi_month') && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Table size={16} color="#00a2e8" />
              <span>Table 2: Multi-Month Fleet Operations & Efficiency Comparison Grid</span>
            </h3>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Side-by-side progression across all billing periods
            </span>
          </div>

          <div style={{ overflowX: 'auto', border: '2px solid #000000', borderRadius: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', backgroundColor: '#ffffff' }}>
              <thead>
                <tr style={{ backgroundColor: '#00a2e8', borderBottom: '2px solid #000000', color: '#000000', fontWeight: '800' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', minWidth: '220px', borderRight: '1px solid #000000' }}>
                    Fleet Parameter
                  </th>
                  {periods.map(p => {
                    const isSel = String(p.id) === currStr;
                    return (
                      <th
                        key={p.id}
                        style={{
                          padding: '10px 14px',
                          textAlign: 'right',
                          minWidth: '120px',
                          borderRight: '1px solid #000000',
                          backgroundColor: isSel ? '#0ea5e9' : '#00a2e8',
                          color: isSel ? '#ffffff' : '#000000'
                        }}
                      >
                        {p.period_label} {isSel && '★'}
                      </th>
                    );
                  })}
                  <th style={{ padding: '10px 14px', textAlign: 'right', minWidth: '130px', backgroundColor: '#00a2e8', color: '#000000' }}>
                    Formula / Trend
                  </th>
                </tr>
              </thead>
              <tbody>

                {/* Fleet Size */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '8px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>
                    Active Vehicles
                  </td>
                  {periods.map(p => {
                    const m = getTransportMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>
                        {m.vehicles_count}
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#000000' }}>Buses + Spare</td>
                </tr>

                {/* Passengers */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '8px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>
                    Total Commuters
                  </td>
                  {periods.map(p => {
                    const m = getTransportMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>
                        {m.passengers_count.toLocaleString()}
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#000000' }}>Students + Staff</td>
                </tr>

                {/* Actual KMs */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '8px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>
                    Actual Trip KMs
                  </td>
                  {periods.map(p => {
                    const m = getTransportMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>
                        {m.actual_kms.toLocaleString()} KM
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#000000' }}>Odometer Run</td>
                </tr>

                {/* Additional KMs */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '8px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>
                    Additional KMs
                  </td>
                  {periods.map(p => {
                    const m = getTransportMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '8px 14px', textAlign: 'right', color: '#000000', borderRight: '1px solid #000000' }}>
                        {m.additional_kms.toLocaleString()} KM
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#000000' }}>Extra trips</td>
                </tr>

                {/* Diesel Litres */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '8px 16px', fontWeight: '800', color: '#000000', borderRight: '1px solid #000000' }}>
                    Diesel Litres Purchased
                  </td>
                  {periods.map(p => {
                    const m = getTransportMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '800', color: '#000000', borderRight: '1px solid #000000' }}>
                        {m.diesel_litres.toLocaleString()} L
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#000000', fontWeight: '700' }}>Bulk Diesel</td>
                </tr>

                {/* Fuel Expenses */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '8px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>
                    Fuel Expenses (Rs)
                  </td>
                  {periods.map(p => {
                    const m = getTransportMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }} className="currency-font">
                        {formatINR(m.fuel_expenses)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#000000' }}>Direct Fuel Cost</td>
                </tr>

                {/* Total Expenses */}
                <tr style={{ borderBottom: '2px solid #000000', borderTop: '2px solid #000000', backgroundColor: '#00ff00', fontWeight: '800' }}>
                  <td style={{ padding: '8px 16px', color: '#000000', borderRight: '1px solid #000000' }}>
                    Total Fleet Expenses
                  </td>
                  {periods.map(p => {
                    const m = getTransportMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '8px 14px', textAlign: 'right', color: '#000000', borderRight: '1px solid #000000' }} className="currency-font">
                        {formatINR(m.total_expenses)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#000000', fontFamily: 'monospace' }}>
                    =SUM(Expenses)
                  </td>
                </tr>

                {/* Fuel Cost / KM */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '8px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>
                    Fuel Cost / KM
                  </td>
                  {periods.map(p => {
                    const m = getTransportMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>
                        ₹{m.fuel_cost_per_km} / KM
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#000000' }}>Fuel / Actual KM</td>
                </tr>

                {/* Diesel / 100 KM */}
                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '8px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>
                    Diesel Consumption / 100 KM
                  </td>
                  {periods.map(p => {
                    const m = getTransportMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>
                        {m.diesel_per_100km} L
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#000000' }}>(L / KM) * 100</td>
                </tr>

                {/* Service Tickets Open */}
                <tr style={{ backgroundColor: '#fff2df' }}>
                  <td style={{ padding: '8px 16px', fontWeight: '700', color: '#000000', borderRight: '1px solid #000000' }}>
                    Open Tickets / Incidents
                  </td>
                  {periods.map(p => {
                    const m = getTransportMetrics(p.id);
                    return (
                      <td key={p.id} style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '700', color: m.service_tickets_open > 0 ? '#dc2626' : '#000000', borderRight: '1px solid #000000' }}>
                        {m.service_tickets_open} open • {m.incidents_count} inc
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#000000' }}>Open Maintenance</td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. BOTTOM ACTION & STATUS BAR */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#f0f9ff',
        borderTop: '1px solid #bae6fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12.5px', color: '#0369a1', fontWeight: '600' }}>
            Active Cycle: <strong>{activePeriodObj?.period_label || 'Current Period'}</strong>
            {isClosed ? ' (Locked)' : ' • Ready for Data Entry'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSaveAllMonthsBulk}
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
            onClick={handleSaveCurrentMonthDirect}
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
            <span>{isSavingLocal || savingBatch ? 'Saving...' : `💾 Save Transport Data for ${activePeriodObj?.period_label || 'Month'}`}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
