import React, { useState, useEffect, useMemo } from 'react';
import { formatINR, formatLakhs } from '../../../utils/formatters';
import { 
  Save, RefreshCw, Plus, CheckCircle2, AlertTriangle, 
  Wallet, Layers, Sparkles, TrendingUp, Table, Check, 
  ArrowUpRight, ArrowDownRight, Edit2, X, Calculator, ShieldCheck
} from 'lucide-react';

export const CANONICAL_FOOD_BUDGET_HEADS = [
  { s_no: 1, budget_head: 'Food Material', sanctioned_amount: 105000000.0, month_limit: 8750000.0 },
  { s_no: 2, budget_head: 'Food Team Salary', sanctioned_amount: 36000000.0, month_limit: 3000000.0 },
  { s_no: 3, budget_head: 'Contract Labour Expenses', sanctioned_amount: 4800000.0, month_limit: 400000.0 },
  { s_no: 4, budget_head: 'Catering Vendor Expenses', sanctioned_amount: 6000000.0, month_limit: 500000.0 },
  { s_no: 5, budget_head: 'FC Maintenance/Power/Water/Vehicle', sanctioned_amount: 6600000.0, month_limit: 550000.0 },
  { s_no: 6, budget_head: 'Event/Additional Food', sanctioned_amount: 3000000.0, month_limit: 250000.0 },
  { s_no: 7, budget_head: 'Food Festival', sanctioned_amount: 6000000.0, month_limit: 500000.0 },
  { s_no: 8, budget_head: 'Staff Welfare', sanctioned_amount: 1800000.0, month_limit: 150000.0 }
];

export const FOOD_MONTH_COLS = [
  { key: 'jun_26_actual', label: "Jun'26", periodId: '12' },
  { key: 'jul_26_actual', label: "Jul'26", periodId: '14' },
  { key: 'aug_26_actual', label: "Aug'26", periodId: '18' },
  { key: 'sep_26_actual', label: "Sept'26", periodId: '19' },
  { key: 'oct_26_actual', label: "Oct'26", periodId: '311' }
];

