import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  FolderPlus,
  Database,
  Calculator,
  Sigma,
  ChevronDown,
  Check,
  AlertCircle,
  AlertTriangle,
  Layers,
  Search
} from 'lucide-react';
import { validateFormula, evaluateFormula } from '../../utils/formulaEngine';

export default function AddCategoryModal({
  isOpen,
  onClose,
  onAddCategory,
  moduleName = 'food',
  existingCategories = [],
  computedMatrix = null
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categoryType, setCategoryType] = useState('DIRECT'); // 'DIRECT' | 'FORMULA'
  const [formulaInput, setFormulaInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [customSampleValues, setCustomSampleValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const formulaInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    }
    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  // Reset or initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setCode('');
      setCategoryType('DIRECT');
      setFormulaInput('');
      setCustomSampleValues({});
      setShowCategoryDropdown(false);
      setCategorySearch('');
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  // Extract available categories safely
  const availableCategories = useMemo(() => {
    if (Array.isArray(existingCategories) && existingCategories.length > 0) {
      return existingCategories.filter(c => c && c.name);
    }
    if (computedMatrix && Array.isArray(computedMatrix.categories)) {
      return computedMatrix.categories.map(c => ({
        id: c.category_id,
        name: c.category_name,
        code: c.category_code
      }));
    }
    return [];
  }, [existingCategories, computedMatrix]);

  // Filtered categories for dropdown search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return availableCategories;
    const q = categorySearch.toLowerCase();
    return availableCategories.filter(c =>
      c.name.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q))
    );
  }, [availableCategories, categorySearch]);

  // Real-time formula validation & preview summary
  const validation = useMemo(() => {
    if (categoryType !== 'FORMULA' || !formulaInput.trim()) {
      return {
        isValid: false,
        status: 'empty',
        message: 'No formula entered',
        normalizedExpr: '',
        idExpr: '',
        referencedCategories: [],
        previewSummary: '',
        sampleResult: 0,
        sampleValues: {}
      };
    }
    return validateFormula(formulaInput, availableCategories, customSampleValues);
  }, [categoryType, formulaInput, availableCategories, customSampleValues]);

  if (!isOpen) return null;

  // Insert token / operator / category at current cursor position
  const insertAtCursor = (text) => {
    const input = formulaInputRef.current;
    if (!input) {
      setFormulaInput(prev => (prev ? prev + ' ' + text : text));
      return;
    }
    const start = input.selectionStart ?? formulaInput.length;
    const end = input.selectionEnd ?? formulaInput.length;
    const before = formulaInput.substring(0, start);
    const after = formulaInput.substring(end);
    
    // Format spacing nicely
    let formattedText = text;
    if (before && !before.endsWith(' ') && !before.endsWith('(') && !text.startsWith(')')) {
      formattedText = ' ' + formattedText;
    }
    if (after && !after.startsWith(' ') && !after.startsWith(')') && !text.endsWith('(')) {
      formattedText = formattedText + ' ';
    }

    const newFormula = before + formattedText + after;
    setFormulaInput(newFormula);

    setTimeout(() => {
      input.focus();
      const newCursorPos = start + formattedText.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleNameChange = (val) => {
    setName(val);
    if (!code || code === code.toUpperCase()) {
      const suggested = 'CAT_' + val.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 16);
      setCode(suggested);
    }
  };

  const handleToggleFormula = () => {
    if (categoryType === 'FORMULA') {
      setCategoryType('DIRECT');
    } else {
      setCategoryType('FORMULA');
      if (!formulaInput.trim() && availableCategories.length >= 2) {
        // Pre-fill a helpful sample if completely blank
        setFormulaInput(`([${availableCategories[0].name}] + [${availableCategories[1].name}]) * 0.18`);
      }
    }
  };

  const handleSelectCategoryType = (type) => {
    setCategoryType(type);
    if (type === 'FORMULA' && !formulaInput.trim() && availableCategories.length >= 2) {
      setFormulaInput(`([${availableCategories[0].name}] + [${availableCategories[1].name}]) * 0.18`);
    }
  };

  const handleSampleValueChange = (catId, val) => {
    const num = parseFloat(String(val).replace(/,/g, '')) || 0;
    setCustomSampleValues(prev => ({
      ...prev,
      [catId]: num
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }

    if (categoryType === 'FORMULA') {
      if (!formulaInput.trim()) {
        setError('Please enter a formula for Formula Based category');
        return;
      }
      if (!validation.isValid) {
        setError(validation.message || 'The entered formula is invalid. Please verify syntax and references.');
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
        module: moduleName,
        category_type: categoryType
      };

      if (categoryType === 'FORMULA') {
        payload.formula_expression = validation.normalizedExpr;
        payload.formula_definition = {
          raw_expression: formulaInput.trim(),
          normalized_expression: validation.normalizedExpr,
          id_expression: validation.idExpr,
          category_ids: validation.referencedCategories.map(c => c.id),
          category_names: validation.referencedCategories.map(c => c.name)
        };
      }

      await onAddCategory(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for formatting currency in sample table
  const formatSampleCurrency = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '₹ 0';
    return '₹ ' + Number(num).toLocaleString('en-IN', { maximumFractionDigits: 2 });
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
      zIndex: 1000,
      padding: '20px',
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '940px',
        maxHeight: '92vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e2e8f0'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderPlus size={19} color="#60a5fa" />
            <h3 style={{ fontSize: '16.5px', fontWeight: '700', letterSpacing: '-0.01em', margin: 0 }}>
              Add New Expense Category
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              color: '#94a3b8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '6px'
            }}
            title="Close"
          >
            <X size={19} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              fontSize: '13px',
              fontWeight: '600',
              border: '1px solid #fecaca',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={17} color="#dc2626" />
              <span>{error}</span>
            </div>
          )}

          {/* 2-Column Responsive Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px',
            alignItems: 'start'
          }}>

            {/* LEFT COLUMN: Category Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '8px' }}>
                <Layers size={17} color="#2563eb" />
                <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Category Details
                </h4>
              </div>

              {/* Category Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Category Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Refreshments & Beverages, Bakery & Pastry"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                  autoFocus
                />
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '5px', display: 'block', lineHeight: 1.4 }}>
                  This category will appear across the Operational Matrix, Data Entry, and Dashboard charts.
                </span>
              </div>

              {/* Category Code */}
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
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '700',
                    fontFamily: 'monospace',
                    color: '#334155',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '5px', display: 'block', lineHeight: 1.4 }}>
                  Unique alphanumeric identifier used for accounting exports.
                </span>
              </div>

              {/* Category Type Selectable Cards */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  Category Type
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px'
                }}>
                  {/* Option A: Direct Entry */}
                  <div
                    onClick={() => handleSelectCategoryType('DIRECT')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: categoryType === 'DIRECT' ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                      backgroundColor: categoryType === 'DIRECT' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: categoryType === 'DIRECT' ? '0 2px 6px rgba(37,99,235,0.15)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: categoryType === 'DIRECT' ? '5px solid #2563eb' : '2px solid #94a3b8',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }} />
                      <Database size={15} color={categoryType === 'DIRECT' ? '#2563eb' : '#64748b'} />
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: categoryType === 'DIRECT' ? '#1e40af' : '#1e293b'
                      }}>
                        Direct Entry
                      </span>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: categoryType === 'DIRECT' ? '#3b82f6' : '#64748b',
                      lineHeight: 1.35,
                      marginTop: '2px',
                      paddingLeft: '24px'
                    }}>
                      Values will be entered manually in the data sheet.
                    </span>
                  </div>

                  {/* Option B: Formula Based */}
                  <div
                    onClick={() => handleSelectCategoryType('FORMULA')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: categoryType === 'FORMULA' ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                      backgroundColor: categoryType === 'FORMULA' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: categoryType === 'FORMULA' ? '0 2px 6px rgba(37,99,235,0.15)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: categoryType === 'FORMULA' ? '5px solid #2563eb' : '2px solid #94a3b8',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }} />
                      <Calculator size={15} color={categoryType === 'FORMULA' ? '#2563eb' : '#64748b'} />
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: categoryType === 'FORMULA' ? '#1e40af' : '#1e293b'
                      }}>
                        Formula Based
                      </span>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: categoryType === 'FORMULA' ? '#3b82f6' : '#64748b',
                      lineHeight: 1.35,
                      marginTop: '2px',
                      paddingLeft: '24px'
                    }}>
                      Value will be calculated using a formula.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Formula (Optional) Builder */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: categoryType === 'FORMULA' ? '#ffffff' : '#f8fafc',
              border: categoryType === 'FORMULA' ? '1.5px solid #cbd5e1' : '1px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '18px',
              transition: 'all 0.2s ease',
              opacity: categoryType === 'FORMULA' ? 1 : 0.8
            }}>
              {/* Header with Σ and Toggle Switch */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sigma size={18} color="#4f46e5" />
                  <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Formula (Optional)
                  </h4>
                </div>

                {/* Use Formula Toggle Switch */}
                <div
                  onClick={handleToggleFormula}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  title="Toggle formula calculation"
                >
                  <div style={{
                    width: '38px',
                    height: '22px',
                    borderRadius: '12px',
                    backgroundColor: categoryType === 'FORMULA' ? '#4f46e5' : '#cbd5e1',
                    position: 'relative',
                    transition: 'background-color 0.2s ease'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      position: 'absolute',
                      top: '3px',
                      left: categoryType === 'FORMULA' ? '19px' : '3px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                  <span style={{ fontSize: '12.5px', fontWeight: '700', color: categoryType === 'FORMULA' ? '#4f46e5' : '#64748b' }}>
                    Use Formula
                  </span>
                </div>
              </div>

              <span style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
                Create a calculated category using existing categories or subdivisions.
              </span>

              {/* Build Formula Section */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Build Formula
                </label>

                {/* Formula Input Box with fx Icon Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: categoryType === 'FORMULA' ? '1.5px solid #6366f1' : '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  backgroundColor: categoryType === 'FORMULA' ? '#ffffff' : '#f1f5f9',
                  overflow: 'hidden',
                  boxShadow: categoryType === 'FORMULA' ? '0 1px 3px rgba(99,102,241,0.1)' : 'none'
                }}>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#eef2ff',
                    color: '#4338ca',
                    fontWeight: '800',
                    fontStyle: 'italic',
                    fontFamily: 'serif',
                    fontSize: '14px',
                    borderRight: '1px solid #e0e7ff',
                    userSelect: 'none'
                  }}>
                    fx
                  </div>
                  <input
                    ref={formulaInputRef}
                    type="text"
                    disabled={categoryType !== 'FORMULA'}
                    value={formulaInput}
                    onChange={(e) => setFormulaInput(e.target.value)}
                    placeholder="e.g. ([Food Material] + [Food Labour]) * 0.18"
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      padding: '10px 12px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      fontFamily: 'monospace',
                      color: categoryType === 'FORMULA' ? '#0f172a' : '#94a3b8',
                      backgroundColor: 'transparent'
                    }}
                  />
                </div>
              </div>

              {/* Operators and Insert Category Dropdown */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                {/* Operator Buttons */}
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {[
                    { label: '+', val: '+' },
                    { label: '−', val: '-' },
                    { label: '×', val: '*' },
                    { label: '÷', val: '/' },
                    { label: '(', val: '(' },
                    { label: ')', val: ')' },
                    { label: '%', val: '%' }
                  ].map(op => (
                    <button
                      key={op.label}
                      type="button"
                      disabled={categoryType !== 'FORMULA'}
                      onClick={() => insertAtCursor(op.val)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: categoryType === 'FORMULA' ? '#f1f5f9' : '#e2e8f0',
                        color: categoryType === 'FORMULA' ? '#1e293b' : '#94a3b8',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: categoryType === 'FORMULA' ? 'pointer' : 'not-allowed',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (categoryType === 'FORMULA') e.currentTarget.style.backgroundColor = '#e2e8f0';
                      }}
                      onMouseLeave={(e) => {
                        if (categoryType === 'FORMULA') e.currentTarget.style.backgroundColor = '#f1f5f9';
                      }}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>

                {/* Insert Category Dropdown Button */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <button
                    type="button"
                    disabled={categoryType !== 'FORMULA'}
                    onClick={() => setShowCategoryDropdown(prev => !prev)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: categoryType === 'FORMULA' ? '#e0e7ff' : '#f1f5f9',
                      color: categoryType === 'FORMULA' ? '#4338ca' : '#94a3b8',
                      border: '1px solid #c7d2fe',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: categoryType === 'FORMULA' ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <span>☷ Insert Category</span>
                    <ChevronDown size={14} />
                  </button>

                  {/* Dropdown Menu */}
                  {showCategoryDropdown && categoryType === 'FORMULA' && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '4px',
                      width: '260px',
                      maxHeight: '260px',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                      border: '1px solid #cbd5e1',
                      zIndex: 1050,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Search size={14} color="#64748b" />
                        <input
                          type="text"
                          placeholder="Search categories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                          autoFocus
                        />
                      </div>
                      <div style={{ overflowY: 'auto', maxHeight: '200px' }}>
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map(cat => (
                            <div
                              key={cat.id}
                              onClick={() => {
                                insertAtCursor(`[${cat.name}]`);
                                setShowCategoryDropdown(false);
                                setCategorySearch('');
                              }}
                              style={{
                                padding: '8px 12px',
                                fontSize: '12.5px',
                                fontWeight: '600',
                                color: '#1e293b',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f8fafc',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <span>{cat.name}</span>
                              {cat.code && (
                                <span style={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'monospace' }}>
                                  {cat.code}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                            No categories found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview / Formula Summary Card */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#6366f1' }}>🎯</span>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
                      Preview / Formula Summary
                    </span>
                  </div>

                  {/* Validation Status Pill */}
                  {categoryType === 'FORMULA' && formulaInput.trim() && (
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: validation.isValid
                        ? '#ecfdf5'
                        : validation.status === 'missing_category'
                        ? '#fffbeb'
                        : '#fef2f2',
                      color: validation.isValid
                        ? '#059669'
                        : validation.status === 'missing_category'
                        ? '#d97706'
                        : '#dc2626',
                      border: validation.isValid
                        ? '1px solid #a7f3d0'
                        : validation.status === 'missing_category'
                        ? '1px solid #fde68a'
                        : '1px solid #fecaca'
                    }}>
                      {validation.isValid ? (
                        <>
                          <Check size={12} strokeWidth={3} />
                          <span>Valid Formula</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={12} />
                          <span>{validation.message || 'Invalid Formula'}</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* Formatted Expression Display */}
                <div style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: validation.isValid ? '#1e293b' : '#64748b',
                  fontFamily: 'monospace',
                  padding: '4px 0'
                }}>
                  {categoryType === 'FORMULA' && formulaInput.trim()
                    ? `= ${validation.previewSummary || formulaInput}`
                    : '= Select "Formula Based" and enter an expression above'}
                </div>

                {!validation.isValid && categoryType === 'FORMULA' && formulaInput.trim() && (
                  <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600' }}>
                    {validation.message}
                  </span>
                )}
              </div>

              {/* Example Values (Optional) Interactive Preview */}
              {categoryType === 'FORMULA' && validation.referencedCategories.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                    Example Values (Optional)
                  </label>
                  <div style={{
                    overflowX: 'auto',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                          {validation.referencedCategories.map(rc => (
                            <th key={rc.id} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: '700' }}>
                              # {rc.name}
                            </th>
                          ))}
                          <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>
                            Result (Calculated)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {validation.referencedCategories.map(rc => {
                            const val = customSampleValues[rc.id] ?? validation.sampleValues?.[rc.id] ?? 100000;
                            return (
                              <td key={rc.id} style={{ padding: '6px 10px', borderRight: '1px solid #f1f5f9' }}>
                                <input
                                  type="number"
                                  value={val}
                                  onChange={(e) => handleSampleValueChange(rc.id, e.target.value)}
                                  style={{
                                    width: '100%',
                                    maxWidth: '110px',
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    color: '#0f172a'
                                  }}
                                />
                              </td>
                            );
                          })}
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              fontWeight: '800',
                              fontSize: '12.5px',
                              display: 'inline-block'
                            }}>
                              {formatSampleCurrency(validation.sampleResult)}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '700',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (categoryType === 'FORMULA' && (!formulaInput.trim() || !validation.isValid))}
            style={{
              padding: '9px 22px',
              borderRadius: '8px',
              backgroundColor: submitting || (categoryType === 'FORMULA' && (!formulaInput.trim() || !validation.isValid))
                ? '#94a3b8'
                : '#2563eb',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: submitting || (categoryType === 'FORMULA' && (!formulaInput.trim() || !validation.isValid))
                ? 'not-allowed'
                : 'pointer',
              boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <FolderPlus size={16} />
            <span>{submitting ? 'Creating...' : '+ Create Category'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
