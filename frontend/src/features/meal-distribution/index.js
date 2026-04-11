import { Route } from 'react-router-dom';
import MealDistributionDashboard from './screens/MealDistributionDashboard';
import MarkAttendancePage from './screens/MarkAttendancePage';
import MealSessionsPage from './screens/MealSessionsPage';
import NoShowAlertsPage from './screens/NoShowAlertsPage';
import StudentMealHistoryPage from './screens/StudentMealHistoryPage';
import MealReportsPage from './screens/MealReportsPage';

export { default as MealDistributionLayout } from './routes';

export const mealDistributionPath = '/meal-distribution';

export function mealDistributionRoutes() {
  return (
    <>
      <Route index element={<MealDistributionDashboard />} />
      <Route path="sessions" element={<MealSessionsPage />} />
      <Route path="attendance" element={<MarkAttendancePage />} />
      <Route path="no-show-alerts" element={<NoShowAlertsPage />} />
      <Route path="student-history" element={<StudentMealHistoryPage />} />
      <Route path="reports" element={<MealReportsPage />} />
    </>
  );
}
