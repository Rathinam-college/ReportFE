import React, { useState, useMemo } from 'react';
import { formatINR } from '../../../utils/formatters';
import { Download, Search, MessageSquare, X } from 'lucide-react';

export default function ChartDataTable({
  categories = [],
  periods = [],
  activePeriod = 'all'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCommentPopover, setActiveCommentPopover] = useState(null); // { id, title, text, x, y }

  // Flatten all items
  const flatRows = useMemo(() => {
    const list = [];
    let grandTotalSelected = 0;
    let grandTotal5Mo = 0;

    categories.forEach(cat => {
      cat.items.forEach(it => {
        let selectedAmt = 0;
        let activeRemark = '';

        if (activePeriod === 'all') {
          selectedAmt = it.total || 0;
          // Look for any remark across periods
          if (it.remarks) {
            for (const pid of Object.keys(it.remarks)) {
              if (it.remarks[pid]) {
                const pLabel = periods.find(p => String(p.id) === String(pid))?.period_label || pid;
                activeRemark += (activeRemark ? ' • ' : '') + `[${pLabel}]: ${it.remarks[pid]}`;
              }
            }
          }
        } else {
          selectedAmt = it.amounts[activePeriod] || 0;
          activeRemark = it.remarks?.[activePeriod] || '';
        }

        const total5Mo = it.total || 0;
        const avgAmt = it.avg || 0;

        grandTotalSelected += selectedAmt;
        grandTotal5Mo += total5Mo;

        let momGrowth = 0;
        if (periods.length >= 2) {
          const firstVal = it.amounts[periods[0].id] || 0;
          const lastVal = it.amounts[periods[periods.length - 1].id] || 0;
          if (firstVal > 0) {
            momGrowth = ((lastVal - firstVal) / firstVal) * 100;
          }
        }

        list.push({
          cost_head_id: it.cost_head_id,
          description: it.description,
          category: cat.category_name,
          selectedAmt,
          total5Mo,
          avgAmt,
          momGrowth,
          remark: activeRemark
        });
      });
    });

    const enriched = list.map(r => ({
      ...r,
      sharePct: grandTotalSelected > 0 ? (r.selectedAmt / grandTotalSelected) * 100 : 0
    }));

    return {
      rows: enriched,
      grandTotalSelected,
      grandTotal5Mo
    };
  }, [categories, periods, activePeriod]);

  // Filter by search
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return flatRows.rows;
    const term = searchTerm.toLowerCase();
    return flatRows.rows.filter(r =>
      r.description.toLowerCase().includes(term) ||
      r.category.toLowerCase().includes(term)
    );
  }, [flatRows.rows, searchTerm]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Category', 'Description / Cost Head', 'Selected Spend (INR)', '5-Month Total (INR)', 'Avg / Month', 'Share %', 'MoM Growth %', 'Remark / Note'];
    const rows = filteredRows.map(r => [
      `"${r.category}"`,
      `"${r.description}"`,
      r.selectedAmt.toFixed(2),
      r.total5Mo.toFixed(2),
      r.avgAmt.toFixed(2),
      r.sharePct.toFixed(2) + '%',
      r.momGrowth.toFixed(2) + '%',
      `"${r.remark || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rathinam_dashboard_values_${activePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #eef2f6',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Header Bar */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Complete Expenditure Data Values Ledger
          </h3>
          <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
            All cost head values, run-rates, percentage contributions & operational remarks
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search line item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 12px 6px 30px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12.5px',
                width: '180px',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
            }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '11.5px', fontWeight: '600' }}>
              <th style={{ padding: '10px 18px', width: '5%', textAlign: 'center' }}>#</th>
              <th style={{ padding: '10px 18px', width: '24%', textAlign: 'left' }}>Description / Cost Head</th>
              <th style={{ padding: '10px 18px', width: '18%', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '10px 16px', width: '18%', textAlign: 'right' }}>
                {activePeriod === 'all' ? '5-Month Total (₹)' : `Cycle Spend (₹)`}
              </th>
              <th style={{ padding: '10px 16px', width: '14%', textAlign: 'right' }}>Monthly Run-Rate</th>
              <th style={{ padding: '10px 14px', width: '9%', textAlign: 'right' }}>Share %</th>
              <th style={{ padding: '10px 16px', width: '12%', textAlign: 'center' }}>Remark / Note</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => {
              const hasRemark = Boolean(row.remark);

              return (
                <tr
                  key={row.cost_head_id}
                  style={{
                    borderBottom: '1px solid #f8fafc',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafbfe'
                  }}
                >
                  <td style={{ padding: '10px 18px', textAlign: 'center', fontFamily: 'monospace', color: '#94a3b8' }}>
                    #{idx + 1}
                  </td>

                  <td style={{ padding: '10px 18px', fontWeight: '600', color: '#0f172a' }}>
                    {row.description}
                  </td>

                  <td style={{ padding: '10px 18px', color: '#475569', fontSize: '12.5px' }}>
                    {row.category}
                  </td>

                  {/* Amount with Comment Trigger */}
                  <td
                    style={{
                      padding: '10px 16px',
                      textAlign: 'right',
                      fontWeight: '800',
                      color: '#0f172a'
                    }}
                    className="currency-font"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <span>{formatINR(row.selectedAmt)}</span>
                      {hasRemark && (
                        <button
                          type="button"
                          onClick={() => setActiveCommentPopover({
                            title: row.description,
                            category: row.category,
                            text: row.remark
                          })}
                          onMouseEnter={() => setActiveCommentPopover({
                            title: row.description,
                            category: row.category,
                            text: row.remark
                          })}
                          title="View remark / comment"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#eef2ff',
                            color: '#4f46e5',
                            cursor: 'pointer',
                            border: 'none',
                            padding: 0
                          }}
                        >
                          <MessageSquare size={11} />
                        </button>
                      )}
                    </div>
                  </td>

                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#64748b' }} className="currency-font">
                    {formatINR(row.avgAmt)}
                  </td>

                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5', backgroundColor: '#eef2ff', padding: '2px 7px', borderRadius: '4px' }}>
                      {row.sharePct.toFixed(1)}%
                    </span>
                  </td>

                  {/* Remark Cell */}
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    {hasRemark ? (
                      <button
                        type="button"
                        onClick={() => setActiveCommentPopover({
                          title: row.description,
                          category: row.category,
                          text: row.remark
                        })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#eef2ff',
                          color: '#4f46e5',
                          fontSize: '11px',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <MessageSquare size={11} />
                        <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.remark}
                        </span>
                      </button>
                    ) : (
                      <span style={{ color: '#cbd5e1', fontSize: '11px' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FLOATING COMMENT / REMARK POPOVER MODAL */}
      {activeCommentPopover && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 18px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} />
                <span style={{ fontSize: '14px', fontWeight: '700' }}>Line Item Remark</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveCommentPopover(null)}
                style={{ color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                  {activeCommentPopover.category}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                  {activeCommentPopover.title}
                </div>
              </div>

              <div style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                color: '#1e293b',
                lineHeight: 1.5,
                fontStyle: 'italic'
              }}>
                💬 "{activeCommentPopover.text}"
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setActiveCommentPopover(null)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
