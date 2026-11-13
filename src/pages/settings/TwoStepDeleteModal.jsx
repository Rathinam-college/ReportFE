import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          backgroundColor: '#991b1b',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} />
            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>
              Two-Step Destructive Action: Remove Dummy Data
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{ color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer' }}
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
              gap: '10px',
              backgroundColor: '#fef2f2',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '12.5px', color: '#991b1b' }}>
                <strong>Step 1 of 2:</strong> This will delete all recorded monthly expense transactions from <code>monthly_expense_entries</code>, <code>dining_census_entries</code>, and <code>utility_meter_logs</code>.
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              All <strong>Expense Categories</strong>, <strong>Cost Heads</strong>, <strong>Billing Cycles</strong>, and <strong>User Logins</strong> will remain intact. The ledger matrix values will be reset to 0, ready for live production data entry.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                To proceed, type <code style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>DELETE-DUMMY-DATA</code> below:
              </label>
              <input
                type="text"
                placeholder="Type DELETE-DUMMY-DATA"
                value={typedCode}
                onChange={(e) => { setTypedCode(e.target.value); setErrorMsg(''); }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: errorMsg ? '2px solid #ef4444' : '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#0f172a',
                  fontFamily: 'monospace'
                }}
                required
                autoFocus
              />
              {errorMsg && (
                <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                  {errorMsg}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '9px 16px',
                  borderRadius: '6px',
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
                  padding: '9px 18px',
                  borderRadius: '6px',
                  backgroundColor: typedCode.trim() === 'DELETE-DUMMY-DATA' ? '#dc2626' : '#cbd5e1',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: typedCode.trim() === 'DELETE-DUMMY-DATA' ? 'pointer' : 'not-allowed',
                  boxShadow: typedCode.trim() === 'DELETE-DUMMY-DATA' ? '0 2px 6px rgba(220,38,38,0.4)' : 'none'
                }}
              >
                Proceed to Step 2 ➔
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
              gap: '10px',
              backgroundColor: '#fef2f2',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '2px solid #ef4444'
            }}>
              <AlertTriangle size={26} color="#dc2626" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '13.5px', color: '#991b1b', display: 'block' }}>
                  Step 2 of 2: Final Execution Confirmation
                </strong>
                <span style={{ fontSize: '12px', color: '#7f1d1d' }}>
                  Verification passed. Are you 100% certain you want to purge all demo expense transactions now?
                </span>
              </div>
            </div>

            <div style={{ fontSize: '12.5px', color: '#64748b', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              💡 <em>Recommendation: Download an SQL database backup before proceeding if you wish to retain a copy of the demo data.</em>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '6px',
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
                  padding: '9px 20px',
                  borderRadius: '6px',
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '800',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(185,28,28,0.4)',
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
