import React, { useState } from 'react';
import { Users, ShieldCheck, Database, Settings as SettingsIcon } from 'lucide-react';
import UserControl from './UserControl';
import PageControl from './PageControl';
import DatabaseManager from './DatabaseManager';

export default function SettingsPage({
  currentUser,
  users = [],
  permissions = [],
  onRefreshUsers,
  onRefreshPermissions,
  onRefreshData
}) {
  const [activeSection, setActiveSection] = useState('users'); // 'users' | 'pages' | 'database'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Settings Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #eef2f6',
        paddingBottom: '14px'
      }}>
        <button
          type="button"
          onClick={() => setActiveSection('users')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 18px',
            borderRadius: '9999px',
            fontSize: '12.5px',
            fontWeight: activeSection === 'users' ? '700' : '600',
            backgroundColor: activeSection === 'users' ? '#4f46e5' : '#ffffff',
            color: activeSection === 'users' ? '#ffffff' : '#475569',
            border: activeSection === 'users' ? '1px solid #4f46e5' : '1px solid #cbd5e1',
            cursor: 'pointer',
            boxShadow: activeSection === 'users' ? '0 2px 6px rgba(79,70,229,0.28)' : 'none'
          }}
        >
          <Users size={14} />
          <span>User Control ({users.length} Accounts)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('pages')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 18px',
            borderRadius: '9999px',
            fontSize: '12.5px',
            fontWeight: activeSection === 'pages' ? '700' : '600',
            backgroundColor: activeSection === 'pages' ? '#4f46e5' : '#ffffff',
            color: activeSection === 'pages' ? '#ffffff' : '#475569',
            border: activeSection === 'pages' ? '1px solid #4f46e5' : '1px solid #cbd5e1',
            cursor: 'pointer',
            boxShadow: activeSection === 'pages' ? '0 2px 6px rgba(79,70,229,0.28)' : 'none'
          }}
        >
          <ShieldCheck size={14} />
          <span>Page Access & Permissions</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('database')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 18px',
            borderRadius: '9999px',
            fontSize: '12.5px',
            fontWeight: activeSection === 'database' ? '700' : '600',
            backgroundColor: activeSection === 'database' ? '#4f46e5' : '#ffffff',
            color: activeSection === 'database' ? '#ffffff' : '#475569',
            border: activeSection === 'database' ? '1px solid #4f46e5' : '1px solid #cbd5e1',
            cursor: 'pointer',
            boxShadow: activeSection === 'database' ? '0 2px 6px rgba(79,70,229,0.28)' : 'none'
          }}
        >
          <Database size={14} />
          <span>Database & SQL Dump Manager</span>
        </button>
      </div>

      {/* SECTION 1: USER CONTROL */}
      {activeSection === 'users' && (
        <UserControl
          users={users}
          currentUser={currentUser}
          onRefreshUsers={onRefreshUsers}
        />
      )}

      {/* SECTION 2: PAGE ACCESS CONTROL */}
      {activeSection === 'pages' && (
        <PageControl
          currentUser={currentUser}
          permissions={permissions}
          onRefreshPermissions={onRefreshPermissions}
        />
      )}

      {/* SECTION 3: DATABASE & SQL DUMP MANAGER */}
      {activeSection === 'database' && (
        <DatabaseManager
          onRefreshData={onRefreshData}
        />
      )}

    </div>
  );
}
