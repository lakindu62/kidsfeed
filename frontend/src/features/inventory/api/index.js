import { readInventoryApiErrorMessage, requestInventoryApi } from '../lib';
import { fetchApi } from '@/lib/api-client';

export async function fetchInventoryItems({
  apiUrl,
  getToken,
  searchParams = {},
}) {
  const url = new URL('/api/inventory', apiUrl);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetchApi({
    url: url.toString(),
    getToken,
  });

  if (!response.ok) {
    throw new Error(
      await readInventoryApiErrorMessage(
        response,
        'Failed to fetch inventory items.',
      ),
    );
  }

  const payload = await response.json();
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function fetchInventoryItemById({ apiUrl, itemId, getToken }) {
  if (!itemId) {
    throw new Error('Inventory item ID is required.');
  }

  const response = await requestInventoryApi({
    apiUrl,
    getToken,
    path: `/api/inventory/${encodeURIComponent(itemId)}`,
    fallbackMessage: 'Failed to fetch inventory item details.',
  });

  const payload = await response.json();
  return payload?.data ?? null;
}

export async function lookupInventoryItemByBarcode({
  apiUrl,
  barcode,
  getToken,
}) {
  if (!barcode) {
    throw new Error('Barcode is required.');
  }

  const response = await requestInventoryApi({
    apiUrl,
    getToken,
    path: `/api/inventory/lookup/${encodeURIComponent(barcode)}`,
    fallbackMessage: 'Failed to perform barcode lookup.',
  });

  const payload = await response.json();
  return payload?.data ?? null;
}

export async function lookupExistingInventoryItem({
  apiUrl,
  name,
  barcode,
  getToken,
}) {
  const query = new URLSearchParams();

  if (name) {
    query.set('name', name);
  }

  if (barcode) {
    query.set('barcode', barcode);
  }

  const response = await requestInventoryApi({
    apiUrl,
    getToken,
    path: `/api/inventory/existing-lookup?${query.toString()}`,
    fallbackMessage: 'Failed to check for duplicate inventory items.',
  });

  const payload = await response.json();
  return payload?.data ?? null;
}

export async function createInventoryItem({ apiUrl, getToken, payload }) {
  const response = await requestInventoryApi({
    apiUrl,
    getToken,
    path: '/api/inventory',
    method: 'POST',
    payload,
    fallbackMessage: 'Failed to create inventory item.',
  });

  const responsePayload = await response.json();
  return responsePayload?.data ?? null;
}

export async function addInventoryBatch({ apiUrl, itemId, getToken, payload }) {
  if (!itemId) {
    throw new Error('Inventory item ID is required.');
  }

  const response = await requestInventoryApi({
    apiUrl,
    getToken,
    path: `/api/inventory/${encodeURIComponent(itemId)}/batches`,
    method: 'POST',
    payload,
    fallbackMessage: 'Failed to add inventory batch.',
  });

  const responsePayload = await response.json();
  return responsePayload?.data ?? null;
}

export async function deleteInventoryBatch({
  apiUrl,
  itemId,
  batchId,
  getToken,
}) {
  if (!itemId) {
    throw new Error('Inventory item ID is required.');
  }

  if (!batchId) {
    throw new Error('Inventory batch ID is required.');
  }

  const response = await requestInventoryApi({
    apiUrl,
    getToken,
    path: `/api/inventory/${encodeURIComponent(itemId)}/batches/${encodeURIComponent(batchId)}`,
    method: 'DELETE',
    fallbackMessage: 'Failed to delete inventory batch.',
  });

  const responsePayload = await response.json();
  return responsePayload?.data ?? null;
}

export async function deleteInventoryItem({ apiUrl, itemId, getToken }) {
  if (!itemId) {
    throw new Error('Inventory item ID is required.');
  }

  const response = await requestInventoryApi({
    apiUrl,
    getToken,
    path: `/api/inventory/${encodeURIComponent(itemId)}`,
    method: 'DELETE',
    fallbackMessage: 'Failed to delete inventory item.',
  });

  const responsePayload = await response.json();
  return responsePayload?.data ?? null;
}
