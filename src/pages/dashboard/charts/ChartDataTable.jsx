import React, { useState, useMemo, useRef, useEffect } from 'react';
import { formatINR } from '../../../utils/formatters';
import { 
  Download, Search, MessageSquare, X, Filter, Table, Layers, 
  ArrowUpDown, Check, Maximize2, Minimize2 
} from 'lucide-react';

export default function ChartDataTable({
  categories = [],
  periods = [],
  activePeriod = 'all',
  selectedModule = 'food'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [activeCommentPopover, setActiveCommentPopover] = useState(null);
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

  // Category Color Palette matching user's uploaded Excel report mockup (Image 1)
  const getCategoryColor = (catName, idx) => {
    const nameLower = (catName || '').toLowerCase();
    if (nameLower.includes('material')) {
      return { headerBg: '#ffc90e', text: '#000000', rowBg: '#fff2df' }; // Golden Yellow
    }
    if (nameLower.includes('labour') || nameLower.includes('labor')) {
      return { headerBg: '#dcdde1', text: '#000000', rowBg: '#fff2df' }; // Silver / Light Grey
    }
    if (nameLower.includes('maintenance') || nameLower.includes('fc') || nameLower.includes('power')) {
      return { headerBg: '#ffc90e', text: '#000000', rowBg: '#fff2df' }; // Golden Yellow
    }
    if (nameLower.includes('event')) {
      return { headerBg: '#a8d8ea', text: '#000000', rowBg: '#fff2df' }; // Soft Sky Blue
    }
    if (nameLower.includes('festival')) {
      return { headerBg: '#d4edda', text: '#000000', rowBg: '#fff2df' }; // Soft Mint Green
    }
    // Fallbacks for Transport / Hostel
    const fallbacks = [
      { headerBg: '#ffc90e', text: '#000000', rowBg: '#fff2df' },
      { headerBg: '#dcdde1', text: '#000000', rowBg: '#fff2df' },
      { headerBg: '#a8d8ea', text: '#000000', rowBg: '#fff2df' },
      { headerBg: '#d4edda', text: '#000000', rowBg: '#fff2df' },
      { headerBg: '#fed7aa', text: '#000000', rowBg: '#fff2df' }
    ];
    return fallbacks[idx % fallbacks.length];
  };

  // Indian currency formatting without currency symbol for clean Excel grid (e.g. 58,39,162)
  const formatIndianNumber = (val) => {
    if (val === undefined || val === null || val === '' || val === 0) return '';
    const num = Number(val);
    if (isNaN(num)) return '';
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

  // Flatten rows with rich month-by-month values for detailed ledger
  const flatRows = useMemo(() => {
    const list = [];
    const grandTot = monthlyGrandTotals.grandOverall || 1;

    categories.forEach(cat => {
      cat.items?.forEach(it => {
        const amountsByPeriod = {};
        let itemTotal = 0;

        periods.forEach(p => {
          const amt = Number(it.amounts?.[p.id] ?? it.amounts?.[String(p.id)] ?? 0);
          amountsByPeriod[p.id] = amt;
          itemTotal += amt;
        });

        const avgAmt = periods.length > 0 ? (itemTotal / periods.length) : (it.avg || 0);
        const sharePct = grandTot > 0 ? (itemTotal / grandTot) * 100 : 0;

        const remarksList = [];
        if (it.remarks) {
          Object.keys(it.remarks).forEach(pid => {
            const txt = it.remarks[pid];
            if (txt && !txt.startsWith('Entry via Operational Matrix') && !txt.startsWith('Cloned from')) {
              const pLabel = periods.find(p => String(p.id) === String(pid))?.period_label || pid;
              remarksList.push({ periodLabel: pLabel, text: txt });
            }
          });
        }

        let momGrowth = 0;
        if (periods.length >= 2) {
          const firstVal = amountsByPeriod[periods[0].id] || 0;
          const lastVal = amountsByPeriod[periods[periods.length - 1].id] || 0;
          if (firstVal > 0) {
            momGrowth = ((lastVal - firstVal) / firstVal) * 100;
          }
        }

        list.push({
          cost_head_id: it.cost_head_id,
          description: it.description,
          category: cat.category_name,
          amountsByPeriod,
          total: itemTotal,
          avgAmt,
          sharePct,
          momGrowth,
          remarksList
        });
      });
    });

    return list;
  }, [categories, periods, monthlyGrandTotals]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return flatRows.filter(r => {
      const matchesSearch = !searchTerm.trim() || 
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategoryFilter === 'all' || r.category === selectedCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [flatRows, searchTerm, selectedCategoryFilter]);

  // Grouped by Category for the exact Image 1 table
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
        colorTheme: getCategoryColor(cat.category_name, idx),
        items: items,
        subtotal: categorySubtotals[cat.category_id] || {}
      });
    });
    return list;
  }, [categories, categorySubtotals, selectedCategoryFilter, searchTerm]);

  // Special Combined Subtotals matching Image 1:
  // In the image: Food Material + Food Labour are summed as "Total Food Expenses"
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
    const headers = ['"S.No"', '"Category"', '"Description / Cost Head"', ...periodHeaders, '"Total Spend (INR)"', '"Avg / Month (INR)"', '"Share %"'];
    
    const rows = filteredRows.map((r, idx) => {
      const pCols = periods.map(p => (r.amountsByPeriod[p.id] || 0).toFixed(2));
      return [
        idx + 1,
        `"${r.category}"`,
        `"${r.description}"`,
        ...pCols,
        r.total.toFixed(2),
        r.avgAmt.toFixed(2),
        r.sharePct.toFixed(2) + '%'
      ];
    });

    const grandPCols = periods.map(p => (monthlyGrandTotals.byPeriod[p.id] || 0).toFixed(2));
    rows.push([
      '""',
      '"TOTAL EXPENSES"',
      '"ALL CATEGORIES"',
      ...grandPCols,
      monthlyGrandTotals.grandOverall.toFixed(2),
      monthlyGrandTotals.avgMonthly.toFixed(2),
      '"100.0%"'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rathinam_monthly_report_${selectedModule}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      ref={containerRef}
      style={isFullScreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        backgroundColor: '#ffffff',
        overflowY: 'hidden',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        border: 'none',
        boxShadow: 'none',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      } : {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '2px solid #00a2e8',
        boxShadow: '0 4px 14px rgba(0, 162, 232, 0.08)',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* 1. HEADER CONTROL BAR */}
      <div style={{
        padding: '14px 20px',
        backgroundColor: '#f0f9ff',
        borderBottom: '2px solid #bae6fd',
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
            borderRadius: '6px',
            backgroundColor: '#00a2e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Table size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Month-by-Month Expenditure Report
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#00a2e8',
                color: '#ffffff'
              }}>
                Excel Format
              </span>
              {isFullScreen && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  boxShadow: '0 1px 3px rgba(16, 185, 129, 0.3)'
                }}>
                  Full Screen Mode Active • Press Esc to exit
                </span>
              )}
            </div>
            <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              Full month-by-month financial progression • Side-by-side columns matching Rathinam Excel reports
            </p>
          </div>
        </div>

        {/* View mode toggle, search, filter, export & FULL SCREEN TOGGLE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Search box */}
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
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                width: '160px',
                backgroundColor: '#ffffff'
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

          {/* Category Dropdown */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Categories ({categoryNames.length})</option>
            {categoryNames.map(cn => (
              <option key={cn} value={cn}>{cn}</option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            <span>CSV</span>
          </button>

          {/* Small Fullscreen Icon in Top Right Corner */}
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
              borderRadius: '6px',
              backgroundColor: isFullScreen ? '#00a2e8' : '#ffffff',
              border: isFullScreen ? '1.5px solid #0087c2' : '1.5px solid #00a2e8',
              color: isFullScreen ? '#ffffff' : '#00a2e8',
              cursor: 'pointer',
              boxShadow: isFullScreen ? '0 2px 6px rgba(0, 162, 232, 0.4)' : '0 1px 3px rgba(0, 162, 232, 0.15)',
              transition: 'all 0.15s ease'
            }}
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* 2. TABLE PRESENTATION */}
      <div style={{ 
        overflowX: 'auto', 
        overflowY: isFullScreen ? 'auto' : 'visible',
        padding: isFullScreen ? '16px 24px' : '16px 20px',
        flex: isFullScreen ? 1 : undefined,
        maxHeight: isFullScreen ? 'calc(100vh - 72px)' : undefined
      }}>

        {/* --- RATHINAM EXCEL REPORT VIEW (EXACT MATCH TO USER'S UPLOADED IMAGE) --- */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
          border: '2px solid #000000',
          backgroundColor: '#ffffff'
        }}>
            {/* Header: Cyan / Sky Blue matching Image 1 (#00a2e8) */}
            <thead style={isFullScreen ? { position: 'sticky', top: 0, zIndex: 10 } : undefined}>
              <tr style={{
                backgroundColor: '#00a2e8',
                color: '#000000',
                borderBottom: '2px solid #000000',
                fontWeight: '800',
                fontSize: '13.5px'
              }}>
                <th style={{ padding: '10px 14px', width: '180px', textAlign: 'center', borderRight: '1px solid #000000' }}>
                  Category
                </th>
                <th style={{ padding: '10px 18px', minWidth: '220px', textAlign: 'center', borderRight: '1px solid #000000' }}>
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
                        textAlign: 'center',
                        borderRight: '1px solid #000000',
                        backgroundColor: isSel ? '#0ea5e9' : '#00a2e8',
                        color: '#000000',
                        fontWeight: '800'
                      }}
                    >
                      {p.period_label} {isSel && '★'}
                    </th>
                  );
                })}

                <th style={{ padding: '10px 14px', minWidth: '130px', textAlign: 'center', borderRight: '1px solid #000000', backgroundColor: '#0284c7', color: '#ffffff' }}>
                  Total (All Mo)
                </th>
                <th style={{ padding: '10px 12px', minWidth: '110px', textAlign: 'center', backgroundColor: '#0284c7', color: '#ffffff' }}>
                  Avg / Mo
                </th>
              </tr>
            </thead>

            <tbody>
              {groupedCategories.map((grp, grpIdx) => {
                const colorTheme = grp.colorTheme;
                const itemsCount = grp.items.length;
                const isFoodLabour = grp.categoryName.toLowerCase().includes('labour') || grp.categoryName.toLowerCase().includes('labor');
                const isFCMaintenance = grp.categoryName.toLowerCase().includes('fc maintenance') || grp.categoryName.toLowerCase().includes('maintenance');

                return (
                  <React.Fragment key={grp.categoryId}>
                    {/* Items in this category */}
                    {grp.items.map((item, itemIdx) => {
                      let itemTotal = 0;
                      periods.forEach(p => {
                        const v = Number(item.amounts?.[p.id] ?? item.amounts?.[String(p.id)] ?? 0);
                        itemTotal += v;
                      });
                      const itemAvg = periods.length > 0 ? (itemTotal / periods.length) : 0;

                      return (
                        <tr key={item.cost_head_id} style={{ borderBottom: '1px solid #000000' }}>
                          {/* Merged Category column on first row */}
                          {itemIdx === 0 && (
                            <td
                              rowSpan={itemsCount}
                              style={{
                                padding: '12px 14px',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                backgroundColor: colorTheme.headerBg,
                                color: colorTheme.text,
                                fontWeight: '800',
                                fontSize: '13.5px',
                                borderRight: '1px solid #000000',
                                borderBottom: '1px solid #000000'
                              }}
                            >
                              {grp.categoryName}
                            </td>
                          )}

                          {/* Description Cell */}
                          <td style={{
                            padding: '8px 14px',
                            backgroundColor: colorTheme.headerBg,
                            fontWeight: '700',
                            color: '#000000',
                            borderRight: '1px solid #000000'
                          }}>
                            {item.description}
                          </td>

                          {/* Monthly Values: Peach Background (#fff2df) matching Image 1 */}
                          {periods.map(p => {
                            const val = Number(item.amounts?.[p.id] ?? item.amounts?.[String(p.id)] ?? 0);
                            const isSel = String(p.id) === String(activePeriod);
                            return (
                              <td
                                key={p.id}
                                style={{
                                  padding: '8px 14px',
                                  textAlign: 'right',
                                  backgroundColor: isSel ? '#ffedd5' : '#fff2df',
                                  color: '#000000',
                                  fontWeight: val > 0 ? '700' : '400',
                                  borderRight: '1px solid #000000'
                                }}
                                className="currency-font"
                              >
                                {val > 0 ? formatIndianNumber(val) : ''}
                              </td>
                            );
                          })}

                          {/* Total Spend */}
                          <td style={{
                            padding: '8px 14px',
                            textAlign: 'right',
                            fontWeight: '800',
                            backgroundColor: '#fafafa',
                            color: '#000000',
                            borderRight: '1px solid #000000'
                          }} className="currency-font">
                            {formatIndianNumber(itemTotal)}
                          </td>

                          {/* Avg / Mo */}
                          <td style={{
                            padding: '8px 12px',
                            textAlign: 'right',
                            color: '#475569',
                            backgroundColor: '#fafafa'
                          }} className="currency-font">
                            {formatIndianNumber(itemAvg)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* SPECIAL CASE 1: Subtotal Row after Food Labour -> "Total Food Expenses" matching Image 1 */}
                    {selectedModule === 'food' && isFoodLabour && (
                      <tr style={{
                        backgroundColor: '#00ff00',
                        color: '#000000',
                        borderTop: '2px solid #000000',
                        borderBottom: '2px solid #000000',
                        fontWeight: '900',
                        fontSize: '13.5px'
                      }}>
                        <td colSpan={2} style={{
                          padding: '10px 18px',
                          textAlign: 'center',
                          borderRight: '1px solid #000000',
                          letterSpacing: '0.02em'
                        }}>
                          Total Food Expenses
                        </td>

                        {periods.map(p => {
                          const tot = foodCombinedSubtotal.totals[p.id] || 0;
                          return (
                            <td
                              key={p.id}
                              style={{
                                padding: '10px 14px',
                                textAlign: 'right',
                                borderRight: '1px solid #000000',
                                fontWeight: '900'
                              }}
                              className="currency-font"
                            >
                              {formatIndianNumber(tot)}
                            </td>
                          );
                        })}

                        <td style={{
                          padding: '10px 14px',
                          textAlign: 'right',
                          borderRight: '1px solid #000000',
                          fontWeight: '900'
                        }} className="currency-font">
                          {formatIndianNumber(foodCombinedSubtotal.allTotal)}
                        </td>

                        <td style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontWeight: '900'
                        }} className="currency-font">
                          {formatIndianNumber(periods.length > 0 ? (foodCombinedSubtotal.allTotal / periods.length) : 0)}
                        </td>
                      </tr>
                    )}

                    {/* SPECIAL CASE 2: Subtotal Row after FC Maintenance -> "Total Maintenance Expenses" */}
                    {selectedModule === 'food' && isFCMaintenance && (
                      <tr style={{
                        backgroundColor: '#00ff00',
                        color: '#000000',
                        borderTop: '2px solid #000000',
                        borderBottom: '2px solid #000000',
                        fontWeight: '900',
                        fontSize: '13.5px'
                      }}>
                        <td colSpan={2} style={{
                          padding: '10px 18px',
                          textAlign: 'center',
                          borderRight: '1px solid #000000',
                          letterSpacing: '0.02em'
                        }}>
                          Total Maintenance Expenses
                        </td>

                        {periods.map(p => {
                          const subVal = grp.subtotal[p.id] || 0;
                          return (
                            <td
                              key={p.id}
                              style={{
                                padding: '10px 14px',
                                textAlign: 'right',
                                borderRight: '1px solid #000000',
                                fontWeight: '900'
                              }}
                              className="currency-font"
                            >
                              {formatIndianNumber(subVal)}
                            </td>
                          );
                        })}

                        <td style={{
                          padding: '10px 14px',
                          textAlign: 'right',
                          borderRight: '1px solid #000000',
                          fontWeight: '900'
                        }} className="currency-font">
                          {formatIndianNumber(grp.subtotal.total || 0)}
                        </td>

                        <td style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontWeight: '900'
                        }} className="currency-font">
                          {formatIndianNumber(periods.length > 0 ? ((grp.subtotal.total || 0) / periods.length) : 0)}
                        </td>
                      </tr>
                    )}

                    {/* Standard Subtotal Row for other modules or categories */}
                    {selectedModule !== 'food' && (
                      <tr style={{
                        backgroundColor: '#00ff00',
                        color: '#000000',
                        borderTop: '2px solid #000000',
                        borderBottom: '2px solid #000000',
                        fontWeight: '800',
                        fontSize: '13px'
                      }}>
                        <td colSpan={2} style={{
                          padding: '9px 18px',
                          textAlign: 'center',
                          borderRight: '1px solid #000000'
                        }}>
                          Total {grp.categoryName}
                        </td>

                        {periods.map(p => {
                          const subVal = grp.subtotal[p.id] || 0;
                          return (
                            <td
                              key={p.id}
                              style={{
                                padding: '9px 14px',
                                textAlign: 'right',
                                borderRight: '1px solid #000000',
                                fontWeight: '800'
                              }}
                              className="currency-font"
                            >
                              {formatIndianNumber(subVal)}
                            </td>
                          );
                        })}

                        <td style={{
                          padding: '9px 14px',
                          textAlign: 'right',
                          borderRight: '1px solid #000000',
                          fontWeight: '800'
                        }} className="currency-font">
                          {formatIndianNumber(grp.subtotal.total || 0)}
                        </td>

                        <td style={{
                          padding: '9px 12px',
                          textAlign: 'right',
                          fontWeight: '800'
                        }} className="currency-font">
                          {formatIndianNumber(periods.length > 0 ? ((grp.subtotal.total || 0) / periods.length) : 0)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* BOTTOM GRAND TOTAL ROW: Deep Emerald / Teal matching Image 1 (#00b894) */}
              <tr style={{
                backgroundColor: '#00b894',
                color: '#000000',
                borderTop: '3px solid #000000',
                fontWeight: '900',
                fontSize: '14px'
              }}>
                <td colSpan={2} style={{
                  padding: '12px 18px',
                  textAlign: 'center',
                  borderRight: '1px solid #000000',
                  letterSpacing: '0.04em'
                }}>
                  Total Expenses
                </td>

                {/* Grand Total per period */}
                {periods.map(p => {
                  const gVal = monthlyGrandTotals.byPeriod[p.id] || 0;
                  return (
                    <td
                      key={p.id}
                      style={{
                        padding: '12px 14px',
                        textAlign: 'right',
                        borderRight: '1px solid #000000',
                        fontWeight: '900'
                      }}
                      className="currency-font"
                    >
                      {formatIndianNumber(gVal)}
                    </td>
                  );
                })}

                <td style={{
                  padding: '12px 14px',
                  textAlign: 'right',
                  borderRight: '1px solid #000000',
                  fontWeight: '900'
                }} className="currency-font">
                  {formatIndianNumber(monthlyGrandTotals.grandOverall)}
                </td>

                <td style={{
                  padding: '12px 12px',
                  textAlign: 'right',
                  fontWeight: '900'
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
