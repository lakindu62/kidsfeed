import { fetchApi } from '@/lib/api-client';

async function readUserManagementApiErrorMessage(response, fallbackMessage) {
  try {
    const payload = await response.json();
    return payload?.message || payload?.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function requestUserManagementApi({
  apiUrl,
  getToken,
  path,
  method = 'GET',
  payload,
  fallbackMessage,
}) {
  if (!apiUrl) {
    throw new Error('Could not resolve API base URL.');
  }

  const url = new URL(path, apiUrl);

  const response = await fetchApi({
    url: url.toString(),
    getToken,
    options: {
      method,
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    },
  });

  if (!response.ok) {
    throw new Error(
      await readUserManagementApiErrorMessage(response, fallbackMessage),
    );
  }

  return response;
}

export async function fetchUsers({ apiUrl, getToken, role }) {
  const searchRole = typeof role === 'string' ? role.trim().toLowerCase() : '';
  const path =
    searchRole && searchRole !== 'all'
      ? `/api/users?role=${encodeURIComponent(searchRole)}`
      : '/api/users';

  const response = await requestUserManagementApi({
    apiUrl,
    getToken,
    path,
    fallbackMessage: 'Failed to fetch users.',
  });

  const payload = await response.json();
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function updateUserRole({
  apiUrl,
  getToken,
  userId,
  clerkId,
  role,
}) {
  if (!role) {
    throw new Error('Role is required to update user role.');
  }

  const path = userId
    ? `/api/users/by-id/${encodeURIComponent(userId)}/role`
    : clerkId
      ? `/api/users/by-clerk/${encodeURIComponent(clerkId)}/role`
      : null;

  if (!path) {
    throw new Error('Either userId or clerkId is required to update role.');
  }

  const response = await requestUserManagementApi({
    apiUrl,
    getToken,
    path,
    method: 'PATCH',
    payload: { role },
    fallbackMessage: 'Failed to update user role.',
  });

  return response.json();
}

export async function deleteUser({ apiUrl, getToken, userId, clerkId }) {
  const path = userId
    ? `/api/users/by-id/${encodeURIComponent(userId)}`
    : clerkId
      ? `/api/users/by-clerk/${encodeURIComponent(clerkId)}`
      : null;

  if (!path) {
    throw new Error('Either userId or clerkId is required to delete user.');
  }

  const response = await requestUserManagementApi({
    apiUrl,
    getToken,
    path,
    method: 'DELETE',
    fallbackMessage: 'Failed to delete user.',
  });

  return response.json();
}
