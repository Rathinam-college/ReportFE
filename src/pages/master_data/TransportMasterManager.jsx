import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Plus, Search, Filter, Trash2, Edit2, CheckCircle2, 
  AlertTriangle, Calculator, Layers, HelpCircle, Save, Check, X, Shield, ArrowUpDown, Bus
} from 'lucide-react';
import AddTransportParameterModal from './AddTransportParameterModal';

export default function TransportMasterManager() {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParamId, setEditingParamId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Fetch parameters from backend API
  const fetchParameters = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/transport/parameters');
      if (res.ok) {
        const data = await res.json();
        setParameters(data);
      } else {
        throw new Error('Failed to fetch transport parameters');
      }
    } catch (err) {
      console.error('Error fetching transport parameters:', err);
      setMessage({ type: 'error', text: 'Could not fetch transport parameters from database. Please check backend connection.' });
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
      const res = await fetch('/api/transport/parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paramData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create parameter');
      }
      setMessage({ type: 'success', text: `Added parameter "${paramData.param_name}" to Transport Master Data!` });
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
      const res = await fetch(`/api/transport/parameters/${paramId}`, {
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
      param_name: param.param_name,
      section: param.section,
      input_type: param.input_type,
      unit: param.unit || '',
      formula: param.formula || ''
    });
  };

  // Save inline edit
  const handleSaveEdit = async (paramId) => {
    try {
      const res = await fetch(`/api/transport/parameters/${paramId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update parameter');
      }
      setMessage({ type: 'success', text: 'Parameter updated successfully.' });
      setEditingParamId(null);
      fetchParameters();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error updating parameter' });
    } finally {
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Group sections
  const existingSections = useMemo(() => {
    const secs = new Set(parameters.map(p => p.section).filter(Boolean));
    return Array.from(secs);
  }, [parameters]);

  // Section theme colors matching the user's Excel mockup
  const getSectionTheme = (sec) => {
    const s = (sec || '').toLowerCase();
    if (s.includes('fleet') || s.includes('distance')) {
      return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', badge: '#0284c7' };
    }
    if (s.includes('expense') || s.includes('cost')) {
      return { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa', badge: '#ea580c' };
    }
    if (s.includes('revenue') || s.includes('income')) {
      return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', badge: '#d97706' };
    }
    if (s.includes('budget') || s.includes('balance')) {
      return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', badge: '#16a34a' };
    }
    if (s.includes('ticket') || s.includes('compliance')) {
      return { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff', badge: '#9333ea' };
    }
    if (s.includes('fuel') || s.includes('energy')) {
      return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', badge: '#475569' };
    }
    if (s.includes('fee') || s.includes('student') || s.includes('analytic')) {
      return { bg: '#fef9c3', text: '#a16207', border: '#fef08a', badge: '#ca8a04' };
    }
    return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff', badge: '#a855f7' };
  };

  // Filtered parameters
  const filteredParameters = useMemo(() => {
    return parameters.filter(p => {
      const matchSearch = p.param_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.formula && p.formula.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchSection = selectedSection === 'ALL' || p.section === selectedSection;
      return matchSearch && matchSection;
    });
  }, [parameters, searchTerm, selectedSection]);

  const totalCalculated = parameters.filter(p => !!p.formula).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* 1. TOP HEADER & OVERVIEW STATS */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Transport Fleet Master Configuration
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Transport Parameters & Spreadsheet Template Manager
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Configure and manage parameters, formulas, and sections for all 4 institutions (RPS, KPM, Common, University).
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#fff7ed',
            borderRadius: '10px',
            border: '1px solid #fed7aa',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#ea580c' }}>{parameters.length}</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#c2410c' }}>Total Parameters</div>
          </div>

          <div style={{
            padding: '8px 16px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#334155' }}>{existingSections.length}</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Sections</div>
          </div>

          <div style={{
            padding: '8px 16px',
            backgroundColor: '#ecfdf5',
            borderRadius: '10px',
            border: '1px solid #a7f3d0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>{totalCalculated}</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#047857' }}>Auto Formulas</div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: '10px 18px',
              backgroundColor: '#ea580c',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)'
            }}
          >
            <Plus size={16} />
            <span>Add Transport Parameter</span>
          </button>
        </div>
      </div>

      {/* 2. FEEDBACK ALERT MESSAGE */}
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
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: message.type === 'success' ? '#166534' : '#991b1b'
        }}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 3. CONTROLS: SEARCH & SECTION FILTER PILLS */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '14px 20px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search parameter, formula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Section Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSelectedSection('ALL')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: selectedSection === 'ALL' ? '700' : '600',
              backgroundColor: selectedSection === 'ALL' ? '#ea580c' : '#f1f5f9',
              color: selectedSection === 'ALL' ? '#ffffff' : '#64748b',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            All Sections ({parameters.length})
          </button>
          {existingSections.map(sec => {
            const count = parameters.filter(p => p.section === sec).length;
            const isSel = selectedSection === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSection(sec)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isSel ? '700' : '600',
                  backgroundColor: isSel ? '#ea580c' : '#f8fafc',
                  color: isSel ? '#ffffff' : '#475569',
                  border: isSel ? 'none' : '1px solid #e2e8f0',
                  cursor: 'pointer'
                }}
              >
                {sec} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. PARAMETERS MASTER DATA TABLE */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1.5px solid #cbd5e1',
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '12px 16px', fontWeight: '800', color: '#1e293b', width: '50px' }}>#</th>
                <th style={{ padding: '12px 16px', fontWeight: '800', color: '#1e293b', minWidth: '240px' }}>Parameter Name</th>
                <th style={{ padding: '12px 16px', fontWeight: '800', color: '#1e293b', minWidth: '180px' }}>Section</th>
                <th style={{ padding: '12px 16px', fontWeight: '800', color: '#1e293b', width: '140px' }}>Input Type</th>
                <th style={{ padding: '12px 16px', fontWeight: '800', color: '#1e293b', width: '100px' }}>Unit</th>
                <th style={{ padding: '12px 16px', fontWeight: '800', color: '#1e293b', minWidth: '220px' }}>Formula / Definition</th>
                <th style={{ padding: '12px 16px', fontWeight: '800', color: '#1e293b', width: '110px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Loading Transport Master Parameters...
                  </td>
                </tr>
              ) : filteredParameters.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No parameters found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredParameters.map((param, pIdx) => {
                  const isEditing = editingParamId === param.id;
                  const theme = getSectionTheme(param.section);

                  return (
                    <tr
                      key={param.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isEditing ? '#fff7ed' : (pIdx % 2 === 0 ? '#ffffff' : '#fcfcfd')
                      }}
                    >
                      {/* S.No */}
                      <td style={{ padding: '10px 16px', fontWeight: '700', color: '#94a3b8' }}>
                        {pIdx + 1}
                      </td>

                      {/* Parameter Name */}
                      <td style={{ padding: '10px 16px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.param_name}
                            onChange={(e) => setEditForm({ ...editForm, param_name: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1.5px solid #ea580c',
                              fontSize: '13px',
                              fontWeight: '700',
                              outline: 'none'
                            }}
                          />
                        ) : (
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>
                            {param.param_name}
                            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px', fontFamily: 'monospace' }}>
                              ({param.param_key})
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Section */}
                      <td style={{ padding: '10px 16px' }}>
                        {isEditing ? (
                          <select
                            value={editForm.section}
                            onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px'
                            }}
                          >
                            {existingSections.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            backgroundColor: theme.bg,
                            color: theme.text,
                            border: `1px solid ${theme.border}`
                          }}>
                            {param.section}
                          </span>
                        )}
                      </td>

                      {/* Input Type */}
                      <td style={{ padding: '10px 16px' }}>
                        {isEditing ? (
                          <select
                            value={editForm.input_type}
                            onChange={(e) => setEditForm({ ...editForm, input_type: e.target.value })}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px'
                            }}
                          >
                            <option value="cost">Financial Cost</option>
                            <option value="single_number">Distance / Quantity</option>
                            <option value="single_count">Headcount / Count</option>
                            <option value="text">Fleet Text</option>
                          </select>
                        ) : (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            backgroundColor: '#f1f5f9',
                            color: '#475569'
                          }}>
                            {param.input_type === 'cost' ? 'Financial Cost' :
                             param.input_type === 'single_number' ? 'Distance / Qty' :
                             param.input_type === 'single_count' ? 'Count / Headcount' : 'Text'}
                          </span>
                        )}
                      </td>

                      {/* Unit */}
                      <td style={{ padding: '10px 16px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.unit}
                            onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                            style={{
                              width: '70px',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px'
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                            {param.unit || '—'}
                          </span>
                        )}
                      </td>

                      {/* Formula / Definition */}
                      <td style={{ padding: '10px 16px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.formula}
                            placeholder="e.g. Demand - Paid"
                            onChange={(e) => setEditForm({ ...editForm, formula: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}
                          />
                        ) : param.formula ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '11.5px',
                            color: '#1d4ed8',
                            fontFamily: 'monospace',
                            fontWeight: '600'
                          }}>
                            <Calculator size={13} color="#2563eb" />
                            <span>= {param.formula}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Manual Input
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(param.id)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingParamId(null)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#64748b',
                                color: '#ffffff',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(param)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                color: '#475569',
                                cursor: 'pointer'
                              }}
                              title="Edit Parameter / Formula"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteParameter(param.id, param.param_name)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                cursor: 'pointer'
                              }}
                              title="Delete Parameter"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transport Parameter Modal */}
      <AddTransportParameterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddParameter={handleAddParameter}
        existingSections={existingSections}
      />
    </div>
  );
}
