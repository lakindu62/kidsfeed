import { USER_ROLES, normalizeUserRole } from '../user-roles';

function readRoleClaim(claimSource) {
  if (!claimSource || typeof claimSource !== 'object') {
    return null;
  }

  const directRole = claimSource.role;
  if (typeof directRole === 'string') {
    return directRole;
  }

  const nestedRole =
    claimSource.publicMetadata?.role ?? claimSource.public_metadata?.role;
  if (typeof nestedRole === 'string') {
    return nestedRole;
  }

  return null;
}

export function resolveUserRole(claimSource) {
  const role = readRoleClaim(claimSource);
  return normalizeUserRole(role) || USER_ROLES.UNASSIGNED;
}
