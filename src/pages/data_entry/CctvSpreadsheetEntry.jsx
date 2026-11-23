import React, { useState, useMemo, useEffect } from 'react';
import { formatINR } from '../../utils/formatters';
import { 
  Save, RefreshCw, Plus, Trash2, ExternalLink, Paperclip, Link as LinkIcon, 
  FileText, CheckCircle2, AlertTriangle, ShieldCheck, Video, Clock, 
  Calendar, Layers, Download, Lock, Unlock, Eye, Sparkles
} from 'lucide-react';

export const CANONICAL_CCTV_PARAMETERS = [
  // 1. Projects (Section 1 - Green)
  { s_no: '1', param_key: 'projects_completed', param_name: 'Completed', section: 'Projects', section_order: 1, input_type: 'number', unit: 'Projects', formula: null, display_order: 1 },
  { s_no: '', param_key: 'projects_in_progress', param_name: 'In Progress', section: 'Projects', section_order: 1, input_type: 'number', unit: 'Projects', formula: null, display_order: 2 },
  { s_no: '', param_key: 'projects_total', param_name: 'Total', section: 'Projects', section_order: 1, input_type: 'number', unit: 'Projects', formula: 'projects_completed + projects_in_progress', display_order: 3, is_bold: true },
  
  // 2. Complaints (Section 2 - Yellow)
  { s_no: '2', param_key: 'complaints_cctv', param_name: 'CCTV', section: 'Complaints', section_order: 2, input_type: 'number', unit: 'Nos', formula: null, display_order: 4 },
  { s_no: '', param_key: 'complaints_biometric', param_name: 'Biometric', section: 'Complaints', section_order: 2, input_type: 'number', unit: 'Nos', formula: null, display_order: 5 },
  { s_no: '', param_key: 'complaints_flapbarrier', param_name: 'Flapbarrier', section: 'Complaints', section_order: 2, input_type: 'number', unit: 'Nos', formula: null, display_order: 6 },
  { s_no: '', param_key: 'complaints_total', param_name: 'Total', section: 'Complaints', section_order: 2, input_type: 'number', unit: 'Nos', formula: 'complaints_cctv + complaints_biometric + complaints_flapbarrier', display_order: 7, is_bold: true },
  { s_no: '', param_key: 'repeated_complaints', param_name: 'Repeated complaints', section: 'Complaints', section_order: 2, input_type: 'number', unit: 'Nos', formula: null, display_order: 8, is_bold: true },
  { s_no: '', param_key: 'time_taken_complaints_hrs', param_name: 'Time taken all complaints (Hrs)', section: 'Complaints', section_order: 2, input_type: 'decimal', unit: 'Hrs', formula: null, display_order: 9, is_bold: true },
  { s_no: '', param_key: 'tat_complaints_hrs', param_name: 'TAT (Turn Around Time) Hrs', section: 'Complaints', section_order: 2, input_type: 'decimal', unit: 'Hrs', formula: null, display_order: 10, is_bold: true },
  
  // 3. Service request (Section 3 - Cyan)
  { s_no: '3', param_key: 'service_cctv', param_name: 'CCTV', section: 'Service request', section_order: 3, input_type: 'number', unit: 'Nos', formula: null, display_order: 11 },
  { s_no: '', param_key: 'service_biometric', param_name: 'Biometric', section: 'Service request', section_order: 3, input_type: 'number', unit: 'Nos', formula: null, display_order: 12 },
  { s_no: '', param_key: 'service_flapbarrier', param_name: 'Flapbarrier', section: 'Service request', section_order: 3, input_type: 'number', unit: 'Nos', formula: null, display_order: 13 },
  { s_no: '', param_key: 'service_total', param_name: 'Total', section: 'Service request', section_order: 3, input_type: 'number', unit: 'Nos', formula: 'service_cctv + service_biometric + service_flapbarrier', display_order: 14, is_bold: true },
  { s_no: '', param_key: 'repeated_work', param_name: 'Repeated work', section: 'Service request', section_order: 3, input_type: 'number', unit: 'Nos', formula: null, display_order: 15, is_bold: true },
  { s_no: '', param_key: 'time_taken_service_hrs', param_name: 'Time taken all service request (Hrs)', section: 'Service request', section_order: 3, input_type: 'decimal', unit: 'Hrs', formula: null, display_order: 16, is_bold: true },
  { s_no: '', param_key: 'tat_service_hrs', param_name: 'TAT (Turn Around Time) Hrs', section: 'Service request', section_order: 3, input_type: 'decimal', unit: 'Hrs', formula: null, display_order: 17, is_bold: true },
  
  // 4. PPM (Section 4 - Lime)
  { s_no: '5', param_key: 'ppm_count', param_name: 'PPM', section: 'PPM', section_order: 4, input_type: 'number', unit: 'Nos', formula: null, display_order: 18, is_bold: true },
  
  // 5. Quality Issues (Section 5 - Lavender)
  { s_no: '4', param_key: 'quality_issues_received', param_name: 'No. of Quality issues Received', section: 'Quality Issues', section_order: 5, input_type: 'number', unit: 'Issues', formula: null, display_order: 19 },
  { s_no: '5', param_key: 'quality_issues_closed', param_name: 'No. of Quality issues Closed', section: 'Quality Issues', section_order: 5, input_type: 'number', unit: 'Issues', formula: null, display_order: 20 },
  { s_no: '', param_key: 'quality_issues_open', param_name: 'No. of Quality issues in Open', section: 'Quality Issues', section_order: 5, input_type: 'number', unit: 'Issues', formula: 'quality_issues_received - quality_issues_closed', display_order: 21 },
  
  // 6. Expenses (Section 6 - Peach)
  { s_no: '7', param_key: 'material_expenses', param_name: 'Material Expenses', section: 'Expenses', section_order: 6, input_type: 'cost', unit: '₹', formula: null, display_order: 22 },
  { s_no: '8', param_key: 'labour_expenses', param_name: 'Labour Expenses', section: 'Expenses', section_order: 6, input_type: 'cost', unit: '₹', formula: null, display_order: 23 },
  { s_no: '9', param_key: 'total_expenses', param_name: 'Total Expenses', section: 'Expenses', section_order: 6, input_type: 'cost', unit: '₹', formula: 'material_expenses + labour_expenses', display_order: 24, is_bold: true },
  
  // 7. Budget Tracking (Section 7 - Green)
  { s_no: '10', param_key: 'approved_budget', param_name: 'Approved Budget', section: 'Budget Tracking', section_order: 7, input_type: 'cost', unit: '₹', formula: null, display_order: 25 },
  { s_no: '11', param_key: 'cumulative_budget_spent', param_name: 'Cumulative Budget spent (Actual expenses) till now', section: 'Budget Tracking', section_order: 7, input_type: 'cost', unit: '₹', formula: null, display_order: 26 },
  { s_no: '12', param_key: 'balance', param_name: 'Balance', section: 'Budget Tracking', section_order: 7, input_type: 'cost', unit: '₹', formula: 'approved_budget - cumulative_budget_spent', display_order: 27, is_bold: true }
];

