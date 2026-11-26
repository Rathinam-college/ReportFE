import React from 'react';
import { Download, Table, ChevronDown, Maximize2, Minimize2, Calendar, Coins } from 'lucide-react';

export default function MonthlyExpenseControls({
  chartModel,
  setChartModel,
  modelOptions = [],
  reportingCycle,
  setReportingCycle,
  cycleOptions = [],
  unitMode,
  setUnitMode,
  onExportCSV,
  showTable,
  setShowTable,
  isFullScreen = false,
  onToggleFullScreen,
  hideCycleFilter = false
}) {
  return (
    <div
      style={{
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
        flexShrink: 0
      }}
    >
      {/* 1. Reporting Cycle Select (hidden when top bar handles all month filtering) */}
      {!hideCycleFilter && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: '800',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Calendar size={11} color="#6366f1" />
          SELECT MONTH
        </span>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <select
            value={reportingCycle}
            onChange={(e) => setReportingCycle(e.target.value)}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '9px',
              padding: '7px 32px 7px 12px',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            {cycleOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '10px',
              pointerEvents: 'none',
              color: '#64748b'
            }}
          />
        </div>
      </div>
      )}

      {/* 2. Segmented Unit Toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: '800',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Coins size={11} color="#6366f1" />
          FORMAT
        </span>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#e2e8f0',
            borderRadius: '9px',
            padding: '2px',
            gap: '2px',
            border: '1px solid #cbd5e1'
          }}
        >
          <button
            type="button"
            onClick={() => setUnitMode('full')}
            style={{
              border: 'none',
              outline: 'none',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: unitMode === 'full' ? '700' : '600',
              borderRadius: '7px',
              cursor: 'pointer',
              backgroundColor: unitMode === 'full' ? '#ffffff' : 'transparent',
              color: unitMode === 'full' ? '#4f46e5' : '#475569',
              boxShadow: unitMode === 'full' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            ₹ Full INR
          </button>
          <button
            type="button"
            onClick={() => setUnitMode('lakhs')}
            style={{
              border: 'none',
              outline: 'none',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: unitMode === 'lakhs' ? '700' : '600',
              borderRadius: '7px',
              cursor: 'pointer',
              backgroundColor: unitMode === 'lakhs' ? '#ffffff' : 'transparent',
              color: unitMode === 'lakhs' ? '#4f46e5' : '#475569',
              boxShadow: unitMode === 'lakhs' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            ₹ in Lakhs
          </button>
        </div>
      </div>

      {/* Flexible Spacer */}
      <div style={{ flex: 1, minWidth: '8px' }} />

      {/* Actions Group */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* 3. Export CSV Button */}
        <button
          type="button"
          onClick={onExportCSV}
          title="Export CSV Data"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '9px',
            padding: '7px 13px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#334155',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.borderColor = '#94a3b8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
        >
          <Download size={14} color="#6366f1" />
          <span>Export CSV</span>
        </button>

        {/* 4. Hide / Show Values Table Button */}
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          title={showTable ? 'Hide numerical data values table' : 'Show numerical data values table'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: showTable ? '#eef2ff' : '#ffffff',
            border: showTable ? '1px solid #a5b4fc' : '1px solid #cbd5e1',
            borderRadius: '9px',
            padding: '7px 13px',
            fontSize: '12px',
            fontWeight: '700',
            color: showTable ? '#4338ca' : '#475569',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!showTable) {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
            }
          }}
          onMouseLeave={(e) => {
            if (!showTable) {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }
          }}
        >
          <Table size={14} color={showTable ? '#4338ca' : '#64748b'} />
          <span>{showTable ? 'Hide Values Table' : 'Show Values Table'}</span>
        </button>

        {/* 5. Fullscreen Maximize / Exit Button */}
        {onToggleFullScreen && (
          <button
            type="button"
            onClick={onToggleFullScreen}
            title={isFullScreen ? 'Exit Full Screen Mode (Esc)' : 'Maximize Visual Chart to Full Screen'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isFullScreen ? '#4f46e5' : '#ffffff',
              border: isFullScreen ? '1px solid #4338ca' : '1px solid #c7d2fe',
              borderRadius: '9px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: '700',
              color: isFullScreen ? '#ffffff' : '#4f46e5',
              cursor: 'pointer',
              boxShadow: isFullScreen ? '0 4px 12px rgba(79, 70, 229, 0.35)' : '0 1px 2px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (isFullScreen) {
                e.currentTarget.style.backgroundColor = '#4338ca';
              } else {
                e.currentTarget.style.backgroundColor = '#eef2ff';
                e.currentTarget.style.borderColor = '#818cf8';
              }
            }}
            onMouseLeave={(e) => {
              if (isFullScreen) {
                e.currentTarget.style.backgroundColor = '#4f46e5';
              } else {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#c7d2fe';
              }
            }}
          >
            {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullScreen ? 'Exit Full Screen' : 'Maximize Chart'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
