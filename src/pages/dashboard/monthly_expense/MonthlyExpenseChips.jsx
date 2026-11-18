import React from 'react';

export default function MonthlyExpenseChips({
  chartModel,
  setChartModel,
  models = []
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        padding: '6px 4px',
        width: '100%',
        boxSizing: 'border-box',
        flexShrink: 0,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px',
          backgroundColor: '#f1f5f9',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          width: '100%',
          overflowX: 'auto'
        }}
      >
        {models.map((model) => {
          const isActive = chartModel === model.id;
          const IconComponent = model.icon;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => setChartModel(model.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '9px',
                border: isActive ? '1px solid #4338ca' : '1px solid transparent',
                backgroundColor: isActive ? '#4f46e5' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                fontSize: '12px',
                fontWeight: isActive ? '700' : '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: isActive
                  ? '0 3px 10px rgba(79, 70, 229, 0.3)'
                  : '0 1px 2px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.color = '#0f172a';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.color = '#475569';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              {IconComponent && <IconComponent size={14} strokeWidth={isActive ? 2.5 : 2} />}
              <span>{model.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
