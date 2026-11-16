import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Plus, Search, Filter, Trash2, Edit2, CheckCircle2, 
  AlertTriangle, Calculator, Layers, HelpCircle, Save, Check, X, Shield, ArrowUpDown
} from 'lucide-react';
import AddHostelParameterModal from './AddHostelParameterModal';

export default function HostelMasterManager() {
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
      const res = await fetch('/api/hostel/parameters');
      if (res.ok) {
        const data = await res.json();
        setParameters(data);
      } else {
        throw new Error('Failed to fetch hostel parameters');
      }
    } catch (err) {
      console.error('Error fetching hostel parameters:', err);
      setMessage({ type: 'error', text: 'Could not fetch parameters from database. Please check connection.' });
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
      const res = await fetch('/api/hostel/parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paramData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create parameter');
      }
      const data = await res.json();
      setMessage({ type: 'success', text: `Added parameter "${paramData.param_name}" to Hostel Master Data!` });
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
      const res = await fetch(`/api/hostel/parameters/${paramId}`, {
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
      const res = await fetch(`/api/hostel/parameters/${paramId}`, {
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

  // Section theme colors matching user Excel images
  const getSectionTheme = (sec) => {
    const s = (sec || '').toLowerCase();
    if (s.includes('occupan') || s.includes('census')) {
      return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', badge: '#0284c7' };
    }
    if (s.includes('ticket') || s.includes('maint')) {
      return { bg: '#fffbeb', text: '#b45309', border: '#fef3c7', badge: '#f59e0b' };
    }
    if (s.includes('utilit') || s.includes('expens')) {
      return { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', badge: '#e11d48' };
    }
    if (s.includes('budget') || s.includes('balan')) {
      return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', badge: '#10b981' };
    }
    if (s.includes('student') || s.includes('area') || s.includes('kpi')) {
      return { bg: '#f8fafc', text: '#334155', border: '#e2e8f0', badge: '#64748b' };
    }
    if (s.includes('water')) {
      return { bg: '#f0f9ff', text: '#0284c7', border: '#bae6fd', badge: '#0ea5e9' };
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
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Hostel Master Configuration
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Hostel Parameters & Spreadsheet Template Manager
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Configure and manage parameters, formulas, and sections for the Hostel Data Entry spreadsheet.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#f0f9ff',
            borderRadius: '10px',
            border: '1px solid #bae6fd',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0284c7' }}>{parameters.length}</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1' }}>Total Parameters</div>
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
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#047857' }}>{totalCalculated}</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#065f46' }}>Formulas</div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)'
            }}
          >
            <Plus size={16} />
            <span>Add Parameter / Row</span>
          </button>
        </div>
      </div>

      {/* 2. NOTIFICATION MESSAGE */}
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

      {/* 3. TOOLBAR: SEARCH & SECTION FILTER */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '12px 18px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#f8fafc',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          width: '320px'
        }}>
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search parameter, section, or formula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '13px',
              color: '#0f172a',
              width: '100%'
            }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={14} color="#94a3b8" />
            </button>
          )}
        </div>

        {/* Section Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginRight: '4px' }}>
            Section:
          </span>
          <button
            onClick={() => setSelectedSection('ALL')}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: selectedSection === 'ALL' ? '700' : '600',
              backgroundColor: selectedSection === 'ALL' ? '#0284c7' : '#f1f5f9',
              color: selectedSection === 'ALL' ? '#ffffff' : '#475569',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            All ({parameters.length})
          </button>
          {existingSections.map(sec => {
            const count = parameters.filter(p => p.section === sec).length;
            const isSel = selectedSection === sec;
            return (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: isSel ? '700' : '600',
                  backgroundColor: isSel ? '#0284c7' : '#f1f5f9',
                  color: isSel ? '#ffffff' : '#475569',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {sec} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. PARAMETERS SPREADSHEET TABLE */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                color: '#475569',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.03em'
              }}>
                <th style={{ padding: '12px 14px', width: '60px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '12px 16px', minWidth: '240px' }}>Parameter Name</th>
                <th style={{ padding: '12px 16px', width: '220px' }}>Section / Group</th>
                <th style={{ padding: '12px 14px', width: '160px' }}>Input Format</th>
                <th style={{ padding: '12px 12px', width: '90px' }}>Unit</th>
                <th style={{ padding: '12px 16px', minWidth: '220px' }}>Formula / Calculation Rule</th>
                <th style={{ padding: '12px 14px', width: '100px', textAlign: 'center' }}>Type</th>
                <th style={{ padding: '12px 14px', width: '90px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    Loading hostel parameters from database...
                  </td>
                </tr>
              ) : filteredParameters.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    No parameters found matching your search.
                  </td>
                </tr>
              ) : (
                filteredParameters.map((param, idx) => {
                  const secTheme = getSectionTheme(param.section);
                  const isEditing = editingParamId === param.id;

                  return (
                    <tr
                      key={param.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isEditing ? '#f0f9ff' : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background-color 0.1s ease'
                      }}
                    >
                      {/* S.No */}
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                        {param.display_order || idx + 1}
                      </td>

                      {/* Parameter Name */}
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.param_name}
                            onChange={(e) => setEditForm({ ...editForm, param_name: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid #0284c7',
                              fontSize: '13px',
                              fontWeight: '700'
                            }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{param.param_name}</span>
                            {param.is_system && (
                              <span title="System Parameter" style={{ color: '#94a3b8' }}>
                                <Shield size={12} />
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Section */}
                      <td style={{ padding: '12px 16px' }}>
                        {isEditing ? (
                          <select
                            value={editForm.section}
                            onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid #0284c7',
                              fontSize: '12.5px'
                            }}
                          >
                            {existingSections.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: '700',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            backgroundColor: secTheme.bg,
                            color: secTheme.text,
                            border: `1px solid ${secTheme.border}`,
                            whiteSpace: 'nowrap'
                          }}>
                            {param.section}
                          </span>
                        )}
                      </td>

                      {/* Input Format */}
                      <td style={{ padding: '12px 14px' }}>
                        {isEditing ? (
                          <select
                            value={editForm.input_type}
                            onChange={(e) => setEditForm({ ...editForm, input_type: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid #0284c7',
                              fontSize: '12px'
                            }}
                          >
                            <option value="cost">Amount (₹)</option>
                            <option value="boys_girls_total">Boys | Girls | Total</option>
                            <option value="units_and_cost">Units & Cost</option>
                            <option value="single_number">Single Number</option>
                            <option value="single_count">Single Count</option>
                            <option value="percentage">Percentage (%)</option>
                            <option value="formula">Formula</option>
                          </select>
                        ) : (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#f1f5f9',
                            color: '#475569'
                          }}>
                            {param.input_type === 'boys_girls_total' && 'Boys | Girls | Total'}
                            {param.input_type === 'units_and_cost' && 'Units & Cost'}
                            {param.input_type === 'cost' && 'Amount (₹)'}
                            {param.input_type === 'single_count' && 'Count'}
                            {param.input_type === 'single_number' && 'Numeric'}
                            {param.input_type === 'percentage' && 'Percentage (%)'}
                            {param.input_type === 'formula' && 'Formula'}
                          </span>
                        )}
                      </td>

                      {/* Unit */}
                      <td style={{ padding: '12px 12px', color: '#64748b', fontSize: '12.5px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.unit}
                            onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                            style={{
                              width: '60px',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              border: '1px solid #0284c7',
                              fontSize: '12px'
                            }}
                          />
                        ) : (
                          param.unit || '—'
                        )}
                      </td>

                      {/* Formula / Calculation Rule */}
                      <td style={{ padding: '12px 16px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.formula}
                            placeholder="e.g. Boys + Girls"
                            onChange={(e) => setEditForm({ ...editForm, formula: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid #0284c7',
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}
                          />
                        ) : param.formula ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '11.5px',
                            fontFamily: 'monospace',
                            color: '#166534'
                          }}>
                            <Calculator size={11} />
                            <span>= {param.formula}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Direct User Entry</span>
                        )}
                      </td>

                      {/* Type Badge (System vs Custom) */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: param.is_system ? '#f1f5f9' : '#e0f2fe',
                          color: param.is_system ? '#64748b' : '#0284c7'
                        }}>
                          {param.is_system ? 'Standard' : 'Custom'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              onClick={() => handleSaveEdit(param.id)}
                              title="Save changes"
                              style={{
                                padding: '4px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: '#10b981',
                                color: '#ffffff',
                                cursor: 'pointer'
                              }}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingParamId(null)}
                              title="Cancel"
                              style={{
                                padding: '4px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: '#94a3b8',
                                color: '#ffffff',
                                cursor: 'pointer'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              onClick={() => handleStartEdit(param)}
                              title="Edit Parameter"
                              style={{
                                padding: '5px',
                                borderRadius: '4px',
                                border: 'none',
                                background: 'transparent',
                                color: '#64748b',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit2 size={13} />
                            </button>
                            {!param.is_system && (
                              <button
                                onClick={() => handleDeleteParameter(param.id, param.param_name)}
                                title="Delete Parameter"
                                style={{
                                  padding: '5px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#ef4444',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
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

      {/* MODAL: ADD PARAMETER */}
      <AddHostelParameterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddParameter={handleAddParameter}
        existingSections={existingSections}
      />

    </div>
  );
}
