import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CountryDropdown from "./CountryDropdown.jsx";
import { getFeatureHint, getWeightHint } from "./utils/hints.js";
import "./App.css";
import bgImage from '../assets/homePageBG.png'; 
import logoImage from '../assets/logos/logorect.webp'; 

const DEMO_TOTAL_ROUNDS = 4;

function useIsEasyMode() {
  const { search } = useLocation();
  return new URLSearchParams(search).get("mode") === "easy";
}

export default function PlayPage() {
  const isEasy = useIsEasyMode();
  const navigate = useNavigate();

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [guess, setGuess] = useState("");
  const [current, setCurrent] = useState(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [loadError, setLoadError] = useState(false);

  const totalRounds = DEMO_TOTAL_ROUNDS;
  const gameOver = round > totalRounds;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadError(false);
        const res = await fetch("/api/play");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const animal = await res.json();

        if (!cancelled) {
          setCurrent(animal || null);
          setWrongGuesses(0);
          setGuess("");
          setLocked(false);
          setFeedback("");
        }
      } catch (err) {
        console.error("Error fetching /api/play:", err);
        if (!cancelled) {
          setCurrent(null);
          setLoadError(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [round]);

  const hint1 = useMemo(() => {
    if (!isEasy || !current || wrongGuesses < 1) return null;
    return getFeatureHint(current);
  }, [isEasy, current, wrongGuesses]);

  const hint2 = useMemo(() => {
    if (!isEasy || !current || wrongGuesses < 2) return null;
    return getWeightHint(current);
  }, [isEasy, current, wrongGuesses]);

  if (gameOver) {
    return (
      <div className="app-container" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="overlay">
          <div className="glass-card game-card" style={{ justifyContent: 'center', minHeight: 'auto' }}>
            <h2 className="title">Game Over</h2>
            <p className="subtitle" style={{ marginTop: '1rem' }}>Final Score: {score}</p>
            <button className="btn primary-btn" style={{ maxWidth: '300px', marginTop: '2rem' }} onClick={() => navigate("/")}>
              Back To Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-container" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="overlay">
          <div className="glass-card game-card" style={{ justifyContent: 'center', minHeight: 'auto' }}>
            <h2>Couldn’t load the next animal.</h2>
            <button className="btn secondary-btn" onClick={() => setRound((r) => r)}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="app-container" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="overlay">
          <div className="glass-card game-card" style={{ justifyContent: 'center', minHeight: 'auto' }}>
            <h2>Loading Round {round}...</h2>
          </div>
        </div>
      </div>
    );
  }

  function submitGuess() {
    if (!current || !guess?.trim() || locked) return;

    const correct = current.countries.some(
      (c) => c.toLowerCase() === guess.trim().toLowerCase()
    );

    if (correct) {
      setScore((s) => s + 100);
      setLocked(true);
      setFeedback("Correct! +100");
      return;
    }

    if (isEasy) {
      setWrongGuesses((n) => {
        const next = n + 1;
        if (next >= 3) {
          setLocked(true);
          setFeedback("Not quite."); 
        } else {
          setFeedback("Try again!");
        }
        return next;
      });
    } else {
      setLocked(true);
      setFeedback("Not quite."); 
    }
  }

  function nextRound() {
    setRound((r) => r + 1);
  }

  function restart() {
    navigate("/");
  }

  const imgSrc = current.image_url || current.imageUrl || "";

  return (
    <div className="app-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="overlay">
        <div className="glass-card game-card">
          
          <header className="game-header">
            <img src={logoImage} className="header-logo" alt="BioGuessr" />
            <div className="game-stats">
              <div>Score: <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{score}</span></div>
              <div>Round: {round} / {totalRounds}</div>
              <div>Mode: <span style={{ color: isEasy ? '#4caf50' : '#2196f3' }}>{isEasy ? "Easy" : "Normal"}</span></div>
            </div>
            <button className="btn secondary-btn" style={{ width: 'auto', padding: '0.5em 1em' }} onClick={restart}>
              Exit
            </button>
          </header>

          <div className="game-layout">
            <div className="game-image-section">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt="Animal to guess"
                  className="game-image"
                  onError={(e) => { e.currentTarget.src = "https://placehold.co/800x500?text=Image+unavailable"; }}
                />
              ) : (
                <div className="game-image-placeholder">(No image provided)</div>
              )}
            </div>

            <div className="game-controls-section">
              
              {/* CHANGED: Scientific Name Display */}
              <div style={{ marginBottom: '1rem' }}>
                  <div className="animal-name-label">Scientific Name</div>
                  <div style={{ fontSize: '1.8rem', fontStyle: 'italic', fontWeight: 600, color: '#4caf50' }}>
                      {current.scientificName}
                  </div>
              </div>

              {/* CHANGED: Common Name Display (Hidden until locked) */}
              <div>
                <div className="animal-name-label">Common Name</div>
                <div className={locked ? "animal-name-revealed" : "animal-name-hidden"}>
                  {locked ? current.name : "?"}
                </div>
              </div>

              {/* Hints */}
              {isEasy && wrongGuesses >= 1 && hint1 && (
                <div className="hint-box"><strong>Hint 1:</strong> {hint1}</div>
              )}
              {isEasy && wrongGuesses >= 2 && hint2 && (
                <div className="hint-box"><strong>Hint 2:</strong> {hint2}</div>
              )}

              <div className="input-group">
                <CountryDropdown setGuess={setGuess} />

                <button
                  className="btn primary-btn"
                  onClick={submitGuess}
                  disabled={!guess?.trim() || locked}
                >
                  Submit Guess
                </button>

                <button
                  className="btn secondary-btn"
                  onClick={nextRound}
                  disabled={!locked}
                >
                  Next Round
                </button>
              </div>

              <p className="feedback-text" style={{ color: feedback.includes("Correct") ? "#4caf50" : "#ff5252" }}>
                {feedback}
              </p>
            </div>
          </div>

          {locked && (
            <div className="answer-section">
              <div className="answer-title">Correct Regions</div>
              <div className="answer-text">
                {current.countries.join(", ")}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}