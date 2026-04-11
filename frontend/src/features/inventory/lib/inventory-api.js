import { fetchApi } from '@/lib/api-client';

export function buildInventoryApiUrl(apiUrl, path) {
  return new URL(path, apiUrl).toString();
}

export async function readInventoryApiErrorMessage(response, fallbackMessage) {
  try {
    const payload = await response.json();
    return payload?.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function requestInventoryApi({
  apiUrl,
  getToken,
  path,
  method = 'GET',
  payload,
  fallbackMessage,
}) {
  const response = await fetchApi({
    url: buildInventoryApiUrl(apiUrl, path),
    getToken,
    options:
      payload === undefined
        ? { method }
        : {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
  });

  if (!response.ok) {
    throw new Error(
      await readInventoryApiErrorMessage(
        response,
        fallbackMessage || 'Inventory request failed.',
      ),
    );
  }

  return response;
}
