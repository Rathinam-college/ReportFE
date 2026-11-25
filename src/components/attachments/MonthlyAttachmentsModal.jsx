import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Paperclip, UploadCloud, Link2, FileText, Image as ImageIcon,
  FileSpreadsheet, Presentation, Eye, Download, Trash2, ExternalLink,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, CheckCircle2,
  AlertCircle, RefreshCw, Calendar, Sparkles, Layers, ArrowLeft
} from 'lucide-react';
import { getAttachmentDownloadUrl, getAttachmentViewUrl } from '../../utils/api';

export default function MonthlyAttachmentsModal({
  isOpen,
  onClose,
  module = 'food',
  periodId,
  periodLabel = '',
  periods = [],
  onPeriodChange,
  readOnly = false,
  currentUser = null,
  onAttachmentCountChange,
  initialPreviewAttachmentId = null
}) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'upload' | 'link'
  
  // Upload State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadTopic, setUploadTopic] = useState('');
  
  // Link State
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);

  // Previewer State
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // PowerPoint Presentation Slide Deck State
  const [pptSlides, setPptSlides] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [loadingPptSlides, setLoadingPptSlides] = useState(false);

  // Notification State
  const [message, setMessage] = useState(null);

  const fileInputRef = useRef(null);

  // Display Module Name
  const moduleName = useMemo(() => {
    switch (module) {
      case 'food': return 'Food Operations';
      case 'hostel': return 'Hostel Operations';
      case 'transport': return 'Transport Fleet';
      case 'cctv': return 'CCTV Surveillance';
      default: return 'Operations';
    }
  }, [module]);

  // Fetch attachments for current module and period
  const fetchAttachments = async () => {
    if (!periodId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/attachments?module=${module}&period_id=${periodId}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.attachments || [];
        setAttachments(list);
        if (onAttachmentCountChange) {
          onAttachmentCountChange(list.length);
        }
        if (initialPreviewAttachmentId) {
          const target = list.find(a => a.id === initialPreviewAttachmentId);
          if (target) setPreviewAttachment(target);
        }
      }
    } catch (err) {
      console.error('Error fetching attachments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && periodId) {
      fetchAttachments();
      setActiveTab('list');
      if (!initialPreviewAttachmentId) {
        setPreviewAttachment(null);
      }
      setSelectedFiles([]);
      setLinkUrl('');
      setLinkTitle('');
      setMessage(null);
    }
  }, [isOpen, module, periodId]);

  // Fetch slides when PPT attachment is selected for preview
  useEffect(() => {
    if (previewAttachment && previewAttachment.file_type === 'ppt') {
      if (previewAttachment.is_link) {
        setPptSlides([]);
        return;
      }
      setLoadingPptSlides(true);
      setActiveSlideIndex(0);
      fetch(`/api/attachments/${previewAttachment.id}/slides`)
        .then(r => r.json())
        .then(d => {
          if (d.status === 'success' && Array.isArray(d.slides) && d.slides.length > 0) {
            setPptSlides(d.slides);
          } else {
            setPptSlides([]);
          }
        })
        .catch(err => {
          console.warn('[PPT Preview notice]', err);
          setPptSlides([]);
        })
        .finally(() => setLoadingPptSlides(false));
    } else {
      setPptSlides([]);
      setActiveSlideIndex(0);
    }
  }, [previewAttachment]);

  // Keyboard navigation for presentation slides
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!previewAttachment || previewAttachment.file_type !== 'ppt' || pptSlides.length === 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setActiveSlideIndex(prev => Math.min(pptSlides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setActiveSlideIndex(prev => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewAttachment, pptSlides]);

  // Handle Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
    }
  };

  const handleFilesSelected = (newFiles) => {
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setActiveTab('upload');
  };

  const removeSelectedFile = (idx) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Perform Multi-file Upload
  const handleUploadSubmit = async () => {
    if (!selectedFiles.length || !periodId) return;
    try {
      setUploading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append('module', module);
      formData.append('period_id', String(periodId));
      formData.append('branch', 'Common');
      formData.append('uploaded_by', currentUser?.name || currentUser?.username || 'User');
      formData.append('topic', uploadTopic.trim());

      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to upload files');
      }

      const result = await res.json();
      setMessage({ type: 'success', text: result.message || 'Files uploaded successfully!' });
      setSelectedFiles([]);
      setUploadTopic('');
      setActiveTab('list');
      await fetchAttachments();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error uploading files' });
    } finally {
      setUploading(false);
    }
  };

  // Add External Web Link
  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkUrl.trim() || !periodId) return;

    try {
      setIsAddingLink(true);
      setMessage(null);

      const res = await fetch('/api/attachments/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module,
          period_id: Number(periodId),
          branch: 'Common',
          url: linkUrl.trim(),
          title: linkTitle.trim() || linkUrl.trim(),
          uploaded_by: currentUser?.name || currentUser?.username || 'User'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to attach link');
      }

      setMessage({ type: 'success', text: 'Document link attached successfully!' });
      setLinkUrl('');
      setLinkTitle('');
      setActiveTab('list');
      await fetchAttachments();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error adding link' });
    } finally {
      setIsAddingLink(false);
    }
  };

  // Delete Attachment
  const handleDelete = async (attId, attName) => {
    if (!window.confirm(`Are you sure you want to delete "${attName}"?`)) return;

    try {
      const res = await fetch(`/api/attachments/${attId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Deleted "${attName}" successfully` });
        if (previewAttachment?.id === attId) {
          setPreviewAttachment(null);
        }
        await fetchAttachments();
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Delete error' });
    }
  };

  // Format File Size
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get icon and color badge for file type
  const getTypeBadge = (type, isLink) => {
    if (isLink) {
      return {
        icon: <Link2 size={16} color="#7c3aed" />,
        label: 'Web Link',
        bg: '#f5f3ff',
        text: '#6d28d9',
        border: '#ddd6fe'
      };
    }
    switch (type) {
      case 'image':
        return {
          icon: <ImageIcon size={16} color="#0284c7" />,
          label: 'Image',
          bg: '#f0f9ff',
          text: '#0369a1',
          border: '#bae6fd'
        };
      case 'pdf':
        return {
          icon: <FileText size={16} color="#dc2626" />,
          label: 'PDF Document',
          bg: '#fef2f2',
          text: '#b91c1c',
          border: '#fecaca'
        };
      case 'excel':
        return {
          icon: <FileSpreadsheet size={16} color="#16a34a" />,
          label: 'Spreadsheet',
          bg: '#f0fdf4',
          text: '#15803d',
          border: '#bbf7d0'
        };
      case 'ppt':
        return {
          icon: <Presentation size={16} color="#ea580c" />,
          label: 'Presentation',
          bg: '#fff7ed',
          text: '#c2410c',
          border: '#fed7aa'
        };
      case 'doc':
        return {
          icon: <FileText size={16} color="#4f46e5" />,
          label: 'Word Document',
          bg: '#eef2ff',
          text: '#4338ca',
          border: '#c7d2fe'
        };
      default:
        return {
          icon: <Paperclip size={16} color="#64748b" />,
          label: 'File',
          bg: '#f8fafc',
          text: '#475569',
          border: '#e2e8f0'
        };
    }
  };

  // Preview Navigation (Prev / Next)
  const currentPreviewIndex = useMemo(() => {
    if (!previewAttachment) return -1;
    return attachments.findIndex(a => a.id === previewAttachment.id);
  }, [attachments, previewAttachment]);

  const handlePrevPreview = () => {
    if (currentPreviewIndex > 0) {
      setPreviewAttachment(attachments[currentPreviewIndex - 1]);
      setZoomLevel(1);
      setRotation(0);
    }
  };

  const handleNextPreview = () => {
    if (currentPreviewIndex < attachments.length - 1) {
      setPreviewAttachment(attachments[currentPreviewIndex + 1]);
      setZoomLevel(1);
      setRotation(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: previewAttachment ? '1100px' : '900px',
          height: '90vh',
          maxHeight: '850px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'max-width 0.25s ease'
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1e293b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Paperclip size={20} color="#818cf8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                  {previewAttachment ? `Preview: ${previewAttachment.file_name}` : 'Supporting Attachments & Bills'}
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff'
                  }}
                >
                  {periodLabel || 'Active Month'}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8'
                  }}
                >
                  {moduleName}
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                {previewAttachment
                  ? 'Interactive inline viewer for bills, images, presentations, spreadsheets & PDFs'
                  : 'Upload images, PDFs, PPTs, spreadsheets, or cloud links for this monthly cycle'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Period Selector within modal */}
            {periods.length > 0 && onPeriodChange && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="#94a3b8" />
                <select
                  value={periodId}
                  onChange={(e) => onPeriodChange(e.target.value)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    fontSize: '12px',
                    fontWeight: '700',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {periods.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.period_label || p.period_code || `Period ${p.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* NOTIFICATION MESSAGE */}
        {message && (
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: message.type === 'success' ? '#166534' : '#991b1b',
              borderBottom: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12.5px',
              fontWeight: '600'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* IF PREVIEWING ATTACHMENT: INLINE VIEWER */}
        {previewAttachment ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Viewer Control Bar */}
            <div
              style={{
                padding: '10px 18px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Attachments</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handlePrevPreview}
                    disabled={currentPreviewIndex <= 0}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: currentPreviewIndex <= 0 ? '#cbd5e1' : '#334155',
                      cursor: currentPreviewIndex <= 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Previous Attachment"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700' }}>
                    {currentPreviewIndex + 1} of {attachments.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextPreview}
                    disabled={currentPreviewIndex >= attachments.length - 1}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: currentPreviewIndex >= attachments.length - 1 ? '#cbd5e1' : '#334155',
                      cursor: currentPreviewIndex >= attachments.length - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Next Attachment"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Viewer Tools (Zoom / Rotate for Images, Open in New Tab) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {previewAttachment.file_type === 'image' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffffff', padding: '2px 6px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: '#475569' }}
                      title="Zoom Out"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <span style={{ fontSize: '11px', fontWeight: '750', color: '#334155', minWidth: '38px', textAlign: 'center' }}>
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: '#475569' }}
                      title="Zoom In"
                    >
                      <ZoomIn size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: '#475569', marginLeft: '4px' }}
                      title="Rotate"
                    >
                      <RotateCw size={14} />
                    </button>
                  </div>
                )}

                <a
                  href={getAttachmentDownloadUrl(previewAttachment)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={!previewAttachment.is_link}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {previewAttachment.is_link ? <ExternalLink size={13} /> : <Download size={13} />}
                  <span>{previewAttachment.is_link ? 'Open Link' : 'Download Original'}</span>
                </a>
              </div>
            </div>

            {/* Viewer Stage */}
            <div
              style={{
                flex: 1,
                backgroundColor: previewAttachment.file_type === 'image' ? '#0f172a' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                position: 'relative',
                padding: '16px'
              }}
            >
              {/* IMAGE PREVIEW */}
              {previewAttachment.file_type === 'image' && (
                <div style={{ textAlign: 'center', transition: 'transform 0.2s ease', transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}>
                  <img
                    src={getAttachmentViewUrl(previewAttachment)}
                    alt={previewAttachment.file_name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '620px',
                      borderRadius: '8px',
                      boxShadow: '0 10px 35px rgba(0,0,0,0.5)',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              )}

              {/* PDF PREVIEW */}
              {previewAttachment.file_type === 'pdf' && (
                <div style={{ width: '100%', height: '100%', minHeight: '560px' }}>
                  <iframe
                    src={`${getAttachmentViewUrl(previewAttachment)}#toolbar=1&navpanes=0`}
                    title={previewAttachment.file_name}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '560px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                    }}
                  />
                </div>
              )}

              {/* VIDEO MEDIA PREVIEW */}
              {previewAttachment.file_type === 'video' && (
                <div style={{ width: '100%', maxWidth: '860px', textAlign: 'center' }}>
                  <video
                    controls
                    src={getAttachmentViewUrl(previewAttachment)}
                    style={{ width: '100%', maxHeight: '580px', borderRadius: '12px', backgroundColor: '#000', boxShadow: '0 10px 35px rgba(0,0,0,0.4)' }}
                  />
                </div>
              )}

              {/* AUDIO MEDIA PREVIEW */}
              {previewAttachment.file_type === 'audio' && (
                <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{previewAttachment.file_name}</h4>
                  <audio controls src={getAttachmentViewUrl(previewAttachment)} style={{ width: '100%' }} />
                </div>
              )}

              {/* EXCEL / SPREADSHEET PREVIEW CARD */}
              {previewAttachment.file_type === 'excel' && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '36px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    maxWidth: '480px',
                    width: '100%'
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      backgroundColor: '#ecfdf5',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}
                  >
                    <FileSpreadsheet size={36} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
                    {previewAttachment.file_name}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
                    Spreadsheet data file • Size: {formatSize(previewAttachment.file_size)}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <a
                      href={getAttachmentDownloadUrl(previewAttachment)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={!previewAttachment.is_link}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        borderRadius: '9999px',
                        fontWeight: '700',
                        fontSize: '13px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Download size={15} />
                      <span>Download Excel Sheet</span>
                    </a>
                    {previewAttachment.is_link && (
                      <a
                        href={getAttachmentDownloadUrl(previewAttachment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#f1f5f9',
                          color: '#0f172a',
                          borderRadius: '9999px',
                          fontWeight: '700',
                          fontSize: '13px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <ExternalLink size={15} />
                        <span>Open Live Sheet</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* POWERPOINT / PRESENTATION SLIDE-BY-SIDE VIEWER */}
              {previewAttachment.file_type === 'ppt' && (
                <div style={{
                  width: '100%',
                  minHeight: '520px',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
                }}>
                  {/* Presentation Top Toolbar */}
                  <div style={{
                    padding: '10px 16px',
                    backgroundColor: '#1e293b',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    color: '#ffffff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: '#ea580c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}>
                        <Presentation size={16} />
                      </div>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#f8fafc' }}>
                          {previewAttachment.file_name}
                        </strong>
                        {pptSlides.length > 0 && (
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px' }}>
                            ({pptSlides.length} Slides Deck)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Slide Navigation Controls */}
                    {pptSlides.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          disabled={activeSlideIndex <= 0}
                          onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: activeSlideIndex <= 0 ? '#334155' : '#ea580c',
                            color: '#ffffff',
                            border: 'none',
                            cursor: activeSlideIndex <= 0 ? 'not-allowed' : 'pointer',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <ChevronLeft size={13} />
                          <span>Prev Slide</span>
                        </button>

                        <span style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          color: '#f8fafc',
                          backgroundColor: '#0f172a',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          border: '1px solid #334155'
                        }}>
                          Slide {activeSlideIndex + 1} of {pptSlides.length}
                        </span>

                        <button
                          type="button"
                          disabled={activeSlideIndex >= pptSlides.length - 1}
                          onClick={() => setActiveSlideIndex(prev => Math.min(pptSlides.length - 1, prev + 1))}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: activeSlideIndex >= pptSlides.length - 1 ? '#334155' : '#ea580c',
                            color: '#ffffff',
                            border: 'none',
                            cursor: activeSlideIndex >= pptSlides.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>Next Slide</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    )}

                    {/* Download Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <a
                        href={getAttachmentDownloadUrl(previewAttachment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={!previewAttachment.is_link}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          backgroundColor: '#334155',
                          color: '#f8fafc',
                          border: '1px solid #475569',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Download size={13} />
                        <span>Download PPT</span>
                      </a>
                    </div>
                  </div>

                  {/* Presentation Body: Left Slide Sidebar + Main 16:9 Stage */}
                  {loadingPptSlides ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', padding: '60px' }}>
                      <RefreshCw size={28} className="animate-spin" style={{ marginRight: '10px' }} />
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>Extracting presentation slides...</span>
                    </div>
                  ) : pptSlides.length > 0 ? (
                    <div style={{ flex: 1, display: 'flex', minHeight: '460px', overflow: 'hidden' }}>
                      {/* Left Side: Slide Thumbnails Panel */}
                      <div style={{
                        width: '230px',
                        minWidth: '230px',
                        backgroundColor: '#0f172a',
                        borderRight: '1px solid #334155',
                        overflowY: 'auto',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        maxHeight: '520px'
                      }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                          SLIDES DECK ({pptSlides.length})
                        </div>
                        {pptSlides.map((slide, sIdx) => {
                          const isCurrent = activeSlideIndex === sIdx;
                          return (
                            <div
                              key={sIdx}
                              onClick={() => setActiveSlideIndex(sIdx)}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '8px',
                                backgroundColor: isCurrent ? '#1e293b' : '#090d16',
                                border: isCurrent ? '2px solid #ea580c' : '1px solid #1e293b',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: isCurrent ? '0 0 10px rgba(234, 88, 12, 0.3)' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{
                                  fontSize: '9.5px',
                                  fontWeight: '800',
                                  backgroundColor: isCurrent ? '#ea580c' : '#334155',
                                  color: '#ffffff',
                                  padding: '1px 6px',
                                  borderRadius: '4px'
                                }}>
                                  Slide {sIdx + 1}
                                </span>
                                {slide.has_image && (
                                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>🖼️ Image</span>
                                )}
                              </div>
                              <div style={{
                                fontSize: '11px',
                                fontWeight: isCurrent ? '700' : '500',
                                color: isCurrent ? '#f8fafc' : '#94a3b8',
                                lineHeight: '1.3',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                {slide.title || `Slide ${sIdx + 1}`}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Side: Main Slide Stage (16:9 Presentation Canvas) */}
                      {(() => {
                        const currentSlide = pptSlides[activeSlideIndex] || pptSlides[0];
                        return (
                          <div style={{
                            flex: 1,
                            backgroundColor: '#1e293b',
                            padding: '24px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {/* 16:9 Slide Canvas */}
                            <div style={{
                              width: '100%',
                              maxWidth: '850px',
                              minHeight: '380px',
                              backgroundColor: '#ffffff',
                              borderRadius: '12px',
                              boxShadow: '0 12px 35px rgba(0,0,0,0.3)',
                              padding: '32px 38px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              position: 'relative',
                              overflow: 'hidden'
                            }}>
                              {/* Slide Decorative Top Accent */}
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '5px',
                                background: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #fbbf24 100%)'
                              }} />

                              <div>
                                {/* Slide Title */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                                  <h2 style={{
                                    margin: 0,
                                    fontSize: '20px',
                                    fontWeight: '800',
                                    color: '#0f172a',
                                    lineHeight: '1.25'
                                  }}>
                                    {currentSlide.title || `Slide ${activeSlideIndex + 1}`}
                                  </h2>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: '#fff7ed',
                                    color: '#ea580c',
                                    border: '1px solid #fed7aa'
                                  }}>
                                    {activeSlideIndex + 1} / {pptSlides.length}
                                  </span>
                                </div>

                                {/* Bullet Points & Text Blocks */}
                                {currentSlide.text_blocks && currentSlide.text_blocks.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {currentSlide.text_blocks.map((block, bIdx) => (
                                      <div
                                        key={bIdx}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          gap: '10px',
                                          marginLeft: `${block.level * 20}px`,
                                          fontSize: '14px',
                                          lineHeight: '1.45',
                                          color: '#334155'
                                        }}
                                      >
                                        <span style={{
                                          color: '#ea580c',
                                          fontWeight: '900',
                                          lineHeight: '1.2',
                                          fontSize: '16px'
                                        }}>•</span>
                                        <span>{block.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Tables on Slide */}
                                {currentSlide.tables && currentSlide.tables.length > 0 && (
                                  <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                                    {currentSlide.tables.map((tbl, tIdx) => (
                                      <table key={tIdx} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                        <tbody>
                                          {tbl.map((row, rIdx) => (
                                            <tr key={rIdx} style={{ backgroundColor: rIdx === 0 ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                                              {row.map((cell, cIdx) => (
                                                <td key={cIdx} style={{ padding: '6px 10px', fontWeight: rIdx === 0 ? '800' : '500', color: '#1e293b' }}>
                                                  {cell}
                                                </td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Slide Footer */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderTop: '1px solid #f1f5f9',
                                paddingTop: '10px',
                                marginTop: '14px',
                                fontSize: '11px',
                                color: '#94a3b8'
                              }}>
                                <span>Rathinam Group of Institutions • Monthly Operational Review</span>
                                <span>Slide {activeSlideIndex + 1} of {pptSlides.length}</span>
                              </div>
                            </div>

                            {/* Speaker Notes Drawer */}
                            {currentSlide.notes && (
                              <div style={{
                                width: '100%',
                                maxWidth: '850px',
                                marginTop: '10px',
                                backgroundColor: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '12px',
                                color: '#cbd5e1'
                              }}>
                                <strong style={{ color: '#ea580c', marginRight: '6px' }}>Speaker Notes:</strong>
                                {currentSlide.notes}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* Fallback for binary .ppt or when slides cannot be parsed */
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                      <div style={{
                        backgroundColor: '#ffffff',
                        padding: '36px',
                        borderRadius: '16px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                        textAlign: 'center',
                        maxWidth: '520px',
                        width: '100%'
                      }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '16px',
                          backgroundColor: '#fff7ed',
                          color: '#ea580c',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px'
                        }}>
                          <Presentation size={36} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
                          {previewAttachment.file_name}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
                          PowerPoint Presentation • Size: {formatSize(previewAttachment.file_size)}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <a
                            href={getAttachmentDownloadUrl(previewAttachment)}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={!previewAttachment.is_link}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: '#ea580c',
                              color: '#ffffff',
                              borderRadius: '9999px',
                              fontWeight: '700',
                              fontSize: '13px',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Download size={15} />
                            <span>Download PPT Presentation</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* WEB LINK / OTHER FILE CARD */}
              {(previewAttachment.file_type === 'link' || previewAttachment.file_type === 'cloud_drive' || previewAttachment.file_type === 'doc' || previewAttachment.file_type === 'other') && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '36px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    maxWidth: '480px',
                    width: '100%'
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      backgroundColor: '#f5f3ff',
                      color: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}
                  >
                    {previewAttachment.is_link ? <Link2 size={36} /> : <FileText size={36} />}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
                    {previewAttachment.file_name}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', wordBreak: 'break-all' }}>
                    {previewAttachment.file_path}
                  </p>
                  <a
                    href={getAttachmentDownloadUrl(previewAttachment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      borderRadius: '9999px',
                      fontWeight: '700',
                      fontSize: '13px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <ExternalLink size={15} />
                    <span>Open in New Browser Tab</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* STANDARD ATTACHMENTS LIST & UPLOADER */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* TABS NAVIGATION */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', gap: '24px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  style={{
                    padding: '14px 4px',
                    fontSize: '13px',
                    fontWeight: '800',
                    color: activeTab === 'list' ? '#3b82f6' : '#64748b',
                    border: 'none',
                    borderBottom: activeTab === 'list' ? '2.5px solid #3b82f6' : '2.5px solid transparent',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Paperclip size={15} />
                  <span>Attachments ({attachments.length})</span>
                </button>

                {!readOnly && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      style={{
                        padding: '14px 4px',
                        fontSize: '13px',
                        fontWeight: '800',
                        color: activeTab === 'upload' ? '#3b82f6' : '#64748b',
                        border: 'none',
                        borderBottom: activeTab === 'upload' ? '2.5px solid #3b82f6' : '2.5px solid transparent',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <UploadCloud size={15} />
                      <span>Upload Files</span>
                      {selectedFiles.length > 0 && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: '900',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            padding: '1px 6px',
                            borderRadius: '9999px'
                          }}
                        >
                          {selectedFiles.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('link')}
                      style={{
                        padding: '14px 4px',
                        fontSize: '13px',
                        fontWeight: '800',
                        color: activeTab === 'link' ? '#3b82f6' : '#64748b',
                        border: 'none',
                        borderBottom: activeTab === 'link' ? '2.5px solid #3b82f6' : '2.5px solid transparent',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Link2 size={15} />
                      <span>Attach Web Link</span>
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={fetchAttachments}
                disabled={loading}
                title="Refresh attachments list"
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {/* TAB CONTENT STAGE */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f8fafc' }}>
              {/* TAB 1: LIST ATTACHMENTS */}
              {activeTab === 'list' && (
                <div>
                  {loading && attachments.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                      <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                      <p style={{ fontSize: '14px', fontWeight: '600' }}>Loading attachments...</p>
                    </div>
                  ) : attachments.length === 0 ? (
                    <div
                      style={{
                        padding: '60px 20px',
                        textAlign: 'center',
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        border: '2px dashed #cbd5e1'
                      }}
                    >
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '14px',
                          backgroundColor: '#f1f5f9',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 14px'
                        }}
                      >
                        <Paperclip size={28} />
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0' }}>
                        No Attachments Found
                      </h3>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                        No bills, invoices, images, spreadsheets, or links have been attached for {periodLabel || 'this month'} yet.
                      </p>
                      {!readOnly && (
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setActiveTab('upload')}
                            style={{
                              padding: '8px 18px',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              borderRadius: '8px',
                              fontWeight: '700',
                              fontSize: '12.5px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <UploadCloud size={15} />
                            <span>Upload Files</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('link')}
                            style={{
                              padding: '8px 18px',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              borderRadius: '8px',
                              fontWeight: '700',
                              fontSize: '12.5px',
                              border: '1px solid #cbd5e1',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Link2 size={15} />
                            <span>Attach Web Link</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          ATTACHED DOCUMENTS ({attachments.length})
                        </span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('upload')}
                            style={{
                              padding: '5px 12px',
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '750',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <UploadCloud size={13} />
                            <span>Add More Files</span>
                          </button>
                        )}
                      </div>

                      {/* Attachment Cards Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '14px' }}>
                        {attachments.map((att) => {
                          const badge = getTypeBadge(att.file_type, att.is_link);
                          const isImg = att.file_type === 'image';

                          return (
                            <div
                              key={att.id}
                              style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '12px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '11px',
                                      fontWeight: '800',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      backgroundColor: badge.bg,
                                      color: badge.text,
                                      border: `1px solid ${badge.border}`
                                    }}
                                  >
                                    {badge.icon}
                                    <span>{badge.label}</span>
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                                    {formatSize(att.file_size)}
                                  </span>
                                </div>

                                {/* Thumbnail or Icon preview */}
                                {isImg && (
                                  <div
                                    onClick={() => setPreviewAttachment(att)}
                                    style={{
                                      width: '100%',
                                      height: '110px',
                                      borderRadius: '8px',
                                      overflow: 'hidden',
                                      backgroundColor: '#f1f5f9',
                                      marginBottom: '10px',
                                      cursor: 'pointer',
                                      position: 'relative'
                                    }}
                                  >
                                    <img
                                      src={getAttachmentViewUrl(att)}
                                      alt={att.file_name}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                      }}
                                    />
                                    <div
                                      style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        opacity: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#ffffff',
                                        transition: 'opacity 0.15s ease'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                      onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                                    >
                                      <Eye size={20} />
                                    </div>
                                  </div>
                                )}

                                <h4
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: '750',
                                    color: '#0f172a',
                                    margin: '0 0 4px 0',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={att.file_name}
                                >
                                  {att.file_name}
                                </h4>

                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Uploaded by {att.uploaded_by || 'User'} • {new Date(att.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </div>
                              </div>

                              {/* Card Action Buttons */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  borderTop: '1px solid #f1f5f9',
                                  paddingTop: '10px'
                                }}
                              >
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPreviewAttachment(att);
                                      setZoomLevel(1);
                                      setRotation(0);
                                    }}
                                    style={{
                                      padding: '5px 9px',
                                      borderRadius: '6px',
                                      backgroundColor: '#eff6ff',
                                      color: '#1d4ed8',
                                      border: '1px solid #dbeafe',
                                      fontSize: '11.5px',
                                      fontWeight: '750',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title="Preview in app"
                                  >
                                    <Eye size={13} />
                                    <span>Preview</span>
                                  </button>

                                  <a
                                    href={getAttachmentDownloadUrl(att)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={!att.is_link}
                                    style={{
                                      padding: '5px 9px',
                                      borderRadius: '6px',
                                      backgroundColor: '#f8fafc',
                                      color: '#334155',
                                      border: '1px solid #e2e8f0',
                                      fontSize: '11.5px',
                                      fontWeight: '700',
                                      textDecoration: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title={att.is_link ? 'Open external link' : 'Download file'}
                                  >
                                    {att.is_link ? <ExternalLink size={13} /> : <Download size={13} />}
                                    <span>{att.is_link ? 'Open' : 'Save'}</span>
                                  </a>
                                </div>

                                {!readOnly && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(att.id, att.file_name)}
                                    style={{
                                      padding: '5px',
                                      borderRadius: '6px',
                                      backgroundColor: 'transparent',
                                      color: '#94a3b8',
                                      border: 'none',
                                      cursor: 'pointer',
                                      transition: 'color 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                    title="Delete attachment"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: UPLOAD MULTIPLE FILES */}
              {activeTab === 'upload' && !readOnly && (
                <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                  {/* Drag and Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: dragActive ? '2.5px dashed #2563eb' : '2px dashed #cbd5e1',
                      borderRadius: '16px',
                      backgroundColor: dragActive ? '#eff6ff' : '#ffffff',
                      padding: '40px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg,.webp,.gif,.svg,.pdf,.ppt,.pptx,.xls,.xlsx,.csv,.doc,.docx"
                      onChange={handleFileInputChange}
                      style={{ display: 'none' }}
                    />
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '16px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                      }}
                    >
                      <UploadCloud size={32} />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
                      Drag & Drop files here, or <span style={{ color: '#2563eb', textDecoration: 'underline' }}>Browse</span>
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px 0' }}>
                      Multiple files supported: <strong>Images (JPG/PNG), PDFs, Spreadsheets (XLS/CSV), Presentations (PPT)</strong>
                    </p>
                    <span style={{ fontSize: '11px', color: '#94a3b8', backgroundColor: '#f1f5f9', padding: '3px 10px', borderRadius: '9999px' }}>
                      Maximum file size: 50MB per file
                    </span>
                  </div>

                  {/* Optional Topic / Title for Uploaded Files */}
                  <div style={{ marginTop: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                      Topic / Description (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Monthly Audit Report, Fuel Bills, Hostel Inspection..."
                      value={uploadTopic}
                      onChange={(e) => setUploadTopic(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Selected Files Queue */}
                  {selectedFiles.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                          Files Ready to Upload ({selectedFiles.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles([])}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Clear All
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                        {selectedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                              <Paperclip size={15} color="#64748b" />
                              <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.name}
                              </span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                ({formatSize(file.size)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(idx)}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles([])}
                          disabled={uploading}
                          style={{
                            padding: '9px 18px',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#475569',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleUploadSubmit}
                          disabled={uploading}
                          style={{
                            padding: '9px 24px',
                            borderRadius: '8px',
                            backgroundColor: '#2563eb',
                            border: 'none',
                            color: '#ffffff',
                            fontWeight: '800',
                            fontSize: '13px',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {uploading ? (
                            <>
                              <RefreshCw size={15} className="animate-spin" />
                              <span>Uploading ({selectedFiles.length})...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud size={15} />
                              <span>Upload All {selectedFiles.length} File(s) Now</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ATTACH EXTERNAL WEB LINK */}
              {activeTab === 'link' && !readOnly && (
                <div style={{ maxWidth: '580px', margin: '0 auto', backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: '#f5f3ff',
                        color: '#7c3aed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Link2 size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        Attach External Document Link
                      </h3>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                        Attach Google Drive folders, OneDrive sheets, or online cloud documents
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAddLink} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Document URL / Web Link *
                      </label>
                      <input
                        type="url"
                        required
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Title / Description (Optional)
                      </label>
                      <input
                        type="text"
                        value={linkTitle}
                        onChange={(e) => setLinkTitle(e.target.value)}
                        placeholder="e.g. October Vendor Invoices Folder"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveTab('list')}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '8px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#475569',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAddingLink || !linkUrl.trim()}
                        style={{
                          padding: '9px 22px',
                          borderRadius: '8px',
                          backgroundColor: '#7c3aed',
                          border: 'none',
                          color: '#ffffff',
                          fontWeight: '800',
                          fontSize: '13px',
                          cursor: isAddingLink ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {isAddingLink ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Attaching...</span>
                          </>
                        ) : (
                          <>
                            <Link2 size={14} />
                            <span>Attach Document Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
