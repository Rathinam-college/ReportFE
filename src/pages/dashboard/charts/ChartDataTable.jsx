import React, { useState, useMemo, useRef, useEffect } from 'react';
import { formatINR } from '../../../utils/formatters';
import { 
  Download, Search, X, Maximize2, Minimize2, Sparkles, Filter
} from 'lucide-react';

export default function ChartDataTable({
  categories = [],
  periods = [],
  activePeriod = 'all',
  selectedModule = 'food'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef(null);

  // Toggle Fullscreen mode seamlessly
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

  // Sync with native Escape / fullscreenchange events
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

  // Lock body scroll when in fullscreen
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFullScreen]);

  // Transparent UI Category Theme Palette (Refined Glass Accents)
  const getCategoryTheme = (catName, idx) => {
    const nameLower = (catName || '').toLowerCase();
    if (nameLower.includes('material') || nameLower.includes('fuel')) {
      return {
        badgeBg: 'rgba(59, 130, 246, 0.08)',
        badgeBorder: 'rgba(59, 130, 246, 0.25)',
        badgeText: '#1d4ed8',
        subtotalBg: 'rgba(59, 130, 246, 0.05)',
        dotColor: '#3b82f6'
      };
    }
    if (nameLower.includes('labour') || nameLower.includes('labor') || nameLower.includes('driver') || nameLower.includes('crew') || nameLower.includes('manpower')) {
      return {
        badgeBg: 'rgba(139, 92, 246, 0.08)',
        badgeBorder: 'rgba(139, 92, 246, 0.25)',
        badgeText: '#6d28d9',
        subtotalBg: 'rgba(139, 92, 246, 0.05)',
        dotColor: '#8b5cf6'
      };
    }
    if (nameLower.includes('maintenance') || nameLower.includes('fc') || nameLower.includes('power') || nameLower.includes('repair')) {
      return {
        badgeBg: 'rgba(245, 158, 11, 0.08)',
        badgeBorder: 'rgba(245, 158, 11, 0.25)',
        badgeText: '#b45309',
        subtotalBg: 'rgba(245, 158, 11, 0.05)',
        dotColor: '#f59e0b'
      };
    }
    if (nameLower.includes('event') || nameLower.includes('water') || nameLower.includes('statutory') || nameLower.includes('insurance')) {
      return {
        badgeBg: 'rgba(16, 185, 129, 0.08)',
        badgeBorder: 'rgba(16, 185, 129, 0.25)',
        badgeText: '#047857',
        subtotalBg: 'rgba(16, 185, 129, 0.05)',
        dotColor: '#10b981'
      };
    }
    if (nameLower.includes('festival') || nameLower.includes('resident')) {
      return {
        badgeBg: 'rgba(236, 72, 153, 0.08)',
        badgeBorder: 'rgba(236, 72, 153, 0.25)',
        badgeText: '#be185d',
        subtotalBg: 'rgba(236, 72, 153, 0.05)',
        dotColor: '#ec4899'
      };
    }
    const fallbacks = [
      { badgeBg: 'rgba(59, 130, 246, 0.08)', badgeBorder: 'rgba(59, 130, 246, 0.25)', badgeText: '#1d4ed8', subtotalBg: 'rgba(59, 130, 246, 0.05)', dotColor: '#3b82f6' },
      { badgeBg: 'rgba(139, 92, 246, 0.08)', badgeBorder: 'rgba(139, 92, 246, 0.25)', badgeText: '#6d28d9', subtotalBg: 'rgba(139, 92, 246, 0.05)', dotColor: '#8b5cf6' },
      { badgeBg: 'rgba(245, 158, 11, 0.08)', badgeBorder: 'rgba(245, 158, 11, 0.25)', badgeText: '#b45309', subtotalBg: 'rgba(245, 158, 11, 0.05)', dotColor: '#f59e0b' },
      { badgeBg: 'rgba(16, 185, 129, 0.08)', badgeBorder: 'rgba(16, 185, 129, 0.25)', badgeText: '#047857', subtotalBg: 'rgba(16, 185, 129, 0.05)', dotColor: '#10b981' }
    ];
    return fallbacks[idx % fallbacks.length];
  };

  // Indian currency formatting (e.g. 58,39,162)
  const formatIndianNumber = (val) => {
    if (val === undefined || val === null || val === '' || val === 0) return '—';
    const num = Number(val);
    if (isNaN(num) || num === 0) return '—';
    return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  // Unique category names for filtering
  const categoryNames = useMemo(() => {
    return categories.map(c => c.category_name);
  }, [categories]);

  // Compute month-by-month grand totals across all categories
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
    const avgMonthly = periods.length > 0 ? (grandOverall / periods.length) : 0;
    return {
      byPeriod: totals,
      grandOverall,
      avgMonthly
    };
  }, [categories, periods]);

  // Subtotals by category for each period
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

  // Grouped by Category for Transparent UI presentation
  const groupedCategories = useMemo(() => {
    const list = [];
    categories.forEach((cat, idx) => {
      if (selectedCategoryFilter !== 'all' && cat.category_name !== selectedCategoryFilter) return;

      const items = cat.items?.filter(it => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return it.description.toLowerCase().includes(term) || cat.category_name.toLowerCase().includes(term);
      }) || [];

      if (items.length === 0 && searchTerm.trim()) return;

      list.push({
        categoryId: cat.category_id,
        categoryName: cat.category_name,
        theme: getCategoryTheme(cat.category_name, idx),
        items: items,
        subtotal: categorySubtotals[cat.category_id] || {}
      });
    });
    return list;
  }, [categories, categorySubtotals, selectedCategoryFilter, searchTerm]);

  // Special Combined Subtotals:
  // Food Material + Food Labour summed as "Total Food Expenses"
  const foodCombinedSubtotal = useMemo(() => {
    const totals = {};
    let allTotal = 0;
    periods.forEach(p => {
      let pSum = 0;
      categories.forEach(cat => {
        const lower = cat.category_name.toLowerCase();
        if (lower.includes('material') || lower.includes('labour') || lower.includes('labor')) {
          pSum += Number(cat.subtotal?.amounts?.[p.id] ?? cat.subtotal?.amounts?.[String(p.id)] ?? 0);
        }
      });
      totals[p.id] = pSum;
      allTotal += pSum;
    });
    return { totals, allTotal };
  }, [categories, periods]);

  // Export to CSV
  const handleExportCSV = () => {
    const periodHeaders = periods.map(p => `"${p.period_label} (INR)"`);
    const headers = ['"Category"', '"Description"', ...periodHeaders, '"Total Spend (INR)"', '"Avg / Month (INR)"'];
    const rows = [];

    groupedCategories.forEach(grp => {
      grp.items.forEach(it => {
        const pCols = periods.map(p => Number(it.amounts?.[p.id] ?? 0).toFixed(2));
        const itTotal = periods.reduce((acc, p) => acc + Number(it.amounts?.[p.id] ?? 0), 0);
        const itAvg = periods.length > 0 ? itTotal / periods.length : 0;
        rows.push([
          `"${grp.categoryName}"`,
          `"${it.description}"`,
          ...pCols,
          itTotal.toFixed(2),
          itAvg.toFixed(2)
        ]);
      });
    });

    const grandPCols = periods.map(p => (monthlyGrandTotals.byPeriod[p.id] || 0).toFixed(2));
    rows.push([
      '"ALL CATEGORIES"',
      '"TOTAL EXPENSES"',
      ...grandPCols,
      monthlyGrandTotals.grandOverall.toFixed(2),
      monthlyGrandTotals.avgMonthly.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rathinam_${selectedModule}_expenditure_ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: isFullScreen ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '1px solid rgba(226, 232, 240, 0.85)',
        boxShadow: isFullScreen 
          ? 'none' 
          : '0 10px 30px -5px rgba(99, 102, 241, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* 1. GLASS HEADER CONTROL BAR */}
      <div style={{
        padding: '14px 22px',
        backgroundColor: 'rgba(248, 250, 252, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        position: isFullScreen ? 'sticky' : 'relative',
        top: isFullScreen ? 0 : undefined,
        zIndex: isFullScreen ? 20 : undefined
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4f46e5'
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                Month-by-Month Expenditure Data Sheet
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                color: '#4338ca',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}>
                Transparent Glass UI
              </span>
              {isFullScreen && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0'
                }}>
                  Full Screen • Press Esc to exit
                </span>
              )}
            </div>
            <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              Translucent multi-cycle financial ledger • Smooth line-by-line progression & category subtotals
            </p>
          </div>
        </div>

        {/* View mode controls: Search, Category filter, CSV & Full Screen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Transparent Search box */}
          <div style={{ position: 'relative' }}>
            <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search line item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '5px 10px 5px 28px',
                fontSize: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(203, 213, 225, 0.7)',
                outline: 'none',
                width: '160px',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                color: '#1e293b'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} color="#94a3b8" />
              </button>
            )}
          </div>

          {/* Transparent Category Filter Dropdown */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '8px',
              border: '1px solid rgba(203, 213, 225, 0.7)',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Categories ({categoryNames.length})</option>
            {categoryNames.map(cn => (
              <option key={cn} value={cn}>{cn}</option>
            ))}
          </select>

          {/* CSV Export */}
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(203, 213, 225, 0.8)',
              color: '#334155',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.12s ease'
            }}
          >
            <Download size={13} color="#475569" />
            <span>CSV</span>
          </button>

          {/* Full Screen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullScreen}
            title={isFullScreen ? "Exit Full Screen (Esc)" : "Expand Sheet to Full Screen"}
            aria-label={isFullScreen ? "Exit Full Screen" : "Expand Sheet to Full Screen"}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: isFullScreen ? '#4f46e5' : 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(203, 213, 225, 0.8)',
              color: isFullScreen ? '#ffffff' : '#4f46e5',
              cursor: 'pointer',
              boxShadow: isFullScreen ? '0 2px 6px rgba(79, 70, 229, 0.3)' : '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease'
            }}
          >
            {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* 2. TRANSPARENT TABLE PRESENTATION */}
      <div style={{ 
        overflowX: 'auto', 
        overflowY: isFullScreen ? 'auto' : 'visible',
        padding: isFullScreen ? '16px 24px' : '0',
        flex: isFullScreen ? 1 : undefined,
        maxHeight: isFullScreen ? 'calc(100vh - 72px)' : undefined
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
          fontSize: '13px',
          textAlign: 'left'
        }}>
          {/* Frosted Glass Table Header */}
          <thead style={isFullScreen ? { position: 'sticky', top: 0, zIndex: 10 } : undefined}>
            <tr style={{
              backgroundColor: 'rgba(241, 245, 249, 0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderBottom: '1.5px solid rgba(203, 213, 225, 0.8)',
              color: '#334155',
              fontSize: '12.5px',
              fontWeight: '700'
            }}>
              <th style={{
                padding: '12px 18px',
                width: '180px',
                textAlign: 'center',
                borderBottom: '1.5px solid rgba(203, 213, 225, 0.8)',
                borderRight: '1px solid rgba(226, 232, 240, 0.8)'
              }}>
                Category
              </th>
              <th style={{
                padding: '12px 18px',
                minWidth: '220px',
                textAlign: 'left',
                borderBottom: '1.5px solid rgba(203, 213, 225, 0.8)',
                borderRight: '1px solid rgba(226, 232, 240, 0.8)'
              }}>
                Description
              </th>

              {/* All Periods as columns */}
              {periods.map(p => {
                const isSel = String(p.id) === String(activePeriod);
                return (
                  <th
                    key={p.id}
                    style={{
                      padding: '12px 14px',
                      minWidth: '120px',
                      textAlign: 'right',
                      borderBottom: '1.5px solid rgba(203, 213, 225, 0.8)',
                      borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                      backgroundColor: isSel ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      color: isSel ? '#4338ca' : '#334155',
                      fontWeight: isSel ? '800' : '700'
                    }}
                  >
                    {p.period_label} {isSel && '★'}
                  </th>
                );
              })}

              <th style={{
                padding: '12px 16px',
                minWidth: '130px',
                textAlign: 'right',
                borderBottom: '1.5px solid rgba(203, 213, 225, 0.8)',
                borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                color: '#0f172a',
                fontWeight: '800'
              }}>
                Total (All Mo)
              </th>
              <th style={{
                padding: '12px 14px',
                minWidth: '110px',
                textAlign: 'right',
                borderBottom: '1.5px solid rgba(203, 213, 225, 0.8)',
                color: '#475569',
                fontWeight: '700'
              }}>
                Avg / Mo
              </th>
            </tr>
          </thead>

          <tbody>
            {groupedCategories.map((grp) => {
              const theme = grp.theme;
              const itemsCount = grp.items.length;
              const isFoodLabour = grp.categoryName.toLowerCase().includes('labour') || grp.categoryName.toLowerCase().includes('labor');
              const isFCMaintenance = grp.categoryName.toLowerCase().includes('fc maintenance') || grp.categoryName.toLowerCase().includes('maintenance');

              return (
                <React.Fragment key={grp.categoryId}>
                  {/* Category Line Items */}
                  {grp.items.map((item, itemIdx) => {
                    let itemTotal = 0;
                    periods.forEach(p => {
                      const v = Number(item.amounts?.[p.id] ?? item.amounts?.[String(p.id)] ?? 0);
                      itemTotal += v;
                    });
                    const itemAvg = periods.length > 0 ? (itemTotal / periods.length) : 0;

                    return (
                      <tr
                        key={item.cost_head_id}
                        style={{
                          borderBottom: '1px solid rgba(241, 245, 249, 0.85)',
                          transition: 'background-color 0.12s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(241, 245, 249, 0.55)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {/* Merged Category column on first row with soft transparent glass badge */}
                        {itemIdx === 0 && (
                          <td
                            rowSpan={itemsCount}
                            style={{
                              padding: '14px 16px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              backgroundColor: 'rgba(255, 255, 255, 0.45)',
                              borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                              borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
                            }}
                          >
                            <div style={{
                              display: 'inline-block',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              backgroundColor: theme.badgeBg,
                              border: `1px solid ${theme.badgeBorder}`,
                              color: theme.badgeText,
                              fontWeight: '800',
                              fontSize: '12.5px',
                              letterSpacing: '0.01em'
                            }}>
                              {grp.categoryName}
                            </div>
                          </td>
                        )}

                        {/* Description Cell */}
                        <td style={{
                          padding: '10px 18px',
                          fontWeight: '600',
                          color: '#1e293b',
                          borderRight: '1px solid rgba(226, 232, 240, 0.7)',
                          borderBottom: '1px solid rgba(241, 245, 249, 0.9)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: theme.dotColor,
                              display: 'inline-block',
                              flexShrink: 0
                            }} />
                            <span>{item.description}</span>
                          </div>
                        </td>

                        {/* Monthly Values with Transparent Glass Cells */}
                        {periods.map(p => {
                          const val = Number(item.amounts?.[p.id] ?? item.amounts?.[String(p.id)] ?? 0);
                          const isSel = String(p.id) === String(activePeriod);
                          return (
                            <td
                              key={p.id}
                              style={{
                                padding: '10px 14px',
                                textAlign: 'right',
                                backgroundColor: isSel ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                                color: val > 0 ? '#0f172a' : '#94a3b8',
                                fontWeight: val > 0 ? '600' : '400',
                                borderRight: '1px solid rgba(226, 232, 240, 0.6)',
                                borderBottom: '1px solid rgba(241, 245, 249, 0.9)'
                              }}
                              className="currency-font"
                            >
                              {formatIndianNumber(val)}
                            </td>
                          );
                        })}

                        {/* Total Spend */}
                        <td style={{
                          padding: '10px 16px',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: '#0f172a',
                          backgroundColor: 'rgba(248, 250, 252, 0.45)',
                          borderRight: '1px solid rgba(226, 232, 240, 0.7)',
                          borderBottom: '1px solid rgba(241, 245, 249, 0.9)'
                        }} className="currency-font">
                          {formatIndianNumber(itemTotal)}
                        </td>

                        {/* Avg / Mo */}
                        <td style={{
                          padding: '10px 14px',
                          textAlign: 'right',
                          color: '#475569',
                          backgroundColor: 'rgba(248, 250, 252, 0.45)',
                          borderBottom: '1px solid rgba(241, 245, 249, 0.9)'
                        }} className="currency-font">
                          {formatIndianNumber(itemAvg)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* SPECIAL COMBINED SUBTOTAL 1: Food Labour -> "Total Food Expenses" */}
                  {selectedModule === 'food' && isFoodLabour && (
                    <tr style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.06)',
                      backdropFilter: 'blur(8px)',
                      color: '#0f172a',
                      borderTop: '1.5px solid rgba(99, 102, 241, 0.25)',
                      borderBottom: '1.5px solid rgba(99, 102, 241, 0.25)',
                      fontWeight: '800',
                      fontSize: '13px'
                    }}>
                      <td colSpan={2} style={{
                        padding: '11px 18px',
                        textAlign: 'left',
                        borderRight: '1px solid rgba(99, 102, 241, 0.2)',
                        letterSpacing: '0.01em',
                        color: '#312e81'
                      }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#6366f1' }} />
                          <span>Total Food Expenses (Material + Labour)</span>
                        </div>
                      </td>

                      {periods.map(p => {
                        const tot = foodCombinedSubtotal.totals[p.id] || 0;
                        const isSel = String(p.id) === String(activePeriod);
                        return (
                          <td
                            key={p.id}
                            style={{
                              padding: '11px 14px',
                              textAlign: 'right',
                              borderRight: '1px solid rgba(99, 102, 241, 0.2)',
                              fontWeight: '800',
                              color: '#1e1b4b',
                              backgroundColor: isSel ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                            }}
                            className="currency-font"
                          >
                            {formatIndianNumber(tot)}
                          </td>
                        );
                      })}

                      <td style={{
                        padding: '11px 16px',
                        textAlign: 'right',
                        borderRight: '1px solid rgba(99, 102, 241, 0.2)',
                        fontWeight: '800',
                        color: '#1e1b4b'
                      }} className="currency-font">
                        {formatIndianNumber(foodCombinedSubtotal.allTotal)}
                      </td>

                      <td style={{
                        padding: '11px 14px',
                        textAlign: 'right',
                        fontWeight: '800',
                        color: '#4338ca'
                      }} className="currency-font">
                        {formatIndianNumber(periods.length > 0 ? (foodCombinedSubtotal.allTotal / periods.length) : 0)}
                      </td>
                    </tr>
                  )}

                  {/* SPECIAL COMBINED SUBTOTAL 2: FC Maintenance -> "Total Maintenance Expenses" */}
                  {selectedModule === 'food' && isFCMaintenance && (
                    <tr style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.06)',
                      backdropFilter: 'blur(8px)',
                      color: '#0f172a',
                      borderTop: '1.5px solid rgba(245, 158, 11, 0.25)',
                      borderBottom: '1.5px solid rgba(245, 158, 11, 0.25)',
                      fontWeight: '800',
                      fontSize: '13px'
                    }}>
                      <td colSpan={2} style={{
                        padding: '11px 18px',
                        textAlign: 'left',
                        borderRight: '1px solid rgba(245, 158, 11, 0.2)',
                        letterSpacing: '0.01em',
                        color: '#78350f'
                      }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f59e0b' }} />
                          <span>Total Maintenance Expenses</span>
                        </div>
                      </td>

                      {periods.map(p => {
                        const subVal = grp.subtotal[p.id] || 0;
                        const isSel = String(p.id) === String(activePeriod);
                        return (
                          <td
                            key={p.id}
                            style={{
                              padding: '11px 14px',
                              textAlign: 'right',
                              borderRight: '1px solid rgba(245, 158, 11, 0.2)',
                              fontWeight: '800',
                              color: '#78350f',
                              backgroundColor: isSel ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
                            }}
                            className="currency-font"
                          >
                            {formatIndianNumber(subVal)}
                          </td>
                        );
                      })}

                      <td style={{
                        padding: '11px 16px',
                        textAlign: 'right',
                        borderRight: '1px solid rgba(245, 158, 11, 0.2)',
                        fontWeight: '800',
                        color: '#78350f'
                      }} className="currency-font">
                        {formatIndianNumber(grp.subtotal.total || 0)}
                      </td>

                      <td style={{
                        padding: '11px 14px',
                        textAlign: 'right',
                        fontWeight: '800',
                        color: '#b45309'
                      }} className="currency-font">
                        {formatIndianNumber(periods.length > 0 ? ((grp.subtotal.total || 0) / periods.length) : 0)}
                      </td>
                    </tr>
                  )}

                  {/* Standard Subtotal Row for other categories and modules */}
                  {(!isFoodLabour && !isFCMaintenance) && (
                    <tr style={{
                      backgroundColor: theme.subtotalBg || 'rgba(248, 250, 252, 0.65)',
                      backdropFilter: 'blur(8px)',
                      color: '#0f172a',
                      borderTop: '1.5px solid rgba(203, 213, 225, 0.8)',
                      borderBottom: '1.5px solid rgba(203, 213, 225, 0.8)',
                      fontWeight: '800',
                      fontSize: '13px'
                    }}>
                      <td colSpan={2} style={{
                        padding: '10px 18px',
                        textAlign: 'left',
                        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                        color: '#1e293b'
                      }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: theme.dotColor }} />
                          <span>Total {grp.categoryName}</span>
                        </div>
                      </td>

                      {periods.map(p => {
                        const subVal = grp.subtotal[p.id] || 0;
                        const isSel = String(p.id) === String(activePeriod);
                        return (
                          <td
                            key={p.id}
                            style={{
                              padding: '10px 14px',
                              textAlign: 'right',
                              borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                              fontWeight: '800',
                              color: '#0f172a',
                              backgroundColor: isSel ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                            }}
                            className="currency-font"
                          >
                            {formatIndianNumber(subVal)}
                          </td>
                        );
                      })}

                      <td style={{
                        padding: '10px 16px',
                        textAlign: 'right',
                        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                        fontWeight: '800',
                        color: '#0f172a'
                      }} className="currency-font">
                        {formatIndianNumber(grp.subtotal.total || 0)}
                      </td>

                      <td style={{
                        padding: '10px 14px',
                        textAlign: 'right',
                        fontWeight: '800',
                        color: '#475569'
                      }} className="currency-font">
                        {formatIndianNumber(periods.length > 0 ? ((grp.subtotal.total || 0) / periods.length) : 0)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {/* BOTTOM GRAND TOTAL ROW: Transparent Deep Slate/Navy Glass Bar */}
            <tr style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 41, 59, 0.98) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              color: '#ffffff',
              fontWeight: '900',
              fontSize: '13.5px',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.06)'
            }}>
              <td colSpan={2} style={{
                padding: '14px 20px',
                textAlign: 'left',
                borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                letterSpacing: '0.03em',
                color: '#ffffff'
              }}>
                TOTAL EXPENSES • ALL CATEGORIES
              </td>

              {periods.map(p => {
                const gVal = monthlyGrandTotals.byPeriod[p.id] || 0;
                const isSel = String(p.id) === String(activePeriod);
                return (
                  <td
                    key={p.id}
                    style={{
                      padding: '14px 14px',
                      textAlign: 'right',
                      borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                      fontWeight: '900',
                      color: isSel ? '#60a5fa' : '#ffffff',
                      backgroundColor: isSel ? 'rgba(59, 130, 246, 0.18)' : 'transparent'
                    }}
                    className="currency-font"
                  >
                    {formatIndianNumber(gVal)}
                  </td>
                );
              })}

              {/* Overall Grand Total */}
              <td style={{
                padding: '14px 16px',
                textAlign: 'right',
                borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                fontWeight: '900',
                color: '#ffffff'
              }} className="currency-font">
                {formatIndianNumber(monthlyGrandTotals.grandOverall)}
              </td>

              {/* Monthly Average */}
              <td style={{
                padding: '14px 14px',
                textAlign: 'right',
                fontWeight: '900',
                color: '#93c5fd'
              }} className="currency-font">
                {formatIndianNumber(monthlyGrandTotals.avgMonthly)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
