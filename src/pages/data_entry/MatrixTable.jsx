import React from 'react';
import { formatINR } from '../../utils/formatters';
import { MessageSquare, Users, Utensils, Award } from 'lucide-react';

export default function MatrixTable({
  computedMatrix,
  editingPeriodId,
  setEditingPeriodId,
  activePeriodObj,
  matrixDraft,
  remarksDraft = {},
  censusDraft = {},
  handleCellChange,
  handleRemarkChange,
  handleCensusChange
}) {
  if (!computedMatrix || !computedMatrix.categories) return null;

  const periods = computedMatrix.periods || [];
  const currentIdx = periods.findIndex(p => p.id === editingPeriodId);
  const prevPeriod = currentIdx > 0 ? periods[currentIdx - 1] : null;

  // Census / Headcount Calculations
  const currStr = String(editingPeriodId);
  const prevStr = prevPeriod ? String(prevPeriod.id) : null;

  const currStudents = censusDraft?.students?.[currStr] !== undefined && censusDraft?.students?.[currStr] !== null ? censusDraft.students[currStr] : '';
  const currStaff = censusDraft?.staff?.[currStr] !== undefined && censusDraft?.staff?.[currStr] !== null ? censusDraft.staff[currStr] : '';
  const currOthers = censusDraft?.others?.[currStr] !== undefined && censusDraft?.others?.[currStr] !== null ? censusDraft.others[currStr] : '';
  const currProduction = censusDraft?.production?.[currStr] !== undefined && censusDraft?.production?.[currStr] !== null ? censusDraft.production[currStr] : '';

  const sCountNum = parseInt(currStudents, 10) || 0;
  const stCountNum = parseInt(currStaff, 10) || 0;
  const oCountNum = parseInt(currOthers, 10) || 0;
  const currTotalPersons = sCountNum + stCountNum + oCountNum;
  const prodCountNum = parseInt(currProduction, 10) || 0;

  // Previous period values for comparison
  const prevStudents = prevStr ? (parseInt(censusDraft?.students?.[prevStr], 10) || 0) : null;
  const prevStaff = prevStr ? (parseInt(censusDraft?.staff?.[prevStr], 10) || 0) : null;
  const prevOthers = prevStr ? (parseInt(censusDraft?.others?.[prevStr], 10) || 0) : null;
  const prevTotalPersons = prevStr ? ((prevStudents || 0) + (prevStaff || 0) + (prevOthers || 0)) : null;
  const prevProduction = prevStr ? (parseInt(censusDraft?.production?.[prevStr], 10) || 0) : null;

  // Average calculations across periods
  const numP = periods.length || 1;
  let sumStudentsAll = 0, sumStaffAll = 0, sumOthersAll = 0, sumProdAll = 0;
  periods.forEach(p => {
    const pStr = String(p.id);
    sumStudentsAll += parseInt(censusDraft?.students?.[pStr], 10) || 0;
    sumStaffAll += parseInt(censusDraft?.staff?.[pStr], 10) || 0;
    sumOthersAll += parseInt(censusDraft?.others?.[pStr], 10) || 0;
    sumProdAll += parseInt(censusDraft?.production?.[pStr], 10) || 0;
  });
  const avgStudents = Math.round(sumStudentsAll / numP);
  const avgStaff = Math.round(sumStaffAll / numP);
  const avgOthers = Math.round(sumOthersAll / numP);
  const avgPersons = Math.round((sumStudentsAll + sumStaffAll + sumOthersAll) / numP);
  const avgProd = Math.round(sumProdAll / numP);

  // Helper for MoM comparison badge
  const renderDiffBadge = (curr, prev) => {
    if (prev === null || prev === undefined) return <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>;
    const c = parseInt(curr, 10) || 0;
    const p = parseInt(prev, 10) || 0;
    const diff = c - p;
    if (diff === 0) return <span style={{ color: '#64748b', fontSize: '11.5px', fontWeight: '600' }}>0 (0.0%)</span>;
    const pct = p > 0 ? ((diff / p) * 100).toFixed(1) : '100.0';
    const isPos = diff > 0;
    return (
      <span style={{
        fontSize: '11px',
        fontWeight: '700',
        color: isPos ? '#166534' : '#991b1b',
        backgroundColor: isPos ? '#f0fdf4' : '#fef2f2',
        padding: '2px 7px',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px'
      }}>
        {isPos ? `+${diff.toLocaleString()}` : diff.toLocaleString()} ({isPos ? `+${pct}%` : `${pct}%`})
      </span>
    );
  };

  // Active month food spend subtotal for unit metric comparison
  const totalFoodSpend = computedMatrix.categories.reduce((acc, cat) => acc + (cat.subtotal?.amounts?.[editingPeriodId] || 0), 0);

  // Category Color Map
  const getCategoryTheme = (idx) => {
    const themes = [
      { dot: '#6366f1', badgeBg: '#eef2ff', badgeText: '#4338ca' }, // Food Material (Purple)
      { dot: '#10b981', badgeBg: '#ecfdf5', badgeText: '#047857' }, // Food Labour (Green)
      { dot: '#f59e0b', badgeBg: '#fffbeb', badgeText: '#b45309' }, // FC Maintenance (Amber)
      { dot: '#ec4899', badgeBg: '#fdf2f8', badgeText: '#be185d' }, // Events (Pink)
      { dot: '#8b5cf6', badgeBg: '#f5f3ff', badgeText: '#6d28d9' }  // Festival (Violet)
    ];
    return themes[idx % themes.length];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>

      {/* 1. DINING CENSUS & MEAL PRODUCTION HEADCOUNT CARD */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1.5px solid #c7d2fe',
        boxShadow: '0 2px 6px rgba(79, 70, 229, 0.04)',
        overflow: 'hidden'
      }}>
        {/* HEADER */}
        <div style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8faff',
          borderBottom: '1px solid #e0e7ff',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#4f46e5' }} />
            <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#1e1b4b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="#4f46e5" />
              <span>Dining Census & Headcount</span>
            </h3>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', backgroundColor: '#eef2ff', padding: '2px 8px', borderRadius: '4px' }}>
              Operational Counts
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              padding: '3px 12px',
              borderRadius: '9999px',
              backgroundColor: '#eef2ff',
              color: '#3730a3'
            }}>
              Total Diners: <strong style={{ color: '#4f46e5' }}>{currTotalPersons.toLocaleString()} Persons</strong>
            </div>
            {prodCountNum > 0 && (
              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '3px 12px',
                borderRadius: '9999px',
                backgroundColor: '#f0fdf4',
                color: '#166534'
              }}>
                Production: <strong style={{ color: '#15803d' }}>{prodCountNum.toLocaleString()} Plates</strong>
              </div>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '11.5px', fontWeight: '600' }}>
                <th style={{ padding: '10px 20px', textAlign: 'left', width: '24%' }}>Diner / Production Category</th>
                {prevPeriod && (
                  <th style={{ padding: '10px 14px', textAlign: 'right', width: '14%' }}>
                    {prevPeriod.period_label} (Count)
                  </th>
                )}
                <th style={{ padding: '10px 14px', textAlign: 'center', width: '16%', color: '#4f46e5', fontWeight: '700' }}>
                  {activePeriodObj?.period_label} • Edit
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '16%' }}>
                  MoM Comparison
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'right', width: '13%' }}>
                  Avg / mo
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'left', width: '17%' }}>
                  Census Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Students count */}
              <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '12px 20px', fontWeight: '700', color: '#1e293b' }}>
                  Students count
                </td>
                {prevPeriod && (
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>
                    {prevStudents !== null ? prevStudents.toLocaleString() : '—'}
                  </td>
                )}
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currStudents}
                    onChange={(e) => handleCensusChange?.('students', e.target.value)}
                    disabled={activePeriodObj?.is_closed}
                    style={{
                      width: '100%',
                      maxWidth: '130px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1.5px solid #6366f1',
                      backgroundColor: '#ffffff',
                      textAlign: 'right',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none',
                      boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.08)'
                    }}
                  />
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                  {renderDiffBadge(sCountNum, prevStudents)}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>
                  {avgStudents.toLocaleString()}
                </td>
                <td style={{ padding: '8px 16px', textAlign: 'left', fontSize: '11.5px', color: '#64748b' }}>
                  Enrolled student diners
                </td>
              </tr>

              {/* Row 2: Staff count */}
              <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '12px 20px', fontWeight: '700', color: '#1e293b' }}>
                  Staff count
                </td>
                {prevPeriod && (
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>
                    {prevStaff !== null ? prevStaff.toLocaleString() : '—'}
                  </td>
                )}
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currStaff}
                    onChange={(e) => handleCensusChange?.('staff', e.target.value)}
                    disabled={activePeriodObj?.is_closed}
                    style={{
                      width: '100%',
                      maxWidth: '130px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1.5px solid #6366f1',
                      backgroundColor: '#ffffff',
                      textAlign: 'right',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none',
                      boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.08)'
                    }}
                  />
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                  {renderDiffBadge(stCountNum, prevStaff)}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>
                  {avgStaff.toLocaleString()}
                </td>
                <td style={{ padding: '8px 16px', textAlign: 'left', fontSize: '11.5px', color: '#64748b' }}>
                  Dining & campus staff
                </td>
              </tr>

              {/* Row 3: Others */}
              <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '12px 20px', fontWeight: '700', color: '#1e293b' }}>
                  Others
                </td>
                {prevPeriod && (
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>
                    {prevOthers !== null ? prevOthers.toLocaleString() : '—'}
                  </td>
                )}
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currOthers}
                    onChange={(e) => handleCensusChange?.('others', e.target.value)}
                    disabled={activePeriodObj?.is_closed}
                    style={{
                      width: '100%',
                      maxWidth: '130px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1.5px solid #6366f1',
                      backgroundColor: '#ffffff',
                      textAlign: 'right',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none',
                      boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.08)'
                    }}
                  />
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                  {renderDiffBadge(oCountNum, prevOthers)}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>
                  {avgOthers.toLocaleString()}
                </td>
                <td style={{ padding: '8px 16px', textAlign: 'left', fontSize: '11.5px', color: '#64748b' }}>
                  Guests, visitors & events
                </td>
              </tr>

              {/* Row 4: Total Persons count (HIGHLIGHT ROW) */}
              <tr style={{ backgroundColor: '#f0fdf4', borderBottom: '1.5px solid #bbf7d0' }}>
                <td style={{ padding: '12px 20px', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={15} color="#16a34a" />
                  <span>Total Persons count</span>
                </td>
                {prevPeriod && (
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#166534', fontWeight: '800' }}>
                    {prevTotalPersons !== null ? prevTotalPersons.toLocaleString() : '—'}
                  </td>
                )}
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: '130px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#dcfce7',
                    border: '1.5px solid #86efac',
                    color: '#15803d',
                    fontWeight: '800',
                    fontSize: '13.5px'
                  }}>
                    {currTotalPersons.toLocaleString()}
                  </div>
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                  {renderDiffBadge(currTotalPersons, prevTotalPersons)}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#166534', fontWeight: '800' }}>
                  {avgPersons.toLocaleString()}
                </td>
                <td style={{ padding: '8px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: '700', color: '#15803d' }}>
                  Sum = Students + Staff + Others
                </td>
              </tr>

              {/* Row 5: Production count */}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 20px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Utensils size={14} color="#ea580c" />
                  <span>Production count</span>
                </td>
                {prevPeriod && (
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>
                    {prevProduction !== null ? prevProduction.toLocaleString() : '—'}
                  </td>
                )}
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currProduction}
                    onChange={(e) => handleCensusChange?.('production', e.target.value)}
                    disabled={activePeriodObj?.is_closed}
                    style={{
                      width: '100%',
                      maxWidth: '130px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1.5px solid #ea580c',
                      backgroundColor: '#ffffff',
                      textAlign: 'right',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none',
                      boxShadow: '0 0 0 2px rgba(234, 88, 12, 0.08)'
                    }}
                  />
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                  {renderDiffBadge(prodCountNum, prevProduction)}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>
                  {avgProd.toLocaleString()}
                </td>
                <td style={{ padding: '8px 16px', textAlign: 'left', fontSize: '11.5px', color: '#64748b' }}>
                  Total meal plates produced
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* COMPARATIVE UNIT METRICS STRIP (IT WAS USED BUT COMPARE THAT) */}
        {currTotalPersons > 0 && (
          <div style={{
            padding: '12px 20px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <span style={{ fontWeight: '700', color: '#1e293b' }}>Operational Comparison Metrics:</span>
              <span style={{ color: '#94a3b8' }}>({activePeriodObj?.period_label})</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#64748b' }}>Cost / Person:</span>
                <strong style={{ color: '#0f172a' }} className="currency-font">
                  {formatINR(Math.round(totalFoodSpend / currTotalPersons))}
                </strong>
              </div>

              {prodCountNum > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#64748b' }}>Cost / Meal Plate:</span>
                    <strong style={{ color: '#0f172a' }} className="currency-font">
                      {formatINR((totalFoodSpend / prodCountNum).toFixed(2))}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#64748b' }}>Plates / Person:</span>
                    <strong style={{ color: '#2563eb' }}>
                      {(prodCountNum / currTotalPersons).toFixed(1)} Plates
                    </strong>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. EXPENSE CATEGORIES TABLES (FINANCIAL MATRIX) */}
      {computedMatrix.categories.map((cat, catIdx) => {
        const theme = getCategoryTheme(catIdx);
        const subtotalEditing = cat.subtotal?.amounts?.[editingPeriodId] || 0;

        return (
          <div
            key={cat.category_id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #eef2f6',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              overflow: 'hidden'
            }}
          >
            {/* CATEGORY CARD HEADER */}
            <div style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: theme.dot }} />
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {cat.category_name}
                </h3>
              </div>

              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '3px 12px',
                borderRadius: '9999px',
                backgroundColor: theme.badgeBg,
                color: theme.badgeText
              }}>
                Subtotal {activePeriodObj?.period_label?.replace(/'\d+/, '') || ''} <span className="currency-font">{formatINR(subtotalEditing)}</span>
              </div>
            </div>

            {/* CATEGORY ITEMS TABLE */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '11.5px', fontWeight: '600' }}>
                    <th style={{ padding: '10px 20px', textAlign: 'left', width: '22%' }}>Cost Head</th>
                    
                    {/* Previous Period Column */}
                    {prevPeriod && (
                      <th style={{ padding: '10px 14px', textAlign: 'right', width: '13%' }}>
                        {prevPeriod.period_label}
                      </th>
                    )}

                    {/* Active Editing Month Column */}
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '16%', color: '#4f46e5', fontWeight: '700' }}>
                      {activePeriodObj?.period_label} • Edit
                    </th>

                    {/* 5-mo trend mini sparkline */}
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: '11%' }}>
                      5-mo trend
                    </th>

                    {/* 5-mo total */}
                    <th style={{ padding: '10px 14px', textAlign: 'right', width: '13%' }}>
                      5-mo total
                    </th>

                    {/* Avg / mo */}
                    <th style={{ padding: '10px 14px', textAlign: 'right', width: '11%' }}>
                      Avg / mo
                    </th>

                    {/* Side Remark Column (Optional) */}
                    <th style={{ padding: '10px 16px', textAlign: 'left', width: '14%' }}>
                      Remark (Optional)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cat.items.map((row, idx) => {
                    const prevVal = prevPeriod ? (row.amounts[prevPeriod.id] || 0) : null;
                    const draftVal = matrixDraft[row.cost_head_id]?.[editingPeriodId];
                    const currentVal = row.amounts[editingPeriodId];
                    const activeVal = (draftVal !== undefined && draftVal !== null) ? draftVal : (currentVal !== null && currentVal !== undefined ? currentVal : '');

                    const rawRemark = remarksDraft[row.cost_head_id]?.[editingPeriodId] ?? 
                                      remarksDraft[row.cost_head_id]?.[String(editingPeriodId)] ?? 
                                      row.remarks?.[editingPeriodId] ?? 
                                      row.remarks?.[String(editingPeriodId)] ?? '';
                    const remarkVal = (rawRemark && !rawRemark.startsWith('Entry via Operational Matrix') && !rawRemark.startsWith('Cloned from')) ? rawRemark : '';

                    // Generate mini 5-bar heights based on history
                    const sparkHeights = periods.slice(0, 5).map(p => {
                      const v = row.amounts[p.id] || 0;
                      return v > 0 ? Math.max(6, Math.min(20, Math.round((v / (row.total || 1)) * 36))) : 4;
                    });

                    return (
                      <tr
                        key={row.cost_head_id}
                        style={{
                          borderBottom: idx === cat.items.length - 1 ? 'none' : '1px solid #f8fafc',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* Cost Head Name */}
                        <td style={{ padding: '12px 20px', fontWeight: '600', color: '#1e293b' }}>
                          {row.description}
                        </td>

                        {/* Previous Month Value */}
                        {prevPeriod && (
                          <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }} className="currency-font">
                            {formatINR(prevVal)}
                          </td>
                        )}

                        {/* Active Editing Month Input */}
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={activeVal}
                            onChange={(e) => handleCellChange(row.cost_head_id, editingPeriodId, e.target.value)}
                            disabled={activePeriodObj?.is_closed}
                            style={{
                              width: '100%',
                              maxWidth: '130px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1.5px solid #6366f1',
                              backgroundColor: '#ffffff',
                              textAlign: 'right',
                              fontWeight: '700',
                              fontSize: '13px',
                              color: '#0f172a',
                              outline: 'none',
                              boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.08)'
                            }}
                            className="currency-font"
                          />
                        </td>

                        {/* 5-mo trend Sparkline */}
                        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '3px', height: '20px' }}>
                            {sparkHeights.map((h, sIdx) => {
                              const isCurrent = sIdx === sparkHeights.length - 1;
                              return (
                                <span
                                  key={sIdx}
                                  style={{
                                    width: '5px',
                                    height: `${h}px`,
                                    backgroundColor: isCurrent ? '#4f46e5' : '#cbd5e1',
                                    borderRadius: '2px'
                                  }}
                                  title={`${periods[sIdx]?.period_label}: ${formatINR(row.amounts[periods[sIdx]?.id])}`}
                                />
                              );
                            })}
                          </div>
                        </td>

                        {/* 5-mo total */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }} className="currency-font">
                          {formatINR(row.total)}
                        </td>

                        {/* Avg / mo */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }} className="currency-font">
                          {formatINR(row.avg)}
                        </td>

                        {/* Side Remark Input (Optional) */}
                        <td style={{ padding: '8px 16px', textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="text"
                              placeholder="Add remark..."
                              value={remarkVal}
                              onChange={(e) => handleRemarkChange?.(row.cost_head_id, editingPeriodId, e.target.value)}
                              disabled={activePeriodObj?.is_closed}
                              style={{
                                width: '100%',
                                padding: '5px 8px',
                                borderRadius: '4px',
                                border: remarkVal ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                                backgroundColor: remarkVal ? '#f5f7ff' : '#ffffff',
                                fontSize: '11.5px',
                                color: '#1e293b',
                                outline: 'none'
                              }}
                            />
                            {remarkVal && (
                              <span title={`Remark: ${remarkVal}`} style={{ color: '#4f46e5', display: 'flex', alignItems: 'center' }}>
                                <MessageSquare size={13} />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        );
      })}
    </div>
  );
}
