import React from 'react';
import { Utensils, Home, Bus } from 'lucide-react';

export default function SubNav({
  activeTab,
  dataEntrySubTab,
  setDataEntrySubTab,
  masterDataSubTab,
  setMasterDataSubTab
}) {
  if (activeTab !== 'data_entry' && activeTab !== 'master_data') {
    return null;
  }

  const modules = [
    { id: 'food', label: 'Food & Dining', icon: Utensils, status: 'Active' },
    { id: 'hostel', label: 'Hostel Occupancy', icon: Home, status: 'Active' },
    { id: 'transport', label: 'Transport Fleet', icon: Bus, status: 'Active' }
  ];

  const currentSub = activeTab === 'data_entry' ? dataEntrySubTab : masterDataSubTab;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #cbd5e1',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '48px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginRight: '6px' }}>
          {activeTab === 'data_entry' ? 'Data Entry Module:' : 'Master Data Module:'}
        </span>

        {modules.map(mod => {
          const Icon = mod.icon;
          const isSelected = currentSub === mod.id;

          return (
            <button
              key={mod.id}
              onClick={() => {
                if (activeTab === 'data_entry') setDataEntrySubTab(mod.id);
                else setMasterDataSubTab(mod.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12.5px',
                fontWeight: isSelected ? '700' : '500',
                backgroundColor: isSelected ? '#eef2ff' : '#f8fafc',
                color: isSelected ? '#4f46e5' : '#64748b',
                border: isSelected ? '1.5px solid #6366f1' : '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              <Icon size={14} />
              <span>{mod.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: '12px', color: '#64748b' }}>
        {activeTab === 'data_entry' && 'Matrix Entry: Select month to edit • Subtotals & Totals update live'}
        {activeTab === 'master_data' && 'Drag & Drop rows to reorder • Add/Edit Category & Description'}
      </div>
    </div>
  );
}
