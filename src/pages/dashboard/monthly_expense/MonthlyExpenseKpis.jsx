import React from 'react';
import { Layers, TrendingUp, Award, Calendar } from 'lucide-react';

export default function MonthlyExpenseKpis({
  cycleTotal = 0,
  monthCount = 1,
  monthlyAverage = 0,
  topHead = { name: '—', amount: 0, percentage: 0 },
  peakMonth = { label: '—', amount: 0 },
  formatValue
}) {
  const cards = [
    {
      id: 'cycle_total',
      label: 'Total Expenses',
      badge: `${monthCount} Month${monthCount === 1 ? '' : 's'}`,
      badgeColor: '#eef2ff',
      badgeTextColor: '#4f46e5',
      value: formatValue(cycleTotal),
      subtext: `Total spent across ${monthCount} recorded month${monthCount === 1 ? '' : 's'}`,
      icon: Layers,
      iconBg: '#eff6ff',
      iconColor: '#3b82f6'
    },
    {
      id: 'monthly_avg',
      label: 'Monthly Average',
      badge: 'Per Month',
      badgeColor: '#ecfdf5',
      badgeTextColor: '#059669',
      value: formatValue(monthlyAverage),
      subtext: 'Average expense per month',
      icon: TrendingUp,
      iconBg: '#f0fdf4',
      iconColor: '#10b981'
    },
    {
      id: 'top_head',
      label: 'Highest Expense Category',
      badge: `${Number(topHead.percentage || 0).toFixed(1)}% Share`,
      badgeColor: '#fef3c7',
      badgeTextColor: '#b45309',
      value: topHead.name || '—',
      isTextValue: true,
      subtext: `${formatValue(topHead.amount)} of total spending`,
      icon: Award,
      iconBg: '#fffbeb',
      iconColor: '#f59e0b'
    },
    {
      id: 'peak_month',
      label: 'Highest Expense Month',
      badge: 'Highest',
      badgeColor: '#fce7f3',
      badgeTextColor: '#be185d',
      value: peakMonth.label || '—',
      isTextValue: true,
      subtext: `Spent: ${formatValue(peakMonth.amount)}`,
      icon: Calendar,
      iconBg: '#fdf2f8',
      iconColor: '#ec4899'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '14px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e4e8f5',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '10px',
              boxShadow: '0 1px 3px rgba(20, 26, 51, 0.03)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top row: Label and Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: card.iconBg,
                    color: card.iconColor
                  }}
                >
                  <IconComponent size={15} strokeWidth={2.4} />
                </span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#6a7392', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {card.label}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: card.badgeColor,
                  color: card.badgeTextColor,
                  whiteSpace: 'nowrap'
                }}
              >
                {card.badge}
              </span>
            </div>

            {/* Value */}
            <div style={{ marginTop: '2px' }}>
              <div
                style={{
                  fontSize: card.isTextValue ? '17px' : '20px',
                  fontWeight: '800',
                  color: '#141a33',
                  lineHeight: '1.2',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={String(card.value)}
              >
                {card.value}
              </div>
              <div style={{ fontSize: '11.5px', color: '#6a7392', marginTop: '4px', lineHeight: '1.3' }}>
                {card.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
