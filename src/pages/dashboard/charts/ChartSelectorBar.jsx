import React, { useState, useRef, useEffect } from 'react';
import {
  BarChart as BarChartIcon,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity,
  Layers,
  GitCompare,
  CircleDot,
  LayoutGrid,
  ScatterChart,
  Disc,
  SlidersVertical,
  ChevronDown,
  Check,
  Calendar,
  Table as TableIcon
} from 'lucide-react';

export const CHART_GROUPS = [
  {
    group: 'Bars & Columns',
    items: [
      { id: 'clustered_table', label: 'Clustered Column + Data Sheet', icon: TableIcon, desc: 'Excel-style clustered columns with integrated audit data grid' },
      { id: 'stacked', label: 'Stacked Bar/Column', icon: Layers, desc: 'Category composition breakdown per month' },
      { id: 'column', label: 'Column Chart', icon: BarChart3, desc: 'Vertical monthly expenditure columns' },
      { id: 'bar', label: 'Horizontal Bar Chart', icon: BarChartIcon, desc: 'Ranked category spend bars' },
      { id: 'combo', label: 'Combo Chart', icon: SlidersVertical, desc: 'Columns + MoM growth rate line overlay' }
    ]
  },
  {
    group: 'Trends & Curves',
    items: [
      { id: 'line', label: 'Line Chart', icon: LineChartIcon, desc: 'Multi-period spending trajectory & baseline' },
      { id: 'area', label: 'Area Chart', icon: Activity, desc: 'Cumulative expenditure volume curve' }
    ]
  },
  {
    group: 'Composition & Distribution',
    items: [
      { id: 'pie', label: 'Pie Chart', icon: PieChartIcon, desc: 'Solid circular category allocation' },
      { id: 'doughnut', label: 'Doughnut Chart', icon: CircleDot, desc: 'Proportional ring with center grand total' },
      { id: 'treemap', label: 'Treemap', icon: LayoutGrid, desc: 'Proportional nested rectangles for all items' },
      { id: 'histogram', label: 'Histogram', icon: BarChart3, desc: 'Expense frequency distribution brackets' }
    ]
  },
  {
    group: 'Correlation & Variance',
    items: [
      { id: 'scatter', label: 'Scatter Plot', icon: ScatterChart, desc: '2D correlation & baseline equilibrium' },
      { id: 'bubble', label: 'Bubble Chart', icon: Disc, desc: '3D weight & variance magnitude plot' },
      { id: 'comparison', label: 'Comparison Tool', icon: GitCompare, desc: 'Side-by-side MoM variance analyzer' }
    ]
  }
];

export const ALL_CHARTS = CHART_GROUPS.flatMap(g => g.items);

