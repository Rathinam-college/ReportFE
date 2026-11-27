import React, { useState, useEffect, useMemo } from 'react';
import { Save, Lock, Unlock, Zap, Droplets, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const EMPTY_ROW = {
  power_units: '',
  power_cost: '',
  students_staff_count: '',
  normal_water_litres: '',
  normal_water_cost: '',
  students_count: '',
  drinking_water_litres: '',
  drinking_water_cost: ''
};

const toNum = (v) => {
  if (v === undefined || v === null || v === '') return 0;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
};

const fmtNum = (v, decimals = 0) => {
  const n = Number(v || 0);
  if (n === 0) return '—';
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const fmtINR = (v, decimals = 0) => {
  const n = Number(v || 0);
  if (n === 0) return '—';
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

export default function FoodPowerWaterEntrySection({
  periods = [],
  editingPeriodId,
  activePeriodObj,
  handleToggleLock,
  onRefreshData
}) {
  const [entriesByPeriod, setEntriesByPeriod] = useState({});
  const [draft, setDraft] = useState({ ...EMPTY_ROW });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const currStr = String(editingPeriodId || '');
  const isClosed = !!activePeriodObj?.is_closed;

  const loadPowerWater = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/food/power-water');
      const res = await resp.json();
      if (!resp.ok) throw new Error(res?.detail || 'Failed to load Power & Water entries');
      setEntriesByPeriod(res?.entries || {});
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load Power & Water entries' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPowerWater();
  }, []);

  // Sync draft when active month or loaded entries change
  useEffect(() => {
    const existing = entriesByPeriod[currStr];
    if (existing) {
      setDraft({
        power_units: existing.power_units ?? '',
        power_cost: existing.power_cost ?? '',
        students_staff_count: existing.students_staff_count ?? '',
        normal_water_litres: existing.normal_water_litres ?? '',
        normal_water_cost: existing.normal_water_cost ?? '',
        students_count: existing.students_count ?? '',
        drinking_water_litres: existing.drinking_water_litres ?? '',
        drinking_water_cost: existing.drinking_water_cost ?? ''
      });
    } else {
      setDraft({ ...EMPTY_ROW });
    }
  }, [currStr, entriesByPeriod]);

  const handleFieldChange = (field, value) => {
    if (isClosed) return;
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!editingPeriodId || isClosed) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      const payload = {
        period_id: Number(editingPeriodId),
        power_units: toNum(draft.power_units),
        power_cost: toNum(draft.power_cost),
        students_staff_count: toNum(draft.students_staff_count),
        normal_water_litres: toNum(draft.normal_water_litres),
        normal_water_cost: toNum(draft.normal_water_cost),
        students_count: toNum(draft.students_count),
        drinking_water_litres: toNum(draft.drinking_water_litres),
        drinking_water_cost: toNum(draft.drinking_water_cost)
      };
      const resp = await fetch('/api/food/power-water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const res = await resp.json();
      if (!resp.ok) throw new Error(res?.detail || 'Failed to save Power & Water');
      setEntriesByPeriod((prev) => ({ ...prev, [currStr]: payload }));
      setStatusMsg({ type: 'success', text: res?.message || 'Saved Power & Water successfully' });
      if (onRefreshData) onRefreshData();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save Power & Water' });
    } finally {
      setSaving(false);
    }
  };

  // Helper to get row values for any period (live draft for active period, saved otherwise)
  const getPeriodRow = (pid) => {
    if (String(pid) === currStr) return draft;
    return entriesByPeriod[String(pid)] || EMPTY_ROW;
  };

  const computePeriodMetrics = (p) => {
    const row = getPeriodRow(p.id);
    const days = Number(p.operating_days || 30) || 30;
    const pUnits = toNum(row.power_units);
    const pCost = toNum(row.power_cost);
    const stStaff = toNum(row.students_staff_count);
    const nwLtr = toNum(row.normal_water_litres);
    const nwCost = toNum(row.normal_water_cost);
    const students = toNum(row.students_count);
    const dwLtr = toNum(row.drinking_water_litres);
    const dwCost = toNum(row.drinking_water_cost);

    return {
      power_units: pUnits,
      power_cost: pCost,
      students_staff_count: stStaff,
      units_per_occ: stStaff > 0 ? pUnits / stStaff : 0,
      power_cost_per_occ: stStaff > 0 ? pCost / stStaff : 0,
      normal_water_litres: nwLtr,
      normal_water_cost: nwCost,
      students_count: students,
      nw_ltr_per_day: students > 0 ? nwLtr / students / days : 0,
      nw_cost_per_day: students > 0 ? nwCost / students / days : 0,
      drinking_water_litres: dwLtr,
      drinking_water_cost: dwCost,
      dw_ltr_per_day: students > 0 ? dwLtr / students / days : 0,
      dw_cost_per_day: students > 0 ? dwCost / students / days : 0
    };
  };

  const periodMetricsMap = useMemo(() => {
    const m = {};
    periods.forEach((p) => {
      m[p.id] = computePeriodMetrics(p);
    });
    return m;
  }, [periods, entriesByPeriod, draft, currStr]);

  const summaryTotals = useMemo(() => {
    const activePeriods = periods.filter((p) => {
      const m = periodMetricsMap[p.id];
      return m && (m.power_units > 0 || m.power_cost > 0 || m.normal_water_litres > 0 || m.drinking_water_litres > 0 || m.students_staff_count > 0 || m.students_count > 0);
    });
    const cnt = activePeriods.length || 1;
    const sumField = (key) => periods.reduce((acc, p) => acc + (periodMetricsMap[p.id]?.[key] || 0), 0);
    const avgField = (key) => {
      const nonZero = activePeriods.filter((p) => (periodMetricsMap[p.id]?.[key] || 0) > 0);
      if (nonZero.length === 0) return 0;
      return nonZero.reduce((acc, p) => acc + (periodMetricsMap[p.id]?.[key] || 0), 0) / nonZero.length;
    };

    return {
      power_units: sumField('power_units'),
      power_cost: sumField('power_cost'),
      students_staff_count: avgField('students_staff_count'),
      units_per_occ: avgField('units_per_occ'),
      power_cost_per_occ: avgField('power_cost_per_occ'),
      normal_water_litres: sumField('normal_water_litres'),
      normal_water_cost: sumField('normal_water_cost'),
      students_count: avgField('students_count'),
      nw_ltr_per_day: avgField('nw_ltr_per_day'),
      nw_cost_per_day: avgField('nw_cost_per_day'),
      drinking_water_litres: sumField('drinking_water_litres'),
      drinking_water_cost: sumField('drinking_water_cost'),
      dw_ltr_per_day: avgField('dw_ltr_per_day'),
      dw_cost_per_day: avgField('dw_cost_per_day'),
      monthsCount: cnt
    };
  }, [periods, periodMetricsMap]);

  const rowsConfig = [
    // Section 1: Power (Light Green)
    { key: 'power_units', label: 'Power consumption units(EB + DG) Kitchen', sectionBg: '#E2EFDA', type: 'input', format: 'num' },
    { key: 'power_cost', label: 'Power consumption cost(EB + DG) Kitchen', sectionBg: '#E2EFDA', type: 'input', format: 'inr' },
    { key: 'students_staff_count', label: 'No of Students+ Staffs in Hostel', sectionBg: '#E2EFDA', type: 'input', format: 'num' },
    { key: 'units_per_occ', label: 'Units per occupant per month - Food', sectionBg: '#E2EFDA', type: 'calc', format: 'dec2', bold: true },
    { key: 'power_cost_per_occ', label: 'Power cost Per Occupant per month -Food', sectionBg: '#E2EFDA', type: 'calc', format: 'inr2', bold: true },

    // Section 2: Normal Water (Bright Green)
    { key: 'normal_water_litres', label: 'Normal Water Consumption Ltr Kitchen', sectionBg: '#C6EFCE', type: 'input', format: 'num' },
    { key: 'normal_water_cost', label: 'Normal Water Consumption Cost Kitchen', sectionBg: '#C6EFCE', type: 'input', format: 'inr' },
    { key: 'students_count', label: 'No of Students + Staff in Hostels', sectionBg: '#C6EFCE', type: 'input', format: 'num' },
    { key: 'nw_ltr_per_day', label: 'Ltr per student per day - Food', sectionBg: '#C6EFCE', type: 'calc', format: 'dec2', bold: true },
    { key: 'nw_cost_per_day', label: 'Normal Water cost Per student per day Food', sectionBg: '#C6EFCE', type: 'calc', format: 'inr2', bold: true },

    // Section 3: Drinking Water (Cyan)
    { key: 'drinking_water_litres', label: 'Drinking Water Consumption Litres Kitchen', sectionBg: '#CCF2FF', type: 'input', format: 'num' },
    { key: 'drinking_water_cost', label: 'Drinking Water Consumption Cost Kitchen', sectionBg: '#CCF2FF', type: 'input', format: 'inr' },
    { key: 'students_count', label: 'No of Students + Staff in Hostels', sectionBg: '#CCF2FF', type: 'readonly_sync', format: 'num' },
    { key: 'dw_ltr_per_day', label: 'Drinking water Litres per student per day - Kitchen', sectionBg: '#CCF2FF', type: 'calc', format: 'dec2', bold: true },
    { key: 'dw_cost_per_day', label: 'Drinking Water cost Per student per day Kitchen', sectionBg: '#CCF2FF', type: 'calc', format: 'inr2', bold: true }
  ];

  const renderVal = (val, format) => {
    if (format === 'inr') return fmtINR(val, 0);
    if (format === 'inr2') return fmtINR(val, 2);
    if (format === 'dec2') return fmtNum(val, 2);
    return fmtNum(val, 0);
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      border: '1px solid #E1E6F2',
      boxShadow: '0 4px 18px rgba(20, 36, 92, 0.05)',
      overflow: 'hidden'
    }}>
      {/* Header Bar */}
      <div style={{
        padding: '18px 24px',
        backgroundColor: '#14245C',
        color: '#ffffff',
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
            backgroundColor: '#F5A524',
            color: '#14245C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={20} color="#14245C" />
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.01em' }}>
              Power &amp; Water Entry
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.78)', marginTop: '2px' }}>
              Active month: <strong>{activePeriodObj?.period_label || '—'}</strong> ({activePeriodObj?.operating_days || 30} days) · Kitchen power, normal water &amp; drinking water
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {handleToggleLock && activePeriodObj && (
            <button
              type="button"
              onClick={() => handleToggleLock(activePeriodObj)}
              style={{
                minHeight: '36px',
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.28)',
                backgroundColor: isClosed ? '#dc2626' : 'rgba(255,255,255,0.14)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isClosed ? <Lock size={14} /> : <Unlock size={14} />}
              <span>{isClosed ? `Locked (${activePeriodObj.period_label})` : `Unlocked (${activePeriodObj.period_label})`}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || isClosed || !editingPeriodId}
            style={{
              minHeight: '38px',
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: isClosed ? '#64748b' : '#F5A524',
              color: isClosed ? '#e2e8f0' : '#14245C',
              fontSize: '13px',
              fontWeight: '800',
              cursor: (saving || isClosed) ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : isClosed ? 'Month Locked' : `Save ${activePeriodObj?.period_label || ''}`}</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div style={{
          margin: '14px 22px 0',
          padding: '10px 14px',
          borderRadius: '10px',
          backgroundColor: statusMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${statusMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: statusMsg.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '13px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Spreadsheet Table */}
      <div style={{ overflowX: 'auto', padding: '18px 22px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <RefreshCw size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Loading Food Power & Water entries...
          </div>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#14245C', color: '#ffffff' }}>
                <th style={{
                  padding: '11px 14px',
                  textAlign: 'left',
                  fontWeight: '800',
                  borderRight: '1px solid rgba(255,255,255,0.18)',
                  minWidth: '300px',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#14245C',
                  zIndex: 2
                }}>
                  Parameter (Kitchen Power & Water)
                </th>
                {periods.map((p) => {
                  const isActive = String(p.id) === currStr;
                  return (
                    <th
                      key={p.id}
                      style={{
                        padding: '10px 12px',
                        textAlign: 'right',
                        fontWeight: '800',
                        minWidth: '130px',
                        borderRight: '1px solid rgba(255,255,255,0.18)',
                        backgroundColor: isActive ? '#1e40af' : '#14245C'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                        <span>{p.period_label}</span>
                        {p.is_closed && <Lock size={11} color="#F5A524" />}
                      </div>
                      {isActive && (
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#F5A524', marginTop: '2px' }}>
                          {p.is_closed ? 'LOCKED' : 'EDITING'}
                        </div>
                      )}
                    </th>
                  );
                })}
                <th style={{
                  padding: '11px 14px',
                  textAlign: 'right',
                  fontWeight: '800',
                  minWidth: '125px',
                  backgroundColor: '#0f172a',
                  color: '#F5A524'
                }}>
                  Total / Avg
                </th>
              </tr>
            </thead>
            <tbody>
              {rowsConfig.map((rowCfg, idx) => {
                const isCalc = rowCfg.type === 'calc';
                const isReadOnlySync = rowCfg.type === 'readonly_sync';
                return (
                  <tr
                    key={`${rowCfg.key}-${idx}`}
                    style={{
                      backgroundColor: rowCfg.sectionBg,
                      borderBottom: '1px solid #94a3b8'
                    }}
                  >
                    <td style={{
                      padding: '9px 14px',
                      fontWeight: rowCfg.bold ? '800' : '600',
                      color: '#0f172a',
                      borderRight: '1px solid #94a3b8',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: rowCfg.sectionBg,
                      zIndex: 1
                    }}>
                      {rowCfg.label}
                    </td>
                    {periods.map((p) => {
                      const isActive = String(p.id) === currStr;
                      const m = periodMetricsMap[p.id] || {};
                      const cellVal = m[rowCfg.key] || 0;

                      return (
                        <td
                          key={p.id}
                          style={{
                            padding: isActive && !isCalc && !isReadOnlySync && !isClosed ? '5px 8px' : '9px 12px',
                            textAlign: 'right',
                            borderRight: '1px solid #cbd5e1',
                            fontWeight: rowCfg.bold ? '800' : '600',
                            color: '#0f172a',
                            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.55)' : 'transparent'
                          }}
                        >
                          {isActive && !isCalc && !isReadOnlySync ? (
                            <input
                              type="number"
                              step="any"
                              aria-label={`${rowCfg.label} ${p.period_label}`}
                              disabled={isClosed}
                              value={draft[rowCfg.key] ?? ''}
                              onChange={(e) => handleFieldChange(rowCfg.key, e.target.value)}
                              placeholder="0"
                              style={{
                                width: '100%',
                                height: '38px',
                                padding: '6px 10px',
                                textAlign: 'right',
                                borderRadius: '8px',
                                border: isClosed ? '1px solid #E1E6F2' : '1px solid #D5DCEE',
                                backgroundColor: isClosed ? '#F3F5FA' : '#ffffff',
                                color: isClosed ? '#64748b' : '#14245C',
                                cursor: isClosed ? 'not-allowed' : 'text',
                                fontWeight: '700',
                                fontSize: '13px',
                                boxSizing: 'border-box'
                              }}
                            />
                          ) : (
                            <span>{renderVal(cellVal, rowCfg.format)}</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{
                      padding: '9px 14px',
                      textAlign: 'right',
                      fontWeight: '800',
                      color: '#14245C',
                      backgroundColor: 'rgba(241, 245, 249, 0.85)'
                    }}>
                      {renderVal(summaryTotals[rowCfg.key], rowCfg.format)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
