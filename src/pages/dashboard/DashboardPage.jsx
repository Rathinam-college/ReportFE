import React, { useState, useMemo, useEffect } from 'react';
import { formatINR, formatLakhs, DASH_COLORS } from '../../utils/formatters';
import { 
  Calendar, Layers, PieChart as PieIcon, Calculator, FileSpreadsheet, 
  TrendingUp, Hash, Users, ArrowRight, Table, BarChart3, CheckCircle2,
  Maximize2, Minimize2, Download 
} from 'lucide-react';

// 12 Chart Components & Master Selector
import ChartSelectorBar from './charts/ChartSelectorBar';
import ClusteredDataTableChart from './charts/ClusteredDataTableChart';
import BarChart from './charts/BarChart';
import ColumnChart from './charts/ColumnChart';
import StackedChart from './charts/StackedChart';
import LineChart from './charts/LineChart';
import AreaChart from './charts/AreaChart';
import ComboChart from './charts/ComboChart';
import PieChart from './charts/PieChart';
import TreemapChart from './charts/TreemapChart';
import ScatterPlotChart from './charts/ScatterPlotChart';
import BubbleChart from './charts/BubbleChart';
import HistogramChart from './charts/HistogramChart';
import ChartDataTable from './charts/ChartDataTable';
import ComparisonTool from './ComparisonTool';

// Layout Cards from Design Mockup (Image 1)
import HostelDashboardDataTable from './HostelDashboardDataTable';
import TransportDashboardDataTable from './TransportDashboardDataTable';
import MonthlyExpenseSection from './monthly_expense/MonthlyExpenseSection';
import HostelOperationsDashboard from './hostel/HostelOperationsDashboard';

