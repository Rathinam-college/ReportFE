import React from 'react';
import { 
  BedDouble, Users, UserCheck, ShieldAlert, Wrench, 
  Clock, IndianRupee, PieChart, TrendingUp, UserPlus, UserMinus
} from 'lucide-react';
import { formatINR } from '../../../utils/formatters';

/**
 * HostelExecutiveKpis
 * Renders the Executive KPI Summary cards requested by management:
 * 1. Total Bed Capacity
 * 2. Total Occupied Residents
 * 3. Total Vacant Beds
 * 4. Occupancy Percentage
 * 5. New Admissions
 * 6. Students Vacated
 * 7. Total Maintenance Tickets
 * 8. Open Maintenance Tickets
 * 9. Monthly Operating Expenses
 * 10. Remaining Budget
 * 11. Cost per Student per Month
 * 12. Cost per Student per Day
 */
export default function HostelExecutiveKpis({
  census = {},
  prevCensus = {},
  allCensusMap = {},
  periods = [],
  isAllMonths = false,
  activePeriodLabel = '',
  budgetTrackingData = [],
  activeMonthCol = 'oct_26_actual',
  allMonthsTotalSpend = 0
}) {
  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // Calculations directly from PostgreSQL database census
  const bedCapacity = num(census.bed_capacity_total, num(census.bed_capacity_boys, 0) + num(census.bed_capacity_girls, 0));
  const totalOccupied = num(census.total_occupied, num(census.students_total, 0) + num(census.staff_total, 0));
  const vacantBeds = num(census.vacant_total, Math.max(0, bedCapacity - totalOccupied));
  const occupancyPct = bedCapacity > 0 ? (totalOccupied / bedCapacity) * 100 : num(census.occupied_pct, 0);

  const prevResidents = num(prevCensus.students_total, 0);
  const currentStudents = num(census.students_total, 0);
  const studentsVacated = num(census.students_vacated, 0);
  
  // Current Residents = Previous + New Admissions - Vacated
  // => New Admissions = Current - Previous + Vacated (only if previous month exists)
  const rawAdmissions = prevResidents > 0 ? (currentStudents - prevResidents + studentsVacated) : 0;
  const newAdmissions = Math.max(0, rawAdmissions);

  // When isAllMonths, aggregate census metrics across all periods
  const allMonthsCensusList = Object.values(allCensusMap || {});
  const totalStudentsVacatedAll = allMonthsCensusList.reduce((acc, c) => acc + num(c.students_vacated, 0), 0);
  const totalTicketsRecAll = allMonthsCensusList.reduce((acc, c) => acc + num(c.tickets_received, 0), 0);
  const totalTicketsClsAll = allMonthsCensusList.reduce((acc, c) => acc + num(c.tickets_closed, 0), 0);

  const displayVacated = isAllMonths && totalStudentsVacatedAll > 0 ? totalStudentsVacatedAll : studentsVacated;
  const displayTicketsRec = isAllMonths && totalTicketsRecAll > 0 ? totalTicketsRecAll : num(census.tickets_received, 0);
  const displayTicketsCls = isAllMonths && totalTicketsClsAll > 0 ? totalTicketsClsAll : num(census.tickets_closed, 0);
  const displayOpenTickets = Math.max(0, displayTicketsRec - displayTicketsCls);

  // If budget tracking data is provided, calculate the actual spend for the active month across the 9 heads
  const trackingActualSpend = (budgetTrackingData && budgetTrackingData.length > 0 && activeMonthCol)
    ? budgetTrackingData.reduce((acc, h) => acc + num(h[activeMonthCol], 0), 0)
    : 0;

  // Monthly Expenses: prefer live budget tracking actuals if positive, else census.expenses_occurred
  const singleMonthExpenses = trackingActualSpend > 0 ? trackingActualSpend : num(census.expenses_occurred, 0);

  // When All Months is selected, display total cumulative spend across all recorded months
  const displayExpenses = isAllMonths
    ? (allMonthsTotalSpend > 0 ? allMonthsTotalSpend : singleMonthExpenses)
    : singleMonthExpenses;

  const costPerStudentMonth = num(
    census.per_student_cost_month,
    currentStudents > 0 ? singleMonthExpenses / currentStudents : 0
  );
  const costPerStudentDay = num(
    census.per_student_cost_day,
    currentStudents > 0 ? singleMonthExpenses / (currentStudents * 30) : 0
  );

  const kpis = [
    {
      label: 'Total Bed Capacity',
      value: bedCapacity > 0 ? bedCapacity.toLocaleString() : '—',
      sub: `${num(census.bed_capacity_boys, 0)} Boys • ${num(census.bed_capacity_girls, 0)} Girls`,
      icon: BedDouble,
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0'
    },
    {
      label: 'Occupied Beds',
      value: totalOccupied > 0 ? totalOccupied.toLocaleString() : '—',
      sub: isAllMonths 
        ? `${totalOccupied.toLocaleString()} Latest • ${num(census.students_total, 0)} Students • ${num(census.staff_total, 0)} Staff`
        : `${num(census.students_total, 0)} Students • ${num(census.staff_total, 0)} Staff`,
      icon: Users,
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe'
    },
    {
      label: 'Total Vacant Beds',
      value: vacantBeds.toLocaleString(),
      sub: `${num(census.vacant_boys, 0)} Boys • ${num(census.vacant_girls, 0)} Girls free`,
      icon: UserCheck,
      color: '#0d9488',
      bg: '#f0fdfa',
      border: '#99f6e4'
    },
    {
      label: 'Occupancy Rate',
      value: bedCapacity > 0 ? `${occupancyPct.toFixed(1)}%` : '—',
      sub: bedCapacity > 0 ? `Free beds: ${(100 - occupancyPct).toFixed(1)}%` : 'No capacity logged',
      icon: PieChart,
      color: '#4f46e5',
      bg: '#eef2ff',
      border: '#c7d2fe'
    },
    {
      label: 'New Admissions',
      value: prevResidents > 0 ? `+${newAdmissions.toLocaleString()}` : '—',
      sub: prevResidents > 0 ? `Joined this month` : 'Baseline period',
      icon: UserPlus,
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0'
    },
    {
      label: 'Students Vacated',
      value: displayVacated.toLocaleString(),
      sub: isAllMonths ? `Total vacated across all months` : `Left hostel`,
      icon: UserMinus,
      color: '#ea580c',
      bg: '#fff7ed',
      border: '#fed7aa'
    },
    {
      label: 'Maintenance Complaints',
      value: displayTicketsRec.toLocaleString(),
      sub: `${displayTicketsCls.toLocaleString()} Solved (${displayTicketsRec > 0 ? Math.round((displayTicketsCls / displayTicketsRec) * 100) : 100}%)`,
      icon: Wrench,
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a'
    },
    {
      label: 'Pending Complaints',
      value: displayOpenTickets.toLocaleString(),
      sub: displayOpenTickets === 0 ? 'All complaints solved ✓' : `${displayOpenTickets} yet to fix`,
      icon: ShieldAlert,
      color: displayOpenTickets > 0 ? '#dc2626' : '#059669',
      bg: displayOpenTickets > 0 ? '#fef2f2' : '#f0fdf4',
      border: displayOpenTickets > 0 ? '#fecaca' : '#bbf7d0'
    },
    {
      label: isAllMonths ? 'Total Expenses (All Months)' : 'Total Monthly Expenses',
      value: displayExpenses > 0 ? formatINR(displayExpenses) : '—',
      sub: isAllMonths 
        ? `Total cumulative sum across all ${periods.length || 13} recorded months` 
        : (displayExpenses > 0 ? `Total sum of 9 operating heads` : 'No expenses recorded'),
      icon: IndianRupee,
      color: '#7c3aed',
      bg: '#f5f3ff',
      border: '#ddd6fe'
    },
    {
      label: 'Cost per Student (Month)',
      value: costPerStudentMonth > 0 ? `₹${Math.round(costPerStudentMonth).toLocaleString()}` : '—',
      sub: `Average cost per student`,
      icon: TrendingUp,
      color: '#6366f1',
      bg: '#eef2ff',
      border: '#c7d2fe'
    },
    {
      label: 'Cost per Student (Day)',
      value: costPerStudentDay > 0 ? `₹${costPerStudentDay.toFixed(2)}` : '—',
      sub: `Average cost per student per day`,
      icon: Clock,
      color: '#475569',
      bg: '#f8fafc',
      border: '#e2e8f0'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '800',
            color: '#0f172a',
            backgroundColor: '#f1f5f9',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            letterSpacing: '0.04em'
          }}>
            OVERVIEW
          </span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
            {kpis.length} Key Numbers at a Glance
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          Selected Period: <strong style={{ color: '#0f172a' }}>{activePeriodLabel || (isAllMonths ? 'All Months (Cumulative Total)' : 'Current Month')}</strong>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px'
      }}>
        {kpis.map((k, idx) => {
          const Icon = k.icon;
          return (
            <div
              key={idx}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '14px 16px',
                border: `1.5px solid ${k.border}`,
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(15, 23, 42, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.02)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {k.label}
                </span>
                <span style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: k.bg,
                  color: k.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={15} />
                </span>
              </div>

              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                  {k.value}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
                  {k.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
