import React, { useState, useRef } from 'react';
import { 
  Database, Download, Upload, Trash2, RefreshCw, AlertTriangle, 
  CheckCircle2, ShieldAlert, FileText, HardDrive, Server, Check, ArrowRight
} from 'lucide-react';
import TwoStepDeleteModal from './TwoStepDeleteModal';

export default function DatabaseManager({
  onRefreshData
}) {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [reseeding, setReseeding] = useState(false);
  
  const [showTwoStepModal, setShowTwoStepModal] = useState(false);
  const [message, setMessage] = useState(null);
  
  const fileInputRef = useRef(null);

  // 1. Download SQL Dump
  const handleDownloadBackup = async () => {
    setDownloading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/system/backup');
      if (!res.ok) throw new Error('Failed to generate backup dump');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.download = `rathinam_erp_backup_${dateStr}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'SQL backup dump generated and downloaded successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDownloading(false);
    }
  };

  // 2. Restore / Reload SQL File
  const handleRestoreFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.sql')) {
      alert('Please select a valid .sql backup file.');
      return;
    }

    if (!window.confirm(`Are you sure you want to restore the database from "${file.name}"?\n\nThis will execute the SQL dump into PostgreSQL.`)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setRestoring(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/system/restore', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to restore database');
      }

      const resJson = await res.json();
      setMessage({ type: 'success', text: `Database successfully reloaded from ${file.name}!` });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. Clear Dummy Data (Two-Step Validated)
  const handleConfirmClearDummyData = async () => {
    setClearing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/system/clear-dummy-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation_code: 'DELETE-DUMMY-DATA' })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to clear dummy data');
      }

      const resJson = await res.json();
      setShowTwoStepModal(false);
      setMessage({
        type: 'success',
        text: resJson.message || 'All dummy transactions cleared. Ledger is reset to clean baseline.'
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setClearing(false);
    }
  };

  // 4. Re-seed Demo Data
  const handleReseedDefault = async () => {
    if (!window.confirm('Re-seed the canonical 5-month demo actuals (Jun\'26 to Oct\'26) across Food, Hostel, Transport?')) {
      return;
    }

    setReseeding(true);
    setMessage(null);

    try {
      const res = await fetch('/api/system/seed-default', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to re-seed demo data');
      }

      setMessage({ type: 'success', text: 'Canonical 5-month demo data re-seeded into PostgreSQL!' });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setReseeding(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
            Database Backup, Restore & Data Lifecycle Management
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
            Export standard PostgreSQL SQL dumps, reload backup scripts, or purge dummy transaction records with two-step validation.
          </p>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          fontWeight: '700',
          color: '#059669',
          backgroundColor: '#ecfdf5',
          padding: '6px 14px',
          borderRadius: '9999px',
          border: '1px solid #a7f3d0'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 6px #10b981'
          }} />
          <Database size={14} />
          <span>PostgreSQL 18 Connected</span>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Action Bento Cards Grid (Images 2, 4, 5) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* CARD 1: DOWNLOAD SQL BACKUP DUMP */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '20px',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
              }}>
                <Download size={20} />
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#2563eb',
                backgroundColor: '#eff6ff',
                padding: '3px 10px',
                borderRadius: '9999px',
                border: '1px solid #bfdbfe'
              }}>
                FULL REPOSITORY DUMP
              </span>
            </div>

            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              Download SQL Dump (.sql)
            </h4>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              PostgreSQL 18 DDL & DML Schema Dump
            </span>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginTop: '12px', marginBottom: 0 }}>
              Generates a standard <code>.sql</code> backup file containing table schemas, categories, cost heads, billing cycles, users, permissions, and expense entries.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={downloading}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #6c52d6 0%, #5439ba 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 'none',
              cursor: downloading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(108, 86, 219, 0.3)',
              opacity: downloading ? 0.7 : 1,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => !downloading && (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => !downloading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Download size={16} />
            <span>{downloading ? 'Generating Dump...' : 'Download SQL Database Dump'}</span>
          </button>
        </div>

        {/* CARD 2: RELOAD / RESTORE FROM SQL FILE */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '20px',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669'
              }}>
                <Upload size={20} />
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#059669',
                backgroundColor: '#ecfdf5',
                padding: '3px 10px',
                borderRadius: '9999px',
                border: '1px solid #a7f3d0'
              }}>
                DISASTER RECOVERY
              </span>
            </div>

            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              Reload Data from SQL File
            </h4>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              Upload & Execute .sql Script
            </span>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginTop: '12px', marginBottom: 0 }}>
              Restore database from a previously downloaded <code>.sql</code> backup file. The script runs with transactional integrity directly on PostgreSQL.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".sql"
              onChange={handleRestoreFile}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={restoring}
              style={{
                width: '100%',
                padding: '11px 20px',
                borderRadius: '9999px',
                backgroundColor: '#059669',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                cursor: restoring ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(5,150,105,0.25)',
                opacity: restoring ? 0.7 : 1,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => !restoring && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => !restoring && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Upload size={16} />
              <span>{restoring ? 'Restoring Database...' : 'Choose .sql File to Reload'}</span>
            </button>
          </div>
        </div>

        {/* CARD 3: REMOVE DUMMY DATA (TWO-STEP VALIDATION) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '24px',
          border: '1.5px solid #fecaca',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '20px',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626'
              }}>
                <Trash2 size={20} />
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#b91c1c',
                backgroundColor: '#fee2e2',
                padding: '3px 10px',
                borderRadius: '9999px',
                border: '1px solid #fca5a5'
              }}>
                DESTRUCTIVE ACTION
              </span>
            </div>

            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#991b1b', margin: '0 0 4px 0' }}>
              Remove Dummy Data
            </h4>
            <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: '600' }}>
              Two-Step Validated Destructive Action
            </span>

            <p style={{ fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5, marginTop: '12px', marginBottom: 0 }}>
              Purges all sample/dummy transaction actuals from <code>monthly_expense_entries</code>. Categories, cost heads, billing cycles, and users are safely preserved.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTwoStepModal(true)}
            style={{
              width: '100%',
              padding: '11px 20px',
              borderRadius: '9999px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(220,38,38,0.25)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <ShieldAlert size={16} />
            <span>Remove Dummy Data (2-Step Verify)</span>
          </button>
        </div>

        {/* CARD 4: RE-SEED DEFAULT DEMO ACTUALS */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '20px',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c3aed'
              }}>
                <RefreshCw size={20} />
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#7c3aed',
                backgroundColor: '#f5f3ff',
                padding: '3px 10px',
                borderRadius: '9999px',
                border: '1px solid #ddd6fe'
              }}>
                CANONICAL SEED
              </span>
            </div>

            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              Re-Seed Demo Actuals
            </h4>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              Jun'26 to Oct'26 Historical Records
            </span>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginTop: '12px', marginBottom: 0 }}>
              Quickly repopulates the standard audited 5-month demo numbers (Food ~₹6.27 Cr, Hostel ~₹87.48 L, Transport ~₹1.94 Cr) for presentation or testing.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReseedDefault}
            disabled={reseeding}
            style={{
              width: '100%',
              padding: '11px 20px',
              borderRadius: '9999px',
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 'none',
              cursor: reseeding ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(124,58,237,0.25)',
              opacity: reseeding ? 0.7 : 1,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => !reseeding && (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => !reseeding && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <RefreshCw size={16} />
            <span>{reseeding ? 'Re-Seeding Data...' : 'Reload Default Demo Actuals'}</span>
          </button>
        </div>

      </div>

      {/* TWO-STEP VALIDATION DELETE MODAL */}
      <TwoStepDeleteModal
        isOpen={showTwoStepModal}
        onClose={() => setShowTwoStepModal(false)}
        onConfirmClear={handleConfirmClearDummyData}
        loading={clearing}
      />

    </div>
  );
}
