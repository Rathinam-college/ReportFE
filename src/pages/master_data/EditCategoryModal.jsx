import React, { useState, useEffect } from 'react';
import { X, Edit3, Check, AlertCircle, Hash, Layers } from 'lucide-react';

export default function EditCategoryModal({
  isOpen,
  onClose,
  category,
  onUpdateCategory
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setCode(category.code || '');
      setError(null);
    }
  }, [category, isOpen]);

  if (!isOpen || !category) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Category name cannot be empty.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onUpdateCategory(category.id, {
        name: name.trim(),
        code: code.trim() || undefined
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update category name');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px',
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <Edit3 size={18} color="#60a5fa" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.01em' }}>
              Rename / Edit Category
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              fontSize: '13px',
              fontWeight: '600',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Current Category Info Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={15} color="#2563eb" />
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Category ID:</span>
              <strong style={{ fontSize: '12px', color: '#0f172a', fontFamily: 'monospace' }}>#{category.id}</strong>
            </div>
            <span style={{
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#2563eb',
              backgroundColor: '#eff6ff',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #bfdbfe'
            }}>
              {category.cost_head_count !== undefined ? `${category.cost_head_count} line items attached` : 'Active'}
            </span>
          </div>

          {/* Category Name Input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                } else if (e.key === 'Escape') {
                  onClose();
                }
              }}
              placeholder="e.g. Students, Food Material, Fuel & Tolls"
              autoFocus
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid #2563eb',
                fontSize: '14px',
                fontWeight: '600',
                color: '#0f172a',
                outline: 'none',
                boxShadow: '0 0 0 3px rgba(37,99,235,0.1)'
              }}
            />
            <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Updates this category name across Master Data, Data Entry sheets, and Dashboard analytics.
            </span>
          </div>

          {/* Category Code (Optional) */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
              <Hash size={13} color="#64748b" />
              <span>Category Code (Optional)</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. FOOD_MATERIAL, CAT_STUDENTS"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: '600',
                fontFamily: 'monospace',
                color: '#334155'
              }}
            />
          </div>

          {/* Live Preview Box */}
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            border: '1px dashed #3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '11.5px', color: '#1e40af', fontWeight: '600' }}>Preview in Filters:</span>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              boxShadow: '0 1px 3px rgba(37,99,235,0.3)'
            }}>
              {name.trim() || 'Category Name'} ({category.cost_head_count || 0})
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || !name.trim()}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                border: 'none',
                cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
                opacity: saving || !name.trim() ? 0.65 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
              }}
            >
              <Check size={15} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
