import React from 'react';
import { formatINR } from '../../utils/formatters';
import { 
  MessageSquare, Users, Utensils, Award, Trash2, Plus, 
  Home, Bus, Fuel, Droplet, Zap, Wrench, ShieldCheck, CheckCircle2, BedDouble, AlertCircle 
} from 'lucide-react';
import HostelSpreadsheetEntry from './HostelSpreadsheetEntry';
import TransportSpreadsheetEntry from './TransportSpreadsheetEntry';
import FoodSpreadsheetEntry from './FoodSpreadsheetEntry';
import CctvSpreadsheetEntry from './CctvSpreadsheetEntry';
import AuditSpreadsheetEntry from './AuditSpreadsheetEntry';
import PurchaseSpreadsheetEntry from './PurchaseSpreadsheetEntry';
import StoreSpreadsheetEntry from './StoreSpreadsheetEntry';
import AssetAuditSpreadsheetEntry from './AssetAuditSpreadsheetEntry';

export default function MatrixTable({
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
  hostelCensusDraft = {},
  transportCensusDraft = {},
  handleCellChange,
  handleRemarkChange,
  handleCensusChange,
  handleHostelCensusChange,
  handleTransportCensusChange,
  openAddCostHeadModal,
  handleDeleteCostHead,
  openAddCategoryModal,
  categoriesList = [],
  handleSaveActiveMonth,
  savingBatch,
  isDirty,
  fetchData,
  handleCloneFromPrev,
  handleToggleLock
}) {
  if (!computedMatrix || !computedMatrix.categories) return null;

  const periods = computedMatrix.periods || [];
  const currentIdx = periods.findIndex(p => p.id === editingPeriodId);
  const prevPeriod = currentIdx > 0 ? periods[currentIdx - 1] : null;

  // Census / Headcount Calculations
  const currStr = String(editingPeriodId);
  const prevStr = prevPeriod ? String(prevPeriod.id) : null;

  const currStudents = censusDraft?.students?.[currStr] !== undefined && censusDraft?.students?.[currStr] !== null ? censusDraft.students[currStr] : '';
  const currStaff = censusDraft?.staff?.[currStr] !== undefined && censusDraft?.staff?.[currStr] !== null ? censusDraft.staff[currStr] : '';
  const currOthers = censusDraft?.others?.[currStr] !== undefined && censusDraft?.others?.[currStr] !== null ? censusDraft.others[currStr] : '';
  const currProduction = censusDraft?.production?.[currStr] !== undefined && censusDraft?.production?.[currStr] !== null ? censusDraft.production[currStr] : '';

  const sCountNum = parseInt(currStudents, 10) || 0;
  const stCountNum = parseInt(currStaff, 10) || 0;
  const oCountNum = parseInt(currOthers, 10) || 0;
  const currTotalPersons = sCountNum + stCountNum + oCountNum;
  const prodCountNum = parseInt(currProduction, 10) || 0;

  // Previous period values for comparison
  const prevStudents = prevStr ? (parseInt(censusDraft?.students?.[prevStr], 10) || 0) : null;
  const prevStaff = prevStr ? (parseInt(censusDraft?.staff?.[prevStr], 10) || 0) : null;
  const prevOthers = prevStr ? (parseInt(censusDraft?.others?.[prevStr], 10) || 0) : null;
  const prevTotalPersons = prevStr ? ((prevStudents || 0) + (prevStaff || 0) + (prevOthers || 0)) : null;
  const prevProduction = prevStr ? (parseInt(censusDraft?.production?.[prevStr], 10) || 0) : null;

  // Average calculations across periods
  const numP = periods.length || 1;
  let sumStudentsAll = 0, sumStaffAll = 0, sumOthersAll = 0, sumProdAll = 0;
  periods.forEach(p => {
    const pStr = String(p.id);
    sumStudentsAll += parseInt(censusDraft?.students?.[pStr], 10) || 0;
    sumStaffAll += parseInt(censusDraft?.staff?.[pStr], 10) || 0;
    sumOthersAll += parseInt(censusDraft?.others?.[pStr], 10) || 0;
    sumProdAll += parseInt(censusDraft?.production?.[pStr], 10) || 0;
  });
  const avgStudents = Math.round(sumStudentsAll / numP);
  const avgStaff = Math.round(sumStaffAll / numP);
  const avgOthers = Math.round(sumOthersAll / numP);
  const avgPersons = Math.round((sumStudentsAll + sumStaffAll + sumOthersAll) / numP);
  const avgProd = Math.round(sumProdAll / numP);

  // Helper for MoM comparison badge
  const renderDiffBadge = (curr, prev) => {
    if (prev === null || prev === undefined) return <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>;
    const c = parseInt(curr, 10) || 0;
    const p = parseInt(prev, 10) || 0;
    const diff = c - p;
    if (diff === 0) return <span style={{ color: '#64748b', fontSize: '11.5px', fontWeight: '600' }}>0 (0.0%)</span>;
    const pct = p > 0 ? ((diff / p) * 100).toFixed(1) : '100.0';
    const isPos = diff > 0;
    return (
      <span style={{
        fontSize: '11px',
        fontWeight: '700',
        color: isPos ? '#166534' : '#991b1b',
        backgroundColor: isPos ? '#f0fdf4' : '#fef2f2',
        padding: '2px 7px',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px'
      }}>
        {isPos ? `+${diff.toLocaleString()}` : diff.toLocaleString()} ({isPos ? `+${pct}%` : `${pct}%`})
      </span>
    );
  };

  // Active month food spend subtotal for unit metric comparison
  const totalFoodSpend = computedMatrix.categories.reduce((acc, cat) => acc + (cat.subtotal?.amounts?.[editingPeriodId] || 0), 0);

  // Category Color Map
  const getCategoryTheme = (idx) => {
    const themes = [
      { dot: '#6366f1', badgeBg: '#eef2ff', badgeText: '#4338ca' }, // Food Material (Purple)
      { dot: '#10b981', badgeBg: '#ecfdf5', badgeText: '#047857' }, // Food Labour (Green)
      { dot: '#f59e0b', badgeBg: '#fffbeb', badgeText: '#b45309' }, // FC Maintenance (Amber)
      { dot: '#ec4899', badgeBg: '#fdf2f8', badgeText: '#be185d' }, // Events (Pink)
      { dot: '#8b5cf6', badgeBg: '#f5f3ff', badgeText: '#6d28d9' }  // Festival (Violet)
    ];
    return themes[idx % themes.length];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>

      {/* 3. HOSTEL RESIDENT CENSUS, OPERATIONAL TEMPLATE & UTILITIES (from hostel.xlsx & image templates) */}
      {selectedModule === 'hostel' && (
        <HostelSpreadsheetEntry
          activePeriodObj={activePeriodObj}
          computedMatrix={computedMatrix}
          editingPeriodId={editingPeriodId}
          setEditingPeriodId={setEditingPeriodId}
          matrixDraft={matrixDraft}
          remarksDraft={remarksDraft}
          hostelCensusDraft={hostelCensusDraft}
          handleCellChange={handleCellChange}
          handleRemarkChange={handleRemarkChange}
          handleHostelCensusChange={handleHostelCensusChange}
          handleSaveActiveMonth={handleSaveActiveMonth}
          savingBatch={savingBatch}
          isDirty={isDirty}
          fetchData={fetchData}
          openAddCostHeadModal={openAddCostHeadModal}
          handleDeleteCostHead={handleDeleteCostHead}
          openAddCategoryModal={openAddCategoryModal}
          handleCloneFromPrev={handleCloneFromPrev}
          handleToggleLock={handleToggleLock}
        />
      )}

      {/* 4. TRANSPORT FLEET OPERATIONS & SPREADSHEET (from transport.xlsx) */}
      {selectedModule === 'transport' && (
        <TransportSpreadsheetEntry
          activePeriodObj={activePeriodObj}
          computedMatrix={computedMatrix}
          editingPeriodId={editingPeriodId}
          setEditingPeriodId={setEditingPeriodId}
          selectedBranch={selectedBranch}
          onBranchChange={onBranchChange}
          matrixDraft={matrixDraft}
          remarksDraft={remarksDraft}
          transportCensusDraft={transportCensusDraft}
          handleCellChange={handleCellChange}
          handleRemarkChange={handleRemarkChange}
          handleTransportCensusChange={handleTransportCensusChange}
          handleSaveActiveMonth={handleSaveActiveMonth}
          savingBatch={savingBatch}
          isDirty={isDirty}
          fetchData={fetchData}
          openAddCostHeadModal={openAddCostHeadModal}
          handleDeleteCostHead={handleDeleteCostHead}
          openAddCategoryModal={openAddCategoryModal}
          handleCloneFromPrev={handleCloneFromPrev}
          handleToggleLock={handleToggleLock}
        />
      )}

      {/* 5. CCTV OPERATIONS & SURVEILLANCE SPREADSHEET */}
      {selectedModule === 'cctv' && (
        <CctvSpreadsheetEntry
          activePeriodObj={activePeriodObj}
          computedMatrix={computedMatrix}
          editingPeriodId={editingPeriodId}
          setEditingPeriodId={setEditingPeriodId}
          fetchData={fetchData}
        />
      )}

      {/* 6. AUDIT OPERATIONS & COMPLIANCE SPREADSHEET */}
      {selectedModule === 'audit' && (
        <AuditSpreadsheetEntry
          activePeriodObj={activePeriodObj}
          computedMatrix={computedMatrix}
          editingPeriodId={editingPeriodId}
          setEditingPeriodId={setEditingPeriodId}
          fetchData={fetchData}
        />
      )}

      {/* 7. PURCHASE OPERATIONS & PROCUREMENT SPREADSHEET */}
      {selectedModule === 'purchase' && (
        <PurchaseSpreadsheetEntry
          activePeriodObj={activePeriodObj}
          computedMatrix={computedMatrix}
          editingPeriodId={editingPeriodId}
          setEditingPeriodId={setEditingPeriodId}
          fetchData={fetchData}
        />
      )}

      {/* 8. STORE OPERATIONS & INVENTORY SPREADSHEET */}
      {selectedModule === 'store' && (
        <StoreSpreadsheetEntry
          activePeriodObj={activePeriodObj}
          computedMatrix={computedMatrix}
          editingPeriodId={editingPeriodId}
          setEditingPeriodId={setEditingPeriodId}
          fetchData={fetchData}
        />
      )}

      {/* 9. ASSET AUDIT & VERIFICATION SPREADSHEET */}
      {selectedModule === 'asset_audit' && (
        <AssetAuditSpreadsheetEntry
          activePeriodObj={activePeriodObj}
          computedMatrix={computedMatrix}
          editingPeriodId={editingPeriodId}
          setEditingPeriodId={setEditingPeriodId}
          fetchData={fetchData}
        />
      )}
    {/* 2. FOOD OPERATIONS SPREADSHEET (from user's Excel mockup image) */}
      {selectedModule === 'food' && (
        <FoodSpreadsheetEntry
          activePeriodObj={activePeriodObj}
          computedMatrix={computedMatrix}
          editingPeriodId={editingPeriodId}
          setEditingPeriodId={setEditingPeriodId}
          matrixDraft={matrixDraft}
          remarksDraft={remarksDraft}
          censusDraft={censusDraft}
          handleCellChange={handleCellChange}
          handleRemarkChange={handleRemarkChange}
          handleCensusChange={handleCensusChange}
          handleSaveActiveMonth={handleSaveActiveMonth}
          savingBatch={savingBatch}
          isDirty={isDirty}
          fetchData={fetchData}
          openAddCostHeadModal={openAddCostHeadModal}
          handleDeleteCostHead={handleDeleteCostHead}
          openAddCategoryModal={openAddCategoryModal}
          handleCloneFromPrev={handleCloneFromPrev}
          handleToggleLock={handleToggleLock}
        />
      )}
    </div>
  );
}
