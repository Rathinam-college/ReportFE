import React from 'react';
import { Users, UserCheck, DollarSign, Activity } from 'lucide-react';

/**
 * PersonStats Component
 * 5. Special rows from existing table: "Person" (students, staff, others) and "Cost Per Person"
 *  - Must NOT be summed as money in the Grand Total
 *  - Shown as small chips or stat tiles in their own card
 *  - Uses existing values and formulas
 */
export default function PersonStats({
  personRows = [],
  censusData = null,
  selectedPeriod = 'all',
  selectedPeriodLabel = 'All months',
  grandTotal = 0,
  formatCompact = (v) => String(v),
  formatFull = (v) => String(v)
}) {
  // If no person-related data exists in the current module / dataset, return null
  const hasRows = personRows && personRows.length > 0;
  const hasCensus = censusData && (
    censusData.students_count || 
    censusData.student_count || 
    censusData.staff_count || 
    censusData.total_occupied || 
    censusData.per_student_cost_month
  );

  if (!hasRows && !hasCensus) {
    return null;
  }

  // Extract student, staff, total persons, and cost per person from items or census
  let students = null;
  let staff = null;
  let totalPersons = null;
  let costPerPerson = null;

  const isAllMonths = selectedPeriod === 'all';

  if (hasRows && !isAllMonths) {
    personRows.forEach((row) => {
      const desc = (row.description || row.name || '').toLowerCase();
      const val = Number(row.amounts?.[selectedPeriod] ?? row.amounts?.[String(selectedPeriod)] ?? 0);

      if (desc.includes('student')) {
        students = val;
      } else if (desc.includes('staff')) {
        staff = val;
      } else if (desc.includes('total person') || desc === 'person') {
        totalPersons = val;
      } else if (desc.includes('cost per person') || desc.includes('per person')) {
        costPerPerson = val;
      }
    });
  }

  // Fallback to census data if available (only for specific month)
  if (!isAllMonths) {
    if (students === null && (censusData?.students_count || censusData?.student_count)) {
      students = Number(censusData.students_count || censusData.student_count || 0);
    }
    if (staff === null && censusData?.staff_count) {
      staff = Number(censusData.staff_count || 0);
    }
    if (totalPersons === null) {
      if (censusData?.total_occupied) {
        totalPersons = Number(censusData.total_occupied);
      } else if (students !== null || staff !== null) {
        totalPersons = (students || 0) + (staff || 0);
      }
    }
    if (costPerPerson === null) {
      if (censusData?.per_student_cost_month) {
        costPerPerson = Number(censusData.per_student_cost_month);
      } else if (totalPersons && totalPersons > 0 && grandTotal > 0) {
        costPerPerson = grandTotal / totalPersons;
      }
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card, #ffffff)',
        borderRadius: '18px',
        border: '1px solid var(--border-card, #e6e8f2)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: 'rgba(91, 91, 240, 0.1)',
            color: '#5b5bf0'
          }}>
            <Users size={14} />
          </span>
          <span style={{
            fontSize: '13px',
            fontWeight: '700',
            color: 'var(--text-main, #14172b)'
          }}>
            Operational Census & Cost Per Person
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            padding: '2px 8px',
            borderRadius: '9999px',
            backgroundColor: 'var(--bg-pill, #eceefa)',
            color: 'var(--text-muted, #6b7090)'
          }}>
            {selectedPeriodLabel} • Non-Expense Metric
          </span>
        </div>
      </div>

      {/* Stat Tiles / Chips Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '10px'
      }}>
        {/* Total Persons */}
        <div style={{
          backgroundColor: 'var(--bg-pill, #eceefa)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted, #6b7090)' }}>
            Total Persons
          </span>
          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main, #14172b)' }}>
            {totalPersons !== null && totalPersons > 0 ? totalPersons.toLocaleString('en-IN') : '—'}
          </span>
        </div>

        {/* Students Count */}
        <div style={{
          backgroundColor: 'var(--bg-pill, #eceefa)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted, #6b7090)' }}>
            Students Count
          </span>
          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main, #14172b)' }}>
            {students !== null && students > 0 ? students.toLocaleString('en-IN') : '—'}
          </span>
        </div>

        {/* Staff Count */}
        <div style={{
          backgroundColor: 'var(--bg-pill, #eceefa)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted, #6b7090)' }}>
            Staff Count
          </span>
          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main, #14172b)' }}>
            {staff !== null && staff > 0 ? staff.toLocaleString('en-IN') : '—'}
          </span>
        </div>

        {/* Cost Per Person */}
        <div style={{
          backgroundColor: 'rgba(91, 91, 240, 0.08)',
          border: '1px solid rgba(91, 91, 240, 0.2)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#5b5bf0' }}>
            Cost Per Person
          </span>
          <span
            title={costPerPerson ? formatFull(costPerPerson) : ''}
            style={{ fontSize: '18px', fontWeight: '800', color: '#5b5bf0' }}
          >
            {costPerPerson !== null && costPerPerson > 0 ? `₹${Math.round(costPerPerson).toLocaleString('en-IN')}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
