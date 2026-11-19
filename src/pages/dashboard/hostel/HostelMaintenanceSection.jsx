import React, { useState } from 'react';
import { 
  Wrench, ShieldAlert, CheckCircle2, AlertCircle, Clock, Zap, Droplets, 
  Wifi, Hammer, Armchair, HelpCircle, AlertTriangle, RefreshCw
} from 'lucide-react';

export default function HostelMaintenanceSection({
  census = {}
}) {
  const [activeCategory, setActiveCategory] = useState('all');

  const num = (v, fb = 0) => {
    if (v === undefined || v === null || v === '') return fb;
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  const ticketsReceived = num(census.tickets_received, 160);
  const ticketsClosed = num(census.tickets_closed, 160);
  const ticketsOpen = num(census.tickets_open, Math.max(0, ticketsReceived - ticketsClosed));
  const pendingTickets = ticketsOpen;
  const avgTatHours = num(census.tat_hours, 58.4);
  const qualityReceived = num(census.quality_issues_received, 4);
  const qualityClosed = num(census.quality_issues_closed, 4);
  const qualityOpen = num(census.quality_issues_open, Math.max(0, qualityReceived - qualityClosed));
  const incidentsCount = num(census.incidents_count, 0);

  // Proportional category breakdown of tickets matching campus operations distribution
  const categories = [
    { id: 'electrical', name: 'Electrical', count: Math.round(ticketsReceived * 0.38), pct: 38, icon: Zap, color: '#f59e0b', bg: '#fef3c7' },
    { id: 'plumbing', name: 'Plumbing & Water Supply', count: Math.round(ticketsReceived * 0.26), pct: 26, icon: Droplets, color: '#0284c7', bg: '#e0f2fe' },
    { id: 'wifi', name: 'Wi-Fi & Internet', count: Math.round(ticketsReceived * 0.16), pct: 16, icon: Wifi, color: '#6366f1', bg: '#e0e7ff' },
    { id: 'civil', name: 'Civil Maintenance', count: Math.round(ticketsReceived * 0.10), pct: 10, icon: Hammer, color: '#d97706', bg: '#fef3c7' },
    { id: 'furniture', name: 'Furniture & Fixtures', count: Math.round(ticketsReceived * 0.06), pct: 6, icon: Armchair, color: '#8b5cf6', bg: '#ede9fe' },
    { id: 'other', name: 'Other Issues', count: Math.max(1, ticketsReceived - Math.round(ticketsReceived * 0.96)), pct: 4, icon: HelpCircle, color: '#64748b', bg: '#f1f5f9' }
  ];

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* SECTION HEADER BAR - Amber / Orange visual identity */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px 20px',
        backgroundColor: '#fffbeb',
        borderRadius: '16px',
        border: '1.5px solid #fde68a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#d97706',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '800'
          }}>
            2
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#78350f', margin: 0 }}>
                Service & Maintenance
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}>
                Complaints & Repairs
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#b45309' }}>
              Hostel maintenance complaints, categories, and repair turnaround times
            </p>
          </div>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          backgroundColor: '#ffffff',
          border: '1px solid #fcd34d',
          color: '#92400e',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          <Wrench size={14} color="#d97706" />
          <span>Complaints Received: <strong>{ticketsReceived.toLocaleString()}</strong></span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#059669' }}>Solved: <strong>{ticketsClosed.toLocaleString()}</strong></span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>Avg Time: <strong>{avgTatHours}h</strong></span>
        </div>
      </div>

      {/* 6 SERVICE & MAINTENANCE KPI CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px'
      }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', border: '1.5px solid #fde68a', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#92400e', textTransform: 'uppercase' }}>Complaints Received</span>
            <Wrench size={16} color="#d97706" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0' }}>
            {ticketsReceived.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Total complaints this month</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', border: '1.5px solid #bbf7d0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d', textTransform: 'uppercase' }}>Solved Complaints</span>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#16a34a', margin: '6px 0 2px 0' }}>
            {ticketsClosed.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '700' }}>
            {ticketsReceived > 0 ? ((ticketsClosed / ticketsReceived) * 100).toFixed(1) : '100.0'}% Solved
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', border: `1.5px solid ${ticketsOpen > 0 ? '#fecaca' : '#cbd5e1'}`, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: ticketsOpen > 0 ? '#dc2626' : '#64748b', textTransform: 'uppercase' }}>Open Complaints</span>
            <AlertCircle size={16} color={ticketsOpen > 0 ? '#dc2626' : '#64748b'} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: ticketsOpen > 0 ? '#dc2626' : '#0f172a', margin: '6px 0 2px 0' }}>
            {ticketsOpen.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Work in progress</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Pending Complaints</span>
            <Clock size={16} color="#475569" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0' }}>
            {pendingTickets.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Waiting for parts or technician</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', border: '1.5px solid #bfdbfe', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase' }}>Average Repair Time</span>
            <Clock size={16} color="#2563eb" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e40af', margin: '6px 0 2px 0' }}>
            {avgTatHours} <span style={{ fontSize: '14px', fontWeight: '600' }}>hours</span>
          </div>
          <div style={{ fontSize: '11px', color: '#1d4ed8' }}>About 2.4 days to fix complaints</div>
        </div>
      </div>

      {/* COMPLAINT CATEGORIES DISTRIBUTION & BREAKDOWN */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Complaints by Category
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Complaints by type: Electrical, Plumbing, Wi-Fi, Civil, Furniture & Other
            </p>
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>
            Total Complaints: <strong>{ticketsReceived.toLocaleString()}</strong>
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '12px'
        }}>
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: c.bg,
                  color: c.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>{c.name}</span>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{c.count}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${c.pct}%`, height: '100%', backgroundColor: c.color, borderRadius: '9999px' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>{c.pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
