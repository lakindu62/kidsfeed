import { fetchApi } from '../../../lib/api-client';

export function buildMealDistributionUrl({
  baseUrl,
  path,
  schoolId,
  searchParams = {},
}) {
  const url = new URL(path, baseUrl);
  url.searchParams.set('schoolId', schoolId);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export async function fetchMealSessions({
  apiUrl,
  schoolId,
  getToken,
  searchParams = {},
}) {
  const url = buildMealDistributionUrl({
    baseUrl: apiUrl,
    path: '/api/meal-sessions',
    schoolId,
    searchParams,
  });

  const response = await fetchApi({
    url,
    getToken,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch meal sessions (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

export async function fetchMealAttendance({
  apiUrl,
  mealSessionId,
  getToken,
  searchParams = {},
}) {
  const url = new URL('/api/meal-attendance', apiUrl);
  url.searchParams.set('mealSessionId', mealSessionId);

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
    throw new Error(`Failed to fetch meal attendance (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

export async function createMealSession({ apiUrl, getToken, payload }) {
  const response = await fetchApi({
    url: new URL('/api/meal-sessions', apiUrl).toString(),
    getToken,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  });

  if (!response.ok) {
    let message = `Failed to create meal session (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json();
}

export async function fetchAttendanceBySession({
  apiUrl,
  mealSessionId,
  getToken,
}) {
  const url = new URL('/api/meal-attendance', apiUrl);
  url.searchParams.set('mealSessionId', mealSessionId);

  const response = await fetchApi({
    url: url.toString(),
    getToken,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch attendance (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

export async function markAttendanceByStudentId({
  apiUrl,
  getToken,
  studentId,
  mealSessionId,
}) {
  const response = await fetchApi({
    url: new URL('/api/meal-attendance', apiUrl).toString(),
    getToken,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        mealSessionId,
        status: 'PRESENT',
        servedAt: new Date().toISOString(),
      }),
    },
  });

  if (!response.ok) {
    let message = `Failed to mark attendance (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json();
}

export async function markAttendanceByQr({
  apiUrl,
  getToken,
  studentId,
  mealSessionId,
}) {
  const response = await fetchApi({
    url: new URL('/api/meal-scan', apiUrl).toString(),
    getToken,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealSessionId,
        qrToken: JSON.stringify({ studentId }),
      }),
    },
  });

  if (!response.ok) {
    let message = `Failed to mark attendance by QR (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json();
}

export async function completeMealSession({ apiUrl, getToken, mealSessionId }) {
  const response = await fetchApi({
    url: new URL(`/api/meal-sessions/${mealSessionId}`, apiUrl).toString(),
    getToken,
    options: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    },
  });

  if (!response.ok) {
    let message = `Failed to complete session (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json();
}
