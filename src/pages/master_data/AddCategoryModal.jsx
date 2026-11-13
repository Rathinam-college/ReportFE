import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';

export default function AddCategoryModal({
  isOpen,
  onClose,
  onAddCategory,
  moduleName = 'food'
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onAddCategory({
        name: name.trim(),
        code: code.trim() || undefined,
        module: moduleName
      });
      setName('');
      setCode('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNameChange = (val) => {
    setName(val);
    if (!code || code === code.toUpperCase()) {
      // Suggest code
      const suggested = 'CAT_' + val.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 16);
      setCode(suggested);
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
        maxWidth: '480px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderPlus size={18} color="#60a5fa" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Add New Expense Category</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              fontSize: '13px',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Category Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Refreshments & Beverages, Bakery & Pastry"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                fontWeight: '600',
                color: '#0f172a'
              }}
              required
              autoFocus
            />
            <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              This category will appear across the Operational Matrix, Data Entry, and Dashboard charts.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Category Code (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. CAT_BEVERAGE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13.5px',
                fontWeight: '600',
                fontFamily: 'monospace',
                color: '#334155'
              }}
            />
            <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Unique alphanumeric identifier used for accounting exports.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '9px 20px',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FolderPlus size={15} />
              <span>{submitting ? 'Creating...' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

