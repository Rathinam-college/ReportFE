// Official 9 Canonical Hostel Budget Heads from Executive Approval (Jun'26 – Oct'26)
export const HOSTEL_BUDGET_HEADS = [
  { s_no: 1, key: 'budget_rent', head: 'Rent', sanctioned: 84762516, limit: 10595314.5, defaultOct: 0 },
  { s_no: 2, key: 'budget_printing_stationary', head: 'Printing & Stationary Expenses', sanctioned: 15000, limit: 1875, defaultOct: 0 },
  { s_no: 3, key: 'budget_rates_taxes', head: 'Rates & Taxes', sanctioned: 731612, limit: 91451.5, defaultOct: 0 },
  { s_no: 4, key: 'budget_employee_cost', head: 'Employee Cost', sanctioned: 15402907, limit: 1925363.38, defaultOct: 0 },
  { s_no: 5, key: 'budget_management_services', head: 'Hostel Management Services', sanctioned: 30490064, limit: 3811258, defaultOct: 0 },
  { s_no: 6, key: 'budget_utility', head: 'Utility', sanctioned: 32893042, limit: 4111630.25, defaultOct: 0 },
  { s_no: 7, key: 'budget_laundry', head: 'Laundry Expenses', sanctioned: 11728517, limit: 1466064.63, defaultOct: 0 },
  { s_no: 8, key: 'budget_repairs_maintenance', head: 'Repairs and Maintenance', sanctioned: 5425960, limit: 678245, defaultOct: 0 },
  { s_no: 9, key: 'budget_events', head: 'Events', sanctioned: 4000000, limit: 500000, defaultOct: 0 }
];

export const TOTAL_SANCTIONED_BUDGET = 185449618; // ₹18,54,49,618
export const TOTAL_MONTH_LIMIT = 23181202;       // ₹2,31,81,202
export const TOTAL_OCT_ACTUAL = 0;

export const ALL_BUDGET_MONTH_COLS = [
  { key: 'sep_25_actual', label: "Sep'25", periodId: 29 },
  { key: 'oct_26_actual', label: "Oct'25", periodId: 30 },
  { key: 'nov_26_actual', label: "Nov'25", periodId: 31 },
  { key: 'dec_26_actual', label: "Dec'25", periodId: 32 },
  { key: 'jan_27_actual', label: "Jan'26", periodId: 572 },
  { key: 'feb_27_actual', label: "Feb'26", periodId: 573 },
  { key: 'mar_27_actual', label: "Mar'26", periodId: 574 },
  { key: 'apr_27_actual', label: "Apr'26", periodId: 575 },
  { key: 'may_27_actual', label: "May'26", periodId: 576 },
  { key: 'jun_27_actual', label: "Jun'26", periodId: 577 },
  { key: 'jul_27_actual', label: "Jul'26", periodId: 578 },
  { key: 'aug_27_actual', label: "Aug'26", periodId: 579 },
  { key: 'sep_27_actual', label: "Sep'26", periodId: 580 },
];

/**
 * Maps any billing period (by ID, label, or code) to the corresponding 
 * hostel_budget_tracking column name.
 */
export const getBudgetMonthCol = (periodObj, periodId) => {
  const pId = Number(periodId || periodObj?.id);
  const label = (periodObj?.period_label || '').toLowerCase();
  const code = (periodObj?.period_code || '').toLowerCase();

  if (pId === 29 || code.includes('2025-09') || (label.includes('sep') && pId !== 580 && !code.includes('2026-09'))) return 'sep_25_actual';
  if (pId === 30 || label.includes('oct') || code.includes('-10')) return 'oct_26_actual';
  if (pId === 31 || label.includes('nov') || code.includes('-11')) return 'nov_26_actual';
  if (pId === 32 || label.includes('dec') || code.includes('-12')) return 'dec_26_actual';
  if (pId === 572 || label.includes('jan') || code.includes('-01')) return 'jan_27_actual';
  if (pId === 573 || label.includes('feb') || code.includes('-02')) return 'feb_27_actual';
  if (pId === 574 || label.includes('mar') || code.includes('-03')) return 'mar_27_actual';
  if (pId === 575 || label.includes('apr') || code.includes('-04')) return 'apr_27_actual';
  if (pId === 576 || label.includes('may') || code.includes('-05')) return 'may_27_actual';
  if (pId === 577 || label.includes('jun') || code.includes('-06')) return 'jun_27_actual';
  if (pId === 578 || label.includes('jul') || code.includes('-07')) return 'jul_27_actual';
  if (pId === 579 || label.includes('aug') || code.includes('-08')) return 'aug_27_actual';
  if (pId === 580 || label.includes('sep') || code.includes('2026-09')) return 'sep_27_actual';

  return 'oct_26_actual';
};
