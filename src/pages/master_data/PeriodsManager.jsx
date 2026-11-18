import React, { useState, useMemo } from 'react';
import { 
  Calendar, Plus, Lock, Unlock, Edit, Trash2, 
  CheckSquare, Square, MinusSquare, AlertTriangle, Check, X, Search, RefreshCw 
} from 'lucide-react';

export default function PeriodsManager({
  computedMatrix,
  setShowAddMonthModal,
  openEditPeriodModal,
  handleDeletePeriod,
  handleBatchDeletePeriods
}) {
  const [selectedPeriodIds, setSelectedPeriodIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [localMessage, setLocalMessage] = useState(null);

  const periods = computedMatrix?.periods || [];

  // Filter periods by search term
  const filteredPeriods = useMemo(() => {
    if (!searchTerm.trim()) return periods;
    const term = searchTerm.toLowerCase().trim();
    return periods.filter(p => 
      (p.period_label || '').toLowerCase().includes(term) ||
      (p.period_code || '').toLowerCase().includes(term) ||
      String(p.id).includes(term)
    );
  }, [periods, searchTerm]);

  // Selection helpers
  const isAllSelected = filteredPeriods.length > 0 && filteredPeriods.every(p => selectedPeriodIds.includes(p.id));
  const isSomeSelected = selectedPeriodIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all filtered
      const filteredIdSet = new Set(filteredPeriods.map(p => p.id));
      setSelectedPeriodIds(prev => prev.filter(id => !filteredIdSet.has(id)));
    } else {
      // Select all filtered
      const allIds = Array.from(new Set([...selectedPeriodIds, ...filteredPeriods.map(p => p.id)]));
      setSelectedPeriodIds(allIds);
    }
  };

  const handleToggleSelectRow = (periodId) => {
    setSelectedPeriodIds(prev => 
      prev.includes(periodId) 
        ? prev.filter(id => id !== periodId)
        : [...prev, periodId]
    );
  };

  const handleClearSelection = () => {
    setSelectedPeriodIds([]);
  };

  // Batch delete selected periods
  const handleDeleteSelected = async () => {
    if (selectedPeriodIds.length === 0) return;

    const selectedPeriods = periods.filter(p => selectedPeriodIds.includes(p.id));
    const selectedLabels = selectedPeriods.map(p => p.period_label);

    const confirmMsg = `WARNING: Are you sure you want to permanently delete the ${selectedPeriodIds.length} selected billing cycle(s)?\n\n` +
      selectedLabels.map(l => `• ${l}`).join('\n') +
      `\n\nThis will remove all associated expense, census, and ledger entries for these cycles from the system.`;

    if (!window.confirm(confirmMsg)) return;

    setIsDeletingBatch(true);
    try {
      if (handleBatchDeletePeriods) {
        const ok = await handleBatchDeletePeriods(selectedPeriodIds, selectedLabels);
        if (ok !== false) {
          setSelectedPeriodIds([]);
          setLocalMessage({
            type: 'success',
            text: `Successfully deleted ${selectedPeriodIds.length} billing cycle(s).`
          });
        }
      } else {
        // Direct API call fallback
        const res = await fetch('/api/periods/batch-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ period_ids: selectedPeriodIds })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to delete selected cycles');
        }

        const data = await res.json();
        setSelectedPeriodIds([]);
        setLocalMessage({
          type: 'success',
          text: data.message || `Successfully deleted ${selectedPeriodIds.length} billing cycle(s).`
        });
        window.location.reload();
      }
    } catch (err) {
      setLocalMessage({
        type: 'error',
        text: err.message || 'Error deleting selected cycles'
      });
    } finally {
      setIsDeletingBatch(false);
      setTimeout(() => setLocalMessage(null), 5000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* 1. HEADER BANNER */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '20px 24px',
        border: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Monthly Billing Cycles Management
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0 0' }}>
            Manage monthly reporting periods. Edit month labels, lock/close cycles, or <strong>select multiple months and delete</strong> them in bulk to remove them from Data Entry and Matrix tables.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Add New Month Button */}
          <button
            type="button"
            onClick={() => setShowAddMonthModal(true)}
            style={{
              padding: '9px 22px',
              borderRadius: '9999px',
              backgroundColor: '#6c56db',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 4px 14px rgba(108, 86, 219, 0.35)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5d44db'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6c56db'}
          >
            <Plus size={16} />
            <span>Add New Month / Cycle</span>
          </button>
        </div>
      </div>

      {/* Local Alert Notification */}
      {localMessage && (
        <div style={{
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: localMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: localMessage.type === 'success' ? '#065f46' : '#991b1b',
          border: `1.5px solid ${localMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`
        }}>
          {localMessage.type === 'success' ? <Check size={18} color="#059669" /> : <AlertTriangle size={18} color="#dc2626" />}
          <span>{localMessage.text}</span>
        </div>
      )}

      {/* 2. BATCH SELECTION ACTION BAR (Appears whenever 1 or more items are selected) */}
      {selectedPeriodIds.length > 0 && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1.5px solid #3b82f6',
          borderRadius: '10px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '14px'
            }}>
              {selectedPeriodIds.length}
            </div>
            <div>
              <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e3a8a' }}>
                {selectedPeriodIds.length} of {periods.length} Billing Cycle{selectedPeriodIds.length > 1 ? 's' : ''} Selected
              </span>
              <p style={{ margin: '1px 0 0 0', fontSize: '11.5px', color: '#3b82f6' }}>
                {periods.filter(p => selectedPeriodIds.includes(p.id)).map(p => p.period_label).join(', ')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Clear Selection Button */}
            <button
              type="button"
              onClick={handleClearSelection}
              disabled={isDeletingBatch}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <X size={14} />
              <span>Deselect All</span>
            </button>

            {/* DELETE SELECTED BUTTON */}
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={isDeletingBatch}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                backgroundColor: '#dc2626',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '800',
                cursor: isDeletingBatch ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              {isDeletingBatch ? (
                <>
                  <RefreshCw size={15} className="spin-animate" />
                  <span>Deleting {selectedPeriodIds.length} Cycle(s)...</span>
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  <span>Delete Selected ({selectedPeriodIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. PERIODS TABLE CONTAINER */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* Table Top Controls & Search Bar */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#2563eb" />
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Configured Billing Periods ({periods.length} Cycles)
            </h3>
            {filteredPeriods.length !== periods.length && (
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                (showing {filteredPeriods.length})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Quick Search Input */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px' }} />
              <input
                type="text"
                placeholder="Search month or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '6px 12px 6px 30px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  width: '200px'
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '8px', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Select checkboxes to delete in bulk • Click ✏️ to edit
            </div>
          </div>
        </div>

        {/* The Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569', fontWeight: '700' }}>
                
                {/* SELECT ALL CHECKBOX COLUMN */}
                <th style={{ padding: '12px 14px', width: '45px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      title={isAllSelected ? "Deselect all months" : "Select all months"}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        accentColor: '#2563eb'
                      }}
                    />
                  </div>
                </th>

                <th style={{ padding: '12px 14px', width: '70px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '12px 20px', width: '22%', textAlign: 'left' }}>Month / Cycle Label</th>
                <th style={{ padding: '12px 20px', width: '18%', textAlign: 'left' }}>Period Code</th>
                <th style={{ padding: '12px 20px', width: '16%', textAlign: 'left' }}>Operating Days</th>
                <th style={{ padding: '12px 20px', width: '18%', textAlign: 'left' }}>Data Entry Status</th>
                <th style={{ padding: '12px 18px', width: '150px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPeriods.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
                    No billing periods match "{searchTerm}". Try clearing your search.
                  </td>
                </tr>
              ) : (
                filteredPeriods.map((p, idx) => {
                  const isClosed = !!p.is_closed;
                  const isSelected = selectedPeriodIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isSelected ? '#eff6ff' : (idx % 2 === 0 ? '#ffffff' : '#fafafa'),
                        borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* ROW SELECT CHECKBOX */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(p.id)}
                            title={`Select month "${p.period_label}"`}
                            style={{
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer',
                              accentColor: '#2563eb'
                            }}
                          />
                        </div>
                      </td>

                      {/* Period ID */}
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: 'monospace', color: '#64748b', fontWeight: '600' }}>
                        #{p.id}
                      </td>

                      {/* Month Label */}
                      <td style={{ padding: '12px 20px', fontWeight: '800', color: isSelected ? '#1e40af' : '#0f172a', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={15} color={isSelected ? '#2563eb' : '#64748b'} />
                          <span>{p.period_label}</span>
                        </div>
                      </td>

                      {/* Period Code */}
                      <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontWeight: '600', color: '#334155' }}>
                        {p.period_code}
                      </td>

                      {/* Operating Days */}
                      <td style={{ padding: '12px 20px', color: '#64748b' }}>
                        {p.operating_days || 30} Days
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 9px',
                          borderRadius: '5px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          backgroundColor: isClosed ? '#f1f5f9' : '#ecfdf5',
                          color: isClosed ? '#64748b' : '#047857',
                          border: `1px solid ${isClosed ? '#cbd5e1' : '#a7f3d0'}`
                        }}>
                          {isClosed ? <Lock size={11} /> : <Unlock size={11} />}
                          <span>{isClosed ? 'Locked / Closed' : 'Open for Entry'}</span>
                        </span>
                      </td>

                      {/* Individual Actions */}
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => openEditPeriodModal(p)}
                            title={`Edit month "${p.period_label}"`}
                            style={{
                              padding: '5px 11px',
                              borderRadius: '4px',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: '700',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Edit size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePeriod(p)}
                            title={`Delete month "${p.period_label}" and its recorded data`}
                            style={{
                              padding: '5px 11px',
                              borderRadius: '4px',
                              backgroundColor: '#fef2f2',
                              color: '#ef4444',
                              border: '1px solid #fecaca',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: '700',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary & Bulk Delete Shortcut */}
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <div>
            Showing <strong>{filteredPeriods.length}</strong> of <strong>{periods.length}</strong> billing cycles
            {selectedPeriodIds.length > 0 && (
              <span style={{ marginLeft: '8px', color: '#2563eb', fontWeight: '700' }}>
                • {selectedPeriodIds.length} selected
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedPeriodIds.length > 0 ? (
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={isDeletingBatch}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Trash2 size={12} />
                <span>Delete {selectedPeriodIds.length} Selected</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: '#ffffff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Select All ({filteredPeriods.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
