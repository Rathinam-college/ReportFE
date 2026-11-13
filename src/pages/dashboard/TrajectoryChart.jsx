import React from 'react';
import { formatINR, formatLakhs } from '../../utils/formatters';

export default function TrajectoryChart({ overview }) {
  if (!overview || !overview.trend) return null;

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
        Monthly Spending Trajectory & Category Composition (Jun'26 – Oct'26)
      </h3>
      
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '220px', borderBottom: '1px solid #cbd5e1', paddingBottom: '16px' }}>
        {overview.trend.map((pt, idx) => {
          const maxVal = 16000000;
          const hTotal = (pt.total / maxVal) * 190;
          const hMat = (pt.material_fuel / maxVal) * 190;
          const hLab = (pt.labour / maxVal) * 190;
          const hMaint = ((pt.maintenance + pt.events_festivals) / maxVal) * 190;
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a' }}>{formatLakhs(pt.total)}</span>
              <div style={{ width: '48px', height: `${hTotal}px`, display: 'flex', flexDirection: 'column-reverse', borderRadius: '6px 6px 0 0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ height: `${hMat}px`, backgroundColor: '#2563eb' }} title={`Material & Fuel: ${formatINR(pt.material_fuel)}`} />
                <div style={{ height: `${hLab}px`, backgroundColor: '#8b5cf6' }} title={`Labour: ${formatINR(pt.labour)}`} />
                <div style={{ height: `${hMaint}px`, backgroundColor: '#f59e0b' }} title={`Maintenance & Events: ${formatINR(pt.maintenance + pt.events_festivals)}`} />
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>{pt.period_label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#2563eb' }} />
          <span style={{ color: '#475569', fontWeight: '600' }}>Food Material & Fuel Gas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#8b5cf6' }} />
          <span style={{ color: '#475569', fontWeight: '600' }}>Labour & Manpower</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#f59e0b' }} />
          <span style={{ color: '#475569', fontWeight: '600' }}>Maintenance & Events</span>
        </div>
      </div>
    </div>
  );
}
