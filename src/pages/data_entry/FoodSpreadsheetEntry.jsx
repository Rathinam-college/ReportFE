import React, { useState, useMemo } from 'react';
import { formatINR } from '../../utils/formatters';
import { evaluateFormula } from '../../utils/formulaEngine';
import { 
  Save, RefreshCw, FileSpreadsheet, CheckCircle2, Zap, Utensils, 
  AlertCircle, FileText, Check, Plus, Trash2, Edit2, Layers, Table, Users, Award, Wallet
} from 'lucide-react';
import FoodCardSpreadsheet from './cards/FoodCardSpreadsheet';
import FoodBudgetEntrySection from './food_budget/FoodBudgetEntrySection';
import FoodPowerWaterEntrySection from './FoodPowerWaterEntrySection';

export default function FoodSpreadsheetEntry({
  activePeriodObj,
  computedMatrix,
  editingPeriodId,
  setEditingPeriodId,
  matrixDraft = {},
  remarksDraft = {},
  censusDraft = {},
  handleCellChange,
  handleRemarkChange,
  handleCensusChange,
  handleSaveActiveMonth,
  savingBatch,
  isDirty,
  fetchData,
  openAddCostHeadModal,
  handleDeleteCostHead,
  openAddCategoryModal,
  handleCloneFromPrev,
  handleToggleLock
}) {
  const [activeSubTab, setActiveSubTab] = useState('excel_grid'); // 'excel_grid' | 'budget'
  const [localMessage, setLocalMessage] = useState(null);
  const [isSavingLocal, setIsSavingLocal] = useState(false);

  // Inline editing state for Cost Head descriptions and Category names
  const [editedCostHeadNames, setEditedCostHeadNames] = useState({}); // { [cost_head_id]: new_name }
  const [editedCategoryNames, setEditedCategoryNames] = useState({}); // { [category_id]: new_name }
  const [newRowDrafts, setNewRowDrafts] = useState([]); // [ { temp_id, category_id, name, amounts: {} } ]

  const isClosed = !!activePeriodObj?.is_closed;
  const periods = computedMatrix?.periods || [];
  const categories = computedMatrix?.categories || [];
  const currStr = String(editingPeriodId);

  // Dynamic formula calculation for formula-based categories across periods
  // Computes category totals for each period, incorporating any draft edits
  const periodCategoryTotals = useMemo(() => {
    const map = {}; // periodId -> { [categoryId or name]: sum }
    periods.forEach(p => {
      map[p.id] = {};
    });

    // 1. Sum up direct categories first
    categories.forEach(cat => {
      if (cat.category_type !== 'FORMULA') {
        periods.forEach(p => {
          let sum = 0;
          cat.items?.forEach(it => {
            const draftVal = matrixDraft[it.cost_head_id]?.[p.id];
            if (draftVal !== undefined && draftVal !== null && draftVal !== '') {
              const num = parseFloat(String(draftVal).replace(/,/g, ''));
              sum += isNaN(num) ? 0 : num;
            } else {
              const amt = it.amounts?.[p.id] ?? it.amounts?.[String(p.id)] ?? 0;
              sum += Number(amt) || 0;
            }
          });
          map[p.id][cat.category_id] = sum;
          map[p.id][(cat.category_name || '').trim().toLowerCase()] = sum;
        });
      }
    });

    // 2. Evaluate formula categories in multiple passes to support dependencies
    const formulaCats = categories.filter(c => c.category_type === 'FORMULA');
    const passes = Math.max(1, formulaCats.length);
    for (let i = 0; i < passes; i++) {
      formulaCats.forEach(fcat => {
        periods.forEach(p => {
          const val = evaluateFormula(fcat.formula_definition || fcat.formula_expression, map[p.id]);
          const rounded = Math.round(val * 100) / 100;
          map[p.id][fcat.category_id] = rounded;
          map[p.id][(fcat.category_name || '').trim().toLowerCase()] = rounded;
        });
      });
    }

    return map;
  }, [categories, periods, matrixDraft]);

  // Helper: Get value of a cell with draft and formula priority
  const getCellAmount = (costHeadId, periodId) => {
    const parentCat = categories.find(cat => cat.items?.some(it => it.cost_head_id === costHeadId));
    if (parentCat && parentCat.category_type === 'FORMULA') {
      const pTotals = periodCategoryTotals[periodId] || {};
      return pTotals[parentCat.category_id] ?? 0;
    }

    const draftVal = matrixDraft[costHeadId]?.[periodId];
    if (draftVal !== undefined && draftVal !== null && draftVal !== '') {
      const num = parseFloat(String(draftVal).replace(/,/g, ''));
      return isNaN(num) ? 0 : num;
    }
    // Find in categories
    if (parentCat) {
      const item = parentCat.items?.find(it => it.cost_head_id === costHeadId);
      if (item) {
        const amt = item.amounts?.[periodId] ?? item.amounts?.[String(periodId)] ?? 0;
        return Number(amt) || 0;
      }
    }
    return 0;
  };

  // Category Color Palette matching Food Data Entry design
  const getCategoryColor = (catName, idx) => {
    const nameLower = (catName || '').toLowerCase();
    if (nameLower.includes('material') || nameLower.includes('maintenance') || nameLower.includes('fc') || nameLower.includes('power')) {
      return { barColor: '#E5A100', totalBg: '#FFF8E1', totalText: '#8A4A00', headerBg: '#FFFBEB', text: '#14245C' };
    }
    if (nameLower.includes('labour') || nameLower.includes('labor')) {
      return { barColor: '#6B7699', totalBg: '#EEF1F7', totalText: '#334155', headerBg: '#F4F6FA', text: '#14245C' };
    }
    if (nameLower.includes('event')) {
      return { barColor: '#2F8FD1', totalBg: '#E6F4FE', totalText: '#1D4ED8', headerBg: '#EFF6FF', text: '#14245C' };
    }
    if (nameLower.includes('festival')) {
      return { barColor: '#18A058', totalBg: '#E4F6EC', totalText: '#0F6B3A', headerBg: '#ECFDF5', text: '#14245C' };
    }
    if (nameLower.includes('cost per person')) {
      return { barColor: '#7A4DE0', totalBg: '#EFE9FB', totalText: '#5B34B5', headerBg: '#F5F3FF', text: '#14245C' };
    }
    if (nameLower.includes('person')) {
      return { barColor: '#C9A400', totalBg: '#FEF9C3', totalText: '#854D0E', headerBg: '#FEFCE8', text: '#14245C' };
    }
    const fallbacks = [
      { barColor: '#E5A100', totalBg: '#FFF8E1', totalText: '#8A4A00', headerBg: '#FFFBEB', text: '#14245C' },
      { barColor: '#6B7699', totalBg: '#EEF1F7', totalText: '#334155', headerBg: '#F4F6FA', text: '#14245C' },
      { barColor: '#2F8FD1', totalBg: '#E6F4FE', totalText: '#1D4ED8', headerBg: '#EFF6FF', text: '#14245C' },
      { barColor: '#18A058', totalBg: '#E4F6EC', totalText: '#0F6B3A', headerBg: '#ECFDF5', text: '#14245C' }
    ];
    return fallbacks[idx % fallbacks.length];
  };

  // Calculate live category subtotals across all periods
  const categorySubtotals = useMemo(() => {
    const subs = {};
    categories.forEach(cat => {
      subs[cat.category_id] = {};
      periods.forEach(p => {
        let pSum = 0;
        cat.items?.forEach(it => {
          pSum += getCellAmount(it.cost_head_id, p.id);
        });
        // Include any new draft rows for this category
        newRowDrafts.filter(nr => nr.category_id === cat.category_id).forEach(nr => {
          const amt = parseFloat(nr.amounts?.[p.id] || 0);
          if (!isNaN(amt)) pSum += amt;
        });
        subs[cat.category_id][p.id] = pSum;
      });
    });
    return subs;
  }, [categories, periods, matrixDraft, newRowDrafts]);

  // Helper to detect non-expense metrics (Person, Total Person, Total Cost Per Person, etc.)
  const isNonExpenseItem = (catName = '', itemDesc = '') => {
    const c = String(catName || '').toLowerCase().trim();
    const i = String(itemDesc || '').toLowerCase().trim();
    const s = `${c} ${i}`.trim();

    if (
      c === 'person' ||
      c === 'persons' ||
      c.includes('person') ||
      c.includes('diners') ||
      c.includes('census') ||
      c.includes('unit economics') ||
      c.includes('economics')
    ) {
      return true;
    }

    return (
      i.includes('student') ||
      i.includes('staff count') ||
      i.includes('staffs count') ||
      i.includes('cost per person') ||
      i.includes('cost/person') ||
      i.includes('cost / person') ||
      i.includes('per person') ||
      i.includes('per meal') ||
      i.includes('diners') ||
      i.includes('census') ||
      i.includes('headcount') ||
      s.includes('total person') ||
      s.includes('total persons') ||
      s.includes('cost per person') ||
      s.includes('per person') ||
      s.includes('students count') ||
      s.includes('student count') ||
      (c === 'person' && i.includes('other'))
    );
  };

  // Calculate live Grand Total for each period (strictly excluding Total Person & Cost Per Person)
  const grandTotalsByPeriod = useMemo(() => {
    const totals = {};
    let overallGrand = 0;
    periods.forEach(p => {
      let pSum = 0;
      categories.forEach(cat => {
        const catName = String(cat.category_name || cat.name || '').toLowerCase();
        if (isNonExpenseItem(catName)) return;

        cat.items?.forEach(it => {
          if (!isNonExpenseItem(catName, it.description || it.name)) {
            pSum += getCellAmount(it.cost_head_id, p.id);
          }
        });

        newRowDrafts.filter(nr => nr.category_id === cat.category_id).forEach(nr => {
          if (!isNonExpenseItem(catName, nr.name)) {
            const amt = parseFloat(nr.amounts?.[p.id] || 0);
            if (!isNaN(amt)) pSum += amt;
          }
        });
      });
      totals[p.id] = pSum;
      overallGrand += pSum;
    });
    return { totals, overallGrand };
  }, [periods, categories, matrixDraft, newRowDrafts]);

  // Handle inline description change
  const handleCostHeadNameChange = (costHeadId, newName) => {
    setEditedCostHeadNames(prev => ({
      ...prev,
      [costHeadId]: newName
    }));
  };

  // Handle inline category name change
  const handleCategoryNameChange = (categoryId, newName) => {
    setEditedCategoryNames(prev => ({
      ...prev,
      [categoryId]: newName
    }));
  };

  // Add a new row to a category
  const handleAddNewRow = (categoryId) => {
    const tempId = `temp_${Date.now()}`;
    setNewRowDrafts(prev => [
      ...prev,
      {
        temp_id: tempId,
        category_id: categoryId,
        name: 'New Line Item',
        amounts: {}
      }
    ]);
  };

  // Remove a new draft row
  const handleRemoveDraftRow = (tempId) => {
    setNewRowDrafts(prev => prev.filter(r => r.temp_id !== tempId));
  };

  // Update amount in a draft row
  const handleDraftRowAmountChange = (tempId, periodId, val) => {
    setNewRowDrafts(prev => prev.map(r => {
      if (r.temp_id === tempId) {
        return {
          ...r,
          amounts: {
            ...r.amounts,
            [periodId]: val
          }
        };
      }
      return r;
    }));
  };

  // Master Save: Persists all text changes, descriptions, formulas, and cell values to DB
  const handleSaveAllSpreadsheetData = async () => {
    setIsSavingLocal(true);
    setLocalMessage(null);
    try {
      // 1. Prepare updated cost heads
      const updatedCostHeads = Object.keys(editedCostHeadNames).map(id => ({
        id: parseInt(id, 10),
        name: editedCostHeadNames[id]
      }));

      // 2. Prepare updated categories
      const updatedCategories = Object.keys(editedCategoryNames).map(id => ({
        id: parseInt(id, 10),
        name: editedCategoryNames[id]
      }));

      // 3. Prepare new cost heads
      const newCostHeads = newRowDrafts.map(nr => ({
        temp_id: nr.temp_id,
        category_id: nr.category_id,
        name: nr.name
      }));

      // 4. Prepare entries by period
      const entriesByPeriod = {};
      periods.forEach(p => {
        const pEntries = [];
        categories.forEach(cat => {
          cat.items?.forEach(it => {
            const amt = getCellAmount(it.cost_head_id, p.id);
            const rmk = remarksDraft[it.cost_head_id]?.[p.id] ??
                        remarksDraft[it.cost_head_id]?.[String(p.id)] ??
                        it.remarks?.[p.id] ??
                        it.remarks?.[String(p.id)] ?? '';
            pEntries.push({
              cost_head_id: it.cost_head_id,
              amount: amt,
              remarks: rmk
            });
          });
        });
        // Include new row draft entries
        newRowDrafts.forEach(nr => {
          const amt = parseFloat(nr.amounts?.[p.id] || 0) || 0;
          pEntries.push({
            cost_head_id: nr.temp_id,
            amount: amt,
            remarks: ''
          });
        });
        entriesByPeriod[p.id] = pEntries;
      });

      const payload = {
        module: 'food',
        updated_cost_heads: updatedCostHeads,
        updated_categories: updatedCategories,
        new_cost_heads: newCostHeads,
        entries_by_period: entriesByPeriod
      };

      const res = await fetch('/api/workstation/spreadsheet-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save spreadsheet');
      }

      const resData = await res.json();
      setLocalMessage({
        type: 'success',
        text: resData.message || 'Saved all spreadsheet rows, content descriptions and values to database!'
      });

      // Clear local edit buffers
      setEditedCostHeadNames({});
      setEditedCategoryNames({});
      setNewRowDrafts([]);

      if (fetchData) fetchData();
    } catch (err) {
      setLocalMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setIsSavingLocal(false);
      setTimeout(() => setLocalMessage(null), 6000);
    }
  };

  if (activeSubTab === 'budget' || activeSubTab === 'power_water') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        {/* Active Focus Month + 3-Tab Segmented View Control */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '14px 20px',
          borderRadius: '18px',
          border: '1px solid #E1E6F2',
          boxShadow: '0 2px 10px rgba(20, 36, 92, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Active focus month:
            </span>
            {periods.map(p => {
              const isSel = String(p.id) === currStr;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setEditingPeriodId(p.id)}
                  style={{
                    minHeight: '36px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: isSel ? '800' : '600',
                    border: isSel ? '1px solid #14245C' : '1px solid #E1E6F2',
                    backgroundColor: isSel ? '#14245C' : '#ffffff',
                    color: isSel ? '#ffffff' : '#334155',
                    cursor: 'pointer'
                  }}
                >
                  {p.period_label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F3F5FA', padding: '4px', borderRadius: '10px', border: '1px solid #E1E6F2' }}>
            <button
              type="button"
              onClick={() => setActiveSubTab('excel_grid')}
              style={{
                minHeight: '36px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: '#475569'
              }}
            >
              Multi-month Excel grid
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('budget')}
              style={{
                minHeight: '36px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: activeSubTab === 'budget' ? '800' : '700',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeSubTab === 'budget' ? '#14245C' : 'transparent',
                color: activeSubTab === 'budget' ? '#ffffff' : '#475569'
              }}
            >
              Food budget tracking (8 heads)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('power_water')}
              style={{
                minHeight: '36px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: activeSubTab === 'power_water' ? '800' : '700',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeSubTab === 'power_water' ? '#14245C' : 'transparent',
                color: activeSubTab === 'power_water' ? '#ffffff' : '#475569'
              }}
            >
              Power & Water Entry
            </button>
          </div>
        </div>

        {activeSubTab === 'budget' ? (
          <FoodBudgetEntrySection periods={periods} onRefreshData={fetchData} editingPeriodId={editingPeriodId} />
        ) : (
          <FoodPowerWaterEntrySection
            periods={periods}
            editingPeriodId={editingPeriodId}
            activePeriodObj={activePeriodObj}
            handleToggleLock={handleToggleLock}
            onRefreshData={fetchData}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      border: '1px solid #E1E6F2',
      boxShadow: '0 4px 18px rgba(20, 36, 92, 0.05)',
      overflow: 'hidden',
      marginBottom: '22px',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>
      {/* 1. NAVY HEADER BAND */}
      <div style={{
        backgroundColor: '#14245C',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        color: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: '#F5A524',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#14245C'
          }}>
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                Food operations master spreadsheet
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255,255,255,0.16)',
                color: '#F5A524'
              }}>
                Rathinam report Excel grid
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '3px 0 0 0' }}>
              Full editable matrix · click to edit line item descriptions, category titles, cell values and formulas · direct DB save
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {openAddCategoryModal && (
            <button
              type="button"
              onClick={openAddCategoryModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '38px',
                padding: '8px 16px',
                borderRadius: '10px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Plus size={14} />
              <span>Add category</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAllSpreadsheetData}
            disabled={isSavingLocal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '38px',
              padding: '8px 18px',
              borderRadius: '10px',
              backgroundColor: '#F5A524',
              color: '#14245C',
              fontSize: '12.5px',
              fontWeight: '800',
              border: 'none',
              cursor: isSavingLocal ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(245, 165, 36, 0.3)'
            }}
          >
            {isSavingLocal ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
            <span>Save all rows and values to DB</span>
          </button>
        </div>
      </div>

      {/* 2. NOTIFICATION BANNER */}
      {localMessage && (
        <div style={{
          padding: '10px 22px',
          backgroundColor: localMessage.type === 'success' ? '#E4F6EC' : '#FBE3E3',
          borderBottom: `1px solid ${localMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          color: localMessage.type === 'success' ? '#0F6B3A' : '#A32626',
          fontSize: '12.5px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {localMessage.type === 'success' ? <CheckCircle2 size={16} color="#0F6B3A" /> : <AlertCircle size={16} color="#A32626" />}
          <span>{localMessage.text}</span>
        </div>
      )}

      {/* 3. CYCLE SELECTION & 2-TAB VIEW TOGGLE */}
      <div style={{
        backgroundColor: '#F7F9FD',
        padding: '12px 22px',
        borderBottom: '1px solid #E1E6F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Active focus month:
          </span>
          {periods.map(p => {
            const isSel = String(p.id) === currStr;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setEditingPeriodId(p.id)}
                style={{
                  minHeight: '36px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: isSel ? '800' : '600',
                  border: isSel ? '1px solid #14245C' : '1px solid #D5DCEE',
                  backgroundColor: isSel ? '#14245C' : '#ffffff',
                  color: isSel ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{p.period_label}</span>
                {isSel && <Check size={12} color="#F5A524" />}
              </button>
            );
          })}
        </div>

        {/* Two-tab Segmented Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffffff', padding: '4px', borderRadius: '10px', border: '1px solid #E1E6F2' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('excel_grid')}
            style={{
              minHeight: '36px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '800',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'excel_grid' ? '#14245C' : 'transparent',
              color: activeSubTab === 'excel_grid' ? '#ffffff' : '#475569'
            }}
          >
            Multi-month Excel grid
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('budget')}
            style={{
              minHeight: '36px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'budget' ? '#14245C' : 'transparent',
              color: activeSubTab === 'budget' ? '#ffffff' : '#475569'
            }}
          >
            Food budget tracking (8 heads)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('power_water')}
            style={{
              minHeight: '36px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'power_water' ? '#14245C' : 'transparent',
              color: activeSubTab === 'power_water' ? '#ffffff' : '#475569'
            }}
          >
            Power & Water Entry
          </button>
        </div>
      </div>

      {/* 4. FORMULA BAR RIBBON */}
      <div style={{
        padding: '10px 22px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #EDF0F8',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '12px'
      }}>
        <div style={{ fontWeight: '800', color: '#2F4BB8', fontFamily: 'monospace' }}>
          fx
        </div>
        <div style={{ height: '14px', width: '1px', backgroundColor: '#E1E6F2' }} />
        <div style={{ fontFamily: 'monospace', color: '#475569', fontSize: '11.5px', flex: 1 }}>
          <strong>Total Food Expenses:</strong> =SUM(Food Material + Food Labour) | <strong>Total Maintenance:</strong> =SUM(FC Maintenance + Water + Vehicle) | <strong>Total Expenses:</strong> =SUM(All Categories)
        </div>
      </div>

      {/* 5. MULTI-MONTH EXCEL SPREADSHEET TABLE */}
      {activeSubTab === 'excel_grid' && (
        <div style={{ overflowX: 'auto', padding: '16px 22px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            border: '1px solid #E1E6F2',
            borderRadius: '12px',
            backgroundColor: '#ffffff'
          }}>
            {/* Table Header */}
            <thead>
              <tr style={{
                backgroundColor: '#14245C',
                color: '#ffffff',
                borderBottom: '2px solid #14245C',
                fontWeight: '800',
                fontSize: '12.5px'
              }}>
                <th style={{ padding: '12px 14px', width: '185px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.14)' }}>
                  Category
                </th>
                <th style={{ padding: '12px 16px', minWidth: '220px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.14)' }}>
                  Description
                </th>

                {periods.map(p => {
                  const isSel = String(p.id) === currStr;
                  return (
                    <th
                      key={p.id}
                      style={{
                        padding: '12px 14px',
                        minWidth: '130px',
                        textAlign: 'right',
                        borderRight: '1px solid rgba(255,255,255,0.14)',
                        backgroundColor: isSel ? '#2F4BB8' : '#14245C',
                        color: '#ffffff',
                        fontWeight: '800'
                      }}
                    >
                      {p.period_label} {isSel && '★'}
                    </th>
                  );
                })}

                <th style={{ padding: '12px 16px', width: '135px', textAlign: 'right', borderRight: '1px solid rgba(255,255,255,0.14)', backgroundColor: '#10183A', color: '#F5A524' }}>
                  Total spend
                </th>
                <th style={{ padding: '12px 10px', width: '70px', textAlign: 'center' }}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {categories.map((cat, catIdx) => {
                const colorTheme = getCategoryColor(cat.category_name, catIdx);
                const categoryItems = cat.items || [];
                const draftItemsInCat = newRowDrafts.filter(nr => nr.category_id === cat.category_id);
                const allItemsCount = categoryItems.length + draftItemsInCat.length;

                const catDisplayName = editedCategoryNames[cat.category_id] !== undefined
                  ? editedCategoryNames[cat.category_id]
                  : cat.category_name;

                return (
                  <React.Fragment key={cat.category_id}>
                    {/* Render Category Items */}
                    {categoryItems.map((item, itemIdx) => {
                      const itemDisplayName = editedCostHeadNames[item.cost_head_id] !== undefined
                        ? editedCostHeadNames[item.cost_head_id]
                        : item.description;

                      // Calculate item total across periods
                      let itemTotal = 0;
                      periods.forEach(p => {
                        itemTotal += getCellAmount(item.cost_head_id, p.id);
                      });

                      return (
                        <tr key={item.cost_head_id} style={{ borderBottom: '1px solid #EDF0F8', backgroundColor: '#ffffff' }}>
                          {/* Merged Category Column on the first row of category with 5px coloured left bar */}
                          {itemIdx === 0 && (
                            <td
                              rowSpan={allItemsCount > 0 ? allItemsCount : 1}
                              style={{
                                padding: '12px 14px',
                                textAlign: 'left',
                                verticalAlign: 'middle',
                                backgroundColor: colorTheme.headerBg,
                                color: colorTheme.text,
                                fontWeight: '800',
                                fontSize: '13px',
                                borderLeft: `5px solid ${colorTheme.barColor}`,
                                borderRight: '1px solid #EDF0F8',
                                borderBottom: '1px solid #EDF0F8'
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                                {cat.category_type === 'FORMULA' && (
                                  <span
                                    title={`Auto-calculated Formula: ${cat.formula_expression || ''}`}
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: '800',
                                      backgroundColor: '#EFE9FB',
                                      color: '#5B34B5',
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      letterSpacing: '0.03em',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    fx FORMULA
                                  </span>
                                )}
                                <input
                                  type="text"
                                  aria-label={`Category name ${catDisplayName}`}
                                  value={catDisplayName}
                                  onChange={(e) => handleCategoryNameChange(cat.category_id, e.target.value)}
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    fontWeight: '800',
                                    backgroundColor: 'transparent',
                                    border: '1px dashed rgba(20, 36, 92, 0.22)',
                                    borderRadius: '6px',
                                    padding: '4px 6px',
                                    fontSize: '13px',
                                    color: colorTheme.text
                                  }}
                                  title="Click to edit category title"
                                />
                                {cat.category_type !== 'FORMULA' && (
                                  <button
                                    type="button"
                                    onClick={() => handleAddNewRow(cat.category_id)}
                                    title={`Add new row in ${cat.category_name}`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      backgroundColor: '#ffffff',
                                      color: '#14245C',
                                      border: '1px solid #D5DCEE',
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Plus size={11} /> Row
                                  </button>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Editable Description Column */}
                          <td style={{
                            padding: '8px 12px',
                            backgroundColor: '#ffffff',
                            fontWeight: '600',
                            color: '#14245C',
                            borderRight: '1px solid #EDF0F8'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="text"
                                aria-label={`Description ${itemDisplayName}`}
                                value={itemDisplayName}
                                onChange={(e) => handleCostHeadNameChange(item.cost_head_id, e.target.value)}
                                style={{
                                  width: '100%',
                                  height: '38px',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #D5DCEE',
                                  backgroundColor: '#ffffff',
                                  fontWeight: '600',
                                  fontSize: '12.5px',
                                  color: '#14245C'
                                }}
                                title="Click to edit line item description"
                              />
                            </div>
                          </td>

                          {/* Data Cells */}
                          {periods.map(p => {
                            const amt = getCellAmount(item.cost_head_id, p.id);
                            const isSel = String(p.id) === currStr;
                            return (
                              <td
                                key={p.id}
                                style={{
                                  padding: '6px 8px',
                                  textAlign: 'right',
                                  backgroundColor: isSel ? '#EAF0FF' : '#ffffff',
                                  borderRight: '1px solid #EDF0F8'
                                }}
                              >
                                <input
                                  type="number"
                                  step="0.01"
                                  aria-label={`${itemDisplayName} ${p.period_label}`}
                                  value={amt || ''}
                                  onChange={(e) => handleCellChange(item.cost_head_id, p.id, e.target.value)}
                                  disabled={isClosed || cat.category_type === 'FORMULA'}
                                  title={cat.category_type === 'FORMULA' ? `Auto-calculated by formula: ${cat.formula_expression || ''}` : ''}
                                  style={{
                                    width: '100%',
                                    height: '38px',
                                    textAlign: 'right',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    border: isSel ? '1.5px solid #2F4BB8' : '1px solid #D5DCEE',
                                    backgroundColor: cat.category_type === 'FORMULA' ? '#F5F3FF' : '#ffffff',
                                    fontWeight: '700',
                                    color: cat.category_type === 'FORMULA' ? '#5B34B5' : '#14245C',
                                    fontSize: '12.5px',
                                    cursor: cat.category_type === 'FORMULA' ? 'not-allowed' : 'text',
                                    boxSizing: 'border-box'
                                  }}
                                  className="currency-font"
                                />
                              </td>
                            );
                          })}

                          {/* Total Spend */}
                          <td style={{
                            padding: '8px 14px',
                            textAlign: 'right',
                            fontWeight: '800',
                            backgroundColor: '#F7F9FD',
                            color: '#14245C',
                            borderRight: '1px solid #EDF0F8'
                          }} className="currency-font">
                            {formatINR(itemTotal)}
                          </td>

                          {/* Delete Action */}
                          <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                            {handleDeleteCostHead && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCostHead({ id: item.cost_head_id, name: item.description })}
                                title={`Delete "${item.description}"`}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  color: '#94a3b8',
                                  padding: '2px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Render New Added Rows in this Category */}
                    {draftItemsInCat.map((nr) => {
                      let nrTotal = 0;
                      periods.forEach(p => {
                        nrTotal += parseFloat(nr.amounts?.[p.id] || 0) || 0;
                      });

                      return (
                        <tr key={nr.temp_id} style={{ borderBottom: '1px solid #000000', backgroundColor: '#fef9c3' }}>
                          <td style={{ padding: '6px 12px', borderRight: '1px solid #000000', backgroundColor: colorTheme.headerBg }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="text"
                                value={nr.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewRowDrafts(prev => prev.map(r => r.temp_id === nr.temp_id ? { ...r, name: val } : r));
                                }}
                                placeholder="Enter item name..."
                                style={{
                                  width: '100%',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  border: '1.5px solid #eab308',
                                  backgroundColor: '#ffffff',
                                  fontWeight: '700',
                                  fontSize: '12.5px'
                                }}
                              />
                            </div>
                          </td>

                          {/* Draft Cells */}
                          {activeSubTab === 'excel_grid' ? (
                            periods.map(p => (
                              <td key={p.id} style={{ padding: '4px 8px', borderRight: '1px solid #000000', backgroundColor: '#fff2df' }}>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={nr.amounts?.[p.id] || ''}
                                  onChange={(e) => handleDraftRowAmountChange(nr.temp_id, p.id, e.target.value)}
                                  style={{
                                    width: '100%',
                                    textAlign: 'right',
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#ffffff',
                                    fontWeight: '700'
                                  }}
                                />
                              </td>
                            ))
                          ) : (
                            <td style={{ padding: '4px 8px', borderRight: '1px solid #000000', backgroundColor: '#fff2df' }}>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={nr.amounts?.[editingPeriodId] || ''}
                                onChange={(e) => handleDraftRowAmountChange(nr.temp_id, editingPeriodId, e.target.value)}
                                style={{
                                  width: '100%',
                                  textAlign: 'right',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#ffffff',
                                  fontWeight: '700'
                                }}
                              />
                            </td>
                          )}

                          <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '800', borderRight: '1px solid #000000' }} className="currency-font">
                            {formatINR(nrTotal)}
                          </td>

                          <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveDraftRow(nr.temp_id)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}
                              title="Discard draft row"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* CATEGORY SUBTOTAL ROW: Pale tint of category colour, bold text, no input */}
                    <tr style={{
                      backgroundColor: colorTheme.totalBg,
                      color: colorTheme.totalText,
                      borderTop: '1px solid #D5DCEE',
                      borderBottom: '1px solid #D5DCEE',
                      fontWeight: '800',
                      fontSize: '13px'
                    }}>
                      <td colSpan={2} style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        borderLeft: `5px solid ${colorTheme.barColor}`,
                        borderRight: '1px solid #D5DCEE',
                        letterSpacing: '0.01em'
                      }}>
                        Total {cat.category_name}
                      </td>

                      {/* Subtotal columns per period */}
                      {periods.map(p => {
                        const subVal = categorySubtotals[cat.category_id]?.[p.id] || 0;
                        const isSel = String(p.id) === currStr;
                        return (
                          <td
                            key={p.id}
                            style={{
                              padding: '10px 12px',
                              textAlign: 'right',
                              borderRight: '1px solid #D5DCEE',
                              backgroundColor: isSel ? '#EAF0FF' : 'transparent',
                              fontWeight: '800'
                            }}
                            className="currency-font"
                          >
                            {formatINR(subVal)}
                          </td>
                        );
                      })}

                      {/* Overall Category Total */}
                      <td style={{
                        padding: '10px 14px',
                        textAlign: 'right',
                        borderRight: '1px solid #D5DCEE',
                        fontWeight: '800'
                      }} className="currency-font">
                        {formatINR(
                          periods.reduce((acc, p) => acc + (categorySubtotals[cat.category_id]?.[p.id] || 0), 0)
                        )}
                      </td>
                      <td style={{ padding: '10px 8px' }}></td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* BOTTOM GRAND TOTAL ROW: Dark #10183A with white bold text */}
              <tr style={{
                backgroundColor: '#10183A',
                color: '#ffffff',
                borderTop: '2px solid #14245C',
                fontWeight: '800',
                fontSize: '13.5px'
              }}>
                <td colSpan={2} style={{
                  padding: '12px 18px',
                  textAlign: 'left',
                  borderRight: '1px solid rgba(255,255,255,0.14)',
                  letterSpacing: '0.02em'
                }}>
                  Total Expenses
                </td>

                {/* Grand Total per period */}
                {periods.map(p => {
                  const gVal = grandTotalsByPeriod.totals[p.id] || 0;
                  return (
                    <td
                      key={p.id}
                      style={{
                        padding: '12px 12px',
                        textAlign: 'right',
                        borderRight: '1px solid rgba(255,255,255,0.14)',
                        fontWeight: '800'
                      }}
                      className="currency-font"
                    >
                      {formatINR(gVal)}
                    </td>
                  );
                })}

                <td style={{
                  padding: '12px 14px',
                  textAlign: 'right',
                  borderRight: '1px solid rgba(255,255,255,0.14)',
                  fontWeight: '800',
                  color: '#F5A524'
                }} className="currency-font">
                  {formatINR(grandTotalsByPeriod.overallGrand)}
                </td>
                <td style={{ padding: '12px 8px' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
