// Base path configured in Vite (e.g. '/Report/')
const rawBase = import.meta.env.BASE_URL || '/Report/';
export const APP_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase; // '/Report'

// Global fetch interceptor: ensures any fetch to '/api/...' is automatically
// scoped to '/Report/api/...' so it works cleanly under sub-path deployments (e.g. rguedu.in/Report)
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string') {
      if (input.startsWith('/api/')) {
        input = `${APP_BASE}${input}`;
      } else if (input.startsWith('api/')) {
        input = `${APP_BASE}/${input}`;
      }
    } else if (input instanceof Request) {
      try {
        const urlObj = new URL(input.url);
        if (urlObj.pathname.startsWith('/api/')) {
          const newUrl = `${urlObj.origin}${APP_BASE}${urlObj.pathname}${urlObj.search}`;
          input = new Request(newUrl, input);
        }
      } catch {
        // preserve input as-is
      }
    }
    return originalFetch.call(this, input, init);
  };
}

export function getAssetUrl(relativePath) {
  const clean = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${rawBase}${clean}`;
}

export function getAttachmentDownloadUrl(att) {
  if (!att) return '#';
  if (att.is_link) return att.file_path;
  if (att.id) return `${APP_BASE}/api/attachments/${att.id}/download`;
  return att.file_path || '#';
}

export function getAttachmentViewUrl(att) {
  if (!att) return '#';
  if (att.is_link) return att.file_path;
  if (att.id) return `${APP_BASE}/api/attachments/${att.id}/view`;
  return att.file_path || '#';
}

