import React, { useState, useEffect, useMemo } from 'react';
import { Zap, Droplets, GlassWater, ArrowRight, X } from 'lucide-react';

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatINR = (val) => {
  const n = num(val);
  return '₹' + Math.round(n).toLocaleString('en-IN');
};

const formatDec = (val, decimals = 2) => num(val).toFixed(decimals);

export default function FoodPowerWaterSection({
  periods = [],
  activePeriod = 'all',
  activePeriodObj = {},
}) {
  const [entriesByPeriod, setEntriesByPeriod] = useState({});
  // null | 'power' | 'normal_water' | 'drinking_water'
  const [activeModalKey, setActiveModalKey] = useState(null);

  const isAllMonths = activePeriod === 'all';
  const periodLabel = isAllMonths ? 'All Months' : (activePeriodObj?.period_label || 'Selected Month');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/food/power-water')
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled && res?.entries) {
          setEntriesByPeriod(res.entries);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activePeriod]);

  const displayPeriods = useMemo(() => {
    if (!isAllMonths) {
      return activePeriodObj?.id ? [activePeriodObj] : [];
    }
    const recorded = periods.filter((p) => {
      const c = entriesByPeriod[String(p.id)];
      if (!c) return false;
      return (
        num(c.power_units) > 0 ||
        num(c.power_cost) > 0 ||
        num(c.normal_water_litres) > 0 ||
        num(c.normal_water_cost) > 0 ||
        num(c.drinking_water_litres) > 0 ||
        num(c.drinking_water_cost) > 0 ||
        num(c.students_staff_count) > 0 ||
        num(c.students_count) > 0
      );
    });
    return recorded.length > 0 ? recorded : periods;
  }, [isAllMonths, activePeriodObj, periods, entriesByPeriod]);

  const getMetrics = (c = {}, days = 30) => {
    const d = Number(days || 30) || 30;
    const pUnits = num(c.power_units);
    const pCost = num(c.power_cost);
    const stStaff = num(c.students_staff_count);
    const nwLtr = num(c.normal_water_litres);
    const nwCost = num(c.normal_water_cost);
    const students = num(c.students_count);
    const dwLtr = num(c.drinking_water_litres);
    const dwCost = num(c.drinking_water_cost);

    return {
      power_units: pUnits,
      power_cost: pCost,
      students_staff_count: stStaff,
      units_per_occupant: stStaff > 0 ? pUnits / stStaff : 0,
      power_cost_occupant: stStaff > 0 ? pCost / stStaff : 0,
      normal_water_litres: nwLtr,
      normal_water_cost: nwCost,
      students_count: students,
      normal_water_ltr_day: students > 0 ? nwLtr / students / d : 0,
      normal_water_cost_day: students > 0 ? nwCost / students / d : 0,
      drinking_water_litres: dwLtr,
      drinking_water_cost: dwCost,
      drinking_water_ltr_day: students > 0 ? dwLtr / students / d : 0,
      drinking_water_cost_day: students > 0 ? dwCost / students / d : 0,
    };
  };

  const summary = useMemo(() => {
    if (!isAllMonths) {
      const pid = String(activePeriodObj?.id || activePeriod || '');
      return getMetrics(entriesByPeriod[pid] || {}, activePeriodObj?.operating_days || 30);
    }

    const list = displayPeriods.map((p) =>
      getMetrics(entriesByPeriod[String(p.id)] || {}, p.operating_days || 30)
    );
    const sum = (k) => list.reduce((s, m) => s + m[k], 0);
    const avgNonZero = (k) => {
      const nz = list.filter((m) => m[k] > 0);
      return nz.length > 0 ? nz.reduce((s, m) => s + m[k], 0) / nz.length : 0;
    };
    const monthsCount = Math.max(1, list.length);

    const pUnits = sum('power_units');
    const pCost = sum('power_cost');
    const nwLtr = sum('normal_water_litres');
    const nwCost = sum('normal_water_cost');
    const dwLtr = sum('drinking_water_litres');
    const dwCost = sum('drinking_water_cost');

    return {
      power_units: pUnits,
      power_cost: pCost,
      students_staff_count: Math.round(avgNonZero('students_staff_count')),
      units_per_occupant: avgNonZero('units_per_occupant'),
      power_cost_occupant: avgNonZero('power_cost_occupant'),
      normal_water_litres: nwLtr,
      normal_water_cost: nwCost,
      students_count: Math.round(avgNonZero('students_count')),
      normal_water_ltr_day: avgNonZero('normal_water_ltr_day'),
      normal_water_cost_day: avgNonZero('normal_water_cost_day'),
      drinking_water_litres: dwLtr,
      drinking_water_cost: dwCost,
      drinking_water_ltr_day: avgNonZero('drinking_water_ltr_day'),
      drinking_water_cost_day: avgNonZero('drinking_water_cost_day'),
      avg_power_units: pUnits / monthsCount,
      avg_power_cost: pCost / monthsCount,
      avg_normal_water_litres: nwLtr / monthsCount,
      avg_normal_water_cost: nwCost / monthsCount,
      avg_drinking_water_litres: dwLtr / monthsCount,
      avg_drinking_water_cost: dwCost / monthsCount,
    };
  }, [isAllMonths, activePeriod, activePeriodObj, displayPeriods, entriesByPeriod]);

  const sections = {
    power: {
      key: 'power',
      title: 'Power Consumption (EB + DG)',
      subtitle: `Kitchen EB + DG Power • ${periodLabel}`,
      primaryVal: `${Math.round(summary.power_units).toLocaleString('en-IN')} kWh`,
      secondaryVal: formatINR(summary.power_cost),
      meta: `${formatDec(summary.units_per_occupant, 1)} kWh/occ • ${formatINR(summary.power_cost_occupant)}/occ`,
      accent: '#2F4BB8',
      bg: '#F8FBFF',
      border: '#C7D7FE',
      badgeBg: '#EAF0FF',
      badgeColor: '#1d4ed8',
      icon: <Zap size={18} color="#2F4BB8" />,
      items: [
        {
          key: 'power_units',
          label: 'Power consumption units(EB + DG) Kitchen',
          fmt: (m) => `${Math.round(m.power_units).toLocaleString('en-IN')} kWh`,
          fmtTotal: (s) => `${Math.round(s.power_units).toLocaleString('en-IN')} kWh`,
          fmtAvg: (s) => `${Math.round(s.avg_power_units).toLocaleString('en-IN')} kWh`,
        },
        {
          key: 'power_cost',
          label: 'Power consumption cost(EB + DG) Kitchen',
          fmt: (m) => formatINR(m.power_cost),
          fmtTotal: (s) => formatINR(s.power_cost),
          fmtAvg: (s) => formatINR(s.avg_power_cost),
        },
        {
          key: 'students_staff_count',
          label: 'No of Students+ Staffs in Hostel',
          fmt: (m) => Math.round(m.students_staff_count).toLocaleString('en-IN'),
          fmtTotal: () => '—',
          fmtAvg: (s) => (s.students_staff_count > 0 ? Math.round(s.students_staff_count).toLocaleString('en-IN') : '—'),
        },
        {
          key: 'units_per_occupant',
          label: 'Units per occupant per month - Food',
          fmt: (m) => `${formatDec(m.units_per_occupant, 2)} kWh`,
          fmtTotal: () => '—',
          fmtAvg: (s) => `${formatDec(s.units_per_occupant, 2)} kWh`,
        },
        {
          key: 'power_cost_occupant',
          label: 'Power cost Per Occupant per month -Food',
          fmt: (m) => `₹ ${formatDec(m.power_cost_occupant, 2)}`,
          fmtTotal: () => '—',
          fmtAvg: (s) => `₹ ${formatDec(s.power_cost_occupant, 2)}`,
        },
      ],
    },
    normal_water: {
      key: 'normal_water',
      title: 'Normal Water Consumption',
      subtitle: `Kitchen Normal Water • ${periodLabel}`,
      primaryVal: `${Math.round(summary.normal_water_litres).toLocaleString('en-IN')} L`,
      secondaryVal: formatINR(summary.normal_water_cost),
      meta: `${formatDec(summary.normal_water_ltr_day, 2)} L/day • ₹${formatDec(summary.normal_water_cost_day, 2)}/day`,
      accent: '#0F6B3A',
      bg: '#F6FCF9',
      border: '#A7F3D0',
      badgeBg: '#E4F6EC',
      badgeColor: '#0F6B3A',
      icon: <Droplets size={18} color="#0F6B3A" />,
      items: [
        {
          key: 'normal_water_litres',
          label: 'Normal Water Consumption Ltr Kitchen',
          fmt: (m) => `${Math.round(m.normal_water_litres).toLocaleString('en-IN')} L`,
          fmtTotal: (s) => `${Math.round(s.normal_water_litres).toLocaleString('en-IN')} L`,
          fmtAvg: (s) => `${Math.round(s.avg_normal_water_litres).toLocaleString('en-IN')} L`,
        },
        {
          key: 'normal_water_cost',
          label: 'Normal Water Consumption Cost Kitchen',
          fmt: (m) => formatINR(m.normal_water_cost),
          fmtTotal: (s) => formatINR(s.normal_water_cost),
          fmtAvg: (s) => formatINR(s.avg_normal_water_cost),
        },
        {
          key: 'students_nw',
          label: 'No of Students + Staff in Hostels',
          fmt: (m) => Math.round(m.students_count).toLocaleString('en-IN'),
          fmtTotal: () => '—',
          fmtAvg: (s) => (s.students_count > 0 ? Math.round(s.students_count).toLocaleString('en-IN') : '—'),
        },
        {
          key: 'normal_water_ltr_day',
          label: 'Ltr per student per day - Food',
          fmt: (m) => `${formatDec(m.normal_water_ltr_day, 2)} L`,
          fmtTotal: () => '—',
          fmtAvg: (s) => `${formatDec(s.normal_water_ltr_day, 2)} L`,
        },
        {
          key: 'normal_water_cost_day',
          label: 'Normal Water cost Per student per day Food',
          fmt: (m) => `₹ ${formatDec(m.normal_water_cost_day, 2)}`,
          fmtTotal: () => '—',
          fmtAvg: (s) => `₹ ${formatDec(s.normal_water_cost_day, 2)}`,
        },
      ],
    },
    drinking_water: {
      key: 'drinking_water',
      title: 'Drinking Water Consumption',
      subtitle: `Kitchen Drinking Water • ${periodLabel}`,
      primaryVal: `${Math.round(summary.drinking_water_litres).toLocaleString('en-IN')} L`,
      secondaryVal: formatINR(summary.drinking_water_cost),
      meta: `${formatDec(summary.drinking_water_ltr_day, 2)} L/day • ₹${formatDec(summary.drinking_water_cost_day, 2)}/day`,
      accent: '#0369a1',
      bg: '#F4FBFF',
      border: '#BAE6FD',
      badgeBg: '#E0F2FE',
      badgeColor: '#0369a1',
      icon: <GlassWater size={18} color="#0369a1" />,
      items: [
        {
          key: 'drinking_water_litres',
          label: 'Drinking Water Consumption Litres Kitchen',
          fmt: (m) => `${Math.round(m.drinking_water_litres).toLocaleString('en-IN')} L`,
          fmtTotal: (s) => `${Math.round(s.drinking_water_litres).toLocaleString('en-IN')} L`,
          fmtAvg: (s) => `${Math.round(s.avg_drinking_water_litres).toLocaleString('en-IN')} L`,
        },
        {
          key: 'drinking_water_cost',
          label: 'Drinking Water Consumption Cost Kitchen',
          fmt: (m) => formatINR(m.drinking_water_cost),
          fmtTotal: (s) => formatINR(s.drinking_water_cost),
          fmtAvg: (s) => formatINR(s.avg_drinking_water_cost),
        },
        {
          key: 'students_dw',
          label: 'No of Students + Staff in Hostels',
          fmt: (m) => Math.round(m.students_count).toLocaleString('en-IN'),
          fmtTotal: () => '—',
          fmtAvg: (s) => (s.students_count > 0 ? Math.round(s.students_count).toLocaleString('en-IN') : '—'),
        },
        {
          key: 'drinking_water_ltr_day',
          label: 'Drinking water Litres per student per day - Kitchen',
          fmt: (m) => `${formatDec(m.drinking_water_ltr_day, 2)} L`,
          fmtTotal: () => '—',
          fmtAvg: (s) => `${formatDec(s.drinking_water_ltr_day, 2)} L`,
        },
        {
          key: 'drinking_water_cost_day',
          label: 'Drinking Water cost Per student per day Kitchen',
          fmt: (m) => `₹ ${formatDec(m.drinking_water_cost_day, 2)}`,
          fmtTotal: () => '—',
          fmtAvg: (s) => `₹ ${formatDec(s.drinking_water_cost_day, 2)}`,
        },
      ],
    },
  };

  const activeSection = activeModalKey ? sections[activeModalKey] : null;

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        width: '100%'
      }}>
        {[sections.power, sections.normal_water, sections.drinking_water].map((sec) => (
          <button
            key={sec.key}
            type="button"
            onClick={() => setActiveModalKey(sec.key)}
            style={{
              backgroundColor: sec.bg,
              borderRadius: '18px',
              border: `1px solid ${sec.border}`,
              borderTop: `4px solid ${sec.accent}`,
              boxShadow: '0 2px 10px rgba(20, 36, 92, 0.04)',
              padding: '18px 20px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
              transition: 'box-shadow 0.2s ease, transform 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 22px rgba(20, 36, 92, 0.10)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(20, 36, 92, 0.04)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: sec.badgeBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {sec.icon}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#14245C' }}>{sec.title}</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: sec.badgeColor }}>{sec.subtitle}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#14245C' }} className="currency-font">
                {sec.primaryVal}
              </span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: sec.accent }} className="currency-font">
                {sec.secondaryVal}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingTop: '10px',
              borderTop: `1px solid ${sec.border}`,
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#475569'
            }}>
              <span>{sec.meta}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: sec.accent, fontWeight: '800' }}>
                {isAllMonths ? 'Month-by-Month' : 'View'} <ArrowRight size={13} />
              </span>
            </div>
          </button>
        ))}
      </div>

      {activeSection && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '18px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #E1E6F2',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
            width: '96vw',
            maxWidth: '1480px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 24px',
              backgroundColor: '#14245C',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800' }}>
                  {activeSection.title}
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                  {isAllMonths ? `Month-by-Month Breakdown (${displayPeriods.length} months)` : `Single Month Breakdown • ${periodLabel}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalKey(null)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                <X size={15} />
                Close
              </button>
            </div>

            <div style={{ overflow: 'auto', padding: '20px 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                    <th style={{ padding: '12px 14px', minWidth: '300px', position: 'sticky', left: 0, backgroundColor: '#1e293b', zIndex: 5, fontSize: '13.5px' }}>
                      Parameter
                    </th>
                    {displayPeriods.map((p) => (
                      <th key={p.id} style={{ padding: '12px 14px', textAlign: 'right', minWidth: '135px', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
                        {p.period_label}
                      </th>
                    ))}
                    {isAllMonths && (
                      <>
                        <th style={{ padding: '12px 14px', textAlign: 'right', minWidth: '140px', whiteSpace: 'nowrap', backgroundColor: '#14245C', color: '#F5A524', fontSize: '13.5px' }}>
                          Total
                        </th>
                        <th style={{ padding: '12px 14px', textAlign: 'right', minWidth: '140px', whiteSpace: 'nowrap', backgroundColor: '#0F6B3A', color: '#ffffff', fontSize: '13.5px' }}>
                          Avg
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {activeSection.items.map((item) => (
                    <tr key={item.key} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1e293b', position: 'sticky', left: 0, backgroundColor: '#ffffff', fontSize: '13.5px' }}>
                        {item.label}
                      </td>
                      {displayPeriods.map((p) => {
                        const m = getMetrics(entriesByPeriod[String(p.id)] || {}, p.operating_days || 30);
                        return (
                          <td key={p.id} style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: '#0f172a', fontSize: '14.5px', whiteSpace: 'nowrap' }} className="currency-font">
                            {item.fmt(m)}
                          </td>
                        );
                      })}
                      {isAllMonths && (
                        <>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: '#14245C', backgroundColor: '#f8fafc', fontSize: '14.5px', whiteSpace: 'nowrap' }} className="currency-font">
                            {item.fmtTotal ? item.fmtTotal(summary) : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: '#0F6B3A', backgroundColor: '#F6FCF9', fontSize: '14.5px', whiteSpace: 'nowrap' }} className="currency-font">
                            {item.fmtAvg ? item.fmtAvg(summary) : '—'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
