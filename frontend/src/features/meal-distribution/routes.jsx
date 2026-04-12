import { Outlet } from 'react-router-dom';
import MealDistributionSchoolScopeBanner from './components/MealDistributionSchoolScopeBanner';
import {
  getDefaultMealDistributionSchoolScope,
  MealDistributionSchoolProvider,
} from './hooks';

export const mealDistributionPath = '/meal-distribution';

export default function MealDistributionLayout() {
  const { schoolId, schoolName } = getDefaultMealDistributionSchoolScope();

  return (
    <MealDistributionSchoolProvider schoolId={schoolId} schoolName={schoolName}>
      <MealDistributionSchoolScopeBanner />
      <Outlet />
    </MealDistributionSchoolProvider>
  );
}
