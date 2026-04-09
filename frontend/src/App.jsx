// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
// import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import {
  MealAttendanceRoute,
  MealDistributionDashboardRoute,
  MealDistributionLayoutRoute,
  MealNoShowAlertsRoute,
  MealSessionsRoute,
  mealDistributionPath,
} from './features/meal-distribution';

function App() {
  return (
    <Routes>
      {/* Example routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<div>About Page</div>} />
      <Route
        path={mealDistributionPath}
        element={<MealDistributionLayoutRoute />}
      >
        <Route index element={<MealDistributionDashboardRoute />} />
        <Route path="sessions" element={<MealSessionsRoute />} />
        <Route path="attendance" element={<MealAttendanceRoute />} />
        <Route path="no-show-alerts" element={<MealNoShowAlertsRoute />} />
      </Route>
    </Routes>
  );
}

export default App;
