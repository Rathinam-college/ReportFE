import React, { useState, useMemo, useEffect } from 'react';
import MonthlyAttachmentsModal from '../../components/attachments/MonthlyAttachmentsModal';
import MonthlyAttachmentsDashboardSection from '../../components/attachments/MonthlyAttachmentsDashboardSection';
import { formatINR, formatLakhs, formatIndianCompact, DASH_COLORS } from '../../utils/formatters';
import { getAssetUrl } from '../../utils/api';
import { 
  Calendar, Layers, PieChart as PieIcon, Calculator, FileSpreadsheet, 
  TrendingUp, Hash, Users, ArrowRight, Table, BarChart3, CheckCircle2,
  Maximize2, Minimize2, Download, Check, Search, LayoutGrid 
} from 'lucide-react';
import Footer from '../../components/common/Footer';

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
import TransportOperationsDashboard from './transport/TransportOperationsDashboard';
import CctvOperationsDashboard from './cctv/CctvOperationsDashboard';
import AuditOperationsDashboard from './audit/AuditOperationsDashboard';
import PurchaseOperationsDashboard from './purchase/PurchaseOperationsDashboard';
import StoreOperationsDashboard from './store/StoreOperationsDashboard';
import AssetAuditOperationsDashboard from './asset_audit/AssetAuditOperationsDashboard';
import FoodBudgetChartSection from './food/FoodBudgetChartSection';
import FoodPowerWaterSection from './food/FoodPowerWaterSection';

