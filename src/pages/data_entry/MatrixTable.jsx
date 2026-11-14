import React from 'react';
import { formatINR } from '../../utils/formatters';
import { 
  MessageSquare, Users, Utensils, Award, Trash2, Plus, 
  Home, Bus, Fuel, Droplet, Zap, Wrench, ShieldCheck, CheckCircle2, BedDouble, AlertCircle 
} from 'lucide-react';

export default function MatrixTable({
  selectedModule = 'food',
  computedMatrix,
  editingPeriodId,
  setEditingPeriodId,
  activePeriodObj,
  matrixDraft,
  remarksDraft = {},
  censusDraft = {},
  hostelCensusDraft = {},
  transportCensusDraft = {},
  handleCellChange,
  handleRemarkChange,
  handleCensusChange,
  handleHostelCensusChange,
  handleTransportCensusChange,
  openAddCostHeadModal,
  handleDeleteCostHead,
  openAddCategoryModal
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

      {/* 4. TRANSPORT FLEET OPERATIONS & FLEET METRICS CARD (from transport.xlsx) */}
      {selectedModule === 'transport' && (() => {
        const currT = transportCensusDraft?.[currStr] || {};
        const prevT = prevStr ? (transportCensusDraft?.[prevStr] || {}) : {};

        const tVehicles = currT.vehicles_count !== undefined ? currT.vehicles_count : '18+1';
        const tPassengers = currT.passengers_count !== undefined ? currT.passengers_count : 447;
        const tStudents = currT.students_count !== undefined ? currT.students_count : 412;
        const tStaff = currT.staff_count !== undefined ? currT.staff_count : 35;

        const tApprKms = currT.approved_kms !== undefined ? currT.approved_kms : 26691;
        const tActKms = currT.actual_kms !== undefined ? currT.actual_kms : 25777;
        const tAddKms = currT.additional_kms !== undefined ? currT.additional_kms : 2481;

        const tDieselLtr = currT.diesel_litres !== undefined ? currT.diesel_litres : 5184.84;
        const tFuelCost = currT.fuel_expenses !== undefined ? currT.fuel_expenses : 487375;

        const tTicketsRaised = currT.service_tickets_raised !== undefined ? currT.service_tickets_raised : 38;
        const tTicketsClosed = currT.service_tickets_closed !== undefined ? currT.service_tickets_closed : 38;
        const tTicketsOpen = Math.max(0, (parseInt(tTicketsRaised, 10) || 0) - (parseInt(tTicketsClosed, 10) || 0));

        const tCompliance = currT.statutory_compliance !== undefined ? currT.statutory_compliance : 1;
        const tIncidents = currT.incidents_count !== undefined ? currT.incidents_count : 1;

        const tApprovedBudget = currT.approved_budget !== undefined ? currT.approved_budget : 13730137.73;
        const tSpentBudget = currT.cumulative_budget_spent !== undefined ? currT.cumulative_budget_spent : 0;
        const tBudgetBalance = (parseFloat(tApprovedBudget) || 0) - (parseFloat(tSpentBudget) || 0);

        // Previous values for MoM
        const pPassengers = prevT.passengers_count !== undefined ? parseInt(prevT.passengers_count, 10) : null;
        const pActKms = prevT.actual_kms !== undefined ? parseFloat(prevT.actual_kms) : null;
        const pDieselLtr = prevT.diesel_litres !== undefined ? parseFloat(prevT.diesel_litres) : null;

        return (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1.5px solid #fed7aa',
            boxShadow: '0 2px 6px rgba(249, 115, 22, 0.05)',
            overflow: 'hidden',
            marginTop: '6px'
          }}>
            {/* HEADER */}
            <div style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fff7ed',
              borderBottom: '1px solid #ffedd5',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#ea580c' }} />
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#7c2d12', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bus size={16} color="#ea580c" />
                  <span>Transport Fleet Operations & Trip Metrics</span>
                </h3>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#c2410c', backgroundColor: '#ffedd5', padding: '2px 8px', borderRadius: '4px' }}>
                  Fleet Master
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  backgroundColor: '#ffedd5',
                  color: '#9a3412'
                }}>
                  Fleet Size: <strong style={{ color: '#ea580c' }}>{tVehicles} Vehicles</strong>
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a'
                }}>
                  Commuters: <strong style={{ color: '#b45309' }}>{tPassengers.toLocaleString()} Persons</strong>
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '11.5px', fontWeight: '600' }}>
                    <th style={{ padding: '10px 20px', textAlign: 'left', width: '28%' }}>Transport Fleet Parameter</th>
                    {prevPeriod && (
                      <th style={{ padding: '10px 14px', textAlign: 'right', width: '15%' }}>
                        {prevPeriod.period_label} (Baseline)
                      </th>
                    )}
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '18%', color: '#ea580c', fontWeight: '700' }}>
                      {activePeriodObj?.period_label} • Edit Value
                    </th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: '16%' }}>
                      MoM Delta
                    </th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', width: '23%' }}>
                      Parameter Specification
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row: Number of Vehicles */}
                  <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 20px', fontWeight: '700', color: '#1e293b' }}>
                      Number of Vehicles (Fleet)
                    </td>
                    {prevPeriod && (
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>
                        {prevT.vehicles_count || '18+1'}
                      </td>
                    )}
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <input
                        type="text"
                        placeholder="18+1"
                        value={tVehicles}
                        onChange={(e) => handleTransportCensusChange?.('vehicles_count', e.target.value)}
                        disabled={activePeriodObj?.is_closed}
                        style={{ width: '130px', padding: '5px 8px', borderRadius: '5px', border: '1.5px solid #ea580c', textAlign: 'center', fontWeight: '700', fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#c2410c' }}>Active Fleet</span>
                    </td>
                    <td style={{ padding: '8px 16px', textAlign: 'left', fontSize: '11.5px', color: '#64748b' }}>
                      18 Institute Buses + 1 Ambulance / Van
                    </td>
                  </tr>

                  {/* Highlight Row: Total Passengers */}
                  <tr style={{ backgroundColor: '#fff7ed', borderBottom: '1.5px solid #fed7aa' }}>
                    <td style={{ padding: '12px 20px', fontWeight: '800', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={15} color="#ea580c" />
                      <span>Number of Students & Staff Travelling</span>
                    </td>
                    {prevPeriod && (
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#9a3412', fontWeight: '800' }}>
                        {pPassengers !== null ? pPassengers.toLocaleString() : '—'}
                      </td>
                    )}
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <input
                        type="number"
                        placeholder="Passengers"
                        value={tPassengers}
                        onChange={(e) => handleTransportCensusChange?.('passengers_count', e.target.value)}
                        disabled={activePeriodObj?.is_closed}
                        style={{ width: '130px', padding: '6px 10px', borderRadius: '6px', border: '1.5px solid #ea580c', textAlign: 'right', fontWeight: '800', fontSize: '13px' }}
                      />
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                      {renderDiffBadge(tPassengers, pPassengers)}
                    </td>
                    <td style={{ padding: '8px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: '700', color: '#c2410c' }}>
                      Registered campus bus commuters
                    </td>
                  </tr>

                  {/* Row: Trip Kilometres */}
                  <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 20px', fontWeight: '700', color: '#1e293b' }}>
                      Trip Kilometres (Approved / Actual / Addl)
                    </td>
                    {prevPeriod && (
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>
                        {pActKms !== null ? `${pActKms.toLocaleString()} KMs` : '—'}
                      </td>
                    )}
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <input
                          type="number"
                          placeholder="Approved"
                          value={tApprKms}
                          onChange={(e) => handleTransportCensusChange?.('approved_kms', e.target.value)}
                          disabled={activePeriodObj?.is_closed}
                          title="Approved Trip KMs"
                          style={{ width: '65px', padding: '5px 6px', borderRadius: '5px', border: '1.5px solid #ea580c', textAlign: 'right', fontWeight: '700', fontSize: '12px' }}
                        />
                        <input
                          type="number"
                          placeholder="Actual"
                          value={tActKms}
                          onChange={(e) => handleTransportCensusChange?.('actual_kms', e.target.value)}
                          disabled={activePeriodObj?.is_closed}
                          title="Actual Trip KMs"
                          style={{ width: '65px', padding: '5px 6px', borderRadius: '5px', border: '1.5px solid #ea580c', textAlign: 'right', fontWeight: '700', fontSize: '12px' }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#ea580c' }}>
                        Addl: {tAddKms} KMs
                      </span>
                    </td>
                    <td style={{ padding: '8px 16px', textAlign: 'left', fontSize: '11.5px', color: '#64748b' }}>
                      Approved: {tApprKms} | Actual: {tActKms}
                    </td>
                  </tr>

                  {/* Row: Diesel Purchase */}
                  <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 20px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Fuel size={14} color="#ea580c" />
                      <span>Diesel Purchase Qty & Fuel Cost</span>
                    </td>
                    {prevPeriod && (
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>
                        {pDieselLtr !== null ? `${pDieselLtr.toLocaleString()} Ltrs` : '—'}
                      </td>
                    )}
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Litres"
                          value={tDieselLtr}
                          onChange={(e) => handleTransportCensusChange?.('diesel_litres', e.target.value)}
                          disabled={activePeriodObj?.is_closed}
                          title="Diesel Qty Litres"
                          style={{ width: '65px', padding: '5px 6px', borderRadius: '5px', border: '1.5px solid #ea580c', textAlign: 'right', fontWeight: '700', fontSize: '12px' }}
                        />
                        <input
                          type="number"
                          placeholder="Cost"
                          value={tFuelCost}
                          onChange={(e) => handleTransportCensusChange?.('fuel_expenses', e.target.value)}
                          disabled={activePeriodObj?.is_closed}
                          title="Fuel Cost INR"
                          style={{ width: '75px', padding: '5px 6px', borderRadius: '5px', border: '1.5px solid #ea580c', textAlign: 'right', fontWeight: '700', fontSize: '12px' }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {renderDiffBadge(tDieselLtr, pDieselLtr)}
                    </td>
                    <td style={{ padding: '8px 16px', textAlign: 'left', fontSize: '11.5px', color: '#64748b' }} className="currency-font">
                      Fuel Spend: {formatINR(tFuelCost)}
                    </td>
                  </tr>

                  {/* Row: Service Tickets */}
                  <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 20px', fontWeight: '700', color: '#1e293b' }}>
                      Service Tickets (Raised / Closed / Open)
                    </td>
                    {prevPeriod && (
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>
                        {(parseInt(prevT.service_tickets_raised, 10) || 38).toLocaleString()}
                      </td>
                    )}
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <input
                          type="number"
                          placeholder="Raised"
                          value={tTicketsRaised}
                          onChange={(e) => handleTransportCensusChange?.('service_tickets_raised', e.target.value)}
                          disabled={activePeriodObj?.is_closed}
                          title="Tickets Raised"
                          style={{ width: '65px', padding: '5px 6px', borderRadius: '5px', border: '1.5px solid #ea580c', textAlign: 'right', fontWeight: '700', fontSize: '12px' }}
                        />
                        <input
                          type="number"
                          placeholder="Closed"
                          value={tTicketsClosed}
                          onChange={(e) => handleTransportCensusChange?.('service_tickets_closed', e.target.value)}
                          disabled={activePeriodObj?.is_closed}
                          title="Tickets Closed"
                          style={{ width: '65px', padding: '5px 6px', borderRadius: '5px', border: '1.5px solid #ea580c', textAlign: 'right', fontWeight: '700', fontSize: '12px' }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: '700', color: tTicketsOpen > 0 ? '#b91c1c' : '#15803d' }}>
                        Open: {tTicketsOpen} | Compl: {tCompliance}
                      </span>
                    </td>
                    <td style={{ padding: '8px 16px', textAlign: 'left', fontSize: '11.5px', color: '#64748b' }}>
                      Incidents reported: {tIncidents}
                    </td>
                  </tr>

                  {/* Row: Annual Approved Budget */}
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 20px', fontWeight: '700', color: '#1e293b' }}>
                      Transport Approved Budget & Balance
                    </td>
                    {prevPeriod && (
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontWeight: '600' }} className="currency-font">
                        {formatINR(tApprovedBudget)}
                      </td>
                    )}
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <input
                        type="number"
                        placeholder="Approved Budget"
                        value={tApprovedBudget}
                        onChange={(e) => handleTransportCensusChange?.('approved_budget', e.target.value)}
                        disabled={activePeriodObj?.is_closed}
                        style={{ width: '130px', padding: '5px 8px', borderRadius: '5px', border: '1.5px solid #64748b', textAlign: 'right', fontWeight: '700', fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857' }}>
                        Bal: {formatINR(tBudgetBalance)}
                      </span>
                    </td>
                    <td style={{ padding: '8px 16px', textAlign: 'left', fontSize: '11.5px', color: '#64748b' }}>
                      Cumulative Spent: {formatINR(tSpentBudget)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* COMPARATIVE UNIT METRICS STRIP */}
            {parseFloat(tActKms) > 0 && (
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
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>Transport Fleet Mileage & Efficiency:</span>
                  <span style={{ color: '#94a3b8' }}>({activePeriodObj?.period_label})</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#64748b' }}>KM / Vehicle / Day:</span>
                    <strong style={{ color: '#0f172a' }}>
                      {(parseFloat(tActKms) / 19 / 30).toFixed(1)} KMs
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#64748b' }}>Diesel / 100 KM:</span>
                    <strong style={{ color: '#ea580c' }}>
                      {((parseFloat(tDieselLtr) / parseFloat(tActKms)) * 100).toFixed(2)} Litres
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#64748b' }}>Fuel Cost / KM:</span>
                    <strong style={{ color: '#059669' }}>
                      ₹{(parseFloat(tFuelCost) / parseFloat(tActKms)).toFixed(2)} / KM
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#64748b' }}>Expense / Passenger:</span>
                    <strong style={{ color: '#2563eb' }}>
                      {formatINR(Math.round(parseFloat(tFuelCost) / (parseInt(tPassengers, 10) || 1)))}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    {/* 1. EXPENSE CATEGORIES TABLES (FINANCIAL MATRIX) */}
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
                {openAddCostHeadModal && (
                  <button
                    type="button"
                    onClick={() => openAddCostHeadModal(cat.category_id)}
                    title={`Add new line item into ${cat.category_name}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '2px 8px',
                      borderRadius: '5px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={11} />
                    <span>Add Item</span>
                  </button>
                )}
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
                        {/* Cost Head Name & Action */}
                        <td style={{ padding: '12px 20px', fontWeight: '600', color: '#1e293b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span>{row.description}</span>
                            {handleDeleteCostHead && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCostHead({ id: row.cost_head_id, name: row.description })}
                                title={`Delete line item "${row.description}"`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '3px',
                                  borderRadius: '4px',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  color: '#cbd5e1',
                                  cursor: 'pointer',
                                  transition: 'color 0.15s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#cbd5e1'}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
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

      {/* ADD NEW CATEGORY BUTTON */}
      {openAddCategoryModal && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '-4px', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={openAddCategoryModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1.5px dashed #cbd5e1',
              color: '#475569',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4f46e5';
              e.currentTarget.style.color = '#4f46e5';
              e.currentTarget.style.backgroundColor = '#f8faff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            <Plus size={14} />
            <span>Add New Category</span>
          </button>
        </div>
      )}

      {/* 2. DINING CENSUS & MEAL PRODUCTION HEADCOUNT CARD (DOWN IN THE LIST) */}
      {(!selectedModule || selectedModule === 'food') && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1.5px solid #c7d2fe',
          boxShadow: '0 2px 6px rgba(79, 70, 229, 0.04)',
          overflow: 'hidden',
          marginTop: '6px'
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
      )}

      </div>
  );
}
