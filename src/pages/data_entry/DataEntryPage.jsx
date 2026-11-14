import React from 'react';
import { formatINR } from '../../utils/formatters';
import { Plus } from 'lucide-react';
import MatrixTable from './MatrixTable';
import CostMixSidebar from './CostMixSidebar';
import AddMonthModal from './AddMonthModal';

export default function DataEntryPage({
  selectedModule = 'food',
  computedMatrix,
  editingPeriodId,
  setEditingPeriodId,
  activePeriodObj,
  matrixDraft,
  remarksDraft = {},
  censusDraft = {},
  handleCensusChange,
  hostelCensusDraft = {},
  transportCensusDraft = {},
  handleHostelCensusChange,
  handleTransportCensusChange,
  openAddCostHeadModal,
  handleDeleteCostHead,
  openAddCategoryModal,
  categoriesList = [],
  isDirty,
  handleCellChange,
  handleRemarkChange,
  handleCloneFromPrev,
  handleToggleLock,
  handleSaveActiveMonth,
  savingBatch,
  currentUser,
  entryMessage,
  showAddMonthModal,
  setShowAddMonthModal,
  newMonthForm,
  setNewMonthForm,
  handleStartDateChange,
  handleAddNewMonth
}) {
  if (!computedMatrix) return null;

  const moduleLabel = selectedModule === 'food' ? 'Food & Dining Operations' : selectedModule === 'hostel' ? 'Hostel Resident Operations' : 'Transport & Fleet Operations';
  const matrixTitle = selectedModule === 'food' ? 'Food & Dining Expense Matrix' : selectedModule === 'hostel' ? 'Hostel Operations & Expense Matrix' : 'Transport Fleet Operations & Expense Matrix';

  const periods = computedMatrix.periods || [];
  const currentIdx = periods.findIndex(p => p.id === editingPeriodId);
  const prevPeriod = currentIdx > 0 ? periods[currentIdx - 1] : null;

  // Active month total
  let editingTotal = 0;
  let prevTotal = 0;
  let grandTotal5Mo = 0;

  computedMatrix.categories?.forEach(cat => {
    cat.items?.forEach(it => {
      const draftVal = matrixDraft[it.cost_head_id]?.[editingPeriodId];
      const curVal = it.amounts?.[editingPeriodId];
      const numVal = draftVal !== undefined && draftVal !== '' ? parseFloat(draftVal) || 0 : (curVal || 0);
      editingTotal += numVal;

      if (prevPeriod) {
        prevTotal += it.amounts?.[prevPeriod.id] || 0;
      }
      grandTotal5Mo += it.total || 0;
    });
  });

  const monthlyAvg = periods.length > 0 ? grandTotal5Mo / periods.length : 0;
  const isClosed = !!activePeriodObj?.is_closed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          {/* Breadcrumbs */}
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
            Report / Data Entry / {moduleLabel}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              {matrixTitle}
            </h1>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 9px',
              borderRadius: '9999px',
              backgroundColor: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fef3c7',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>•</span>
              <span>Draft • {activePeriodObj?.period_label}</span>
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0 0' }}>
            Dynamically grouped from Master Data • Currency INR (₹) • FY 2026-2027
          </p>
        </div>

        {/* Action Buttons: Clone from Prev, Lock Month, Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCloneFromPrev}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            Clone from Prev
          </button>

          <button
            type="button"
            onClick={handleToggleLock}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            {isClosed ? 'Unlock Month' : 'Lock Month'}
          </button>

          <button
            type="button"
            onClick={handleSaveActiveMonth}
            disabled={savingBatch || isClosed}
            style={{
              padding: '7px 18px',
              borderRadius: '8px',
              backgroundColor: isClosed ? '#cbd5e1' : '#4f46e5',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '700',
              border: 'none',
              cursor: isClosed ? 'not-allowed' : 'pointer',
              boxShadow: isClosed ? 'none' : '0 2px 6px rgba(79, 70, 229, 0.3)'
            }}
          >
            {savingBatch ? 'Saving...' : `Save ${activePeriodObj?.period_label || 'Month'} (Ctrl+S)`}
          </button>
        </div>
      </div>

      {/* 2. MONTH SELECTOR PILL ROW */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {periods.map(p => {
            const isSelected = p.id === editingPeriodId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setEditingPeriodId(p.id)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: isSelected ? '800' : '600',
                  backgroundColor: isSelected ? '#ffffff' : '#f1f3f9',
                  color: isSelected ? '#4f46e5' : '#475569',
                  border: isSelected ? '1.5px solid #6366f1' : '1px solid transparent',
                  boxShadow: isSelected ? '0 2px 4px rgba(99, 102, 241, 0.15)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                {p.period_label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowAddMonthModal(true)}
            style={{
              padding: '5px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: '#ffffff',
              color: '#4f46e5',
              border: '1px solid #c7d2fe',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={13} />
            <span>Add Month</span>
          </button>
        </div>

        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
          Select month to edit • Subtotals update live
        </div>
      </div>

      {/* 3. TOP 4 KPI CARDS (IMAGE 2 STYLE) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '14px'
      }}>
        {/* Card 1: Editing Month Total */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#4f46e5' }} />
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
            {activePeriodObj?.period_label} Total (editing)
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0' }} className="currency-font">
            {formatINR(editingTotal)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {isDirty ? 'Pending unsaved edits' : (editingTotal > 0 ? 'Saved in ledger' : 'Blank draft • manual entry')}
          </div>
        </div>

        {/* Card 2: Previous Month Total */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#10b981' }} />
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
            {prevPeriod?.period_label || 'Previous'} Total
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0' }} className="currency-font">
            {formatINR(prevTotal || editingTotal)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Previous cycle
          </div>
        </div>

        {/* Card 3: 5-Month Total */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#f59e0b' }} />
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
            {periods.length > 0 ? `${periods.length}-Month Total` : 'All Cycles Total'}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0' }} className="currency-font">
            {formatINR(grandTotal5Mo)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {periods.length > 0 ? `${periods[0]?.period_label} – ${periods[periods.length - 1]?.period_label}` : 'No periods recorded in DB'}
          </div>
        </div>

        {/* Card 4: Monthly Average */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#ec4899' }} />
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
            Monthly Average
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0' }} className="currency-font">
            {formatINR(monthlyAvg)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {periods.length > 0 ? `Across ${periods.length} cycle${periods.length > 1 ? 's' : ''}` : '0 cycles'}
          </div>
        </div>
      </div>

      {entryMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          backgroundColor: entryMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: entryMessage.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${entryMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {entryMessage.text}
        </div>
      )}

      {/* 4. MAIN WORKSPACE: 2-COLUMN SPLIT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 280px',
        gap: '20px',
        alignItems: 'flex-start'
      }}>
        {/* Left Column: Category Blocks Table */}
        <div style={{ width: '100%', minWidth: 0 }}>
          <MatrixTable
            selectedModule={selectedModule}
            computedMatrix={computedMatrix}
            editingPeriodId={editingPeriodId}
            setEditingPeriodId={setEditingPeriodId}
            activePeriodObj={activePeriodObj}
            matrixDraft={matrixDraft}
            remarksDraft={remarksDraft}
            censusDraft={censusDraft}
            handleCensusChange={handleCensusChange}
            hostelCensusDraft={hostelCensusDraft}
            transportCensusDraft={transportCensusDraft}
            handleHostelCensusChange={handleHostelCensusChange}
            handleTransportCensusChange={handleTransportCensusChange}
            openAddCostHeadModal={openAddCostHeadModal}
            handleDeleteCostHead={handleDeleteCostHead}
            openAddCategoryModal={openAddCategoryModal}
            categoriesList={categoriesList}
            handleCellChange={handleCellChange}
            handleRemarkChange={handleRemarkChange}
            handleSaveActiveMonth={handleSaveActiveMonth}
            savingBatch={savingBatch}
            isDirty={isDirty}
          />
        </div>

        {/* Right Column: Cost Mix & Entry Status Sidebar */}
        <div style={{ width: '100%', minWidth: 0, position: 'sticky', top: '20px' }}>
          <CostMixSidebar
            computedMatrix={computedMatrix}
            editingPeriodId={editingPeriodId}
            activePeriodObj={activePeriodObj}
            isDirty={isDirty}
            handleSaveActiveMonth={handleSaveActiveMonth}
            savingBatch={savingBatch}
          />
        </div>
      </div>

      {/* MODAL: ADD NEW MONTH */}
      <AddMonthModal
        isOpen={showAddMonthModal}
        onClose={() => setShowAddMonthModal(false)}
        newMonthForm={newMonthForm}
        setNewMonthForm={setNewMonthForm}
        handleStartDateChange={handleStartDateChange}
        handleAddNewMonth={handleAddNewMonth}
      />

    </div>
  );
}
