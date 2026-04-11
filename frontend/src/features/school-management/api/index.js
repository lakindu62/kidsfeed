import { fetchApi } from '../../../lib/api-client';
import { resolveApiBaseUrl } from '../../../lib/resolve-api-base';

export async function fetchSchools({ getToken } = {}) {
  const apiUrl = resolveApiBaseUrl();
  const url = new URL('/api/schools', apiUrl);
  const response = await fetchApi({ url: url.toString(), getToken });
  if (!response.ok) {
    throw new Error(`Failed to fetch schools: ${response.status}`);
  }
  const payload = await response.json();
  return payload.data;
}
