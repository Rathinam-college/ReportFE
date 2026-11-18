import React, { useState } from 'react';
import { formatINR } from '../../../utils/formatters';
import { 
  Save, RefreshCw, CheckCircle2, AlertCircle, Plus, Copy, Lock, Unlock,
  LayoutGrid, Table, Home, BedDouble, Users, Droplets, Wrench, ShieldCheck,
  Calculator, Zap, DollarSign, Activity, Sparkles, Check
} from 'lucide-react';

export default function HostelCardSpreadsheet({
  periods = [],
  editingPeriodId,
  setEditingPeriodId,
  activePeriodObj,
  isClosed,
  // Draft Data & Handlers
  currData = {},
  metrics = {},
  handleValChange,
  handleSaveMonth,
  isSaving,
  localMessage,
  handleCloneFromPreviousMonth,
  handleToggleLock,
  // Custom parameters from master data
  parameters = [],
  // View Switcher
  viewMode = 'cards',
  setViewMode
}) {
  const [focusedKey, setFocusedKey] = useState(null);

  const currPeriodIdStr = String(editingPeriodId);
  const activePeriod = periods.find(p => String(p.id) === currPeriodIdStr) || activePeriodObj || periods[0];
  const activePeriodLabel = activePeriod?.period_label || 'Focus Month';

  // Helper for numeric inputs with live state updating
  const renderNumericInput = (fieldKey, placeholder = '0', unit = '', disabled = false) => {
    const val = currData[fieldKey] ?? '';
    const isFocused = focusedKey === fieldKey;

    return (
      <div style={{ position: 'relative', width: '130px' }}>
        <input
          type="number"
          step="any"
          value={val === 0 || val === '0' ? '' : val}
          placeholder={placeholder}
          disabled={disabled || isClosed}
          onFocus={() => setFocusedKey(fieldKey)}
          onBlur={() => setFocusedKey(null)}
          onChange={(e) => handleValChange(fieldKey, e.target.value)}
          style={{
            width: '100%',
            textAlign: 'right',
            fontSize: '13px',
            fontWeight: '700',
            fontVariantNumeric: 'tabular-nums',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '6px 10px',
            borderRadius: '10px',
            border: isFocused ? '2px solid #0aa0e8' : '1px solid var(--border-card, #e3e8f3)',
            backgroundColor: disabled ? '#f8fafc' : 'var(--bg-card, #ffffff)',
            color: disabled ? '#64748b' : 'var(--text-main, #12182b)',
            opacity: isClosed ? 0.55 : 1,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'all 0.15s ease'
          }}
        />
        {unit && (
          <span style={{ position: 'absolute', right: '-24px', top: '7px', fontSize: '10.5px', color: '#94a3b8' }}>
            {unit}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className="hostel-card-spreadsheet-container"
      style={{
        backgroundColor: 'var(--bg-page, #f3f6fb)',
        color: 'var(--text-main, #12182b)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
      {/* FLOATING SUCCESS / ERROR TOAST NOTIFICATION */}
      {localMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            backgroundColor: localMessage.type === 'success' ? '#10b981' : '#ef4444',
            color: '#ffffff',
            padding: '10px 22px',
            borderRadius: '9999px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '0.01em',
            animation: 'fadeInSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {localMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{localMessage.text}</span>
        </div>
      )}

      {/* 1. HEADER BANNER */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0aa0e8 0%, #0670c9 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(10, 160, 232, 0.22)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Hostel Operations & Census Master Spreadsheet
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '800',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)'
              }}
            >
              Editable Cards
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.9)', margin: '4px 0 0 0' }}>
            Editable cards · edit resident census, utilities & maintenance · direct DB save
          </p>
        </div>

        {/* Action Buttons: Save Month Data & Clone */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {handleCloneFromPreviousMonth && (
            <button
              type="button"
              onClick={handleCloneFromPreviousMonth}
              disabled={isClosed}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: '1.5px solid rgba(255, 255, 255, 0.5)',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: isClosed ? 'not-allowed' : 'pointer',
                backdropFilter: 'blur(4px)',
                opacity: isClosed ? 0.5 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              <Copy size={14} />
              <span>Clone from Prev</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveMonth}
            disabled={isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 22px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              color: '#0670c9',
              border: 'none',
              fontSize: '13px',
              fontWeight: '800',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.18s ease'
            }}
          >
            {isSaving ? (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Save size={14} color="#0670c9" />
            )}
            <span>Save Month Data to DB</span>
          </button>
        </div>
      </div>

      {/* 2. TOOLBAR ROW: Month Pills, Lock Month & View Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '4px 2px'
        }}
      >
        {/* Month Pills (Horizontally Scrollable) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            maxWidth: '100%',
            scrollbarWidth: 'none'
          }}
        >
          {periods.map((p) => {
            const isSel = String(p.id) === currPeriodIdStr;
            const pLocked = !!p.is_closed;

            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={isSel}
                onClick={() => setEditingPeriodId(p.id)}
                style={{
                  padding: '7px 18px',
                  borderRadius: '9999px',
                  fontSize: '12.5px',
                  fontWeight: isSel ? '800' : '600',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isSel ? '#0aa0e8' : 'var(--bg-pill, #e9eefb)',
                  color: isSel ? '#ffffff' : 'var(--text-muted, #66708f)',
                  boxShadow: isSel ? '0 4px 12px rgba(10, 160, 232, 0.35)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease'
                }}
              >
                <span>{p.period_label || p.period_code}</span>
                {isSel && <span style={{ fontSize: '11px', color: '#ffffff' }}>★</span>}
                {pLocked && <Lock size={12} color={isSel ? '#ffffff' : '#e11d48'} />}
              </button>
            );
          })}
        </div>

        {/* Right Controls: View Toggle and Lock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* View Mode Switcher Pill */}
          {setViewMode && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-pill, #e9eefb)',
                padding: '2px',
                borderRadius: '9999px',
                border: '1px solid var(--border-card, #e3e8f3)'
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'cards' ? '#0aa0e8' : 'transparent',
                  color: viewMode === 'cards' ? '#ffffff' : 'var(--text-muted, #66708f)',
                  fontSize: '11.5px',
                  fontWeight: viewMode === 'cards' ? '800' : '500',
                  boxShadow: viewMode === 'cards' ? '0 2px 6px rgba(10, 160, 232, 0.25)' : 'none'
                }}
              >
                <LayoutGrid size={12} />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('sheet')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'sheet' ? '#0aa0e8' : 'transparent',
                  color: viewMode === 'sheet' ? '#ffffff' : 'var(--text-muted, #66708f)',
                  fontSize: '11.5px',
                  fontWeight: viewMode === 'sheet' ? '800' : '500',
                  boxShadow: viewMode === 'sheet' ? '0 2px 6px rgba(10, 160, 232, 0.25)' : 'none'
                }}
              >
                <Table size={12} />
                <span>Grid</span>
              </button>
            </div>
          )}

          {handleToggleLock && (
            <button
              type="button"
              onClick={handleToggleLock}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: isClosed ? '#fff1f2' : 'var(--bg-card, #ffffff)',
                border: `1px solid ${isClosed ? '#fecdd3' : 'var(--border-card, #e3e8f3)'}`,
                color: isClosed ? '#e11d48' : 'var(--text-main, #12182b)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              {isClosed ? <Unlock size={13} color="#e11d48" /> : <Lock size={13} color="#0aa0e8" />}
              <span>{isClosed ? 'Unlock Month' : 'Lock Month'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. FORMULA BAR: Monospace strip with fx formula definitions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-card, #e3e8f3)',
          borderRadius: '12px',
          overflowX: 'auto',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: '900',
            fontSize: '13px',
            color: '#0aa0e8',
            backgroundColor: 'rgba(10, 160, 232, 0.1)',
            padding: '2px 8px',
            borderRadius: '6px'
          }}
        >
          ƒx
        </span>
        <div
          style={{
            fontFamily: "'SF Mono', Consolas, Menlo, Monaco, monospace",
            fontSize: '11.5px',
            color: 'var(--text-muted, #66708f)',
            whiteSpace: 'nowrap',
            flex: 1
          }}
        >
          <strong style={{ color: 'var(--text-main, #12182b)' }}>Total Occupied:</strong> =Students + Staff &nbsp;|&nbsp; 
          <strong style={{ color: 'var(--text-main, #12182b)' }}>Vacant Beds:</strong> =Bed Capacity - Total Occupied &nbsp;|&nbsp; 
          <strong style={{ color: 'var(--text-main, #12182b)' }}>Total Expenses:</strong> =Power + Water + Maintenance &nbsp;|&nbsp; 
          <strong style={{ color: 'var(--text-main, #12182b)' }}>Per Student Cost:</strong> Total Expenses / Total Students
        </div>
      </div>

      {/* 4. CATEGORY CARDS GRID: CSS grid repeat(auto-fill, minmax(340px, 1fr)), 14px gap */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '14px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* CARD 1: BED CAPACITY & ALLOCATION (Amber) */}
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '18px',
            border: '1px solid var(--border-card, #e3e8f3)',
            borderTop: '5px solid #f59e0b',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-card, #e3e8f3)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-main, #12182b)' }}>
                Bed Capacity & Occupancy
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)' }}>
                {metrics.occupied_pct}% Occupancy Rate · {metrics.vacant_total} Vacant Beds
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main, #12182b)' }}>
                {metrics.total_occupied}
              </div>
              <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700' }}>
                of {metrics.bed_capacity_total} Beds
              </div>
            </div>
          </div>

          {/* Line items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Bed Capacity (Boys)</span>
              {renderNumericInput('bed_capacity_boys', '0')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Bed Capacity (Girls)</span>
              {renderNumericInput('bed_capacity_girls', '0')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#b45309' }}>Total Bed Capacity</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#b45309' }}>{metrics.bed_capacity_total} Beds</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Vacant College Beds</span>
              {renderNumericInput('vacant_college_boys', 'Boys', '', false)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Vacant Sports Beds</span>
              {renderNumericInput('vacant_sports_boys', 'Boys', '', false)}
            </div>
          </div>
        </div>

        {/* CARD 2: RESIDENTS & DINERS HEADCOUNT (Blue) */}
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '18px',
            border: '1px solid var(--border-card, #e3e8f3)',
            borderTop: '5px solid #0aa0e8',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-card, #e3e8f3)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-main, #12182b)' }}>
                Residents Census & Headcount
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)' }}>
                Campus Students & Staff Residents
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0aa0e8' }}>
                {metrics.students_total}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)', fontWeight: '600' }}>
                Students ({metrics.staff_total} Staff)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Students (Boys)</span>
              {renderNumericInput('students_boys', '0')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Students (Girls)</span>
              {renderNumericInput('students_girls', '0')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Staff Residents (Boys)</span>
              {renderNumericInput('staff_boys', '0')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Staff Residents (Girls)</span>
              {renderNumericInput('staff_girls', '0')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Students Vacated</span>
              {renderNumericInput('students_vacated', '0')}
            </div>
          </div>
        </div>

        {/* CARD 3: UTILITIES & OPERATIONAL EXPENSES (Green) */}
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '18px',
            border: '1px solid var(--border-card, #e3e8f3)',
            borderTop: '5px solid #10b981',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-card, #e3e8f3)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-main, #12182b)' }}>
                Utilities & Operational Spend
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)' }}>
                Power, Water & Maintenance
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>
                {formatINR(metrics.expenses_occurred)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)', fontWeight: '600' }}>
                Total Occurred
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Power Cost (₹)</span>
              {renderNumericInput('power_cost', '0.00')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Power Consumption (Units)</span>
              {renderNumericInput('power_units', 'Units')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Water Purchase Cost (₹)</span>
              {renderNumericInput('water_purchase_cost', '0.00')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Maintenance Expenses (₹)</span>
              {renderNumericInput('maintenance_expenses', '0.00')}
            </div>
          </div>
        </div>

        {/* CARD 4: MAINTENANCE & QUALITY TICKETS (Orange) */}
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '18px',
            border: '1px solid var(--border-card, #e3e8f3)',
            borderTop: '5px solid #f97316',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-card, #e3e8f3)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-main, #12182b)' }}>
                Service Tickets & Quality
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)' }}>
                Resolution Speed & Incidents
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: metrics.tickets_open > 0 ? '#f97316' : '#10b981' }}>
                {metrics.tickets_open} Open
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)', fontWeight: '600' }}>
                {metrics.tickets_closed} of {metrics.tickets_received} Closed
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Tickets Received</span>
              {renderNumericInput('tickets_received', '0')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Tickets Closed</span>
              {renderNumericInput('tickets_closed', '0')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Total Hours to Close</span>
              {renderNumericInput('total_hours_close', 'Hours')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Incidents Count</span>
              {renderNumericInput('incidents_count', '0')}
            </div>
          </div>
        </div>

        {/* CARD 5: BUDGET & FINANCIAL BALANCE (Slate) */}
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '18px',
            border: '1px solid var(--border-card, #e3e8f3)',
            borderTop: '5px solid #64748b',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-card, #e3e8f3)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-main, #12182b)' }}>
                Operating Budget & Balance
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)' }}>
                Approved Budget vs Actual Spend
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: metrics.balance >= 0 ? '#10b981' : '#ef4444' }}>
                {formatINR(metrics.balance)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)', fontWeight: '600' }}>
                Available Balance
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Approved Budget (₹)</span>
              {renderNumericInput('approved_budget', '0.00')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Cumulative Spent (₹)</span>
              {renderNumericInput('cumulative_budget_spent', '0.00')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Campus Sq Feet</span>
              {renderNumericInput('sq_feet', 'Sq Ft')}
            </div>
          </div>
        </div>

        {/* CARD 6: COST PER STUDENT & UNIT ECONOMICS (Indigo Formula Card) */}
        <div
          style={{
            backgroundColor: '#1e1b4b',
            color: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #312e81',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 8px 24px rgba(49, 46, 129, 0.25)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc' }}>
                <Calculator size={17} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                  Per Student Cost
                </h3>
                <span style={{ fontSize: '11px', color: '#c7d2fe' }}>
                  Unit Economic Metric
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: '10.5px',
                fontWeight: '800',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: '#4338ca',
                color: '#e0e7ff',
                border: '1px solid #6366f1',
                letterSpacing: '0.04em'
              }}
            >
              ƒx FORMULA
            </span>
          </div>

          <div>
            <div style={{ fontSize: '30px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>
              {formatINR(metrics.per_student_cost_month)} <span style={{ fontSize: '14px', fontWeight: '600', color: '#c7d2fe' }}>/ month</span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#a5b4fc', marginTop: '4px' }}>
              ₹{metrics.per_student_cost_day} / Day · {metrics.sq_feet_per_occupant} Sqft / Occupant
            </div>
          </div>

          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              padding: '8px 12px',
              borderRadius: '8px',
              color: '#e0e7ff',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            Formula: =Total Expenses Occurred / Total Students
          </div>
        </div>
      </div>

      {/* 5. STICKY BOTTOM BAR */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 100,
          backgroundColor: '#0b1f2e',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '16px 24px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.25)',
          marginTop: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Total Hostel Expenses · {activePeriodLabel}:
          </span>
          <span style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>
            {formatINR(metrics.expenses_occurred)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#94a3b8' }}>
            Campus Residential Census:
          </span>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8' }}>
            {metrics.total_occupied} Residents ({metrics.occupied_pct}% Occ)
          </span>
        </div>
      </div>
    </div>
  );
}
