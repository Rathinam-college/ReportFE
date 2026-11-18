import React, { useState, useEffect } from 'react';
import { 
  Shield, Check, Lock, CheckCircle2, AlertTriangle, Save, 
  LayoutDashboard, Table, Database, Settings as SettingsIcon, Info
} from 'lucide-react';

export default function PageControl({
  currentUser,
  permissions = [],
  onRefreshPermissions
}) {
  const pages = [
    { id: 'dashboard', name: 'Executive Dashboard', desc: 'KPI cards, Pie/Donut charts, variance tools', icon: LayoutDashboard, color: '#3b82f6' },
    { id: 'data_entry', name: 'Data Entry (Matrix)', desc: 'Operational expense entry & monthly cycles', icon: Table, color: '#10b981' },
    { id: 'master_data', name: 'Master Data', desc: 'Categories, cost heads & billing periods', icon: Database, color: '#8b5cf6' },
    { id: 'settings', name: 'System Settings', desc: 'User control, permissions & SQL dumps', icon: SettingsIcon, color: '#f59e0b' }
  ];

  const roles = [
    { id: 'admin', name: 'Administrator', badge: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    { id: 'gm', name: 'General Manager', badge: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    { id: 'supervisor', name: 'Dining/Facility Supervisor', badge: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    { id: 'auditor', name: 'Audit Officer', badge: '#d97706', bg: '#fffbeb', border: '#fde68a' }
  ];

  const [permMatrix, setPermMatrix] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const map = {};
    roles.forEach(r => {
      map[r.id] = {};
      pages.forEach(p => {
        map[r.id][p.id] = r.id === 'admin'; // Admin always true
      });
    });

    if (permissions && permissions.length > 0) {
      permissions.forEach(item => {
        if (!map[item.role]) map[item.role] = {};
        map[item.role][item.page_id] = item.role === 'admin' ? true : !!item.can_access;
      });
    }

    setPermMatrix(map);
  }, [permissions]);

  const handleToggle = (roleId, pageId) => {
    if (roleId === 'admin') return; // Admin always retains full privileges
    setPermMatrix(prev => ({
      ...prev,
      [roleId]: {
        ...(prev[roleId] || {}),
        [pageId]: !prev[roleId]?.[pageId]
      }
    }));
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    setMessage(null);

    const batch = [];
    roles.forEach(r => {
      pages.forEach(p => {
        batch.push({
          role: r.id,
          page_id: p.id,
          can_access: r.id === 'admin' ? true : !!permMatrix[r.id]?.[p.id]
        });
      });
    });

    try {
      const res = await fetch('/api/permissions/page-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: batch })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save page permissions');
      }

      setMessage({ type: 'success', text: 'Page access permissions updated and enforced across system navigation.' });
      if (onRefreshPermissions) onRefreshPermissions();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
            Page Access & Navigation Visibility Control
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
            Configure which sections and navigation tabs are accessible to each operational staff role.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSavePermissions}
          disabled={saving}
          style={{
            padding: '10px 24px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #ff7e9e 0%, #ff4b72 100%)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 20px rgba(255, 96, 136, 0.35)',
            opacity: saving ? 0.7 : 1,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => !saving && (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => !saving && (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Save size={15} />
          <span>{saving ? 'Saving...' : 'Save Permissions'}</span>
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Permissions Grid (Finexy & Crextio Bento Table Aesthetics) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                color: '#64748b'
              }}>
                <th style={{
                  padding: '16px 22px',
                  width: '32%',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>
                  System Page / Section
                </th>
                {roles.map(r => (
                  <th key={r.id} style={{ padding: '16px 18px', textAlign: 'center', width: '17%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        backgroundColor: r.bg,
                        color: r.badge,
                        border: `1px solid ${r.border}`
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: r.badge }} />
                        {r.name}
                      </span>
                      {r.id === 'admin' && (
                        <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                          <Lock size={10} /> Full Privileges
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map((p, idx) => {
                const PageIcon = p.icon;
                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      transition: 'background-color 0.1s ease'
                    }}
                  >
                    <td style={{ padding: '16px 22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          backgroundColor: `${p.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: p.color,
                          flexShrink: 0
                        }}>
                          <PageIcon size={17} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13.5px' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {p.desc}
                          </div>
                        </div>
                      </div>
                    </td>

                    {roles.map(r => {
                      const isChecked = permMatrix[r.id]?.[p.id] ?? (r.id === 'admin');
                      const isLocked = r.id === 'admin';

                      return (
                        <td key={r.id} style={{ padding: '16px 18px', textAlign: 'center' }}>
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              backgroundColor: isLocked 
                                ? '#f5f3ff' 
                                : (isChecked ? '#ecfdf5' : '#f8fafc'),
                              border: isLocked
                                ? '1.5px solid #ddd6fe'
                                : (isChecked ? '1.5px solid #10b981' : '1.5px solid #cbd5e1'),
                              cursor: isLocked ? 'not-allowed' : 'pointer',
                              margin: '0 auto',
                              transition: 'all 0.15s ease',
                              boxShadow: isChecked && !isLocked ? '0 2px 6px rgba(16, 185, 129, 0.2)' : 'none'
                            }}
                            title={isLocked ? 'Root Administrator access cannot be restricted' : (isChecked ? 'Access Granted' : 'Access Restricted')}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggle(r.id, p.id)}
                              disabled={isLocked}
                              style={{ display: 'none' }}
                            />
                            {isLocked ? (
                              <Lock size={15} color="#7c3aed" />
                            ) : isChecked ? (
                              <Check size={17} color="#059669" strokeWidth={3} />
                            ) : (
                              <span style={{ width: '8px', height: '2px', backgroundColor: '#cbd5e1', borderRadius: '1px' }} />
                            )}
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanatory Advisory Note (Image 1 & 4 Style) */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '16px 20px',
        backgroundColor: '#f8fafc',
        borderRadius: '14px',
        border: '1px solid #e2e8f0'
      }}>
        <Info size={18} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.5' }}>
          <strong>Role Enforcement Note:</strong> Navigation tab visibility and direct URL routing dynamically reflect these permission records. Changes take effect on next navigation or session reload. The <strong>Administrator</strong> account maintains unalterable system governance.
        </div>
      </div>

    </div>
  );
}
