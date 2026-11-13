import React, { useState, useEffect } from 'react';
import { Shield, Check, Lock, CheckCircle2, AlertTriangle, Save } from 'lucide-react';

export default function PageControl({
  currentUser,
  permissions = [],
  onRefreshPermissions
}) {
  const pages = [
    { id: 'dashboard', name: 'Executive Dashboard', desc: 'KPI cards, Pie/Donut charts, variance tools' },
    { id: 'data_entry', name: 'Data Entry (Matrix)', desc: 'Operational expense entry & monthly cycles' },
    { id: 'master_data', name: 'Master Data', desc: 'Categories, cost heads & billing periods' },
    { id: 'settings', name: 'System Settings', desc: 'User control, permissions & SQL dumps' }
  ];

  const roles = [
    { id: 'admin', name: 'Administrator', badge: '#7c3aed' },
    { id: 'gm', name: 'General Manager', badge: '#2563eb' },
    { id: 'supervisor', name: 'Dining/Facility Supervisor', badge: '#059669' },
    { id: 'auditor', name: 'Audit Officer', badge: '#d97706' }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Header Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '18px 22px',
        border: '1px solid #cbd5e1',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
            Page Access & Navigation Visibility Control
          </h3>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
            Configure which sections and navigation tabs are accessible to each operational staff role.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSavePermissions}
          disabled={saving}
          style={{
            padding: '8px 20px',
            borderRadius: '6px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            opacity: saving ? 0.7 : 1
          }}
        >
          <Save size={15} />
          <span>{saving ? 'Saving...' : 'Save Permissions'}</span>
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
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

      {/* Permissions Grid */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '14px 20px', width: '28%', textAlign: 'left' }}>System Page / Section</th>
                {roles.map(r => (
                  <th key={r.id} style={{ padding: '14px 16px', textAlign: 'center', width: '18%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <span style={{ color: r.badge, fontWeight: '800' }}>{r.name}</span>
                      {r.id === 'admin' && (
                        <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Lock size={10} /> Full Access
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map((p, idx) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                  }}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{p.name}</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>{p.desc}</div>
                  </td>

                  {roles.map(r => {
                    const isChecked = permMatrix[r.id]?.[p.id] ?? (r.id === 'admin');
                    const isLocked = r.id === 'admin';

                    return (
                      <td key={r.id} style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: isChecked ? '#eff6ff' : '#f1f5f9',
                            border: isChecked ? '1.5px solid #3b82f6' : '1.5px solid #cbd5e1',
                            cursor: isLocked ? 'not-allowed' : 'pointer',
                            opacity: isLocked ? 0.7 : 1,
                            margin: '0 auto'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggle(r.id, p.id)}
                            disabled={isLocked}
                            style={{ display: 'none' }}
                          />
                          {isChecked && <Check size={16} color="#2563eb" strokeWidth={3} />}
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
