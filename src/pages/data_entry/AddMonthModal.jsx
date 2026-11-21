import React from 'react';
import { X, Bus, Check, Calendar } from 'lucide-react';

const TRANSPORT_FLEETS = [
  {
    id: 'all',
    label: 'All Fleets (Consolidated)',
    buses: '58 Buses',
    icon: '🏢',
    desc: 'All 4 institutional fleets (Common, RPS, KPM, University)',
    color: '#0284c7',
    bg: '#eff6ff',
    borderColor: '#38bdf8'
  },
  {
    id: 'Common',
    label: 'Common Fleet',
    buses: '18 Buses',
    icon: '🚌',
    desc: 'Central campus pool, staff shuttles & shared transit',
    color: '#d97706',
    bg: '#fef3c7',
    borderColor: '#f59e0b'
  },
  {
    id: 'RPS',
    label: 'RPS Branch',
    buses: '19 Buses',
    icon: '🏫',
    desc: 'Rathinam Public School fleet & student commuter routes',
    color: '#7c3aed',
    bg: '#f3e8ff',
    borderColor: '#a855f7'
  },
  {
    id: 'KPM',
    label: 'KPM Branch',
    buses: '5 Buses',
    icon: '🏫',
    desc: 'KPM Matriculation school dedicated student transit',
    color: '#059669',
    bg: '#ecfdf5',
    borderColor: '#10b981'
  },
  {
    id: 'University',
    label: 'University Fleet',
    buses: '16 Buses',
    icon: '🎓',
    desc: 'Rathinam University main fleet & college bus routes',
    color: '#dc2626',
    bg: '#fee2e2',
    borderColor: '#f87171'
  }
];

export default function AddMonthModal({
  isOpen,
  onClose,
  newMonthForm,
  setNewMonthForm,
  handleStartDateChange,
  handleAddNewMonth,
  moduleName
}) {
  if (!isOpen) return null;

  const currentMod = (moduleName || newMonthForm?.module || '').toLowerCase();
  const isTransport = currentMod === 'transport';
  const selectedFleetId = newMonthForm?.branch || 'all';
  const selectedFleet = TRANSPORT_FLEETS.find(f => f.id === selectedFleetId) || TRANSPORT_FLEETS[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: isTransport ? '540px' : '480px',
        boxShadow: '0 25px 70px rgba(15, 23, 42, 0.25)',
        overflow: 'hidden',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          background: isTransport 
            ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' 
            : 'linear-gradient(135deg, #6c52d6 0%, #5439ba 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              {isTransport ? '🚌' : '📅'}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, letterSpacing: '-0.01em' }}>
                {isTransport ? 'Add New Transport Billing Month' : 'Add New Billing Month / Cycle'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.85)' }}>
                {isTransport ? 'Configure fleet division & reporting cycle' : 'Setup reporting period and dates'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ 
              color: '#ffffff', 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              cursor: 'pointer', 
              borderRadius: '50%', 
              width: '30px', 
              height: '30px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.35)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleAddNewMonth} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          
          {/* TRANSPORT ONLY: Institutional Fleet / Division Selector */}
          {isTransport && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a' }}>
                  🏫 Select Institutional Fleet / Branch *
                </label>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Active: <strong style={{ color: selectedFleet.color }}>{selectedFleet.label}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {TRANSPORT_FLEETS.map(fl => {
                  const isSel = selectedFleetId === fl.id;
                  return (
                    <div
                      key={fl.id}
                      onClick={() => setNewMonthForm({ ...newMonthForm, branch: fl.id })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 14px',
                        borderRadius: '12px',
                        border: isSel ? `2px solid ${fl.borderColor}` : '1.5px solid #e2e8f0',
                        backgroundColor: isSel ? fl.bg : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSel ? `0 2px 8px ${fl.color}25` : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '17px' }}>{fl.icon}</span>
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: '800', color: isSel ? fl.color : '#0f172a' }}>
                            {fl.label}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {fl.desc}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          backgroundColor: isSel ? fl.color : '#f1f5f9',
                          color: isSel ? '#ffffff' : '#475569'
                        }}>
                          {fl.buses}
                        </span>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSel ? `2px solid ${fl.color}` : '1.5px solid #cbd5e1',
                          backgroundColor: isSel ? fl.color : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff'
                        }}>
                          {isSel && <Check size={11} strokeWidth={3.5} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Start Date to End Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Start Date *
              </label>
              <input
                type="date"
                value={newMonthForm.start_date}
                onChange={(e) => handleStartDateChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                End Date *
              </label>
              <input
                type="date"
                value={newMonthForm.end_date}
                onChange={(e) => setNewMonthForm({ ...newMonthForm, end_date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Month / Cycle Label *
            </label>
            <input
              type="text"
              placeholder="e.g. Nov'26, Dec'26, Jan'27"
              value={newMonthForm.period_label}
              onChange={(e) => setNewMonthForm({ ...newMonthForm, period_label: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1.5px solid #e2e8f0',
                fontSize: '14px',
                fontWeight: '600',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                boxSizing: 'border-box'
              }}
              required
            />
            <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Automatically generated from Start Date (e.g. <strong>{newMonthForm.period_label || "Nov'26"}</strong>), or customize as needed
            </span>
          </div>

          {/* Contextual Notice */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: isTransport ? '#eff6ff' : '#efeefc',
            borderRadius: '14px',
            border: isTransport ? '1px solid #bfdbfe' : '1px solid #dcd7fc',
            fontSize: '12px',
            color: isTransport ? '#0369a1' : '#4338ca',
            lineHeight: '1.45'
          }}>
            <span style={{ fontSize: '16px', marginTop: '1px' }}>{isTransport ? '🚌' : '📋'}</span>
            <span>
              {isTransport ? (
                selectedFleetId === 'all' ? (
                  <>Initializes reporting cycle across <strong>All 4 Fleets (58 total buses)</strong> with separate operational parameters and empty ₹0 expense entries for Common, RPS, KPM, and University.</>
                ) : (
                  <>Initializes reporting cycle with primary focus on <strong>{selectedFleet.label} ({selectedFleet.buses})</strong>. All fleets remain segregated and ready for distinct data entry.</>
                )
              ) : (
                <>New month starts with <strong>blank entries (₹0.00)</strong>. Enter values manually, or use the <strong>Clone from Prev</strong> button in Data Entry whenever needed.</>
              )}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '9999px',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                borderRadius: '9999px',
                background: isTransport 
                  ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' 
                  : 'linear-gradient(135deg, #ff7e9e 0%, #ff4b72 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer',
                boxShadow: isTransport 
                  ? '0 6px 18px rgba(2, 132, 199, 0.35)' 
                  : '0 8px 20px rgba(255, 96, 136, 0.35)',
                transition: 'transform 0.1s ease'
              }}
            >
              {isTransport ? `Create Transport Month (${newMonthForm.period_label || 'Cycle'})` : 'Create & Open for Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
