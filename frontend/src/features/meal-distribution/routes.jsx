import MealDistributionDashboard from './screens';
import MealSessionsPage from './screens/MealSessionsPage';
import MarkAttendancePage from './screens/MarkAttendancePage';
import {
  getDefaultMealDistributionSchoolScope,
  MealDistributionSchoolProvider,
} from './hooks';

export const mealDistributionPath = '/meal-distribution';
export const mealSessionsPath = '/meal-distribution/sessions';
export const mealAttendancePath = '/meal-distribution/attendance';

export function MealDistributionRoute() {
  const { schoolId, schoolName } = getDefaultMealDistributionSchoolScope();

  return (
    <MealDistributionSchoolProvider schoolId={schoolId} schoolName={schoolName}>
      <MealDistributionDashboard />
    </MealDistributionSchoolProvider>
  );
}

export function MealSessionsRoute() {
  const { schoolId, schoolName } = getDefaultMealDistributionSchoolScope();

  return (
    <MealDistributionSchoolProvider schoolId={schoolId} schoolName={schoolName}>
      <MealSessionsPage />
    </MealDistributionSchoolProvider>
  );
}

export function MealAttendanceRoute() {
  const { schoolId, schoolName } = getDefaultMealDistributionSchoolScope();

  return (
    <MealDistributionSchoolProvider schoolId={schoolId} schoolName={schoolName}>
      <MarkAttendancePage />
    </MealDistributionSchoolProvider>
  );
}
