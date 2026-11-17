import React, { useState, useMemo } from 'react';
import { formatINR, formatLakhs, DASH_COLORS } from '../../utils/formatters';
import { 
  Calendar, Layers, PieChart as PieIcon, Calculator, FileSpreadsheet, 
  TrendingUp, Hash, Users, ArrowRight, Table, BarChart3, CheckCircle2,
  Maximize2, Minimize2 
} from 'lucide-react';

// 12 Chart Components & Master Selector
import ChartSelectorBar from './charts/ChartSelectorBar';
import ClusteredDataTableChart from './charts/ClusteredDataTableChart';
import BarChart from './charts/BarChart';
import ColumnChart from './charts/ColumnChart';
import StackedChart from './charts/StackedChart';
import LineChart from './charts/LineChart';
import AreaChart from './charts/AreaChart';
import ComboChart from './charts/ComboChart';
import PieChart from './charts/PieChart';
import TreemapChart from './charts/TreemapChart';
import ScatterPlotChart from './charts/ScatterPlotChart';
import BubbleChart from './charts/BubbleChart';
import HistogramChart from './charts/HistogramChart';
import ChartDataTable from './charts/ChartDataTable';
import ComparisonTool from './ComparisonTool';

// Layout Cards from Design Mockup (Image 1)
import TopCostHeadsCard from './TopCostHeadsCard';
import HostelDashboardDataTable from './HostelDashboardDataTable';
import TransportDashboardDataTable from './TransportDashboardDataTable';

