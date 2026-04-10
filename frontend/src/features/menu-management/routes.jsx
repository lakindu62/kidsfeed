import RecipeManagementPage from './pages/RecipeManagementPage';

export const menuManagementPath = '/menu-management';
export const menuManagementRecipesPath = '/menu-management/recipes';

export function MenuManagementRoute() {
  return <RecipeManagementPage />;
}

export function MenuManagementRecipesRoute() {
  return <RecipeManagementPage />;
}
