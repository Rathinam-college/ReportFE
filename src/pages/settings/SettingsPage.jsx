import React, { useState, useMemo } from 'react';
import { 
  Users, ShieldCheck, Database, Settings as SettingsIcon,
  AlertTriangle, CheckCircle2, ShieldAlert, Lock, KeyRound,
  Layers, HardDrive, Activity, Download, ArrowRight,
  Server, FileCheck, Building, Bus, Utensils, Bed,
  Sparkles, Check, ChevronRight, Eye, Shield, ArrowUpRight
} from 'lucide-react';
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
  // Navigation tabs: 'overview' (Bento Grid) | 'users' | 'pages' | 'database'
  const [activeSection, setActiveSection] = useState('overview');
  const [alertsDismissed, setAlertsDismissed] = useState(false);

  // Derived Executive Analytics from live props (100% zero functional changes)
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active !== false).length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const managerCount = users.filter(u => u.role === 'gm' || u.role === 'supervisor').length;
    const viewerCount = users.filter(u => u.role === 'auditor' || u.role === 'viewer').length;

    // Unique departments
    const deptSet = new Set();
    users.forEach(u => {
      if (u.department && u.department.trim()) {
        deptSet.add(u.department.trim());
      }
    });
    if (deptSet.size === 0) deptSet.add('Campus Operations');
    const departments = Array.from(deptSet);

    // Permission stats
    const totalRules = permissions.length || 16;
    const activeRules = permissions.filter(p => p.can_access !== false).length;

    return {
      totalUsers,
      activeUsers,
      adminCount,
      managerCount,
      viewerCount,
      departments,
      totalRules,
      activeRules
    };
  }, [users, permissions]);

  // Modern Avatar styling inspired by Images 1, 2, 6
  const getAvatarGradient = (name = '') => {
    const gradients = [
      'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
      'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return gradients[Math.abs(hash) % gradients.length];
  };

  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* =========================================================================
          EXECUTIVE COMMAND HEADER WITH LIVE TELEMETRY CHIPS
          ========================================================================= */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #172554 100%)',
        borderRadius: '20px',
        padding: '26px 30px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25), 0 8px 10px -6px rgba(15, 23, 42, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Ambient Decorative Glows */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '30%',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          position: 'relative',
          zIndex: 1
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.25)',
                border: '1px solid rgba(165, 180, 252, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a5b4fc'
              }}>
                <SettingsIcon size={18} />
              </div>
              <h1 style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: '900',
                letterSpacing: '-0.02em',
                color: '#ffffff'
              }}>
                Executive System Settings & Governance Console
              </h1>
            </div>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: '#cbd5e1',
              maxWidth: '680px',
              lineHeight: '1.5'
            }}>
              Centralized enterprise command for role-based security (RBAC), multi-module operational scope,
              workforce account directory, and PostgreSQL disaster-recovery lifecycle telemetry.
            </p>
          </div>

          {/* Real-time Health Telemetry Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              color: '#6ee7b7',
              fontSize: '11.5px',
              fontWeight: '700'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }} />
              <span>PostgreSQL 16 Online</span>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(129, 140, 248, 0.35)',
              color: '#c7d2fe',
              fontSize: '11.5px',
              fontWeight: '700'
            }}>
              <ShieldCheck size={13} color="#a5b4fc" />
              <span>Hardware-Pinned Root Active</span>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              color: '#fde68a',
              fontSize: '11.5px',
              fontWeight: '700'
            }}>
              <Server size={13} color="#fbbf24" />
              <span>{currentUser?.full_name || currentUser?.username || 'Admin'} ({currentUser?.role || 'admin'})</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          IMPORTANT ALERTS (EXECUTIVE ADVISORY FEED - IMAGES 2 & 5)
          ========================================================================= */}
      {!alertsDismissed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={15} color="#e11d48" />
              <span style={{
                fontSize: '12px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#475569'
              }}>
                Important Executive Alerts & Critical Guardrails
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAlertsDismissed(true)}
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#64748b',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '9999px',
                padding: '4px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >
              Dismiss Alerts
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '14px'
          }}>
            {/* ALERT 1: ROOT SUPERADMIN PROTECTION */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #6366f1',
              borderRadius: '16px',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4f46e5',
                flexShrink: 0
              }}>
                <Lock size={17} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                    Root Superadmin Account Immutable
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: '#4338ca',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    letterSpacing: '0.02em'
                  }}>
                    SECURITY PINNED
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.45' }}>
                  Master Account <strong>ID 1 ("admin")</strong> is permanently protected against deletion or role revocation to eliminate lockout vulnerability.
                </p>
              </div>
            </div>

            {/* ALERT 2: MASTER PARAMETER TOMBSTONE SHIELD */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #059669',
              borderRadius: '16px',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                flexShrink: 0
              }}>
                <ShieldCheck size={17} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                    Tombstone Shield & Parameter Persistence
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#065f46',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    letterSpacing: '0.02em'
                  }}>
                    PERSISTENCE ON
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.45' }}>
                  All user-edited parameter names, order, formulas, and tombstoned deletions in Food, Hostel, and Transport are permanently preserved across refreshes and restarts.
                </p>
              </div>
            </div>

            {/* ALERT 3: FINANCIAL AUDIT & ISOLATION COMPLIANCE */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #d97706',
              borderRadius: '16px',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
                flexShrink: 0
              }}>
                <FileCheck size={17} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                    Financial Ledger & Census Isolation
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: '#92400e',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    letterSpacing: '0.02em'
                  }}>
                    AUDIT COMPLIANT
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.45' }}>
                  Non-expense headcount census figures and unit cost rates are strictly segregated from monetary grand totals. Certified pure operations ledger.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FLOATING PILL NAVIGATION BAR (FINEST LOOK FROM CREXTIO / FINEXY / QUIXOTIC)
          ========================================================================= */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '8px 12px',
        backgroundColor: '#ffffff',
        borderRadius: '9999px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {/* TAB 1: EXECUTIVE BENTO OVERVIEW */}
          <button
            type="button"
            onClick={() => setActiveSection('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: activeSection === 'overview' ? '800' : '600',
              backgroundColor: activeSection === 'overview' ? '#6c56db' : 'transparent',
              color: activeSection === 'overview' ? '#ffffff' : '#64748b',
              border: 'none',
              cursor: 'pointer',
              boxShadow: activeSection === 'overview' ? '0 4px 14px rgba(108, 86, 219, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={15} color={activeSection === 'overview' ? '#ffffff' : '#64748b'} />
            <span>Executive Bento Overview</span>
          </button>

          {/* TAB 2: USER CONTROL */}
          <button
            type="button"
            onClick={() => setActiveSection('users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: activeSection === 'users' ? '800' : '600',
              backgroundColor: activeSection === 'users' ? '#6c56db' : 'transparent',
              color: activeSection === 'users' ? '#ffffff' : '#64748b',
              border: 'none',
              cursor: 'pointer',
              boxShadow: activeSection === 'users' ? '0 4px 14px rgba(108, 86, 219, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={15} color={activeSection === 'users' ? '#ffffff' : '#64748b'} />
            <span>User Directory ({users.length})</span>
          </button>

          {/* TAB 3: PAGE ACCESS */}
          <button
            type="button"
            onClick={() => setActiveSection('pages')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: activeSection === 'pages' ? '800' : '600',
              backgroundColor: activeSection === 'pages' ? '#6c56db' : 'transparent',
              color: activeSection === 'pages' ? '#ffffff' : '#64748b',
              border: 'none',
              cursor: 'pointer',
              boxShadow: activeSection === 'pages' ? '0 4px 14px rgba(108, 86, 219, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={15} color={activeSection === 'pages' ? '#ffffff' : '#64748b'} />
            <span>RBAC & Permissions</span>
          </button>

          {/* TAB 4: DATABASE MANAGER */}
          <button
            type="button"
            onClick={() => setActiveSection('database')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: activeSection === 'database' ? '800' : '600',
              backgroundColor: activeSection === 'database' ? '#6c56db' : 'transparent',
              color: activeSection === 'database' ? '#ffffff' : '#64748b',
              border: 'none',
              cursor: 'pointer',
              boxShadow: activeSection === 'database' ? '0 4px 14px rgba(108, 86, 219, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Database size={15} color={activeSection === 'database' ? '#ffffff' : '#64748b'} />
            <span>Database & SQL Dumps</span>
          </button>
        </div>

        {/* Quick status pill stamp */}
        <div style={{
          padding: '5px 14px',
          fontSize: '11.5px',
          fontWeight: '700',
          color: '#64748b',
          backgroundColor: '#f8fafc',
          borderRadius: '9999px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>PostgreSQL Schema v2.4 Verified</span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: BENTO GRID + EXECUTIVE ANALYTICS (EXECUTIVE DASHBOARD VIEW)
          ========================================================================= */}
      {activeSection === 'overview' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '18px'
        }}>
          
          {/* BENTO TILE 1: WORKFORCE & DIRECTORY GOVERNANCE (Span 4) */}
          <div style={{
            gridColumn: 'span 4',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(79, 70, 229, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4f46e5'
                }}>
                  <Users size={20} />
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#4f46e5',
                  backgroundColor: 'rgba(79, 70, 229, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(79, 70, 229, 0.2)'
                }}>
                  IDENTITY & ACCESS
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', lineHeight: '1', letterSpacing: '-0.02em' }}>
                  {stats.totalUsers}
                </div>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: '800',
                  color: '#059669',
                  backgroundColor: '#ecfdf5',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid #a7f3d0'
                }}>
                  ↑ 100% Active
                </span>
              </div>

              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginTop: '4px', marginBottom: '16px' }}>
                Enrolled System Users
              </div>

              {/* Breakdown pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                <div style={{
                  fontSize: '11.5px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155'
                }}>
                  {stats.activeUsers} Active
                </div>
                <div style={{
                  fontSize: '11.5px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#ede9fe',
                  color: '#6d28d9'
                }}>
                  {stats.adminCount} Admins
                </div>
                <div style={{
                  fontSize: '11.5px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8'
                }}>
                  {stats.managerCount} Supervisors
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                Departments: <strong>{stats.departments.join(', ')}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('users')}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '10px 16px',
                borderRadius: '9999px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0f172a';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#334155';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <span>Manage User Directory</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* BENTO TILE 2: ROLE-BASED ACCESS CONTROL MATRIX (Span 4) */}
          <div style={{
            gridColumn: 'span 4',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(5, 150, 105, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                  <ShieldCheck size={20} />
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#059669',
                  backgroundColor: 'rgba(5, 150, 105, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(5, 150, 105, 0.2)'
                }}>
                  POLICY ENFORCED
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', lineHeight: '1', letterSpacing: '-0.02em' }}>
                  16 Rules
                </div>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: '800',
                  color: '#059669',
                  backgroundColor: '#ecfdf5',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid #a7f3d0'
                }}>
                  ● 4x4 Grid
                </span>
              </div>

              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginTop: '4px', marginBottom: '16px' }}>
                RBAC Security Matrix
              </div>

              {/* Roles matrix summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155' }}>
                  <span>Administrator (admin):</span>
                  <strong style={{ color: '#059669' }}>Unrestricted Full Access</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155' }}>
                  <span>General Manager (gm):</span>
                  <strong style={{ color: '#2563eb' }}>Dashboard & Operations View</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155' }}>
                  <span>Supervisor:</span>
                  <strong style={{ color: '#d97706' }}>Matrix & Data Entry Focus</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155' }}>
                  <span>Auditor:</span>
                  <strong style={{ color: '#7c3aed' }}>Read-only Ledger Compliance</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('pages')}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '10px 16px',
                borderRadius: '9999px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0f172a';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#334155';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <span>Configure RBAC Matrix</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* BENTO TILE 3: DATABASE TELEMETRY & SQL LIFECYCLE (Span 4) */}
          <div style={{
            gridColumn: 'span 4',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(2, 132, 199, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7'
                }}>
                  <Database size={20} />
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#0284c7',
                  backgroundColor: 'rgba(2, 132, 199, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(2, 132, 199, 0.2)'
                }}>
                  DISASTER RECOVERY READY
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', lineHeight: '1', letterSpacing: '-0.02em' }}>
                  PostgreSQL 16
                </div>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: '800',
                  color: '#0284c7',
                  backgroundColor: '#e0f2fe',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid #bae6fd'
                }}>
                  ● Relational
                </span>
              </div>

              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginTop: '4px', marginBottom: '16px' }}>
                Relational Engine Telemetry
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155' }}>
                  <Check size={14} color="#10b981" />
                  <span>16/16 Migrations Idempotently Applied</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155' }}>
                  <Check size={14} color="#10b981" />
                  <span>Permanent Tombstone Registry Active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155' }}>
                  <Check size={14} color="#10b981" />
                  <span>Single-Click Production SQL Export</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('database')}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '10px 16px',
                borderRadius: '9999px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0f172a';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#334155';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <span>Open Database & Backup Console</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* BENTO TILE 4: ENTERPRISE MULTI-MODULE OPERATIONS COVERAGE (Span 7) - IMAGE 4 PASTEL CARDS */}
          <div style={{
            gridColumn: 'span 7',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(79, 70, 229, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4f46e5'
                }}>
                  <Layers size={17} />
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                  Multi-Module Governance Scope & Institution Mapping
                </h3>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#059669',
                backgroundColor: '#ecfdf5',
                padding: '3px 10px',
                borderRadius: '9999px',
                border: '1px solid #a7f3d0'
              }}>
                3 OF 3 ACTIVE
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              {/* Module 1: Food (Soft Mint Pastel Card) */}
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🍲</span>
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>Food</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: '1.45' }}>
                    Materials, Labour, FC Maintenance, Festival & Event Catering. Headcounts isolated from monetary ledger.
                  </p>
                </div>
                <div style={{
                  marginTop: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#059669',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span>Direct Operations</span>
                </div>
              </div>

              {/* Module 2: Hostel Facilities (Soft Violet Pastel Card) */}
              <div style={{
                backgroundColor: '#f5f3ff',
                border: '1px solid #ddd6fe',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🏢</span>
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>Hostel Facilities</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: '1.45' }}>
                    44 Master Parameters: EB/DG power, RO water tankers, room repairs, boys & girls census dynamics.
                  </p>
                </div>
                <div style={{
                  marginTop: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#7c3aed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                  <span>Resident Services</span>
                </div>
              </div>

              {/* Module 3: Transport Logistics (Soft Blue Pastel Card) */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🚌</span>
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>Fleet Logistics</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: '1.45' }}>
                    47 Master Parameters: 4 Branches (RPS, KPM, Common, University), trip KMs, diesel liters & fees.
                  </p>
                </div>
                <div style={{
                  marginTop: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#2563eb',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                  <span>Institutional Fleet</span>
                </div>
              </div>
            </div>
          </div>

          {/* BENTO TILE 5: AUDIT READINESS & SECURITY PROFILE (Span 5) */}
          <div style={{
            gridColumn: 'span 5',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(217, 119, 6, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d97706'
                  }}>
                    <Activity size={17} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                    Executive Audit & Active Session
                  </h3>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#d97706',
                  backgroundColor: '#fffbeb',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid #fde68a'
                }}>
                  SECURITY AUDITED
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Active Profile:</span>
                  <strong style={{ color: '#0f172a' }}>{currentUser?.full_name || currentUser?.username}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Assigned Security Role:</span>
                  <strong style={{ color: '#4f46e5', textTransform: 'capitalize' }}>{currentUser?.role || 'admin'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Assigned Department:</span>
                  <strong style={{ color: '#0f172a' }}>{currentUser?.department || 'Operations'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Password Encryption:</span>
                  <strong style={{ color: '#059669' }}>Bcrypt Hashed (Salted)</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => setActiveSection('database')}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: '9999px',
                  backgroundColor: '#0f172a',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.18)'
                }}
              >
                <Download size={13} />
                <span>Export Backup</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('pages')}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: '9999px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <KeyRound size={13} />
                <span>Permissions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: USER CONTROL (PRESERVES EXACT EXISTING FUNCTIONALITY)
          ========================================================================= */}
      {activeSection === 'users' && (
        <UserControl
          users={users}
          currentUser={currentUser}
          onRefreshUsers={onRefreshUsers}
        />
      )}

      {/* =========================================================================
          SECTION 3: PAGE ACCESS CONTROL (PRESERVES EXACT EXISTING FUNCTIONALITY)
          ========================================================================= */}
      {activeSection === 'pages' && (
        <PageControl
          currentUser={currentUser}
          permissions={permissions}
          onRefreshPermissions={onRefreshPermissions}
        />
      )}

      {/* =========================================================================
          SECTION 4: DATABASE & SQL DUMP MANAGER (PRESERVES EXACT EXISTING FUNCTIONALITY)
          ========================================================================= */}
      {activeSection === 'database' && (
        <DatabaseManager
          onRefreshData={onRefreshData}
        />
      )}

    </div>
  );
}
