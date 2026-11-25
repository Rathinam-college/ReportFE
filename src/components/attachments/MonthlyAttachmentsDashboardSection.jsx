import React, { useState, useEffect } from 'react';
import {
  Paperclip, UploadCloud, FileText, Image as ImageIcon,
  FileSpreadsheet, Presentation, Eye, Download, ExternalLink,
  RefreshCw, CheckCircle2, ChevronRight, Layers, Plus, Calendar,
  Building2, Tag, Clock, Film
} from 'lucide-react';
import MonthlyAttachmentsModal from './MonthlyAttachmentsModal';
import { getAttachmentDownloadUrl } from '../../utils/api';

export default function MonthlyAttachmentsDashboardSection({
  module = 'transport',
  periodId,
  periodLabel = '',
  periods = [],
  branch = 'Common',
  currentUser = null,
  onRefresh
}) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialPreviewId, setInitialPreviewId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'ppt' | 'pdf' | 'excel' | 'image' | 'link'

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const url = (!periodId || periodId === 'all')
        ? `/api/attachments?module=${module}`
        : `/api/attachments?module=${module}&period_id=${periodId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data.attachments || []);
      }
    } catch (err) {
      console.warn(`[MonthlyAttachmentsDashboardSection] Error fetching attachments for ${module}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [module, periodId, branch]);

  const handleOpenPreview = (att) => {
    setInitialPreviewId(att.id);
    setModalOpen(true);
  };

  const handleOpenUpload = () => {
    setInitialPreviewId(null);
    setModalOpen(true);
  };

  const filteredAttachments = attachments.filter(att => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'ppt') return att.file_type === 'ppt';
    if (activeFilter === 'pdf') return att.file_type === 'pdf';
    if (activeFilter === 'excel') return att.file_type === 'excel';
    if (activeFilter === 'media') return ['image', 'video', 'audio'].includes(att.file_type);
    if (activeFilter === 'link') return att.is_link || att.file_type === 'link';
    return true;
  });

  const formatUploadDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso).slice(0, 16);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const getMonthBadgeLabel = (att) => {
    const p = (periods || []).find(pr => String(pr.id) === String(att.period_id));
    if (p) return p.period_label || p.period_code || periodLabel || 'Cycle';
    return periodLabel || `Period #${att.period_id}`;
  };

  const deptLabelMap = { food: 'Food', hostel: 'Hostel', transport: 'Transport', cctv: 'CCTV' };
  const deptLabel = deptLabelMap[String(module).toLowerCase()] || String(module).toUpperCase();

  const getFileBadge = (fileType) => {
    switch (fileType) {
      case 'ppt':
        return { label: 'Presentation (PPT)', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5', icon: <Presentation size={14} color="#ea580c" /> };
      case 'pdf':
        return { label: 'PDF Document', color: '#dc2626', bg: '#fef2f2', border: '#fee2e2', icon: <FileText size={14} color="#dc2626" /> };
      case 'excel':
        return { label: 'Spreadsheet', color: '#16a34a', bg: '#f0fdf4', border: '#dcfce7', icon: <FileSpreadsheet size={14} color="#16a34a" /> };
      case 'image':
        return { label: 'Media • Image', color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe', icon: <ImageIcon size={14} color="#7c3aed" /> };
      case 'video':
        return { label: 'Media • Video', color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe', icon: <Film size={14} color="#7c3aed" /> };
      case 'audio':
        return { label: 'Media • Audio', color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe', icon: <Film size={14} color="#7c3aed" /> };
      case 'link':
        return { label: 'Web Link', color: '#0284c7', bg: '#f0f9ff', border: '#e0f2fe', icon: <ExternalLink size={14} color="#0284c7" /> };
      default:
        return { label: 'Document', color: '#475569', bg: '#f8fafc', border: '#e2e8f0', icon: <FileText size={14} color="#475569" /> };
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const pptCount = attachments.filter(a => a.file_type === 'ppt').length;
  const pdfCount = attachments.filter(a => a.file_type === 'pdf').length;
  const excelCount = attachments.filter(a => a.file_type === 'excel').length;
  const mediaCount = attachments.filter(a => ['image', 'video', 'audio'].includes(a.file_type)).length;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1.5px solid #cbd5e1',
      padding: '20px 22px',
      boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)'
          }}>
            <Paperclip size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                Attached Files, Presentations & Bills ({attachments.length})
              </h4>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 9px',
                borderRadius: '9999px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe'
              }}>
                {periodLabel || 'Active Month'}
              </span>
              {pptCount > 0 && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#fff7ed',
                  color: '#ea580c',
                  border: '1px solid #fed7aa',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Presentation size={11} />
                  {pptCount} PPT {pptCount === 1 ? 'Deck' : 'Decks'}
                </span>
              )}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
              Department operational files, management review presentations, and bills for {periodLabel || 'this cycle'}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={fetchAttachments}
            disabled={loading}
            title="Refresh attached documents"
            style={{
              padding: '6px 10px',
              borderRadius: '7px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#475569',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenUpload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 15px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '800',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <UploadCloud size={14} />
            <span>Upload All Files / Manage</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs if multiple files exist */}
      {attachments.length > 2 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
          {[
            { id: 'all', label: `All Files (${attachments.length})` },
            ...(pptCount > 0 ? [{ id: 'ppt', label: `PPT Slides (${pptCount})` }] : []),
            ...(pdfCount > 0 ? [{ id: 'pdf', label: `PDFs (${pdfCount})` }] : []),
            ...(excelCount > 0 ? [{ id: 'excel', label: `Sheets (${excelCount})` }] : []),
            ...(mediaCount > 0 ? [{ id: 'media', label: `Media (${mediaCount})` }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeFilter === tab.id ? '#1e293b' : '#f1f5f9',
                color: activeFilter === tab.id ? '#ffffff' : '#64748b'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content: List of File Cards */}
      {loading && attachments.length === 0 ? (
        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '13px', margin: 0 }}>Loading attached files...</p>
        </div>
      ) : attachments.length === 0 ? (
        <div style={{
          padding: '30px 20px',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1.5px dashed #cbd5e1'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <UploadCloud size={22} />
          </div>
          <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
            No Files Attached for {periodLabel || 'this Month'}
          </h5>
          <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#64748b' }}>
            Upload presentation decks (PPT/PPTX), monthly audit bills (PDF), or verification images to attach to this cycle.
          </p>
          <button
            type="button"
            onClick={handleOpenUpload}
            style={{
              padding: '6px 14px',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: '#ffffff',
              color: '#2563eb',
              border: '1.5px solid #bfdbfe',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Plus size={13} />
            <span>Upload Files for {periodLabel}</span>
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '12px'
        }}>
          {filteredAttachments.map((att) => {
            const badge = getFileBadge(att.file_type);
            const isPpt = att.file_type === 'ppt';

            return (
              <div
                key={att.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: isPpt ? '1.5px solid #ea580c50' : '1px solid #e2e8f0',
                  boxShadow: isPpt ? '0 2px 8px rgba(234, 88, 12, 0.1)' : '0 1px 3px rgba(0,0,0,0.03)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>

                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {att.file_size > 0 ? formatFileSize(att.file_size) : ''}
                    </span>
                  </div>

                  <h5 style={{
                    margin: '0 0 6px 0',
                    fontSize: '13px',
                    fontWeight: '800',
                    color: '#0f172a',
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }} title={att.file_name}>
                    {att.file_name}
                  </h5>

                  {/* Department, Month, Topic & Upload Date Meta */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px',
                      backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                      display: 'inline-flex', alignItems: 'center', gap: '3px'
                    }}>
                      <Building2 size={10} />
                      {deptLabel}{att.branch && att.branch !== 'Common' ? ` (${att.branch})` : ''}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px',
                      backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
                      display: 'inline-flex', alignItems: 'center', gap: '3px'
                    }}>
                      <Calendar size={10} />
                      {getMonthBadgeLabel(att)}
                    </span>
                    {att.topic && (
                      <span style={{
                        fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px',
                        backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe',
                        display: 'inline-flex', alignItems: 'center', gap: '3px'
                      }}>
                        <Tag size={10} />
                        {att.topic}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                    <span>By {att.uploaded_by || 'User'}</span>
                    {att.created_at && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#475569', fontWeight: '600' }}>
                        <Clock size={10} />
                        {formatUploadDate(att.created_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(att)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '800',
                      backgroundColor: isPpt ? '#ea580c' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: isPpt ? '0 1px 4px rgba(234, 88, 12, 0.3)' : '0 1px 4px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    <Eye size={12} />
                    <span>{isPpt ? 'Preview Slides' : 'Preview'}</span>
                  </button>

                  <a
                    href={getAttachmentDownloadUrl(att)}
                    target={att.is_link ? '_blank' : undefined}
                    rel={att.is_link ? 'noopener noreferrer' : undefined}
                    download={att.is_link ? undefined : att.file_name}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      backgroundColor: '#f8fafc',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                    title={att.is_link ? 'Open web link' : 'Download file'}
                  >
                    {att.is_link ? <ExternalLink size={12} /> : <Download size={12} />}
                    <span>{att.is_link ? 'Open' : 'Save'}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Render Modal */}
      {modalOpen && (
        <MonthlyAttachmentsModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setInitialPreviewId(null);
            fetchAttachments();
            onRefresh?.();
          }}
          module={module}
          periodId={periodId}
          periodLabel={periodLabel}
          periods={periods}
          initialPreviewAttachmentId={initialPreviewId}
          currentUser={currentUser}
          onAttachmentCountChange={() => {
            fetchAttachments();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
