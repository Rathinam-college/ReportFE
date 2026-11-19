import React from 'react';
import { FileText } from 'lucide-react';

export default function BreadcrumbHeader({
  activeTab,
  dataEntrySubTab,
  masterDataSubTab,
  activePeriodObj
}) {
  const getSubLabel = (tab) => {
    if (tab === 'food') return 'Food';
    if (tab === 'hostel') return 'Hostel';
    return 'Transport';
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '18px',
      padding: '10px 20px',
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      border: '1px solid #edf0f8',
      boxShadow: '0 2px 10px rgba(110, 80, 180, 0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '9999px',
          backgroundColor: '#efeefc',
          border: '1px solid #d8d4fa',
          fontSize: '12px',
          fontWeight: '700',
          color: '#6c56db'
        }}>
          <FileText size={13} color="#6c56db" />
          <span>Report</span>
        </div>

        <span style={{ color: '#8f9bb3', fontWeight: '400', fontSize: '14px' }}>/</span>

        <span style={{ fontSize: '14px', fontWeight: '800', color: '#1a1d36' }}>
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
