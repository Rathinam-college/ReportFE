import React from 'react';
import { FileText } from 'lucide-react';

export default function BreadcrumbHeader({
  activeTab,
  dataEntrySubTab,
  masterDataSubTab,
  activePeriodObj
}) {
  const getSubLabel = (tab) => {
    if (tab === 'food') return 'Food & Dining Operations';
    if (tab === 'hostel') return 'Hostel Occupancy';
    return 'Transport Fleet';
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '20px',
      padding: '12px 20px',
      backgroundColor: '#ffffff',
      borderRadius: '10px',
      border: '1px solid #cbd5e1',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '6px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0',
          fontSize: '12px',
          fontWeight: '700',
          color: '#475569'
        }}>
          <FileText size={14} color="#2563eb" />
          <span>Report</span>
        </div>

        <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '15px' }}>/</span>

        <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
          {activeTab === 'dashboard' && 'Dashboard Overview'}
          {activeTab === 'data_entry' && 'Data Entry'}
          {activeTab === 'master_data' && 'Master Data Configuration'}
          {activeTab === 'settings' && 'System Settings & Controls'}
        </span>

        {(activeTab === 'data_entry' || activeTab === 'master_data') && (
          <>
            <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '15px' }}>/</span>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#2563eb',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '2px 8px',
              borderRadius: '5px'
            }}>
              {getSubLabel(activeTab === 'data_entry' ? dataEntrySubTab : masterDataSubTab)}
            </span>
          </>
        )}

        {activeTab === 'data_entry' && activePeriodObj && (
          <>
            <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '15px' }}>/</span>
            <span style={{
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#047857',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '2px 8px',
              borderRadius: '5px'
            }}>
              Editing Cycle: {activePeriodObj.period_label}
            </span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          Rathinam Group • FY 2026–2027
        </span>
      </div>
    </div>
  );
}
