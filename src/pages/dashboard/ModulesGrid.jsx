import React from 'react';
import { Utensils, Home, Bus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export default function ModulesGrid({
  selectedModule = 'food',
  onSelectModule,
  onOpenDataEntry,
  activePeriodTotal = '₹0.00',
  periodLabel = 'Current Cycle',
  hasPeriods = true
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          Campus Operations Modules
        </h3>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          Click any module to filter dashboard analytics exclusively
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        
        {/* Module 1: Food & Dining */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px 22px',
          border: selectedModule === 'food' ? '2px solid #6366f1' : '1px solid #e2e8f0',
          boxShadow: selectedModule === 'food' ? '0 4px 12px rgba(99, 102, 241, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px',
          transition: 'all 0.15s ease'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#6366f1' }} />
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>Food & Dining</span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: selectedModule === 'food' ? '#eef2ff' : '#f8fafc',
                color: selectedModule === 'food' ? '#4f46e5' : '#64748b',
                border: selectedModule === 'food' ? '1px solid #c7d2fe' : '1px solid #e2e8f0'
              }}>
                {selectedModule === 'food' ? '● Active Dashboard' : 'Operational'}
              </span>
            </div>

            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }} className="currency-font">
              {selectedModule === 'food' ? activePeriodTotal : '4 Active Cycles'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
              Mess & dining halls • 2,690 Enrolled diners • 72,400 meals/mo
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '24px', marginTop: '12px' }}>
              <span style={{ width: '14px', height: '10px', backgroundColor: '#cbd5e1', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '14px', backgroundColor: '#cbd5e1', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '12px', backgroundColor: '#cbd5e1', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '20px', backgroundColor: '#94a3b8', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '24px', backgroundColor: '#4f46e5', borderRadius: '2px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onSelectModule?.('food')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: '6px',
                backgroundColor: selectedModule === 'food' ? '#eef2ff' : '#f8fafc',
                color: selectedModule === 'food' ? '#4f46e5' : '#475569',
                fontSize: '12.5px',
                fontWeight: '700',
                border: selectedModule === 'food' ? '1.5px solid #6366f1' : '1px solid #cbd5e1',
                cursor: 'pointer'
              }}
            >
              {selectedModule === 'food' ? '✓ Showing Food' : 'Switch to Food'}
            </button>
            <button
              type="button"
              onClick={() => onOpenDataEntry?.('food')}
              title="Open Food Data Entry"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Data Entry
            </button>
          </div>
        </div>

        {/* Module 2: Hostel Occupancy */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px 22px',
          border: selectedModule === 'hostel' ? '2px solid #059669' : '1px solid #e2e8f0',
          boxShadow: selectedModule === 'hostel' ? '0 4px 12px rgba(5, 150, 105, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px',
          transition: 'all 0.15s ease'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#059669' }} />
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>Hostel Resident Facilities</span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: selectedModule === 'hostel' ? '#ecfdf5' : '#f8fafc',
                color: selectedModule === 'hostel' ? '#047857' : '#64748b',
                border: selectedModule === 'hostel' ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
              }}>
                {selectedModule === 'hostel' ? '● Active Dashboard' : 'Operational'}
              </span>
            </div>

            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>
              3,119 Total Beds • 95.4% Occupied
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
              2,908 Residents (2,843 Students, 131 Staff) • 145 Vacant
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '24px', marginTop: '12px' }}>
              <span style={{ width: '14px', height: '18px', backgroundColor: '#cbd5e1', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '16px', backgroundColor: '#cbd5e1', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '22px', backgroundColor: '#94a3b8', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '24px', backgroundColor: '#059669', borderRadius: '2px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onSelectModule?.('hostel')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: '6px',
                backgroundColor: selectedModule === 'hostel' ? '#ecfdf5' : '#f8fafc',
                color: selectedModule === 'hostel' ? '#047857' : '#475569',
                fontSize: '12.5px',
                fontWeight: '700',
                border: selectedModule === 'hostel' ? '1.5px solid #059669' : '1px solid #cbd5e1',
                cursor: 'pointer'
              }}
            >
              {selectedModule === 'hostel' ? '✓ Showing Hostel' : 'Switch to Hostel'}
            </button>
            <button
              type="button"
              onClick={() => onOpenDataEntry?.('hostel')}
              title="Open Hostel Data Entry"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#059669',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Data Entry
            </button>
          </div>
        </div>

        {/* Module 3: Transport Fleet */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px 22px',
          border: selectedModule === 'transport' ? '2px solid #2563eb' : '1px solid #e2e8f0',
          boxShadow: selectedModule === 'transport' ? '0 4px 12px rgba(37, 99, 235, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px',
          transition: 'all 0.15s ease'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#2563eb' }} />
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>Transport Fleet & Logistics</span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: selectedModule === 'transport' ? '#eff6ff' : '#f8fafc',
                color: selectedModule === 'transport' ? '#1d4ed8' : '#64748b',
                border: selectedModule === 'transport' ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
              }}>
                {selectedModule === 'transport' ? '● Active Dashboard' : 'Operational'}
              </span>
            </div>

            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>
              18+1 Vehicles • 447 Passengers
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
              25,777 Actual KMs run • 5,184.84 Litres Diesel • 38/38 Tickets Closed
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '24px', marginTop: '12px' }}>
              <span style={{ width: '14px', height: '12px', backgroundColor: '#cbd5e1', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '16px', backgroundColor: '#cbd5e1', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '20px', backgroundColor: '#cbd5e1', borderRadius: '2px' }} />
              <span style={{ width: '14px', height: '24px', backgroundColor: '#2563eb', borderRadius: '2px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onSelectModule?.('transport')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: '6px',
                backgroundColor: selectedModule === 'transport' ? '#eff6ff' : '#f8fafc',
                color: selectedModule === 'transport' ? '#1d4ed8' : '#475569',
                fontSize: '12.5px',
                fontWeight: '700',
                border: selectedModule === 'transport' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                cursor: 'pointer'
              }}
            >
              {selectedModule === 'transport' ? '✓ Showing Transport' : 'Switch to Transport'}
            </button>
            <button
              type="button"
              onClick={() => onOpenDataEntry?.('transport')}
              title="Open Transport Data Entry"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Data Entry
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
