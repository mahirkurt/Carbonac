function resolveApiBaseUrl() {
  const envBaseUrl = String(import.meta.env.VITE_API_URL || '').trim();

  // Production guard:
  // If build-time env is accidentally left as localhost, force the known
  // production API host when the app runs on carbonac domains.
  if (typeof window !== 'undefined') {
    const host = String(window.location?.hostname || '').toLowerCase();
    const isCarbonacHost =
      host === 'carbonac.com' ||
      host === 'www.carbonac.com' ||
      host === 'main--carbonac.netlify.app' ||
      host.endsWith('--carbonac.netlify.app');

    if (isCarbonacHost) {
      return 'https://api.carbonac.com';
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