// Helper to determine the period of the latest recorded entry across modules
export const getLastEnteredPeriod = (periods = [], matrix = null, module = 'food', branch = null) => {
  if (!periods || periods.length === 0) return null;

  // Scan backwards from newest period to oldest
  for (let i = periods.length - 1; i >= 0; i--) {
    const p = periods[i];
    const pid = String(p.id);

    // If branch filter applies (e.g. transport)
    if (branch && p.branch && p.branch !== 'all' && p.branch !== branch) {
      continue;
    }

    // 1. Module-specific checks first
    if (module === 'transport') {
      const branchesToCheck = branch && branch !== 'all' ? [branch] : ['University', 'RPS', 'KPM', 'Common'];
      const hasTransportData = branchesToCheck.some(b => {
        const d = matrix?.transport_census_by_branch?.[b]?.[pid];
        return d && (
          (Number(d.actual_kms) || 0) > 0 || 
          (Number(d.total_expenses) || 0) > 0 || 
          (Number(d.fuel_expenses) || 0) > 0 ||
          (Number(d.diesel_litres) || 0) > 0
        );
      });
      if (hasTransportData) return p;
      continue; // Don't check food grand_total for transport
    }

    if (module === 'hostel') {
      const hc = matrix?.hostel_census?.[pid];
      if (hc && ((Number(hc.total_residents) || 0) > 0 || (Number(hc.actual_veg) || 0) > 0 || (Number(hc.expenses_occurred) || 0) > 0)) {
        return p;
      }
      continue;
    }

    if (module === 'cctv') {
      const ce = matrix?.cctv_entries?.[pid];
      if (ce && ((Number(ce.total_expenses) || 0) > 0 || (Number(ce.projects_total) || 0) > 0)) {
        return p;
      }
      continue;
    }

    // 2. Food operations check: grand_total amounts in matrix
    const gt = matrix?.grand_total?.amounts?.[pid] ?? matrix?.grand_total?.amounts?.[p.id];
    if (gt !== undefined && gt !== null && Number(gt) > 0) {
      return p;
    }
  }

  // Fallback: Pick latest period with transport data if in transport module
  if (module === 'transport') {
    const octPeriod = periods.find(p => p.period_code === '2026-10' || (p.period_label && p.period_label.toLowerCase().includes('oct')));
    if (octPeriod) return octPeriod;
  }

  // Fallback to latest visible period if no positive amounts found
  if (branch) {
    const visible = periods.filter(p => !p.branch || p.branch === 'all' || p.branch === branch);
    if (visible.length > 0) return visible[visible.length - 1];
  }
  return periods[periods.length - 1] || null;
};

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
  remarksDraft = {},
  currentUser = null
}) {
  const currentModule = selectedModule || 'food';

  const [activeChart, setActiveChart] = useState('clustered_table'); // Default: Excel-style Clustered Columns with Data Sheet
  // User explicit month selection per module (defaults to undefined until user clicks)
  const [userSelectedPeriodByModule, setUserSelectedPeriodByModule] = useState({});
  const [activePeriod, setActivePeriodState] = useState(null); // 'all' or period id; auto-selected on load

  const setActivePeriod = (pId) => {
    setActivePeriodState(pId);
    setUserSelectedPeriodByModule(prev => ({
      ...prev,
      [currentModule]: pId
    }));
  };

  const [showDataTable, setShowDataTable] = useState(true);
  const [isTableFullScreen, setIsTableFullScreen] = useState(false);

  // Unified Top Filter Bar UI states
  const [topSearchTerm, setTopSearchTerm] = useState('');
  const [topCategoryFilter, setTopCategoryFilter] = useState('all');
  const [topUnitMode, setTopUnitMode] = useState('full'); // 'full' | 'lakhs'
  const [topViewMode, setTopViewMode] = useState('cards'); // 'cards' | 'spreadsheet'

  // Attachments State
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [attachmentsSummary, setAttachmentsSummary] = useState({});

  const fetchAttachmentsSummary = () => {
    fetch(`/api/attachments/summary?module=${currentModule}`)
      .then(res => res.json())
      .then(d => {
        if (d?.summary) setAttachmentsSummary(d.summary);
      })
      .catch(err => console.warn('Attachments summary notice:', err));
  };

  useEffect(() => {
    fetchAttachmentsSummary();
  }, [currentModule]);

  const activeAttachmentCount = useMemo(() => {
    if (activePeriod === 'all') {
      return Object.values(attachmentsSummary).reduce((acc, c) => acc + (Number(c) || 0), 0);
    }
    return attachmentsSummary[String(activePeriod)] || 0;
  }, [attachmentsSummary, activePeriod]);

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

  // Automatically select the month with the last recorded entry on login/load or when module changes
  useEffect(() => {
    if (periods && periods.length > 0) {
      const savedChoice = userSelectedPeriodByModule[currentModule];
      if (savedChoice !== undefined && savedChoice !== null) {
        if (savedChoice === 'all' || periods.some(p => String(p.id) === String(savedChoice))) {
          if (String(activePeriod) !== String(savedChoice)) {
            setActivePeriodState(savedChoice);
          }
          return;
        }
      }

      // Automatically select the month with the latest recorded entry
      const lastEntered = getLastEnteredPeriod(periods, effectiveMatrix, currentModule);
      if (lastEntered) {
        setActivePeriodState(String(lastEntered.id));
      }
    }
  }, [periods, effectiveMatrix, currentModule, userSelectedPeriodByModule]);

  const moduleMeta = {
    food: {
      title: 'Food Operations Dashboard',
      subtitle: `Food overview • ${periods[0]?.period_label || "Jun'26"} – ${periods[periods.length - 1]?.period_label || "Sept'26"} • FY 2026-2027 • Currency INR (₹)`,
      badge: 'Food',
      badgeColor: '#F27B21',
      badgeBg: '#fff7ed'
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

  // Calculate Previous Period for single-month delta comparison
  const prevPeriodObj = useMemo(() => {
    if (activePeriod === 'all') return null;
    const idx = periods.findIndex(p => String(p.id) === String(activePeriod));
    return idx > 0 ? periods[idx - 1] : null;
  }, [periods, activePeriod]);

  const prevPeriodTotal = useMemo(() => {
    if (!prevPeriodObj) return 0;
    return effectiveMatrix?.grand_total?.amounts?.[prevPeriodObj.id] ?? 
           effectiveMatrix?.grand_total?.amounts?.[String(prevPeriodObj.id)] ?? 0;
  }, [effectiveMatrix, prevPeriodObj]);

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
          onOpenDataEntry={() => {
            const targetPeriodId = activePeriod !== 'all' ? Number(activePeriod) : null;
            onOpenDataEntry?.('hostel', targetPeriodId);
          }}
          handleExportReport={handleExportReport}
          remarksDraft={remarksDraft}
          attachmentsSummary={attachmentsSummary}
          onRefreshAttachments={fetchAttachmentsSummary}
        />
      </div>
    );
  }

  // Dedicated Enterprise Transport Operations & Fleet Management Dashboard
  if (currentModule === 'transport') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', overflowX: 'clip' }}>
        <TransportOperationsDashboard
          computedMatrix={effectiveMatrix}
          periods={periods}
          categories={categories}
          activePeriod={activePeriod || (periods.length > 0 ? String(periods[periods.length - 1].id) : 'all')}
          setActivePeriod={setActivePeriod}
          onOpenDataEntry={(targetPeriodId, targetBranch) => {
            const pId = targetPeriodId || (activePeriod !== 'all' ? Number(activePeriod) : null);
            onOpenDataEntry?.('transport', pId, targetBranch);
          }}
          handleExportReport={handleExportReport}
        />
      </div>
    );
  }

  // Dedicated Enterprise Audit Operations & Compliance Dashboard
  if (currentModule === 'audit') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', overflowX: 'clip' }}>
        <AuditOperationsDashboard
          periods={periods}
          activePeriod={activePeriod || (periods.length > 0 ? String(periods[periods.length - 1].id) : 'all')}
          setActivePeriod={setActivePeriod}
          onOpenDataEntry={(targetPeriodId) => {
            const pId = targetPeriodId || (activePeriod !== 'all' ? Number(activePeriod) : null);
            onOpenDataEntry?.('audit', pId);
          }}
          onRefreshAttachments={fetchAttachmentsSummary}
        />
      </div>
    );
  }

  // Dedicated Enterprise Purchase Operations & Procurement Dashboard
  if (currentModule === 'purchase') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', overflowX: 'clip' }}>
        <PurchaseOperationsDashboard
          periods={periods}
          activePeriod={activePeriod || (periods.length > 0 ? String(periods[periods.length - 1].id) : 'all')}
          setActivePeriod={setActivePeriod}
          onOpenDataEntry={(targetPeriodId) => {
            const pId = targetPeriodId || (activePeriod !== 'all' ? Number(activePeriod) : null);
            onOpenDataEntry?.('purchase', pId);
          }}
          onRefreshAttachments={fetchAttachmentsSummary}
        />
      </div>
    );
  }

  // Dedicated Enterprise Store Operations & Inventory Dashboard
  if (currentModule === 'store') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', overflowX: 'clip' }}>
        <StoreOperationsDashboard
          periods={periods}
          activePeriod={activePeriod || (periods.length > 0 ? String(periods[periods.length - 1].id) : 'all')}
          setActivePeriod={setActivePeriod}
          onOpenDataEntry={(targetPeriodId) => {
            const pId = targetPeriodId || (activePeriod !== 'all' ? Number(activePeriod) : null);
            onOpenDataEntry?.('store', pId);
          }}
          onRefreshAttachments={fetchAttachmentsSummary}
        />
      </div>
    );
  }

  // Dedicated Enterprise Asset Audit & Verification Dashboard
  if (currentModule === 'asset_audit') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', overflowX: 'clip' }}>
        <AssetAuditOperationsDashboard
          periods={periods}
          activePeriod={activePeriod || (periods.length > 0 ? String(periods[periods.length - 1].id) : 'all')}
          setActivePeriod={setActivePeriod}
          onOpenDataEntry={(targetPeriodId) => {
            const pId = targetPeriodId || (activePeriod !== 'all' ? Number(activePeriod) : null);
            onOpenDataEntry?.('asset_audit', pId);
          }}
          onRefreshAttachments={fetchAttachmentsSummary}
        />
      </div>
    );
  }

  // Dedicated Enterprise CCTV Operations & Surveillance Management Dashboard
  if (currentModule === 'cctv') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', overflowX: 'clip' }}>
        <CctvOperationsDashboard
          computedMatrix={effectiveMatrix}
          periods={periods}
          activePeriod={activePeriod || (periods.length > 0 ? String(periods[periods.length - 1].id) : 'all')}
          setActivePeriod={setActivePeriod}
          onOpenDataEntry={(targetPeriodId) => {
            const pId = targetPeriodId || (activePeriod !== 'all' ? Number(activePeriod) : null);
            onOpenDataEntry?.('cctv', pId);
          }}
          handleExportReport={handleExportReport}
          attachmentsSummary={attachmentsSummary}
          onRefreshAttachments={fetchAttachmentsSummary}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', overflowX: 'clip' }}>
      
      {/* ========================================================================= */}
      {/* STICKY TOP FILTER BAR (WHITE, BOTTOM BORDER, ALL FILTERS LIVE HERE ONLY)  */}
      {/* ========================================================================= */}
      <div
        className="sticky-dashboard-master-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 80,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #E1E6F2',
          padding: '16px 28px',
          boxShadow: '0 4px 16px rgba(20, 36, 92, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        {/* Row 1: Title + Department Badge + Search Box + Download Report */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{
              fontSize: '21px',
              fontWeight: '800',
              color: 'var(--primary, #14245C)',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              {currentMeta.title}
            </h1>
            <span style={{
              fontSize: '11.5px',
              fontWeight: '800',
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: '#FFF8EA',
              color: '#8A4A00',
              border: '1px solid var(--accent, #F5A524)'
            }}>
              {currentMeta.badge}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <Search size={15} color="#64748b" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
              <input
                type="text"
                aria-label="Search expenses"
                placeholder="Search items..."
                value={topSearchTerm}
                onChange={(e) => setTopSearchTerm(e.target.value)}
                style={{
                  minHeight: '40px',
                  padding: '8px 14px 8px 36px',
                  borderRadius: '10px',
                  border: '1px solid #E1E6F2',
                  backgroundColor: 'var(--bg-canvas, #F3F6FB)',
                  color: 'var(--primary, #14245C)',
                  fontSize: '13px',
                  fontWeight: '600',
                  outline: 'none',
                  width: '210px'
                }}
              />
            </div>

            {/* Download Report */}
            <button
              type="button"
              onClick={handleExportReport}
              style={{
                minHeight: '40px',
                padding: '8px 18px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary, #14245C)',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(20, 36, 92, 0.22)'
              }}
            >
              <Download size={15} />
              <span>Download report</span>
            </button>
          </div>
        </div>

        {/* Row 2: Month Chips + Category Dropdown + Units Toggle + View Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Month Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActivePeriod('all')}
              style={{
                minHeight: '40px',
                padding: '6px 14px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: '700',
                border: activePeriod === 'all' ? '1px solid var(--primary, #14245C)' : '1px solid #E1E6F2',
                backgroundColor: activePeriod === 'all' ? 'var(--primary, #14245C)' : 'var(--bg-canvas, #F3F6FB)',
                color: activePeriod === 'all' ? '#ffffff' : 'var(--primary, #14245C)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>All months ({periods.length})</span>
            </button>

            {periods.map((p) => {
              const isSel = String(p.id) === String(activePeriod);
              const pMonthTotal = effectiveMatrix?.grand_total?.amounts?.[p.id] ?? effectiveMatrix?.grand_total?.amounts?.[String(p.id)] ?? 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePeriod(String(p.id))}
                  style={{
                    minHeight: '40px',
                    padding: '6px 13px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    fontWeight: isSel ? '700' : '600',
                    border: isSel ? '1px solid var(--primary, #14245C)' : '1px solid #E1E6F2',
                    backgroundColor: isSel ? 'var(--primary, #14245C)' : '#ffffff',
                    color: isSel ? '#ffffff' : '#334155',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{p.period_label || p.period_code}</span>
                  {pMonthTotal > 0 && (
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: isSel ? 'rgba(255,255,255,0.18)' : 'var(--bg-canvas, #F3F6FB)',
                      color: isSel ? 'var(--accent, #F5A524)' : '#64748b'
                    }}>
                      {formatIndianCompact(pMonthTotal)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Category Dropdown, Units Toggle, View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select
              aria-label="Filter by category"
              value={topCategoryFilter}
              onChange={(e) => setTopCategoryFilter(e.target.value)}
              style={{
                minHeight: '40px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #E1E6F2',
                backgroundColor: '#ffffff',
                color: 'var(--primary, #14245C)',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">All categories ({categories.length})</option>
              {categories.map((c) => {
                const name = c.category_name || c.name;
                return <option key={name} value={name}>{name}</option>;
              })}
            </select>

            {/* Units Toggle: ₹ Full | Lakhs */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-canvas, #F3F6FB)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid #E1E6F2'
            }}>
              {[
                { id: 'full', label: '₹ Full' },
                { id: 'lakhs', label: 'Lakhs' }
              ].map((u) => {
                const isSel = topUnitMode === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setTopUnitMode(u.id)}
                    style={{
                      minHeight: '34px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: isSel ? 'var(--primary, #14245C)' : 'transparent',
                      color: isSel ? '#ffffff' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {u.label}
                  </button>
                );
              })}
            </div>

            {/* View Toggle: Cards | Spreadsheet */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-canvas, #F3F6FB)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid #E1E6F2'
            }}>
              {[
                { id: 'cards', label: 'Cards' },
                { id: 'spreadsheet', label: 'Spreadsheet' }
              ].map((v) => {
                const isSel = topViewMode === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setTopViewMode(v.id)}
                    style={{
                      minHeight: '34px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: isSel ? 'var(--primary, #14245C)' : 'transparent',
                      color: isSel ? '#ffffff' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTENT ON LIGHT GREY-BLUE BACKGROUND (var(--bg-canvas, #F3F6FB), 28px padding/gap)    */}
      {/* ========================================================================= */}
      <div style={{
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        backgroundColor: 'var(--bg-canvas, #F3F6FB)',
        boxSizing: 'border-box'
      }}>
        {categories.length === 0 && grandTotal === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #E1E6F2',
            padding: '48px 28px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '15px',
            fontWeight: '700'
          }}>
            No {currentMeta.badge} expenses recorded yet
          </div>
        ) : (
          <>
            {/* b. MONTH-BY-MONTH EXPENDITURE (CARDS OR SPREADSHEET PER VIEW TOGGLE) */}
            <section style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              padding: '28px',
              border: '1px solid #E1E6F2',
              boxShadow: '0 2px 10px rgba(20, 36, 92, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary, #14245C)', margin: 0, letterSpacing: '-0.02em' }}>
                Month-by-Month Expenditure
              </h2>
              <ChartDataTable
                categories={categories}
                periods={periods}
                activePeriod={activePeriod}
                onSelectPeriod={setActivePeriod}
                selectedModule={currentModule}
                computedMatrix={effectiveMatrix}
                isFullScreen={isTableFullScreen}
                onToggleFullScreen={setIsTableFullScreen}
                remarksDraft={remarksDraft}
                attachmentsSummary={attachmentsSummary}
                searchTerm={topSearchTerm}
                selectedCategoryFilter={topCategoryFilter}
                viewMode={topViewMode}
                unitMode={topUnitMode}
                hideHeaderBar={true}
              />
            </section>

            {/* c. EXPENSE BY CATEGORY CHART (TABS + FULL CHART DROPDOWN) */}
            <MonthlyExpenseSection
              computedMatrix={effectiveMatrix}
              categories={categories}
              periods={periods}
              selectedModule={currentModule}
              onExportReport={handleExportReport}
              activePeriod={activePeriod}
              onPeriodChange={setActivePeriod}
              unitMode={topUnitMode}
              hideControlsBar={true}
            />

            {/* d. BUDGET ALLOCATION AND EXPENDITURE LEDGER */}
            {currentModule === 'food' && (
              <>
                <FoodBudgetChartSection
                  computedMatrix={effectiveMatrix}
                  periods={periods}
                  activePeriod={activePeriod}
                  onPeriodChange={setActivePeriod}
                />
                <FoodPowerWaterSection
                  periods={periods}
                  activePeriod={activePeriod}
                  activePeriodObj={activePeriodObj}
                />
              </>
            )}

            {/* e. ATTACHED FILES, PRESENTATIONS & BILLS */}
            <MonthlyAttachmentsDashboardSection
              module="food"
              periodId={activePeriod === 'all' ? 'all' : (activePeriodObj?.id || activePeriod)}
              periodLabel={activePeriod === 'all' ? 'All Months' : (activePeriodObj?.period_label || 'Focus Month')}
              periods={periods}
              currentUser={currentUser}
            />
          </>
        )}
      </div>

      {/* Footer rendered by App shell */}
    </div>
  );
}