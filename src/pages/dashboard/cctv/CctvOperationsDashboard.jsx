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
  const [viewMode, setViewMode] = useState('charts');

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

  const domainConfigs = [
    { section: 'Projects', num: '01', title: 'Projects', color: '#0F6B3A', bg: '#E4F6EC', summary: `${totalProjects} Total` },
    { section: 'Complaints', num: '02', title: 'Complaints', color: '#8A4A00', bg: '#FFF1DD', summary: `${totalComplaints} Tickets · ${tatComplaints}h TAT` },
    { section: 'Service request', num: '03', title: 'Service requests', color: '#2F4BB8', bg: '#EAF0FF', summary: `${totalServices} Requests · ${tatServices}h TAT` },
    { section: 'PPM', num: '04', title: 'PPM', color: '#0B6B6B', bg: '#DDF3F3', summary: `${ppmCount} Checks` },
    { section: 'Quality Issues', num: '05', title: 'Quality issues', color: '#5B34B5', bg: '#EFE9FB', summary: `${qualityOpen} Open` },
    { section: 'Expenses', num: '06', title: 'Expenses', color: '#A04600', bg: '#FDE3CC', summary: formatINR(totalExpenses) },
    { section: 'Budget Tracking', num: '07', title: 'Budget tracking', color: '#14663A', bg: '#D9EFD0', summary: `Balance ${formatINR(budgetBalance)}` }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ========================================================================= */}
      {/* 1. STICKY TOP FILTER BAR                                                  */}
      {/* ========================================================================= */}
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          {/* Title & Badges */}
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
              <Video size={21} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#14245C', margin: 0, letterSpacing: '-0.02em' }}>
                  CCTV Operations and Surveillance Dashboard
                </h1>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#EAF0FF',
                  color: '#2F4BB8'
                }}>
                  Surveillance and security
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#F3F5FA',
                  color: '#475569'
                }}>
                  27 parameter model
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '3px 0 0 0', fontWeight: '500' }}>
                Projects · complaints and service requests · PPM · quality issues · expenses and budget tracking
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                fetchAllEntries();
                fetchPeriodAttachments();
                onRefreshAttachments?.();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '38px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: '700',
                backgroundColor: '#ffffff',
                color: '#14245C',
                border: '1px solid #E1E6F2',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loadingEntries ? 'animate-spin' : ''} />
              <span>Refresh live</span>
            </button>

            {handleExportReport && (
              <button
                type="button"
                onClick={handleExportReport}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  minHeight: '38px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  backgroundColor: '#ffffff',
                  color: '#14245C',
                  border: '1px solid #14245C',
                  cursor: 'pointer'
                }}
              >
                <Download size={14} />
                <span>Download report</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenDataEntry?.(activePeriod !== 'all' ? Number(activePeriod) : null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '38px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: '800',
                backgroundColor: '#F5A524',
                color: '#14245C',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(245, 165, 36, 0.28)'
              }}
            >
              <span>Open data entry</span>
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>

        {/* Month Chips + Search Parameter Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderTop: '1px solid #EDF0F8',
          paddingTop: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              MONTH
            </span>

            <button
              type="button"
              onClick={() => setActivePeriod('all')}
              style={{
                minHeight: '36px',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: activePeriod === 'all' ? '800' : '600',
                backgroundColor: activePeriod === 'all' ? '#14245C' : '#F3F5FA',
                color: activePeriod === 'all' ? '#ffffff' : '#334155',
                border: activePeriod === 'all' ? '1px solid #14245C' : '1px solid #E1E6F2',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              All months (spreadsheet view)
            </button>

            {periods.map(p => {
              const isSel = String(activePeriod) === String(p.id);
              const entryForMonth = entriesMap[p.id];
              const spend = entryForMonth?.total_expenses ? formatINR(entryForMonth.total_expenses) : '₹0';

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePeriod(String(p.id))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: '36px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: isSel ? '800' : '600',
                    backgroundColor: isSel ? '#14245C' : '#ffffff',
                    color: isSel ? '#ffffff' : '#334155',
                    border: isSel ? '1px solid #14245C' : '1px solid #E1E6F2',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{p.period_label || p.label || `Month ${p.id}`}</span>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '700',
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    backgroundColor: isSel ? 'rgba(255,255,255,0.2)' : '#F3F5FA',
                    color: isSel ? '#F5A524' : '#64748b'
                  }}>
                    {spend}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search parameter input + VIEW segmented control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                aria-label="Search parameter"
                placeholder="Search parameter…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '38px',
                  padding: '7px 12px 7px 34px',
                  borderRadius: '10px',
                  border: '1px solid #E1E6F2',
                  backgroundColor: '#F3F5FA',
                  color: '#14245C',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                VIEW
              </span>
              <div
                role="group"
                aria-label="Dashboard view mode"
                style={{
                  display: 'inline-flex',
                  backgroundColor: '#F3F5FA',
                  border: '1px solid #E1E6F2',
                  borderRadius: '10px',
                  padding: '3px',
                  gap: '2px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('charts')}
                  style={{
                    minHeight: '32px',
                    padding: '5px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: viewMode === 'charts' ? '800' : '600',
                    backgroundColor: viewMode === 'charts' ? '#14245C' : 'transparent',
                    color: viewMode === 'charts' ? '#ffffff' : '#475569',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Charts
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('tables')}
                  style={{
                    minHeight: '32px',
                    padding: '5px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: viewMode === 'tables' ? '800' : '600',
                    backgroundColor: viewMode === 'tables' ? '#14245C' : 'transparent',
                    color: viewMode === 'tables' ? '#ffffff' : '#475569',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Tables
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KPI STRIP (6 CARDS)                                                    */}
      {/* ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* KPI 1: Projects (Green) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '18px 20px',
          border: '1px solid #E1E6F2',
          borderTop: '4px solid #0F6B3A',
          boxShadow: '0 2px 8px rgba(20, 36, 92, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#0F6B3A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Projects
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#E4F6EC', color: '#0F6B3A', fontWeight: '700' }}>
              {activePeriodObj?.period_label || 'Current'}
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#14245C', margin: '8px 0 4px 0' }}>
            {totalProjects}
            <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#64748b', marginLeft: '6px' }}>Total</span>
          </div>
          <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
            Completed: <strong style={{ color: '#0F6B3A' }}>{completedProjects}</strong> · In progress: <strong style={{ color: '#2F4BB8' }}>{inProgressProjects}</strong>
          </div>
        </div>

        {/* KPI 2: Complaints and TAT (Amber) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '18px 20px',
          border: '1px solid #E1E6F2',
          borderTop: '4px solid #F5A524',
          boxShadow: '0 2px 8px rgba(20, 36, 92, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#8A4A00', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Complaints &amp; TAT
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#FFF1DD', color: '#8A4A00', fontWeight: '700' }}>
              TAT {tatComplaints}h
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#14245C', margin: '8px 0 4px 0' }}>
            {totalComplaints}
            <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#64748b', marginLeft: '6px' }}>Tickets</span>
          </div>
          <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
            Avg TAT: <strong>{tatComplaints} Hrs</strong> · Repeated: <strong>{repeatedComplaints}</strong>
          </div>
        </div>

        {/* KPI 3: Service Requests (Blue) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '18px 20px',
          border: '1px solid #E1E6F2',
          borderTop: '4px solid #2F4BB8',
          boxShadow: '0 2px 8px rgba(20, 36, 92, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#2F4BB8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Service requests
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#EAF0FF', color: '#2F4BB8', fontWeight: '700' }}>
              TAT {tatServices}h
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#14245C', margin: '8px 0 4px 0' }}>
            {totalServices}
            <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#64748b', marginLeft: '6px' }}>Requests</span>
          </div>
          <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
            Avg TAT: <strong>{tatServices} Hrs</strong> · Repeated: <strong>{repeatedServices}</strong>
          </div>
        </div>

        {/* KPI 4: PPM and Quality (Purple) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '18px 20px',
          border: '1px solid #E1E6F2',
          borderTop: '4px solid #5B34B5',
          boxShadow: '0 2px 8px rgba(20, 36, 92, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#5B34B5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              PPM &amp; quality
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#EFE9FB', color: '#5B34B5', fontWeight: '700' }}>
              Open: {qualityOpen}
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#14245C', margin: '8px 0 4px 0' }}>
            {ppmCount}
            <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#64748b', marginLeft: '6px' }}>PPM checks</span>
          </div>
          <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
            Closed: <strong style={{ color: '#0F6B3A' }}>{qualityClosed}</strong> · Open: <strong style={{ color: qualityOpen > 0 ? '#dc2626' : '#0F6B3A' }}>{qualityOpen}</strong>
          </div>
        </div>

        {/* KPI 5: Total Expenses (Orange) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '18px 20px',
          border: '1px solid #E1E6F2',
          borderTop: '4px solid #A04600',
          boxShadow: '0 2px 8px rgba(20, 36, 92, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#A04600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total expenses
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#FDE3CC', color: '#A04600', fontWeight: '700' }}>
              Spent
            </span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#14245C', margin: '8px 0 4px 0' }} className="currency-font">
            {formatINR(totalExpenses)}
          </div>
          <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
            Material: <strong>{formatINR(materialExpenses)}</strong> · Labour: <strong>{formatINR(labourExpenses)}</strong>
          </div>
        </div>

        {/* KPI 6: Remaining Balance (Teal) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '18px 20px',
          border: '1px solid #E1E6F2',
          borderTop: '4px solid #0B6B6B',
          boxShadow: '0 2px 8px rgba(20, 36, 92, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#0B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Remaining balance
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#DDF3F3', color: '#0B6B6B', fontWeight: '700' }}>
              {spentPercent}% Spent
            </span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#14245C', margin: '8px 0 4px 0' }} className="currency-font">
            {formatINR(budgetBalance)}
          </div>
          <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
            Approved: <strong>{formatINR(approvedBudget)}</strong> · Spent: <strong>{formatINR(cumulativeBudgetSpent)}</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CHARTS VIEW (DEFAULT) OR TABLES VIEW                                   */}
      {/* ========================================================================= */}
      {viewMode === 'charts' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 3a. Monthly Expenses Column Chart (Full Width) */}
          {(() => {
            const monthBars = periods.map(p => {
              const e = entriesMap[p.id] || {};
              return {
                id: p.id,
                label: p.period_label || p.label || `Month ${p.id}`,
                value: Number(e.total_expenses || 0),
                isSelected: String(activePeriod) === String(p.id)
              };
            });
            const maxExpense = Math.max(...monthBars.map(b => b.value), 1);

            return (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #E1E6F2',
                  padding: '22px',
                  boxShadow: '0 2px 10px rgba(20, 36, 92, 0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#14245C', margin: 0 }}>
                      Monthly expenses trend
                    </h2>
                    <p style={{ fontSize: '12.5px', color: '#64748b', margin: '3px 0 0 0' }}>
                      Total CCTV material and labour expenses by month ({activePeriodObj?.period_label || 'Latest / All'})
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#E8590C', display: 'inline-block' }} />
                      Selected month
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#F5B97A', display: 'inline-block' }} />
                      Other months
                    </span>
                  </div>
                </div>

                <div
                  role="img"
                  aria-label="Monthly CCTV total expenses bar chart"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.max(monthBars.length, 1)}, minmax(72px, 1fr))`,
                    gap: '14px',
                    alignItems: 'end',
                    minHeight: '190px',
                    paddingTop: '24px',
                    overflowX: 'auto'
                  }}
                >
                  {monthBars.map((bar) => {
                    const heightPct = bar.value > 0 ? Math.max(10, Math.round((bar.value / maxExpense) * 100)) : 6;
                    const barColor = bar.value <= 0
                      ? '#E2E8F0'
                      : (bar.isSelected ? '#E8590C' : '#F5B97A');

                    return (
                      <button
                        key={bar.id}
                        type="button"
                        onClick={() => setActivePeriod(String(bar.id))}
                        aria-label={`${bar.label}: ${formatINR(bar.value)}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '8px',
                          height: '175px',
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '11.5px', fontWeight: '800', color: bar.value > 0 ? '#14245C' : '#94a3b8', whiteSpace: 'nowrap' }} className="currency-font">
                          {formatINR(bar.value)}
                        </span>
                        <div style={{ width: '100%', maxWidth: '58px', height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                          <div
                            style={{
                              width: '100%',
                              height: `${heightPct}%`,
                              backgroundColor: barColor,
                              borderRadius: '10px 10px 4px 4px',
                              transition: 'height 0.25s ease, background-color 0.2s ease'
                            }}
                          />
                        </div>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: bar.isSelected ? '800' : '600',
                          color: bar.isSelected ? '#14245C' : '#64748b',
                          whiteSpace: 'nowrap'
                        }}>
                          {bar.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* 3b. Seven Domain Chart Cards (Responsive Grid min 340px) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '20px'
          }}>
            {domainConfigs.map((dom) => {
              const domainParams = filteredParameters.filter(param => param.section === dom.section);
              if (domainParams.length === 0) return null;

              const renderDonut = (firstVal, secondVal, firstColor, secondColor, centerText, centerSub, legendItems, ariaLabel) => {
                const total = Math.max(0, firstVal) + Math.max(0, secondVal);
                const r = 46;
                const circ = 2 * Math.PI * r;
                const firstDash = total > 0 ? (Math.max(0, firstVal) / total) * circ : 0;
                const secondDash = total > 0 ? (Math.max(0, secondVal) / total) * circ : 0;

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <svg width="124" height="124" viewBox="0 0 124 124" role="img" aria-label={ariaLabel} style={{ flexShrink: 0 }}>
                      <circle cx="62" cy="62" r={r} fill="none" stroke="#E2E8F0" strokeWidth="16" />
                      {total > 0 && (
                        <>
                          <circle
                            cx="62"
                            cy="62"
                            r={r}
                            fill="none"
                            stroke={firstColor}
                            strokeWidth="16"
                            strokeDasharray={`${firstDash} ${circ}`}
                            transform="rotate(-90 62 62)"
                          />
                          <circle
                            cx="62"
                            cy="62"
                            r={r}
                            fill="none"
                            stroke={secondColor}
                            strokeWidth="16"
                            strokeDasharray={`${secondDash} ${circ}`}
                            strokeDashoffset={-firstDash}
                            transform="rotate(-90 62 62)"
                          />
                        </>
                      )}
                      <text x="62" y="59" textAnchor="middle" fill="#14245C" fontSize="15" fontWeight="800">
                        {centerText}
                      </text>
                      <text x="62" y="76" textAnchor="middle" fill="#64748b" fontSize="10.5" fontWeight="700">
                        {centerSub}
                      </text>
                    </svg>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '150px' }}>
                      {legendItems.map((item) => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '8px 12px', borderRadius: '10px', backgroundColor: '#F7F9FD' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '9999px', backgroundColor: item.color, display: 'inline-block' }} />
                            {item.label}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#14245C' }} className="currency-font">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              };

              const renderBars = (items, ariaLabel) => {
                const maxVal = Math.max(...items.map(i => Number(i.value || 0)), 1);
                return (
                  <div role="img" aria-label={ariaLabel} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {items.map((item) => {
                      const val = Number(item.value || 0);
                      const pct = val > 0 ? Math.max(4, Math.round((val / maxVal) * 100)) : 0;
                      return (
                        <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
                            <span>{item.label}</span>
                            <span style={{ color: '#14245C', fontWeight: '800' }}>{val.toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ width: '100%', height: '10px', borderRadius: '9999px', backgroundColor: '#F3F5FA', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: '9999px', backgroundColor: val > 0 ? item.color : '#E2E8F0' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              };

              let cardBody = null;
              if (dom.section === 'Projects') {
                cardBody = renderDonut(
                  completedProjects,
                  inProgressProjects,
                  '#18A058',
                  '#BFE6CF',
                  String(totalProjects),
                  'Total',
                  [
                    { label: 'Completed', value: completedProjects, color: '#18A058' },
                    { label: 'In progress', value: inProgressProjects, color: '#BFE6CF' }
                  ],
                  `Projects donut chart: ${completedProjects} completed, ${inProgressProjects} in progress`
                );
              } else if (dom.section === 'Complaints') {
                const cCctv = Number(activeEntry.complaints_cctv || 0);
                const cBio = Number(activeEntry.complaints_biometric || 0);
                const cFlap = Number(activeEntry.complaints_flapbarrier || 0);
                const timeTakenC = Number(activeEntry.time_taken_complaints_hrs || 0);
                cardBody = (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {renderBars(
                      [
                        { label: 'CCTV', value: cCctv, color: '#E5A100' },
                        { label: 'Biometric', value: cBio, color: '#E5A100' },
                        { label: 'Flapbarrier', value: cFlap, color: '#E5A100' }
                      ],
                      `Complaints bar chart: CCTV ${cCctv}, Biometric ${cBio}, Flapbarrier ${cFlap}`
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <div style={{ backgroundColor: '#F7F9FD', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>Repeated</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#14245C', marginTop: '2px' }}>{repeatedComplaints}</div>
                      </div>
                      <div style={{ backgroundColor: '#F7F9FD', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>Time taken</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#14245C', marginTop: '2px' }}>{timeTakenC}h</div>
                      </div>
                      <div style={{ backgroundColor: '#F7F9FD', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>TAT hrs</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#8A4A00', marginTop: '2px' }}>{tatComplaints}h</div>
                      </div>
                    </div>
                  </div>
                );
              } else if (dom.section === 'Service request') {
                const sCctv = Number(activeEntry.service_cctv || 0);
                const sBio = Number(activeEntry.service_biometric || 0);
                const sFlap = Number(activeEntry.service_flapbarrier || 0);
                const timeTakenS = Number(activeEntry.time_taken_service_hrs || 0);
                cardBody = (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {renderBars(
                      [
                        { label: 'CCTV', value: sCctv, color: '#2F4BB8' },
                        { label: 'Biometric', value: sBio, color: '#2F4BB8' },
                        { label: 'Flapbarrier', value: sFlap, color: '#2F4BB8' }
                      ],
                      `Service requests bar chart: CCTV ${sCctv}, Biometric ${sBio}, Flapbarrier ${sFlap}`
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <div style={{ backgroundColor: '#F7F9FD', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>Repeated work</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#14245C', marginTop: '2px' }}>{repeatedServices}</div>
                      </div>
                      <div style={{ backgroundColor: '#F7F9FD', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>Time taken</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#14245C', marginTop: '2px' }}>{timeTakenS}h</div>
                      </div>
                      <div style={{ backgroundColor: '#F7F9FD', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>TAT hrs</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#2F4BB8', marginTop: '2px' }}>{tatServices}h</div>
                      </div>
                    </div>
                  </div>
                );
              } else if (dom.section === 'PPM') {
                const ppmBars = periods.map(p => {
                  const fullLabel = p.period_label || p.label || `M${p.id}`;
                  const shortLabel = fullLabel.split(' ')[0];
                  return {
                    id: p.id,
                    label: shortLabel,
                    fullLabel,
                    value: Number(entriesMap[p.id]?.ppm_count || 0),
                    isSelected: String(activePeriod) === String(p.id)
                  };
                });
                const maxPpm = Math.max(...ppmBars.map(b => b.value), 1);
                cardBody = (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '34px', fontWeight: '800', color: '#14245C', lineHeight: 1.1 }}>{ppmCount}</div>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0B6B6B', marginTop: '4px' }}>preventive checks</div>
                    </div>
                    <div
                      role="img"
                      aria-label="PPM preventive checks per month column chart"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.max(ppmBars.length, 1)}, minmax(38px, 1fr))`,
                        gap: '8px',
                        alignItems: 'end',
                        minHeight: '95px',
                        overflowX: 'auto'
                      }}
                    >
                      {ppmBars.map(b => {
                        const hPct = b.value > 0 ? Math.max(12, Math.round((b.value / maxPpm) * 100)) : 8;
                        return (
                          <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '10.5px', fontWeight: '800', color: b.value > 0 ? '#14245C' : '#94a3b8' }}>{b.value}</span>
                            <div style={{ width: '100%', maxWidth: '30px', height: '56px', display: 'flex', alignItems: 'flex-end' }}>
                              <div style={{ width: '100%', height: `${hPct}%`, borderRadius: '6px 6px 2px 2px', backgroundColor: b.value <= 0 ? '#E2E8F0' : (b.isSelected ? '#0B6B6B' : '#99D5D5') }} />
                            </div>
                            <span style={{ fontSize: '10.5px', fontWeight: b.isSelected ? '800' : '600', color: b.isSelected ? '#0B6B6B' : '#64748b', whiteSpace: 'nowrap' }}>
                              {b.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              } else if (dom.section === 'Quality Issues') {
                const qRec = Number(activeEntry.quality_issues_received || 0);
                cardBody = (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {renderBars(
                      [
                        { label: 'Received', value: qRec, color: '#5B34B5' },
                        { label: 'Closed', value: qualityClosed, color: '#18A058' },
                        { label: 'Open', value: qualityOpen, color: '#DC2626' }
                      ],
                      `Quality issues bar chart: Received ${qRec}, Closed ${qualityClosed}, Open ${qualityOpen}`
                    )}
                    <div style={{ fontSize: '11.5px', fontWeight: '600', color: '#64748b', backgroundColor: '#F7F9FD', padding: '8px 12px', borderRadius: '8px' }}>
                      Open = received − closed
                    </div>
                  </div>
                );
              } else if (dom.section === 'Expenses') {
                cardBody = renderDonut(
                  materialExpenses,
                  labourExpenses,
                  '#E8590C',
                  '#F5B97A',
                  formatINR(totalExpenses),
                  'Total',
                  [
                    { label: 'Material', value: formatINR(materialExpenses), color: '#E8590C' },
                    { label: 'Labour', value: formatINR(labourExpenses), color: '#F5B97A' }
                  ],
                  `Expenses donut chart: Material ${formatINR(materialExpenses)}, Labour ${formatINR(labourExpenses)}`
                );
              } else if (dom.section === 'Budget Tracking') {
                const pctNum = Math.min(100, Math.max(0, Number(spentPercent) || 0));
                cardBody = (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '30px', fontWeight: '800', color: '#14245C' }}>{spentPercent}%</span>
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#14663A' }}>spent of approved budget</span>
                    </div>
                    <div
                      role="img"
                      aria-label={`Budget progress: ${spentPercent}% spent`}
                      style={{ width: '100%', height: '12px', borderRadius: '9999px', backgroundColor: '#E4F6EC', overflow: 'hidden' }}
                    >
                      <div style={{ width: `${pctNum}%`, height: '100%', borderRadius: '9999px', backgroundColor: '#14663A' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <div style={{ backgroundColor: '#F7F9FD', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>Approved</div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#14245C', marginTop: '2px' }} className="currency-font">{formatINR(approvedBudget)}</div>
                      </div>
                      <div style={{ backgroundColor: '#F7F9FD', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>Spent</div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#A04600', marginTop: '2px' }} className="currency-font">{formatINR(cumulativeBudgetSpent)}</div>
                      </div>
                      <div style={{ backgroundColor: '#F7F9FD', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>Balance</div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#14663A', marginTop: '2px' }} className="currency-font">{formatINR(budgetBalance)}</div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={dom.section}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    border: '1px solid #E1E6F2',
                    padding: '22px',
                    boxShadow: '0 2px 10px rgba(20, 36, 92, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '800',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        backgroundColor: dom.bg,
                        color: dom.color
                      }}>
                        {dom.num}
                      </span>
                      <h2 style={{ fontSize: '15.5px', fontWeight: '800', color: '#14245C', margin: 0 }}>
                        {dom.title}
                      </h2>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: dom.bg,
                      color: dom.color
                    }}>
                      {dom.summary}
                    </span>
                  </div>
                  {cardBody}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {domainConfigs.map((dom) => {
            const domainParams = filteredParameters.filter(param => param.section === dom.section);
            if (domainParams.length === 0) return null;

            return (
              <div
                key={dom.section}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  border: '1px solid #E1E6F2',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(20, 36, 92, 0.04)'
                }}
              >
                {/* Domain Card Header */}
                <div style={{
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  borderBottom: '1px solid #EDF0F8'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: dom.bg,
                      color: dom.color
                    }}>
                      {dom.num}
                    </span>
                    <h2 style={{ fontSize: '15.5px', fontWeight: '800', color: '#14245C', margin: 0 }}>
                      {dom.title}
                    </h2>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    backgroundColor: dom.bg,
                    color: dom.color
                  }}>
                    {dom.summary}
                  </span>
                </div>

                {/* Domain Table (horizontal scroll inside card) */}
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F7F9FD', borderBottom: '1px solid #D5DCEE', color: '#475569' }}>
                        <th style={{ padding: '10px 12px', width: '58px', textAlign: 'center', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em' }}>
                          NO.
                        </th>
                        <th style={{ padding: '10px 14px', minWidth: '280px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em' }}>
                          PARAMETER
                        </th>
                        {periods.map(p => {
                          const isCurrent = String(activePeriod) === String(p.id);
                          return (
                            <th
                              key={p.id}
                              style={{
                                padding: '10px 14px',
                                textAlign: 'right',
                                minWidth: '130px',
                                whiteSpace: 'nowrap',
                                fontSize: '11.5px',
                                fontWeight: '800',
                                backgroundColor: isCurrent ? '#14245C' : '#F7F9FD',
                                color: isCurrent ? '#ffffff' : '#475569'
                              }}
                            >
                              {p.period_label || p.label || `Month ${p.id}`}
                            </th>
                          );
                        })}
                        <th style={{ padding: '10px 16px', textAlign: 'right', minWidth: '130px', whiteSpace: 'nowrap', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', color: '#14245C', backgroundColor: '#F3F5FA' }}>
                          TOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {domainParams.map((param, pIdx) => {
                        const isSummaryRow =
                          (param.param_name && (
                            param.param_name.toLowerCase().includes('total') ||
                            param.param_name.toLowerCase().includes('approved') ||
                            param.param_name.toLowerCase().includes('balance')
                          )) ||
                          param.is_bold ||
                          Boolean(param.formula);

                        return (
                          <tr
                            key={param.param_key || pIdx}
                            style={{
                              backgroundColor: isSummaryRow ? '#F7F9FD' : '#ffffff',
                              borderBottom: isSummaryRow ? '1px solid #D5DCEE' : '1px solid #EDF0F8',
                              fontWeight: isSummaryRow ? '800' : '500',
                              color: '#14245C'
                            }}
                          >
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>
                              {param.s_no || ''}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: isSummaryRow ? '800' : '600', color: '#14245C' }}>
                              {param.param_name}
                            </td>
                            {periods.map(p => {
                              const isCurrent = String(activePeriod) === String(p.id);
                              const entryForPeriod = entriesMap[p.id] || {};
                              const rawVal = entryForPeriod[param.param_key];
                              const formatted = formatCellValue(rawVal, param);
                              const isEmpty = formatted === '—';

                              return (
                                <td
                                  key={p.id}
                                  style={{
                                    padding: '10px 14px',
                                    textAlign: 'right',
                                    whiteSpace: 'nowrap',
                                    backgroundColor: isCurrent ? '#EAF0FF' : 'transparent',
                                    fontWeight: isSummaryRow ? '800' : '600',
                                    color: isEmpty ? '#94a3b8' : '#14245C'
                                  }}
                                  className="currency-font"
                                >
                                  {formatted}
                                </td>
                              );
                            })}
                            <td
                              style={{
                                padding: '10px 16px',
                                textAlign: 'right',
                                whiteSpace: 'nowrap',
                                fontWeight: '800',
                                color: '#14245C',
                                backgroundColor: isSummaryRow ? '#EEF2FA' : '#F8FAFC'
                              }}
                              className="currency-font"
                            >
                              {formatCellValue(getParamCumulative(param.param_key, param), param)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ATTACHED REFERENCE LINKS & DOCUMENTATION                               */}
      {/* ========================================================================= */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #E1E6F2',
        padding: '22px 24px',
        boxShadow: '0 2px 8px rgba(20, 36, 92, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: '#EAF0FF',
              color: '#2F4BB8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LinkIcon size={19} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#14245C', margin: 0 }}>
                  Attached reference links and documentation
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  backgroundColor: '#EAF0FF',
                  color: '#2F4BB8'
                }}>
                  {activeMonthAttachmentsCount} attached
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '3px 0 0 0' }}>
                Verified audit URLs, invoice drives and documentation reference links for {activePeriodObj?.period_label || 'All Months'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenDataEntry?.(activePeriod !== 'all' ? Number(activePeriod) : null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '38px',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: '800',
              backgroundColor: '#F5A524',
              color: '#14245C',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Paperclip size={14} />
            <span>Manage attachments in data entry</span>
          </button>
        </div>

        {/* Links Table / Empty State */}
        {loadingAttachments ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Loading attached reference links...
          </div>
        ) : periodAttachments.length === 0 ? (
          <div style={{
            padding: '32px 20px',
            textAlign: 'center',
            backgroundColor: '#F7F9FD',
            borderRadius: '14px',
            border: '1px dashed #D5DCEE'
          }}>
            <Paperclip size={26} color="#94a3b8" style={{ margin: '0 auto 8px auto', display: 'block' }} />
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#14245C', margin: '0 0 4px 0' }}>
              No reference links attached for this month
            </h4>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 auto 14px auto', maxWidth: '420px' }}>
              You can attach Google Drive folders, CCTV footage reports, invoice links, or PDF logs in the Data Entry tab.
            </p>
            <button
              type="button"
              onClick={() => onOpenDataEntry?.(activePeriod !== 'all' ? Number(activePeriod) : null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '36px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                backgroundColor: '#14245C',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <LinkIcon size={13} />
              <span>Attach reference link now</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '12px'
          }}>
            {periodAttachments.map((att, idx) => {
              const isWebUrl = att.is_link || att.file_path?.startsWith('http');
              const targetUrl = att.file_path?.startsWith('http')
                ? att.file_path
                : (att.file_path ? `/api/attachments/download/${att.id}` : '#');
              const attDate = att.created_at ? new Date(att.created_at).toLocaleDateString('en-IN') : (att.uploaded_by || 'Admin');

              return (
                <div
                  key={att.id || idx}
                  style={{
                    backgroundColor: '#F7F9FD',
                    borderRadius: '14px',
                    border: '1px solid #E1E6F2',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      backgroundColor: isWebUrl ? '#EAF0FF' : '#E4F6EC',
                      color: isWebUrl ? '#2F4BB8' : '#0F6B3A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isWebUrl ? <LinkIcon size={16} /> : <FileText size={16} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#14245C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {att.file_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          backgroundColor: isWebUrl ? '#EAF0FF' : '#E4F6EC',
                          color: isWebUrl ? '#2F4BB8' : '#0F6B3A'
                        }}>
                          {isWebUrl ? 'Web URL' : 'Uploaded File'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                          {attDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        minHeight: '34px',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#14245C',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                    >
                      <span>Visit</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
