import React, { useState, useEffect } from 'react';
import MonthlyAttachmentsModal from '../../components/attachments/MonthlyAttachmentsModal';
import { formatINR } from '../../utils/formatters';
import { Plus, Copy, Lock, Unlock, CheckCircle2, AlertTriangle, RefreshCw, Paperclip } from 'lucide-react';
import MatrixTable from './MatrixTable';
import AddMonthModal from './AddMonthModal';

export default function DataEntryPage({
  selectedModule = 'food',
  selectedBranch,
  onBranchChange,
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
  const currentPeriod = periods.find(p => p.id === editingPeriodId) || activePeriodObj;
  const isClosed = !!currentPeriod?.is_closed;

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
      
      {/* Sticky Top Utility Bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 70,
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #E1E6F2',
        padding: '14px 20px',
        boxShadow: '0 4px 18px rgba(20, 36, 92, 0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#14245C', margin: 0 }}>
            Data Entry
          </h1>
          <span style={{
            fontSize: '11.5px',
            fontWeight: '800',
            padding: '3px 10px',
            borderRadius: '9999px',
            backgroundColor: '#EAF0FF',
            color: '#2F4BB8',
            textTransform: 'capitalize'
          }}>
            {selectedModule === 'cctv' ? 'CCTV' : selectedModule === 'asset_audit' ? 'Asset Audit' : selectedModule}
          </span>
          {entryMessage?.type === 'success' && (
            <span style={{
              fontSize: '11.5px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '9999px',
              backgroundColor: '#E4F6EC',
              color: '#0F6B3A'
            }}>
              Saved
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Supporting Attachments & Documents Pill Button */}
        <button
          type="button"
          onClick={() => setShowAttachmentsModal(true)}
          style={{
            minHeight: '38px',
            padding: '7px 16px',
            borderRadius: '10px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #2F4BB8',
            color: '#2F4BB8',
            fontSize: '12.5px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          title="Upload or view bills, images, PDFs, spreadsheets, presentations, and links for this month"
        >
          <Paperclip size={14} color="#2F4BB8" />
          <span>Attachments and bills{attachmentCount > 0 ? ` (${attachmentCount})` : ''}</span>
        </button>
        <button
          type="button"
          onClick={handleCloneFromPrev}
          style={{
            minHeight: '38px',
            padding: '7px 16px',
            borderRadius: '10px',
            backgroundColor: '#ffffff',
            border: '1px solid #D5DCEE',
            color: '#14245C',
            fontSize: '12.5px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <Copy size={14} color="#64748b" />
          <span>Clone from prev</span>
        </button>

        <button
          type="button"
          onClick={() => handleToggleLock && handleToggleLock(editingPeriodId)}
          style={{
            minHeight: '38px',
            padding: '7px 16px',
            borderRadius: '10px',
            backgroundColor: isClosed ? '#FBE3E3' : '#ffffff',
            border: `1px solid ${isClosed ? '#FECACA' : '#D5DCEE'}`,
            color: isClosed ? '#A32626' : '#14245C',
            fontSize: '12.5px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          {isClosed ? <Unlock size={14} color="#A32626" /> : <Lock size={14} color="#64748b" />}
          <span>{isClosed ? 'Unlock month' : 'Lock month'}</span>
        </button>
        </div>
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
          selectedBranch={selectedBranch}
          onBranchChange={onBranchChange}
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

      {/* MODAL: MONTHLY ATTACHMENTS & BILLS (MULTI-FILE & PPT PREVIEW) */}
      {showAttachmentsModal && (
        <MonthlyAttachmentsModal
          isOpen={showAttachmentsModal}
          onClose={() => setShowAttachmentsModal(false)}
          module={selectedModule}
          periodId={editingPeriodId}
          periodLabel={currentPeriod?.period_label || 'Current Period'}
          periods={periods}
          currentUser={currentUser}
          onAttachmentCountChange={(count) => setAttachmentCount(count)}
        />
      )}

    </div>
  );
}
