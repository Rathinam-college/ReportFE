import React, { useState } from 'react';
import { formatINR } from '../../../utils/formatters';
import { 
  Save, RefreshCw, CheckCircle2, AlertCircle, Plus, Copy, Lock, Unlock,
  LayoutGrid, Table, Bus, Users, Fuel, Wrench, ShieldCheck,
  Calculator, DollarSign, Activity, Check
} from 'lucide-react';

export default function TransportCardSpreadsheet({
  periods = [],
  editingPeriodId,
  setEditingPeriodId,
  activePeriodObj,
  isClosed,
  // Branch State
  branches = [],
  activeBranch = 'RPS',
  setActiveBranch,
  activeMetrics = {},
  // Draft Data & Handlers
  getParamRawValue,
  handleParamChange,
  handleSaveActiveBranch,
  isSaving,
  localMessage,
  handleCopyFromPreviousMonth,
  handleToggleLock,
  // View Switcher
  viewMode = 'cards',
  setViewMode
}) {
  const [focusedKey, setFocusedKey] = useState(null);

  const currPeriodIdStr = String(editingPeriodId);
  const activePeriod = periods.find(p => String(p.id) === currPeriodIdStr) || activePeriodObj || periods[0];
  const activePeriodLabel = activePeriod?.period_label || 'Focus Month';

  // Helper for numeric inputs with live branch state updating
  const renderParamInput = (paramKey, placeholder = '0', disabled = false) => {
    const rawVal = getParamRawValue(activeBranch, currPeriodIdStr, paramKey);
    const isFocused = focusedKey === paramKey;
    const isReadOnly = disabled || activeBranch === 'all' || isClosed;

    return (
      <div style={{ position: 'relative', width: '130px' }}>
        <input
          type="number"
          step="any"
          value={rawVal === 0 || rawVal === '0' || rawVal === undefined || rawVal === null ? '' : rawVal}
          placeholder={placeholder}
          disabled={isReadOnly}
          onFocus={() => setFocusedKey(paramKey)}
          onBlur={() => setFocusedKey(null)}
          onChange={(e) => handleParamChange(paramKey, e.target.value)}
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
            backgroundColor: isReadOnly ? '#f8fafc' : 'var(--bg-card, #ffffff)',
            color: isReadOnly ? '#64748b' : 'var(--text-main, #12182b)',
            opacity: isClosed ? 0.55 : 1,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'all 0.15s ease'
          }}
        />
      </div>
    );
  };

  const actualKms = Number(activeMetrics.actual_kms || 0);
  const approvedKms = Number(activeMetrics.approved_kms || 0);
  const excessKms = actualKms - approvedKms;
  const totExpenses = Number(activeMetrics.total_expenses || 0);
  const costPerKm = actualKms > 0 ? (totExpenses / actualKms).toFixed(2) : '0.00';
  const kmRunRatePct = approvedKms > 0 ? Math.min(100, Math.max(0, (actualKms / approvedKms) * 100)) : 0;

  return (
    <div
      className="transport-card-spreadsheet-container"
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
              Transport Operations & Fleet Master Spreadsheet
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
            Editable cards · edit branch fleet operations, expenses & kms · direct PostgreSQL save
          </p>
        </div>

        {/* Action Buttons: Save & Clone */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {handleCopyFromPreviousMonth && (
            <button
              type="button"
              onClick={handleCopyFromPreviousMonth}
              disabled={activeBranch === 'all' || isClosed}
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
                cursor: (activeBranch === 'all' || isClosed) ? 'not-allowed' : 'pointer',
                backdropFilter: 'blur(4px)',
                opacity: (activeBranch === 'all' || isClosed) ? 0.5 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              <Copy size={14} />
              <span>Clone from Prev</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveActiveBranch}
            disabled={isSaving || activeBranch === 'all'}
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
              cursor: (isSaving || activeBranch === 'all') ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.18s ease'
            }}
          >
            {isSaving ? (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Save size={14} color="#0670c9" />
            )}
            <span>Save {activeBranch} Branch Data</span>
          </button>
        </div>
      </div>

      {/* 2. TOOLBAR ROW: Month Pills, Branch Selector & View Switcher */}
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

        {/* Branch Selector Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #66708f)', textTransform: 'uppercase' }}>
            Branch:
          </span>
          {branches.map((br) => {
            const isSel = activeBranch === br.id;
            return (
              <button
                key={br.id}
                type="button"
                onClick={() => setActiveBranch(br.id)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontWeight: isSel ? '800' : '600',
                  border: 'none',
                  backgroundColor: isSel ? '#5b5bf0' : 'var(--bg-card, #ffffff)',
                  color: isSel ? '#ffffff' : 'var(--text-main, #12182b)',
                  boxShadow: isSel ? '0 2px 8px rgba(91, 91, 240, 0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{br.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Switcher */}
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
            <button
              type="button"
              onClick={() => setViewMode('vehicles')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'vehicles' ? '#0aa0e8' : 'transparent',
                color: viewMode === 'vehicles' ? '#ffffff' : 'var(--text-muted, #66708f)',
                fontSize: '11.5px',
                fontWeight: viewMode === 'vehicles' ? '800' : '500',
                boxShadow: viewMode === 'vehicles' ? '0 2px 6px rgba(10, 160, 232, 0.25)' : 'none'
              }}
            >
              <Bus size={12} />
              <span>Vehicle Ledger</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. FORMULA BAR: Monospace strip with fx formulas */}
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
          <strong style={{ color: 'var(--text-main, #12182b)' }}>Total Expenses:</strong> =Fuel + FC + Statutory + Repairs + Others + Drivers &nbsp;|&nbsp; 
          <strong style={{ color: 'var(--text-main, #12182b)' }}>Excess KMs:</strong> =Actual KMs - Approved KMs &nbsp;|&nbsp; 
          <strong style={{ color: 'var(--text-main, #12182b)' }}>Cost / KM:</strong> Total Expenses / Actual KMs
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
        {/* CARD 1: FLEET OPERATIONS & DISTANCE (Amber) */}
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
                Fleet Operations & Distance
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)' }}>
                {activeMetrics.vehicles_count || 0} Vehicles · {activeMetrics.passengers_count || 0} Commuters
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>
                {actualKms.toLocaleString('en-IN')} KM
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)', fontWeight: '600' }}>
                of {approvedKms.toLocaleString('en-IN')} Approved
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Vehicles Count (Active)</span>
              {renderParamInput('vehicles_count', 'Vehicles')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Passengers / Commuters</span>
              {renderParamInput('passengers_count', 'Count')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Approved KMs</span>
              {renderParamInput('approved_kms', 'KMs')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Actual KMs Logged</span>
              {renderParamInput('actual_kms', 'KMs')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: excessKms >= 0 ? '#b45309' : '#059669' }}>
                Excess KMs (Variance)
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: '800', color: excessKms >= 0 ? '#b45309' : '#059669' }}>
                {excessKms.toLocaleString('en-IN')} KM
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: FLEET OPERATING EXPENSES (Green) */}
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
                Fleet Expenses & Operations
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)' }}>
                Fuel, Repairs, FC & Staff Cost
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>
                {formatINR(totExpenses)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)', fontWeight: '600' }}>
                Total Fleet Cost
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Fuel Expenses (₹)</span>
              {renderParamInput('fuel_expenses', '0.00')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Repair & Maintenance (₹)</span>
              {renderParamInput('repair_maintenance_cost', '0.00')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>FC (Fitness Certificate) (₹)</span>
              {renderParamInput('fc_cost', '0.00')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Statutory & Insurance (₹)</span>
              {renderParamInput('statutory_cost', '0.00')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Driver & Employee Cost (₹)</span>
              {renderParamInput('employee_cost', '0.00')}
            </div>
          </div>
        </div>

        {/* CARD 3: REVENUE & TRANSPORT FEES (Blue) */}
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
                Transport Fee & Revenue
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)' }}>
                Student Fee Collections & Billing
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0aa0e8' }}>
                {formatINR(activeMetrics.fee_collected || 0)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)', fontWeight: '600' }}>
                Collected of {formatINR(activeMetrics.fee_demand || 0)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Fee Demand (₹)</span>
              {renderParamInput('fee_demand', '0.00')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Fee Collected (₹)</span>
              {renderParamInput('fee_collected', '0.00')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Pending Unpaid Fee (₹)</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#e11d48' }}>
                {formatINR(activeMetrics.fee_unpaid || 0)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Staff Travel Deduction (₹)</span>
              {renderParamInput('staff_travel_deduction', '0.00')}
            </div>
          </div>
        </div>

        {/* CARD 4: FUEL & ENERGY CONSUMPTION (Orange) */}
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
                Fuel & Energy Metrics
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)' }}>
                Diesel Litres & Fleet Mileage
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#f97316' }}>
                {Number(activeMetrics.diesel_litres || 0).toLocaleString('en-IN')} L
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)', fontWeight: '600' }}>
                Diesel Consumed
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Diesel Litres</span>
              {renderParamInput('diesel_litres', 'Litres')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Service Tickets Received</span>
              {renderParamInput('service_tickets_received', '0')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Service Tickets Closed</span>
              {renderParamInput('service_tickets_closed', '0')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Incidents Count</span>
              {renderParamInput('incidents_count', '0')}
            </div>
          </div>
        </div>

        {/* CARD 5: OPERATING BUDGET & BALANCE (Slate) */}
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
                Budget Allocation vs Actual Spend
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: Number(activeMetrics.balance || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                {formatINR(activeMetrics.balance || 0)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)', fontWeight: '600' }}>
                Operating Balance
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Approved Budget (₹)</span>
              {renderParamInput('approved_budget', '0.00')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Cumulative Spent (₹)</span>
              {renderParamInput('cumulative_budget_spent', '0.00')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '600' }}>Cab Request Billing (₹)</span>
              {renderParamInput('cab_billing', '0.00')}
            </div>
          </div>
        </div>

        {/* CARD 6: COST PER KM & UNIT ECONOMICS (Indigo Formula Card) */}
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
                  Cost Per KM Logged
                </h3>
                <span style={{ fontSize: '11px', color: '#c7d2fe' }}>
                  Fleet Unit Economics
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
              ₹{costPerKm} <span style={{ fontSize: '14px', fontWeight: '600', color: '#c7d2fe' }}>/ KM</span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#a5b4fc', marginTop: '4px' }}>
              Per Commuter Cost: ₹{activeMetrics.per_student_cost_expenses || 0} / Year · Fee/KM/Day: ₹{activeMetrics.demand_per_km_day || '0.00'}
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
            Formula: =Total Fleet Expenses / Total Actual KMs Logged
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
            Total Fleet Expenses · {activeBranch} ({activePeriodLabel}):
          </span>
          <span style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>
            {formatINR(totExpenses)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#94a3b8' }}>
            Fleet Distance Logged:
          </span>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8' }}>
            {actualKms.toLocaleString('en-IN')} KM ({kmRunRatePct.toFixed(1)}% Run Rate)
          </span>
        </div>
      </div>
    </div>
  );
}
