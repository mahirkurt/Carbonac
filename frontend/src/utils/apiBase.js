const API_BASE_URL = import.meta.env.VITE_API_URL || '';
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
