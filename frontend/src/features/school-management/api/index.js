import { fetchApi } from '../../../lib/api-client';
import { resolveApiBaseUrl } from '../../../lib/resolve-api-base';

// ─── Schools ────────────────────────────────────────────────────────────────

export async function fetchSchools({ getToken } = {}) {
  const url = new URL('/api/schools', resolveApiBaseUrl());
  const response = await fetchApi({ url: url.toString(), getToken });
  if (!response.ok) throw new Error(`Failed to fetch schools: ${response.status}`);
  return (await response.json()).data;
}

export async function createSchool({ getToken, body } = {}) {
  const url = new URL('/api/schools', resolveApiBaseUrl());
  const response = await fetchApi({
    url: url.toString(),
    getToken,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  });
  const payload = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(payload.message ?? 'Failed to create school'), { errors: payload.errors ?? [] });
  return payload.data;
}

export async function updateSchool({ getToken, id, body } = {}) {
  const url = new URL(`/api/schools/${id}`, resolveApiBaseUrl());
  const response = await fetchApi({
    url: url.toString(),
    getToken,
    options: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  });
  const payload = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(payload.message ?? 'Failed to update school'), { errors: payload.errors ?? [] });
  return payload.data;
}

export async function deleteSchool({ getToken, id } = {}) {
  const url = new URL(`/api/schools/${id}`, resolveApiBaseUrl());
  const response = await fetchApi({
    url: url.toString(),
    getToken,
    options: { method: 'DELETE' },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? 'Failed to delete school');
  }
}

// ─── Students ───────────────────────────────────────────────────────────────

export async function fetchStudents({ getToken, schoolId, q } = {}) {
  const url = new URL(`/api/schools/${schoolId}/students`, resolveApiBaseUrl());
  if (q) url.searchParams.set('q', q);
  const response = await fetchApi({ url: url.toString(), getToken });
  if (!response.ok) throw new Error(`Failed to fetch students: ${response.status}`);
  const payload = await response.json();
  // Backend returns { data: { data: [...], total: N } }
  return payload.data?.data ?? payload.data ?? [];
}

export async function fetchStudent({ getToken, id } = {}) {
  const url = new URL(`/api/students/${id}`, resolveApiBaseUrl());
  const response = await fetchApi({ url: url.toString(), getToken });
  if (!response.ok) throw new Error(`Failed to fetch student: ${response.status}`);
  return (await response.json()).data;
}

export async function createStudent({ getToken, schoolId, body } = {}) {
  const url = new URL(`/api/schools/${schoolId}/students`, resolveApiBaseUrl());
  const response = await fetchApi({
    url: url.toString(),
    getToken,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  });
  const payload = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(payload.message ?? 'Failed to create student'), { errors: payload.errors ?? [] });
  return payload.data;
}

export async function updateStudent({ getToken, id, body } = {}) {
  const url = new URL(`/api/students/${id}`, resolveApiBaseUrl());
  const response = await fetchApi({
    url: url.toString(),
    getToken,
    options: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  });
  const payload = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(payload.message ?? 'Failed to update student'), { errors: payload.errors ?? [] });
  return payload.data;
}

export async function deleteStudent({ getToken, id } = {}) {
  const url = new URL(`/api/students/${id}`, resolveApiBaseUrl());
  const response = await fetchApi({
    url: url.toString(),
    getToken,
    options: { method: 'DELETE' },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? 'Failed to delete student');
  }
}

export async function updateDietary({ getToken, id, dietaryTags } = {}) {
  const url = new URL(`/api/students/${id}/dietary`, resolveApiBaseUrl());
  const response = await fetchApi({
    url: url.toString(),
    getToken,
    options: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dietaryTags }),
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? 'Failed to update dietary');
  return payload.data;
}

// ─── Import ──────────────────────────────────────────────────────────────────

export async function downloadImportTemplate({ getToken, schoolId } = {}) {
  const url = new URL(`/api/schools/${schoolId}/import/template`, resolveApiBaseUrl());
  return fetchApi({ url: url.toString(), getToken });
}

