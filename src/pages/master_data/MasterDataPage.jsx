import React, { useState } from 'react';
import { SlidersHorizontal, Calendar, CheckCircle2, AlertTriangle, Calculator } from 'lucide-react';
import CostHeadsManager from './CostHeadsManager';
import PeriodsManager from './PeriodsManager';
import EditPeriodModal from './EditPeriodModal';
import AddMonthModal from '../data_entry/AddMonthModal';
import AddCategoryModal from './AddCategoryModal';
import ManageCategoriesModal from './ManageCategoriesModal';
import MasterMathTools from './MasterMathTools';

export default function MasterDataPage({
  masterFoodView,
  setMasterFoodView,
  costHeadsList,
  categoriesList,
  computedMatrix,
  masterMessage,
  // Cost heads drag & edit props
  draggedIdx,
  dragOverIdx,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  handleDrop,
  handleMoveStep,
  openAddCostHeadModal,
  openEditCostHeadModal,
  handleDeleteCostHead,
  handleBatchDeleteCostHeads,
  showCostHeadModal,
  setShowCostHeadModal,
  editingCostHead,
  costHeadForm,
  setCostHeadForm,
  handleSaveCostHead,
  // Category props
  showAddCategoryModal,
  setShowAddCategoryModal,
  openAddCategoryModal,
  handleAddCategory,
  showManageCategoriesModal,
  setShowManageCategoriesModal,
  openManageCategoriesModal,
  handleUpdateCategory,
  handleDeleteCategory,
  handleBatchDeleteCategories,
  handleReorderCategories,
  // Periods props
  openEditPeriodModal,
  handleDeletePeriod,
  showEditPeriodModal,
  setShowEditPeriodModal,
  editingPeriodItem,
  editPeriodForm,
  setEditPeriodForm,
  handleSavePeriodEdit,
  // Add month modal props
  showAddMonthModal,
  setShowAddMonthModal,
  newMonthForm,
  setNewMonthForm,
  handleStartDateChange,
  handleAddNewMonth,
  moduleName = 'Food & Dining'
}) {
  const [showMathTool, setShowMathTool] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Master Data Section Switcher: Cost Heads vs Billing Periods vs Math Tools */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid #eef2f6',
        paddingBottom: '14px',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => setMasterFoodView('cost_heads')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 18px',
            borderRadius: '9999px',
            fontSize: '12.5px',
            fontWeight: masterFoodView === 'cost_heads' ? '700' : '600',
            backgroundColor: masterFoodView === 'cost_heads' ? '#4f46e5' : '#ffffff',
            color: masterFoodView === 'cost_heads' ? '#ffffff' : '#475569',
            border: masterFoodView === 'cost_heads' ? '1px solid #4f46e5' : '1px solid #cbd5e1',
            cursor: 'pointer',
            boxShadow: masterFoodView === 'cost_heads' ? '0 2px 6px rgba(79,70,229,0.28)' : 'none'
          }}
        >
          <SlidersHorizontal size={14} />
          <span>Categories & Cost Heads ({costHeadsList.length} Items)</span>
        </button>

        <button
          type="button"
          onClick={() => setMasterFoodView('periods')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 18px',
            borderRadius: '9999px',
            fontSize: '12.5px',
            fontWeight: masterFoodView === 'periods' ? '700' : '600',
            backgroundColor: masterFoodView === 'periods' ? '#4f46e5' : '#ffffff',
            color: masterFoodView === 'periods' ? '#ffffff' : '#475569',
            border: masterFoodView === 'periods' ? '1px solid #4f46e5' : '1px solid #cbd5e1',
            cursor: 'pointer',
            boxShadow: masterFoodView === 'periods' ? '0 2px 6px rgba(79,70,229,0.28)' : 'none'
          }}
        >
          <Calendar size={14} />
          <span>Monthly Billing Cycles ({computedMatrix?.periods?.length || 0} Months)</span>
        </button>

        {/* Math Tools Toggle Button in Master Data */}
        <button
          type="button"
          onClick={() => setShowMathTool(prev => !prev)}
          title="Open interactive calculator and operational math tools"
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '7px 18px',
            borderRadius: '9999px',
            fontSize: '12.5px',
            fontWeight: '700',
            backgroundColor: showMathTool ? '#047857' : '#f0fdf4',
            color: showMathTool ? '#ffffff' : '#047857',
            border: showMathTool ? '1px solid #047857' : '1.5px solid #bbf7d0',
            cursor: 'pointer',
            boxShadow: showMathTool ? '0 2px 8px rgba(4,120,87,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease'
          }}
        >
          <Calculator size={15} />
          <span>{showMathTool ? 'Hide Math Tools' : '🧮 Math Tools & Calculator'}</span>
        </button>
      </div>

      {masterMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: masterMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: masterMessage.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${masterMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {masterMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{masterMessage.text}</span>
        </div>
      )}

      {/* MAIN CONTAINER: SIDE-BY-SIDE WITH MATH TOOLS */}
      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'flex-start',
        width: '100%'
      }}>
        
        {/* LEFT / PRIMARY: MASTER DATA MANAGER */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {masterFoodView === 'cost_heads' && (
            <CostHeadsManager
              costHeadsList={costHeadsList}
              categoriesList={categoriesList}
              draggedIdx={draggedIdx}
              dragOverIdx={dragOverIdx}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragEnd={handleDragEnd}
              handleDrop={handleDrop}
              handleMoveStep={handleMoveStep}
              openAddCostHeadModal={openAddCostHeadModal}
              openEditCostHeadModal={openEditCostHeadModal}
              handleDeleteCostHead={handleDeleteCostHead}
              handleBatchDeleteCostHeads={handleBatchDeleteCostHeads}
              showCostHeadModal={showCostHeadModal}
              setShowCostHeadModal={setShowCostHeadModal}
              editingCostHead={editingCostHead}
              costHeadForm={costHeadForm}
              setCostHeadForm={setCostHeadForm}
              handleSaveCostHead={handleSaveCostHead}
              openAddCategoryModal={openAddCategoryModal}
              openManageCategoriesModal={openManageCategoriesModal}
              onToggleMathTool={() => setShowMathTool(prev => !prev)}
              moduleName={moduleName}
            />
          )}

          {masterFoodView === 'periods' && (
            <PeriodsManager
              computedMatrix={computedMatrix}
              setShowAddMonthModal={setShowAddMonthModal}
              openEditPeriodModal={openEditPeriodModal}
              handleDeletePeriod={handleDeletePeriod}
            />
          )}
        </div>

        {/* RIGHT / SECONDARY: INTERACTIVE MATH TOOLS (DOCKED SIMULTANEOUSLY) */}
        {showMathTool && (
          <MasterMathTools
            onClose={() => setShowMathTool(false)}
            moduleName={moduleName}
            categoriesList={categoriesList}
            computedMatrix={computedMatrix}
          />
        )}

      </div>

      {/* MODAL: ADD STANDALONE CATEGORY */}
      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onAddCategory={handleAddCategory}
        moduleName={moduleName}
      />

      {/* MODAL: MANAGE CATEGORIES */}
      <ManageCategoriesModal
        isOpen={showManageCategoriesModal}
        onClose={() => setShowManageCategoriesModal(false)}
        categoriesList={categoriesList}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onBatchDeleteCategories={handleBatchDeleteCategories}
        onReorderCategories={handleReorderCategories}
        openAddCategoryModal={openAddCategoryModal}
      />

      {/* MODAL: EDIT BILLING MONTH */}
      <EditPeriodModal
        isOpen={showEditPeriodModal}
        onClose={() => setShowEditPeriodModal(false)}
        editingPeriodItem={editingPeriodItem}
        editPeriodForm={editPeriodForm}
        setEditPeriodForm={setEditPeriodForm}
        handleSavePeriodEdit={handleSavePeriodEdit}
      />

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
