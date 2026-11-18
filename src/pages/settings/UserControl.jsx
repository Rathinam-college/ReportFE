import React, { useState, useMemo } from 'react';
import { 
  UserPlus, Edit, Trash2, Shield, UserCheck, UserX, X, 
  KeyRound, Mail, Building, CheckCircle2, AlertTriangle, Search, Lock
} from 'lucide-react';

export default function UserControl({
  users = [],
  currentUser,
  onRefreshUsers
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filtered users by search query (Client-side, pure UI filter)
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const q = searchTerm.toLowerCase();
    return users.filter(u => 
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  }, [users, searchTerm]);

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
    if (user.id === currentUser?.id) {
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

  // Modern Pill Role Badges (Image 2 Quixotic, Image 3 & 5 Finexy)
  const getRoleBadge = (role) => {
    const map = {
      admin: { label: 'Administrator', bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', dot: '#7c3aed' },
      gm: { label: 'General Manager', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', dot: '#2563eb' },
      supervisor: { label: 'Supervisor', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', dot: '#059669' },
      auditor: { label: 'Auditor', bg: '#fffbeb', color: '#d97706', border: '#fde68a', dot: '#d97706' }
    };
    const s = map[role] || { label: role, bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', dot: '#64748b' };
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`
      }}>
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: s.dot }} />
        {s.label}
      </span>
    );
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
            User Account Management & Role Control
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
            Manage staff login credentials, assign operational roles, and activate or deactivate user accounts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Pill Input (Goodle Drive / Finexy / Crextio Style) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f8fafc',
            padding: '7px 14px',
            borderRadius: '9999px',
            border: '1px solid #e2e8f0',
            minWidth: '220px'
          }}>
            <Search size={14} color="#64748b" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12.5px',
                color: '#0f172a',
                width: '100%'
              }}
            />
          </div>

          {/* "+ Add New User" Pill Button (Bento Purple Style) */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 24px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #6c52d6 0%, #5439ba 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(108, 86, 219, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <UserPlus size={16} />
            <span>Add New User</span>
          </button>
        </div>
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

      {/* Users Table (Synthesizing Images 1, 2, 5, 6) */}
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
                color: '#64748b',
                fontWeight: '700',
                fontSize: '11px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                <th style={{ padding: '14px 18px', width: '5%', textAlign: 'center' }}>#</th>
                <th style={{ padding: '14px 18px', width: '25%', textAlign: 'left' }}>User / Username</th>
                <th style={{ padding: '14px 18px', width: '22%', textAlign: 'left' }}>Email Address</th>
                <th style={{ padding: '14px 18px', width: '16%', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '14px 18px', width: '14%', textAlign: 'left' }}>Department</th>
                <th style={{ padding: '14px 16px', width: '10%', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '14px 18px', width: '12%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No user accounts match your search query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      transition: 'background-color 0.1s ease'
                    }}
                  >
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#64748b',
                        fontFamily: 'monospace'
                      }}>
                        #{u.id}
                      </span>
                    </td>

                    {/* User Profile Cell with Avatar (Crextio / Quixotic) */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: getAvatarGradient(u.full_name || u.username),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: '800',
                          fontSize: '13px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          flexShrink: 0
                        }}>
                          {getInitials(u.full_name || u.username)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13.5px' }}>
                            {u.full_name}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={13} color="#94a3b8" />
                        <span>{u.email}</span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {getRoleBadge(u.role)}
                    </td>

                    <td style={{ padding: '14px 18px', color: '#475569', fontSize: '12.5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building size={13} color="#94a3b8" />
                        <span>{u.department || 'Operations'}</span>
                      </div>
                    </td>

                    {/* Status Pill Badge (Quixotic / Finexy) */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        backgroundColor: u.is_active ? '#ecfdf5' : '#f1f5f9',
                        color: u.is_active ? '#047857' : '#64748b',
                        border: `1px solid ${u.is_active ? '#a7f3d0' : '#cbd5e1'}`
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: u.is_active ? '#10b981' : '#94a3b8',
                          boxShadow: u.is_active ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none'
                        }} />
                        <span>{u.is_active ? 'Active' : 'Disabled'}</span>
                      </span>
                    </td>

                    {/* Pill Action Buttons (Image 2 & 5) */}
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit User"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '700',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Edit size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === 1 || u.id === currentUser?.id}
                          title={u.id === 1 ? 'Root Admin cannot be deleted' : 'Delete User'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            backgroundColor: (u.id === 1 || u.id === currentUser?.id) ? '#f8fafc' : '#fef2f2',
                            color: (u.id === 1 || u.id === currentUser?.id) ? '#cbd5e1' : '#ef4444',
                            border: `1px solid ${(u.id === 1 || u.id === currentUser?.id) ? '#e2e8f0' : '#fecaca'}`,
                            cursor: (u.id === 1 || u.id === currentUser?.id) ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '700',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {u.id === 1 ? <Lock size={12} /> : <Trash2 size={12} />}
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD USER (Modern Card with Rounded Corners) */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 30px 80px rgba(108, 86, 219, 0.2)',
            overflow: 'hidden',
            border: '1px solid rgba(108, 86, 219, 0.15)'
          }}>
            <div style={{
              padding: '18px 24px',
              background: 'linear-gradient(135deg, #6c52d6 0%, #5439ba 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#ffffff" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, letterSpacing: '-0.01em' }}>Create New Staff User</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ color: '#e0f2fe', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. jdoe"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Role *
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: '600',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="supervisor">Dining / Facility Supervisor</option>
                    <option value="gm">General Manager / Director</option>
                    <option value="auditor">Audit Officer</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. jdoe@rathinam.ac.in"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Food Court & Mess"
                  value={addForm.department}
                  onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Initial Password *
                </label>
                <input
                  type="password"
                  placeholder="Enter strong password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '9999px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, #ff7e9e 0%, #ff4b72 100%)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(255, 96, 136, 0.35)'
                  }}
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER (Modern Card with Rounded Corners) */}
      {showEditModal && editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 30px 80px rgba(108, 86, 219, 0.2)',
            overflow: 'hidden',
            border: '1px solid rgba(108, 86, 219, 0.15)'
          }}>
            <div style={{
              padding: '18px 24px',
              background: 'linear-gradient(135deg, #6c52d6 0%, #5439ba 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={18} color="#ffffff" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, letterSpacing: '-0.01em' }}>
                  Edit Profile: @{editingUser.username}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ color: '#e0f2fe', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Role *
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    disabled={editingUser.id === 1}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: '600',
                      outline: 'none',
                      backgroundColor: editingUser.id === 1 ? '#f1f5f9' : '#ffffff',
                      cursor: editingUser.id === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="supervisor">Dining / Facility Supervisor</option>
                    <option value="gm">General Manager / Director</option>
                    <option value="auditor">Audit Officer</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Account Status
                  </label>
                  <select
                    value={editForm.is_active ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}
                    disabled={editingUser.id === 1}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: '600',
                      outline: 'none',
                      backgroundColor: editingUser.id === 1 ? '#f1f5f9' : '#ffffff',
                      cursor: editingUser.id === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="true">Active (Access Allowed)</option>
                    <option value="false">Disabled (Suspended)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Department
                </label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Reset Password (Leave blank to keep unchanged)
                </label>
                <input
                  type="password"
                  placeholder="Enter new password to reset"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '9999px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, #ff7e9e 0%, #ff4b72 100%)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(255, 96, 136, 0.35)'
                  }}
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