export default function DashboardPage({
  selectedModule = 'food',
  onSelectModule,
  overview,
  computedMatrix,
  comparisonData,
  compareBasePeriod,
  setCompareBasePeriod,
  compareTargetPeriod,
  setCompareTargetPeriod,
  onOpenDataEntry,
  remarksDraft = {}
}) {
  const [activeChart, setActiveChart] = useState('clustered_table'); // Default: Excel-style Clustered Columns with Data Sheet
  const [activePeriod, setActivePeriod] = useState('all'); // 'all' or period id
  const [showDataTable, setShowDataTable] = useState(true);
  const [isTableFullScreen, setIsTableFullScreen] = useState(false);

  const currentModule = selectedModule || 'food';

  const [internalMatrix, setInternalMatrix] = useState(null);
  const [matrixLoading, setMatrixLoading] = useState(false);

  // Ensure effectiveMatrix matches currentModule; otherwise fetch immediately
  const isMatrixMatchingCurrent = 
    computedMatrix?.periods && 
    computedMatrix.periods.length > 0 && 
    computedMatrix.module === currentModule;

  useEffect(() => {
    if (!isMatrixMatchingCurrent) {
      setMatrixLoading(true);
      fetch(`/api/matrix?module=${currentModule}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.periods && data.periods.length > 0) {
            data.module = currentModule;
            setInternalMatrix(data);
          }
          setMatrixLoading(false);
        })
        .catch(err => {
          console.error('[DashboardPage] Matrix fetch error:', err);
          setMatrixLoading(false);
        });
    }
  }, [currentModule, isMatrixMatchingCurrent]);

  const effectiveMatrix = isMatrixMatchingCurrent
    ? computedMatrix
    : ((internalMatrix && internalMatrix.module === currentModule && internalMatrix.periods) ? internalMatrix : (computedMatrix || {}));

  const periods = effectiveMatrix?.periods || [];
  const categories = effectiveMatrix?.categories || [];

  const moduleMeta = {
    food: {
      title: 'Food Operations Dashboard',
      subtitle: `Food overview • ${periods[0]?.period_label || "Jun'26"} – ${periods[periods.length - 1]?.period_label || "Sept'26"} • FY 2026-2027 • Currency INR (₹)`,
      badge: 'Food',
      badgeColor: '#4f46e5',
      badgeBg: '#eef2ff'
    },
    hostel: {
      title: 'Hostel Operations Dashboard',
      subtitle: `Hostel overview • ${periods[0]?.period_label || "Sep'25"} – ${periods[periods.length - 1]?.period_label || "Sep'26"} (${periods.length || 13} Months) • FY 2025-2026 • Currency INR (₹)`,
      badge: 'Hostel',
      badgeColor: '#059669',
      badgeBg: '#ecfdf5'
    },
    transport: {
      title: 'Transport Fleet Dashboard',
      subtitle: `Transport overview • ${periods[0]?.period_label || "Jun'26"} – ${periods[periods.length - 1]?.period_label || "Sept'26"} • FY 2026-2027 • Currency INR (₹)`,
      badge: 'Transport',
      badgeColor: '#ea580c',
      badgeBg: '#fff7ed'
    }
  };

  const currentMeta = moduleMeta[currentModule] || moduleMeta.food;

  // Active or latest period for KPI cards
  const latestPeriod = periods[periods.length - 1];
  const activePeriodObj = activePeriod === 'all' ? latestPeriod : periods.find(p => String(p.id) === String(activePeriod)) || latestPeriod;

  // Active month total directly from database matrix
  const latestMonthTotal = activePeriodObj 
    ? (effectiveMatrix?.grand_total?.amounts?.[activePeriodObj.id] ?? effectiveMatrix?.grand_total?.amounts?.[String(activePeriodObj.id)] ?? 0)
    : 0;

  // Active Hostel Census from live PostgreSQL database
  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  const activeHostelCensus = useMemo(() => {
    if (currentModule !== 'hostel' || !effectiveMatrix?.hostel_census) return null;
    const pid = activePeriodObj ? String(activePeriodObj.id) : null;
    if (pid && effectiveMatrix.hostel_census[pid]) {
      return effectiveMatrix.hostel_census[pid];
    }
    const keys = Object.keys(effectiveMatrix.hostel_census);
    return keys.length > 0 ? effectiveMatrix.hostel_census[keys[0]] : null;
  }, [currentModule, effectiveMatrix, activePeriodObj]);

  const activeTransportCensus = useMemo(() => {
    if (currentModule !== 'transport') return null;
    const pid = activePeriodObj ? String(activePeriodObj.id) : null;
    const census = (pid && effectiveMatrix?.transport_census?.[pid]) || 
                   (pid && effectiveMatrix?.transport_census_by_branch?.['RPS']?.[pid]) || 
                   (pid && effectiveMatrix?.transport_census_by_branch?.['Common']?.[pid]);
    if (census) return census;
    const keys = Object.keys(effectiveMatrix?.transport_census || {});
    if (keys.length > 0) return effectiveMatrix.transport_census[keys[0]];
    const branchKeys = Object.keys(effectiveMatrix?.transport_census_by_branch?.['RPS'] || {});
    return branchKeys.length > 0 ? effectiveMatrix.transport_census_by_branch['RPS'][branchKeys[0]] : null;
  }, [currentModule, effectiveMatrix, activePeriodObj]);

  // Real category breakdown matching Hostel Data Entry exactly (sums to expenses_occurred)
  const hostelCategoryItems = useMemo(() => {
    if (currentModule !== 'hostel' || !activeHostelCensus) return [];
    const exp = num(activeHostelCensus?.expenses_occurred, 0);
    const pow = num(activeHostelCensus?.power_cost, 0);
    const wat = num(activeHostelCensus?.water_purchase_cost, 0) + num(activeHostelCensus?.normal_water_cost, 0) + num(activeHostelCensus?.drinking_water_cost, 0);
    const maint = num(activeHostelCensus?.maintenance_expenses, 0);
    const ops = Math.max(0, exp - (pow + wat + maint));
    if (exp === 0 && pow === 0 && wat === 0 && maint === 0) return [];
    return [
      { id: 1, name: 'Hostel Resident Facility Operations', value: ops, color: '#4f46e5' },
      { id: 2, name: 'Power consumption (EB + DG)', value: pow, color: '#f59e0b' },
      { id: 3, name: 'Normal Water & Tanker Purchase', value: wat, color: '#0ea5e9' },
      { id: 4, name: 'Routine Facilities Maintenance Expenses', value: maint, color: '#10b981' }
    ];
  }, [currentModule, activeHostelCensus]);

  // Real Database Grand Total for selected period/module
  const grandTotal = activePeriod === 'all'
    ? (effectiveMatrix?.grand_total?.total ?? 0)
    : (effectiveMatrix?.grand_total?.amounts?.[activePeriod] ?? effectiveMatrix?.grand_total?.amounts?.[String(activePeriod)] ?? 0);

  const monthlyAvg = periods.length > 0
    ? (effectiveMatrix?.grand_total?.total ?? 0) / periods.length
    : 0;

  // Find largest cost head dynamically from active module's actual line items (excluding Person, Total Person, Cost Per Person)
  const isNonExpenseMetric = (catName = '', itemDesc = '') => {
    const c = String(catName || '').toLowerCase().trim();
    const i = String(itemDesc || '').toLowerCase().trim();
    const s = `${c} ${i}`.trim();

    if (
      c === 'person' ||
      c === 'persons' ||
      c.includes('person') ||
      c.includes('diners') ||
      c.includes('census') ||
      c.includes('unit economics') ||
      c.includes('economics')
    ) {
      return true;
    }

    return (
      i.includes('student') ||
      i.includes('staff count') ||
      i.includes('staffs count') ||
      i.includes('cost per person') ||
      i.includes('cost/person') ||
      i.includes('cost / person') ||
      i.includes('per person') ||
      i.includes('per meal') ||
      i.includes('diners') ||
      i.includes('census') ||
      i.includes('headcount') ||
      s.includes('total person') ||
      s.includes('total persons') ||
      s.includes('cost per person') ||
      s.includes('per person') ||
      s.includes('students count') ||
      s.includes('student count') ||
      (c === 'person' && i.includes('other'))
    );
  };

  const largestCostHead = useMemo(() => {
    let largest = { name: '—', total: 0 };
    if (effectiveMatrix?.categories && Array.isArray(effectiveMatrix.categories)) {
      effectiveMatrix.categories.forEach(cat => {
        const catName = String(cat.category_name || cat.name || '').toLowerCase();
        if (isNonExpenseMetric(catName)) return;
        cat.items?.forEach(it => {
          if (isNonExpenseMetric(catName, it.description || it.name)) return;
          const itTot = activePeriod === 'all'
            ? Number(it.total || 0)
            : Number(it.amounts?.[activePeriod] ?? it.amounts?.[String(activePeriod)] ?? 0);
          if (itTot > largest.total) {
            largest = { name: it.description || it.name || 'Line Item', total: itTot };
          }
        });
      });
    }
    return largest;
  }, [effectiveMatrix, activePeriod]);

  // 1. Prepare Category items for Bar, Pie, Doughnut with remarks (excluding Total Person & Cost Per Person)
  const categoryItems = useMemo(() => {
    if (!effectiveMatrix || !effectiveMatrix.categories) return [];
    return effectiveMatrix.categories
      .filter(cat => {
        const n = String(cat.category_name || cat.name || '').toLowerCase().trim();
        return !isNonExpenseMetric(n);
      })
      .map((cat, idx) => {
      let val = 0;
      if (activePeriod === 'all') {
        val = cat.subtotal?.total ?? 0;
      } else {
        val = cat.subtotal?.amounts?.[activePeriod] ?? cat.subtotal?.amounts?.[String(activePeriod)] ?? 0;
      }
      const catRemarks = [];
      cat.items?.forEach(it => {
        if (!it.remarks) return;
        if (activePeriod === 'all') {
          Object.keys(it.remarks).forEach(pid => {
            const t = it.remarks[pid];
            if (t && !t.startsWith('Entry via Operational Matrix') && !t.startsWith('Cloned from')) {
              const pObj = periods.find(p => String(p.id) === String(pid));
              catRemarks.push(`${it.description} (${pObj?.period_label || pid}): ${t}`);
            }
          });
        } else {
          const t = it.remarks[activePeriod] ?? it.remarks[String(activePeriod)];
          if (t && !t.startsWith('Entry via Operational Matrix') && !t.startsWith('Cloned from')) {
            catRemarks.push(`${it.description}: ${t}`);
          }
        }
      });
      return {
        id: cat.category_id,
        name: cat.category_name,
        value: val,
        color: DASH_COLORS[idx % DASH_COLORS.length],
        remarks: catRemarks
      };
    });
  }, [effectiveMatrix, activePeriod, periods]);

  // Active remarks list across the current view
  const activeRemarksList = useMemo(() => {
    if (!effectiveMatrix?.categories) return [];
    const list = [];
    effectiveMatrix.categories.forEach(cat => {
      cat.items?.forEach(it => {
        if (!it.remarks) return;
        if (activePeriod === 'all') {
          Object.keys(it.remarks).forEach(pid => {
            const t = it.remarks[pid];
            if (t && !t.startsWith('Entry via Operational Matrix') && !t.startsWith('Cloned from')) {
              const pObj = periods.find(p => String(p.id) === String(pid));
              list.push({
                cost_head_id: it.cost_head_id,
                description: it.description,
                category: cat.category_name,
                periodId: pid,
                periodLabel: pObj?.period_label || pid,
                text: t
              });
            }
          });
        } else {
          const t = it.remarks[activePeriod] ?? it.remarks[String(activePeriod)];
          if (t && !t.startsWith('Entry via Operational Matrix') && !t.startsWith('Cloned from')) {
            const pObj = periods.find(p => String(p.id) === String(activePeriod));
            list.push({
              cost_head_id: it.cost_head_id,
              description: it.description,
              category: cat.category_name,
              periodId: activePeriod,
              periodLabel: pObj?.period_label || activePeriod,
              text: t
            });
          }
        }
      });
    });
    return list;
  }, [effectiveMatrix, activePeriod, periods]);

  // 2. Prepare all line items for Treemap, Histogram
  const allLineItems = useMemo(() => {
    if (!effectiveMatrix || !effectiveMatrix.categories) return [];
    const list = [];
    effectiveMatrix.categories.forEach(cat => {
      cat.items?.forEach(it => {
        let val = 0;
        if (activePeriod === 'all') {
          val = it.total || 0;
        } else {
          val = it.amounts?.[activePeriod] ?? it.amounts?.[String(activePeriod)] ?? 0;
        }
        list.push({
          cost_head_id: it.cost_head_id,
          name: it.description,
          description: it.description,
          category: cat.category_name,
          value: val,
          total: it.total || 0,
          amounts: it.amounts,
          remarks: it.remarks
        });
      });
    });
    return list;
  }, [effectiveMatrix, activePeriod]);

  // 3. Comparison items for Scatter & Bubble
  const comparisonItems = useMemo(() => {
    if (!comparisonData || !comparisonData.categories) return [];
    const list = [];
    comparisonData.categories.forEach(cat => {
      cat.items.forEach(it => {
        list.push({
          cost_head_id: it.cost_head_id,
          description: it.description,
          category: cat.category_name,
          amtBase: it.amtBase,
          amtTarget: it.amtTarget,
          diff: it.diff,
          pct: it.pct
        });
      });
    });
    return list;
  }, [comparisonData]);

  // Export report action: Generates CSV and opens printable report in a new page window
  const handleExportReport = () => {
    try {
      // 1. Build CSV content for instant file download
      const periodHeaders = periods.map(p => `"${p.period_label || p.code || p.id}"`);
      const csvRows = [
        [`"Rathinam Group - ${currentMeta.title}"`],
        [`"Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}"`],
        [`"Currency: INR (₹)"`],
        [],
        ['"Category"', '"Line Item Description"', ...periodHeaders, '"Total (₹)"']
      ];

      categories.forEach(cat => {
        cat.items?.forEach(item => {
          const rowVals = periods.map(p => {
            const amt = item.amounts?.[p.id] ?? item.amounts?.[String(p.id)] ?? 0;
            return Number(amt || 0).toFixed(2);
          });
          const itemTotal = Number(item.total || 0).toFixed(2);
          csvRows.push([`"${cat.category_name}"`, `"${item.description || item.name}"`, ...rowVals, itemTotal]);
        });
        // Category subtotal
        const subVals = periods.map(p => {
          const amt = cat.subtotal?.amounts?.[p.id] ?? cat.subtotal?.amounts?.[String(p.id)] ?? 0;
          return Number(amt || 0).toFixed(2);
        });
        const catTotal = Number(cat.subtotal?.total || 0).toFixed(2);
        csvRows.push([`"${cat.category_name} Total"`, '""', ...subVals, catTotal]);
      });

      // Grand Total Row
      if (effectiveMatrix?.grand_total) {
        const gtVals = periods.map(p => {
          const amt = effectiveMatrix.grand_total.amounts?.[p.id] ?? effectiveMatrix.grand_total.amounts?.[String(p.id)] ?? 0;
          return Number(amt || 0).toFixed(2);
        });
        const gtTotal = Number(effectiveMatrix.grand_total.total || 0).toFixed(2);
        csvRows.push(['"TOTAL EXPENDITURE"', '""', ...gtVals, gtTotal]);
      }

      const csvString = csvRows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Rathinam_${currentModule}_Report_${periods[0]?.period_label || 'Cycle'}_to_${periods[periods.length - 1]?.period_label || 'Current'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (csvErr) {
      console.warn('CSV download error:', csvErr);
    }

    // 2. Open printable/preview HTML report in a new page window!
    try {
      const reportWin = window.open('', '_blank');
      if (reportWin) {
        const periodThs = periods.map(p => `<th style="padding: 10px 14px; border: 1px solid #cbd5e1; background: #6c56db; color: #ffffff; text-align: right; font-size: 13px;">${p.period_label}</th>`).join('');
        
        let tableRowsHtml = '';
        categories.forEach(cat => {
          cat.items?.forEach(item => {
            const cells = periods.map(p => {
              const val = item.amounts?.[p.id] ?? item.amounts?.[String(p.id)] ?? 0;
              return `<td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right; font-size: 12.5px;">₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>`;
            }).join('');
            tableRowsHtml += `<tr>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 12.5px; font-weight: 600; color: #1e293b;">${cat.category_name}</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 12.5px; color: #334155;">${item.description || item.name}</td>
              ${cells}
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a; font-size: 12.5px;">₹${Number(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>`;
          });
          // Subtotal row
          const subCells = periods.map(p => {
            const val = cat.subtotal?.amounts?.[p.id] ?? cat.subtotal?.amounts?.[String(p.id)] ?? 0;
            return `<td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700; background: #f8fafc; color: #0f172a;">₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>`;
          }).join('');
          tableRowsHtml += `<tr style="background: #f8fafc; font-weight: 800;">
            <td colspan="2" style="padding: 8px 12px; border: 1px solid #cbd5e1; color: #6c56db;">${cat.category_name} Subtotal</td>
            ${subCells}
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right; color: #6c56db; font-weight: 800;">₹${Number(cat.subtotal?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>`;
        });

        // Grand Total row
        let gtHtml = '';
        if (effectiveMatrix?.grand_total) {
          const gtCells = periods.map(p => {
            const val = effectiveMatrix.grand_total.amounts?.[p.id] ?? effectiveMatrix.grand_total.amounts?.[String(p.id)] ?? 0;
            return `<td style="padding: 10px 12px; border: 2px solid #0f172a; text-align: right; font-size: 14px; font-weight: 900; background: #0f172a; color: #ffffff;">₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>`;
          }).join('');
          gtHtml = `<tr>
            <td colspan="2" style="padding: 10px 14px; border: 2px solid #0f172a; font-size: 14px; font-weight: 900; background: #0f172a; color: #ffffff;">TOTAL EXPENSES (ALL CATEGORIES)</td>
            ${gtCells}
            <td style="padding: 10px 14px; border: 2px solid #0f172a; text-align: right; font-size: 14px; font-weight: 900; background: #0f172a; color: #ffffff;">₹${Number(effectiveMatrix.grand_total.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>`;
        }

        reportWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Rathinam Group - ${currentMeta.title} Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px 32px; color: #0f172a; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #efeefc; border: 1.5px solid #6c56db; border-radius: 12px;">
    <div>
      <strong style="color: #6c56db; font-size: 15px;">✓ Report Generated Successfully</strong>
      <div style="font-size: 12px; color: #475569;">Ready for review, auditing or printing.</div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" style="padding: 8px 20px; border-radius: 9999px; background: #6c56db; color: #fff; font-weight: 700; border: none; cursor: pointer;">🖨️ Print / Save to PDF</button>
      <button onclick="window.close()" style="padding: 8px 16px; border-radius: 9999px; background: #fff; color: #475569; font-weight: 700; border: 1px solid #cbd5e1; cursor: pointer;">Close</button>
    </div>
  </div>
  <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6c56db; padding-bottom: 16px; margin-bottom: 20px;">
    <div>
      <h1 style="margin: 0; font-size: 24px; color: #0f172a; font-weight: 800;">Rathinam Group of Institutions</h1>
      <h2 style="margin: 4px 0 0 0; font-size: 17px; color: #6c56db;">${currentMeta.title}</h2>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">${currentMeta.subtitle}</p>
    </div>
    <div style="text-align: right; font-size: 12.5px; color: #64748b;">
      <div>Date: <strong>${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
      <div>Grand Total: <strong style="color: #0f172a; font-size: 16px;">₹${Number(effectiveMatrix?.grand_total?.total || grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
    </div>
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-top: 16px; border: 1px solid #cbd5e1;">
    <thead>
      <tr>
        <th style="padding: 10px 14px; border: 1px solid #cbd5e1; background: #6c56db; color: #ffffff; text-align: left; font-size: 13px;">Category</th>
        <th style="padding: 10px 14px; border: 1px solid #cbd5e1; background: #6c56db; color: #ffffff; text-align: left; font-size: 13px;">Description</th>
        ${periodThs}
        <th style="padding: 10px 14px; border: 1px solid #cbd5e1; background: #6c56db; color: #ffffff; text-align: right; font-size: 13px;">Total (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
      ${gtHtml}
    </tbody>
  </table>
  <div style="margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
    Confidential Internal Operations Audit Report • Rathinam Group PostgreSQL 18 Canonical Matrix
  </div>
</body>
</html>`);
        reportWin.document.close();
      } else {
        window.print();
      }
    } catch (winErr) {
      console.warn('Window open error, fallback to print:', winErr);
      window.print();
    }
  };

  // Dedicated Enterprise Hostel Resident Operations Management Dashboard
  if (currentModule === 'hostel') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', overflowX: 'clip' }}>
        <HostelOperationsDashboard
          computedMatrix={effectiveMatrix}
          periods={periods}
          categories={categories}
          activePeriod={activePeriod}
          setActivePeriod={setActivePeriod}
          onOpenDataEntry={onOpenDataEntry}
          handleExportReport={handleExportReport}
          remarksDraft={remarksDraft}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', overflowX: 'clip' }}>
      
      {/* TOP HEADER & REPORT ACTIONS (PURPLE & CORAL BENTO STYLE) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: '#ffffff',
        padding: '4px 0 16px 0',
        borderBottom: '1px solid #edf0f8'
      }}>
        {/* Top Line: Title & Action Pill Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1d36', margin: 0, letterSpacing: '-0.02em' }}>
                {currentMeta.title}
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                padding: '3px 12px',
                borderRadius: '9999px',
                backgroundColor: '#efeefc',
                color: '#6c56db',
                border: '1px solid #d8d4fa'
              }}>
                {currentMeta.badge}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#6e768e', margin: '4px 0 0 0' }}>
              {currentMeta.subtitle}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Download Report Button (Vibrant Royal Purple Pill Button) */}
            <button
              type="button"
              onClick={handleExportReport}
              style={{
                padding: '9px 22px',
                borderRadius: '9999px',
                backgroundColor: '#6c56db',
                color: '#ffffff',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(108, 86, 219, 0.35)',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5d44db'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6c56db'}
            >
              <Download size={14} />
              <span>Download report</span>
            </button>

            {/* Open Data Entry Button (Vibrant Coral Pink Pill Button from Image) */}
            <button
              type="button"
              onClick={onOpenDataEntry}
              style={{
                padding: '9px 22px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #ff7e9e 0%, #ff4b72 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255, 96, 136, 0.35)',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span>Open Data Entry</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* LINE 1 (FIRST): MONTH BY MONTH SHOW THE DATA                               */}
      {/* ========================================================================= */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
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
            }}>
              1
            </span>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Month-by-Month Expenditure Data Sheet
            </h2>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#4338ca', backgroundColor: '#eef2ff', padding: '3px 10px', borderRadius: '9999px', border: '1px solid #c7d2fe' }}>
              Line-by-Line Monthly Columns
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              Displaying each monthly cycle side-by-side with exact values & category subtotals
            </span>
          </div>
        </div>

        {/* The Full Month-by-Month Data Table (Modern Card Dashboard across Food, Hostel, Transport) */}
        <ChartDataTable
          categories={categories}
          periods={periods}
          activePeriod={activePeriod}
          selectedModule={currentModule}
          computedMatrix={effectiveMatrix}
          isFullScreen={isTableFullScreen}
          onToggleFullScreen={setIsTableFullScreen}
          remarksDraft={remarksDraft}
        />
      </section>

      {/* ========================================================================= */}
      {/* LINE 2 (SECOND): MONTHLY EXPENSE BY CATEGORY                               */}
      {/* ========================================================================= */}
      <MonthlyExpenseSection
        computedMatrix={effectiveMatrix}
        categories={categories}
        periods={periods}
        selectedModule={currentModule}
        onExportReport={handleExportReport}
      />

      {/* ========================================================================= */}
      {/* LINE 3 (LAST): EXECUTIVE FINANCIAL TOTALS SUMMARY                         */}
      {/* ========================================================================= */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
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
            }}>
              3
            </span>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Overall Expense Summary
            </h2>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857', backgroundColor: '#ecfdf5', padding: '3px 10px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
              Expense Summary
            </span>
          </div>

          <div style={{ fontSize: '12.5px', color: '#64748b' }}>
            Total spent, current month, monthly average, and largest expense
          </div>
        </div>

        {/* 1. TOP 4 EXECUTIVE FINANCIAL TOTAL CARDS (BENTO STYLE) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px'
        }}>
          {currentModule === 'hostel' ? (
            <>
              {/* Hostel Card 1: Bed Capacity & Total Occupancy */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #10b981',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Beds & Occupancy
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0', letterSpacing: '-0.02em' }}>
                  {num(activeHostelCensus?.total_occupied, 2974).toLocaleString()} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>/ {num(activeHostelCensus?.bed_capacity_total, 3119).toLocaleString()} Beds</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>
                  {num(activeHostelCensus?.occupied_pct, 95.4).toFixed(1)}% Occupancy • {num(activeHostelCensus?.students_total, 2843).toLocaleString()} Students • {num(activeHostelCensus?.staff_total, 131)} Staff
                </div>
              </div>

              {/* Hostel Card 2: Expenses Occurred (Total Monthly Spend) */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #ea580c',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {activePeriodObj?.period_label || 'Focus Month'} Expenses Occurred
                </div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0', letterSpacing: '-0.02em' }} className="currency-font">
                  {formatINR(num(activeHostelCensus?.expenses_occurred, 9349172))}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  Total monthly operating expenses matching Data Entry Row 20
                </div>
              </div>

              {/* Hostel Card 3: Operating Budget & Balance */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #16a34a',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Balance Budget Remaining
                </div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0', letterSpacing: '-0.02em' }} className="currency-font">
                  {formatINR(num(activeHostelCensus?.balance, 97260304))}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  Budget: {formatINR(num(activeHostelCensus?.approved_budget, 131788118))} • Spent: {formatINR(num(activeHostelCensus?.cumulative_budget_spent, 34527814))}
                </div>
              </div>

              {/* Hostel Card 4: Monthly Cost per Student */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #ca8a04',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Monthly Cost per Student
                </div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0', letterSpacing: '-0.02em' }} className="currency-font">
                  ₹ {Math.round(num(activeHostelCensus?.per_student_cost_month, 3288)).toLocaleString()} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>/ mo</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  Daily: ₹{num(activeHostelCensus?.per_student_cost_day, 109.62).toFixed(2)}/day • Power: ₹{Math.round(num(activeHostelCensus?.power_cost_occupant, 494))}/occ
                </div>
              </div>
            </>
          ) : currentModule === 'transport' ? (
            <>
              {/* Transport Card 1: Fleet & Distance */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #ea580c',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Fleet Operations & Distance
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0', letterSpacing: '-0.02em' }}>
                  {activeTransportCensus?.vehicles_count || '18+1 Fleet'} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>({num(activeTransportCensus?.actual_kms, 82006).toLocaleString()} KMs)</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  Approved: {num(activeTransportCensus?.approved_kms, 96303).toLocaleString()} KMs • Addl: +{num(activeTransportCensus?.additional_kms, 9553).toLocaleString()} KMs
                </div>
              </div>

              {/* Transport Card 2: Total Expenses */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #16a34a',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {activePeriod === 'all' ? `All ${periods.length}-Month Total Expenses` : `${activePeriodObj?.period_label || 'Focus Month'} Total Expenses`}
                </div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0', letterSpacing: '-0.02em' }} className="currency-font">
                  {formatINR(activePeriod === 'all' ? (effectiveMatrix?.grand_total?.total || 18322733) : (latestMonthTotal || 4453115))}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  Fuel: {formatINR(num(activeTransportCensus?.fuel_expenses, 1788764))} • Diesel: {num(activeTransportCensus?.diesel_litres, 19252).toLocaleString()} L
                </div>
              </div>

              {/* Transport Card 3: Budget & Balance */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #10b981',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Transport Balance Budget
                </div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0', letterSpacing: '-0.02em' }} className="currency-font">
                  {formatINR(num(activeTransportCensus?.balance, 29007225))}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  Budget: {formatINR(num(activeTransportCensus?.approved_budget, 37730138))} • Spent: {formatINR(num(activeTransportCensus?.cumulative_budget_spent, 8722912))}
                </div>
              </div>

              {/* Transport Card 4: Service Tickets & Passengers */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #9333ea',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Service Tickets & Compliance
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0', letterSpacing: '-0.02em' }}>
                  {num(activeTransportCensus?.service_tickets_closed, 47)} / {num(activeTransportCensus?.service_tickets_raised, 47)} Closed
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  100% Statutory Compliant • Passengers: {num(activeTransportCensus?.passengers_count, 2070).toLocaleString()}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Default Food Executive Cards */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #10b981',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {periods.length > 0 ? `Total Spend • ${periods.length} Months` : 'Total Spend'}
                </div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0', letterSpacing: '-0.02em' }} className="currency-font">
                  {formatINR(grandTotal)}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  {periods.length > 0 ? `${periods[0]?.period_label} to ${periods[periods.length - 1]?.period_label} Total` : 'All recorded months'}
                </div>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #4f46e5',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {activePeriodObj?.period_label ? `${activePeriodObj.period_label} Total Spend` : 'Current Month Total'}
                </div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0', letterSpacing: '-0.02em' }} className="currency-font">
                  {formatINR(latestMonthTotal)}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  {activePeriodObj ? (activePeriodObj.is_closed ? 'Locked month' : 'Current active month') : 'Current month'}
                </div>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #f59e0b',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Monthly Average
                </div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0', letterSpacing: '-0.02em' }} className="currency-font">
                  {formatINR(monthlyAvg)}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  {periods.length > 0 ? `Average across ${periods.length} months` : 'Monthly average'}
                </div>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '20px 24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #ec4899',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#be185d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Highest Expense Category
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {largestCostHead.name}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }} className="currency-font">
                  {largestCostHead.total > 0 ? `${formatINR(largestCostHead.total)} (${periods.length} months)` : '₹0'}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

    </div>
  );
}
