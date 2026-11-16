import React, { useState, useMemo, useRef, useEffect } from 'react';
import { formatINR } from '../../../utils/formatters';
import { 
  Download, Search, X, Maximize2, Minimize2, Sparkles, Filter, Percent
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
  const [displayMode, setDisplayMode] = useState('both'); // 'both' | 'percentage_only' | 'amount_only'
  const [percentageBasis, setPercentageBasis] = useState('month_total'); // 'month_total' | 'category_subtotal'
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

  // Safe percentage calculation
  const computePercentage = (val, total) => {
    if (!val || !total || total === 0) return 0;
    const num = Number(val);
    const tot = Number(total);
    if (isNaN(num) || isNaN(tot) || tot === 0) return 0;
    return (num / tot) * 100;
  };

  // Formatted percentage string (e.g. 66.8% or <0.1%)
  const formatPercentage = (pct) => {
    if (pct === undefined || pct === null || isNaN(pct) || pct === 0) return '0.0%';
    if (pct < 0.05 && pct > 0) return '<0.1%';
    return `${pct.toFixed(1)}%`;
  };

  // Unified cell renderer for amounts and percentages
  const renderCellContent = (amount, total, isBold = false, isSubtotal = false, customBadgeTheme = null) => {
    const num = Number(amount) || 0;
    if (num === 0 && (!amount || amount === 0)) {
      return <span style={{ color: '#94a3b8' }}>—</span>;
    }

    const pct = computePercentage(num, total);
    const pctStr = formatPercentage(pct);

    if (displayMode === 'percentage_only') {
      return (
        <span style={{
          fontSize: isSubtotal ? '12.5px' : '12px',
          fontWeight: isBold ? '800' : '700',
          color: customBadgeTheme ? customBadgeTheme.text : (isSubtotal ? '#1d4ed8' : '#4338ca'),
          backgroundColor: customBadgeTheme ? customBadgeTheme.bg : (isSubtotal ? 'rgba(37, 99, 235, 0.1)' : 'rgba(99, 102, 241, 0.08)'),
          border: `1px solid ${customBadgeTheme ? customBadgeTheme.border : (isSubtotal ? 'rgba(37, 99, 235, 0.25)' : 'rgba(99, 102, 241, 0.2)')}`,
          padding: '2px 8px',
          borderRadius: '6px',
          letterSpacing: '0.01em',
          display: 'inline-block'
        }}>
          {pctStr}
        </span>
      );
    }

    if (displayMode === 'amount_only') {
      return (
        <span style={{
          fontSize: isSubtotal ? '13px' : '12.5px',
          fontWeight: isBold ? '800' : '600',
          color: isSubtotal ? '#0f172a' : (num > 0 ? '#0f172a' : '#94a3b8')
        }}>
          {formatIndianNumber(num)}
        </span>
      );
    }

    // Default: 'both' (Shows both Rupee Amount and Percentage badge)
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '2px'
      }}>
        <span style={{
          fontSize: isSubtotal ? '13px' : '12.5px',
          fontWeight: isBold ? '800' : '600',
          color: isSubtotal ? '#0f172a' : (num > 0 ? '#0f172a' : '#94a3b8')
        }}>
          {formatIndianNumber(num)}
        </span>
        {num > 0 && (
          <span style={{
            fontSize: '10.5px',
            fontWeight: isSubtotal ? '800' : '700',
            color: customBadgeTheme ? customBadgeTheme.text : (isSubtotal ? '#1d4ed8' : '#4f46e5'),
            backgroundColor: customBadgeTheme ? customBadgeTheme.bg : (isSubtotal ? 'rgba(59, 130, 246, 0.1)' : 'rgba(99, 102, 241, 0.08)'),
            border: `1px solid ${customBadgeTheme ? customBadgeTheme.border : (isSubtotal ? 'rgba(59, 130, 246, 0.22)' : 'rgba(99, 102, 241, 0.18)')}`,
            padding: '1px 5px',
            borderRadius: '4px',
            letterSpacing: '0.01em',
            lineHeight: '1.2'
          }}>
            {pctStr}
          </span>
        )}
      </div>
    );
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

  // Export to CSV with percentages
  const handleExportCSV = () => {
    const periodHeaders = periods.flatMap(p => [`"${p.period_label} (INR)"`, `"${p.period_label} (%)"`]);
    const headers = ['"Category"', '"Description"', ...periodHeaders, '"Total Spend (INR)"', '"Total (%)"', '"Avg / Month (INR)"', '"Avg (%)"'];
    const rows = [];

    groupedCategories.forEach(grp => {
      grp.items.forEach(it => {
        const pCols = periods.flatMap(p => {
          const amt = Number(it.amounts?.[p.id] ?? 0);
          const denom = percentageBasis === 'category_subtotal'
            ? (categorySubtotals[grp.categoryId]?.[p.id] || 0)
            : (monthlyGrandTotals.byPeriod[p.id] || 0);
          const pct = computePercentage(amt, denom);
          return [amt.toFixed(2), `"${pct.toFixed(1)}%"`];
        });
        const itTotal = periods.reduce((acc, p) => acc + Number(it.amounts?.[p.id] ?? 0), 0);
        const itTotalDenom = percentageBasis === 'category_subtotal'
          ? (categorySubtotals[grp.categoryId]?.total || 0)
          : (monthlyGrandTotals.grandOverall || 0);
        const itTotalPct = computePercentage(itTotal, itTotalDenom);
        const itAvg = periods.length > 0 ? itTotal / periods.length : 0;
        const itAvgDenom = percentageBasis === 'category_subtotal'
          ? ((categorySubtotals[grp.categoryId]?.total || 0) / (periods.length || 1))
          : (monthlyGrandTotals.avgMonthly || 0);
        const itAvgPct = computePercentage(itAvg, itAvgDenom);

        rows.push([
          `"${grp.categoryName}"`,
          `"${it.description}"`,
          ...pCols,
          itTotal.toFixed(2),
          `"${itTotalPct.toFixed(1)}%"`,
          itAvg.toFixed(2),
          `"${itAvgPct.toFixed(1)}%"`
        ]);
      });
    });

    const grandPCols = periods.flatMap(p => [
      (monthlyGrandTotals.byPeriod[p.id] || 0).toFixed(2),
      '"100.0%"'
    ]);
    rows.push([
      '"ALL CATEGORIES"',
      '"TOTAL EXPENSES"',
      ...grandPCols,
      monthlyGrandTotals.grandOverall.toFixed(2),
      '"100.0%"',
      monthlyGrandTotals.avgMonthly.toFixed(2),
      '"100.0%"'
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
              Translucent multi-cycle financial ledger • Exact figures & percentage share of total expenditure
            </p>
          </div>
        </div>

        {/* View mode controls: Search, Category filter, Percentage Mode Switch, CSV & Full Screen */}
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

          {/* View Mode Segmented Control: [₹ + %] | [% Only] | [₹ Only] */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'rgba(241, 245, 249, 0.95)',
            borderRadius: '8px',
            padding: '2px',
            border: '1px solid rgba(203, 213, 225, 0.8)'
          }}>
            <button
              type="button"
              onClick={() => setDisplayMode('both')}
              title="Show both Rupee amount and percentage badge"
              style={{
                padding: '4px 9px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: displayMode === 'both' ? '800' : '600',
                backgroundColor: displayMode === 'both' ? '#ffffff' : 'transparent',
                color: displayMode === 'both' ? '#4f46e5' : '#64748b',
                boxShadow: displayMode === 'both' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.12s ease'
              }}
            >
              <Percent size={12} />
              <span>₹ + %</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('percentage_only')}
              title="Show percentage values only"
              style={{
                padding: '4px 9px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: displayMode === 'percentage_only' ? '800' : '600',
                backgroundColor: displayMode === 'percentage_only' ? '#ffffff' : 'transparent',
                color: displayMode === 'percentage_only' ? '#4f46e5' : '#64748b',
                boxShadow: displayMode === 'percentage_only' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.12s ease'
              }}
            >
              <span>% Only</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('amount_only')}
              title="Show Rupee amounts only"
              style={{
                padding: '4px 9px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: displayMode === 'amount_only' ? '800' : '600',
                backgroundColor: displayMode === 'amount_only' ? '#ffffff' : 'transparent',
                color: displayMode === 'amount_only' ? '#4f46e5' : '#64748b',
                boxShadow: displayMode === 'amount_only' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.12s ease'
              }}
            >
              <span>₹ Only</span>
            </button>
          </div>

          {/* Basis Toggle: % of Month Total vs % of Category */}
          {displayMode !== 'amount_only' && (
            <button
              type="button"
              onClick={() => setPercentageBasis(prev => prev === 'month_total' ? 'category_subtotal' : 'month_total')}
              title={percentageBasis === 'month_total' ? "Currently calculating % of Month's Total Expenses. Click to switch to % of Category Subtotal." : "Currently calculating % of Category Subtotal. Click to switch to % of Month's Total Expenses."}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: '#4338ca',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <span>{percentageBasis === 'month_total' ? 'Basis: % of Total' : 'Basis: % of Category'}</span>
            </button>
          )}

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
                      padding: '10px 14px',
                      minWidth: '125px',
                      textAlign: 'right',
                      borderBottom: '1.5px solid rgba(203, 213, 225, 0.8)',
                      borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                      backgroundColor: isSel ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      color: isSel ? '#4338ca' : '#334155',
                      fontWeight: isSel ? '800' : '700'
                    }}
                  >
                    <div>{p.period_label} {isSel && '★'}</div>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: isSel ? '#6366f1' : '#94a3b8', marginTop: '2px' }}>
                      {displayMode === 'percentage_only' ? '% Share' : displayMode === 'amount_only' ? 'INR (₹)' : '₹ & % Share'}
                    </div>
                  </th>
                );
              })}

              <th style={{
                padding: '10px 16px',
                minWidth: '135px',
                textAlign: 'right',
                borderBottom: '1.5px solid rgba(203, 213, 225, 0.8)',
                borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                color: '#0f172a',
                fontWeight: '800'
              }}>
                <div>Total (All Mo)</div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginTop: '2px' }}>
                  {displayMode === 'percentage_only' ? '% of Total' : displayMode === 'amount_only' ? 'INR (₹)' : '₹ & % Total'}
                </div>
              </th>
              <th style={{
                padding: '10px 14px',
                minWidth: '115px',
                textAlign: 'right',
                borderBottom: '1.5px solid rgba(203, 213, 225, 0.8)',
                color: '#475569',
                fontWeight: '700'
              }}>
                <div>Avg / Mo</div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginTop: '2px' }}>
                  {displayMode === 'percentage_only' ? '% of Avg' : displayMode === 'amount_only' ? 'INR (₹)' : '₹ & % Avg'}
                </div>
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
                          const periodDenom = percentageBasis === 'category_subtotal'
                            ? (categorySubtotals[grp.categoryId]?.[p.id] || 0)
                            : (monthlyGrandTotals.byPeriod[p.id] || 0);

                          return (
                            <td
                              key={p.id}
                              style={{
                                padding: '9px 14px',
                                textAlign: 'right',
                                backgroundColor: isSel ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                                borderRight: '1px solid rgba(226, 232, 240, 0.6)',
                                borderBottom: '1px solid rgba(241, 245, 249, 0.9)'
                              }}
                              className="currency-font"
                            >
                              {renderCellContent(val, periodDenom, false, false)}
                            </td>
                          );
                        })}

                        {/* Total Spend */}
                        {(() => {
                          const totalDenom = percentageBasis === 'category_subtotal'
                            ? (categorySubtotals[grp.categoryId]?.total || 0)
                            : (monthlyGrandTotals.grandOverall || 0);
                          return (
                            <td style={{
                              padding: '9px 16px',
                              textAlign: 'right',
                              backgroundColor: 'rgba(248, 250, 252, 0.45)',
                              borderRight: '1px solid rgba(226, 232, 240, 0.7)',
                              borderBottom: '1px solid rgba(241, 245, 249, 0.9)'
                            }} className="currency-font">
                              {renderCellContent(itemTotal, totalDenom, true, false)}
                            </td>
                          );
                        })()}

                        {/* Avg / Mo */}
                        {(() => {
                          const avgDenom = percentageBasis === 'category_subtotal'
                            ? ((categorySubtotals[grp.categoryId]?.total || 0) / (periods.length || 1))
                            : (monthlyGrandTotals.avgMonthly || 0);
                          return (
                            <td style={{
                              padding: '9px 14px',
                              textAlign: 'right',
                              backgroundColor: 'rgba(248, 250, 252, 0.45)',
                              borderBottom: '1px solid rgba(241, 245, 249, 0.9)'
                            }} className="currency-font">
                              {renderCellContent(itemAvg, avgDenom, false, false)}
                            </td>
                          );
                        })()}
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
                        const periodDenom = monthlyGrandTotals.byPeriod[p.id] || 0;
                        return (
                          <td
                            key={p.id}
                            style={{
                              padding: '10px 14px',
                              textAlign: 'right',
                              borderRight: '1px solid rgba(99, 102, 241, 0.2)',
                              backgroundColor: isSel ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                            }}
                            className="currency-font"
                          >
                            {renderCellContent(tot, periodDenom, true, true, {
                              text: '#312e81',
                              bg: 'rgba(99, 102, 241, 0.12)',
                              border: 'rgba(99, 102, 241, 0.25)'
                            })}
                          </td>
                        );
                      })}

                      <td style={{
                        padding: '10px 16px',
                        textAlign: 'right',
                        borderRight: '1px solid rgba(99, 102, 241, 0.2)'
                      }} className="currency-font">
                        {renderCellContent(foodCombinedSubtotal.allTotal, monthlyGrandTotals.grandOverall, true, true, {
                          text: '#312e81',
                          bg: 'rgba(99, 102, 241, 0.12)',
                          border: 'rgba(99, 102, 241, 0.25)'
                        })}
                      </td>

                      <td style={{
                        padding: '10px 14px',
                        textAlign: 'right'
                      }} className="currency-font">
                        {renderCellContent(
                          periods.length > 0 ? (foodCombinedSubtotal.allTotal / periods.length) : 0,
                          monthlyGrandTotals.avgMonthly,
                          true,
                          true,
                          {
                            text: '#4338ca',
                            bg: 'rgba(99, 102, 241, 0.12)',
                            border: 'rgba(99, 102, 241, 0.25)'
                          }
                        )}
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
                        const periodDenom = monthlyGrandTotals.byPeriod[p.id] || 0;
                        return (
                          <td
                            key={p.id}
                            style={{
                              padding: '10px 14px',
                              textAlign: 'right',
                              borderRight: '1px solid rgba(245, 158, 11, 0.2)',
                              backgroundColor: isSel ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
                            }}
                            className="currency-font"
                          >
                            {renderCellContent(subVal, periodDenom, true, true, {
                              text: '#78350f',
                              bg: 'rgba(245, 158, 11, 0.12)',
                              border: 'rgba(245, 158, 11, 0.25)'
                            })}
                          </td>
                        );
                      })}

                      <td style={{
                        padding: '10px 16px',
                        textAlign: 'right',
                        borderRight: '1px solid rgba(245, 158, 11, 0.2)'
                      }} className="currency-font">
                        {renderCellContent(grp.subtotal.total || 0, monthlyGrandTotals.grandOverall, true, true, {
                          text: '#78350f',
                          bg: 'rgba(245, 158, 11, 0.12)',
                          border: 'rgba(245, 158, 11, 0.25)'
                        })}
                      </td>

                      <td style={{
                        padding: '10px 14px',
                        textAlign: 'right'
                      }} className="currency-font">
                        {renderCellContent(
                          periods.length > 0 ? ((grp.subtotal.total || 0) / periods.length) : 0,
                          monthlyGrandTotals.avgMonthly,
                          true,
                          true,
                          {
                            text: '#b45309',
                            bg: 'rgba(245, 158, 11, 0.12)',
                            border: 'rgba(245, 158, 11, 0.25)'
                          }
                        )}
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
                        const periodDenom = monthlyGrandTotals.byPeriod[p.id] || 0;
                        return (
                          <td
                            key={p.id}
                            style={{
                              padding: '10px 14px',
                              textAlign: 'right',
                              borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                              backgroundColor: isSel ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                            }}
                            className="currency-font"
                          >
                            {renderCellContent(subVal, periodDenom, true, true, {
                              text: theme.badgeText,
                              bg: theme.badgeBg,
                              border: theme.badgeBorder
                            })}
                          </td>
                        );
                      })}

                      <td style={{
                        padding: '10px 16px',
                        textAlign: 'right',
                        borderRight: '1px solid rgba(226, 232, 240, 0.8)'
                      }} className="currency-font">
                        {renderCellContent(grp.subtotal.total || 0, monthlyGrandTotals.grandOverall, true, true, {
                          text: theme.badgeText,
                          bg: theme.badgeBg,
                          border: theme.badgeBorder
                        })}
                      </td>

                      <td style={{
                        padding: '10px 14px',
                        textAlign: 'right'
                      }} className="currency-font">
                        {renderCellContent(
                          periods.length > 0 ? ((grp.subtotal.total || 0) / periods.length) : 0,
                          monthlyGrandTotals.avgMonthly,
                          true,
                          true,
                          {
                            text: '#475569',
                            bg: 'rgba(241, 245, 249, 0.6)',
                            border: 'rgba(203, 213, 225, 0.8)'
                          }
                        )}
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
                      padding: '12px 14px',
                      textAlign: 'right',
                      borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                      fontWeight: '900',
                      color: isSel ? '#60a5fa' : '#ffffff',
                      backgroundColor: isSel ? 'rgba(59, 130, 246, 0.18)' : 'transparent'
                    }}
                    className="currency-font"
                  >
                    {displayMode === 'percentage_only' ? (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#93c5fd',
                        backgroundColor: 'rgba(59, 130, 246, 0.25)',
                        border: '1px solid rgba(147, 197, 253, 0.35)',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        100.0%
                      </span>
                    ) : displayMode === 'amount_only' ? (
                      <span>{formatIndianNumber(gVal)}</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span>{formatIndianNumber(gVal)}</span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          color: '#93c5fd',
                          backgroundColor: 'rgba(59, 130, 246, 0.25)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          lineHeight: '1.2'
                        }}>
                          100.0%
                        </span>
                      </div>
                    )}
                  </td>
                );
              })}

              {/* Overall Grand Total */}
              <td style={{
                padding: '12px 16px',
                textAlign: 'right',
                borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                fontWeight: '900',
                color: '#ffffff'
              }} className="currency-font">
                {displayMode === 'percentage_only' ? (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#93c5fd',
                    backgroundColor: 'rgba(59, 130, 246, 0.25)',
                    border: '1px solid rgba(147, 197, 253, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    100.0%
                  </span>
                ) : displayMode === 'amount_only' ? (
                  <span>{formatIndianNumber(monthlyGrandTotals.grandOverall)}</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span>{formatIndianNumber(monthlyGrandTotals.grandOverall)}</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      color: '#93c5fd',
                      backgroundColor: 'rgba(59, 130, 246, 0.25)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      lineHeight: '1.2'
                    }}>
                      100.0%
                    </span>
                  </div>
                )}
              </td>

              {/* Monthly Average */}
              <td style={{
                padding: '12px 14px',
                textAlign: 'right',
                fontWeight: '900',
                color: '#93c5fd'
              }} className="currency-font">
                {displayMode === 'percentage_only' ? (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#93c5fd',
                    backgroundColor: 'rgba(59, 130, 246, 0.25)',
                    border: '1px solid rgba(147, 197, 253, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    100.0%
                  </span>
                ) : displayMode === 'amount_only' ? (
                  <span>{formatIndianNumber(monthlyGrandTotals.avgMonthly)}</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span>{formatIndianNumber(monthlyGrandTotals.avgMonthly)}</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      color: '#93c5fd',
                      backgroundColor: 'rgba(59, 130, 246, 0.25)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      lineHeight: '1.2'
                    }}>
                      100.0%
                    </span>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
