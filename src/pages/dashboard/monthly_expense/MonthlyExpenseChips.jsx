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
        padding: '2px 0 4px 0',
        width: '100%',
        scrollbarWidth: 'thin'
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
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: isActive ? '1px solid #5b5bf0' : '1px solid #e4e8f5',
              backgroundColor: isActive ? '#5b5bf0' : '#ffffff',
              color: isActive ? '#ffffff' : '#475569',
              fontSize: '12px',
              fontWeight: isActive ? '700' : '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: isActive ? '0 2px 6px rgba(91,91,240,0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {IconComponent && <IconComponent size={13} strokeWidth={2.2} />}
            <span>{model.name}</span>
          </button>
        );
      })}
    </div>
  );
}
