import React, { useState, useEffect } from 'react';
import MonthlyAttachmentsModal from '../../components/attachments/MonthlyAttachmentsModal';
import { formatINR } from '../../utils/formatters';
import { Plus, Copy, Lock, Unlock, CheckCircle2, AlertTriangle, RefreshCw, Paperclip } from 'lucide-react';
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
          Fetching monthly billing sheets and category balances for {selectedModule === 'food' ? 'Food' : selectedModule === 'hostel' ? 'Hostel' : 'Transport'}
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

  const moduleLabel = selectedModule === 'food' ? 'Food Operations' : selectedModule === 'hostel' ? 'Hostel Resident Operations' : 'Transport & Fleet Operations';
  const matrixTitle = selectedModule === 'food' ? 'Food Expense Matrix' : selectedModule === 'hostel' ? 'Hostel Operations & Expense Matrix' : 'Transport Fleet Operations & Expense Matrix';

  const periods = computedMatrix.periods || [];
  const currentIdx = periods.findIndex(p => p.id === editingPeriodId);
  const prevPeriod = currentIdx > 0 ? periods[currentIdx - 1] : null;
  const isClosed = !!activePeriodObj?.is_closed;

  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [attachmentCount, setAttachmentCount] = useState(0);

  useEffect(() => {
    if (editingPeriodId && selectedModule) {
      fetch(`/api/attachments/summary?module=${selectedModule}`)
        .then(res => res.json())
        .then(d => {
          const count = d?.summary?.[String(editingPeriodId)] || 0;
          setAttachmentCount(count);
        })
        .catch(err => console.warn('Attachment summary fetch notice:', err));
    }
  }, [editingPeriodId, selectedModule]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Top Utility Bar (Lock & Clone actions - Images 2 & 5 Pill Style) */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '10px'
      }}>
        {/* Supporting Attachments & Documents Pill Button */}
        <button
          type="button"
          onClick={() => setShowAttachmentsModal(true)}
          style={{
            padding: '7px 16px',
            borderRadius: '9999px',
            backgroundColor: attachmentCount > 0 ? '#eff6ff' : '#ffffff',
            border: `1.5px solid ${attachmentCount > 0 ? '#3b82f6' : '#cbd5e1'}`,
            color: attachmentCount > 0 ? '#1d4ed8' : '#334155',
            fontSize: '12.5px',
            fontWeight: '750',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = attachmentCount > 0 ? '#dbeafe' : '#f8fafc'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = attachmentCount > 0 ? '#eff6ff' : '#ffffff'}
          title="Upload or view bills, images, PDFs, spreadsheets, presentations, and links for this month"
        >
          <Paperclip size={13} color={attachmentCount > 0 ? '#2563eb' : '#64748b'} />
          <span>Attachments & Bills</span>
          {attachmentCount > 0 && (
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: '900',
                padding: '1px 7px',
                borderRadius: '9999px',
                backgroundColor: '#2563eb',
                color: '#ffffff'
              }}
            >
              {attachmentCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={handleCloneFromPrev}
          style={{
            padding: '7px 16px',
            borderRadius: '9999px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#334155',
            fontSize: '12.5px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
        >
          <Copy size={13} color="#64748b" />
          <span>Clone from Prev</span>
        </button>

        <button
          type="button"
          onClick={handleToggleLock}
          style={{
            padding: '7px 16px',
            borderRadius: '9999px',
            backgroundColor: isClosed ? '#fef2f2' : '#ffffff',
            border: `1px solid ${isClosed ? '#fecaca' : '#cbd5e1'}`,
            color: isClosed ? '#dc2626' : '#334155',
            fontSize: '12.5px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {isClosed ? <Unlock size={13} color="#dc2626" /> : <Lock size={13} color="#64748b" />}
          <span>{isClosed ? 'Unlock Month' : 'Lock Month'}</span>
        </button>
      </div>

      {entryMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '14px',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: entryMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: entryMessage.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${entryMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          {entryMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{entryMessage.text}</span>
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
          handleCloneFromPrev={handleCloneFromPrev}
          handleToggleLock={handleToggleLock}
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
        moduleName={selectedModule === 'food' ? 'Food' : selectedModule === 'hostel' ? 'Hostel' : 'Transport'}
      />

    </div>
  );
}
