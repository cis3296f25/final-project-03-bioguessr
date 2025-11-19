import React, { useState } from "react";
import LeaderboardDisplay from "./LeaderboardDisplay";

export default function LeaderboardToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>
           🏆
      </button>

      <LeaderboardDisplay
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
