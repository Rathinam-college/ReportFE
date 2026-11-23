import React, { useState } from 'react';
import { X, Plus, Calculator, Layers, Tag, HelpCircle, Video, Sparkles } from 'lucide-react';

export default function AddCctvParameterModal({
  isOpen,
  onClose,
  onAddParameter,
  existingSections = []
}) {
  const defaultSections = [
    'Projects',
    'Complaints',
    'Service request',
    'PPM',
    'Quality Issues',
    'Expenses',
    'Budget Tracking',
    'Custom Parameters'
  ];

  const sections = Array.from(new Set([...defaultSections, ...existingSections]));

  const commonCctvFormulas = [
    { label: 'Completed + In Progress', formula: 'projects_completed + projects_in_progress' },
    { label: 'CCTV + Biometric + Flapbarrier', formula: 'complaints_cctv + complaints_biometric + complaints_flapbarrier' },
    { label: 'Quality Received - Closed', formula: 'quality_issues_received - quality_issues_closed' },
    { label: 'Material + Labour Expenses', formula: 'material_expenses + labour_expenses' },
    { label: 'Approved Budget - Spent', formula: 'approved_budget - cumulative_budget_spent' }
  ];

  const [formData, setFormData] = useState({
    s_no: '',
    param_name: '',
    section: 'Custom Parameters',
    new_section: '',
    input_type: 'number',
    unit: 'Nos',
    formula: '',
    display_order: 50
  });

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.param_name.trim()) {
      setError('Parameter Name is required');
      return;
    }

    const finalSection = formData.section === '__new__' 
      ? (formData.new_section.trim() || 'Custom Parameters')
      : formData.section;

    onAddParameter({
      s_no: formData.s_no.trim() || undefined,
      param_name: formData.param_name.trim(),
      section: finalSection,
      input_type: formData.input_type,
      unit: formData.unit.trim() || '',
      formula: formData.formula.trim() || null,
      display_order: Number(formData.display_order) || 50
    });

    onClose();
    // Reset form
    setFormData({
      s_no: '',
      param_name: '',
      section: 'Custom Parameters',
      new_section: '',
      input_type: 'number',
      unit: 'Nos',
      formula: '',
      display_order: 50
    });
    setError('');
  };

  return (
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
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        animation: 'modalFadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #edf2f7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#e0e7ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Video size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                Add CCTV Master Parameter
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Configure a new surveillance, maintenance, or cost metric
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          {/* S.No & Parameter Name */}
          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{ width: '90px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                S.No
              </label>
              <input
                type="text"
                placeholder="e.g. 13"
                value={formData.s_no}
                onChange={(e) => setFormData({ ...formData, s_no: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                Parameter / Cost Head Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Camera Lens Replacement"
                value={formData.param_name}
                onChange={(e) => setFormData({ ...formData, param_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
              Group / Section Category
            </label>
            <select
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
            >
              {sections.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="__new__">+ Create New Section Group...</option>
            </select>

            {formData.section === '__new__' && (
              <input
                type="text"
                placeholder="Enter new section group name"
                value={formData.new_section}
                onChange={(e) => setFormData({ ...formData, new_section: e.target.value })}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #6366f1',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            )}
          </div>

          {/* Input Type & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                Data Type
              </label>
              <select
                value={formData.input_type}
                onChange={(e) => {
                  const it = e.target.value;
                  let defUnit = formData.unit;
                  if (it === 'cost') defUnit = '₹';
                  else if (it === 'number') defUnit = 'Nos';
                  else if (it === 'decimal') defUnit = 'Hrs';
                  setFormData({ ...formData, input_type: it, unit: defUnit });
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
              >
                <option value="number">Integer Count (Nos, Projects, Tickets)</option>
                <option value="cost">Currency Expenditure (₹ INR)</option>
                <option value="decimal">Decimal Metric (Hrs, %, Ratio)</option>
                <option value="text">Text / Status Note</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                Display Unit Label
              </label>
              <input
                type="text"
                placeholder="e.g. Nos, ₹, Hrs, Projects"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Formula Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calculator size={14} color="#6366f1" />
                Computed Formula (Optional)
              </label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Leave blank for manual entry</span>
            </div>
            <input
              type="text"
              placeholder="e.g. material_expenses + labour_expenses"
              value={formData.formula}
              onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />

            {/* Quick Formula Helpers */}
            <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {commonCctvFormulas.map(f => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, formula: f.formula })}
                  style={{
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f1f5f9',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '10px',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '16px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)'
              }}
            >
              <Plus size={16} />
              Add Parameter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
