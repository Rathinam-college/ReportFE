import React from 'react';
import { Calendar, Plus, Lock, Unlock, Edit, Trash2 } from 'lucide-react';

export default function PeriodsManager({
  computedMatrix,
  setShowAddMonthModal,
  openEditPeriodModal,
  handleDeletePeriod
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '20px 24px',
        border: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
            Monthly Billing Cycles Management
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
            Manage monthly reporting periods. Edit month labels, lock/close cycles, or <strong>delete redundant months</strong> to remove them from Data Entry and Matrix tables.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowAddMonthModal(true)}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>Add New Month / Cycle</span>
          </button>
        </div>
      </div>

      {/* PERIODS TABLE */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#2563eb" />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
              Configured Billing Periods ({computedMatrix?.periods?.length || 0} Cycles)
            </h3>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            💡 Click ✏️ to rename or lock a month • Click 🗑️ to delete a month and its data
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '12px 18px', width: '8%', textAlign: 'center' }}>#</th>
                <th style={{ padding: '12px 20px', width: '22%', textAlign: 'left' }}>Month / Cycle Label</th>
                <th style={{ padding: '12px 20px', width: '18%', textAlign: 'left' }}>Period Code</th>
                <th style={{ padding: '12px 20px', width: '18%', textAlign: 'left' }}>Operating Days</th>
                <th style={{ padding: '12px 20px', width: '18%', textAlign: 'left' }}>Data Entry Status</th>
                <th style={{ padding: '12px 18px', width: '16%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {computedMatrix?.periods?.map((p, idx) => {
                const isClosed = !!p.is_closed;
                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                    }}
                  >
                    <td style={{ padding: '12px 18px', textAlign: 'center', fontFamily: 'monospace', color: '#64748b', fontWeight: '600' }}>
                      #{p.id}
                    </td>

                    <td style={{ padding: '12px 20px', fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={15} color="#2563eb" />
                        <span>{p.period_label}</span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontWeight: '600', color: '#334155' }}>
                      {p.period_code}
                    </td>

                    <td style={{ padding: '12px 20px', color: '#64748b' }}>
                      {p.operating_days || 30} Days
                    </td>

                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 9px',
                        borderRadius: '5px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        backgroundColor: isClosed ? '#f1f5f9' : '#ecfdf5',
                        color: isClosed ? '#64748b' : '#047857',
                        border: `1px solid ${isClosed ? '#cbd5e1' : '#a7f3d0'}`
                      }}>
                        {isClosed ? <Lock size={11} /> : <Unlock size={11} />}
                        <span>{isClosed ? 'Locked / Closed' : 'Open for Entry'}</span>
                      </span>
                    </td>

                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => openEditPeriodModal(p)}
                          title={`Edit month "${p.period_label}"`}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '4px',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          <Edit size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePeriod(p)}
                          title={`Delete month "${p.period_label}" and its recorded data`}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '4px',
                            backgroundColor: '#fef2f2',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
