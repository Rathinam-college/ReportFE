import React, { useState } from 'react';
import { X, Plus, Calculator, Layers, Tag, HelpCircle, Bus } from 'lucide-react';

export default function AddTransportParameterModal({
  isOpen,
  onClose,
  onAddParameter,
  existingSections = []
}) {
  const defaultSections = [
    'Fleet Operations & Distance',
    'Fleet Expenses & Operations',
    'Revenue, Deductions & Income',
    'Operating Budget & Balance',
    'Service Tickets & Compliance',
    'Fuel & Energy Consumption',
    'Student Transport Fee Analytics',
    'Custom Fleet Parameters'
  ];

  const sections = Array.from(new Set([...defaultSections, ...existingSections]));

  const [formData, setFormData] = useState({
    param_name: '',
    section: 'Custom Fleet Parameters',
    new_section: '',
    input_type: 'cost',
    unit: 'INR (₹)',
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
      ? (formData.new_section.trim() || 'Custom Fleet Parameters')
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
              backgroundColor: '#fff7ed',
              color: '#ea580c',
              border: '1px solid #fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Add Transport Master Parameter
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Add a new metric, operational parameter, or formula to Transport Master
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          {/* Parameter Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Parameter Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Battery Replacement Cost, Toll FASTag Fees, GPS Device Charges"
              value={formData.param_name}
              onChange={(e) => {
                setFormData({ ...formData, param_name: e.target.value });
                setError('');
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {/* Section Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Spreadsheet Section
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
                  outline: 'none',
                  backgroundColor: '#ffffff',
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
                  placeholder="e.g. Electric Vehicle Fleet"
                  value={formData.new_section}
                  onChange={(e) => setFormData({ ...formData, new_section: e.target.value })}
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

          {/* Input Type & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Input / Value Type
              </label>
              <select
                value={formData.input_type}
                onChange={(e) => {
                  const it = e.target.value;
                  let u = formData.unit;
                  if (it === 'cost') u = 'INR (₹)';
                  else if (it === 'single_count') u = 'Count';
                  else if (it === 'single_number') u = 'KMs / Litres';
                  else if (it === 'text') u = 'Text';
                  setFormData({ ...formData, input_type: it, unit: u });
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
              >
                <option value="cost">Financial Cost / Expense (₹ INR)</option>
                <option value="single_number">Distance / Quantity (KMs / Litres)</option>
                <option value="single_count">Headcount / Tickets (Persons, Tickets)</option>
                <option value="text">Fleet Code / Text (e.g. 18+1)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Unit / Label
              </label>
              <input
                type="text"
                placeholder="₹, KMs, Litres, Persons"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
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
          </div>

          {/* Formula (Optional) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                Calculation Formula (Optional)
              </label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Leave blank for manual entry</span>
            </div>
            <input
              type="text"
              placeholder="e.g. Demand - Discount - Paid or Actual trip KMs - Approved trip KMs"
              value={formData.formula}
              onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Modal Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '8px',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '16px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
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
                backgroundColor: '#ea580c',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)'
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
