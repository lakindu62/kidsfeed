/**
 * Base origin for API calls.
 * - If VITE_API_URL is set → use it (e.g. deployed backend or http://localhost:3000).
 * - If unset/empty in the browser → use the page origin so Vite can proxy /api in dev.
 */
export function resolveApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.trim().replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}
