import React from 'react';
import { formatLakhs, formatINR } from '../../utils/formatters';

export default function TopCostHeadsCard({ computedMatrix }) {
  if (!computedMatrix || !computedMatrix.categories) return null;

  // Flatten and sort cost heads by total expenditure
  const items = [];
  computedMatrix.categories.forEach(cat => {
    cat.items.forEach(it => {
      items.push({
        cost_head_id: it.cost_head_id,
        name: it.description,
        total: it.total || 0,
        category: cat.category_name,
        category_id: cat.category_id
      });
    });
  });

  const numPeriods = computedMatrix.periods?.length || 0;
  const hasExpenses = items.some(it => (it.total || 0) > 0);
  const topItems = (hasExpenses ? items.filter(it => it.total > 0) : items).slice(0, 8);
  const maxTotal = topItems[0]?.total || 1;

  // Colors matching categories
  const getCategoryColor = (catId) => {
    const colors = {
      1: '#6366f1', // Food Material (Purple)
      2: '#10b981', // Food Labour (Green)
      3: '#f59e0b', // FC Maintenance (Amber)
      4: '#ec4899', // Events (Pink)
      5: '#8b5cf6'  // Festival (Violet)
    };
    return colors[catId] || '#6366f1';
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '20px 24px',
      border: '1px solid #eef2f6',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          Top cost heads
        </h3>
        <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
          {numPeriods > 0 ? `Ranked by ${numPeriods}-month total` : 'Ranked by total expenditure'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        {!hasExpenses ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '36px 12px', textAlign: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>No expense records in database</span>
            <span style={{ fontSize: '11.5px', marginTop: '4px' }}>Entries will appear here once recorded in Data Entry</span>
          </div>
        ) : (
          topItems.map((it, idx) => {
            const pct = Math.min(100, Math.round((it.total / maxTotal) * 100));
            const barColor = getCategoryColor(it.category_id);

            return (
              <div key={it.cost_head_id} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                    <span style={{ color: '#94a3b8', marginRight: '6px', fontWeight: '700' }}>{idx + 1}</span>
                    {it.name}
                  </span>
                  <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }} className="currency-font">
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

