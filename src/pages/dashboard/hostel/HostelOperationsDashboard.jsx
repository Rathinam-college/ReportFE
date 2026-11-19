import React, { useState, useMemo } from 'react';
import { 
  Building2, BedDouble, Users, Wrench, DollarSign, Download, 
  ArrowRight, FileSpreadsheet, Calendar, ChevronDown, Check,
  Sparkles, FileText, Printer
} from 'lucide-react';
import { formatINR, formatPeriodLabel } from '../../../utils/formatters';
import HostelExecutiveKpis from './HostelExecutiveKpis';
import HostelCapacityOccupancySection from './HostelCapacityOccupancySection';
import HostelExpensesBudgetSection from './HostelExpensesBudgetSection';
import HostelReportsModal from './HostelReportsModal';

export default function HostelOperationsDashboard({
  computedMatrix = {},
  periods = [],
  categories = [],
  activePeriod = 'all',
  setActivePeriod,
  onOpenDataEntry,
  handleExportReport,
  remarksDraft = {}
}) {
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const hostelCensusMap = computedMatrix?.hostel_census || {};

  // Active Period identification
  const currentPeriodId = useMemo(() => {
    if (activePeriod && activePeriod !== 'all') {
      return String(activePeriod);
    }
    // Default to the first or latest recorded period
    if (periods.length > 0) {
      return String(periods[0].id);
    }
    return '29';
  }, [activePeriod, periods]);

  const activePeriodObj = useMemo(() => {
    return periods.find(p => String(p.id) === currentPeriodId) || periods[0] || {};
  }, [periods, currentPeriodId]);

  // Census data for active period
  const activeCensus = useMemo(() => {
    return hostelCensusMap[currentPeriodId] || (periods.length > 0 && hostelCensusMap[String(periods[0].id)]) || {};
  }, [hostelCensusMap, currentPeriodId, periods]);

  // Previous month census for delta and movement calculations
  const prevCensus = useMemo(() => {
    const activeIdx = periods.findIndex(p => String(p.id) === currentPeriodId);
    if (activeIdx > 0) {
      const prevId = String(periods[activeIdx - 1].id);
      return hostelCensusMap[prevId] || {};
    }
    return {};
  }, [periods, currentPeriodId, hostelCensusMap]);

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
              1. Beds & Occupancy • 2. Maintenance & Complaints • 3. Expenses & Budget • {periods.length} Months Recorded (Sep'25 – Sep'26)
            </p>
          </div>
        </div>

        {/* Right Actions & Period Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Cycle Dropdown */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <Calendar size={14} style={{ position: 'absolute', left: '10px', color: '#059669', pointerEvents: 'none' }} />
            <select
              value={currentPeriodId}
              onChange={(e) => setActivePeriod && setActivePeriod(e.target.value)}
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
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

      {/* TOP: 12 EXECUTIVE SUMMARY KPI CARDS */}
      <HostelExecutiveKpis
        census={activeCensus}
        prevCensus={prevCensus}
        activePeriodLabel={activePeriodObj?.period_label}
      />

      {/* ========================================================================= */}
      {/* 1. CAPACITY, OCCUPANCY & VACANCY (PRIMARY PRIORITY - TOP POSITION)       */}
      {/* ========================================================================= */}
      <HostelCapacityOccupancySection
        census={activeCensus}
        prevCensus={prevCensus}
        allCensusMap={hostelCensusMap}
        periods={periods}
        activePeriodId={currentPeriodId}
        onPeriodSelect={(pid) => setActivePeriod && setActivePeriod(String(pid))}
      />

      {/* ========================================================================= */}
      {/* 2. EXPENSES & BUDGET TRACKING                                             */}
      {/* ========================================================================= */}
      <HostelExpensesBudgetSection
        census={activeCensus}
        computedMatrix={computedMatrix}
        categories={categories}
        periods={periods}
        activePeriod={activePeriod}
        onExportReport={handleExportReport}
        remarksDraft={remarksDraft}
      />

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
