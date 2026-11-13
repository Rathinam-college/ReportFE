import React from 'react';
import { formatINR } from '../../utils/formatters';

export default function ComparisonTool({
  comparisonData,
  compareBasePeriod,
  setCompareBasePeriod,
  compareTargetPeriod,
  setCompareTargetPeriod,
  periods = []
}) {
  if (!comparisonData) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Comparison Configuration Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px 24px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
              Period Comparison & Variance Analyzer
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
              Select any two monthly billing periods to compare cost heads, variance deltas, and percentage growth.
            </p>
          </div>

          {/* Quick Comparison Presets */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', alignSelf: 'center', marginRight: '4px' }}>Presets:</span>
            
            <button
              type="button"
              onClick={() => { setCompareBasePeriod(1); setCompareTargetPeriod(5); }}
              style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer' }}
            >
              Jun'26 vs Oct'26 (Full Season)
            </button>

            <button
              type="button"
              onClick={() => { setCompareBasePeriod(4); setCompareTargetPeriod(5); }}
              style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer' }}
            >
              Sept'26 vs Oct'26 (Latest MoM)
            </button>

            <button
              type="button"
              onClick={() => { setCompareBasePeriod(3); setCompareTargetPeriod(4); }}
              style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer' }}
            >
              Aug'26 vs Sept'26 (Peak Surge)
            </button>
          </div>
        </div>

        {/* Period Pickers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          alignItems: 'center'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Base Period (Baseline)
            </label>
            <select
              value={compareBasePeriod}
              onChange={(e) => setCompareBasePeriod(Number(e.target.value))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', fontWeight: '700', color: '#0f172a', backgroundColor: '#ffffff' }}
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.period_label} ({p.period_code})
                </option>
              ))}
            </select>
          </div>

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Comparing with</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: '4px 0' }}>
              ➜
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Comparison Target Period
            </label>
            <select
              value={compareTargetPeriod}
              onChange={(e) => setCompareTargetPeriod(Number(e.target.value))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', fontWeight: '700', color: '#2563eb', backgroundColor: '#ffffff' }}
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.period_label} ({p.period_code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '18px 20px', border: '1px solid #cbd5e1' }}>
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            {comparisonData.pBase.period_label} Spend (Base)
          </span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }} className="currency-font">
            {formatINR(comparisonData.baseTotal)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>Starting baseline</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '18px 20px', border: '1px solid #cbd5e1' }}>
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            {comparisonData.pTarget.period_label} Spend (Target)
          </span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563eb', margin: '6px 0 2px 0' }} className="currency-font">
            {formatINR(comparisonData.targetTotal)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>Comparison month</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '18px 20px', border: '1px solid #cbd5e1' }}>
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Net Variance (Delta)
          </span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: comparisonData.netDiff >= 0 ? '#b91c1c' : '#15803d', margin: '6px 0 2px 0' }} className="currency-font">
            {comparisonData.netDiff >= 0 ? '+' : ''}{formatINR(comparisonData.netDiff)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>Absolute spending change</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '18px 20px', border: '1px solid #cbd5e1' }}>
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Percentage Growth / Variance
          </span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: comparisonData.netPct >= 0 ? '#b91c1c' : '#15803d', margin: '6px 0 2px 0' }}>
            {comparisonData.netPct >= 0 ? '▲ +' : '▼ '}{comparisonData.netPct.toFixed(2)}%
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
            {comparisonData.netPct >= 0 ? 'Cost escalation over base' : 'Cost reduction over base'}
          </div>
        </div>
      </div>

      {/* Side-by-Side Category Comparative Bars */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Category Expenditure Comparison: {comparisonData.pBase.period_label} vs {comparisonData.pTarget.period_label}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#94a3b8' }} />
              <span style={{ fontWeight: '600', color: '#475569' }}>{comparisonData.pBase.period_label} (Base)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#2563eb' }} />
              <span style={{ fontWeight: '700', color: '#2563eb' }}>{comparisonData.pTarget.period_label} (Target)</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {comparisonData.categories.map(cat => {
            const maxSpend = Math.max(1, ...comparisonData.categories.map(c => Math.max(c.amtBase, c.amtTarget)));
            const baseBarPct = (cat.amtBase / maxSpend) * 100;
            const targetBarPct = (cat.amtTarget / maxSpend) * 100;

            return (
              <div key={cat.category_id} style={{ padding: '14px 18px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{cat.category_name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                      Base: {formatINR(cat.amtBase)} ➔ Target: <strong>{formatINR(cat.amtTarget)}</strong>
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: cat.diff >= 0 ? '#fef2f2' : '#f0fdf4',
                      color: cat.diff >= 0 ? '#b91c1c' : '#15803d',
                      border: `1px solid ${cat.diff >= 0 ? '#fecaca' : '#bbf7d0'}`
                    }}>
                      {cat.diff >= 0 ? '+' : ''}{cat.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Dual Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '50px', fontSize: '10.5px', fontWeight: '600', color: '#64748b' }}>{comparisonData.pBase.period_label}</span>
                    <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${baseBarPct}%`, height: '100%', backgroundColor: '#94a3b8', borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '50px', fontSize: '10.5px', fontWeight: '700', color: '#2563eb' }}>{comparisonData.pTarget.period_label}</span>
                    <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${targetBarPct}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Line-by-Line Cost Head Variance Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
            Cost Head Line-by-Line Variance Drilldown
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Comparing {comparisonData.pBase.period_label} vs {comparisonData.pTarget.period_label}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '12px 18px', textAlign: 'left' }}>Description / Cost Head</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>{comparisonData.pBase.period_label} (Base)</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>{comparisonData.pTarget.period_label} (Target)</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Variance (Delta ₹)</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Growth %</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Trend Status</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.categories.map(cat => (
                <React.Fragment key={cat.category_id}>
                  <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '700', color: '#1e293b' }}>
                    <td colSpan={7} style={{ padding: '8px 18px', fontSize: '12px', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                      {cat.category_name} (Category Delta: {cat.diff >= 0 ? '+' : ''}{formatINR(cat.diff)})
                    </td>
                  </tr>
                  {cat.items.map(item => {
                    const isSurge = item.pct > 20;
                    const isReduction = item.diff < 0;
                    return (
                      <tr key={item.cost_head_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 18px', fontWeight: '600', color: '#0f172a' }}>{item.description}</td>
                        <td style={{ padding: '10px 16px', color: '#64748b' }}>{cat.category_name}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }} className="currency-font">{formatINR(item.amtBase)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }} className="currency-font">{formatINR(item.amtTarget)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '700', color: item.diff >= 0 ? '#b91c1c' : '#15803d' }} className="currency-font">
                          {item.diff >= 0 ? '+' : ''}{formatINR(item.diff)}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '700', color: item.pct >= 0 ? '#b91c1c' : '#15803d' }}>
                          {item.pct >= 0 ? '+' : ''}{item.pct.toFixed(1)}%
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: isSurge ? '#fef2f2' : (isReduction ? '#f0fdf4' : '#eff6ff'),
                            color: isSurge ? '#b91c1c' : (isReduction ? '#15803d' : '#2563eb'),
                            border: `1px solid ${isSurge ? '#fecaca' : (isReduction ? '#bbf7d0' : '#bfdbfe')}`
                          }}>
                            {isSurge ? '▲ Surge > 20%' : (isReduction ? '▼ Savings' : '● Stable')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