export default function FoodBudgetEntrySection({
  periods = [],
  onRefreshData
}) {
  const [budgetItems, setBudgetItems] = useState([]);
  const [draftEdits, setDraftEdits] = useState({}); // { [b_head]: { field: val } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Add custom head modal / state
  const [showAddHeadModal, setShowAddHeadModal] = useState(false);
  const [newHeadName, setNewHeadName] = useState('');
  const [newHeadSanctioned, setNewHeadSanctioned] = useState('');
  const [newHeadLimit, setNewHeadLimit] = useState('');

  // 1. Fetch live budget tracking items
  const fetchBudgetItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/food/budget-tracking');
      const data = await res.json();
      if (data && data.status === 'success' && Array.isArray(data.items)) {
        setBudgetItems(data.items);
      } else {
        setBudgetItems(CANONICAL_FOOD_BUDGET_HEADS);
      }
      setDraftEdits({});
      setIsDirty(false);
    } catch (err) {
      console.error('[FoodBudgetEntry] Fetch error:', err);
      setBudgetItems(CANONICAL_FOOD_BUDGET_HEADS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetItems();
  }, []);

  // 2. Handle cell change
  const handleCellChange = (bHead, field, val) => {
    const cleanNum = val === '' ? 0 : parseFloat(String(val).replace(/,/g, ''));
    setDraftEdits(prev => ({
      ...prev,
      [bHead]: {
        ...(prev[bHead] || {}),
        [field]: isNaN(cleanNum) ? 0 : cleanNum
      }
    }));
    setIsDirty(true);
  };

  // Helper to get effective value
  const getValue = (item, field) => {
    if (draftEdits[item.budget_head] && draftEdits[item.budget_head][field] !== undefined) {
      return draftEdits[item.budget_head][field];
    }
    return item[field] !== undefined ? item[field] : 0;
  };

  // Calculate row total actual spend
  const getRowSpent = (item) => {
    return FOOD_MONTH_COLS.reduce((sum, col) => sum + (Number(getValue(item, col.key)) || 0), 0);
  };

  // 3. Save all changes to PostgreSQL
  const handleSaveBudget = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const payloadItems = budgetItems.map(item => {
        const edits = draftEdits[item.budget_head] || {};
        const merged = { ...item, ...edits };
        return {
          s_no: merged.s_no,
          budget_head: merged.budget_head,
          sanctioned_amount: Number(merged.sanctioned_amount) || 0,
          month_limit: Number(merged.month_limit) || 0,
          jun_26_actual: Number(merged.jun_26_actual) || 0,
          jul_26_actual: Number(merged.jul_26_actual) || 0,
          aug_26_actual: Number(merged.aug_26_actual) || 0,
          sep_26_actual: Number(merged.sep_26_actual) || 0,
          oct_26_actual: Number(merged.oct_26_actual) || 0,
          monthly_actuals: merged.monthly_actuals || {}
        };
      });

      const res = await fetch('/api/food/budget-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save budget tracking');
      }

      setMessage({ type: 'success', text: 'Food Budget Tracking saved successfully!' });
      setIsDirty(false);
      setDraftEdits({});
      fetchBudgetItems();
      onRefreshData?.();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error saving budget data' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // 4. Auto-sync actuals from Food Ledger
  const handleSyncFromLedger = async () => {
    try {
      setSyncing(true);
      setMessage(null);
      const res = await fetch('/api/food/budget-tracking/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to sync from ledger');
      setMessage({ type: 'success', text: 'Auto-synchronized actual monthly expenses from Food ledger!' });
      await fetchBudgetItems();
      onRefreshData?.();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error syncing from ledger' });
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // 5. Add custom budget head
  const handleAddBudgetHead = (e) => {
    e.preventDefault();
    if (!newHeadName.trim()) return;

    const newHead = {
      s_no: budgetItems.length + 1,
      budget_head: newHeadName.trim(),
      sanctioned_amount: parseFloat(newHeadSanctioned) || 0,
      month_limit: parseFloat(newHeadLimit) || 0,
      jun_26_actual: 0,
      jul_26_actual: 0,
      aug_26_actual: 0,
      sep_26_actual: 0,
      oct_26_actual: 0
    };

    setBudgetItems(prev => [...prev, newHead]);
    setDraftEdits(prev => ({
      ...prev,
      [newHead.budget_head]: newHead
    }));
    setIsDirty(true);
    setShowAddHeadModal(false);
    setNewHeadName('');
    setNewHeadSanctioned('');
    setNewHeadLimit('');
  };

  // Grand Totals
  const totalSanctioned = useMemo(() => {
    return budgetItems.reduce((acc, it) => acc + (Number(getValue(it, 'sanctioned_amount')) || 0), 0);
  }, [budgetItems, draftEdits]);

  const totalMonthLimit = useMemo(() => {
    return budgetItems.reduce((acc, it) => acc + (Number(getValue(it, 'month_limit')) || 0), 0);
  }, [budgetItems, draftEdits]);

  const totalActualSpent = useMemo(() => {
    return budgetItems.reduce((acc, it) => acc + getRowSpent(it), 0);
  }, [budgetItems, draftEdits]);

  const totalBalance = totalSanctioned - totalActualSpent;
  const overallUtilPercent = totalSanctioned > 0 ? ((totalActualSpent / totalSanctioned) * 100).toFixed(1) : 0;

  // Monthly totals across heads
  const monthlyTotals = useMemo(() => {
    const res = {};
    FOOD_MONTH_COLS.forEach(col => {
      res[col.key] = budgetItems.reduce((sum, it) => sum + (Number(getValue(it, col.key)) || 0), 0);
    });
    return res;
  }, [budgetItems, draftEdits]);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      border: '1.5px solid #e2e8f0',
      boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '0px'
    }}>
      
      {/* 1. Header Toolbar */}
      <div style={{
        padding: '18px 24px',
        backgroundColor: '#f8fafc',
        borderBottom: '1.5px solid #edf2f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#eef2ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.15)'
          }}>
            <Wallet size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Food Operations Budget Allocation & Tracking
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: '#dbeafe',
                color: '#1e40af'
              }}>
                8 Canonical Heads
              </span>
              {isDirty && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e'
                }}>
                  Unsaved Changes
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0 0' }}>
              Sanctioned Annual Budget • Monthly Targets • Actual Recorded Spend • Live Balance
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleSyncFromLedger}
            disabled={syncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              cursor: syncing ? 'default' : 'pointer'
            }}
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Auto-Sync from Ledger'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddHeadModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#ffffff',
              color: '#4f46e5',
              border: '1px solid #c7d2fe',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} />
            <span>Add Budget Head</span>
          </button>

          <button
            type="button"
            onClick={handleSaveBudget}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: isDirty ? '#16a34a' : '#4f46e5',
              color: '#ffffff',
              border: 'none',
              cursor: saving ? 'default' : 'pointer',
              boxShadow: isDirty ? '0 2px 8px rgba(22, 163, 74, 0.3)' : '0 2px 8px rgba(79, 70, 229, 0.25)'
            }}
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Budget Tracking'}</span>
          </button>
        </div>
      </div>

      {/* 2. Notification Toast */}
      {message && (
        <div style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12.5px',
          fontWeight: '600',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {message.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 3. Executive Summary KPI Cards */}
      <div style={{
        padding: '16px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        backgroundColor: '#fafbfc',
        borderBottom: '1px solid #edf2f7'
      }}>
        {/* KPI 1: Sanctioned Annual */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '14px 16px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #4f46e5'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#4338ca', textTransform: 'uppercase' }}>
            Total Sanctioned Budget
          </span>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '4px 0 2px 0' }} className="currency-font">
            {formatINR(totalSanctioned)}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Annual allocation ({formatLakhs(totalSanctioned)})
          </span>
        </div>

        {/* KPI 2: Monthly Limit Target */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '14px 16px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #0284c7'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase' }}>
            Monthly Budget Target
          </span>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '4px 0 2px 0' }} className="currency-font">
            {formatINR(totalMonthLimit)}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Per month limit ({formatLakhs(totalMonthLimit)}/mo)
          </span>
        </div>

        {/* KPI 3: Total Actual Spend */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '14px 16px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #f97316'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase' }}>
            Total Actual Spend
          </span>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '4px 0 2px 0' }} className="currency-font">
            {formatINR(totalActualSpent)}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Across 5 cycles ({overallUtilPercent}% of budget)
          </span>
        </div>

        {/* KPI 4: Remaining Balance */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '14px 16px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #16a34a'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase' }}>
            Remaining Budget Balance
          </span>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '4px 0 2px 0' }} className="currency-font">
            {formatINR(totalBalance)}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {totalSanctioned > 0 ? (((totalBalance) / totalSanctioned) * 100).toFixed(1) : 100}% balance available
          </span>
        </div>
      </div>

      {/* 4. The Master Food Budget Editable Spreadsheet Table */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12.5px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1', color: '#334155', fontWeight: '800' }}>
              <th style={{ padding: '12px 14px', width: '50px', textAlign: 'center' }}>#</th>
              <th style={{ padding: '12px 16px', minWidth: '240px', textAlign: 'left' }}>Budget Head Name</th>
              <th style={{ padding: '12px 14px', minWidth: '150px', textAlign: 'right' }}>Sanctioned Budget (₹)</th>
              <th style={{ padding: '12px 14px', minWidth: '140px', textAlign: 'right' }}>Monthly Limit (₹)</th>

              {/* Monthly Actuals Columns */}
              {FOOD_MONTH_COLS.map(col => (
                <th key={col.key} style={{ padding: '12px 14px', minWidth: '130px', textAlign: 'right' }}>
                  {col.label} Actual
                </th>
              ))}

              <th style={{ padding: '12px 14px', minWidth: '140px', textAlign: 'right', backgroundColor: '#e2e8f0' }}>
                Total Spent (₹)
              </th>
              <th style={{ padding: '12px 14px', minWidth: '140px', textAlign: 'right', backgroundColor: '#e2e8f0' }}>
                Balance (₹)
              </th>
              <th style={{ padding: '12px 14px', width: '110px', textAlign: 'center' }}>
                Util %
              </th>
            </tr>
          </thead>
          <tbody>
            {budgetItems.map((item, idx) => {
              const sanctioned = Number(getValue(item, 'sanctioned_amount')) || 0;
              const limit = Number(getValue(item, 'month_limit')) || 0;
              const rowSpent = getRowSpent(item);
              const balance = sanctioned - rowSpent;
              const utilPct = sanctioned > 0 ? ((rowSpent / sanctioned) * 100).toFixed(1) : 0;
              const isExceeded = rowSpent > sanctioned;

              return (
                <tr
                  key={item.budget_head || idx}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafbfc',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  {/* S.No */}
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>
                    {idx + 1}
                  </td>

                  {/* Budget Head Name */}
                  <td style={{ padding: '10px 16px', fontWeight: '700', color: '#0f172a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: idx === 0 ? '#ffc90e' : idx === 1 ? '#6c56db' : idx === 2 ? '#3b82f6' : idx === 3 ? '#ec4899' : '#10b981'
                      }} />
                      <span>{item.budget_head}</span>
                    </div>
                  </td>

                  {/* Sanctioned Budget Input */}
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    <input
                      type="number"
                      value={sanctioned || ''}
                      onChange={(e) => handleCellChange(item.budget_head, 'sanctioned_amount', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        textAlign: 'right',
                        fontWeight: '700',
                        boxSizing: 'border-box',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </td>

                  {/* Monthly Limit Input */}
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    <input
                      type="number"
                      value={limit || ''}
                      onChange={(e) => handleCellChange(item.budget_head, 'month_limit', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        textAlign: 'right',
                        fontWeight: '600',
                        boxSizing: 'border-box',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </td>

                  {/* Monthly Actual Inputs */}
                  {FOOD_MONTH_COLS.map(col => {
                    const cellVal = Number(getValue(item, col.key)) || 0;
                    return (
                      <td key={col.key} style={{ padding: '8px 10px', textAlign: 'right' }}>
                        <input
                          type="number"
                          value={cellVal || ''}
                          placeholder="0"
                          onChange={(e) => handleCellChange(item.budget_head, col.key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                            textAlign: 'right',
                            fontWeight: '600',
                            boxSizing: 'border-box',
                            backgroundColor: cellVal > 0 ? '#f8fafc' : '#ffffff'
                          }}
                        />
                      </td>
                    );
                  })}

                  {/* Total Spent */}
                  <td style={{
                    padding: '10px 14px',
                    textAlign: 'right',
                    fontWeight: '800',
                    color: isExceeded ? '#dc2626' : '#0f172a',
                    backgroundColor: 'rgba(0,0,0,0.02)'
                  }} className="currency-font">
                    {formatINR(rowSpent)}
                  </td>

                  {/* Balance */}
                  <td style={{
                    padding: '10px 14px',
                    textAlign: 'right',
                    fontWeight: '800',
                    color: balance >= 0 ? '#16a34a' : '#dc2626',
                    backgroundColor: 'rgba(0,0,0,0.02)'
                  }} className="currency-font">
                    {formatINR(balance)}
                  </td>

                  {/* Utilization % */}
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: isExceeded ? '#fee2e2' : Number(utilPct) > 85 ? '#fef3c7' : '#dcfce7',
                      color: isExceeded ? '#991b1b' : Number(utilPct) > 85 ? '#92400e' : '#166534'
                    }}>
                      {utilPct}%
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* GRAND TOTAL SUMMARY ROW */}
            <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', fontWeight: '900', borderTop: '2px solid #000000' }}>
              <td colSpan={2} style={{ padding: '12px 16px', fontSize: '13px' }}>
                TOTAL FOOD BUDGET & ACTUALS
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px' }} className="currency-font">
                {formatINR(totalSanctioned)}
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px' }} className="currency-font">
                {formatINR(totalMonthLimit)}
              </td>

              {FOOD_MONTH_COLS.map(col => (
                <td key={col.key} style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12.5px' }} className="currency-font">
                  {formatINR(monthlyTotals[col.key] || 0)}
                </td>
              ))}

              <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', backgroundColor: '#1e293b' }} className="currency-font">
                {formatINR(totalActualSpent)}
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', backgroundColor: '#1e293b' }} className="currency-font">
                {formatINR(totalBalance)}
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px' }}>
                {overallUtilPercent}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD BUDGET HEAD */}
      {showAddHeadModal && (
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
            maxWidth: '460px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #edf2f7',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                Add New Food Budget Head
              </h4>
              <button
                type="button"
                onClick={() => setShowAddHeadModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBudgetHead} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Budget Head Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special Dietary Expenses"
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Sanctioned Annual Budget (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2400000"
                  value={newHeadSanctioned}
                  onChange={(e) => setNewHeadSanctioned(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Monthly Budget Limit (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 200000"
                  value={newHeadLimit}
                  onChange={(e) => setNewHeadLimit(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddHeadModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Add Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
