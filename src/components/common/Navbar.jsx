import React, { useState } from 'react';
import { 
  Home, FileSpreadsheet, SlidersHorizontal, 
  ShieldCheck, Bell, LogOut, Sparkles, Building2, HelpCircle
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  handleLogout,
  permissions = [],
  dbStatus = 'connected'
}) {
  const [hoveredTab, setHoveredTab] = useState(null);

  const allTabs = [
    { id: 'dashboard', label: 'Home', fullLabel: 'Dashboard', icon: Home },
    { id: 'data_entry', label: 'Entry', fullLabel: 'Data Entry', icon: FileSpreadsheet },
    { id: 'master_data', label: 'Master', fullLabel: 'Master Data', icon: SlidersHorizontal },
    { id: 'settings', label: 'Admin', fullLabel: 'Settings', icon: ShieldCheck }
  ];

  // Filter tabs by role permissions (100% preserved)
  const visibleTabs = allTabs.filter(tab => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const perm = permissions.find(p => p.role === currentUser.role && p.page_id === tab.id);
    return perm ? perm.can_access : true;
  });

  return (
    <aside 
      className="bento-navbar-aside"
      style={{
        width: '84px',
        minWidth: '84px',
        height: 'calc(100% - 24px)',
        flexShrink: 0,
        margin: '12px 0 12px 12px',
        borderRadius: '24px',
        background: 'linear-gradient(180deg, #745df0 0%, #5d44db 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 0 14px 0',
        boxSizing: 'border-box',
        position: 'relative',
        userSelect: 'none',
        boxShadow: '0 12px 35px rgba(108, 86, 219, 0.28)',
        zIndex: 10
      }}
    >
      {/* TOP SECTION: NOTIFICATION BELL & BRAND */}
      <div className="nav-top-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
        
        {/* Top Notification Bell in Pill Circle (Matching Image 1) */}
        <button
          className="nav-bell-btn"
          type="button"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(8px)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.28)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)'}
          title="Notifications & Alerts"
        >
          <Bell size={18} strokeWidth={2.2} />
        </button>

        {/* Small Brand Dot Indicator */}
        <div 
          className="nav-brand-dot"
          onClick={() => {
            setActiveTab('dashboard');
            window.location.hash = 'dashboard';
          }}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#ff6088',
            boxShadow: '0 0 8px #ff6088',
            cursor: 'pointer'
          }}
          title="Rathinam Group"
        />

        {/* Vertical Stack of Navigation Pill Icons */}
        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          marginTop: '6px'
        }}>
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isHovered = hoveredTab === tab.id;

            return (
              <button
                key={tab.id}
                className="nav-item-btn"
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  window.location.hash = tab.id;
                }}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  border: 'none',
                  backgroundColor: isActive 
                    ? '#39287a' 
                    : (isHovered ? 'rgba(255, 255, 255, 0.16)' : 'transparent'),
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 8px 20px rgba(45, 25, 110, 0.35)' : 'none',
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                  position: 'relative'
                }}
                title={tab.fullLabel}
              >
                <Icon 
                  size={20} 
                  color="#ffffff" 
                  strokeWidth={isActive ? 2.5 : 2} 
                  style={{ opacity: isActive ? 1 : 0.75 }}
                />
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: isActive ? '800' : '600',
                  opacity: isActive ? 1 : 0.75,
                  letterSpacing: '0.02em',
                  lineHeight: 1
                }}>
                  {tab.label}
                </span>

                {/* Active Indicator Pip */}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    right: '-4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '4px',
                    height: '14px',
                    borderRadius: '9999px',
                    backgroundColor: '#ff6088'
                  }} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM SECTION: SUPPORT & LOGOUT (Matching Image Bottom Dock) */}
      <div className="nav-bottom-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
        
        {/* Support Pill Button */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'}
          title="System Help & Support"
        >
          <HelpCircle size={17} style={{ opacity: 0.85 }} />
        </button>

        {/* Logout Pill Button in Translucent Circle (Matching Image Exit Icon) */}
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(8px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 96, 136, 0.35)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
            e.currentTarget.style.color = '#ffffff';
          }}
          title="Log Out of System"
        >
          <LogOut size={18} strokeWidth={2.2} />
        </button>
      </div>
    </aside>
  );
}
