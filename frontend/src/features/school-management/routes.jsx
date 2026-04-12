import { Outlet } from 'react-router-dom';

export const schoolManagementPath = '/school-management';

export { default as SchoolOverviewScreen } from './screens/SchoolOverviewScreen';
export { default as SchoolsScreen } from './screens/SchoolsScreen';
export { default as StudentsScreen } from './screens/StudentsScreen';
export { default as QrCodeScreen } from './screens/QrCodeScreen';
export { default as ReportsScreen } from './screens/ReportsScreen';

export function SchoolManagementRoute() {
  return <Outlet />;
}
