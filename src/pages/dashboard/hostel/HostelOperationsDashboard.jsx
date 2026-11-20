import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, BedDouble, Users, Wrench, DollarSign, Download, 
  ArrowRight, FileSpreadsheet, Calendar, ChevronDown, Check,
  Sparkles, FileText, Printer, Paperclip, LayoutDashboard, Table, Layers
} from 'lucide-react';
import { formatINR, formatPeriodLabel } from '../../../utils/formatters';
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
  const hostelCensusMap = computedMatrix?.hostel_census || {};

  useEffect(() => {
    if (computedMatrix?.hostel_budget_tracking && computedMatrix.hostel_budget_tracking.length > 0) {
      setBudgetTrackingData(computedMatrix.hostel_budget_tracking);
    } else {
      fetch('/api/hostel/budget-tracking')
        .then(res => res.json())
        .then(d => {
          if (d?.items) setBudgetTrackingData(d.items);
        })
        .catch(err => console.warn('Budget tracking notice:', err));
    }
  }, [computedMatrix?.hostel_budget_tracking]);

  // Whether "All Months" is active
  const isAllMonths = activePeriod === 'all';

  // Effective period for single-month snapshot metrics (defaults to recorded month with live expenses e.g. Oct'26)
  const effectivePeriodId = useMemo(() => {
    if (activePeriod && activePeriod !== 'all') {
      return String(activePeriod);
    }
    // Default to the recorded period with live expenses or period 30 (Oct)
    if (periods.length > 0) {
      const withExpenses = periods.find(p => {
        const c = hostelCensusMap[String(p.id)];
        return c && Number(c.expenses_occurred || 0) > 0;
      });
      if (withExpenses) return String(withExpenses.id);

      const oct = periods.find(p => String(p.id) === '30' || (p.period_label || '').toLowerCase().includes('oct'));
      if (oct) return String(oct.id);

      return String(periods[0].id);
    }
    return '30';
  }, [activePeriod, periods, hostelCensusMap]);

  const activePeriodObj = useMemo(() => {
    return periods.find(p => String(p.id) === effectivePeriodId) || periods[0] || {};
  }, [periods, effectivePeriodId]);

  const activeMonthCol = useMemo(() => {
    return getBudgetMonthCol(activePeriodObj, effectivePeriodId);
  }, [activePeriodObj, effectivePeriodId]);

  // Census data for active period / snapshot
  const activeCensus = useMemo(() => {
    return hostelCensusMap[effectivePeriodId] || (periods.length > 0 && hostelCensusMap[String(periods[0].id)]) || {};
  }, [hostelCensusMap, effectivePeriodId, periods]);

  // Previous month census for delta and movement calculations
  const prevCensus = useMemo(() => {
    const activeIdx = periods.findIndex(p => String(p.id) === effectivePeriodId);
    if (activeIdx > 0) {
      const prevId = String(periods[activeIdx - 1].id);
      return hostelCensusMap[prevId] || {};
    }
    return {};
  }, [periods, effectivePeriodId, hostelCensusMap]);

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
      
      {/* TOP HEADER & CONTROLS */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #e2e8f0',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
      }}>
        {/* Left Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
            flexShrink: 0
          }}>
            <Building2 size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Hostel Operations Dashboard
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0'
              }}>
                Hostel Details
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              1. Beds & Occupancy • 2. Expenses & Budget Tracking • {periods.length} Months Recorded (Sep'25 – Sep'26)
            </p>
          </div>
        </div>

        {/* Right Actions & Period Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Cycle Dropdown */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <Calendar size={14} style={{ position: 'absolute', left: '10px', color: '#059669', pointerEvents: 'none' }} />
            <select
              value={activePeriod || 'all'}
              onChange={(e) => setActivePeriod && setActivePeriod(e.target.value)}
              style={{
                backgroundColor: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                padding: '8px 30px 8px 30px',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
              }}
            >
              <option value="all">
                All Months (Total Cumulative)
              </option>
              {periods.map(p => (
                <option key={p.id} value={String(p.id)}>
                  {formatPeriodLabel(p)} • {p.period_label || p.period_code}
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', color: '#64748b', pointerEvents: 'none' }} />
          </div>

          {/* Detailed Reports Modal Button */}
          <button
            type="button"
            onClick={() => setReportsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #059669',
              color: '#059669',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(5, 150, 105, 0.08)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ecfdf5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <FileText size={15} color="#059669" />
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
              padding: '9px 18px',
              borderRadius: '9999px',
              backgroundColor: '#059669',
              border: 'none',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047857'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          >
            <Download size={14} />
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
                padding: '9px 20px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #ff7e9e 0%, #ff4b72 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255, 96, 136, 0.35)',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span>Open Data Entry</span>
              <ArrowRight size={14} />
            </button>
          )}
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
            {isAllMonths ? `All Months (${periods.length} Months Total)` : formatPeriodLabel(activePeriodObj)}
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
            periods={periods}
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
            periods={periods}
            activePeriodId={isAllMonths ? 'all' : effectivePeriodId}
            onPeriodSelect={(pid) => setActivePeriod && setActivePeriod(String(pid))}
          />

          {/* 2. EXPENSES & BUDGET TRACKING */}
          <HostelExpensesBudgetSection
            census={activeCensus}
            computedMatrix={computedMatrix}
            categories={categories}
            periods={periods}
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
            computedMatrix={computedMatrix}
            activePeriodObj={activePeriodObj}
            periods={periods}
            activePeriod={activePeriod}
          />
        </div>
      )}

      {/* MASTER SPREADSHEET & MATRIX */}
      {(activeMainView === 'spreadsheet_matrix' || activeMainView === 'all') && (
        <div style={{ width: '100%', marginTop: activeMainView === 'all' ? '20px' : 0 }}>
          <HostelDashboardDataTable
            periods={periods}
            activePeriod={activePeriod}
            computedMatrix={computedMatrix}
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
