import React, { useEffect, useState } from "react";
import { apiUrl } from "./utils/api.js";
import './App.css';

export default function LeaderboardDisplay({ open, onClose }) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (!open) return;
    fetchLeaderboard();
  }, [open]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(apiUrl("/api/getTopTenFromLeaderboard"));
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-display" onClick={(e) => e.stopPropagation()}>
        <h2>Leaderboard</h2>

        <table style={{ width: "100%", marginTop: "1rem" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Name</th>
              <th style={{ textAlign: "right" }}>Score</th>
            </tr>
          </thead>

          <tbody>
            {leaderboard.map((item, idx) => (
              <tr key={idx}>
                <td>{item.initials}</td>
                <td style={{ textAlign: "right" }}>{item.score}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={onClose} className="btn modal-btn">Close</button>
      </div>
    </div>
  );
}
