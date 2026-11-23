import React, { useState } from 'react';
import { formatINR } from '../../../utils/formatters';
import { 
  Plus, Trash2, Lock, Unlock, Copy, Check, Save, RefreshCw, 
  CheckCircle2, AlertCircle, FileSpreadsheet, LayoutGrid, Table,
  Calculator, Users, Shield, Sparkles, Layers, MessageSquare, Wallet
} from 'lucide-react';

// Palette assigned in order, cycling if more
const CATEGORY_COLORS = [
  '#f59e0b', // amber
  '#64748b', // slate
  '#f97316', // orange
  '#0aa0e8', // blue
  '#10b981', // green
  '#eab308', // yellow
  '#6366f1'  // indigo
];

export default function FoodCardSpreadsheet({
  periods = [],
  categories = [],
  editingPeriodId,
  setEditingPeriodId,
  activePeriodObj,
  isClosed,
  // Draft & Value Helpers
  getCellAmount,
  categorySubtotals,
  grandTotalsByPeriod,
  isNonExpenseItem,
  // Inline Edits
  editedCostHeadNames = {},
  handleCostHeadNameChange,
  editedCategoryNames = {},
  handleCategoryNameChange,
  newRowDrafts = [],
  handleAddNewRow,
  handleRemoveDraftRow,
  handleDraftRowAmountChange,
  handleCellChange,
  handleDeleteCostHead,
  // Operational Remarks
  remarksDraft = {},
  handleRemarkChange,
  // Actions
  handleSaveAllSpreadsheetData,
  isSavingLocal,
  localMessage,
  openAddCategoryModal,
  handleCloneFromPrev,
  handleToggleLock,
  // View Switcher (allows toggling back to full Excel grid if needed)
  viewMode = 'cards',
  setViewMode
}) {
  const [focusedInputId, setFocusedInputId] = useState(null);
  const [openRemarkRows, setOpenRemarkRows] = useState({});

  const toggleRemarkRow = (costHeadId) => {
    setOpenRemarkRows((prev) => ({
      ...prev,
      [costHeadId]: !prev[costHeadId]
    }));
  };

  const currStr = String(editingPeriodId);
  const activePeriod = periods.find(p => String(p.id) === currStr) || activePeriodObj || periods[0];
  const activePeriodLabel = activePeriod?.period_label || 'Focus Month';

  // Calculate current month grand total and all-months grand total
  const focusMonthTotal = grandTotalsByPeriod?.totals?.[editingPeriodId] ?? 0;
  const allMonthsGrandTotal = grandTotalsByPeriod?.overallGrand ?? 0;

  // Split categories into standard expense categories and special categories (Person & Cost Per Person)
  const expenseCategories = [];
  let personCategory = null;
  let costPerPersonCategory = null;

  categories.forEach((cat, idx) => {
    const cName = String(cat.category_name || cat.name || '').toLowerCase();
    const isFormula = cat.category_type === 'FORMULA';

    if (cName.includes('cost per person') || cName.includes('cost/person') || (isFormula && cName.includes('person'))) {
      costPerPersonCategory = { ...cat, color: '#6366f1' };
    } else if (cName === 'person' || cName === 'persons' || cName.includes('census') || cName.includes('diners')) {
      personCategory = { ...cat, color: '#0aa0e8' };
    } else {
      const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
      expenseCategories.push({ ...cat, color });
    }
  });

  return (
    <div
      className="food-card-spreadsheet-container"
      style={{
        backgroundColor: 'var(--bg-page, #f3f6fb)',
        color: 'var(--text-main, #12182b)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
      {/* SUCCESS / ERROR FLOATING TOAST NOTIFICATION */}
      {localMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            backgroundColor: localMessage.type === 'success' ? '#10b981' : '#ef4444',
            color: '#ffffff',
            padding: '10px 22px',
            borderRadius: '9999px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '0.01em',
            animation: 'fadeInSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {localMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{localMessage.text}</span>
        </div>
      )}

      {/* 1. HEADER BANNER */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0aa0e8 0%, #0670c9 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(10, 160, 232, 0.22)'
        }}
      >
        {/* Title & Subtitle */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Food Operations Master Spreadsheet
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '800',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)'
              }}
            >
              Editable Cards
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.9)', margin: '4px 0 0 0' }}>
            Editable cards · edit names, values & formulas · direct DB save
          </p>
        </div>

        {/* Action Buttons: + Add Category & Save All Rows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {openAddCategoryModal && (
            <button
              type="button"
              onClick={openAddCategoryModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: '1.5px solid rgba(255, 255, 255, 0.5)',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            >
              <Plus size={14} />
              <span>+ Add Category</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAllSpreadsheetData}
            disabled={isSavingLocal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 22px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              color: '#0670c9',
              border: 'none',
              fontSize: '13px',
              fontWeight: '800',
              cursor: isSavingLocal ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => {
              if (!isSavingLocal) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.18)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.12)';
            }}
          >
            {isSavingLocal ? (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Save size={14} color="#0670c9" />
            )}
            <span>Save All Rows & Values to DB</span>
          </button>
        </div>
      </div>

      {/* 2. TOOLBAR ROW: Month Pills, Clone from Prev & Lock Month */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '4px 2px'
        }}
      >
        {/* Month Pills (Horizontally Scrollable) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            maxWidth: '100%',
            scrollbarWidth: 'none'
          }}
        >
          {periods.map((p) => {
            const isSel = String(p.id) === currStr;
            const pLocked = !!p.is_closed;

            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={isSel}
                onClick={() => setEditingPeriodId(p.id)}
                style={{
                  padding: '7px 18px',
                  borderRadius: '9999px',
                  fontSize: '12.5px',
                  fontWeight: isSel ? '800' : '600',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isSel ? '#0aa0e8' : 'var(--bg-pill, #e9eefb)',
                  color: isSel ? '#ffffff' : 'var(--text-muted, #66708f)',
                  boxShadow: isSel ? '0 4px 12px rgba(10, 160, 232, 0.35)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease'
                }}
              >
                <span>{p.period_label || p.period_code}</span>
                {isSel && <span style={{ fontSize: '11px', color: '#ffffff' }}>★</span>}
                {pLocked && <Lock size={12} color={isSel ? '#ffffff' : '#e11d48'} />}
              </button>
            );
          })}
        </div>

        {/* Right Toolbar Controls: Clone, Lock, and View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* View Mode Switcher Pill */}
          {setViewMode && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-pill, #e9eefb)',
                padding: '2px',
                borderRadius: '9999px',
                border: '1px solid var(--border-card, #e3e8f3)'
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'cards' ? '#0aa0e8' : 'transparent',
                  color: viewMode === 'cards' ? '#ffffff' : 'var(--text-muted, #66708f)',
                  fontSize: '11.5px',
                  fontWeight: viewMode === 'cards' ? '800' : '500',
                  boxShadow: viewMode === 'cards' ? '0 2px 6px rgba(10, 160, 232, 0.25)' : 'none'
                }}
              >
                <LayoutGrid size={12} />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('excel_grid')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'excel_grid' ? '#0aa0e8' : 'transparent',
                  color: viewMode === 'excel_grid' ? '#ffffff' : 'var(--text-muted, #66708f)',
                  fontSize: '11.5px',
                  fontWeight: viewMode === 'excel_grid' ? '800' : '500',
                  boxShadow: viewMode === 'excel_grid' ? '0 2px 6px rgba(10, 160, 232, 0.25)' : 'none'
                }}
              >
                <Table size={12} />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('budget')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'budget' ? '#4f46e5' : 'transparent',
                  color: viewMode === 'budget' ? '#ffffff' : 'var(--text-muted, #66708f)',
                  fontSize: '11.5px',
                  fontWeight: viewMode === 'budget' ? '800' : '500',
                  boxShadow: viewMode === 'budget' ? '0 2px 6px rgba(79, 70, 229, 0.25)' : 'none'
                }}
              >
                <Wallet size={12} />
                <span>Budget</span>
              </button>
            </div>
          )}

          {/* Clone from Prev Button */}
          {handleCloneFromPrev && (
            <button
              type="button"
              onClick={handleCloneFromPrev}
              disabled={isClosed}
              title={isClosed ? 'Month is locked. Unlock to clone.' : 'Clone all expenses from previous month'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-card, #e3e8f3)',
                color: isClosed ? 'var(--text-muted, #94a3b8)' : 'var(--text-main, #12182b)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: isClosed ? 'not-allowed' : 'pointer',
                opacity: isClosed ? 0.55 : 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              <Copy size={13} color="#0aa0e8" />
              <span>Clone from Prev</span>
            </button>
          )}

          {/* Lock / Unlock Month Button */}
          {handleToggleLock && (
            <button
              type="button"
              onClick={handleToggleLock}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: isClosed ? '#fff1f2' : 'var(--bg-card, #ffffff)',
                border: `1px solid ${isClosed ? '#fecdd3' : 'var(--border-card, #e3e8f3)'}`,
                color: isClosed ? '#e11d48' : 'var(--text-main, #12182b)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              {isClosed ? <Unlock size={13} color="#e11d48" /> : <Lock size={13} color="#0aa0e8" />}
              <span>{isClosed ? 'Unlock Month' : 'Lock Month'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. FORMULA BAR: Monospace strip with fx formula definitions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-card, #e3e8f3)',
          borderRadius: '12px',
          overflowX: 'auto',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: '900',
            fontSize: '13px',
            color: '#0aa0e8',
            backgroundColor: 'rgba(10, 160, 232, 0.1)',
            padding: '2px 8px',
            borderRadius: '6px'
          }}
        >
          ƒx
        </span>
        <div
          style={{
            fontFamily: "'SF Mono', Consolas, Menlo, Monaco, monospace",
            fontSize: '11.5px',
            color: 'var(--text-muted, #66708f)',
            whiteSpace: 'nowrap',
            flex: 1
          }}
        >
          <strong style={{ color: 'var(--text-main, #12182b)' }}>Total Food Expenses:</strong> =SUM(Food Material + Food Labour) &nbsp;|&nbsp; 
          <strong style={{ color: 'var(--text-main, #12182b)' }}>Total Maintenance:</strong> =SUM(FC Maintenance + Water + Vehicle) &nbsp;|&nbsp; 
          <strong style={{ color: 'var(--text-main, #12182b)' }}>Total Expenses:</strong> =SUM(All Categories) &nbsp;|&nbsp; 
          <strong style={{ color: 'var(--text-main, #12182b)' }}>Cost Per Person:</strong> Total Expenses / Total Person
        </div>
      </div>

      {/* 4. CATEGORY CARDS GRID: CSS grid repeat(auto-fill, minmax(340px, 1fr)), 14px gap */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '14px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Render Standard Expense Categories */}
        {expenseCategories.map((cat) => {
          const catId = cat.category_id || cat.id;
          const catItems = cat.items || [];
          const draftItems = newRowDrafts.filter(nr => nr.category_id === catId);
          const allItems = [...catItems, ...draftItems];

          // Subtotals for this category
          const focusMonthCatAmount = categorySubtotals[catId]?.[editingPeriodId] ?? 0;
          const allMonthsCatSpend = periods.reduce((sum, p) => sum + (categorySubtotals[catId]?.[p.id] || 0), 0);

          const catDisplayName = editedCategoryNames[catId] !== undefined
            ? editedCategoryNames[catId]
            : (cat.category_name || cat.name || '');

          return (
            <div
              key={catId}
              style={{
                backgroundColor: 'var(--bg-card, #ffffff)',
                borderRadius: '18px',
                border: '1px solid var(--border-card, #e3e8f3)',
                borderTop: `5px solid ${cat.color}`,
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                boxSizing: 'border-box',
                position: 'relative'
              }}
            >
              {/* Card Header: Inline-editable Category Name + Category Totals */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                  borderBottom: '1px solid var(--border-card, #e3e8f3)',
                  paddingBottom: '12px'
                }}
              >
                {/* Inline Editable Category Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    type="text"
                    value={catDisplayName}
                    onChange={(e) => handleCategoryNameChange(catId, e.target.value)}
                    disabled={isClosed}
                    aria-label={`Category Name: ${catDisplayName}`}
                    style={{
                      width: '100%',
                      fontSize: '15px',
                      fontWeight: '800',
                      color: 'var(--text-main, #12182b)',
                      backgroundColor: 'transparent',
                      border: '1px dashed transparent',
                      borderRadius: '6px',
                      padding: '2px 4px',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = cat.color}
                    onBlur={(e) => e.target.style.borderColor = 'transparent'}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)', paddingLeft: '4px' }}>
                    {cat.category_type === 'FORMULA' ? 'ƒx Formula Category' : `${allItems.length} Line Items`}
                  </div>
                </div>

                {/* Category Totals on Right */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      letterSpacing: '-0.02em',
                      color: 'var(--text-main, #12182b)'
                    }}
                  >
                    {formatINR(focusMonthCatAmount)}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted, #66708f)',
                      fontWeight: '600'
                    }}
                  >
                    Total spend {formatINR(allMonthsCatSpend)}
                  </div>
                </div>
              </div>

              {/* Line Item Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {catItems.map((item) => {
                  const itemCostHeadId = item.cost_head_id;
                  const itemAmount = getCellAmount(itemCostHeadId, editingPeriodId);

                  // Calculate item total across all periods
                  let itemAllMonthsTotal = 0;
                  periods.forEach((p) => {
                    itemAllMonthsTotal += getCellAmount(itemCostHeadId, p.id);
                  });

                  // Item share of category total for the focus month
                  const itemSharePct = focusMonthCatAmount > 0
                    ? Math.min(100, Math.max(0, (itemAmount / focusMonthCatAmount) * 100))
                    : 0;

                  const itemDisplayName = editedCostHeadNames[itemCostHeadId] !== undefined
                    ? editedCostHeadNames[itemCostHeadId]
                    : (item.description || item.name || '');

                  const isInputFocused = focusedInputId === itemCostHeadId;

                  // Resolve operational remark for this line item in the focus month
                  const currentRemark = remarksDraft[itemCostHeadId]?.[editingPeriodId] ??
                                        remarksDraft[itemCostHeadId]?.[String(editingPeriodId)] ??
                                        item.remarks?.[editingPeriodId] ??
                                        item.remarks?.[String(editingPeriodId)] ?? '';
                  const hasRemark = Boolean(currentRemark && typeof currentRemark === 'string' && currentRemark.trim().length > 0);
                  const isRemarkOpen = Boolean(openRemarkRows[itemCostHeadId]) || hasRemark;

                  return (
                    <div
                      key={itemCostHeadId}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        padding: '6px 8px',
                        borderRadius: '10px',
                        backgroundColor: isInputFocused ? 'rgba(10, 160, 232, 0.04)' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Row Inputs: Description, Focus Month Amount, Remark Toggle, and Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Inline Editable Description */}
                        <input
                          type="text"
                          value={itemDisplayName}
                          onChange={(e) => handleCostHeadNameChange(itemCostHeadId, e.target.value)}
                          disabled={isClosed}
                          aria-label={`Description for ${itemDisplayName}`}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: '12.5px',
                            fontWeight: '600',
                            color: 'var(--text-main, #12182b)',
                            backgroundColor: 'transparent',
                            border: '1px dashed transparent',
                            borderRadius: '6px',
                            padding: '4px 6px',
                            outline: 'none',
                            transition: 'border-color 0.15s ease'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#0aa0e8'}
                          onBlur={(e) => e.target.style.borderColor = 'transparent'}
                        />

                        {/* Numeric Input for Focus Month */}
                        <div style={{ position: 'relative', width: '135px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={itemAmount === 0 || itemAmount === null ? '' : itemAmount}
                            placeholder="—"
                            onChange={(e) => handleCellChange(itemCostHeadId, editingPeriodId, e.target.value)}
                            disabled={isClosed || cat.category_type === 'FORMULA'}
                            aria-label={`${itemDisplayName} Amount`}
                            onFocus={() => setFocusedInputId(itemCostHeadId)}
                            onBlur={() => setFocusedInputId(null)}
                            style={{
                              width: '100%',
                              textAlign: 'right',
                              fontSize: '13px',
                              fontWeight: '700',
                              fontVariantNumeric: 'tabular-nums',
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              padding: '6px 10px',
                              borderRadius: '10px',
                              border: isInputFocused ? '2px solid #0aa0e8' : '1px solid var(--border-card, #e3e8f3)',
                              backgroundColor: cat.category_type === 'FORMULA' ? '#f0fdf4' : 'var(--bg-card, #ffffff)',
                              color: cat.category_type === 'FORMULA' ? '#15803d' : 'var(--text-main, #12182b)',
                              opacity: isClosed ? 0.55 : 1,
                              outline: 'none',
                              boxSizing: 'border-box',
                              transition: 'all 0.15s ease'
                            }}
                          />
                        </div>

                        {/* 💬 Remark Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleRemarkRow(itemCostHeadId)}
                          title={hasRemark ? `Operational note: "${currentRemark}" (click to view/edit)` : `Add operational remark / note for ${activePeriodLabel}`}
                          aria-label={`Note for ${itemDisplayName}`}
                          style={{
                            background: hasRemark ? '#fffbeb' : 'transparent',
                            border: hasRemark ? '1px solid #fde68a' : '1px solid transparent',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            padding: '5px 7px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: hasRemark ? '#b45309' : 'var(--text-muted, #94a3b8)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!hasRemark) {
                              e.currentTarget.style.color = '#0aa0e8';
                              e.currentTarget.style.backgroundColor = 'rgba(10, 160, 232, 0.08)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!hasRemark) {
                              e.currentTarget.style.color = 'var(--text-muted, #94a3b8)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <MessageSquare size={13} fill={hasRemark ? '#f59e0b' : 'none'} />
                          {hasRemark && (
                            <span style={{ fontSize: '10px', fontWeight: '800', lineHeight: 1 }}>
                              Note
                            </span>
                          )}
                        </button>

                        {/* ✕ Delete Button */}
                        {handleDeleteCostHead && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCostHead({ id: itemCostHeadId, name: item.description })}
                            disabled={isClosed}
                            title={`Delete ${itemDisplayName}`}
                            aria-label={`Delete ${itemDisplayName}`}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: isClosed ? 'not-allowed' : 'pointer',
                              color: 'var(--text-muted, #94a3b8)',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              opacity: isClosed ? 0.35 : 1,
                              transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isClosed) e.currentTarget.style.color = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-muted, #94a3b8)';
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Inline Operational Remark Box */}
                      {isRemarkOpen && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            padding: '4px 9px',
                            borderRadius: '8px',
                            backgroundColor: hasRemark ? '#fffdf5' : '#f8fafc',
                            border: hasRemark ? '1px solid #fde68a' : '1px dashed #cbd5e1',
                            marginTop: '2px',
                            marginBottom: '2px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontSize: '11px', flexShrink: 0 }} title="Operational Note">💬</span>
                          <span style={{ fontSize: '10.5px', fontWeight: '700', color: hasRemark ? '#b45309' : '#64748b', whiteSpace: 'nowrap' }}>
                            {activePeriodLabel} Note:
                          </span>
                          <input
                            type="text"
                            value={currentRemark}
                            onChange={(e) => handleRemarkChange && handleRemarkChange(itemCostHeadId, editingPeriodId, e.target.value)}
                            disabled={isClosed}
                            placeholder="Add remark / comment (e.g. Festival advance, price revision)..."
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: '11.5px',
                              fontWeight: '500',
                              color: hasRemark ? '#78350f' : '#1e293b',
                              backgroundColor: 'transparent',
                              border: 'none',
                              outline: 'none'
                            }}
                          />
                          {hasRemark ? (
                            <button
                              type="button"
                              onClick={() => handleRemarkChange && handleRemarkChange(itemCostHeadId, editingPeriodId, '')}
                              disabled={isClosed}
                              title="Clear note"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: isClosed ? 'not-allowed' : 'pointer',
                                color: '#d97706',
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '2px 4px',
                                borderRadius: '4px'
                              }}
                            >
                              ✕
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setOpenRemarkRows((prev) => ({ ...prev, [itemCostHeadId]: false }))}
                              title="Close note"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                fontSize: '11px',
                                padding: '2px 4px'
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}

                      {/* Under Row: Thin Share Bar + All-Months Total Spend */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '6px', paddingRight: '22px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '5px',
                            backgroundColor: 'var(--bg-pill, #e9eefb)',
                            borderRadius: '9999px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: `${itemSharePct}%`,
                              height: '100%',
                              backgroundColor: cat.color,
                              borderRadius: '9999px',
                              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '10.5px',
                            color: 'var(--text-muted, #66708f)',
                            whiteSpace: 'nowrap',
                            fontWeight: '600'
                          }}
                        >
                          Σ {formatINR(itemAllMonthsTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Render Draft Rows Added in This Category */}
                {draftItems.map((nr) => {
                  const nrAmount = parseFloat(nr.amounts?.[editingPeriodId] || 0) || 0;
                  let nrAllTotal = 0;
                  periods.forEach((p) => {
                    nrAllTotal += parseFloat(nr.amounts?.[p.id] || 0) || 0;
                  });
                  const nrSharePct = focusMonthCatAmount > 0
                    ? Math.min(100, Math.max(0, (nrAmount / focusMonthCatAmount) * 100))
                    : 0;

                  return (
                    <div
                      key={nr.temp_id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        padding: '6px 8px',
                        borderRadius: '10px',
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          value={nr.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (handleDraftRowAmountChange) {
                              handleDraftRowAmountChange(nr.temp_id, 'name', val);
                            }
                          }}
                          placeholder="New row name..."
                          style={{
                            flex: 1,
                            fontSize: '12.5px',
                            fontWeight: '700',
                            backgroundColor: '#ffffff',
                            border: '1px solid #eab308',
                            borderRadius: '6px',
                            padding: '4px 6px',
                            outline: 'none'
                          }}
                        />

                        <div style={{ position: 'relative', width: '135px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={nr.amounts?.[editingPeriodId] || ''}
                            placeholder="0.00"
                            onChange={(e) => handleDraftRowAmountChange(nr.temp_id, editingPeriodId, e.target.value)}
                            style={{
                              width: '100%',
                              textAlign: 'right',
                              fontSize: '13px',
                              fontWeight: '700',
                              fontVariantNumeric: 'tabular-nums',
                              padding: '6px 10px',
                              borderRadius: '10px',
                              border: '1.5px solid #eab308',
                              backgroundColor: '#ffffff',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDraftRow(nr.temp_id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            padding: '4px'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '6px', paddingRight: '22px' }}>
                        <div style={{ flex: 1, height: '5px', backgroundColor: '#fef3c7', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ width: `${nrSharePct}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '9999px' }} />
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#b45309', whiteSpace: 'nowrap', fontWeight: '600' }}>
                          Σ {formatINR(nrAllTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* + Add Row Dashed Button */}
              {cat.category_type !== 'FORMULA' && (
                <button
                  type="button"
                  onClick={() => handleAddNewRow(catId)}
                  disabled={isClosed}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    border: '1.5px dashed var(--border-card, #cbd5e1)',
                    color: 'var(--text-muted, #66708f)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: isClosed ? 'not-allowed' : 'pointer',
                    opacity: isClosed ? 0.45 : 1,
                    transition: 'all 0.15s ease',
                    marginTop: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isClosed) {
                      e.currentTarget.style.borderColor = cat.color;
                      e.currentTarget.style.color = cat.color;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-card, #cbd5e1)';
                    e.currentTarget.style.color = 'var(--text-muted, #66708f)';
                  }}
                >
                  <Plus size={13} />
                  <span>+ Add Row</span>
                </button>
              )}
            </div>
          );
        })}

        {/* 5. SPECIAL CATEGORY 1: PERSONS CARD (Counts, No ₹, Excluded from Money Grand Total) */}
        {personCategory && (
          <div
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              borderRadius: '18px',
              border: '1px solid var(--border-card, #e3e8f3)',
              borderTop: '5px solid #0aa0e8',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
              boxSizing: 'border-box'
            }}
          >
            {/* Person Card Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-card, #e3e8f3)',
                paddingBottom: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(10, 160, 232, 0.1)',
                    color: '#0aa0e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Users size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-main, #12182b)' }}>
                    Person
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted, #66708f)' }}>
                    Counts Only · Excluded from Total Expenses
                  </span>
                </div>
              </div>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7'
                }}
              >
                Headcount
              </span>
            </div>

            {/* Person Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(personCategory.items || []).map((pItem) => {
                const countVal = getCellAmount(pItem.cost_head_id, editingPeriodId);
                const pName = editedCostHeadNames[pItem.cost_head_id] !== undefined
                  ? editedCostHeadNames[pItem.cost_head_id]
                  : (pItem.description || pItem.name || '');

                return (
                  <div
                    key={pItem.cost_head_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-pill, #e9eefb)',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #12182b)' }}>
                      {pName}
                    </span>
                    <input
                      type="number"
                      value={countVal || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(pItem.cost_head_id, editingPeriodId, e.target.value)}
                      disabled={isClosed}
                      style={{
                        width: '100px',
                        textAlign: 'right',
                        fontSize: '13.5px',
                        fontWeight: '800',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-card, #e3e8f3)',
                        backgroundColor: '#ffffff',
                        color: '#0284c7',
                        outline: 'none'
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. SPECIAL CATEGORY 2: COST PER PERSON CARD (ƒx FORMULA) */}
        {costPerPersonCategory && (
          <div
            style={{
              backgroundColor: '#1e1b4b',
              color: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #312e81',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 8px 24px rgba(49, 46, 129, 0.25)',
              boxSizing: 'border-box'
            }}
          >
            {/* Header: fx FORMULA badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a5b4fc'
                  }}
                >
                  <Calculator size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                    Cost Per Person
                  </h3>
                  <span style={{ fontSize: '11px', color: '#c7d2fe' }}>
                    Unit Economic Metric
                  </span>
                </div>
              </div>

              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: '800',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#4338ca',
                  color: '#e0e7ff',
                  border: '1px solid #6366f1',
                  letterSpacing: '0.04em'
                }}
              >
                ƒx FORMULA
              </span>
            </div>

            {/* Calculated Metric Display */}
            <div>
              <div style={{ fontSize: '30px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>
                {formatINR(categorySubtotals[costPerPersonCategory.category_id]?.[editingPeriodId] ?? 0)}
              </div>
              <div style={{ fontSize: '12px', color: '#a5b4fc', marginTop: '4px' }}>
                Computed live for {activePeriodLabel} • Read-Only
              </div>
            </div>

            {/* Formula Expression Details */}
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '8px 12px',
                borderRadius: '8px',
                color: '#e0e7ff',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              Formula: =Total Expenses / Total Person
            </div>
          </div>
        )}
      </div>

      {/* 6. STICKY BOTTOM BAR (Dark #0b1f2e, White Text, Safe-Area Insets) */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 100,
          backgroundColor: '#0b1f2e',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '16px 24px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.25)',
          marginTop: '12px'
        }}
      >
        {/* Left: Total Expenses for Focus Month */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Total Expenses · {activePeriodLabel}:
          </span>
          <span style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>
            {formatINR(focusMonthTotal)}
          </span>
        </div>

        {/* Right: All Months Grand Total */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#94a3b8' }}>
            All months cumulative:
          </span>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8' }}>
            {formatINR(allMonthsGrandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
