import React, { useState, useEffect, useMemo } from 'react';
import { formatINR } from '../../utils/formatters';
import TransportVehicleExpensesTable from './TransportVehicleExpensesTable';
import { 
  Save, RefreshCw, CheckCircle2, Zap, Bus, 
  AlertCircle, Check, Copy, Settings,
  Users, Fuel, Wrench, ShieldCheck, DollarSign, School, ChevronRight, Calculator,
  TrendingUp, Award, Layers, Hash
} from 'lucide-react';

export const TRANSPORT_BRANCHES = [
  { 
    id: 'Common', 
    code: 'Common', 
    label: 'Common', 
    icon: '🚌', 
    badgeColor: '#d97706', 
    badgeBg: '#fef3c7',
    description: 'Central Campus Fleet • Shared shuttles, staff transit, central pool'
  },
  { 
    id: 'RPS', 
    code: 'RPS', 
    label: 'RPS Branch', 
    icon: '🏫', 
    badgeColor: '#7c3aed', 
    badgeBg: '#f3e8ff',
    description: 'Rathinam Public School Fleet • School buses, student commuter routes'
  },
  { 
    id: 'KPM', 
    code: 'KPM', 
    label: 'KPM Branch', 
    icon: '🏫', 
    badgeColor: '#059669', 
    badgeBg: '#d1fae5',
    description: 'KPM Matriculation School Fleet • Dedicated student transit routes'
  },
  { 
    id: 'University', 
    code: 'University', 
    label: 'University Fleet', 
    icon: '🎓', 
    badgeColor: '#dc2626', 
    badgeBg: '#fee2e2',
    description: 'Rathinam University Main Fleet • College buses & commuter transit'
  },
  { 
    id: 'all', 
    code: 'all', 
    label: 'All Branches (Consolidated)', 
    icon: '🏢', 
    badgeColor: '#0284c7', 
    badgeBg: '#e0f2fe',
    description: 'Consolidated view • Combined metrics for all 4 institutions'
  }
];

// Fallback section styling palette matching the uploaded image exactly
const SECTION_STYLES = {
  'Fleet Operations & Distance': {
    headerBg: '#f8fafc',
    headerText: '#1e293b',
    rowBg: '#ffffff',
    border: '#cbd5e1',
    accent: '#3b82f6'
  },
  'Fleet Expenses & Operations': {
    headerBg: '#fed7aa',
    headerText: '#9a3412',
    rowBg: '#ffedd5',
    border: '#fdba74',
    accent: '#ea580c',
    totalBg: '#86efac' // Bright lime green total row
  },
  'Revenue, Deductions & Income': {
    headerBg: '#fef3c7',
    headerText: '#92400e',
    rowBg: '#fef3c7',
    border: '#fde68a',
    accent: '#d97706',
    totalBg: '#fef3c7'
  },
  'Operating Budget & Balance': {
    headerBg: '#dcfce7',
    headerText: '#166534',
    rowBg: '#dcfce7',
    border: '#86efac',
    accent: '#16a34a',
    totalBg: '#86efac' // Bright lime green balance row
  },
  'Service Tickets & Compliance': {
    headerBg: '#f3e8ff',
    headerText: '#6b21a8',
    rowBg: '#f3e8ff',
    border: '#d8b4fe',
    accent: '#9333ea'
  },
  'Fuel & Energy Consumption': {
    headerBg: '#f1f5f9',
    headerText: '#334155',
    rowBg: '#ffffff',
    border: '#cbd5e1',
    accent: '#64748b'
  },
  'Student Transport Fee Analytics': {
    headerBg: '#fef08a',
    headerText: '#854d0e',
    rowBg: '#fef08a',
    border: '#facc15',
    accent: '#ca8a04',
    totalBg: '#86efac'
  }
};

