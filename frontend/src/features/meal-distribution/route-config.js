import MealDistributionDashboard from './screens/MealDistributionDashboard';
import MarkAttendancePage from './screens/MarkAttendancePage';
import MealSessionsPage from './screens/MealSessionsPage';
import NoShowAlertsPage from './screens/NoShowAlertsPage';
import StudentMealHistoryPage from './screens/StudentMealHistoryPage';
import MealReportsPage from './screens/MealReportsPage';

export const mealDistributionChildren = [
  { index: true, Component: MealDistributionDashboard },
  { path: 'sessions', Component: MealSessionsPage },
  { path: 'attendance', Component: MarkAttendancePage },
  { path: 'no-show-alerts', Component: NoShowAlertsPage },
  { path: 'student-history', Component: StudentMealHistoryPage },
  { path: 'reports', Component: MealReportsPage },
];
