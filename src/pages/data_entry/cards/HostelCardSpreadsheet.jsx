import React, { useState } from 'react';
import { formatINR } from '../../../utils/formatters';
import { 
  Save, RefreshCw, CheckCircle2, AlertCircle, Plus, Copy, Lock, Unlock,
  LayoutGrid, Table, Home, BedDouble, Users, Droplets, Wrench, ShieldCheck,
  Calculator, Zap, DollarSign, Activity, Sparkles, Check,
  FileText, Receipt, Calendar, Shirt, RotateCcw
} from 'lucide-react';
import { 
  HOSTEL_BUDGET_HEADS, 
  TOTAL_SANCTIONED_BUDGET, 
  TOTAL_MONTH_LIMIT 
} from '../../../utils/hostelBudgetConstants';

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

  // Helper for 9 Budget Heads input with currency prefix and DB/default fallback
  const renderBudgetHeadInput = (head) => {
    const userVal = currData[head.key];
    const breakdownVal = metrics.budget_heads_breakdown?.[head.key];

    // Priority: draft edit value > computed breakdown fallback > empty
    const val = userVal !== undefined && userVal !== null
      ? userVal
      : (breakdownVal !== undefined && breakdownVal !== null ? breakdownVal : '');

    const isFocused = focusedKey === head.key;

    return (
      <div style={{ position: 'relative', width: '145px' }}>
        <span
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            fontWeight: '700',
            color: '#94a3b8',
            pointerEvents: 'none'
          }}
        >
          ₹
        </span>
        <input
          type="number"
          step="any"
          value={val}
          placeholder="0"
          disabled={isClosed}
          onFocus={() => setFocusedKey(head.key)}
          onBlur={() => setFocusedKey(null)}
          onChange={(e) => handleValChange(head.key, e.target.value)}
          style={{
            width: '100%',
            textAlign: 'right',
            fontSize: '13px',
            fontWeight: '750',
            fontVariantNumeric: 'tabular-nums',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '7px 10px 7px 24px',
            borderRadius: '9px',
            border: isFocused ? '2px solid #0284c7' : '1px solid #cbd5e1',
            backgroundColor: isClosed ? '#f8fafc' : '#ffffff',
            color: '#0f172a',
            outline: 'none',
            boxSizing: 'border-box',
            boxShadow: isFocused ? '0 0 0 3px rgba(2, 132, 199, 0.15)' : 'none',
            transition: 'all 0.15s ease'
          }}
        />
      </div>
    );
  };

  const getBudgetHeadIcon = (s_no) => {
    switch (s_no) {
      case 1: return <Home size={15} color="#0284c7" />;
      case 2: return <FileText size={15} color="#8b5cf6" />;
      case 3: return <Receipt size={15} color="#f59e0b" />;
      case 4: return <Users size={15} color="#10b981" />;
      case 5: return <ShieldCheck size={15} color="#06b6d4" />;
      case 6: return <Zap size={15} color="#eab308" />;
      case 7: return <Sparkles size={15} color="#ec4899" />;
      case 8: return <Wrench size={15} color="#f97316" />;
      case 9: return <Calendar size={15} color="#6366f1" />;
      default: return <DollarSign size={15} color="#64748b" />;
    }
  };

  const handleCopyOctDefaults = () => {
    HOSTEL_BUDGET_HEADS.forEach((h) => {
      handleValChange(h.key, h.defaultOct);
    });
  };

  const handleSetCeilingLimits = () => {
    HOSTEL_BUDGET_HEADS.forEach((h) => {
      handleValChange(h.key, h.limit);
    });
  };

  const handleResetBudgetHeads = () => {
    HOSTEL_BUDGET_HEADS.forEach((h) => {
      handleValChange(h.key, 0);
    });
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
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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
                Sanctioned: {formatINR(metrics.approved_budget || TOTAL_SANCTIONED_BUDGET)}
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
              {renderNumericInput('approved_budget', '142010789')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Cumulative Spent (₹)</span>
              {renderNumericInput('cumulative_budget_spent', '0.00')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Campus Sq Feet</span>
              {renderNumericInput('sq_feet', 'Sq Ft')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
              <div>
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Total Month Spend</span>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Sum of 9 Budget Heads</div>
              </div>
              <span style={{ fontSize: '14.5px', fontWeight: '900', color: '#0f172a' }}>
                {formatINR(metrics.budget_heads_total ?? metrics.expenses_occurred ?? 0)}
              </span>
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
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>
              {formatINR(metrics.per_student_cost_month)} <span style={{ fontSize: '13px', fontWeight: '600', color: '#c7d2fe' }}>/ month</span>
            </div>
            <div style={{ fontSize: '12px', color: '#a5b4fc', marginTop: '4px' }}>
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

        {/* CARD 7: 9 HOSTEL OPERATING BUDGET HEADS LEDGER (Full Width) */}
        <div
          style={{
            gridColumn: '1 / -1',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '20px',
            border: '1px solid var(--border-card, #e3e8f3)',
            borderTop: '5px solid #0284c7',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            boxSizing: 'border-box'
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--border-card, #e3e8f3)', paddingBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ 
                  fontSize: '10.5px', 
                  fontWeight: '800', 
                  padding: '2px 9px', 
                  borderRadius: '9999px', 
                  backgroundColor: '#e0f2fe', 
                  color: '#0284c7',
                  letterSpacing: '0.04em'
                }}>
                  OFFICIAL 9 BUDGET HEADS
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Oct'26 – May'27 Executive Framework
                </span>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-main, #12182b)' }}>
                Hostel Operating Budget Breakdown & Actuals ({activePeriodLabel})
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted, #66708f)', margin: '4px 0 0 0' }}>
                Sanctioned: <strong>{formatINR(TOTAL_SANCTIONED_BUDGET)}</strong> (8 Months) • Monthly Ceiling Limit: <strong style={{ color: '#c2410c' }}>{formatINR(TOTAL_MONTH_LIMIT)}</strong>
              </p>
            </div>

            {/* Quick Summary Chips & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Total Month Spend Badge */}
              <div style={{ 
                padding: '8px 14px', 
                backgroundColor: '#0f172a', 
                borderRadius: '12px', 
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end'
              }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.05em' }}>
                  TOTAL MONTH SPEND
                </span>
                <span style={{ fontSize: '17px', fontWeight: '900', color: '#38bdf8' }}>
                  {formatINR(metrics.budget_heads_total ?? 0)}
                </span>
              </div>

              {/* Net Variance Badge */}
              {(() => {
                const totalSpend = metrics.budget_heads_total ?? 0;
                const netDiff = TOTAL_MONTH_LIMIT - totalSpend;
                const isUnder = netDiff >= 0;
                const netPct = TOTAL_MONTH_LIMIT > 0 ? ((Math.abs(netDiff) / TOTAL_MONTH_LIMIT) * 100).toFixed(1) : '0';

                return (
                  <div style={{ 
                    padding: '8px 14px', 
                    backgroundColor: isUnder ? '#ecfdf5' : '#fef2f2', 
                    border: `1px solid ${isUnder ? '#a7f3d0' : '#fecaca'}`,
                    borderRadius: '12px', 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}>
                    <span style={{ fontSize: '10px', color: isUnder ? '#059669' : '#dc2626', fontWeight: '700', letterSpacing: '0.05em' }}>
                      {isUnder ? 'NET MONTH SAVINGS' : 'NET OVERRUN'}
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: '900', color: isUnder ? '#16a34a' : '#ef4444' }}>
                      {isUnder ? `Saved ${formatINR(netDiff)}` : `Over ${formatINR(Math.abs(netDiff))}`} <span style={{ fontSize: '11px', fontWeight: '700' }}>({netPct}%)</span>
                    </span>
                  </div>
                );
              })()}

              {/* Quick Helper Actions */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleCopyOctDefaults}
                  disabled={isClosed}
                  title="Load October reference actuals into current month"
                  style={{
                    padding: '6px 10px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    cursor: isClosed ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => !isClosed && (e.currentTarget.style.backgroundColor = '#e2e8f0')}
                  onMouseLeave={(e) => !isClosed && (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                >
                  <Copy size={13} />
                  <span>Oct Ref</span>
                </button>

                <button
                  type="button"
                  onClick={handleSetCeilingLimits}
                  disabled={isClosed}
                  title="Set all heads to their monthly ceiling limit"
                  style={{
                    padding: '6px 10px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    backgroundColor: '#fff7ed',
                    color: '#c2410c',
                    border: '1px solid #fed7aa',
                    borderRadius: '8px',
                    cursor: isClosed ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => !isClosed && (e.currentTarget.style.backgroundColor = '#ffedd5')}
                  onMouseLeave={(e) => !isClosed && (e.currentTarget.style.backgroundColor = '#fff7ed')}
                >
                  <Zap size={13} />
                  <span>Ceilings</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetBudgetHeads}
                  disabled={isClosed}
                  title="Reset all 9 budget heads to 0"
                  style={{
                    padding: '6px 10px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: isClosed ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => !isClosed && (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={(e) => !isClosed && (e.currentTarget.style.backgroundColor = '#f8fafc')}
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto', width: '100%', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
                  <th style={{ padding: '10px 14px', width: '45px', textAlign: 'center', fontSize: '11.5px', fontWeight: '800' }}>#</th>
                  <th style={{ padding: '10px 14px', fontSize: '11.5px', fontWeight: '800' }}>BUDGET HEAD & CATEGORY</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11.5px', fontWeight: '800' }}>SANCTIONED (8-MO)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11.5px', fontWeight: '800' }}>MONTH LIMIT</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11.5px', fontWeight: '800', width: '170px' }}>
                    ACTUAL SPEND ({activePeriodLabel})
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11.5px', fontWeight: '800' }}>VARIANCE VS CEILING</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11.5px', fontWeight: '800', width: '110px' }}>UTILIZATION</th>
                </tr>
              </thead>
              <tbody>
                {HOSTEL_BUDGET_HEADS.map((head, idx) => {
                  const userVal = currData[head.key];
                  const breakdownVal = metrics.budget_heads_breakdown?.[head.key];
                  const activeVal = userVal !== undefined && userVal !== null && userVal !== ''
                    ? Number(userVal)
                    : (breakdownVal !== undefined && breakdownVal !== null ? Number(breakdownVal) : 0);

                  const diff = head.limit - activeVal;
                  const isUnder = diff >= 0;
                  const pct = head.limit > 0 ? ((Math.abs(diff) / head.limit) * 100).toFixed(1) : '0';
                  const utilRatio = head.limit > 0 ? (activeVal / head.limit) : 0;
                  const utilPct = (utilRatio * 100).toFixed(0);

                  const isEven = idx % 2 === 0;

                  return (
                    <tr 
                      key={head.key} 
                      style={{ 
                        backgroundColor: isEven ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid #edf2f7',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isEven ? '#ffffff' : '#f8fafc')}
                    >
                      {/* S.No */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', color: '#64748b', fontSize: '12px' }}>
                        {head.s_no}
                      </td>

                      {/* Head Title + Icon */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '8px', 
                            backgroundColor: '#f1f5f9', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            {getBudgetHeadIcon(head.s_no)}
                          </div>
                          <div>
                            <span style={{ fontWeight: '750', color: '#1e293b', fontSize: '13px' }}>
                              {head.head}
                            </span>
                            {head.s_no === 1 && (
                              <span style={{ marginLeft: '6px', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '700' }}>
                                Primary Fixed
                              </span>
                            )}
                            {head.s_no === 4 && (
                              <span style={{ marginLeft: '6px', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#047857', fontWeight: '700' }}>
                                Staff
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Sanctioned */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: '#334155' }}>
                        {formatINR(head.sanctioned)}
                      </td>

                      {/* Month Limit */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '750', color: '#c2410c' }}>
                        {formatINR(head.limit)}
                      </td>

                      {/* Actual Spend Input */}
                      <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {renderBudgetHeadInput(head)}
                        </div>
                      </td>

                      {/* Variance vs Limit Badge */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          backgroundColor: isUnder ? '#ecfdf5' : '#fef2f2',
                          color: isUnder ? '#059669' : '#dc2626',
                          border: `1px solid ${isUnder ? '#a7f3d0' : '#fecaca'}`
                        }}>
                          {isUnder ? `Saved ${formatINR(diff)}` : `Over ${formatINR(Math.abs(diff))}`}
                          <span style={{ fontSize: '10px', opacity: 0.85 }}>({pct}%)</span>
                        </span>
                      </td>

                      {/* Progress Bar Utilization */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: '750', color: utilRatio <= 1.0 ? '#10b981' : '#ef4444' }}>
                            {utilPct}%
                          </span>
                          <div style={{ width: '80px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                width: `${Math.min(100, utilRatio * 100)}%`, 
                                height: '100%', 
                                backgroundColor: utilRatio <= 1.0 ? '#10b981' : '#ef4444',
                                borderRadius: '9999px',
                                transition: 'width 0.2s ease'
                              }} 
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Prominent Total Summary Footer */}
              <tfoot>
                <tr style={{ backgroundColor: '#fef08a', borderTop: '2px solid #eab308' }}>
                  <td colSpan={2} style={{ padding: '12px 16px', fontWeight: '900', color: '#713f12', fontSize: '13.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={17} color="#854d0e" />
                      <span>TOTAL OPERATING BUDGET</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', color: '#713f12', fontSize: '13.5px' }}>
                    {formatINR(TOTAL_SANCTIONED_BUDGET)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', color: '#854d0e', fontSize: '13.5px' }}>
                    {formatINR(TOTAL_MONTH_LIMIT)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', color: '#0f172a', fontSize: '15.5px' }}>
                    {formatINR(metrics.budget_heads_total ?? 0)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    {(() => {
                      const totalSpend = metrics.budget_heads_total ?? 0;
                      const netDiff = TOTAL_MONTH_LIMIT - totalSpend;
                      const isUnder = netDiff >= 0;
                      const netPct = TOTAL_MONTH_LIMIT > 0 ? ((Math.abs(netDiff) / TOTAL_MONTH_LIMIT) * 100).toFixed(1) : '0';

                      return (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: '900',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          backgroundColor: isUnder ? '#15803d' : '#b91c1c',
                          color: '#ffffff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          {isUnder ? `Net Saved ${formatINR(netDiff)}` : `Net Overrun ${formatINR(Math.abs(netDiff))}`} ({netPct}%)
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800', color: '#713f12', fontSize: '12px' }}>
                    {TOTAL_MONTH_LIMIT > 0 ? `${(((metrics.budget_heads_total ?? 0) / TOTAL_MONTH_LIMIT) * 100).toFixed(1)}%` : '0%'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748b', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
            <span>
              ℹ️ <strong>Synchronized Auto-Calculation:</strong> Updates in this table instantly recalculate Total Spend, Operating Balance, and Unit Economics.
            </span>
            <span>
              Click <strong>Save Month</strong> in the top header or toolbar to persist to PostgreSQL.
            </span>
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
