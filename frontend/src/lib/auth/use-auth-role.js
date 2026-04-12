import { useAuth, useUser } from '@clerk/clerk-react';
import { resolveUserRole } from './resolve-user-role';

function hasRoleClaim(sessionClaims) {
  if (!sessionClaims || typeof sessionClaims !== 'object') {
    return false;
  }

  return (
    typeof sessionClaims.role === 'string' ||
    typeof sessionClaims.publicMetadata?.role === 'string' ||
    typeof sessionClaims.public_metadata?.role === 'string'
  );
}

export function useAuthRole() {
  const { isLoaded: isAuthLoaded, isSignedIn, sessionClaims } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();

  const roleSource = sessionClaims ?? user?.publicMetadata ?? null;
  const role = resolveUserRole(roleSource);
  const isRoleResolved =
    !isSignedIn || hasRoleClaim(sessionClaims) || isUserLoaded;
  const isLoaded = isAuthLoaded && isRoleResolved;

  return {
    isLoaded,
    isSignedIn,
    role,
    isRoleResolved,
  };
}
