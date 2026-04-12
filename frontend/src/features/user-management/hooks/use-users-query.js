import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useState } from 'react';

import { describeApiFetchFailure } from '@/lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base';

import {
  deleteUser,
  fetchUsers,
  updateUserRole,
} from '../api/user-management.api';

export function useUsersQuery({ roleFilter = 'all' } = {}) {
  const { isSignedIn, getToken } = useAuth();
  const apiUrl = resolveApiBaseUrl();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setIsLoading(true);
      }

      if (!isSignedIn) {
        setUsers([]);
        setError('Sign in as an admin to view user management data.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchUsers({
          apiUrl,
          getToken,
          role: roleFilter,
        });

        setUsers(data);
        setError('');
      } catch (loadError) {
        setUsers([]);
        setError(
          describeApiFetchFailure(loadError, 'Could not load user records.'),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, getToken, isSignedIn, roleFilter],
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const changeUserRole = useCallback(
    async ({ userId, clerkId, role }) => {
      setIsMutating(true);
      try {
        const payload = await updateUserRole({
          apiUrl,
          getToken,
          userId,
          clerkId,
          role,
        });

        await loadUsers({ silent: true });
        return payload;
      } finally {
        setIsMutating(false);
      }
    },
    [apiUrl, getToken, loadUsers],
  );

  const removeUser = useCallback(
    async ({ userId, clerkId }) => {
      setIsMutating(true);
      try {
        const payload = await deleteUser({
          apiUrl,
          getToken,
          userId,
          clerkId,
        });

        await loadUsers({ silent: true });
        return payload;
      } finally {
        setIsMutating(false);
      }
    },
    [apiUrl, getToken, loadUsers],
  );

  return {
    users,
    isLoading,
    isMutating,
    error,
    refreshUsers: loadUsers,
    updateRole: changeUserRole,
    deleteUser: removeUser,
  };
}
