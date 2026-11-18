import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calculator, Plus, Edit2, Trash2, Check, AlertCircle, HelpCircle, 
  RotateCcw, Sparkles, Eye, ChevronDown, ChevronUp, Layers, 
  FolderPlus, Percent, Hash, ArrowRight, ArrowLeftRight, Save, Copy
} from 'lucide-react';
import { formatINR, formatLakhs } from '../../utils/formatters';

// Starter formulas scoped per module to seed empty accounts
const STARTER_FORMULAS = {
  food: [
    {
      name: 'Core Kitchen Production Cost',
      expression: '[Food Material] + [Food Labour]',
      description: 'Sum of raw materials and culinary manpower spend',
      unit_type: 'currency'
    },
    {
      name: 'Material Share of Core Spend',
      expression: '([Food Material] / ([Food Material] + [Food Labour])) * 100',
      description: 'Percentage of raw food material in core production',
      unit_type: 'percentage'
    },
    {
      name: 'Kitchen Utilities & Energy Total',
      expression: '[Fuel] + [FC maintenance/ Power/Water/Veh]',
      description: 'Combined fuel, LPG, water, power and facility maintenance',
      unit_type: 'currency'
    },
    {
      name: 'Daily Direct Operational Cost (30-day basis)',
      expression: '([Food Material] + [Food Labour] + [Fuel]) / 30',
      description: 'Estimated direct operational spend per calendar day',
      unit_type: 'currency'
    }
  ],
  transport: [
    {
      name: 'Total Fleet Fuel Cost',
      expression: '[Diesel - buses] + [Petrol - cars & vans]',
      description: 'Combined bus diesel and support vehicle petrol expenditure',
      unit_type: 'currency'
    },
    {
      name: 'Total Crew Payroll & Allowances',
      expression: '[Driver salary] + [Helper salary] + [Mechanic salary]',
      description: 'Complete monthly driver, helper, and workshop staff payroll',
      unit_type: 'currency'
    },
    {
      name: 'Total Fleet Upkeep & Spares',
      expression: '[Service & repairs] + [Tyres & batteries] + [Spare parts]',
      description: 'Routine servicing, tyre replacements, and spare parts',
      unit_type: 'currency'
    },
    {
      name: 'Fuel to Crew Spend Ratio',
      expression: '([Diesel - buses] + [Petrol - cars & vans]) / ([Driver salary] + [Helper salary])',
      description: 'Direct fuel spend relative to driving crew compensation',
      unit_type: 'number'
    }
  ],
  hostel: [
    {
      name: 'Total Campus Utilities Spend',
      expression: '[Electricity & Power] + [Water & Sewage]',
      description: 'Combined power and municipal/borewell water utilities',
      unit_type: 'currency'
    },
    {
      name: 'Hostel Facilities & Security Manpower',
      expression: '[Housekeeping & Janitorial] + [Security Manpower]',
      description: 'Sanitation, hygiene maintenance, and 24/7 security services',
      unit_type: 'currency'
    },
    {
      name: 'Resident Upkeep & Comfort Total',
      expression: '[Repair & Maintenance] + [Washing & Laundry]',
      description: 'Hostel plumbing/electrical repairs and linen laundry services',
      unit_type: 'currency'
    }
  ]
};

