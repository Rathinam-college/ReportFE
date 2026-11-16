import React, { useState } from 'react';
import { Utensils, Home, Bus } from 'lucide-react';

export default function SubNav({
  activeTab,
  dashboardSubTab,
  setDashboardSubTab,
  dataEntrySubTab,
  setDataEntrySubTab,
  masterDataSubTab,
  setMasterDataSubTab
}) {
  const [hoveredMod, setHoveredMod] = useState(null);

  if (activeTab !== 'dashboard' && activeTab !== 'data_entry' && activeTab !== 'master_data') {
    return null;
  }

  const modules = [
    { id: 'food', label: 'Food & Dining', icon: Utensils },
    { id: 'hostel', label: 'Hostel Occupancy', icon: Home },
    { id: 'transport', label: 'Transport Fleet', icon: Bus }
  ];

  const currentSub = activeTab === 'dashboard' 
    ? (dashboardSubTab || 'food') 
    : (activeTab === 'data_entry' ? dataEntrySubTab : masterDataSubTab);

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #eef2f6',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '50px',
      minHeight: '50px',
      position: 'sticky',
      top: '66px',
      zIndex: 990,
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      boxSizing: 'border-box'
    }}>
      {/* Module Pill Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{
          fontSize: '11px',
          fontWeight: '800',
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginRight: '6px'
        }}>
          {activeTab === 'dashboard' ? 'Dashboard Module:' : (activeTab === 'data_entry' ? 'Data Entry Module:' : 'Master Data Module:')}
        </span>

        {modules.map(mod => {
          const Icon = mod.icon;
          const isSelected = currentSub === mod.id;
          const isHovered = hoveredMod === mod.id;

          return (
            <button
              key={mod.id}
              onClick={() => {
                if (activeTab === 'dashboard') setDashboardSubTab?.(mod.id);
                else if (activeTab === 'data_entry') setDataEntrySubTab(mod.id);
                else setMasterDataSubTab(mod.id);
              }}
              onMouseEnter={() => setHoveredMod(mod.id)}
              onMouseLeave={() => setHoveredMod(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '9999px',
                fontSize: '12.5px',
                fontWeight: isSelected ? '700' : '600',
                backgroundColor: isSelected ? '#eef2ff' : isHovered ? '#f1f5f9' : '#f8fafc',
                color: isSelected ? '#4f46e5' : isHovered ? '#0f172a' : '#64748b',
                border: isSelected ? '1.5px solid #6366f1' : '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                boxShadow: isSelected ? '0 1px 3px rgba(99, 102, 241, 0.15)' : 'none'
              }}
            >
              <Icon size={14} color={isSelected ? '#4f46e5' : '#64748b'} />
              <span>{mod.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Guide / Context Text */}
      <div style={{
        fontSize: '12px',
        color: '#64748b',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '45%'
      }}>
        {activeTab === 'dashboard' && `Overview & Executive KPIs for ${currentSub === 'food' ? 'Food & Dining' : currentSub === 'hostel' ? 'Hostel Resident Facilities' : 'Transport Fleet Operations'}`}
        {activeTab === 'data_entry' && 'Matrix Entry: Select month to edit • Subtotals & Totals update live'}
        {activeTab === 'master_data' && 'Drag & Drop rows to reorder • Add/Edit Category & Description'}
      </div>
    </div>
  );
}
