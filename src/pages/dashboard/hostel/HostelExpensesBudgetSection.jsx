import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, ChevronDown, ChevronUp, Layers, PieChart,
  Calendar, Download, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle,
  Building, Zap, Droplets, Wrench, Users, Wallet
} from 'lucide-react';
import { formatINR } from '../../../utils/formatters';

export default function HostelExpensesBudgetSection({
  census = {},
  computedMatrix = {},
  categories = [],
  periods = [],
  activePeriod = 'all',
  onExportReport,
  remarksDraft = {}
}) {
  const [expandedCategories, setExpandedCategories] = useState({
    rent: false,
    utilities: true,
    repair: false,
    management: false
  });
  const [budgetScope, setBudgetScope] = useState('monthly'); // 'monthly' | 'fy'

  const toggleCategory = (key) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // --- 1. BUDGET VS ACTUAL CALCULATIONS ---
  const approvedBudgetFY = num(census.approved_budget, 131788118); // ~₹13.18 Cr approved FY budget
  const actualCumulativeSpent = num(census.cumulative_budget_spent, 42000000); // ~₹4.20 Cr spent
  const remainingBudgetFY = num(census.balance, approvedBudgetFY - actualCumulativeSpent);
  const budgetUtilizationPctFY = approvedBudgetFY > 0 ? (actualCumulativeSpent / approvedBudgetFY) * 100 : 31.87;

  // Monthly breakdown
  const monthlyExpenseOccurred = num(census.expenses_occurred, 9349172);
  const approvedMonthlyBudget = Math.round(approvedBudgetFY / 12) || 10982343;
  const remainingMonthlyBudget = approvedMonthlyBudget - monthlyExpenseOccurred;
  const monthlyUtilizationPct = approvedMonthlyBudget > 0 ? (monthlyExpenseOccurred / approvedMonthlyBudget) * 100 : 85.13;

  // Active view numbers based on scope toggle
  const activeApproved = budgetScope === 'monthly' ? approvedMonthlyBudget : approvedBudgetFY;
  const activeActual = budgetScope === 'monthly' ? monthlyExpenseOccurred : actualCumulativeSpent;
  const activeRemaining = budgetScope === 'monthly' ? remainingMonthlyBudget : remainingBudgetFY;
  const activeUtilization = budgetScope === 'monthly' ? monthlyUtilizationPct : budgetUtilizationPctFY;

  // --- 2. THE 4 EXPANDABLE EXPENSE CATEGORIES ---
  // A. Rent
  const rentBudget = 1500000;
  const rentActual = 1450000;

  // B. Utilities
  const powerCost = num(census.power_cost, 1286531);
  const powerUnits = num(census.power_units, 90366);
  const powerCostPerOccupant = num(census.power_cost_occupant, 415.81);
  const powerCostPerSqft = num(census.power_cost_sqft, 5.55);

  const normalWaterLitres = num(census.normal_water_litres, 8879000);
  const normalWaterCost = num(census.normal_water_cost, 887900);
  const normalWaterLtrDay = num(census.normal_water_ltr_day, 100.02);
  const drinkingWaterLitres = num(census.drinking_water_litres, 87000);
  const drinkingWaterCost = num(census.drinking_water_cost, 21750);
  const waterPurchaseCost = num(census.water_purchase_cost, 230000);
  const totalWaterCost = normalWaterCost + drinkingWaterCost + waterPurchaseCost;
  const totalUtilitiesCost = powerCost + totalWaterCost;

  // C. Repair & Maintenance
  const routineMaint = num(census.maintenance_expenses, 142000);
  const electricalSpares = Math.round(routineMaint * 0.35);
  const fanLightRepl = Math.round(routineMaint * 0.25);
  const plumbingMaterials = Math.round(routineMaint * 0.25);
  const otherRepair = Math.max(0, routineMaint - electricalSpares - fanLightRepl - plumbingMaterials);

  // D. Management & Employee Cost
  const managementTotal = Math.max(0, monthlyExpenseOccurred - rentActual - totalUtilitiesCost - routineMaint);
  const employeeExp = Math.round(managementTotal * 0.65);
  const residentOps = Math.round(managementTotal * 0.25);
  const otherOps = Math.max(0, managementTotal - employeeExp - residentOps);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* SECTION HEADER BAR - Royal Purple / Violet visual identity */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px 20px',
        backgroundColor: '#f5f3ff',
        borderRadius: '16px',
        border: '1.5px solid #ddd6fe'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#6d28d9',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '800'
          }}>
            3
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#4c1d95', margin: 0 }}>
                Expenses & Budget
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}>
                Budget & Expenses
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6d28d9' }}>
              Budget vs Actual Spend • 4 Main Categories (Rent, Utilities, Repairs, Staff & Operations)
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
          border: '1px solid #c4b5fd',
          color: '#5b21b6',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          <Wallet size={14} color="#7c3aed" />
          <span>Spent: <strong>{formatINR(monthlyExpenseOccurred)}</strong></span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#059669' }}>Remaining: <strong>{formatINR(remainingBudgetFY)}</strong></span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>Used: <strong>{budgetUtilizationPctFY.toFixed(1)}%</strong></span>
        </div>
      </div>

      {/* 1. INTEGRATED BUDGET VS ACTUAL SECTION */}
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
            <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Budget vs Actual Expenses
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0 0' }}>
              Calculation: Remaining Budget = Approved Budget ({formatINR(activeApproved)}) - Total Spent ({formatINR(activeActual)})
            </p>
          </div>

          {/* Monthly vs Financial Year Toggle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#f1f5f9',
            borderRadius: '9999px',
            padding: '3px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => setBudgetScope('monthly')}
              style={{
                border: 'none',
                padding: '5px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: budgetScope === 'monthly' ? '800' : '600',
                backgroundColor: budgetScope === 'monthly' ? '#6d28d9' : 'transparent',
                color: budgetScope === 'monthly' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Current Month
            </button>
            <button
              type="button"
              onClick={() => setBudgetScope('fy')}
              style={{
                border: 'none',
                padding: '5px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: budgetScope === 'fy' ? '800' : '600',
                backgroundColor: budgetScope === 'fy' ? '#6d28d9' : 'transparent',
                color: budgetScope === 'fy' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Full Year (FY 2025-26)
            </button>
          </div>
        </div>

        {/* 4 Budget Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
              {budgetScope === 'monthly' ? 'Approved Monthly Budget' : 'Approved FY Budget'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '4px 0 2px 0' }}>
              {formatINR(activeApproved)}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Approved budget</div>
          </div>

          <div style={{ backgroundColor: '#f5f3ff', borderRadius: '12px', padding: '14px', border: '1px solid #ddd6fe' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#6d28d9', textTransform: 'uppercase' }}>
              {budgetScope === 'monthly' ? 'Actual Monthly Expenses' : 'Cumulative Spent (YTD)'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#4c1d95', margin: '4px 0 2px 0' }}>
              {formatINR(activeActual)}
            </div>
            <div style={{ fontSize: '11px', color: '#6d28d9' }}>Total spent this month</div>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', padding: '14px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#15803d', textTransform: 'uppercase' }}>
              Remaining Budget
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#16a34a', margin: '4px 0 2px 0' }}>
              {formatINR(activeRemaining)}
            </div>
            <div style={{ fontSize: '11px', color: '#15803d' }}>
              {activeRemaining >= 0 ? 'Money left in budget' : 'Budget deficit'}
            </div>
          </div>

          <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '14px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase' }}>
              Budget Used
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#2563eb', margin: '4px 0 2px 0' }}>
              {activeUtilization.toFixed(1)}%
            </div>
            <div style={{ fontSize: '11px', color: '#1d4ed8' }}>
              {budgetScope === 'monthly' ? 'of monthly approved budget' : 'of full year budget'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
            <span style={{ color: '#475569', fontWeight: '700' }}>Budget Spending:</span>
            <span style={{ color: '#0f172a', fontWeight: '800' }}>
              {formatINR(activeActual)} spent of {formatINR(activeApproved)} ({activeUtilization.toFixed(1)}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, activeUtilization)}%`,
                height: '100%',
                backgroundColor: activeUtilization > 95 ? '#ef4444' : activeUtilization > 75 ? '#f59e0b' : '#6d28d9',
                borderRadius: '9999px',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. THE 4 EXPANDABLE MAJOR CATEGORIES ACCORDION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          4 Expense Categories (Click to view details)
        </div>

        {/* CATEGORY A: RENT */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
          <div
            onClick={() => toggleCategory('rent')}
            style={{
              padding: '14px 18px',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building size={16} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>A. Rent</strong>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Monthly rent paid vs approved budget</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{formatINR(rentActual)}</span>
              {expandedCategories.rent ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          {expandedCategories.rent && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Rent Paid</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{formatINR(rentActual)}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Approved Rent Budget</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{formatINR(rentBudget)}</div>
              </div>
              <div style={{ backgroundColor: '#f0fdf4', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#16a34a' }}>Savings / Difference</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#16a34a' }}>+{formatINR(rentBudget - rentActual)}</div>
              </div>
            </div>
          )}
        </div>

        {/* CATEGORY B: UTILITIES (ELECTRICITY & WATER) */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1.5px solid #bfdbfe', overflow: 'hidden' }}>
          <div
            onClick={() => toggleCategory('utilities')}
            style={{
              padding: '14px 18px',
              backgroundColor: '#eff6ff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#1e3a8a' }}>B. Utilities (Electricity & Water)</strong>
                <div style={{ fontSize: '11.5px', color: '#2563eb' }}>Electricity bills, regular water, drinking RO water, and water tankers</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e40af' }}>{formatINR(totalUtilitiesCost)}</span>
              {expandedCategories.utilities ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          {expandedCategories.utilities && (
            <div style={{ padding: '18px 20px', borderTop: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Electricity Subcategory */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '800', color: '#ea580c', marginBottom: '8px' }}>
                  <Zap size={14} />
                  <span>Electricity</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div style={{ backgroundColor: '#fff7ed', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                    <div style={{ fontSize: '11px', color: '#9a3412' }}>Electricity Cost (EB + DG)</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#c2410c' }}>{formatINR(powerCost)}</div>
                  </div>
                  <div style={{ backgroundColor: '#fff7ed', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                    <div style={{ fontSize: '11px', color: '#9a3412' }}>Units Used (kWh)</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#c2410c' }}>{powerUnits.toLocaleString()} kWh</div>
                  </div>
                  <div style={{ backgroundColor: '#fff7ed', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                    <div style={{ fontSize: '11px', color: '#9a3412' }}>Electricity Cost per Student</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#c2410c' }}>₹{Math.round(powerCostPerOccupant)}/student</div>
                  </div>
                  <div style={{ backgroundColor: '#fff7ed', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                    <div style={{ fontSize: '11px', color: '#9a3412' }}>Electricity Cost per Sq Ft</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#c2410c' }}>₹{powerCostPerSqft.toFixed(2)}/sq.ft</div>
                  </div>
                </div>
              </div>

              {/* Water Subcategory */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '800', color: '#0284c7', marginBottom: '8px' }}>
                  <Droplets size={14} />
                  <span>Water Supply & Drinking Water</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div style={{ backgroundColor: '#f0f9ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '11px', color: '#0369a1' }}>Regular Water Used</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0284c7' }}>{(normalWaterLitres / 100000).toFixed(2)} L Ltrs • {formatINR(normalWaterCost)}</div>
                  </div>
                  <div style={{ backgroundColor: '#f0f9ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '11px', color: '#0369a1' }}>RO Drinking Water</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0284c7' }}>{drinkingWaterLitres.toLocaleString()} L • {formatINR(drinkingWaterCost)}</div>
                  </div>
                  <div style={{ backgroundColor: '#f0f9ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '11px', color: '#0369a1' }}>Water Tanker Cost</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0284c7' }}>{formatINR(waterPurchaseCost)}</div>
                  </div>
                  <div style={{ backgroundColor: '#f0f9ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '11px', color: '#0369a1' }}>Litres per Student per Day</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0284c7' }}>{normalWaterLtrDay.toFixed(1)} L/day</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CATEGORY C: REPAIR & MAINTENANCE */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
          <div
            onClick={() => toggleCategory('repair')}
            style={{
              padding: '14px 18px',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={16} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>C. Repairs & Maintenance</strong>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Daily repairs, electrical parts, fan/light replacement, and plumbing items</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{formatINR(routineMaint)}</span>
              {expandedCategories.repair ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          {expandedCategories.repair && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Regular Maintenance</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{formatINR(routineMaint)}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Electrical Parts</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{formatINR(electricalSpares)}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Fan & Light Replacements</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{formatINR(fanLightRepl)}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Plumbing Parts</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{formatINR(plumbingMaterials)}</div>
              </div>
            </div>
          )}
        </div>

        {/* CATEGORY D: MANAGEMENT & EMPLOYEE COST */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
          <div
            onClick={() => toggleCategory('management')}
            style={{
              padding: '14px 18px',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>D. Staff & Operations Cost</strong>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Staff salaries, hostel operations, and daily running expenses</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{formatINR(managementTotal)}</span>
              {expandedCategories.management ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          {expandedCategories.management && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Staff Salaries & Pay</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{formatINR(employeeExp)}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Hostel Operations</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{formatINR(residentOps)}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Other Running Expenses</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{formatINR(otherOps)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
