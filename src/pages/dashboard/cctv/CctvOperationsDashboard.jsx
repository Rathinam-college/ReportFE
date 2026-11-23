import React, { useState, useEffect, useMemo } from 'react';
import { formatINR } from '../../../utils/formatters';
import { 
  Video, Calendar, Download, RefreshCw, ArrowUpRight, 
  ExternalLink, Paperclip, Link as LinkIcon, FileText, CheckCircle2, 
  AlertTriangle, ShieldCheck, Clock, Layers, Sparkles, TrendingUp, 
  Wrench, CheckSquare, Search, Eye, Filter
} from 'lucide-react';
import { CANONICAL_CCTV_PARAMETERS } from '../../data_entry/CctvSpreadsheetEntry';

export default function CctvOperationsDashboard({
  computedMatrix,
  periods = [],
  activePeriod,
  setActivePeriod,
  onOpenDataEntry,
  handleExportReport,
  attachmentsSummary = {},
  onRefreshAttachments
}) {
  const [entriesMap, setEntriesMap] = useState({}); // { [period_id]: entryObj }
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [masterParams, setMasterParams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');

  // Month-specific attachments for reference links table
  const [periodAttachments, setPeriodAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // 1. Fetch live CCTV master parameters
  useEffect(() => {
    fetch('/api/cctv/parameters')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMasterParams(data);
        }
      })
      .catch(err => console.warn('[CctvDash] Parameters fetch error:', err));
  }, []);

  const parameters = useMemo(() => {
    return masterParams.length > 0 ? masterParams : CANONICAL_CCTV_PARAMETERS;
  }, [masterParams]);

  // 2. Fetch all CCTV monthly entries
  const fetchAllEntries = async () => {
    try {
      setLoadingEntries(true);
      const res = await fetch('/api/cctv/entries');
      const data = await res.json();
      if (data && data.status === 'success' && Array.isArray(data.data)) {
        const map = {};
        data.data.forEach(entry => {
          map[entry.period_id] = entry;
        });
        setEntriesMap(map);
      }
    } catch (err) {
      console.error('[CctvDash] Entries fetch error:', err);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    fetchAllEntries();
  }, []);

  // 3. Fetch reference links & attachments for active month
  const fetchPeriodAttachments = async () => {
    try {
      setLoadingAttachments(true);
      const url = (activePeriod && activePeriod !== 'all')
        ? `/api/attachments?module=cctv&period_id=${activePeriod}`
        : `/api/attachments?module=cctv`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.status === 'success' && Array.isArray(data.attachments)) {
        setPeriodAttachments(data.attachments);
      } else {
        setPeriodAttachments([]);
      }
    } catch (err) {
      console.error('[CctvDash] Attachments fetch error:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  useEffect(() => {
    fetchPeriodAttachments();
  }, [activePeriod]);

  // Get active month's entry object
  const activeEntry = useMemo(() => {
    if (!activePeriod || activePeriod === 'all') {
      // Return latest available entry
      const pIds = Object.keys(entriesMap).map(Number);
      if (pIds.length > 0) {
        const maxId = Math.max(...pIds);
        return entriesMap[maxId] || {};
      }
      return {};
    }
    return entriesMap[Number(activePeriod)] || {};
  }, [activePeriod, entriesMap]);

  // Active period display object
  const activePeriodObj = useMemo(() => {
    if (!activePeriod || activePeriod === 'all') return null;
    return periods.find(p => String(p.id) === String(activePeriod)) || null;
  }, [activePeriod, periods]);

  // Colors per section matching user's Excel mockup
  const getSectionStyles = (section) => {
    switch (section) {
      case 'Projects':
        return {
          bg: '#d9ead3',
          border: '#b6d7a8',
          text: '#274e13',
          darkBadge: '#1e4620'
        };
      case 'Complaints':
        return {
          bg: '#fff2cc',
          border: '#ffe599',
          text: '#7f6000',
          darkBadge: '#8f6b00'
        };
      case 'Service request':
        return {
          bg: '#c9daf8',
          border: '#a4c2f4',
          text: '#1155cc',
          darkBadge: '#1a56b0'
        };
      case 'PPM':
        return {
          bg: '#e2efda',
          border: '#c6e0b4',
          text: '#375623',
          darkBadge: '#2d6a2f'
        };
      case 'Quality Issues':
        return {
          bg: '#d9d2e9',
          border: '#b4a7d6',
          text: '#351c75',
          darkBadge: '#4a248f'
        };
      case 'Expenses':
        return {
          bg: '#fce5cd',
          border: '#f9cb9c',
          text: '#783f04',
          darkBadge: '#994a00'
        };
      case 'Budget Tracking':
        return {
          bg: '#a9d08e',
          border: '#8ebd70',
          text: '#1b400e',
          darkBadge: '#1e4620'
        };
      default:
        return {
          bg: '#f8fafc',
          border: '#e2e8f0',
          text: '#334155',
          darkBadge: '#475569'
        };
    }
  };

  // Format cell value
  const formatCellValue = (val, param) => {
    if (val === undefined || val === null || val === '') return '—';
    const num = Number(val);
    if (isNaN(num)) return String(val);

    if (param.input_type === 'cost') {
      return formatINR(num);
    }
    if (param.input_type === 'decimal') {
      return num.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    }
    return num.toLocaleString('en-IN');
  };

  // Calculate cumulative/total across months for a parameter
  const getParamCumulative = (paramKey, param) => {
    let sum = 0;
    let count = 0;
    periods.forEach(p => {
      const entry = entriesMap[p.id];
      if (entry && entry[paramKey] !== undefined && entry[paramKey] !== null) {
        sum += Number(entry[paramKey]) || 0;
        count++;
      }
    });

    // For TAT or ratios, return average; for sums return sum
    if (paramKey.startsWith('tat_')) {
      return count > 0 ? (sum / count).toFixed(2) : '0.00';
    }
    // For balance or approved budget, show latest month
    if (paramKey === 'approved_budget' || paramKey === 'balance') {
      return activeEntry[paramKey] !== undefined ? activeEntry[paramKey] : sum;
    }
    return sum;
  };

  // Filtered parameters
  const filteredParameters = useMemo(() => {
    return parameters.filter(param => {
      const matchesSearch = 
        (param.param_name && param.param_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (param.section && param.section.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSection = selectedSection === 'ALL' || param.section === selectedSection;
      return matchesSearch && matchesSection;
    });
  }, [parameters, searchTerm, selectedSection]);

  // Top Level KPIs for the Active Month
  const totalProjects = Number(activeEntry.projects_total || 0);
  const completedProjects = Number(activeEntry.projects_completed || 0);
  const inProgressProjects = Number(activeEntry.projects_in_progress || 0);

  const totalComplaints = Number(activeEntry.complaints_total || 0);
  const tatComplaints = Number(activeEntry.tat_complaints_hrs || 0);
  const repeatedComplaints = Number(activeEntry.repeated_complaints || 0);

  const totalServices = Number(activeEntry.service_total || 0);
  const tatServices = Number(activeEntry.tat_service_hrs || 0);
  const repeatedServices = Number(activeEntry.repeated_work || 0);

  const ppmCount = Number(activeEntry.ppm_count || 0);

  const qualityOpen = Number(activeEntry.quality_issues_open || 0);
  const qualityClosed = Number(activeEntry.quality_issues_closed || 0);

  const totalExpenses = Number(activeEntry.total_expenses || 0);
  const materialExpenses = Number(activeEntry.material_expenses || 0);
  const labourExpenses = Number(activeEntry.labour_expenses || 0);

  const approvedBudget = Number(activeEntry.approved_budget || 1634120);
  const cumulativeBudgetSpent = Number(activeEntry.cumulative_budget_spent || 83000);
  const budgetBalance = Number(activeEntry.balance || (approvedBudget - cumulativeBudgetSpent));
  const spentPercent = approvedBudget > 0 ? ((cumulativeBudgetSpent / approvedBudget) * 100).toFixed(1) : 0;

  // Total Attachments count
  const activeMonthAttachmentsCount = periodAttachments.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%' }}>

      {/* ========================================================================= */}
      {/* 1. STICKY DASHBOARD MASTER HEADER & FILTER BAR                            */}
      {/* ========================================================================= */}
      <div 
        className="sticky-dashboard-master-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 80,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          padding: '14px 20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Title & Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#e0e7ff',
              color: '#4338ca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)'
            }}>
              <Video size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  CCTV Operations & Surveillance Dashboard
                </h1>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af'
                }}>
                  Surveillance & Security
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569'
                }}>
                  27 Parameter Model
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Projects • Complaints & Service Requests • PPM • Quality Issues • Expenses & Budget Tracking
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                fetchAllEntries();
                fetchPeriodAttachments();
                onRefreshAttachments?.();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} className={loadingEntries ? 'animate-spin' : ''} />
              <span>Refresh Live</span>
            </button>

            {handleExportReport && (
              <button
                onClick={handleExportReport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                }}
              >
                <Download size={13} />
                <span>Download Report</span>
              </button>
            )}

            <button
              onClick={() => onOpenDataEntry?.(activePeriod !== 'all' ? Number(activePeriod) : null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                backgroundColor: '#ec4899',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)'
              }}
            >
              <span>Open Data Entry</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Month Filter Selector Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '2px',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '10px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            Filter Month:
          </span>

          <button
            onClick={() => setActivePeriod('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: activePeriod === 'all' ? '800' : '600',
              backgroundColor: activePeriod === 'all' ? '#0f172a' : '#f8fafc',
              color: activePeriod === 'all' ? '#ffffff' : '#475569',
              border: activePeriod === 'all' ? '1px solid #0f172a' : '1px solid #e2e8f0',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            All Months (Spreadsheet View)
          </button>

          {periods.map(p => {
            const isSel = String(activePeriod) === String(p.id);
            const entryForMonth = entriesMap[p.id];
            const spend = entryForMonth?.total_expenses ? formatINR(entryForMonth.total_expenses) : '₹0';

            return (
              <button
                key={p.id}
                onClick={() => setActivePeriod(String(p.id))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: isSel ? '800' : '600',
                  backgroundColor: isSel ? '#4f46e5' : '#ffffff',
                  color: isSel ? '#ffffff' : '#334155',
                  border: isSel ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                  boxShadow: isSel ? '0 2px 6px rgba(79, 70, 229, 0.3)' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{p.period_label || p.label || `Month ${p.id}`}</span>
                <span style={{
                  fontSize: '10px',
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  backgroundColor: isSel ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: isSel ? '#ffffff' : '#64748b'
                }}>
                  {spend}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE BENTO KPI METRICS SUMMARY                                    */}
      {/* ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* KPI 1: Projects (Green) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #16a34a',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Projects
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: '700' }}>
              {activePeriodObj?.period_label || 'Current'}
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0' }}>
            {totalProjects}
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginLeft: '4px' }}>Total</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px', color: '#475569', marginTop: '4px' }}>
            <span>Completed: <strong style={{ color: '#16a34a' }}>{completedProjects}</strong></span>
            <span>•</span>
            <span>In Progress: <strong style={{ color: '#0284c7' }}>{inProgressProjects}</strong></span>
          </div>
        </div>

        {/* KPI 2: Complaints & TAT (Yellow) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #eab308',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#ca8a04', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Complaints & TAT
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#fef9c3', color: '#854d0e', fontWeight: '700' }}>
              TAT {tatComplaints}h
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0' }}>
            {totalComplaints}
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginLeft: '4px' }}>Tickets</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px', color: '#475569', marginTop: '4px' }}>
            <span>Avg TAT: <strong>{tatComplaints} Hrs</strong></span>
            <span>•</span>
            <span>Repeated: <strong>{repeatedComplaints}</strong></span>
          </div>
        </div>

        {/* KPI 3: Service Requests & TAT (Cyan) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #0284c7',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Service Requests
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#e0f2fe', color: '#075985', fontWeight: '700' }}>
              TAT {tatServices}h
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0' }}>
            {totalServices}
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginLeft: '4px' }}>Requests</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px', color: '#475569', marginTop: '4px' }}>
            <span>Avg TAT: <strong>{tatServices} Hrs</strong></span>
            <span>•</span>
            <span>Repeated: <strong>{repeatedServices}</strong></span>
          </div>
        </div>

        {/* KPI 4: PPM & Quality (Lime & Lavender) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #84cc16',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#65a30d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PPM & Quality
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#f3e8ff', color: '#6b21a8', fontWeight: '700' }}>
              Quality Open: {qualityOpen}
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0' }}>
            {ppmCount}
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginLeft: '4px' }}>PPM Checks</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px' }}>
            Quality Closed: <strong style={{ color: '#16a34a' }}>{qualityClosed}</strong> | Open: <strong style={{ color: qualityOpen > 0 ? '#ef4444' : '#16a34a' }}>{qualityOpen}</strong>
          </div>
        </div>

        {/* KPI 5: Expenses (Peach) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #f97316',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Expenses
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#ffedd5', color: '#9a3412', fontWeight: '700' }}>
              Spent
            </span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0' }} className="currency-font">
            {formatINR(totalExpenses)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px' }}>
            Material: <strong>{formatINR(materialExpenses)}</strong> | Labour: <strong>{formatINR(labourExpenses)}</strong>
          </div>
        </div>

        {/* KPI 6: Budget Tracking & Balance (Green) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #10b981',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Remaining Balance
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#d1fae5', color: '#065f46', fontWeight: '700' }}>
              {spentPercent}% Spent
            </span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0' }} className="currency-font">
            {formatINR(budgetBalance)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px' }}>
            Approved: <strong>{formatINR(approvedBudget)}</strong> | Spent: <strong>{formatINR(cumulativeBudgetSpent)}</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MASTER SPREADSHEET (MATCHES EXACT COLOR SCHEME FROM EXCEL IMAGE)        */}
      {/* ========================================================================= */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid #cbd5e1',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)'
      }}>
        {/* Spreadsheet Header Bar */}
        <div style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '14px 20px',
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
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Video size={18} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '800', margin: 0, letterSpacing: '0.02em' }}>
                CCTV Operations Master Spreadsheet
              </h2>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Showing all 7 color-coded operational domains and monthly audit values
              </span>
            </div>
          </div>

          {/* Quick Search */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search parameter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontSize: '11.5px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Table View */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12.5px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #000000', color: '#000000', fontWeight: '800' }}>
                <th style={{ padding: '10px 12px', border: '1px solid #000000', width: '60px', textAlign: 'center' }}>
                  S.No
                </th>
                <th style={{ padding: '10px 14px', border: '1px solid #000000', minWidth: '320px', textAlign: 'left' }}>
                  Parameters
                </th>
                
                {/* Monthly Columns */}
                {periods.map(p => {
                  const isCurrent = String(activePeriod) === String(p.id);
                  return (
                    <th 
                      key={p.id}
                      style={{
                        padding: '10px 16px',
                        border: '1px solid #000000',
                        textAlign: 'right',
                        minWidth: '140px',
                        backgroundColor: isCurrent ? '#f1f5f9' : '#ffffff',
                        fontWeight: '800'
                      }}
                    >
                      {p.period_label || p.label || `Month ${p.id}`}
                    </th>
                  );
                })}

                <th style={{
                  padding: '10px 16px',
                  border: '1px solid #000000',
                  textAlign: 'right',
                  minWidth: '140px',
                  backgroundColor: '#f8fafc',
                  fontWeight: '900'
                }}>
                  Total / Cumulative
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredParameters.map((param, pIdx) => {
                const styles = getSectionStyles(param.section);
                const isFirstInSection = pIdx === 0 || filteredParameters[pIdx - 1]?.section !== param.section;
                const isSectionHeaderRow = param.s_no && !param.param_key.includes('_');

                return (
                  <tr
                    key={param.param_key || pIdx}
                    style={{
                      backgroundColor: styles.bg,
                      color: styles.text,
                      borderBottom: '1px solid #000000',
                      fontWeight: param.is_bold || param.formula ? '800' : '500'
                    }}
                  >
                    {/* S.No */}
                    <td style={{
                      padding: '8px 10px',
                      border: '1px solid #000000',
                      textAlign: 'center',
                      fontWeight: '800',
                      color: styles.text
                    }}>
                      {param.s_no || ''}
                    </td>

                    {/* Parameter Name */}
                    <td style={{
                      padding: '8px 14px',
                      border: '1px solid #000000',
                      color: styles.text,
                      fontWeight: param.is_bold || param.formula || isSectionHeaderRow ? '800' : '600'
                    }}>
                      {/* Section bold title if S.No is present */}
                      {param.s_no && isFirstInSection && (
                        <span style={{ marginRight: '6px', fontWeight: '900' }}>
                          {param.section}:
                        </span>
                      )}
                      <span>{param.param_name}</span>
                    </td>

                    {/* Dynamic Monthly Columns */}
                    {periods.map(p => {
                      const entryForPeriod = entriesMap[p.id] || {};
                      const rawVal = entryForPeriod[param.param_key];
                      const formatted = formatCellValue(rawVal, param);

                      return (
                        <td
                          key={p.id}
                          style={{
                            padding: '8px 16px',
                            border: '1px solid #000000',
                            textAlign: 'right',
                            fontWeight: param.is_bold || param.formula ? '800' : '500',
                            fontFamily: param.input_type === 'cost' ? 'sans-serif' : 'inherit'
                          }}
                        >
                          {formatted}
                        </td>
                      );
                    })}

                    {/* Total / Cumulative Column */}
                    <td style={{
                      padding: '8px 16px',
                      border: '1px solid #000000',
                      textAlign: 'right',
                      fontWeight: '900',
                      backgroundColor: 'rgba(0,0,0,0.03)'
                    }}>
                      {formatCellValue(getParamCumulative(param.param_key, param), param)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ATTACHED REFERENCE LINKS & EVIDENCE TABLE (REQUESTED BY USER)           */}
      {/* "and and also add the link are refen attched for that monthy entry so make */}
      {/* that onr tbale dfor that make that"                                       */}
      {/* ========================================================================= */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '22px 24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LinkIcon size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Attached Reference Links & Documentation
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af'
                }}>
                  {activeMonthAttachmentsCount} Attached
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Verified audit URLs, invoice drives, and documentation reference links for {activePeriodObj?.period_label || 'All Months'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenDataEntry?.(activePeriod !== 'all' ? Number(activePeriod) : null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              cursor: 'pointer'
            }}
          >
            <Paperclip size={13} />
            <span>Manage Attachments in Data Entry</span>
          </button>
        </div>

        {/* Links Table */}
        {loadingAttachments ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '12.5px' }}>
            Loading attached reference links...
          </div>
        ) : periodAttachments.length === 0 ? (
          <div style={{
            padding: '36px 20px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1'
          }}>
            <Paperclip size={28} color="#94a3b8" style={{ margin: '0 auto 8px auto', display: 'block' }} />
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', margin: '0 0 4px 0' }}>
              No Reference Links Attached for this Month
            </h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0', maxWidth: '420px', marginInline: 'auto' }}>
              You can attach Google Drive folders, CCTV footage reports, invoice links, or PDF logs in the Data Entry tab.
            </p>
            <button
              onClick={() => onOpenDataEntry?.(activePeriod !== 'all' ? Number(activePeriod) : null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <LinkIcon size={13} />
              <span>Attach Reference Link Now</span>
            </button>
          </div>
        ) : (
          <div style={{
            overflowX: 'auto',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '10px 14px', width: '50px' }}>#</th>
                  <th style={{ padding: '10px 14px' }}>Reference Title / Name</th>
                  <th style={{ padding: '10px 14px' }}>Destination URL / File</th>
                  <th style={{ padding: '10px 14px', width: '110px' }}>Type</th>
                  <th style={{ padding: '10px 14px', width: '120px' }}>Uploaded By</th>
                  <th style={{ padding: '10px 14px', width: '110px', textAlign: 'right' }}>Open Link</th>
                </tr>
              </thead>
              <tbody>
                {periodAttachments.map((att, idx) => {
                  const isWebUrl = att.is_link || att.file_path?.startsWith('http');
                  const targetUrl = att.file_path?.startsWith('http') 
                    ? att.file_path 
                    : (att.file_path ? `/api/attachments/download/${att.id}` : '#');

                  return (
                    <tr
                      key={att.id || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafbfc'
                      }}
                    >
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: '600' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: '600', color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isWebUrl ? <LinkIcon size={14} color="#2563eb" /> : <FileText size={14} color="#059669" />}
                          <span>{att.file_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>
                          {att.file_path}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: isWebUrl ? '#eff6ff' : '#ecfdf5',
                          color: isWebUrl ? '#1d4ed8' : '#047857',
                          border: `1px solid ${isWebUrl ? '#dbeafe' : '#a7f3d0'}`
                        }}>
                          {isWebUrl ? 'Web URL' : 'Uploaded File'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>
                        {att.uploaded_by || 'Admin'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '11.5px',
                            fontWeight: '600'
                          }}
                        >
                          <span>Visit</span>
                          <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