export async function previewImport({ getToken, schoolId, file } = {}) {
  const url = new URL(`/api/schools/${schoolId}/import/preview`, resolveApiBaseUrl());
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetchApi({
    url: url.toString(),
    getToken,
    options: { method: 'POST', body: formData },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? 'Failed to preview import');
  return payload.data;
}

export async function confirmImport({ getToken, schoolId, importToken } = {}) {
  const url = new URL(`/api/schools/${schoolId}/import/confirm`, resolveApiBaseUrl());
  const response = await fetchApi({
    url: url.toString(),
    getToken,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importToken }),
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? 'Failed to confirm import');
  return payload.data;
}

// ─── QR ──────────────────────────────────────────────────────────────────────

export async function fetchStudentQr({ getToken, id } = {}) {
  const url = new URL(`/api/students/${id}/qr`, resolveApiBaseUrl());
  const response = await fetchApi({ url: url.toString(), getToken });
  if (!response.ok) throw new Error(`Failed to fetch QR: ${response.status}`);
  return (await response.json()).data;
}

export async function updateQrStatus({ getToken, id, status } = {}) {
  const url = new URL(`/api/students/${id}/qr/status`, resolveApiBaseUrl());
  const response = await fetchApi({
    url: url.toString(),
    getToken,
    options: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? 'Failed to update QR status');
  return payload.data;
}

export async function batchGenerateQr({ getToken, schoolId, grade } = {}) {
  const url = new URL(`/api/schools/${schoolId}/qr/batch`, resolveApiBaseUrl());
  if (grade) url.searchParams.set('grade', grade);
  const response = await fetchApi({
    url: url.toString(),
    getToken,
    options: { method: 'POST' },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? 'Failed to batch generate QR');
  return payload.data;
}

export async function fetchQrCards({ getToken, schoolId } = {}) {
  const url = new URL(`/api/schools/${schoolId}/qr/cards`, resolveApiBaseUrl());
  const response = await fetchApi({ url: url.toString(), getToken });
  if (!response.ok) throw new Error(`Failed to fetch QR cards: ${response.status}`);
  return (await response.json()).data;
}

// ─── Stats & Search ──────────────────────────────────────────────────────────

export async function fetchDashboardOverview({ getToken } = {}) {
  const url = new URL('/api/dashboard/overview', resolveApiBaseUrl());
  const response = await fetchApi({ url: url.toString(), getToken });
  if (!response.ok) throw new Error(`Failed to fetch overview: ${response.status}`);
  return (await response.json()).data;
}

export async function fetchSchoolStats({ getToken, schoolId } = {}) {
  const url = new URL(`/api/schools/${schoolId}/stats`, resolveApiBaseUrl());
  const response = await fetchApi({ url: url.toString(), getToken });
  if (!response.ok) throw new Error(`Failed to fetch school stats: ${response.status}`);
  return (await response.json()).data;
}

export async function globalSearch({ getToken, q } = {}) {
  const url = new URL('/api/search', resolveApiBaseUrl());
  url.searchParams.set('q', q);
  const response = await fetchApi({ url: url.toString(), getToken });
  if (!response.ok) throw new Error(`Search failed: ${response.status}`);
  return (await response.json()).data;
}

// ─── Exports (return raw Response for blob handling) ─────────────────────────

export async function exportDistrictReport({ getToken, schoolId } = {}) {
  const url = new URL(`/api/schools/${schoolId}/export/district-report`, resolveApiBaseUrl());
  return fetchApi({ url: url.toString(), getToken });
}

export async function exportQrCsv({ getToken, schoolId } = {}) {
  const url = new URL(`/api/schools/${schoolId}/qr/export/csv`, resolveApiBaseUrl());
  return fetchApi({ url: url.toString(), getToken });
}

export async function exportQrPdf({ getToken, schoolId } = {}) {
  const url = new URL(`/api/schools/${schoolId}/qr/export/pdf`, resolveApiBaseUrl());
  return fetchApi({ url: url.toString(), getToken });
}
