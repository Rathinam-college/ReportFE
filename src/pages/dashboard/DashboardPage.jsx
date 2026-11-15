import React, { useState, useMemo } from 'react';
import { formatINR, formatLakhs, DASH_COLORS } from '../../utils/formatters';
import { 
  Calendar, Layers, PieChart as PieIcon, Calculator, FileSpreadsheet, 
  TrendingUp, Users, ArrowRight, Table, BarChart3, CheckCircle2 
} from 'lucide-react';

// Charts & Components
import ChartSelectorBar from './charts/ChartSelectorBar';
import BarChart from './charts/BarChart';
import ColumnChart from './charts/ColumnChart';
import LineChart from './charts/LineChart';
import AreaChart from './charts/AreaChart';
import ComboChart from './charts/ComboChart';
import PieChart from './charts/PieChart';
import TreemapChart from './charts/TreemapChart';
import ScatterPlotChart from './charts/ScatterPlotChart';
import BubbleChart from './charts/BubbleChart';
import HistogramChart from './charts/HistogramChart';
import ComparisonTool from './ComparisonTool';

// Layout Cards matching the user's uploaded design mockup
import ChartDataTable from './charts/ChartDataTable';
import StackedCategoryCard from './StackedCategoryCard';
import TopCostHeadsCard from './TopCostHeadsCard';

export default function DashboardPage({
  selectedModule = 'transport',
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
  const [activeChart, setActiveChart] = useState('stacked'); // Stacked by default matching image
  const [activePeriod, setActivePeriod] = useState('all'); // 'all' or period id
  const [showDataTable, setShowDataTable] = useState(true);

  const currentModule = selectedModule || 'transport';

  const periods = computedMatrix?.periods || [];
  const categories = computedMatrix?.categories || [];

  const startPeriodLabel = periods[0]?.period_label || "Jun'26";
  const endPeriodLabel = periods[periods.length - 1]?.period_label || "Oct'26";

  const moduleMeta = {
    food: {
      title: 'Food & Dining Operations Dashboard',
      subtitle: `Food expense overview • ${startPeriodLabel} – ${endPeriodLabel} • FY 2026–2027 • Currency INR (₹) • Operational ledger`,
      badge: 'Food & Dining',
      badgeColor: '#4f46e5',
      badgeBg: '#eef2ff'
    },
    hostel: {
      title: 'Hostel Occupancy Operations Dashboard',
      subtitle: `Hostel expense overview • ${startPeriodLabel} – ${endPeriodLabel} • FY 2025–2026 • Currency INR (₹) • Operational ledger`,
      badge: 'Hostel Occupancy',
      badgeColor: '#059669',
      badgeBg: '#ecfdf5'
    },
    transport: {
      title: 'Transport Fleet Operations Dashboard',
      subtitle: `Fleet expense overview • ${startPeriodLabel} – ${endPeriodLabel} • FY 2026–2027 • Currency INR (₹) • Operational ledger`,
      badge: 'Transport',
      badgeColor: '#6366f1',
      badgeBg: '#eef2ff'
    }
  };

  const currentMeta = moduleMeta[currentModule] || moduleMeta.transport;

  // Active or latest period
  const latestPeriod = periods[periods.length - 1];
  const activePeriodObj = activePeriod === 'all' 
    ? latestPeriod 
    : periods.find(p => String(p.id) === String(activePeriod)) || latestPeriod;

  // Active month total directly from database matrix
  const latestMonthTotal = latestPeriod 
    ? (computedMatrix?.grand_total?.amounts?.[latestPeriod.id] ?? computedMatrix?.grand_total?.amounts?.[String(latestPeriod.id)] ?? 0)
    : 0;

  // Real Database Grand Total
  const grandTotal = activePeriod === 'all'
    ? (computedMatrix?.grand_total?.total ?? 0)
    : (computedMatrix?.grand_total?.amounts?.[activePeriod] ?? computedMatrix?.grand_total?.amounts?.[String(activePeriod)] ?? 0);

  // Category items for alternative chart views
  const categoryItems = useMemo(() => {
    if (!computedMatrix || !computedMatrix.categories) return [];
    return computedMatrix.categories.map((cat, idx) => {
      let val = 0;
      if (activePeriod === 'all') {
        val = cat.subtotal.total;
      } else {
        val = cat.subtotal.amounts[activePeriod] ?? cat.subtotal.amounts[String(activePeriod)] ?? 0;
      }
      return {
        id: cat.category_id,
        name: cat.category_name,
        value: val,
        color: DASH_COLORS[idx % DASH_COLORS.length]
      };
    });
  }, [computedMatrix, activePeriod]);

  // Comparison items for Scatter & Bubble
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* 1. HERO OPERATIONS DASHBOARD HEADER CARD (IMAGE 1 TOP DESIGN) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '18px 24px',
        borderRadius: '16px',
        border: '1.5px solid #e0e7ff',
        boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.08)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              {currentMeta.title}
            </h1>
            <span style={{
              fontSize: '11.5px',
              fontWeight: '700',
              padding: '2px 10px',
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
            padding: '7px 14px',
            borderRadius: '9999px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            fontSize: '12px',
            fontWeight: '600',
            color: '#334155',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <Calendar size={13} color="#64748b" />
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
                cursor: 'pointer',
                fontSize: '12px'
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
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease'
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
              borderRadius: '9999px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            Open Data Entry
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN DASHBOARD GRID (IMAGE 1 EXACT SIDE-BY-SIDE LAYOUT) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.95fr) minmax(330px, 1fr)',
        gap: '20px',
        alignItems: 'start'
      }}>
        
        {/* LEFT COLUMN (~68% width): Month-by-Month Expenditure Table */}
        <div style={{ minWidth: 0 }}>
          <ChartDataTable
            categories={categories}
            periods={periods}
            activePeriod={activePeriod}
            selectedModule={currentModule}
            computedMatrix={computedMatrix}
          />
        </div>

        {/* RIGHT COLUMN (~32% width): Monthly Expense by Category (Stacked) + Top Cost Heads */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          
          {/* Card 1: Monthly Expense by Category (Stacked Bar Chart) */}
          <StackedCategoryCard
            periods={periods}
            categories={categories}
            activePeriod={activePeriod}
            selectedModule={currentModule}
            activeChart={activeChart}
            onSwitchChart={setActiveChart}
          />

          {/* Alternative chart container if user toggles away from stacked */}
          {activeChart !== 'stacked' && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                  Alternative Chart View: {activeChart.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveChart('stacked')}
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    color: '#4f46e5',
                    cursor: 'pointer'
                  }}
                >
                  Back to Stacked
                </button>
              </div>

              <div style={{ minHeight: '260px' }}>
                {activeChart === 'pie' && <PieChart data={categoryItems} isDonut={false} />}
                {activeChart === 'doughnut' && <PieChart data={categoryItems} isDonut={true} />}
                {activeChart === 'line' && <LineChart periods={periods} categories={categories} />}
                {activeChart === 'area' && <AreaChart periods={periods} categories={categories} />}
                {activeChart === 'bar' && <BarChart data={categoryItems} />}
                {activeChart === 'column' && <ColumnChart periods={periods} categories={categories} />}
                {activeChart === 'combo' && <ComboChart periods={periods} categories={categories} />}
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
          )}

          {/* Card 2: Top Cost Heads Ranking */}
          <TopCostHeadsCard computedMatrix={computedMatrix} />
        </div>
      </div>

    </div>
  );
}
