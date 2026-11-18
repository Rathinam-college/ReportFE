import React, { useState } from 'react';
import { X, Plus, Calculator, Layers, Tag, HelpCircle, Building2, Sparkles } from 'lucide-react';

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

  const commonHostelFormulas = [
    { label: 'Boys + Girls', formula: 'Boys + Girls' },
    { label: 'Students + Staffs', formula: 'Students + Staffs' },
    { label: 'Bed Capacity - Total Occupied', formula: 'Bed Capacity - Total Occupied' },
    { label: 'Occupancy %', formula: '(Total Occupied / Bed Capacity) * 100' },
    { label: 'Balance Budget', formula: 'Approved Budget - Cumulative Budget Spent' },
    { label: 'Per Student Cost', formula: 'Expenses occurred / Number of students' },
    { label: 'Tickets Open', formula: 'Tickets Received - Tickets Closed' }
  ];

  const [formData, setFormData] = useState({
    s_no: '',
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
      s_no: formData.s_no.trim() || undefined,
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
        borderRadius: '28px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 30px 80px rgba(108, 86, 219, 0.2)',
        overflow: 'hidden',
        border: '1px solid rgba(108, 86, 219, 0.15)',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fafbff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: '#efeefc',
              color: '#6c56db',
              border: '1px solid #dcd7fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                Add Hostel Master Parameter
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Define parameter name, S.No, section, and calculation formula
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '50%',
              border: 'none',
              background: '#f1f5f9',
              color: '#64748b',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
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

          {/* Parameter Name & S.No */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Parameter Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Laundry Maintenance, Warden Allowances"
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

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                S.No
              </label>
              <input
                type="text"
                placeholder="e.g. 46"
                value={formData.s_no}
                onChange={(e) => setFormData({ ...formData, s_no: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  textAlign: 'center',
                  fontWeight: '800',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Section Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Section / Category Group
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
            </div>

            {formData.section === '__new__' ? (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  New Section Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Recreation & Sports"
                  value={formData.new_section}
                  onChange={(e) => setFormData({ ...formData, new_section: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #0284c7',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
          </div>

          {/* Input Format & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
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
                  else if (t === 'single_number') defaultUnit = 'Qty';
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Unit Label
              </label>
              <input
                type="text"
                placeholder="e.g. ₹, Beds, Persons, Ltrs"
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

          {/* Optional Formula with Quick Chips */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                <Calculator size={14} color="#0284c7" />
                <span>Calculation Formula (Optional)</span>
              </label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Leave blank for manual entry</span>
            </div>
            <input
              type="text"
              placeholder="e.g. Boys + Girls or Approved Budget - Cumulative Budget Spent"
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

            {/* Quick Formula Suggestions */}
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
                <Sparkles size={11} color="#0284c7" />
                Quick Formula Presets (Click to insert):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {commonHostelFormulas.map((fItem) => (
                  <button
                    key={fItem.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, formula: fItem.formula })}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: '#f0f9ff',
                      color: '#0284c7',
                      border: '1px solid #bae6fd',
                      cursor: 'pointer'
                    }}
                  >
                    + {fItem.label}
                  </button>
                ))}
              </div>
            </div>
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
                padding: '10px 20px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                borderRadius: '9999px',
                border: 'none',
                background: 'linear-gradient(135deg, #ff7e9e 0%, #ff4b72 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(255, 96, 136, 0.35)'
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
