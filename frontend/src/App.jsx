// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
// import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import {
  MealAttendanceRoute,
  MealDistributionRoute,
  MealSessionsRoute,
  mealAttendancePath,
  mealDistributionPath,
  mealSessionsPath,
} from './features/meal-distribution';
import { InventoryRoute, inventoryPath } from './features/inventory';

function App() {
  return (
    <Routes>
      {/* Example routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<div>About Page</div>} />
      <Route path={inventoryPath} element={<InventoryRoute />} />
      <Route path={mealDistributionPath} element={<MealDistributionRoute />} />
      <Route path={mealSessionsPath} element={<MealSessionsRoute />} />
      <Route path={mealAttendancePath} element={<MealAttendanceRoute />} />
    </Routes>
  );
}

export default App;
