import React from 'react';
import { formatLakhs, formatINR } from '../../utils/formatters';

export default function TopCostHeadsCard({ computedMatrix }) {
  if (!computedMatrix || !computedMatrix.categories) return null;

  // Flatten and sort cost heads by total expenditure
  const items = [];
  computedMatrix.categories.forEach(cat => {
    cat.items?.forEach(it => {
      items.push({
        cost_head_id: it.cost_head_id,
        name: it.description || it.name,
        total: Number(it.total || 0),
        category: cat.category_name,
        category_id: cat.category_id
      });
    });
  });

  // Sort descending by total expenditure
  items.sort((a, b) => (b.total || 0) - (a.total || 0));

  const numPeriods = computedMatrix.periods?.length || 0;
  const hasExpenses = items.some(it => (it.total || 0) > 0);
  const topItems = (hasExpenses ? items.filter(it => it.total > 0) : items).slice(0, 8);
  const maxTotal = topItems[0]?.total || 1;

  // Colors matching categories in the new palette
  const getCategoryColor = (idx) => {
    const palette = ['#2563eb', '#8b5cf6', '#f97316', '#10b981', '#ec4899', '#06b6d4'];
    return palette[idx % palette.length];
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '20px 22px 18px 22px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ marginBottom: '14px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          Top cost heads
        </h3>
        <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
          {numPeriods > 0 ? `Ranked by ${numPeriods}-month spend` : 'Ranked by total spend'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {!hasExpenses ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '24px 12px', textAlign: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600' }}>No expense records available</span>
          </div>
        ) : (
          topItems.map((it, idx) => {
            const pct = Math.min(100, Math.round((it.total / maxTotal) * 100));
            const barColor = getCategoryColor(idx);

            return (
              <div key={it.cost_head_id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#1e293b' }}>
                    <span style={{ color: '#94a3b8', marginRight: '6px', fontWeight: '700' }}>{idx + 1}.</span>
                    {it.name}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }} className="currency-font">
                    {formatLakhs(it.total)}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    backgroundColor: barColor,
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
