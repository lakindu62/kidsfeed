import RecipeManagementPage from './pages/RecipeManagementPage';
import RecipeDetailsPage from './pages/RecipeDetailsPage';

export const menuManagementPath = '/menu-management';
export const menuManagementRecipesPath = '/menu-management/recipes';
export const menuManagementRecipeDetailsPath =
  '/menu-management/recipes/:recipeId';

export function MenuManagementRoute() {
  return <RecipeManagementPage />;
}

export function MenuManagementRecipesRoute() {
  return <RecipeManagementPage />;
}

export function MenuManagementRecipeDetailsRoute() {
  return <RecipeDetailsPage />;
}
