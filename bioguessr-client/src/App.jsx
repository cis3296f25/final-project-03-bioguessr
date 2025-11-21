// bioguessr-client/src/App.jsx
import { Routes, Route } from "react-router-dom";
import "./App.css";

import HomePage from "./homePage.jsx";
import PlayPage from "./playPage.jsx";
import DailyPage from "./DailyPage.jsx";   // <- if this file exists
import ArenaPage from "./ArenaPage.jsx";   // <- optional, if you’ve created it

function App() {
  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={<HomePage />} />

      {/* Main single-player game (Monkey / Guppy / Beast all use this) */}
      <Route path="/play" element={<PlayPage />} />

      {/* Daily challenge (only if you’ve got DailyPage.jsx) */}
      <Route path="/daily" element={<DailyPage />} />

      {/* Arena (only if you’ve started this) */}
      <Route path="/arena" element={<ArenaPage />} />
    </Routes>
  );
}

export default App;