export default function CategoryFormulaManager({
  moduleName = 'Food',
  categoriesList = [],
  computedMatrix = null,
  openAddCategoryModal = null
}) {
  // Normalize module key
  const moduleKey = useMemo(() => {
    const m = (moduleName || '').toLowerCase();
    if (m.includes('transport')) return 'transport';
    if (m.includes('hostel')) return 'hostel';
    return 'food';
  }, [moduleName]);

  const storageKey = `rathinam_category_formulas_${moduleKey}`;

  // --------------------------------------------------------------------------
  // PERIODS & CATEGORIES FROM LIVE MATRIX / DATA SHEET
  // --------------------------------------------------------------------------
  const periods = useMemo(() => {
    return computedMatrix?.periods || [];
  }, [computedMatrix]);

  // Combine matrix categories with categoriesList to ensure immediate visibility of new categories
  const availableCategories = useMemo(() => {
    const map = new Map();

    // First populate from categoriesList (master source of truth)
    if (Array.isArray(categoriesList)) {
      categoriesList.forEach(c => {
        if (c && c.name) {
          map.set(String(c.name).trim().toLowerCase(), {
            id: c.id,
            name: c.name.trim(),
            code: c.code || '',
            amounts: {},
            total: 0,
            avg: 0,
            lineItemsCount: c.line_items_count || 0
          });
        }
      });
    }

    // Overlay financial numbers from computedMatrix if available
    if (computedMatrix?.categories && Array.isArray(computedMatrix.categories)) {
      computedMatrix.categories.forEach(c => {
        const catName = (c.category_name || c.name || '').trim();
        const key = catName.toLowerCase();
        const existing = map.get(key) || {
          id: c.category_id || c.id,
          name: catName,
          code: c.category_code || c.code || '',
          lineItemsCount: c.items?.length || 0
        };

        map.set(key, {
          ...existing,
          amounts: c.subtotal?.amounts || {},
          total: Number(c.subtotal?.total || 0),
          avg: Number(c.subtotal?.avg || 0)
        });
      });
    }

    return Array.from(map.values());
  }, [categoriesList, computedMatrix]);

  // --------------------------------------------------------------------------
  // FORMULAS STATE & PERSISTENCE (PostgreSQL Backend + LocalStorage Sync)
  // --------------------------------------------------------------------------
  const [formulas, setFormulas] = useState(() => {
    try {
      const local = localStorage.getItem(storageKey);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return STARTER_FORMULAS[moduleKey] || STARTER_FORMULAS.food;
  });

  const [loadingBackend, setLoadingBackend] = useState(false);

  // Fetch formulas from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchBackendFormulas = async () => {
      try {
        setLoadingBackend(true);
        const res = await fetch(`/api/master/category-formulas?module=${moduleKey}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setFormulas(data);
            localStorage.setItem(storageKey, JSON.stringify(data));
          } else if (isMounted && (!data || data.length === 0)) {
            // If backend is empty, seed with starter formulas
            const starters = STARTER_FORMULAS[moduleKey] || STARTER_FORMULAS.food;
            setFormulas(starters);
            localStorage.setItem(storageKey, JSON.stringify(starters));
            // Save starters to backend
            starters.forEach(async (f) => {
              try {
                await fetch('/api/master/category-formulas', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...f, module: moduleKey })
                });
              } catch (_) {}
            });
          }
        }
      } catch (err) {
        console.warn('Backend formulas fetch notice (using cached):', err);
      } finally {
        if (isMounted) setLoadingBackend(false);
      }
    };

    fetchBackendFormulas();
    return () => { isMounted = false; };
  }, [moduleKey, storageKey]);

  // Save to localStorage whenever formulas change
  const saveFormulasLocally = (updatedList) => {
    setFormulas(updatedList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    } catch (_) {}
  };

  // --------------------------------------------------------------------------
  // FORMULA BUILDER FORM STATE
  // --------------------------------------------------------------------------
  const [selectedCategoryName, setSelectedCategoryName] = useState(() => {
    return availableCategories[0]?.name || '';
  });

  // Keep selectedCategoryName valid as categories change
  useEffect(() => {
    if (availableCategories.length > 0) {
      if (!selectedCategoryName || !availableCategories.some(c => c.name === selectedCategoryName)) {
        setSelectedCategoryName(availableCategories[0].name);
      }
    }
  }, [availableCategories, selectedCategoryName]);

  const [formulaName, setFormulaName] = useState('');
  const [formulaExpression, setFormulaExpression] = useState('');
  const [formulaDescription, setFormulaDescription] = useState('');
  const [formulaUnit, setFormulaUnit] = useState('currency'); // 'currency' | 'percentage' | 'number'
  const [editingFormulaId, setEditingFormulaId] = useState(null);
  const [expandedBreakdownId, setExpandedBreakdownId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const formulaInputRef = useRef(null);

  // --------------------------------------------------------------------------
  // FORMULA NORMALIZATION & SMART AUTO-WRAPPING
  // --------------------------------------------------------------------------
  // Auto-wraps bare category names in brackets and normalizes math symbols
  const normalizeFormulaExpression = (expr) => {
    if (!expr || typeof expr !== 'string') return '';
    let res = expr.trim();

    // 1. Convert common math symbols to standard operators
    res = res
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/–/g, '-')
      .replace(/,/g, '');

    // Replace standalone 'x' or 'X' surrounded by spaces or numbers with '*'
    res = res.replace(/(\s|\d|\)|\])[xX](\s|\d|\(|\[)/g, '$1*$2');

    // 2. Sort available categories by name length descending so longer names match first
    const sortedCats = [...availableCategories].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));

    sortedCats.forEach(cat => {
      if (!cat.name) return;
      const escaped = cat.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // If category appears without brackets, wrap it with [Category Name]
      const bareRegex = new RegExp(`(?<!\\[)${escaped}(?!\\])`, 'gi');
      res = res.replace(bareRegex, `[${cat.name}]`);

      if (cat.code) {
        const escapedCode = cat.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const codeRegex = new RegExp(`(?<!\\[)${escapedCode}(?!\\])`, 'gi');
        res = res.replace(codeRegex, `[${cat.name}]`);
      }
    });

    // Also support bare total / grand total
    res = res.replace(/(?<!\[)(grand\s*total|total\s*expenses|total\s*spend|total)(?!\])/gi, '[Total]');

    return res;
  };

  // --------------------------------------------------------------------------
  // DETAILED FORMULA VALIDATION & DIAGNOSTIC CHECK
  // --------------------------------------------------------------------------
  const validateFormulaSyntax = (expr) => {
    if (!expr || typeof expr !== 'string' || !expr.trim()) {
      return { isValid: false, error: 'Please enter a formula expression.', normalized: '' };
    }

    const normalized = normalizeFormulaExpression(expr);

    // 1. Check bracket balance for [ and ]
    const openBrackets = (normalized.match(/\[/g) || []).length;
    const closeBrackets = (normalized.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      return { isValid: false, error: `Missing closing bracket ']'. Found ${openBrackets} '[' but only ${closeBrackets} ']'.`, normalized };
    }
    if (closeBrackets > openBrackets) {
      return { isValid: false, error: `Extra closing bracket ']'. Found ${closeBrackets} ']' without opening '['.`, normalized };
    }

    // 2. Check parentheses balance for ( and )
    const openParen = (normalized.match(/\(/g) || []).length;
    const closeParen = (normalized.match(/\)/g) || []).length;
    if (openParen > closeParen) {
      return { isValid: false, error: `Missing closing parenthesis ')'. Opened ${openParen} '(' but closed only ${closeParen} ')'.`, normalized };
    }
    if (closeParen > openParen) {
      return { isValid: false, error: `Extra closing parenthesis ')'. Found ${closeParen} ')' without matching '('.`, normalized };
    }

    // 3. Check for trailing operators
    const trimmed = normalized.trim();
    if (/[+\-*/%]$/.test(trimmed)) {
      const lastOp = trimmed.slice(-1);
      return { isValid: false, error: `Formula cannot end with an operator '${lastOp}'. Please add a number or category after it.`, normalized };
    }

    // 4. Check for invalid consecutive operators (e.g. ++, **, //, +*, /*)
    const noSpaces = trimmed.replace(/\s+/g, '');
    const consecMatch = noSpaces.match(/[+\-*/]{2,}/);
    if (consecMatch) {
      // Allow *- or /- for negative values, otherwise flag error
      if (!/^[*/]-$/.test(consecMatch[0])) {
        return { isValid: false, error: `Invalid consecutive operators '${consecMatch[0]}'. Please use a single operator between values.`, normalized };
      }
    }

    // 5. Check all tokens inside brackets [ ... ]
    const bracketTokens = normalized.match(/\[(.*?)\]/g) || [];
    if (bracketTokens.length === 0 && !/[0-9]/.test(normalized)) {
      return { isValid: false, error: 'No category or numbers found in formula. Please select a category from the dropdown and click "+ Insert Category".', normalized };
    }

    // Test with safe mock numbers (100) to verify mathematical evaluation without zero divisors
    let mockExpr = normalized;
    bracketTokens.forEach(t => {
      mockExpr = mockExpr.split(t).join('(100)');
    });

    let cleanMock = mockExpr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/–/g, '-')
      .replace(/,/g, '')
      .trim();

    // Check if there are leftover alphabetic characters outside brackets
    const strippedLetters = cleanMock.replace(/[0-9+\-*/().\s%]/g, '').trim();
    if (/[a-zA-Z]/.test(strippedLetters)) {
      return { 
        isValid: false, 
        error: `Unrecognized text '${strippedLetters}'. Category names must match available categories or be selected from the dropdown.`,
        normalized 
      };
    }

    // Safely evaluate with mock numbers
    try {
      cleanMock = cleanMock.replace(/([0-9.]+)\s*%/g, '($1/100)');
      // eslint-disable-next-line no-new-func
      const testResult = Function(`'use strict'; return (${cleanMock})`)();
      if (typeof testResult !== 'number' || isNaN(testResult)) {
        return { isValid: false, error: 'Mathematical expression could not be evaluated. Please check operators and values.', normalized };
      }
    } catch (e) {
      return { isValid: false, error: `Syntax error in formula: ${e.message}`, normalized };
    }

    return { isValid: true, error: null, normalized };
  };

  // --------------------------------------------------------------------------
  // SAFE MATHEMATICAL EVALUATION ENGINE
  // --------------------------------------------------------------------------
  const sanitizeAndEvaluate = (expr) => {
    if (!expr || typeof expr !== 'string' || !expr.trim()) return null;
    try {
      // Normalize mathematical symbols
      let clean = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/–/g, '-')
        .replace(/,/g, '')
        .trim();

      // Ensure expression contains only valid mathematical characters
      if (!/^[0-9+\-*/().\s%]+$/.test(clean)) {
        return null;
      }

      // Handle trailing percentages (e.g., 25% -> (25/100))
      clean = clean.replace(/([0-9.]+)\s*%/g, '($1/100)');

      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${clean})`)();
      if (typeof result === 'number' && !isNaN(result)) {
        // If division by zero occurred (Infinity or -Infinity), return null safely
        if (!isFinite(result)) {
          return null;
        }
        return Math.round(result * 100) / 100;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Evaluate a formula expression against a given period id or 'total' / 'avg'
  const evaluateFormulaForPeriod = (expr, periodId, scope = 'period') => {
    if (!expr || !expr.trim()) return null;

    let subbed = normalizeFormulaExpression(expr);

    // Substitute each [Category Name] or [Category Code] with its numeric figure
    availableCategories.forEach(cat => {
      let val = 0;
      if (scope === 'total') {
        val = Number(cat.total || 0);
      } else if (scope === 'avg') {
        val = Number(cat.avg || 0);
      } else {
        const pKey = String(periodId);
        val = Number(cat.amounts?.[pKey] ?? cat.amounts?.[periodId] ?? 0);
      }

      const escapedName = cat.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      subbed = subbed.replace(new RegExp(`\\[${escapedName}\\]`, 'gi'), `(${val})`);
      if (cat.code) {
        subbed = subbed.replace(new RegExp(`\\[${cat.code}\\]`, 'gi'), `(${val})`);
      }
    });

    // Support [Total] or [Grand Total] token
    let grandTotVal = 0;
    if (scope === 'total') {
      grandTotVal = Number(computedMatrix?.grand_total?.total || 0);
    } else if (scope === 'avg') {
      grandTotVal = Number(computedMatrix?.grand_total?.avg || 0);
    } else {
      const pKey = String(periodId);
      grandTotVal = Number(computedMatrix?.grand_total?.amounts?.[pKey] ?? computedMatrix?.grand_total?.amounts?.[periodId] ?? 0);
    }
    subbed = subbed.replace(/\[(total|grand\s*total|total\s*spend|total\s*expenses)\]/gi, `(${grandTotVal})`);

    return sanitizeAndEvaluate(subbed);
  };

  // Build full step-by-step substitution string for display
  const getSubstitutedBreakdown = (expr, periodId) => {
    if (!expr) return '';
    let subbed = normalizeFormulaExpression(expr);
    const pKey = String(periodId);

    availableCategories.forEach(cat => {
      const val = Number(cat.amounts?.[pKey] ?? cat.amounts?.[periodId] ?? 0);
      const escapedName = cat.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      subbed = subbed.replace(new RegExp(`\\[${escapedName}\\]`, 'gi'), `[${cat.name}: ${formatINR(val)}]`);
    });
    return subbed;
  };

  // --------------------------------------------------------------------------
  // LIVE SYNTAX CHECK & PREVIEW FOR CURRENT INPUT
  // --------------------------------------------------------------------------
  const livePreview = useMemo(() => {
    if (!formulaExpression.trim()) {
      return { isValid: null, text: 'Enter or insert a category formula above to see instant preview', value: null };
    }

    const valResult = validateFormulaSyntax(formulaExpression);
    if (!valResult.isValid) {
      return {
        isValid: false,
        text: valResult.error,
        value: null
      };
    }

    // Pick latest period or first period for live preview
    const samplePeriod = periods[periods.length - 1] || periods[0];
    const samplePeriodId = samplePeriod?.id;

    const evaluated = evaluateFormulaForPeriod(valResult.normalized, samplePeriodId, 'period');

    if (evaluated === null) {
      return {
        isValid: true,
        text: `Valid syntax • ${samplePeriod?.period_label || 'Latest Month'}: (Zero divisor in this month)`,
        value: null,
        periodLabel: samplePeriod?.period_label || 'Latest Month'
      };
    }

    return {
      isValid: true,
      text: `Calculated for ${samplePeriod?.period_label || 'Latest Month'}:`,
      value: evaluated,
      periodLabel: samplePeriod?.period_label || 'Latest Month'
    };
  }, [formulaExpression, periods, availableCategories, computedMatrix]);

  // --------------------------------------------------------------------------
  // TOKEN & OPERATOR INSERTION HANDLERS
  // --------------------------------------------------------------------------
  const handleInsertToken = (token) => {
    setFormulaExpression(prev => {
      if (!prev) return token;
      return `${prev} ${token}`;
    });
    if (formulaInputRef.current) {
      formulaInputRef.current.focus();
    }
  };

  const handleInsertCategory = () => {
    if (!selectedCategoryName) return;
    handleInsertToken(`[${selectedCategoryName}]`);
  };

  const handleClearFormula = () => {
    setFormulaName('');
    setFormulaExpression('');
    setFormulaDescription('');
    setFormulaUnit('currency');
    setEditingFormulaId(null);
  };

  // --------------------------------------------------------------------------
  // SAVE FORMULA (CREATE OR UPDATE)
  // --------------------------------------------------------------------------
  const handleSaveFormula = async () => {
    if (!formulaName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide a descriptive Name for this formula.' });
      return;
    }
    if (!formulaExpression.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid formula expression.' });
      return;
    }

    // Verify mathematical validity with smart diagnostics
    const valResult = validateFormulaSyntax(formulaExpression);
    if (!valResult.isValid) {
      setStatusMessage({ type: 'error', text: valResult.error || 'Invalid formula syntax. Please check your operators (+, -, *, /) and category brackets.' });
      return;
    }

    const finalExpression = valResult.normalized || formulaExpression.trim();

    const formulaPayload = {
      name: formulaName.trim(),
      expression: finalExpression,
      description: formulaDescription.trim(),
      unit_type: formulaUnit,
      module: moduleKey
    };

    try {
      if (editingFormulaId) {
        // Update in backend
        try {
          await fetch(`/api/master/category-formulas/${editingFormulaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formulaPayload)
          });
        } catch (_) {}

        const updated = formulas.map(f => {
          if (f.id === editingFormulaId || f.name === formulaName) {
            return { ...f, ...formulaPayload, id: editingFormulaId };
          }
          return f;
        });
        saveFormulasLocally(updated);
        setStatusMessage({ type: 'success', text: `Formula "${formulaName}" updated successfully!` });
      } else {
        // Create new formula in backend
        let newId = Date.now();
        try {
          const res = await fetch('/api/master/category-formulas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formulaPayload)
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.id) newId = data.id;
          }
        } catch (_) {}

        const newFormula = { ...formulaPayload, id: newId };
        saveFormulasLocally([newFormula, ...formulas]);
        setStatusMessage({ type: 'success', text: `Formula "${formulaName}" added to the data sheet!` });
      }

      handleClearFormula();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to save formula: ' + err.message });
    }
  };

  // Edit existing formula
  const handleEditFormula = (formula) => {
    setEditingFormulaId(formula.id || formula.name);
    setFormulaName(formula.name);
    setFormulaExpression(formula.expression);
    setFormulaDescription(formula.description || '');
    setFormulaUnit(formula.unit_type || 'currency');
    window.scrollTo({ top: 120, behavior: 'smooth' });
    if (formulaInputRef.current) {
      formulaInputRef.current.focus();
    }
  };

  // Delete formula
  const handleDeleteFormula = async (formula) => {
    if (!window.confirm(`Are you sure you want to delete the formula "${formula.name}"?`)) {
      return;
    }

    if (formula.id && typeof formula.id === 'number') {
      try {
        await fetch(`/api/master/category-formulas/${formula.id}`, { method: 'DELETE' });
      } catch (_) {}
    }

    const filtered = formulas.filter(f => (f.id ? f.id !== formula.id : f.name !== formula.name));
    saveFormulasLocally(filtered);
    setStatusMessage({ type: 'success', text: `Formula "${formula.name}" removed.` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Reset to starter defaults
  const handleResetDefaults = () => {
    if (window.confirm('Reset all formulas to default operational functions for this module?')) {
      const starters = STARTER_FORMULAS[moduleKey] || STARTER_FORMULAS.food;
      saveFormulasLocally(starters);
      setStatusMessage({ type: 'success', text: 'Reset to default operational formulas!' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Format value according to unit
  const formatFormulaVal = (val, unitType = 'currency') => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    if (unitType === 'percentage') {
      return `${Number(val).toFixed(2)}%`;
    }
    if (unitType === 'number') {
      return `${Number(val).toFixed(2)}x`;
    }
    return formatINR(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* -------------------------------------------------------------------- */}
      {/* HEADER BANNER */}
      {/* -------------------------------------------------------------------- */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '22px 26px',
        border: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.28)'
          }}>
            <Calculator size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              {moduleName} Category Formulas & Mathematical Functions
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '3px 0 0 0' }}>
              Create and manage custom formulas across existing categories using arithmetic operations (<strong>+</strong>, <strong>−</strong>, <strong>×</strong>, <strong>÷</strong>).
              Evaluated instantly across all monthly billing cycles.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            title="Reset to default operational formulas"
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              color: '#475569',
              fontSize: '12.5px',
              fontWeight: '600',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* STATUS NOTIFICATION */}
      {statusMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {statusMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* FORMULA BUILDER CARD */}
      {/* -------------------------------------------------------------------- */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1.5px solid #c7d2fe',
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: '0 2px 10px rgba(79, 70, 229, 0.06)'
      }}>
        
        {/* CARD TITLE & EDITING BADGE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#4f46e5" />
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e1b4b', margin: 0 }}>
              {editingFormulaId ? 'Edit Category Formula' : 'Formula Builder & Function Creator'}
            </h3>
            {editingFormulaId && (
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid #fde68a'
              }}>
                Editing Active Formula
              </span>
            )}
          </div>
          {editingFormulaId && (
            <button
              type="button"
              onClick={handleClearFormula}
              style={{
                fontSize: '12px',
                color: '#64748b',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Cancel Edit & Create New
            </button>
          )}
        </div>

        {/* STEP 1: DYNAMIC CATEGORY DROPDOWN & INSERT BUTTON */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '10px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} color="#4f46e5" />
              <span>Step 1: Choose Available Category from Data Sheet ({availableCategories.length} Categories Available)</span>
            </label>

            {openAddCategoryModal && (
              <button
                type="button"
                onClick={openAddCategoryModal}
                style={{
                  fontSize: '11.5px',
                  fontWeight: '700',
                  color: '#2563eb',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FolderPlus size={13} />
                <span>+ Add New Category (Auto-syncs here)</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* THE DYNAMIC CATEGORY DROPDOWN */}
            <select
              value={selectedCategoryName}
              onChange={(e) => setSelectedCategoryName(e.target.value)}
              style={{
                flex: '1 1 280px',
                minWidth: '240px',
                padding: '9px 14px',
                fontSize: '13.5px',
                fontWeight: '600',
                color: '#0f172a',
                backgroundColor: '#ffffff',
                border: '1.5px solid #94a3b8',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {availableCategories.length === 0 ? (
                <option value="">No categories available</option>
              ) : (
                availableCategories.map(cat => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name} {cat.total > 0 ? `(5-Mo Total: ${formatINR(cat.total)})` : ''}
                  </option>
                ))
              )}
            </select>

            {/* INSERT CATEGORY TOKEN BUTTON */}
            <button
              type="button"
              onClick={handleInsertCategory}
              disabled={!selectedCategoryName}
              title={`Insert [${selectedCategoryName}] into formula`}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                border: 'none',
                cursor: selectedCategoryName ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.28)',
                opacity: selectedCategoryName ? 1 : 0.6
              }}
            >
              <Plus size={16} />
              <span>+ Insert Category into Formula</span>
            </button>
          </div>

          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Tip: Select any category from the dropdown and click <strong>+ Insert Category into Formula</strong> to insert it as a token like <code>[{selectedCategoryName || 'Category'}]</code>. When you add a new category to master data, it will immediately appear in this dropdown!
          </span>
        </div>

        {/* STEP 2: MANUAL FORMULA ENTRY & ARITHMETIC OPERATORS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
              Step 2: Enter Formula Manually (Add, Subtract, Multiply, Divide, Parentheses)
            </label>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Use <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>( )</code> and numeric numbers
            </span>
          </div>

          {/* QUICK ARITHMETIC BUTTONS BAR */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            padding: '6px 8px',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginRight: '4px' }}>
              Operations:
            </span>

            <button
              type="button"
              onClick={() => handleInsertToken('+')}
              title="Add (+)"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: '800',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              + Add
            </button>

            <button
              type="button"
              onClick={() => handleInsertToken('-')}
              title="Subtract (-)"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: '800',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              − Subtract
            </button>

            <button
              type="button"
              onClick={() => handleInsertToken('*')}
              title="Multiply (*)"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: '800',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              × Multiply
            </button>

            <button
              type="button"
              onClick={() => handleInsertToken('/')}
              title="Divide (/)"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: '800',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              ÷ Divide
            </button>

            <button
              type="button"
              onClick={() => handleInsertToken('(')}
              style={{
                padding: '6px 11px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: '800',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              (
            </button>

            <button
              type="button"
              onClick={() => handleInsertToken(')')}
              style={{
                padding: '6px 11px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: '800',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              )
            </button>

            <div style={{ width: '1px', height: '22px', backgroundColor: '#cbd5e1', margin: '0 4px' }} />

            <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginRight: '4px' }}>
              Common:
            </span>

            <button
              type="button"
              onClick={() => handleInsertToken('* 100')}
              title="Multiply by 100 (for percentage)"
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                fontSize: '11.5px',
                fontWeight: '700',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              * 100 (%)
            </button>

            <button
              type="button"
              onClick={() => handleInsertToken('/ 30')}
              title="Divide by 30 days (daily rate)"
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                fontSize: '11.5px',
                fontWeight: '700',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              / 30 (Per Day)
            </button>

            <button
              type="button"
              onClick={() => handleInsertToken('* 1.18')}
              title="Add 18% GST"
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                fontSize: '11.5px',
                fontWeight: '700',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              * 1.18 (+18% GST)
            </button>

            <button
              type="button"
              onClick={() => handleInsertToken('[Total]')}
              title="Insert Month Grand Total"
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: '#e0e7ff',
                border: '1px solid #c7d2fe',
                fontSize: '11.5px',
                fontWeight: '700',
                color: '#3730a3',
                cursor: 'pointer'
              }}
            >
              [Total Spend]
            </button>

            <button
              type="button"
              onClick={() => setFormulaExpression('')}
              title="Clear expression"
              style={{
                marginLeft: 'auto',
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                fontSize: '11.5px',
                fontWeight: '700',
                color: '#991b1b',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>

          {/* MANUAL FORMULA INPUT TEXTAREA */}
          <textarea
            ref={formulaInputRef}
            rows={2}
            value={formulaExpression}
            onChange={(e) => setFormulaExpression(e.target.value)}
            placeholder="e.g. [Food Material] + [Food Labour]  OR  ([Diesel - buses] + [Petrol - cars & vans]) / 30"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontFamily: 'monospace',
              fontSize: '14.5px',
              fontWeight: '600',
              color: '#0f172a',
              backgroundColor: '#ffffff',
              border: livePreview.isValid === false ? '2px solid #ef4444' : livePreview.isValid === true ? '2px solid #10b981' : '1.5px solid #cbd5e1',
              borderRadius: '8px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          {/* LIVE PREVIEW & VALIDATION STATUS BANNER */}
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: livePreview.isValid === true ? '#f0fdf4' : livePreview.isValid === false ? '#fef2f2' : '#f8fafc',
            border: `1px solid ${livePreview.isValid === true ? '#bbf7d0' : livePreview.isValid === false ? '#fecaca' : '#e2e8f0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {livePreview.isValid === true && <Check size={16} color="#166534" />}
              {livePreview.isValid === false && <AlertCircle size={16} color="#991b1b" />}
              {livePreview.isValid === null && <HelpCircle size={16} color="#64748b" />}
              <span style={{
                fontSize: '12.5px',
                fontWeight: '600',
                color: livePreview.isValid === true ? '#166534' : livePreview.isValid === false ? '#991b1b' : '#64748b'
              }}>
                {livePreview.text}
              </span>
            </div>

            {livePreview.isValid === true && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '700' }}>
                  Live Result ({livePreview.periodLabel}):
                </span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '800',
                  color: '#14532d',
                  backgroundColor: '#dcfce7',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontFamily: 'monospace'
                }}>
                  {formatFormulaVal(livePreview.value, formulaUnit)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* STEP 3: METADATA, UNIT SELECTION & SAVE BUTTON */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          alignItems: 'flex-end',
          paddingTop: '6px',
          borderTop: '1px solid #f1f5f9'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
              Formula Name *
            </label>
            <input
              type="text"
              value={formulaName}
              onChange={(e) => setFormulaName(e.target.value)}
              placeholder="e.g. Core Production Cost"
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1.5px solid #cbd5e1',
                borderRadius: '7px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              value={formulaDescription}
              onChange={(e) => setFormulaDescription(e.target.value)}
              placeholder="e.g. Raw material + culinary labour"
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '13px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '7px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
              Display Unit / Formatting
            </label>
            <select
              value={formulaUnit}
              onChange={(e) => setFormulaUnit(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1.5px solid #cbd5e1',
                borderRadius: '7px',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="currency">₹ Currency (INR)</option>
              <option value="percentage">% Percentage</option>
              <option value="number">x Ratio / Numeric Multiplier</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleSaveFormula}
              style={{
                flex: 1,
                padding: '10px 18px',
                borderRadius: '7px',
                backgroundColor: '#059669',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
              }}
            >
              <Save size={16} />
              <span>{editingFormulaId ? 'Save Changes' : 'Save Formula to Sheet'}</span>
            </button>

            {editingFormulaId && (
              <button
                type="button"
                onClick={handleClearFormula}
                style={{
                  padding: '10px 14px',
                  borderRadius: '7px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* FINANCIAL DATA SHEET: FORMULAS EVALUATION TABLE */}
      {/* -------------------------------------------------------------------- */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        
        {/* TABLE HEADER BAR */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Calculated Category Formulas Data Sheet
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Showing {formulas.length} formulas evaluated across {periods.length} billing cycles
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: '600' }}>
              Click any row to view step-by-step mathematical substitution breakdown
            </span>
          </div>
        </div>

        {/* DATA SHEET TABLE */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                <th style={{ padding: '12px 18px', fontWeight: '700', minWidth: '220px', borderRight: '1px solid #1e293b' }}>
                  Formula Name & Expression
                </th>
                <th style={{ padding: '12px 12px', fontWeight: '700', textAlign: 'center', width: '90px', borderRight: '1px solid #1e293b' }}>
                  Unit
                </th>
                {periods.map(p => (
                  <th key={p.id} style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right', minWidth: '125px', borderRight: '1px solid #1e293b' }}>
                    {p.period_label}
                  </th>
                ))}
                <th style={{ padding: '12px 18px', fontWeight: '800', textAlign: 'right', minWidth: '140px', backgroundColor: '#1e1b4b', color: '#e0e7ff', borderRight: '1px solid #1e293b' }}>
                  Total (All Months)
                </th>
                <th style={{ padding: '12px 16px', fontWeight: '800', textAlign: 'right', minWidth: '130px', backgroundColor: '#1e1b4b', color: '#e0e7ff', borderRight: '1px solid #1e293b' }}>
                  Monthly Avg
                </th>
                <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'center', width: '110px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {formulas.length === 0 ? (
                <tr>
                  <td colSpan={periods.length + 5} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    No formulas created yet. Use the formula builder above to add formulas for your existing categories!
                  </td>
                </tr>
              ) : (
                formulas.map((formula, idx) => {
                  const formulaId = formula.id || formula.name;
                  const isExpanded = expandedBreakdownId === formulaId;
                  const unitType = formula.unit_type || 'currency';

                  // Evaluate for each period
                  const periodValues = periods.map(p => {
                    return evaluateFormulaForPeriod(formula.expression, p.id, 'period');
                  });

                  // Evaluate Total (on category totals)
                  const totalValue = evaluateFormulaForPeriod(formula.expression, null, 'total');

                  // Evaluate Monthly Average (average of valid period results)
                  const validPeriodVals = periodValues.filter(v => v !== null && !isNaN(v));
                  const avgValue = validPeriodVals.length > 0 
                    ? validPeriodVals.reduce((sum, v) => sum + v, 0) / validPeriodVals.length 
                    : evaluateFormulaForPeriod(formula.expression, null, 'avg');

                  // MoM Trend (latest period vs previous period)
                  const latestVal = periodValues[periodValues.length - 1];
                  const prevVal = periodValues[periodValues.length - 2];
                  let momDelta = null;
                  if (latestVal !== null && prevVal !== null && prevVal !== 0) {
                    momDelta = ((latestVal - prevVal) / Math.abs(prevVal)) * 100;
                  }

                  return (
                    <React.Fragment key={formulaId || idx}>
                      <tr 
                        onClick={() => setExpandedBreakdownId(isExpanded ? null : formulaId)}
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                          borderBottom: isExpanded ? 'none' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc'}
                      >
                        {/* Formula Details */}
                        <td style={{ padding: '12px 18px', borderRight: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ color: '#4f46e5', marginTop: '2px' }}>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13.5px' }}>
                                {formula.name}
                              </div>
                              <div style={{
                                marginTop: '3px',
                                fontFamily: 'monospace',
                                fontSize: '11.5px',
                                color: '#4f46e5',
                                backgroundColor: '#eef2ff',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}>
                                {formula.expression}
                              </div>
                              {formula.description && (
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                  {formula.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Unit Badge */}
                        <td style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 7px',
                            borderRadius: '9999px',
                            backgroundColor: unitType === 'percentage' ? '#fef3c7' : unitType === 'number' ? '#e0f2fe' : '#ecfdf5',
                            color: unitType === 'percentage' ? '#92400e' : unitType === 'number' ? '#0369a1' : '#047857',
                            border: `1px solid ${unitType === 'percentage' ? '#fde68a' : unitType === 'number' ? '#bae6fd' : '#a7f3d0'}`
                          }}>
                            {unitType === 'percentage' ? '%' : unitType === 'number' ? 'Ratio' : 'INR ₹'}
                          </span>
                        </td>

                        {/* Period Columns */}
                        {periods.map((p, pIdx) => {
                          const val = periodValues[pIdx];
                          return (
                            <td 
                              key={p.id} 
                              style={{ 
                                padding: '12px 16px', 
                                textAlign: 'right', 
                                fontWeight: '600', 
                                color: '#1e293b', 
                                fontFamily: 'monospace',
                                fontSize: '13px',
                                borderRight: '1px solid #e2e8f0' 
                              }}
                            >
                              {formatFormulaVal(val, unitType)}
                            </td>
                          );
                        })}

                        {/* Total Column */}
                        <td style={{
                          padding: '12px 18px',
                          textAlign: 'right',
                          fontWeight: '800',
                          color: '#312e81',
                          backgroundColor: '#eef2ff',
                          fontFamily: 'monospace',
                          fontSize: '13.5px',
                          borderRight: '1px solid #c7d2fe'
                        }}>
                          {formatFormulaVal(totalValue, unitType)}
                        </td>

                        {/* Monthly Avg Column */}
                        <td style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontWeight: '800',
                          color: '#312e81',
                          backgroundColor: '#f5f3ff',
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          borderRight: '1px solid #ddd6fe'
                        }}>
                          {formatFormulaVal(avgValue, unitType)}
                        </td>

                        {/* Action Buttons */}
                        <td 
                          onClick={(e) => e.stopPropagation()}
                          style={{ padding: '12px 12px', textAlign: 'center' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleEditFormula(formula)}
                              title="Edit formula"
                              style={{
                                padding: '5px',
                                borderRadius: '5px',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                color: '#475569',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteFormula(formula)}
                              title="Delete formula"
                              style={{
                                padding: '5px',
                                borderRadius: '5px',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#b91c1c',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDABLE ACCORDION ROW: STEP-BY-STEP CALCULATION DETAILS */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                          <td colSpan={periods.length + 5} style={{ padding: '14px 24px' }}>
                            <div style={{
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              padding: '14px 18px',
                              border: '1.5px solid #e0e7ff',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#3730a3' }}>
                                  📐 Mathematical Substitution & Period Breakdown:
                                </span>
                                {momDelta !== null && (
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: momDelta >= 0 ? '#15803d' : '#b91c1c',
                                    backgroundColor: momDelta >= 0 ? '#f0fdf4' : '#fef2f2',
                                    padding: '2px 8px',
                                    borderRadius: '6px'
                                  }}>
                                    MoM Change ({periods[periods.length - 1]?.period_label} vs {periods[periods.length - 2]?.period_label}): {momDelta >= 0 ? '+' : ''}{momDelta.toFixed(1)}%
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                                {periods.map((p, pIdx) => {
                                  const rawSubbed = getSubstitutedBreakdown(formula.expression, p.id);
                                  const pVal = periodValues[pIdx];
                                  return (
                                    <div key={p.id} style={{
                                      padding: '8px 12px',
                                      backgroundColor: '#f8fafc',
                                      borderRadius: '6px',
                                      border: '1px solid #e2e8f0',
                                      fontSize: '11.5px'
                                    }}>
                                      <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                                        {p.period_label}:
                                      </div>
                                      <div style={{ color: '#475569', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '11px' }}>
                                        {rawSubbed}
                                      </div>
                                      <div style={{ fontWeight: '800', color: '#166534', marginTop: '4px', textAlign: 'right' }}>
                                        = {formatFormulaVal(pVal, unitType)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
