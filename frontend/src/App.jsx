import { useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import RequireAuth from './components/common/guards/RequireAuth';
import RequireRole from './components/common/guards/RequireRole';
import { InventoryRoute, inventoryPath } from './features/inventory';
import {
  MealDistributionLayout,
  mealDistributionPath,
  mealDistributionChildren,
} from './features/meal-distribution';
import {
  MenuManagementNewRecipeRoute,
  MenuManagementRecipeDetailsRoute,
  MenuManagementRecipeEditRoute,
  MenuManagementRecipesRoute,
  MenuManagementRoute,
  menuManagementPath,
} from './features/menu-management';
import AuthRedirectPage from './pages/AuthRedirectPage';
import Home from './pages/Home';
import RolePendingAssignment from './pages/RolePendingAssignment';
import Unauthorized from './pages/Unauthorized';
import { USER_ROLES } from './lib/user-roles';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth-redirect" element={<AuthRedirectPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/role-pending-assignment"
          element={<RolePendingAssignment />}
        />
        <Route path="/about" element={<div>About Page</div>} />
        <Route
          path={inventoryPath}
          element={
            <RequireAuth>
              <RequireRole
                allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER]}
              >
                <InventoryRoute />
              </RequireRole>
            </RequireAuth>
          }
        />
         <Route
        path={mealDistributionPath}
        element={
          <RequireAuth>
            <RequireRole
              allowedRoles={[
                USER_ROLES.ADMIN,
                USER_ROLES.SCHOOL_STAFF,
                USER_ROLES.SCHOOL_ADMIN,
              ]}
            >
              <MealDistributionLayout />
            </RequireRole>
          </RequireAuth>
        }
      >
        {mealDistributionChildren.map((route) => (
          <Route
            key={route.path ?? 'index'}
            path={route.path}
            index={route.index}
            element={<route.Component />}
          />
        ))}
      </Route>
        <Route
          path={menuManagementPath}
          element={
            <RequireAuth>
              <RequireRole
                allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.MENU_MANAGER]}
              >
                <Outlet />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<MenuManagementRoute />} />
          <Route path="recipes" element={<MenuManagementRecipesRoute />} />
          <Route
            path="recipes/new"
            element={<MenuManagementNewRecipeRoute />}
          />
          <Route
            path="recipes/:recipeId/edit"
            element={<MenuManagementRecipeEditRoute />}
          />
          <Route
            path="recipes/:recipeId"
            element={<MenuManagementRecipeDetailsRoute />}
          />
          <Route path="menus" element={<MenuManagementRoute />} />
          <Route path="calendar" element={<MenuManagementRoute />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