export default function ChartSelectorBar({
  activeChart,
  setActiveChart,
  activePeriod,
  setActivePeriod,
  periods = [],
  showDataTable,
  setShowDataTable
}) {
  const [chartDropdownOpen, setChartDropdownOpen] = useState(false);
  const [cycleDropdownOpen, setCycleDropdownOpen] = useState(false);

  const chartRef = useRef(null);
  const cycleRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chartRef.current && !chartRef.current.contains(e.target)) {
        setChartDropdownOpen(false);
      }
      if (cycleRef.current && !cycleRef.current.contains(e.target)) {
        setCycleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentChartObj = ALL_CHARTS.find(c => c.id === activeChart) || ALL_CHARTS[0];
  const CurrentIcon = currentChartObj.icon;

  const currentPeriodLabel = activePeriod === 'all'
    ? 'All Cycles (5-Month Aggregate)'
    : periods.find(p => String(p.id) === String(activePeriod))?.period_label || 'Selected Cycle';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '10px 18px',
      backgroundColor: '#f4f6fc',
      borderRadius: '24px',
      border: '1px solid #edf0f8',
      position: 'relative'
    }}>
      {/* LEFT: CHART MODEL & REPORTING CYCLE DROPDOWNS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        
        {/* 1. CHART STYLE / MODEL DROPDOWN */}
        <div ref={chartRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setChartDropdownOpen(!chartDropdownOpen);
              setCycleDropdownOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 18px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              border: chartDropdownOpen ? '1.5px solid #6c56db' : '1px solid #edf0f8',
              color: '#1a1d36',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(110, 80, 180, 0.05)',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#efeefc',
              color: '#6c56db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CurrentIcon size={14} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <span style={{ fontSize: '9.5px', color: '#8f9bb3', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
                Chart Model
              </span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1a1d36', lineHeight: 1.2 }}>
                {currentChartObj.label}
              </span>
            </div>

            <ChevronDown size={14} color="#8f9bb3" style={{ transform: chartDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', marginLeft: '2px' }} />
          </button>

          {/* DROPDOWN MENU POPOVER */}
          {chartDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              width: '380px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #edf0f8',
              boxShadow: '0 16px 36px rgba(108, 86, 219, 0.16)',
              zIndex: 100,
              padding: '10px',
              maxHeight: '440px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {CHART_GROUPS.map((grp) => (
                <div key={grp.group} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: '#8f9bb3',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '4px 10px 2px 10px'
                  }}>
                    {grp.group}
                  </div>

                  {grp.items.map((chart) => {
                    const Icon = chart.icon;
                    const isSelected = activeChart === chart.id;

                    return (
                      <button
                        key={chart.id}
                        type="button"
                        onClick={() => {
                          setActiveChart(chart.id);
                          setChartDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          backgroundColor: isSelected ? '#efeefc' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.12s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '8px',
                            backgroundColor: isSelected ? '#6c56db' : '#f1f3f9',
                            color: isSelected ? '#ffffff' : '#6e768e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon size={14} />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: isSelected ? '800' : '600', color: isSelected ? '#6c56db' : '#1a1d36' }}>
                              {chart.label}
                            </div>
                            <div style={{ fontSize: '11px', color: '#8f9bb3' }}>
                              {chart.desc}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check size={16} color="#6c56db" strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. REPORTING CYCLE DROPDOWN */}
        <div ref={cycleRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setCycleDropdownOpen(!cycleDropdownOpen);
              setChartDropdownOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 18px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              border: cycleDropdownOpen ? '1.5px solid #6c56db' : '1px solid #edf0f8',
              color: '#1a1d36',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(110, 80, 180, 0.05)',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#efeefc',
              color: '#6c56db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={14} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <span style={{ fontSize: '9.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
                Reporting Cycle
              </span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>
                {currentPeriodLabel}
              </span>
            </div>

            <ChevronDown size={14} color="#64748b" style={{ transform: cycleDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', marginLeft: '2px' }} />
          </button>

          {/* CYCLE DROPDOWN MENU */}
          {cycleDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              width: '250px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 4px 8px -2px rgba(15, 23, 42, 0.06)',
              zIndex: 100,
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              {/* Option: All Cycles */}
              <button
                type="button"
                onClick={() => {
                  setActivePeriod('all');
                  setCycleDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  backgroundColor: activePeriod === 'all' ? '#eef2ff' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: activePeriod === 'all' ? '800' : '600', color: activePeriod === 'all' ? '#4f46e5' : '#0f172a' }}>
                    All Cycles (5-Month Aggregate)
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Complete cumulative dataset
                  </div>
                </div>
                {activePeriod === 'all' && <Check size={15} color="#4f46e5" />}
              </button>

              <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />

              {/* Individual periods */}
              {periods.map(p => {
                const isSel = String(activePeriod) === String(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActivePeriod(p.id);
                      setCycleDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: isSel ? '#eef2ff' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={13} color={isSel ? '#4f46e5' : '#64748b'} />
                      <span style={{ fontSize: '13px', fontWeight: isSel ? '800' : '600', color: isSel ? '#4f46e5' : '#0f172a' }}>
                        {p.period_label}
                      </span>
                    </div>
                    {isSel && <Check size={15} color="#4f46e5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT: DATA TABLE TOGGLE */}
      <button
        type="button"
        onClick={() => setShowDataTable(!showDataTable)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 18px',
          borderRadius: '9999px',
          fontSize: '12.5px',
          fontWeight: '700',
          backgroundColor: showDataTable ? '#efeefc' : '#ffffff',
          color: showDataTable ? '#6c56db' : '#6e768e',
          border: showDataTable ? '1.5px solid #d8d4fa' : '1px solid #edf0f8',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(110, 80, 180, 0.04)',
          transition: 'all 0.15s ease'
        }}
      >
        <TableIcon size={14} />
        <span>{showDataTable ? 'Hide Values Table' : 'Show All Values Table'}</span>
      </button>

    </div>
  );
}
