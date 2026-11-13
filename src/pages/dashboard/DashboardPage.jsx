import React, { useState, useMemo } from 'react';
import { formatINR, formatLakhs, DASH_COLORS } from '../../utils/formatters';

// 12 Chart Components & Master Selector
import ChartSelectorBar from './charts/ChartSelectorBar';
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
import ModulesGrid from './ModulesGrid';

export default function DashboardPage({
  overview,
  computedMatrix,
  comparisonData,
  compareBasePeriod,
  setCompareBasePeriod,
  compareTargetPeriod,
  setCompareTargetPeriod,
  onOpenDataEntry
}) {
  const [activeChart, setActiveChart] = useState('stacked'); // Stacked by default matching Image 1
  const [activePeriod, setActivePeriod] = useState('all'); // 'all' or period id
  const [showDataTable, setShowDataTable] = useState(true);

  const periods = computedMatrix?.periods || [];
  const categories = computedMatrix?.categories || [];

  // Active or latest period for KPI cards
  const latestPeriod = periods[periods.length - 1];
  const activePeriodObj = activePeriod === 'all' ? latestPeriod : periods.find(p => p.id === activePeriod) || latestPeriod;

  // Active month total
  const latestMonthTotal = latestPeriod ? (computedMatrix?.grand_total?.amounts?.[latestPeriod.id] ?? 0) : 0;
  const grandTotal = overview?.summary?.grand_total ?? computedMatrix?.grand_total?.total ?? 0;
  const monthlyAvg = overview?.summary?.monthly_avg ?? (periods.length > 0 ? grandTotal / periods.length : 0);

  // Find largest cost head dynamically
  const largestCostHead = useMemo(() => {
    let largest = { name: '—', total: 0 };
    if (computedMatrix?.categories) {
      computedMatrix.categories.forEach(cat => {
        cat.items?.forEach(it => {
          const itTot = it.total || 0;
          if (itTot > largest.total) {
            largest = { name: it.description, total: itTot };
          }
        });
      });
    }
    return largest;
  }, [computedMatrix]);

  // 1. Prepare Category items for Bar, Pie, Doughnut
  const categoryItems = useMemo(() => {
    if (!computedMatrix || !computedMatrix.categories) return [];
    return computedMatrix.categories.map((cat, idx) => {
      let val = 0;
      if (activePeriod === 'all') {
        val = cat.subtotal.total;
      } else {
        val = cat.subtotal.amounts[activePeriod] || 0;
      }
      return {
        id: cat.category_id,
        name: cat.category_name,
        value: val,
        color: DASH_COLORS[idx % DASH_COLORS.length]
      };
    });
  }, [computedMatrix, activePeriod]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* 1. OPERATIONS DASHBOARD HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Operations Dashboard
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
            Food & Dining overview • Jun'26 – Oct'26 • FY 2026-2027 • Currency INR (₹)
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
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            fontSize: '12.5px',
            fontWeight: '600',
            color: '#334155',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
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
              <option value="all">5-Mo Aggregate</option>
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
              fontWeight: '600',
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

      {/* 2. TOP 4 EXECUTIVE KPI CARDS (IMAGE 1 STYLE) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Latest Month Total (Purple bar) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '18px 22px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#4f46e5' }} />
          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b' }}>
            {activePeriodObj?.period_label ? `${activePeriodObj.period_label} Total` : 'Current Cycle Total'}
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0' }} className="currency-font">
            {formatINR(latestMonthTotal)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {activePeriodObj ? (activePeriodObj.is_closed ? 'Locked cycle' : 'Active draft') : 'No active cycle in database'}
          </div>
        </div>

        {/* Card 2: 5-Month Total (Emerald/Mint bar) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '18px 22px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#10b981' }} />
          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b' }}>
            {periods.length > 0 ? `${periods.length}-Month Total` : 'All-Cycles Total'}
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0' }} className="currency-font">
            {formatINR(grandTotal)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {periods.length > 0 ? `${periods[0]?.period_label} – ${periods[periods.length - 1]?.period_label}` : 'No periods recorded in DB'}
          </div>
        </div>

        {/* Card 3: Monthly Average (Amber bar) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '18px 22px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#f59e0b' }} />
          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b' }}>
            Monthly Average
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0' }} className="currency-font">
            {formatINR(monthlyAvg)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {periods.length > 0 ? `Across ${periods.length} cycle${periods.length > 1 ? 's' : ''}` : '0 cycles'}
          </div>
        </div>

        {/* Card 4: Largest Cost Head (Rose bar) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '18px 22px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#ec4899' }} />
          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b' }}>
            Largest Cost Head
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }}>
            {largestCostHead.name}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }} className="currency-font">
            {largestCostHead.total > 0 ? `${formatINR(largestCostHead.total)} (${periods.length}-month)` : '₹0.00 (No expenses recorded)'}
          </div>
        </div>
      </div>

      {/* 3. MIDDLE SECTION: SPLIT VIEW (CHART + TOP COST HEADS RANKING) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)',
        gap: '20px',
        alignItems: 'stretch'
      }}>
        {/* Left: Monthly Expense by Category Stacked/Selected Chart */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px 24px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Chart Header & Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Monthly expense by category
              </h3>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                Stacked totals per cycle
              </p>
            </div>

            {/* Category Color Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#475569' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#6366f1' }} />
                <span>Food Material</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#475569' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10b981' }} />
                <span>Food Labour</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#475569' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f59e0b' }} />
                <span>FC / Power / Water</span>
              </div>
            </div>
          </div>

          {/* Chart Selector Pills (Switch between 12 styles seamlessly) */}
          <ChartSelectorBar
            activeChart={activeChart}
            setActiveChart={setActiveChart}
            activePeriod={activePeriod}
            setActivePeriod={setActivePeriod}
            periods={periods}
            showDataTable={showDataTable}
            setShowDataTable={setShowDataTable}
          />

          {/* Active Chart Component */}
          <div style={{ flex: 1, minHeight: '340px' }}>
            {activeChart === 'stacked' && <StackedChart periods={periods} categories={categories} />}
            {activeChart === 'column' && <ColumnChart periods={periods} categories={categories} activePeriod={activePeriod} />}
            {activeChart === 'bar' && <BarChart data={categoryItems} title={`Category Expenditure • ${activePeriod === 'all' ? '5-Month Aggregate' : periods.find(p => p.id === activePeriod)?.period_label || ''}`} />}
            {activeChart === 'line' && <LineChart periods={periods} categories={categories} />}
            {activeChart === 'area' && <AreaChart periods={periods} categories={categories} />}
            {activeChart === 'combo' && <ComboChart periods={periods} categories={categories} />}
            {activeChart === 'pie' && <PieChart data={categoryItems} isDonut={false} />}
            {activeChart === 'doughnut' && <PieChart data={categoryItems} isDonut={true} />}
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

        {/* Right: Top Cost Heads Ranking Card */}
        <div style={{ height: '100%' }}>
          <TopCostHeadsCard computedMatrix={computedMatrix} />
        </div>
      </div>

      {/* 4. BOTTOM SECTION: MODULES GRID */}
      <ModulesGrid
        onOpenDataEntry={onOpenDataEntry}
        activePeriodTotal={formatINR(latestMonthTotal)}
        periodLabel={activePeriodObj?.period_label || "No cycle"}
        hasPeriods={periods.length > 0}
      />

      {/* 5. EXECUTIVE DATA VALUES TABLE (WITH REMARK POPOVER SUPPORT) */}
      {showDataTable && (
        <ChartDataTable
          categories={categories}
          periods={periods}
          activePeriod={activePeriod}
        />
      )}

    </div>
  );
}
