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
import HostelPowerWaterSection from './HostelPowerWaterSection';
import HostelReportsModal from './HostelReportsModal';
import HostelDashboardCensusView from '../HostelDashboardCensusView';
import HostelDashboardDataTable from '../HostelDashboardDataTable';
import MonthlyAttachmentsModal from '../../../components/attachments/MonthlyAttachmentsModal';
import MonthlyAttachmentsDashboardSection from '../../../components/attachments/MonthlyAttachmentsDashboardSection';

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
  const [activeMainView, setActiveMainView] = useState('all'); // 'executive' | 'census_ledger' | 'spreadsheet_matrix' | 'all'
  const [residentFilter, setResidentFilter] = useState('all'); // 'all' | 'boys' | 'girls' | 'college' | 'school' | 'sports' | 'staff'
  const [budgetMonthFilter, setBudgetMonthFilter] = useState('all'); // 'all' | 'recorded'
  const [budgetViewMode, setBudgetViewMode] = useState('all'); // 'all' | 'both' | 'cards' | 'matrix' | 'distribution'
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
    : (localHostelMatrix || (computedMatrix?.module === 'hostel' ? computedMatrix : {}));

  const effectivePeriods = (effectiveMatrix?.periods && effectiveMatrix.periods.length > 0)
    ? effectiveMatrix.periods
    : (computedMatrix?.module === 'hostel' ? (computedMatrix?.periods || []) : []);

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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-canvas, #F3F5FA)' }}>
      {/* ========================================================================= */}
      {/* STICKY TOP FILTER BAR (WHITE, BOTTOM BORDER, SOFT SHADOW, 3 ROWS)         */}
      {/* ========================================================================= */}
      <div
        className="sticky-hostel-view-command-bar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 85,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #E1E6F2',
          padding: '16px 28px',
          boxShadow: '0 4px 16px rgba(20, 36, 92, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* ROW 1: Title + green "Hostel" badge, Hostel Reports, Download Report (outline) & Open Data Entry (gold) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{
              fontSize: '21px',
              fontWeight: '800',
              color: 'var(--primary, #14245C)',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              Hostel Operations Dashboard
            </h1>
            <span style={{
              fontSize: '11.5px',
              fontWeight: '800',
              padding: '3px 11px',
              borderRadius: '9999px',
              backgroundColor: '#E4F6EC',
              color: '#0F6B3A',
              border: '1px solid #b7e8cc'
            }}>
              Hostel
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setReportsModalOpen(true)}
              style={{
                minHeight: '38px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 15px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #CBD5E1',
                color: 'var(--primary, #14245C)',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <FileText size={14} />
              <span>Hostel Reports</span>
            </button>

            <button
              type="button"
              onClick={handleExportReport}
              style={{
                minHeight: '38px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 15px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #CBD5E1',
                color: 'var(--primary, #14245C)',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Download Report</span>
            </button>

            {onOpenDataEntry && (
              <button
                type="button"
                onClick={() => {
                  const targetPeriodId = activePeriod !== 'all' ? Number(activePeriod) : null;
                  onOpenDataEntry(targetPeriodId);
                }}
                style={{
                  minHeight: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent, #F5A524)',
                  color: 'var(--primary, #14245C)',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(245, 165, 36, 0.28)'
                }}
              >
                <span>Open Data Entry</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ROW 3: MONTH chips (All months, Sep'25 to Sep'26) + BUDGET toggles */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '6px',
          borderTop: '1px solid #F1F5F9'
        }}>
          {/* MONTH chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '2px' }}>
              MONTH
            </span>
            <button
              type="button"
              onClick={() => setActivePeriod && setActivePeriod('all')}
              style={{
                minHeight: '34px',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                border: isAllMonths ? '1px solid var(--primary, #14245C)' : '1px solid #E1E6F2',
                backgroundColor: isAllMonths ? 'var(--primary, #14245C)' : '#ffffff',
                color: isAllMonths ? '#ffffff' : '#475569',
                cursor: 'pointer'
              }}
            >
              All months
            </button>
            {effectivePeriods.map(p => {
              const isSel = !isAllMonths && String(p.id) === String(activePeriod);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePeriod && setActivePeriod(String(p.id))}
                  style={{
                    minHeight: '34px',
                    padding: '5px 11px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: isSel ? '700' : '600',
                    border: isSel ? '1px solid var(--primary, #14245C)' : '1px solid #E1E6F2',
                    backgroundColor: isSel ? 'var(--primary, #14245C)' : '#ffffff',
                    color: isSel ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {p.period_label || p.period_code}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA ON var(--bg-canvas, #F3F5FA) CANVAS (28px padding, 28px gap) */}
      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', boxSizing: 'border-box' }}>
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
            movementFilter={residentFilter}
            onMovementFilterChange={setResidentFilter}
            hideMovementFilter={true}
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
            monthFilter={budgetMonthFilter}
            onMonthFilterChange={setBudgetMonthFilter}
            trackingViewMode={budgetViewMode}
            onTrackingViewModeChange={setBudgetViewMode}
            hideTopToggles={true}
          />

          {/* 2A. POWER & WATER CONSUMPTION CARD + MONTH-BY-MONTH / SINGLE-MONTH MODAL */}
          <HostelPowerWaterSection
            census={activeCensus}
            allCensusMap={hostelCensusMap}
            periods={effectivePeriods}
            isAllMonths={isAllMonths}
            activePeriodObj={activePeriodObj}
          />

          {/* 2B. MONTHLY SUPPORTING ATTACHMENTS, PRESENTATIONS & BILLS FOR ACTIVE MONTH */}
          <div style={{ marginTop: '20px' }}>
            <MonthlyAttachmentsDashboardSection
              module="hostel"
              periodId={isAllMonths ? 'all' : (activePeriodObj?.id || activePeriod)}
              periodLabel={isAllMonths ? 'All Months' : (activePeriodObj?.period_label || "Oct'25")}
              periods={effectivePeriods}
              currentUser={null}
              onRefresh={onRefreshAttachments}
            />
          </div>
        </div>
      )}

      </div>

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
