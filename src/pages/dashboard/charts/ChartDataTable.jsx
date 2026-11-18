import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Download, Search, X, Maximize2, Minimize2, Percent, SlidersHorizontal, LayoutGrid, FileSpreadsheet
} from 'lucide-react';
import { formatPeriodLabel } from '../../../utils/formatters';
import MonthPills from './MonthPills';
import HeroSummary from './HeroSummary';
import CategoryCard from './CategoryCard';
import PersonStats from './PersonStats';
import HostelOccupancyCard from './HostelOccupancyCard';
import TransportFleetCard from './TransportFleetCard';
import HostelDashboardDataTable from '../HostelDashboardDataTable';
import TransportDashboardDataTable from '../TransportDashboardDataTable';

// Category color cycle per specification:
// indigo #5b5bf0, violet #8b5cf6, amber #f59e0b, emerald #10b981, pink #ec4899, then cyan #06b6d4, rose #f43f5e
const CATEGORY_COLORS = [
  '#5b5bf0', // 1. Indigo
  '#8b5cf6', // 2. Violet
  '#f59e0b', // 3. Amber
  '#10b981', // 4. Emerald
  '#ec4899', // 5. Pink
  '#06b6d4', // 6. Cyan
  '#f43f5e'  // 7. Rose
];

/**
 * Format compact Indian currency (e.g. ₹58.4 L, ₹1.37 Cr)
 */
function formatIndianCompact(val) {
  if (val === undefined || val === null || val === '' || isNaN(Number(val))) return '—';
  const num = Number(val);
  if (num === 0) return '₹0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 10000000) { // 1 Crore = 10,000,000
    const cr = abs / 10000000;
    return `${sign}₹${cr.toFixed(cr >= 10 ? 1 : 2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1')} Cr`;
  }
  if (abs >= 100000) { // 1 Lakh = 100,000
    const lk = abs / 100000;
    return `${sign}₹${lk.toFixed(lk >= 10 ? 1 : 2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1')} L`;
  }
  if (abs >= 1000) { // 1 Thousand
    const k = abs / 1000;
    return `${sign}₹${k.toFixed(1).replace(/\.0$/, '')} K`;
  }
  return `${sign}₹${num.toLocaleString('en-IN')}`;
}

/**
 * Format full Indian currency for tooltips (e.g. ₹58,39,142)
 */
