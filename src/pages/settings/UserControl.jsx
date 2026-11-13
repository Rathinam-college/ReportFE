import React, { useState } from 'react';
import { UserPlus, Edit, Trash2, Shield, UserCheck, UserX, X, KeyRound, Mail, Building, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function UserControl({
  users,
  currentUser,
  onRefreshUsers
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [addForm, setAddForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'supervisor',
    department: 'Campus Operations'
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'supervisor',
    department: 'Campus Operations',
    is_active: true
  });

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'supervisor',
      department: user.department || 'Campus Operations',
      is_active: !!user.is_active
    });
    setShowEditModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create user');
      }
      setMessage({ type: 'success', text: `User account "${addForm.username}" created successfully.` });
      setShowAddModal(false);
      setAddForm({
        username: '',
        full_name: '',
        email: '',
        password: '',
        role: 'supervisor',
        department: 'Campus Operations'
      });
      onRefreshUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        full_name: editForm.full_name,
        email: editForm.email,
        role: editForm.role,
        department: editForm.department,
        is_active: editForm.is_active
      };
      if (editForm.password && editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update user');
      }
      setMessage({ type: 'success', text: `User "${editingUser.username}" updated successfully.` });
      setShowEditModal(false);
      onRefreshUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === 1) {
      alert('Cannot delete the root administrator account (ID 1).');
      return;
    }
    if (user.id === currentUser.id) {
      alert('You cannot delete your own currently active account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.username}" (${user.full_name})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete user');
      }
      setMessage({ type: 'success', text: `User "${user.username}" deleted successfully.` });
      onRefreshUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const getRoleBadge = (role) => {
    const map = {
      admin: { label: 'Administrator', bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
      gm: { label: 'General Manager', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
      supervisor: { label: 'Supervisor', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
      auditor: { label: 'Auditor', bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
    };
    const s = map[role] || { label: role, bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: '5px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`
      }}>
        {s.label}
      </span>
    );
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
            User Account Management & Role Control
          </h3>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
            Manage staff login credentials, assign operational roles, and activate or deactivate user accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
          }}
        >
          <UserPlus size={16} />
          <span>Add New User</span>
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

      {/* Users Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '12px 16px', width: '5%', textAlign: 'center' }}>#</th>
                <th style={{ padding: '12px 18px', width: '22%', textAlign: 'left' }}>User / Username</th>
                <th style={{ padding: '12px 18px', width: '20%', textAlign: 'left' }}>Email Address</th>
                <th style={{ padding: '12px 16px', width: '16%', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '12px 16px', width: '15%', textAlign: 'left' }}>Department</th>
                <th style={{ padding: '12px 14px', width: '10%', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 16px', width: '12%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                  }}
                >
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace', color: '#64748b' }}>
                    #{u.id}
                  </td>

                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{u.full_name}</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>@{u.username}</div>
                  </td>

                  <td style={{ padding: '12px 18px', color: '#334155' }}>
                    {u.email}
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    {getRoleBadge(u.role)}
                  </td>

                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                    {u.department || 'Operations'}
                  </td>

                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: u.is_active ? '#ecfdf5' : '#f1f5f9',
                      color: u.is_active ? '#047857' : '#64748b',
                      border: `1px solid ${u.is_active ? '#a7f3d0' : '#cbd5e1'}`
                    }}>
                      {u.is_active ? <UserCheck size={11} /> : <UserX size={11} />}
                      <span>{u.is_active ? 'Active' : 'Disabled'}</span>
                    </span>
                  </td>

                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        title="Edit User"
                        style={{ padding: '5px 8px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer' }}
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        disabled={u.id === 1 || u.id === currentUser.id}
                        title={u.id === 1 ? 'Root Admin cannot be deleted' : 'Delete User'}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#fef2f2',
                          color: (u.id === 1 || u.id === currentUser.id) ? '#cbd5e1' : '#ef4444',
                          border: '1px solid #fecaca',
                          cursor: (u.id === 1 || u.id === currentUser.id) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD USER */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Create New Staff User</h3>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. jdoe"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Role *
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                  >
                    <option value="supervisor">Dining / Facility Supervisor</option>
                    <option value="gm">General Manager / Director</option>
                    <option value="auditor">Audit Officer</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. jdoe@rathinam.ac.in"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Food Court & Mess"
                  value={addForm.department}
                  onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Initial Password *
                </label>
                <input
                  type="password"
                  placeholder="Enter strong password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '8px 18px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {showEditModal && editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Edit User: @{editingUser.username}</h3>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Role *
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                  >
                    <option value="supervisor">Dining / Facility Supervisor</option>
                    <option value="gm">General Manager / Director</option>
                    <option value="auditor">Audit Officer</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Reset Password (leave empty to keep current password)
                </label>
                <input
                  type="password"
                  placeholder="New password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <input
                  type="checkbox"
                  id="userActiveCheck"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                />
                <label htmlFor="userActiveCheck" style={{ fontSize: '13px', color: '#334155', cursor: 'pointer', fontWeight: '600' }}>
                  Account Active (enable login)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '8px 18px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
