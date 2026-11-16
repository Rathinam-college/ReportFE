import React, { useState } from 'react';
import { X, Plus, Calculator, Layers, Tag, HelpCircle } from 'lucide-react';

export default function AddHostelParameterModal({
  isOpen,
  onClose,
  onAddParameter,
  existingSections = []
}) {
  const defaultSections = [
    'Occupancy & Census',
    'Maintenance & Quality Tickets',
    'Utilities & Operational Expenses',
    'Budget & Financial Balance',
    'Per Student & Area Metrics',
    'Water & Utilities Deep Dive',
    'Custom Parameters'
  ];

  const sections = Array.from(new Set([...defaultSections, ...existingSections]));

  const [formData, setFormData] = useState({
    param_name: '',
    section: 'Custom Parameters',
    new_section: '',
    input_type: 'cost',
    unit: '₹',
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
      param_name: formData.param_name.trim(),
      section: finalSection,
      input_type: formData.input_type,
      unit: formData.unit.trim(),
      formula: formData.formula.trim() || null,
      display_order: parseInt(formData.display_order, 10) || 50
    });

    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '540px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #f1f5f9',
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
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Plus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                Add Hostel Parameter / Row
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                This parameter will immediately appear in the Hostel Data Entry sheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              fontSize: '12.5px',
              fontWeight: '600',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          {/* Parameter Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
              Parameter Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Laundry Machine Maintenance, Warden Honorarium"
              value={formData.param_name}
              onChange={(e) => {
                setFormData({ ...formData, param_name: e.target.value });
                if (error) setError('');
              }}
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: '600',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Section / Category Group */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
              Section / Category *
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
                fontWeight: '600',
                color: '#0f172a',
                backgroundColor: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              {sections.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
              <option value="__new__">+ Create New Section...</option>
            </select>

            {formData.section === '__new__' && (
              <input
                type="text"
                placeholder="Enter new section title..."
                value={formData.new_section}
                onChange={(e) => setFormData({ ...formData, new_section: e.target.value })}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #0284c7',
                  fontSize: '12.5px',
                  boxSizing: 'border-box'
                }}
              />
            )}
          </div>

          {/* Input Mode / Type and Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                Input Mode / Format *
              </label>
              <select
                value={formData.input_type}
                onChange={(e) => {
                  const t = e.target.value;
                  let defaultUnit = '₹';
                  if (t === 'boys_girls_total') defaultUnit = 'Persons';
                  else if (t === 'single_count') defaultUnit = 'Count';
                  else if (t === 'percentage') defaultUnit = '%';
                  else if (t === 'units_and_cost') defaultUnit = 'Units / ₹';
                  setFormData({ ...formData, input_type: t, unit: defaultUnit });
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="cost">Amount (₹ Currency)</option>
                <option value="boys_girls_total">Boys | Girls | Total</option>
                <option value="units_and_cost">Units & Cost (Dual Value)</option>
                <option value="single_number">Single Numeric Value</option>
                <option value="single_count">Single Headcount / Total</option>
                <option value="percentage">Percentage (%)</option>
                <option value="formula">Formula Calculated</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                Unit Label
              </label>
              <input
                type="text"
                placeholder="e.g. ₹, Beds, Persons, Ltrs, kWh"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Optional Formula */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
              <Calculator size={14} color="#0284c7" />
              <span>Calculation Formula (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Boys + Girls, or [Expenses occurred] / 30"
              value={formData.formula}
              onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
              Leave blank if entered manually during monthly data entry.
            </span>
          </div>

          {/* Modal Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '8px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9'
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
                padding: '9px 22px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)'
              }}
            >
              Save Parameter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
