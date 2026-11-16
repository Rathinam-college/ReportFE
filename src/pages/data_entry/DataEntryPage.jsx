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
  if (!computedMatrix) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
        minHeight: '380px'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: '3.5px solid #e0e7ff',
          borderTopColor: '#4f46e5',
          animation: 'spin 0.9s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <h3 style={{ fontSize: '16.5px', fontWeight: '700', color: '#1e293b', marginTop: '18px', marginBottom: '6px' }}>
          Loading Operational Data Entry...
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', textAlign: 'center' }}>
          Fetching monthly billing sheets and category balances for {selectedModule === 'food' ? 'Food & Dining' : selectedModule === 'hostel' ? 'Hostel' : 'Transport'}
        </p>
        {fetchData && (
          <button
            type="button"
            onClick={() => fetchData(selectedModule)}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Reload Sheet</span>
          </button>
        )}
      </div>
    );
  }

  const moduleLabel = selectedModule === 'food' ? 'Food & Dining Operations' : selectedModule === 'hostel' ? 'Hostel Resident Operations' : 'Transport & Fleet Operations';
  const matrixTitle = selectedModule === 'food' ? 'Food & Dining Expense Matrix' : selectedModule === 'hostel' ? 'Hostel Operations & Expense Matrix' : 'Transport Fleet Operations & Expense Matrix';

  const periods = computedMatrix.periods || [];
  const currentIdx = periods.findIndex(p => p.id === editingPeriodId);
  const prevPeriod = currentIdx > 0 ? periods[currentIdx - 1] : null;
  const isClosed = !!activePeriodObj?.is_closed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
      {/* Top Utility Bar (Lock & Clone actions) */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '8px'
      }}>
        <button
          type="button"
          onClick={handleCloneFromPrev}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#334155',
            fontSize: '12px',
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
            padding: '6px 14px',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#334155',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}
        >
          {isClosed ? 'Unlock Month' : 'Lock Month'}
        </button>
      </div>

      {entryMessage && (
        <div style={{
          padding: '10px 16px',
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
