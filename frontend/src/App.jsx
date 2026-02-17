// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <Routes>
      {/* Example routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<div>About Page</div>} />
    </Routes>
  );
}

export default App;
