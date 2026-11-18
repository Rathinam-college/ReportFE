import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Layers, 
  TrendingUp, 
  Activity, 
  PieChart, 
  Compass, 
  LayoutGrid, 
  AlignLeft 
} from 'lucide-react';
import { formatINR } from '../../../utils/formatters';
import MonthlyExpenseKpis from './MonthlyExpenseKpis';
import MonthlyExpenseControls from './MonthlyExpenseControls';
import MonthlyExpenseChips from './MonthlyExpenseChips';
import MonthlyExpenseCharts from './MonthlyExpenseCharts';
import MonthlyExpenseLegend from './MonthlyExpenseLegend';
import MonthlyExpenseTable from './MonthlyExpenseTable';

// Curated palettes as specified
const MONTH_PALETTE = ['#6c5ce7', '#ff6b9d', '#1fbf8f', '#3fb8ff', '#f5a524'];
const CATEGORY_PALETTE = ['#6c5ce7', '#ff6b9d', '#1fbf8f', '#3fb8ff', '#f5a524', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

export const CHART_MODELS = [
  { id: 'clustered_columns', name: 'Clustered Columns', icon: BarChart3, desc: 'Multi-month comparative bars clustered by expense category with dashed gridlines' },
  { id: 'stacked_columns', name: 'Stacked Columns', icon: Layers, desc: 'Category contribution segments stacked per billing cycle with cycle total headers' },
  { id: 'trend_lines', name: 'Trend Lines', icon: TrendingUp, desc: 'Trajectory progression across billing cycles for each category (requires 2+ cycles)' },
  { id: 'stacked_area', name: 'Stacked Area', icon: Activity, desc: 'Cumulative expenditure volume layered across cycles (requires 2+ cycles)' },
  { id: 'donut_share', name: 'Donut Share', icon: PieChart, desc: 'Proportional category breakdown of overall cycle spend with center total' },
  { id: 'radar_profile', name: 'Radar Profile', icon: Compass, desc: 'Multi-axis cyclical balance profile normalized to peak category spend' },
  { id: 'heatmap_grid', name: 'Heatmap Grid', icon: LayoutGrid, desc: 'Expense intensity matrix highlighting highest monthly cost heads' },
  { id: 'ranking_bars', name: 'Ranking Bars', icon: AlignLeft, desc: 'Ranked categories sorted by total cycle expenditure with share of total' }
];

export default function MonthlyExpenseSection({
  computedMatrix,
  categories = [],
  periods = [],
  selectedModule = 'food',
  onExportReport
}) {
  const [chartModel, setChartModel] = useState('clustered_columns');
  const [reportingCycle, setReportingCycle] = useState('all');
  const [unitMode, setUnitMode] = useState('full'); // 'full' | 'lakhs'
  const [showTable, setShowTable] = useState(true);

  // 1. Filter out non-expense categories (Person, Headcount, Cost Per Person)
  const expenseCategories = useMemo(() => {
    return categories.filter((cat) => {
      const n = String(cat.category_name || cat.name || '').toLowerCase().trim();
      return !(
        n === 'person' ||
        n === 'persons' ||
        n.includes('person') ||
        n.includes('total person') ||
        n.includes('cost per person') ||
        n.includes('per person') ||
        n.includes('total persons') ||
        n.includes('persons count') ||
        n.includes('diners') ||
        n.includes('per meal') ||
        n.includes('cost per meal') ||
        n.includes('unit economics') ||
        n.includes('census') ||
        n.includes('cost / person') ||
        n.includes('cost/person') ||
        n.includes('headcount') ||
        n.includes('student count')
      );
    });
  }, [categories]);

  // 2. Build cycle options dynamically from the existing periods
  const cycleOptions = useMemo(() => {
    const opts = [
      { id: 'all', label: `All Cycles (${periods.length}-Month Aggregate)` }
    ];
    if (periods.length >= 3) {
      const n = Math.min(3, periods.length);
      opts.push({ id: 'first_n', label: `First ${n} Months` });
      opts.push({ id: 'last_n', label: `Last ${n} Months` });
    }
    periods.forEach((p) => {
      opts.push({ id: String(p.id), label: `${p.period_label || p.period_code} (Single Cycle)` });
    });
    return opts;
  }, [periods]);

  // 3. Determine active periods based on selected reportingCycle
  const activePeriods = useMemo(() => {
    if (reportingCycle === 'all') return periods;
    if (reportingCycle === 'first_n') {
      const n = Math.min(3, periods.length);
      return periods.slice(0, n);
    }
    if (reportingCycle === 'last_n') {
      const n = Math.min(3, periods.length);
      return periods.slice(-n);
    }
    const found = periods.filter((p) => String(p.id) === String(reportingCycle));
    return found.length > 0 ? found : periods;
  }, [periods, reportingCycle]);

  // 4. Extract matrix values and calculate totals for active periods
  const { matrixValues, monthTotals, categoryTotals, cycleTotal, monthlyAverage, topHead, peakMonth } = useMemo(() => {
    const mat = {}; // { [monthId]: { [catId]: number } }
    const mTot = {};
    const cTot = {};
    let totalSpend = 0;

    activePeriods.forEach((p) => {
      const pId = p.id;
      mat[pId] = {};
      let monthSum = 0;

      expenseCategories.forEach((cat) => {
        const cId = cat.category_id || cat.id;
        // Priority 1: subtotal amounts for this period
        let val = Number(cat.subtotal?.amounts?.[pId] ?? cat.subtotal?.amounts?.[String(pId)] ?? 0);
        // Priority 2: if subtotal is 0 or undefined, sum line items
        if (!val && cat.items && Array.isArray(cat.items)) {
          val = cat.items.reduce((acc, it) => {
            const itAmt = Number(it.amounts?.[pId] ?? it.amounts?.[String(pId)] ?? 0);
            return acc + itAmt;
          }, 0);
        }

        mat[pId][cId] = val;
        monthSum += val;
        cTot[cId] = (cTot[cId] || 0) + val;
      });

      mTot[pId] = monthSum;
      totalSpend += monthSum;
    });

    const mCount = activePeriods.length || 1;
    const avgMonthly = totalSpend / mCount;

    // Determine top spending head
    let bestHead = { name: '—', amount: 0, percentage: 0 };
    expenseCategories.forEach((cat) => {
      const cId = cat.category_id || cat.id;
      const amt = cTot[cId] || 0;
      if (amt > bestHead.amount) {
        bestHead = {
          name: cat.category_name || cat.name || 'Category',
          amount: amt,
          percentage: totalSpend > 0 ? (amt / totalSpend) * 100 : 0
        };
      }
    });

    // Determine peak month
    let bestMonth = { label: '—', amount: 0 };
    activePeriods.forEach((p) => {
      const pId = p.id;
      const amt = mTot[pId] || 0;
      if (amt >= bestMonth.amount) {
        bestMonth = {
          label: p.period_label || p.period_code || `Month ${pId}`,
          amount: amt
        };
      }
    });

    return {
      matrixValues: mat,
      monthTotals: mTot,
      categoryTotals: cTot,
      cycleTotal: totalSpend,
      monthlyAverage: avgMonthly,
      topHead: bestHead,
      peakMonth: bestMonth
    };
  }, [activePeriods, expenseCategories]);

  // 5. Value formatter adhering to unitMode ('full' | 'lakhs') and en-IN rules
  const formatValue = (val) => {
    const num = Number(val || 0);
    if (unitMode === 'lakhs') {
      return `₹${(num / 100000).toFixed(2)} L`;
    }
    return formatINR(num);
  };

  // 6. CSV Export handler
  const handleExportCSV = () => {
    if (onExportReport) {
      onExportReport();
      return;
    }

    try {
      const headers = ['"Billing period / cycle"', ...expenseCategories.map((c) => `"${c.category_name || c.name}"`), '"Period Total (₹)"'];
      const rows = activePeriods.map((p) => {
        const pId = p.id;
        const vals = expenseCategories.map((c) => {
          const cId = c.category_id || c.id;
          return Number(matrixValues[pId]?.[cId] || 0).toFixed(2);
        });
        const pTotal = Number(monthTotals[pId] || 0).toFixed(2);
        return [`"${p.period_label || p.period_code}"`, ...vals, pTotal];
      });

      // Add Avg and Total rows
      const avgVals = expenseCategories.map((c) => {
        const cId = c.category_id || c.id;
        const cAvg = activePeriods.length > 0 ? (categoryTotals[cId] || 0) / activePeriods.length : 0;
        return cAvg.toFixed(2);
      });
      rows.push(['"Monthly Average"', ...avgVals, monthlyAverage.toFixed(2)]);

      const totVals = expenseCategories.map((c) => {
        const cId = c.category_id || c.id;
        return Number(categoryTotals[cId] || 0).toFixed(2);
      });
      rows.push(['"Cycle Total"', ...totVals, cycleTotal.toFixed(2)]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Rathinam_${selectedModule}_Monthly_Expense_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('CSV export error:', e);
    }
  };

  const currentModelObj = CHART_MODELS.find((m) => m.id === chartModel) || CHART_MODELS[0];

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
      {/* 1. Section Title Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            2
          </span>
          <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Monthly Expense by Category
          </h2>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '800',
              color: '#1d4ed8',
              backgroundColor: '#eff6ff',
              padding: '3px 10px',
              borderRadius: '9999px',
              border: '1px solid #bfdbfe'
            }}
          >
            Visual Distribution & Rankings
          </span>
        </div>

        <div style={{ fontSize: '12.5px', color: '#64748b' }}>
          Category expenditure breakdown, visual distributions & top spending cost heads
        </div>
      </div>

      {/* 2. KPI Strip (4 Cards) */}
      <MonthlyExpenseKpis
        cycleTotal={cycleTotal}
        monthCount={activePeriods.length}
        monthlyAverage={monthlyAverage}
        topHead={topHead}
        peakMonth={peakMonth}
        formatValue={formatValue}
      />

      {/* 3. Main Panel (Card 22px radius, 1px border) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '22px',
          padding: '22px 24px',
          border: '1px solid #e4e8f5',
          boxShadow: '0 2px 10px rgba(20, 26, 51, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* 3a. Control Bar */}
        <MonthlyExpenseControls
          chartModel={chartModel}
          setChartModel={setChartModel}
          modelOptions={CHART_MODELS}
          reportingCycle={reportingCycle}
          setReportingCycle={setReportingCycle}
          cycleOptions={cycleOptions}
          unitMode={unitMode}
          setUnitMode={setUnitMode}
          onExportCSV={handleExportCSV}
          showTable={showTable}
          setShowTable={setShowTable}
        />

        {/* 3b. Quick-Switch Chips */}
        <MonthlyExpenseChips
          chartModel={chartModel}
          setChartModel={setChartModel}
          models={CHART_MODELS}
        />

        {/* 3c. Chart Title & Model Description */}
        <div style={{ padding: '2px 4px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#141a33', margin: 0 }}>
            Monthly Expense by Category • {currentModelObj.name}
          </h3>
          <p style={{ fontSize: '12px', color: '#6a7392', margin: '3px 0 0 0' }}>
            {currentModelObj.desc}
          </p>
        </div>

        {/* 3d. Chart Area in soft rounded container (18px radius) */}
        <div
          style={{
            backgroundColor: '#fafbfe',
            borderRadius: '18px',
            border: '1px solid #eef1fb',
            padding: '16px 20px',
            overflowX: 'auto',
            minHeight: '340px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            scrollbarWidth: 'thin'
          }}
        >
          <MonthlyExpenseCharts
            chartModel={chartModel}
            months={activePeriods}
            categories={expenseCategories}
            matrixValues={matrixValues}
            monthTotals={monthTotals}
            categoryTotals={categoryTotals}
            cycleTotal={cycleTotal}
            unitMode={unitMode}
            formatValue={formatValue}
            monthPalette={MONTH_PALETTE}
            categoryPalette={CATEGORY_PALETTE}
          />
        </div>

        {/* 3e. Legend Row */}
        <MonthlyExpenseLegend
          chartModel={chartModel}
          months={activePeriods}
          categories={expenseCategories}
          monthPalette={MONTH_PALETTE}
          categoryPalette={CATEGORY_PALETTE}
        />

        {/* 3f. Values Table (Below) */}
        {showTable && (
          <MonthlyExpenseTable
            months={activePeriods}
            categories={expenseCategories}
            matrixValues={matrixValues}
            monthTotals={monthTotals}
            categoryTotals={categoryTotals}
            cycleTotal={cycleTotal}
            monthlyAverage={monthlyAverage}
            formatValue={formatValue}
            monthPalette={MONTH_PALETTE}
          />
        )}
      </div>
    </section>
  );
}