export const CANONICAL_TRANSPORT_PARAMETERS = [
  // Section 1: Fleet Operations & Distance (White)
  { id: 1, s_no: '1', param_key: 'vehicles_count', param_name: 'Number of vehicles', section: 'Fleet Operations & Distance', section_order: 1, display_order: 1, input_type: 'text', unit: 'Fleet' },
  { id: 2, s_no: '2', param_key: 'passengers_count', param_name: 'Number of students & staff travelling', section: 'Fleet Operations & Distance', section_order: 1, display_order: 2, input_type: 'single_count', unit: 'Persons' },
  { id: 3, s_no: '3', param_key: 'approved_kms', param_name: 'Approved trip KMs', section: 'Fleet Operations & Distance', section_order: 1, display_order: 3, input_type: 'single_number', unit: 'KMs' },
  { id: 4, s_no: '4', param_key: 'actual_kms', param_name: 'Actual trip KMs', section: 'Fleet Operations & Distance', section_order: 1, display_order: 4, input_type: 'single_number', unit: 'KMs' },
  { id: 5, s_no: '5', param_key: 'excess_minus_kms_rps', param_name: 'Execess/ minus KMs run for RPS', section: 'Fleet Operations & Distance', section_order: 1, display_order: 5, input_type: 'single_number', unit: 'KMs', formula: 'actual_kms - approved_kms' },
  { id: 6, s_no: '6', param_key: 'excess_kms_billed_rps', param_name: 'Execess KM to be billed for RPS', section: 'Fleet Operations & Distance', section_order: 1, display_order: 6, input_type: 'single_number', unit: 'KMs' },
  { id: 7, s_no: '7', param_key: 'additional_kms', param_name: 'Additional KMs run', section: 'Fleet Operations & Distance', section_order: 1, display_order: 7, input_type: 'single_number', unit: 'KMs' },

  // Section 2: Fleet Expenses & Operations (Orange, lime green total)
  { id: 8, s_no: '8', param_key: 'fuel_expenses', param_name: 'Fuel expenses (Rs)', section: 'Fleet Expenses & Operations', section_order: 2, display_order: 8, input_type: 'cost', unit: 'INR (₹)' },
  { id: 9, s_no: '9', param_key: 'fc_cost', param_name: 'FC 2025-2026', section: 'Fleet Expenses & Operations', section_order: 2, display_order: 9, input_type: 'cost', unit: 'INR (₹)' },
  { id: 10, s_no: '10', param_key: 'statutory_cost', param_name: 'Vehicle Statutory', section: 'Fleet Expenses & Operations', section_order: 2, display_order: 10, input_type: 'cost', unit: 'INR (₹)' },
  { id: 11, s_no: '11', param_key: 'repair_maintenance_cost', param_name: 'Repair & Maintenance', section: 'Fleet Expenses & Operations', section_order: 2, display_order: 11, input_type: 'cost', unit: 'INR (₹)' },
  { id: 12, s_no: '12', param_key: 'other_cost', param_name: 'Others', section: 'Fleet Expenses & Operations', section_order: 2, display_order: 12, input_type: 'cost', unit: 'INR (₹)' },
  { id: 13, s_no: '13', param_key: 'employee_cost', param_name: 'Transport Employees Cost', section: 'Fleet Expenses & Operations', section_order: 2, display_order: 13, input_type: 'cost', unit: 'INR (₹)' },
  { id: 14, s_no: '14', param_key: 'total_expenses', param_name: 'Total Expenses', section: 'Fleet Expenses & Operations', section_order: 2, display_order: 14, input_type: 'cost', unit: 'INR (₹)', formula: 'SUM(Fuel + FC + Statutory + Repair + Others + Employees Cost)' },

  // Section 3: Revenue, Deductions & Income (Tan)
  { id: 15, s_no: '15', param_key: 'students_count_income', param_name: 'Students count', section: 'Revenue, Deductions & Income', section_order: 3, display_order: 15, input_type: 'single_count', unit: 'Students' },
  { id: 16, s_no: '16', param_key: 'staff_count_income', param_name: 'Staff Count', section: 'Revenue, Deductions & Income', section_order: 3, display_order: 16, input_type: 'single_count', unit: 'Staff' },
  { id: 17, s_no: '17', param_key: 'fee_demand', param_name: 'Demand', section: 'Revenue, Deductions & Income', section_order: 3, display_order: 17, input_type: 'cost', unit: 'INR (₹)' },
  { id: 18, s_no: '18', param_key: 'fee_collected', param_name: 'Paid', section: 'Revenue, Deductions & Income', section_order: 3, display_order: 18, input_type: 'cost', unit: 'INR (₹)' },
  { id: 19, s_no: '19', param_key: 'fee_unpaid', param_name: 'Unpaid', section: 'Revenue, Deductions & Income', section_order: 3, display_order: 19, input_type: 'cost', unit: 'INR (₹)', formula: 'Demand - Paid' },
  { id: 20, s_no: '20', param_key: 'rps_monthly_billing', param_name: 'RPS monthly billing', section: 'Revenue, Deductions & Income', section_order: 3, display_order: 20, input_type: 'cost', unit: 'INR (₹)' },
  { id: 21, s_no: '21', param_key: 'staff_travel_deduction', param_name: 'Staff Travel Deduction', section: 'Revenue, Deductions & Income', section_order: 3, display_order: 21, input_type: 'cost', unit: 'INR (₹)' },
  { id: 22, s_no: '22', param_key: 'additional_kms_billed_rps', param_name: 'Additional KMs Billed for RPS', section: 'Revenue, Deductions & Income', section_order: 3, display_order: 22, input_type: 'cost', unit: 'INR (₹)' },
  { id: 23, s_no: '23', param_key: 'additional_kms_others_billing', param_name: 'Additional KMs run for others Billing', section: 'Revenue, Deductions & Income', section_order: 3, display_order: 23, input_type: 'cost', unit: 'INR (₹)' },
  { id: 24, s_no: '24', param_key: 'cumulative_income', param_name: 'Cumulative Income', section: 'Revenue, Deductions & Income', section_order: 3, display_order: 24, input_type: 'cost', unit: 'INR (₹)', formula: 'Paid + RPS Billing + Staff Deduction + Addl KMs + Cab Billing' },

  // Section 4: Operating Budget & Balance (Light Green, lime green balance)
  { id: 25, s_no: '25', param_key: 'approved_budget', param_name: 'Approved Budget', section: 'Operating Budget & Balance', section_order: 4, display_order: 25, input_type: 'cost', unit: 'INR (₹)' },
  { id: 26, s_no: '26', param_key: 'cumulative_budget_spent', param_name: 'Cumulative Budget spent (Actual expenses) till now', section: 'Operating Budget & Balance', section_order: 4, display_order: 26, input_type: 'cost', unit: 'INR (₹)' },
  { id: 27, s_no: '27', param_key: 'balance', param_name: 'Balance', section: 'Operating Budget & Balance', section_order: 4, display_order: 27, input_type: 'cost', unit: 'INR (₹)', formula: 'Approved Budget - Cumulative Budget Spent' },

  // Section 5: Service Tickets & Compliance (Purple)
  { id: 28, s_no: '30', param_key: 'service_tickets_raised', param_name: 'No. of Service Tickets Raised', section: 'Service Tickets & Compliance', section_order: 5, display_order: 28, input_type: 'single_count', unit: 'Tickets' },
  { id: 29, s_no: '31', param_key: 'service_tickets_closed', param_name: 'No. of Service Tickets closed', section: 'Service Tickets & Compliance', section_order: 5, display_order: 29, input_type: 'single_count', unit: 'Tickets' },
  { id: 30, s_no: '32', param_key: 'service_tickets_open', param_name: 'No. of Service Tickets in Open', section: 'Service Tickets & Compliance', section_order: 5, display_order: 30, input_type: 'single_count', unit: 'Tickets', formula: 'Raised - Closed' },
  { id: 31, s_no: '33', param_key: 'quality_issues_received', param_name: 'No. of Quality issues Received', section: 'Service Tickets & Compliance', section_order: 5, display_order: 31, input_type: 'single_count', unit: 'Issues' },
  { id: 32, s_no: '34', param_key: 'quality_issues_closed', param_name: 'No. of Quality issues Closed', section: 'Service Tickets & Compliance', section_order: 5, display_order: 32, input_type: 'single_count', unit: 'Issues' },
  { id: 33, s_no: '35', param_key: 'quality_issues_open', param_name: 'No. of Quality issues in Open', section: 'Service Tickets & Compliance', section_order: 5, display_order: 33, input_type: 'single_count', unit: 'Issues', formula: 'Received - Closed' },
  { id: 34, s_no: '28', param_key: 'statutory_compliance', param_name: 'Statuory compliance', section: 'Service Tickets & Compliance', section_order: 5, display_order: 34, input_type: 'single_count', unit: 'Score' },
  { id: 35, s_no: '29', param_key: 'incidents_count', param_name: 'No. of Incidents', section: 'Service Tickets & Compliance', section_order: 5, display_order: 35, input_type: 'single_count', unit: 'Incidents' },

  // Section 6: Fuel & Energy Consumption (White)
  { id: 36, s_no: '36', param_key: 'diesel_litres', param_name: 'Diesel Purchase Qty (Litres)', section: 'Fuel & Energy Consumption', section_order: 6, display_order: 36, input_type: 'single_number', unit: 'Litres' },

  // Section 7: Student Transport Fee Analytics (Yellow)
  { id: 37, s_no: '29', param_key: 'students_count_fee', param_name: 'Students count', section: 'Student Transport Fee Analytics', section_order: 7, display_order: 37, input_type: 'single_count', unit: 'Students' },
  { id: 38, s_no: '30', param_key: 'demand_fee', param_name: 'Demand', section: 'Student Transport Fee Analytics', section_order: 7, display_order: 38, input_type: 'cost', unit: 'INR (₹)' },
  { id: 39, s_no: '31', param_key: 'fee_discount', param_name: 'Discount', section: 'Student Transport Fee Analytics', section_order: 7, display_order: 39, input_type: 'cost', unit: 'INR (₹)' },
  { id: 40, s_no: '32', param_key: 'paid_fee', param_name: 'Paid', section: 'Student Transport Fee Analytics', section_order: 7, display_order: 40, input_type: 'cost', unit: 'INR (₹)' },
  { id: 41, s_no: '33', param_key: 'unpaid_fee', param_name: 'Unpaid', section: 'Student Transport Fee Analytics', section_order: 7, display_order: 41, input_type: 'cost', unit: 'INR (₹)', formula: 'Demand - Discount - Paid' },
  { id: 42, s_no: '34', param_key: 'per_student_cost_expenses', param_name: 'Per student cost expenses', section: 'Student Transport Fee Analytics', section_order: 7, display_order: 42, input_type: 'cost', unit: 'INR (₹)', formula: 'Total Expenses / Students Count' },
  { id: 43, s_no: '', param_key: 'per_student_fee_year', param_name: 'per student fee per year', section: 'Student Transport Fee Analytics', section_order: 7, display_order: 43, input_type: 'cost', unit: 'INR (₹)', formula: 'Demand / Students Count' },
  { id: 44, s_no: '', param_key: 'demand_per_km_day', param_name: 'Demand per km per day', section: 'Student Transport Fee Analytics', section_order: 7, display_order: 44, input_type: 'cost', unit: 'INR (₹)', formula: 'Demand / (Actual KMs * 30)' },
  { id: 45, s_no: '', param_key: 'km_per_veh_day', param_name: 'km/veh/day', section: 'Student Transport Fee Analytics', section_order: 7, display_order: 45, input_type: 'single_number', unit: 'KM/Veh/Day', formula: 'Actual KMs / (Vehicles * 30)' },
  { id: 46, s_no: '', param_key: 'cumulative_demand_per_km', param_name: 'Cumulative demand per KM', section: 'Student Transport Fee Analytics', section_order: 7, display_order: 46, input_type: 'cost', unit: 'INR (₹)', formula: 'Demand / Actual KMs' },
  { id: 47, s_no: '37', param_key: 'cab_billing', param_name: 'Cab request Billing', section: 'Student Transport Fee Analytics', section_order: 7, display_order: 47, input_type: 'cost', unit: 'INR (₹)' }
];

import TransportCardSpreadsheet from './cards/TransportCardSpreadsheet';

