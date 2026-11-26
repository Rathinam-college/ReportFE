import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Fuel, Gauge, Sparkles, Bus, Search, Download, ArrowUpDown, 
  Check, ArrowRight, TrendingUp, AlertTriangle, CheckCircle2, SlidersHorizontal,
  LayoutGrid, Table, BarChart2, TrendingDown, Award, Zap, ChevronRight, Activity, Info
} from 'lucide-react';
import { formatINR, formatIndianCompact } from '../../../utils/formatters';

// Authentic multi-month vehicle performance records matching user-provided ledger (Image 3)
const HISTORICAL_VEHICLE_DATA = {
  'TN99 Q 3209': {
    make: 'ASHOK LEYLAND',
    model: 'Oct-18',
    months: [
      { month: "Aug'26", diesel: 381, km: 1475, mileage: 3.9 },
      { month: "Sept'26", diesel: 317, km: 1346, mileage: 4.2 },
      { month: "Oct'26", diesel: 376, km: 1924, mileage: 5.12 }
    ]
  },
  'TN99 Q 4686': {
    make: 'ASHOK LEYLAND',
    model: 'Oct-18',
    months: [
      { month: "Aug'26", diesel: 730, km: 3026, mileage: 4.1 },
      { month: "Sept'26", diesel: 619, km: 2895, mileage: 4.7 },
      { month: "Oct'26", diesel: 564, km: 2796, mileage: 4.96 }
    ]
  },
  'TN99 Q 4696': {
    make: 'ASHOK LEYLAND',
    model: 'Apr-19',
    months: [
      { month: "Aug'26", diesel: 504, km: 2657, mileage: 5.3 },
      { month: "Sept'26", diesel: 529, km: 2612, mileage: 4.9 },
      { month: "Oct'26", diesel: 491, km: 2404, mileage: 4.90 }
    ]
  },
  'TN99 P 2487': {
    make: 'TATA',
    model: 'Apr-19',
    months: [
      { month: "Aug'26", diesel: 325, km: 1722, mileage: 5.3 },
      { month: "Sept'26", diesel: 446, km: 2332, mileage: 5.2 },
      { month: "Oct'26", diesel: 467, km: 2363, mileage: 5.06 }
    ]
  },
  'TN99 S 0255': {
    make: 'SML MAZDA',
    model: 'Mar-19',
    months: [
      { month: "Aug'26", diesel: 232, km: 1181, mileage: 5.1 },
      { month: "Sept'26", diesel: 436, km: 2317, mileage: 5.3 },
      { month: "Oct'26", diesel: 371, km: 2019, mileage: 5.44 }
    ]
  },
  'TN99 S 0271': {
    make: 'SML MAZDA',
    model: 'Jun-19',
    months: [
      { month: "Aug'26", diesel: 337, km: 1793, mileage: 5.3 },
      { month: "Sept'26", diesel: 286, km: 1595, mileage: 5.6 },
      { month: "Oct'26", diesel: 229, km: 1058, mileage: 4.62 }
    ]
  },
  'TN99 S 0216': {
    make: 'SML MAZDA',
    model: 'Apr-19',
    months: [
      { month: "Aug'26", diesel: 145, km: 1120, mileage: 7.72 },
      { month: "Sept'26", diesel: 138, km: 1090, mileage: 7.90 },
      { month: "Oct'26", diesel: 133, km: 1058, mileage: 7.95 }
    ]
  },
  'TN99 S 0261': {
    make: 'SML MAZDA',
    model: 'Apr-19',
    months: [
      { month: "Aug'26", diesel: 32, km: 158, mileage: 4.94 },
      { month: "Sept'26", diesel: 30, km: 150, mileage: 5.00 },
      { month: "Oct'26", diesel: 28, km: 141, mileage: 5.04 }
    ]
  },
  'TN99 S 0281': {
    make: 'SML MAZDA',
    model: 'Apr-19',
    months: [
      { month: "Aug'26", diesel: 210, km: 465, mileage: 2.21 },
      { month: "Sept'26", diesel: 205, km: 450, mileage: 2.20 },
      { month: "Oct'26", diesel: 195, km: 440, mileage: 2.26 }
    ]
  },
  'TN99 S 0240': {
    make: 'SML MAZDA',
    model: 'Apr-19',
    months: [
      { month: "Aug'26", diesel: 300, km: 1780, mileage: 5.93 },
      { month: "Sept'26", diesel: 292, km: 1750, mileage: 5.99 },
      { month: "Oct'26", diesel: 286, km: 1734, mileage: 6.06 }
    ]
  },
  'TN99 S 0250': {
    make: 'SML MAZDA',
    model: 'Apr-19',
    months: [
      { month: "Aug'26", diesel: 198, km: 1020, mileage: 5.15 },
      { month: "Sept'26", diesel: 190, km: 998, mileage: 5.25 },
      { month: "Oct'26", diesel: 187, km: 992, mileage: 5.30 }
    ]
  },
  'TN99 P 2496': {
    make: 'TATA',
    model: 'Apr-19',
    months: [
      { month: "Aug'26", diesel: 670, km: 4180, mileage: 6.24 },
      { month: "Sept'26", diesel: 655, km: 4110, mileage: 6.27 },
      { month: "Oct'26", diesel: 644, km: 4053, mileage: 6.29 }
    ]
  },
  'TN99 X 2669': {
    make: 'SML MAZDA',
    model: 'Sep-22',
    months: [
      { month: "Aug'26", diesel: 310, km: 1610, mileage: 5.19 },
      { month: "Sept'26", diesel: 302, km: 1575, mileage: 5.22 },
      { month: "Oct'26", diesel: 296, km: 1547, mileage: 5.23 }
    ]
  },
  'TN99 X 2253': {
    make: 'ASHOK LEYLAND',
    model: 'Sep-22',
    months: [
      { month: "Aug'26", diesel: 280, km: 1420, mileage: 5.07 },
      { month: "Sept'26", diesel: 275, km: 1400, mileage: 5.09 },
      { month: "Oct'26", diesel: 270, km: 1380, mileage: 5.11 }
    ]
  },
  'TN99 X 5181': {
    make: 'ASHOK LEYLAND',
    model: 'Oct-22',
    months: [
      { month: "Aug'26", diesel: 340, km: 1680, mileage: 4.94 },
      { month: "Sept'26", diesel: 330, km: 1650, mileage: 5.00 },
      { month: "Oct'26", diesel: 325, km: 1630, mileage: 5.02 }
    ]
  },
  'TN99 Z 5467': {
    make: 'SML MAZDA',
    model: 'Jan-24',
    months: [
      { month: "Aug'26", diesel: 260, km: 1250, mileage: 4.81 },
      { month: "Sept'26", diesel: 255, km: 1240, mileage: 4.86 },
      { month: "Oct'26", diesel: 250, km: 1220, mileage: 4.88 }
    ]
  },
  'TN99 Z 5446': {
    make: 'SML MAZDA',
    model: 'Jan-24',
    months: [
      { month: "Aug'26", diesel: 290, km: 1450, mileage: 5.00 },
      { month: "Sept'26", diesel: 285, km: 1435, mileage: 5.04 },
      { month: "Oct'26", diesel: 280, km: 1420, mileage: 5.07 }
    ]
  }
};

