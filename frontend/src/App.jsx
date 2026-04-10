// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
// import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AuthRedirectPage from './pages/AuthRedirectPage';
import Unauthorized from './pages/Unauthorized';
import RolePendingAssignment from './pages/RolePendingAssignment';
import RequireAuth from './components/common/guards/RequireAuth';
import RequireRole from './components/common/guards/RequireRole';
import { USER_ROLES } from './lib/user-roles';
import {
  MealAttendanceRoute,
  MealDistributionDashboardRoute,
  MealDistributionLayoutRoute,
  MealNoShowAlertsRoute,
  MealReportsRoute,
  MealSessionsRoute,
  MealStudentHistoryRoute,
  mealDistributionPath,
} from './features/meal-distribution';
import { InventoryRoute, inventoryPath } from './features/inventory';

function App() {
  return (
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
              <MealDistributionLayoutRoute />
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route index element={<MealDistributionDashboardRoute />} />
        <Route path="sessions" element={<MealSessionsRoute />} />
        <Route path="attendance" element={<MealAttendanceRoute />} />
        <Route path="no-show-alerts" element={<MealNoShowAlertsRoute />} />
        <Route path="student-history" element={<MealStudentHistoryRoute />} />
        <Route path="reports" element={<MealReportsRoute />} />
      </Route>
    </Routes>
  );
}

export default App;
