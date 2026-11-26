import React, { useState } from 'react';
import {
  Home, FileSpreadsheet, SlidersHorizontal,
  ShieldCheck, LogOut, Utensils, Building2, Bus, Video, ClipboardCheck, ShoppingCart, Package, ClipboardList, ChevronDown
} from 'lucide-react';
import { getAssetUrl } from '../../utils/api';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  handleLogout,
  permissions = [],
  dbStatus = 'connected',
  dashboardSubTab = 'food',
  setDashboardSubTab
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [homeDropdownOpen, setHomeDropdownOpen] = useState(false);

  const departments = [
    { id: 'food', label: 'Food', icon: Utensils },
    { id: 'hostel', label: 'Hostel', icon: Building2 },
    { id: 'transport', label: 'Transport', icon: Bus },
    { id: 'audit', label: 'Audit', icon: ClipboardCheck },
    { id: 'purchase', label: 'Purchase', icon: ShoppingCart },
    { id: 'store', label: 'Store', icon: Package },
    { id: 'asset_audit', label: 'Asset Audit', icon: ClipboardList },
    { id: 'cctv', label: 'CCTV', icon: Video }
  ];

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

  const activeDept = dashboardSubTab || 'food';

  return (
    <aside
      className="bento-navbar-aside"
      style={{
        width: '268px',
        minWidth: '268px',
        height: '100%',
        flexShrink: 0,
        backgroundColor: 'var(--primary, #14245C)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 16px 16px 16px',
        boxSizing: 'border-box',
        position: 'relative',
        userSelect: 'none',
        boxShadow: '4px 0 24px rgba(20, 36, 92, 0.14)',
        zIndex: 20,
        overflowY: 'auto'
      }}
    >
      {/* TOP: COLLEGE LOGO + BRAND */}
      <div className="nav-top-section" style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%' }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('dashboard');
            window.location.hash = 'dashboard';
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 10px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            textAlign: 'left',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          <img
            src={getAssetUrl('rathinam_logo.png')}
            alt="Rathinam Group of Institutions"
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'contain',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              padding: '4px',
              flexShrink: 0
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{
              fontSize: '13px',
              fontWeight: '800',
              color: '#ffffff',
              lineHeight: 1.25,
              letterSpacing: '-0.01em'
            }}>
              Rathinam Group of Institutions
            </span>
            <span style={{
              fontSize: '10.5px',
              fontWeight: '600',
              color: 'var(--accent, #F5A524)',
              marginTop: '2px'
            }}>
              Operations Portal
            </span>
          </div>
        </button>

        {/* SECTION: WORKSPACE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
          <div style={{
            fontSize: '10.5px',
            fontWeight: '800',
            color: 'rgba(255, 255, 255, 0.52)',
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            padding: '0 10px 4px 10px'
          }}>
            WORKSPACE
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isHovered = hoveredId === `ws_${tab.id}`;
              const isHome = tab.id === 'dashboard';
              const showHomeDropdown = isHome && activeTab === 'dashboard' && homeDropdownOpen;
              return (
                <div key={tab.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                  <button
                    className="nav-item-btn"
                    type="button"
                    onClick={() => {
                      if (isHome) {
                        if (activeTab !== 'dashboard') {
                          setActiveTab('dashboard');
                          window.location.hash = 'dashboard';
                          setHomeDropdownOpen(true);
                        } else {
                          setHomeDropdownOpen((prev) => !prev);
                        }
                      } else {
                        setHomeDropdownOpen(false);
                        setActiveTab(tab.id);
                        window.location.hash = tab.id;
                      }
                    }}
                    onMouseEnter={() => setHoveredId(`ws_${tab.id}`)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      width: '100%',
                      minHeight: '42px',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: isActive
                        ? 'rgba(255, 255, 255, 0.14)'
                        : (isHovered ? 'rgba(255, 255, 255, 0.07)' : 'transparent'),
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid transparent',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    title={tab.fullLabel}
                  >
                    <span style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '9px',
                      backgroundColor: isActive ? 'var(--accent, #F5A524)' : 'rgba(255, 255, 255, 0.1)',
                      color: isActive ? 'var(--primary, #14245C)' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={16} strokeWidth={2.2} />
                    </span>
                    <span style={{
                      fontSize: '13.5px',
                      fontWeight: isActive ? '800' : '600',
                      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.82)',
                      flex: 1
                    }}>
                      {tab.label}
                    </span>
                    {isHome && (
                      <ChevronDown
                        size={15}
                        strokeWidth={2.2}
                        style={{
                          color: 'rgba(255, 255, 255, 0.72)',
                          transform: showHomeDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.15s ease',
                          flexShrink: 0
                        }}
                      />
                    )}
                  </button>

                  {showHomeDropdown && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        marginLeft: '14px',
                        padding: '6px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                        border: '1px solid rgba(255, 255, 255, 0.12)'
                      }}
                    >
                      {departments.map((dept) => {
                        const DeptIcon = dept.icon;
                        const isDeptSelected = activeDept === dept.id;
                        const isDeptHovered = hoveredId === `home_dd_${dept.id}`;
                        return (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => {
                              if (setDashboardSubTab) setDashboardSubTab(dept.id);
                              setActiveTab('dashboard');
                              window.location.hash = 'dashboard';
                            }}
                            onMouseEnter={() => setHoveredId(`home_dd_${dept.id}`)}
                            onMouseLeave={() => setHoveredId(null)}
                            style={{
                              width: '100%',
                              minHeight: '36px',
                              padding: '6px 10px',
                              borderRadius: '9px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              backgroundColor: isDeptSelected
                                ? 'rgba(245, 165, 36, 0.2)'
                                : (isDeptHovered ? 'rgba(255, 255, 255, 0.08)' : 'transparent'),
                              border: isDeptSelected ? '1px solid rgba(245, 165, 36, 0.45)' : '1px solid transparent',
                              color: '#ffffff',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '7px',
                              backgroundColor: isDeptSelected ? 'var(--accent, #F5A524)' : 'rgba(255, 255, 255, 0.1)',
                              color: isDeptSelected ? 'var(--primary, #14245C)' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <DeptIcon size={13} strokeWidth={2.3} />
                            </span>
                            <span style={{
                              fontSize: '12.5px',
                              fontWeight: isDeptSelected ? '800' : '600',
                              color: isDeptSelected ? 'var(--accent, #F5A524)' : 'rgba(255, 255, 255, 0.85)'
                            }}>
                              {dept.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* BOTTOM: USER CARD + LOGOUT */}
      <div className="nav-bottom-section" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        paddingTop: '14px',
        borderTop: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.09)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent, #F5A524)',
            color: 'var(--primary, #14245C)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '12.5px',
            flexShrink: 0
          }}>
            {(currentUser?.full_name || currentUser?.username || 'CO').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Campus Operations
            </span>
            <span style={{
              fontSize: '10.5px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.68)'
            }}>
              {currentUser?.role === 'admin' ? 'Administrator' : 'Manager'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%',
            minHeight: '40px',
            padding: '8px 12px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#ffffff',
            fontSize: '12.5px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