export default function TransportVehicleDetailsModal({
  isOpen = false,
  embedded = false,
  isAllMonths = false,
  onClose,
  vehicles = [],
  periods = [],
  initialFocus = 'all', // 'diesel' | 'km' | 'mileage' | 'all'
  activeBranch = 'University',
  activePeriodLabel = "Oct'26",
  summary = {},
  branches = [],
  onBranchChange,
  onJumpToLedger
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [metricFocus, setMetricFocus] = useState(initialFocus || 'all');
  const [sortBy, setSortBy] = useState('display_order');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' (Modern Bento + Side Chart) | 'table' (Flat Spreadsheet)
  const [selectedVehicleNo, setSelectedVehicleNo] = useState(null);
  const [sideChartTab, setSideChartTab] = useState('trend'); // 'trend' | 'ranking' | 'scatter'
  const [liveHistoryByVehicle, setLiveHistoryByVehicle] = useState({});
  const historyCacheRef = React.useRef({});

  const periodsKey = Array.isArray(periods) && periods.length > 0
    ? periods.map(p => `${p.id}:${p.period_label || p.period_code || ''}`).join('|')
    : 'default';

  // Fetch live multi-month vehicle history from /api/transport/vehicles only when All Months is active (with branch cache)
  const displayPeriods = useMemo(() => {
    return Array.isArray(periods) && periods.length > 0
      ? periods
      : [{ id: 35, period_label: "Aug'26" }, { id: 36, period_label: "Sept'26" }, { id: 1026, period_label: "Oct'26" }];
  }, [periodsKey]);

  const showAllMonths = isAllMonths || activePeriodLabel === 'All Months';

  useEffect(() => {
    if ((!isOpen && !embedded) || !activeBranch || !showAllMonths) return;

    const cacheKey = `${activeBranch}__${periodsKey}`;
    if (historyCacheRef.current[cacheKey]) {
      setLiveHistoryByVehicle(historyCacheRef.current[cacheKey]);
      return;
    }

    const controller = new AbortController();
    Promise.all(
      displayPeriods.map((p) =>
        fetch(`/api/transport/vehicles?period_id=${p.id}&branch=${encodeURIComponent(activeBranch)}`, { signal: controller.signal })
          .then((r) => (r.ok ? r.json() : { vehicles: [] }))
          .then((d) => ({ label: p.period_label || p.period_code || String(p.id), list: d?.vehicles || [] }))
          .catch(() => ({ label: p.period_label || p.period_code || String(p.id), list: [] }))
      )
    ).then((results) => {
      if (controller.signal.aborted) return;
      const map = {};
      results.forEach(({ label, list }) => {
        list.forEach((v) => {
          const vNo = v.vehicle_no;
          if (!vNo) return;
          if (!map[vNo]) map[vNo] = {};
          const dVal = Number(v.diesel_litres) || 0;
          const kmVal = Number(v.km_run) || 0;
          const mVal = dVal > 0 ? Number((kmVal / dVal).toFixed(2)) : (Number(v.mileage) || 0);
          const fuelVal = Number(v.fuel_expenses) || 0;
          map[vNo][label] = { month: label, diesel: dVal, km: kmVal, mileage: mVal, fuel: fuelVal };
        });
      });
      historyCacheRef.current[cacheKey] = map;
      setLiveHistoryByVehicle(map);
    });
    return () => controller.abort();
  }, [activeBranch, periodsKey, isOpen, embedded, showAllMonths]);

  // Sync focus metric from props
  useEffect(() => {
    if (initialFocus) {
      setMetricFocus(initialFocus);
    }
  }, [initialFocus, isOpen]);

  // Lock background scroll only when open as a modal (not when embedded inline)
  useEffect(() => {
    if (!embedded && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, embedded]);

  const num = (v, fb = 0) => {
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // Helper to return live multi-month history from PostgreSQL (/api/transport/vehicles)
  const getVehicleHistory = (v) => {
    const vNo = v.vehicle_no || '';
    const vHist = liveHistoryByVehicle[vNo] || {};
    const curD = num(v.diesel_litres, 0);
    const curKm = num(v.km_run, 0);
    const curM = curD > 0 ? Number((curKm / curD).toFixed(2)) : num(v.mileage, 0);
    const curFuel = num(v.fuel_expenses, 0);

    return displayPeriods.map((p, idx) => {
      const lbl = p.period_label || p.period_code || String(p.id);
      if (vHist[lbl]) return vHist[lbl];
      if (idx === displayPeriods.length - 1) {
        return { month: lbl, diesel: Math.round(curD), km: Math.round(curKm), mileage: curM, fuel: curFuel };
      }
      return { month: lbl, diesel: 0, km: 0, mileage: 0, fuel: 0 };
    });
  };

  // Filter and sort vehicles (strictly live DB vehicles, no dummy fallback)
  const processedVehicles = useMemo(() => {
    let list = Array.isArray(vehicles) ? [...vehicles] : [];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(v =>
        (v.vehicle_no && v.vehicle_no.toLowerCase().includes(term)) ||
        (v.make && v.make.toLowerCase().includes(term)) ||
        (v.model && v.model.toLowerCase().includes(term))
      );
    }

    list.sort((a, b) => {
      const aD = num(a.diesel_litres);
      const bD = num(b.diesel_litres);
      const aKm = num(a.km_run);
      const bKm = num(b.km_run);
      const aM = num(a.mileage) || (aD > 0 ? aKm / aD : 0);
      const bM = num(b.mileage) || (bD > 0 ? bKm / bD : 0);
      const aCost = num(a.total_expenses);
      const bCost = num(b.total_expenses);

      if (sortBy === 'diesel_desc') return bD - aD;
      if (sortBy === 'km_desc') return bKm - aKm;
      if (sortBy === 'mileage_desc') return bM - aM;
      if (sortBy === 'mileage_asc') return aM - bM;
      if (sortBy === 'cost_desc') return bCost - aCost;
      return (a.display_order || 0) - (b.display_order || 0);
    });

    return list;
  }, [vehicles, searchTerm, sortBy, activeBranch]);

  // Default selection to first vehicle if none selected
  useEffect(() => {
    if (!selectedVehicleNo && processedVehicles.length > 0) {
      setSelectedVehicleNo(processedVehicles[0].vehicle_no);
    }
  }, [processedVehicles, selectedVehicleNo]);

  // Selected vehicle object
  const activeVehicle = useMemo(() => {
    return processedVehicles.find(v => v.vehicle_no === selectedVehicleNo) || processedVehicles[0] || null;
  }, [processedVehicles, selectedVehicleNo]);

  // Multi-month history for currently active vehicle
  const activeVehicleHistory = useMemo(() => {
    if (!activeVehicle) return [];
    return getVehicleHistory(activeVehicle);
  }, [activeVehicle, liveHistoryByVehicle, displayPeriods]);

  // Aggregate stats (strictly from filtered processedVehicles)
  const totals = useMemo(() => {
    const list = processedVehicles;
    const busCount = list.length || 1;
    const totDiesel = list.reduce((sum, v) => sum + num(v.diesel_litres), 0);
    const totKm = list.reduce((sum, v) => sum + num(v.km_run), 0);
    const totFuel = list.reduce((sum, v) => sum + num(v.fuel_expenses), 0);
    const totExp = list.reduce((sum, v) => sum + num(v.total_expenses), 0);
    const avgMileage = totDiesel > 0 ? (totKm / totDiesel) : 0;

    return {
      count: list.length,
      totDiesel,
      totKm,
      totFuel,
      totExp,
      avgDieselPerBus: busCount > 0 ? (totDiesel / busCount).toFixed(1) : '0.0',
      avgKmPerBus: busCount > 0 ? (totKm / busCount).toFixed(1) : '0.0',
      avgMileage: Number(avgMileage).toFixed(2),
      fuelCostPerKm: totKm > 0 ? (totFuel / totKm).toFixed(2) : '0.00'
    };
  }, [processedVehicles]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      '#', 'Branch', 'Vehicle No', 'Make', 'Model', 
      'Diesel Litres (L)', 'KM Run (KM)', 'Mileage (km/L)', 
      'Fuel Cost (Rs)', 'Repair & Maint (Rs)', 'Total Expenses (Rs)'
    ];

    const rows = processedVehicles.map((v, i) => [
      i + 1,
      `"${v.branch || activeBranch}"`,
      `"${v.vehicle_no || ''}"`,
      `"${v.make || ''}"`,
      `"${v.model || ''}"`,
      num(v.diesel_litres).toFixed(1),
      num(v.km_run).toFixed(1),
      num(v.mileage).toFixed(2),
      num(v.fuel_expenses).toFixed(2),
      num(v.repair_maintenance).toFixed(2),
      num(v.total_expenses).toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vehicle_Performance_Ledger_${activeBranch}_${activePeriodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!embedded && !isOpen) return null;

  const contentNode = (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: embedded ? '18px' : '24px',
      width: '100%',
      maxWidth: embedded ? '100%' : '1360px',
      maxHeight: embedded ? 'none' : '94vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: embedded ? '0 4px 18px rgba(15, 23, 42, 0.05)' : '0 25px 60px -15px rgba(15, 23, 42, 0.45)',
      border: '1.5px solid #cbd5e1',
      overflow: 'hidden',
      marginTop: embedded ? '16px' : 0
    }}>
        
        {/* 1. MODAL HEADER */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1.5px solid #e2e8f0',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Title & Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              flexShrink: 0
            }}>
              🚌
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  {activeBranch} Vehicle Fleet Operational Analytics
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd'
                }}>
                  {totals.count} Active Buses
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0'
                }}>
                  Cycle: {activePeriodLabel}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Vehicle-by-vehicle Diesel consumption, KM run, and Mileage efficiency tracking (Aug'26 → Oct'26)
              </p>
            </div>
          </div>

          {/* Header Controls (Close) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

            {!embedded && onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <X size={18} />
            </button>
            )}
          </div>
        </div>

        {/* 2. TOP EXECUTIVE METRIC STRIP (DIESEL, KM, MILEAGE SUMMARY) */}
        <div style={{
          padding: '14px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1.5px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px'
        }}>
          {/* KPI 1: Diesel Consumption */}
          <div 
            onClick={() => setMetricFocus(metricFocus === 'diesel' ? 'all' : 'diesel')}
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              backgroundColor: metricFocus === 'diesel' ? '#fffbeb' : '#fafbfc',
              border: metricFocus === 'diesel' ? '2px solid #f59e0b' : '1.5px solid #fed7aa',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: metricFocus === 'diesel' ? '0 4px 14px rgba(245, 158, 11, 0.15)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Fuel size={15} color="#d97706" />
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase' }}>
                  Total Diesel Consumed
                </span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#92400e' }}>
                Fuel Volume
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
              {totals.totDiesel.toLocaleString('en-IN', { maximumFractionDigits: 1 })}{' '}
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#d97706' }}>Litres</span>
            </div>
            <div style={{ fontSize: '11px', color: '#78350f', fontWeight: '700' }}>
              Avg: <strong>~{totals.avgDieselPerBus} L / bus</strong> • Fuel Spend: <strong>₹{formatIndianCompact(totals.totFuel)}</strong>
            </div>
          </div>

          {/* KPI 2: KM Run */}
          <div 
            onClick={() => setMetricFocus(metricFocus === 'km' ? 'all' : 'km')}
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              backgroundColor: metricFocus === 'km' ? '#f0f9ff' : '#fafbfc',
              border: metricFocus === 'km' ? '2px solid #0284c7' : '1.5px solid #bfdbfe',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: metricFocus === 'km' ? '0 4px 14px rgba(2, 132, 199, 0.15)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Gauge size={15} color="#0284c7" />
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase' }}>
                  Total KM Run ({activePeriodLabel})
                </span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#075985' }}>
                Fleet Distance
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
              {totals.totKm.toLocaleString('en-IN', { maximumFractionDigits: 1 })}{' '}
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0284c7' }}>KM</span>
            </div>
            <div style={{ fontSize: '11px', color: '#0c4a6e', fontWeight: '700' }}>
              Avg: <strong>~{totals.avgKmPerBus} KM / bus</strong> • Active Fleet: <strong>{totals.count} buses</strong>
            </div>
          </div>

          {/* KPI 3: Fleet Mileage */}
          <div 
            onClick={() => setMetricFocus(metricFocus === 'mileage' ? 'all' : 'mileage')}
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              backgroundColor: metricFocus === 'mileage' ? '#ecfdf5' : '#fafbfc',
              border: metricFocus === 'mileage' ? '2px solid #10b981' : '1.5px solid #a7f3d0',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: metricFocus === 'mileage' ? '0 4px 14px rgba(16, 185, 129, 0.15)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={15} color="#059669" />
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#065f46', textTransform: 'uppercase' }}>
                  {activePeriodLabel} Fleet Mileage
                </span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#d1fae5', color: '#065f46' }}>
                Efficiency
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669' }}>
              {totals.avgMileage}{' '}
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#047857' }}>km/L</span>
            </div>
            <div style={{ fontSize: '11px', color: '#065f46', fontWeight: '700' }}>
              Fleet Running Cost: <strong>₹{totals.fuelCostPerKm} / km</strong> (Target: ≥ 4.0 km/L)
            </div>
          </div>
        </div>

        {/* 3. MAIN CONTENT AREA: 3-ROW-PER-VEHICLE TABLE */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1,
          overflow: 'hidden',
          backgroundColor: '#f8fafc'
          }}>
            {/* LEFT COLUMN: 3-ROW-PER-VEHICLE TABLE (MATCHING EXCEL DESIGN) */}
            <div style={{
              flex: '1.6',
              minWidth: '520px',
              overflow: 'auto',
              padding: '16px 20px',
              borderRight: '1.5px solid #e2e8f0',
              backgroundColor: '#ffffff'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1.5px solid #94a3b8' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr style={{ backgroundColor: 'var(--primary, #14245C)', color: '#ffffff', fontWeight: '800' }}>
                    <th style={{ padding: '11px 12px', border: '1px solid rgba(255,255,255,0.14)', textAlign: 'center', minWidth: '140px' }}>
                      Vehicle No
                    </th>
                    <th style={{ padding: '11px 12px', border: '1px solid rgba(255,255,255,0.14)', textAlign: 'right', minWidth: '100px' }}>
                      Metric
                    </th>
                    {(isAllMonths || activePeriodLabel === 'All Months') ? (
                      <>
                        {displayPeriods.map((p, pIdx) => {
                          const isLast = pIdx === displayPeriods.length - 1;
                          return (
                            <th
                              key={p.id || p.period_label || pIdx}
                              style={{
                                padding: '11px 10px',
                                border: '1px solid rgba(255,255,255,0.14)',
                                textAlign: 'right',
                                backgroundColor: isLast ? '#1e3a8a' : 'transparent',
                                color: isLast ? 'var(--accent, #F5A524)' : '#cbd5e1'
                              }}
                            >
                              {p.period_label || p.period_code}
                            </th>
                          );
                        })}
                        <th style={{ padding: '11px 10px', border: '1px solid rgba(255,255,255,0.14)', textAlign: 'right', backgroundColor: '#0f1c49', color: '#6ee7b7' }}>Total</th>
                      </>
                    ) : (
                      <>
                        <th style={{ padding: '11px 12px', border: '1px solid rgba(255,255,255,0.14)', textAlign: 'right', backgroundColor: '#1e3a8a', color: 'var(--accent, #F5A524)' }}>
                          {activePeriodLabel}
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {processedVehicles.map((veh, vIdx) => {
                    const isSelected = activeVehicle?.vehicle_no === veh.vehicle_no;
                    const hist = getVehicleHistory(veh);
                    const showAll = isAllMonths || activePeriodLabel === 'All Months';
                    const selIdx = !showAll
                      ? displayPeriods.findIndex(p => (p.period_label || p.period_code) === activePeriodLabel)
                      : -1;
                    const prevM = (!showAll && selIdx > 0)
                      ? (hist[selIdx - 1] || { diesel: 0, km: 0, mileage: 0 })
                      : (showAll && hist.length >= 2 ? hist[hist.length - 2] : { diesel: 0, km: 0, mileage: 0 });
                    const curM = hist.length >= 1 ? hist[hist.length - 1] : { diesel: num(veh.diesel_litres), km: num(veh.km_run), mileage: num(veh.mileage) };

                    const vD = num(veh.diesel_litres);
                    const vKm = num(veh.km_run);
                    const vM = veh.mileage ? Number(veh.mileage) : (vD > 0 ? Number((vKm / vD).toFixed(2)) : 0);
                    const vFuel = num(veh.fuel_expenses);

                    const curDVal = showAll ? num(curM.diesel) : vD;
                    const curKmVal = showAll ? num(curM.km) : vKm;
                    const curMVal = showAll ? num(curM.mileage) : vM;

                    const diffD = Number((curDVal - num(prevM.diesel)).toFixed(1));
                    const diffKm = Number((curKmVal - num(prevM.km)).toFixed(1));
                    const diffM = Number((curMVal - num(prevM.mileage)).toFixed(2));

                    const totD = hist.reduce((s, m) => s + num(m.diesel), 0);
                    const totKm = hist.reduce((s, m) => s + num(m.km), 0);
                    const totFuel = hist.reduce((s, m) => s + num(m.fuel), 0);
                    const avgM = totD > 0 ? Number((totKm / totD).toFixed(2)) : 0;

                    const rowBg = isSelected ? '#eff6ff' : (vIdx % 2 === 0 ? '#ffffff' : '#fafbfc');

                    return (
                      <React.Fragment key={veh.id || veh.vehicle_no}>
                        {/* Row 1: Diesel (L) */}
                        <tr
                          onClick={() => setSelectedVehicleNo(veh.vehicle_no)}
                          style={{ backgroundColor: rowBg, cursor: 'pointer' }}
                        >
                          <td
                            rowSpan={4}
                            style={{
                              padding: '10px 12px',
                              border: '1px solid #94a3b8',
                              borderBottom: '2px solid #64748b',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontWeight: '800',
                              fontSize: '13.5px',
                              color: isSelected ? '#0284c7' : '#0f172a',
                              backgroundColor: isSelected ? '#e0f2fe' : '#f8fafc',
                              fontFamily: 'monospace'
                            }}
                          >
                            <div>{veh.vehicle_no}</div>
                            <div style={{ fontSize: '10px', fontWeight: '600', color: '#64748b', fontFamily: 'sans-serif', marginTop: '2px' }}>
                              {veh.make}{veh.model ? ` • ${veh.model}` : ''}
                            </div>
                          </td>
                          <td style={{ padding: '7px 12px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                            Diesel (L)
                          </td>
                          {showAll ? (
                            <>
                              {hist.map((m, mIdx) => {
                                const isLast = mIdx === hist.length - 1;
                                return (
                                  <td key={m.month || mIdx} style={{ padding: '7px 10px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: isLast ? '700' : '400', color: isLast ? '#1e3a8a' : '#475569' }}>
                                    {num(m.diesel).toLocaleString('en-IN')}
                                  </td>
                                );
                              })}
                              <td style={{ padding: '7px 10px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: '800', color: '#065f46', backgroundColor: '#f0fdf4' }}>{totD.toLocaleString('en-IN')} L</td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '7px 12px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                                {vD.toLocaleString('en-IN', { maximumFractionDigits: 1 })} L
                              </td>
                            </>
                          )}
                        </tr>

                        {/* Row 2: KM Run */}
                        <tr
                          onClick={() => setSelectedVehicleNo(veh.vehicle_no)}
                          style={{ backgroundColor: rowBg, cursor: 'pointer' }}
                        >
                          <td style={{ padding: '7px 12px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                            KM Run
                          </td>
                          {showAll ? (
                            <>
                              {hist.map((m, mIdx) => {
                                const isLast = mIdx === hist.length - 1;
                                return (
                                  <td key={m.month || mIdx} style={{ padding: '7px 10px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: isLast ? '700' : '400', color: isLast ? '#1e3a8a' : '#475569' }}>
                                    {num(m.km).toLocaleString('en-IN')}
                                  </td>
                                );
                              })}
                              <td style={{ padding: '7px 10px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: '800', color: '#065f46', backgroundColor: '#f0fdf4' }}>{totKm.toLocaleString('en-IN')}</td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '7px 12px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                                {vKm.toLocaleString('en-IN', { maximumFractionDigits: 1 })} KM
                              </td>
                            </>
                          )}
                        </tr>

                        {/* Row 3: Mileage */}
                        <tr
                          onClick={() => setSelectedVehicleNo(veh.vehicle_no)}
                          style={{ backgroundColor: rowBg, cursor: 'pointer' }}
                        >
                          <td style={{ padding: '7px 12px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                            Mileage
                          </td>
                          {showAll ? (
                            <>
                              {hist.map((m, mIdx) => {
                                const isLast = mIdx === hist.length - 1;
                                return (
                                  <td key={m.month || mIdx} style={{ padding: '7px 10px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: isLast ? '800' : '400', color: isLast ? '#059669' : '#475569' }}>
                                    {num(m.mileage).toFixed(2)}
                                  </td>
                                );
                              })}
                              <td style={{ padding: '7px 10px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: '900', color: '#065f46', backgroundColor: '#f0fdf4' }}>{avgM.toFixed(2)} km/L</td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '7px 12px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: '800', color: '#059669' }}>
                                {vM.toFixed(2)} km/L
                              </td>
                            </>
                          )}
                        </tr>

                        {/* Row 4: Fuel Expenses */}
                        <tr
                          onClick={() => setSelectedVehicleNo(veh.vehicle_no)}
                          style={{ backgroundColor: rowBg, cursor: 'pointer', borderBottom: '2px solid #64748b' }}
                        >
                          <td style={{ padding: '7px 12px', border: '1px solid #cbd5e1', borderBottom: '2px solid #64748b', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                            Fuel Expenses
                          </td>
                          {showAll ? (
                            <>
                              {hist.map((m, mIdx) => {
                                const isLast = mIdx === hist.length - 1;
                                return (
                                  <td key={m.month || mIdx} style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderBottom: '2px solid #64748b', textAlign: 'right', fontWeight: isLast ? '700' : '400', color: isLast ? '#1e3a8a' : '#475569' }}>
                                    {formatINR(num(m.fuel))}
                                  </td>
                                );
                              })}
                              <td style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderBottom: '2px solid #64748b', textAlign: 'right', fontWeight: '800', color: '#065f46', backgroundColor: '#f0fdf4' }}>{formatINR(totFuel)}</td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '7px 12px', border: '1px solid #cbd5e1', borderBottom: '2px solid #64748b', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                                {formatINR(vFuel)}
                              </td>
                            </>
                          )}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

      </div>
  );

  if (embedded) {
    return contentNode;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      {contentNode}
    </div>
  );
}
