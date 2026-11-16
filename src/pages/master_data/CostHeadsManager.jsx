import React, { useState } from 'react';
import { GripVertical, ArrowUp, ArrowDown, Edit, Trash2, Plus, X, FolderPlus, Layers, Filter, Calculator, Check, AlertCircle } from 'lucide-react';
import EditCategoryModal from './EditCategoryModal';

export default function CostHeadsManager({
  costHeadsList,
  categoriesList,
  draggedIdx,
  dragOverIdx,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  handleDrop,
  handleMoveStep,
  openAddCostHeadModal,
  openEditCostHeadModal,
  handleDeleteCostHead,
  handleBatchDeleteCostHeads,
  showCostHeadModal,
  setShowCostHeadModal,
  editingCostHead,
  costHeadForm,
  setCostHeadForm,
  handleSaveCostHead,
  openAddCategoryModal,
  openManageCategoriesModal,
  handleUpdateCategory,
  handleDeleteCategory,
  onToggleMathTool,
  moduleName = 'Food & Dining'
}) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);

  // Filter cost heads by category if a pill is clicked
  const filteredCostHeads = selectedCategoryFilter === 'all'
    ? costHeadsList
    : costHeadsList.filter(ch => String(ch.category_id) === String(selectedCategoryFilter));

  const isAllSelected = filteredCostHeads.length > 0 && filteredCostHeads.every(ch => selectedIds.includes(ch.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredSet = new Set(filteredCostHeads.map(ch => ch.id));
      setSelectedIds(prev => prev.filter(id => !filteredSet.has(id)));
    } else {
      const combined = new Set([...selectedIds, ...filteredCostHeads.map(ch => ch.id)]);
      setSelectedIds(Array.from(combined));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirmBatchDelete = async () => {
    if (!handleBatchDeleteCostHeads || selectedIds.length === 0) return;
    await handleBatchDeleteCostHeads(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '20px 24px',
        border: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
            {moduleName} Master Data Configuration
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
            Manage <strong>Categories</strong> and <strong>Line Items / Cost Heads</strong>. Add new categories directly, create them simultaneously with line items, or reorder entries via drag & drop.
          </p>
        </div>

        {/* Action Buttons: Add Category & Add Line Item */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          <button
            type="button"
            onClick={openAddCategoryModal}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1.5px solid #bfdbfe',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <FolderPlus size={16} />
            <span>+ Add Category</span>
          </button>

          <button
            type="button"
            onClick={openManageCategoriesModal}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid #cbd5e1',
              cursor: 'pointer'
            }}
          >
            <Layers size={15} />
            <span>Manage Categories ({categoriesList.length})</span>
          </button>

          <button
            type="button"
            onClick={openAddCostHeadModal}
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
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>+ Add Line Item</span>
          </button>

          {onToggleMathTool && (
            <button
              type="button"
              onClick={onToggleMathTool}
              title="Open interactive calculator & operational math formulas side-by-side"
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#f0fdf4',
                color: '#047857',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1.5px solid #bbf7d0',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Calculator size={15} />
              <span>🧮 Math Tools</span>
            </button>
          )}
        </div>
      </div>

      {/* CATEGORY FILTER PILLS BAR */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '12px 18px',
        border: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px', flexShrink: 0 }}>
          <Filter size={14} color="#64748b" />
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
            Filter Categories:
          </span>
        </div>

        <button
          type="button"
          onClick={() => setSelectedCategoryFilter('all')}
          style={{
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: selectedCategoryFilter === 'all' ? '800' : '600',
            backgroundColor: selectedCategoryFilter === 'all' ? '#0f172a' : '#f1f5f9',
            color: selectedCategoryFilter === 'all' ? '#ffffff' : '#475569',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          All Items ({costHeadsList.length})
        </button>

        {categoriesList.map(cat => {
          const isSelected = String(selectedCategoryFilter) === String(cat.id);
          const count = costHeadsList.filter(ch => ch.category_id === cat.id).length;

          return (
            <div
              key={cat.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '20px',
                backgroundColor: isSelected ? '#2563eb' : '#f8fafc',
                border: isSelected ? '1px solid #1d4ed8' : '1px solid #e2e8f0',
                overflow: 'hidden',
                transition: 'all 0.15s ease'
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                onDoubleClick={() => setEditingCategory(cat)}
                title={`Filter by ${cat.name} (Double-click to rename)`}
                style={{
                  padding: '5px 8px 5px 12px',
                  fontSize: '12px',
                  fontWeight: isSelected ? '800' : '600',
                  backgroundColor: 'transparent',
                  color: isSelected ? '#ffffff' : '#334155',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{cat.name}</span>
                <span style={{
                  fontSize: '10.5px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: isSelected ? '#ffffff' : '#475569',
                  fontWeight: '700'
                }}>
                  {count}
                </span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCategory(cat);
                }}
                title={`Rename / Edit Category "${cat.name}"`}
                style={{
                  padding: '5px 7px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderLeft: isSelected ? '1px solid rgba(255,255,255,0.3)' : '1px solid #e2e8f0',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = isSelected ? '#ffffff' : '#2563eb';
                  e.currentTarget.style.backgroundColor = isSelected ? 'rgba(255,255,255,0.2)' : '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isSelected ? '#ffffff' : '#94a3b8';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Edit size={11} />
              </button>
            </div>
          );
        })}

        {/* Quick Add Category Pill */}
        <button
          type="button"
          onClick={openAddCategoryModal}
          style={{
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            border: '1px dashed #3b82f6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Plus size={13} />
          <span>New Category</span>
        </button>
      </div>

      {/* ACTIVE CATEGORY ACTION BANNER (Allows direct rename & delete right on Master Data page) */}
      {selectedCategoryFilter !== 'all' && (() => {
        const currentCat = categoriesList.find(c => String(c.id) === String(selectedCategoryFilter));
        if (!currentCat) return null;
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: '10px',
            padding: '10px 16px',
            flexWrap: 'wrap',
            gap: '10px',
            boxShadow: '0 2px 6px rgba(37,99,235,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={16} color="#2563eb" />
                <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: '600' }}>Active Filter:</span>
                <strong style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: '800' }}>{currentCat.name}</strong>
              </div>
              {currentCat.code && (
                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', backgroundColor: '#ffffff', padding: '2px 7px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  {currentCat.code}
                </span>
              )}
              <span style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: '700', backgroundColor: '#dbeafe', padding: '2px 9px', borderRadius: '12px' }}>
                {filteredCostHeads.length} line items attached
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setEditingCategory(currentCat)}
                title="Rename / Edit this Category Name"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(37,99,235,0.25)'
                }}
              >
                <Edit size={13} />
                <span>Rename / Edit Category</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (handleDeleteCategory) {
                    handleDeleteCategory(currentCat);
                    setSelectedCategoryFilter('all');
                  }
                }}
                title="Delete this Category"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: '1px solid #fca5a5',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                title="Clear category filter"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer'
                }}
              >
                <X size={13} />
                <span>Clear Filter</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* BATCH ACTION BANNER (SELECTED & DELETE) */}
      {selectedIds.length > 0 && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1.5px solid #fca5a5',
          borderRadius: '10px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '12.5px',
              padding: '4px 12px',
              borderRadius: '9999px',
              letterSpacing: '0.02em'
            }}>
              {selectedIds.length} Selected
            </span>
            <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#991b1b' }}>
              {selectedIds.length} line item(s) chosen from master data
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={handleConfirmBatchDelete}
              style={{
                padding: '7px 18px',
                borderRadius: '6px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 5px rgba(220, 38, 38, 0.3)',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              <Trash2 size={15} />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* DRAG AND DROP REORDER TABLE */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GripVertical size={18} color="#2563eb" />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
              Line Items Order ({filteredCostHeads.length} Items)
            </h3>
            {selectedIds.length > 0 && (
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', backgroundColor: '#fef2f2', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                {selectedIds.length} selected
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Trash2 size={13} />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            )}
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {selectedCategoryFilter === 'all'
                ? '✋ Grab handle or use ⬆️ ⬇️ to reorder • Auto-saves to PostgreSQL'
                : `Showing items under filtered category`}
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '12px 14px', width: '5%', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    title="Select / Deselect All Line Items"
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#dc2626' }}
                  />
                </th>
                <th style={{ padding: '12px 16px', width: '8%', textAlign: 'center' }}>Reorder</th>
                <th style={{ padding: '12px 16px', width: '6%', textAlign: 'center' }}>#</th>
                <th style={{ padding: '12px 20px', width: '35%', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '12px 20px', width: '34%', textAlign: 'left' }}>Description / Cost Head</th>
                <th style={{ padding: '12px 16px', width: '12%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCostHeads.map((ch, idx) => {
                const originalIdx = costHeadsList.findIndex(x => x.id === ch.id);
                const isDragging = draggedIdx === originalIdx;
                const isOver = dragOverIdx === originalIdx;
                const isSelected = selectedIds.includes(ch.id);

                return (
                  <tr
                    key={ch.id}
                    draggable={selectedCategoryFilter === 'all'}
                    onDragStart={(e) => handleDragStart(e, originalIdx)}
                    onDragOver={(e) => handleDragOver(e, originalIdx)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, originalIdx)}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isSelected
                        ? '#fef2f2'
                        : (isOver ? '#eff6ff' : (isDragging ? '#e2e8f0' : (idx % 2 === 0 ? '#ffffff' : '#fafafa'))),
                      opacity: isDragging ? 0.5 : 1,
                      transition: 'background-color 0.15s ease',
                      cursor: selectedCategoryFilter === 'all' ? 'grab' : 'default'
                    }}
                  >
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(ch.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#dc2626' }}
                      />
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span title={selectedCategoryFilter === 'all' ? "Drag to reorder" : "Clear filter to drag"} style={{ cursor: selectedCategoryFilter === 'all' ? 'grab' : 'default', color: '#94a3b8' }}>
                          <GripVertical size={16} />
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(originalIdx, -1)}
                          disabled={originalIdx === 0}
                          title="Move Up"
                          style={{
                            padding: '3px 5px',
                            borderRadius: '4px',
                            backgroundColor: '#f1f5f9',
                            color: originalIdx === 0 ? '#cbd5e1' : '#334155',
                            cursor: originalIdx === 0 ? 'not-allowed' : 'pointer',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(originalIdx, 1)}
                          disabled={originalIdx === costHeadsList.length - 1}
                          title="Move Down"
                          style={{
                            padding: '3px 5px',
                            borderRadius: '4px',
                            backgroundColor: '#f1f5f9',
                            color: originalIdx === costHeadsList.length - 1 ? '#cbd5e1' : '#334155',
                            cursor: originalIdx === costHeadsList.length - 1 ? 'not-allowed' : 'pointer',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace', color: '#64748b', fontWeight: '600' }}>
                      #{idx + 1}
                    </td>

                    <td style={{ padding: '12px 20px', fontWeight: '600', color: '#1e293b' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#f1f5f9',
                          color: '#1e293b',
                          border: '1px solid #e2e8f0',
                          fontSize: '12.5px'
                        }}>
                          {ch.category_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const cat = categoriesList.find(c => c.id === ch.category_id);
                            if (cat) setEditingCategory(cat);
                          }}
                          title={`Rename / Edit Category "${ch.category_name}"`}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#2563eb';
                            e.currentTarget.style.backgroundColor = '#eff6ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#94a3b8';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Edit size={12} />
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: '12px 20px', fontWeight: '700', color: '#0f172a' }}>
                      {ch.name}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => openEditCostHeadModal(ch)}
                          title="Edit Description / Category"
                          style={{ padding: '5px 8px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer' }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCostHead(ch)}
                          title="Delete / Deactivate"
                          style={{ padding: '5px 8px', borderRadius: '4px', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT LINE ITEM WITH SIMULTANEOUS CATEGORY CREATION */}
      {showCostHeadModal && (
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
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 22px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
                {editingCostHead ? 'Edit Line Item' : 'Add Category & Description'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCostHeadModal(false)}
                style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCostHead} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Category Selector / Creator */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                    Category *
                  </label>
                  {!editingCostHead && (
                    <button
                      type="button"
                      onClick={() => {
                        setCostHeadForm(prev => ({
                          ...prev,
                          is_new_category: !prev.is_new_category,
                          new_category_name: ''
                        }));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {costHeadForm.is_new_category ? '← Pick Existing Category' : '+ Add New Category at same time'}
                    </button>
                  )}
                </div>

                {costHeadForm.is_new_category ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#eff6ff',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <FolderPlus size={16} color="#2563eb" />
                      <input
                        type="text"
                        placeholder="Enter New Category Name (e.g. Bakery Goods, Snacks Bar)"
                        value={costHeadForm.new_category_name || ''}
                        onChange={(e) => setCostHeadForm({ ...costHeadForm, new_category_name: e.target.value })}
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          backgroundColor: 'transparent',
                          fontSize: '13.5px',
                          fontWeight: '600',
                          color: '#0f172a'
                        }}
                        required
                        autoFocus
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '500' }}>
                      ⚡ Both this new Category and the Line Item will be saved simultaneously!
                    </span>
                  </div>
                ) : (
                  <select
                    value={costHeadForm.category_id}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setCostHeadForm(prev => ({ ...prev, is_new_category: true, new_category_name: '' }));
                      } else {
                        setCostHeadForm({ ...costHeadForm, category_id: e.target.value, is_new_category: false });
                      }
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', fontWeight: '600', color: '#0f172a', backgroundColor: '#ffffff' }}
                    required
                  >
                    {categoriesList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    {!editingCostHead && (
                      <option value="__new__" style={{ color: '#2563eb', fontWeight: 'bold' }}>
                        ➕ + Create New Category...
                      </option>
                    )}
                  </select>
                )}
              </div>

              {/* Description / Cost Head */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Description / Cost Head *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Snacks Vendor, Kitchen Equipment AMC, Bakery Goods"
                  value={costHeadForm.name}
                  onChange={(e) => setCostHeadForm({ ...costHeadForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCostHeadModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.3)' }}
                >
                  {costHeadForm.is_new_category
                    ? 'Create Category & Line Item'
                    : (editingCostHead ? 'Save Changes' : 'Add Line Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT / RENAME CATEGORY */}
      <EditCategoryModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
        onUpdateCategory={handleUpdateCategory}
      />
    </div>
  );
}
