import { Navigate } from 'react-router-dom';
import { useAuthRole } from '@/lib/auth/use-auth-role';
import { USER_ROLES } from '@/lib/user-roles';

function RequireRole({ allowedRoles, children }) {
  const { isLoaded, isSignedIn, role, isRoleResolved } = useAuthRole();

  if (!isLoaded || !isRoleResolved) {
    return <p>Loading your role...</p>;
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  if (role === USER_ROLES.UNASSIGNED) {
    return <Navigate to="/role-pending-assignment" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default RequireRole;
