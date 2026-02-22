function resolveApiBaseUrl() {
  const envBaseUrl = String(import.meta.env.VITE_API_URL || '').trim();

  // Production routing guard:
  // On Carbonac/Netlify production hosts, prefer same-origin `/api/*` calls
  // so Netlify redirects can proxy requests server-side. This avoids browser
  // CORS preflight failures when upstream API responses are missing CORS headers.
  if (typeof window !== 'undefined') {
    const host = String(window.location?.hostname || '').toLowerCase();
    const isCarbonacHost =
      host === 'carbonac.com' ||
      host === 'www.carbonac.com' ||
      host === 'main--carbonac.netlify.app' ||
      host.endsWith('--carbonac.netlify.app');

    if (isCarbonacHost) {
      return '';
    }
  }

  return envBaseUrl;
}

const API_BASE_URL = resolveApiBaseUrl();
const API_URL = API_BASE_URL.replace(/\/$/, '');

export function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (!API_URL) {
    return path;
  }
  const safePath = path.startsWith('/') ? path : `/${path}`;
  if (API_URL.endsWith('/api') && safePath.startsWith('/api/')) {
    return `${API_URL}${safePath.slice(4)}`;
  }
  return `${API_URL}${safePath}`;
}

export function getApiBase() {
  return API_URL;
}
