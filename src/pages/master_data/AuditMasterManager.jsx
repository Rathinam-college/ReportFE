import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Trash2, Save, Edit3, Check, X, RefreshCw } from 'lucide-react';

const TOPICS = [
  { id: 'internal_report', label: 'Internal Audit - Dept Wise' },
  { id: 'non_academic_report', label: 'Non-Academic Audit Report' },
  { id: 'non_academic_schedule', label: 'Non-Academic Audit Schedule' },
  { id: 'all', label: 'All Topics' }
];

export default function AuditMasterManager() {
  const [items, setItems] = useState([]);
  const [activeTopic, setActiveTopic] = useState('internal_report');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const [newDept, setNewDept] = useState({
    s_no: 1,
    department: '',
    default_auditees: '',
    default_criteria: 'QMS - 9001:2015',
    default_cycle_no: '12'
  });

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const fetchMasterItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/audit/master-departments?topic=${activeTopic}`);
      const data = await res.json();
      if (data?.status === 'success') {
        const list = data.data || [];
        setItems(list);
        setNewDept((prev) => ({ ...prev, s_no: list.length + 1 }));
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load Audit Master Data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterItems();
  }, [activeTopic]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDept.department.trim()) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      const targetTopic = activeTopic === 'all' ? 'internal_report' : activeTopic;
      const res = await fetch('/api/audit/master-departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDept,
          topic: targetTopic,
          display_order: Number(newDept.s_no) || items.length + 1
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setStatusMsg({ type: 'success', text: `Added "${newDept.department}" to Audit Master Data.` });
        setNewDept({
          s_no: items.length + 2,
          department: '',
          default_auditees: '',
          default_criteria: targetTopic === 'internal_report' ? 'QMS - 9001:2015' : 'Non-Academic Audit',
          default_cycle_no: targetTopic === 'internal_report' ? '12' : ''
        });
        fetchMasterItems();
      } else {
        setStatusMsg({ type: 'error', text: data.detail || 'Failed to add department' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Server error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (id) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/audit/master-departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft)
      });
      if (res.ok) {
        setEditingId(null);
        setStatusMsg({ type: 'success', text: 'Updated master department.' });
        fetchMasterItems();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await fetch(`/api/audit/master-departments/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active })
      });
      fetchMasterItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from Audit Master Data?`)) return;
    try {
      await fetch(`/api/audit/master-departments/${id}`, { method: 'DELETE' });
      setStatusMsg({ type: 'success', text: `Deleted "${name}".` });
      fetchMasterItems();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Delete failed' });
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    borderRadius: '8px',
    border: '1px solid #D5DCEE',
    fontSize: '12.5px',
    color: '#14245C',
    fontWeight: '600',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '18px',
      border: '1px solid #E1E6F2',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(20, 36, 92, 0.04)',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Navy Header */}
      <div style={{
        padding: '18px 24px',
        backgroundColor: '#14245C',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#F5A524',
            color: '#14245C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ClipboardCheck size={19} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
              Audit Master Departments &amp; Criteria
            </h2>
            <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '2px 0 0 0' }}>
              Manage Internal Audit &amp; Non-Academic Audit departments, criteria, and default auditees in PostgreSQL
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchMasterItems}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '9px',
            border: '1px solid rgba(255,255,255,0.22)',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Topic Filter Tabs */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid #E1E6F2', backgroundColor: '#F8FAFC', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TOPICS.map((t) => {
          const isAct = activeTopic === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTopic(t.id)}
              style={{
                padding: '7px 14px',
                borderRadius: '9999px',
                border: isAct ? '1px solid #14245C' : '1px solid #D5DCEE',
                backgroundColor: isAct ? '#14245C' : '#ffffff',
                color: isAct ? '#ffffff' : '#334155',
                fontSize: '12px',
                fontWeight: isAct ? '800' : '600',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {statusMsg && (
        <div style={{
          margin: '14px 24px 0',
          padding: '10px 14px',
          borderRadius: '10px',
          backgroundColor: statusMsg.type === 'success' ? '#E4F6EC' : '#FBE3E3',
          color: statusMsg.type === 'success' ? '#0F6B3A' : '#A32626',
          fontSize: '12.5px',
          fontWeight: '700'
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Add Department Form */}
      <form onSubmit={handleAdd} style={{ padding: '18px 24px', borderBottom: '1px solid #E1E6F2', display: 'grid', gridTemplateColumns: '75px 1.6fr 1.4fr 1.1fr 90px auto', gap: '10px', alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Sl.no</label>
          <input type="number" value={newDept.s_no} onChange={(e) => setNewDept(p => ({ ...p, s_no: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Department / Function *</label>
          <input required placeholder="e.g. Hostel - 1 (Sabari Hospitality)" value={newDept.department} onChange={(e) => setNewDept(p => ({ ...p, department: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Default Auditee(s)</label>
          <input placeholder="Optional auditee names" value={newDept.default_auditees} onChange={(e) => setNewDept(p => ({ ...p, default_auditees: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Criteria</label>
          <input value={newDept.default_criteria} onChange={(e) => setNewDept(p => ({ ...p, default_criteria: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Cycle No</label>
          <input value={newDept.default_cycle_no} onChange={(e) => setNewDept(p => ({ ...p, default_cycle_no: e.target.value }))} style={inputStyle} />
        </div>
        <button
          type="submit"
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            minHeight: '36px',
            padding: '8px 16px',
            borderRadius: '9px',
            border: 'none',
            backgroundColor: '#F5A524',
            color: '#14245C',
            fontSize: '12.5px',
            fontWeight: '800',
            cursor: 'pointer'
          }}
        >
          <Plus size={15} />
          <span>Add</span>
        </button>
      </form>

      {/* Master Departments Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F7F9FD', borderBottom: '1px solid #D5DCEE', color: '#475569', fontSize: '11px', fontWeight: '800' }}>
              <th style={{ padding: '10px 14px', width: '65px', textAlign: 'center' }}>SL.NO</th>
              <th style={{ padding: '10px 14px' }}>DEPARTMENT / FUNCTION</th>
              <th style={{ padding: '10px 14px' }}>CRITERIA</th>
              <th style={{ padding: '10px 14px', width: '90px', textAlign: 'center' }}>CYCLE</th>
              <th style={{ padding: '10px 14px' }}>DEFAULT AUDITEE(S)</th>
              <th style={{ padding: '10px 14px', width: '100px', textAlign: 'center' }}>STATUS</th>
              <th style={{ padding: '10px 14px', width: '130px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>
                  No Audit Master Departments found for this topic.
                </td>
              </tr>
            ) : items.map((item) => {
              const isEd = editingId === item.id;
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #EDF0F8', backgroundColor: item.is_active ? '#ffffff' : '#F8FAFC' }}>
                  <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>
                    {isEd ? <input type="number" value={editDraft.s_no ?? ''} onChange={(e) => setEditDraft(p => ({ ...p, s_no: Number(e.target.value) }))} style={inputStyle} /> : item.s_no}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: '700', color: '#14245C' }}>
                    {isEd ? <input value={editDraft.department ?? ''} onChange={(e) => setEditDraft(p => ({ ...p, department: e.target.value }))} style={inputStyle} /> : item.department}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#334155' }}>
                    {isEd ? <input value={editDraft.default_criteria ?? ''} onChange={(e) => setEditDraft(p => ({ ...p, default_criteria: e.target.value }))} style={inputStyle} /> : (item.default_criteria || '—')}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: '#334155' }}>
                    {isEd ? <input value={editDraft.default_cycle_no ?? ''} onChange={(e) => setEditDraft(p => ({ ...p, default_cycle_no: e.target.value }))} style={inputStyle} /> : (item.default_cycle_no || '—')}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>
                    {isEd ? <input value={editDraft.default_auditees ?? ''} onChange={(e) => setEditDraft(p => ({ ...p, default_auditees: e.target.value }))} style={inputStyle} /> : (item.default_auditees || '—')}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        backgroundColor: item.is_active ? '#E4F6EC' : '#F1F5F9',
                        color: item.is_active ? '#0F6B3A' : '#64748b'
                      }}
                    >
                      {item.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      {isEd ? (
                        <>
                          <button type="button" onClick={() => handleSaveEdit(item.id)} style={{ padding: '5px 8px', borderRadius: '7px', border: 'none', backgroundColor: '#0F6B3A', color: '#fff', cursor: 'pointer' }}><Check size={14} /></button>
                          <button type="button" onClick={() => setEditingId(null)} style={{ padding: '5px 8px', borderRadius: '7px', border: '1px solid #D5DCEE', backgroundColor: '#fff', color: '#475569', cursor: 'pointer' }}><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => { setEditingId(item.id); setEditDraft({ ...item }); }} style={{ padding: '5px 8px', borderRadius: '7px', border: '1px solid #D5DCEE', backgroundColor: '#fff', color: '#14245C', cursor: 'pointer' }}><Edit3 size={14} /></button>
                          <button type="button" onClick={() => handleDelete(item.id, item.department)} style={{ padding: '5px 8px', borderRadius: '7px', border: '1px solid #FECACA', backgroundColor: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </>
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
}
