import React, { useState } from 'react';
import { 
  X, Download, Printer, FileText, BedDouble, Wrench, Zap, DollarSign, Calendar, Check
} from 'lucide-react';
import { formatINR, formatPeriodLabel } from '../../../utils/formatters';

export default function HostelReportsModal({
  isOpen,
  onClose,
  census = {},
  allCensusMap = {},
  periods = [],
  categories = []
}) {
  const [activeTab, setActiveTab] = useState('occupancy'); // 'occupancy' | 'maintenance' | 'utilities' | 'financial'
  const [selectedPeriodId, setSelectedPeriodId] = useState('all');

  if (!isOpen) return null;

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  const activePeriods = selectedPeriodId === 'all' 
    ? periods 
    : periods.filter(p => String(p.id) === String(selectedPeriodId));

  // --- CSV Export Handlers ---
  const handleExportCSV = (reportType) => {
    try {
      let headers = [];
      let rows = [];

      if (reportType === 'occupancy') {
        headers = ['"Period"', '"Boys Cap"', '"Boys Occ"', '"Boys Vac"', '"Girls Cap"', '"Girls Occ"', '"Girls Vac"', '"Total Cap"', '"Total Occ"', '"Total Vac"', '"Occ %"', '"Staff"'];
        rows = activePeriods.map(p => {
          const c = allCensusMap[String(p.id)] || {};
          const bCap = num(c.bed_capacity_boys, 0);
          const gCap = num(c.bed_capacity_girls, 0);
          const tCap = num(c.bed_capacity_total, bCap + gCap);
          const bOcc = num(c.total_occupied_boys, num(c.students_boys, 0) + num(c.staff_boys, 0));
          const gOcc = num(c.total_occupied_girls, num(c.students_girls, 0) + num(c.staff_girls, 0));
          const tOcc = num(c.total_occupied, bOcc + gOcc);
          const bVac = num(c.vacant_boys, Math.max(0, bCap - bOcc));
          const gVac = num(c.vacant_girls, Math.max(0, gCap - gOcc));
          const tVac = num(c.vacant_total, Math.max(0, tCap - tOcc));
          const occPct = tCap > 0 ? ((tOcc / tCap) * 100).toFixed(1) : num(c.occupied_pct, 0).toFixed(1);

          return [
            `"${p.period_label || p.period_code}"`,
            bCap,
            bOcc,
            bVac,
            gCap,
            gOcc,
            gVac,
            tCap,
            tOcc,
            tVac,
            `"${occPct}%"`,
            num(c.staff_total, 0)
          ];
        });
      } else if (reportType === 'maintenance') {
        headers = ['"Period"', '"Tickets Received"', '"Tickets Closed"', '"Tickets Open"', '"Avg TAT (Hrs)"', '"Quality Issues Rec"', '"Quality Issues Closed"', '"Incidents"'];
        rows = activePeriods.map(p => {
          const c = allCensusMap[String(p.id)] || {};
          return [
            `"${p.period_label || p.period_code}"`,
            num(c.tickets_received, 0),
            num(c.tickets_closed, 0),
            num(c.tickets_open, 0),
            num(c.tat_hours, 0),
            num(c.quality_issues_received, 0),
            num(c.quality_issues_closed, 0),
            num(c.incidents_count, 0)
          ];
        });
      } else if (reportType === 'utilities') {
        headers = ['"Period"', '"Power Units (kWh)"', '"Power Cost (₹)"', '"Power/Occupant (₹)"', '"Normal Water (Ltr)"', '"Normal Water Cost (₹)"', '"RO Water Cost (₹)"', '"Tanker Purchase (₹)"'];
        rows = activePeriods.map(p => {
          const c = allCensusMap[String(p.id)] || {};
          return [
            `"${p.period_label || p.period_code}"`,
            num(c.power_units, 0),
            num(c.power_cost, 0),
            Math.round(num(c.power_cost_occupant, 0)),
            num(c.normal_water_litres, 0),
            num(c.normal_water_cost, 0),
            num(c.drinking_water_cost, 0),
            num(c.water_purchase_cost, 0)
          ];
        });
      } else {
        headers = ['"Period"', '"Approved Budget (₹)"', '"Actual Expenses (₹)"', '"Remaining Balance (₹)"', '"Per Student Cost/Mo (₹)"', '"Per Student Cost/Day (₹)"'];
        rows = activePeriods.map(p => {
          const c = allCensusMap[String(p.id)] || {};
          const appBudget = num(c.approved_budget, 0);
          const exp = num(c.expenses_occurred, 0);
          const bal = num(c.balance, appBudget > 0 ? appBudget - num(c.cumulative_budget_spent, exp) : 0);
          return [
            `"${p.period_label || p.period_code}"`,
            appBudget,
            exp,
            bal,
            num(c.per_student_cost_month, 0).toFixed(2),
            num(c.per_student_cost_day, 0).toFixed(2)
          ];
        });
      }

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Rathinam_Hostel_${reportType.toUpperCase()}_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('CSV export error:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        width: '1000px',
        maxWidth: '96vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* MODAL HEADER */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1.5px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Hostel Reports
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Download and print occupancy, maintenance, utilities, and financial reports
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: '700',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportCSV(activeTab)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: '#4338ca',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* TABS & PERIOD FILTER BAR */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#ffffff'
        }}>
          {/* 4 Report Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'occupancy', label: 'Occupancy Report', icon: BedDouble, color: '#059669' },
              { id: 'maintenance', label: 'Maintenance Report', icon: Wrench, color: '#d97706' },
              { id: 'utilities', label: 'Utilities Report', icon: Zap, color: '#2563eb' },
              { id: 'financial', label: 'Financial Report', icon: DollarSign, color: '#7c3aed' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: isActive ? '800' : '600',
                    border: isActive ? `1.5px solid ${tab.color}` : '1px solid #e2e8f0',
                    backgroundColor: isActive ? tab.color : '#f8fafc',
                    color: isActive ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Period Filter Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={14} color="#64748b" />
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: '700',
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Cycles ({periods.length} Months YTD)</option>
              {periods.map(p => (
                <option key={p.id} value={String(p.id)}>
                  {p.period_label || p.period_code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* REPORT TABLE CONTENT BODY */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'occupancy' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#ecfdf5', borderBottom: '1.5px solid #a7f3d0' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#065f46', fontWeight: '800' }}>Billing Cycle</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#065f46', fontWeight: '800' }}>Boys (Cap / Occ)</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#065f46', fontWeight: '800' }}>Girls (Cap / Occ)</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#065f46', fontWeight: '800' }}>Total Bed Capacity</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#065f46', fontWeight: '800' }}>Total Occupied</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#065f46', fontWeight: '800' }}>Vacant Beds</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#065f46', fontWeight: '800' }}>Occupancy %</th>
                </tr>
              </thead>
              <tbody>
                {activePeriods.map((p, idx) => {
                  const c = allCensusMap[String(p.id)] || {};
                  const bCap = num(c.bed_capacity_boys, 0);
                  const gCap = num(c.bed_capacity_girls, 0);
                  const tCap = num(c.bed_capacity_total, bCap + gCap);
                  const bOcc = num(c.total_occupied_boys, num(c.students_boys, 0) + num(c.staff_boys, 0));
                  const gOcc = num(c.total_occupied_girls, num(c.students_girls, 0) + num(c.staff_girls, 0));
                  const tOcc = num(c.total_occupied, bOcc + gOcc);
                  const tVac = num(c.vacant_total, Math.max(0, tCap - tOcc));
                  const occPct = tCap > 0 ? ((tOcc / tCap) * 100).toFixed(1) : (tOcc > 0 ? '100.0' : '0.0');

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>{p.period_label || p.period_code}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{bCap} / {bOcc}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{gCap} / {gOcc}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800' }}>{tCap.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800', color: '#047857' }}>{tOcc.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#ea580c', fontWeight: '700' }}>{tVac.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#059669' }}>{occPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'maintenance' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#fffbeb', borderBottom: '1.5px solid #fde68a' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#92400e', fontWeight: '800' }}>Billing Cycle</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#92400e', fontWeight: '800' }}>Tickets Received</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#92400e', fontWeight: '800' }}>Tickets Closed</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#92400e', fontWeight: '800' }}>Open Tickets</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#92400e', fontWeight: '800' }}>Avg TAT (Hours)</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#92400e', fontWeight: '800' }}>Quality Issues</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#92400e', fontWeight: '800' }}>Incidents</th>
                </tr>
              </thead>
              <tbody>
                {activePeriods.map((p, idx) => {
                  const c = allCensusMap[String(p.id)] || {};
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>{p.period_label || p.period_code}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800' }}>{num(c.tickets_received, 0)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#16a34a', fontWeight: '700' }}>{num(c.tickets_closed, 0)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: num(c.tickets_open, 0) > 0 ? '#dc2626' : '#64748b' }}>{num(c.tickets_open, 0)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{num(c.tat_hours, 0)}h</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{num(c.quality_issues_received, 0)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{num(c.incidents_count, 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'utilities' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#eff6ff', borderBottom: '1.5px solid #bfdbfe' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#1e40af', fontWeight: '800' }}>Billing Cycle</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', color: '#1e40af', fontWeight: '800' }}>Power Units (kWh)</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#1e40af', fontWeight: '800' }}>Power Cost (₹)</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#1e40af', fontWeight: '800' }}>Normal Water Cost (₹)</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#1e40af', fontWeight: '800' }}>RO Water Cost (₹)</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#1e40af', fontWeight: '800' }}>Tanker Purchase (₹)</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#1e40af', fontWeight: '800' }}>Total Utilities (₹)</th>
                </tr>
              </thead>
              <tbody>
                {activePeriods.map((p, idx) => {
                  const c = allCensusMap[String(p.id)] || {};
                  const pCost = num(c.power_cost, 0);
                  const wCost = num(c.normal_water_cost, 0);
                  const roCost = num(c.drinking_water_cost, 0);
                  const tCost = num(c.water_purchase_cost, 0);
                  const uTotal = pCost + wCost + roCost + tCost;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>{p.period_label || p.period_code}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{num(c.power_units, 0).toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatINR(pCost)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatINR(wCost)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatINR(roCost)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatINR(tCost)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#2563eb' }}>{formatINR(uTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'financial' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f3ff', borderBottom: '1.5px solid #ddd6fe' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#5b21b6', fontWeight: '800' }}>Billing Cycle</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#5b21b6', fontWeight: '800' }}>Approved Budget (₹)</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#5b21b6', fontWeight: '800' }}>Actual Expenses (₹)</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#5b21b6', fontWeight: '800' }}>Remaining Balance (₹)</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#5b21b6', fontWeight: '800' }}>Cost / Student / Mo</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#5b21b6', fontWeight: '800' }}>Cost / Student / Day</th>
                </tr>
              </thead>
              <tbody>
                {activePeriods.map((p, idx) => {
                  const c = allCensusMap[String(p.id)] || {};
                  const appBudget = num(c.approved_budget, 0);
                  const exp = num(c.expenses_occurred, 0);
                  const bal = num(c.balance, appBudget > 0 ? Math.max(0, appBudget - num(c.cumulative_budget_spent, exp)) : 0);
                  const pCostMo = num(c.per_student_cost_month, 0);
                  const pCostDay = num(c.per_student_cost_day, 0);

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>{p.period_label || p.period_code}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{appBudget > 0 ? formatINR(appBudget) : '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#6d28d9' }}>{exp > 0 ? formatINR(exp) : '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>{appBudget > 0 ? formatINR(bal) : '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{pCostMo > 0 ? `₹${Math.round(pCostMo).toLocaleString()}` : '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{pCostDay > 0 ? `₹${pCostDay.toFixed(2)}` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
