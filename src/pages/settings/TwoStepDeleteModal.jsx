import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function TwoStepDeleteModal({
  isOpen,
  onClose,
  onConfirmClear,
  loading
}) {
  const [step, setStep] = useState(1); // 1 = type verification text, 2 = final confirmation
  const [typedCode, setTypedCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleNextStep = (e) => {
    e.preventDefault();
    if (typedCode.trim() !== 'DELETE-DUMMY-DATA') {
      setErrorMsg('You must type DELETE-DUMMY-DATA exactly as shown.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleFinalConfirm = () => {
    onConfirmClear();
  };

  const handleClose = () => {
    setStep(1);
    setTypedCode('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
        overflow: 'hidden',
        border: '1px solid #fee2e2'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          backgroundColor: '#991b1b',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} color="#fecaca" />
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
              Two-Step Destructive Action: Remove Dummy Data
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{ color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Explanation & Security Verification */}
        {step === 1 && (
          <form onSubmit={handleNextStep} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#fef2f2',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid #fecaca'
            }}>
              <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '12.5px', color: '#991b1b', lineHeight: '1.4' }}>
                <strong>Step 1 of 2:</strong> This will delete all recorded monthly expense transactions from <code>monthly_expense_entries</code>, <code>dining_census_entries</code>, and <code>utility_meter_logs</code>.
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              All <strong>Expense Categories</strong>, <strong>Cost Heads</strong>, <strong>Billing Cycles</strong>, and <strong>User Logins</strong> will remain intact. The ledger matrix values will be reset to 0, ready for live production data entry.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                To proceed, type <code style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>DELETE-DUMMY-DATA</code> below:
              </label>
              <input
                type="text"
                placeholder="Type DELETE-DUMMY-DATA"
                value={typedCode}
                onChange={(e) => { setTypedCode(e.target.value); setErrorMsg(''); }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: errorMsg ? '2px solid #ef4444' : '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#0f172a',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
                required
                autoFocus
              />
              {errorMsg && (
                <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600', marginTop: '6px', display: 'block' }}>
                  {errorMsg}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={typedCode.trim() !== 'DELETE-DUMMY-DATA'}
                style={{
                  padding: '9px 22px',
                  borderRadius: '9999px',
                  backgroundColor: typedCode.trim() === 'DELETE-DUMMY-DATA' ? '#dc2626' : '#cbd5e1',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: typedCode.trim() === 'DELETE-DUMMY-DATA' ? 'pointer' : 'not-allowed',
                  boxShadow: typedCode.trim() === 'DELETE-DUMMY-DATA' ? '0 4px 14px rgba(220,38,38,0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Proceed to Step 2</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Final Confirmation */}
        {step === 2 && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#fef2f2',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '2px solid #ef4444'
            }}>
              <AlertTriangle size={26} color="#dc2626" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '14px', color: '#991b1b', display: 'block' }}>
                  Step 2 of 2: Final Execution Confirmation
                </strong>
                <span style={{ fontSize: '12.5px', color: '#7f1d1d', marginTop: '2px', display: 'block' }}>
                  Verification passed. Are you 100% certain you want to purge all demo expense transactions now?
                </span>
              </div>
            </div>

            <div style={{ fontSize: '12.5px', color: '#64748b', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              💡 <em>Recommendation: Download an SQL database backup before proceeding if you wish to retain a copy of the demo data.</em>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                disabled={loading}
                style={{
                  padding: '9px 24px',
                  borderRadius: '9999px',
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '800',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(185,28,28,0.35)',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Clearing Data...' : 'Yes, Permanently Clear Dummy Data'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