export default function TransportSpreadsheetEntry({
  activePeriodObj,
  computedMatrix,
  editingPeriodId,
  setEditingPeriodId,
  transportCensusDraft = {},
  handleTransportCensusChange,
  fetchData,
  handleCloneFromPrev,
  handleToggleLock
}) {
  const [activeBranch, setActiveBranch] = useState('RPS');
  const [activeView, setActiveView] = useState('sheet'); // 'sheet' (Page 1 Entry: Master Spreadsheet) or 'vehicles' (Page 2 Entry: Vehicle Wise Ledger)
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);
  const [parameters, setParameters] = useState(CANONICAL_TRANSPORT_PARAMETERS);
  const [loadingParams, setLoadingParams] = useState(true);
  const [localMessage, setLocalMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Per-branch local edit buffers: { [branch]: { [periodId]: { [param_key]: val } } }
  const [branchDrafts, setBranchDrafts] = useState({});

  const isClosed = !!activePeriodObj?.is_closed;
  const periods = computedMatrix?.periods || [];
  const currPeriodIdStr = String(editingPeriodId);
  const activeBranchObj = TRANSPORT_BRANCHES.find(b => b.id === activeBranch) || TRANSPORT_BRANCHES[1] || TRANSPORT_BRANCHES[0];

  // Default to Sep 1st to 30th (period 29) if available and not yet selected
  useEffect(() => {
    if (setEditingPeriodId && periods.length > 0) {
      const sepPeriod = periods.find(p => p.period_label && (p.period_label.toLowerCase().includes('sep') || p.period_label.toLowerCase().includes('sept')))
        || periods.find(p => p.period_code && (p.period_code.endsWith('-09') || p.period_code.includes('09')))
        || periods.find(p => p.id === 30 || p.id === 29)
        || periods[0];
      if (sepPeriod && (!editingPeriodId || editingPeriodId === 12 || editingPeriodId === 27 || editingPeriodId === 28)) {
        setEditingPeriodId(sepPeriod.id);
      }
    }
  }, [periods, editingPeriodId, setEditingPeriodId]);

  // Fetch parameters from Master Data API
  const fetchParameters = async () => {
    try {
      setLoadingParams(true);
      const res = await fetch('/api/transport/parameters');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setParameters(data);
        }
      }
    } catch (err) {
      console.error('Error fetching transport parameters:', err);
    } finally {
      setLoadingParams(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, []);

  // Safe numeric parser
  const num = (v, defaultVal = 0) => {
    if (v === undefined || v === null || v === '') return defaultVal;
    if (typeof v === 'number') return isNaN(v) ? defaultVal : v;
    const cleaned = String(v).replace(/,/g, '').replace(/₹/g, '').replace(/%/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  // Helper to get raw stored value for a given branch, period, and parameter key
  const getParamRawValue = (branchId, periodIdStr, paramKey) => {
    // 1. Check local unsaved draft for this SPECIFIC branch and period
    const localVal = branchDrafts[branchId]?.[periodIdStr]?.[paramKey];
    if (localVal !== undefined && localVal !== null) return localVal;

    // 2. Check parent transportCensusDraft for this SPECIFIC branch and period
    const parentVal = transportCensusDraft?.[branchId]?.[periodIdStr]?.[paramKey];
    if (parentVal !== undefined && parentVal !== null) return parentVal;

    // 3. Check computedMatrix.transport_census_by_branch from backend for this SPECIFIC branch and period
    const dbBranchData = computedMatrix?.transport_census_by_branch?.[branchId]?.[periodIdStr];
    if (dbBranchData && dbBranchData[paramKey] !== undefined && dbBranchData[paramKey] !== null) {
      return dbBranchData[paramKey];
    }

    // 4. Default for new month / unentered values: clean zero
    if (paramKey === 'vehicles_count') return '0';
    return 0;
  };

  // Helper to compute a branch's full metrics dictionary (with formulas calculated) for a period
  const computeBranchMetrics = (branchId, periodIdStr) => {
    // If Consolidated 'all', aggregate across the 4 real branches
    if (branchId === 'all') {
      const realBranches = ['Common', 'RPS', 'KPM', 'University'];
      const branchMetricsList = realBranches.map(b => computeBranchMetrics(b, periodIdStr));
      const vehList = [];
      let totPassengers = 0;
      let totApprovedKms = 0;
      let totActualKms = 0;
      let totAdditionalKms = 0;
      let totDieselLitres = 0;
      let totFuelExp = 0;
      let totFc = 0;
      let totStatutory = 0;
      let totRepair = 0;
      let totOther = 0;
      let totEmp = 0;
      let totFeeDemand = 0;
      let totFeeDiscount = 0;
      let totFeePaid = 0;
      let totRpsBilling = 0;
      let totStaffDeduction = 0;
      let totAddKmsRps = 0;
      let totAddKmsOthers = 0;
      let totCabBilling = 0;
      let totApprovedBudget = 0;
      let totCumulativeBudgetSpent = 0;
      let totTicketsRaised = 0;
      let totTicketsClosed = 0;
      let totQualityRec = 0;
      let totQualityCls = 0;
      let totIncidents = 0;

      branchMetricsList.forEach((m, idx) => {
        const bCode = realBranches[idx];
        if (m.vehicles_count) vehList.push(`${bCode}: ${m.vehicles_count}`);
        totPassengers += num(m.passengers_count);
        totApprovedKms += num(m.approved_kms);
        totActualKms += num(m.actual_kms);
        totAdditionalKms += num(m.additional_kms);
        totDieselLitres += num(m.diesel_litres);
        totFuelExp += num(m.fuel_expenses);
        totFc += num(m.fc_cost);
        totStatutory += num(m.statutory_cost);
        totRepair += num(m.repair_maintenance_cost);
        totOther += num(m.other_cost);
        totEmp += num(m.employee_cost);
        totFeeDemand += num(m.fee_demand);
        totFeeDiscount += num(m.fee_discount);
        totFeePaid += num(m.fee_collected);
        totRpsBilling += num(m.rps_monthly_billing);
        totStaffDeduction += num(m.staff_travel_deduction);
        totAddKmsRps += num(m.additional_kms_billed_rps);
        totAddKmsOthers += num(m.additional_kms_others_billing);
        totCabBilling += num(m.cab_billing);
        totApprovedBudget += num(m.approved_budget);
        totCumulativeBudgetSpent += num(m.cumulative_budget_spent);
        totTicketsRaised += num(m.service_tickets_raised);
        totTicketsClosed += num(m.service_tickets_closed);
        totQualityRec += num(m.quality_issues_received);
        totQualityCls += num(m.quality_issues_closed);
        totIncidents += num(m.incidents_count);
      });

      const totExpenses = totFuelExp + totFc + totStatutory + totRepair + totOther + totEmp;
      const totCumIncome = totFeePaid + totRpsBilling + totStaffDeduction + totAddKmsRps + totAddKmsOthers + totCabBilling;
      const totBal = totApprovedBudget - totCumulativeBudgetSpent;
      const totFeeUnpaid = Math.max(0, totFeeDemand - totFeeDiscount - totFeePaid);
      const totTicketsOpen = Math.max(0, totTicketsRaised - totTicketsClosed);
      const totQualityOpen = Math.max(0, totQualityRec - totQualityCls);

      return {
        vehicles_count: vehList.join(' / ') || '0 fleet',
        passengers_count: totPassengers,
        approved_kms: totApprovedKms,
        actual_kms: totActualKms,
        excess_minus_kms_rps: Math.round(totActualKms - totApprovedKms),
        excess_kms_billed_rps: 0,
        additional_kms: totAdditionalKms,
        fuel_expenses: totFuelExp,
        fc_cost: totFc,
        statutory_cost: totStatutory,
        repair_maintenance_cost: totRepair,
        other_cost: totOther,
        employee_cost: totEmp,
        total_expenses: totExpenses,
        students_count_income: totPassengers,
        staff_count_income: 0,
        fee_demand: totFeeDemand,
        fee_collected: totFeePaid,
        fee_unpaid: totFeeUnpaid,
        rps_monthly_billing: totRpsBilling,
        staff_travel_deduction: totStaffDeduction,
        additional_kms_billed_rps: totAddKmsRps,
        additional_kms_others_billing: totAddKmsOthers,
        cumulative_income: totCumIncome,
        approved_budget: totApprovedBudget,
        cumulative_budget_spent: totCumulativeBudgetSpent,
        balance: totBal,
        service_tickets_raised: totTicketsRaised,
        service_tickets_closed: totTicketsClosed,
        service_tickets_open: totTicketsOpen,
        quality_issues_received: totQualityRec,
        quality_issues_closed: totQualityCls,
        quality_issues_open: totQualityOpen,
        statutory_compliance: 1,
        incidents_count: totIncidents,
        diesel_litres: totDieselLitres,
        students_count_fee: totPassengers,
        demand_fee: totFeeDemand,
        fee_discount: totFeeDiscount,
        paid_fee: totFeePaid,
        unpaid_fee: totFeeUnpaid,
        per_student_cost_expenses: totPassengers > 0 ? Math.round(totExpenses / totPassengers) : 0,
        per_student_fee_year: totPassengers > 0 ? Math.round(totFeeDemand / totPassengers) : 0,
        demand_per_km_day: totActualKms > 0 ? (totFeeDemand / (totActualKms * 30)).toFixed(2) : '0.00',
        km_per_veh_day: (totActualKms > 0 && vehList.length > 0) ? (totActualKms / (vehList.length * 30)).toFixed(2) : '0.00',
        cumulative_demand_per_km: totActualKms > 0 ? (totFeeDemand / totActualKms).toFixed(2) : '0.00',
        cab_billing: totCabBilling
      };
    }

    // Single real branch calculations:
    const g = (k) => num(getParamRawValue(branchId, periodIdStr, k), 0);

    const vehicles_count = String(getParamRawValue(branchId, periodIdStr, 'vehicles_count') ?? '0');
    const passengers_count = g('passengers_count');
    const approved_kms = g('approved_kms');
    const actual_kms = g('actual_kms');
    const excess_minus_kms_rps = actual_kms - approved_kms; // Formula: Actual - Approved
    const excess_kms_billed_rps = g('excess_kms_billed_rps');
    const additional_kms = g('additional_kms');

    // Section 2: Fleet Expenses & Operations
    const fuel_expenses = g('fuel_expenses');
    const fc_cost = g('fc_cost');
    const statutory_cost = g('statutory_cost');
    const repair_maintenance_cost = g('repair_maintenance_cost');
    const other_cost = g('other_cost');
    const employee_cost = g('employee_cost');
    
    // Formula: Total Expenses = Fuel + FC + Statutory + Repair + Others + Employees Cost
    const total_expenses = fuel_expenses + fc_cost + statutory_cost + repair_maintenance_cost + other_cost + employee_cost;

    // Section 3: Revenue, Deductions & Income
    const students_count_income = g('students_count_income');
    const staff_count_income = g('staff_count_income');
    const fee_demand = g('fee_demand');
    const fee_collected = g('fee_collected');
    const fee_unpaid = Math.max(0, fee_demand - fee_collected);
    const rps_monthly_billing = g('rps_monthly_billing');
    const staff_travel_deduction = g('staff_travel_deduction');
    const additional_kms_billed_rps = g('additional_kms_billed_rps');
    const additional_kms_others_billing = g('additional_kms_others_billing');
    const cab_billing = g('cab_billing');

    // Formula: Cumulative Income = Paid + RPS monthly billing + Staff Travel Deduction + Additional KMs Billed + Others Billing + Cab billing
    const cumulative_income = fee_collected + rps_monthly_billing + staff_travel_deduction + additional_kms_billed_rps + additional_kms_others_billing + cab_billing;

    // Section 4: Operating Budget & Balance
    const approved_budget = g('approved_budget');
    const cumulative_budget_spent = g('cumulative_budget_spent');
    // Formula: Balance = Approved Budget - Cumulative Budget spent
    const balance = approved_budget - cumulative_budget_spent;

    // Section 5: Service Tickets & Compliance
    const service_tickets_raised = g('service_tickets_raised');
    const service_tickets_closed = g('service_tickets_closed');
    const service_tickets_open = Math.max(0, service_tickets_raised - service_tickets_closed);

    const quality_issues_received = g('quality_issues_received');
    const quality_issues_closed = g('quality_issues_closed');
    const quality_issues_open = Math.max(0, quality_issues_received - quality_issues_closed);

    const statutory_compliance = g('statutory_compliance') || 1;
    const incidents_count = g('incidents_count');

    // Section 6: Fuel Purchase
    const diesel_litres = g('diesel_litres');

    // Section 7: Student Transport Fee Analytics
    const students_count_fee = g('students_count_fee') || students_count_income;
    const demand_fee = g('demand_fee') || fee_demand;
    const fee_discount = g('fee_discount');
    const paid_fee = g('paid_fee') || fee_collected;
    const unpaid_fee = Math.max(0, demand_fee - fee_discount - paid_fee);

    // Formula: Per student cost expenses = Total Expenses / Students Count
    const per_student_cost_expenses = students_count_income > 0 ? Math.round(total_expenses / students_count_income) : (passengers_count > 0 ? Math.round(total_expenses / passengers_count) : 0);
    const per_student_fee_year = students_count_income > 0 ? Math.round(demand_fee / students_count_income) : 0;
    const demand_per_km_day = actual_kms > 0 ? (demand_fee / (actual_kms * 30)).toFixed(2) : '0.00';
    const numVehicles = parseFloat(vehicles_count) || 0;
    const km_per_veh_day = numVehicles > 0 && actual_kms > 0 ? (actual_kms / (numVehicles * 30)).toFixed(2) : '0.00';
    const cumulative_demand_per_km = actual_kms > 0 ? (demand_fee / actual_kms).toFixed(2) : '0.00';

    return {
      vehicles_count,
      passengers_count,
      approved_kms,
      actual_kms,
      excess_minus_kms_rps,
      excess_kms_billed_rps,
      additional_kms,
      fuel_expenses,
      fc_cost,
      statutory_cost,
      repair_maintenance_cost,
      other_cost,
      employee_cost,
      total_expenses,
      students_count_income,
      staff_count_income,
      fee_demand,
      fee_collected,
      fee_unpaid,
      rps_monthly_billing,
      staff_travel_deduction,
      additional_kms_billed_rps,
      additional_kms_others_billing,
      cumulative_income,
      approved_budget,
      cumulative_budget_spent,
      balance,
      service_tickets_raised,
      service_tickets_closed,
      service_tickets_open,
      quality_issues_received,
      quality_issues_closed,
      quality_issues_open,
      statutory_compliance,
      incidents_count,
      diesel_litres,
      students_count_fee,
      demand_fee,
      fee_discount,
      paid_fee,
      unpaid_fee,
      per_student_cost_expenses,
      per_student_fee_year,
      demand_per_km_day,
      km_per_veh_day,
      cumulative_demand_per_km,
      cab_billing
    };
  };

  // Active metrics for the currently selected branch and focus month
  const activeMetrics = useMemo(() => {
    return computeBranchMetrics(activeBranch, currPeriodIdStr);
  }, [activeBranch, currPeriodIdStr, branchDrafts, transportCensusDraft, computedMatrix]);

  // Handle cell edit in local state
  const handleCellEdit = (paramKey, value, periodIdStr = currPeriodIdStr) => {
    if (activeBranch === 'all') return; // Consolidated is calculated & read-only
    setBranchDrafts(prev => ({
      ...prev,
      [activeBranch]: {
        ...(prev[activeBranch] || {}),
        [periodIdStr]: {
          ...((prev[activeBranch] || {})[periodIdStr] || {}),
          [paramKey]: value
        }
      }
    }));
    // Also notify parent if current editing period with activeBranch
    if (handleTransportCensusChange && periodIdStr === currPeriodIdStr) {
      handleTransportCensusChange(activeBranch, paramKey, value, editingPeriodId);
    }
  };

  // Group parameters dynamically by section
  const groupedParameters = useMemo(() => {
    const map = new Map();
    // Default sections order
    const defaultSections = [
      'Fleet Operations & Distance',
      'Fleet Expenses & Operations',
      'Revenue, Deductions & Income',
      'Operating Budget & Balance',
      'Service Tickets & Compliance',
      'Fuel & Energy Consumption',
      'Student Transport Fee Analytics'
    ];
    defaultSections.forEach(s => map.set(s, []));

    // Place active parameters into their section
    parameters.forEach(p => {
      const sec = p.section || 'General Operations';
      if (!map.has(sec)) {
        map.set(sec, []);
      }
      map.get(sec).push(p);
    });

    // Remove empty sections
    const result = [];
    map.forEach((items, sectionName) => {
      if (items.length > 0) {
        // Sort items by display_order
        items.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        result.push({
          sectionName,
          items,
          style: SECTION_STYLES[sectionName] || {
            headerBg: '#f8fafc',
            headerText: '#334155',
            rowBg: '#ffffff',
            border: '#e2e8f0',
            accent: '#0284c7'
          }
        });
      }
    });
    return result;
  }, [parameters]);

  // Save current branch's transport census to PostgreSQL
  const handleSaveActiveBranch = async () => {
    if (activeBranch === 'all') {
      setLocalMessage({
        type: 'error',
        text: 'Consolidated view is auto-calculated. Please select an individual branch (RPS, KPM, Common, or University) to save entries.'
      });
      setTimeout(() => setLocalMessage(null), 5000);
      return;
    }

    try {
      setIsSaving(true);
      setLocalMessage(null);

      // Merge computed metrics and any custom drafts for this period
      const payload = {
        branch: activeBranch,
        ...activeMetrics,
        ...(branchDrafts[activeBranch]?.[currPeriodIdStr] || {}),
        custom_metrics: {
          ...(branchDrafts[activeBranch]?.[currPeriodIdStr] || {})
        }
      };

      const res = await fetch(`/api/transport-census/${editingPeriodId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save transport parameters');
      }

      setLocalMessage({
        type: 'success',
        text: `Transport spreadsheet for ${activeBranchObj.label} (${activePeriodObj?.period_label || 'Current Period'}) saved to PostgreSQL successfully!`
      });

      // Clear the local draft for this branch and period so it now reads saved data from DB
      setBranchDrafts(prev => {
        const next = { ...prev };
        if (next[activeBranch]) {
          const nextBranch = { ...next[activeBranch] };
          delete nextBranch[currPeriodIdStr];
          next[activeBranch] = nextBranch;
        }
        return next;
      });

      if (fetchData) await fetchData('transport');
    } catch (err) {
      setLocalMessage({
        type: 'error',
        text: err.message || 'Error saving transport spreadsheet'
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setLocalMessage(null), 5000);
    }
  };

  // Copy values from previous month
  const handleCopyFromPreviousMonth = () => {
    if (activeBranch === 'all') {
      setLocalMessage({
        type: 'error',
        text: 'Please select an individual branch to copy previous month values.'
      });
      setTimeout(() => setLocalMessage(null), 4000);
      return;
    }

    const curIdx = periods.findIndex(p => String(p.id) === currPeriodIdStr);
    if (curIdx <= 0) {
      setLocalMessage({
        type: 'error',
        text: 'No previous month found in the academic calendar to copy from.'
      });
      setTimeout(() => setLocalMessage(null), 4000);
      return;
    }

    const prevP = periods[curIdx - 1];
    const prevMetrics = computeBranchMetrics(activeBranch, String(prevP.id));
    if (!prevMetrics || Object.keys(prevMetrics).length === 0) {
      setLocalMessage({
        type: 'error',
        text: `Previous month (${prevP.period_label}) has no recorded parameters to copy.`
      });
      setTimeout(() => setLocalMessage(null), 4000);
      return;
    }

    // Apply previous month metrics to active period draft
    setBranchDrafts(prev => ({
      ...prev,
      [activeBranch]: {
        ...(prev[activeBranch] || {}),
        [currPeriodIdStr]: {
          ...((prev[activeBranch] || {})[currPeriodIdStr] || {}),
          ...prevMetrics
        }
      }
    }));

    if (handleTransportCensusChange) {
      handleTransportCensusChange(prevMetrics, null, editingPeriodId);
    }

    setLocalMessage({
      type: 'success',
      text: `Values cleanly copied from ${prevP.period_label} for ${activeBranchObj.label}. Review and click Save.`
    });
    setTimeout(() => setLocalMessage(null), 5000);
  };

  // Sort parameters canonically by display_order to match the user's Master Data sequence 1-to-1
  const canonicalParameters = useMemo(() => {
    return [...parameters].sort((a, b) => {
      const aOrd = a.display_order !== undefined && a.display_order !== null ? a.display_order : 9999;
      const bOrd = b.display_order !== undefined && b.display_order !== null ? b.display_order : 9999;
      if (aOrd !== bOrd) return aOrd - bOrd;
      const aSec = a.section_order || 99;
      const bSec = b.section_order || 99;
      if (aSec !== bSec) return aSec - bSec;
      return (a.id || 0) - (b.id || 0);
    });
  }, [parameters]);

  // Exact row styling matching user's Excel mockup image
  const getExcelRowStyle = (param) => {
    const k = param.param_key;
    const sec = (param.section || '').toLowerCase();

    // Lime green totals (Total Expenses & Balance)
    if (k === 'total_expenses' || k === 'balance') {
      return {
        bg: '#86efac', // Bright Lime Green
        isBold: true,
        textColor: '#000000'
      };
    }
    // Bottom white row: Cab request Billing
    if (k === 'cab_billing') {
      return {
        bg: '#ffffff',
        isBold: false,
        textColor: '#000000'
      };
    }
    // Diesel Litres (White row)
    if (k === 'diesel_litres') {
      return {
        bg: '#ffffff',
        isBold: false,
        textColor: '#000000'
      };
    }
    // Section 1: Fleet Operations & Distance (White)
    if (sec.includes('fleet') && !sec.includes('expense')) {
      return {
        bg: '#ffffff',
        isBold: false,
        textColor: '#000000'
      };
    }
    // Section 2: Fleet Expenses & Operations (Soft Orange / Peach)
    if (sec.includes('expense')) {
      return {
        bg: '#fed7aa', // Orange / Peach
        isBold: false,
        textColor: '#000000'
      };
    }
    // Section 3: Revenue, Deductions & Income (Soft Golden Tan)
    if (sec.includes('revenue') || sec.includes('income')) {
      return {
        bg: '#fef3c7', // Tan
        isBold: k === 'cumulative_income',
        textColor: '#000000'
      };
    }
    // Section 4: Operating Budget & Balance (Soft Light Green)
    if (sec.includes('budget') || sec.includes('balance')) {
      return {
        bg: '#dcfce7', // Light green
        isBold: false,
        textColor: '#000000'
      };
    }
    // Section 5: Service Tickets & Compliance (Soft Lavender / Purple)
    if (sec.includes('ticket') || sec.includes('compliance')) {
      return {
        bg: '#f3e8ff', // Lavender
        isBold: false,
        textColor: '#000000'
      };
    }
    // Section 7: Student Transport Fee Analytics (Bright Yellow)
    if (sec.includes('fee') || sec.includes('student')) {
      return {
        bg: '#fef08a', // Bright Yellow
        isBold: k === 'students_count_fee',
        textColor: '#000000'
      };
    }
    return {
      bg: '#ffffff',
      isBold: false,
      textColor: '#000000'
    };
  };

  // Helper to format table cell values
  const formatCellValue = (param, val) => {
    if (param.param_key === 'per_student_cost_expenses' && (val === '#REF!' || !val || val === 0 || val === '0')) {
      return '₹0.00';
    }
    if (param.param_key === 'fc_cost' && (val === 0 || !val || val === '0' || val === '-')) {
      return '-';
    }
    if (val === undefined || val === null || val === '') return '0';
    if (param.input_type === 'text') return String(val);
    if (typeof val === 'string' && isNaN(Number(val.replace(/,/g, '')))) return val;
    const n = Number(val);
    if (isNaN(n)) return String(val);
    if (param.input_type === 'cost' || param.unit?.includes('INR') || param.unit?.includes('₹')) {
      return formatINR(n);
    }
    if (param.input_type === 'single_count') {
      return n.toLocaleString('en-IN');
    }
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  if (activeView === 'cards') {
    return (
      <TransportCardSpreadsheet
        periods={periods}
        editingPeriodId={editingPeriodId}
        setEditingPeriodId={setEditingPeriodId}
        activePeriodObj={activePeriodObj}
        isClosed={isClosed}
        branches={TRANSPORT_BRANCHES}
        activeBranch={activeBranch}
        setActiveBranch={setActiveBranch}
        activeMetrics={activeMetrics}
        getParamRawValue={getParamRawValue}
        handleParamChange={handleCellEdit}
        handleSaveActiveBranch={handleSaveActiveBranch}
        isSaving={isSaving}
        localMessage={localMessage}
        handleCopyFromPreviousMonth={handleCopyFromPreviousMonth}
        handleToggleLock={handleToggleLock}
        viewMode={activeView}
        setViewMode={setActiveView}
      />
    );
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      border: '1px solid #edf0f8',
      boxShadow: '0 4px 20px rgba(110, 80, 180, 0.05)',
      overflow: 'hidden',
      marginBottom: '24px'
    }}>
      
      {/* 1. TOP TOOLBAR & HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #0aa0e8 0%, #0670c9 100%)',
        padding: '18px 24px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        color: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            color: '#6c56db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
          }}>
            <Bus size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.01em' }}>
                {activeView === 'vehicles' ? 'College Cab Vehicle Wise Fleet Expenses Ledger' : 'Transport Operations & Fleet Master Spreadsheet'}
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                padding: '2px 8px',
                borderRadius: '9999px',
                color: '#ffffff'
              }}>
                {activeView === 'vehicles' ? 'Cab Fleet Ledger' : 'Excel Sheet Model'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#e0f2fe' }}>
              {activeView === 'vehicles' 
                ? `Vehicle-by-Vehicle Expenses, Diesel Consumption, KM Run & Mileage Tracking • ${activeBranchObj.label} (${activePeriodObj?.period_label || "OCT'26"})`
                : 'Exact multi-parameter spreadsheet layout • Multi-Branch (RPS, KPM, Common, University, Consolidated) • Live Real-time Formulas • Synced with Master Data'
              }
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Copy Previous Month - hidden in vehicle ledger view */}
          {activeView !== 'vehicles' && (
            <button
              type="button"
              onClick={handleCopyFromPreviousMonth}
              disabled={activeBranch === 'all' || isClosed}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 13px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '700',
                cursor: (activeBranch === 'all' || isClosed) ? 'not-allowed' : 'pointer',
                opacity: (activeBranch === 'all' || isClosed) ? 0.6 : 1
              }}
              title="Copy all parameter values from previous month into active month"
            >
              <Copy size={13} /> Copy Previous Month
            </button>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={() => {
              fetchParameters();
              if (fetchData) fetchData('transport');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              borderRadius: '9999px',
              padding: '7px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>

          {/* Master Save Button - only for parameter sheet, vehicle ledger has its own Save Vehicle Ledger button */}
          {activeView !== 'vehicles' && (
            <button
              type="button"
              onClick={handleSaveActiveBranch}
              disabled={isSaving || isClosed || activeBranch === 'all'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 22px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #ff7e9e 0%, #ff4b72 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '800',
                cursor: (isSaving || isClosed || activeBranch === 'all') ? 'not-allowed' : 'pointer',
                opacity: (isSaving || isClosed || activeBranch === 'all') ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(255, 96, 136, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="spin-animate" />
                  <span>Saving {activeBranchObj.label}...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>
                    {activeBranch === 'all' ? 'Consolidated (Auto-Calculated)' : `Save ${activeBranchObj.label}`}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. FLEET BRANCH / DIVISION SELECTOR BAR */}
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '12px 22px',
        borderBottom: '1.5px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            🏫 Fleet Branch:
          </span>
          {TRANSPORT_BRANCHES.map(br => {
            const isSel = activeBranch === br.id;
            return (
              <button
                key={br.id}
                type="button"
                onClick={() => setActiveBranch(br.id)}
                title={br.description}
                style={{
                  padding: '7px 16px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  border: isSel ? `2px solid ${br.badgeColor}` : '1.5px solid #cbd5e1',
                  backgroundColor: isSel ? br.badgeColor : '#ffffff',
                  color: isSel ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: isSel ? `0 3px 8px ${br.badgeColor}40` : '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '14px' }}>{br.icon}</span>
                <span>{br.label}</span>
                {isSel && <Check size={13} color="#ffffff" />}
              </button>
            );
          })}
        </div>

        {/* Active Branch Description Tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: activeBranchObj.badgeBg,
          color: activeBranchObj.badgeColor,
          padding: '6px 14px',
          borderRadius: '16px',
          fontSize: '11.5px',
          fontWeight: '700',
          border: `1px solid ${activeBranchObj.badgeColor}40`
        }}>
          <span>{activeBranchObj.icon}</span>
          <span>{activeBranchObj.description}</span>
        </div>
      </div>

      {/* 3. CYCLE SELECTION & VIEW MODE TOGGLE */}
      <div style={{
        backgroundColor: '#f0f9ff',
        padding: '10px 22px',
        borderBottom: '1px solid #bae6fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Focus Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            📅 Focus Month:
          </span>
          {periods.map(p => {
            const isSel = String(p.id) === currPeriodIdStr;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setEditingPeriodId(p.id)}
                style={{
                  padding: '6px 18px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: isSel ? '800' : '600',
                  border: 'none',
                  backgroundColor: isSel ? '#0aa0e8' : '#ffffff',
                  color: isSel ? '#ffffff' : '#6e768e',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isSel ? '0 4px 12px rgba(10, 160, 232, 0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{p.period_label}</span>
                {isSel && <span style={{ fontSize: '11px', color: '#ffffff' }}>★</span>}
              </button>
            );
          })}
        </div>

        {/* Page 1 vs Page 2 Entry Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Main Primary Page Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            padding: '3px',
            borderRadius: '9999px',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}>
            {/* Page 1 Entry */}
            <button
              type="button"
              onClick={() => setActiveView(activeView === 'cards' ? 'cards' : (activeView === 'multi_month' ? 'multi_month' : 'sheet'))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 18px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: activeView !== 'vehicles' ? '800' : '600',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeView !== 'vehicles' ? '#0284c7' : 'transparent',
                color: activeView !== 'vehicles' ? '#ffffff' : '#64748b',
                boxShadow: activeView !== 'vehicles' ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>📄</span>
              <span>Page 1 Entry (Master Spreadsheet)</span>
            </button>

            {/* Page 2 Entry */}
            <button
              type="button"
              onClick={() => setActiveView('vehicles')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 18px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: activeView === 'vehicles' ? '800' : '600',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeView === 'vehicles' ? '#00a2e8' : 'transparent',
                color: activeView === 'vehicles' ? '#ffffff' : '#64748b',
                boxShadow: activeView === 'vehicles' ? '0 2px 8px rgba(0, 162, 232, 0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🚌</span>
              <span>Page 2 Entry (Vehicle Wise Ledger)</span>
            </button>
          </div>

          {/* Sub-format toggles for Page 1 */}
          {activeView !== 'vehicles' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveView('sheet')}
                title="Single month spreadsheet layout"
                style={{
                  padding: '4px 9px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeView === 'sheet' ? '#ffffff' : 'transparent',
                  color: activeView === 'sheet' ? '#0f172a' : '#64748b',
                  boxShadow: activeView === 'sheet' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Sheet
              </button>
              <button
                type="button"
                onClick={() => setActiveView('multi_month')}
                title="Multi-month comparison grid"
                style={{
                  padding: '4px 9px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeView === 'multi_month' ? '#ffffff' : 'transparent',
                  color: activeView === 'multi_month' ? '#0f172a' : '#64748b',
                  boxShadow: activeView === 'multi_month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setActiveView('cards')}
                title="Card-based dashboard view"
                style={{
                  padding: '4px 9px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeView === 'cards' ? '#ffffff' : 'transparent',
                  color: activeView === 'cards' ? '#0f172a' : '#64748b',
                  boxShadow: activeView === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Cards
              </button>
              {activeView === 'sheet' && (
                <button
                  type="button"
                  onClick={() => setShowFormulaDetails(prev => !prev)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: showFormulaDetails ? '#0284c7' : 'transparent',
                    color: showFormulaDetails ? '#ffffff' : '#64748b'
                  }}
                  title="Toggle Formula & Definition column"
                >
                  📐 {showFormulaDetails ? 'Hide fx' : 'Show fx'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Local Notification Toast */}
      {localMessage && (
        <div style={{
          padding: '11px 22px',
          backgroundColor: localMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
          borderBottom: `1.5px solid ${localMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: localMessage.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '13px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {localMessage.type === 'success' ? <CheckCircle2 size={16} color="#059669" /> : <AlertCircle size={16} color="#dc2626" />}
          <span>{localMessage.text}</span>
        </div>
      )}

      {/* Consolidated Notice */}
      {activeBranch === 'all' && (
        <div style={{
          backgroundColor: '#eff6ff',
          borderBottom: '1px solid #bfdbfe',
          padding: '9px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '12.5px',
          color: '#1e40af',
          fontWeight: '600'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="#2563eb" />
            <span>
              <strong>Consolidated Fleet Total:</strong> Showing the combined automatic sum of <strong>Common</strong>, <strong>RPS</strong>, <strong>KPM</strong>, and <strong>University Fleet</strong>.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>Select a branch to edit values:</span>
            {['Common', 'RPS', 'KPM', 'University'].map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setActiveBranch(b)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #3b82f6',
                  color: '#2563eb',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Edit {b} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. EXACT EXCEL SPREADSHEET TABLE OR VEHICLE LEDGER */}
      {activeView === 'vehicles' ? (
        <div style={{ padding: '20px 16px', backgroundColor: '#f8fafc' }}>
          <TransportVehicleExpensesTable
            periodId={editingPeriodId}
            branch={activeBranch}
            embedded={true}
            onBranchChange={setActiveBranch}
            onPeriodChange={setEditingPeriodId}
            onSyncCensus={fetchData}
          />
        </div>
      ) : activeView === 'sheet' ? (
        <div style={{
          overflowX: 'auto',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '20px 12px',
          backgroundColor: '#f1f5f9'
        }}>
          <table style={{
            width: '100%',
            maxWidth: showFormulaDetails ? '880px' : '650px',
            borderCollapse: 'collapse',
            fontSize: '13px',
            border: '2px solid #000000',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            fontFamily: 'Calibri, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
          }}>
            {/* Header: S.No | Parameters | [Focus Month Period / Sep 1st to 30th] */}
            <thead>
              <tr style={{
                backgroundColor: '#ffffff',
                borderBottom: '2px solid #000000',
                color: '#000000',
                fontWeight: '800',
                fontSize: '13.5px',
                height: '30px'
              }}>
                <th style={{
                  width: '60px',
                  padding: '6px 4px',
                  textAlign: 'center',
                  borderRight: '1px solid #000000',
                  borderBottom: '2px solid #000000'
                }}>
                  S.No
                </th>
                <th style={{
                  padding: '6px 12px',
                  textAlign: 'center',
                  minWidth: '340px',
                  borderRight: '1px solid #000000',
                  borderBottom: '2px solid #000000'
                }}>
                  Parameters
                </th>
                <th style={{
                  width: '190px',
                  padding: '6px 12px',
                  textAlign: 'center',
                  borderRight: showFormulaDetails ? '1px solid #000000' : 'none',
                  borderBottom: '2px solid #000000'
                }}>
                  {activePeriodObj?.period_label || 'Sep 1st to 30th'}
                </th>
                {showFormulaDetails && (
                  <th style={{
                    width: '200px',
                    padding: '6px 12px',
                    textAlign: 'center',
                    borderBottom: '2px solid #000000',
                    backgroundColor: '#f8fafc',
                    color: '#334155'
                  }}>
                    Unit / Type / Formula
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {canonicalParameters.map((param, idx) => {
                const isFormula = !!param.formula;
                const isTotalRow = param.param_key === 'total_expenses' || param.param_key === 'cumulative_income' || param.param_key === 'balance';
                const cellVal = isFormula 
                  ? (activeMetrics[param.param_key] !== undefined ? activeMetrics[param.param_key] : 0) 
                  : getParamRawValue(activeBranch, currPeriodIdStr, param.param_key);
                const rowStyle = getExcelRowStyle(param);
                const formattedVal = formatCellValue(param, cellVal);
                const isRefError = param.param_key === 'per_student_cost_expenses' && (cellVal === '#REF!' || !cellVal || cellVal === 0);

                return (
                  <React.Fragment key={param.id || param.param_key}>
                    {/* Optional Blank Spacer Row before cumulative demand per KM to match screenshot row 46 */}
                    {param.param_key === 'cumulative_demand_per_km' && (
                      <tr style={{ backgroundColor: '#fef08a', height: '24px', borderBottom: '1px solid #000000' }}>
                        <td style={{ borderRight: '1px solid #000000', backgroundColor: '#fef08a' }}>&nbsp;</td>
                        <td style={{ borderRight: '1px solid #000000', backgroundColor: '#fef08a' }}>&nbsp;</td>
                        <td style={{ borderRight: showFormulaDetails ? '1px solid #000000' : 'none', backgroundColor: '#fef08a' }}>&nbsp;</td>
                        {showFormulaDetails && <td style={{ backgroundColor: '#fef08a' }}>&nbsp;</td>}
                      </tr>
                    )}

                    <tr
                      style={{
                        backgroundColor: rowStyle.bg,
                        borderBottom: isTotalRow ? '2px solid #000000' : '1px solid #000000',
                        fontWeight: rowStyle.isBold ? '800' : '500',
                        height: '27px'
                      }}
                    >
                      {/* S.No */}
                      <td style={{
                        padding: '4px 6px',
                        textAlign: 'center',
                        borderRight: '1px solid #000000',
                        color: '#000000',
                        fontWeight: rowStyle.isBold ? '800' : '600'
                      }}>
                        {param.s_no !== undefined && param.s_no !== null && param.s_no !== '' ? param.s_no : (param.display_order || (idx + 1))}
                      </td>

                      {/* Parameter Name */}
                      <td style={{
                        padding: '4px 10px',
                        borderRight: '1px solid #000000',
                        color: '#000000',
                        fontWeight: rowStyle.isBold ? '800' : (param.param_key === 'cumulative_income' || param.param_key === 'students_count_fee' ? '800' : '500')
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{param.param_name}</span>
                          {isFormula && (
                            <span style={{
                              fontSize: '9.5px',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(21, 128, 61, 0.12)',
                              color: '#15803d',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              marginLeft: '6px'
                            }} title={`Formula: ${param.formula}`}>
                              <Calculator size={9} /> fx
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Value / Input Cell */}
                      <td style={{
                        padding: '2px 8px',
                        textAlign: 'right',
                        borderRight: showFormulaDetails ? '1px solid #000000' : 'none',
                        backgroundColor: rowStyle.bg,
                        position: 'relative'
                      }}>
                        {/* Excel-style green triangle error indicator for #REF! */}
                        {isRefError && (
                          <span style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: 0,
                            height: 0,
                            borderTop: '6px solid #16a34a',
                            borderRight: '6px solid transparent'
                          }} title="Formula Reference Error" />
                        )}

                        {isFormula || activeBranch === 'all' || isClosed ? (
                          <div style={{
                            fontWeight: rowStyle.isBold ? '800' : '600',
                            fontSize: isTotalRow ? '13.5px' : '13px',
                            color: '#000000',
                            padding: '3px 4px'
                          }}>
                            {isRefError ? '#REF!' : formattedVal}
                          </div>
                        ) : (
                          <input
                            type={param.input_type === 'text' ? 'text' : 'number'}
                            step={param.input_type === 'cost' ? '1' : '0.01'}
                            value={cellVal !== undefined && cellVal !== null ? cellVal : '0'}
                            onChange={(e) => handleCellEdit(param.param_key, e.target.value)}
                            onFocus={(e) => {
                              if (e.target.value === '0') {
                                e.target.select();
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '3px 4px',
                              border: 'none',
                              borderRadius: '2px',
                              fontSize: '13px',
                              fontWeight: rowStyle.isBold ? '800' : '600',
                              textAlign: 'right',
                              outline: 'none',
                              backgroundColor: 'transparent',
                              color: '#000000'
                            }}
                            placeholder="0"
                          />
                        )}
                      </td>

                      {/* Unit / Formula description (Optional Column) */}
                      {showFormulaDetails && (
                        <td style={{
                          padding: '4px 10px',
                          textAlign: 'left',
                          color: '#475569',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: rowStyle.bg
                        }}>
                          {param.formula ? (
                            <span style={{ color: '#047857', fontWeight: '700' }}>
                              = {param.formula}
                            </span>
                          ) : (
                            <span>
                              {param.unit ? `${param.unit} (${param.input_type})` : param.input_type}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* 5. MULTI-MONTH COMPARISON GRID */
        <div style={{
          overflowX: 'auto',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '20px 12px',
          backgroundColor: '#f1f5f9'
        }}>
          <table style={{
            width: '100%',
            maxWidth: showFormulaDetails ? `${550 + periods.length * 140}px` : `${480 + periods.length * 130}px`,
            borderCollapse: 'collapse',
            fontSize: '13px',
            border: '2px solid #000000',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            fontFamily: 'Calibri, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#ffffff',
                borderBottom: '2px solid #000000',
                color: '#000000',
                fontWeight: '800',
                fontSize: '13.5px',
                height: '30px'
              }}>
                <th style={{ width: '50px', padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #000000', borderBottom: '2px solid #000000' }}>
                  S.No
                </th>
                <th style={{ padding: '6px 12px', minWidth: '300px', textAlign: 'center', borderRight: '1px solid #000000', borderBottom: '2px solid #000000' }}>
                  Parameters
                </th>
                {periods.map(p => {
                  const isCurrent = String(p.id) === currPeriodIdStr;
                  return (
                    <th
                      key={p.id}
                      style={{
                        minWidth: '125px',
                        padding: '6px 8px',
                        textAlign: 'center',
                        borderRight: '1px solid #000000',
                        borderBottom: '2px solid #000000',
                        backgroundColor: isCurrent ? '#f0f9ff' : '#ffffff',
                        color: isCurrent ? '#0284c7' : '#000000'
                      }}
                    >
                      {p.period_label} {isCurrent && '●'}
                    </th>
                  );
                })}
                {showFormulaDetails && (
                  <th style={{
                    width: '190px',
                    padding: '6px 12px',
                    textAlign: 'center',
                    borderBottom: '2px solid #000000',
                    backgroundColor: '#f8fafc',
                    color: '#334155'
                  }}>
                    Unit / Type / Formula
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {canonicalParameters.map((param, idx) => {
                const isFormula = !!param.formula;
                const isTotalRow = param.param_key === 'total_expenses' || param.param_key === 'cumulative_income' || param.param_key === 'balance';
                const rowStyle = getExcelRowStyle(param);

                return (
                  <React.Fragment key={param.id || param.param_key}>
                    {/* Blank Yellow Spacer Row matching row 46 of mockup */}
                    {param.param_key === 'cumulative_demand_per_km' && (
                      <tr style={{ backgroundColor: '#fef08a', height: '24px', borderBottom: '1px solid #000000' }}>
                        <td style={{ borderRight: '1px solid #000000', backgroundColor: '#fef08a' }}>&nbsp;</td>
                        <td style={{ borderRight: '1px solid #000000', backgroundColor: '#fef08a' }}>&nbsp;</td>
                        {periods.map(p => (
                          <td key={p.id} style={{ borderRight: '1px solid #000000', backgroundColor: '#fef08a' }}>&nbsp;</td>
                        ))}
                        {showFormulaDetails && <td style={{ backgroundColor: '#fef08a' }}>&nbsp;</td>}
                      </tr>
                    )}

                    <tr
                      style={{
                        backgroundColor: rowStyle.bg,
                        borderBottom: isTotalRow ? '2px solid #000000' : '1px solid #000000',
                        fontWeight: rowStyle.isBold ? '800' : '500',
                        height: '27px'
                      }}
                    >
                      {/* S.No */}
                      <td style={{
                        padding: '4px 6px',
                        textAlign: 'center',
                        borderRight: '1px solid #000000',
                        color: '#000000',
                        fontWeight: rowStyle.isBold ? '800' : '600'
                      }}>
                        {param.s_no !== undefined && param.s_no !== null && param.s_no !== '' ? param.s_no : (param.display_order || (idx + 1))}
                      </td>

                      {/* Parameter Name */}
                      <td style={{
                        padding: '4px 10px',
                        borderRight: '1px solid #000000',
                        color: '#000000',
                        fontWeight: rowStyle.isBold ? '800' : (param.param_key === 'cumulative_income' || param.param_key === 'students_count_fee' ? '800' : '500')
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{param.param_name}</span>
                          {isFormula && (
                            <span style={{
                              fontSize: '9.5px',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(21, 128, 61, 0.12)',
                              color: '#15803d',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              marginLeft: '6px'
                            }} title={`Formula: ${param.formula}`}>
                              <Calculator size={9} /> fx
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Each Month Column */}
                      {periods.map(p => {
                        const pStr = String(p.id);
                        const pMetrics = computeBranchMetrics(activeBranch, pStr);
                        const mVal = isFormula 
                          ? (pMetrics[param.param_key] !== undefined ? pMetrics[param.param_key] : 0) 
                          : getParamRawValue(activeBranch, pStr, param.param_key);
                        const isRefError = param.param_key === 'per_student_cost_expenses' && (mVal === '#REF!' || !mVal || mVal === 0);
                        const formattedVal = formatCellValue(param, mVal);

                        return (
                          <td
                            key={p.id}
                            style={{
                              padding: '2px 8px',
                              textAlign: 'right',
                              borderRight: '1px solid #000000',
                              backgroundColor: rowStyle.bg,
                              position: 'relative'
                            }}
                          >
                            {/* Excel-style green triangle error indicator for #REF! */}
                            {isRefError && (
                              <span style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: 0,
                                height: 0,
                                borderTop: '6px solid #16a34a',
                                borderRight: '6px solid transparent'
                              }} title="Formula Reference Error" />
                            )}

                            {isFormula || activeBranch === 'all' || isClosed ? (
                              <div style={{
                                fontWeight: rowStyle.isBold ? '800' : '600',
                                fontSize: isTotalRow ? '13px' : '12.5px',
                                color: '#000000',
                                padding: '3px 4px'
                              }}>
                                {isRefError ? '#REF!' : formattedVal}
                              </div>
                            ) : (
                              <input
                                type={param.input_type === 'text' ? 'text' : 'number'}
                                step={param.input_type === 'cost' ? '1' : '0.01'}
                                value={mVal !== undefined && mVal !== null ? mVal : '0'}
                                onChange={(e) => handleCellEdit(param.param_key, e.target.value, pStr)}
                                onFocus={(e) => {
                                  if (e.target.value === '0') {
                                    e.target.select();
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  padding: '3px 4px',
                                  border: 'none',
                                  borderRadius: '2px',
                                  fontSize: '12.5px',
                                  fontWeight: rowStyle.isBold ? '800' : '600',
                                  textAlign: 'right',
                                  outline: 'none',
                                  backgroundColor: 'transparent',
                                  color: '#000000'
                                }}
                                placeholder="0"
                              />
                            )}
                          </td>
                        );
                      })}

                      {/* Unit / Formula description (Optional Column) */}
                      {showFormulaDetails && (
                        <td style={{
                          padding: '4px 10px',
                          textAlign: 'left',
                          color: '#475569',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: rowStyle.bg
                        }}>
                          {param.formula ? (
                            <span style={{ color: '#047857', fontWeight: '700' }}>
                              = {param.formula}
                            </span>
                          ) : (
                            <span>
                              {param.unit ? `${param.unit} (${param.input_type})` : param.input_type}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. BOTTOM FOOTER INFO & QUICK LINK TO MASTER DATA */}
      <div style={{
        padding: '12px 22px',
        backgroundColor: '#f8fafc',
        borderTop: '1.5px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={15} color="#6c56db" />
          <span>
            Connected to <strong>Transport Master Data</strong> ({parameters.length} active parameters). Any parameter or formula added in Master Data is automatically calculated here.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: '700', color: '#334155' }}>
            Branch: {activeBranchObj.label} ({activePeriodObj?.period_label})
          </span>
        </div>
      </div>
    </div>
  );
}
