import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, BedDouble, Users, Wrench, DollarSign, Download, 
  ArrowRight, FileSpreadsheet, Calendar, ChevronDown, Check,
  Sparkles, FileText, Printer, Paperclip, LayoutDashboard, Table, Layers
} from 'lucide-react';
import { formatINR, formatPeriodLabel, formatIndianCompact } from '../../../utils/formatters';
import { getBudgetMonthCol } from '../../../utils/hostelBudgetConstants';
import HostelExecutiveKpis from './HostelExecutiveKpis';
import HostelCapacityOccupancySection from './HostelCapacityOccupancySection';
import HostelExpensesBudgetSection from './HostelExpensesBudgetSection';
import HostelReportsModal from './HostelReportsModal';
import HostelDashboardCensusView from '../HostelDashboardCensusView';
import HostelDashboardDataTable from '../HostelDashboardDataTable';
import MonthlyAttachmentsModal from '../../../components/attachments/MonthlyAttachmentsModal';

export default function HostelOperationsDashboard({
  computedMatrix = {},
  periods = [],
  categories = [],
  activePeriod = 'all',
  setActivePeriod,
  onOpenDataEntry,
  handleExportReport,
  remarksDraft = {},
  attachmentsSummary = {},
  onRefreshAttachments
}) {
  const [showHostelAttachmentsModal, setShowHostelAttachmentsModal] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [activeMainView, setActiveMainView] = useState('executive'); // 'executive' | 'census_ledger' | 'spreadsheet_matrix' | 'all'
  const [budgetTrackingData, setBudgetTrackingData] = useState([]);
  const [localHostelMatrix, setLocalHostelMatrix] = useState(null);

  // Self-healing check to ensure Hostel matrix and its 13 periods are always loaded
  useEffect(() => {
    const isHostel = computedMatrix?.module === 'hostel' && (computedMatrix?.periods?.length || 0) >= 10;
    if (!isHostel) {
      fetch('/api/matrix?module=hostel')
        .then(res => res.json())
        .then(data => {
          if (data && data.periods && data.periods.length > 0) {
            data.module = 'hostel';
            setLocalHostelMatrix(data);
          }
        })
        .catch(err => console.warn('[HostelDashboard] Matrix fetch notice:', err));
    }
  }, [computedMatrix]);

  const effectiveMatrix = (computedMatrix?.module === 'hostel' && (computedMatrix?.periods?.length || 0) >= 10)
    ? computedMatrix
    : (localHostelMatrix || computedMatrix || {});

  const effectivePeriods = (effectiveMatrix?.periods && effectiveMatrix.periods.length > 0)
    ? effectiveMatrix.periods
    : periods;

  const hostelCensusMap = effectiveMatrix?.hostel_census || computedMatrix?.hostel_census || {};

  useEffect(() => {
    if (effectiveMatrix?.hostel_budget_tracking && effectiveMatrix.hostel_budget_tracking.length > 0) {
      setBudgetTrackingData(effectiveMatrix.hostel_budget_tracking);
    } else {
      fetch('/api/hostel/budget-tracking')
        .then(res => res.json())
        .then(d => {
          if (d?.items) setBudgetTrackingData(d.items);
        })
        .catch(err => console.warn('Budget tracking notice:', err));
    }
  }, [effectiveMatrix?.hostel_budget_tracking]);

  // Whether "All Months" is active
  const isAllMonths = activePeriod === 'all';

  // Effective period for single-month snapshot metrics (defaults to recorded month with live expenses e.g. Oct'26)
  const effectivePeriodId = useMemo(() => {
    if (activePeriod && activePeriod !== 'all') {
      return String(activePeriod);
    }
    // Default to the recorded period with live expenses or period 30 (Oct)
    if (effectivePeriods.length > 0) {
      const withExpenses = effectivePeriods.find(p => {
        const c = hostelCensusMap[String(p.id)];
        return c && Number(c.expenses_occurred || 0) > 0;
      });
      if (withExpenses) return String(withExpenses.id);

      const oct = effectivePeriods.find(p => String(p.id) === '30' || (p.period_label || '').toLowerCase().includes('oct'));
      if (oct) return String(oct.id);

      return String(effectivePeriods[0].id);
    }
    return '30';
  }, [activePeriod, effectivePeriods, hostelCensusMap]);

  const activePeriodObj = useMemo(() => {
    return effectivePeriods.find(p => String(p.id) === effectivePeriodId) || effectivePeriods[0] || {};
  }, [effectivePeriods, effectivePeriodId]);

  const activeMonthCol = useMemo(() => {
    return getBudgetMonthCol(activePeriodObj, effectivePeriodId);
  }, [activePeriodObj, effectivePeriodId]);

  // Census data for active period / snapshot
  const activeCensus = useMemo(() => {
    return hostelCensusMap[effectivePeriodId] || (effectivePeriods.length > 0 && hostelCensusMap[String(effectivePeriods[0].id)]) || {};
  }, [hostelCensusMap, effectivePeriodId, effectivePeriods]);

  // Previous month census for delta and movement calculations
  const prevCensus = useMemo(() => {
    const activeIdx = effectivePeriods.findIndex(p => String(p.id) === effectivePeriodId);
    if (activeIdx > 0) {
      const prevId = String(effectivePeriods[activeIdx - 1].id);
      return hostelCensusMap[prevId] || {};
    }
    return {};
  }, [effectivePeriods, effectivePeriodId, hostelCensusMap]);

  // Grand total spend across all recorded months from PostgreSQL DB
  const allMonthsTotalSpend = useMemo(() => {
    // 1. Sum actual month columns across budget tracking data if available
    let budgetTrackingSum = 0;
    if (budgetTrackingData && budgetTrackingData.length > 0) {
      budgetTrackingData.forEach(h => {
        Object.keys(h).forEach(k => {
          if (k.endsWith('_actual')) {
            budgetTrackingSum += Number(h[k] || 0);
          }
        });
      });
    }

    // 2. Sum across all recorded months in census entries
    let censusSum = 0;
    if (hostelCensusMap && Object.keys(hostelCensusMap).length > 0) {
      Object.values(hostelCensusMap).forEach(c => {
        censusSum += Number(c?.expenses_occurred || 0);
      });
    }

    // 3. Computed matrix grand total
    const matrixTotal = Number(computedMatrix?.grand_total?.total || 0);

    return Math.max(budgetTrackingSum, censusSum, matrixTotal);
  }, [budgetTrackingData, hostelCensusMap, computedMatrix]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* ========================================================================= */}
      {/* UNIFIED STICKY DASHBOARD HEADER & FILTER BAR (PINS TO TOP ON SCROLL)     */}
      {/* Keeps "Hostel Operations Dashboard" + Badges + Month Filter Pills at Top */}
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
          padding: '12px 20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '4px'
        }}
      >
        {/* Tier 1: Hostel Title, Badge, Subtitle & Action Buttons (Always visible at top) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Module Title, Icon & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.15)',
              flexShrink: 0
            }}>
              🏢
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}>
                  Hostel Operations Dashboard
                </h1>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0'
                }}>
                  Hostel
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons (Reports, Download Report, Open Data Entry) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Detailed Reports Modal Button */}
            <button
              type="button"
              onClick={() => setReportsModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '9999px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #059669',
                color: '#059669',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(5, 150, 105, 0.08)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ecfdf5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              <FileText size={13} color="#059669" />
              <span>Hostel Reports</span>
            </button>

            {/* Download Official Audit Report Button */}
            <button
              type="button"
              onClick={handleExportReport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '9999px',
                backgroundColor: '#059669',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 3px 12px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047857'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            >
              <Download size={13} />
              <span>Download Report</span>
            </button>

            {/* Open Data Entry Button */}
            {onOpenDataEntry && (
              <button
                type="button"
                onClick={onOpenDataEntry}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #ff7e9e 0%, #ff4b72 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(255, 96, 136, 0.3)',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span>Open Data Entry</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Month Filter Pills & Viewing Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          paddingTop: '8px',
          borderTop: '1px solid #edf0f8'
        }}>
          {/* Left: Filter label and month pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            maxWidth: 'calc(100% - 300px)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              fontWeight: '800',
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginRight: '2px',
              flexShrink: 0
            }}>
              <Calendar size={14} color="#059669" />
              <span>Filter Month:</span>
            </div>

            {/* All Months Pill */}
            <button
              type="button"
              onClick={() => setActivePeriod && setActivePeriod('all')}
              style={{
                padding: '5px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: isAllMonths ? '800' : '650',
                border: isAllMonths ? '1.5px solid #059669' : '1.5px solid #cbd5e1',
                backgroundColor: isAllMonths ? '#059669' : '#ffffff',
                color: isAllMonths ? '#ffffff' : '#475569',
                cursor: 'pointer',
                boxShadow: isAllMonths ? '0 2px 8px rgba(5, 150, 105, 0.3)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              <span>All months</span>
              <span style={{
                fontSize: '10px',
                fontWeight: '800',
                padding: '1px 5px',
                borderRadius: '10px',
                backgroundColor: isAllMonths ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                color: isAllMonths ? '#ffffff' : '#64748b'
              }}>
                {effectivePeriods.length}
              </span>
            </button>

            {/* Individual Month Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              maxWidth: '100%',
              paddingBottom: '2px'
            }}>
              {effectivePeriods.map(p => {
                const isSel = !isAllMonths && String(p.id) === String(activePeriod);
                const pCensus = hostelCensusMap[String(p.id)];
                const pExp = Number(pCensus?.expenses_occurred || 0);
                const pMatrixAmt = Number(effectiveMatrix?.grand_total?.amounts?.[p.id] ?? effectiveMatrix?.grand_total?.amounts?.[String(p.id)] ?? 0);
                const pAmt = pExp > 0 ? pExp : pMatrixAmt;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePeriod && setActivePeriod(String(p.id))}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: isSel ? '800' : '650',
                      border: isSel ? '1.5px solid #059669' : '1.5px solid #cbd5e1',
                      backgroundColor: isSel ? '#059669' : '#ffffff',
                      color: isSel ? '#ffffff' : '#475569',
                      cursor: 'pointer',
                      boxShadow: isSel ? '0 2px 8px rgba(5, 150, 105, 0.3)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{p.period_label || p.period_code}</span>
                    {pAmt > 0 && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        backgroundColor: isSel ? 'rgba(255,255,255,0.25)' : '#f8fafc',
                        color: isSel ? '#ffffff' : '#64748b'
                      }}>
                        {formatIndianCompact(pAmt)}
                      </span>
                    )}
                    {isSel && <Check size={11} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Active Viewing Indicator */}
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0
          }}>
            <span>Viewing:</span>
            <strong style={{
              color: '#0f172a',
              fontWeight: '800',
              padding: '3px 10px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              {isAllMonths
                ? `All Months (${effectivePeriods.length} Cycles • ${formatINR(allMonthsTotalSpend)})`
                : `${activePeriodObj?.period_label || 'Focus Month'} (${formatINR(Number(activeCensus?.expenses_occurred || 0) || Number(effectiveMatrix?.grand_total?.amounts?.[activePeriod] ?? effectiveMatrix?.grand_total?.amounts?.[String(activePeriod)] ?? 0))})`
              }
            </strong>
          </div>
        </div>
      </div>

      {/* VIEW SWITCHER TAB BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#ffffff',
        padding: '10px 14px',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'executive', label: 'Executive Overview', icon: LayoutDashboard, desc: 'Bento Cards & KPIs' },
            { id: 'census_ledger', label: 'Census & Analytics Ledger', icon: Table, desc: '38-Parameter Multi-Month Grid' },
            { id: 'spreadsheet_matrix', label: 'Master Spreadsheet & Matrix', icon: FileSpreadsheet, desc: 'Excel Matrix Data Sheet' },
            { id: 'all', label: 'All Views', icon: Layers, desc: 'Complete Stack' }
          ].map(tab => {
            const isActive = activeMainView === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMainView(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '12px',
                  border: isActive ? '1.5px solid #059669' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#ecfdf5' : '#f8fafc',
                  color: isActive ? '#065f46' : '#64748b',
                  fontSize: '13px',
                  fontWeight: isActive ? '800' : '650',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(5, 150, 105, 0.12)' : 'none'
                }}
              >
                <TabIcon size={16} color={isActive ? '#059669' : '#64748b'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '600', paddingRight: '8px' }}>
          Viewing Period: <strong style={{ color: '#059669', fontWeight: '800' }}>
            {isAllMonths ? `All Months (${effectivePeriods.length} Months Total)` : formatPeriodLabel(activePeriodObj)}
          </strong>
        </div>
      </div>

      {/* EXECUTIVE OVERVIEW (BENTO KPI CARDS + 3 CORE SECTIONS) */}
      {(activeMainView === 'executive' || activeMainView === 'all') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          {/* TOP: 12 EXECUTIVE SUMMARY KPI CARDS */}
          <HostelExecutiveKpis
            census={activeCensus}
            prevCensus={prevCensus}
            allCensusMap={hostelCensusMap}
            periods={effectivePeriods}
            isAllMonths={isAllMonths}
            activePeriodLabel={isAllMonths ? 'All Months (Cumulative Total)' : activePeriodObj?.period_label}
            budgetTrackingData={budgetTrackingData}
            activeMonthCol={activeMonthCol}
            allMonthsTotalSpend={allMonthsTotalSpend}
          />

          {/* 1. CAPACITY, OCCUPANCY & VACANCY (PRIMARY PRIORITY) */}
          <HostelCapacityOccupancySection
            census={activeCensus}
            prevCensus={prevCensus}
            allCensusMap={hostelCensusMap}
            periods={effectivePeriods}
            activePeriodId={isAllMonths ? 'all' : effectivePeriodId}
            onPeriodSelect={(pid) => setActivePeriod && setActivePeriod(String(pid))}
          />

          {/* 2. EXPENSES & BUDGET TRACKING */}
          <HostelExpensesBudgetSection
            census={activeCensus}
            computedMatrix={effectiveMatrix}
            categories={categories}
            periods={effectivePeriods}
            activePeriod={activePeriod}
            onExportReport={handleExportReport}
            remarksDraft={remarksDraft}
          />
        </div>
      )}

      {/* CENSUS & ANALYTICS LEDGER */}
      {(activeMainView === 'census_ledger' || activeMainView === 'all') && (
        <div style={{ width: '100%', marginTop: activeMainView === 'all' ? '20px' : 0 }}>
          <HostelDashboardCensusView
            computedMatrix={effectiveMatrix}
            activePeriodObj={activePeriodObj}
            periods={effectivePeriods}
            activePeriod={activePeriod}
          />
        </div>
      )}

      {/* MASTER SPREADSHEET & MATRIX */}
      {(activeMainView === 'spreadsheet_matrix' || activeMainView === 'all') && (
        <div style={{ width: '100%', marginTop: activeMainView === 'all' ? '20px' : 0 }}>
          <HostelDashboardDataTable
            periods={effectivePeriods}
            activePeriod={activePeriod}
            computedMatrix={effectiveMatrix}
          />
        </div>
      )}

      {/* DETAILED REPORTS MODAL */}
      <HostelReportsModal
        isOpen={reportsModalOpen}
        onClose={() => setReportsModalOpen(false)}
        census={activeCensus}
        allCensusMap={hostelCensusMap}
        periods={periods}
        categories={categories}
      />

    </div>
  );
}
