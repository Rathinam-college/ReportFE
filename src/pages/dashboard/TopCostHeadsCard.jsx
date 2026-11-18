import React, { useState } from 'react';
import { formatLakhs, formatINR } from '../../utils/formatters';
import { Users, Mail, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function TopCostHeadsCard({ computedMatrix, onOpenDataEntry, onExportReport }) {
  const [activeFeedTab, setActiveFeedTab] = useState('activities'); // 'activities' | 'online'

  if (!computedMatrix || !computedMatrix.categories) return null;

  // Flatten and sort cost heads by total expenditure
  const items = [];
  computedMatrix.categories.forEach(cat => {
    cat.items?.forEach(it => {
      items.push({
        cost_head_id: it.cost_head_id,
        name: it.description || it.name,
        total: Number(it.total || 0),
        category: cat.category_name,
        category_id: cat.category_id
      });
    });
  });

  // Sort descending by total expenditure
  items.sort((a, b) => (b.total || 0) - (a.total || 0));

  const numPeriods = computedMatrix.periods?.length || 0;
  const hasExpenses = items.some(it => (it.total || 0) > 0);
  const topItems = (hasExpenses ? items.filter(it => it.total > 0) : items).slice(0, 5);

  const getCategoryColor = (catId) => {
    const colors = {
      1: '#6c56db', // Purple
      2: '#ff6088', // Coral
      3: '#10b981', // Mint
      4: '#38bdf8', // Sky
      5: '#f59e0b'  // Amber
    };
    return colors[catId] || '#6c56db';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      height: '100%'
    }}>
      {/* Top Section: Friends / Operations Activity Feed (Exact Style from Image) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '26px',
        padding: '22px 24px',
        border: '1px solid #edf0f8',
        boxShadow: '0 4px 20px rgba(110, 80, 180, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>
        {/* Header Title with 'View All' Link */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#efeefc',
              color: '#6c56db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={15} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1a1d36', margin: 0 }}>
              Friends & Activities
            </h3>
          </div>
          <button
            type="button"
            onClick={onOpenDataEntry}
            style={{ fontSize: '12px', fontWeight: '700', color: '#6c56db', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            View All
          </button>
        </div>

        {/* Segmented Pill Toggle: Activities (Purple Pill) vs Online */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f1f3f9',
          padding: '3px',
          borderRadius: '9999px',
          marginBottom: '16px',
          gap: '3px'
        }}>
          <button
            type="button"
            onClick={() => setActiveFeedTab('activities')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: activeFeedTab === 'activities' ? '800' : '600',
              backgroundColor: activeFeedTab === 'activities' ? '#6c56db' : 'transparent',
              color: activeFeedTab === 'activities' ? '#ffffff' : '#6e768e',
              border: 'none',
              boxShadow: activeFeedTab === 'activities' ? '0 3px 10px rgba(108, 86, 219, 0.3)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Activities
          </button>
          <button
            type="button"
            onClick={() => setActiveFeedTab('online')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: activeFeedTab === 'online' ? '800' : '600',
              backgroundColor: activeFeedTab === 'online' ? '#6c56db' : 'transparent',
              color: activeFeedTab === 'online' ? '#ffffff' : '#6e768e',
              border: 'none',
              boxShadow: activeFeedTab === 'online' ? '0 3px 10px rgba(108, 86, 219, 0.3)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Online Sync
          </button>
        </div>

        {/* Item List (Matching Friends Avatar Rows in Image) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          {!hasExpenses ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '24px 12px', textAlign: 'center', color: '#8f9bb3' }}>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>No activities recorded yet</span>
              <span style={{ fontSize: '11.5px', marginTop: '4px' }}>Entries will appear here in real-time</span>
            </div>
          ) : (
            topItems.map((it, idx) => {
              const badgeColor = getCategoryColor(it.category_id);

              return (
                <div
                  key={it.cost_head_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #f0f2fa',
                    gap: '10px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafbff';
                    e.currentTarget.style.borderColor = '#e0e4f8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#f0f2fa';
                  }}
                >
                  {/* Left: Avatar with Category Initial */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${badgeColor} 0%, #39287a 100%)`,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0
                    }}>
                      {it.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: '12.5px',
                        fontWeight: '700',
                        color: '#1a1d36',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {it.name}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#8f9bb3', marginTop: '1px' }}>
                        {it.category}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Action */}
                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#1a1d36' }} className="currency-font">
                      {formatLakhs(it.total)}
                    </div>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '8px',
                      backgroundColor: '#f1f3f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#8f9bb3'
                    }}>
                      <Mail size={13} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
