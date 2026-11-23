import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Common Components
import LoginPage from './components/auth/LoginPage';
import Navbar from './components/common/Navbar';
import SubNav from './components/common/SubNav';
import BreadcrumbHeader from './components/common/BreadcrumbHeader';
import Footer from './components/common/Footer';

// Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import DataEntryPage from './pages/data_entry/DataEntryPage';
import MasterDataPage from './pages/master_data/MasterDataPage';
import SettingsPage from './pages/settings/SettingsPage';

// Utilities
import { getDonutSlicePath, DASH_COLORS } from './utils/formatters';

export default function App() {
  // --------------------------------------------------------------------------
  // AUTHENTICATION STATE
  // --------------------------------------------------------------------------
  // Persisted user session so browser refresh keeps the user logged in
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rathinam_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // --------------------------------------------------------------------------
  // NAVIGATION & TOPIC STATES (Persisted across browser refresh)
  // --------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['dashboard', 'data_entry', 'master_data', 'settings'].includes(hash)) {
        return hash;
      }
      const savedTab = localStorage.getItem('rathinam_active_tab');
      if (savedTab && ['dashboard', 'data_entry', 'master_data', 'settings'].includes(savedTab)) {
        return savedTab;
      }
      return 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [dashboardSubTab, setDashboardSubTab] = useState(() => {
    try {
      return localStorage.getItem('rathinam_dashboard_subtab') || 'food';
    } catch {
      return 'food';
    }
  });

  const [dataEntrySubTab, setDataEntrySubTab] = useState(() => {
    try {
      return localStorage.getItem('rathinam_data_entry_subtab') || 'food';
    } catch {
      return 'food';
    }
  });

  const [masterDataSubTab, setMasterDataSubTab] = useState(() => {
    try {
      return localStorage.getItem('rathinam_master_subtab') || 'food';
    } catch {
      return 'food';
    }
  });

  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('checking');

  // UI Sizing Scale (85% for compact executive bento layout matching mockup)
  const uiZoom = 0.85;

  // --------------------------------------------------------------------------
  // DATA STATES
  // --------------------------------------------------------------------------
  const [overview, setOverview] = useState(null);
  const [matrixData, setMatrixData] = useState(null);
  const [varianceData, setVarianceData] = useState([]);
  const [masterData, setMasterData] = useState(null);
  const [auditFlags, setAuditFlags] = useState([]);

  // Dashboard state
  const [dashView, setDashView] = useState('pie'); // 'pie', 'comparison', 'trajectory'
  const [piePeriod, setPiePeriod] = useState('all'); // 'all' or period_id
  const [hoveredPieIndex, setHoveredPieIndex] = useState(null);
  const [compareBasePeriod, setCompareBasePeriod] = useState(1);
  const [compareTargetPeriod, setCompareTargetPeriod] = useState(5);

  // Matrix-Style Data Entry State
  const [editingPeriodId, setEditingPeriodId] = useState(5); // Default Oct'26 (id: 5)
  const [selectedTransportBranch, setSelectedTransportBranch] = useState('RPS');
  const [matrixDraft, setMatrixDraft] = useState({}); // { [costHeadId]: { [periodId]: value } }
  const [remarksDraft, setRemarksDraft] = useState({}); // { [costHeadId]: { [periodId]: remark } }
  const [censusDraft, setCensusDraft] = useState({
    students: {},
    staff: {},
    others: {},
    total_persons: {},
    production: {}
  });
  const [hostelCensusDraft, setHostelCensusDraft] = useState({});
  const [transportCensusDraft, setTransportCensusDraft] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [entryMessage, setEntryMessage] = useState(null);

  // Add Month Modal State
  const [showAddMonthModal, setShowAddMonthModal] = useState(false);
  const [newMonthForm, setNewMonthForm] = useState({
    start_date: '2026-12-01',
    end_date: '2026-12-31',
    period_label: "Dec'26",
    period_code: '2026-12',
    clone_from_prev: false
  });

  // Master Data Views & State
  const [masterFoodView, setMasterFoodView] = useState('cost_heads'); // 'cost_heads' | 'periods'
  const [costHeadsList, setCostHeadsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [masterMessage, setMasterMessage] = useState(null);

  // Category Modal State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);

  // Cost Head Add/Edit Modal State
  const [showCostHeadModal, setShowCostHeadModal] = useState(false);
  const [editingCostHead, setEditingCostHead] = useState(null);
  const [costHeadForm, setCostHeadForm] = useState({
    category_id: 1,
    name: '',
    is_new_category: false,
    new_category_name: ''
  });

  // Drag and Drop State
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Edit Period Modal State
  const [showEditPeriodModal, setShowEditPeriodModal] = useState(false);
  const [editingPeriodItem, setEditingPeriodItem] = useState(null);
  const [editPeriodForm, setEditPeriodForm] = useState({
    period_label: '',
    period_code: '',
    is_closed: false
  });

  // System Settings: Users & Permissions State
  const [usersList, setUsersList] = useState([]);
  const [pagePermissions, setPagePermissions] = useState([]);

  // --------------------------------------------------------------------------
  // DYNAMIC DOCUMENT TITLE: Report / <Page Name>
  // --------------------------------------------------------------------------
  useEffect(() => {
    const getModLabel = (m) => m === 'food' ? 'Food' : m === 'hostel' ? 'Hostel' : m === 'cctv' ? 'CCTV' : 'Transport';
    let titleStr = 'Dashboard';
    if (activeTab === 'dashboard') {
      titleStr = `Dashboard (${getModLabel(dashboardSubTab)})`;
    } else if (activeTab === 'data_entry') {
      titleStr = `Data Entry (${getModLabel(dataEntrySubTab)})`;
    } else if (activeTab === 'master_data') {
      titleStr = `Master Data (${getModLabel(masterDataSubTab)})`;
    } else if (activeTab === 'settings') {
      titleStr = 'System Settings';
    }
    document.title = `Report / ${titleStr} • Rathinam Group`;
  }, [activeTab, dashboardSubTab, dataEntrySubTab, masterDataSubTab]);

  // --------------------------------------------------------------------------
  // PERSISTENCE & URL HASH SYNCHRONIZATION
  // Keeps the user on the same page when refreshing the browser
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (activeTab) {
      try {
        localStorage.setItem('rathinam_active_tab', activeTab);
        if (window.location.hash !== `#${activeTab}`) {
          window.location.hash = activeTab;
        }
      } catch (err) {
        console.error('Error syncing tab:', err);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['dashboard', 'data_entry', 'master_data', 'settings'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (dashboardSubTab) {
      try {
        localStorage.setItem('rathinam_dashboard_subtab', dashboardSubTab);
      } catch {
        // ignore
      }
    }
  }, [dashboardSubTab]);

  useEffect(() => {
    if (dataEntrySubTab) {
      localStorage.setItem('rathinam_data_entry_subtab', dataEntrySubTab);
    }
  }, [dataEntrySubTab]);

  useEffect(() => {
    if (masterDataSubTab) {
      localStorage.setItem('rathinam_master_subtab', masterDataSubTab);
    }
  }, [masterDataSubTab]);

  // --------------------------------------------------------------------------
  // AUTHENTICATION HANDLERS
  // --------------------------------------------------------------------------
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Invalid login credentials');
      }

      const data = await res.json();
      setCurrentUser(data.user);
      localStorage.setItem('rathinam_user', JSON.stringify(data.user));
      localStorage.setItem('rathinam_token', data.token);

      // When login, first show dashboard page!
      setActiveTab('dashboard');
      localStorage.setItem('rathinam_active_tab', 'dashboard');
      window.location.hash = 'dashboard';

      fetchData();
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickRoleSelect = (username, password) => {
    setLoginForm({ username, password });
    setLoginError(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginForm({ username: 'admin', password: 'admin' });
    setLoginError(null);
    localStorage.removeItem('rathinam_user');
    localStorage.removeItem('rathinam_token');
    localStorage.removeItem('rathinam_active_tab');
    localStorage.removeItem('rathinam_data_entry_subtab');
    localStorage.removeItem('rathinam_master_subtab');
    window.location.hash = '';
  };

  // --------------------------------------------------------------------------
  // DATA FETCHING & SYNCHRONIZATION
  // --------------------------------------------------------------------------
  const fetchMasterDetails = async (mod = null) => {
    try {
      const activeMod = mod || (
        activeTab === 'dashboard' ? (dashboardSubTab || 'food') :
        activeTab === 'data_entry' ? dataEntrySubTab : masterDataSubTab
      );
      const [chRes, catRes] = await Promise.all([
        fetch(`/api/master/cost-heads?module=${activeMod}`),
        fetch(`/api/master/categories?module=${activeMod}`)
      ]);
      if (chRes.ok) setCostHeadsList(await chRes.json());
      if (catRes.ok) setCategoriesList(await catRes.json());
    } catch (err) {
      console.error('Error fetching master CRUD data:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsersList(await res.json());
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/permissions/page-access');
      if (res.ok) {
        const perms = await res.json();
        setPagePermissions(perms);

        if (currentUser && currentUser.role !== 'admin') {
          const currentPerm = perms.find(p => p.role === currentUser.role && p.page_id === activeTab);
          if (currentPerm && !currentPerm.can_access) {
            const firstAllowed = perms.find(p => p.role === currentUser.role && p.can_access);
            if (firstAllowed) {
              setActiveTab(firstAllowed.page_id);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  const fetchData = async (mod = null) => {
    setLoading(true);
    const activeMod = mod || (
      activeTab === 'dashboard' ? (dashboardSubTab || 'food') :
      activeTab === 'data_entry' ? dataEntrySubTab : masterDataSubTab
    );
    try {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          const health = await healthRes.json();
          setDbStatus(health.database === 'connected' ? 'connected' : 'error');
        } else {
          setDbStatus('error');
        }
      } catch {
        setDbStatus('offline');
      }

      const [ovRes, matRes, varRes, mastRes, flagRes] = await Promise.all([
        fetch(`/api/overview?module=${activeMod}`),
        fetch(`/api/matrix?module=${activeMod}`),
        fetch('/api/mom-variance'),
        fetch('/api/master-data'),
        fetch('/api/audit-flags')
      ]);

      if (ovRes.ok) setOverview(await ovRes.json());
      if (matRes.ok) {
        const mData = await matRes.json();
        mData.module = activeMod;
        setMatrixData(mData);

        const draftMap = {};
        const remarkMap = {};
        if (mData.categories) {
          mData.categories.forEach(cat => {
            (cat.items || []).forEach(it => {
              draftMap[it.cost_head_id] = { ...(it.amounts || {}) };
              remarkMap[it.cost_head_id] = { ...(it.remarks || {}) };
            });
          });
        }
        setMatrixDraft(draftMap);
        setRemarksDraft(remarkMap);
        if (mData.census) {
          setCensusDraft(mData.census);
        }
        if (mData.hostel_census) {
          setHostelCensusDraft(mData.hostel_census);
        }
        if (mData.transport_census) {
          setTransportCensusDraft(mData.transport_census);
        }
        setIsDirty(false);

        if (mData.periods && mData.periods.length > 0) {
          if (!mData.periods.some(p => p.id === editingPeriodId)) {
            setEditingPeriodId(mData.periods[mData.periods.length - 1].id);
          }
        }
      } else {
        console.warn(`[fetchData] Matrix fetch returned status ${matRes.status}. Attempting self-healing schema sync...`);
        try {
          const compatRes = await fetch('/api/system/schema-compat');
          if (compatRes.ok) {
            const retryRes = await fetch(`/api/matrix?module=${activeMod}`);
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              retryData.module = activeMod;
              setMatrixData(retryData);
              const draftMap = {};
              const remarkMap = {};
              if (retryData.categories) {
                retryData.categories.forEach(cat => {
                  (cat.items || []).forEach(it => {
                    draftMap[it.cost_head_id] = { ...(it.amounts || {}) };
                    remarkMap[it.cost_head_id] = { ...(it.remarks || {}) };
                  });
                });
              }
              setMatrixDraft(draftMap);
              setRemarksDraft(remarkMap);
              if (retryData.census) setCensusDraft(retryData.census);
              if (retryData.hostel_census) setHostelCensusDraft(retryData.hostel_census);
              if (retryData.transport_census) setTransportCensusDraft(retryData.transport_census);
              setIsDirty(false);
              if (retryData.periods && retryData.periods.length > 0) {
                setEditingPeriodId(retryData.periods[retryData.periods.length - 1].id);
              }
            }
          }
        } catch (retryErr) {
          console.error('[fetchData] Self-healing retry error:', retryErr);
        }
      }
      if (varRes.ok) setVarianceData(await varRes.json());
      if (mastRes.ok) setMasterData(await mastRes.json());
      if (flagRes.ok) setAuditFlags(await flagRes.json());

      fetchMasterDetails(activeMod);
    } catch (err) {
      console.error('Error fetching global data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      const activeMod = activeTab === 'dashboard' ? (dashboardSubTab || 'food') : (activeTab === 'data_entry' ? dataEntrySubTab : masterDataSubTab);
      fetchData(activeMod);
      fetchMasterDetails(activeMod);
      fetchUsers();
      fetchPermissions();
    }
  }, [currentUser, dashboardSubTab, dataEntrySubTab, masterDataSubTab, activeTab]);

  // --------------------------------------------------------------------------
  // Helper to detect non-expense categories or items (Person, Total Person, Total Cost Per Person, etc.)
  const isNonExpenseFoodMetric = (catName = '', itemDesc = '', code = '') => {
    const c = String(catName || '').toLowerCase().trim();
    const i = String(itemDesc || '').toLowerCase().trim();
    const cd = String(code || '').toLowerCase().trim();
    const s = `${c} ${i} ${cd}`;

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
      cd.includes('person') ||
      cd.includes('census') ||
      s.includes('total person') ||
      s.includes('total persons') ||
      s.includes('cost per person') ||
      s.includes('per person') ||
      s.includes('students count') ||
      s.includes('student count') ||
      (c === 'person' && i.includes('other'))
    );
  };

  // LIVE COMPUTED MATRIX
  // --------------------------------------------------------------------------
  const computedMatrix = useMemo(() => {
    if (!matrixData || !matrixData.categories || !matrixData.periods) return null;

    const periods = matrixData.periods;
    const numPeriods = periods.length || 1;
    const grandTotalByPeriod = {};
    periods.forEach(p => { grandTotalByPeriod[p.id] = 0.0; });
    let overallGrandTotal = 0.0;

    const categories = matrixData.categories.map(cat => {
      const catSubtotalByPeriod = {};
      periods.forEach(p => { catSubtotalByPeriod[p.id] = 0.0; });
      let catOverallTotal = 0.0;
      let catExpenseOnlyTotal = 0.0;

      const isCatExcluded = isNonExpenseFoodMetric(cat.category_name, '', cat.category_code);

      const items = (cat.items || []).map(it => {
        const rowAmounts = {};
        let rowTotal = 0.0;
        const isItemExcluded = isCatExcluded || isNonExpenseFoodMetric(cat.category_name, it.description, it.code);

        periods.forEach(p => {
          const draftVal = matrixDraft[it.cost_head_id]?.[p.id];
          const actualVal = it.amounts?.[p.id] ?? it.amounts?.[String(p.id)];

          let val = 0.0;
          if (draftVal !== undefined && draftVal !== null && draftVal !== '') {
            val = parseFloat(draftVal) || 0.0;
          } else if (actualVal !== undefined && actualVal !== null) {
            val = parseFloat(actualVal) || 0.0;
          }

          rowAmounts[p.id] = val;
          rowTotal += val;
          catSubtotalByPeriod[p.id] += val;

          // Do NOT add Total Person or Total Cost Per Person to Grand Total!
          if (!isItemExcluded) {
            grandTotalByPeriod[p.id] += val;
          }
        });

        catOverallTotal += rowTotal;
        if (!isItemExcluded) {
          catExpenseOnlyTotal += rowTotal;
        }

        return {
          cost_head_id: it.cost_head_id,
          description: it.description,
          category: cat.category_name,
          amounts: rowAmounts,
          total: rowTotal,
          avg: rowTotal / numPeriods
        };
      });

      // Do NOT add Total Person or Total Cost Per Person to Overall Grand Total!
      overallGrandTotal += catExpenseOnlyTotal;

      return {
        ...cat,
        category_id: cat.category_id,
        category_name: cat.category_name,
        category_type: cat.category_type || 'DIRECT',
        formula_expression: cat.formula_expression,
        formula_definition: cat.formula_definition,
        items,
        subtotal: {
          amounts: catSubtotalByPeriod,
          total: catOverallTotal,
          avg: catOverallTotal / numPeriods
        }
      };
    });

    return {
      ...matrixData,
      module: matrixData.module || (activeTab === 'dashboard' ? (dashboardSubTab || 'food') : (activeTab === 'data_entry' ? dataEntrySubTab : masterDataSubTab)),
      periods,
      categories,
      grand_total: {
        amounts: grandTotalByPeriod,
        total: overallGrandTotal,
        avg: overallGrandTotal / numPeriods
      },
      hostel_census: {
        ...(matrixData.hostel_census || {}),
        ...(hostelCensusDraft || {})
      },
      transport_census: {
        ...(matrixData.transport_census || {}),
        ...(transportCensusDraft?.RPS || transportCensusDraft || {})
      },
      transport_census_by_branch: {
        Common: {
          ...(matrixData.transport_census_by_branch?.Common || {}),
          ...(transportCensusDraft?.Common || {})
        },
        RPS: {
          ...(matrixData.transport_census_by_branch?.RPS || {}),
          ...(transportCensusDraft?.RPS || {})
        },
        KPM: {
          ...(matrixData.transport_census_by_branch?.KPM || {}),
          ...(transportCensusDraft?.KPM || {})
        },
        University: {
          ...(matrixData.transport_census_by_branch?.University || {}),
          ...(transportCensusDraft?.University || {})
        }
      }
    };
  }, [matrixData, matrixDraft, hostelCensusDraft, transportCensusDraft]);

  // --------------------------------------------------------------------------
  // DATA ENTRY ACTIONS
  // --------------------------------------------------------------------------
  const handleCellChange = (costHeadId, periodId, value) => {
    setMatrixDraft(prev => ({
      ...prev,
      [costHeadId]: {
        ...(prev[costHeadId] || {}),
        [periodId]: value
      }
    }));
    setIsDirty(true);
  };

  const handleRemarkChange = (costHeadId, periodId, value) => {
    setRemarksDraft(prev => ({
      ...prev,
      [costHeadId]: {
        ...(prev[costHeadId] || {}),
        [periodId]: value
      }
    }));
    setIsDirty(true);
  };

  const handleCensusChange = (field, value) => {
    const pIdStr = String(editingPeriodId);
    setCensusDraft(prev => {
      const currentStudents = field === 'students' ? value : (prev.students?.[pIdStr] ?? '');
      const currentStaff = field === 'staff' ? value : (prev.staff?.[pIdStr] ?? '');
      const currentOthers = field === 'others' ? value : (prev.others?.[pIdStr] ?? '');
      
      const sNum = parseInt(currentStudents, 10) || 0;
      const stNum = parseInt(currentStaff, 10) || 0;
      const oNum = parseInt(currentOthers, 10) || 0;
      const newTotal = sNum + stNum + oNum;

      return {
        ...prev,
        [field]: {
          ...(prev[field] || {}),
          [pIdStr]: value
        },
        total_persons: {
          ...(prev.total_persons || {}),
          [pIdStr]: newTotal
        }
      };
    });
    setIsDirty(true);
  };

  const handleHostelCensusChange = (fieldOrObj, value, targetPeriodId = null) => {
    const pIdStr = String(targetPeriodId || editingPeriodId);
    setHostelCensusDraft(prev => {
      const current = prev[pIdStr] || {};
      let updated;
      if (typeof fieldOrObj === 'object' && fieldOrObj !== null) {
        updated = { ...current, ...fieldOrObj };
      } else {
        updated = { ...current, [fieldOrObj]: value };
      }
      return {
        ...prev,
        [pIdStr]: updated
      };
    });
    setIsDirty(true);
  };

  const handleTransportCensusChange = (branchOrField, fieldOrVal, valOrPeriod = null, targetPeriodId = null) => {
    let branch = 'RPS';
    let fieldOrObj;
    let value;
    let pId = editingPeriodId;

    if (['Common', 'RPS', 'KPM', 'University'].includes(branchOrField)) {
      branch = branchOrField;
      fieldOrObj = fieldOrVal;
      value = valOrPeriod;
      pId = targetPeriodId || editingPeriodId;
    } else {
      fieldOrObj = branchOrField;
      value = fieldOrVal;
      pId = valOrPeriod || editingPeriodId;
    }
    const pIdStr = String(pId);

    setTransportCensusDraft(prev => {
      const branchMap = prev[branch] || {};
      const current = branchMap[pIdStr] || {};
      let updated;
      if (typeof fieldOrObj === 'object' && fieldOrObj !== null) {
        updated = { ...current, ...fieldOrObj };
      } else {
        updated = { ...current, [fieldOrObj]: value };
      }
      return {
        ...prev,
        [branch]: {
          ...branchMap,
          [pIdStr]: updated
        }
      };
    });
    setIsDirty(true);
  };

  const handleSaveActiveMonth = async () => {
    if (!computedMatrix) return;
    const activePeriod = computedMatrix.periods.find(p => p.id === editingPeriodId);
    if (!activePeriod) return;

    setSavingBatch(true);
    setEntryMessage(null);

    try {
      const entries = [];
      computedMatrix.categories.forEach(cat => {
        cat.items.forEach(it => {
          const val = matrixDraft[it.cost_head_id]?.[editingPeriodId];
          const numVal = val !== '' && val !== null && val !== undefined ? parseFloat(val) : 0;
          const userRemark = remarksDraft[it.cost_head_id]?.[editingPeriodId] ?? 
                             remarksDraft[it.cost_head_id]?.[String(editingPeriodId)] ?? 
                             it.remarks?.[editingPeriodId] ?? 
                             it.remarks?.[String(editingPeriodId)] ?? '';
          entries.push({
            cost_head_id: it.cost_head_id,
            amount: numVal,
            remarks: userRemark ? userRemark.trim() : ''
          });
        });
      });

      const pIdStr = String(editingPeriodId);
      const sCount = parseInt(censusDraft?.students?.[pIdStr], 10) || 0;
      const stCount = parseInt(censusDraft?.staff?.[pIdStr], 10) || 0;
      const oCount = parseInt(censusDraft?.others?.[pIdStr], 10) || 0;
      const totCount = sCount + stCount + oCount;
      const prodCount = parseInt(censusDraft?.production?.[pIdStr], 10) || 0;

      const payload = {
        period_id: editingPeriodId,
        entries,
        active_students: null,
        active_staff: null,
        others_count: null,
        total_persons: null,
        production_meals: null,
        operating_days: activePeriod.operating_days || 30,
        module: dataEntrySubTab,
        hostel_census: dataEntrySubTab === 'hostel' ? (hostelCensusDraft[pIdStr] || {}) : null,
        transport_census: dataEntrySubTab === 'transport' ? {
          Common: transportCensusDraft?.Common?.[pIdStr] || {},
          RPS: transportCensusDraft?.RPS?.[pIdStr] || {},
          KPM: transportCensusDraft?.KPM?.[pIdStr] || {},
          University: transportCensusDraft?.University?.[pIdStr] || {}
        } : null
      };

      const res = await fetch('/api/batch-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save matrix entries');
      }

      setEntryMessage({ type: 'success', text: `Saved all line items and operational parameters for ${activePeriod.period_label} successfully!` });
      setTransportCensusDraft(prev => {
        const next = { ...prev };
        ['Common', 'RPS', 'KPM', 'University'].forEach(b => {
          if (next[b]) {
            const nextB = { ...next[b] };
            delete nextB[pIdStr];
            next[b] = nextB;
          }
        });
        return next;
      });
      setIsDirty(false);
      fetchData();
    } catch (err) {
      setEntryMessage({ type: 'error', text: err.message || 'Error saving matrix data' });
    } finally {
      setSavingBatch(false);
    }
  };

  const handleCloneFromPrev = () => {
    if (!computedMatrix) return;
    const currentIdx = computedMatrix.periods.findIndex(p => p.id === editingPeriodId);
    if (currentIdx <= 0) {
      alert('No earlier period available in the ledger to clone from.');
      return;
    }
    const prevPeriod = computedMatrix.periods[currentIdx - 1];

    if (!window.confirm(`Clone all expenses and parameters from ${prevPeriod.period_label} into ${computedMatrix.periods[currentIdx].period_label}?`)) {
      return;
    }

    setMatrixDraft(prev => {
      const next = { ...prev };
      computedMatrix.categories.forEach(cat => {
        cat.items.forEach(it => {
          const prevVal = it.amounts[prevPeriod.id] ?? it.amounts[String(prevPeriod.id)] ?? 0;
          next[it.cost_head_id] = {
            ...(next[it.cost_head_id] || {}),
            [editingPeriodId]: prevVal
          };
        });
      });
      return next;
    });

    setCensusDraft(prev => {
      const prevStr = String(prevPeriod.id);
      const currStr = String(editingPeriodId);
      const prevStudents = prev?.students?.[prevStr] ?? 0;
      const prevStaff = prev?.staff?.[prevStr] ?? 0;
      const prevOthers = prev?.others?.[prevStr] ?? 0;
      const prevTotal = prevStudents + prevStaff + prevOthers;
      const prevProd = prev?.production?.[prevStr] ?? 0;

      return {
        ...prev,
        students: { ...(prev?.students || {}), [currStr]: prevStudents },
        staff: { ...(prev?.staff || {}), [currStr]: prevStaff },
        others: { ...(prev?.others || {}), [currStr]: prevOthers },
        total_persons: { ...(prev?.total_persons || {}), [currStr]: prevTotal },
        production: { ...(prev?.production || {}), [currStr]: prevProd }
      };
    });

    if (dataEntrySubTab === 'hostel') {
      setHostelCensusDraft(prev => {
        const prevStr = String(prevPeriod.id);
        const currStr = String(editingPeriodId);
        return {
          ...prev,
          [currStr]: { ...(prev[prevStr] || {}) }
        };
      });
    } else if (dataEntrySubTab === 'transport') {
      setTransportCensusDraft(prev => {
        const prevStr = String(prevPeriod.id);
        const currStr = String(editingPeriodId);
        return {
          ...prev,
          [currStr]: { ...(prev[prevStr] || {}) }
        };
      });
    }

    setIsDirty(true);
    setEntryMessage({ type: 'success', text: `Values cloned from ${prevPeriod.period_label}. Review and click Save.` });
  };

  const handleToggleLock = async () => {
    if (!computedMatrix) return;
    const period = computedMatrix.periods.find(p => p.id === editingPeriodId);
    if (!period) return;
    const newStatus = !period.is_closed;

    try {
      const res = await fetch(`/api/periods/${period.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_label: period.period_label,
          period_code: period.period_code,
          is_closed: newStatus
        })
      });
      if (res.ok) {
        setEntryMessage({
          type: 'success',
          text: `Month ${period.period_label} has been ${newStatus ? 'locked (read-only)' : 'unlocked for entry'}.`
        });
        fetchData();
      }
    } catch (err) {
      alert('Failed to update period lock status');
    }
  };

  // --------------------------------------------------------------------------
  // PERIOD MANAGEMENT HANDLERS
  // --------------------------------------------------------------------------
  const openEditPeriodModal = (p) => {
    setEditingPeriodItem(p);
    setEditPeriodForm({
      period_label: p.period_label,
      period_code: p.period_code,
      is_closed: !!p.is_closed
    });
    setShowEditPeriodModal(true);
  };

  const handleSavePeriodEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingPeriodItem) return;

    try {
      const res = await fetch(`/api/periods/${editingPeriodItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPeriodForm)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update period');
      }

      setShowEditPeriodModal(false);
      setMasterMessage({ type: 'success', text: `Updated billing month "${editPeriodForm.period_label}" successfully.` });
      fetchData();
    } catch (err) {
      alert(err.message || 'Error updating billing period');
    }
  };

  const handleDeletePeriod = async (p) => {
    const confirmMsg = `WARNING: Are you sure you want to permanently delete month "${p.period_label}" (${p.period_code})?\n\nThis will remove all associated expense entries for this month from the system.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/periods/${p.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete period');
      }

      setMasterMessage({ type: 'success', text: `Billing month "${p.period_label}" and its records have been safely deleted.` });

      if (editingPeriodId === p.id) {
        const remaining = computedMatrix?.periods?.filter(x => x.id !== p.id);
        if (remaining && remaining.length > 0) {
          setEditingPeriodId(remaining[0].id);
        }
      }
      fetchData();
    } catch (err) {
      alert(err.message || 'Error deleting billing month');
    }
  };

  const handleBatchDeletePeriods = async (periodIds, periodLabels = []) => {
    if (!periodIds || periodIds.length === 0) return false;
    const namesStr = periodLabels.length > 0 ? `:\n• ${periodLabels.join('\n• ')}` : '';
    const confirmMsg = `WARNING: Are you sure you want to permanently delete the ${periodIds.length} selected billing cycle(s)${namesStr}?\n\nThis will remove all associated expense, dining census, hostel, and transport entries for these months.`;
    if (!window.confirm(confirmMsg)) return false;

    try {
      const res = await fetch('/api/periods/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_ids: periodIds })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete selected periods');
      }

      const resData = await res.json();
      setMasterMessage({ 
        type: 'success', 
        text: resData.message || `Successfully deleted ${periodIds.length} billing cycle(s).` 
      });

      if (periodIds.includes(editingPeriodId)) {
        const remaining = computedMatrix?.periods?.filter(x => !periodIds.includes(x.id));
        if (remaining && remaining.length > 0) {
          setEditingPeriodId(remaining[0].id);
        }
      }
      fetchData();
      return true;
    } catch (err) {
      alert(err.message || 'Error deleting selected billing cycles');
      return false;
    }
  };

  const openAddMonthModal = () => {
    const periods = computedMatrix?.periods || [];
    let nextYear = 2026;
    let nextMonth = 11;

    if (periods.length > 0) {
      const lastPeriod = periods[periods.length - 1];
      if (lastPeriod.end_date) {
        const parts = lastPeriod.end_date.split('-');
        if (parts.length >= 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          if (m === 12) {
            nextYear = y + 1;
            nextMonth = 1;
          } else {
            nextYear = y;
            nextMonth = m + 1;
          }
        }
      }
    }

    const lastDay = new Date(nextYear, nextMonth, 0).getDate();
    const startDateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    const endDateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const monthShort = monthNames[nextMonth - 1] || 'Month';
    const yrShort = String(nextYear).slice(-2);

    const activeMod = activeTab === 'data_entry' ? dataEntrySubTab : masterDataSubTab;
    setNewMonthForm({
      start_date: startDateStr,
      end_date: endDateStr,
      period_label: `${monthShort}'${yrShort}`,
      period_code: `${nextYear}-${String(nextMonth).padStart(2, '0')}`,
      clone_from_prev: false,
      module: activeMod,
      branch: 'all'
    });
    setShowAddMonthModal(true);
  };

  const handleToggleAddMonthModal = (val) => {
    if (val) {
      openAddMonthModal();
    } else {
      setShowAddMonthModal(false);
    }
  };

  const handleStartDateChange = (val) => {
    if (!val) {
      setNewMonthForm(prev => ({ ...prev, start_date: val }));
      return;
    }
    const [y, m] = val.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const endDateStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const monthShort = monthNames[m - 1] || 'Month';
    const yrShort = String(y).slice(-2);
    const derivedLabel = `${monthShort}'${yrShort}`;
    const derivedCode = `${y}-${String(m).padStart(2, '0')}`;

    setNewMonthForm(prev => ({
      ...prev,
      start_date: val,
      end_date: endDateStr,
      period_label: derivedLabel,
      period_code: derivedCode
    }));
  };

  const handleAddNewMonth = async (e) => {
    if (e) e.preventDefault();
    try {
      const activeMod = activeTab === 'data_entry' ? dataEntrySubTab : masterDataSubTab;
      const payload = {
        period_label: newMonthForm.period_label.trim(),
        period_code: newMonthForm.period_code.trim(),
        start_date: newMonthForm.start_date,
        end_date: newMonthForm.end_date,
        module: activeMod,
        branch: newMonthForm.branch || 'all',
        clone_from_period_id: null // Explicitly null: Do NOT clone values on month creation
      };

      const res = await fetch('/api/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to add billing cycle');
      }
      const resJson = await res.json();
      setShowAddMonthModal(false);
      const fleetInfo = (activeMod === 'transport' && newMonthForm.branch && newMonthForm.branch !== 'all')
        ? ` (${newMonthForm.branch} Fleet)`
        : (activeMod === 'transport' ? ' (All Fleets)' : '');
      setEntryMessage({ type: 'success', text: `New Billing Month "${newMonthForm.period_label}"${fleetInfo} created! Ready for manual entry.` });
      await fetchData();
      if (resJson && resJson.period && resJson.period.id) {
        setEditingPeriodId(resJson.period.id);
        if (activeMod === 'transport' && newMonthForm.branch && newMonthForm.branch !== 'all') {
          setSelectedTransportBranch(newMonthForm.branch);
        }
      }
    } catch (err) {
      alert(err.message || 'Error creating period');
    }
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeTab === 'data_entry') {
          handleSaveActiveMonth();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, computedMatrix, matrixDraft, editingPeriodId]);

  // --------------------------------------------------------------------------
  // MASTER DATA: CATEGORIES & COST HEADS CRUD
  // --------------------------------------------------------------------------
  const openAddCategoryModal = () => {
    setShowAddCategoryModal(true);
  };

  const openManageCategoriesModal = () => {
    setShowManageCategoriesModal(true);
  };

  const handleAddCategory = async ({ name, code, module, category_type, formula_expression, formula_definition }) => {
    const activeMod = masterDataSubTab;
    const res = await fetch('/api/master/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        code: code?.trim() || undefined,
        module: activeMod,
        category_type: category_type || 'DIRECT',
        formula_expression: formula_expression || undefined,
        formula_definition: formula_definition || undefined
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create category');
    }
    const data = await res.json();
    setMasterMessage({ type: 'success', text: `Category "${name.trim()}" created successfully!` });
    await fetchMasterDetails(activeMod);
    await fetchData(activeMod);
    return data;
  };

  const handleUpdateCategory = async (categoryId, data) => {
    const activeMod = masterDataSubTab;
    // Optimistic UI update for immediate visual response
    setCategoriesList(prev => prev.map(c => (c.id === categoryId ? { ...c, ...data } : c)));

    const res = await fetch(`/api/master/categories/${categoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, module: activeMod })
    });
    if (!res.ok) {
      const err = await res.json();
      // Revert if API failed
      await fetchMasterDetails(activeMod);
      throw new Error(err.detail || 'Failed to update category');
    }
    const resData = await res.json();
    setMasterMessage({ type: 'success', text: resData.message || `Category updated successfully!` });
    await fetchMasterDetails(activeMod);
    await fetchData(activeMod);
    return resData;
  };

  const handleDeleteCategory = async (cat) => {
    const activeMod = masterDataSubTab;
    const res = await fetch(`/api/master/categories/${cat.id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to delete category');
    }
    const data = await res.json();
    setMasterMessage({ type: 'success', text: data.message || `Category "${cat.name}" removed.` });
    await fetchMasterDetails(activeMod);
    await fetchData(activeMod);
  };

  const handleBatchDeleteCategories = async (ids) => {
    if (!ids || ids.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${ids.length} selected category(ies)?`)) return;
    const activeMod = masterDataSubTab;

    try {
      const res = await fetch('/api/master/categories/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete selected categories');
      }
      const data = await res.json();
      setMasterMessage({ type: 'success', text: data.message || `Deleted ${ids.length} selected categories.` });
      await fetchMasterDetails(activeMod);
      await fetchData(activeMod);
    } catch (err) {
      alert(err.message || 'Error deleting selected categories');
    }
  };

  const handleReorderCategories = async (fromIdx, toIdx) => {
    const activeMod = masterDataSubTab;
    const reordered = [...categoriesList];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setCategoriesList(reordered);

    try {
      const category_ids = reordered.map(c => c.id);
      const res = await fetch('/api/master/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_ids })
      });
      if (res.ok) {
        setMasterMessage({ type: 'success', text: 'Category order updated & saved to database.' });
        await fetchMasterDetails(activeMod);
        await fetchData(activeMod);
      }
    } catch (err) {
      console.error('Failed to reorder categories:', err);
    }
  };

  const openAddCostHeadModal = (defaultCategoryId = null) => {
    setEditingCostHead(null);
    let resolvedCatId = null;
    if (typeof defaultCategoryId === 'number' || (typeof defaultCategoryId === 'string' && defaultCategoryId !== '' && !isNaN(Number(defaultCategoryId)))) {
      resolvedCatId = Number(defaultCategoryId);
    } else if (categoriesList && categoriesList.length > 0) {
      resolvedCatId = categoriesList[0]?.id;
    } else {
      resolvedCatId = 1;
    }

    setCostHeadForm({
      category_id: resolvedCatId,
      name: '',
      is_new_category: false,
      new_category_name: ''
    });
    setShowCostHeadModal(true);
  };

  const openEditCostHeadModal = (ch) => {
    setEditingCostHead(ch);
    setCostHeadForm({
      category_id: ch.category_id,
      name: ch.name,
      is_new_category: false,
      new_category_name: ''
    });
    setShowCostHeadModal(true);
  };

  const handleSaveCostHead = async (e) => {
    if (e) e.preventDefault();
    const activeMod = masterDataSubTab || 'food';

    try {
      let targetCategoryId = null;

      // Simultaneous category creation if user chose to add new category at the same time
      if (costHeadForm.is_new_category && costHeadForm.new_category_name?.trim()) {
        const catRes = await fetch('/api/master/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: costHeadForm.new_category_name.trim(),
            module: activeMod
          })
        });

        if (!catRes.ok) {
          const catErr = await catRes.json().catch(() => ({}));
          throw new Error(catErr.detail || 'Failed to create new category');
        }

        const catData = await catRes.json();
        targetCategoryId = catData.category?.id;
      } else if (costHeadForm.category_id && !isNaN(Number(costHeadForm.category_id))) {
        targetCategoryId = Number(costHeadForm.category_id);
      }

      if (!targetCategoryId) {
        targetCategoryId = categoriesList[0]?.id || 1;
      }

      const headName = (costHeadForm.name || '').trim();
      if (!headName) {
        throw new Error('Please enter a cost head name');
      }

      const payload = {
        name: headName,
        category_id: targetCategoryId,
        code: headName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 30),
        default_vendor: 'Institutional Campus Supplier',
        cost_behavior: 'variable',
        module: activeMod
      };

      let res;
      if (editingCostHead) {
        res = await fetch(`/api/master/cost-heads/${editingCostHead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/master/cost-heads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = Array.isArray(err.detail)
          ? err.detail.map(d => `${d.loc?.slice(-1)[0] || 'field'}: ${d.msg}`).join(', ')
          : (err.detail || 'Failed to save cost head');
        throw new Error(msg);
      }

      setShowCostHeadModal(false);
      setMasterMessage({
        type: 'success',
        text: costHeadForm.is_new_category
          ? `Created new Category "${costHeadForm.new_category_name}" and Line Item "${headName}" simultaneously!`
          : (editingCostHead
            ? `Updated "${headName}" successfully.`
            : `Created new line item "${headName}".`)
      });
      await fetchMasterDetails(activeMod);
      await fetchData(activeMod);
    } catch (err) {
      alert(err.message || 'Error saving line item');
    }
  };

  const handleDeleteCostHead = async (ch) => {
    if (!window.confirm(`Are you sure you want to delete line item "${ch.name}"?`)) return;
    const activeMod = masterDataSubTab;

    try {
      const res = await fetch(`/api/master/cost-heads/${ch.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete');
      }
      setMasterMessage({ type: 'success', text: `Deleted "${ch.name}".` });
      fetchMasterDetails(activeMod);
      fetchData(activeMod);
    } catch (err) {
      alert(err.message || 'Error deleting line item');
    }
  };

  const handleBatchDeleteCostHeads = async (ids) => {
    if (!ids || ids.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${ids.length} selected line item(s)?`)) return;
    const activeMod = masterDataSubTab;

    try {
      const res = await fetch('/api/master/cost-heads/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete selected line items');
      }
      const data = await res.json();
      setMasterMessage({ type: 'success', text: data.message || `Deleted ${ids.length} line items.` });
      await fetchMasterDetails(activeMod);
      await fetchData(activeMod);
    } catch (err) {
      alert(err.message || 'Error deleting line items');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDrop = async (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const reordered = [...costHeadsList];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    setCostHeadsList(reordered);
    setDraggedIdx(null);
    setDragOverIdx(null);

    try {
      const item_ids = reordered.map(x => x.id);
      const res = await fetch('/api/master/cost-heads/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_ids })
      });
      if (res.ok) {
        setMasterMessage({ type: 'success', text: 'Line items reordered & saved to database.' });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to persist order:', err);
    }
  };

  const handleMoveStep = async (idx, step) => {
    const targetIdx = idx + step;
    if (targetIdx < 0 || targetIdx >= costHeadsList.length) return;

    const reordered = [...costHeadsList];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);

    setCostHeadsList(reordered);

    try {
      const item_ids = reordered.map(x => x.id);
      const res = await fetch('/api/master/cost-heads/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_ids })
      });
      if (res.ok) {
        setMasterMessage({ type: 'success', text: 'Line items order updated.' });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to move item:', err);
    }
  };

  // --------------------------------------------------------------------------
  // DASHBOARD MEMOS (PIE & COMPARISON DATA)
  // --------------------------------------------------------------------------
  const activePeriodObj = computedMatrix?.periods?.find(p => p.id === editingPeriodId) || 
                          (computedMatrix?.periods && computedMatrix.periods.length > 0 ? computedMatrix.periods[computedMatrix.periods.length - 1] : null);

  useEffect(() => {
    if (activePeriodObj && editingPeriodId !== activePeriodObj.id) {
      setEditingPeriodId(activePeriodObj.id);
    }
  }, [activePeriodObj, editingPeriodId]);

  const pieData = useMemo(() => {
    if (!computedMatrix || !computedMatrix.categories) return [];

    let totalSum = 0;
    const slices = computedMatrix.categories.map((cat, idx) => {
      let val = 0;
      if (piePeriod === 'all') {
        val = cat.subtotal.total;
      } else {
        val = cat.subtotal.amounts[piePeriod] || 0;
      }
      totalSum += val;

      const catRemarks = [];
      cat.items.forEach(it => {
        if (piePeriod === 'all') {
          if (it.remarks) {
            Object.entries(it.remarks).forEach(([pid, rText]) => {
              if (rText && !rText.startsWith('Entry via Operational Matrix') && !rText.startsWith('Cloned from')) {
                catRemarks.push(`${it.description}: ${rText}`);
              }
            });
          }
        } else {
          const rText = remarksDraft[it.cost_head_id]?.[piePeriod] ?? it.remarks?.[piePeriod] ?? it.remarks?.[String(piePeriod)];
          if (rText && !rText.startsWith('Entry via Operational Matrix') && !rText.startsWith('Cloned from')) {
            catRemarks.push(`${it.description}: ${rText}`);
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

    if (totalSum <= 0) return [];

    let currentAngle = -Math.PI / 2;
    return slices.map(s => {
      const pct = (s.value / totalSum) * 100;
      const angle = (s.value / totalSum) * (2 * Math.PI);
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const path = getDonutSlicePath(160, 160, 130, 75, startAngle, endAngle);

      return {
        ...s,
        percentage: pct,
        startAngle,
        endAngle,
        path,
        totalSum
      };
    });
  }, [computedMatrix, piePeriod]);

  const comparisonData = useMemo(() => {
    if (!computedMatrix || !computedMatrix.periods) return null;
    const pBase = computedMatrix.periods.find(p => p.id === compareBasePeriod) || computedMatrix.periods[0];
    const pTarget = computedMatrix.periods.find(p => p.id === compareTargetPeriod) || computedMatrix.periods[computedMatrix.periods.length - 1];

    if (!pBase || !pTarget) return null;

    const baseTotal = computedMatrix.grand_total.amounts[pBase.id] || 0;
    const targetTotal = computedMatrix.grand_total.amounts[pTarget.id] || 0;
    const netDiff = targetTotal - baseTotal;
    const netPct = baseTotal > 0 ? (netDiff / baseTotal) * 100 : 0;

    const categories = computedMatrix.categories.map(cat => {
      const amtBase = cat.subtotal.amounts[pBase.id] || 0;
      const amtTarget = cat.subtotal.amounts[pTarget.id] || 0;
      const diff = amtTarget - amtBase;
      const pct = amtBase > 0 ? (diff / amtBase) * 100 : 0;

      const items = cat.items.map(it => {
        const itemBase = it.amounts[pBase.id] || 0;
        const itemTarget = it.amounts[pTarget.id] || 0;
        const itemDiff = itemTarget - itemBase;
        const itemPct = itemBase > 0 ? (itemDiff / itemBase) * 100 : 0;
        const userRemark = remarksDraft[it.cost_head_id]?.[pTarget.id] ?? 
                           it.remarks?.[pTarget.id] ?? 
                           it.remarks?.[String(pTarget.id)] ?? '';
        return {
          cost_head_id: it.cost_head_id,
          description: it.description,
          amtBase: itemBase,
          amtTarget: itemTarget,
          diff: itemDiff,
          pct: itemPct,
          remark: (userRemark && !userRemark.startsWith('Entry via Operational Matrix') && !userRemark.startsWith('Cloned from')) ? userRemark : ''
        };
      });

      return {
        category_id: cat.category_id,
        category_name: cat.category_name,
        amtBase,
        amtTarget,
        diff,
        pct,
        items
      };
    });

    return {
      pBase,
      pTarget,
      baseTotal,
      targetTotal,
      netDiff,
      netPct,
      categories
    };
  }, [computedMatrix, compareBasePeriod, compareTargetPeriod]);

  // If not logged in, render the clean login screen
  if (!currentUser) {
    return (
      <LoginPage
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginLoading={loginLoading}
        loginError={loginError}
        handleLogin={handleLogin}
        handleQuickRoleSelect={handleQuickRoleSelect}
      />
    );
  }

  // --------------------------------------------------------------------------
  // MAIN APP RENDER (PURPLE & CORAL BENTO FRAMEWORK REPLICATING UPLOADED IMAGE)
  // --------------------------------------------------------------------------
  return (
    <div 
      id="bento-app-root"
      className="bento-app-root"
      style={{
        zoom: uiZoom,
        width: `calc(100vw / ${uiZoom})`,
        height: `calc(100vh / ${uiZoom})`,
        maxHeight: `calc(100vh / ${uiZoom})`,
        backgroundColor: '#ffffff',
        display: 'flex',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Floating Left Pill Sidebar Dock (Vibrant Royal Purple Gradient matching Image) */}
      <Navbar
        currentUser={currentUser}
        handleLogout={handleLogout}
        dbStatus={dbStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        permissions={pagePermissions}
      />

      {/* Right Main Content Area */}
      <div 
        className="bento-right-area"
        style={{
          flex: 1,
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
          height: '100%',
          position: 'relative'
        }}
      >
        {/* Top Header inside Area */}
        <SubNav
          currentUser={currentUser}
          dbStatus={dbStatus}
          activeTab={activeTab}
          dashboardSubTab={dashboardSubTab}
          setDashboardSubTab={setDashboardSubTab}
          dataEntrySubTab={dataEntrySubTab}
          setDataEntrySubTab={setDataEntrySubTab}
          masterDataSubTab={masterDataSubTab}
          setMasterDataSubTab={setMasterDataSubTab}
        />

        {/* Main Page Workspace */}
        <main 
          className="bento-main-workspace"
          style={{
            flex: 1,
            padding: activeTab === 'data_entry' ? '14px 20px' : '16px 24px',
            maxWidth: '100%',
            width: '100%',
            boxSizing: 'border-box',
            overflowY: 'auto',
            scrollBehavior: 'smooth'
          }}
        >
        
        {/* DASHBOARD PAGE */}
        {activeTab === 'dashboard' && (
          <DashboardPage
            selectedModule={dashboardSubTab || 'food'}
            onSelectModule={setDashboardSubTab}
            overview={overview}
            dashView={dashView}
            setDashView={setDashView}
            pieData={pieData}
            piePeriod={piePeriod}
            setPiePeriod={setPiePeriod}
            hoveredPieIndex={hoveredPieIndex}
            setHoveredPieIndex={setHoveredPieIndex}
            computedMatrix={computedMatrix}
            remarksDraft={remarksDraft}
            comparisonData={comparisonData}
            compareBasePeriod={compareBasePeriod}
            setCompareBasePeriod={setCompareBasePeriod}
            compareTargetPeriod={compareTargetPeriod}
            setCompareTargetPeriod={setCompareTargetPeriod}
            onOpenDataEntry={(mod, periodId, branch) => {
              if (mod) setDataEntrySubTab(mod);
              else setDataEntrySubTab(dashboardSubTab || 'food');
              if (periodId) setEditingPeriodId(periodId);
              if (branch) setSelectedTransportBranch(branch);
              setActiveTab('data_entry');
              window.location.hash = 'data_entry';
            }}
          />
        )}

        {/* DATA ENTRY PAGE */}
        {activeTab === 'data_entry' && (
          <DataEntryPage
            selectedModule={dataEntrySubTab}
            selectedBranch={selectedTransportBranch}
            onBranchChange={setSelectedTransportBranch}
            computedMatrix={computedMatrix}
            editingPeriodId={editingPeriodId}
            setEditingPeriodId={setEditingPeriodId}
            activePeriodObj={activePeriodObj}
            matrixDraft={matrixDraft}
            remarksDraft={remarksDraft}
            censusDraft={censusDraft}
            handleCensusChange={handleCensusChange}
            hostelCensusDraft={hostelCensusDraft}
            transportCensusDraft={transportCensusDraft}
            handleHostelCensusChange={handleHostelCensusChange}
            handleTransportCensusChange={handleTransportCensusChange}
            openAddCostHeadModal={openAddCostHeadModal}
            handleDeleteCostHead={handleDeleteCostHead}
            openAddCategoryModal={openAddCategoryModal}
            categoriesList={categoriesList}
            isDirty={isDirty}
            handleCellChange={handleCellChange}
            handleRemarkChange={handleRemarkChange}
            handleCloneFromPrev={handleCloneFromPrev}
            handleToggleLock={handleToggleLock}
            handleSaveActiveMonth={handleSaveActiveMonth}
            savingBatch={savingBatch}
            currentUser={currentUser}
            entryMessage={entryMessage}
            showAddMonthModal={showAddMonthModal}
            setShowAddMonthModal={handleToggleAddMonthModal}
            newMonthForm={newMonthForm}
            setNewMonthForm={setNewMonthForm}
            handleStartDateChange={handleStartDateChange}
            handleAddNewMonth={handleAddNewMonth}
            fetchData={fetchData}
          />
        )}

        {/* MASTER DATA CONFIGURATION PAGE */}
        {activeTab === 'master_data' && (
          <MasterDataPage
            masterFoodView={masterFoodView}
            setMasterFoodView={setMasterFoodView}
            costHeadsList={costHeadsList}
            categoriesList={categoriesList}
            computedMatrix={computedMatrix}
            masterMessage={masterMessage}
            draggedIdx={draggedIdx}
            dragOverIdx={dragOverIdx}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragEnd={handleDragEnd}
            handleDrop={handleDrop}
            handleMoveStep={handleMoveStep}
            openAddCostHeadModal={openAddCostHeadModal}
            openEditCostHeadModal={openEditCostHeadModal}
            handleDeleteCostHead={handleDeleteCostHead}
            handleBatchDeleteCostHeads={handleBatchDeleteCostHeads}
            showCostHeadModal={showCostHeadModal}
            setShowCostHeadModal={setShowCostHeadModal}
            editingCostHead={editingCostHead}
            costHeadForm={costHeadForm}
            setCostHeadForm={setCostHeadForm}
            handleSaveCostHead={handleSaveCostHead}
            showAddCategoryModal={showAddCategoryModal}
            setShowAddCategoryModal={setShowAddCategoryModal}
            openAddCategoryModal={openAddCategoryModal}
            handleAddCategory={handleAddCategory}
            showManageCategoriesModal={showManageCategoriesModal}
            setShowManageCategoriesModal={setShowManageCategoriesModal}
            openManageCategoriesModal={openManageCategoriesModal}
            handleUpdateCategory={handleUpdateCategory}
            handleDeleteCategory={handleDeleteCategory}
            handleBatchDeleteCategories={handleBatchDeleteCategories}
            handleReorderCategories={handleReorderCategories}
            openEditPeriodModal={openEditPeriodModal}
            handleDeletePeriod={handleDeletePeriod}
            handleBatchDeletePeriods={handleBatchDeletePeriods}
            showEditPeriodModal={showEditPeriodModal}
            setShowEditPeriodModal={setShowEditPeriodModal}
            editingPeriodItem={editingPeriodItem}
            editPeriodForm={editPeriodForm}
            setEditPeriodForm={setEditPeriodForm}
            handleSavePeriodEdit={handleSavePeriodEdit}
            showAddMonthModal={showAddMonthModal}
            setShowAddMonthModal={handleToggleAddMonthModal}
            newMonthForm={newMonthForm}
            setNewMonthForm={setNewMonthForm}
            handleStartDateChange={handleStartDateChange}
            handleAddNewMonth={handleAddNewMonth}
            moduleName={masterDataSubTab === 'food' ? 'Food' : masterDataSubTab === 'hostel' ? 'Hostel' : masterDataSubTab === 'cctv' ? 'CCTV' : 'Transport'}
          />
        )}

        {/* SYSTEM SETTINGS & CONTROLS PAGE */}
        {activeTab === 'settings' && (
          <SettingsPage
            currentUser={currentUser}
            users={usersList}
            permissions={pagePermissions}
            onRefreshUsers={fetchUsers}
            onRefreshPermissions={fetchPermissions}
            onRefreshData={() => {
              const activeMod = activeTab === 'data_entry' ? dataEntrySubTab : masterDataSubTab;
              fetchData(activeMod);
              fetchMasterDetails(activeMod);
              fetchUsers();
              fetchPermissions();
            }}
          />
        )}

      </main>

      {/* 5. GLOBAL FOOTER */}
      <Footer />

        </div>
    </div>
  );
}