export default function CctvSpreadsheetEntry({
  computedMatrix,
  editingPeriodId,
  setEditingPeriodId,
  activePeriodObj,
  fetchData
}) {
  const periods = useMemo(() => {
    return (computedMatrix?.periods && computedMatrix.periods.length > 0)
      ? computedMatrix.periods
      : [];
  }, [computedMatrix]);

  const [masterParams, setMasterParams] = useState([]);
  const [entryData, setEntryData] = useState({});
  const [dirtyFields, setDirtyFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Attachments & Reference Links State
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [savingLink, setSavingLink] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // 1. Fetch live master parameters
  useEffect(() => {
    fetch('/api/cctv/parameters')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMasterParams(data);
        }
      })
      .catch(err => console.warn('[CctvEntry] Parameters fetch error:', err));
  }, []);

  const parameters = useMemo(() => {
    return masterParams.length > 0 ? masterParams : CANONICAL_CCTV_PARAMETERS;
  }, [masterParams]);

  // 2. Fetch monthly entry when editingPeriodId changes
  const fetchMonthlyEntry = async (pid) => {
    if (!pid) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/cctv/entries?period_id=${pid}`);
      const data = await res.json();
      if (data && data.status === 'success' && data.data) {
        setEntryData(data.data);
      } else {
        setEntryData({});
      }
      setDirtyFields({});
    } catch (err) {
      console.error('[CctvEntry] Entry fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch attachments and reference links for this month
  const fetchAttachments = async (pid) => {
    if (!pid) return;
    try {
      setLoadingAttachments(true);
      const res = await fetch(`/api/attachments?module=cctv&period_id=${pid}`);
      const data = await res.json();
      if (data && data.status === 'success') {
        setAttachments(data.attachments || []);
      }
    } catch (err) {
      console.warn('[CctvEntry] Attachments fetch error:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  useEffect(() => {
    if (editingPeriodId) {
      fetchMonthlyEntry(editingPeriodId);
      fetchAttachments(editingPeriodId);
    }
  }, [editingPeriodId]);

  // Ensure editingPeriodId has valid fallback
  useEffect(() => {
    if (!editingPeriodId && periods.length > 0 && setEditingPeriodId) {
      setEditingPeriodId(periods[periods.length - 1].id);
    }
  }, [periods, editingPeriodId, setEditingPeriodId]);

  // Helper for numeric access
  const num = (k, fb = 0) => {
    const v = entryData[k];
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  // Live auto-calculated formulas
  const calculatedValues = useMemo(() => {
    const pComp = num('projects_completed');
    const pProg = num('projects_in_progress');
    const pTot = pComp + pProg;

    const cCctv = num('complaints_cctv');
    const cBio = num('complaints_biometric');
    const cFlap = num('complaints_flapbarrier');
    const cTot = cCctv + cBio + cFlap;
    const cTime = num('time_taken_complaints_hrs');
    const cTat = entryData.tat_complaints_hrs !== undefined && entryData.tat_complaints_hrs !== ''
      ? num('tat_complaints_hrs')
      : (cTot > 0 ? (cTime / cTot).toFixed(2) : '0.00');

    const sCctv = num('service_cctv');
    const sBio = num('service_biometric');
    const sFlap = num('service_flapbarrier');
    const sTot = sCctv + sBio + sFlap;
    const sTime = num('time_taken_service_hrs');
    const sTat = entryData.tat_service_hrs !== undefined && entryData.tat_service_hrs !== ''
      ? num('tat_service_hrs')
      : (sTot > 0 ? (sTime / sTot).toFixed(2) : '0.00');

    const qRec = num('quality_issues_received');
    const qCls = num('quality_issues_closed');
    const qOpn = entryData.quality_issues_open !== undefined && entryData.quality_issues_open !== ''
      ? num('quality_issues_open')
      : Math.max(0, qRec - qCls);

    const mExp = num('material_expenses');
    const lExp = num('labour_expenses');
    const totExp = mExp + lExp;

    const appBud = num('approved_budget');
    const cumSpent = entryData.cumulative_budget_spent !== undefined && entryData.cumulative_budget_spent !== ''
      ? num('cumulative_budget_spent')
      : totExp;
    const bal = appBud - cumSpent;

    return {
      projects_total: pTot,
      complaints_total: cTot,
      tat_complaints_hrs: cTat,
      service_total: sTot,
      tat_service_hrs: sTat,
      quality_issues_open: qOpn,
      total_expenses: totExp,
      balance: bal
    };
  }, [entryData]);

  // Handle cell value change
  const handleChange = (key, val) => {
    setEntryData(prev => ({ ...prev, [key]: val }));
    setDirtyFields(prev => ({ ...prev, [key]: true }));
  };

  // Section Color Palette (Matching the user's uploaded Excel sheet)
  const getSectionStyle = (section) => {
    const s = (section || '').toLowerCase();
    if (s.includes('project')) {
      return { headerBg: '#a7f3d0', rowBg: '#d1fae5', text: '#065f46' }; // Green
    }
    if (s.includes('complaint')) {
      return { headerBg: '#fef08a', rowBg: '#fef9c3', text: '#854d0e' }; // Yellow
    }
    if (s.includes('service')) {
      return { headerBg: '#a5f3fc', rowBg: '#cffafe', text: '#155e75' }; // Cyan
    }
    if (s.includes('ppm')) {
      return { headerBg: '#d9f99d', rowBg: '#ecfccb', text: '#3f6212' }; // Lime
    }
    if (s.includes('quality')) {
      return { headerBg: '#e9d5ff', rowBg: '#f3e8ff', text: '#6b21a8' }; // Lavender
    }
    if (s.includes('expense')) {
      return { headerBg: '#fed7aa', rowBg: '#ffedd5', text: '#9a3412' }; // Peach / Orange
    }
    if (s.includes('budget')) {
      return { headerBg: '#86efac', rowBg: '#bbf7d0', text: '#166534' }; // Green
    }
    return { headerBg: '#f1f5f9', rowBg: '#ffffff', text: '#0f172a' };
  };

  // Save Monthly Entry
  const handleSave = async () => {
    if (!editingPeriodId) return;
    try {
      setSaving(true);
      setStatusMessage(null);
      const payload = {
        period_id: editingPeriodId,
        ...entryData,
        ...calculatedValues
      };
      const res = await fetch('/api/cctv/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.status === 'success') {
        setStatusMessage({ type: 'success', text: `CCTV monthly entry for ${currentPeriod?.period_label || 'Month'} saved successfully!` });
        setDirtyFields({});
        if (data.data) setEntryData(data.data);
        if (fetchData) fetchData('cctv');
      } else {
        setStatusMessage({ type: 'error', text: data.detail || 'Failed to save entry.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: String(err) });
    } finally {
      setSaving(false);
    }
  };

  // Add Reference Link
  const handleAddLink = async (e) => {
    if (e) e.preventDefault();
    if (!newLinkUrl.trim() || !editingPeriodId) return;
    try {
      setSavingLink(true);
      const res = await fetch('/api/attachments/add-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'cctv',
          period_id: editingPeriodId,
          title: newLinkTitle.trim() || newLinkUrl.trim(),
          url: newLinkUrl.trim(),
          uploaded_by: 'Staff'
        })
      });
      const data = await res.json();
      if (data && data.status === 'success') {
        setNewLinkTitle('');
        setNewLinkUrl('');
        setShowAddLinkModal(false);
        fetchAttachments(editingPeriodId);
      }
    } catch (err) {
      console.error('Error adding link:', err);
    } finally {
      setSavingLink(false);
    }
  };

  // Delete Attachment / Reference Link
  const handleDeleteAttachment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reference attachment?')) return;
    try {
      const res = await fetch(`/api/attachments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAttachments(editingPeriodId);
      }
    } catch (err) {
      console.error('Error deleting attachment:', err);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingPeriodId) return;
    try {
      setUploadingFile(true);
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      formData.append('module', 'cctv');
      formData.append('period_id', editingPeriodId);
      formData.append('uploaded_by', 'Staff');

      const res = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data && data.status === 'success') {
        fetchAttachments(editingPeriodId);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const currentPeriod = periods.find(p => p.id === editingPeriodId) || periods[periods.length - 1];
  const isDirty = Object.keys(dirtyFields).length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%' }}>

      {/* 1. TOP UTILITY BAR (Month Switcher Pills, Save Button, Add Link Button) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        padding: '12px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Month Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginRight: '4px' }}>
            <Calendar size={15} color="#059669" />
            <span>Select Month:</span>
          </div>
          {periods.map(p => {
            const isSel = p.id === editingPeriodId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setEditingPeriodId && setEditingPeriodId(p.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: isSel ? '800' : '650',
                  border: isSel ? '1.5px solid #059669' : '1px solid #cbd5e1',
                  backgroundColor: isSel ? '#059669' : '#ffffff',
                  color: isSel ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSel ? '0 2px 6px rgba(5, 150, 105, 0.25)' : 'none'
                }}
              >
                {p.period_label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Add Reference Link + Upload File + Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowAddLinkModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontSize: '12.5px',
              fontWeight: '750',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LinkIcon size={14} />
            <span>+ Attach Reference Link</span>
          </button>

          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            color: '#334155',
            fontSize: '12.5px',
            fontWeight: '700',
            cursor: uploadingFile ? 'wait' : 'pointer',
            transition: 'all 0.15s ease'
          }}>
            <Paperclip size={14} color="#64748b" />
            <span>{uploadingFile ? 'Uploading...' : 'Upload File'}</span>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={uploadingFile}
            />
          </label>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 18px',
              borderRadius: '8px',
              backgroundColor: isDirty ? '#059669' : '#047857',
              color: '#ffffff',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? 'Saving...' : isDirty ? 'Save Monthly Changes*' : 'Save Entry'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
          border: `1.5px solid ${statusMessage.type === 'success' ? '#86efac' : '#fca5a5'}`
        }}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. THE SPREADSHEET TABLE (EXACT EXCEL MOCKUP MATCH) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid #cbd5e1',
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          padding: '12px 18px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Video size={18} color="#38bdf8" />
            <div>
              <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800' }}>
                CCTV, Biometric & Surveillance Monthly Entry Sheet
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                Projects, complaints, service requests, PPM, quality compliance, expenses & budget
              </p>
            </div>
          </div>
          <span style={{ fontSize: '11.5px', fontWeight: '750', backgroundColor: 'rgba(255,255,255,0.12)', padding: '3px 10px', borderRadius: '6px' }}>
            Period: {currentPeriod?.period_label || 'Sep 1st to 30th'}
          </span>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12.5px',
            fontFamily: 'Calibri, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            <thead>
              <tr style={{ height: '32px', backgroundColor: '#ffffff', borderBottom: '2px solid #000000' }}>
                <th style={{ width: '60px', textAlign: 'center', fontWeight: '800', borderRight: '1px solid #000000', padding: '6px' }}>
                  S.No
                </th>
                <th style={{ textAlign: 'left', fontWeight: '800', borderRight: '1px solid #000000', padding: '6px 14px' }}>
                  Parameters
                </th>
                <th style={{ width: '220px', textAlign: 'center', fontWeight: '800', padding: '6px 14px', backgroundColor: '#f8fafc' }}>
                  {currentPeriod?.period_label || 'Sep 1st to 30th'}
                </th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((param, idx) => {
                const secStyle = getSectionStyle(param.section);
                const isFormula = !!param.formula;
                const isBold = param.is_bold || isFormula || param.param_name === 'Total' || param.param_name === 'Total Expenses' || param.param_name === 'Balance';
                const key = param.param_key;

                // Value resolution
                let displayVal = isFormula ? calculatedValues[key] : entryData[key];
                if (displayVal === undefined || displayVal === null) displayVal = '';

                // Header for Section if this is first item in section
                const isFirstInSection = idx === 0 || parameters[idx - 1].section !== param.section;

                return (
                  <React.Fragment key={param.id || param.param_key}>
                    {/* Optional Section Divider Row */}
                    {isFirstInSection && param.section && (
                      <tr style={{ backgroundColor: secStyle.headerBg, height: '26px', borderTop: '1px solid #000000', borderBottom: '1px solid #000000' }}>
                        <td style={{ textAlign: 'center', fontWeight: '800', borderRight: '1px solid #000000', color: '#000000', fontSize: '12px' }}>
                          {param.s_no || ''}
                        </td>
                        <td colSpan={2} style={{ padding: '4px 14px', fontWeight: '800', color: '#000000', fontSize: '13px' }}>
                          {param.section}
                        </td>
                      </tr>
                    )}

                    {/* Parameter Row */}
                    <tr style={{
                      backgroundColor: secStyle.rowBg,
                      height: '28px',
                      borderBottom: isBold ? '1.5px solid #000000' : '1px solid #cbd5e1'
                    }}>
                      <td style={{
                        textAlign: 'center',
                        fontWeight: '700',
                        borderRight: '1px solid #000000',
                        padding: '4px 6px',
                        color: '#000000'
                      }}>
                        {param.s_no || ''}
                      </td>

                      <td style={{
                        padding: '4px 14px',
                        borderRight: '1px solid #000000',
                        fontWeight: isBold ? '800' : '500',
                        color: '#000000'
                      }}>
                        {param.param_name}
                      </td>

                      <td style={{
                        padding: '3px 8px',
                        textAlign: 'right',
                        backgroundColor: isFormula ? secStyle.headerBg : secStyle.rowBg
                      }}>
                        {isFormula ? (
                          <div style={{
                            padding: '4px 8px',
                            fontWeight: '800',
                            textAlign: 'right',
                            fontSize: '12.5px',
                            color: '#000000'
                          }}>
                            {param.input_type === 'cost' ? formatINR(Number(displayVal) || 0) : String(displayVal)}
                          </div>
                        ) : (
                          <input
                            type={param.input_type === 'decimal' ? 'number' : param.input_type === 'cost' ? 'number' : 'number'}
                            step={param.input_type === 'decimal' ? '0.01' : '1'}
                            value={displayVal}
                            placeholder="0"
                            onChange={(e) => handleChange(key, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              border: dirtyFields[key] ? '1.5px solid #059669' : '1px solid transparent',
                              borderRadius: '4px',
                              textAlign: 'right',
                              fontWeight: isBold ? '800' : '600',
                              fontSize: '12.5px',
                              backgroundColor: dirtyFields[key] ? '#ecfdf5' : 'transparent',
                              color: '#000000',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                              e.target.style.backgroundColor = '#ffffff';
                              e.target.style.border = '1.5px solid #2563eb';
                            }}
                            onBlur={(e) => {
                              e.target.style.backgroundColor = dirtyFields[key] ? '#ecfdf5' : 'transparent';
                              e.target.style.border = dirtyFields[key] ? '1.5px solid #059669' : '1px solid transparent';
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. ATTACHED REFERENCE LINKS & FILES TABLE */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid #cbd5e1',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          padding: '12px 18px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LinkIcon size={16} color="#2563eb" />
            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
              Reference Links & Attached Documents for {currentPeriod?.period_label || 'Month'} ({attachments.length})
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowAddLinkModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: '750',
              cursor: 'pointer'
            }}
          >
            <Plus size={13} />
            <span>Add Reference Link</span>
          </button>
        </div>

        {loadingAttachments ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 6px' }} />
            <div>Loading reference links...</div>
          </div>
        ) : attachments.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
            <Paperclip size={28} color="#94a3b8" style={{ margin: '0 auto 8px', opacity: 0.6 }} />
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              No reference links or documents attached for this month.
            </div>
            <p style={{ margin: '4px 0 12px 0', fontSize: '12px', color: '#64748b' }}>
              Attach Google Drive folders, CCTV footage reports, vendor bills, or PPM maintenance sign-off links.
            </p>
            <button
              type="button"
              onClick={() => setShowAddLinkModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                fontSize: '12px',
                fontWeight: '750',
                cursor: 'pointer'
              }}
            >
              <Plus size={13} />
              <span>Attach First Reference Link</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', width: '50px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '8px 12px', width: '70px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Title / Reference Name</th>
                  <th style={{ padding: '8px 12px' }}>Target URL / File Path</th>
                  <th style={{ padding: '8px 12px', width: '120px' }}>Added By</th>
                  <th style={{ padding: '8px 12px', width: '110px' }}>Date</th>
                  <th style={{ padding: '8px 12px', width: '100px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attachments.map((att, index) => {
                  const isLink = att.is_link;
                  return (
                    <tr key={att.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: isLink ? '#eff6ff' : '#f0fdf4',
                          color: isLink ? '#1d4ed8' : '#166534',
                          border: `1px solid ${isLink ? '#bfdbfe' : '#bbf7d0'}`
                        }}>
                          {isLink ? <LinkIcon size={11} /> : <FileText size={11} />}
                          <span>{isLink ? 'Link' : 'File'}</span>
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: '750', color: '#0f172a' }}>
                        {att.file_name}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <a
                          href={att.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            wordBreak: 'break-all',
                            maxWidth: '380px'
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.file_path}
                          </span>
                          <ExternalLink size={12} style={{ flexShrink: 0 }} />
                        </a>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>
                        {att.uploaded_by || 'User'}
                      </td>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>
                        {att.created_at ? new Date(att.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <a
                            href={att.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title="Open Link in New Tab"
                          >
                            <ExternalLink size={12} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              cursor: 'pointer'
                            }}
                            title="Delete Attachment"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD REFERENCE LINK */}
      {showAddLinkModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '460px',
            maxWidth: '92vw',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1.5px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LinkIcon size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                Attach Reference Web Link
              </h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: '#64748b' }}>
              Attach a Google Drive folder, spreadsheet, CCTV service ticket, or external cloud reference document for {currentPeriod?.period_label || 'this month'}.
            </p>

            <form onSubmit={handleAddLink} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '750', color: '#334155', marginBottom: '4px' }}>
                  Reference Title / Description *
                </label>
                <input
                  type="text"
                  placeholder="e.g. CCTV Maintenance Log Sheet / Vendor Bill"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '750', color: '#334155', marginBottom: '4px' }}>
                  Target Web URL *
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or https://..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddLinkModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLink}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    cursor: savingLink ? 'wait' : 'pointer'
                  }}
                >
                  {savingLink ? 'Attaching...' : 'Save Reference Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
