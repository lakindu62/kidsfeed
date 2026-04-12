import DistrictOverviewPage from './pages/DistrictOverviewPage';
import MealPlanDetailsPage from './pages/MealPlanDetailsPage';
import NewWeeklyPlanPage from './pages/NewWeeklyPlanPage';

export const mealPlanningPath = '/meal-planning';
export const mealPlanningDetailsPath = '/meal-planning/plans/:planId';
export const mealPlanningNewPath = '/meal-planning/plans/new';

export function MealPlanningRoute() {
  return <DistrictOverviewPage />;
}

export function MealPlanDetailsRoute() {
  return <MealPlanDetailsPage />;
}

export function MealPlanningNewRoute() {
  return <NewWeeklyPlanPage />;
}
