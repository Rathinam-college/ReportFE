import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck, Calendar, Plus, Trash2, Save, Lock, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import MonthlyAttachmentsDashboardSection from '../../components/attachments/MonthlyAttachmentsDashboardSection';

const SCORE_FIELDS = [
  { key: 'admin_score', label: 'ADMIN' },
  { key: 'maintenance_support', label: 'Maintenance support' },
  { key: 'equipment_maintenance', label: 'EQUIPMENT MAINTENANCE' },
  { key: 'cafeteria', label: 'Cafeteria' },
  { key: 'site_infra', label: 'Site Infra' },
  { key: 'transport', label: 'Transport' },
  { key: 'security', label: 'Security' },
  { key: 'restroom', label: 'Restroom' },
  { key: 'sick_bay', label: 'Sick Bay' },
  { key: 'library', label: 'Library' }
];

const computeReportTotals = (row) => {
  let sum = 0;
  let count = 0;
  SCORE_FIELDS.forEach((f) => {
    const raw = String(row[f.key] ?? '').trim();
    if (raw && raw.toUpperCase() !== 'N/A') {
      const n = parseFloat(raw);
      if (!Number.isNaN(n)) {
        sum += n;
        count += 1;
      }
    }
  });
  const pct = count > 0 ? Math.round((sum / (count * 100)) * 100) : 0;
  return { total_score: sum, score_pct: pct };
};

