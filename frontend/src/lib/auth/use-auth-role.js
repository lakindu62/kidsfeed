import { useAuth, useUser } from '@clerk/clerk-react';
import { resolveUserRole } from './resolve-user-role';

export function useAuthRole() {
  const { isLoaded, isSignedIn, sessionClaims } = useAuth();
  const { user } = useUser();

  const roleSource = sessionClaims ?? user?.publicMetadata ?? null;
  const role = resolveUserRole(roleSource);
  const isRoleResolved = isLoaded;

  return {
    isLoaded,
    isSignedIn,
    role,
    isRoleResolved,
  };
}
