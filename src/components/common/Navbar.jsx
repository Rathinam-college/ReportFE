import React, { useState } from 'react';
import { LogOut } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  handleLogout,
  permissions = [],
  dbStatus = 'connected'
}) {
  const [hoveredTab, setHoveredTab] = useState(null);
  const [logoutHovered, setLogoutHovered] = useState(false);

  const allTabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'data_entry', label: 'Data Entry' },
    { id: 'master_data', label: 'Master Data' },
    { id: 'settings', label: 'Settings' }
  ];

  // Filter tabs by role permissions
  const visibleTabs = allTabs.filter(tab => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const perm = permissions.find(p => p.role === currentUser.role && p.page_id === tab.id);
    return perm ? perm.can_access : true;
  });

  const getInitials = (user) => {
    if (user?.role === 'gm') return 'GM';
    if (!user?.full_name) return 'U';
    const parts = user.full_name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const getRoleDisplayName = (user) => {
    if (user?.role === 'gm') return 'General Manager / Director';
    if (user?.role === 'admin') return 'Administrator';
    if (user?.role === 'supervisor') return 'Dining Supervisor';
    if (user?.role === 'auditor') return 'Operations Auditor';
    return user?.full_name || 'Staff User';
  };

  return (
    <header style={{
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      color: '#0f172a',
      padding: '0 28px',
      borderBottom: '1px solid #eef2f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'nowrap',
      height: '66px',
      minHeight: '66px',
      position: 'relative',
      boxShadow: 'none',
      boxSizing: 'border-box',
      width: '100%'
    }}>
      {/* Brand Identity */}
      <div
        onClick={() => setActiveTab('dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          flexShrink: 0,
          userSelect: 'none'
        }}
        title="Go to Dashboard"
      >
        <img
          src={`${import.meta.env.BASE_URL}rathinam_logo.png`}
          alt="Rathinam Group"
          style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div style={{
          fontSize: '16px',
          fontWeight: '800',
          color: '#0f172a',
          letterSpacing: '-0.02em',
          lineHeight: 1.2
        }}>
          Rathinam Group
        </div>
      </div>

      {/* Center Pill Navigation Switcher */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f1f3f9',
        padding: '4px',
        borderRadius: '9999px',
        gap: '4px',
        flexShrink: 0,
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'
      }}>
        {visibleTabs.map(tab => {
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                padding: '7px 22px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: isActive ? '700' : '600',
                color: isActive ? '#ffffff' : isHovered ? '#0f172a' : '#475569',
                backgroundColor: isActive ? '#4f46e5' : isHovered ? '#e2e8f0' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 8px rgba(79, 70, 229, 0.32)' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Database status + Profile */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexShrink: 0
      }}>
        {/* PostgreSQL 18 Status Pill (Real DB connection state) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '9999px',
          backgroundColor: dbStatus === 'connected' ? '#ecfdf5' : dbStatus === 'checking' ? '#fffbeb' : '#fef2f2',
          border: `1px solid ${dbStatus === 'connected' ? '#a7f3d0' : dbStatus === 'checking' ? '#fef3c7' : '#fecaca'}`,
          fontSize: '11.5px',
          fontWeight: '600',
          color: dbStatus === 'connected' ? '#047857' : dbStatus === 'checking' ? '#b45309' : '#b91c1c'
        }}>
          <span style={{
            width: '6.5px',
            height: '6.5px',
            borderRadius: '50%',
            backgroundColor: dbStatus === 'connected' ? '#10b981' : dbStatus === 'checking' ? '#f59e0b' : '#ef4444',
            display: 'inline-block',
            boxShadow: dbStatus === 'connected' ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none'
          }} />
          <span>{dbStatus === 'connected' ? 'PostgreSQL 18' : dbStatus === 'checking' ? 'Connecting...' : 'DB Offline'}</span>
        </div>

        {/* Clean Subtle Vertical Divider */}
        <div style={{
          width: '1px',
          height: '22px',
          backgroundColor: '#e2e8f0'
        }} />

        {/* User Profile Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#4338ca',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '0.02em',
            boxShadow: '0 2px 4px rgba(67, 56, 202, 0.25)'
          }}>
            {getInitials(currentUser)}
          </div>
          <span style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#0f172a',
            whiteSpace: 'nowrap'
          }}>
            {getRoleDisplayName(currentUser)}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          onMouseEnter={() => setLogoutHovered(true)}
          onMouseLeave={() => setLogoutHovered(false)}
          title="Sign Out"
          style={{
            padding: '7px',
            borderRadius: '8px',
            color: logoutHovered ? '#ef4444' : '#94a3b8',
            backgroundColor: logoutHovered ? '#fee2e2' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
