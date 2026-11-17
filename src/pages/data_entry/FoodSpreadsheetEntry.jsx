import React, { useState, useMemo } from 'react';
import { formatINR } from '../../utils/formatters';
import { evaluateFormula } from '../../utils/formulaEngine';
import { 
  Save, RefreshCw, FileSpreadsheet, CheckCircle2, Zap, Utensils, 
  AlertCircle, FileText, Check, Plus, Trash2, Edit2, Layers, Table, Users, Award 
} from 'lucide-react';

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
  openAddCategoryModal
}) {
  const [activeSubTab, setActiveSubTab] = useState('excel_grid'); // 'excel_grid', 'single_month', 'census'
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

  // Category Color Palette matching user's Excel mockup (Image 1)
  const getCategoryColor = (catName, idx) => {
    const nameLower = (catName || '').toLowerCase();
    if (nameLower.includes('material')) {
      return { headerBg: '#ffc90e', text: '#000000', rowBg: '#fff2df' }; // Golden yellow
    }
    if (nameLower.includes('labour') || nameLower.includes('labor')) {
      return { headerBg: '#dcdde1', text: '#000000', rowBg: '#fff2df' }; // Silver / Grey
    }
    if (nameLower.includes('maintenance') || nameLower.includes('fc') || nameLower.includes('power')) {
      return { headerBg: '#ffc90e', text: '#000000', rowBg: '#fff2df' }; // Golden yellow
    }
    if (nameLower.includes('event')) {
      return { headerBg: '#a8d8ea', text: '#000000', rowBg: '#fff2df' }; // Soft sky blue
    }
    if (nameLower.includes('festival')) {
      return { headerBg: '#d4edda', text: '#000000', rowBg: '#fff2df' }; // Soft mint green
    }
    const fallbacks = [
      { headerBg: '#fef08a', text: '#000000', rowBg: '#fff2df' },
      { headerBg: '#e2e8f0', text: '#000000', rowBg: '#fff2df' },
      { headerBg: '#fed7aa', text: '#000000', rowBg: '#fff2df' },
      { headerBg: '#bfdbfe', text: '#000000', rowBg: '#fff2df' },
      { headerBg: '#bbf7d0', text: '#000000', rowBg: '#fff2df' }
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

  // Helper to detect non-expense metrics (Total Person, Total Cost Per Person, etc.)
  const isNonExpenseItem = (catName = '', itemDesc = '') => {
    const s = `${catName} ${itemDesc}`.toLowerCase().trim();
    return (
      s.includes('total person') ||
      s.includes('cost per person') ||
      s.includes('per person') ||
      s.includes('total persons') ||
      s.includes('persons count') ||
      s.includes('diners') ||
      s.includes('per meal') ||
      s.includes('cost per meal') ||
      s.includes('unit economics') ||
      s.includes('census') ||
      s.includes('cost / person') ||
      s.includes('cost/person') ||
      s.includes('headcount') ||
      s.includes('student count')
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
            const rmk = remarksDraft[it.cost_head_id]?.[p.id] ?? it.remarks?.[p.id] ?? '';
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

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1.5px solid #00a2e8',
      boxShadow: '0 4px 16px rgba(0, 162, 232, 0.1)',
      overflow: 'hidden',
      marginBottom: '22px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 1. SPREADSHEET TOOLBAR & HEADER */}
      <div style={{
        backgroundColor: '#00a2e8',
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        color: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00a2e8',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}>
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '16.5px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                Food Operations Master Spreadsheet
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                color: '#0284c7'
              }}>
                Rathinam Report Excel Grid
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: '#e0f2fe', margin: '2px 0 0 0' }}>
              Full Editable Matrix • Click to edit line item descriptions, category titles, cell values & formulas • Direct DB Save
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {openAddCategoryModal && (
            <button
              type="button"
              onClick={openAddCategoryModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Plus size={13} />
              <span>Add Category</span>
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
              padding: '8px 18px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#0087c2',
              fontSize: '13px',
              fontWeight: '800',
              border: 'none',
              cursor: isSavingLocal ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
            }}
          >
            {isSavingLocal ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
            <span>💾 Save All Rows & Values to DB</span>
          </button>
        </div>
      </div>

      {/* 2. NOTIFICATION BANNER */}
      {localMessage && (
        <div style={{
          padding: '10px 20px',
          backgroundColor: localMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
          borderBottom: `1px solid ${localMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: localMessage.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '12.5px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {localMessage.type === 'success' ? <CheckCircle2 size={16} color="#059669" /> : <AlertCircle size={16} color="#dc2626" />}
          <span>{localMessage.text}</span>
        </div>
      )}

      {/* 3. CYCLE SELECTION & VIEW TOGGLE */}
      <div style={{
        backgroundColor: '#f0f9ff',
        padding: '10px 20px',
        borderBottom: '1px solid #bae6fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            📅 Active Focus Month:
          </span>
          {periods.map(p => {
            const isSel = String(p.id) === currStr;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setEditingPeriodId(p.id)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '800',
                  border: isSel ? '2px solid #00a2e8' : '1px solid #cbd5e1',
                  backgroundColor: isSel ? '#00a2e8' : '#ffffff',
                  color: isSel ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isSel ? '0 2px 4px rgba(0, 162, 232, 0.25)' : 'none'
                }}
              >
                <span>{p.period_label}</span>
                {isSel && <Check size={12} color="#ffffff" />}
              </button>
            );
          })}
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffffff', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('excel_grid')}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'excel_grid' ? '#00a2e8' : 'transparent',
              color: activeSubTab === 'excel_grid' ? '#ffffff' : '#64748b'
            }}
          >
            📊 Multi-Month Excel Grid (Image 1 Style)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('single_month')}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'single_month' ? '#00a2e8' : 'transparent',
              color: activeSubTab === 'single_month' ? '#ffffff' : '#64748b'
            }}
          >
            Focused Month ({activePeriodObj?.period_label})
          </button>
        </div>
      </div>

      {/* 4. FORMULA BAR RIBBON */}
      <div style={{
        padding: '8px 20px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '12px'
      }}>
        <div style={{ fontWeight: '800', color: '#00a2e8', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>fx</span>
        </div>
        <div style={{ height: '14px', width: '1px', backgroundColor: '#e2e8f0' }} />
        <div style={{ fontFamily: 'monospace', color: '#475569', fontSize: '11.5px', flex: 1 }}>
          <strong>Total Food Expenses:</strong> =SUM(Food Material + Food Labour) | <strong>Total Maintenance:</strong> =SUM(FC Maintenance + Water + Vehicle) | <strong>Total Expenses:</strong> =SUM(All Categories)
        </div>
      </div>

      {/* 5. MULTI-MONTH EXCEL SPREADSHEET TABLE (IMAGE 1 EXACT DESIGN) */}
      {(activeSubTab === 'excel_grid' || activeSubTab === 'single_month') && (
        <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            border: '2px solid #000000',
            backgroundColor: '#ffffff'
          }}>
            {/* Table Header: Cyan / Sky Blue matching Image 1 */}
            <thead>
              <tr style={{
                backgroundColor: '#00a2e8',
                color: '#000000',
                borderBottom: '2px solid #000000',
                fontWeight: '800',
                fontSize: '13px'
              }}>
                <th style={{ padding: '10px 14px', width: '180px', textAlign: 'center', borderRight: '1px solid #000000' }}>
                  Category
                </th>
                <th style={{ padding: '10px 16px', minWidth: '220px', textAlign: 'center', borderRight: '1px solid #000000' }}>
                  Description
                </th>

                {/* Display columns: If 'excel_grid', show all periods; if 'single_month', show active month */}
                {activeSubTab === 'excel_grid' ? (
                  periods.map(p => {
                    const isSel = String(p.id) === currStr;
                    return (
                      <th
                        key={p.id}
                        style={{
                          padding: '10px 14px',
                          minWidth: '125px',
                          textAlign: 'center',
                          borderRight: '1px solid #000000',
                          backgroundColor: isSel ? '#0ea5e9' : '#00a2e8',
                          color: '#000000',
                          fontWeight: '800'
                        }}
                      >
                        {p.period_label} {isSel && '★'}
                      </th>
                    );
                  })
                ) : (
                  <th style={{ padding: '10px 16px', minWidth: '150px', textAlign: 'center', borderRight: '1px solid #000000', backgroundColor: '#0ea5e9' }}>
                    {activePeriodObj?.period_label} • Amount (₹)
                  </th>
                )}

                <th style={{ padding: '10px 16px', width: '130px', textAlign: 'center', borderRight: '1px solid #000000', backgroundColor: '#0284c7', color: '#ffffff' }}>
                  Total Spend
                </th>
                <th style={{ padding: '10px 10px', width: '70px', textAlign: 'center' }}>
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
                        <tr key={item.cost_head_id} style={{ borderBottom: '1px solid #000000' }}>
                          {/* Merged Category Column on the first row of category */}
                          {itemIdx === 0 && (
                            <td
                              rowSpan={allItemsCount > 0 ? allItemsCount : 1}
                              style={{
                                padding: '12px 14px',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                backgroundColor: colorTheme.headerBg,
                                color: colorTheme.text,
                                fontWeight: '800',
                                fontSize: '13.5px',
                                borderRight: '1px solid #000000',
                                borderBottom: '1px solid #000000'
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                {cat.category_type === 'FORMULA' && (
                                  <span
                                    title={`Auto-calculated Formula: ${cat.formula_expression || ''}`}
                                    style={{
                                      fontSize: '9.5px',
                                      fontWeight: '800',
                                      backgroundColor: '#312e81',
                                      color: '#e0e7ff',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      letterSpacing: '0.03em',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    📐 fx FORMULA
                                  </span>
                                )}
                                <input
                                  type="text"
                                  value={catDisplayName}
                                  onChange={(e) => handleCategoryNameChange(cat.category_id, e.target.value)}
                                  style={{
                                    width: '100%',
                                    textAlign: 'center',
                                    fontWeight: '800',
                                    backgroundColor: 'transparent',
                                    border: '1px dashed rgba(0,0,0,0.3)',
                                    borderRadius: '4px',
                                    padding: '3px 4px',
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
                                      gap: '2px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: 'rgba(0,0,0,0.08)',
                                      border: '1px solid rgba(0,0,0,0.15)',
                                      fontSize: '10.5px',
                                      fontWeight: '700',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Plus size={10} /> Add Row
                                  </button>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Editable Description Column */}
                          <td style={{
                            padding: '6px 12px',
                            backgroundColor: colorTheme.headerBg,
                            fontWeight: '700',
                            color: '#000000',
                            borderRight: '1px solid #000000'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="text"
                                value={itemDisplayName}
                                onChange={(e) => handleCostHeadNameChange(item.cost_head_id, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  border: '1px dashed rgba(0,0,0,0.25)',
                                  backgroundColor: 'rgba(255,255,255,0.7)',
                                  fontWeight: '700',
                                  fontSize: '12.5px',
                                  color: '#000000'
                                }}
                                title="Click to edit line item description"
                              />
                            </div>
                          </td>

                          {/* Data Cells: Peach/Cream Background with Crisp Borders */}
                          {activeSubTab === 'excel_grid' ? (
                            periods.map(p => {
                              const amt = getCellAmount(item.cost_head_id, p.id);
                              const isSel = String(p.id) === currStr;
                              return (
                                <td
                                  key={p.id}
                                  style={{
                                    padding: '4px 8px',
                                    textAlign: 'right',
                                    backgroundColor: isSel ? '#ffedd5' : '#fff2df',
                                    borderRight: '1px solid #000000'
                                  }}
                                >
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={amt || ''}
                                    onChange={(e) => handleCellChange(item.cost_head_id, p.id, e.target.value)}
                                    disabled={isClosed || cat.category_type === 'FORMULA'}
                                    title={cat.category_type === 'FORMULA' ? `Auto-calculated by formula: ${cat.formula_expression || ''}` : ''}
                                    style={{
                                      width: '100%',
                                      textAlign: 'right',
                                      padding: '4px 6px',
                                      borderRadius: '4px',
                                      border: isSel ? '1.5px solid #00a2e8' : '1px solid #cbd5e1',
                                      backgroundColor: cat.category_type === 'FORMULA' ? '#ecfdf5' : '#ffffff',
                                      fontWeight: '700',
                                      color: cat.category_type === 'FORMULA' ? '#15803d' : '#000000',
                                      fontSize: '12.5px',
                                      cursor: cat.category_type === 'FORMULA' ? 'not-allowed' : 'text'
                                    }}
                                    className="currency-font"
                                  />
                                </td>
                              );
                            })
                          ) : (
                            <td style={{
                              padding: '4px 10px',
                              textAlign: 'right',
                              backgroundColor: '#ffedd5',
                              borderRight: '1px solid #000000'
                            }}>
                              <input
                                type="number"
                                step="0.01"
                                value={getCellAmount(item.cost_head_id, editingPeriodId) || ''}
                                onChange={(e) => handleCellChange(item.cost_head_id, editingPeriodId, e.target.value)}
                                disabled={isClosed || cat.category_type === 'FORMULA'}
                                title={cat.category_type === 'FORMULA' ? `Auto-calculated by formula: ${cat.formula_expression || ''}` : ''}
                                style={{
                                  width: '100%',
                                  textAlign: 'right',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: '1.5px solid #00a2e8',
                                  backgroundColor: cat.category_type === 'FORMULA' ? '#ecfdf5' : '#ffffff',
                                  fontWeight: '800',
                                  color: cat.category_type === 'FORMULA' ? '#15803d' : '#000000',
                                  fontSize: '13px',
                                  cursor: cat.category_type === 'FORMULA' ? 'not-allowed' : 'text'
                                }}
                                className="currency-font"
                              />
                            </td>
                          )}

                          {/* Total Spend */}
                          <td style={{
                            padding: '6px 14px',
                            textAlign: 'right',
                            fontWeight: '800',
                            backgroundColor: '#fafafa',
                            color: '#000000',
                            borderRight: '1px solid #000000'
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

                    {/* CATEGORY SUBTOTAL ROW: Bright Green matching Image 1 */}
                    <tr style={{
                      backgroundColor: '#00ff00',
                      color: '#000000',
                      borderTop: '2px solid #000000',
                      borderBottom: '2px solid #000000',
                      fontWeight: '800',
                      fontSize: '13px'
                    }}>
                      <td colSpan={2} style={{
                        padding: '9px 18px',
                        textAlign: 'center',
                        borderRight: '1px solid #000000',
                        letterSpacing: '0.02em'
                      }}>
                        Total {cat.category_name}
                      </td>

                      {/* Subtotal columns per period */}
                      {activeSubTab === 'excel_grid' ? (
                        periods.map(p => {
                          const subVal = categorySubtotals[cat.category_id]?.[p.id] || 0;
                          return (
                            <td
                              key={p.id}
                              style={{
                                padding: '9px 12px',
                                textAlign: 'right',
                                borderRight: '1px solid #000000',
                                fontWeight: '800'
                              }}
                              className="currency-font"
                            >
                              {formatINR(subVal)}
                            </td>
                          );
                        })
                      ) : (
                        <td style={{
                          padding: '9px 14px',
                          textAlign: 'right',
                          borderRight: '1px solid #000000',
                          fontWeight: '800'
                        }} className="currency-font">
                          {formatINR(categorySubtotals[cat.category_id]?.[editingPeriodId] || 0)}
                        </td>
                      )}

                      {/* Overall Category Total */}
                      <td style={{
                        padding: '9px 14px',
                        textAlign: 'right',
                        borderRight: '1px solid #000000',
                        fontWeight: '800'
                      }} className="currency-font">
                        {formatINR(
                          periods.reduce((acc, p) => acc + (categorySubtotals[cat.category_id]?.[p.id] || 0), 0)
                        )}
                      </td>
                      <td style={{ padding: '9px 8px' }}></td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* BOTTOM GRAND TOTAL ROW: Deep Emerald / Teal matching Image 1 */}
              <tr style={{
                backgroundColor: '#00b894',
                color: '#000000',
                borderTop: '3px solid #000000',
                fontWeight: '900',
                fontSize: '13.5px'
              }}>
                <td colSpan={2} style={{
                  padding: '12px 18px',
                  textAlign: 'center',
                  borderRight: '1px solid #000000',
                  letterSpacing: '0.04em'
                }}>
                  Total Expenses
                </td>

                {/* Grand Total per period */}
                {activeSubTab === 'excel_grid' ? (
                  periods.map(p => {
                    const gVal = grandTotalsByPeriod.totals[p.id] || 0;
                    return (
                      <td
                        key={p.id}
                        style={{
                          padding: '12px 12px',
                          textAlign: 'right',
                          borderRight: '1px solid #000000',
                          fontWeight: '900'
                        }}
                        className="currency-font"
                      >
                        {formatINR(gVal)}
                      </td>
                    );
                  })
                ) : (
                  <td style={{
                    padding: '12px 14px',
                    textAlign: 'right',
                    borderRight: '1px solid #000000',
                    fontWeight: '900'
                  }} className="currency-font">
                    {formatINR(grandTotalsByPeriod.totals[editingPeriodId] || 0)}
                  </td>
                )}

                <td style={{
                  padding: '12px 14px',
                  textAlign: 'right',
                  borderRight: '1px solid #000000',
                  fontWeight: '900'
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
