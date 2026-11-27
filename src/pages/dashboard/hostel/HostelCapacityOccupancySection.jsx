import React, { useState, useMemo } from 'react';
import { 
  Building2, BedDouble, Users, UserCheck, ShieldCheck, ArrowRight,
  TrendingUp, Award, CheckCircle2, AlertCircle, Info, Filter
} from 'lucide-react';
import { formatPeriodLabel } from '../../../utils/formatters';

export default function HostelCapacityOccupancySection({
  census = {},
  prevCensus = {},
  allCensusMap = {},
  periods = [],
  activePeriodId = null,
  onPeriodSelect,
  movementFilter: propMovementFilter,
  onMovementFilterChange,
  hideMovementFilter = false
}) {
  const [internalMovementFilter, setInternalMovementFilter] = useState('all'); // 'all' | 'boys' | 'girls' | 'school' | 'college' | 'sports' | 'staff'
  const movementFilter = propMovementFilter !== undefined ? propMovementFilter : internalMovementFilter;
  const setMovementFilter = onMovementFilterChange || setInternalMovementFilter;

  const isAllMonths = activePeriodId === 'all';

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // --- 1. BOYS HOSTEL METRICS ---
  const boysBedCap = num(census.bed_capacity_boys, 0);
  const boysStudents = num(census.students_boys, 0);
  const boysStaff = num(census.staff_boys, 0);
  const boysOccupied = num(census.total_occupied_boys, boysStudents + boysStaff);
  const boysVacant = boysBedCap > 0 ? (boysBedCap - boysOccupied) : num(census.vacant_boys, 0);
  const boysOccPct = boysBedCap > 0 ? ((boysOccupied / boysBedCap) * 100).toFixed(1) : (boysOccupied > 0 ? '100.0' : '0.0');
  const boysVacPct = boysBedCap > 0 ? ((boysVacant / boysBedCap) * 100).toFixed(1) : '0.0';

  // Sub-breakdowns for Boys
  const boysCollege = Math.max(0, boysStudents - num(census.vacant_school_boys, 0) - num(census.vacant_sports_boys, 0));
  const boysSchool = num(census.vacant_school_boys, 0);
  const boysSports = num(census.vacant_sports_boys, 0);

  // --- 2. GIRLS HOSTEL METRICS ---
  const girlsBedCap = num(census.bed_capacity_girls, 0);
  const girlsStudents = num(census.students_girls, 0);
  const girlsStaff = num(census.staff_girls, 0);
  const girlsOccupied = num(census.total_occupied_girls, girlsStudents + girlsStaff);
  const girlsVacant = girlsBedCap > 0 ? (girlsBedCap - girlsOccupied) : num(census.vacant_girls, 0);
  const girlsOccPct = girlsBedCap > 0 ? ((girlsOccupied / girlsBedCap) * 100).toFixed(1) : (girlsOccupied > 0 ? '100.0' : '0.0');
  const girlsVacPct = girlsBedCap > 0 ? ((girlsVacant / girlsBedCap) * 100).toFixed(1) : '0.0';

  // Sub-breakdowns for Girls
  const girlsCollege = Math.max(0, girlsStudents - num(census.vacant_school_girls, 0) - num(census.vacant_sports_girls, 0));
  const girlsSchool = num(census.vacant_school_girls, 0);
  const girlsSports = num(census.vacant_sports_girls, 0);

  // --- 3. COMBINED OVERVIEW METRICS ---
  const totalBedCap = num(census.bed_capacity_total, boysBedCap + girlsBedCap);
  const totalOccupied = num(census.total_occupied, boysOccupied + girlsOccupied);
  const totalVacant = num(census.vacant_total, Math.max(0, totalBedCap - totalOccupied));
  const totalOccPct = totalBedCap > 0 ? ((totalOccupied / totalBedCap) * 100).toFixed(1) : (totalOccupied > 0 ? '100.0' : '0.0');
  const totalVacPct = totalBedCap > 0 ? ((totalVacant / totalBedCap) * 100).toFixed(1) : '0.0';

  // --- 4. SHARED BED ALLOCATION ANALYSIS ---
  // When boys hostel has negative vacancy or high occupancy, girls vacant beds can be authorized for flex sharing
  const sharedAllocationPossible = girlsVacant > 0 && boysVacant <= 0;
  const sharedBedsAvailable = Math.max(0, girlsVacant);

  // --- 5. MONTHLY STUDENT MOVEMENT CALCULATIONS ---
  // Formula: Current Residents = Previous Month Residents + New Admissions - Students Vacated
  const prevMonthStudents = num(prevCensus.students_total, 0);
  const currentMonthStudents = boysStudents + girlsStudents || num(census.students_total, 0);
  const vacatedStudents = num(census.students_vacated, 0);
  
  const calculatedAdmissions = prevMonthStudents > 0 
    ? Math.max(0, currentMonthStudents - prevMonthStudents + vacatedStudents) 
    : 0;
  const netGrowth = calculatedAdmissions - vacatedStudents;
  const availableBeds = Math.max(0, totalBedCap - totalOccupied);

  // Filter-specific calculations for student movement
  const filteredMovement = useMemo(() => {
    let cur = currentMonthStudents;
    let prev = prevMonthStudents;
    let vac = vacatedStudents;

    if (movementFilter === 'boys') {
      cur = boysStudents;
      prev = num(prevCensus.students_boys, 0);
      vac = Math.round(vacatedStudents * (totalOccupied > 0 ? (boysOccupied / totalOccupied) : 0.7));
    } else if (movementFilter === 'girls') {
      cur = girlsStudents;
      prev = num(prevCensus.students_girls, 0);
      vac = Math.round(vacatedStudents * (totalOccupied > 0 ? (girlsOccupied / totalOccupied) : 0.3));
    } else if (movementFilter === 'school') {
      cur = boysSchool + girlsSchool;
      prev = num(prevCensus.vacant_school_boys, 0) + num(prevCensus.vacant_school_girls, 0);
      vac = 0;
    } else if (movementFilter === 'college') {
      cur = boysCollege + girlsCollege;
      prev = num(prevCensus.students_total, 0);
      vac = vacatedStudents;
    } else if (movementFilter === 'sports') {
      cur = boysSports + girlsSports;
      prev = num(prevCensus.vacant_sports_boys, 0) + num(prevCensus.vacant_sports_girls, 0);
      vac = 0;
    } else if (movementFilter === 'staff') {
      cur = boysStaff + girlsStaff;
      prev = num(prevCensus.staff_total, cur);
      vac = 0;
    }

    const adm = prev > 0 ? Math.max(0, cur - prev + vac) : 0;
    const grw = adm - vac;

    return {
      current: cur,
      previous: prev,
      admissions: adm,
      vacated: vac,
      growth: grw,
      available: availableBeds
    };
  }, [movementFilter, currentMonthStudents, prevMonthStudents, vacatedStudents, boysStudents, girlsStudents, boysSchool, girlsSchool, boysCollege, girlsCollege, boysSports, girlsSports, boysStaff, girlsStaff, prevCensus, availableBeds, totalOccupied, boysOccupied, girlsOccupied]);

  // --- 6. HISTORICAL OCCUPANCY TRENDS FOR CHART ---
  const trendData = useMemo(() => {
    return periods.map((p) => {
      const c = allCensusMap[String(p.id)] || {};
      const cap = num(c.bed_capacity_total, num(c.bed_capacity_boys, 0) + num(c.bed_capacity_girls, 0));
      const occ = num(c.total_occupied, num(c.students_total, 0) + num(c.staff_total, 0));
      const pct = cap > 0 ? (occ / cap) * 100 : (occ > 0 ? 100 : 0);
      const bOcc = num(c.total_occupied_boys, num(c.students_boys, 0) + num(c.staff_boys, 0));
      const gOcc = num(c.total_occupied_girls, num(c.students_girls, 0) + num(c.staff_girls, 0));
      return {
        id: p.id,
        label: formatPeriodLabel(p),
        fullLabel: p.period_label || p.period_code,
        capacity: cap,
        occupied: occ,
        pct: Number(pct.toFixed(1)),
        boys: bOcc,
        girls: gOcc
      };
    });
  }, [periods, allCensusMap]);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* SECTION HEADER BAR - Emerald / Teal visual identity */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px 20px',
        backgroundColor: '#ecfdf5',
        borderRadius: '16px',
        border: '1.5px solid #a7f3d0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#047857',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '800'
          }}>
            1
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#064e3b', margin: 0 }}>
                Capacity, Occupancy & Vacancy
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: '#10b981',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}>
                Beds & Occupancy
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#047857' }}>
              Bed capacity and resident details for Boys and Girls
            </p>
          </div>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          backgroundColor: '#ffffff',
          border: '1px solid #6ee7b7',
          color: '#065f46',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          <BedDouble size={14} color="#059669" />
          <span>Total Beds: <strong>{isAllMonths ? '—' : totalBedCap.toLocaleString()}</strong></span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#047857' }}>Occupied: <strong>{isAllMonths ? '—' : `${totalOccPct}%`}</strong></span>
        </div>
      </div>

      {/* 3 COMPARATIVE CAPACITY CARDS (Boys Hostel, Girls Hostel, Combined Overview) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {/* CARD A: BOYS HOSTEL */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px 22px',
          border: '1.5px solid #bfdbfe',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e3a8a', margin: 0 }}>
                  Boys Hostel
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Boys Hostel Beds</span>
              </div>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '9999px',
              backgroundColor: '#dbeafe',
              color: '#1d4ed8'
            }}>
              {isAllMonths ? '—' : `${boysOccPct}% Occupied`}
            </span>
          </div>

          {/* Top 3 Core Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '10px 6px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total Beds</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>{isAllMonths ? '—' : boysBedCap.toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: '#eff6ff', padding: '10px 6px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase' }}>Occupied Beds</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e40af', marginTop: '2px' }}>{isAllMonths ? '—' : boysOccupied.toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: boysVacant <= 0 ? '#fef2f2' : '#f0fdf4', padding: '10px 6px', borderRadius: '10px', border: `1px solid ${boysVacant <= 0 ? '#fecaca' : '#bbf7d0'}` }}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: boysVacant <= 0 ? '#b91c1c' : '#15803d', textTransform: 'uppercase' }}>Vacant Beds</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: boysVacant <= 0 ? '#dc2626' : '#16a34a', marginTop: '2px' }}>
                {isAllMonths ? '—' : (boysVacant <= 0 ? '0 (Full)' : boysVacant.toLocaleString())}
              </div>
            </div>
          </div>

          {/* Detailed Resident Breakdowns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
              <span style={{ color: '#475569', fontWeight: '600' }}>Students:</span>
              <strong style={{ color: '#0f172a' }}>{isAllMonths ? '—' : boysStudents.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#ffffff' }}>
              <span style={{ color: '#475569', fontWeight: '600' }}>Staff:</span>
              <strong style={{ color: '#0f172a' }}>{isAllMonths ? '—' : boysStaff.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
              <span style={{ color: '#475569', fontWeight: '600' }}>College Students:</span>
              <strong style={{ color: '#0f172a' }}>{isAllMonths ? '—' : boysCollege.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#ffffff' }}>
              <span style={{ color: '#475569', fontWeight: '600' }}>School & Sports:</span>
              <strong style={{ color: '#0f172a' }}>{isAllMonths ? '—' : (boysSchool + boysSports).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* CARD B: GIRLS HOSTEL */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px 22px',
          border: '1.5px solid #fbcfe8',
          boxShadow: '0 2px 8px rgba(219, 39, 119, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#fdf2f8',
                color: '#db2777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#831843', margin: 0 }}>
                  Girls Hostel
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Girls Hostel Beds</span>
              </div>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '9999px',
              backgroundColor: '#fce7f3',
              color: '#be185d'
            }}>
              {isAllMonths ? '—' : `${girlsOccPct}% Occupied`}
            </span>
          </div>

          {/* Top 3 Core Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '10px 6px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total Beds</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>{isAllMonths ? '—' : girlsBedCap.toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: '#fdf2f8', padding: '10px 6px', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#be185d', textTransform: 'uppercase' }}>Occupied Beds</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#9d174d', marginTop: '2px' }}>{isAllMonths ? '—' : girlsOccupied.toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', padding: '10px 6px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#15803d', textTransform: 'uppercase' }}>Vacant Beds</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#16a34a', marginTop: '2px' }}>{isAllMonths ? '—' : girlsVacant.toLocaleString()}</div>
            </div>
          </div>

          {/* Detailed Resident Breakdowns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
              <span style={{ color: '#475569', fontWeight: '600' }}>Students:</span>
              <strong style={{ color: '#0f172a' }}>{isAllMonths ? '—' : girlsStudents.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#ffffff' }}>
              <span style={{ color: '#475569', fontWeight: '600' }}>Staff:</span>
              <strong style={{ color: '#0f172a' }}>{isAllMonths ? '—' : girlsStaff.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
              <span style={{ color: '#475569', fontWeight: '600' }}>College Students:</span>
              <strong style={{ color: '#0f172a' }}>{isAllMonths ? '—' : girlsCollege.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#ffffff' }}>
              <span style={{ color: '#475569', fontWeight: '600' }}>School & Sports:</span>
              <strong style={{ color: '#0f172a' }}>{isAllMonths ? '—' : (girlsSchool + girlsSports).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* CARD C: COMBINED OVERVIEW */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px 22px',
          border: '1.5px solid #a7f3d0',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#064e3b', margin: 0 }}>
                  Combined Overview
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>All Beds (Boys & Girls)</span>
              </div>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '9999px',
              backgroundColor: '#d1fae5',
              color: '#047857'
            }}>
              {isAllMonths ? '—' : `${totalOccPct}% Occupied`}
            </span>
          </div>

          {/* Top 3 Core Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '10px 6px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total Beds</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>{isAllMonths ? '—' : totalBedCap.toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: '#ecfdf5', padding: '10px 6px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>Total Occupied</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#065f46', marginTop: '2px' }}>{isAllMonths ? '—' : totalOccupied.toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', padding: '10px 6px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#15803d', textTransform: 'uppercase' }}>Total Vacant</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#16a34a', marginTop: '2px' }}>{isAllMonths ? '—' : totalVacant.toLocaleString()}</div>
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '5px' }}>
              <span style={{ color: '#475569', fontWeight: '600' }}>Beds Occupied:</span>
              <strong style={{ color: '#047857' }}>{isAllMonths ? '—' : `${totalOccupied.toLocaleString()} of ${totalBedCap.toLocaleString()} Beds (${totalOccPct}%)`}</strong>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${(boysOccupied / totalBedCap) * 100}%`, backgroundColor: '#3b82f6', height: '100%' }} title={`Boys: ${boysOccupied}`} />
              <div style={{ width: `${(girlsOccupied / totalBedCap) * 100}%`, backgroundColor: '#ec4899', height: '100%' }} title={`Girls: ${girlsOccupied}`} />
              <div style={{ width: `${(totalVacant / totalBedCap) * 100}%`, backgroundColor: '#cbd5e1', height: '100%' }} title={`Vacant: ${totalVacant}`} />
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '10.5px', marginTop: '6px', color: '#64748b' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#3b82f6' }} /> Boys ({((boysOccupied / totalBedCap) * 100).toFixed(1)}%)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#ec4899' }} /> Girls ({((girlsOccupied / totalBedCap) * 100).toFixed(1)}%)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#cbd5e1' }} /> Vacant ({totalVacPct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MONTHLY STUDENT MOVEMENT ANALYTICS */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: 'var(--primary, #14245C)', margin: 0 }}>
              Monthly Student Movement{movementFilter !== 'all' ? ` • ${movementFilter.charAt(0).toUpperCase() + movementFilter.slice(1)}` : ''}
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0 0' }}>
              Calculation: Current Students = Last Month ({filteredMovement.previous.toLocaleString()}) + Joined (+{filteredMovement.admissions.toLocaleString()}) - Left (-{filteredMovement.vacated.toLocaleString()})
            </p>
          </div>

          {/* Filter Pills (hidden when controlled from Sticky Top Filter Bar) */}
          {!hideMovementFilter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginRight: '2px', textTransform: 'uppercase' }}>
              <Filter size={11} style={{ display: 'inline', marginRight: '3px' }} />
              Filter:
            </span>
            {[
              { id: 'all', label: 'All Residents' },
              { id: 'boys', label: 'Boys' },
              { id: 'girls', label: 'Girls' },
              { id: 'college', label: 'College' },
              { id: 'school', label: 'School' },
              { id: 'sports', label: 'Sports' },
              { id: 'staff', label: 'Staff' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setMovementFilter(f.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontWeight: movementFilter === f.id ? '800' : '600',
                  border: movementFilter === f.id ? '1px solid #059669' : '1px solid #e2e8f0',
                  backgroundColor: movementFilter === f.id ? '#059669' : '#f8fafc',
                  color: movementFilter === f.id ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          )}
        </div>

        {/* Movement Metric Cards (6 Cards) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '12px 14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Previous Month</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '3px' }}>{isAllMonths ? '—' : filteredMovement.previous.toLocaleString()}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Students last month</div>
          </div>
          <div style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', padding: '12px 14px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#15803d', textTransform: 'uppercase' }}>New Admissions</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#16a34a', marginTop: '3px' }}>{isAllMonths ? '—' : `+${filteredMovement.admissions.toLocaleString()}`}</div>
            <div style={{ fontSize: '10px', color: '#15803d' }}>Students joined</div>
          </div>
          <div style={{ backgroundColor: '#fff7ed', borderRadius: '12px', padding: '12px 14px', border: '1px solid #fed7aa' }}>
            <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#c2410c', textTransform: 'uppercase' }}>Students Left</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#ea580c', marginTop: '3px' }}>{isAllMonths ? '—' : `-${filteredMovement.vacated.toLocaleString()}`}</div>
            <div style={{ fontSize: '10px', color: '#c2410c' }}>Students who left</div>
          </div>
          <div style={{ backgroundColor: '#ecfdf5', borderRadius: '12px', padding: '12px 14px', border: '1.5px solid #10b981' }}>
            <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>Current Residents</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#064e3b', marginTop: '3px' }}>{isAllMonths ? '—' : filteredMovement.current.toLocaleString()}</div>
            <div style={{ fontSize: '10px', color: '#047857' }}>Students staying now</div>
          </div>
          <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '12px 14px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase' }}>Net Student Growth</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#2563eb', marginTop: '3px' }}>
              {isAllMonths ? '—' : (filteredMovement.growth >= 0 ? `+${filteredMovement.growth.toLocaleString()}` : filteredMovement.growth.toLocaleString())}
            </div>
            <div style={{ fontSize: '10px', color: '#1d4ed8' }}>Joined minus left</div>
          </div>
          <div style={{ backgroundColor: '#f0fdfa', borderRadius: '12px', padding: '12px 14px', border: '1px solid #99f6e4' }}>
            <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0f766e', textTransform: 'uppercase' }}>Available Beds</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0d9488', marginTop: '3px' }}>{isAllMonths ? '—' : filteredMovement.available.toLocaleString()}</div>
            <div style={{ fontSize: '10px', color: '#0f766e' }}>Free beds available</div>
          </div>
        </div>

        {/* MONTHLY OCCUPANCY TRENDS CHART (SVG Line / Area across 13 cycles) */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155' }}>
              Monthly Occupancy Trend (Sep'25 – Sep'26)
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Highest: <strong style={{ color: '#047857' }}>95.5% (Sep'26)</strong> • Average: <strong>88.4%</strong>
            </span>
          </div>

          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', overflowX: 'auto' }}>
            {trendData.length > 0 && (() => {
              const svgW = 860;
              const svgH = 170;
              const padLeft = 45;
              const padRight = 30;
              const padTop = 20;
              const padBottom = 35;
              const chartW = svgW - padLeft - padRight;
              const chartH = svgH - padTop - padBottom;

              const minPct = 60;
              const maxPct = 100;

              const points = trendData.map((d, i) => {
                const x = padLeft + (i / Math.max(1, trendData.length - 1)) * chartW;
                const normY = (d.pct - minPct) / (maxPct - minPct);
                const y = padTop + chartH - normY * chartH;
                return { ...d, x, y };
              });

              const polyPoints = [
                `${padLeft},${padTop + chartH}`,
                ...points.map(p => `${p.x},${p.y}`),
                `${padLeft + chartW},${padTop + chartH}`
              ].join(' ');

              const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');

              return (
                <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                  {/* Y gridlines */}
                  {[60, 70, 80, 90, 100].map(val => {
                    const y = padTop + chartH - ((val - minPct) / (maxPct - minPct)) * chartH;
                    return (
                      <g key={val}>
                        <line x1={padLeft} y1={y} x2={svgW - padRight} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                        <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                          {val}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradient Fill */}
                  <defs>
                    <linearGradient id="hostelOccGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  <polygon points={polyPoints} fill="url(#hostelOccGrad)" />
                  <polyline points={linePoints} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Points and Labels */}
                  {points.map((pt, idx) => {
                    const isSelected = activePeriodId && String(pt.id) === String(activePeriodId);
                    return (
                      <g key={pt.id || idx} style={{ cursor: 'pointer' }} onClick={() => onPeriodSelect && onPeriodSelect(pt.id)}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelected ? 6 : 4}
                          fill={isSelected ? '#047857' : '#ffffff'}
                          stroke="#059669"
                          strokeWidth={isSelected ? 3 : 2}
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 8}
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight="800"
                          fill="#065f46"
                        >
                          {pt.pct}%
                        </text>
                        <text
                          x={pt.x}
                          y={svgH - padBottom + 16}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight={isSelected ? '800' : '600'}
                          fill={isSelected ? '#047857' : '#64748b'}
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}
