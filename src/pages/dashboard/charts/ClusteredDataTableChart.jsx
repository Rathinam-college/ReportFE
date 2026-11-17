import React, { useState, useMemo, useRef, useEffect } from 'react';
import { formatINR, formatLakhs } from '../../../utils/formatters';
import { 
  BarChart3, Layers, Maximize2, Minimize2, Download, Check, 
  HelpCircle, Sparkles, Building2, Utensils, Bus, FileSpreadsheet 
} from 'lucide-react';

// Curated 14-color palette for periods, matching modern enterprise BI styling
const PERIOD_PALETTE = [
  '#2563eb', // 1. Royal Blue
  '#db2777', // 2. Magenta / Pink
  '#059669', // 3. Emerald Green
  '#7c3aed', // 4. Purple / Violet
  '#15803d', // 5. Forest Green
  '#0284c7', // 6. Sky Blue
  '#d97706', // 7. Amber / Rust
  '#65a30d', // 8. Olive / Lime
  '#c026d3', // 9. Fuchsia / Orchid
  '#b45309', // 10. Golden Ochre
  '#ea580c', // 11. Orange
  '#0ea5e9', // 12. Cyan Azure
  '#f43f5e', // 13. Rose Red
  '#64748b'  // 14. Slate
];

export default function ClusteredDataTableChart({
  periods = [],
  categories = [],
  computedMatrix,
  selectedModule = 'food',
  activePeriod = 'all'
}) {
  const [dataViewMode, setDataViewMode] = useState(selectedModule === 'hostel' ? 'census' : 'categories'); // 'categories' | 'census'
  const [hoveredPeriodId, setHoveredPeriodId] = useState(null);
  const [hoveredColKey, setHoveredColKey] = useState(null);
  const [tooltip, setTooltip] = useState(null); // { x, y, title, period, value, unit }
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [valueFormat, setValueFormat] = useState('full'); // 'full' | 'compact'
  const containerRef = useRef(null);

  // Auto-switch to census mode when hostel is selected, and categories for others
  useEffect(() => {
    if (selectedModule === 'hostel') {
      setDataViewMode('census');
    } else {
      setDataViewMode('categories');
    }
  }, [selectedModule]);

  // 1. Determine columns based on module & view mode
  const currentColumns = useMemo(() => {
    if (dataViewMode === 'census') {
      if (selectedModule === 'hostel') {
        // Exactly matches the user's uploaded "Hostel Data" Excel chart columns!
        return [
          { key: 'bed_capacity', label: 'Bed Capacity', type: 'number', short: 'Bed Capacity' },
          { key: 'students_count', label: 'No. of students', type: 'number', short: 'No. of students' },
          { key: 'staff_count', label: 'No. of staffs', type: 'number', short: 'No. of staffs' },
          { key: 'total_occupied', label: 'Total Occupied', type: 'number', short: 'Total Occupied' },
          { key: 'vacant_total', label: 'Vacant', type: 'number', short: 'Vacant' },
          { key: 'vacant_college', label: 'Vacant for college students', type: 'number', short: 'Vacant (College)' },
          { key: 'vacant_sports', label: 'Vacant for college sports students (KPM hostel)', type: 'number', short: 'Vacant (Sports)' },
          { key: 'vacant_school', label: 'Vacant for school students', type: 'number', short: 'Vacant (School)' },
          { key: 'occupied_pct', label: 'Occupied %', type: 'percentage', short: 'Occupied %' },
          { key: 'vacant_pct', label: 'Vacant %', type: 'percentage', short: 'Vacant %' }
        ];
      } else if (selectedModule === 'food') {
        return [];
      } else {
        // Transport fleet census
        return [
          { key: 'vehicles_count', label: 'Active Fleet Count', type: 'number', short: 'Vehicles' },
          { key: 'passengers_count', label: 'Total Commuters', type: 'number', short: 'Pax' },
          { key: 'students_count', label: 'Student Commuters', type: 'number', short: 'Students' },
          { key: 'staff_count', label: 'Staff Commuters', type: 'number', short: 'Staff' },
          { key: 'actual_kms', label: 'Actual Trip KMs', type: 'number', short: 'KMs' },
          { key: 'diesel_litres', label: 'Diesel Fuel (L)', type: 'number', short: 'Fuel (L)' }
        ];
      }
    }

    // Default: Expense Categories from Master Data (excluding non-expense categories like Person, Total Person, Cost Per Person)
    return categories
      .filter(cat => {
        const n = String(cat.category_name || cat.name || '').toLowerCase().trim();
        return !(
          n === 'person' ||
          n === 'persons' ||
          n.includes('person') ||
          n.includes('total person') ||
          n.includes('cost per person') ||
          n.includes('per person') ||
          n.includes('total persons') ||
          n.includes('persons count') ||
          n.includes('diners') ||
          n.includes('per meal') ||
          n.includes('cost per meal') ||
          n.includes('unit economics') ||
          n.includes('census') ||
          n.includes('cost / person') ||
          n.includes('cost/person') ||
          n.includes('headcount') ||
          n.includes('student count')
        );
      })
      .map(cat => ({
        key: `cat_${cat.category_id || cat.id}`,
        id: cat.category_id || cat.id,
        label: cat.category_name || cat.name,
        short: cat.category_name || cat.name,
        type: 'currency'
      }));
  }, [dataViewMode, selectedModule, categories]);

  // 2. Compute matrix values for each period and column
  const gridData = useMemo(() => {
    return periods.map((p, pIdx) => {
      const pStr = String(p.id);
      const row = {
        period: p,
        period_id: p.id,
        period_label: p.period_label,
        period_code: p.period_code,
        operating_days: p.operating_days || 30,
        color: PERIOD_PALETTE[pIdx % PERIOD_PALETTE.length],
        values: {},
        rowTotal: 0
      };

      if (dataViewMode === 'census') {
        if (selectedModule === 'hostel') {
          const hc = computedMatrix?.hostel_census?.[pStr] || computedMatrix?.hostel_census?.[p.id] || {};
          const bedCap = Number(hc.bed_capacity_total ?? 0);
          const sCount = Number(hc.students_total ?? (Number(hc.students_boys || 0) + Number(hc.students_girls || 0)));
          const stCount = Number(hc.staff_total ?? (Number(hc.staff_boys || 0) + Number(hc.staff_girls || 0)));
          const totOcc = Number(hc.total_occupied ?? (sCount + stCount));
          const vacTot = Number(hc.vacant_total ?? (bedCap > 0 ? Math.max(0, bedCap - totOcc) : 0));
          const vacCol = Number(hc.vacant_college ?? (Number(hc.vacant_college_boys || 0) + Number(hc.vacant_college_girls || 0)));
          const vacSports = Number(hc.vacant_sports_total ?? 0);
          const vacSchool = Number(hc.vacant_school_total ?? 0);
          const occPct = Number(hc.occupied_pct ?? (bedCap > 0 ? (totOcc / bedCap) * 100 : 0));
          const vacPct = Number(hc.vacant_pct ?? (bedCap > 0 ? (vacTot / bedCap) * 100 : 0));

          row.values = {
            bed_capacity: bedCap,
            students_count: sCount,
            staff_count: stCount,
            total_occupied: totOcc,
            vacant_total: vacTot,
            vacant_college: vacCol,
            vacant_sports: vacSports,
            vacant_school: vacSchool,
            occupied_pct: occPct,
            vacant_pct: vacPct
          };
          row.rowTotal = totOcc;
        } else if (selectedModule === 'food') {
          const c = computedMatrix?.census || {};
          const s = Number(c.students?.[pStr] ?? c.students?.[p.id] ?? 0);
          const st = Number(c.staff?.[pStr] ?? c.staff?.[p.id] ?? 0);
          const o = Number(c.others?.[pStr] ?? c.others?.[p.id] ?? 0);
          const tot = Number(c.total_persons?.[pStr] ?? c.total_persons?.[p.id] ?? (s + st + o));
          const prod = Number(c.production?.[pStr] ?? c.production?.[p.id] ?? 0);

          row.values = {
            students: s,
            staff: st,
            others: o,
            total_persons: tot,
            production: prod
          };
          row.rowTotal = tot;
        } else {
          const tc = computedMatrix?.transport_census?.[pStr] || {};
          const veh = parseInt(String(tc.vehicles_count || '').replace(/[^0-9]/g, ''), 10) || 0;
          const pax = Number(tc.passengers_count) || 0;
          const s = Number(tc.students_count) || 0;
          const st = Number(tc.staff_count) || 0;
          const kms = Number(tc.actual_kms) || 0;
          const fuel = Number(tc.diesel_litres) || 0;

          row.values = {
            vehicles_count: veh,
            passengers_count: pax,
            students_count: s,
            staff_count: st,
            actual_kms: kms,
            diesel_litres: fuel
          };
          row.rowTotal = pax;
        }
      } else {
        // Categories expenditure (excluding Person, Total Person & Cost Per Person)
        let sum = 0;
        categories.forEach(cat => {
          const catName = String(cat.category_name || cat.name || '').toLowerCase().trim();
          if (
            catName === 'person' ||
            catName === 'persons' ||
            catName.includes('person') ||
            catName.includes('total person') ||
            catName.includes('cost per person') ||
            catName.includes('per person') ||
            catName.includes('total persons') ||
            catName.includes('persons count') ||
            catName.includes('diners') ||
            catName.includes('per meal') ||
            catName.includes('cost per meal') ||
            catName.includes('unit economics') ||
            catName.includes('census') ||
            catName.includes('cost / person') ||
            catName.includes('cost/person') ||
            catName.includes('headcount') ||
            catName.includes('student count')
          ) return;
          const catId = cat.category_id || cat.id;
          const val = Number(cat.subtotal?.amounts?.[p.id] ?? cat.subtotal?.amounts?.[pStr] ?? 0);
          row.values[`cat_${catId}`] = val;
          sum += val;
        });
        row.rowTotal = sum;
      }

      return row;
    });
  }, [periods, categories, computedMatrix, dataViewMode, selectedModule]);

  // 3. Compute Max Values for chart scaling
  const maxValue = useMemo(() => {
    let max = 0;
    gridData.forEach(r => {
      currentColumns.forEach(col => {
        // Exclude percentages from absolute bar height scaling so other columns remain proportional
        if (col.type !== 'percentage') {
          const v = Number(r.values[col.key] || 0);
          if (v > max) max = v;
        }
      });
    });
    return max > 0 ? max : 100;
  }, [gridData, currentColumns]);

  // Helper for formatting values in cells & chart
  const formatVal = (val, type, key) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    if ((key === 'vacant_sports' || key === 'vacant_school') && Number(val) === 0) return '';
    if (type === 'percentage') {
      return `${Math.round(Number(val))}%`;
    }
    if (type === 'currency') {
      if (valueFormat === 'compact') return formatLakhs(val);
      return formatINR(val);
    }
    return Number(val) === 0 && (key === 'vacant_sports' || key === 'vacant_school') ? '' : Number(val).toLocaleString();
  };

  // Helper for Y-axis ticks
  const yTicks = useMemo(() => {
    const ticksCount = 5;
    const ticks = [];
    const step = maxValue / ticksCount;
    for (let i = ticksCount; i >= 0; i--) {
      ticks.push(Math.round(step * i));
    }
    return ticks;
  }, [maxValue]);

  // Chart Dimensions
  const chartHeight = 270;
  const chartPaddingTop = 20;
  const chartPaddingBottom = 30;
  const availableBarHeight = chartHeight - chartPaddingTop - chartPaddingBottom;

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Period', ...currentColumns.map(c => `"${c.label}"`), 'Total / Key'];
    const rows = gridData.map(r => {
      const cols = currentColumns.map(c => r.values[c.key] ?? '');
      return [`"${r.period_label}"`, ...cols, r.rowTotal];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rathinam_${selectedModule}_${dataViewMode}_data_sheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1.5px solid #e2e8f0',
        boxShadow: isFullScreen ? 'none' : '0 4px 16px rgba(0,0,0,0.04)',
        padding: isFullScreen ? '28px 36px' : '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        width: '100%',
        boxSizing: 'border-box',
        ...(isFullScreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          borderRadius: 0,
          overflowY: 'auto',
          backgroundColor: '#ffffff'
        } : {})
      }}
    >
      {/* 1. TOP HEADER & INTERACTIVE CONTROLS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#eff6ff',
            border: '1px solid #dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb'
          }}>
            <BarChart3 size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16.5px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                {selectedModule === 'hostel' && dataViewMode === 'census'
                  ? 'Hostel Data • Clustered Census & Occupancy Chart'
                  : `Monthly ${dataViewMode === 'census' ? 'Operational Census' : 'Expense by Category'} • Clustered Columns`}
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #dbeafe'
              }}>
                Excel Clustered Model + Live Grid
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0 0' }}>
              Side-by-side monthly comparison clusters with integrated, synchronized audit data sheet below
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Module-Specific Data Switcher (Expenses vs Census for non-food) */}
          {selectedModule !== 'food' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                type="button"
                onClick={() => setDataViewMode('categories')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: dataViewMode === 'categories' ? '700' : '600',
                  backgroundColor: dataViewMode === 'categories' ? '#ffffff' : 'transparent',
                  color: dataViewMode === 'categories' ? '#1e293b' : '#64748b',
                  border: 'none',
                  boxShadow: dataViewMode === 'categories' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.12s ease'
                }}
              >
                <Layers size={13} />
                <span>Expense Categories</span>
              </button>

              <button
                type="button"
                onClick={() => setDataViewMode('census')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: dataViewMode === 'census' ? '700' : '600',
                  backgroundColor: dataViewMode === 'census' ? '#ffffff' : 'transparent',
                  color: dataViewMode === 'census' ? '#2563eb' : '#64748b',
                  border: 'none',
                  boxShadow: dataViewMode === 'census' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.12s ease'
                }}
              >
                {selectedModule === 'hostel' && <Building2 size={13} />}
                {selectedModule === 'transport' && <Bus size={13} />}
                <span>{selectedModule === 'hostel' ? 'Hostel Census (Excel Model)' : 'Fleet Census'}</span>
              </button>
            </div>
          )}

          {/* Number Formatting Toggle */}
          {dataViewMode === 'categories' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                type="button"
                onClick={() => setValueFormat('full')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: valueFormat === 'full' ? '700' : '600',
                  backgroundColor: valueFormat === 'full' ? '#ffffff' : 'transparent',
                  color: valueFormat === 'full' ? '#0f172a' : '#64748b',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ₹ Full INR
              </button>
              <button
                type="button"
                onClick={() => setValueFormat('compact')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: valueFormat === 'compact' ? '700' : '600',
                  backgroundColor: valueFormat === 'compact' ? '#ffffff' : 'transparent',
                  color: valueFormat === 'compact' ? '#0f172a' : '#64748b',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ₹ in Lakhs
              </button>
            </div>
          )}

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Export sheet to CSV"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. CLUSTERED COLUMN CHART SVG (Side-by-Side Monthly Bars per Category) */}
      <div style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#fafbfc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '16px 16px 4px 16px',
        boxSizing: 'border-box'
      }}>
        {/* Y-Axis Label / Currency indicator */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '16px',
          fontSize: '11px',
          fontWeight: '700',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>{dataViewMode === 'census' ? 'Headcount / Units' : 'Expenditure (₹ INR)'}</span>
        </div>

        {/* The SVG Visualization */}
        <div style={{ width: '100%', overflowX: 'auto', minHeight: `${chartHeight}px` }}>
          <div style={{ minWidth: `${Math.max(820, currentColumns.length * (periods.length * 16 + 48))}px`, position: 'relative' }}>
            
            {/* SVG Canvas */}
            <svg
              width="100%"
              height={chartHeight}
              viewBox={`0 0 ${Math.max(1000, currentColumns.length * 120)} ${chartHeight}`}
              preserveAspectRatio="none"
              style={{ display: 'block', overflow: 'visible' }}
            >
              <defs>
                {/* Horizontal Grid Pattern */}
                <linearGradient id="barShine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Horizontal Y-Gridlines and Tick Labels */}
              {yTicks.map((tickVal, tIdx) => {
                const yPos = chartPaddingTop + availableBarHeight * (tIdx / (yTicks.length - 1));
                return (
                  <g key={tIdx}>
                    <line
                      x1="60"
                      y1={yPos}
                      x2="98%"
                      y2={yPos}
                      stroke="#e2e8f0"
                      strokeDasharray={tIdx === yTicks.length - 1 ? 'none' : '3 3'}
                      strokeWidth={tIdx === yTicks.length - 1 ? '1.5' : '1'}
                    />
                    <text
                      x="52"
                      y={yPos + 4}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="10.5"
                      fontFamily="Inter, system-ui, sans-serif"
                      fontWeight="600"
                    >
                      {dataViewMode === 'census' ? tickVal.toLocaleString() : (valueFormat === 'compact' ? formatLakhs(tickVal) : Math.round(tickVal).toLocaleString())}
                    </text>
                  </g>
                );
              })}

              {/* Render Clustered Columns */}
              {(() => {
                const leftMargin = 70;
                const rightMargin = 20;
                const totalWidth = Math.max(1000, currentColumns.length * 120);
                const usableWidth = totalWidth - leftMargin - rightMargin;
                const colBandWidth = usableWidth / currentColumns.length;
                const numBars = periods.length || 1;
                const barSpacing = 2;
                const maxClusterWidth = colBandWidth * 0.82;
                const barWidth = Math.min(22, Math.max(8, (maxClusterWidth - (numBars - 1) * barSpacing) / numBars));
                const clusterActualWidth = numBars * barWidth + (numBars - 1) * barSpacing;
                const baselineY = chartPaddingTop + availableBarHeight;

                return currentColumns.map((col, cIdx) => {
                  const clusterCenterX = leftMargin + cIdx * colBandWidth + colBandWidth / 2;
                  const clusterStartX = clusterCenterX - clusterActualWidth / 2;
                  const isColHovered = hoveredColKey === col.key;

                  return (
                    <g key={col.key}>
                      {/* Cluster background hover shading */}
                      <rect
                        x={leftMargin + cIdx * colBandWidth + 4}
                        y={chartPaddingTop}
                        width={colBandWidth - 8}
                        height={availableBarHeight}
                        fill={isColHovered ? 'rgba(79, 70, 229, 0.04)' : 'transparent'}
                        rx="6"
                        style={{ transition: 'fill 0.15s ease' }}
                      />

                      {/* Side-by-side Period Bars in this Cluster */}
                      {gridData.map((row, pIdx) => {
                        const barX = clusterStartX + pIdx * (barWidth + barSpacing);
                        const rawVal = Number(row.values[col.key] || 0);

                        // If percentage, compute height proportional to 100% max
                        let heightPct = 0;
                        if (col.type === 'percentage') {
                          heightPct = Math.min(1, Math.max(0, rawVal / 100));
                        } else {
                          heightPct = Math.min(1, Math.max(0, rawVal / maxValue));
                        }
                        const barH = Math.max(rawVal > 0 ? 3 : 0, heightPct * availableBarHeight);
                        const barY = baselineY - barH;

                        const isPeriodHovered = hoveredPeriodId === row.period_id;
                        const isBarActive = isPeriodHovered || isColHovered;
                        const barColor = row.color;

                        return (
                          <g key={row.period_id}>
                            <rect
                              x={barX}
                              y={barY}
                              width={barWidth}
                              height={barH}
                              fill={barColor}
                              rx={barWidth > 6 ? 2.5 : 1}
                              opacity={hoveredPeriodId && !isPeriodHovered ? 0.35 : 0.95}
                              style={{
                                cursor: 'pointer',
                                transition: 'all 0.12s ease'
                              }}
                              onMouseEnter={(e) => {
                                setHoveredPeriodId(row.period_id);
                                setHoveredColKey(col.key);
                                const rect = e.currentTarget.getBoundingClientRect();
                                setTooltip({
                                  x: rect.left + rect.width / 2,
                                  y: rect.top - 8,
                                  category: col.label,
                                  period: row.period_label,
                                  value: formatVal(rawVal, col.type),
                                  raw: rawVal,
                                  color: barColor
                                });
                              }}
                              onMouseLeave={() => {
                                setHoveredPeriodId(null);
                                setHoveredColKey(null);
                                setTooltip(null);
                              }}
                            />
                            {/* Value label on top of bar if hovered */}
                            {isPeriodHovered && barH > 16 && (
                              <text
                                x={barX + barWidth / 2}
                                y={barY - 5}
                                textAnchor="middle"
                                fill="#0f172a"
                                fontSize="10"
                                fontWeight="800"
                                fontFamily="Inter, system-ui, sans-serif"
                              >
                                {col.type === 'percentage' ? `${Math.round(rawVal)}%` : (rawVal >= 100000 ? formatLakhs(rawVal) : Math.round(rawVal))}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Category Label below X Axis */}
                      <text
                        x={clusterCenterX}
                        y={baselineY + 18}
                        textAnchor="middle"
                        fill={isColHovered ? '#1e293b' : '#475569'}
                        fontSize="11.5"
                        fontWeight={isColHovered ? '800' : '600'}
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {col.short}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>

            {/* Floating Tooltip */}
            {tooltip && (
              <div style={{
                position: 'fixed',
                left: `${tooltip.x}px`,
                top: `${tooltip.y}px`,
                transform: 'translate(-50%, -100%)',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                pointerEvents: 'none',
                zIndex: 99999,
                whiteSpace: 'nowrap',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tooltip.color }} />
                  <span style={{ fontWeight: '800', color: '#f8fafc' }}>{tooltip.period}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {tooltip.category}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8', marginTop: '2px' }}>
                  {tooltip.value}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 3. INTEGRATED DATA TABLE (EXACT EXCEL DESIGN MATCHING USER'S SCREENSHOT) */}
      <div style={{
        width: '100%',
        overflowX: 'auto',
        borderRadius: '10px',
        border: '1.5px solid #cbd5e1',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
          textAlign: 'left',
          backgroundColor: '#ffffff'
        }}>
          {/* Table Header: Category Names (Aligned with Chart Clusters) */}
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{
                padding: '10px 14px',
                fontSize: '11.5px',
                fontWeight: '800',
                color: '#334155',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                minWidth: '160px',
                position: 'sticky',
                left: 0,
                backgroundColor: '#f8fafc',
                zIndex: 2,
                borderRight: '1px solid #e2e8f0'
              }}>
                Billing Period / Cycle
              </th>

              {currentColumns.map(col => {
                const isHovered = hoveredColKey === col.key;
                return (
                  <th
                    key={col.key}
                    onMouseEnter={() => setHoveredColKey(col.key)}
                    onMouseLeave={() => setHoveredColKey(null)}
                    style={{
                      padding: '10px 14px',
                      fontSize: '11.5px',
                      fontWeight: '800',
                      color: isHovered ? '#1d4ed8' : '#334155',
                      textAlign: 'right',
                      backgroundColor: isHovered ? '#eff6ff' : '#f8fafc',
                      borderRight: '1px solid #e2e8f0',
                      minWidth: '115px',
                      whiteSpace: 'nowrap',
                      transition: 'background-color 0.12s ease'
                    }}
                  >
                    {col.label}
                  </th>
                );
              })}

              <th style={{
                padding: '10px 14px',
                fontSize: '11.5px',
                fontWeight: '800',
                color: '#0f172a',
                textAlign: 'right',
                minWidth: '120px',
                backgroundColor: '#f1f5f9'
              }}>
                {dataViewMode === 'census' ? 'Key Total' : 'Period Total (₹)'}
              </th>
            </tr>
          </thead>

          {/* Table Body: One Row Per Period / Month (With matching legend color swatches) */}
          <tbody>
            {gridData.map((row, rIdx) => {
              const isPeriodHovered = hoveredPeriodId === row.period_id;
              const isEven = rIdx % 2 === 0;

              return (
                <tr
                  key={row.period_id}
                  onMouseEnter={() => setHoveredPeriodId(row.period_id)}
                  onMouseLeave={() => setHoveredPeriodId(null)}
                  style={{
                    backgroundColor: isPeriodHovered ? '#f0f7ff' : (isEven ? '#ffffff' : '#fbfcfd'),
                    borderBottom: '1px solid #e2e8f0',
                    transition: 'background-color 0.12s ease'
                  }}
                >
                  {/* Period Label with Color Swatch (Matches user image's table row header) */}
                  <td style={{
                    padding: '8px 14px',
                    fontWeight: '700',
                    color: '#0f172a',
                    position: 'sticky',
                    left: 0,
                    backgroundColor: isPeriodHovered ? '#f0f7ff' : (isEven ? '#ffffff' : '#fbfcfd'),
                    borderRight: '1.5px solid #cbd5e1',
                    zIndex: 2,
                    whiteSpace: 'nowrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '11px',
                        height: '11px',
                        borderRadius: '2.5px',
                        backgroundColor: row.color,
                        flexShrink: 0,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }} />
                      <span style={{ fontSize: '12px' }}>{row.period_label}</span>
                      <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '500' }}>
                        ({row.period.start_date ? row.period.start_date.slice(5) : `${row.operating_days}d`})
                      </span>
                    </div>
                  </td>

                  {/* Cell Values for Each Category Column */}
                  {currentColumns.map(col => {
                    const rawVal = row.values[col.key];
                    const isColHovered = hoveredColKey === col.key;
                    const isCellFocused = isPeriodHovered || isColHovered;

                    return (
                      <td
                        key={col.key}
                        onMouseEnter={() => setHoveredColKey(col.key)}
                        onMouseLeave={() => setHoveredColKey(null)}
                        style={{
                          padding: '8px 14px',
                          textAlign: 'right',
                          fontWeight: '600',
                          color: rawVal === 0 || rawVal === '—' ? '#94a3b8' : '#0f172a',
                          backgroundColor: isCellFocused ? (isPeriodHovered && isColHovered ? '#e0f2fe' : '#f8fafc') : 'transparent',
                          borderRight: '1px solid #f1f5f9',
                          fontVariantNumeric: 'tabular-nums',
                          transition: 'background-color 0.12s ease'
                        }}
                      >
                        {col.type === 'percentage' ? (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: Number(rawVal) >= 90 ? '#ecfdf5' : Number(rawVal) >= 70 ? '#fffbeb' : '#fef2f2',
                            color: Number(rawVal) >= 90 ? '#047857' : Number(rawVal) >= 70 ? '#b45309' : '#b91c1c'
                          }}>
                            {formatVal(rawVal, col.type, col.key)}
                          </span>
                        ) : (
                          formatVal(rawVal, col.type, col.key)
                        )}
                      </td>
                    );
                  })}

                  {/* Period Row Total */}
                  <td style={{
                    padding: '8px 14px',
                    textAlign: 'right',
                    fontWeight: '800',
                    color: '#1e293b',
                    backgroundColor: isPeriodHovered ? '#e2e8f0' : '#f8fafc',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {dataViewMode === 'census' ? Number(row.rowTotal).toLocaleString() : formatINR(row.rowTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Summary Footer: Column Averages / Totals */}
          <tfoot>
            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
              <td style={{
                padding: '10px 14px',
                fontWeight: '800',
                fontSize: '12px',
                color: '#0f172a',
                position: 'sticky',
                left: 0,
                backgroundColor: '#f1f5f9',
                borderRight: '1.5px solid #cbd5e1',
                zIndex: 2
              }}>
                Monthly Average / Total
              </td>

              {currentColumns.map(col => {
                const numPeriods = gridData.length || 1;
                let sum = 0;
                let countNonZero = 0;
                gridData.forEach(r => {
                  const v = Number(r.values[col.key] || 0);
                  sum += v;
                  if (v > 0) countNonZero++;
                });
                const avg = col.type === 'percentage' ? (countNonZero > 0 ? sum / countNonZero : 0) : (sum / numPeriods);

                return (
                  <td
                    key={col.key}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      fontWeight: '800',
                      color: '#0f172a',
                      borderRight: '1px solid #e2e8f0',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {formatVal(avg, col.type)}
                  </td>
                );
              })}

              {/* Grand Total Average */}
              <td style={{
                padding: '10px 14px',
                textAlign: 'right',
                fontWeight: '900',
                color: '#1d4ed8',
                backgroundColor: '#e2e8f0',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {(() => {
                  const sumAll = gridData.reduce((acc, r) => acc + r.rowTotal, 0);
                  const avgAll = gridData.length > 0 ? sumAll / gridData.length : 0;
                  return dataViewMode === 'census' ? Math.round(avgAll).toLocaleString() : formatINR(avgAll);
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 4. BOTTOM LEGEND: Month color keys (Matches user screenshot's multi-color keys) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        padding: '10px 14px',
        backgroundColor: '#fafbfc',
        borderRadius: '8px',
        border: '1px solid #f1f5f9'
      }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Monthly Series:
        </span>
        {gridData.map(r => {
          const isHovered = hoveredPeriodId === r.period_id;
          return (
            <div
              key={r.period_id}
              onMouseEnter={() => setHoveredPeriodId(r.period_id)}
              onMouseLeave={() => setHoveredPeriodId(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                fontWeight: isHovered ? '800' : '600',
                color: isHovered ? '#0f172a' : '#475569',
                backgroundColor: isHovered ? '#f1f5f9' : 'transparent',
                padding: '3px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
            >
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                backgroundColor: r.color,
                boxShadow: isHovered ? '0 0 0 2px rgba(0,0,0,0.2)' : 'none'
              }} />
              <span>{r.period_label}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
