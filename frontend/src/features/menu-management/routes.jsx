import RecipeManagementPage from './pages/RecipeManagementPage';
import RecipeDetailsPage from './pages/RecipeDetailsPage';
import NewRecipePage from './pages/NewRecipePage';

export const menuManagementPath = '/menu-management';
export const menuManagementRecipesPath = '/menu-management/recipes';
export const menuManagementRecipeDetailsPath =
  '/menu-management/recipes/:recipeId';
export const menuManagementRecipeEditPath =
  '/menu-management/recipes/:recipeId/edit';
export const menuManagementRecipeNewPath = '/menu-management/recipes/new';

export function MenuManagementRoute() {
  return <RecipeManagementPage />;
}

export function MenuManagementRecipesRoute() {
  return <RecipeManagementPage />;
}

export function MenuManagementRecipeDetailsRoute() {
  return <RecipeDetailsPage />;
}

export function MenuManagementRecipeEditRoute() {
  return <NewRecipePage />;
}

export function MenuManagementNewRecipeRoute() {
  return <NewRecipePage />;
}
