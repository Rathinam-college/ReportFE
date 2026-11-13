import React, { useState } from 'react';
import { X, Layers, Edit, Trash2, Check, AlertCircle, Plus } from 'lucide-react';

export default function ManageCategoriesModal({
  isOpen,
  onClose,
  categoriesList = [],
  onUpdateCategory,
  onDeleteCategory,
  openAddCategoryModal
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  if (!isOpen) return null;

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setActionMsg(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSave = async (catId) => {
    if (!editName.trim()) return;
    setSaving(true);
    setActionMsg(null);
    try {
      await onUpdateCategory(catId, { name: editName.trim() });
      setEditingId(null);
      setActionMsg({ type: 'success', text: 'Category updated successfully!' });
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to update category' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    const confirmText = cat.cost_head_count > 0
      ? `Category "${cat.name}" has ${cat.cost_head_count} line items attached. Deleting it will deactivate it and its items to protect audit records.\n\nProceed?`
      : `Are you sure you want to delete category "${cat.name}"?`;
    
    if (!window.confirm(confirmText)) return;

    try {
      await onDeleteCategory(cat);
      setActionMsg({ type: 'success', text: `Category "${cat.name}" deleted/deactivated.` });
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to delete category' });
    }
  };

  return (
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
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '650px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#60a5fa" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Manage Expense Categories</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
              Showing {categoriesList.length} operational categories
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                openAddCategoryModal();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus size={14} />
              <span>+ Add New Category</span>
            </button>
          </div>

          {actionMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: actionMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: actionMsg.type === 'success' ? '#166534' : '#991b1b',
              fontSize: '12.5px',
              fontWeight: '600',
              border: `1px solid ${actionMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertCircle size={15} />
              <span>{actionMsg.text}</span>
            </div>
          )}

          {/* Categories List */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '8%' }}>#</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', width: '50%' }}>Category Name</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '22%' }}>Attached Items</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '20%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoriesList.map((cat, idx) => {
                  const isEditing = editingId === cat.id;

                  return (
                    <tr
                      key={cat.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                      }}
                    >
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'monospace', color: '#64748b' }}>
                        #{cat.id}
                      </td>

                      <td style={{ padding: '10px 16px', fontWeight: '600', color: '#0f172a' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              style={{
                                flex: 1,
                                padding: '6px 10px',
                                borderRadius: '4px',
                                border: '1.5px solid #2563eb',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#0f172a'
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSave(cat.id)}
                              disabled={saving}
                              title="Save"
                              style={{
                                padding: '6px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              title="Cancel"
                              style={{
                                padding: '6px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                cursor: 'pointer'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div>{cat.name}</div>
                            {cat.code && (
                              <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                                {cat.code}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe'
                        }}>
                          {cat.cost_head_count || 0} line items
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {!isEditing && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => startEdit(cat)}
                              title="Rename Category"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cat)}
                              title="Delete Category"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#fef2f2',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

