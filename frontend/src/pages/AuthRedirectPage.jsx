import { Navigate } from 'react-router-dom';
import { useAuthRole } from '@/lib/auth/use-auth-role';
import { USER_ROLES } from '@/lib/user-roles';

const ROLE_HOME_PATHS = {
  [USER_ROLES.ADMIN]: '/user-management',
  [USER_ROLES.INVENTORY_MANAGER]: '/inventory',
  [USER_ROLES.MEAL_PLANNER]: '/menu-management',
  [USER_ROLES.MENU_MANAGER]: '/menu-management',
  [USER_ROLES.SCHOOL_STAFF]: '/meal-distribution',
  [USER_ROLES.SCHOOL_ADMIN]: '/school-management',
  [USER_ROLES.UNASSIGNED]: '/role-pending-assignment',
};

function AuthRedirectPage() {
  const { isLoaded, isSignedIn, role, isRoleResolved } = useAuthRole();

  if (!isLoaded || !isRoleResolved) {
    return <p>Loading your account...</p>;
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={ROLE_HOME_PATHS[role] ?? '/unauthorized'} replace />;
}

export default AuthRedirectPage;
