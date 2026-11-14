import React, { useState, useEffect } from 'react';
import { 
  Calculator, Percent, Copy, Check, History, X, 
  RotateCcw, Sparkles, TrendingUp, DollarSign, ArrowRight 
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export default function MasterMathTools({ onClose, moduleName = 'Food & Dining' }) {
  const [activeTab, setActiveTab] = useState('calc'); // 'calc' | 'helpers' | 'history'
  
  // Calculator State
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
      localStorage.setItem('rathinam_calc_history', JSON.stringify(calcHistory.slice(0, 25)));
    } catch {
      // ignore
    }
  }, [calcHistory]);

  // Safe Math Expression Evaluation
  const evaluateExpression = (expr) => {
    if (!expr || !expr.trim()) return null;
    try {
      // Clean and sanitize string (only numbers, operators, parens, decimal point)
      const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '');
      if (!/^[0-9+\-*/().\s%]+$/.test(sanitized)) {
        return 'Error';
      }
      // Replace % with /100
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

  // Quick shortcut modifiers
  const handleApplyGst = (pct) => {
    const current = result !== null && result !== 'Error' ? result : evaluateExpression(expression);
    if (current !== 'Error' && current !== null) {
      const withTax = Math.round(current * (1 + pct / 100) * 100) / 100;
      setExpression(`(${current} + ${pct}%)`);
      setResult(withTax);
      setCalcHistory(prev => [{
        id: Date.now(),
        expr: `${current} + ${pct}% GST`,
        val: withTax,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }, ...prev]);
    }
  };

  const handleApplyDiv = (divisor, label) => {
    const current = result !== null && result !== 'Error' ? result : evaluateExpression(expression);
    if (current !== 'Error' && current !== null && divisor > 0) {
      const resVal = Math.round((current / divisor) * 100) / 100;
      setExpression(`(${current} ÷ ${divisor})`);
      setResult(resVal);
      setCalcHistory(prev => [{
        id: Date.now(),
        expr: `${current} ÷ ${divisor} (${label})`,
        val: resVal,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }, ...prev]);
    }
  };

  // Unit helper calculations
  const totalPerDinerMonth = parseFloat(dinerSpend) > 0 && parseFloat(dinerCount) > 0 
    ? (parseFloat(dinerSpend) / parseFloat(dinerCount)).toFixed(2) : '0.00';
  const totalPerPlateDay = parseFloat(totalPerDinerMonth) > 0 && parseFloat(dinerDays) > 0
    ? (parseFloat(totalPerDinerMonth) / parseFloat(dinerDays)).toFixed(2) : '0.00';

  const fuelCostPerKm = parseFloat(fuelSpend) > 0 && parseFloat(tripKms) > 0
    ? (parseFloat(fuelSpend) / parseFloat(tripKms)).toFixed(2) : '0.00';

  const baseGstAmount = parseFloat(grossGstAmount) > 0 
    ? (parseFloat(grossGstAmount) / (1 + gstRate / 100)).toFixed(2) : '0.00';
  const gstTaxPortion = parseFloat(grossGstAmount) > 0 
    ? (parseFloat(grossGstAmount) - parseFloat(baseGstAmount)).toFixed(2) : '0.00';

  const annualRunRate = parseFloat(annualSpend) > 0 && parseFloat(monthsElapsed) > 0
    ? ((parseFloat(annualSpend) / parseFloat(monthsElapsed)) * 12).toFixed(2) : '0.00';

  return (
    <div style={{
      width: '380px',
      minWidth: '340px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1.5px solid #cbd5e1',
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      alignSelf: 'flex-start',
      position: 'sticky',
      top: '16px'
    }}>
      
      {/* HEADER BAR */}
      <div style={{
        padding: '14px 18px',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            backgroundColor: '#2563eb',
            padding: '5px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calculator size={16} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, letterSpacing: '-0.01em' }}>
              Master Math & Calculation Tools
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Real-time operational computing
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

      {/* TABS SWITCHER */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        padding: '4px 6px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('calc')}
          style={{
            flex: 1,
            padding: '7px 4px',
            fontSize: '12px',
            fontWeight: activeTab === 'calc' ? '700' : '600',
            backgroundColor: activeTab === 'calc' ? '#ffffff' : 'transparent',
            color: activeTab === 'calc' ? '#2563eb' : '#64748b',
            border: activeTab === 'calc' ? '1px solid #e2e8f0' : 'none',
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
            fontSize: '12px',
            fontWeight: activeTab === 'helpers' ? '700' : '600',
            backgroundColor: activeTab === 'helpers' ? '#ffffff' : 'transparent',
            color: activeTab === 'helpers' ? '#2563eb' : '#64748b',
            border: activeTab === 'helpers' ? '1px solid #e2e8f0' : 'none',
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
            flex: 1,
            padding: '7px 4px',
            fontSize: '12px',
            fontWeight: activeTab === 'history' ? '700' : '600',
            backgroundColor: activeTab === 'history' ? '#ffffff' : 'transparent',
            color: activeTab === 'history' ? '#2563eb' : '#64748b',
            border: activeTab === 'history' ? '1px solid #e2e8f0' : 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
          }}
        >
          🕒 History ({calcHistory.length})
        </button>
      </div>

      {/* TAB 1: STANDARD & FINANCIAL CALCULATOR */}
      {activeTab === 'calc' && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* DISPLAY SCREEN */}
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            minHeight: '80px',
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)'
          }}>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '14px',
                textAlign: 'right',
                fontFamily: 'monospace',
                outline: 'none',
                letterSpacing: '0.05em'
              }}
            />
            <div style={{
              fontSize: '22px',
              fontWeight: '800',
              color: result === 'Error' ? '#ef4444' : '#38bdf8',
              fontFamily: 'monospace',
              marginTop: '4px'
            }}>
              {result !== null ? (result === 'Error' ? 'Error' : formatINR(result)) : (evaluateExpression(expression) !== 'Error' && evaluateExpression(expression) !== null ? `≈ ${formatINR(evaluateExpression(expression))}` : '0.00')}
            </div>
          </div>

          {/* COPY ACTION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
              Press Enter to compute
            </span>
            <button
              type="button"
              onClick={() => handleCopy(result !== null && result !== 'Error' ? result : evaluateExpression(expression) || 0)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: copied ? '#ecfdf5' : '#eff6ff',
                color: copied ? '#047857' : '#2563eb',
                border: `1px solid ${copied ? '#a7f3d0' : '#bfdbfe'}`,
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Copied ₹!' : 'Copy ₹ Result'}</span>
            </button>
          </div>

          {/* QUICK SHORTCUT MODIFIERS */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleApplyGst(18)}
              style={{ flex: 1, padding: '5px 4px', fontSize: '11px', fontWeight: '700', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            >
              +18% GST
            </button>
            <button
              type="button"
              onClick={() => handleApplyGst(5)}
              style={{ flex: 1, padding: '5px 4px', fontSize: '11px', fontWeight: '700', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            >
              +5% GST
            </button>
            <button
              type="button"
              onClick={() => handleApplyDiv(30, '30 Days')}
              style={{ flex: 1, padding: '5px 4px', fontSize: '11px', fontWeight: '700', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            >
              ÷ 30 (Days)
            </button>
            <button
              type="button"
              onClick={() => handleAppend(' * 12')}
              style={{ flex: 1, padding: '5px 4px', fontSize: '11px', fontWeight: '700', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            >
              × 12 (Year)
            </button>
          </div>

          {/* KEYPAD GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            userSelect: 'none'
          }}>
            {/* ROW 1 */}
            <button
              type="button"
              onClick={handleClear}
              style={{ padding: '10px', fontSize: '13px', fontWeight: '800', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
            >
              AC
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              style={{ padding: '10px', fontSize: '13px', fontWeight: '700', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => handleAppend('%')}
              style={{ padding: '10px', fontSize: '13px', fontWeight: '700', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => handleAppend(' / ')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer' }}
            >
              ÷
            </button>

            {/* ROW 2 */}
            <button
              type="button"
              onClick={() => handleAppend('7')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            >
              7
            </button>
            <button
              type="button"
              onClick={() => handleAppend('8')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            >
              8
            </button>
            <button
              type="button"
              onClick={() => handleAppend('9')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            >
              9
            </button>
            <button
              type="button"
              onClick={() => handleAppend(' * ')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer' }}
            >
              ×
            </button>

            {/* ROW 3 */}
            <button
              type="button"
              onClick={() => handleAppend('4')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            >
              4
            </button>
            <button
              type="button"
              onClick={() => handleAppend('5')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            >
              5
            </button>
            <button
              type="button"
              onClick={() => handleAppend('6')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            >
              6
            </button>
            <button
              type="button"
              onClick={() => handleAppend(' - ')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer' }}
            >
              −
            </button>

            {/* ROW 4 */}
            <button
              type="button"
              onClick={() => handleAppend('1')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            >
              1
            </button>
            <button
              type="button"
              onClick={() => handleAppend('2')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            >
              2
            </button>
            <button
              type="button"
              onClick={() => handleAppend('3')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            >
              3
            </button>
            <button
              type="button"
              onClick={() => handleAppend(' + ')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer' }}
            >
              +
            </button>

            {/* ROW 5 */}
            <button
              type="button"
              onClick={() => handleAppend('0')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleAppend('00')}
              style={{ padding: '10px', fontSize: '14px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            >
              00
            </button>
            <button
              type="button"
              onClick={() => handleAppend('.')}
              style={{ padding: '10px', fontSize: '15px', fontWeight: '800', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            >
              .
            </button>
            <button
              type="button"
              onClick={handleCalculate}
              style={{
                padding: '10px',
                fontSize: '16px',
                fontWeight: '800',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
              }}
            >
              =
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: OPERATIONAL FORMULAS & UNIT HELPERS */}
      {activeTab === 'helpers' && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', maxHeight: '420px' }}>
          
          {/* HELPER 1: PER DINER / HEADCOUNT PLATE COST */}
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>🍲 Per-Plate & Diner Cost</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Monthly Spend (₹)</label>
                <input
                  type="number"
                  value={dinerSpend}
                  onChange={(e) => setDinerSpend(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Total Diners</label>
                <input
                  type="number"
                  value={dinerCount}
                  onChange={(e) => setDinerCount(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#eff6ff', padding: '6px 10px', borderRadius: '6px' }}>
              <span style={{ fontSize: '11.5px', color: '#1e40af' }}>Diner/Month: <strong>{formatINR(parseFloat(totalPerDinerMonth))}</strong></span>
              <span style={{ fontSize: '11.5px', color: '#1e40af' }}>Plate/Day: <strong>{formatINR(parseFloat(totalPerPlateDay))}</strong></span>
            </div>
          </div>

          {/* HELPER 2: KM MILEAGE / FLEET UNIT COST */}
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>🚌 Fleet Mileage Cost per KM</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Fuel Spend (₹)</label>
                <input
                  type="number"
                  value={fuelSpend}
                  onChange={(e) => setFuelSpend(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Trip KMs</label>
                <input
                  type="number"
                  value={tripKms}
                  onChange={(e) => setTripKms(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
            </div>
            <div style={{ backgroundColor: '#ecfdf5', padding: '6px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#065f46' }}>Fuel Cost / KM:</span>
              <strong style={{ fontSize: '12.5px', color: '#047857' }}>{formatINR(parseFloat(fuelCostPerKm))} / KM</strong>
            </div>
          </div>

          {/* HELPER 3: GST SPLITTER */}
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>📑 Reverse GST / Tax Splitter</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Gross Invoice Amount (₹)</label>
                <input
                  type="number"
                  value={grossGstAmount}
                  onChange={(e) => setGrossGstAmount(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>GST %</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                >
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            </div>
            <div style={{ backgroundColor: '#fffbeb', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#92400e', display: 'flex', justifyContent: 'space-between' }}>
              <span>Base: <strong>{formatINR(parseFloat(baseGstAmount))}</strong></span>
              <span>Tax ({gstRate}%): <strong>{formatINR(parseFloat(gstTaxPortion))}</strong></span>
            </div>
          </div>

          {/* HELPER 4: ANNUAL RUN-RATE */}
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>📈 Annualized Spend Run-Rate</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Spend Till Date (₹)</label>
                <input
                  type="number"
                  value={annualSpend}
                  onChange={(e) => setAnnualSpend(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Months</label>
                <input
                  type="number"
                  value={monthsElapsed}
                  onChange={(e) => setMonthsElapsed(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
            </div>
            <div style={{ backgroundColor: '#f5f3ff', padding: '6px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#5b21b6' }}>Expected FY Total:</span>
              <strong style={{ fontSize: '12.5px', color: '#6d28d9' }}>{formatINR(parseFloat(annualRunRate))}</strong>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: CALCULATION TAPE & RECENT HISTORY */}
      {activeTab === 'history' && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '420px' }}>
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
              No calculations yet.<br />Use the calculator to build history!
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
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block' }}>{item.expr}</span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{formatINR(item.val)}</strong>
                </div>
                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>{item.time}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* FOOTER */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#64748b'
      }}>
        <span>Interactive Master Math Assistant</span>
        <span style={{ color: '#2563eb', fontWeight: '700' }}>Active in {moduleName}</span>
      </div>

    </div>
  );
}
