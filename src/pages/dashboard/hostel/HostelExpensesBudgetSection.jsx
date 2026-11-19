import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, ChevronDown, ChevronUp, Layers, PieChart,
  Calendar, Download, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle,
  Building, Zap, Droplets, Wrench, Users, Wallet, Table, Check,
  LayoutGrid, BarChart3, AlertTriangle, Sparkles, Landmark, FileText,
  BadgePercent, Eye, ArrowUpRight, ArrowDownRight, IndianRupee
} from 'lucide-react';
import { formatINR, formatPeriodLabel } from '../../../utils/formatters';
import { 
  HOSTEL_BUDGET_HEADS, 
  getBudgetMonthCol,
  ALL_BUDGET_MONTH_COLS
} from '../../../utils/hostelBudgetConstants';

export default function HostelExpensesBudgetSection({
  census = {},
  computedMatrix = {},
  categories = [],
  periods = [],
  activePeriod = 'all',
  onExportReport,
  remarksDraft = {}
}) {
  const [trackingViewMode, setTrackingViewMode] = useState('matrix'); // 'matrix' | 'cards' | 'distribution'
  const [monthFilter, setMonthFilter] = useState('all'); // 'all' | 'recorded'
  const [budgetTrackingData, setBudgetTrackingData] = useState([]);

  // Fetch real budget tracking records from PostgreSQL database
  const fetchBudgetTracking = () => {
    fetch('/api/hostel/budget-tracking')
      .then(res => res.json())
      .then(d => {
        if (d?.items && d.items.length > 0) {
          setBudgetTrackingData(d.items);
        }
      })
      .catch(err => console.warn('Hostel budget tracking load notice:', err));
  };

  useEffect(() => {
    if (computedMatrix?.hostel_budget_tracking && computedMatrix.hostel_budget_tracking.length > 0) {
      setBudgetTrackingData(computedMatrix.hostel_budget_tracking);
    } else {
      fetchBudgetTracking();
    }
  }, [computedMatrix]);

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // Identify currently selected active month
  const activePeriodObj = useMemo(() => {
    return periods.find(p => String(p.id) === String(activePeriod)) || periods[0] || {};
  }, [periods, activePeriod]);

  const activeMonthCol = useMemo(() => {
    return getBudgetMonthCol(activePeriodObj, activePeriod);
  }, [activePeriodObj, activePeriod]);

  const activePeriodName = useMemo(() => {
    return activePeriodObj ? formatPeriodLabel(activePeriodObj) : (activePeriodObj?.period_label || activePeriodObj?.period_code || "Oct'25");
  }, [activePeriodObj]);

  // Connect 9 heads directly to DB rows
  const activeBudgetHeads = useMemo(() => {
    if (budgetTrackingData && budgetTrackingData.length > 0) {
      return budgetTrackingData.map((r, idx) => ({
        s_no: Number(r.s_no || idx + 1),
        budget_head: r.budget_head,
        sanctioned_amount: num(r.sanctioned_amount, 0),
        month_limit: num(r.month_limit, 0),
        sep_25_actual: num(r.sep_25_actual, 0),
        oct_26_actual: num(r.oct_26_actual, 0),
        nov_26_actual: num(r.nov_26_actual, 0),
        dec_26_actual: num(r.dec_26_actual, 0),
        jan_27_actual: num(r.jan_27_actual, 0),
        feb_27_actual: num(r.feb_27_actual, 0),
        mar_27_actual: num(r.mar_27_actual, 0),
        apr_27_actual: num(r.apr_27_actual, 0),
        may_27_actual: num(r.may_27_actual, 0),
        jun_27_actual: num(r.jun_27_actual, 0),
        jul_27_actual: num(r.jul_27_actual, 0),
        aug_27_actual: num(r.aug_27_actual, 0),
        sep_27_actual: num(r.sep_27_actual, 0),
      }));
    }
    return HOSTEL_BUDGET_HEADS.map((canon) => ({
      s_no: canon.s_no,
      budget_head: canon.head,
      sanctioned_amount: canon.sanctioned,
      month_limit: canon.limit,
      sep_25_actual: 0,
      oct_26_actual: canon.defaultOct,
      nov_26_actual: 0,
      dec_26_actual: 0,
      jan_27_actual: 0,
      feb_27_actual: 0,
      mar_27_actual: 0,
      apr_27_actual: 0,
      may_27_actual: 0,
      jun_27_actual: 0,
      jul_27_actual: 0,
      aug_27_actual: 0,
      sep_27_actual: 0,
    }));
  }, [budgetTrackingData]);

  // Totals for the 9 Heads from DB
  const totalSanctionedSum = useMemo(() => {
    return activeBudgetHeads.reduce((acc, h) => acc + num(h.sanctioned_amount, 0), 0);
  }, [activeBudgetHeads]);

  const totalMonthLimitSum = useMemo(() => {
    return activeBudgetHeads.reduce((acc, h) => acc + num(h.month_limit, 0), 0);
  }, [activeBudgetHeads]);

  const activeMonthActualSum = useMemo(() => {
    return activeBudgetHeads.reduce((acc, h) => acc + num(h[activeMonthCol], 0), 0);
  }, [activeBudgetHeads, activeMonthCol]);

  // Dynamically derive columns from hostel periods passed from live DB
  const allHostelMonthCols = useMemo(() => {
    if (periods && periods.length > 0) {
      return periods.map(p => ({
        key: getBudgetMonthCol(p, p.id),
        label: formatPeriodLabel(p),
        periodId: p.id
      }));
    }
    return ALL_BUDGET_MONTH_COLS;
  }, [periods]);

  // Filter columns: if monthFilter === 'recorded', show only columns that have data or are currently active
  const visibleMonthCols = useMemo(() => {
    if (monthFilter === 'recorded') {
      return allHostelMonthCols.filter(m => {
        const isCurrentActive = m.key === activeMonthCol;
        const hasSpend = activeBudgetHeads.some(h => num(h[m.key], 0) > 0);
        return isCurrentActive || hasSpend;
      });
    }
    return allHostelMonthCols;
  }, [allHostelMonthCols, monthFilter, activeMonthCol, activeBudgetHeads]);

  const periodRangeLabel = useMemo(() => {
    if (visibleMonthCols && visibleMonthCols.length > 0) {
      return `${visibleMonthCols[0].label} – ${visibleMonthCols[visibleMonthCols.length - 1].label}`;
    }
    return "Sep'25 – Sep'26";
  }, [visibleMonthCols]);

  // Helper icons for each budget head
  const getHeadIcon = (sNo) => {
    switch (sNo) {
      case 1: return <Building size={16} color="#2563eb" />;
      case 2: return <FileText size={16} color="#0891b2" />;
      case 3: return <Landmark size={16} color="#7c3aed" />;
      case 4: return <Users size={16} color="#d97706" />;
      case 5: return <ShieldCheck size={16} color="#4338ca" />;
      case 6: return <Zap size={16} color="#ea580c" />;
      case 7: return <Droplets size={16} color="#0284c7" />;
      case 8: return <Wrench size={16} color="#dc2626" />;
      case 9: return <Sparkles size={16} color="#db2777" />;
      default: return <Wallet size={16} color="#64748b" />;
    }
  };

  // Ranked cost heads for distribution view (ranked by active month spend from DB)
  const rankedCostHeads = useMemo(() => {
    return [...activeBudgetHeads]
      .filter(h => num(h[activeMonthCol], 0) > 0)
      .sort((a, b) => num(b[activeMonthCol], 0) - num(a[activeMonthCol], 0));
  }, [activeBudgetHeads, activeMonthCol]);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* HOSTEL BUDGET TRACKING SUMMARY */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #cbd5e1',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)'
      }}>
        {/* Modern Header Banner with View Switcher */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          color: '#ffffff',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
              <Table size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '900', margin: 0, color: '#ffffff', letterSpacing: '0.02em' }}>
                  HOSTEL BUDGET TRACKING SUMMARY
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  backgroundColor: '#22c55e',
                  color: '#ffffff',
                  padding: '2px 10px',
                  borderRadius: '9999px'
                }}>
                  {periodRangeLabel} ({visibleMonthCols.length} Months)
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#c7d2fe' }}>
                9 Official Budget Heads • Sanctioned vs Monthly Ceiling vs Actual Expenditure
              </p>
            </div>
          </div>

          {/* Interactive Month Filter & View Switcher Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Filter: All Months vs Recorded Spend */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '9999px',
              padding: '3px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <button
                type="button"
                onClick={() => setMonthFilter('all')}
                style={{
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: monthFilter === 'all' ? '800' : '600',
                  backgroundColor: monthFilter === 'all' ? '#ffffff' : 'transparent',
                  color: monthFilter === 'all' ? '#1e1b4b' : '#c7d2fe',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                All Months ({allHostelMonthCols.length})
              </button>
              <button
                type="button"
                onClick={() => setMonthFilter('recorded')}
                style={{
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: monthFilter === 'recorded' ? '800' : '600',
                  backgroundColor: monthFilter === 'recorded' ? '#ffffff' : 'transparent',
                  color: monthFilter === 'recorded' ? '#1e1b4b' : '#c7d2fe',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Active & Recorded Only
              </button>
            </div>

            {/* View Switcher Toggles */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '9999px',
              padding: '3px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <button
                type="button"
                onClick={() => setTrackingViewMode('matrix')}
                style={{
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  backgroundColor: trackingViewMode === 'matrix' ? '#ffffff' : 'transparent',
                  color: trackingViewMode === 'matrix' ? '#1e1b4b' : '#c7d2fe',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Table size={13} />
                <span>Hostel Ledger</span>
              </button>
              <button
                type="button"
                onClick={() => setTrackingViewMode('cards')}
                style={{
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  backgroundColor: trackingViewMode === 'cards' ? '#ffffff' : 'transparent',
                  color: trackingViewMode === 'cards' ? '#1e1b4b' : '#c7d2fe',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <LayoutGrid size={13} />
                <span>9 Heads Bento</span>
              </button>
              <button
                type="button"
                onClick={() => setTrackingViewMode('distribution')}
                style={{
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  backgroundColor: trackingViewMode === 'distribution' ? '#ffffff' : 'transparent',
                  color: trackingViewMode === 'distribution' ? '#1e1b4b' : '#c7d2fe',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <BarChart3 size={13} />
                <span>Cost Drivers</span>
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: FULL HOSTEL LEDGER MATRIX TABLE (Direct from DB)       */}
        {/* ------------------------------------------------------------- */}
        {trackingViewMode === 'matrix' && (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1080px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#1e293b' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '40px', fontWeight: '800' }}>#</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', minWidth: '200px' }}>Budget Head</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right', fontWeight: '800', backgroundColor: '#ecfdf5', color: '#065f46', minWidth: '115px' }}>
                    SANCTIONED (₹)
                  </th>
                  <th style={{ padding: '12px 12px', textAlign: 'right', fontWeight: '800', backgroundColor: '#fff7ed', color: '#9a3412', minWidth: '110px' }}>
                    Month Limit (₹)
                  </th>
                  {visibleMonthCols.map((m) => {
                    const isActive = m.key === activeMonthCol;
                    return (
                      <th
                        key={m.key}
                        style={{
                          padding: '10px 10px',
                          textAlign: 'right',
                          fontWeight: isActive ? '900' : '700',
                          backgroundColor: isActive ? '#eff6ff' : 'transparent',
                          color: isActive ? '#1d4ed8' : '#475569',
                          minWidth: '92px',
                          borderBottom: isActive ? '3px solid #3b82f6' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span>{m.label}</span>
                          {isActive && (
                            <span style={{ fontSize: '9px', fontWeight: '900', backgroundColor: '#3b82f6', color: '#ffffff', padding: '1px 5px', borderRadius: '4px', marginTop: '2px' }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800', minWidth: '150px' }}>
                    Active Status vs Limit
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeBudgetHeads.map((head, idx) => {
                  const sanc = num(head.sanctioned_amount, 0);
                  const limit = num(head.month_limit, 0);
                  const activeVal = num(head[activeMonthCol], 0);
                  const diff = activeVal - limit;
                  const isOver = activeVal > limit;
                  const pct = limit > 0 ? (activeVal / limit) * 100 : 0;

                  return (
                    <tr 
                      key={head.budget_head || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '700', color: '#94a3b8' }}>
                        {head.s_no}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {getHeadIcon(head.s_no)}
                          </div>
                          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '12.5px' }}>
                            {head.budget_head}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: '800', color: '#166534', backgroundColor: '#f0fdf4' }} className="currency-font">
                        {formatINR(sanc)}
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: '800', color: '#c2410c', backgroundColor: '#fffbeb' }} className="currency-font">
                        {formatINR(limit)}
                      </td>

                      {/* Dynamic Month Columns directly from PostgreSQL DB */}
                      {visibleMonthCols.map((m) => {
                        const mVal = num(head[m.key], 0);
                        const isActive = m.key === activeMonthCol;
                        return (
                          <td
                            key={m.key}
                            style={{
                              padding: '12px 10px',
                              textAlign: 'right',
                              fontWeight: isActive ? '900' : '650',
                              backgroundColor: isActive ? '#eff6ff' : 'transparent',
                              color: mVal > 0 ? (isActive ? '#1e40af' : '#1e293b') : '#94a3b8'
                            }}
                            className="currency-font"
                          >
                            {mVal > 0 ? formatINR(mVal) : '—'}
                          </td>
                        );
                      })}

                      {/* Active Status Badge */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {activeVal === 0 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: '#f1f5f9',
                            color: '#64748b'
                          }}>
                            Reserved (0%)
                          </span>
                        ) : isOver ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '10.5px',
                              fontWeight: '800',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fca5a5'
                            }}>
                              <ArrowUpRight size={11} /> Over {formatINR(Math.abs(diff))} ({pct.toFixed(1)}%)
                            </span>
                            <div style={{ width: '80px', height: '4px', backgroundColor: '#fee2e2', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: '100%', height: '100%', backgroundColor: '#dc2626' }} />
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '10.5px',
                              fontWeight: '800',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              border: '1px solid #86efac'
                            }}>
                              <ArrowDownRight size={11} /> Saved {formatINR(Math.abs(diff))} ({pct.toFixed(1)}%)
                            </span>
                            <div style={{ width: '80px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', backgroundColor: '#16a34a' }} />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Bottom Total Summary Row */}
                <tr style={{
                  backgroundColor: '#fef08a',
                  borderTop: '2px solid #ca8a04',
                  fontWeight: '900',
                  color: '#713f12'
                }}>
                  <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '13px' }}>∑</td>
                  <td style={{ padding: '14px 14px', fontSize: '13px', textTransform: 'uppercase' }}>
                    Total Budget Tracking (9 Heads)
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontSize: '13.5px', color: '#166534' }} className="currency-font">
                    {formatINR(totalSanctionedSum)}
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontSize: '13.5px', color: '#9a3412' }} className="currency-font">
                    {formatINR(totalMonthLimitSum)}
                  </td>

                  {/* Dynamic Month Totals calculated directly from DB rows */}
                  {visibleMonthCols.map((m) => {
                    const mSum = activeBudgetHeads.reduce((acc, h) => acc + num(h[m.key], 0), 0);
                    const isActive = m.key === activeMonthCol;
                    return (
                      <td
                        key={m.key}
                        style={{
                          padding: '14px 10px',
                          textAlign: 'right',
                          fontSize: '13px',
                          fontWeight: '900',
                          backgroundColor: isActive ? '#fef9c3' : 'transparent',
                          color: mSum > 0 ? (isActive ? '#0f172a' : '#1e293b') : '#a16207'
                        }}
                        className="currency-font"
                      >
                        {mSum > 0 ? formatINR(mSum) : '—'}
                      </td>
                    );
                  })}

                  <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                    {(() => {
                      const netDiff = totalMonthLimitSum - activeMonthActualSum;
                      const isUnder = netDiff >= 0;
                      const netPct = totalMonthLimitSum > 0 ? ((Math.abs(netDiff) / totalMonthLimitSum) * 100).toFixed(1) : '0';
                      return (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: '900',
                          backgroundColor: isUnder ? '#bbf7d0' : '#fee2e2',
                          color: isUnder ? '#14532d' : '#991b1b',
                          border: `1px solid ${isUnder ? '#86efac' : '#fca5a5'}`
                        }}>
                          {isUnder ? `✓ Saved ${formatINR(netDiff)}` : `⚠️ Over ${formatINR(Math.abs(netDiff))}`} ({netPct}%)
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: 9 BUDGET HEADS VISUAL BENTO CARDS                     */}
        {/* ------------------------------------------------------------- */}
        {trackingViewMode === 'cards' && (
          <div style={{
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            backgroundColor: '#f8fafc'
          }}>
            {activeBudgetHeads.map((head) => {
              const sanc = num(head.sanctioned_amount, 0);
              const limit = num(head.month_limit, 0);
              const activeVal = num(head[activeMonthCol], 0);
              const diff = activeVal - limit;
              const isOver = activeVal > limit;
              const pct = limit > 0 ? (activeVal / limit) * 100 : 0;

              return (
                <div
                  key={head.budget_head}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1.5px solid #e2e8f0',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getHeadIcon(head.s_no)}
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>Head #{head.s_no}</span>
                        <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                          {head.budget_head}
                        </h4>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: activeVal === 0 ? '#f1f5f9' : isOver ? '#fee2e2' : '#dcfce7',
                      color: activeVal === 0 ? '#64748b' : isOver ? '#b91c1c' : '#15803d'
                    }}>
                      {activeVal === 0 ? '0% Used' : isOver ? `▲ Over by ${formatINR(Math.abs(diff))}` : `✓ Saved ${formatINR(Math.abs(diff))}`}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{activePeriodName} Actual Spend</div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#1e40af', margin: '2px 0 6px 0' }} className="currency-font">
                      {activeVal > 0 ? formatINR(activeVal) : '₹0'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#475569', marginBottom: '6px' }}>
                      <span>Limit: <strong style={{ color: '#c2410c' }}>{formatINR(limit)}</strong></span>
                      <span>Sanctioned: <strong style={{ color: '#166534' }}>{formatINR(sanc)}</strong></span>
                    </div>

                    {/* Mini Pace Bar */}
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          height: '100%',
                          backgroundColor: isOver ? '#dc2626' : pct > 80 ? '#3b82f6' : '#16a34a',
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: COST DRIVERS & SPEND DISTRIBUTION                      */}
        {/* ------------------------------------------------------------- */}
        {trackingViewMode === 'distribution' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                Hostel Spend Distribution ({activePeriodName} Active Heads)
              </h4>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Proportional breakdown of total monthly expenditure across active operational heads directly from DB
              </p>
            </div>

            {/* Stacked Visual Bar */}
            <div style={{ width: '100%', height: '22px', borderRadius: '8px', overflow: 'hidden', display: 'flex', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
              {rankedCostHeads.map((head, idx) => {
                const actSpend = num(head[activeMonthCol], 0);
                const share = activeMonthActualSum > 0 ? (actSpend / activeMonthActualSum) * 100 : 0;
                const colors = ['#2563eb', '#4338ca', '#0284c7', '#d97706', '#dc2626', '#ea580c'];
                const bg = colors[idx % colors.length];

                return (
                  <div
                    key={head.budget_head}
                    title={`${head.budget_head}: ${share.toFixed(1)}% (${formatINR(actSpend)})`}
                    style={{
                      width: `${share}%`,
                      height: '100%',
                      backgroundColor: bg,
                      transition: 'width 0.3s ease'
                    }}
                  />
                );
              })}
            </div>

            {/* Ranked List Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {rankedCostHeads.map((head, idx) => {
                const actSpend = num(head[activeMonthCol], 0);
                const limit = num(head.month_limit, 0);
                const share = activeMonthActualSum > 0 ? (actSpend / activeMonthActualSum) * 100 : 0;

                return (
                  <div
                    key={head.budget_head}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: '#1e1b4b',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '900',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{head.budget_head}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Limit: {formatINR(limit)}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#1e40af' }}>
                        {formatINR(actSpend)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                        {share.toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
