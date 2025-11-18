// bioguessr-client/src/homePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

export default function HomePage() {
  const [buttonText, setButtonText] = useState("Play (Normal)");
  const [rulesText, setRulesText] = useState("Rules");
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Helper: only use text if status OK AND content-type is plain text
    const safeFetchText = async (url) => {
      try {
        const res = await fetch(url).catch(() => null);
        if (!res?.ok) return null;
        const ct = res.headers.get("content-type") || "";
        if (!ct.toLowerCase().includes("text/plain")) return null;
        const txt = (await res.text()).trim();
        return txt || null;
      } catch {
        return null;
      }
    };

    (async () => {
      const playTxt = await safeFetchText("/api/playButton");
      if (playTxt) setButtonText(playTxt);

      const rulesTxt = await safeFetchText("/api/rulesButton");
      if (rulesTxt) setRulesText(rulesTxt);
    })();
  }, []);

  return (
    <div className="background" style={{ textAlign: "center", padding: 24 }}>
      <h1>BioGuessr</h1>
      <p>How well do you know Biology?</p>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 12 }}>
        <button onClick={() => navigate("/play")} aria-label="Play Normal Mode">
          {buttonText}
        </button>

        {/* New Easy Mode button */}
        <button onClick={() => navigate("/play?mode=easy")} aria-label="Play Easy Mode">
          Play (Easy)
        </button>

        <button onClick={() => setShowRules(true)}>{rulesText}</button>
      </div>

      {showRules && (
        <div className="modal-overlay" onClick={() => setShowRules(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>How To Play</h2>
            <p>You will be shown a picture of an animal along with its scientific name.</p>
            <p>
              Your job is to correctly identify the region(s) where the animal can be found by
              selecting a country from the dropdown.
            </p>
            <p>Correct guesses give points; incorrect guesses do not.</p>
            <button onClick={() => setShowRules(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
