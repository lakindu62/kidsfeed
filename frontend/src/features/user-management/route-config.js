import UserManagementPage from './pages/UserManagementPage';

export const userManagementPath = '/user-management';
export const userManagementUsersPath = '/user-management/users';
export const userManagementRolesPath = '/user-management/roles';

export const userManagementChildren = [
  { index: true, Component: UserManagementPage },
  { path: 'users', Component: UserManagementPage },
  { path: 'roles', Component: UserManagementPage },
];
