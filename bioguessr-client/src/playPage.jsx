import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CountryDropdown from "./CountryDropdown.jsx";
import { getFeatureHint, getWeightHint } from "./utils/hints.js";
import "./App.css";
import bgImage from '../assets/homePageBG.png';
import logoImage from '../assets/logos/logorect.webp';

// Normal/Easy use a fixed number of rounds
const DEMO_TOTAL_ROUNDS = 4;

// BEAST MODE constants
const BEAST_MAX_LIVES = 3;
const BEAST_BASE_TIME = 7; // seconds at early rounds
const BEAST_MIN_TIME = 4; // never go below 4s

// Read ?mode=easy or ?mode=beast from the URL
function useGameMode() {
  const { search } = useLocation();
  const modeParam = new URLSearchParams(search).get("mode");
  if (modeParam === "easy") return "easy";
  if (modeParam === "beast") return "beast";
  return "normal";
}

// Compute the current time limit for BEAST mode based on round number
function computeBeastTimeLimit(round) {
  const decrements = Math.floor((round - 1) / 10); // every 10 rounds, -1s
  const limit = BEAST_BASE_TIME - decrements;
  return Math.max(BEAST_MIN_TIME, limit);
}

export default function PlayPage() {
  const mode = useGameMode();
  const isEasy = mode === "easy";
  const isBeast = mode === "beast";
  const navigate = useNavigate();

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [guess, setGuess] = useState("");
  const [current, setCurrent] = useState(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [loadError, setLoadError] = useState(false);

  // BEAST MODE: lives + timer + streak
  const [lives, setLives] = useState(BEAST_MAX_LIVES);
  const [streak, setStreak] = useState(0);
  const [timeLimit, setTimeLimit] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const heartbeatRef = useRef(null);

  const totalRounds = DEMO_TOTAL_ROUNDS;

  // Game Over Conditions
  const roundsExceeded = !isBeast && round > totalRounds;
  const beastDead = isBeast && lives <= 0;
  const gameOver = roundsExceeded || beastDead;

  // ---------- Load animal for this round ----------
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
  }, [round]); // Re-fetch when round changes

  // ---------- BEAST MODE: Setup Heartbeat Audio ----------
  useEffect(() => {
    if (!isBeast) {
      if (heartbeatRef.current) {
        heartbeatRef.current.pause();
        heartbeatRef.current.currentTime = 0;
      }
      return;
    }
    if (!heartbeatRef.current) {
      try {
        // Ensure this file exists in public/assets/audio/
        const audio = new Audio("/assets/audio/heartbeat.mp3");
        audio.loop = true;
        audio.volume = 0.4;
        heartbeatRef.current = audio;
      } catch (err) {
        console.warn("Could not create heartbeat audio:", err);
      }
    }
  }, [isBeast]);

  // ---------- BEAST MODE: Reset Timer per Round ----------
  useEffect(() => {
    if (!isBeast || !current) {
      setTimeLimit(null);
      setTimeLeft(null);
      return;
    }
    const limit = computeBeastTimeLimit(round);
    setTimeLimit(limit);
    setTimeLeft(limit);
  }, [isBeast, current, round]);

  // ---------- BEAST MODE: Timer Tick ----------
  useEffect(() => {
    if (!isBeast || !current || locked || timeLimit == null || timeLeft == null) {
      return;
    }

    if (timeLeft <= 0) {
      // Time's up! Treat as wrong answer
      if (!locked && lives > 0) {
        const penalty = Math.floor(score / 3);
        const newScore = Math.max(0, score - penalty);

        setLocked(true);
        setScore(newScore);
        setLives((prev) => Math.max(0, prev - 1));
        setStreak(0);
        setFeedback(`Time's up! (-${penalty} pts)`);
      }
      return;
    }

    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t == null) return t;
        const next = t - 0.1;
        return next <= 0 ? 0 : next;
      });
    }, 100);

    return () => clearInterval(id);
  }, [isBeast, current, locked, timeLeft, timeLimit, lives, score]);

  // ---------- BEAST MODE: Heartbeat Speed ----------
  useEffect(() => {
    if (!isBeast) return;
    const audio = heartbeatRef.current;
    if (!audio || timeLimit == null || timeLeft == null) return;

    if (locked || lives <= 0 || timeLeft <= 0) {
      audio.pause();
      return;
    }

    const ratio = Math.max(0, Math.min(1, timeLeft / timeLimit));
    const minRate = 1.0;
    const maxRate = 1.8;
    const rate = maxRate - (maxRate - minRate) * ratio;

    audio.playbackRate = rate;
    audio.play().catch(() => { }); // Ignore play errors

    return () => { audio.pause(); };
  }, [isBeast, timeLeft, timeLimit, locked, lives]);

  // ---------- BEAST MODE: Auto-Advance ----------
  useEffect(() => {
    if (!isBeast) return;
    if (!locked) return;
    if (lives <= 0) return;

    const id = setTimeout(() => {
      setRound((r) => r + 1);
    }, 1500); // Short pause to see result before auto-advancing

    return () => clearTimeout(id);
  }, [isBeast, locked, lives]);


  // ---------- HINTS (Easy Mode) ----------
  const hint1 = useMemo(() => {
    if (!isEasy || !current || wrongGuesses < 1) return null;
    return getFeatureHint(current);
  }, [isEasy, current, wrongGuesses]);

  const hint2 = useMemo(() => {
    if (!isEasy || !current || wrongGuesses < 2) return null;
    return getWeightHint(current);
  }, [isEasy, current, wrongGuesses]);


  // ---------- BEAST MODE: Zoom Effect ----------
  const zoomScale = useMemo(() => {
    if (!isBeast || !timeLimit || timeLeft == null) return 1;
    const ratio = Math.max(0, Math.min(1, timeLeft / timeLimit));
    // Scale from 2.1 (start) down to 1.0 (end)
    const maxScale = 2.1;
    const minScale = 1.0;
    const baseScale = minScale + (maxScale - minScale) * ratio;

    // Add pulse when time is low
    const danger = 1 - ratio;
    const phase = (timeLimit - timeLeft) * 10;
    const pulse = danger > 0.3 ? 0.03 * Math.sin(phase) * danger : 0;

    return baseScale + pulse;
  }, [isBeast, timeLimit, timeLeft]);


  // ---------- UI RENDER LOGIC ----------

  // Game Over Screen
  if (gameOver) {
    return (
      <div className="app-container" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="overlay">
          <div className="glass-card game-card" style={{ justifyContent: 'center', minHeight: 'auto' }}>
            <h2 className="title" style={{ color: isBeast && beastDead ? '#ff5252' : '#4caf50' }}>
              {beastDead ? "DEFEATED" : "Game Over"}
            </h2>
            <p className="subtitle" style={{ marginTop: '1rem' }}>
              {beastDead ? "You ran out of lives." : "All rounds completed."}
            </p>
            <div className="game-stats" style={{ flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <div>Final Score: <strong>{score}</strong></div>
              {isBeast && <div>Highest Streak: <strong>{streak}</strong></div>}
            </div>
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

  // ---------- GUESS SUBMISSION ----------
  function submitGuess() {
    if (!current || !guess?.trim() || locked) return;

    const correct = current.countries.some(
      (c) => c.toLowerCase() === guess.trim().toLowerCase()
    );

    if (correct) {
      setGuess(""); // Clear the input after correct guess

      if (isBeast) {
        // Beast Scoring
        const newStreak = streak + 1;
        const basePoints = 100;
        const roundBonus = Math.max(0, (round - 1) * 5);
        const timeRatio = timeLimit && timeLeft != null && timeLimit > 0
          ? Math.max(0, Math.min(1, timeLeft / timeLimit)) : 0;
        const timeBonus = Math.round(20 * timeRatio);

        const gained = (basePoints + roundBonus + timeBonus) * newStreak;

        setStreak(newStreak);
        setScore((s) => s + gained);
        setLocked(true);
        setFeedback(`Correct! Streak x${newStreak} (+${gained})`);
      } else {
        // Normal Scoring
        setScore((s) => s + 100);
        setLocked(true);
        setFeedback("Correct! +100");
      }
      return;
    }

    // WRONG ANSWER
    setGuess("");

    if (isBeast) {
      const penalty = Math.floor(score / 3);
      const newScore = Math.max(0, score - penalty);
      setScore(newScore);
      setLives((prev) => Math.max(0, prev - 1));
      setStreak(0);
      setLocked(true);
      setFeedback(`Wrong! (-${penalty} pts)`);
      return;
    }

    // Normal/Easy Logic
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

  // Label for the mode display
  let modeLabel = "Normal";
  if (isBeast) modeLabel = "BEAST MODE";
  if (isEasy) modeLabel = "Easy";

  // Timer Style Calculation (Beast only)
  let timerColor = "#4caf50"; // Green
  if (isBeast && timeLimit) {
    const ratio = timeLeft / timeLimit;
    if (ratio < 0.3) timerColor = "#ff5252"; // Red
    else if (ratio < 0.6) timerColor = "#ff9800"; // Orange
  }

  return (
    <div className="app-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="overlay">
        <div className="glass-card game-card">

          {/* HEADER */}
          <header className="game-header">
            <img src={logoImage} className="header-logo" alt="BioGuessr" />

            <div className="game-stats">
              <div>Score: <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{score}</span></div>

              {isBeast ? (
                <>
                  <div>Round: {round}</div>
                  <div><span style={{ color: '#ff5252', fontWeight: 'bold' }}>{modeLabel}</span></div>
                  <div>Lives: {Array(lives).fill("❤️").join("")}</div>
                  <div>Streak: x{streak}</div>
                  <div style={{ fontWeight: 'bold', color: timerColor, minWidth: '60px' }}>
                    {timeLeft != null ? timeLeft.toFixed(1) + "s" : "--"}
                  </div>
                </>
              ) : (
                <>
                  <div>Round: {round} / {totalRounds}</div>
                  <div>Mode: <span style={{ color: isEasy ? '#4caf50' : '#2196f3' }}>{modeLabel}</span></div>
                </>
              )}
            </div>

            <button className="btn secondary-btn" style={{ width: 'auto', padding: '0.5em 1em' }} onClick={restart}>
              Exit
            </button>
          </header>

          {/* MAIN CONTENT */}
          <div className="game-layout">

            {/* Left Column: Image */}
            <div style={isBeast ? { border: '2px solid ' + timerColor } : {}} className="game-image-section">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt="Animal to guess"
                  className="game-image"
                  // Apply zoom style if Beast Mode
                  style={isBeast ? {
                    transform: `scale(${zoomScale})`,
                    transition: 'transform 0.1s linear',
                  } : {}}
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/800x500?text=Image+unavailable";
                  }}
                />
              ) : (
                <div className="game-image-placeholder">
                  (No image provided)
                </div>
              )}
            </div>

            {/* Right Column: Controls */}
            <div className="game-controls-section">

              <div style={{ marginBottom: '1rem' }}>
                <div className="animal-name-label">Scientific Name</div>
                <div style={{ fontSize: '1.8rem', fontStyle: 'italic', fontWeight: 600, color: '#4caf50' }}>
                  {current.scientificName}
                </div>
              </div>

              <div>
                <div className="animal-name-label">Common Name</div>
                <div className={locked ? "animal-name-revealed" : "animal-name-hidden"}>
                  {locked ? current.name : "?"}
                </div>
              </div>

              {/* Hints (Only show in Easy Mode) */}
              {isEasy && wrongGuesses >= 1 && hint1 && (
                <div className="hint-box"><strong>Hint 1:</strong> {hint1}</div>
              )}
              {isEasy && wrongGuesses >= 2 && hint2 && (
                <div className="hint-box"><strong>Hint 2:</strong> {hint2}</div>
              )}

              <div className="input-group">
                <CountryDropdown setGuess={setGuess} value={guess} disabled={locked} />

                <button
                  className="btn primary-btn"
                  onClick={submitGuess}
                  disabled={!guess?.trim() || locked}
                >
                  Submit Guess
                </button>

                {/* Next Round Button (Hidden in Beast Mode as it auto-advances) */}
                {!isBeast && (
                  <button
                    className="btn secondary-btn"
                    onClick={nextRound}
                    disabled={!locked}
                  >
                    Next Round
                  </button>
                )}
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
    </div >
  );
}
