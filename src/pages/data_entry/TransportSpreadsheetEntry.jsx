import React, { useState, useMemo } from 'react';
import { formatINR } from '../../utils/formatters';
import { 
  Save, RefreshCw, FileSpreadsheet, CheckCircle2, Zap, Bus, 
  AlertCircle, FileText, Check, Plus, Trash2, Edit2, Layers, Table, Users, Fuel, Wrench, ShieldCheck, DollarSign
} from 'lucide-react';

export default function TransportSpreadsheetEntry({
  activePeriodObj,
  computedMatrix,
  editingPeriodId,
  setEditingPeriodId,
  matrixDraft = {},
  remarksDraft = {},
  transportCensusDraft = {},
  handleCellChange,
  handleRemarkChange,
  handleTransportCensusChange,
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

  // --- Helper: Parse numeric safely ---
  const num = (v, defaultVal = 0) => {
    if (v === undefined || v === null || v === '') return defaultVal;
    if (typeof v === 'number') return isNaN(v) ? defaultVal : v;
    const cleaned = String(v).replace(/,/g, '').replace(/%/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  // --- Helper: Get value of a cell with draft priority ---
  const getCellAmount = (costHeadId, periodId) => {
    const draftVal = matrixDraft[costHeadId]?.[periodId];
    if (draftVal !== undefined && draftVal !== null && draftVal !== '') {
      const parsedNum = parseFloat(String(draftVal).replace(/,/g, ''));
      return isNaN(parsedNum) ? 0 : parsedNum;
    }
    // Find in categories
    for (const cat of categories) {
      const item = cat.items?.find(it => it.cost_head_id === costHeadId);
      if (item) {
        const amt = item.amounts?.[periodId] ?? item.amounts?.[String(periodId)] ?? 0;
        return Number(amt) || 0;
      }
    }
    return 0;
  };

  // --- Category Color Palette matching user's Excel style ---
  const getCategoryColor = (catName, idx) => {
    const nameLower = (catName || '').toLowerCase();
    if (nameLower.includes('fuel') || nameLower.includes('toll')) {
      return { headerBg: '#ffc90e', text: '#000000', rowBg: '#fff2df' }; // Golden yellow
    }
    if (nameLower.includes('maintenance') || nameLower.includes('spare') || nameLower.includes('fleet')) {
      return { headerBg: '#dcdde1', text: '#000000', rowBg: '#fff2df' }; // Silver / Grey
    }
    if (nameLower.includes('manpower') || nameLower.includes('crew') || nameLower.includes('employee')) {
      return { headerBg: '#a8d8ea', text: '#000000', rowBg: '#fff2df' }; // Soft sky blue
    }
    if (nameLower.includes('statutory') || nameLower.includes('insurance') || nameLower.includes('compliance')) {
      return { headerBg: '#d4edda', text: '#000000', rowBg: '#fff2df' }; // Soft mint green
    }
    const fallbacks = [
      { headerBg: '#fef08a', text: '#000000', rowBg: '#fff2df' },
      { headerBg: '#e2e8f0', text: '#000000', rowBg: '#fff2df' },
      { headerBg: '#bfdbfe', text: '#000000', rowBg: '#fff2df' },
      { headerBg: '#bbf7d0', text: '#000000', rowBg: '#fff2df' },
      { headerBg: '#fed7aa', text: '#000000', rowBg: '#fff2df' }
    ];
    return fallbacks[idx % fallbacks.length];
  };

  // --- Calculate live category subtotals across all periods ---
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

  // --- Calculate live Grand Total for each period ---
  const grandTotalsByPeriod = useMemo(() => {
    const totals = {};
    let overallGrand = 0;
    periods.forEach(p => {
      let pSum = 0;
      categories.forEach(cat => {
        pSum += categorySubtotals[cat.category_id]?.[p.id] || 0;
      });
      totals[p.id] = pSum;
      overallGrand += pSum;
    });
    return { totals, overallGrand };
  }, [periods, categories, categorySubtotals]);

  // --- Handle inline description change ---
  const handleCostHeadNameChange = (costHeadId, newName) => {
    setEditedCostHeadNames(prev => ({
      ...prev,
      [costHeadId]: newName
    }));
  };

  // --- Handle inline category name change ---
  const handleCategoryNameChange = (categoryId, newName) => {
    setEditedCategoryNames(prev => ({
      ...prev,
      [categoryId]: newName
    }));
  };

  // --- Add a new row to a category ---
  const handleAddNewRow = (categoryId) => {
    const tempId = `temp_${Date.now()}`;
    setNewRowDrafts(prev => [
      ...prev,
      {
        temp_id: tempId,
        category_id: categoryId,
        name: 'New Transport Line Item',
        amounts: {}
      }
    ]);
  };

  // --- Discard draft row ---
  const handleRemoveDraftRow = (tempId) => {
    setNewRowDrafts(prev => prev.filter(r => r.temp_id !== tempId));
  };

  // --- Update amount in draft row ---
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

  // --- Master Save: Persists all text changes, descriptions, formulas, cell values, and census to DB ---
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

      // 5. Prepare transport census by period
      const transportCensusByPeriod = {};
      periods.forEach(p => {
        const pStr = String(p.id);
        if (transportCensusDraft[pStr]) {
          transportCensusByPeriod[p.id] = transportCensusDraft[pStr];
        }
      });

      const payload = {
        module: 'transport',
        updated_cost_heads: updatedCostHeads,
        updated_categories: updatedCategories,
        new_cost_heads: newCostHeads,
        entries_by_period: entriesByPeriod,
        transport_census_by_period: transportCensusByPeriod
      };

      const res = await fetch('/api/workstation/spreadsheet-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save transport spreadsheet');
      }

      const resData = await res.json();
      setLocalMessage({
        type: 'success',
        text: resData.message || 'Saved all transport spreadsheet rows, content descriptions, and values to database successfully!'
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

  // --- Transport Fleet Operational Census Metrics for Active Month ---
  const getTransportCensusMetrics = (periodId) => {
    const pStr = String(periodId);
    const d = transportCensusDraft[pStr] || {};

    const vehicles_count = d.vehicles_count !== undefined && d.vehicles_count !== '' ? String(d.vehicles_count) : '18+1';
    const passengers_count = num(d.passengers_count, 447);
    const students_count = num(d.students_count, 412);
    const staff_count = num(d.staff_count, 35);

    const approved_kms = num(d.approved_kms, 26691);
    const actual_kms = num(d.actual_kms, 25777);
    const additional_kms = num(d.additional_kms, 2481);
    const excess_kms_rps = num(d.excess_kms_rps, 0);

    const diesel_litres = num(d.diesel_litres, 5184.84);
    const fuel_expenses = num(d.fuel_expenses, 487375);

    const fee_demand = num(d.fee_demand, 12500000);
    const fee_collected = num(d.fee_collected, 8900000);
    const fee_unpaid = Math.max(0, fee_demand - fee_collected);

    const approved_budget = num(d.approved_budget, 13730137.73);
    const cumulative_budget_spent = num(d.cumulative_budget_spent, 6600000);
    const balance = approved_budget - cumulative_budget_spent;

    const service_tickets_raised = num(d.service_tickets_raised, 38);
    const service_tickets_closed = num(d.service_tickets_closed, 38);
    const service_tickets_open = Math.max(0, service_tickets_raised - service_tickets_closed);

    const incidents_count = num(d.incidents_count, 1);
    const statutory_compliance = num(d.statutory_compliance, 1);

    return {
      vehicles_count,
      passengers_count,
      students_count,
      staff_count,
      approved_kms,
      actual_kms,
      additional_kms,
      excess_kms_rps,
      diesel_litres,
      fuel_expenses,
      fee_demand,
      fee_collected,
      fee_unpaid,
      approved_budget,
      cumulative_budget_spent,
      balance,
      service_tickets_raised,
      service_tickets_closed,
      service_tickets_open,
      incidents_count,
      statutory_compliance
    };
  };

  const activeTransportMetrics = getTransportCensusMetrics(editingPeriodId);

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
            color: '#00a2e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}>
            <Bus size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, letterSpacing: '-0.01em', color: '#ffffff' }}>
                Transport Operations Master Spreadsheet
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                padding: '2px 8px',
                borderRadius: '12px',
                color: '#ffffff'
              }}>
                Excel Mode
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#e0f2fe' }}>
              Live multi-cycle matrix • Direct database persistence • Inline editable descriptions & formulas
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
            📊 Multi-Month Excel Grid
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
          <button
            type="button"
            onClick={() => setActiveSubTab('census')}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'census' ? '#00a2e8' : 'transparent',
              color: activeSubTab === 'census' ? '#ffffff' : '#64748b'
            }}
          >
            🚌 Fleet Assets & Mileage Census
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
          <strong>Total Fuel & Tolls:</strong> =SUM(Diesel + Toll) | <strong>Fleet Maintenance:</strong> =SUM(Repair + Spares + Ops) | <strong>Manpower:</strong> =SUM(Employees + Allowances) | <strong>Statutory:</strong> =SUM(FC + Insurance) | <strong>Total Expenses:</strong> =SUM(All Categories)
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
            {/* Table Header: Cyan matching user's Excel mockup */}
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
                                    disabled={isClosed}
                                    style={{
                                      width: '100%',
                                      textAlign: 'right',
                                      padding: '4px 6px',
                                      borderRadius: '4px',
                                      border: isSel ? '1.5px solid #00a2e8' : '1px solid #cbd5e1',
                                      backgroundColor: '#ffffff',
                                      fontWeight: '700',
                                      color: '#000000',
                                      fontSize: '12.5px'
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
                                disabled={isClosed}
                                style={{
                                  width: '100%',
                                  textAlign: 'right',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: '1.5px solid #00a2e8',
                                  backgroundColor: '#ffffff',
                                  fontWeight: '800',
                                  color: '#000000',
                                  fontSize: '13px'
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
                                placeholder="Enter transport item name..."
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

                    {/* CATEGORY SUBTOTAL ROW: Bright Lime Green matching Image 1 */}
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
                  Total Transport Expenses
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

      {/* 6. TRANSPORT FLEET ASSETS & MILEAGE CENSUS SUB-TAB */}
      {activeSubTab === 'census' && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bus size={18} color="#00a2e8" />
              <span>Transport Fleet Assets & Mileage Census ({activePeriodObj?.period_label})</span>
            </h3>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Key fleet metrics saved automatically when saving spreadsheet
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* Card 1: Fleet Size & Commuter Census */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={15} /> Fleet Size & Commuter Census
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Vehicles Count</label>
                  <input
                    type="text"
                    value={activeTransportMetrics.vehicles_count}
                    onChange={(e) => handleTransportCensusChange?.('vehicles_count', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Total Passengers</label>
                  <input
                    type="number"
                    value={activeTransportMetrics.passengers_count}
                    onChange={(e) => handleTransportCensusChange?.('passengers_count', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Students Count</label>
                  <input
                    type="number"
                    value={activeTransportMetrics.students_count}
                    onChange={(e) => handleTransportCensusChange?.('students_count', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Staff Count</label>
                  <input
                    type="number"
                    value={activeTransportMetrics.staff_count}
                    onChange={(e) => handleTransportCensusChange?.('staff_count', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Trip Mileage & Fuel Consumption */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Fuel size={15} /> Trip Mileage & Diesel Fuel
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Approved KMs</label>
                  <input
                    type="number"
                    value={activeTransportMetrics.approved_kms}
                    onChange={(e) => handleTransportCensusChange?.('approved_kms', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Actual Run KMs</label>
                  <input
                    type="number"
                    value={activeTransportMetrics.actual_kms}
                    onChange={(e) => handleTransportCensusChange?.('actual_kms', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Additional KMs</label>
                  <input
                    type="number"
                    value={activeTransportMetrics.additional_kms}
                    onChange={(e) => handleTransportCensusChange?.('additional_kms', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Diesel Litres</label>
                  <input
                    type="number"
                    step="0.01"
                    value={activeTransportMetrics.diesel_litres}
                    onChange={(e) => handleTransportCensusChange?.('diesel_litres', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Revenue, Passes & Operating Budget */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={15} /> Student Passes & Fleet Budget
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Pass Fee Demand (₹)</label>
                  <input
                    type="number"
                    value={activeTransportMetrics.fee_demand}
                    onChange={(e) => handleTransportCensusChange?.('fee_demand', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Pass Fee Collected (₹)</label>
                  <input
                    type="number"
                    value={activeTransportMetrics.fee_collected}
                    onChange={(e) => handleTransportCensusChange?.('fee_collected', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Approved Budget (₹)</label>
                  <input
                    type="number"
                    value={activeTransportMetrics.approved_budget}
                    onChange={(e) => handleTransportCensusChange?.('approved_budget', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Budget Spent (₹)</label>
                  <input
                    type="number"
                    value={activeTransportMetrics.cumulative_budget_spent}
                    onChange={(e) => handleTransportCensusChange?.('cumulative_budget_spent', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Service Tickets & Safety Compliance */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={15} /> Service Tickets & Safety Compliance
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Service Tickets Raised</label>
                  <input
                    type="number"
                    value={activeTransportMetrics.service_tickets_raised}
                    onChange={(e) => handleTransportCensusChange?.('service_tickets_raised', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Service Tickets Closed</label>
                  <input
                    type="number"
                    value={activeTransportMetrics.service_tickets_closed}
                    onChange={(e) => handleTransportCensusChange?.('service_tickets_closed', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Safety Incidents</label>
                  <input
                    type="number"
                    value={activeTransportMetrics.incidents_count}
                    onChange={(e) => handleTransportCensusChange?.('incidents_count', e.target.value, editingPeriodId)}
                    disabled={isClosed}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>Statutory Compliance</label>
                  <div style={{ padding: '6px 8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontWeight: '800', color: '#166534' }}>
                    100% Compliant
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
