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

export async function fetchSchoolStats({ apiUrl, schoolId, getToken }) {
  const response = await fetchApi({
    url: new URL(`/api/schools/${schoolId}/stats`, apiUrl).toString(),
    getToken,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch school stats (${response.status})`);
  }

  const payload = await response.json();
  return payload?.data ?? null;
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

export async function deleteMealSession({ apiUrl, getToken, mealSessionId }) {
  const response = await fetchApi({
    url: new URL(`/api/meal-sessions/${mealSessionId}`, apiUrl).toString(),
    getToken,
    options: {
      method: 'DELETE',
    },
  });

  if (!response.ok) {
    let message = `Failed to delete meal session (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
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

export async function fetchSessionRoster({ apiUrl, mealSessionId, getToken }) {
  const url = new URL('/api/meal-attendance/roster', apiUrl);
  url.searchParams.set('mealSessionId', mealSessionId);

  const response = await fetchApi({
    url: url.toString(),
    getToken,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch session roster (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

export async function markAttendanceByStudentId({
  apiUrl,
  getToken,
  studentId,
  mealSessionId,
  status = 'PRESENT',
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
        status,
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

export async function fetchNoShowAlerts({
  apiUrl,
  schoolId,
  getToken,
  dateFrom,
  dateTo,
}) {
  const url = new URL('/api/meal-distribution/no-show-alerts', apiUrl);
  url.searchParams.set('schoolId', schoolId);
  if (dateFrom) url.searchParams.set('dateFrom', dateFrom);
  if (dateTo) url.searchParams.set('dateTo', dateTo);

  const response = await fetchApi({
    url: url.toString(),
    getToken,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch no-show alerts (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

export async function fetchGuardianNotificationsForSession({
  apiUrl,
  mealSessionId,
  getToken,
}) {
  const url = new URL(
    `/api/meal-sessions/${mealSessionId}/guardian-notifications`,
    apiUrl,
  );
  const response = await fetchApi({
    url: url.toString(),
    getToken,
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch guardian notifications (${response.status})`,
    );
  }
  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

export async function fetchStudentMealHistory({
  apiUrl,
  schoolId,
  studentId,
  getToken,
  dateFrom,
  dateTo,
  mealType,
  attendanceStatus,
}) {
  const url = new URL('/api/meal-distribution/student-history', apiUrl);
  url.searchParams.set('schoolId', schoolId);
  url.searchParams.set('studentId', studentId);
  if (dateFrom) url.searchParams.set('dateFrom', dateFrom);
  if (dateTo) url.searchParams.set('dateTo', dateTo);
  if (mealType) url.searchParams.set('mealType', mealType);
  if (attendanceStatus) {
    url.searchParams.set('attendanceStatus', attendanceStatus);
  }

  const response = await fetchApi({
    url: url.toString(),
    getToken,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch student meal history (${response.status})`,
    );
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

function filenameFromContentDisposition(header) {
  if (!header) return null;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim());
    } catch {
      return star[1].trim();
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted) return quoted[1];
  const plain = /filename=([^;\s]+)/i.exec(header);
  if (plain) return plain[1].replace(/^["']|["']$/g, '');
  return null;
}

/**
 * @param {'sessionSummary' | 'noShows' | 'sessionRoster'} report
 */
export async function downloadMealDistributionReportPdf({
  apiUrl,
  schoolId,
  getToken,
  report,
  dateFrom,
  dateTo,
  mealSessionId,
}) {
  const pathByReport = {
    sessionSummary: '/api/meal-distribution/reports/session-summary.pdf',
    noShows: '/api/meal-distribution/reports/no-shows.pdf',
    sessionRoster: '/api/meal-distribution/reports/session-roster.pdf',
  };
  const path = pathByReport[report];
  if (!path) {
    throw new Error('Unknown report type');
  }

  const url = new URL(path, apiUrl);
  url.searchParams.set('schoolId', schoolId);
  if (dateFrom) url.searchParams.set('dateFrom', dateFrom);
  if (dateTo) url.searchParams.set('dateTo', dateTo);
  if (mealSessionId) url.searchParams.set('mealSessionId', mealSessionId);

  const response = await fetchApi({
    url: url.toString(),
    getToken,
  });

  if (!response.ok) {
    let message = `Download failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const headerName = filenameFromContentDisposition(
    response.headers.get('Content-Disposition'),
  );
  const filename = headerName || 'report.pdf';
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
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