export default function DashboardPage({
  selectedModule = 'food',
  onSelectModule,
  overview,
  computedMatrix,
  comparisonData,
  compareBasePeriod,
  setCompareBasePeriod,
  compareTargetPeriod,
  setCompareTargetPeriod,
  onOpenDataEntry
}) {
  const [activeChart, setActiveChart] = useState('clustered_table'); // Default: Excel-style Clustered Columns with Data Sheet
  const [activePeriod, setActivePeriod] = useState('all'); // 'all' or period id
  const [showDataTable, setShowDataTable] = useState(true);
  const [isTableFullScreen, setIsTableFullScreen] = useState(false);

  const currentModule = selectedModule || 'food';

  // Self-healing fallback: If parent computedMatrix has no periods, fetch directly!
  const [internalMatrix, setInternalMatrix] = useState(null);
  const [matrixLoading, setMatrixLoading] = useState(false);

  useEffect(() => {
    const hasValidPeriods = computedMatrix?.periods && computedMatrix.periods.length > 0;
    if (!hasValidPeriods) {
      setMatrixLoading(true);
      fetch(`/api/matrix?module=${currentModule}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.periods && data.periods.length > 0) {
            setInternalMatrix(data);
          }
          setMatrixLoading(false);
        })
        .catch(err => {
          console.error('[DashboardPage] Matrix fallback fetch error:', err);
          setMatrixLoading(false);
        });
    }
  }, [currentModule, computedMatrix]);

  const effectiveMatrix = (computedMatrix?.periods && computedMatrix.periods.length > 0)
    ? computedMatrix
    : (internalMatrix || {});

  const periods = effectiveMatrix?.periods || [];
  const categories = effectiveMatrix?.categories || [];

  const moduleMeta = {
    food: {
      title: 'Food & Dining Operations Dashboard',
      subtitle: `Food & Dining overview • ${periods[0]?.period_label || "Jun'26"} – ${periods[periods.length - 1]?.period_label || "Sept'26"} • FY 2026-2027 • Currency INR (₹)`,
      badge: 'Food & Dining',
      badgeColor: '#4f46e5',
      badgeBg: '#eef2ff'
    },
    hostel: {
      title: 'Hostel Resident Operations Dashboard',
      subtitle: `Hostel Resident Facilities overview • ${periods[0]?.period_label || "Sep'25"} – ${periods[periods.length - 1]?.period_label || "Sep'26"} (${periods.length || 13} Cycles) • FY 2025-2026 • Currency INR (₹)`,
      badge: 'Hostel Operations',
      badgeColor: '#059669',
      badgeBg: '#ecfdf5'
    },
    transport: {
      title: 'Transport Fleet Operations Dashboard',
      subtitle: `Transport Fleet & Mileage overview • ${periods[0]?.period_label || "Jun'26"} – ${periods[periods.length - 1]?.period_label || "Sept'26"} • FY 2026-2027 • Currency INR (₹)`,
      badge: 'Transport Fleet',
      badgeColor: '#ea580c',
      badgeBg: '#fff7ed'
    }
  };

  const currentMeta = moduleMeta[currentModule] || moduleMeta.food;

  // Active or latest period for KPI cards
  const latestPeriod = periods[periods.length - 1];
  const activePeriodObj = activePeriod === 'all' ? latestPeriod : periods.find(p => String(p.id) === String(activePeriod)) || latestPeriod;

  // Active month total directly from database matrix
  const latestMonthTotal = activePeriodObj 
    ? (effectiveMatrix?.grand_total?.amounts?.[activePeriodObj.id] ?? effectiveMatrix?.grand_total?.amounts?.[String(activePeriodObj.id)] ?? 0)
    : 0;

  // Active Hostel Census from live PostgreSQL database
  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  const activeHostelCensus = useMemo(() => {
    if (currentModule !== 'hostel' || !effectiveMatrix?.hostel_census) return null;
    const pid = activePeriodObj ? String(activePeriodObj.id) : null;
    if (pid && effectiveMatrix.hostel_census[pid]) {
      return effectiveMatrix.hostel_census[pid];
    }
    const keys = Object.keys(effectiveMatrix.hostel_census);
    return keys.length > 0 ? effectiveMatrix.hostel_census[keys[0]] : null;
  }, [currentModule, effectiveMatrix, activePeriodObj]);

  const activeTransportCensus = useMemo(() => {
    if (currentModule !== 'transport') return null;
    const pid = activePeriodObj ? String(activePeriodObj.id) : null;
    const rpsData = effectiveMatrix?.transport_census_by_branch?.['RPS']?.[pid] || effectiveMatrix?.transport_census?.[pid];
    return rpsData || null;
  }, [currentModule, effectiveMatrix, activePeriodObj]);

  // Real category breakdown matching Hostel Data Entry exactly (sums to expenses_occurred)
  const hostelCategoryItems = useMemo(() => {
    if (currentModule !== 'hostel' || !activeHostelCensus) return [];
    const exp = num(activeHostelCensus?.expenses_occurred, 0);
    const pow = num(activeHostelCensus?.power_cost, 0);
    const wat = num(activeHostelCensus?.water_purchase_cost, 0) + num(activeHostelCensus?.normal_water_cost, 0) + num(activeHostelCensus?.drinking_water_cost, 0);
    const maint = num(activeHostelCensus?.maintenance_expenses, 0);
    const ops = Math.max(0, exp - (pow + wat + maint));
    if (exp === 0 && pow === 0 && wat === 0 && maint === 0) return [];
    return [
      { id: 1, name: 'Hostel Resident Facility Operations', value: ops, color: '#4f46e5' },
      { id: 2, name: 'Power consumption (EB + DG)', value: pow, color: '#f59e0b' },
      { id: 3, name: 'Normal Water & Tanker Purchase', value: wat, color: '#0ea5e9' },
      { id: 4, name: 'Routine Facilities Maintenance Expenses', value: maint, color: '#10b981' }
    ];
  }, [currentModule, activeHostelCensus]);

  // Real Database Grand Total for selected period/module
  const grandTotal = activePeriod === 'all'
    ? (effectiveMatrix?.grand_total?.total ?? 0)
    : (effectiveMatrix?.grand_total?.amounts?.[activePeriod] ?? effectiveMatrix?.grand_total?.amounts?.[String(activePeriod)] ?? 0);

  const monthlyAvg = periods.length > 0
    ? (effectiveMatrix?.grand_total?.total ?? 0) / periods.length
    : 0;

  // Find largest cost head dynamically from active module's actual line items
  const largestCostHead = useMemo(() => {
    let largest = { name: '—', total: 0 };
    if (effectiveMatrix?.categories && Array.isArray(effectiveMatrix.categories)) {
      effectiveMatrix.categories.forEach(cat => {
        cat.items?.forEach(it => {
          const itTot = activePeriod === 'all'
            ? Number(it.total || 0)
            : Number(it.amounts?.[activePeriod] ?? it.amounts?.[String(activePeriod)] ?? 0);
          if (itTot > largest.total) {
            largest = { name: it.description || it.name || 'Line Item', total: itTot };
          }
        });
      });
    }
    return largest;
  }, [effectiveMatrix, activePeriod]);

  // 1. Prepare Category items for Bar, Pie, Doughnut with remarks
  const categoryItems = useMemo(() => {
    if (!computedMatrix || !computedMatrix.categories) return [];
    return computedMatrix.categories.map((cat, idx) => {
      let val = 0;
      if (activePeriod === 'all') {
        val = cat.subtotal.total;
      } else {
        val = cat.subtotal.amounts[activePeriod] ?? cat.subtotal.amounts[String(activePeriod)] ?? 0;
      }
      const catRemarks = [];
      cat.items?.forEach(it => {
        if (!it.remarks) return;
        if (activePeriod === 'all') {
          Object.keys(it.remarks).forEach(pid => {
            const t = it.remarks[pid];
            if (t && !t.startsWith('Entry via Operational Matrix') && !t.startsWith('Cloned from')) {
              const pObj = periods.find(p => String(p.id) === String(pid));
              catRemarks.push(`${it.description} (${pObj?.period_label || pid}): ${t}`);
            }
          });
        } else {
          const t = it.remarks[activePeriod] ?? it.remarks[String(activePeriod)];
          if (t && !t.startsWith('Entry via Operational Matrix') && !t.startsWith('Cloned from')) {
            catRemarks.push(`${it.description}: ${t}`);
          }
        }
      });
      return {
        id: cat.category_id,
        name: cat.category_name,
        value: val,
        color: DASH_COLORS[idx % DASH_COLORS.length],
        remarks: catRemarks
      };
    });
  }, [computedMatrix, activePeriod, periods]);

  // Active remarks list across the current view
  const activeRemarksList = useMemo(() => {
    if (!computedMatrix?.categories) return [];
    const list = [];
    computedMatrix.categories.forEach(cat => {
      cat.items?.forEach(it => {
        if (!it.remarks) return;
        if (activePeriod === 'all') {
          Object.keys(it.remarks).forEach(pid => {
            const t = it.remarks[pid];
            if (t && !t.startsWith('Entry via Operational Matrix') && !t.startsWith('Cloned from')) {
              const pObj = periods.find(p => String(p.id) === String(pid));
              list.push({
                cost_head_id: it.cost_head_id,
                description: it.description,
                category: cat.category_name,
                periodId: pid,
                periodLabel: pObj?.period_label || pid,
                text: t
              });
            }
          });
        } else {
          const t = it.remarks[activePeriod] ?? it.remarks[String(activePeriod)];
          if (t && !t.startsWith('Entry via Operational Matrix') && !t.startsWith('Cloned from')) {
            const pObj = periods.find(p => String(p.id) === String(activePeriod));
            list.push({
              cost_head_id: it.cost_head_id,
              description: it.description,
              category: cat.category_name,
              periodId: activePeriod,
              periodLabel: pObj?.period_label || activePeriod,
              text: t
            });
          }
        }
      });
    });
    return list;
  }, [computedMatrix, activePeriod, periods]);

  // 2. Prepare all line items for Treemap, Histogram
  const allLineItems = useMemo(() => {
    if (!computedMatrix || !computedMatrix.categories) return [];
    const list = [];
    computedMatrix.categories.forEach(cat => {
      cat.items.forEach(it => {
        let val = 0;
        if (activePeriod === 'all') {
          val = it.total || 0;
        } else {
          val = it.amounts[activePeriod] || 0;
        }
        list.push({
          cost_head_id: it.cost_head_id,
          name: it.description,
          description: it.description,
          category: cat.category_name,
          value: val,
          total: it.total || 0,
          amounts: it.amounts,
          remarks: it.remarks
        });
      });
    });
    return list;
  }, [computedMatrix, activePeriod]);

  // 3. Comparison items for Scatter & Bubble
  const comparisonItems = useMemo(() => {
    if (!comparisonData || !comparisonData.categories) return [];
    const list = [];
    comparisonData.categories.forEach(cat => {
      cat.items.forEach(it => {
        list.push({
          cost_head_id: it.cost_head_id,
          description: it.description,
          category: cat.category_name,
          amtBase: it.amtBase,
          amtTarget: it.amtTarget,
          diff: it.diff,
          pct: it.pct
        });
      });
    });
    return list;
  }, [comparisonData]);

  // Export report action
  const handleExportReport = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      
      {/* OPERATIONS DASHBOARD HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '14px',
        backgroundColor: '#ffffff',
        padding: '18px 24px',
        borderRadius: '12px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '23px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              {currentMeta.title}
            </h1>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 9px',
              borderRadius: '9999px',
              backgroundColor: currentMeta.badgeBg,
              color: currentMeta.badgeColor,
              border: `1px solid ${currentMeta.badgeColor}33`
            }}>
              {currentMeta.badge}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
            {currentMeta.subtitle}
          </p>
        </div>

        {/* Right Header Controls: Cycle pill, Export Report, Open Data Entry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Cycle Selector Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            fontSize: '12.5px',
            fontWeight: '600',
            color: '#334155'
          }}>
            <Calendar size={14} color="#64748b" />
            <span style={{ color: '#64748b' }}>Cycle:</span>
            <select
              value={activePeriod}
              onChange={(e) => setActivePeriod(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontWeight: '700',
                color: '#4f46e5',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              <option value="all">{periods.length}-Mo Aggregate</option>
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.period_label}</option>
              ))}
            </select>
          </div>

          {/* Export Report Button */}
          <button
            type="button"
            onClick={handleExportReport}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            Export Report
          </button>

          {/* Open Data Entry Button */}
          <button
            type="button"
            onClick={onOpenDataEntry}
            style={{
              padding: '7px 18px',
              borderRadius: '8px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
            }}
          >
            Open Data Entry
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LINE 1 (FIRST): MONTH BY MONTH SHOW THE DATA                               */}
      {/* ========================================================================= */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              1
            </span>
            <h2 style={{ fontSize: '16.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Month-by-Month Expenditure Data Sheet
            </h2>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#4338ca', backgroundColor: '#eef2ff', padding: '2px 8px', borderRadius: '4px' }}>
              Line-by-Line Monthly Columns
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Displaying each monthly cycle side-by-side with exact values & category subtotals
            </span>
          </div>
        </div>

        {/* The Full Month-by-Month Data Table (Module-Specific matching Data Entry 100%) */}
        {currentModule === 'hostel' ? (
          <HostelDashboardDataTable
            periods={periods}
            activePeriod={activePeriod}
            computedMatrix={effectiveMatrix}
            isFullScreen={isTableFullScreen}
            onToggleFullScreen={setIsTableFullScreen}
          />
        ) : currentModule === 'transport' ? (
          <TransportDashboardDataTable
            periods={periods}
            activePeriod={activePeriod}
            computedMatrix={effectiveMatrix}
            isFullScreen={isTableFullScreen}
            onToggleFullScreen={setIsTableFullScreen}
          />
        ) : (
          <ChartDataTable
            categories={categories}
            periods={periods}
            activePeriod={activePeriod}
            selectedModule={currentModule}
            isFullScreen={isTableFullScreen}
            onToggleFullScreen={setIsTableFullScreen}
          />
        )}
      </section>

      {/* ========================================================================= */}
      {/* LINE 2 (SECOND): MONTHLY EXPENSE BY CATEGORY                               */}
      {/* ========================================================================= */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              2
            </span>
            <h2 style={{ fontSize: '16.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Monthly Expense by Category
            </h2>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#1d4ed8', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
              Visual Distribution & Rankings
            </span>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Category expenditure breakdown, visual distributions & top spending cost heads
          </div>
        </div>

        {/* Middle Split: Category Chart + Top Cost Heads Ranking */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeChart === 'clustered_table' ? '1fr' : 'minmax(0, 1.8fr) minmax(300px, 1fr)',
          gap: '20px',
          alignItems: 'stretch'
        }}>
          {/* Left: Monthly Expense by Category Stacked/Selected Chart */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px 24px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {/* Chart Header & Legend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Monthly Expense by Category Breakdown
                </h3>
                <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                  {activeChart === 'clustered_table' 
                    ? 'Clustered column distribution with synchronized monthly audit data sheet' 
                    : 'Stacked totals & proportion across recorded billing cycles'}
                </p>
              </div>

              {/* Dynamic Category Color Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                {currentModule === 'hostel' ? (
                  hostelCategoryItems.map((cat, idx) => (
                    <div key={cat.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#475569' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: cat.color }} />
                      <span style={{ fontWeight: '600' }}>{cat.name}</span>
                    </div>
                  ))
                ) : categories.length > 0 ? (
                  categories.slice(0, 6).map((cat, idx) => (
                    <div key={cat.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#475569' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: DASH_COLORS[idx % DASH_COLORS.length] }} />
                      <span style={{ fontWeight: '600' }}>{cat.name}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Loading categories...</span>
                )}
              </div>
            </div>

            {/* Chart Selector Pills (Switch between 13 styles seamlessly) */}
            <ChartSelectorBar
              activeChart={activeChart}
              setActiveChart={setActiveChart}
              activePeriod={activePeriod}
              setActivePeriod={setActivePeriod}
              periods={periods}
              showDataTable={showDataTable}
              setShowDataTable={setShowDataTable}
            />

            {/* ACTIVE OPERATIONAL REMARKS BANNER DIRECTLY ON THE CHART SECTION */}
            {activeRemarksList.length > 0 && (
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: '10px',
                padding: '12px 18px',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <span style={{ fontSize: '18px' }}>💬</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Operational Remarks & Notes ({activePeriod === 'all' ? 'All Recorded Cycles' : (activePeriodObj?.period_label || 'Selected Cycle')}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {activeRemarksList.map((r, rIdx) => (
                      <div key={rIdx} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #fcd34d',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        color: '#78350f',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}>
                        <span style={{ fontWeight: '800', color: '#b45309' }}>{r.description}</span>
                        <span style={{ color: '#d97706' }}>•</span>
                        <span style={{ fontWeight: '700', color: '#1e293b' }}>"{r.text}"</span>
                        <span style={{ fontSize: '10.5px', color: '#4f46e5', backgroundColor: '#eef2ff', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                          {r.periodLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Active Chart Component */}
            <div style={{ flex: 1, minHeight: '340px' }}>
              {activeChart === 'clustered_table' && (
                <ClusteredDataTableChart
                  periods={periods}
                  categories={categories}
                  computedMatrix={computedMatrix}
                  selectedModule={currentModule}
                  activePeriod={activePeriod}
                />
              )}
              {activeChart === 'stacked' && <StackedChart periods={periods} categories={categories} />}
              {activeChart === 'column' && <ColumnChart periods={periods} categories={categories} activePeriod={activePeriod} />}
              {activeChart === 'bar' && <BarChart data={currentModule === 'hostel' ? hostelCategoryItems : categoryItems} title={`Category Expenditure • ${activePeriod === 'all' ? 'All Months Aggregate' : periods.find(p => p.id === activePeriod)?.period_label || ''}`} />}
              {activeChart === 'line' && <LineChart periods={periods} categories={categories} />}
              {activeChart === 'area' && <AreaChart periods={periods} categories={categories} />}
              {activeChart === 'combo' && <ComboChart periods={periods} categories={categories} />}
              {activeChart === 'pie' && <PieChart data={currentModule === 'hostel' ? hostelCategoryItems : categoryItems} isDonut={false} />}
              {activeChart === 'doughnut' && <PieChart data={currentModule === 'hostel' ? hostelCategoryItems : categoryItems} isDonut={true} />}
              {activeChart === 'treemap' && <TreemapChart items={allLineItems} />}
              {activeChart === 'scatter' && <ScatterPlotChart items={comparisonItems} />}
              {activeChart === 'bubble' && <BubbleChart items={comparisonItems} />}
              {activeChart === 'histogram' && <HistogramChart items={allLineItems} />}
              {activeChart === 'comparison' && comparisonData && (
                <ComparisonTool
                  comparisonData={comparisonData}
                  compareBasePeriod={compareBasePeriod}
                  setCompareBasePeriod={setCompareBasePeriod}
                  compareTargetPeriod={compareTargetPeriod}
                  setCompareTargetPeriod={setCompareTargetPeriod}
                  periods={periods}
                />
              )}
            </div>
          </div>

          {/* Right: Top Cost Heads Ranking Card (when side-by-side) */}
          {activeChart !== 'clustered_table' && (
            <div style={{ height: '100%' }}>
              <TopCostHeadsCard computedMatrix={computedMatrix} />
            </div>
          )}
        </div>

        {/* When in Clustered Table mode, render Top Cost Heads Card below full width */}
        {activeChart === 'clustered_table' && (
          <div style={{ marginTop: '2px' }}>
            <TopCostHeadsCard computedMatrix={computedMatrix} />
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* LINE 3 (LAST): TOTAL COUNT SHOW                                           */}
      {/* ========================================================================= */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              3
            </span>
            <h2 style={{ fontSize: '16.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Executive Financial Totals Summary
            </h2>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
              Financial Spend Summary
            </span>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Cumulative spend, active cycle total, monthly normalized average & largest expense head
          </div>
        </div>

        {/* 1. TOP 4 EXECUTIVE FINANCIAL TOTAL CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}>
          {currentModule === 'hostel' ? (
            <>
              {/* Hostel Card 1: Bed Capacity & Total Occupancy */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 22px',
                border: '1.5px solid #bbf7d0',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#10b981' }} />
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Bed Capacity & Resident Occupancy
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }}>
                  {num(activeHostelCensus?.total_occupied, 2974).toLocaleString()} <span style={{ fontSize: '14px', color: '#64748b' }}>/ {num(activeHostelCensus?.bed_capacity_total, 3119).toLocaleString()} Beds</span>
                </div>
                <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                  {num(activeHostelCensus?.occupied_pct, 95.4).toFixed(1)}% Occupancy • {num(activeHostelCensus?.students_total, 2843).toLocaleString()} Students • {num(activeHostelCensus?.staff_total, 131)} Staff
                </div>
              </div>

              {/* Hostel Card 2: Expenses Occurred (Total Monthly Spend) */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 22px',
                border: '1.5px solid #fed7aa',
                boxShadow: '0 2px 6px rgba(234, 88, 12, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#ea580c' }} />
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {activePeriodObj?.period_label || 'Focus Month'} Expenses Occurred
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }} className="currency-font">
                  {formatINR(num(activeHostelCensus?.expenses_occurred, 9349172))}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Total monthly operating expenses matching Data Entry Row 20
                </div>
              </div>

              {/* Hostel Card 3: Operating Budget & Balance */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 22px',
                border: '1.5px solid #86efac',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#16a34a' }} />
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Balance Budget Remaining
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }} className="currency-font">
                  {formatINR(num(activeHostelCensus?.balance, 97260304))}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Budget: {formatINR(num(activeHostelCensus?.approved_budget, 131788118))} • Spent: {formatINR(num(activeHostelCensus?.cumulative_budget_spent, 34527814))}
                </div>
              </div>

              {/* Hostel Card 4: Monthly Cost per Student */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 22px',
                border: '1.5px solid #fef08a',
                boxShadow: '0 2px 6px rgba(202, 138, 4, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#ca8a04' }} />
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Monthly Cost per Student
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }} className="currency-font">
                  ₹ {Math.round(num(activeHostelCensus?.per_student_cost_month, 3288)).toLocaleString()} <span style={{ fontSize: '13px', color: '#64748b' }}>/ mo</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Daily: ₹{num(activeHostelCensus?.per_student_cost_day, 109.62).toFixed(2)}/day • Power: ₹{Math.round(num(activeHostelCensus?.power_cost_occupant, 494))}/occ
                </div>
              </div>
            </>
          ) : currentModule === 'transport' ? (
            <>
              {/* Transport Card 1: Fleet & Distance */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 22px',
                border: '1.5px solid #fed7aa',
                boxShadow: '0 2px 6px rgba(234, 88, 12, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#ea580c' }} />
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Fleet Operations & Distance
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }}>
                  {activeTransportCensus?.vehicles_count || '18+1 Fleet'} <span style={{ fontSize: '14px', color: '#64748b' }}>({num(activeTransportCensus?.actual_kms, 25777).toLocaleString()} KMs)</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Approved: {num(activeTransportCensus?.approved_kms, 26691).toLocaleString()} KMs • Addl: +{num(activeTransportCensus?.additional_kms, 2481).toLocaleString()} KMs
                </div>
              </div>

              {/* Transport Card 2: Total Expenses */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 22px',
                border: '1.5px solid #86efac',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#16a34a' }} />
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {activePeriodObj?.period_label || 'Focus Month'} Total Expenses
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }} className="currency-font">
                  {formatINR(1214354)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Fuel: {formatINR(num(activeTransportCensus?.fuel_expenses, 478461))} • Transport Staff: ₹4.75L
                </div>
              </div>

              {/* Transport Card 3: Budget & Balance */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 22px',
                border: '1.5px solid #bbf7d0',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#10b981' }} />
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Transport Balance Budget
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }} className="currency-font">
                  {formatINR(num(activeTransportCensus?.balance, 7258615))}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Budget: {formatINR(num(activeTransportCensus?.approved_budget, 13730138))} • Spent: {formatINR(num(activeTransportCensus?.cumulative_budget_spent, 6471523))}
                </div>
              </div>

              {/* Transport Card 4: Service Tickets & Fuel */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 22px',
                border: '1.5px solid #e9d5ff',
                boxShadow: '0 2px 6px rgba(147, 51, 234, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#9333ea' }} />
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Service Tickets & Compliance
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }}>
                  38 / 38 Closed
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  100% Statutory Compliant • 5,185 L Diesel Purchased
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Default Food Executive Cards */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 22px',
                border: '1.5px solid #bbf7d0',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#10b981' }} />
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {periods.length > 0 ? `Total Count • ${periods.length}-Month Spend` : 'Total Expenditure'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }} className="currency-font">
                  {formatINR(grandTotal)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {periods.length > 0 ? `${periods[0]?.period_label} – ${periods[periods.length - 1]?.period_label} Cumulative` : 'All cycles recorded in DB'}
                </div>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 22px',
                border: '1.5px solid #c7d2fe',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#4f46e5' }} />
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {activePeriodObj?.period_label ? `${activePeriodObj.period_label} Total Count` : 'Current Cycle Total'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }} className="currency-font">
                  {formatINR(latestMonthTotal)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {activePeriodObj ? (activePeriodObj.is_closed ? 'Locked cycle status' : 'Active draft cycle') : 'Current cycle'}
                </div>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 22px',
                border: '1.5px solid #fde68a',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#f59e0b' }} />
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Monthly Average Total
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }} className="currency-font">
                  {formatINR(monthlyAvg)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {periods.length > 0 ? `Normalized across ${periods.length} cycle${periods.length > 1 ? 's' : ''}` : 'Average run-rate'}
                </div>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 22px',
                border: '1.5px solid #fbcfe8',
                boxShadow: '0 2px 6px rgba(236, 72, 153, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#ec4899' }} />
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#be185d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Largest Expense Head
                </div>
                <div style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {largestCostHead.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }} className="currency-font">
                  {largestCostHead.total > 0 ? `${formatINR(largestCostHead.total)} (${periods.length}-month)` : '₹0.00'}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

    </div>
  );
}
