// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import './App.css';

function App() {
  return (
    <Routes>
      {/* Example routes */}
      <Route path="/" element={<div>Home Page</div>} />
      <Route path="/about" element={<div>About Page</div>} />
    </Routes>
  );
}

export default App;
