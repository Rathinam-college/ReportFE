import React from 'react';
import { LogOut } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  handleLogout,
  permissions = [],
  dbStatus = 'connected'
}) {
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
      backgroundColor: '#ffffff',
      color: '#0f172a',
      padding: '0 32px',
      borderBottom: '1px solid #eef2f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      height: '66px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
    }}>
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src={`${import.meta.env.BASE_URL}rathinam_logo.png`}
          alt="Rathinam Group"
          style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div>
          <div style={{ fontSize: '10.5px', fontWeight: '700', letterSpacing: '0.04em', color: '#6366f1', lineHeight: 1.1 }}>
            Rathinam Group
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            Operations ERP
          </div>
        </div>
      </div>

      {/* Center Pill Navigation Switcher */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f1f3f9',
        padding: '4px',
        borderRadius: '9999px',
        gap: '4px'
      }}>
        {visibleTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 20px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: isActive ? '700' : '600',
                color: isActive ? '#ffffff' : '#475569',
                backgroundColor: isActive ? '#4f46e5' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 6px rgba(79, 70, 229, 0.28)' : 'none'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Database status + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: dbStatus === 'connected' ? '#10b981' : dbStatus === 'checking' ? '#f59e0b' : '#ef4444',
            display: 'inline-block'
          }} />
          <span>{dbStatus === 'connected' ? 'PostgreSQL 18' : dbStatus === 'checking' ? 'Connecting...' : 'DB Offline'}</span>
        </div>

        {/* Small subtle status ring */}
        <div style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          border: '1.5px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '11px',
          fontWeight: '700'
        }}>
          ●
        </div>

        {/* User Profile Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '800'
          }}>
            {getInitials(currentUser)}
          </div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
            {getRoleDisplayName(currentUser)}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          style={{
            padding: '6px',
            color: '#94a3b8',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
