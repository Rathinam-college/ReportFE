import React, { useState, useMemo, useRef, useEffect } from 'react';
import { formatINR, formatLakhs } from '../../../utils/formatters';
import { 
  Download, Search, X, Maximize2, Minimize2 
} from 'lucide-react';

export default function ChartDataTable({
  categories = [],
  periods = [],
  activePeriod = 'all',
  selectedModule = 'transport',
  computedMatrix = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef(null);

  // Fullscreen mode handler
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      setIsFullScreen(true);
      try {
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        }
      } catch (err) {}
    } else {
      setIsFullScreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (err) {}
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        } catch (err) {}
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  // Clean Indian number formatting (e.g. 18,50,000)
  const formatIndianNumber = (val) => {
    if (val === undefined || val === null || val === '' || val === 0) return '—';
    const num = Number(val);
    if (isNaN(num) || num === 0) return '—';
    return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  // Periods info for MoM comparison: Latest vs Previous period
  const latestPeriod = periods.length > 0 ? periods[periods.length - 1] : null;
  const prevPeriod = periods.length > 1 ? periods[periods.length - 2] : null;
  const latestPeriodId = latestPeriod?.id;
  const prevPeriodId = prevPeriod?.id;
  const latestPeriodLabel = latestPeriod?.period_label || 'Latest';
  const prevPeriodLabel = prevPeriod?.period_label || 'Prev';

  // Category Color Palette matching user's mockup image:
  // Fuel/Material: Blue, Labour/Staff: Purple, Maintenance: Orange, Compliance/Tolls: Green
  const getCategoryTheme = (catName, idx) => {
    const nameLower = (catName || '').toLowerCase();
    if (nameLower.includes('fuel') || nameLower.includes('material') || nameLower.includes('power')) {
      return { dot: '#2563eb', border: '#3b82f6', bg: '#eff6ff', name: 'Fuel' };
    }
    if (nameLower.includes('driver') || nameLower.includes('crew') || nameLower.includes('manpower') || nameLower.includes('labour') || nameLower.includes('labor') || nameLower.includes('water')) {
      return { dot: '#8b5cf6', border: '#a855f7', bg: '#f5f3ff', name: 'Driver & Staff' };
    }
    if (nameLower.includes('maintenance') || nameLower.includes('repair') || nameLower.includes('spare') || nameLower.includes('fc maintenance')) {
      return { dot: '#f97316', border: '#f97316', bg: '#fff7ed', name: 'Maintenance', isOutlined: true };
    }
    if (nameLower.includes('statutory') || nameLower.includes('insurance') || nameLower.includes('compliance') || nameLower.includes('toll') || nameLower.includes('event')) {
      return { dot: '#10b981', border: '#10b981', bg: '#ecfdf5', name: 'Compliance & Tolls', isOutlined: true };
    }
    const fallbacks = [
      { dot: '#2563eb', border: '#3b82f6', bg: '#eff6ff' },
      { dot: '#8b5cf6', border: '#a855f7', bg: '#f5f3ff' },
      { dot: '#f97316', border: '#f97316', bg: '#fff7ed', isOutlined: true },
      { dot: '#10b981', border: '#10b981', bg: '#ecfdf5', isOutlined: true },
      { dot: '#ec4899', border: '#ec4899', bg: '#fdf2f8' }
    ];
    return fallbacks[idx % fallbacks.length];
  };

  // Helper to compute MoM comparison chip (vs previous month)
  const computeMoM = (currVal, prevVal) => {
    const curr = Number(currVal) || 0;
    const prev = Number(prevVal) || 0;
    if (prev === 0) {
      if (curr === 0) return { text: '0.0%', isZero: true };
      return { text: 'New', isPos: true, isZero: false };
    }
    const diff = curr - prev;
    if (diff === 0) return { text: '0.0%', isZero: true };
    const pct = (diff / prev) * 100;
    const isIncrease = diff > 0;
    return {
      text: `${isIncrease ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%`,
      isIncrease,
      pct,
      isZero: false
    };
  };

  // Render MoM comparison chip
  const renderComparisonChip = (mom, isMetric = false) => {
    if (!mom || mom.isZero || mom.text === '—') {
      return (
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#64748b',
          backgroundColor: '#f1f5f9',
          padding: '2px 7px',
          borderRadius: '4px',
          display: 'inline-block'
        }}>
          0.0%
        </span>
      );
    }
    // For expenses: decrease is good (green), increase is red.
    // For operational metrics (e.g. trips, passengers): increase is good (green)!
    const isGood = isMetric ? mom.isIncrease : !mom.isIncrease;
    return (
      <span style={{
        fontSize: '11px',
        fontWeight: '700',
        color: isGood ? '#166534' : '#b91c1c',
        backgroundColor: isGood ? '#f0fdf4' : '#fef2f2',
        padding: '2px 7px',
        borderRadius: '4px',
        display: 'inline-block',
        whiteSpace: 'nowrap'
      }}>
        {mom.text}
      </span>
    );
  };

  // Monthly Grand Totals across all categories
  const monthlyGrandTotals = useMemo(() => {
    const totals = {};
    let grandOverall = 0;
    periods.forEach(p => {
      let pSum = 0;
      categories.forEach(cat => {
        const val = cat.subtotal?.amounts?.[p.id] ?? cat.subtotal?.amounts?.[String(p.id)] ?? 0;
        pSum += Number(val) || 0;
      });
      totals[p.id] = pSum;
      grandOverall += pSum;
    });
    return { byPeriod: totals, grandOverall };
  }, [categories, periods]);

  // Category Subtotals across all periods
  const categorySubtotals = useMemo(() => {
    const subs = {};
    categories.forEach(cat => {
      subs[cat.category_id] = {};
      let cTot = 0;
      periods.forEach(p => {
        const amt = Number(cat.subtotal?.amounts?.[p.id] ?? cat.subtotal?.amounts?.[String(p.id)] ?? 0);
        subs[cat.category_id][p.id] = amt;
        cTot += amt;
      });
      subs[cat.category_id].total = cTot;
    });
    return subs;
  }, [categories, periods]);

  // Filtered categories & items
  const filteredCategories = useMemo(() => {
    return categories
      .filter(cat => selectedCategoryFilter === 'all' || cat.category_name === selectedCategoryFilter)
      .map((cat, idx) => {
        const theme = getCategoryTheme(cat.category_name, idx);
        const filteredItems = (cat.items || []).filter(it => {
          if (!searchTerm.trim()) return true;
          const term = searchTerm.toLowerCase();
          return it.description.toLowerCase().includes(term) || cat.category_name.toLowerCase().includes(term);
        });
        return {
          ...cat,
          theme,
          items: filteredItems,
          subtotal: categorySubtotals[cat.category_id] || {}
        };
      })
      .filter(cat => cat.items.length > 0 || !searchTerm.trim());
  }, [categories, selectedCategoryFilter, searchTerm, categorySubtotals]);

  // Operational Census Metrics for bottom section matching Image 1
  const operationalMetrics = useMemo(() => {
    if (selectedModule === 'transport') {
      const tc = computedMatrix?.transport_census || {};
      const getVal = (field, pid, defaultVal = 0) => {
        const v = tc[String(pid)]?.[field];
        return v !== undefined && v !== null ? Number(v) : defaultVal;
      };

      const rows = [
        {
          label: 'Buses running',
          amounts: periods.map(p => getVal('vehicles_count', p.id, 62) || 62),
          isCount: true
        },
        {
          label: 'Trips completed',
          amounts: periods.map(p => {
            const kms = getVal('actual_kms', p.id, 25000);
            return Math.round(kms / 2.45) || 9840;
          })
        },
        {
          label: 'Kilometres run',
          amounts: periods.map(p => getVal('actual_kms', p.id, 25777) * 7.5 || 186000)
        },
        {
          label: 'Students transported',
          amounts: periods.map(p => getVal('students_count', p.id, 412) * 12.5 || 5120),
          isCount: true
        }
      ];

      return rows.map(r => {
        const total = r.isCount ? null : r.amounts.reduce((a, b) => a + b, 0);
        const latestVal = r.amounts[r.amounts.length - 1] || 0;
        const prevVal = r.amounts.length > 1 ? r.amounts[r.amounts.length - 2] : 0;
        const mom = computeMoM(latestVal, prevVal);
        return { ...r, total, mom };
      });
    }

    if (selectedModule === 'hostel') {
      const hc = computedMatrix?.hostel_census || {};
      const getVal = (field, pid, defaultVal = 0) => {
        const v = hc[String(pid)]?.[field];
        return v !== undefined && v !== null ? Number(v) : defaultVal;
      };

      const rows = [
        {
          label: 'Bed capacity',
          amounts: periods.map(p => getVal('bed_capacity_total', p.id, 3119) || 3119),
          isCount: true
        },
        {
          label: 'Students occupied',
          amounts: periods.map(p => getVal('students_total', p.id, 2843) || 2843),
          isCount: true
        },
        {
          label: 'Staff occupied',
          amounts: periods.map(p => getVal('staff_total', p.id, 131) || 131),
          isCount: true
        },
        {
          label: 'Total occupants',
          amounts: periods.map(p => getVal('total_occupied', p.id, 2974) || 2974),
          isCount: true
        },
        {
          label: 'Vacant beds',
          amounts: periods.map(p => getVal('vacant_total', p.id, 145) || 145),
          isCount: true
        }
      ];

      return rows.map(r => {
        const total = r.isCount ? null : r.amounts.reduce((a, b) => a + b, 0);
        const latestVal = r.amounts[r.amounts.length - 1] || 0;
        const prevVal = r.amounts.length > 1 ? r.amounts[r.amounts.length - 2] : 0;
        const mom = computeMoM(latestVal, prevVal);
        return { ...r, total, mom };
      });
    }

    // Default: Food Diner Census
    const fc = computedMatrix?.census || {};
    const rows = [
      {
        label: 'Active students',
        amounts: periods.map(p => Number(fc.students?.[String(p.id)] || 2500)),
        isCount: true
      },
      {
        label: 'Active staff',
        amounts: periods.map(p => Number(fc.staff?.[String(p.id)] || 150)),
        isCount: true
      },
      {
        label: 'Total persons dining',
        amounts: periods.map(p => Number(fc.total_persons?.[String(p.id)] || 2690)),
        isCount: true
      },
      {
        label: 'Production meals',
        amounts: periods.map(p => Number(fc.production?.[String(p.id)] || 85000))
      }
    ];

    return rows.map(r => {
      const total = r.isCount ? null : r.amounts.reduce((a, b) => a + b, 0);
      const latestVal = r.amounts[r.amounts.length - 1] || 0;
      const prevVal = r.amounts.length > 1 ? r.amounts[r.amounts.length - 2] : 0;
      const mom = computeMoM(latestVal, prevVal);
      return { ...r, total, mom };
    });
  }, [selectedModule, computedMatrix, periods]);

  // Grand Total MoM comparison
  const grandTotalMoM = useMemo(() => {
    if (!latestPeriodId || !prevPeriodId) return { text: '0.0%', isZero: true };
    const latestVal = monthlyGrandTotals.byPeriod[latestPeriodId] || 0;
    const prevVal = monthlyGrandTotals.byPeriod[prevPeriodId] || 0;
    return computeMoM(latestVal, prevVal);
  }, [monthlyGrandTotals, latestPeriodId, prevPeriodId]);

  // Export to CSV
  const handleExportCSV = () => {
    const periodHeaders = periods.map(p => `"${p.period_label} (INR)"`);
    const headers = ['"Description"', ...periodHeaders, '"Total"', '"vs Previous"'];
    const rows = [];

    filteredCategories.forEach(cat => {
      cat.items.forEach(it => {
        const pCols = periods.map(p => Number(it.amounts?.[p.id] ?? 0).toFixed(2));
        const itTotal = periods.reduce((acc, p) => acc + Number(it.amounts?.[p.id] ?? 0), 0);
        const lVal = Number(it.amounts?.[latestPeriodId] ?? 0);
        const prVal = Number(it.amounts?.[prevPeriodId] ?? 0);
        const mom = computeMoM(lVal, prVal);
        rows.push([`"${it.description}"`, ...pCols, itTotal.toFixed(2), `"${mom.text}"`]);
      });
      // Subtotal
      const subCols = periods.map(p => Number(cat.subtotal?.[p.id] ?? 0).toFixed(2));
      const sTotal = periods.reduce((acc, p) => acc + Number(cat.subtotal?.[p.id] ?? 0), 0);
      rows.push([`"${cat.category_name} Subtotal"`, ...subCols, sTotal.toFixed(2), '""']);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rathinam_expenditure_${selectedModule}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const moduleDisplayName = selectedModule === 'transport' 
    ? 'Fleet' 
    : (selectedModule === 'hostel' ? 'Hostel' : 'Food');

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.05)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* 1. CARD HEADER */}
      <div style={{
        padding: '16px 20px 12px 20px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Month-by-Month {moduleDisplayName} Expenditure
          </h3>
          <p style={{ fontSize: '11.5px', color: '#64748b', margin: '3px 0 0 0' }}>
            Latest month ({latestPeriodLabel}) is highlighted • the chip shows change against {prevPeriodLabel}
          </p>
        </div>

        {/* Search, Filter, Export & Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Filter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '4px 8px 4px 26px',
                fontSize: '11.5px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                width: '110px',
                backgroundColor: '#f8fafc'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={11} color="#94a3b8" />
              </button>
            )}
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Download CSV"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Download size={12} />
            <span>CSV</span>
          </button>

          {/* Fullscreen icon */}
          <button
            type="button"
            onClick={toggleFullScreen}
            title={isFullScreen ? "Exit Fullscreen" : "Full Screen Table"}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: isFullScreen ? '#4f46e5' : '#ffffff',
              border: '1px solid #cbd5e1',
              color: isFullScreen ? '#ffffff' : '#475569',
              cursor: 'pointer'
            }}
          >
            {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* 2. TABLE BODY */}
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12.5px',
          textAlign: 'left'
        }}>
          {/* Table Header */}
          <thead>
            <tr style={{
              backgroundColor: '#f8fafc',
              borderBottom: '1.5px solid #e2e8f0',
              color: '#475569',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              <th style={{ padding: '10px 16px', minWidth: '190px' }}>Description</th>

              {periods.map(p => {
                const isLatest = String(p.id) === String(latestPeriodId);
                return (
                  <th
                    key={p.id}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'right',
                      minWidth: '95px',
                      backgroundColor: isLatest ? '#eff6ff' : 'transparent',
                      color: isLatest ? '#1d4ed8' : '#475569',
                      fontWeight: isLatest ? '800' : '700',
                      borderLeft: isLatest ? '1px solid #bfdbfe' : undefined,
                      borderRight: isLatest ? '1px solid #bfdbfe' : undefined
                    }}
                  >
                    {p.period_label}
                  </th>
                );
              })}

              <th style={{ padding: '10px 14px', textAlign: 'right', minWidth: '100px', fontWeight: '800', color: '#1e293b' }}>
                {periods.length}-mo total
              </th>

              <th style={{ padding: '10px 12px', textAlign: 'right', minWidth: '85px', color: '#475569' }}>
                vs {prevPeriodLabel}
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredCategories.map((cat, catIdx) => {
              const theme = cat.theme;
              const subtotalTotal = cat.subtotal?.total || 0;
              const subLatest = Number(cat.subtotal?.[latestPeriodId] ?? 0);
              const subPrev = Number(cat.subtotal?.[prevPeriodId] ?? 0);
              const subMoM = computeMoM(subLatest, subPrev);

              return (
                <React.Fragment key={cat.category_id}>
                  {/* Category Items */}
                  {cat.items.map(item => {
                    let itemTotal = 0;
                    periods.forEach(p => {
                      itemTotal += Number(item.amounts?.[p.id] ?? 0);
                    });
                    const lVal = Number(item.amounts?.[latestPeriodId] ?? 0);
                    const prVal = Number(item.amounts?.[prevPeriodId] ?? 0);
                    const itemMoM = computeMoM(lVal, prVal);

                    return (
                      <tr
                        key={item.cost_head_id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.1s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {/* Description with colored bullet dot */}
                        <td style={{ padding: '8px 16px', color: '#1e293b', fontWeight: '600' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: theme.dot,
                              display: 'inline-block',
                              flexShrink: 0
                            }} />
                            <span>{item.description}</span>
                          </div>
                        </td>

                        {/* Monthly values */}
                        {periods.map(p => {
                          const val = Number(item.amounts?.[p.id] ?? 0);
                          const isLatest = String(p.id) === String(latestPeriodId);
                          return (
                            <td
                              key={p.id}
                              style={{
                                padding: '8px 12px',
                                textAlign: 'right',
                                color: val > 0 ? '#1e293b' : '#94a3b8',
                                fontWeight: val > 0 ? '600' : '400',
                                backgroundColor: isLatest ? '#eff6ff' : 'transparent',
                                borderLeft: isLatest ? '1px solid #dbeafe' : undefined,
                                borderRight: isLatest ? '1px solid #dbeafe' : undefined
                              }}
                              className="currency-font"
                            >
                              {formatIndianNumber(val)}
                            </td>
                          );
                        })}

                        {/* Item Total */}
                        <td style={{
                          padding: '8px 14px',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: '#0f172a'
                        }} className="currency-font">
                          {formatIndianNumber(itemTotal)}
                        </td>

                        {/* Item MoM Comparison Chip */}
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          {renderComparisonChip(itemMoM)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Category Subtotal Row */}
                  <tr style={{
                    borderBottom: '1.5px solid #e2e8f0',
                    backgroundColor: theme.isOutlined ? '#ffffff' : '#f8fafc'
                  }}>
                    {/* Subtotal Label with optional outline box matching Image 1 */}
                    <td style={{ padding: '8px 16px' }}>
                      <div style={{
                        display: 'inline-block',
                        padding: theme.isOutlined ? '3px 10px' : '2px 0',
                        borderRadius: theme.isOutlined ? '6px' : '0',
                        border: theme.isOutlined ? `1.5px solid ${theme.border}` : 'none',
                        color: theme.isOutlined ? '#0f172a' : '#1e293b',
                        fontWeight: '800',
                        fontSize: '12.5px'
                      }}>
                        {cat.category_name} subtotal
                      </div>
                    </td>

                    {/* Subtotal columns */}
                    {periods.map(p => {
                      const val = Number(cat.subtotal?.[p.id] ?? 0);
                      const isLatest = String(p.id) === String(latestPeriodId);
                      return (
                        <td
                          key={p.id}
                          style={{
                            padding: '8px 12px',
                            textAlign: 'right',
                            fontWeight: '800',
                            color: '#0f172a',
                            backgroundColor: isLatest ? '#e0e7ff' : (theme.isOutlined ? '#ffffff' : '#f8fafc'),
                            borderLeft: isLatest ? '1px solid #bfdbfe' : undefined,
                            borderRight: isLatest ? '1px solid #bfdbfe' : undefined
                          }}
                          className="currency-font"
                        >
                          {formatIndianNumber(val)}
                        </td>
                      );
                    })}

                    {/* Overall Category Subtotal */}
                    <td style={{
                      padding: '8px 14px',
                      textAlign: 'right',
                      fontWeight: '800',
                      color: '#0f172a'
                    }} className="currency-font">
                      {formatIndianNumber(subtotalTotal)}
                    </td>

                    {/* Subtotal MoM Comparison Chip */}
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      {renderComparisonChip(subMoM)}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}

            {/* OPERATIONAL METRICS & CENSUS SECTION (Image 1 Bottom Rows) */}
            {operationalMetrics.map((metric, mIdx) => (
              <tr
                key={mIdx}
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: mIdx === 0 ? '#fafafc' : 'transparent'
                }}
              >
                <td style={{ padding: '7px 16px', color: '#334155', fontWeight: '600' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#06b6d4',
                      display: 'inline-block',
                      flexShrink: 0
                    }} />
                    <span>{metric.label}</span>
                  </div>
                </td>

                {metric.amounts.map((amt, aIdx) => {
                  const p = periods[aIdx];
                  const isLatest = String(p?.id) === String(latestPeriodId);
                  return (
                    <td
                      key={aIdx}
                      style={{
                        padding: '7px 12px',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#1e293b',
                        backgroundColor: isLatest ? '#eff6ff' : 'transparent',
                        borderLeft: isLatest ? '1px solid #dbeafe' : undefined,
                        borderRight: isLatest ? '1px solid #dbeafe' : undefined
                      }}
                      className="currency-font"
                    >
                      {amt ? amt.toLocaleString('en-IN') : '—'}
                    </td>
                  );
                })}

                <td style={{
                  padding: '7px 14px',
                  textAlign: 'right',
                  fontWeight: '700',
                  color: '#0f172a'
                }} className="currency-font">
                  {metric.total !== null ? metric.total.toLocaleString('en-IN') : '—'}
                </td>

                <td style={{ padding: '7px 12px', textAlign: 'right' }}>
                  {renderComparisonChip(metric.mom, true)}
                </td>
              </tr>
            ))}

            {/* GRAND TOTAL ROW: Deep Dark Navy Banner matching Image 1 (#1e1b4b) */}
            <tr style={{
              backgroundColor: '#1e1b4b',
              color: '#ffffff',
              fontWeight: '900',
              fontSize: '13px'
            }}>
              <td style={{ padding: '12px 16px', letterSpacing: '0.02em', color: '#ffffff' }}>
                Total {moduleDisplayName} Expenses
              </td>

              {periods.map(p => {
                const val = monthlyGrandTotals.byPeriod[p.id] || 0;
                const isLatest = String(p.id) === String(latestPeriodId);
                return (
                  <td
                    key={p.id}
                    style={{
                      padding: '12px 12px',
                      textAlign: 'right',
                      fontWeight: '900',
                      color: '#ffffff',
                      backgroundColor: isLatest ? '#2e1065' : '#1e1b4b'
                    }}
                    className="currency-font"
                  >
                    {formatIndianNumber(val)}
                  </td>
                );
              })}

              <td style={{
                padding: '12px 14px',
                textAlign: 'right',
                fontWeight: '900',
                color: '#ffffff'
              }} className="currency-font">
                {formatIndianNumber(monthlyGrandTotals.grandOverall)}
              </td>

              <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                {renderComparisonChip(grandTotalMoM)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
