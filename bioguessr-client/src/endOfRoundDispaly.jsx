import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./utils/api.js";

export default function PostRoundPopup({ open, onClose, score }) {
  const [initials, setInitials] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");
  const navigate = useNavigate();

  if (!open) return null;

  const submitScore = async () => {
    try {
      const res = await fetch(apiUrl("/api/updateLeaderboard"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initials: initials.trim(),
          score: score,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit score");
      setSubmitted(true);

    } catch (err) {
      console.error("Error submitting score:", err);
    }
  };

  const shareResult = async () => {
    const shareText = `I got ${score} on the BioGuessr Daily!\n\nPlay here: https://cis3296f25.github.io/final-project-03-bioguessr/`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopyMsg("Copied!");
      setTimeout(() => setCopyMsg(""), 1500);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <h2 style={{ textAlign: "center" }}>Daily Complete!</h2>
        <p style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          Final Score: <strong>{score}</strong>
        </p>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "2rem"
        }}>
          
          <div style={{ flex: 1 }}>
            <h3>Submit Score</h3>

            {!submitted ? (
              <>
                <label>Initials:</label>
                <input
                  type="text"
                  maxLength={3}
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    padding: "0.7rem",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.3)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    marginBottom: "1rem",
                  }}
                />

                <button 
                  className="btn primary-btn" 
                  onClick={submitScore} 
                  disabled={!initials.trim()}
                >
                  Submit Score
                </button>
              </>
            ) : (
              <p style={{ color: "#4caf50", marginTop: "1rem" }}>
                Score submitted!
              </p>
            )}
          </div>

          <div style={{
            width: "1px",
            background: "rgba(255,255,255,0.25)"
          }}></div>

          <div style={{ flex: 1 }}>
            <h3>Share Result</h3>

            <button className="btn secondary-btn" onClick={shareResult}>
              Copy Share Text
            </button>

            {copyMsg && (
              <p style={{ marginTop: "0.7rem", color: "#4caf50" }}>{copyMsg}</p>
            )}
          </div>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "2rem"
        }}>
          <button className="btn secondary-btn" onClick={onClose}>Close</button>
          <button className="btn primary-btn" onClick={() => navigate("/")}>
            Back To Home
          </button>
        </div>

      </div>
    </div>
  );
}
