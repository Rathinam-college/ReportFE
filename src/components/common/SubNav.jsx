import React, { useState } from 'react';
import { Utensils, Home, Bus, Video, ClipboardCheck, ShoppingCart, Package, ClipboardList, Search, Bell, Database, User } from 'lucide-react';

export default function SubNav({
  currentUser,
  dbStatus = 'connected',
  activeTab,
  dashboardSubTab,
  setDashboardSubTab,
  dataEntrySubTab,
  setDataEntrySubTab,
  masterDataSubTab,
  setMasterDataSubTab
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const modules = [
    { id: 'food', label: 'Food', icon: Utensils },
    { id: 'hostel', label: 'Hostel', icon: Home },
    { id: 'transport', label: 'Transport', icon: Bus },
    { id: 'audit', label: 'Audit', icon: ClipboardCheck },
    { id: 'purchase', label: 'Purchase', icon: ShoppingCart },
    { id: 'store', label: 'Store', icon: Package },
    { id: 'asset_audit', label: 'Asset Audit', icon: ClipboardList },
    { id: 'cctv', label: 'CCTV', icon: Video }
  ];

  const currentSub = activeTab === 'dashboard' 
    ? (dashboardSubTab || 'food') 
    : (activeTab === 'data_entry' ? dataEntrySubTab : masterDataSubTab);

  const getInitials = (user) => {
    if (!user?.full_name && !user?.username) return 'RG';
    const name = user.full_name || user.username;
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getPageTitle = () => {
    if (activeTab === 'dashboard') return 'Dashboard';
    if (activeTab === 'data_entry') return 'Data Entry';
    if (activeTab === 'master_data') return 'Master Data';
    return 'Settings & Controls';
  };

  return (
    <header 
      className="bento-subnav-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        padding: '10px 24px 8px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(225, 230, 242, 0.9)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        boxSizing: 'border-box',
        flexWrap: 'wrap',
        flexShrink: 0
      }}
    >
      {/* 1. LEFT: PRIMARY TITLE (Matching 'Primary \n Dashboard' in Image) */}
      <div className="bento-subnav-title" style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#8c7ae6',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          Primary
        </span>
        <h1 style={{
          fontSize: '21px',
          fontWeight: '800',
          color: '#1a1d36',
          margin: 0,
          letterSpacing: '-0.02em',
          lineHeight: 1.2
        }}>
          {getPageTitle()}
        </h1>
      </div>

      {/* 2. CENTER: MODULE SWITCHER PILLS (Food, Hostel, Transport) */}
      {activeTab !== 'settings' && (
        <div 
          className="bento-subnav-modules"
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f1f3f9',
            padding: '4px',
            borderRadius: '9999px',
            gap: '4px'
          }}
        >
          {modules.map(mod => {
            const Icon = mod.icon;
            const isSelected = currentSub === mod.id;

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  if (activeTab === 'dashboard') setDashboardSubTab?.(mod.id);
                  else if (activeTab === 'data_entry') setDataEntrySubTab(mod.id);
                  else setMasterDataSubTab(mod.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 18px',
                  borderRadius: '9999px',
                  fontSize: '12.5px',
                  fontWeight: isSelected ? '800' : '600',
                  backgroundColor: isSelected ? '#6c56db' : 'transparent',
                  color: isSelected ? '#ffffff' : '#6e768e',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isSelected ? '0 4px 14px rgba(108, 86, 219, 0.35)' : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={14} color={isSelected ? '#ffffff' : '#8f9bb3'} />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. RIGHT: SEARCH PILL & USER PROFILE (Matching Top Right in Image) */}
      <div 
        className="bento-subnav-right"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexShrink: 0
        }}
      >
        {/* Sleek Pill Search Bar */}
        <div 
          className="bento-subnav-search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f1f3f9',
            padding: '6px 16px',
            borderRadius: '9999px',
            border: '1px solid #eef1f8',
            minWidth: '180px'
          }}
        >
          <Search size={14} color="#8f9bb3" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '12px',
              color: '#1a1d36',
              width: '100%',
              fontWeight: '500'
            }}
          />
        </div>

        {/* User Circular Avatar & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #745df0 0%, #5d44db 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '800',
            boxShadow: '0 4px 10px rgba(108, 86, 219, 0.25)',
            border: '2px solid #ffffff'
          }}>
            {getInitials(currentUser)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#1a1d36', lineHeight: 1.2 }}>
              {currentUser?.full_name || currentUser?.username || 'Executive'}
            </span>
            <span style={{ fontSize: '10.5px', fontWeight: '600', color: '#8f9bb3' }}>
              {currentUser?.role === 'admin' ? 'Administrator' : 'Manager'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
