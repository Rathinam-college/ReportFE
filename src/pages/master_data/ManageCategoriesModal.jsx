import React, { useState } from 'react';
import { X, Layers, Edit, Trash2, Check, AlertCircle, Plus, GripVertical, ArrowUp, ArrowDown, Search } from 'lucide-react';

export default function ManageCategoriesModal({
  isOpen,
  onClose,
  categoriesList = [],
  onUpdateCategory,
  onDeleteCategory,
  onBatchDeleteCategories,
  onReorderCategories,
  openAddCategoryModal
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [selectedCatIds, setSelectedCatIds] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleMoveStep = async (idx, step) => {
    const targetIdx = idx + step;
    if (targetIdx < 0 || targetIdx >= categoriesList.length) return;

    if (onReorderCategories) {
      await onReorderCategories(idx, targetIdx);
    } else {
      const reordered = [...categoriesList];
      const [moved] = reordered.splice(idx, 1);
      reordered.splice(targetIdx, 0, moved);
      try {
        const category_ids = reordered.map(c => c.id);
        await fetch('/api/master/categories/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_ids })
        });
        setActionMsg({ type: 'success', text: 'Category order updated & saved to database.' });
      } catch (err) {
        setActionMsg({ type: 'error', text: 'Failed to save new category order.' });
      }
    }
  };

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setDragOverIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDrop = async (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const fromIdx = draggedIdx;
    setDraggedIdx(null);
    setDragOverIdx(null);

    if (onReorderCategories) {
      await onReorderCategories(fromIdx, targetIdx);
    } else {
      const reordered = [...categoriesList];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(targetIdx, 0, moved);
      try {
        const category_ids = reordered.map(c => c.id);
        await fetch('/api/master/categories/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_ids })
        });
        setActionMsg({ type: 'success', text: 'Category order updated & saved to database.' });
      } catch (err) {
        setActionMsg({ type: 'error', text: 'Failed to save new category order.' });
      }
    }
  };

  const isAllSelected = categoriesList.length > 0 && categoriesList.every(c => selectedCatIds.includes(c.id));

  const displayedCategories = searchQuery.trim()
    ? categoriesList.filter(c =>
        c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (c.code && c.code.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      )
    : categoriesList;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCatIds([]);
    } else {
      setSelectedCatIds(categoriesList.map(c => c.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedCatIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirmBatchDelete = async () => {
    if (!onBatchDeleteCategories || selectedCatIds.length === 0) return;
    try {
      await onBatchDeleteCategories(selectedCatIds);
      setSelectedCatIds([]);
      setActionMsg({ type: 'success', text: `Successfully deleted selected categories.` });
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to delete selected categories' });
    }
  };

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
    if (!editName.trim()) {
      setActionMsg({ type: 'error', text: 'Category name cannot be empty.' });
      return;
    }
    setSaving(true);
    setActionMsg(null);
    try {
      await onUpdateCategory(catId, { name: editName.trim() });
      setEditingId(null);
      setActionMsg({ type: 'success', text: `Category "${editName.trim()}" updated successfully!` });
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                Showing {categoriesList.length} operational categories
              </span>
              {selectedCatIds.length > 0 && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#dc2626',
                  backgroundColor: '#fef2f2',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #fecaca'
                }}>
                  {selectedCatIds.length} chosen
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedCatIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleConfirmBatchDelete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={13} />
                  <span>Delete Selected ({selectedCatIds.length})</span>
                </button>
              )}
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

          {/* Search Filter & Instructions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '8px 12px'
          }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search category by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '13px',
                fontWeight: '500',
                color: '#0f172a'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Clear Search"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Reorder / Action Instruction Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '11.5px',
            color: '#64748b'
          }}>
            <span>✋ Grab handle or use ⬆️ ⬇️ to reorder • Double-click any name to edit</span>
            <span style={{ fontWeight: '600', color: '#4f46e5' }}>Auto-saves to database</span>
          </div>

          {/* Categories List */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '6%' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      title="Select / Deselect All Categories"
                      style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#dc2626' }}
                    />
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '18%' }}>Reorder</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', width: '40%' }}>Category Name</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '18%' }}>Attached Items</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '18%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedCategories.map((cat, idx) => {
                  const isEditing = editingId === cat.id;
                  const isSelected = selectedCatIds.includes(cat.id);
                  const isDragging = draggedIdx === idx;
                  const isOver = dragOverIdx === idx;

                  return (
                    <tr
                      key={cat.id}
                      draggable={!isEditing && !searchQuery.trim()}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, idx)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isSelected
                          ? '#fef2f2'
                          : (isOver ? '#eff6ff' : (isDragging ? '#e2e8f0' : (idx % 2 === 0 ? '#ffffff' : '#fafafa'))),
                        opacity: isDragging ? 0.5 : 1,
                        transition: 'background-color 0.15s ease',
                        cursor: isEditing ? 'default' : (!searchQuery.trim() ? 'grab' : 'default')
                      }}
                    >
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(cat.id)}
                          style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#dc2626' }}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                          <span
                            title={!searchQuery.trim() ? "Drag to reorder" : "Clear search to reorder"}
                            style={{ cursor: !searchQuery.trim() ? 'grab' : 'default', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                          >
                            <GripVertical size={15} />
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleMoveStep(idx, -1); }}
                            disabled={idx === 0 || !!searchQuery.trim()}
                            title="Move Category Up"
                            style={{
                              padding: '3px 4px',
                              borderRadius: '4px',
                              backgroundColor: (idx === 0 || !!searchQuery.trim()) ? '#f8fafc' : '#f1f5f9',
                              color: (idx === 0 || !!searchQuery.trim()) ? '#cbd5e1' : '#334155',
                              cursor: (idx === 0 || !!searchQuery.trim()) ? 'not-allowed' : 'pointer',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleMoveStep(idx, 1); }}
                            disabled={idx === categoriesList.length - 1 || !!searchQuery.trim()}
                            title="Move Category Down"
                            style={{
                              padding: '3px 4px',
                              borderRadius: '4px',
                              backgroundColor: (idx === categoriesList.length - 1 || !!searchQuery.trim()) ? '#f8fafc' : '#f1f5f9',
                              color: (idx === categoriesList.length - 1 || !!searchQuery.trim()) ? '#cbd5e1' : '#334155',
                              cursor: (idx === categoriesList.length - 1 || !!searchQuery.trim()) ? 'not-allowed' : 'pointer',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <ArrowDown size={12} />
                          </button>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#475569',
                            backgroundColor: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            minWidth: '20px',
                            textAlign: 'center'
                          }}>
                            {idx + 1}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '10px 16px', fontWeight: '600', color: '#0f172a' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSave(cat.id);
                                } else if (e.key === 'Escape') {
                                  cancelEdit();
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1.5px solid #2563eb',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#0f172a',
                                outline: 'none',
                                boxShadow: '0 0 0 2.5px rgba(37,99,235,0.15)'
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSave(cat.id)}
                              disabled={saving || !editName.trim()}
                              title="Save Category Name (Enter)"
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                cursor: saving ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}
                            >
                              <Check size={14} />
                              <span>{saving ? '...' : 'Save'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              title="Cancel Edit (Esc)"
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div
                            onDoubleClick={() => startEdit(cat)}
                            title="Click edit button or double-click to rename"
                            style={{ cursor: 'pointer' }}
                          >
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{cat.name}</div>
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
                              title="Rename / Edit Category"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
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
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
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

