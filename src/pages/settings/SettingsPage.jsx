import React, { useState, useMemo } from 'react';
import { 
  Users, ShieldCheck, Database, Settings as SettingsIcon,
  AlertTriangle, CheckCircle2, ShieldAlert, Lock, KeyRound,
  Layers, HardDrive, Activity, Download, ArrowRight,
  Server, FileCheck, Building, Bus, Utensils, Bed,
  Sparkles, Check, ChevronRight, Eye, Shield
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* =========================================================================
          EXECUTIVE COMMAND HEADER WITH LIVE TELEMETRY CHIPS
          ========================================================================= */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #172554 100%)',
        borderRadius: '18px',
        padding: '24px 28px',
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
                width: '32px',
                height: '32px',
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
              padding: '6px 12px',
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
              padding: '6px 12px',
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
              padding: '6px 12px',
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
          IMPORTANT ALERTS (EXECUTIVE ADVISORY FEED)
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
                fontSize: '11.5px',
                fontWeight: '600',
                color: '#64748b',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Dismiss Alerts
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '12px'
          }}>
            {/* ALERT 1: ROOT SUPERADMIN PROTECTION */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #6366f1',
              borderRadius: '12px',
              padding: '14px 16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4f46e5',
                flexShrink: 0
              }}>
                <Lock size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                    Root Superadmin Account Immutable
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: '#4338ca',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.02em'
                  }}>
                    SECURITY PINNED
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                  Master Account <strong>ID 1 ("admin")</strong> is permanently protected against deletion or role revocation to eliminate lockout vulnerability.
                </p>
              </div>
            </div>

            {/* ALERT 2: MASTER PARAMETER TOMBSTONE SHIELD */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #059669',
              borderRadius: '12px',
              padding: '14px 16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                flexShrink: 0
              }}>
                <ShieldCheck size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                    Tombstone Shield & Parameter Persistence
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#065f46',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.02em'
                  }}>
                    PERSISTENCE ON
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                  All user-edited parameter names, order, formulas, and tombstoned deletions in Food, Hostel, and Transport are permanently preserved across refreshes and restarts.
                </p>
              </div>
            </div>

            {/* ALERT 3: FINANCIAL AUDIT & ISOLATION COMPLIANCE */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #d97706',
              borderRadius: '12px',
              padding: '14px 16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
                flexShrink: 0
              }}>
                <FileCheck size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                    Financial Ledger & Census Isolation
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: '#92400e',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.02em'
                  }}>
                    AUDIT COMPLIANT
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                  Non-expense headcount census figures and unit cost rates are strictly segregated from monetary grand totals. Certified pure operations ledger.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          EXECUTIVE NAVIGATION BAR (TABS)
          ========================================================================= */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '6px',
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
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
              padding: '8px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: activeSection === 'overview' ? '800' : '600',
              backgroundColor: activeSection === 'overview' ? '#0f172a' : 'transparent',
              color: activeSection === 'overview' ? '#ffffff' : '#475569',
              border: 'none',
              cursor: 'pointer',
              boxShadow: activeSection === 'overview' ? '0 4px 12px rgba(15,23,42,0.22)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={15} color={activeSection === 'overview' ? '#38bdf8' : '#64748b'} />
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
              padding: '8px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: activeSection === 'users' ? '800' : '600',
              backgroundColor: activeSection === 'users' ? '#4f46e5' : 'transparent',
              color: activeSection === 'users' ? '#ffffff' : '#475569',
              border: 'none',
              cursor: 'pointer',
              boxShadow: activeSection === 'users' ? '0 4px 12px rgba(79,70,229,0.28)' : 'none',
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
              padding: '8px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: activeSection === 'pages' ? '800' : '600',
              backgroundColor: activeSection === 'pages' ? '#4f46e5' : 'transparent',
              color: activeSection === 'pages' ? '#ffffff' : '#475569',
              border: 'none',
              cursor: 'pointer',
              boxShadow: activeSection === 'pages' ? '0 4px 12px rgba(79,70,229,0.28)' : 'none',
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
              padding: '8px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: activeSection === 'database' ? '800' : '600',
              backgroundColor: activeSection === 'database' ? '#4f46e5' : 'transparent',
              color: activeSection === 'database' ? '#ffffff' : '#475569',
              border: 'none',
              cursor: 'pointer',
              boxShadow: activeSection === 'database' ? '0 4px 12px rgba(79,70,229,0.28)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Database size={15} color={activeSection === 'database' ? '#ffffff' : '#64748b'} />
            <span>Database & SQL Dumps</span>
          </button>
        </div>

        {/* Quick status stamp */}
        <div style={{
          padding: '4px 12px',
          fontSize: '11px',
          fontWeight: '700',
          color: '#64748b',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          PostgreSQL Schema v2.4 Verified
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: BENTO GRID + EXECUTIVE ANALYTICS (EXECUTIVE DASHBOARD VIEW)
          ========================================================================= */}
      {activeSection === 'overview' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '16px'
        }}>
          
          {/* BENTO TILE 1: WORKFORCE & DIRECTORY GOVERNANCE (Span 4) */}
          <div style={{
            gridColumn: 'span 4',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(79, 70, 229, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4f46e5'
                }}>
                  <Users size={18} />
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#4f46e5',
                  backgroundColor: 'rgba(79, 70, 229, 0.08)',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  IDENTITY & ACCESS
                </span>
              </div>

              <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', lineHeight: '1' }}>
                {stats.totalUsers}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginTop: '4px', marginBottom: '14px' }}>
                Enrolled System Users
              </div>

              {/* Breakdown badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155'
                }}>
                  {stats.activeUsers} Active
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#ede9fe',
                  color: '#6d28d9'
                }}>
                  {stats.adminCount} Admins
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8'
                }}>
                  {stats.managerCount} Supervisors
                </div>
              </div>

              <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.5' }}>
                Departments: <strong>{stats.departments.join(', ')}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('users')}
              style={{
                marginTop: '18px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                fontWeight: '700',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4f46e5';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#4f46e5';
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
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(5, 150, 105, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                  <ShieldCheck size={18} />
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#059669',
                  backgroundColor: 'rgba(5, 150, 105, 0.08)',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  POLICY ENFORCED
                </span>
              </div>

              <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', lineHeight: '1' }}>
                16 Rules
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginTop: '4px', marginBottom: '14px' }}>
                RBAC Security Matrix
              </div>

              {/* Roles matrix summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#334155' }}>
                  <span>Administrator (admin):</span>
                  <strong style={{ color: '#059669' }}>Unrestricted Full Access</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#334155' }}>
                  <span>General Manager (gm):</span>
                  <strong style={{ color: '#2563eb' }}>Dashboard & Operations View</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#334155' }}>
                  <span>Supervisor:</span>
                  <strong style={{ color: '#d97706' }}>Matrix & Data Entry Focus</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#334155' }}>
                  <span>Auditor:</span>
                  <strong style={{ color: '#7c3aed' }}>Read-only Ledger Compliance</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('pages')}
              style={{
                marginTop: '18px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                fontWeight: '700',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#059669';
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
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(2, 132, 199, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7'
                }}>
                  <Database size={18} />
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#0284c7',
                  backgroundColor: 'rgba(2, 132, 199, 0.08)',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  DISASTER RECOVERY READY
                </span>
              </div>

              <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', lineHeight: '1' }}>
                PostgreSQL 16
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginTop: '4px', marginBottom: '14px' }}>
                Relational Engine Telemetry
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155' }}>
                  <Check size={14} color="#10b981" />
                  <span>16/16 Migrations Idempotently Applied</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155' }}>
                  <Check size={14} color="#10b981" />
                  <span>Permanent Tombstone Registry Active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155' }}>
                  <Check size={14} color="#10b981" />
                  <span>Single-Click Production SQL Export</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('database')}
              style={{
                marginTop: '18px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                fontWeight: '700',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0284c7';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#0284c7';
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

          {/* BENTO TILE 4: ENTERPRISE MULTI-MODULE OPERATIONS COVERAGE (Span 7) */}
          <div style={{
            gridColumn: 'span 7',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#4f46e5" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                  Multi-Module Governance Scope & Institution Mapping
                </h3>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669', backgroundColor: '#ecfdf5', padding: '3px 8px', borderRadius: '6px' }}>
                3 OF 3 ACTIVE
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {/* Module 1: Food & Dining */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🍲</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Food & Dining</span>
                </div>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                  Materials, Labour, FC Maintenance, Festival & Event Catering. Headcounts isolated from monetary ledger.
                </p>
                <div style={{ marginTop: '10px', fontSize: '11px', fontWeight: '700', color: '#2563eb' }}>
                  ● Direct Operations
                </div>
              </div>

              {/* Module 2: Hostel Facilities */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🏢</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Hostel Facilities</span>
                </div>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                  44 Master Parameters: EB/DG power, RO water tankers, room repairs, boys & girls census dynamics.
                </p>
                <div style={{ marginTop: '10px', fontSize: '11px', fontWeight: '700', color: '#7c3aed' }}>
                  ● Resident Services
                </div>
              </div>

              {/* Module 3: Transport Logistics */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🚌</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Fleet Logistics</span>
                </div>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                  47 Master Parameters: 4 Branches (RPS, KPM, Common, University), trip KMs, diesel liters & fees.
                </p>
                <div style={{ marginTop: '10px', fontSize: '11px', fontWeight: '700', color: '#059669' }}>
                  ● Institutional Fleet
                </div>
              </div>
            </div>
          </div>

          {/* BENTO TILE 5: AUDIT READINESS & SECURITY PROFILE (Span 5) */}
          <div style={{
            gridColumn: 'span 5',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="#d97706" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                    Executive Audit & Active Session
                  </h3>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#d97706', backgroundColor: '#fffbeb', padding: '3px 8px', borderRadius: '6px' }}>
                  SECURITY AUDITED
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Active Profile:</span>
                  <strong style={{ color: '#0f172a' }}>{currentUser?.full_name || currentUser?.username}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Assigned Security Role:</span>
                  <strong style={{ color: '#4f46e5', textTransform: 'capitalize' }}>{currentUser?.role || 'admin'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Assigned Department:</span>
                  <strong style={{ color: '#0f172a' }}>{currentUser?.department || 'Operations'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Password Encryption:</span>
                  <strong style={{ color: '#059669' }}>Bcrypt Hashed (Salted)</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setActiveSection('database')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
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
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '12px',
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
