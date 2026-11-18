import React from 'react';
import { Download, Table, ChevronDown } from 'lucide-react';

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
  setShowTable
}) {
  return (
    <div
      style={{
        backgroundColor: '#eef1fb',
        borderRadius: '16px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        border: '1px solid #e4e8f5'
      }}
    >
      {/* 1. Chart Model Select */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: '800',
            color: '#6a7392',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}
        >
          CHART MODEL
        </span>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <select
            value={chartModel}
            onChange={(e) => setChartModel(e.target.value)}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #d5dcf0',
              borderRadius: '9px',
              padding: '7px 30px 7px 12px',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#141a33',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              boxShadow: '0 1px 2px rgba(20,26,51,0.04)'
            }}
          >
            {modelOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '10px',
              pointerEvents: 'none',
              color: '#6a7392'
            }}
          />
        </div>
      </div>

      {/* 2. Reporting Cycle Select */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: '800',
            color: '#6a7392',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}
        >
          REPORTING CYCLE
        </span>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <select
            value={reportingCycle}
            onChange={(e) => setReportingCycle(e.target.value)}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #d5dcf0',
              borderRadius: '9px',
              padding: '7px 30px 7px 12px',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#141a33',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              boxShadow: '0 1px 2px rgba(20,26,51,0.04)'
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
              color: '#6a7392'
            }}
          />
        </div>
      </div>

      {/* Flexible Spacer */}
      <div style={{ flex: 1, minWidth: '8px' }} />

      {/* 3. Segmented Unit Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#e1e7f6',
          borderRadius: '9px',
          padding: '3px',
          gap: '2px'
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
            color: unitMode === 'full' ? '#5b5bf0' : '#475569',
            boxShadow: unitMode === 'full' ? '0 1px 3px rgba(20,26,51,0.08)' : 'none',
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
            color: unitMode === 'lakhs' ? '#5b5bf0' : '#475569',
            boxShadow: unitMode === 'lakhs' ? '0 1px 3px rgba(20,26,51,0.08)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          ₹ in Lakhs
        </button>
      </div>

      {/* 4. Export CSV Button */}
      <button
        type="button"
        onClick={onExportCSV}
        title="Export CSV"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#ffffff',
          border: '1px solid #d5dcf0',
          borderRadius: '9px',
          padding: '6px 13px',
          fontSize: '12px',
          fontWeight: '700',
          color: '#141a33',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(20,26,51,0.04)',
          transition: 'all 0.15s ease'
        }}
      >
        <Download size={14} color="#5b5bf0" />
        <span>Export CSV</span>
      </button>

      {/* 5. Hide / Show Values Table Button */}
      <button
        type="button"
        onClick={() => setShowTable(!showTable)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: showTable ? '#5b5bf0' : '#ffffff',
          border: '1px solid #5b5bf0',
          borderRadius: '9px',
          padding: '6px 13px',
          fontSize: '12px',
          fontWeight: '700',
          color: showTable ? '#ffffff' : '#5b5bf0',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(20,26,51,0.04)',
          transition: 'all 0.15s ease'
        }}
      >
        <Table size={14} />
        <span>{showTable ? 'Hide Values Table' : 'Show Values Table'}</span>
      </button>
    </div>
  );
}
