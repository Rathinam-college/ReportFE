import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardCheck, ArrowUpRight, RefreshCw, Search, CheckCircle2, AlertTriangle, Calendar, FileCheck } from 'lucide-react';
import MonthlyAttachmentsDashboardSection from '../../../components/attachments/MonthlyAttachmentsDashboardSection';

const SCORE_COLS = [
  { key: 'admin_score', label: 'ADMIN' },
  { key: 'maintenance_support', label: 'Maint.' },
  { key: 'equipment_maintenance', label: 'Equip.' },
  { key: 'cafeteria', label: 'Cafeteria' },
  { key: 'site_infra', label: 'Site Infra' },
  { key: 'transport', label: 'Transport' },
  { key: 'security', label: 'Security' },
  { key: 'restroom', label: 'Restroom' },
  { key: 'sick_bay', label: 'Sick Bay' },
  { key: 'library', label: 'Library' }
];

export default function AuditOperationsDashboard({
  periods = [],
  activePeriod,
  setActivePeriod,
  onOpenDataEntry,
  onRefreshAttachments
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTopic, setActiveTopic] = useState('non_academic_report');
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState({
    non_academic_report: [],
    non_academic_schedule: [],
    nc_tracker: [],
    internal_report: []
  });

  const activePeriodObj = periods.find(p => String(p.id) === String(activePeriod)) || null;
  const isAllMonths = !activePeriod || activePeriod === 'all';

  const fetchAuditSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit/summary?period_id=${activePeriod || 'all'}`);
      const data = await res.json();
      if (data?.status === 'success') {
        setSummaryData({
          non_academic_report: data.non_academic_report || [],
          non_academic_schedule: data.non_academic_schedule || [],
          nc_tracker: data.nc_tracker || [],
          internal_report: data.internal_report || []
        });
      }
    } catch (err) {
      console.warn('[AuditDashboard] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditSummary();
  }, [activePeriod]);

  const kpis = useMemo(() => {
    const naRep = summaryData.non_academic_report;
    const avgPct = naRep.length > 0
      ? (naRep.reduce((s, r) => s + Number(r.score_pct || 0), 0) / naRep.length).toFixed(1)
      : '0.0';

    const naSch = summaryData.non_academic_schedule;
    const schDone = naSch.filter(r => String(r.status || '').toLowerCase().includes('completed')).length;

    const ncs = summaryData.nc_tracker;
    const ncOpen = ncs.filter(r => String(r.status || '').toLowerCase() !== 'closed').length;
    const ncClosed = ncs.filter(r => String(r.status || '').toLowerCase() === 'closed').length;

    const intRep = summaryData.internal_report;
    const intCompleted = intRep.filter(r => String(r.status || '').toLowerCase().includes('completed'));
    const intAvg = intCompleted.length > 0
      ? (intCompleted.reduce((s, r) => s + Number(r.total_scores || 0), 0) / intCompleted.length).toFixed(1)
      : '0.0';

    return { avgPct, naCount: naRep.length, schDone, schTotal: naSch.length, ncOpen, ncClosed, ncTotal: ncs.length, intAvg, intDone: intCompleted.length, intTotal: intRep.length };
  }, [summaryData]);

  const q = searchTerm.trim().toLowerCase();
  const filterByDept = (rows) => !q ? rows : rows.filter(r =>
    String(r.department || '').toLowerCase().includes(q) ||
    String(r.auditees || '').toLowerCase().includes(q) ||
    String(r.nc_description || '').toLowerCase().includes(q)
  );

  const topics = [
    { id: 'non_academic_report', label: `Non-Academic Report (${summaryData.non_academic_report.length})` },
    { id: 'non_academic_schedule', label: `Audit Schedule (${summaryData.non_academic_schedule.length})` },
    { id: 'nc_tracker', label: `NC Tracker 2026 (${summaryData.nc_tracker.length})` },
    { id: 'internal_report', label: `Internal Audit Report (${summaryData.internal_report.length})` }
  ];

  const getStatusStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('completed') || s === 'closed') return { bg: '#E4F6EC', color: '#0F6B3A' };
    if (s.includes('progress')) return { bg: '#FFF1DD', color: '#8A4A00' };
    return { bg: '#FBE3E3', color: '#A32626' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sticky Top Header & Filter Bar */}
      <div
        className="sticky-dashboard-master-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 80,
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #E1E6F2',
          padding: '16px 22px',
          boxShadow: '0 4px 18px rgba(20, 36, 92, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#14245C',
              color: '#F5A524',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ClipboardCheck size={21} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#14245C', margin: 0, letterSpacing: '-0.02em' }}>
                  Audit Operations &amp; Compliance Dashboard
                </h1>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#EAF0FF',
                  color: '#2F4BB8'
                }}>
                  Audit &amp; Compliance
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '3px 0 0 0', fontWeight: '500' }}>
                Non-Academic Audit · Schedule · NC Tracker 2026 · Internal Audit Department Wise
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => { fetchAuditSummary(); onRefreshAttachments?.(); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #E1E6F2',
                color: '#14245C',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDataEntry?.()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '10px',
                backgroundColor: '#F5A524',
                border: 'none',
                color: '#14245C',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              <span>Open Data Entry</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '10px', borderTop: '1px solid #EDF0F8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>
              MONTH
            </span>
            <button
              type="button"
              onClick={() => setActivePeriod('all')}
              style={{
                minHeight: '34px',
                padding: '5px 14px',
                borderRadius: '9999px',
                border: isAllMonths ? '1px solid #14245C' : '1px solid #E1E6F2',
                backgroundColor: isAllMonths ? '#14245C' : '#ffffff',
                color: isAllMonths ? '#ffffff' : '#334155',
                fontSize: '12px',
                fontWeight: isAllMonths ? '800' : '600',
                cursor: 'pointer'
              }}
            >
              All months
            </button>
            {periods.map((p) => {
              const isSel = String(p.id) === String(activePeriod);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePeriod(String(p.id))}
                  style={{
                    minHeight: '34px',
                    padding: '5px 14px',
                    borderRadius: '9999px',
                    border: isSel ? '1px solid #14245C' : '1px solid #E1E6F2',
                    backgroundColor: isSel ? '#14245C' : '#ffffff',
                    color: isSel ? '#ffffff' : '#334155',
                    fontSize: '12px',
                    fontWeight: isSel ? '800' : '600',
                    cursor: 'pointer'
                  }}
                >
                  {p.period_label}
                </button>
              );
            })}
          </div>

          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search department or NC..."
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: '10px',
                border: '1px solid #E1E6F2',
                fontSize: '12.5px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: '#14245C', color: '#ffffff', borderRadius: '16px', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Non-Academic Avg Score</div>
          <div style={{ fontSize: '26px', fontWeight: '800', marginTop: '6px' }}>{kpis.avgPct}%</div>
          <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '4px' }}>{kpis.naCount} departments audited</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #E1E6F2', borderTop: '4px solid #18A058', borderRadius: '16px', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Audit Schedule</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F6B3A', marginTop: '6px' }}>{kpis.schDone} / {kpis.schTotal}</div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>Scheduled audits completed</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #E1E6F2', borderTop: '4px solid #D6455D', borderRadius: '16px', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>NC Tracker 2026</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#A32626', marginTop: '6px' }}>{kpis.ncOpen} Open</div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>{kpis.ncClosed} closed of {kpis.ncTotal} total</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #E1E6F2', borderTop: '4px solid #2F4BB8', borderRadius: '16px', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Internal Audit Avg</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#14245C', marginTop: '6px' }}>{kpis.intAvg}</div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>{kpis.intDone} / {kpis.intTotal} completed</div>
        </div>
      </div>

      {/* 4-Topic Switcher & Live Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', border: '1px solid #E1E6F2', overflow: 'hidden', boxShadow: '0 2px 10px rgba(20, 36, 92, 0.04)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E1E6F2', display: 'flex', gap: '8px', flexWrap: 'wrap', backgroundColor: '#F7F9FD' }}>
          {topics.map((t) => {
            const isSel = activeTopic === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTopic(t.id)}
                style={{
                  minHeight: '36px',
                  padding: '6px 14px',
                  borderRadius: '9px',
                  border: isSel ? '1px solid #14245C' : '1px solid #E1E6F2',
                  backgroundColor: isSel ? '#14245C' : '#ffffff',
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

        <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Loading Audit records...</div>
          ) : (
            <>
              {activeTopic === 'non_academic_report' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', minWidth: '1150px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#14245C', color: '#ffffff' }}>
                      <th style={{ padding: '10px 8px' }}>Sl.no</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Department / Function</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Auditee(s)</th>
                      {SCORE_COLS.map((c) => <th key={c.key} style={{ padding: '10px 6px', textAlign: 'center' }}>{c.label}</th>)}
                      <th style={{ padding: '10px 8px', textAlign: 'right', backgroundColor: '#FFF1DD', color: '#8A4A00' }}>Total</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', backgroundColor: '#FFF1DD', color: '#8A4A00' }}>Score %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterByDept(summaryData.non_academic_report).length === 0 ? (
                      <tr><td colSpan={15} style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>No Non-Academic Audit Report entries recorded for this period.</td></tr>
                    ) : filterByDept(summaryData.non_academic_report).map((r, i) => (
                      <tr key={r.id || i} style={{ borderBottom: '1px solid #E1E6F2' }}>
                        <td style={{ padding: '9px 8px', textAlign: 'center', fontWeight: '700' }}>{r.s_no || i + 1}</td>
                        <td style={{ padding: '9px 10px', fontWeight: '700', color: '#14245C' }}>{r.department}</td>
                        <td style={{ padding: '9px 10px', color: '#475569' }}>{r.auditees || '—'}</td>
                        {SCORE_COLS.map((c) => <td key={c.key} style={{ padding: '9px 6px', textAlign: 'center', fontWeight: '600' }}>{r[c.key] || '—'}</td>)}
                        <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: '800', color: '#14245C', backgroundColor: '#FFFDF5' }}>{r.total_score}</td>
                        <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: '800', color: '#0F6B3A', backgroundColor: '#FFFDF5' }}>{r.score_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTopic === 'non_academic_schedule' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', minWidth: '900px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#14245C', color: '#ffffff' }}>
                      <th style={{ padding: '10px 8px' }}>Sl.no</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Department / Function</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Auditee(s)</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Planned Date</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Time</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Auditor(s)</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Status as on date</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterByDept(summaryData.non_academic_schedule).length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>No Audit Schedule entries recorded for this period.</td></tr>
                    ) : filterByDept(summaryData.non_academic_schedule).map((r, i) => {
                      const st = getStatusStyle(r.status);
                      return (
                        <tr key={r.id || i} style={{ borderBottom: '1px solid #E1E6F2' }}>
                          <td style={{ padding: '9px 8px', textAlign: 'center', fontWeight: '700' }}>{r.s_no || i + 1}</td>
                          <td style={{ padding: '9px 10px', fontWeight: '700', color: '#14245C' }}>{r.department}</td>
                          <td style={{ padding: '9px 10px', color: '#475569' }}>{r.auditees || '—'}</td>
                          <td style={{ padding: '9px 10px' }}>{r.planned_date || '—'}</td>
                          <td style={{ padding: '9px 10px' }}>{r.time_slot || '—'}</td>
                          <td style={{ padding: '9px 10px' }}>{r.auditors || '—'}</td>
                          <td style={{ padding: '9px 10px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: '700', backgroundColor: st.bg, color: st.color }}>
                              {r.status || 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '9px 10px', color: '#475569' }}>{r.remarks || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {activeTopic === 'nc_tracker' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', minWidth: '1050px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#14245C', color: '#ffffff' }}>
                      <th style={{ padding: '10px 8px' }}>NC No</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Department</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Area</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>NC Description</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Severity</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Corrective Action</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Responsible</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Target Date</th>
                      <th style={{ padding: '10px 10px', textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterByDept(summaryData.nc_tracker).length === 0 ? (
                      <tr><td colSpan={9} style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>No Non-Conformity records for this period.</td></tr>
                    ) : filterByDept(summaryData.nc_tracker).map((r, i) => {
                      const st = getStatusStyle(r.status);
                      return (
                        <tr key={r.id || i} style={{ borderBottom: '1px solid #E1E6F2' }}>
                          <td style={{ padding: '9px 8px', fontWeight: '700', color: '#14245C' }}>{r.nc_no || i + 1}</td>
                          <td style={{ padding: '9px 10px', fontWeight: '700' }}>{r.department}</td>
                          <td style={{ padding: '9px 10px' }}>{r.area || '—'}</td>
                          <td style={{ padding: '9px 10px', color: '#334155' }}>{r.nc_description || '—'}</td>
                          <td style={{ padding: '9px 10px' }}>{r.severity || 'Minor'}</td>
                          <td style={{ padding: '9px 10px', color: '#334155' }}>{r.corrective_action || '—'}</td>
                          <td style={{ padding: '9px 10px' }}>{r.responsible_person || '—'}</td>
                          <td style={{ padding: '9px 10px' }}>{r.target_date || '—'}</td>
                          <td style={{ padding: '9px 10px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: '700', backgroundColor: st.bg, color: st.color }}>
                              {r.status || 'Open'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {activeTopic === 'internal_report' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#14245C', color: '#ffffff' }}>
                      <th style={{ padding: '10px 8px', width: '60px' }}>Sl.no</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Department / Function</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Cycle / Criteria</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Status as on date</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Scores</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterByDept(summaryData.internal_report).length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>No Internal Audit entries recorded for this period.</td></tr>
                    ) : filterByDept(summaryData.internal_report).map((r, i) => {
                      const st = getStatusStyle(r.status);
                      return (
                        <tr key={r.id || i} style={{ borderBottom: '1px solid #E1E6F2' }}>
                          <td style={{ padding: '9px 8px', textAlign: 'center', fontWeight: '700' }}>{r.s_no || i + 1}</td>
                          <td style={{ padding: '9px 12px', fontWeight: '700', color: '#14245C' }}>{r.department}</td>
                          <td style={{ padding: '9px 12px', color: '#475569' }}>Cycle {r.cycle_no || '—'} · {r.criteria || 'QMS - 9001:2015'}</td>
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: '700', backgroundColor: st.bg, color: st.color }}>
                              {r.status || 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: '800', color: '#14245C' }}>{r.total_scores}</td>
                          <td style={{ padding: '9px 12px', color: '#475569' }}>{r.remarks || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      {/* Supporting Attachments & Bills */}
      <MonthlyAttachmentsDashboardSection
        module="audit"
        periodId={isAllMonths ? 'all' : (activePeriodObj?.id || activePeriod)}
        periodLabel={isAllMonths ? 'All Months' : (activePeriodObj?.period_label || 'Selected Month')}
        periods={periods}
        currentUser={null}
        onRefresh={onRefreshAttachments}
      />
    </div>
  );
}
