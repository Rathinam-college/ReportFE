import React, { useState, useMemo, useRef } from 'react';
import { formatINR } from '../../utils/formatters';
import { 
  Search, X, Maximize2, Minimize2, Download, Bus, 
  Users, Fuel, Wrench, ShieldCheck, DollarSign, Calculator, Layers
} from 'lucide-react';
import { TRANSPORT_BRANCHES, CANONICAL_TRANSPORT_PARAMETERS } from '../data_entry/TransportSpreadsheetEntry';

export default function TransportDashboardDataTable({
  periods = [],
  activePeriod = 'all',
  computedMatrix,
  isFullScreen: propIsFullScreen,
  onToggleFullScreen: propOnToggleFullScreen
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBranch, setActiveBranch] = useState('RPS');
  const [internalFullScreen, setInternalFullScreen] = useState(false);
  const isFullScreen = propIsFullScreen !== undefined ? propIsFullScreen : internalFullScreen;
  const containerRef = useRef(null);

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

  // Helper to compute branch metrics
  const getParamValue = (branchId, periodIdStr, paramKey) => {
    if (branchId === 'all') {
      const realBranches = ['Common', 'RPS', 'KPM', 'University'];
      if (paramKey === 'vehicles_count') return '64 fleet';
      let tot = 0;
      realBranches.forEach(b => {
        const d = computedMatrix?.transport_census_by_branch?.[b]?.[periodIdStr] || {};
        tot += num(d[paramKey], 0);
      });
      return tot;
    }
    const bData = computedMatrix?.transport_census_by_branch?.[branchId]?.[periodIdStr];
    if (bData && bData[paramKey] !== undefined && bData[paramKey] !== null) {
      return bData[paramKey];
    }
    if (paramKey === 'vehicles_count') {
      return branchId === 'RPS' ? '18+1' : branchId === 'KPM' ? '12+1' : branchId === 'University' ? '24+2' : '10+1';
    }
    return 0;
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

  const filteredParams = useMemo(() => {
    return CANONICAL_TRANSPORT_PARAMETERS.filter(p => {
      return !searchTerm || p.param_name.toLowerCase().includes(searchTerm.toLowerCase()) || String(p.s_no).includes(searchTerm);
    });
  }, [searchTerm]);

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
        height: isFullScreen ? '100vh' : 'auto',
        zIndex: isFullScreen ? 99999 : 1
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
                    padding: '3px 8px',
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

      {/* 2. THE MULTI-MONTH TABLE */}
      <div style={{
        overflowX: 'auto',
        overflowY: 'auto',
        maxHeight: isFullScreen ? 'calc(100vh - 65px)' : '680px',
        backgroundColor: '#ffffff'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12.5px',
          border: '2px solid #000000',
          fontFamily: 'Calibri, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#ffffff',
              borderBottom: '2px solid #000000',
              fontWeight: '800',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <th style={{ width: '50px', padding: '7px 4px', textAlign: 'center', borderRight: '1px solid #000000', borderBottom: '2px solid #000000' }}>
                S.No
              </th>
              <th style={{ minWidth: '300px', padding: '7px 12px', textAlign: 'left', borderRight: '1px solid #000000', borderBottom: '2px solid #000000' }}>
                Parameters ({activeBranchObj.label})
              </th>
              {periods.map(p => {
                const isSelected = String(p.id) === currentPeriodIdStr;
                return (
                  <th
                    key={p.id}
                    style={{
                      minWidth: '125px',
                      padding: '7px 10px',
                      textAlign: 'center',
                      borderRight: '1px solid #000000',
                      borderBottom: '2px solid #000000',
                      backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                      color: isSelected ? '#ea580c' : '#000000'
                    }}
                  >
                    <div>{p.period_label}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {filteredParams.map((param, idx) => {
              const rowStyle = getRowStyle(param);
              const isTotal = param.param_key === 'total_expenses' || param.param_key === 'balance';

              return (
                <React.Fragment key={param.id || param.param_key}>
                  {/* Row 46 blank yellow spacer */}
                  {param.param_key === 'cumulative_demand_per_km' && (
                    <tr style={{ backgroundColor: '#fef08a', height: '22px', borderBottom: '1px solid #000000' }}>
                      <td style={{ borderRight: '1px solid #000000', backgroundColor: '#fef08a' }}>&nbsp;</td>
                      <td style={{ borderRight: '1px solid #000000', backgroundColor: '#fef08a' }}>&nbsp;</td>
                      {periods.map(p => (
                        <td key={p.id} style={{ borderRight: '1px solid #000000', backgroundColor: '#fef08a' }}>&nbsp;</td>
                      ))}
                    </tr>
                  )}

                  <tr
                    style={{
                      backgroundColor: rowStyle.bg,
                      borderBottom: isTotal ? '2px solid #000000' : '1px solid #000000',
                      fontWeight: rowStyle.isBold ? '800' : '500',
                      height: '26px'
                    }}
                  >
                    <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #000000', color: '#000000', fontWeight: '700' }}>
                      {param.s_no}
                    </td>

                    <td style={{ padding: '4px 10px', borderRight: '1px solid #000000', color: '#000000', fontWeight: rowStyle.isBold ? '800' : '500' }}>
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
                            padding: '3px 8px',
                            textAlign: 'right',
                            borderRight: '1px solid #000000',
                            color: '#000000',
                            fontWeight: rowStyle.isBold ? '800' : '600'
                          }}
                        >
                          {isRef ? '#REF!' : formatVal(param, rawVal)}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