export default function AuditSpreadsheetEntry({
  activePeriodObj,
  computedMatrix,
  editingPeriodId,
  setEditingPeriodId,
  fetchData
}) {
  const periods = computedMatrix?.periods || [];
  const isClosed = !!activePeriodObj?.is_closed;

  const [activeTopic, setActiveTopic] = useState('non_academic_report');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // 4 Topic States
  const [naReportRows, setNaReportRows] = useState([]);
  const [naScheduleRows, setNaScheduleRows] = useState([]);
  const [ncTrackerRows, setNcTrackerRows] = useState([]);
  const [internalRows, setInternalRows] = useState([]);
  const [internalCycleNo, setInternalCycleNo] = useState('12');
  const [internalCriteria, setInternalCriteria] = useState('QMS - 9001:2015');

  const loadTopicData = async () => {
    if (!editingPeriodId) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/audit/summary?period_id=${editingPeriodId}`);
      const data = await res.json();
      if (data?.status === 'success') {
        setNaReportRows(data.non_academic_report || []);
        setNaScheduleRows(data.non_academic_schedule || []);
        setNcTrackerRows(data.nc_tracker || []);
        const intList = data.internal_report || [];
        if (intList.length > 0) {
          setInternalRows(intList);
          if (intList[0].cycle_no) setInternalCycleNo(intList[0].cycle_no);
          if (intList[0].criteria) setInternalCriteria(intList[0].criteria);
        } else {
          // Auto-populate departments from Audit Master Data if this month has no saved internal audit rows yet
          const mRes = await fetch('/api/audit/master-departments?topic=internal_report');
          const mData = await mRes.json();
          const activeMasters = (mData?.data || []).filter(m => m.is_active !== false);
          if (activeMasters.length > 0) {
            setInternalCycleNo(activeMasters[0].default_cycle_no || '12');
            setInternalCriteria(activeMasters[0].default_criteria || 'QMS - 9001:2015');
            setInternalRows(activeMasters.map((m, idx) => ({
              s_no: m.s_no || idx + 1,
              department: m.department,
              status: '',
              total_scores: '',
              remarks: ''
            })));
          } else {
            setInternalRows([]);
          }
        }
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load Audit data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopicData();
  }, [editingPeriodId]);

  const handleSaveActiveTopic = async () => {
    if (!editingPeriodId || isClosed) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      let url = '';
      let payload = { period_id: Number(editingPeriodId) };
      if (activeTopic === 'non_academic_report') {
        url = '/api/audit/non-academic-report';
        payload.rows = naReportRows;
      } else if (activeTopic === 'non_academic_schedule') {
        url = '/api/audit/non-academic-schedule';
        payload.rows = naScheduleRows;
      } else if (activeTopic === 'nc_tracker') {
        url = '/api/audit/nc-tracker';
        payload.rows = ncTrackerRows;
      } else {
        url = '/api/audit/internal-report';
        payload.cycle_no = internalCycleNo;
        payload.criteria = internalCriteria;
        payload.rows = internalRows.map((r) => ({
          ...r,
          cycle_no: internalCycleNo,
          criteria: internalCriteria
        }));
      }

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await resp.json();
      if (!resp.ok) throw new Error(resData?.detail || 'Failed to save');
      setStatusMsg({ type: 'success', text: resData?.message || 'Saved successfully' });
      if (fetchData) fetchData('audit');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddRow = () => {
    if (isClosed) return;
    if (activeTopic === 'non_academic_report') {
      setNaReportRows((prev) => [
        ...prev,
        {
          s_no: prev.length + 1,
          department: '',
          auditees: '',
          admin_score: '',
          maintenance_support: '',
          equipment_maintenance: '',
          cafeteria: '',
          site_infra: '',
          transport: '',
          security: '',
          restroom: '',
          sick_bay: '',
          library: '',
          total_score: 0,
          score_pct: 0
        }
      ]);
    } else if (activeTopic === 'non_academic_schedule') {
      setNaScheduleRows((prev) => [
        ...prev,
        {
          s_no: prev.length + 1,
          department: '',
          auditees: '',
          planned_date: '',
          time_slot: '10 am - 5pm',
          auditors: '',
          status: 'In-progress',
          remarks: ''
        }
      ]);
    } else if (activeTopic === 'nc_tracker') {
      setNcTrackerRows((prev) => [
        ...prev,
        {
          s_no: prev.length + 1,
          nc_no: `NC-${prev.length + 1}`,
          department: '',
          area: '',
          nc_description: '',
          severity: 'Minor',
          root_cause: '',
          corrective_action: '',
          responsible_person: '',
          target_date: '',
          closed_date: '',
          status: 'Open',
          remarks: ''
        }
      ]);
    } else {
      setInternalRows((prev) => [
        ...prev,
        {
          s_no: prev.length + 1,
          department: '',
          status: 'Completed',
          total_scores: 0,
          remarks: ''
        }
      ]);
    }
  };

  const inputStyle = (extra = {}) => ({
    width: '100%',
    minHeight: '34px',
    padding: '5px 8px',
    borderRadius: '7px',
    border: isClosed ? '1px solid #E1E6F2' : '1px solid #D5DCEE',
    backgroundColor: isClosed ? '#F3F5FA' : '#ffffff',
    color: isClosed ? '#64748b' : '#14245C',
    cursor: isClosed ? 'not-allowed' : 'text',
    fontSize: '12px',
    fontWeight: '600',
    boxSizing: 'border-box',
    ...extra
  });

  const topics = [
    { id: 'non_academic_report', label: 'Non-Academic Audit Consolidated Report' },
    { id: 'non_academic_schedule', label: 'Non-Academic Audit Schedule' },
    { id: 'nc_tracker', label: 'NA - Non-Conformity Consolidated Tracker 2026' },
    { id: 'internal_report', label: 'Internal Audit Consolidated Report - Dept Wise' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header Bar */}
      <div style={{
        backgroundColor: '#14245C',
        color: '#ffffff',
        borderRadius: '18px',
        padding: '18px 22px',
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
            <ClipboardCheck size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>
              Audit Operations — 4-Topic Data Entry
            </h2>
            <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '2px 0 0 0' }}>
              Active Period: <strong>{activePeriodObj?.period_label || 'Select Month'}</strong>
              {isClosed && ' • Month Locked'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="#F5A524" />
            <select
              value={editingPeriodId || ''}
              onChange={(e) => setEditingPeriodId?.(Number(e.target.value))}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {periods.length === 0 ? (
                <option value="" style={{ color: '#0f172a' }}>No billing periods</option>
              ) : (
                periods.map(p => (
                  <option key={p.id} value={p.id} style={{ color: '#0f172a' }}>
                    {p.period_label}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            disabled={isClosed}
            onClick={handleAddRow}
            style={{
              minHeight: '36px',
              padding: '7px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.3)',
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: isClosed ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isClosed ? 0.5 : 1
            }}
          >
            <Plus size={14} />
            <span>Add Row</span>
          </button>

          <button
            type="button"
            disabled={saving || isClosed}
            onClick={handleSaveActiveTopic}
            style={{
              minHeight: '36px',
              padding: '7px 18px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: isClosed ? '#64748b' : '#F5A524',
              color: isClosed ? '#e2e8f0' : '#14245C',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: (saving || isClosed) ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isClosed ? <Lock size={14} /> : <Save size={14} />}
            <span>{saving ? 'Saving...' : isClosed ? 'Month Locked' : 'Save to DB'}</span>
          </button>
        </div>
      </div>

      {/* 4-Topic Tab Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexWrap: 'wrap',
        backgroundColor: '#ffffff',
        padding: '8px 12px',
        borderRadius: '14px',
        border: '1px solid #E1E6F2'
      }}>
        {topics.map((t) => {
          const isSel = activeTopic === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTopic(t.id)}
              style={{
                minHeight: '36px',
                padding: '7px 14px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: isSel ? '#14245C' : '#F3F5FA',
                color: isSel ? '#ffffff' : '#334155',
                fontSize: '12px',
                fontWeight: isSel ? '800' : '700',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {statusMsg && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '10px',
          backgroundColor: statusMsg.type === 'success' ? '#E4F6EC' : '#FBE3E3',
          border: `1px solid ${statusMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: statusMsg.type === 'success' ? '#0F6B3A' : '#A32626',
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

      {/* Active Topic Table Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #E1E6F2',
        boxShadow: '0 2px 10px rgba(20, 36, 92, 0.04)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <RefreshCw size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Loading Audit records...
          </div>
        ) : (
          <div style={{ overflowX: 'auto', padding: '16px' }}>
            {/* TOPIC 1: Non-Academic Audit Consolidated Report */}
            {activeTopic === 'non_academic_report' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1400px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#14245C', color: '#ffffff' }}>
                    <th style={{ padding: '10px 8px', width: '50px' }}>Sl.no</th>
                    <th style={{ padding: '10px 10px', minWidth: '180px', textAlign: 'left' }}>Department / Function</th>
                    <th style={{ padding: '10px 10px', minWidth: '180px', textAlign: 'left' }}>Auditee(s)</th>
                    {SCORE_FIELDS.map((f) => (
                      <th key={f.key} style={{ padding: '10px 8px', minWidth: '90px', textAlign: 'center' }}>{f.label}</th>
                    ))}
                    <th style={{ padding: '10px 8px', minWidth: '80px', textAlign: 'right', backgroundColor: '#FFF1DD', color: '#8A4A00' }}>Total</th>
                    <th style={{ padding: '10px 8px', minWidth: '80px', textAlign: 'right', backgroundColor: '#FFF1DD', color: '#8A4A00' }}>Score %</th>
                    <th style={{ padding: '10px 8px', width: '50px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {naReportRows.length === 0 ? (
                    <tr><td colSpan={16} style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>No rows yet. Click "+ Add Row" to add departments.</td></tr>
                  ) : naReportRows.map((row, idx) => {
                    const calc = computeReportTotals(row);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #E1E6F2' }}>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '700' }}>{idx + 1}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <input disabled={isClosed} value={row.department || ''} onChange={(e) => setNaReportRows(p => p.map((r, i) => i === idx ? { ...r, department: e.target.value } : r))} placeholder="Department" style={inputStyle()} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input disabled={isClosed} value={row.auditees || ''} onChange={(e) => setNaReportRows(p => p.map((r, i) => i === idx ? { ...r, auditees: e.target.value } : r))} placeholder="Auditee(s)" style={inputStyle()} />
                        </td>
                        {SCORE_FIELDS.map((f) => (
                          <td key={f.key} style={{ padding: '6px 6px' }}>
                            <input
                              disabled={isClosed}
                              value={row[f.key] ?? ''}
                              onChange={(e) => setNaReportRows(p => p.map((r, i) => i === idx ? { ...r, [f.key]: e.target.value } : r))}
                              placeholder="N/A"
                              style={inputStyle({ textAlign: 'center' })}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '800', color: '#14245C', backgroundColor: '#FFFDF5' }}>{calc.total_score}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '800', color: '#0F6B3A', backgroundColor: '#FFFDF5' }}>{calc.score_pct}%</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          {!isClosed && (
                            <button type="button" onClick={() => setNaReportRows(p => p.filter((_, i) => i !== idx))} style={{ color: '#A32626', background: 'none', border: 'none', cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* TOPIC 2: Non-Academic Audit Schedule */}
            {activeTopic === 'non_academic_schedule' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1000px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#14245C', color: '#ffffff' }}>
                    <th style={{ padding: '10px 8px', width: '50px' }}>Sl.no</th>
                    <th style={{ padding: '10px 10px', textAlign: 'left', minWidth: '180px' }}>Department / Function</th>
                    <th style={{ padding: '10px 10px', textAlign: 'left', minWidth: '200px' }}>Auditee(s)</th>
                    <th style={{ padding: '10px 10px', textAlign: 'left', minWidth: '130px' }}>Planned Date</th>
                    <th style={{ padding: '10px 10px', textAlign: 'left', minWidth: '120px' }}>Time</th>
                    <th style={{ padding: '10px 10px', textAlign: 'left', minWidth: '150px' }}>Auditor(s)</th>
                    <th style={{ padding: '10px 10px', textAlign: 'left', minWidth: '160px' }}>Status as on date</th>
                    <th style={{ padding: '10px 10px', textAlign: 'left', minWidth: '160px' }}>Remarks</th>
                    <th style={{ padding: '10px 8px', width: '50px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {naScheduleRows.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>No schedule rows yet. Click "+ Add Row".</td></tr>
                  ) : naScheduleRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E1E6F2' }}>
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '700' }}>{idx + 1}</td>
                      <td style={{ padding: '6px 8px' }}><input disabled={isClosed} value={row.department || ''} onChange={(e) => setNaScheduleRows(p => p.map((r, i) => i === idx ? { ...r, department: e.target.value } : r))} style={inputStyle()} /></td>
                      <td style={{ padding: '6px 8px' }}><input disabled={isClosed} value={row.auditees || ''} onChange={(e) => setNaScheduleRows(p => p.map((r, i) => i === idx ? { ...r, auditees: e.target.value } : r))} style={inputStyle()} /></td>
                      <td style={{ padding: '6px 8px' }}><input disabled={isClosed} value={row.planned_date || ''} onChange={(e) => setNaScheduleRows(p => p.map((r, i) => i === idx ? { ...r, planned_date: e.target.value } : r))} placeholder="dd.mm.yyyy" style={inputStyle()} /></td>
                      <td style={{ padding: '6px 8px' }}><input disabled={isClosed} value={row.time_slot || ''} onChange={(e) => setNaScheduleRows(p => p.map((r, i) => i === idx ? { ...r, time_slot: e.target.value } : r))} placeholder="10 am - 5pm" style={inputStyle()} /></td>
                      <td style={{ padding: '6px 8px' }}><input disabled={isClosed} value={row.auditors || ''} onChange={(e) => setNaScheduleRows(p => p.map((r, i) => i === idx ? { ...r, auditors: e.target.value } : r))} style={inputStyle()} /></td>
                      <td style={{ padding: '6px 8px' }}><input disabled={isClosed} value={row.status || ''} onChange={(e) => setNaScheduleRows(p => p.map((r, i) => i === idx ? { ...r, status: e.target.value } : r))} placeholder="dd.mm.yyyy / completed" style={inputStyle()} /></td>
                      <td style={{ padding: '6px 8px' }}><input disabled={isClosed} value={row.remarks || ''} onChange={(e) => setNaScheduleRows(p => p.map((r, i) => i === idx ? { ...r, remarks: e.target.value } : r))} style={inputStyle()} /></td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        {!isClosed && (
                          <button type="button" onClick={() => setNaScheduleRows(p => p.filter((_, i) => i !== idx))} style={{ color: '#A32626', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TOPIC 3: NA - Non-Conformity Consolidated Tracker 2026 */}
            {activeTopic === 'nc_tracker' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1350px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#14245C', color: '#ffffff' }}>
                    <th style={{ padding: '10px 8px', width: '50px' }}>Sl.no</th>
                    <th style={{ padding: '10px 8px', minWidth: '90px', textAlign: 'left' }}>NC No</th>
                    <th style={{ padding: '10px 8px', minWidth: '150px', textAlign: 'left' }}>Department</th>
                    <th style={{ padding: '10px 8px', minWidth: '140px', textAlign: 'left' }}>Area</th>
                    <th style={{ padding: '10px 8px', minWidth: '200px', textAlign: 'left' }}>NC Description</th>
                    <th style={{ padding: '10px 8px', minWidth: '110px', textAlign: 'left' }}>Severity</th>
                    <th style={{ padding: '10px 8px', minWidth: '160px', textAlign: 'left' }}>Root Cause</th>
                    <th style={{ padding: '10px 8px', minWidth: '160px', textAlign: 'left' }}>Corrective Action</th>
                    <th style={{ padding: '10px 8px', minWidth: '130px', textAlign: 'left' }}>Responsible</th>
                    <th style={{ padding: '10px 8px', minWidth: '110px', textAlign: 'left' }}>Target Date</th>
                    <th style={{ padding: '10px 8px', minWidth: '110px', textAlign: 'left' }}>Closed Date</th>
                    <th style={{ padding: '10px 8px', minWidth: '110px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '10px 8px', width: '50px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ncTrackerRows.length === 0 ? (
                    <tr><td colSpan={13} style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>No NC records yet. Click "+ Add Row".</td></tr>
                  ) : ncTrackerRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E1E6F2' }}>
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '700' }}>{idx + 1}</td>
                      <td style={{ padding: '6px 6px' }}><input disabled={isClosed} value={row.nc_no || ''} onChange={(e) => setNcTrackerRows(p => p.map((r, i) => i === idx ? { ...r, nc_no: e.target.value } : r))} style={inputStyle()} /></td>
                      <td style={{ padding: '6px 6px' }}><input disabled={isClosed} value={row.department || ''} onChange={(e) => setNcTrackerRows(p => p.map((r, i) => i === idx ? { ...r, department: e.target.value } : r))} style={inputStyle()} /></td>
                      <td style={{ padding: '6px 6px' }}><input disabled={isClosed} value={row.area || ''} onChange={(e) => setNcTrackerRows(p => p.map((r, i) => i === idx ? { ...r, area: e.target.value } : r))} style={inputStyle()} /></td>
                      <td style={{ padding: '6px 6px' }}><input disabled={isClosed} value={row.nc_description || ''} onChange={(e) => setNcTrackerRows(p => p.map((r, i) => i === idx ? { ...r, nc_description: e.target.value } : r))} style={inputStyle()} /></td>
                      <td style={{ padding: '6px 6px' }}>
                        <select disabled={isClosed} value={row.severity || 'Minor'} onChange={(e) => setNcTrackerRows(p => p.map((r, i) => i === idx ? { ...r, severity: e.target.value } : r))} style={inputStyle()}>
                          <option value="Minor">Minor</option>
                          <option value="Major">Major</option>
                          <option value="Observation">Observation</option>
                        </select>
                      </td>
                      <td style={{ padding: '6px 6px' }}><input disabled={isClosed} value={row.root_cause || ''} onChange={(e) => setNcTrackerRows(p => p.map((r, i) => i === idx ? { ...r, root_cause: e.target.value } : r))} style={inputStyle()} /></td>
                      <td style={{ padding: '6px 6px' }}><input disabled={isClosed} value={row.corrective_action || ''} onChange={(e) => setNcTrackerRows(p => p.map((r, i) => i === idx ? { ...r, corrective_action: e.target.value } : r))} style={inputStyle()} /></td>
                      <td style={{ padding: '6px 6px' }}><input disabled={isClosed} value={row.responsible_person || ''} onChange={(e) => setNcTrackerRows(p => p.map((r, i) => i === idx ? { ...r, responsible_person: e.target.value } : r))} style={inputStyle()} /></td>
                      <td style={{ padding: '6px 6px' }}><input disabled={isClosed} value={row.target_date || ''} onChange={(e) => setNcTrackerRows(p => p.map((r, i) => i === idx ? { ...r, target_date: e.target.value } : r))} style={inputStyle()} /></td>
                      <td style={{ padding: '6px 6px' }}><input disabled={isClosed} value={row.closed_date || ''} onChange={(e) => setNcTrackerRows(p => p.map((r, i) => i === idx ? { ...r, closed_date: e.target.value } : r))} style={inputStyle()} /></td>
                      <td style={{ padding: '6px 6px' }}>
                        <select disabled={isClosed} value={row.status || 'Open'} onChange={(e) => setNcTrackerRows(p => p.map((r, i) => i === idx ? { ...r, status: e.target.value } : r))} style={inputStyle()}>
                          <option value="Open">Open</option>
                          <option value="In-progress">In-progress</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        {!isClosed && (
                          <button type="button" onClick={() => setNcTrackerRows(p => p.filter((_, i) => i !== idx))} style={{ color: '#A32626', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TOPIC 4: Internal Audit Consolidated Report - Department Wise */}
            {activeTopic === 'internal_report' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', padding: '10px 14px', backgroundColor: '#F3F5FA', borderRadius: '10px', border: '1px solid #E1E6F2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#14245C' }}>Cycle No:</span>
                    <input disabled={isClosed} value={internalCycleNo} onChange={(e) => setInternalCycleNo(e.target.value)} style={inputStyle({ width: '90px' })} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#14245C', whiteSpace: 'nowrap' }}>Audit Process Criteria:</span>
                    <input disabled={isClosed} value={internalCriteria} onChange={(e) => setInternalCriteria(e.target.value)} style={inputStyle({ maxWidth: '300px' })} />
                  </div>
                  {!isClosed && (
                    <button
                      type="button"
                      onClick={async () => {
                        const mRes = await fetch('/api/audit/master-departments?topic=internal_report');
                        const mData = await mRes.json();
                        const activeMasters = (mData?.data || []).filter(m => m.is_active !== false);
                        if (activeMasters.length > 0) {
                          setInternalCycleNo(activeMasters[0].default_cycle_no || '12');
                          setInternalCriteria(activeMasters[0].default_criteria || 'QMS - 9001:2015');
                          setInternalRows(prev => {
                            const existing = new Set(prev.map(r => (r.department || '').trim().toLowerCase()));
                            const additions = activeMasters
                              .filter(m => !existing.has((m.department || '').trim().toLowerCase()))
                              .map((m, idx) => ({
                                s_no: prev.length + idx + 1,
                                department: m.department,
                                status: '',
                                total_scores: '',
                                remarks: ''
                              }));
                            return [...prev, ...additions];
                          });
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #14245C',
                        backgroundColor: '#ffffff',
                        color: '#14245C',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      + Sync from Master Data
                    </button>
                  )}
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#14245C', color: '#ffffff' }}>
                      <th style={{ padding: '10px 8px', width: '60px' }}>Sl.no</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: '240px' }}>Department / Function</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: '160px' }}>Status as on date</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', minWidth: '130px' }}>Total Scores</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: '200px' }}>Remarks</th>
                      <th style={{ padding: '10px 8px', width: '50px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internalRows.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>No internal audit rows yet. Click "+ Add Row".</td></tr>
                    ) : internalRows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #E1E6F2' }}>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '700' }}>{idx + 1}</td>
                        <td style={{ padding: '6px 10px' }}><input disabled={isClosed} value={row.department || ''} onChange={(e) => setInternalRows(p => p.map((r, i) => i === idx ? { ...r, department: e.target.value } : r))} placeholder="e.g. Hostel - 1 (Sabari Hospitality)" style={inputStyle()} /></td>
                        <td style={{ padding: '6px 10px' }}>
                          <select disabled={isClosed} value={row.status || ''} onChange={(e) => setInternalRows(p => p.map((r, i) => i === idx ? { ...r, status: e.target.value } : r))} style={inputStyle()}>
                            <option value="">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="In-progress">In-progress</option>
                          </select>
                        </td>
                        <td style={{ padding: '6px 10px' }}><input type="number" step="any" disabled={isClosed} value={row.total_scores ?? ''} onChange={(e) => setInternalRows(p => p.map((r, i) => i === idx ? { ...r, total_scores: e.target.value } : r))} style={inputStyle({ textAlign: 'right' })} /></td>
                        <td style={{ padding: '6px 10px' }}><input disabled={isClosed} value={row.remarks || ''} onChange={(e) => setInternalRows(p => p.map((r, i) => i === idx ? { ...r, remarks: e.target.value } : r))} style={inputStyle()} /></td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          {!isClosed && (
                            <button type="button" onClick={() => setInternalRows(p => p.filter((_, i) => i !== idx))} style={{ color: '#A32626', background: 'none', border: 'none', cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Monthly Supporting Attachments & Bills */}
      <MonthlyAttachmentsDashboardSection
        module="audit"
        periodId={editingPeriodId || 'all'}
        periodLabel={activePeriodObj?.period_label || 'Current Month'}
        periods={periods}
        currentUser={null}
      />
    </div>
  );
}
