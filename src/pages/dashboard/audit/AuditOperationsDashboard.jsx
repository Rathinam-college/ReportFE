import React, { useState } from 'react';
import { ClipboardCheck, ArrowUpRight, RefreshCw, Search, Paperclip } from 'lucide-react';
import MonthlyAttachmentsDashboardSection from '../../../components/attachments/MonthlyAttachmentsDashboardSection';

export default function AuditOperationsDashboard({
  periods = [],
  activePeriod,
  setActivePeriod,
  onOpenDataEntry,
  onRefreshAttachments
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const activePeriodObj = periods.find(p => String(p.id) === String(activePeriod)) || null;
  const isAllMonths = !activePeriod || activePeriod === 'all';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sticky Top Header & Filter Bar */}
      <div
        className="sticky-dashboard-master-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 80,
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #E1E6F2',
          padding: '16px 22px',
          boxShadow: '0 4px 18px rgba(20, 36, 92, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#14245C',
              color: '#F5A524',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ClipboardCheck size={21} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#14245C', margin: 0, letterSpacing: '-0.02em' }}>
                  Audit Operations &amp; Compliance Dashboard
                </h1>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#EAF0FF',
                  color: '#2F4BB8'
                }}>
                  Audit &amp; Compliance
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '3px 0 0 0', fontWeight: '500' }}>
                Departmental audit tracking · findings · observations · compliance &amp; verification ledger
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onRefreshAttachments?.()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '38px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: '700',
                backgroundColor: '#ffffff',
                color: '#14245C',
                border: '1px solid #E1E6F2',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
              <span>Refresh live</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDataEntry?.(!isAllMonths ? Number(activePeriod) : null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '38px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: '800',
                backgroundColor: '#F5A524',
                color: '#14245C',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(245, 165, 36, 0.28)'
              }}
            >
              <span>Open data entry</span>
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>

        {/* Month Filter + Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderTop: '1px solid #EDF0F8',
          paddingTop: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              MONTH
            </span>
            <button
              type="button"
              onClick={() => setActivePeriod('all')}
              style={{
                minHeight: '36px',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: isAllMonths ? '800' : '600',
                backgroundColor: isAllMonths ? '#14245C' : '#F3F5FA',
                color: isAllMonths ? '#ffffff' : '#334155',
                border: isAllMonths ? '1px solid #14245C' : '1px solid #E1E6F2',
                cursor: 'pointer'
              }}
            >
              All months
            </button>
            {periods.map(p => {
              const isSel = String(activePeriod) === String(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePeriod(String(p.id))}
                  style={{
                    minHeight: '36px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: isSel ? '800' : '600',
                    backgroundColor: isSel ? '#14245C' : '#ffffff',
                    color: isSel ? '#ffffff' : '#334155',
                    border: isSel ? '1px solid #14245C' : '1px solid #E1E6F2',
                    cursor: 'pointer'
                  }}
                >
                  {p.period_label || p.label || `Month ${p.id}`}
                </button>
              );
            })}
          </div>

          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search audit parameter…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                minHeight: '38px',
                padding: '7px 12px 7px 34px',
                borderRadius: '10px',
                border: '1px solid #E1E6F2',
                backgroundColor: '#F3F5FA',
                color: '#14245C',
                fontSize: '12.5px',
                fontWeight: '600',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Audit Workspace Placeholder Card (Ready to connect table & parameters) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #E1E6F2',
        padding: '32px 24px',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(20, 36, 92, 0.04)'
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          backgroundColor: '#EAF0FF',
          color: '#14245C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px auto'
        }}>
          <ClipboardCheck size={26} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#14245C', margin: '0 0 6px 0' }}>
          Audit Department Module Ready
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '520px', margin: '0 auto 16px auto' }}>
          The Audit Home Dashboard, Data Entry, and Master Data pages are set up and ready to connect your Audit table columns, parameters, and live database records.
        </p>
        <button
          type="button"
          onClick={() => onOpenDataEntry?.(!isAllMonths ? Number(activePeriod) : null)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            minHeight: '38px',
            padding: '8px 18px',
            borderRadius: '10px',
            fontSize: '12.5px',
            fontWeight: '800',
            backgroundColor: '#14245C',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Paperclip size={14} />
          <span>Go to Audit Data Entry</span>
        </button>
      </div>

      {/* Monthly Attachments Section */}
      <MonthlyAttachmentsDashboardSection
        module="audit"
        periodId={isAllMonths ? 'all' : (activePeriodObj?.id || activePeriod)}
        periodLabel={isAllMonths ? 'All Months' : (activePeriodObj?.period_label || 'Selected Month')}
        periods={periods}
        currentUser={null}
        onRefresh={onRefreshAttachments}
      />
    </div>
  );
}
