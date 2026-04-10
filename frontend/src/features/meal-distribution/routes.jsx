import { Outlet } from 'react-router-dom';
import MealDistributionSchoolScopeBanner from './components/MealDistributionSchoolScopeBanner';
import MealDistributionDashboard from './screens/MealDistributionDashboard';
import MarkAttendancePage from './screens/MarkAttendancePage';
import MealSessionsPage from './screens/MealSessionsPage';
import NoShowAlertsPage from './screens/NoShowAlertsPage';
import {
  getDefaultMealDistributionSchoolScope,
  MealDistributionSchoolProvider,
} from './hooks';

export const mealDistributionPath = '/meal-distribution';
export const mealSessionsPath = '/meal-distribution/sessions';
export const mealAttendancePath = '/meal-distribution/attendance';
export const mealNoShowAlertsPath = '/meal-distribution/no-show-alerts';

/** Wraps all meal-distribution pages with one school provider (from env). */
export function MealDistributionLayoutRoute() {
  const { schoolId, schoolName } = getDefaultMealDistributionSchoolScope();

  return (
    <MealDistributionSchoolProvider schoolId={schoolId} schoolName={schoolName}>
      <MealDistributionSchoolScopeBanner />
      <Outlet />
    </MealDistributionSchoolProvider>
  );
}

export function MealDistributionDashboardRoute() {
  return <MealDistributionDashboard />;
}

export function MealSessionsRoute() {
  return <MealSessionsPage />;
}

export function MealAttendanceRoute() {
  return <MarkAttendancePage />;
}

export function MealNoShowAlertsRoute() {
  return <NoShowAlertsPage />;
}
