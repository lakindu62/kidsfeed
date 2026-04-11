import { fetchApi } from '@/lib/api-client';

async function fetchMealPlanningApi({ apiUrl, path, getToken, options = {} }) {
  if (!apiUrl) {
    throw new Error('API base URL is not configured.');
  }

  const endpoint = new URL(path, apiUrl);
  const response = await fetchApi({
    url: endpoint.toString(),
    getToken,
    options,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error ||
        payload?.message ||
        `Request failed with status ${response.status}`,
    );
  }

  return payload;
}

export async function fetchDistrictOverview({ apiUrl, getToken }) {
  const payload = await fetchMealPlanningApi({
    apiUrl,
    path: '/api/schools',
    getToken,
  });

  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function fetchSchoolMealPlans({ apiUrl, schoolId, getToken }) {
  if (!schoolId) {
    return [];
  }

  const payload = await fetchMealPlanningApi({
    apiUrl,
    path: `/api/meal-plans/school/${schoolId}`,
    getToken,
  });

  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function fetchMealPlanById({ apiUrl, planId, getToken }) {
  if (!planId) {
    throw new Error('Meal plan id is required.');
  }

  const payload = await fetchMealPlanningApi({
    apiUrl,
    path: `/api/meal-plans/${planId}`,
    getToken,
  });

  return payload?.data || null;
}

export async function fetchSchoolEnrollment({ apiUrl, schoolId, getToken }) {
  if (!schoolId) {
    return 0;
  }

  const payload = await fetchMealPlanningApi({
    apiUrl,
    path: `/api/schools/${schoolId}/stats`,
    getToken,
  });

  return Number(payload?.data?.totalEnrollment?.count) || 0;
}

export async function fetchInventoryItems({ apiUrl, getToken }) {
  const payload = await fetchMealPlanningApi({
    apiUrl,
    path: '/api/inventory',
    getToken,
  });

  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function createMealPlan({ apiUrl, getToken, payload }) {
  const responsePayload = await fetchMealPlanningApi({
    apiUrl,
    path: '/api/meal-plans',
    getToken,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  });

  return responsePayload?.data || null;
}

export async function updateMealPlan({ apiUrl, planId, getToken, payload }) {
  if (!planId) {
    throw new Error('Meal plan id is required.');
  }

  const responsePayload = await fetchMealPlanningApi({
    apiUrl,
    path: `/api/meal-plans/${planId}`,
    getToken,
    options: {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  });

  return responsePayload?.data || null;
}

export async function decrementInventoryQuantity({
  apiUrl,
  itemId,
  amount,
  getToken,
}) {
  if (!itemId) {
    throw new Error('Inventory item id is required.');
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Decrement amount must be greater than 0.');
  }

  const payload = await fetchMealPlanningApi({
    apiUrl,
    path: `/api/inventory/${itemId}/decrement`,
    getToken,
    options: {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    },
  });

  return payload?.data || null;
}
