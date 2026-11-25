import React, { useState, useEffect, useMemo } from 'react';
import { formatINR } from '../../utils/formatters';
import TransportVehicleExpensesTable from './TransportVehicleExpensesTable';
import MonthlyAttachmentsModal from '../../components/attachments/MonthlyAttachmentsModal';
import { 
  Save, RefreshCw, CheckCircle2, Zap, Bus, 
  AlertCircle, Check, Copy, Settings,
  Users, Fuel, Wrench, ShieldCheck, DollarSign, School, ChevronRight, Calculator,
  TrendingUp, Award, Layers, Hash, Lock, Unlock, RotateCcw, X, Edit3, Paperclip
} from 'lucide-react';

export const TRANSPORT_BRANCHES = [
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
    id: 'Common', 
    code: 'Common', 
    label: 'Common', 
    icon: '🚌', 
    badgeColor: '#d97706', 
    badgeBg: '#fef3c7',
    description: 'Central Campus Fleet • Shared shuttles, staff transit, central pool'
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

// Official Sanctioned Budgets per Operating Fleet (FY 2026-2027)
export const DEFAULT_BRANCH_BUDGETS = {
  University: {
    sanctioned: 40330187,
    label: 'University Fleet',
    monthlyCeiling: 3360849,
    busCount: 16,
    color: '#dc2626',
    icon: '🎓',
    lineItems: [
      { param: 'Fuel expenses', amount: 19000000, color: '#1e40af', bg: '#dbeafe' },
      { param: 'FC 2026-2027', amount: 767200, color: '#9f1239', bg: '#ffe4e6' },
      { param: 'Vehicle Statutory', amount: 2844105, color: '#92400e', bg: '#fef3c7' },
      { param: 'Vehicle Repair & Maintenance', amount: 4352880, color: '#3730a3', bg: '#e0e7ff' },
      { param: 'CCTV Replacement 26-27', amount: 960000, color: '#9f1239', bg: '#ffe4e6' },
      { param: 'Vehicle Parking & Fastag Recharge 26-27', amount: 1030800, color: '#3f6212', bg: '#ecfccb' },
      { param: 'Transport Employees Cost', amount: 10984952, color: '#075985', bg: '#e0f2fe' },
      { param: 'Others 26-27', amount: 390250, color: '#065f46', bg: '#d1fae5' },
      { param: 'Total Expenses', amount: 40330187, color: '#854d0e', bg: '#fef08a', isTotal: true }
    ]
  },
  all: {
    sanctioned: 40330187,
    label: 'All Branches (Consolidated)',
    monthlyCeiling: 3360849,
    busCount: 58,
    color: '#0284c7',
    icon: '🏢',
    lineItems: [
      { param: 'Fuel expenses', amount: 19000000, color: '#1e40af', bg: '#dbeafe' },
      { param: 'FC 2026-2027', amount: 767200, color: '#9f1239', bg: '#ffe4e6' },
      { param: 'Vehicle Statutory', amount: 2844105, color: '#92400e', bg: '#fef3c7' },
      { param: 'Vehicle Repair & Maintenance', amount: 4352880, color: '#3730a3', bg: '#e0e7ff' },
      { param: 'CCTV Replacement 26-27', amount: 960000, color: '#9f1239', bg: '#ffe4e6' },
      { param: 'Vehicle Parking & Fastag Recharge 26-27', amount: 1030800, color: '#3f6212', bg: '#ecfccb' },
      { param: 'Transport Employees Cost', amount: 10984952, color: '#075985', bg: '#e0f2fe' },
      { param: 'Others 26-27', amount: 390250, color: '#065f46', bg: '#d1fae5' },
      { param: 'Total Expenses', amount: 40330187, color: '#854d0e', bg: '#fef08a', isTotal: true }
    ]
  },
  RPS: {
    sanctioned: 14107491,
    label: 'RPS Branch',
    monthlyCeiling: 1175624,
    busCount: 19,
    color: '#7c3aed',
    icon: '🏫',
    lineItems: [
      { param: 'Fuel expenses (Rs)', amount: 4622687, color: '#1d4ed8', bg: '#eff6ff' },
      { param: 'FC 2025-2026', amount: 405900, color: '#be123c', bg: '#fff1f2' },
      { param: 'Vehicle Statutory', amount: 786280, color: '#b45309', bg: '#fffbeb' },
      { param: 'Repair & Maintenance', amount: 1780500, color: '#4338ca', bg: '#eef2ff' },
      { param: 'Others', amount: 519081, color: '#047857', bg: '#ecfdf5' },
      { param: 'Transport Employees Cost', amount: 5993043, color: '#0369a1', bg: '#f0f9ff' },
      { param: 'EMI', amount: 0, color: '#64748b', bg: '#f8fafc', isBlank: true },
      { param: 'Total Expenses', amount: 14107491, color: '#854d0e', bg: '#fef08a', isTotal: true }
    ]
  },
  KPM: {
    sanctioned: 4000000,
    label: 'KPM Branch',
    monthlyCeiling: 333333,
    busCount: 5,
    color: '#059669',
    icon: '🏫',
    lineItems: [
      { param: 'Fuel expenses (Rs)', amount: 1300000, color: '#1d4ed8', bg: '#eff6ff' },
      { param: 'FC 2025-2026', amount: 150000, color: '#be123c', bg: '#fff1f2' },
      { param: 'Vehicle Statutory', amount: 340000, color: '#b45309', bg: '#fffbeb' },
      { param: 'Repair & Maintenance', amount: 500000, color: '#4338ca', bg: '#eef2ff' },
      { param: 'Others', amount: 280000, color: '#047857', bg: '#ecfdf5' },
      { param: 'Transport Employees Cost', amount: 1430000, color: '#0369a1', bg: '#f0f9ff' },
      { param: 'EMI', amount: 0, color: '#64748b', bg: '#f8fafc', isBlank: true },
      { param: 'Total Expenses', amount: 4000000, color: '#854d0e', bg: '#fef08a', isTotal: true }
    ]
  },
  Common: {
    sanctioned: 5552143,
    label: 'Common Fleet',
    monthlyCeiling: 462679,
    busCount: 18,
    color: '#d97706',
    icon: '🚌',
    lineItems: [
      { param: 'Fuel expenses (Rs)', amount: 780000, color: '#1d4ed8', bg: '#eff6ff' },
      { param: 'FC 2025-2026', amount: 50400, color: '#be123c', bg: '#fff1f2' },
      { param: 'Vehicle Statutory', amount: 702465, color: '#b45309', bg: '#fffbeb' },
      { param: 'Repair & Maintenance', amount: 973333, color: '#4338ca', bg: '#eef2ff' },
      { param: 'Others', amount: 75000, color: '#047857', bg: '#ecfdf5' },
      { param: 'Transport Employees Cost', amount: 2970945, color: '#0369a1', bg: '#f0f9ff' },
      { param: 'Total Expenses', amount: 5552143, color: '#854d0e', bg: '#fef08a', isTotal: true }
    ]
  }
};

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
  { id: 13, s_no: '13', param_key: 'cctv_replacement', param_name: 'CCTV replacement', section: 'Fleet Expenses & Operations', section_order: 2, display_order: 13, input_type: 'cost', unit: 'INR (₹)' },
  { id: 14, s_no: '14', param_key: 'employee_cost', param_name: 'Transport Employees Cost', section: 'Fleet Expenses & Operations', section_order: 2, display_order: 14, input_type: 'cost', unit: 'INR (₹)' },
  { id: 15, s_no: '15', param_key: 'parking_fastag', param_name: 'Vehicle Parking & Fastag Recharge', section: 'Fleet Expenses & Operations', section_order: 2, display_order: 15, input_type: 'cost', unit: 'INR (₹)' },
  { id: 16, s_no: '16', param_key: 'total_expenses', param_name: 'Total Expenses', section: 'Fleet Expenses & Operations', section_order: 2, display_order: 16, input_type: 'cost', unit: 'INR (₹)', formula: 'SUM(Fuel + FC + Statutory + Repair + Others + CCTV replacement + Employees Cost + Parking & Fastag)' },

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
  selectedBranch,
  onBranchChange,
  transportCensusDraft = {},
  handleTransportCensusChange,
  fetchData,
  handleCloneFromPrev,
  handleToggleLock
}) {
  const [activeBranch, setActiveBranchState] = useState(selectedBranch || 'RPS');
  const [activeView, setActiveView] = useState('sheet'); // 'sheet' (Page 1 Entry: Master Spreadsheet) or 'vehicles' (Page 2 Entry: Vehicle Wise Ledger)
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);
  const [parameters, setParameters] = useState(CANONICAL_TRANSPORT_PARAMETERS);
  const [loadingParams, setLoadingParams] = useState(true);
  const [localMessage, setLocalMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Per-branch local edit buffers: { [branch]: { [periodId]: { [param_key]: val } } }
  const [branchDrafts, setBranchDrafts] = useState({});
  const [lockedPeriodsOverride, setLockedPeriodsOverride] = useState({});
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);

  // Dedicated Sanctioned Budget Edit & Lock State
  // Dedicated Sanctioned Budget Edit & Lock State across All 4 Fleets
  const [budgetDisplayMode, setBudgetDisplayMode] = useState('active'); // 'active' | 'all'
  const [branchBudgetsState, setBranchBudgetsState] = useState(() => {
    return computedMatrix?.transport_branch_budgets || DEFAULT_BRANCH_BUDGETS;
  });
  const [budgetLocks, setBudgetLocks] = useState({
    University: true,
    RPS: true,
    KPM: true,
    Common: true
  });
  const [budgetDrafts, setBudgetDrafts] = useState({
    University: {},
    RPS: {},
    KPM: {},
    Common: {}
  });
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Sync budget from computedMatrix or direct API
  useEffect(() => {
    if (computedMatrix?.transport_branch_budgets && Object.keys(computedMatrix.transport_branch_budgets).length > 0) {
      setBranchBudgetsState(prev => ({
        ...prev,
        ...computedMatrix.transport_branch_budgets
      }));
    } else {
      fetch('/api/transport/budget-tracking')
        .then(res => res.json())
        .then(data => {
          if (data?.status === 'success' && data?.budgets) {
            setBranchBudgetsState(prev => ({
              ...prev,
              ...data.budgets
            }));
          }
        })
        .catch(err => console.warn('[TransportSpreadsheetEntry] Budget tracking fetch notice:', err));
    }
  }, [computedMatrix]);

  // Backward compatibility helpers for active fleet
  const isBudgetLocked = budgetLocks[activeBranch] !== false;
  const budgetEditDraft = budgetDrafts[activeBranch] || {};
  const activeBranchBudget = (branchBudgetsState && branchBudgetsState[activeBranch]) || DEFAULT_BRANCH_BUDGETS[activeBranch];

  // Per-branch actions
  const isBranchLocked = (bKey) => budgetLocks[bKey] !== false;

  const handleStartEditBranch = (bKey) => {
    const targetBranch = bKey || activeBranch;
    const bBudget = (branchBudgetsState && branchBudgetsState[targetBranch]) || DEFAULT_BRANCH_BUDGETS[targetBranch];
    if (!bBudget?.lineItems) return;
    const initialDraft = {};
    bBudget.lineItems.forEach(item => {
      initialDraft[item.param] = item.amount;
    });
    setBudgetDrafts(prev => ({ ...prev, [targetBranch]: initialDraft }));
    setBudgetLocks(prev => ({ ...prev, [targetBranch]: false }));
  };

  const handleCancelEditBranch = (bKey) => {
    const targetBranch = bKey || activeBranch;
    setBudgetDrafts(prev => ({ ...prev, [targetBranch]: {} }));
    setBudgetLocks(prev => ({ ...prev, [targetBranch]: true }));
  };

  const handleBranchParamChange = (bKey, paramName, rawVal) => {
    setBudgetDrafts(prev => ({
      ...prev,
      [bKey]: {
        ...(prev[bKey] || {}),
        [paramName]: rawVal
      }
    }));
  };

  const getBranchBudgetTotal = (bKey) => {
    const bBudget = (branchBudgetsState && branchBudgetsState[bKey]) || DEFAULT_BRANCH_BUDGETS[bKey];
    if (!bBudget?.lineItems) return 0;
    const bDraft = budgetDrafts[bKey] || {};
    return bBudget.lineItems.reduce((sum, item) => {
      if (item.isTotal) return sum;
      const draftVal = bDraft[item.param];
      const amt = draftVal !== undefined ? Number(draftVal) : Number(item.amount);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
  };

  // Live computed total for active branch
  const currentBudgetTotal = useMemo(() => {
    return getBranchBudgetTotal(activeBranch);
  }, [activeBranch, branchBudgetsState, budgetDrafts]);

  // Single branch save to dedicated database table: transport_budget_<branch>
  const handleSaveBranchBudget = async (bKey) => {
    const targetBranch = bKey || activeBranch;
    if (!targetBranch || targetBranch === 'all') return;
    setIsSavingBudget(true);

    try {
      const bBudget = (branchBudgetsState && branchBudgetsState[targetBranch]) || DEFAULT_BRANCH_BUDGETS[targetBranch];
      const bDraft = budgetDrafts[targetBranch] || {};
      const newTotal = getBranchBudgetTotal(targetBranch);

      const updatedLineItems = bBudget.lineItems.map(item => {
        if (item.isTotal) {
          return { ...item, amount: newTotal };
        }
        const draftVal = bDraft[item.param];
        const draftAmt = draftVal !== undefined ? Number(draftVal) : item.amount;
        return {
          ...item,
          amount: isNaN(draftAmt) ? 0 : draftAmt
        };
      });

      const res = await fetch('/api/transport/budget-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: targetBranch,
          lineItems: updatedLineItems
        })
      });

      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setBranchBudgetsState(prev => ({
          ...prev,
          [targetBranch]: {
            ...prev[targetBranch],
            sanctioned: newTotal,
            lineItems: updatedLineItems
          }
        }));

        if (DEFAULT_BRANCH_BUDGETS[targetBranch]) {
          DEFAULT_BRANCH_BUDGETS[targetBranch].sanctioned = newTotal;
          DEFAULT_BRANCH_BUDGETS[targetBranch].lineItems = updatedLineItems;
        }

        setBudgetLocks(prev => ({ ...prev, [targetBranch]: true }));
        setBudgetDrafts(prev => ({ ...prev, [targetBranch]: {} }));
        setLocalMessage({
          type: 'success',
          text: `Official Budget for ${targetBranch} has been saved to dedicated database table transport_budget_${targetBranch.toLowerCase()} & locked (Sanctioned: ${formatINR(newTotal)}).`
        });

        if (fetchData) {
          fetchData('transport');
        }
      } else {
        throw new Error(resData.detail || 'Failed to save budget');
      }
    } catch (err) {
      console.error(`[TransportSpreadsheetEntry] Error saving budget for ${targetBranch}:`, err);
      setLocalMessage({
        type: 'error',
        text: `Error saving budget for ${targetBranch}: ${err.message}`
      });
    } finally {
      setIsSavingBudget(false);
    }
  };

  // Bulk save all 4 fleet budget tables to their respective database tables
  const handleSaveAllBranchBudgets = async () => {
    setIsSavingBudget(true);
    const realBranches = ['University', 'RPS', 'KPM', 'Common'];
    const bulkBudgets = {};

    realBranches.forEach(bKey => {
      const bBudget = (branchBudgetsState && branchBudgetsState[bKey]) || DEFAULT_BRANCH_BUDGETS[bKey];
      const bDraft = budgetDrafts[bKey] || {};
      const newTotal = getBranchBudgetTotal(bKey);
      const updatedLineItems = (bBudget?.lineItems || []).map(item => {
        if (item.isTotal) return { ...item, amount: newTotal };
        const draftVal = bDraft[item.param];
        const draftAmt = draftVal !== undefined ? Number(draftVal) : item.amount;
        return {
          ...item,
          amount: isNaN(draftAmt) ? 0 : draftAmt
        };
      });
      bulkBudgets[bKey] = updatedLineItems;
    });

    try {
      const res = await fetch('/api/transport/budget-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgets: bulkBudgets })
      });

      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        const nextBudgets = { ...branchBudgetsState };
        realBranches.forEach(bKey => {
          const items = bulkBudgets[bKey];
          const total = getBranchBudgetTotal(bKey);
          nextBudgets[bKey] = {
            ...nextBudgets[bKey],
            sanctioned: total,
            lineItems: items
          };
          if (DEFAULT_BRANCH_BUDGETS[bKey]) {
            DEFAULT_BRANCH_BUDGETS[bKey].sanctioned = total;
            DEFAULT_BRANCH_BUDGETS[bKey].lineItems = items;
          }
        });

        setBranchBudgetsState(nextBudgets);
        setBudgetLocks({ University: true, RPS: true, KPM: true, Common: true });
        setBudgetDrafts({ University: {}, RPS: {}, KPM: {}, Common: {} });
        setLocalMessage({
          type: 'success',
          text: 'All 4 Fleet Budgets successfully saved to database tables (transport_budget_university, transport_budget_rps, transport_budget_kpm, transport_budget_common) and locked!'
        });

        if (fetchData) {
          fetchData('transport');
        }
      } else {
        throw new Error(resData.detail || 'Failed to save all budgets');
      }
    } catch (err) {
      console.error('[TransportSpreadsheetEntry] Error saving all budgets:', err);
      setLocalMessage({
        type: 'error',
        text: `Error saving all budgets: ${err.message}`
      });
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleUnlockAllBudgets = () => {
    const realBranches = ['University', 'RPS', 'KPM', 'Common'];
    const newLocks = {};
    const newDrafts = {};
    realBranches.forEach(bKey => {
      newLocks[bKey] = false;
      const bBudget = (branchBudgetsState && branchBudgetsState[bKey]) || DEFAULT_BRANCH_BUDGETS[bKey];
      const draft = {};
      if (bBudget?.lineItems) {
        bBudget.lineItems.forEach(item => {
          draft[item.param] = item.amount;
        });
      }
      newDrafts[bKey] = draft;
    });
    setBudgetLocks(newLocks);
    setBudgetDrafts(newDrafts);
  };

  const handleLockAllBudgets = () => {
    setBudgetLocks({ University: true, RPS: true, KPM: true, Common: true });
    setBudgetDrafts({ University: {}, RPS: {}, KPM: {}, Common: {} });
  };

  const handleResetBranchDefaults = (bKey) => {
    const targetBranch = bKey || activeBranch;
    const canonical = DEFAULT_BRANCH_BUDGETS[targetBranch];
    if (!canonical?.lineItems) return;
    const initialDraft = {};
    canonical.lineItems.forEach(item => {
      initialDraft[item.param] = item.amount;
    });
    setBudgetDrafts(prev => ({ ...prev, [targetBranch]: initialDraft }));
    setLocalMessage({
      type: 'info',
      text: `Reset values to official baseline for ${targetBranch}. Click "Save & Lock Table" to persist.`
    });
  };

  // Backwards compatible aliases for existing JSX
  const handleStartEditBudget = () => handleStartEditBranch(activeBranch);
  const handleCancelEditBudget = () => handleCancelEditBranch(activeBranch);
  const handleBudgetParamChange = (paramName, rawVal) => handleBranchParamChange(activeBranch, paramName, rawVal);
  const handleSaveAndLockBudget = () => handleSaveBranchBudget(activeBranch);
  const handleResetToStandardDefaults = () => handleResetBranchDefaults(activeBranch);

  const periods = computedMatrix?.periods || [];
  // Strict fleet-scoped periods: only show months belonging to the active fleet or 'all'
  const visiblePeriods = useMemo(() => {
    return periods.filter(p => !p.branch || p.branch === 'all' || p.branch === activeBranch);
  }, [periods, activeBranch]);

  const currPeriodIdStr = String(editingPeriodId);
  const currentPeriod = periods.find(p => String(p.id) === currPeriodIdStr) || activePeriodObj;
  const isClosed = lockedPeriodsOverride[currPeriodIdStr] !== undefined
    ? lockedPeriodsOverride[currPeriodIdStr]
    : !!currentPeriod?.is_closed;
  const activeBranchObj = TRANSPORT_BRANCHES.find(b => b.id === activeBranch) || TRANSPORT_BRANCHES.find(b => b.id === 'RPS') || TRANSPORT_BRANCHES[1] || TRANSPORT_BRANCHES[0];

  // Universal lock toggle that guarantees mutual locking & unlocking across Page 1 & Page 2
  const handleUniversalToggleLock = async (targetPeriodId = null) => {
    const pId = targetPeriodId || editingPeriodId;
    if (!pId) return;

    const pObj = periods.find(p => String(p.id) === String(pId)) || activePeriodObj;
    const targetLabel = pObj?.period_label || pObj?.period_code || `Month ${pId}`;
    const targetCode = pObj?.period_code || '2026-10';
    const currentClosed = lockedPeriodsOverride[String(pId)] !== undefined 
      ? lockedPeriodsOverride[String(pId)] 
      : !!pObj?.is_closed;
    const newStatus = !currentClosed;

    // Optimistically update local override immediately across Page 1 & Page 2
    setLockedPeriodsOverride(prev => ({ ...prev, [String(pId)]: newStatus }));

    try {
      const res = await fetch(`/api/periods/${pId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_label: targetLabel,
          period_code: targetCode,
          is_closed: newStatus
        })
      });

      if (res.ok) {
        setLocalMessage({
          type: 'success',
          text: `Month "${targetLabel}" is now ${newStatus ? 'LOCKED (Read-Only) across Page 1 & Page 2' : 'UNLOCKED for editing across Page 1 & Page 2'}.`
        });
      }
    } catch (err) {
      console.warn('[TransportSpreadsheetEntry] Direct period lock error:', err);
    }

    if (fetchData) {
      fetchData('transport');
    }
  };

  // Synchronize branch from parent prop if provided
  useEffect(() => {
    if (selectedBranch && selectedBranch !== activeBranch) {
      setActiveBranchState(selectedBranch);
    }
  }, [selectedBranch]);

  const setActiveBranch = (b) => {
    setActiveBranchState(b);
    if (onBranchChange) onBranchChange(b);
  };

  // Ensure editingPeriodId belongs to visible fleet transport periods, otherwise fallback to latest
  useEffect(() => {
    if (setEditingPeriodId && visiblePeriods.length > 0) {
      const exists = visiblePeriods.some(p => p.id === editingPeriodId);
      if (!exists) {
        setEditingPeriodId(visiblePeriods[visiblePeriods.length - 1].id);
      }
    }
  }, [visiblePeriods, editingPeriodId, setEditingPeriodId]);

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
        totApprovedBudget += num(m.approved_budget) || (DEFAULT_BRANCH_BUDGETS[bCode]?.sanctioned || 0);
        totCumulativeBudgetSpent += num(m.cumulative_budget_spent);
        totTicketsRaised += num(m.service_tickets_raised);
        totTicketsClosed += num(m.service_tickets_closed);
        totQualityRec += num(m.quality_issues_received);
        totQualityCls += num(m.quality_issues_closed);
        totIncidents += num(m.incidents_count);
      });

      const totExpenses = totFuelExp + totFc + totStatutory + totRepair + totOther + totEmp;
      const totCumIncome = totFeePaid + totRpsBilling + totStaffDeduction + totAddKmsRps + totAddKmsOthers + totCabBilling;
      const totBal = (totApprovedBudget || 32500000) - totCumulativeBudgetSpent;
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
        cctv_replacement: 0,
        employee_cost: totEmp,
        parking_fastag: 0,
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
        approved_budget: totApprovedBudget || 32500000,
        cumulative_budget_spent: totCumulativeBudgetSpent,
        balance: (totApprovedBudget || 32500000) - totCumulativeBudgetSpent,
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
    const cctv_replacement = g('cctv_replacement');
    const employee_cost = g('employee_cost');
    const parking_fastag = g('parking_fastag');
    
    // Formula: Total Expenses = Fuel + FC + Statutory + Repair + Others + CCTV replacement + Employees Cost + Parking & Fastag
    const total_expenses = fuel_expenses + fc_cost + statutory_cost + repair_maintenance_cost + other_cost + cctv_replacement + employee_cost + parking_fastag;

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
    const defaultBranchBudget = branchId !== 'all' ? (DEFAULT_BRANCH_BUDGETS[branchId]?.sanctioned || 8500000) : 32500000;
    const rawApprovedBudget = getParamRawValue(branchId, periodIdStr, 'approved_budget');
    const approved_budget = (rawApprovedBudget !== undefined && rawApprovedBudget !== null && rawApprovedBudget !== '')
      ? Number(rawApprovedBudget)
      : defaultBranchBudget;
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

          {/* Universal Lock / Unlock Month Button (controls both Page 1 and Page 2) */}
          <button
            type="button"
            onClick={() => handleUniversalToggleLock(editingPeriodId)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: `1.5px solid ${isClosed ? '#fca5a5' : 'rgba(255, 255, 255, 0.4)'}`,
              borderRadius: '9999px',
              padding: '7px 16px',
              backgroundColor: isClosed ? '#fee2e2' : 'rgba(255, 255, 255, 0.18)',
              color: isClosed ? '#991b1b' : '#ffffff',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: isClosed ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
              transition: 'all 0.15s ease'
            }}
            title={isClosed ? "Month is locked. Click to unlock Page 1 & Page 2" : "Click to lock Month across Page 1 & Page 2"}
          >
            {isClosed ? <Lock size={13} color="#991b1b" /> : <Unlock size={13} color="#ffffff" />}
            <span>{isClosed ? 'Unlock Month' : 'Lock Month'}</span>
          </button>

          {/* Supporting Attachments & Bills Button */}
          <button
            type="button"
            onClick={() => setShowAttachmentsModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '9999px',
              padding: '7px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: 'none',
              transition: 'all 0.15s ease'
            }}
            title="Upload or view bills, presentations, documents & attachments for this month"
          >
            <Paperclip size={13} color="#ffffff" />
            <span>Attachments & Bills</span>
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
          {TRANSPORT_BRANCHES.filter(br => br.id !== 'all').map(br => {
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

      {/* 2.5 FLEET-WISE SANCTIONED BUDGET QUICK-ALLOCATION & VERIFICATION TABLE */}
      <div style={{
        padding: '14px 22px',
        backgroundColor: '#f8fafc',
        borderBottom: '1.5px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🎯</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>
              Institutional Fleets Sanctioned Budget Allocation (FY 2026-2027)
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0'
            }}>
              Zero-Mismatch Verified
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>
            Click any fleet to switch and verify/edit its operational records
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px',
          width: '100%'
        }}>
          {TRANSPORT_BRANCHES.filter(b => b.id !== 'all').map(br => {
            const bBudget = DEFAULT_BRANCH_BUDGETS[br.id] || { sanctioned: 8500000, monthlyCeiling: 708333, busCount: 16 };
            const isCurrent = activeBranch === br.id;
            const bMetrics = activeBranch === br.id ? activeMetrics : computeBranchMetrics(br.id, currPeriodIdStr);
            const bSpend = num(bMetrics.total_expenses);
            const bBal = bBudget.sanctioned - bSpend;

            return (
              <div
                key={br.id}
                onClick={() => setActiveBranch(br.id)}
                style={{
                  backgroundColor: isCurrent ? '#ffffff' : '#f8fafc',
                  borderRadius: '12px',
                  border: isCurrent ? `2px solid ${br.badgeColor}` : '1.5px solid #e2e8f0',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  boxShadow: isCurrent ? `0 4px 14px ${br.badgeColor}25` : '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                {isCurrent && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '10px',
                    backgroundColor: br.badgeColor,
                    color: '#ffffff',
                    fontSize: '9.5px',
                    fontWeight: '800',
                    padding: '1px 8px',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                  }}>
                    ACTIVE FLEET
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px' }}>{br.icon}</span>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{br.label}</strong>
                  </div>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '700',
                    padding: '1px 6px',
                    borderRadius: '6px',
                    backgroundColor: br.badgeBg,
                    color: br.badgeColor
                  }}>
                    {bBudget.busCount} Buses
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Sanctioned Budget:</span>
                  <strong style={{ fontSize: '14px', color: br.badgeColor, fontWeight: '800' }}>
                    {formatINR(bBudget.sanctioned)}
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '4px' }}>
                  <span>Monthly Ceiling:</span>
                  <strong>{formatINR(bBudget.monthlyCeiling)}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#0f172a', marginTop: '3px' }}>
                  <span>Month Spend:</span>
                  <span style={{ fontWeight: '700', color: bSpend > bBudget.monthlyCeiling ? '#dc2626' : '#16a34a' }}>
                    {formatINR(bSpend)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* View Mode Toggle: Active Fleet Table vs All 4 Fleet Tables */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '10px 14px',
          backgroundColor: '#f1f5f9',
          borderRadius: '10px',
          border: '1.5px solid #cbd5e1'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Fleet Budget Tables:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setBudgetDisplayMode('active')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  backgroundColor: budgetDisplayMode === 'active' ? '#1e293b' : '#ffffff',
                  color: budgetDisplayMode === 'active' ? '#ffffff' : '#475569',
                  border: '1.5px solid ' + (budgetDisplayMode === 'active' ? '#1e293b' : '#cbd5e1'),
                  boxShadow: budgetDisplayMode === 'active' ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{activeBranchObj.icon}</span>
                <span>Active Fleet ({activeBranchObj.label})</span>
              </button>

              <button
                type="button"
                onClick={() => setBudgetDisplayMode('all')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  backgroundColor: budgetDisplayMode === 'all' ? '#1e293b' : '#ffffff',
                  color: budgetDisplayMode === 'all' ? '#ffffff' : '#475569',
                  border: '1.5px solid ' + (budgetDisplayMode === 'all' ? '#1e293b' : '#cbd5e1'),
                  boxShadow: budgetDisplayMode === 'all' ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Layers size={13} />
                <span>View & Edit All 4 Fleet Tables (KPM, RPS, Common, University)</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Direct PostgreSQL Tables: <code style={{ backgroundColor: '#e2e8f0', padding: '2px 5px', borderRadius: '4px', color: '#0f172a' }}>transport_budget_*</code>
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: ACTIVE FLEET BUDGET TABLE                             */}
        {/* ------------------------------------------------------------- */}
        {budgetDisplayMode === 'active' && activeBranch !== 'all' && activeBranchBudget?.lineItems && (
          <div style={{
            marginTop: '12px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: `1.5px solid ${isBudgetLocked ? (activeBranchObj.badgeColor + '40') : '#3b82f6'}`,
            padding: '16px 20px',
            boxShadow: isBudgetLocked ? '0 2px 8px rgba(0,0,0,0.03)' : '0 4px 16px rgba(59, 130, 246, 0.12)',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{activeBranchObj.icon}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      {activeBranchObj.label} — Official Sanctioned Budget Allocation
                    </strong>
                    {/* Database Table Pill */}
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe'
                    }}>
                      Table: transport_budget_{activeBranch.toLowerCase()}
                    </span>
                    {/* Status Badge */}
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: isBudgetLocked ? '#fef2f2' : '#f0fdf4',
                      color: isBudgetLocked ? '#991b1b' : '#166534',
                      border: `1px solid ${isBudgetLocked ? '#fecaca' : '#bbf7d0'}`
                    }}>
                      {isBudgetLocked ? <Lock size={11} color="#dc2626" /> : <Unlock size={11} color="#16a34a" />}
                      {isBudgetLocked ? 'Locked (Read-Only)' : 'Unlocked (Editing Active)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {isBudgetLocked
                      ? 'Approved parameters & ceilings are protected. Click "Unlock to Edit Budget" to modify sanctioned amounts.'
                      : 'Editing mode active: Modify parameter amounts below. Total Expenses automatically updates in real-time.'}
                  </div>
                </div>
              </div>

              {/* Action Buttons & Ceilings */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: '800',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: isBudgetLocked ? activeBranchObj.badgeBg : '#eff6ff',
                  color: isBudgetLocked ? activeBranchObj.badgeColor : '#1d4ed8',
                  border: `1.5px solid ${isBudgetLocked ? activeBranchObj.badgeColor + '50' : '#bfdbfe'}`
                }}>
                  {activeBranchObj.label} Ceiling: {formatINR(isBudgetLocked ? (activeBranchBudget.sanctioned || 0) : currentBudgetTotal)}
                </span>

                {isBudgetLocked ? (
                  <button
                    type="button"
                    onClick={() => handleStartEditBranch(activeBranch)}
                    title="Unlock to modify budget parameter amounts for this fleet"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      backgroundColor: '#f8fafc',
                      color: '#1e293b',
                      border: '1.5px solid #cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.color = '#1d4ed8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.color = '#1e293b';
                    }}
                  >
                    <Unlock size={13} color="#2563eb" />
                    <span>Unlock to Edit Budget</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      disabled={isSavingBudget}
                      onClick={() => handleSaveBranchBudget(activeBranch)}
                      title={`Save modified parameter amounts directly to transport_budget_${activeBranch.toLowerCase()}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '800',
                        backgroundColor: isSavingBudget ? '#86efac' : '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        cursor: isSavingBudget ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSavingBudget) e.currentTarget.style.backgroundColor = '#15803d';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSavingBudget) e.currentTarget.style.backgroundColor = '#16a34a';
                      }}
                    >
                      {isSavingBudget ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                      <span>{isSavingBudget ? 'Saving...' : `Save & Lock ${activeBranch} Table`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResetBranchDefaults(activeBranch)}
                      title="Reset numbers to management Excel default baseline"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        backgroundColor: '#fffbeb',
                        color: '#b45309',
                        border: '1.5px solid #fde68a',
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCcw size={12} />
                      <span>Reset Defaults</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCancelEditBranch(activeBranch)}
                      title="Discard unsaved changes and lock"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        backgroundColor: '#f1f5f9',
                        color: '#64748b',
                        border: '1.5px solid #cbd5e1',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={12} />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Parameter Table matching Excel Layout */}
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #94a3b8' }}>
                    <th style={{ padding: '8px 14px', fontWeight: '800', color: '#0f172a', width: '60%' }}>Parameters</th>
                    <th style={{ padding: '8px 14px', fontWeight: '800', color: '#0f172a', textAlign: 'right', width: '40%' }}>
                      Sanctioned Amount (₹) {!isBudgetLocked && <span style={{ color: '#2563eb', fontSize: '11px', fontWeight: '700' }}>(Editable)</span>}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeBranchBudget.lineItems.map((item, idx) => {
                    const isTotalRow = item.isTotal;
                    const isBlankRow = item.isBlank || item.param === 'EMI';
                    const draftVal = budgetEditDraft[item.param];

                    return (
                      <tr
                        key={idx}
                        style={{
                          backgroundColor: isTotalRow ? '#fef08a' : (item.bg || '#ffffff'),
                          borderBottom: isTotalRow ? '2.5px solid #ca8a04' : '1px solid #cbd5e1',
                          borderTop: isTotalRow ? '2.5px solid #ca8a04' : 'none'
                        }}
                      >
                        <td style={{
                          padding: isTotalRow ? '10px 14px' : '7px 14px',
                          fontWeight: isTotalRow ? '900' : '650',
                          color: isTotalRow ? '#854d0e' : '#1e293b',
                          fontSize: isTotalRow ? '13.5px' : '12.5px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {!isTotalRow && (
                              <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: item.color || '#3b82f6',
                                display: 'inline-block',
                                flexShrink: 0
                              }} />
                            )}
                            <span>{item.param}</span>
                          </div>
                        </td>
                        <td style={{
                          padding: isTotalRow ? '10px 14px' : '6px 14px',
                          fontWeight: isTotalRow ? '900' : '700',
                          color: isTotalRow ? '#854d0e' : (item.color || '#0f172a'),
                          textAlign: 'right',
                          fontSize: isTotalRow ? '14px' : '12.5px'
                        }}>
                          {isTotalRow ? (
                            <span style={{ fontSize: '14.5px', letterSpacing: '-0.2px' }}>
                              ₹ {Number(currentBudgetTotal).toLocaleString('en-IN')}
                            </span>
                          ) : isBlankRow ? (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          ) : isBudgetLocked ? (
                            <span>
                              {Number(item.amount) > 0 ? Number(item.amount).toLocaleString('en-IN') : '0'}
                            </span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>₹</span>
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                value={draftVal !== undefined ? draftVal : item.amount}
                                onChange={(e) => handleBranchParamChange(activeBranch, item.param, e.target.value)}
                                style={{
                                  width: '160px',
                                  padding: '5px 10px',
                                  fontSize: '13px',
                                  fontWeight: '800',
                                  textAlign: 'right',
                                  color: '#0f172a',
                                  backgroundColor: '#ffffff',
                                  border: '1.5px solid #3b82f6',
                                  borderRadius: '6px',
                                  outline: 'none',
                                  boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.15)'
                                }}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: ALL 4 FLEET BUDGET TABLES (KPM, RPS, Common, Univ)   */}
        {/* ------------------------------------------------------------- */}
        {budgetDisplayMode === 'all' && (
          <div style={{
            marginTop: '12px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1.5px solid #cbd5e1',
            padding: '16px 20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            {/* Master Toolbar for All 4 Tables */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1.5px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                  Institutional Fleet Budget Tables (4 Dedicated PostgreSQL Tables)
                </h4>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Edit individual fleet tables or update all budgets at once. Data is persisted directly to <code style={{ backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>transport_budget_kpm</code>, <code style={{ backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>transport_budget_rps</code>, etc.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleUnlockAllBudgets}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    backgroundColor: '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  <Unlock size={12} color="#16a34a" />
                  <span>Unlock All</span>
                </button>

                <button
                  type="button"
                  onClick={handleLockAllBudgets}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    backgroundColor: '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  <Lock size={12} color="#dc2626" />
                  <span>Lock All</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingBudget}
                  onClick={handleSaveAllBranchBudgets}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 16px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    backgroundColor: isSavingBudget ? '#86efac' : '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    cursor: isSavingBudget ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  {isSavingBudget ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>{isSavingBudget ? 'Saving All...' : '💾 Save All 4 Fleet Tables'}</span>
                </button>
              </div>
            </div>

            {/* 2x2 Grid of Dedicated Fleet Budget Tables */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
              gap: '16px'
            }}>
              {TRANSPORT_BRANCHES.filter(b => b.id !== 'all').map(br => {
                const bKey = br.id;
                const bBudget = (branchBudgetsState && branchBudgetsState[bKey]) || DEFAULT_BRANCH_BUDGETS[bKey];
                const bLocked = isBranchLocked(bKey);
                const bDraft = budgetDrafts[bKey] || {};
                const bTotal = getBranchBudgetTotal(bKey);
                const tableName = `transport_budget_${bKey.toLowerCase()}`;

                return (
                  <div
                    key={bKey}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: `1.5px solid ${bLocked ? br.badgeColor + '50' : '#3b82f6'}`,
                      boxShadow: bLocked ? '0 1px 4px rgba(0,0,0,0.03)' : '0 4px 12px rgba(59, 130, 246, 0.1)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Header */}
                    <div style={{
                      padding: '12px 14px',
                      backgroundColor: br.badgeBg,
                      borderBottom: `1.5px solid ${br.badgeColor}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{br.icon}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{br.label}</strong>
                            <span style={{
                              fontSize: '9.5px',
                              fontFamily: 'monospace',
                              fontWeight: '700',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              border: '1px solid #cbd5e1'
                            }}>
                              {tableName}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {bBudget.busCount || 0} Buses • Ceiling: {formatINR(bTotal)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {bLocked ? (
                          <button
                            type="button"
                            onClick={() => handleStartEditBranch(bKey)}
                            title={`Unlock ${br.label} table to edit amounts`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '800',
                              backgroundColor: '#ffffff',
                              color: '#1e293b',
                              border: '1.5px solid #cbd5e1',
                              cursor: 'pointer'
                            }}
                          >
                            <Unlock size={11} color="#2563eb" />
                            <span>Unlock</span>
                          </button>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              disabled={isSavingBudget}
                              onClick={() => handleSaveBranchBudget(bKey)}
                              title={`Save & lock ${br.label} table`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '800',
                                backgroundColor: isSavingBudget ? '#86efac' : '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                cursor: isSavingBudget ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <Save size={11} />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelEditBranch(bKey)}
                              title="Cancel edits"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: '#f1f5f9',
                                color: '#64748b',
                                border: '1px solid #cbd5e1',
                                cursor: 'pointer'
                              }}
                            >
                              <X size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Parameter Rows */}
                    <div style={{ overflowX: 'auto', flex: 1 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                            <th style={{ padding: '6px 12px', fontWeight: '800', color: '#475569', textAlign: 'left' }}>Parameter</th>
                            <th style={{ padding: '6px 12px', fontWeight: '800', color: '#475569', textAlign: 'right' }}>Sanctioned (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(bBudget?.lineItems || []).map((item, idx) => {
                            const isTotalRow = item.isTotal;
                            const isBlankRow = item.isBlank || item.param === 'EMI';
                            const draftVal = bDraft[item.param];

                            return (
                              <tr
                                key={idx}
                                style={{
                                  backgroundColor: isTotalRow ? '#fef08a' : (item.bg || '#ffffff'),
                                  borderBottom: isTotalRow ? '2px solid #ca8a04' : '1px solid #f1f5f9'
                                }}
                              >
                                <td style={{
                                  padding: isTotalRow ? '8px 12px' : '5px 12px',
                                  fontWeight: isTotalRow ? '900' : '600',
                                  color: isTotalRow ? '#854d0e' : '#1e293b'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {!isTotalRow && (
                                      <span style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: item.color || '#3b82f6',
                                        display: 'inline-block',
                                        flexShrink: 0
                                      }} />
                                    )}
                                    <span>{item.param}</span>
                                  </div>
                                </td>
                                <td style={{
                                  padding: isTotalRow ? '8px 12px' : '4px 12px',
                                  fontWeight: isTotalRow ? '900' : '700',
                                  color: isTotalRow ? '#854d0e' : (item.color || '#0f172a'),
                                  textAlign: 'right'
                                }}>
                                  {isTotalRow ? (
                                    <span style={{ fontSize: '13px' }}>
                                      ₹ {Number(bTotal).toLocaleString('en-IN')}
                                    </span>
                                  ) : isBlankRow ? (
                                    <span style={{ color: '#94a3b8' }}>—</span>
                                  ) : bLocked ? (
                                    <span>
                                      {Number(item.amount) > 0 ? Number(item.amount).toLocaleString('en-IN') : '0'}
                                    </span>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                      <span style={{ fontSize: '11px', color: '#64748b' }}>₹</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={draftVal !== undefined ? draftVal : item.amount}
                                        onChange={(e) => handleBranchParamChange(bKey, item.param, e.target.value)}
                                        style={{
                                          width: '130px',
                                          padding: '3px 8px',
                                          fontSize: '12px',
                                          fontWeight: '800',
                                          textAlign: 'right',
                                          color: '#0f172a',
                                          backgroundColor: '#ffffff',
                                          border: '1.5px solid #3b82f6',
                                          borderRadius: '5px',
                                          outline: 'none'
                                        }}
                                      />
                                    </div>
                                  )}
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
          </div>
        )}
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
          {visiblePeriods.map(p => {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
              onClick={() => setActiveView('sheet')}
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

          {/* Universal Lock/Unlock Toggle directly between Page 1 & Page 2 */}
          <button
            type="button"
            onClick={() => handleUniversalToggleLock(editingPeriodId)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '11.5px',
              fontWeight: '800',
              border: `1.5px solid ${isClosed ? '#fca5a5' : '#86efac'}`,
              cursor: 'pointer',
              backgroundColor: isClosed ? '#fef2f2' : '#f0fdf4',
              color: isClosed ? '#b91c1c' : '#15803d',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isClosed ? '0 2px 6px rgba(239, 68, 68, 0.2)' : '0 2px 6px rgba(34, 197, 94, 0.2)',
              transition: 'all 0.15s ease'
            }}
            title={isClosed ? "Click to unlock this month across Page 1 & Page 2" : "Click to lock this month (read-only) across Page 1 & Page 2"}
          >
            {isClosed ? <Lock size={13} color="#b91c1c" /> : <Unlock size={13} color="#15803d" />}
            <span>{isClosed ? 'Unlock Month' : 'Lock Month'}</span>
            <span style={{
              fontSize: '10px',
              fontWeight: '800',
              padding: '1px 6px',
              borderRadius: '9999px',
              backgroundColor: isClosed ? '#fee2e2' : '#dcfce7',
              color: isClosed ? '#991b1b' : '#166534'
            }}>
              {isClosed ? 'Locked' : 'Open'}
            </span>
          </button>

          {/* Formula Details Toggle for Page 1 */}
          {activeView !== 'vehicles' && (
            <button
              type="button"
              onClick={() => setShowFormulaDetails(prev => !prev)}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: '700',
                border: '1.5px solid #cbd5e1',
                cursor: 'pointer',
                backgroundColor: showFormulaDetails ? '#0284c7' : '#ffffff',
                color: showFormulaDetails ? '#ffffff' : '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: showFormulaDetails ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none'
              }}
              title="Toggle Formula & Definition column"
            >
              <Calculator size={12} />
              <span>{showFormulaDetails ? 'Hide fx Formulas' : 'Show fx Formulas'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Lock Status Alert Banner when Month is Locked across Page 1 & Page 2 */}
      {isClosed && (
        <div style={{
          padding: '10px 22px',
          backgroundColor: '#fef2f2',
          borderBottom: '1.5px solid #fecaca',
          color: '#991b1b',
          fontSize: '12.5px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={15} color="#dc2626" />
            <span>
              Month <strong>{currentPeriod?.period_label || activePeriodObj?.period_label}</strong> is <strong>LOCKED (Read-Only)</strong>. Both <strong>Page 1 (Master Spreadsheet)</strong> and <strong>Page 2 (Vehicle Wise Ledger)</strong> are protected against editing.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleUniversalToggleLock(editingPeriodId)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              borderRadius: '6px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
            }}
          >
            <Unlock size={12} />
            <span>Unlock Month Now</span>
          </button>
        </div>
      )}

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
            periods={periods}
            readOnly={isClosed}
            isClosed={isClosed}
            onBranchChange={setActiveBranch}
            onPeriodChange={setEditingPeriodId}
            onSyncCensus={fetchData}
            handleToggleLock={(targetId) => handleUniversalToggleLock(targetId || editingPeriodId)}
          />
        </div>
      ) : (
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
                  {activePeriodObj?.period_label || periods.find(p => String(p.id) === currPeriodIdStr)?.period_label || "Oct'26"}
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
      )}
      {false && (
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
                {visiblePeriods.map(p => {
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
                        {visiblePeriods.map(p => (
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
                      {visiblePeriods.map(p => {
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

      {/* MONTHLY ATTACHMENTS & BILLS MODAL */}
      {showAttachmentsModal && (
        <MonthlyAttachmentsModal
          isOpen={showAttachmentsModal}
          onClose={() => setShowAttachmentsModal(false)}
          module="transport"
          periodId={editingPeriodId}
          periodLabel={activePeriodObj?.period_label || 'Current Period'}
          periods={periods}
          branch={activeBranch}
        />
      )}
    </div>
  );
}
