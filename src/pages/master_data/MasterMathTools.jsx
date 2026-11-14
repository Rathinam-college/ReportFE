import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Percent, Copy, Check, History, X, 
  RotateCcw, Sparkles, TrendingUp, DollarSign, ArrowRight,
  ArrowLeftRight, Layers, GitCompare, Plus, Minus
} from 'lucide-react';
import { formatINR, formatLakhs } from '../../utils/formatters';

export default function MasterMathTools({ 
  onClose, 
  moduleName = 'Food & Dining',
  categoriesList = [],
  computedMatrix = null
}) {
  const [activeTab, setActiveTab] = useState('category_math'); // 'category_math' | 'calc' | 'helpers' | 'history'
  
  // --------------------------------------------------------------------------
  // NORMALIZE CATEGORIES & PERIODS FROM MATRIX / MASTER DATA
  // --------------------------------------------------------------------------
  const periods = useMemo(() => {
    return computedMatrix?.periods || [];
  }, [computedMatrix]);

  const matrixCategories = useMemo(() => {
    if (computedMatrix?.categories && computedMatrix.categories.length > 0) {
      return computedMatrix.categories.map(c => ({
        id: c.category_id || c.id,
        name: c.category_name || c.name || 'Category',
        code: c.category_code || c.code || '',
        amounts: c.subtotal?.amounts || {},
        total: Number(c.subtotal?.total || 0),
        avg: Number(c.subtotal?.avg || 0)
      }));
    }
    if (categoriesList && categoriesList.length > 0) {
      return categoriesList.map(c => ({
        id: c.id,
        name: c.name || 'Category',
        code: c.code || '',
        amounts: {},
        total: 0,
        avg: 0
      }));
    }
    return [];
  }, [computedMatrix, categoriesList]);

  // --------------------------------------------------------------------------
  // CATEGORY MATH STATE
  // --------------------------------------------------------------------------
  const [catMathMode, setCatMathMode] = useState('cat_to_cat'); // 'cat_to_cat' | 'same_cat' | 'formula'
  
  // Mode 1: Cat vs Cat
  const [catAId, setCatAId] = useState(() => matrixCategories[0]?.id || 1);
  const [catBId, setCatBId] = useState(() => matrixCategories[1]?.id || matrixCategories[0]?.id || 1);
  const [catOperator, setCatOperator] = useState('+'); // '+', '-', '*', '/', '%'
  const [useCustomConstant, setUseCustomConstant] = useState(false);
  const [customConstantVal, setCustomConstantVal] = useState('1.18');
  const [catPeriodScope, setCatPeriodScope] = useState('all'); // 'all' or period_id

  // Mode 2: Same Category Period Comparison
  const [sameCatId, setSameCatId] = useState(() => matrixCategories[0]?.id || 1);
  const [sameCatPeriod1, setSameCatPeriod1] = useState(() => periods[0]?.id || null);
  const [sameCatPeriod2, setSameCatPeriod2] = useState(() => periods[periods.length - 1]?.id || null);
  const [sameCatOp, setSameCatOp] = useState('-'); // '-', '/', '+', '%'

  // Mode 3: Custom Formula Builder
  const [customFormula, setCustomFormula] = useState('');
  const [formulaResults, setFormulaResults] = useState(null);

  // Sync default IDs when categories load
  useEffect(() => {
    if (matrixCategories.length > 0) {
      if (!catAId || !matrixCategories.some(c => c.id === catAId)) {
        setCatAId(matrixCategories[0].id);
      }
      if (!catBId || !matrixCategories.some(c => c.id === catBId)) {
        setCatBId(matrixCategories[1]?.id || matrixCategories[0].id);
      }
      if (!sameCatId || !matrixCategories.some(c => c.id === sameCatId)) {
        setSameCatId(matrixCategories[0].id);
      }
    }
  }, [matrixCategories]);

  useEffect(() => {
    if (periods.length > 0) {
      if (!sameCatPeriod1) setSameCatPeriod1(periods[0].id);
      if (!sameCatPeriod2) setSameCatPeriod2(periods[periods.length - 1].id);
    }
  }, [periods]);

  // --------------------------------------------------------------------------
  // CALCULATOR STATE
  // --------------------------------------------------------------------------
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState(null);
  const [calcHistory, setCalcHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rathinam_calc_history') || '[]');
    } catch {
      return [];
    }
  });
  const [copied, setCopied] = useState(false);

  // Operational Formula State
  const [dinerSpend, setDinerSpend] = useState('1000000');
  const [dinerCount, setDinerCount] = useState('2690');
  const [dinerDays, setDinerDays] = useState('30');

  const [fuelSpend, setFuelSpend] = useState('518484');
  const [tripKms, setTripKms] = useState('25777');

  const [grossGstAmount, setGrossGstAmount] = useState('118000');
  const [gstRate, setGstRate] = useState(18);

  const [annualSpend, setAnnualSpend] = useState('8500000');
  const [monthsElapsed, setMonthsElapsed] = useState('5');

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rathinam_calc_history', JSON.stringify(calcHistory.slice(0, 30)));
    } catch {
      // ignore
    }
  }, [calcHistory]);

  // Safe Math Expression Evaluation
  const evaluateExpression = (expr) => {
    if (!expr || !expr.trim()) return null;
    try {
      const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '');
      if (!/^[0-9+\-*/().\s%]+$/.test(sanitized)) {
        return 'Error';
      }
      const withPercents = sanitized.replace(/([0-9.]+)\s*%/g, '($1/100)');
      // eslint-disable-next-line no-new-func
      const val = Function(`'use strict'; return (${withPercents})`)();
      if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
        return Math.round(val * 100) / 100;
      }
      return 'Error';
    } catch {
      return 'Error';
    }
  };

  const handleAppend = (char) => {
    setExpression(prev => prev + char);
  };

  const handleClear = () => {
    setExpression('');
    setResult(null);
  };

  const handleBackspace = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    if (!expression.trim()) return;
    const res = evaluateExpression(expression);
    if (res !== 'Error' && res !== null) {
      setResult(res);
      const newEntry = {
        id: Date.now(),
        expr: expression,
        val: res,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setCalcHistory(prev => [newEntry, ...prev.slice(0, 24)]);
    } else {
      setResult('Error');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalculate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  const handleCopy = (text) => {
    if (!text && text !== 0) return;
    navigator.clipboard.writeText(String(text));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleInjectValueToCalc = (num, label = '') => {
    if (num === null || num === undefined || isNaN(num)) return;
    setExpression(prev => (prev ? `${prev} + ${Number(num)}` : String(Number(num))));
    setActiveTab('calc');
  };

  // --------------------------------------------------------------------------
  // CATEGORY TO CATEGORY CALCULATION LOGIC
  // --------------------------------------------------------------------------
  const selectedCatA = matrixCategories.find(c => c.id === catAId) || matrixCategories[0];
  const selectedCatB = matrixCategories.find(c => c.id === catBId) || matrixCategories[1] || matrixCategories[0];

  const computePair = (valA, valB, op) => {
    const a = Number(valA || 0);
    const b = Number(valB || 0);
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : null;
      case '%': return b !== 0 ? (a / b) * 100 : null;
      default: return a + b;
    }
  };

  // Mode 1: Month by month results
  const catToCatResults = useMemo(() => {
    if (!selectedCatA) return { totalA: 0, totalB: 0, totalRes: 0, byPeriod: [] };

    const constantNum = parseFloat(customConstantVal) || 0;
    const totalA = selectedCatA.total || 0;
    const totalB = useCustomConstant ? constantNum : (selectedCatB?.total || 0);
    const totalRes = computePair(totalA, totalB, catOperator);

    const byPeriod = periods.map(p => {
      const pidStr = String(p.id);
      const valA = Number(selectedCatA.amounts?.[pidStr] ?? selectedCatA.amounts?.[p.id] ?? 0);
      const valB = useCustomConstant 
        ? constantNum 
        : Number(selectedCatB?.amounts?.[pidStr] ?? selectedCatB?.amounts?.[p.id] ?? 0);
      const res = computePair(valA, valB, catOperator);
      return {
        period: p,
        valA,
        valB,
        res
      };
    });

    return { totalA, totalB, totalRes, byPeriod };
  }, [selectedCatA, selectedCatB, catOperator, useCustomConstant, customConstantVal, periods]);

  // Mode 2: Same Category Period Comparison Results
  const selectedSameCat = matrixCategories.find(c => c.id === sameCatId) || matrixCategories[0];
  const sameCatResults = useMemo(() => {
    if (!selectedSameCat || !sameCatPeriod1 || !sameCatPeriod2) return null;
    const p1Obj = periods.find(p => p.id === sameCatPeriod1) || periods[0];
    const p2Obj = periods.find(p => p.id === sameCatPeriod2) || periods[periods.length - 1];

    const val1 = Number(selectedSameCat.amounts?.[String(sameCatPeriod1)] ?? selectedSameCat.amounts?.[sameCatPeriod1] ?? 0);
    const val2 = Number(selectedSameCat.amounts?.[String(sameCatPeriod2)] ?? selectedSameCat.amounts?.[sameCatPeriod2] ?? 0);

    const delta = val2 - val1;
    const pctChange = val1 > 0 ? ((val2 - val1) / val1) * 100 : null;
    const ratio = val1 > 0 ? val2 / val1 : null;
    const sum = val1 + val2;

    let opResult = null;
    if (sameCatOp === '-') opResult = delta;
    else if (sameCatOp === '+') opResult = sum;
    else if (sameCatOp === '/') opResult = ratio;
    else if (sameCatOp === '%') opResult = pctChange;

    return { p1Obj, p2Obj, val1, val2, delta, pctChange, ratio, sum, opResult };
  }, [selectedSameCat, sameCatPeriod1, sameCatPeriod2, sameCatOp, periods]);

  // Mode 3: Custom Formula Evaluation across all periods
  const handleEvaluateCustomFormula = () => {
    if (!customFormula.trim()) return;

    const results = periods.map(p => {
      let expr = customFormula;
      const pidStr = String(p.id);

      // Replace each [Category Name] or [CAT_CODE] with its period amount
      matrixCategories.forEach(cat => {
        const amt = Number(cat.amounts?.[pidStr] ?? cat.amounts?.[p.id] ?? 0);
        // Replace exact brackets e.g. [Food Material]
        const escapedName = cat.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        expr = expr.replace(new RegExp(`\\[${escapedName}\\]`, 'gi'), String(amt));
        if (cat.code) {
          expr = expr.replace(new RegExp(`\\[${cat.code}\\]`, 'gi'), String(amt));
        }
      });

      // Also support [Total] as Grand Total for that period
      const grandTotAmt = computedMatrix?.grand_total?.amounts?.[pidStr] ?? computedMatrix?.grand_total?.amounts?.[p.id] ?? 0;
      expr = expr.replace(/\[total\]/gi, String(grandTotAmt));

      const val = evaluateExpression(expr);
      return {
        period: p,
        val
      };
    });

    // Evaluate on Grand Totals
    let totalExpr = customFormula;
    matrixCategories.forEach(cat => {
      const tot = Number(cat.total || 0);
      const escapedName = cat.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      totalExpr = totalExpr.replace(new RegExp(`\\[${escapedName}\\]`, 'gi'), String(tot));
      if (cat.code) {
        totalExpr = totalExpr.replace(new RegExp(`\\[${cat.code}\\]`, 'gi'), String(tot));
      }
    });
    const grandTotTotal = computedMatrix?.grand_total?.total ?? 0;
    totalExpr = totalExpr.replace(/\[total\]/gi, String(grandTotTotal));
    const totalVal = evaluateExpression(totalExpr);

    setFormulaResults({ byPeriod: results, totalVal });
  };

  const handleInsertTokenToFormula = (token) => {
    setCustomFormula(prev => prev ? `${prev} ${token}` : token);
  };

  return (
    <div style={{
      width: '420px',
      minWidth: '380px',
      backgroundColor: '#ffffff',
      borderLeft: '1.5px solid #cbd5e1',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-4px 0 16px rgba(0,0,0,0.06)',
      zIndex: 40,
      flexShrink: 0,
      overflow: 'hidden'
    }}>
      
      {/* HEADER BAR */}
      <div style={{
        padding: '14px 18px',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 5px rgba(79, 70, 229, 0.4)'
          }}>
            <Calculator size={16} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, letterSpacing: '-0.01em' }}>
              Master Math & Calculation Tools
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Category arithmetic • Custom functions • Unit formulas
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Close Math Tools"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 4-TABS SWITCHER */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        padding: '4px 6px',
        gap: '4px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('category_math')}
          style={{
            flex: 1.2,
            padding: '7px 4px',
            fontSize: '11.5px',
            fontWeight: activeTab === 'category_math' ? '800' : '600',
            backgroundColor: activeTab === 'category_math' ? '#ffffff' : 'transparent',
            color: activeTab === 'category_math' ? '#4f46e5' : '#64748b',
            border: activeTab === 'category_math' ? '1.5px solid #4f46e5' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: activeTab === 'category_math' ? '0 1px 4px rgba(79,70,229,0.15)' : 'none'
          }}
        >
          🔄 Category Math
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calc')}
          style={{
            flex: 1,
            padding: '7px 4px',
            fontSize: '11.5px',
            fontWeight: activeTab === 'calc' ? '800' : '600',
            backgroundColor: activeTab === 'calc' ? '#ffffff' : 'transparent',
            color: activeTab === 'calc' ? '#2563eb' : '#64748b',
            border: activeTab === 'calc' ? '1.5px solid #2563eb' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: activeTab === 'calc' ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
          }}
        >
          🧮 Calculator
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('helpers')}
          style={{
            flex: 1,
            padding: '7px 4px',
            fontSize: '11.5px',
            fontWeight: activeTab === 'helpers' ? '800' : '600',
            backgroundColor: activeTab === 'helpers' ? '#ffffff' : 'transparent',
            color: activeTab === 'helpers' ? '#059669' : '#64748b',
            border: activeTab === 'helpers' ? '1.5px solid #059669' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: activeTab === 'helpers' ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
          }}
        >
          ⚡ Formulas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            flex: 0.9,
            padding: '7px 4px',
            fontSize: '11.5px',
            fontWeight: activeTab === 'history' ? '800' : '600',
            backgroundColor: activeTab === 'history' ? '#ffffff' : 'transparent',
            color: activeTab === 'history' ? '#0f172a' : '#64748b',
            border: activeTab === 'history' ? '1px solid #cbd5e1' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
          }}
        >
          🕒 Tape ({calcHistory.length})
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: CATEGORY TO CATEGORY ARITHMETIC & FUNCTION CALCULATOR        */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'category_math' && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1 }}>
          
          {/* Sub-mode selector */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            padding: '3px',
            gap: '3px'
          }}>
            {[
              { id: 'cat_to_cat', label: 'Cat vs Cat (A ±×÷ B)' },
              { id: 'same_cat', label: 'Same Cat MoM' },
              { id: 'formula', label: 'Custom Formula' }
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setCatMathMode(m.id)}
                style={{
                  flex: 1,
                  padding: '5px 2px',
                  borderRadius: '5px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: catMathMode === m.id ? '800' : '600',
                  backgroundColor: catMathMode === m.id ? '#ffffff' : 'transparent',
                  color: catMathMode === m.id ? '#4f46e5' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: catMathMode === m.id ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* ============================================================== */}
          {/* SUB-MODE 1: CATEGORY VS CATEGORY (A [op] B)                     */}
          {/* ============================================================== */}
          {catMathMode === 'cat_to_cat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* OPERAND A: PRIMARY CATEGORY */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Category A (First Operand):
                </label>
                <select
                  value={catAId}
                  onChange={(e) => setCatAId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    color: '#0f172a',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {matrixCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatINR(c.total)})
                    </option>
                  ))}
                </select>
              </div>

              {/* ARITHMETIC OPERATOR PILLS */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Mathematical Operation:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {[
                    { op: '+', label: '➕ Add', desc: 'Sum A + B' },
                    { op: '-', label: '➖ Diff', desc: 'A − B' },
                    { op: '*', label: '✖️ Mult', desc: 'A × B' },
                    { op: '/', label: '➗ Ratio', desc: 'A ÷ B' },
                    { op: '%', label: '📊 Share %', desc: '(A÷B)×100' }
                  ].map(item => {
                    const isSel = catOperator === item.op;
                    return (
                      <button
                        key={item.op}
                        type="button"
                        onClick={() => setCatOperator(item.op)}
                        title={item.desc}
                        style={{
                          padding: '7px 2px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          backgroundColor: isSel ? '#4f46e5' : '#f8fafc',
                          color: isSel ? '#ffffff' : '#334155',
                          border: isSel ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                          cursor: 'pointer',
                          boxShadow: isSel ? '0 2px 4px rgba(79,70,229,0.3)' : 'none',
                          transition: 'all 0.1s ease'
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* OPERAND B: SECONDARY CATEGORY OR CUSTOM CONSTANT */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                    {useCustomConstant ? 'Constant Value / Number:' : 'Category B (Second Operand):'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomConstant(prev => !prev)}
                    style={{
                      fontSize: '10.5px',
                      color: '#4f46e5',
                      fontWeight: '700',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {useCustomConstant ? '⇄ Switch to Category' : '⇄ Use Number / Factor'}
                  </button>
                </div>

                {useCustomConstant ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="number"
                      step="any"
                      value={customConstantVal}
                      onChange={(e) => setCustomConstantVal(e.target.value)}
                      placeholder="e.g. 1.18, 30, 2690..."
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['1.18', '1.05', '30', '12'].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setCustomConstantVal(v)}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: '#f8fafc',
                            cursor: 'pointer'
                          }}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <select
                    value={catBId}
                    onChange={(e) => setCatBId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      color: '#0f172a',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    {matrixCategories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatINR(c.total)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* COMPUTED SUMMARY RESULT CARD */}
              <div style={{
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                border: '1.5px solid #bbf7d0',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#166534', textTransform: 'uppercase' }}>
                    Aggregate Result ({periods.length}-Month Total)
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleCopy(catToCatResults.totalRes)}
                      title="Copy result"
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #86efac',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#166534',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copied ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInjectValueToCalc(catToCatResults.totalRes, 'Cat Result')}
                      title="Send to Calculator"
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#166534',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Calculator size={11} />
                      <span>To Calc</span>
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                  {catOperator === '%' && (
                    catToCatResults.totalRes !== null ? `${catToCatResults.totalRes.toFixed(2)}%` : '—'
                  )}
                  {catOperator === '/' && (
                    catToCatResults.totalRes !== null ? `${catToCatResults.totalRes.toFixed(3)}x` : '—'
                  )}
                  {(catOperator === '+' || catOperator === '-' || catOperator === '*') && (
                    formatINR(catToCatResults.totalRes)
                  )}
                </div>

                <div style={{ fontSize: '11.5px', color: '#475569' }}>
                  <span>{selectedCatA?.name} ({formatINR(catToCatResults.totalA)})</span>
                  <strong style={{ margin: '0 4px', color: '#4f46e5' }}>{catOperator}</strong>
                  <span>
                    {useCustomConstant 
                      ? customConstantVal 
                      : `${selectedCatB?.name} (${formatINR(catToCatResults.totalB)})`}
                  </span>
                </div>
              </div>

              {/* MONTH BY MONTH BREAKDOWN TABLE */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{
                  padding: '7px 10px',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  color: '#475569'
                }}>
                  Month-by-Month Calculation Breakdown
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#64748b', fontWeight: '700' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Period</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Cat A</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Cat B</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right', color: '#0f172a' }}>Result ({catOperator})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catToCatResults.byPeriod.map(row => (
                      <tr key={row.period.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 8px', fontWeight: '600' }}>{row.period.period_label}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748b' }}>{formatINR(row.valA)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748b' }}>
                          {useCustomConstant ? customConstantVal : formatINR(row.valB)}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '800', color: '#4f46e5' }}>
                          {catOperator === '%' && (row.res !== null ? `${row.res.toFixed(1)}%` : '—')}
                          {catOperator === '/' && (row.res !== null ? `${row.res.toFixed(2)}x` : '—')}
                          {(catOperator === '+' || catOperator === '-' || catOperator === '*') && formatINR(row.res)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: '800', borderTop: '2px solid #cbd5e1' }}>
                      <td style={{ padding: '8px' }}>Total</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{formatINR(catToCatResults.totalA)}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {useCustomConstant ? customConstantVal : formatINR(catToCatResults.totalB)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#166534' }}>
                        {catOperator === '%' && (catToCatResults.totalRes !== null ? `${catToCatResults.totalRes.toFixed(2)}%` : '—')}
                        {catOperator === '/' && (catToCatResults.totalRes !== null ? `${catToCatResults.totalRes.toFixed(3)}x` : '—')}
                        {(catOperator === '+' || catOperator === '-' || catOperator === '*') && formatINR(catToCatResults.totalRes)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* SUB-MODE 2: SAME CATEGORY PERIOD COMPARISON (MoM)              */}
          {/* ============================================================== */}
          {catMathMode === 'same_cat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Select Category to Compare:
                </label>
                <select
                  value={sameCatId}
                  onChange={(e) => setSameCatId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    color: '#0f172a'
                  }}
                >
                  {matrixCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatINR(c.total)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Two periods comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Base Period (P1):
                  </label>
                  <select
                    value={sameCatPeriod1}
                    onChange={(e) => setSameCatPeriod1(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '7px 8px',
                      borderRadius: '6px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}
                  >
                    {periods.map(p => (
                      <option key={p.id} value={p.id}>{p.period_label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Comparison Period (P2):
                  </label>
                  <select
                    value={sameCatPeriod2}
                    onChange={(e) => setSameCatPeriod2(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '7px 8px',
                      borderRadius: '6px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}
                  >
                    {periods.map(p => (
                      <option key={p.id} value={p.id}>{p.period_label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Same Category Results Card */}
              {sameCatResults && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>
                      {sameCatResults.p1Obj?.period_label} vs {sameCatResults.p2Obj?.period_label} Delta
                    </span>
                    <button
                      type="button"
                      onClick={() => handleInjectValueToCalc(sameCatResults.delta, 'Variance')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#4f46e5',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      To Calc
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>{sameCatResults.p1Obj?.period_label} Spend</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{formatINR(sameCatResults.val1)}</div>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>{sameCatResults.p2Obj?.period_label} Spend</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{formatINR(sameCatResults.val2)}</div>
                    </div>
                  </div>

                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: sameCatResults.delta >= 0 ? '#eff6ff' : '#ecfdf5',
                    border: `1px solid ${sameCatResults.delta >= 0 ? '#bfdbfe' : '#a7f3d0'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>MoM Variance / Shift</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: sameCatResults.delta >= 0 ? '#1d4ed8' : '#059669' }}>
                        {sameCatResults.delta >= 0 ? `+${formatINR(sameCatResults.delta)}` : `-${formatINR(Math.abs(sameCatResults.delta))}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>Percentage Change</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: sameCatResults.pctChange >= 0 ? '#1d4ed8' : '#059669' }}>
                        {sameCatResults.pctChange !== null ? `${sameCatResults.pctChange >= 0 ? '+' : ''}${sameCatResults.pctChange.toFixed(2)}%` : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ============================================================== */}
          {/* SUB-MODE 3: CUSTOM CATEGORY FORMULA BUILDER                     */}
          {/* ============================================================== */}
          {catMathMode === 'formula' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Enter Formula / Custom Function:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={customFormula}
                    onChange={(e) => setCustomFormula(e.target.value)}
                    placeholder="e.g. [Food Material] + [Food Labour] - 100000"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: '700'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setCustomFormula('')}
                    title="Clear formula"
                    style={{
                      padding: '0 10px',
                      borderRadius: '6px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Clickable Category Chips */}
              <div>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Click to Insert Category Token into Formula:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {matrixCategories.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleInsertTokenToFormula(`[${c.name}]`)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        cursor: 'pointer'
                      }}
                    >
                      + [{c.name}]
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleInsertTokenToFormula('[Total]')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      backgroundColor: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      cursor: 'pointer'
                    }}
                  >
                    + [Total]
                  </button>
                </div>
              </div>

              {/* Operator shortcuts */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['+', '-', '*', '/', '(', ')', '* 1.18', '* 1.05', '/ 30', '/ 2690'].map(op => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => handleInsertTokenToFormula(op)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      fontSize: '11.5px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>

              {/* Evaluate Button */}
              <button
                type="button"
                onClick={handleEvaluateCustomFormula}
                disabled={!customFormula.trim()}
                style={{
                  padding: '9px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  border: 'none',
                  cursor: customFormula.trim() ? 'pointer' : 'not-allowed',
                  opacity: customFormula.trim() ? 1 : 0.6,
                  boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)'
                }}
              >
                ⚡ Evaluate Formula Across All Months
              </button>

              {/* Formula Evaluation Table */}
              {formulaResults && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: '700' }}>
                        <th style={{ padding: '6px 10px', textAlign: 'left' }}>Period</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Evaluated Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formulaResults.byPeriod.map(r => (
                        <tr key={r.period.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 10px', fontWeight: '600' }}>{r.period.period_label}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '800', color: '#4f46e5' }}>
                            {typeof r.val === 'number' ? formatINR(r.val) : String(r.val)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#f8fafc', fontWeight: '800', borderTop: '2px solid #cbd5e1' }}>
                        <td style={{ padding: '8px 10px' }}>All Periods Aggregate</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#166534', fontSize: '13px' }}>
                          {typeof formulaResults.totalVal === 'number' ? formatINR(formulaResults.totalVal) : String(formulaResults.totalVal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: INTERACTIVE STANDARD & FINANCIAL CALCULATOR                 */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'calc' && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
          
          {/* DISPLAY SCREEN */}
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            minHeight: '68px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
            overflow: 'hidden'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#94a3b8',
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
              wordBreak: 'break-all',
              textAlign: 'right',
              minHeight: '16px'
            }}>
              {expression || '0'}
            </div>
            <div style={{
              fontSize: '22px',
              fontWeight: '800',
              color: result === 'Error' ? '#ef4444' : '#38bdf8',
              fontFamily: 'monospace',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px'
            }}>
              {result !== null && (
                <>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>=</span>
                  <span>{result === 'Error' ? 'Error' : formatINR(result)}</span>
                </>
              )}
            </div>
          </div>

          {/* QUICK CATEGORY VALUE INJECTORS */}
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Click Category to Insert Total into Calculation:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '70px', overflowY: 'auto' }}>
              {matrixCategories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setExpression(prev => prev ? `${prev} + ${c.total}` : String(c.total))}
                  title={`Insert ${c.name} total: ₹${c.total}`}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    fontSize: '10.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {c.name}: {formatLakhs(c.total)}
                </button>
              ))}
            </div>
          </div>

          {/* KEYBOARD INPUT FORM */}
          <form onSubmit={(e) => { e.preventDefault(); handleCalculate(); }}>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type expression (e.g. 1500000 + 18%)"
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1.5px solid #cbd5e1',
                fontSize: '12px',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
          </form>

          {/* KEYPAD GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {[
              { label: 'C', act: handleClear, bg: '#fee2e2', color: '#dc2626' },
              { label: '⌫', act: handleBackspace, bg: '#f1f5f9', color: '#475569' },
              { label: '%', act: () => handleAppend('%'), bg: '#f1f5f9', color: '#475569' },
              { label: '÷', act: () => handleAppend('/'), bg: '#eff6ff', color: '#2563eb' },
              
              { label: '7', act: () => handleAppend('7'), bg: '#ffffff', color: '#0f172a' },
              { label: '8', act: () => handleAppend('8'), bg: '#ffffff', color: '#0f172a' },
              { label: '9', act: () => handleAppend('9'), bg: '#ffffff', color: '#0f172a' },
              { label: '×', act: () => handleAppend('*'), bg: '#eff6ff', color: '#2563eb' },

              { label: '4', act: () => handleAppend('4'), bg: '#ffffff', color: '#0f172a' },
              { label: '5', act: () => handleAppend('5'), bg: '#ffffff', color: '#0f172a' },
              { label: '6', act: () => handleAppend('6'), bg: '#ffffff', color: '#0f172a' },
              { label: '−', act: () => handleAppend('-'), bg: '#eff6ff', color: '#2563eb' },

              { label: '1', act: () => handleAppend('1'), bg: '#ffffff', color: '#0f172a' },
              { label: '2', act: () => handleAppend('2'), bg: '#ffffff', color: '#0f172a' },
              { label: '3', act: () => handleAppend('3'), bg: '#ffffff', color: '#0f172a' },
              { label: '+', act: () => handleAppend('+'), bg: '#eff6ff', color: '#2563eb' },

              { label: '0', act: () => handleAppend('0'), bg: '#ffffff', color: '#0f172a' },
              { label: '.', act: () => handleAppend('.'), bg: '#ffffff', color: '#0f172a' },
              { label: '00', act: () => handleAppend('00'), bg: '#ffffff', color: '#0f172a' },
              { label: '=', act: handleCalculate, bg: '#4f46e5', color: '#ffffff', highlight: true }
            ].map((btn, idx) => (
              <button
                key={idx}
                type="button"
                onClick={btn.act}
                style={{
                  padding: '9px 0',
                  borderRadius: '6px',
                  border: btn.highlight ? 'none' : '1px solid #cbd5e1',
                  backgroundColor: btn.bg,
                  color: btn.color,
                  fontSize: '13px',
                  fontWeight: '800',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  boxShadow: btn.highlight ? '0 2px 4px rgba(79, 70, 229, 0.3)' : 'none',
                  transition: 'transform 0.05s ease'
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* COPY ACTION */}
          {result !== null && result !== 'Error' && (
            <button
              type="button"
              onClick={() => handleCopy(result)}
              style={{
                width: '100%',
                padding: '7px 0',
                borderRadius: '6px',
                backgroundColor: copied ? '#ecfdf5' : '#f1f5f9',
                color: copied ? '#059669' : '#334155',
                border: `1px solid ${copied ? '#a7f3d0' : '#cbd5e1'}`,
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied result to clipboard' : `Copy Result (${formatINR(result)})`}</span>
            </button>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3: OPERATIONAL FORMULAS & UNIT ECONOMICS                      */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'helpers' && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1 }}>
          
          {/* HELPER 1: PER DINER PLATE COST */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <TrendingUp size={15} color="#4f46e5" />
              <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a' }}>Per-Diner & Plate Unit Cost</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>Spend (₹):</span>
                <input
                  type="number"
                  value={dinerSpend}
                  onChange={(e) => setDinerSpend(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>Diners:</span>
                <input
                  type="number"
                  value={dinerCount}
                  onChange={(e) => setDinerCount(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>Days:</span>
                <input
                  type="number"
                  value={dinerDays}
                  onChange={(e) => setDinerDays(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11.5px', color: '#475569' }}>Per Diner/Month: <strong>₹{totalPerDinerMonth}</strong></span>
              <span style={{ fontSize: '11.5px', color: '#4f46e5' }}>Per Diner/Day: <strong>₹{totalPerPlateDay}</strong></span>
            </div>
          </div>

          {/* HELPER 2: FLEET FUEL MILEAGE & PER KM */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <DollarSign size={15} color="#059669" />
              <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a' }}>Fleet Fuel Cost per KM</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>Fuel Expense (₹):</span>
                <input
                  type="number"
                  value={fuelSpend}
                  onChange={(e) => setFuelSpend(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>Actual KMs Run:</span>
                <input
                  type="number"
                  value={tripKms}
                  onChange={(e) => setTripKms(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700' }}>
                Fuel Cost / KM: ₹{parseFloat(tripKms) > 0 ? (parseFloat(fuelSpend) / parseFloat(tripKms)).toFixed(2) : '0.00'} / KM
              </span>
            </div>
          </div>

          {/* HELPER 3: REVERSE GST SPLITTER */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Percent size={15} color="#2563eb" />
              <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a' }}>Reverse GST Splitter</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>Gross Total (₹):</span>
                <input
                  type="number"
                  value={grossGstAmount}
                  onChange={(e) => setGrossGstAmount(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>GST %:</span>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value={18}>18%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            </div>
            {(() => {
              const gross = parseFloat(grossGstAmount) || 0;
              const base = gross / (1 + gstRate / 100);
              const tax = gross - base;
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                  <span>Base: <strong>{formatINR(base)}</strong></span>
                  <span style={{ color: '#2563eb' }}>GST ({gstRate}%): <strong>{formatINR(tax)}</strong></span>
                </div>
              );
            })()}
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 4: CALCULATION TAPE & RECENT HISTORY                           */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'history' && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Recent computations</span>
            {calcHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setCalcHistory([])}
                style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
              >
                Clear All
              </button>
            )}
          </div>

          {calcHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '12.5px' }}>
              No calculations yet.<br />Use the calculator or category math to record computations!
            </div>
          ) : (
            calcHistory.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  setExpression(String(item.val));
                  setResult(item.val);
                  setActiveTab('calc');
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                title="Click to load into calculator"
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block' }}>{item.expr}</span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                    {typeof item.val === 'number' ? formatINR(item.val) : String(item.val)}
                  </strong>
                </div>
                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>{item.time}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* DOCKED FOOTER */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#64748b',
        flexShrink: 0
      }}>
        <span>Interactive Master Math Assistant</span>
        <span style={{ color: '#4f46e5', fontWeight: '700' }}>Active in {moduleName}</span>
      </div>

    </div>
  );
}