function formatIndianFull(val) {
  if (val === undefined || val === null || val === '' || isNaN(Number(val))) return '—';
  const num = Number(val);
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/**
 * Safe percentage calculation
 */
function computePercentage(val, total) {
  if (!val || !total || total === 0) return 0;
  const num = Number(val);
  const tot = Number(total);
  if (isNaN(num) || isNaN(tot) || tot === 0) return 0;
  return (num / tot) * 100;
}

export default function ChartDataTable({
  categories = [],
  periods = [],
  activePeriod = 'all',
  selectedModule = 'food',
  computedMatrix,
  isFullScreen: propIsFullScreen,
  onToggleFullScreen: propOnToggleFullScreen,
  remarksDraft = {}
}) {
  // 1. Controls state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState(activePeriod || 'all');
  const [displayMode, setDisplayMode] = useState('both'); // 'both' | 'percentage_only' | 'amount_only'
  const [expandedCardIds, setExpandedCardIds] = useState({}); // { [catId]: boolean }, persists across month changes
  const [internalFullScreen, setInternalFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' (Modern Card Dashboard) | 'spreadsheet' (Full Sheet/Table)
  const isFullScreen = propIsFullScreen !== undefined ? propIsFullScreen : internalFullScreen;
  const containerRef = useRef(null);

  // Sync selectedPeriod with activePeriod prop changes
  useEffect(() => {
    if (activePeriod && activePeriod !== selectedPeriod) {
      setSelectedPeriod(activePeriod);
    }
  }, [activePeriod]);

  // Reset selectedPeriod when module or periods change if the selected period does not exist
  useEffect(() => {
    if (selectedPeriod !== 'all') {
      const exists = periods.some(p => String(p.id) === String(selectedPeriod));
      if (!exists) {
        setSelectedPeriod('all');
      }
    }
  }, [selectedModule, periods, selectedPeriod]);

  // Live Hostel and Transport census data (with self-healing fallback)
  const [localHostelCensus, setLocalHostelCensus] = useState(() => computedMatrix?.hostel_census || {});
  const [localTransportCensus, setLocalTransportCensus] = useState(() => computedMatrix?.transport_census || {});
  const [localTransportByBranch, setLocalTransportByBranch] = useState(() => computedMatrix?.transport_census_by_branch || {});

  useEffect(() => {
    if (computedMatrix?.hostel_census && Object.keys(computedMatrix.hostel_census).length > 0) {
      setLocalHostelCensus(computedMatrix.hostel_census);
    } else {
      fetch('/api/matrix?module=hostel')
        .then(res => res.json())
        .then(data => {
          if (data?.hostel_census && Object.keys(data.hostel_census).length > 0) {
            setLocalHostelCensus(data.hostel_census);
          }
        })
        .catch(err => console.error('[ChartDataTable] Error fetching hostel census:', err));
    }
  }, [computedMatrix]);

  useEffect(() => {
    if (computedMatrix?.transport_census && Object.keys(computedMatrix.transport_census).length > 0) {
      setLocalTransportCensus(computedMatrix.transport_census);
      if (computedMatrix.transport_census_by_branch) {
        setLocalTransportByBranch(computedMatrix.transport_census_by_branch);
      }
    } else {
      fetch('/api/matrix?module=transport')
        .then(res => res.json())
        .then(data => {
          if (data?.transport_census) {
            setLocalTransportCensus(data.transport_census);
          }
          if (data?.transport_census_by_branch) {
            setLocalTransportByBranch(data.transport_census_by_branch);
          }
        })
        .catch(err => console.error('[ChartDataTable] Error fetching transport census:', err));
    }
  }, [computedMatrix]);

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    const nextState = !isFullScreen;
    if (propOnToggleFullScreen) {
      propOnToggleFullScreen(nextState);
    } else {
      setInternalFullScreen(nextState);
    }

    if (nextState) {
      try {
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        }
      } catch (err) {}
    } else {
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
        if (propOnToggleFullScreen) {
          propOnToggleFullScreen(false);
        } else {
          setInternalFullScreen(false);
        }
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreen) {
        if (propOnToggleFullScreen) {
          propOnToggleFullScreen(false);
        } else {
          setInternalFullScreen(false);
        }
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
  }, [isFullScreen, propOnToggleFullScreen]);

  // Toggle card expansion (retains state when month changes)
  const handleToggleExpand = (catId) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Helper to check if a category/item is non-expense (Person, Census, Cost Per Person)
  const isExcludedFromGrandTotal = (catName = '', itemDesc = '', code = '') => {
    const c = String(catName || '').toLowerCase().trim();
    const i = String(itemDesc || '').toLowerCase().trim();
    const cd = String(code || '').toLowerCase().trim();
    const s = `${c} ${i} ${cd}`;

    if (
      c === 'person' ||
      c === 'persons' ||
      c.includes('person') ||
      c.includes('diners') ||
      c.includes('census') ||
      c.includes('unit economics') ||
      c.includes('economics')
    ) {
      return true;
    }

    return (
      i.includes('student') ||
      i.includes('staff count') ||
      i.includes('staffs count') ||
      i.includes('cost per person') ||
      i.includes('cost/person') ||
      i.includes('cost / person') ||
      i.includes('per person') ||
      i.includes('per meal') ||
      i.includes('diners') ||
      i.includes('census') ||
      i.includes('headcount') ||
      cd.includes('person') ||
      cd.includes('census') ||
      s.includes('total person') ||
      s.includes('total persons') ||
      s.includes('cost per person') ||
      s.includes('student count') ||
      s.includes('students count') ||
      (c === 'person' && i.includes('other'))
    );
  };

  // Compute month-by-month grand totals across all categories (excluding Person metrics)
  const monthlyGrandTotals = useMemo(() => {
    const totals = {};
    let grandOverall = 0;
    periods.forEach((p) => {
      let pSum = 0;
      categories.forEach((cat) => {
        if (isExcludedFromGrandTotal(cat.category_name || cat.name)) {
          return;
        }
        let catVal = 0;
        if (Array.isArray(cat.items) && cat.items.length > 0) {
          cat.items.forEach((it) => {
            if (!isExcludedFromGrandTotal(cat.category_name || cat.name, it.description || it.name, it.code)) {
              catVal += Number(it.amounts?.[p.id] ?? it.amounts?.[String(p.id)] ?? 0);
            }
          });
        } else {
          catVal = Number(cat.subtotal?.amounts?.[p.id] ?? cat.subtotal?.amounts?.[String(p.id)] ?? 0);
        }
        pSum += catVal;
      });
      totals[p.id] = pSum;
      grandOverall += pSum;
    });

    const avgMonthly = periods.length > 0 ? grandOverall / periods.length : 0;
    return {
      byPeriod: totals,
      grandOverall,
      avgMonthly
    };
  }, [categories, periods]);

  // Subtotals by category for each period and overall
  const categorySubtotals = useMemo(() => {
    const subs = {};
    categories.forEach((cat) => {
      const catId = cat.category_id || cat.id;
      subs[catId] = {};
      let cTot = 0;
      periods.forEach((p) => {
        let amt = 0;
        if (Array.isArray(cat.items) && cat.items.length > 0) {
          cat.items.forEach((it) => {
            amt += Number(it.amounts?.[p.id] ?? it.amounts?.[String(p.id)] ?? 0);
          });
        } else {
          amt = Number(cat.subtotal?.amounts?.[p.id] ?? cat.subtotal?.amounts?.[String(p.id)] ?? 0);
        }
        subs[catId][p.id] = amt;
        cTot += amt;
      });
      subs[catId].total = cTot;
    });
    return subs;
  }, [categories, periods]);

  // Max monthly amount per category (to scale sparklines proportionally)
  const categoryMaxMonths = useMemo(() => {
    const maxMap = {};
    categories.forEach((cat) => {
      const catId = cat.category_id || cat.id;
      let maxVal = 1;
      periods.forEach((p) => {
        const val = Number(categorySubtotals[catId]?.[p.id] || 0);
        if (val > maxVal) maxVal = val;
      });
      maxMap[catId] = maxVal;
    });
    return maxMap;
  }, [categories, periods, categorySubtotals]);

  // Filtered categories and assigned colors
  const filteredCategories = useMemo(() => {
    let colorIdx = 0;
    return categories
      .map((cat) => {
        const catName = cat.category_name || cat.name || '';
        const catId = cat.category_id || cat.id;
        const assignedColor = CATEGORY_COLORS[colorIdx % CATEGORY_COLORS.length];
        colorIdx++;

        const items = cat.items || [];
        const filteredItems = items.filter((it) => {
          if (!searchTerm.trim()) return true;
          const term = searchTerm.toLowerCase();
          return (
            (it.description || it.name || '').toLowerCase().includes(term) ||
            catName.toLowerCase().includes(term)
          );
        });

        return {
          ...cat,
          categoryId: catId,
          categoryName: catName,
          color: assignedColor,
          items: filteredItems,
          isExcluded: isExcludedFromGrandTotal(catName)
        };
      })
      .filter((cat) => {
        if (selectedCategoryFilter !== 'all' && cat.categoryName !== selectedCategoryFilter) {
          return false;
        }
        if (searchTerm.trim() && cat.items.length === 0) {
          return false;
        }
        return true;
      });
  }, [categories, searchTerm, selectedCategoryFilter]);

  // Expense categories (used for Hero total & Share breakdown)
  const expenseCategories = useMemo(() => {
    return filteredCategories.filter((cat) => !cat.isExcluded);
  }, [filteredCategories]);

  // Special person categories / items for PersonStats
  const personRows = useMemo(() => {
    const pRows = [];
    categories.forEach((cat) => {
      const catName = cat.category_name || cat.name || '';
      if (isExcludedFromGrandTotal(catName)) {
        if (cat.items && cat.items.length > 0) {
          cat.items.forEach((it) => pRows.push(it));
        } else {
          pRows.push({
            description: catName,
            total: categorySubtotals[cat.category_id || cat.id]?.total || 0,
            amounts: categorySubtotals[cat.category_id || cat.id] || {}
          });
        }
      }
    });
    return pRows;
  }, [categories, categorySubtotals]);

  // Selected period label and totals
  const selectedPeriodObj = useMemo(() => {
    if (selectedPeriod === 'all') return null;
    return periods.find((p) => String(p.id) === String(selectedPeriod)) || null;
  }, [periods, selectedPeriod]);

  const selectedPeriodLabel = useMemo(() => {
    if (selectedPeriod === 'all') return 'All months';
    return selectedPeriodObj?.period_label || selectedPeriodObj?.period_code || 'Selected month';
  }, [selectedPeriod, selectedPeriodObj]);

  const currentGrandTotal = useMemo(() => {
    if (selectedPeriod === 'all') {
      return monthlyGrandTotals.grandOverall;
    }
    return monthlyGrandTotals.byPeriod[selectedPeriod] || 0;
  }, [selectedPeriod, monthlyGrandTotals]);

  // Previous period total and label for MoM calculation in Hero
  const { prevPeriodTotal, prevPeriodLabel, isFirstPeriod } = useMemo(() => {
    if (selectedPeriod === 'all') {
      return { prevPeriodTotal: null, prevPeriodLabel: null, isFirstPeriod: false };
    }
    const idx = periods.findIndex((p) => String(p.id) === String(selectedPeriod));
    if (idx === 0) {
      return { prevPeriodTotal: null, prevPeriodLabel: null, isFirstPeriod: true };
    }
    if (idx > 0) {
      const prevP = periods[idx - 1];
      return {
        prevPeriodTotal: monthlyGrandTotals.byPeriod[prevP.id] || 0,
        prevPeriodLabel: prevP.period_label || prevP.period_code || 'Prev month',
        isFirstPeriod: false
      };
    }
    return { prevPeriodTotal: null, prevPeriodLabel: null, isFirstPeriod: false };
  }, [periods, selectedPeriod, monthlyGrandTotals]);

  // Category shares for Hero summary stacked bar
  const categoryShares = useMemo(() => {
    const denom = currentGrandTotal > 0 ? currentGrandTotal : 1;
    return expenseCategories.map((cat) => {
      let amt = 0;
      if (selectedPeriod === 'all') {
        amt = categorySubtotals[cat.categoryId]?.total || 0;
      } else {
        amt = categorySubtotals[cat.categoryId]?.[selectedPeriod] || 0;
      }
      const pct = currentGrandTotal > 0 ? (amt / denom) * 100 : 0;
      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        color: cat.color,
        amount: amt,
        percent: pct
      };
    });
  }, [expenseCategories, selectedPeriod, currentGrandTotal, categorySubtotals]);

  // Census data fallback for PersonStats
  const activeCensusData = useMemo(() => {
    const pid = selectedPeriod !== 'all' ? selectedPeriod : periods[0]?.id;
    return (
      computedMatrix?.hostel_census?.[pid] ||
      computedMatrix?.transport_census?.[pid] ||
      computedMatrix?.census?.[pid] ||
      null
    );
  }, [computedMatrix, selectedPeriod, periods]);

  // CSV Export handler
  const handleExportCSV = () => {
    const periodHeaders = periods.map((p) => `"${p.period_label || p.period_code} (INR)"`);
    const headers = ['"Category"', '"Description"', ...periodHeaders, '"Total Spend (INR)"', '"Avg / Month (INR)"'];
    const rows = [];

    filteredCategories.forEach((cat) => {
      cat.items.forEach((it) => {
        const pCols = periods.map((p) => {
          const amt = Number(it.amounts?.[p.id] ?? 0);
          return amt.toFixed(2);
        });
        const itTotal = periods.reduce((acc, p) => acc + Number(it.amounts?.[p.id] ?? 0), 0);
        const itAvg = periods.length > 0 ? itTotal / periods.length : 0;

        rows.push([
          `"${cat.categoryName}"`,
          `"${it.description || it.name}"`,
          ...pCols,
          itTotal.toFixed(2),
          itAvg.toFixed(2)
        ]);
      });
    });

    const grandPCols = periods.map((p) => (monthlyGrandTotals.byPeriod[p.id] || 0).toFixed(2));
    rows.push([
      '"ALL CATEGORIES"',
      '"TOTAL EXPENSES"',
      ...grandPCols,
      monthlyGrandTotals.grandOverall.toFixed(2),
      monthlyGrandTotals.avgMonthly.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rathinam_${selectedModule}_expenditure_cards.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      ref={containerRef}
      className="expenditure-card-dashboard"
      style={{
        backgroundColor: 'var(--bg-page, #f6f7fb)',
        color: 'var(--text-main, #14172b)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        borderRadius: isFullScreen ? '0px' : '24px',
        padding: isFullScreen ? '28px 32px' : '22px 24px',
        position: isFullScreen ? 'fixed' : 'relative',
        top: isFullScreen ? 0 : undefined,
        left: isFullScreen ? 0 : undefined,
        right: isFullScreen ? 0 : undefined,
        bottom: isFullScreen ? 0 : undefined,
        width: isFullScreen ? '100vw' : '100%',
        height: isFullScreen ? '100vh' : 'auto',
        overflowY: 'auto',
        zIndex: isFullScreen ? 999999 : 1,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        transition: 'all 0.3s ease'
      }}
    >
      {/* 1. HEADER & SLIM TOOLBAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        borderBottom: '1px solid var(--border-card, #e6e8f2)',
        paddingBottom: '16px'
      }}>
        {/* Title & Subtitle */}
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            margin: 0,
            color: 'var(--text-main, #14172b)'
          }}>
            {selectedModule === 'hostel'
              ? 'Hostel Month-by-Month Expenditure'
              : selectedModule === 'transport'
              ? 'Transport Month-by-Month Expenditure'
              : 'Food Month-by-Month Expenditure'}
          </h2>
          <p style={{
            fontSize: '12.5px',
            color: 'var(--text-muted, #6b7090)',
            margin: '3px 0 0 0'
          }}>
            {selectedModule === 'hostel'
              ? 'Tap a month to filter hostel expenses · tap a card to see line items'
              : selectedModule === 'transport'
              ? 'Tap a month to filter transport expenses · tap a card to see line items'
              : 'Tap a month to filter · tap a card to see line items'}
          </p>
        </div>

        {/* Slim Controls Toolbar: View Mode, Search, Filter, ₹/%, CSV, Fullscreen */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {/* View Mode Switcher Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-pill, #eceefa)',
            padding: '2px',
            borderRadius: '9999px',
            border: '1px solid var(--border-card, #e6e8f2)'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'cards' ? '#5b5bf0' : 'transparent',
                color: viewMode === 'cards' ? '#ffffff' : 'var(--text-muted, #6b7090)',
                fontSize: '11.5px',
                fontWeight: viewMode === 'cards' ? '700' : '500',
                boxShadow: viewMode === 'cards' ? '0 2px 6px rgba(91, 91, 240, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={12} />
              <span>Cards View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('spreadsheet')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'spreadsheet' ? '#5b5bf0' : 'transparent',
                color: viewMode === 'spreadsheet' ? '#ffffff' : 'var(--text-muted, #6b7090)',
                fontSize: '11.5px',
                fontWeight: viewMode === 'spreadsheet' ? '700' : '500',
                boxShadow: viewMode === 'spreadsheet' ? '0 2px 6px rgba(91, 91, 240, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <FileSpreadsheet size={12} />
              <span>Spreadsheet</span>
            </button>
          </div>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search
              size={13}
              color="var(--text-muted, #6b7090)"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 26px 6px 28px',
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '9999px',
                border: '1px solid var(--border-card, #e6e8f2)',
                backgroundColor: 'var(--bg-card, #ffffff)',
                color: 'var(--text-main, #14172b)',
                outline: 'none',
                width: '140px',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--pill-active-bg, #5b5bf0)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-card, #e6e8f2)'}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={12} color="var(--text-muted, #6b7090)" />
              </button>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '9999px',
              border: '1px solid var(--border-card, #e6e8f2)',
              backgroundColor: 'var(--bg-card, #ffffff)',
              color: 'var(--text-main, #14172b)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => {
              const name = c.category_name || c.name;
              return <option key={name} value={name}>{name}</option>;
            })}
          </select>

          {/* ₹ / % / Both Mode Toggle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-pill, #eceefa)',
            borderRadius: '9999px',
            padding: '2px',
            gap: '1px'
          }}>
            <button
              type="button"
              onClick={() => setDisplayMode('both')}
              style={{
                padding: '4px 9px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: displayMode === 'both' ? '700' : '500',
                backgroundColor: displayMode === 'both' ? 'var(--bg-card, #ffffff)' : 'transparent',
                color: displayMode === 'both' ? 'var(--pill-active-bg, #5b5bf0)' : 'var(--text-muted, #6b7090)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: displayMode === 'both' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Both
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('amount_only')}
              style={{
                padding: '4px 9px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: displayMode === 'amount_only' ? '700' : '500',
                backgroundColor: displayMode === 'amount_only' ? 'var(--bg-card, #ffffff)' : 'transparent',
                color: displayMode === 'amount_only' ? 'var(--pill-active-bg, #5b5bf0)' : 'var(--text-muted, #6b7090)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: displayMode === 'amount_only' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              ₹
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('percentage_only')}
              style={{
                padding: '4px 9px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: displayMode === 'percentage_only' ? '700' : '500',
                backgroundColor: displayMode === 'percentage_only' ? 'var(--bg-card, #ffffff)' : 'transparent',
                color: displayMode === 'percentage_only' ? 'var(--pill-active-bg, #5b5bf0)' : 'var(--text-muted, #6b7090)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: displayMode === 'percentage_only' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              %
            </button>
          </div>

          {/* CSV Export Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-card, #e6e8f2)',
              color: 'var(--text-main, #14172b)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={13} />
            <span>CSV</span>
          </button>

          {/* Fullscreen Maximize Button */}
          <button
            type="button"
            onClick={toggleFullScreen}
            title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Maximize Dashboard'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: isFullScreen ? 'var(--pill-active-bg, #5b5bf0)' : 'var(--bg-card, #ffffff)',
              border: isFullScreen ? '1px solid var(--pill-active-bg, #5b5bf0)' : '1px solid var(--border-card, #e6e8f2)',
              color: isFullScreen ? '#ffffff' : 'var(--pill-active-bg, #5b5bf0)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: isFullScreen ? '0 4px 14px rgba(91, 91, 240, 0.35)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFullScreen ? 'Exit' : 'Maximize'}</span>
          </button>
        </div>
      </div>

      {/* 2. CONDITIONAL VIEW: SPREADSHEET TABLE OR CARDS DASHBOARD */}
      {viewMode === 'spreadsheet' ? (
        selectedModule === 'hostel' ? (
          <HostelDashboardDataTable
            periods={periods}
            activePeriod={selectedPeriod}
            computedMatrix={computedMatrix}
            isFullScreen={isFullScreen}
            onToggleFullScreen={toggleFullScreen}
          />
        ) : selectedModule === 'transport' ? (
          <TransportDashboardDataTable
            periods={periods}
            activePeriod={selectedPeriod}
            computedMatrix={computedMatrix}
            isFullScreen={isFullScreen}
            onToggleFullScreen={toggleFullScreen}
          />
        ) : (
          <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid var(--border-card, #e6e8f2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-card, #e6e8f2)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Category</th>
                  <th style={{ padding: '8px' }}>Description</th>
                  {periods.map(p => (
                    <th key={p.id} style={{ padding: '8px', textAlign: 'right' }}>{p.period_label || p.period_code}</th>
                  ))}
                  <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Avg / Mo</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(cat => (
                  <React.Fragment key={cat.categoryId}>
                    <tr style={{ backgroundColor: 'var(--bg-pill, #eceefa)', fontWeight: '700' }}>
                      <td colSpan={periods.length + 4} style={{ padding: '8px 10px', color: cat.color }}>
                        {cat.categoryName}
                      </td>
                    </tr>
                    {cat.items.map(it => (
                      <tr key={it.id || it.description} style={{ borderBottom: '1px solid var(--border-card, #e6e8f2)' }}>
                        <td style={{ padding: '6px 10px' }}></td>
                        <td style={{ padding: '6px 10px', fontWeight: '600' }}>{it.description || it.name}</td>
                        {periods.map(p => (
                          <td key={p.id} style={{ padding: '6px 10px', textAlign: 'right' }}>
                            {formatIndianCompact(it.amounts?.[p.id] ?? 0)}
                          </td>
                        ))}
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '700' }}>
                          {formatIndianCompact(it.total || 0)}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-muted, #6b7090)' }}>
                          {formatIndianCompact(periods.length > 0 ? (it.total || 0) / periods.length : 0)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <>
          {/* 2. MONTH PILLS (HORIZONTAL SCROLL) */}
          <MonthPills
            periods={periods}
            selectedPeriod={selectedPeriod}
            onSelectPeriod={(pId) => setSelectedPeriod(pId)}
          />

          {/* 3. HERO SUMMARY CARD */}
          <HeroSummary
            selectedPeriod={selectedPeriod}
            selectedPeriodLabel={selectedPeriodLabel}
            grandTotal={currentGrandTotal}
            avgMonthly={monthlyGrandTotals.avgMonthly}
            prevPeriodTotal={prevPeriodTotal}
            prevPeriodLabel={prevPeriodLabel}
            isFirstPeriod={isFirstPeriod}
            categoryShares={categoryShares}
            formatCompact={formatIndianCompact}
            formatFull={formatIndianFull}
          />

          {/* 5. SPECIAL ROWS: PERSONS & OPERATIONAL CENSUS CARDS */}
          {selectedModule === 'hostel' ? (
            <HostelOccupancyCard
              hostelCensusMap={localHostelCensus}
              periods={periods}
              selectedPeriod={selectedPeriod}
              formatCompact={formatIndianCompact}
              formatFull={formatIndianFull}
            />
          ) : selectedModule === 'transport' ? (
            <TransportFleetCard
              transportCensus={localTransportCensus}
              transportCensusByBranch={localTransportByBranch}
              periods={periods}
              selectedPeriod={selectedPeriod}
              formatCompact={formatIndianCompact}
              formatFull={formatIndianFull}
            />
          ) : (
            <PersonStats
              personRows={personRows}
              censusData={activeCensusData}
              selectedPeriod={selectedPeriod}
              selectedPeriodLabel={selectedPeriodLabel}
              grandTotal={currentGrandTotal}
              formatCompact={formatIndianCompact}
              formatFull={formatIndianFull}
            />
          )}

          {/* 4. CATEGORY CARDS GRID: CSS grid repeat(auto-fill, minmax(310px, 1fr)), 14px gap */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: '14px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {filteredCategories.map((cat) => {
              const catId = cat.categoryId;
              let catAmount = 0;
              if (selectedPeriod === 'all') {
                catAmount = categorySubtotals[catId]?.total || 0;
              } else {
                catAmount = categorySubtotals[catId]?.[selectedPeriod] || 0;
              }

              const denom = currentGrandTotal > 0 ? currentGrandTotal : 1;
              const catPercent = currentGrandTotal > 0 ? (catAmount / denom) * 100 : 0;
              const maxMonth = categoryMaxMonths[catId] || 1;
              const isExpanded = !!expandedCardIds[catId];

              return (
                <CategoryCard
                  key={catId || cat.categoryName}
                  category={cat}
                  periods={periods}
                  selectedPeriod={selectedPeriod}
                  selectedAmount={catAmount}
                  selectedPercent={catPercent}
                  monthlyAmounts={categorySubtotals[catId] || {}}
                  maxMonthlyAmount={maxMonth}
                  isExpanded={isExpanded}
                  onToggleExpand={handleToggleExpand}
                  formatCompact={formatIndianCompact}
                  formatFull={formatIndianFull}
                  hidePercentage={cat.isExcluded || displayMode === 'amount_only'}
                  remarksDraft={remarksDraft}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
