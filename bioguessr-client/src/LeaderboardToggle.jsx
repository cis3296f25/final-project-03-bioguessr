import React, { useState } from "react";
import LeaderboardDisplay from "./LeaderboardDisplay";
import './App.css';

export default function LeaderboardToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="link-btn">
        🏆 Leaderboard
      </button>

      <LeaderboardDisplay
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
