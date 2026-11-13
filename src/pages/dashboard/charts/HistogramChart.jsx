import React, { useState } from 'react';
import { formatINR, formatLakhs } from '../../../utils/formatters';

export default function HistogramChart({ items = [] }) {
  const [selectedBin, setSelectedBin] = useState(null);

  if (!items || items.length === 0) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No data available for Histogram</div>;
  }

  // Define Bins
  const bins = [
    { label: '< ₹50K', min: 0, max: 50000, color: '#38bdf8' },
    { label: '₹50K - ₹2L', min: 50000, max: 200000, color: '#0ea5e9' },
    { label: '₹2L - ₹5L', min: 200000, max: 500000, color: '#2563eb' },
    { label: '₹5L - ₹10L', min: 500000, max: 1000000, color: '#4f46e5' },
    { label: '₹10L - ₹25L', min: 1000000, max: 2500000, color: '#7c3aed' },
    { label: '> ₹25L', min: 2500000, max: Infinity, color: '#9333ea' }
  ];

  // Distribute items into bins
  const binData = bins.map(b => {
    const matching = items.filter(it => {
      const val = it.total || it.value || 0;
      return val >= b.min && val < b.max;
    });
    const totalAmount = matching.reduce((acc, it) => acc + (it.total || it.value || 0), 0);
    return {
      ...b,
      count: matching.length,
      totalAmount,
      items: matching
    };
  });

  const maxCount = Math.max(...binData.map(b => b.count), 1);

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            Expenditure Frequency Distribution (Histogram)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Line items frequency binned by transaction expenditure brackets • Total: <strong>{items.length} Cost Heads</strong>
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#4f46e5', backgroundColor: '#eef2ff', padding: '3px 8px', borderRadius: '4px' }}>
          • Histogram Style
        </span>
      </div>

      {/* Histogram Bars */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: '240px',
        borderBottom: '2px solid #cbd5e1',
        paddingBottom: '16px',
        paddingTop: '20px'
      }}>
        {binData.map((bin, idx) => {
          const barH = (bin.count / maxCount) * 160;
          const isSelected = selectedBin === idx;

          return (
            <div
              key={bin.label}
              onClick={() => setSelectedBin(isSelected ? null : idx)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: isSelected ? '#4f46e5' : '#0f172a' }}>
                  {bin.count}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>items</span>
              </div>

              <div
                style={{
                  width: '68px',
                  height: `${Math.max(barH, 6)}px`,
                  backgroundColor: isSelected ? '#3730a3' : bin.color,
                  borderRadius: '4px 4px 0 0',
                  boxShadow: isSelected ? '0 4px 12px rgba(79,70,229,0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              />

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block' }}>{bin.label}</span>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>{formatLakhs(bin.totalAmount)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail drawer when clicking a bin */}
      {selectedBin !== null && (
        <div style={{
          marginTop: '18px',
          padding: '16px 20px',
          borderRadius: '8px',
          backgroundColor: '#f8fafc',
          border: '1.5px solid #cbd5e1'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
              Cost Heads in Bracket: {binData[selectedBin].label} ({binData[selectedBin].count} Items • Total: {formatINR(binData[selectedBin].totalAmount)})
            </h4>
            <button
              type="button"
              onClick={() => setSelectedBin(null)}
              style={{ fontSize: '11.5px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Close Details
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
            {binData[selectedBin].items.map((it, i) => (
              <div key={i} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#0f172a' }}>{it.description || it.name}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb' }} className="currency-font">
                  {formatINR(it.total || it.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

