import React, { useState, useEffect, useMemo } from 'react';
import { 
  Video, Plus, Search, Filter, Trash2, Edit2, CheckCircle2, 
  AlertTriangle, Calculator, Layers, HelpCircle, Save, Check, X, Shield, 
  ArrowUpDown, GripVertical, ArrowUp, ArrowDown
} from 'lucide-react';
import AddCctvParameterModal from './AddCctvParameterModal';

export default function CctvMasterManager() {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParamId, setEditingParamId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isReordering, setIsReordering] = useState(false);

  // Fetch parameters from backend API
  const fetchParameters = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cctv/parameters');
      if (res.ok) {
        const data = await res.json();
        setParameters(data);
      } else {
        throw new Error('Failed to fetch CCTV parameters');
      }
    } catch (err) {
      console.error('Error fetching CCTV parameters:', err);
      setMessage({ type: 'error', text: 'Could not fetch parameters from database. Please check backend connection.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, []);

  // Add new parameter
  const handleAddParameter = async (paramData) => {
    try {
      const res = await fetch('/api/cctv/parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paramData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create parameter');
      }
      setMessage({ type: 'success', text: `Added parameter "${paramData.param_name}" to CCTV Master Data!` });
      fetchParameters();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error creating parameter' });
    } finally {
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Delete parameter
  const handleDeleteParameter = async (paramId, paramName) => {
    if (!window.confirm(`Are you sure you want to remove the parameter "${paramName}"?`)) return;
    try {
      const res = await fetch(`/api/cctv/parameters/${paramId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete parameter');
      }
      setMessage({ type: 'success', text: `Parameter "${paramName}" removed successfully.` });
      fetchParameters();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error deleting parameter' });
    } finally {
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Start inline editing
  const handleStartEdit = (param) => {
    setEditingParamId(param.id);
    setEditForm({
      s_no: (param.s_no !== undefined && param.s_no !== null) ? param.s_no : '',
      param_name: param.param_name,
      section: param.section,
      input_type: param.input_type,
      unit: param.unit || '',
      formula: param.formula || '',
      display_order: param.display_order || 50
    });
  };

  // Save inline edit
  const handleSaveEdit = async (paramId) => {
    try {
      const res = await fetch(`/api/cctv/parameters/${paramId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update parameter');
      }
      setMessage({ type: 'success', text: `Updated "${editForm.param_name}" successfully.` });
      setEditingParamId(null);
      fetchParameters();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error updating parameter' });
    } finally {
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Move parameter up or down
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= parameters.length) return;

    const reordered = [...parameters];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setParameters(reordered);
    const orderedIds = reordered.map(p => p.id);

    try {
      setIsReordering(true);
      const res = await fetch('/api/cctv/parameters/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordered_ids: orderedIds })
      });
      if (!res.ok) throw new Error('Failed to save reorder');
    } catch (err) {
      console.error('Reorder error:', err);
      fetchParameters();
    } finally {
      setIsReordering(false);
    }
  };

  // Unique sections list
  const sectionsList = useMemo(() => {
    const set = new Set();
    parameters.forEach(p => {
      if (p.section) set.add(p.section);
    });
    return Array.from(set);
  }, [parameters]);

  // Section style helpers matching user's Excel Mockup colors
  const getSectionColor = (secName) => {
    switch (secName) {
      case 'Projects':
        return { bg: '#d9ead3', text: '#274e13', border: '#b6d7a8' };
      case 'Complaints':
        return { bg: '#fff2cc', text: '#7f6000', border: '#ffe599' };
      case 'Service request':
        return { bg: '#c9daf8', text: '#1155cc', border: '#a4c2f4' };
      case 'PPM':
        return { bg: '#e2efda', text: '#375623', border: '#c6e0b4' };
      case 'Quality Issues':
        return { bg: '#d9d2e9', text: '#351c75', border: '#b4a7d6' };
      case 'Expenses':
        return { bg: '#fce5cd', text: '#783f04', border: '#f9cb9c' };
      case 'Budget Tracking':
        return { bg: '#d9ead3', text: '#274e13', border: '#a9d08e' };
      default:
        return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
    }
  };

  // Filtered parameters
  const filteredParameters = useMemo(() => {
    return parameters.filter(param => {
      const matchesSearch = 
        (param.param_name && param.param_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (param.param_key && param.param_key.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (param.section && param.section.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSection = selectedSection === 'ALL' || param.section === selectedSection;

      return matchesSearch && matchesSection;
    });
  }, [parameters, searchTerm, selectedSection]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header Banner & Action Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#e0e7ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.15)'
          }}>
            <Video size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                CCTV Master Parameters & Metrics
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: '#e0e7ff',
                color: '#4338ca'
              }}>
                {parameters.length} Parameters
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Configure surveillance projects, complaints, service tickets, quality issues, expenses, and budget metrics
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: '700',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={15} />
            Add Parameter
          </button>
        </div>
      </div>

      {/* 2. Notification Message */}
      {message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: '500',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 3. Search & Section Filters Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        padding: '14px 20px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          minWidth: '240px',
          flex: 1,
          maxWidth: '380px'
        }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search parameter, key, or section..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '12.5px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Section Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedSection('ALL')}
            style={{
              padding: '5px 12px',
              borderRadius: '9999px',
              fontSize: '11.5px',
              fontWeight: selectedSection === 'ALL' ? '700' : '500',
              backgroundColor: selectedSection === 'ALL' ? '#0f172a' : '#f1f5f9',
              color: selectedSection === 'ALL' ? '#ffffff' : '#64748b',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            All ({parameters.length})
          </button>
          {sectionsList.map(sec => {
            const isSel = selectedSection === sec;
            const secColors = getSectionColor(sec);
            return (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontWeight: isSel ? '700' : '500',
                  backgroundColor: isSel ? secColors.bg : '#ffffff',
                  color: isSel ? secColors.text : '#475569',
                  border: `1px solid ${isSel ? secColors.border : '#e2e8f0'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{sec}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Parameters Data Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Loading CCTV parameters...
          </div>
        ) : filteredParameters.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            No CCTV parameters found matching your search.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '12px 14px', width: '50px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '12px 14px', width: '60px' }}>S.No</th>
                  <th style={{ padding: '12px 14px' }}>Parameter Name</th>
                  <th style={{ padding: '12px 14px' }}>Section Category</th>
                  <th style={{ padding: '12px 14px', width: '90px' }}>Type</th>
                  <th style={{ padding: '12px 14px', width: '80px' }}>Unit</th>
                  <th style={{ padding: '12px 14px' }}>Formula</th>
                  <th style={{ padding: '12px 14px', width: '130px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParameters.map((param, idx) => {
                  const isEditing = editingParamId === param.id;
                  const secColors = getSectionColor(param.section);

                  return (
                    <tr 
                      key={param.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isEditing ? '#f8fafc' : (idx % 2 === 0 ? '#ffffff' : '#fafbfc'),
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Order & Move buttons */}
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <button
                            onClick={() => handleMoveOrder(idx, 'up')}
                            disabled={idx === 0 || isReordering}
                            title="Move Up"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: idx === 0 ? 'default' : 'pointer',
                              color: idx === 0 ? '#cbd5e1' : '#64748b',
                              padding: '2px',
                              lineHeight: 1
                            }}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>{idx + 1}</span>
                          <button
                            onClick={() => handleMoveOrder(idx, 'down')}
                            disabled={idx === filteredParameters.length - 1 || isReordering}
                            title="Move Down"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: idx === filteredParameters.length - 1 ? 'default' : 'pointer',
                              color: idx === filteredParameters.length - 1 ? '#cbd5e1' : '#64748b',
                              padding: '2px',
                              lineHeight: 1
                            }}
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </td>

                      {/* S.No */}
                      <td style={{ padding: '10px 14px', fontWeight: '600', color: '#64748b' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.s_no}
                            onChange={(e) => setEditForm({ ...editForm, s_no: e.target.value })}
                            style={{ width: '45px', padding: '4px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        ) : (
                          param.s_no || '—'
                        )}
                      </td>

                      {/* Parameter Name & Key */}
                      <td style={{ padding: '10px 14px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <input
                              type="text"
                              value={editForm.param_name}
                              onChange={(e) => setEditForm({ ...editForm, param_name: e.target.value })}
                              style={{ width: '100%', padding: '4px 8px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                            <span style={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'monospace' }}>
                              key: {param.param_key}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: param.formula ? '700' : '600', color: '#0f172a' }}>
                              {param.param_name}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'monospace' }}>
                              {param.param_key}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Section */}
                      <td style={{ padding: '10px 14px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.section}
                            onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                            style={{ width: '120px', padding: '4px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        ) : (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: secColors.bg,
                            color: secColors.text,
                            border: `1px solid ${secColors.border}`
                          }}>
                            {param.section}
                          </span>
                        )}
                      </td>

                      {/* Input Type */}
                      <td style={{ padding: '10px 14px' }}>
                        {isEditing ? (
                          <select
                            value={editForm.input_type}
                            onChange={(e) => setEditForm({ ...editForm, input_type: e.target.value })}
                            style={{ padding: '4px 6px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          >
                            <option value="number">number</option>
                            <option value="cost">cost (₹)</option>
                            <option value="decimal">decimal</option>
                            <option value="text">text</option>
                          </select>
                        ) : (
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            fontWeight: '600'
                          }}>
                            {param.input_type}
                          </span>
                        )}
                      </td>

                      {/* Unit */}
                      <td style={{ padding: '10px 14px', color: '#475569' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.unit}
                            onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                            style={{ width: '50px', padding: '4px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        ) : (
                          param.unit || '—'
                        )}
                      </td>

                      {/* Formula */}
                      <td style={{ padding: '10px 14px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="Formula or leave blank"
                            value={editForm.formula}
                            onChange={(e) => setEditForm({ ...editForm, formula: e.target.value })}
                            style={{ width: '100%', padding: '4px 8px', fontSize: '11.5px', fontFamily: 'monospace', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        ) : param.formula ? (
                          <span style={{
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #dbeafe',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Calculator size={11} />
                            {param.formula}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Manual Input</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              onClick={() => handleSaveEdit(param.id)}
                              style={{
                                border: 'none',
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '11.5px',
                                fontWeight: '600'
                              }}
                            >
                              <Check size={13} />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingParamId(null)}
                              style={{
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#64748b',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                cursor: 'pointer',
                                fontSize: '11.5px'
                              }}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => handleStartEdit(param)}
                              title="Edit parameter"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#475569',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px'
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                            {!param.is_system && (
                              <button
                                onClick={() => handleDeleteParameter(param.id, param.param_name)}
                                title="Delete parameter"
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  borderRadius: '4px'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Parameter */}
      <AddCctvParameterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddParameter={handleAddParameter}
        existingSections={sectionsList}
      />
    </div>
  );
}
