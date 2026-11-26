import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bus, Fuel, Wrench, ShieldCheck, DollarSign, Plus, Trash2, 
  Save, Download, RefreshCw, CheckCircle2, AlertCircle, 
  Calculator, Gauge, MapPin, ChevronRight, Layers, FileSpreadsheet,
  Lock, Unlock
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export const TRANSPORT_BRANCH_LIST = [
  { id: 'Common', label: 'Common Fleet', icon: '🚌', badgeColor: '#d97706', badgeBg: '#fef3c7' },
  { id: 'RPS', label: 'RPS Branch', icon: '🏫', badgeColor: '#7c3aed', badgeBg: '#f3e8ff' },
  { id: 'KPM', label: 'KPM Branch', icon: '🏫', badgeColor: '#059669', badgeBg: '#d1fae5' },
  { id: 'University', label: 'University Fleet', icon: '🎓', badgeColor: '#dc2626', badgeBg: '#fee2e2' },
  { id: 'all', label: 'All Branches (Consolidated)', icon: '🏢', badgeColor: '#0284c7', badgeBg: '#e0f2fe' }
];

export default function TransportVehicleExpensesTable({
  initialPeriodId = null,
  periodId = null,
  initialBranch = 'Common',
  branch = 'Common',
  periods: propPeriods = null,
  onPeriodChange = null,
  onBranchChange = null,
  embedded = false,
  readOnly = false,
  isClosed: propIsClosed = null,
  handleToggleLock = null,
  onSyncCensus = null
}) {
  const [periods, setPeriods] = useState(propPeriods || []);
  const [selectedPeriodId, setSelectedPeriodId] = useState(periodId || initialPeriodId);
  const [selectedBranch, setSelectedBranch] = useState(branch || initialBranch);
  const [vehicles, setVehicles] = useState([]);
  const [branchSummaries, setBranchSummaries] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(embedded ? 'cards' : 'table'); // 'cards' | 'table'
  const [selectedVehicleKey, setSelectedVehicleKey] = useState(null);

  useEffect(() => {
    setSelectedVehicleKey(null);
  }, [selectedBranch, selectedPeriodId]);

  // Synchronize with parent props whenever they update
  useEffect(() => {
    if (periodId && periodId !== selectedPeriodId) {
      setSelectedPeriodId(periodId);
    }
  }, [periodId]);

  useEffect(() => {
    if (branch && branch !== selectedBranch) {
      setSelectedBranch(branch);
    }
  }, [branch]);

  // 1. Fetch available transport periods
  useEffect(() => {
    fetch('/api/matrix?module=transport')
      .then(res => res.json())
      .then(data => {
        if (data && data.periods && data.periods.length > 0) {
          setPeriods(data.periods);
          if (!selectedPeriodId) {
            // Default to Oct'26 if present, otherwise latest period
            const oct = data.periods.find(p => p.period_code === '2026-10' || (p.period_label && p.period_label.toLowerCase().includes('oct')));
            const defaultP = oct || data.periods[data.periods.length - 1];
            setSelectedPeriodId(defaultP.id);
            if (onPeriodChange) onPeriodChange(defaultP.id);
          }
        }
      })
      .catch(err => {
        console.error('[TransportVehicleTable] Error fetching periods:', err);
      });
  }, []);

  const visiblePeriods = useMemo(() => {
    if (selectedBranch === 'all') return periods;
    return periods.filter(p => !p.branch || p.branch === 'all' || p.branch === selectedBranch);
  }, [periods, selectedBranch]);

  const activePeriodObj = useMemo(() => {
    return visiblePeriods.find(p => p.id === selectedPeriodId) || visiblePeriods[visiblePeriods.length - 1] || periods[periods.length - 1] || null;
  }, [visiblePeriods, periods, selectedPeriodId]);

  // Synchronize periods from parent if provided
  useEffect(() => {
    if (propPeriods && propPeriods.length > 0) {
      setPeriods(propPeriods);
    }
  }, [propPeriods]);

  const effectivePeriod = (propPeriods || periods).find(p => String(p.id) === String(selectedPeriodId || periodId)) || activePeriodObj;
  const effectiveIsClosed = propIsClosed !== null ? propIsClosed : !!effectivePeriod?.is_closed;
  const effectiveReadOnly = readOnly || effectiveIsClosed;

  useEffect(() => {
    if (visiblePeriods.length > 0 && selectedBranch !== 'all' && selectedPeriodId && selectedPeriodId !== 'all') {
      const exists = visiblePeriods.some(p => String(p.id) === String(selectedPeriodId));
      if (!exists) {
        const nextId = visiblePeriods[visiblePeriods.length - 1].id;
        setSelectedPeriodId(nextId);
        if (onPeriodChange) onPeriodChange(nextId);
      }
    }
  }, [visiblePeriods, selectedBranch, selectedPeriodId]);

  // 2. Fetch vehicles when period or branch changes
  const fetchVehicleData = async (periodId, branch) => {
    if (!periodId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/transport/vehicles?period_id=${periodId}&branch=${branch}`);
      const data = await res.json();
      if (data && data.status === 'success') {
        setVehicles(data.vehicles || []);
        setBranchSummaries(data.branch_summaries || {});
      } else {
        setVehicles([]);
      }
    } catch (err) {
      console.error('[TransportVehicleTable] Fetch error:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load vehicle records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPeriodId) {
      fetchVehicleData(selectedPeriodId, selectedBranch);
    }
  }, [selectedPeriodId, selectedBranch]);

  // Safe numeric parser
  const num = (v, defaultVal = 0) => {
    if (v === undefined || v === null || v === '') return defaultVal;
    if (typeof v === 'number') return isNaN(v) ? defaultVal : v;
    const cleaned = String(v).replace(/,/g, '').replace(/₹/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  // Helper to handle cell editing in local state
  const handleCellChange = (index, field, value) => {
    setVehicles(prev => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };
      
      // Live recalculate row total expenses
      const fuel = num(field === 'fuel_expenses' ? value : row.fuel_expenses);
      const fc = num(field === 'fc_cost' ? value : row.fc_cost);
      const stat = num(field === 'statutory_cost' ? value : row.statutory_cost);
      const rep = num(field === 'repair_maintenance' ? value : row.repair_maintenance);
      const park = num(field === 'parking_fastag' ? value : row.parking_fastag);
      const emp = num(field === 'employee_cost' ? value : row.employee_cost);
      const oth = num(field === 'other_cost' ? value : row.other_cost);
      row.total_expenses = fuel + fc + stat + rep + park + emp + oth;

      // Live recalculate mileage
      const diesel = num(field === 'diesel_litres' ? value : row.diesel_litres);
      const km = num(field === 'km_run' ? value : row.km_run);
      row.mileage = diesel > 0 ? Number((km / diesel).toFixed(2)) : 0.0;

      updated[index] = row;
      return updated;
    });
  };

  // Add new bus row
  const handleAddBus = () => {
    if (selectedBranch === 'all') {
      alert("Please select a specific branch (RPS, KPM, University, or Common) to add a new bus.");
      return;
    }
    const newRow = {
      id: `temp-${Date.now()}`,
      period_id: selectedPeriodId,
      branch: selectedBranch,
      vehicle_no: '',
      make: '',
      model: '',
      fuel_expenses: 0,
      fc_cost: 0,
      statutory_cost: 0,
      repair_maintenance: 0,
      parking_fastag: 0,
      employee_cost: 0,
      other_cost: 0,
      total_expenses: 0,
      diesel_litres: 0,
      km_run: 0,
      mileage: 0.0,
      remarks: ''
    };
    setVehicles(prev => [...prev, newRow]);
    setStatusMessage({
      type: 'info',
      text: 'Added new vehicle row. Enter registration and expenses, then click "Save Ledger".'
    });
  };

  // Delete bus row
  const handleDeleteBus = async (index, vehId, vehicleNo) => {
    if (selectedBranch === 'all') {
      alert("Please switch to the specific branch to delete this bus.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete bus "${vehicleNo || 'this bus'}"?`)) {
      return;
    }

    if (vehId && typeof vehId === 'number') {
      try {
        const res = await fetch(`/api/transport/vehicles/${vehId}`, { method: 'DELETE' });
        const resJson = await res.json();
        if (resJson.status === 'success') {
          setVehicles(prev => prev.filter((_, i) => i !== index));
          setStatusMessage({ type: 'success', text: `Bus "${vehicleNo}" deleted successfully.` });
          if (onSyncCensus) onSyncCensus();
          fetchVehicleData(selectedPeriodId, selectedBranch);
        } else {
          alert(resJson.detail || 'Failed to delete vehicle');
        }
      } catch (err) {
        console.error('Error deleting bus:', err);
        alert('Server error while deleting bus.');
      }
    } else {
      // Local draft row
      setVehicles(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Save vehicle ledger
  const handleSaveLedger = async () => {
    if (selectedBranch === 'all') {
      alert("Cannot save under consolidated 'All Branches' view. Please select Common, RPS, KPM, or University.");
      return;
    }
    try {
      setSaving(true);
      setStatusMessage(null);
      const payload = {
        period_id: selectedPeriodId,
        branch: selectedBranch,
        vehicles: vehicles.map((v, idx) => ({
          ...v,
          display_order: idx,
          fuel_expenses: num(v.fuel_expenses),
          fc_cost: num(v.fc_cost),
          statutory_cost: num(v.statutory_cost),
          repair_maintenance: num(v.repair_maintenance),
          parking_fastag: num(v.parking_fastag),
          employee_cost: num(v.employee_cost),
          other_cost: num(v.other_cost),
          diesel_litres: num(v.diesel_litres),
          km_run: num(v.km_run)
        }))
      };

      const res = await fetch('/api/transport/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setStatusMessage({
          type: 'success',
          text: `✓ Saved ${data.bus_count} buses for ${selectedBranch} successfully! Synced with Transport Census.`
        });
        fetchVehicleData(selectedPeriodId, selectedBranch);
        if (onSyncCensus) onSyncCensus();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.detail || 'Failed to save vehicle ledger.'
        });
      }
    } catch (err) {
      console.error('Save error:', err);
      setStatusMessage({ type: 'error', text: 'Server error while saving ledger.' });
    } finally {
      setSaving(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (vehicles.length === 0) {
      alert("No vehicles to export.");
      return;
    }
    const headers = [
      'Vehicle', 'Branch', 'Make', 'Model', 
      'Fuel expenses', 'FC 2026-2027', 'Vehicle Statutory', 
      'Vehicle Repair & Maintenance', 'Vehicle Parking & Fastag Recharge', 
      'Transport Employees Cost', 'Others 26-27', 'Total Expenses', 
      'Diesel cons (L)', 'KM run', 'Mileage (km/L)'
    ];

    const rows = vehicles.map(v => [
      v.vehicle_no || '',
      v.branch || selectedBranch,
      v.make || '',
      v.model || '',
      num(v.fuel_expenses),
      num(v.fc_cost),
      num(v.statutory_cost),
      num(v.repair_maintenance),
      num(v.parking_fastag),
      num(v.employee_cost),
      num(v.other_cost),
      num(v.total_expenses),
      num(v.diesel_litres),
      num(v.km_run),
      num(v.mileage)
    ]);

    // Summary row
    rows.push([
      'Total',
      selectedBranch,
      '',
      '',
      totals.fuel,
      totals.fc,
      totals.statutory,
      totals.repair,
      totals.parking,
      totals.employee,
      totals.others,
      totals.totalExp,
      totals.diesel,
      totals.km,
      totals.avgMileage
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vehicle_Expenses_${selectedBranch}_${activePeriodObj?.period_label || 'Month'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter vehicles by search term
  const filteredVehicles = useMemo(() => {
    if (!searchTerm.trim()) return vehicles;
    const term = searchTerm.toLowerCase();
    return vehicles.filter(v => 
      (v.vehicle_no && v.vehicle_no.toLowerCase().includes(term)) ||
      (v.make && v.make.toLowerCase().includes(term)) ||
      (v.model && v.model.toLowerCase().includes(term)) ||
      (v.branch && v.branch.toLowerCase().includes(term))
    );
  }, [vehicles, searchTerm]);

  // Live Totals calculation for yellow row
  const totals = useMemo(() => {
    let fuel = 0, fc = 0, statutory = 0, repair = 0, parking = 0, employee = 0, others = 0;
    let totalExp = 0, diesel = 0, km = 0;

    filteredVehicles.forEach(v => {
      fuel += num(v.fuel_expenses);
      fc += num(v.fc_cost);
      statutory += num(v.statutory_cost);
      repair += num(v.repair_maintenance);
      parking += num(v.parking_fastag);
      employee += num(v.employee_cost);
      others += num(v.other_cost);
      totalExp += num(v.total_expenses);
      diesel += num(v.diesel_litres);
      km += num(v.km_run);
    });

    const avgMileage = diesel > 0 ? Number((km / diesel).toFixed(2)) : 0.0;

    return {
      count: filteredVehicles.length,
      fuel, fc, statutory, repair, parking, employee, others,
      totalExp, diesel, km, avgMileage
    };
  }, [filteredVehicles]);

  const pLabel = activePeriodObj?.period_label || "OCT'26";
  const branchLabel = TRANSPORT_BRANCH_LIST.find(b => b.id === selectedBranch)?.label || selectedBranch;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #E1E6F2',
      boxShadow: '0 2px 10px rgba(20, 36, 92, 0.04)',
      overflow: 'hidden',
      marginBottom: embedded ? 0 : '24px',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }}>
      {/* 1. TOP HEADER BANNER (Rathinam Navy & Gold) */}
      <div style={{
        backgroundColor: '#14245C',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        color: '#ffffff',
        borderBottom: '3px solid #F5A524'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: '#F5A524',
            color: '#14245C',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '17px',
            fontWeight: '800'
          }}>
            <Bus size={18} />
          </div>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: '800',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: '#ffffff'
            }}>
              {branchLabel.toUpperCase()} • VEHICLE WISE EXPENSES - {pLabel.toUpperCase()}
            </h2>
            <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.78)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>Fleet Ledger • {branchLabel}</span>
              <span>•</span>
              <span style={{ fontWeight: '700', color: '#ffffff' }}>{totals.count} Buses Active</span>
              <span>•</span>
              <span>Total Distance: {totals.km.toLocaleString()} KM</span>
              <span>•</span>
              <span style={{ fontWeight: '800', backgroundColor: '#F5A524', color: '#14245C', padding: '1px 8px', borderRadius: '9999px' }}>
                Fleet Avg: {totals.avgMileage} km/L
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Cards | Table View Toggle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.12)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {[
              { id: 'cards', label: 'Cards' },
              { id: 'table', label: 'Table' }
            ].map(vm => {
              const isVm = viewMode === vm.id;
              return (
                <button
                  key={vm.id}
                  type="button"
                  onClick={() => setViewMode(vm.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    backgroundColor: isVm ? '#F5A524' : 'transparent',
                    color: isVm ? '#14245C' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  {vm.label}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Search vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '5px 10px',
                fontSize: '11.5px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: '#0f172a',
                width: '150px',
                outline: 'none',
                fontWeight: '600'
              }}
            />
          </div>

          {/* Standalone Month Selector Dropdown (Hidden when embedded in Data Entry page) */}
          {!embedded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#ffffff' }}>Month:</span>
              <select
                value={selectedPeriodId || ''}
                onChange={(e) => {
                  const pid = Number(e.target.value);
                  setSelectedPeriodId(pid);
                  if (onPeriodChange) onPeriodChange(pid);
                }}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {visiblePeriods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.period_label} ({p.period_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {handleToggleLock && (
            <button
              type="button"
              onClick={() => handleToggleLock(selectedPeriodId || periodId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: effectiveIsClosed ? '#fee2e2' : 'rgba(255,255,255,0.22)',
                color: effectiveIsClosed ? '#b91c1c' : '#ffffff',
                border: effectiveIsClosed ? '1.5px solid #f87171' : '1px solid rgba(255,255,255,0.35)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: effectiveIsClosed ? '0 2px 8px rgba(239, 68, 68, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title={effectiveIsClosed ? "Month is locked. Click to unlock Page 1 & Page 2" : "Click to lock Month across Page 1 & Page 2"}
            >
              {effectiveIsClosed ? <Lock size={13} color="#b91c1c" /> : <Unlock size={13} color="#ffffff" />}
              <span>{effectiveIsClosed ? 'Unlock Month' : 'Lock Month'}</span>
            </button>
          )}

          {!effectiveReadOnly && selectedBranch !== 'all' && (
            <button
              type="button"
              onClick={handleAddBus}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '6px 13px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={14} />
              <span>+ Add Bus</span>
            </button>
          )}

          {!effectiveReadOnly && selectedBranch !== 'all' && (
            <button
              type="button"
              onClick={handleSaveLedger}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: saving ? 'wait' : 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'all 0.15s ease'
              }}
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{saving ? 'Saving...' : 'Save Ledger'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            title="Export CSV"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255,255,255,0.22)',
              color: '#ffffff',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 2. STANDALONE BRANCH SELECTOR PILLS BAR (Hidden when embedded to eliminate duplicate branch bars) */}
      {!embedded && (
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '10px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* Branch Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginRight: '4px' }}>
              Fleets / Branches:
            </span>
            {TRANSPORT_BRANCH_LIST.map(b => {
              const isSel = selectedBranch === b.id;
              const bSummary = branchSummaries[b.id] || {};
              const bCount = bSummary.bus_count !== undefined ? bSummary.bus_count : (b.id === selectedBranch ? vehicles.length : null);

              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedBranch(b.id);
                    if (onBranchChange) onBranchChange(b.id);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: isSel ? '800' : '600',
                    border: isSel ? `2px solid ${b.badgeColor}` : '1px solid #cbd5e1',
                    backgroundColor: isSel ? b.badgeBg : '#ffffff',
                    color: isSel ? b.badgeColor : '#475569',
                    cursor: 'pointer',
                    boxShadow: isSel ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{b.icon}</span>
                  <span>{b.label}</span>
                  {bCount !== null && (
                    <span style={{
                      backgroundColor: isSel ? b.badgeColor : '#e2e8f0',
                      color: isSel ? '#ffffff' : '#475569',
                      fontSize: '10.5px',
                      fontWeight: '800',
                      padding: '1px 6px',
                      borderRadius: '10px'
                    }}>
                      {bCount} {bCount === 1 ? 'Bus' : 'Buses'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Alert Banner */}
      {statusMessage && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: statusMessage.type === 'success' ? '#ecfdf5' : (statusMessage.type === 'error' ? '#fef2f2' : '#f0f9ff'),
          color: statusMessage.type === 'success' ? '#065f46' : (statusMessage.type === 'error' ? '#991b1b' : '#075985'),
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          fontSize: '12px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{statusMessage.text}</span>
          <button 
            type="button" 
            onClick={() => setStatusMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Lock Alert Banner for Page 2 */}
      {effectiveIsClosed && (
        <div style={{
          padding: '10px 18px',
          backgroundColor: '#fef2f2',
          borderBottom: '1.5px solid #fecaca',
          color: '#991b1b',
          fontSize: '12.5px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={15} color="#dc2626" />
            <span>
              Month <strong>{effectivePeriod?.period_label || activePeriodObj?.period_label}</strong> is <strong>LOCKED (Read-Only)</strong>. Both <strong>Page 1 (Master Spreadsheet)</strong> and <strong>Page 2 (Vehicle Wise Ledger)</strong> are protected from editing.
            </span>
          </div>
          {handleToggleLock && (
            <button
              type="button"
              onClick={() => handleToggleLock(selectedPeriodId || periodId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
              }}
            >
              <Unlock size={12} />
              <span>Unlock Month Now</span>
            </button>
          )}
        </div>
      )}

      {/* 2B. VEHICLE NUMBER CARDS VIEW (Click a vehicle card to inspect all its expenses) */}
      {viewMode === 'cards' && (
        <div style={{ padding: '20px', backgroundColor: '#F3F5FA' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: '700' }}>Loading vehicle fleet records...</div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #E1E6F2' }}>
              <Bus size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div style={{ fontSize: '13.5px', fontWeight: '700' }}>No vehicles recorded for {branchLabel} in {pLabel}.</div>
            </div>
          ) : (
            <>
              {(() => {
                const selectedVeh = filteredVehicles.find(v => (v.id || v.vehicle_no) === selectedVehicleKey) || null;
                if (!selectedVeh) return null;
                const svFuel = num(selectedVeh.fuel_expenses);
                const svFc = num(selectedVeh.fc_cost);
                const svStat = num(selectedVeh.statutory_cost);
                const svRep = num(selectedVeh.repair_maintenance);
                const svPark = num(selectedVeh.parking_fastag);
                const svCctv = num(selectedVeh.cctv_replacement);
                const svEmp = num(selectedVeh.employee_cost);
                const svOth = num(selectedVeh.other_cost);
                const svTot = num(selectedVeh.total_expenses);
                const svDiesel = num(selectedVeh.diesel_litres);
                const svKm = num(selectedVeh.km_run);
                const svMil = svDiesel > 0 ? (svKm / svDiesel) : num(selectedVeh.mileage);

                const expenseItems = [
                  { label: 'Fuel Expenses', val: svFuel, color: '#0284c7' },
                  { label: 'FC 2026-2027', val: svFc, color: '#d97706' },
                  { label: 'Vehicle Statutory', val: svStat, color: '#ea580c' },
                  { label: 'Repair & Maintenance', val: svRep, color: '#475569' },
                  { label: 'Parking & Fastag', val: svPark, color: '#059669' },
                  { label: 'CCTV Replacement', val: svCctv, color: '#7c3aed' },
                  { label: 'Employees Cost', val: svEmp, color: '#4338ca' },
                  { label: 'Others 26-27', val: svOth, color: '#64748b' }
                ];

                return (
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '2px solid #14245C',
                    boxShadow: '0 8px 24px rgba(20, 36, 92, 0.12)',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E1E6F2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          backgroundColor: '#14245C',
                          color: '#F5A524',
                          fontFamily: 'monospace',
                          fontSize: '15px',
                          fontWeight: '800'
                        }}>
                          {selectedVeh.vehicle_no}
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#14245C' }}>
                            {selectedVeh.make || 'Vehicle'} {selectedVeh.model ? `• ${selectedVeh.model}` : ''}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {selectedVeh.branch || branchLabel} • {pLabel} Expense Breakdown
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{
                          padding: '6px 14px',
                          borderRadius: '10px',
                          backgroundColor: '#14245C',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: '800'
                        }} className="currency-font">
                          Total: <span style={{ color: '#F5A524' }}>{formatINR(svTot)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedVehicleKey(null)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#F8FAFC',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Close ✕
                        </button>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
                      gap: '12px',
                      marginBottom: '14px'
                    }}>
                      {expenseItems.map((it) => (
                        <div key={it.label} style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: '12px',
                          border: '1px solid #E1E6F2',
                          borderTop: `3px solid ${it.color}`,
                          padding: '12px 14px'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {it.label}
                          </div>
                          <div style={{ fontSize: '17px', fontWeight: '800', color: '#14245C', marginTop: '4px' }} className="currency-font">
                            {formatINR(it.val)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '14px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#F3F5FA',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      color: '#14245C'
                    }}>
                      <span>Diesel: {svDiesel.toLocaleString('en-IN', { maximumFractionDigits: 1 })} L</span>
                      <span>•</span>
                      <span>KM Run: {svKm.toLocaleString('en-IN', { maximumFractionDigits: 1 })} KM</span>
                      <span>•</span>
                      <span>Mileage: {svMil.toFixed(2)} km/L</span>
                      {selectedVeh.remarks && (
                        <>
                          <span>•</span>
                          <span style={{ color: '#475569' }}>Remarks: {selectedVeh.remarks}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Vehicle Number Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))',
                gap: '14px'
              }}>
                {filteredVehicles.map((v, idx) => {
                  const vKey = v.id || v.vehicle_no || idx;
                  const isSel = selectedVehicleKey === vKey;
                  const vTot = num(v.total_expenses);
                  const vD = num(v.diesel_litres);
                  const vKm = num(v.km_run);
                  const vMil = vD > 0 ? (vKm / vD) : num(v.mileage);

                  return (
                    <button
                      key={vKey}
                      type="button"
                      onClick={() => setSelectedVehicleKey(isSel ? null : vKey)}
                      style={{
                        textAlign: 'left',
                        backgroundColor: isSel ? '#EFF6FF' : '#ffffff',
                        borderRadius: '14px',
                        border: isSel ? '2px solid #14245C' : '1px solid #E1E6F2',
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: isSel ? '0 6px 18px rgba(20, 36, 92, 0.14)' : '0 2px 6px rgba(20, 36, 92, 0.04)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '13.5px',
                          fontWeight: '800',
                          color: isSel ? '#F5A524' : '#14245C',
                          backgroundColor: isSel ? '#14245C' : '#F3F5FA',
                          padding: '4px 9px',
                          borderRadius: '8px'
                        }}>
                          {v.vehicle_no}
                        </span>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          color: '#64748b'
                        }}>
                          #{idx + 1}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                        {v.make || '—'}{v.model ? ` • ${v.model}` : ''}
                      </div>

                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#14245C' }} className="currency-font">
                        {formatINR(vTot)}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: '8px', borderTop: '1px solid #F1F5F9', fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
                        <span>{vD.toLocaleString('en-IN', { maximumFractionDigits: 1 })} L • {vKm.toLocaleString('en-IN', { maximumFractionDigits: 0 })} KM</span>
                        <span style={{ color: isSel ? '#14245C' : '#2F4BB8' }}>
                          {isSel ? 'Viewing ▲' : 'View expenses →'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. MAIN SPREADSHEET TABLE */}
      {viewMode === 'table' && (
      <div style={{ overflowX: 'auto', width: '100%', maxHeight: '680px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '11.5px',
          fontFamily: 'Segoe UI, -apple-system, sans-serif'
        }}>
          <thead>
            {/* Navy & Gold Header Row */}
            <tr style={{ height: '40px', textAlign: 'center', fontWeight: '800', backgroundColor: '#14245C', color: '#ffffff' }}>
              <th style={{ backgroundColor: '#14245C', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '130px', position: 'sticky', left: 0, zIndex: 10 }}>
                Vehicle
              </th>
              {selectedBranch === 'all' && (
                <th style={{ backgroundColor: '#14245C', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '90px' }}>
                  Branch
                </th>
              )}
              <th style={{ backgroundColor: '#14245C', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '130px' }}>
                Make
              </th>
              <th style={{ backgroundColor: '#14245C', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '90px' }}>
                Model
              </th>
              <th style={{ backgroundColor: '#14245C', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '95px' }}>
                Fuel expenses
              </th>
              <th style={{ backgroundColor: '#14245C', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '95px' }}>
                FC 2026-2027
              </th>
              <th style={{ backgroundColor: '#14245C', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '95px' }}>
                Vehicle Statutory
              </th>
              <th style={{ backgroundColor: '#14245C', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '110px' }}>
                Vehicle Repair & Maintenance
              </th>
              <th style={{ backgroundColor: '#14245C', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '110px' }}>
                Vehicle Parking & Fastag Recharge
              </th>
              <th style={{ backgroundColor: '#14245C', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '110px' }}>
                Transport Employees Cost
              </th>
              <th style={{ backgroundColor: '#14245C', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '90px' }}>
                Others 26-27
              </th>
              {/* Highlighted Summary Columns (Navy + Gold) */}
              <th style={{ backgroundColor: '#1e3a8a', color: '#F5A524', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '105px', fontWeight: '800' }}>
                Total Expens
              </th>
              <th style={{ backgroundColor: '#1e3a8a', color: '#F5A524', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '90px', fontWeight: '800' }}>
                Diesel cons
              </th>
              <th style={{ backgroundColor: '#1e3a8a', color: '#F5A524', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '90px', fontWeight: '800' }}>
                KM run {pLabel.split("'")[0]}
              </th>
              <th style={{ backgroundColor: '#1e3a8a', color: '#F5A524', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 10px', minWidth: '90px', fontWeight: '800' }}>
                {pLabel} Mileage
              </th>
              {!effectiveReadOnly && selectedBranch !== 'all' && (
                <th style={{ backgroundColor: '#991b1b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 6px', width: '50px' }}>
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={selectedBranch === 'all' ? 16 : 15} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
                  <div>Loading vehicle fleet records...</div>
                </td>
              </tr>
            ) : filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={selectedBranch === 'all' ? 16 : 15} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  <Bus size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <div style={{ fontSize: '13px', fontWeight: '700' }}>No vehicles recorded for {branchLabel} in {pLabel}.</div>
                  {!effectiveReadOnly && selectedBranch !== 'all' && (
                    <button
                      type="button"
                      onClick={handleAddBus}
                      style={{
                        marginTop: '10px',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      + Add First Vehicle
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredVehicles.map((row, idx) => {
                const isOdd = idx % 2 === 1;
                const canEdit = !effectiveReadOnly && selectedBranch !== 'all';

                return (
                  <tr 
                    key={row.id || idx}
                    style={{
                      backgroundColor: isOdd ? '#fbfcfe' : '#ffffff',
                      height: '32px',
                      transition: 'background-color 0.1s ease'
                    }}
                  >
                    {/* 1. Vehicle Registration (Peach background matching image) */}
                    <td style={{
                      backgroundColor: '#ffedd5',
                      border: '1px solid #fed7aa',
                      padding: '4px 6px',
                      fontWeight: '800',
                      color: '#9a3412',
                      position: 'sticky',
                      left: 0,
                      zIndex: 5
                    }}>
                      {canEdit ? (
                        <input
                          type="text"
                          value={row.vehicle_no || ''}
                          onChange={(e) => handleCellChange(idx, 'vehicle_no', e.target.value)}
                          placeholder="e.g. TN99 Q 3209"
                          style={{
                            width: '100%',
                            backgroundColor: 'transparent',
                            border: 'none',
                            fontWeight: '800',
                            color: '#9a3412',
                            outline: 'none',
                            fontSize: '11.5px',
                            textTransform: 'uppercase'
                          }}
                        />
                      ) : (
                        <span>{row.vehicle_no}</span>
                      )}
                    </td>

                    {/* Branch (in consolidated view) */}
                    {selectedBranch === 'all' && (
                      <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'center', fontWeight: '700', color: '#475569' }}>
                        {row.branch}
                      </td>
                    )}

                    {/* 2. Make */}
                    <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px' }}>
                      {canEdit ? (
                        <input
                          type="text"
                          value={row.make || ''}
                          onChange={(e) => handleCellChange(idx, 'make', e.target.value)}
                          placeholder="ASHOK LEYLAND / TATA"
                          style={{
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            outline: 'none',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                        />
                      ) : (
                        <span>{row.make || '—'}</span>
                      )}
                    </td>

                    {/* 3. Model */}
                    <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'center' }}>
                      {canEdit ? (
                        <input
                          type="text"
                          value={row.model || ''}
                          onChange={(e) => handleCellChange(idx, 'model', e.target.value)}
                          placeholder="Oct-18"
                          style={{
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            outline: 'none',
                            textAlign: 'center',
                            fontSize: '11px'
                          }}
                        />
                      ) : (
                        <span>{row.model || '—'}</span>
                      )}
                    </td>

                    {/* 4. Fuel Expenses */}
                    <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>
                      {canEdit ? (
                        <input
                          type="number"
                          value={row.fuel_expenses || ''}
                          onChange={(e) => handleCellChange(idx, 'fuel_expenses', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'right',
                            outline: 'none',
                            fontSize: '11.5px',
                            fontWeight: '600'
                          }}
                        />
                      ) : (
                        <span>{num(row.fuel_expenses) > 0 ? num(row.fuel_expenses).toLocaleString() : '—'}</span>
                      )}
                    </td>

                    {/* 5. FC 2026-2027 */}
                    <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>
                      {canEdit ? (
                        <input
                          type="number"
                          value={row.fc_cost || ''}
                          onChange={(e) => handleCellChange(idx, 'fc_cost', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'right',
                            outline: 'none',
                            fontSize: '11.5px'
                          }}
                        />
                      ) : (
                        <span>{num(row.fc_cost) > 0 ? num(row.fc_cost).toLocaleString() : '—'}</span>
                      )}
                    </td>

                    {/* 6. Vehicle Statutory */}
                    <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>
                      {canEdit ? (
                        <input
                          type="number"
                          value={row.statutory_cost || ''}
                          onChange={(e) => handleCellChange(idx, 'statutory_cost', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'right',
                            outline: 'none',
                            fontSize: '11.5px'
                          }}
                        />
                      ) : (
                        <span>{num(row.statutory_cost) > 0 ? num(row.statutory_cost).toLocaleString() : '—'}</span>
                      )}
                    </td>

                    {/* 7. Repair & Maintenance */}
                    <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>
                      {canEdit ? (
                        <input
                          type="number"
                          value={row.repair_maintenance || ''}
                          onChange={(e) => handleCellChange(idx, 'repair_maintenance', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'right',
                            outline: 'none',
                            fontSize: '11.5px'
                          }}
                        />
                      ) : (
                        <span>{num(row.repair_maintenance) > 0 ? num(row.repair_maintenance).toLocaleString() : '—'}</span>
                      )}
                    </td>

                    {/* 8. Vehicle Parking & Fastag Recharge */}
                    <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>
                      {canEdit ? (
                        <input
                          type="number"
                          value={row.parking_fastag || ''}
                          onChange={(e) => handleCellChange(idx, 'parking_fastag', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'right',
                            outline: 'none',
                            fontSize: '11.5px'
                          }}
                        />
                      ) : (
                        <span>{num(row.parking_fastag) > 0 ? num(row.parking_fastag).toLocaleString() : '0'}</span>
                      )}
                    </td>

                    {/* 9. Transport Employees Cost */}
                    <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>
                      {canEdit ? (
                        <input
                          type="number"
                          value={row.employee_cost || ''}
                          onChange={(e) => handleCellChange(idx, 'employee_cost', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'right',
                            outline: 'none',
                            fontSize: '11.5px'
                          }}
                        />
                      ) : (
                        <span>{num(row.employee_cost) > 0 ? num(row.employee_cost).toLocaleString() : '—'}</span>
                      )}
                    </td>

                    {/* 10. Others 26-27 */}
                    <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>
                      {canEdit ? (
                        <input
                          type="number"
                          value={row.other_cost || ''}
                          onChange={(e) => handleCellChange(idx, 'other_cost', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'right',
                            outline: 'none',
                            fontSize: '11.5px'
                          }}
                        />
                      ) : (
                        <span>{num(row.other_cost) > 0 ? num(row.other_cost).toLocaleString() : '—'}</span>
                      )}
                    </td>

                    {/* 11. Total Expenses (Auto-calculated) */}
                    <td style={{
                      backgroundColor: '#fef9c3', // Soft yellow
                      border: '1px solid #fde047',
                      padding: '4px 6px',
                      textAlign: 'right',
                      fontWeight: '800',
                      color: '#854d0e'
                    }}>
                      {num(row.total_expenses).toLocaleString()}
                    </td>

                    {/* 12. Diesel consumed */}
                    <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>
                      {canEdit ? (
                        <input
                          type="number"
                          value={row.diesel_litres || ''}
                          onChange={(e) => handleCellChange(idx, 'diesel_litres', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'right',
                            outline: 'none',
                            fontSize: '11.5px',
                            fontWeight: '600'
                          }}
                        />
                      ) : (
                        <span>{num(row.diesel_litres) > 0 ? num(row.diesel_litres).toLocaleString() : '—'}</span>
                      )}
                    </td>

                    {/* 13. KM run */}
                    <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>
                      {canEdit ? (
                        <input
                          type="number"
                          value={row.km_run || ''}
                          onChange={(e) => handleCellChange(idx, 'km_run', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            textAlign: 'right',
                            outline: 'none',
                            fontSize: '11.5px',
                            fontWeight: '600'
                          }}
                        />
                      ) : (
                        <span>{num(row.km_run) > 0 ? num(row.km_run).toLocaleString() : '—'}</span>
                      )}
                    </td>

                    {/* 14. Mileage (Auto-calculated: KM / Diesel) */}
                    <td style={{
                      backgroundColor: '#fef9c3',
                      border: '1px solid #fde047',
                      padding: '4px 6px',
                      textAlign: 'right',
                      fontWeight: '800',
                      color: '#854d0e'
                    }}>
                      {num(row.mileage) > 0 ? Number(row.mileage).toFixed(2) : '—'}
                    </td>

                    {/* Action */}
                    {canEdit && (
                      <td style={{ border: '1px solid #fee2e2', padding: '4px 4px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteBus(idx, row.id, row.vehicle_no)}
                          title="Delete Bus"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            padding: '3px'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* 4. TOTAL SUMMARY ROW (Bright Yellow matching image) */}
          <tfoot>
            <tr style={{
              backgroundColor: '#facc15', // Exact bright yellow from image
              borderTop: '2px solid #ca8a04',
              borderBottom: '2px solid #ca8a04',
              height: '34px',
              fontWeight: '900',
              fontSize: '11.5px',
              color: '#0f172a'
            }}>
              <td style={{
                backgroundColor: '#facc15',
                border: '1px solid #eab308',
                padding: '6px 8px',
                textAlign: 'left',
                position: 'sticky',
                left: 0,
                zIndex: 10
              }}>
                Total ({totals.count} Buses)
              </td>

              {selectedBranch === 'all' && (
                <td style={{ border: '1px solid #eab308', padding: '6px 8px', textAlign: 'center' }}>
                  All
                </td>
              )}

              <td style={{ border: '1px solid #eab308', padding: '6px 8px' }}></td>
              <td style={{ border: '1px solid #eab308', padding: '6px 8px' }}></td>

              {/* Fuel Expenses Total */}
              <td style={{ border: '1px solid #eab308', padding: '6px 8px', textAlign: 'right' }}>
                {totals.fuel.toLocaleString()}
              </td>

              {/* FC Total */}
              <td style={{ border: '1px solid #eab308', padding: '6px 8px', textAlign: 'right' }}>
                {totals.fc > 0 ? totals.fc.toLocaleString() : '—'}
              </td>

              {/* Statutory Total */}
              <td style={{ border: '1px solid #eab308', padding: '6px 8px', textAlign: 'right' }}>
                {totals.statutory > 0 ? totals.statutory.toLocaleString() : '—'}
              </td>

              {/* Repair Total */}
              <td style={{ border: '1px solid #eab308', padding: '6px 8px', textAlign: 'right' }}>
                {totals.repair.toLocaleString()}
              </td>

              {/* Parking Total */}
              <td style={{ border: '1px solid #eab308', padding: '6px 8px', textAlign: 'right' }}>
                {totals.parking.toLocaleString()}
              </td>

              {/* Employees Total */}
              <td style={{ border: '1px solid #eab308', padding: '6px 8px', textAlign: 'right' }}>
                {totals.employee > 0 ? totals.employee.toLocaleString() : '—'}
              </td>

              {/* Others Total */}
              <td style={{ border: '1px solid #eab308', padding: '6px 8px', textAlign: 'right' }}>
                {totals.others > 0 ? totals.others.toLocaleString() : '—'}
              </td>

              {/* Total Expenses Grand Total */}
              <td style={{ border: '1px solid #ca8a04', padding: '6px 8px', textAlign: 'right', fontSize: '12px', color: '#000000' }}>
                {totals.totalExp.toLocaleString()}
              </td>

              {/* Total Diesel */}
              <td style={{ border: '1px solid #ca8a04', padding: '6px 8px', textAlign: 'right' }}>
                {totals.diesel.toLocaleString()}
              </td>

              {/* Total KM */}
              <td style={{ border: '1px solid #ca8a04', padding: '6px 8px', textAlign: 'right' }}>
                {totals.km.toLocaleString()}
              </td>

              {/* Average Mileage */}
              <td style={{ border: '1px solid #ca8a04', padding: '6px 8px', textAlign: 'right', color: '#000000' }}>
                {totals.avgMileage.toFixed(2)}
              </td>

              {!effectiveReadOnly && selectedBranch !== 'all' && (
                <td style={{ border: '1px solid #eab308' }}></td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
      )}

      {/* 5. FOOTER SUMMARY STATS CARDS */}
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '12px 18px',
        borderTop: '1px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Fleet Size</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#0284c7', marginTop: '2px' }}>
            {totals.count} <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Buses</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Total Expenses</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#b45309', marginTop: '2px' }}>
            {formatINR(totals.totalExp)}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Diesel Consumed</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>
            {totals.diesel.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Litres</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Distance Traveled</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#059669', marginTop: '2px' }}>
            {totals.km.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>KMs</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#fef08a', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fde047' }}>
          <div style={{ fontSize: '11px', color: '#854d0e', fontWeight: '800', textTransform: 'uppercase' }}>Fleet Avg Mileage</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#713f12', marginTop: '2px' }}>
            {totals.avgMileage} <span style={{ fontSize: '12px', fontWeight: '700', color: '#854d0e' }}>km/L</span>
          </div>
        </div>
      </div>
    </div>
  );
}
