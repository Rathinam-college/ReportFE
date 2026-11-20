import React, { useState, useMemo, useRef, useEffect } from 'react';
import { formatINR } from '../../utils/formatters';
import { 
  Search, X, Maximize2, Minimize2, Download, Bus, 
  Users, Fuel, Wrench, ShieldCheck, DollarSign, Calculator, Layers, LayoutGrid, Table
} from 'lucide-react';
import { TRANSPORT_BRANCHES, CANONICAL_TRANSPORT_PARAMETERS } from '../data_entry/TransportSpreadsheetEntry';
import TransportFleetCard from './charts/TransportFleetCard';
import TransportVehicleExpensesTable from '../data_entry/TransportVehicleExpensesTable';

export default function TransportDashboardDataTable({
  periods: propPeriods = [],
  activePeriod = 'all',
  computedMatrix: propComputedMatrix,
  isFullScreen: propIsFullScreen,
  onToggleFullScreen: propOnToggleFullScreen
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBranch, setActiveBranch] = useState('RPS');
  const [internalFullScreen, setInternalFullScreen] = useState(false);
  const [localMatrix, setLocalMatrix] = useState(null);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [masterParams, setMasterParams] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'cards' | 'table'

  // Fetch live transport parameters from Master Data API
  useEffect(() => {
    fetch('/api/transport/parameters')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMasterParams(data);
        }
      })
      .catch(err => {
        console.error('[TransportDashboardDataTable] Error fetching parameters:', err);
      });
  }, []);

  const isFullScreen = propIsFullScreen !== undefined ? propIsFullScreen : internalFullScreen;
  const containerRef = useRef(null);

  // Self-healing fallback: If parent periods or transport data is empty, fetch directly from live database!
  useEffect(() => {
    const hasParentPeriods = propPeriods && propPeriods.length > 0;
    const hasParentBranch = propComputedMatrix?.transport_census_by_branch && Object.keys(propComputedMatrix.transport_census_by_branch).length > 0;
    
    if (!hasParentPeriods || !hasParentBranch) {
      setLoadingLocal(true);
      fetch('/api/matrix?module=transport')
        .then(res => res.json())
        .then(data => {
          if (data && data.periods && data.periods.length > 0) {
            setLocalMatrix(data);
          }
          setLoadingLocal(false);
        })
        .catch(err => {
          console.error('[TransportDashboardDataTable] Fallback fetch error:', err);
          setLoadingLocal(false);
        });
    }
  }, [propPeriods, propComputedMatrix]);

  const periods = (propPeriods && propPeriods.length > 0) ? propPeriods : (localMatrix?.periods || []);
  const computedMatrix = (propComputedMatrix?.transport_census_by_branch && Object.keys(propComputedMatrix.transport_census_by_branch).length > 0)
    ? propComputedMatrix
    : (localMatrix || {});

  const currentPeriodIdStr = activePeriod !== 'all' ? String(activePeriod) : String(periods[periods.length - 1]?.id || '29');
  const activeBranchObj = TRANSPORT_BRANCHES.find(b => b.id === activeBranch) || TRANSPORT_BRANCHES[1] || TRANSPORT_BRANCHES[0];

  const toggleFullScreen = () => {
    const nextState = !isFullScreen;
    if (propOnToggleFullScreen) {
      propOnToggleFullScreen(nextState);
    } else {
      setInternalFullScreen(nextState);
    }
  };

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // Helper to compute branch metrics (strictly from live database)
  const getParamValue = (branchId, periodIdStr, paramKey) => {
    if (branchId === 'all') {
      const realBranches = ['Common', 'RPS', 'KPM', 'University'];
      let tot = 0;
      let hasAny = false;
      realBranches.forEach(b => {
        const d = computedMatrix?.transport_census_by_branch?.[b]?.[periodIdStr] || {};
        if (d[paramKey] !== undefined && d[paramKey] !== null && d[paramKey] !== '') {
          tot += num(d[paramKey], 0);
          hasAny = true;
        }
      });
      if (!hasAny) return '—';
      if (paramKey === 'vehicles_count') return `${tot} fleet`;
      return tot;
    }
    const bData = computedMatrix?.transport_census_by_branch?.[branchId]?.[periodIdStr];
    if (bData && bData[paramKey] !== undefined && bData[paramKey] !== null && bData[paramKey] !== '') {
      return bData[paramKey];
    }
    return '—';
  };

  const formatVal = (param, val) => {
    if (val === undefined || val === null || val === '') return '—';
    if (param.param_key === 'per_student_cost_expenses' && (val === '#REF!' || !val || val === 0)) return '#REF!';
    if (param.input_type === 'cost') return formatINR(Number(val) || 0);
    if (typeof val === 'number') return val.toLocaleString();
    return String(val);
  };

  // Row colors matching Excel sheet
  const getRowStyle = (param) => {
    const k = param.param_key;
    const sec = (param.section || '').toLowerCase();
    if (k === 'total_expenses' || k === 'balance') return { bg: '#86efac', isBold: true };
    if (k === 'cab_billing' || k === 'diesel_litres') return { bg: '#ffffff', isBold: false };
    if (sec.includes('fleet') && !sec.includes('expense')) return { bg: '#ffffff', isBold: false };
    if (sec.includes('expense')) return { bg: '#fed7aa', isBold: false };
    if (sec.includes('revenue') || sec.includes('income')) return { bg: '#fef3c7', isBold: k === 'cumulative_income' };
    if (sec.includes('budget') || sec.includes('balance')) return { bg: '#dcfce7', isBold: false };
    if (sec.includes('ticket') || sec.includes('compliance')) return { bg: '#f3e8ff', isBold: false };
    if (sec.includes('student') || sec.includes('analytics')) return { bg: '#fef08a', isBold: false };
    return { bg: '#ffffff', isBold: false };
  };

  const activeParamsList = useMemo(() => {
    const list = (masterParams && masterParams.length > 0) ? masterParams : CANONICAL_TRANSPORT_PARAMETERS;
    return [...list].sort((a, b) => {
      const aOrd = a.display_order !== undefined && a.display_order !== null ? a.display_order : 9999;
      const bOrd = b.display_order !== undefined && b.display_order !== null ? b.display_order : 9999;
      if (aOrd !== bOrd) return aOrd - bOrd;
      return (a.section_order || 99) - (b.section_order || 99);
    });
  }, [masterParams]);

  const filteredParams = useMemo(() => {
    return activeParamsList.filter(p => {
      const name = p.param_name || '';
      const sno = String(p.s_no || '');
      return !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase()) || sno.includes(searchTerm);
    });
  }, [activeParamsList, searchTerm]);

  return (
    <div 
      ref={containerRef}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1.5px solid #cbd5e1',
        boxShadow: isFullScreen ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: isFullScreen ? 'fixed' : 'relative',
        top: isFullScreen ? 0 : 'auto',
        left: isFullScreen ? 0 : 'auto',
        right: isFullScreen ? 0 : 'auto',
        bottom: isFullScreen ? 0 : 'auto',
        width: isFullScreen ? '100vw' : '100%',
        maxWidth: '100%',
        height: isFullScreen ? '100vh' : 'auto',
        zIndex: isFullScreen ? 99999 : 1,
        boxSizing: 'border-box'
      }}
    >
      {/* 1. TOP UTILITY HEADER */}
      <div style={{
        padding: '12px 18px',
        backgroundColor: '#fff7ed',
        borderBottom: '1px solid #fed7aa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: '#ea580c',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <Bus size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Transport Fleet Master Spreadsheet
              </h3>
              <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#9a3412', backgroundColor: '#ffedd5', padding: '1px 7px', borderRadius: '4px' }}>
                All 47 Parameters • Matches Transport Data Entry
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748b' }}>
              Multi-branch fleet operations, expenses & income across recorded monthly billing cycles
            </p>
          </div>
        </div>

        {/* Branch Selector & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* View Toggle: Cards vs Table */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fed7aa', padding: '2px', borderRadius: '6px' }}>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'cards' ? '#ea580c' : 'transparent',
                color: viewMode === 'cards' ? '#ffffff' : '#7c2d12',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={12} />
              <span>Cards View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'table' ? '#ea580c' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#7c2d12',
                transition: 'all 0.15s ease'
              }}
            >
              <Table size={12} />
              <span>Ledger Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('vehicles')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'vehicles' ? '#00a2e8' : 'transparent',
                color: viewMode === 'vehicles' ? '#ffffff' : '#7c2d12',
                transition: 'all 0.15s ease'
              }}
            >
              <Bus size={12} />
              <span>Vehicle Wise Expenses</span>
            </button>
          </div>

          {/* Branch Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffffff', padding: '2px 4px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            {TRANSPORT_BRANCHES.map(b => {
              const isSel = b.id === activeBranch;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setActiveBranch(b.id)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '4px',
                    fontSize: '11.5px',
                    fontWeight: isSel ? '800' : '600',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isSel ? '#ea580c' : 'transparent',
                    color: isSel ? '#ffffff' : '#475569'
                  }}
                >
                  {b.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '4px 8px',
            width: '180px'
          }}>
            <Search size={13} color="#64748b" style={{ marginRight: '5px' }} />
            <input
              type="text"
              placeholder="Search parameters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11.5px', width: '100%', color: '#0f172a' }}
            />
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullScreen}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* 2. THE MULTI-MONTH TABLE, CARDS VIEW, OR VEHICLE EXPENSES LEDGER */}
      {viewMode === 'cards' ? (
        <div style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: '#fffaf5',
          maxHeight: isFullScreen ? 'calc(100vh - 65px)' : '680px',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}>
          <TransportFleetCard
            transportCensus={computedMatrix?.transport_census || localMatrix?.transport_census}
            transportCensusByBranch={computedMatrix?.transport_census_by_branch || localMatrix?.transport_census_by_branch}
            periods={periods}
            selectedPeriod={activePeriod}
          />
        </div>
      ) : viewMode === 'vehicles' ? (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          maxHeight: isFullScreen ? 'calc(100vh - 65px)' : '750px',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}>
          <TransportVehicleExpensesTable
            periodId={activePeriod !== 'all' ? Number(activePeriod) : null}
            branch={activeBranch}
            embedded={true}
          />
        </div>
      ) : (
        <div style={{
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: isFullScreen ? 'calc(100vh - 65px)' : '650px',
          backgroundColor: '#ffffff',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
        <table style={{
          width: 'max-content',
          minWidth: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
          fontSize: '12.5px',
          fontFamily: 'Calibri, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
        }}>
          <thead>
            <tr>
              <th style={{
                width: '50px',
                minWidth: '50px',
                maxWidth: '50px',
                padding: '9px 6px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                color: '#000000',
                fontWeight: '800',
                borderBottom: '2px solid #000000',
                borderRight: '1px solid #000000',
                position: 'sticky',
                top: 0,
                left: 0,
                zIndex: 30
              }}>
                S.No
              </th>
              <th style={{
                width: '300px',
                minWidth: '300px',
                maxWidth: '300px',
                padding: '9px 12px',
                textAlign: 'left',
                backgroundColor: '#ffffff',
                color: '#000000',
                fontWeight: '800',
                borderBottom: '2px solid #000000',
                borderRight: '2px solid #000000',
                position: 'sticky',
                top: 0,
                left: '50px',
                zIndex: 30,
                boxShadow: '3px 0 6px rgba(0,0,0,0.06)'
              }}>
                Parameters ({activeBranchObj.label})
              </th>
              {periods.map(p => {
                const isSelected = String(p.id) === currentPeriodIdStr;
                return (
                  <th
                    key={p.id}
                    style={{
                      minWidth: '130px',
                      padding: '9px 10px',
                      textAlign: 'center',
                      borderBottom: '2px solid #000000',
                      borderRight: '1px solid #000000',
                      backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                      color: isSelected ? '#ea580c' : '#000000',
                      fontWeight: '800',
                      position: 'sticky',
                      top: 0,
                      zIndex: 20
                    }}
                  >
                    <div>{p.period_label}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {periods.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #ea580c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span>Loading Transport Fleet Ledger & cycles from database...</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredParams.map((param, idx) => {
                const rowStyle = getRowStyle(param);
                const isTotal = param.param_key === 'total_expenses' || param.param_key === 'balance';

                return (
                  <React.Fragment key={param.id || param.param_key}>
                    {/* Row 46 blank yellow spacer */}
                    {param.param_key === 'cumulative_demand_per_km' && (
                      <tr style={{ backgroundColor: '#fef08a', height: '22px' }}>
                        <td style={{ position: 'sticky', left: 0, borderRight: '1px solid #000000', borderBottom: '1px solid #000000', backgroundColor: '#fef08a', zIndex: 10 }}>&nbsp;</td>
                        <td style={{ position: 'sticky', left: '50px', borderRight: '2px solid #000000', borderBottom: '1px solid #000000', backgroundColor: '#fef08a', zIndex: 10 }}>&nbsp;</td>
                        {periods.map(p => (
                          <td key={p.id} style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', backgroundColor: '#fef08a' }}>&nbsp;</td>
                        ))}
                      </tr>
                    )}

                    <tr
                      style={{
                        height: '26px'
                      }}
                    >
                      <td style={{
                        position: 'sticky',
                        left: 0,
                        backgroundColor: rowStyle.bg,
                        zIndex: 10,
                        padding: '4px 6px',
                        textAlign: 'center',
                        borderRight: '1px solid #000000',
                        borderBottom: isTotal ? '2px solid #000000' : '1px solid #000000',
                        color: '#000000',
                        fontWeight: '700'
                      }}>
                        {param.s_no}
                      </td>

                      <td style={{
                        position: 'sticky',
                        left: '50px',
                        backgroundColor: rowStyle.bg,
                        zIndex: 10,
                        padding: '4px 10px',
                        borderRight: '2px solid #000000',
                        borderBottom: isTotal ? '2px solid #000000' : '1px solid #000000',
                        color: '#000000',
                        fontWeight: rowStyle.isBold ? '800' : '500',
                        boxShadow: '3px 0 6px rgba(0,0,0,0.05)'
                      }}>
                        {param.param_name}
                      </td>

                      {periods.map(p => {
                        const pStr = String(p.id);
                        const rawVal = getParamValue(activeBranch, pStr, param.param_key);
                        const isRef = param.param_key === 'per_student_cost_expenses' && (rawVal === '#REF!' || !rawVal || rawVal === 0);

                        return (
                          <td
                            key={p.id}
                            style={{
                              padding: '3px 10px',
                              textAlign: 'right',
                              backgroundColor: rowStyle.bg,
                              borderRight: '1px solid #000000',
                              borderBottom: isTotal ? '2px solid #000000' : '1px solid #000000',
                              color: '#000000',
                              fontWeight: rowStyle.isBold ? '800' : '600',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isRef ? '#REF!' : formatVal(param, rawVal)}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
