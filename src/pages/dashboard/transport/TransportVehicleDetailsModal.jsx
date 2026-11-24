import React, { useState, useMemo } from 'react';
import { 
  X, Fuel, Gauge, Sparkles, Bus, Search, Download, ArrowUpDown, 
  Check, ArrowRight, TrendingUp, AlertTriangle, CheckCircle2, SlidersHorizontal 
} from 'lucide-react';
import { formatINR, formatLakhs, formatIndianCompact } from '../../../utils/formatters';

export default function TransportVehicleDetailsModal({
  isOpen,
  onClose,
  vehicles = [],
  initialFocus = 'all', // 'diesel' | 'km' | 'mileage' | 'all'
  activeBranch = 'Common',
  activePeriodLabel = "Oct'26",
  summary = {},
  branches = [],
  onBranchChange,
  onJumpToLedger
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [metricFocus, setMetricFocus] = useState(initialFocus || 'all');
  const [sortBy, setSortBy] = useState('display_order'); // 'display_order' | 'diesel_desc' | 'km_desc' | 'mileage_desc' | 'mileage_asc' | 'cost_desc'

  // Update metricFocus if initialFocus changes when opening
  React.useEffect(() => {
    if (initialFocus) {
      setMetricFocus(initialFocus);
    }
  }, [initialFocus, isOpen]);

  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const num = (v) => Number(v) || 0;

  // Filter and sort vehicles
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
      if (sortBy === 'diesel_desc') return num(b.diesel_litres) - num(a.diesel_litres);
      if (sortBy === 'km_desc') return num(b.km_run) - num(a.km_run);
      if (sortBy === 'mileage_desc') return num(b.mileage) - num(a.mileage);
      if (sortBy === 'mileage_asc') return num(a.mileage) - num(b.mileage);
      if (sortBy === 'cost_desc') return num(b.total_expenses) - num(a.total_expenses);
      return (a.display_order || 0) - (b.display_order || 0);
    });

    return list;
  }, [vehicles, searchTerm, sortBy]);

  // Aggregate stats
  const totals = useMemo(() => {
    const list = Array.isArray(vehicles) ? vehicles : [];
    const busCount = list.length || 1;
    const totDiesel = list.reduce((sum, v) => sum + num(v.diesel_litres), 0);
    const totKm = list.reduce((sum, v) => sum + num(v.km_run), 0);
    const totFuel = list.reduce((sum, v) => sum + num(v.fuel_expenses), 0);
    const totExp = list.reduce((sum, v) => sum + num(v.total_expenses), 0);
    const avgMileage = totDiesel > 0 ? (totKm / totDiesel) : (num(summary?.mileage) || 0);

    return {
      count: list.length,
      totDiesel: summary?.diesel_litres ? num(summary.diesel_litres) : totDiesel,
      totKm: summary?.km_run ? num(summary.km_run) : totKm,
      totFuel: summary?.fuel_expenses ? num(summary.fuel_expenses) : totFuel,
      totExp: summary?.total_expenses ? num(summary.total_expenses) : totExp,
      avgDieselPerBus: busCount > 0 ? (totDiesel / busCount).toFixed(1) : '0',
      avgKmPerBus: busCount > 0 ? (totKm / busCount).toFixed(1) : '0',
      avgMileage: avgMileage > 0 ? avgMileage.toFixed(2) : '4.00',
      fuelCostPerKm: totKm > 0 ? (totFuel / totKm).toFixed(2) : '0.00'
    };
  }, [vehicles, summary]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      '#', 'Branch', 'Vehicle No', 'Make', 'Model', 
      'Diesel Litres (L)', 'KM Run (KM)', 'Mileage (km/L)', 
      'Fuel Cost (₹)', 'Repair & Maint (₹)', 'Total Expenses (₹)'
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
    link.setAttribute('download', `Vehicle_Operational_Ledger_${activeBranch}_${activePeriodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Only return null after all hooks have been unconditionally registered
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '1240px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
        border: '1.5px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* 1. Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1.5px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.2)'
            }}>
              🚌
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {activeBranch} Vehicle Fleet Operational Details
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 9px',
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
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1'
                }}>
                  Cycle: {activePeriodLabel}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Connected to live PostgreSQL table <code style={{ backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '4px' }}>transport_vehicle_entries</code>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onJumpToLedger && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onJumpToLedger();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#0284c7',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <span>Edit in Ledger</span>
                <ArrowRight size={13} />
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#475569',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
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
          </div>
        </div>

        {/* 2. Top Summary & Averages Banner */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px'
        }}>
          {/* Metric 1: Diesel Consumption */}
          <div 
            onClick={() => setMetricFocus('diesel')}
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: metricFocus === 'diesel' ? '#fffbeb' : '#fafbfc',
              border: metricFocus === 'diesel' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Fuel size={16} color="#d97706" />
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase' }}>
                  Total Diesel Consumed
                </span>
              </div>
              <span style={{
                fontSize: '10.5px',
                fontWeight: '800',
                padding: '1px 6px',
                borderRadius: '6px',
                backgroundColor: '#fef3c7',
                color: '#92400e'
              }}>
                Diesel Cons
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
              {totals.totDiesel.toLocaleString('en-IN', { maximumFractionDigits: 1 })} <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>Litres</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#78350f', fontWeight: '700' }}>
              Fleet Average: <strong>~{totals.avgDieselPerBus} L / bus</strong> ({totals.count} vehicles)
            </div>
          </div>

          {/* Metric 2: KM Run */}
          <div 
            onClick={() => setMetricFocus('km')}
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: metricFocus === 'km' ? '#f0f9ff' : '#fafbfc',
              border: metricFocus === 'km' ? '2px solid #0284c7' : '1px solid #e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Gauge size={16} color="#0284c7" />
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase' }}>
                  Total KM Run ({activePeriodLabel})
                </span>
              </div>
              <span style={{
                fontSize: '10.5px',
                fontWeight: '800',
                padding: '1px 6px',
                borderRadius: '6px',
                backgroundColor: '#e0f2fe',
                color: '#075985'
              }}>
                Distance
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
              {totals.totKm.toLocaleString('en-IN', { maximumFractionDigits: 1 })} <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>KM</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#0c4a6e', fontWeight: '700' }}>
              Fleet Average: <strong>~{totals.avgKmPerBus} KM / bus</strong> ({totals.count} vehicles)
            </div>
          </div>

          {/* Metric 3: Fleet Mileage */}
          <div 
            onClick={() => setMetricFocus('mileage')}
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: metricFocus === 'mileage' ? '#ecfdf5' : '#fafbfc',
              border: metricFocus === 'mileage' ? '2px solid #10b981' : '1px solid #e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="#059669" />
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#065f46', textTransform: 'uppercase' }}>
                  {activePeriodLabel} Fleet Mileage
                </span>
              </div>
              <span style={{
                fontSize: '10.5px',
                fontWeight: '800',
                padding: '1px 6px',
                borderRadius: '6px',
                backgroundColor: '#d1fae5',
                color: '#065f46'
              }}>
                Fuel Efficiency
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669' }}>
              {totals.avgMileage} <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>km/L</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#065f46', fontWeight: '700' }}>
              Fleet Running Cost: <strong>₹{totals.fuelCostPerKm} / km</strong> (Optimal: ≥ 4.0 km/L)
            </div>
          </div>
        </div>

        {/* 3. Toolbar (Focus Tabs, Search, Sorting) */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* Focus Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b' }}>Focus Metric:</span>
            {[
              { id: 'all', label: 'All Columns', icon: SlidersHorizontal },
              { id: 'diesel', label: 'Diesel Litres', icon: Fuel },
              { id: 'km', label: 'KM Run', icon: Gauge },
              { id: 'mileage', label: 'Mileage (km/L)', icon: Sparkles }
            ].map(tab => {
              const isSel = metricFocus === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMetricFocus(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: isSel ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                    backgroundColor: isSel ? '#0284c7' : '#ffffff',
                    color: isSel ? '#ffffff' : '#475569',
                    fontSize: '11.5px',
                    fontWeight: isSel ? '800' : '600',
                    cursor: 'pointer'
                  }}
                >
                  <TabIcon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search bus no or make..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '5px 12px 5px 30px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  width: '180px'
                }}
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontWeight: '600',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="display_order">Sort: Default Order</option>
              <option value="diesel_desc">Sort: Highest Diesel Consumed</option>
              <option value="km_desc">Sort: Highest KM Run</option>
              <option value="mileage_desc">Sort: Highest Mileage (Best)</option>
              <option value="mileage_asc">Sort: Lowest Mileage</option>
              <option value="cost_desc">Sort: Highest Total Cost</option>
            </select>
          </div>
        </div>

        {/* 4. Table Content (Scrollable) */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px 20px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10 }}>
              <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                <th style={{ padding: '12px 10px', width: '45px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '12px 12px', minWidth: '150px' }}>Vehicle / Bus No</th>
                <th style={{ padding: '12px 12px', minWidth: '130px' }}>Make & Model</th>
                <th style={{
                  padding: '12px 12px',
                  textAlign: 'right',
                  backgroundColor: metricFocus === 'diesel' ? '#fef3c7' : 'transparent',
                  color: metricFocus === 'diesel' ? '#92400e' : '#334155',
                  fontWeight: '800',
                  minWidth: '130px'
                }}>
                  Diesel Consumed (L)
                </th>
                <th style={{
                  padding: '12px 12px',
                  textAlign: 'right',
                  backgroundColor: metricFocus === 'km' ? '#e0f2fe' : 'transparent',
                  color: metricFocus === 'km' ? '#075985' : '#334155',
                  fontWeight: '800',
                  minWidth: '120px'
                }}>
                  KM Run (KM)
                </th>
                <th style={{
                  padding: '12px 12px',
                  textAlign: 'center',
                  backgroundColor: metricFocus === 'mileage' ? '#d1fae5' : 'transparent',
                  color: metricFocus === 'mileage' ? '#065f46' : '#334155',
                  fontWeight: '800',
                  minWidth: '130px'
                }}>
                  Mileage (km/L)
                </th>
                <th style={{ padding: '12px 12px', textAlign: 'right', minWidth: '110px' }}>Fuel Cost (₹)</th>
                <th style={{ padding: '12px 12px', textAlign: 'right', minWidth: '110px' }}>Total Cost (₹)</th>
                <th style={{ padding: '12px 12px', textAlign: 'center', minWidth: '120px' }}>Efficiency Status</th>
              </tr>
            </thead>
            <tbody>
              {processedVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    No vehicles found matching "{searchTerm}" in {activeBranch}.
                  </td>
                </tr>
              ) : (
                processedVehicles.map((veh, idx) => {
                  const dL = num(veh.diesel_litres);
                  const km = num(veh.km_run);
                  const mil = num(veh.mileage || (dL > 0 ? (km / dL).toFixed(2) : 0));
                  const fuelCost = num(veh.fuel_expenses);
                  const totExp = num(veh.total_expenses);
                  const isOptimal = mil >= 4.0;
                  const isModerate = mil >= 3.5 && mil < 4.0;

                  return (
                    <tr
                      key={veh.id || veh.vehicle_no || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafbfc',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fafbfc'}
                    >
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: '#94a3b8' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#eff6ff',
                            color: '#0284c7',
                            fontWeight: '800',
                            fontSize: '11.5px',
                            border: '1px solid #bfdbfe'
                          }}>
                            {veh.vehicle_no}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: '600', color: '#475569' }}>
                        {veh.make} {veh.model}
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        textAlign: 'right',
                        fontWeight: '800',
                        color: metricFocus === 'diesel' ? '#b45309' : '#0f172a',
                        backgroundColor: metricFocus === 'diesel' ? '#fffbeb' : 'transparent'
                      }}>
                        {dL.toLocaleString('en-IN', { maximumFractionDigits: 1 })} L
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        textAlign: 'right',
                        fontWeight: '800',
                        color: metricFocus === 'km' ? '#0284c7' : '#0f172a',
                        backgroundColor: metricFocus === 'km' ? '#f0f9ff' : 'transparent'
                      }}>
                        {km.toLocaleString('en-IN', { maximumFractionDigits: 1 })} KM
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        backgroundColor: metricFocus === 'mileage' ? '#ecfdf5' : 'transparent'
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          backgroundColor: isOptimal ? '#dcfce7' : isModerate ? '#e0f2fe' : '#fee2e2',
                          color: isOptimal ? '#166534' : isModerate ? '#0369a1' : '#991b1b',
                          border: `1px solid ${isOptimal ? '#86efac' : isModerate ? '#7dd3fc' : '#fca5a5'}`
                        }}>
                          {mil.toFixed(2)} km/L
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }} className="currency-font">
                        {formatINR(fuelCost)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#0f172a' }} className="currency-font">
                        {formatINR(totExp)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: isOptimal ? '#f0fdf4' : '#fffbeb',
                          color: isOptimal ? '#16a34a' : '#d97706',
                          border: `1px solid ${isOptimal ? '#bbf7d0' : '#fde68a'}`
                        }}>
                          {isOptimal ? 'Optimal' : isModerate ? 'Moderate' : 'Under Review'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              {/* Fleet Totals Row */}
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: '800', color: '#0f172a' }}>
                <td style={{ padding: '12px 10px', textAlign: 'center', color: '#0284c7' }}>Σ</td>
                <td style={{ padding: '12px 12px' }}>Fleet Total ({totals.count} Vehicles)</td>
                <td style={{ padding: '12px 12px', color: '#64748b' }}>Combined</td>
                <td style={{ padding: '12px 12px', textAlign: 'right', color: '#b45309' }}>
                  {totals.totDiesel.toLocaleString('en-IN', { maximumFractionDigits: 1 })} L
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'right', color: '#0284c7' }}>
                  {totals.totKm.toLocaleString('en-IN', { maximumFractionDigits: 1 })} KM
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'center', color: '#059669' }}>
                  {totals.avgMileage} km/L
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'right' }} className="currency-font">
                  {formatINR(totals.totFuel)}
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'right' }} className="currency-font">
                  {formatINR(totals.totExp)}
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#059669' }}>Fleet Verified</span>
                </td>
              </tr>
              {/* Fleet Averages Row */}
              <tr style={{ backgroundColor: '#eff6ff', borderTop: '1px solid #bfdbfe', fontWeight: '800', color: '#1e3a8a' }}>
                <td style={{ padding: '10px', textAlign: 'center' }}>⌀</td>
                <td style={{ padding: '10px 12px' }}>Fleet Average Per Bus</td>
                <td style={{ padding: '10px 12px', color: '#3b82f6' }}>Per Vehicle</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#b45309' }}>
                  ~{totals.avgDieselPerBus} L / bus
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0284c7' }}>
                  ~{totals.avgKmPerBus} KM / bus
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#059669' }}>
                  {totals.avgMileage} km/L
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }} className="currency-font">
                  {formatINR(totals.count > 0 ? totals.totFuel / totals.count : 0)} / bus
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }} className="currency-font">
                  {formatINR(totals.count > 0 ? totals.totExp / totals.count : 0)} / bus
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#0284c7' }}>
                  Avg Benchmarked
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
