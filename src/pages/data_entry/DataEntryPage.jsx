import React from 'react';
import { formatINR } from '../../utils/formatters';
import { Plus } from 'lucide-react';
import MatrixTable from './MatrixTable';
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
  handleAddNewMonth,
  fetchData
}) {
  if (!computedMatrix) return null;

  const moduleLabel = selectedModule === 'food' ? 'Food & Dining Operations' : selectedModule === 'hostel' ? 'Hostel Resident Operations' : 'Transport & Fleet Operations';
  const matrixTitle = selectedModule === 'food' ? 'Food & Dining Expense Matrix' : selectedModule === 'hostel' ? 'Hostel Operations & Expense Matrix' : 'Transport Fleet Operations & Expense Matrix';

  const periods = computedMatrix.periods || [];
  const currentIdx = periods.findIndex(p => p.id === editingPeriodId);
  const prevPeriod = currentIdx > 0 ? periods[currentIdx - 1] : null;
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

      {/* 3. MASTER DATA SPREADSHEET (FULL WIDTH FIT TO SCREEN) */}
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
          fetchData={fetchData}
        />
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
