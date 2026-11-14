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
  const [activeChart, setActiveChart] = useState('stacked'); // Stacked by default matching Image 1
  const [activePeriod, setActivePeriod] = useState('all'); // 'all' or period id
  const [showDataTable, setShowDataTable] = useState(true);

  const currentModule = selectedModule || 'food';

  const periods = computedMatrix?.periods || [];
  const categories = computedMatrix?.categories || [];

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
      subtitle: `Hostel Resident Facilities overview • ${periods[0]?.period_label || "Sept'25"} – ${periods[periods.length - 1]?.period_label || "Dec'25"} • FY 2025-2026 • Currency INR (₹)`,
      badge: 'Hostel Operations',
      badgeColor: '#059669',
      badgeBg: '#ecfdf5'
    },
    transport: {
      title: 'Transport Fleet Operations Dashboard',
      subtitle: `Transport Fleet & Mileage overview • ${periods[0]?.period_label || "Jun'26"} – ${periods[periods.length - 1]?.period_label || "Sept'26"} • FY 2026-2027 • Currency INR (₹)`,
      badge: 'Transport Fleet',
      badgeColor: '#2563eb',
      badgeBg: '#eff6ff'
    }
  };

  const currentMeta = moduleMeta[currentModule] || moduleMeta.food;

  // Active or latest period for KPI cards
  const latestPeriod = periods[periods.length - 1];
  const activePeriodObj = activePeriod === 'all' ? latestPeriod : periods.find(p => String(p.id) === String(activePeriod)) || latestPeriod;

  // Active month total directly from database matrix
  const latestMonthTotal = latestPeriod 
    ? (computedMatrix?.grand_total?.amounts?.[latestPeriod.id] ?? computedMatrix?.grand_total?.amounts?.[String(latestPeriod.id)] ?? 0)
    : 0;

  // Real Database Grand Total for selected period/module (NEVER uses unsegregated overview)
  const grandTotal = activePeriod === 'all'
    ? (computedMatrix?.grand_total?.total ?? 0)
    : (computedMatrix?.grand_total?.amounts?.[activePeriod] ?? computedMatrix?.grand_total?.amounts?.[String(activePeriod)] ?? 0);

  const monthlyAvg = periods.length > 0
    ? (computedMatrix?.grand_total?.total ?? 0) / periods.length
    : 0;

  // Find largest cost head dynamically from active module's actual line items
  const largestCostHead = useMemo(() => {
    let largest = { name: '—', total: 0 };
    if (computedMatrix?.categories && Array.isArray(computedMatrix.categories)) {
      computedMatrix.categories.forEach(cat => {
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
  }, [computedMatrix, activePeriod]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* OPERATIONS DASHBOARD HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
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

      {/* 3. TOP 4 EXECUTIVE KPI CARDS (IMAGE 1 STYLE) */}
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

      {/* OPERATIONAL PARAMETERS & VOLUME RIBBON (MODULE-SPECIFIC) */}
      <div style={{
        backgroundColor: currentModule === 'food' ? '#f8fafc' : currentModule === 'hostel' ? '#f0fdf4' : '#eff6ff',
        borderRadius: '12px',
        border: `1.5px solid ${currentModule === 'food' ? '#e2e8f0' : currentModule === 'hostel' ? '#bbf7d0' : '#bfdbfe'}`,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>
            {currentModule === 'food' ? '🍲' : currentModule === 'hostel' ? '🏢' : '🚌'}
          </span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
              {currentModule === 'food' && 'Food Dining Volume & Unit Economics'}
              {currentModule === 'hostel' && 'Hostel Capacity, Occupancy & Utilities'}
              {currentModule === 'transport' && 'Transport Fleet, Passengers & Fuel Efficiency'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
              {currentModule === 'food' && 'Operating across campus mess facilities, daily fresh supply & manpower allocation'}
              {currentModule === 'hostel' && 'Campus residential census, power/water consumption & facilities maintenance'}
              {currentModule === 'transport' && 'Daily commuter bus operations, routes, fuel mileage & trip statistics'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {currentModule === 'food' && (() => {
            const pidKey = activePeriod === 'all' ? String(latestPeriod?.id) : String(activePeriod);
            const diners = computedMatrix?.census?.total_persons?.[pidKey] || 2690;
            const meals = computedMatrix?.census?.production?.[pidKey] || 85000;
            const matTotal = computedMatrix?.categories?.[0]?.subtotal?.total || 0;
            const tot = computedMatrix?.grand_total?.total || 1;
            const matPct = tot > 0 && matTotal > 0 ? ((matTotal / tot) * 100).toFixed(1) : '59.1';
            return (
              <>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Active Diners</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{Number(diners).toLocaleString()} Diners</div>
                </div>
                <div style={{ height: '24px', width: '1px', backgroundColor: '#cbd5e1' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Monthly Production</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{Number(meals).toLocaleString()} Meals</div>
                </div>
                <div style={{ height: '24px', width: '1px', backgroundColor: '#cbd5e1' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Material Cost Share</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#4f46e5' }}>{matPct}% of Total</div>
                </div>
              </>
            );
          })()}

          {currentModule === 'hostel' && (() => {
            const pidKey = activePeriod === 'all' ? String(latestPeriod?.id) : String(activePeriod);
            const hCensus = computedMatrix?.hostel_census?.[pidKey] || {};
            const bedCap = hCensus.bed_capacity_total || 3119;
            const occupied = hCensus.total_occupied || 3039;
            const occPct = hCensus.occupied_pct || 97.4;
            const pUnits = hCensus.power_units || 125422;
            const pCost = hCensus.power_cost || 1659230;
            return (
              <>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Total Bed Capacity</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{Number(bedCap).toLocaleString()} Beds</div>
                </div>
                <div style={{ height: '24px', width: '1px', backgroundColor: '#cbd5e1' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Resident Occupancy</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#059669' }}>{Number(occupied).toLocaleString()} ({occPct}%)</div>
                </div>
                <div style={{ height: '24px', width: '1px', backgroundColor: '#cbd5e1' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Power Consumption</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{Number(pUnits).toLocaleString()} kWh ({formatINR(pCost)})</div>
                </div>
              </>
            );
          })()}

          {currentModule === 'transport' && (() => {
            const pidKey = activePeriod === 'all' ? String(latestPeriod?.id) : String(activePeriod);
            const tCensus = computedMatrix?.transport_census?.[pidKey] || {};
            const veh = tCensus.vehicles_count || '18+1';
            const pax = tCensus.passengers_count || 447;
            const kms = tCensus.actual_kms || 25777;
            const diesel = tCensus.diesel_litres || 5184.8;
            return (
              <>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Active Fleet</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{veh} Vehicles</div>
                </div>
                <div style={{ height: '24px', width: '1px', backgroundColor: '#cbd5e1' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Commuters</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb' }}>{Number(pax).toLocaleString()} Passengers</div>
                </div>
                <div style={{ height: '24px', width: '1px', backgroundColor: '#cbd5e1' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Actual KMs & Diesel</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{Number(kms).toLocaleString()} KM • {Number(diesel).toLocaleString()}L</div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* 4. MIDDLE SECTION: SPLIT VIEW (CHART + TOP COST HEADS RANKING) */}
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

            {/* Dynamic Category Color Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {categories.length > 0 ? (
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

          {/* ACTIVE OPERATIONAL REMARKS BANNER DIRECTLY ON THE CHART SECTION */}
          {activeRemarksList.length > 0 && (
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '10px',
              padding: '12px 18px',
              marginTop: '14px',
              marginBottom: '10px',
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
