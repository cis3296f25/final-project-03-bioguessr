// bioguessr-client/src/playPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CountryDropdown from "./CountryDropdown.jsx";
import { getFeatureHint } from "./utils/hints.js";

// Normal/Easy use a fixed number of rounds
const DEMO_TOTAL_ROUNDS = 4;

// BEAST MODE constants
const BEAST_MAX_LIVES = 3;
const BEAST_BASE_TIME = 7; // seconds at early rounds
const BEAST_MIN_TIME = 4; // never go below 4s

// Read ?mode=easy or ?mode=beast from the URL
function useMode() {
  const { search } = useLocation();
  const modeParam = new URLSearchParams(search).get("mode");
  if (modeParam === "easy") return "easy";
  if (modeParam === "beast") return "beast";
  return "normal";
}

// Helper: normalize countries list from the animal object
function getCountryList(animal) {
  if (!animal || !animal.countries) return [];
  const raw = animal.countries;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => (typeof c === "string" ? c.trim() : ""))
    .filter(Boolean);
}

// Helper: pretty string for revealing countries
function formatCountryAnswer(countries) {
  if (!countries || countries.length === 0) return "";
  if (countries.length === 1) return countries[0];
  if (countries.length <= 3) return countries.join(", ");
  return countries.slice(0, 3).join(", ") + ", ...";
}

// Compute the current time limit for BEAST mode based on round number
function computeBeastTimeLimit(round) {
  const decrements = Math.floor((round - 1) / 10); // every 10 rounds, -1s
  const limit = BEAST_BASE_TIME - decrements;
  return Math.max(BEAST_MIN_TIME, limit);
}

export default function PlayPage() {
  const mode = useMode();
  const isEasy = mode === "easy";
  const isBeast = mode === "beast";
  const navigate = useNavigate();

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0); // BEAST streak
  const [guess, setGuess] = useState("");
  const [current, setCurrent] = useState(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [loadError, setLoadError] = useState(false);

  // BEAST MODE: lives + timer
  const [lives, setLives] = useState(BEAST_MAX_LIVES);
  const [timeLimit, setTimeLimit] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const heartbeatRef = useRef(null); // audio element for heartbeat

  const totalRounds = DEMO_TOTAL_ROUNDS;

  // Derived: list of valid countries + label for revealing
  const countryList = useMemo(() => getCountryList(current), [current]);
  const answerCountryDisplay = useMemo(
    () => formatCountryAnswer(countryList),
    [countryList]
  );

  const fallbackRegion =
    current?.characteristics?.location ||
    current?.location ||
    current?.name ||
    "Unknown";

  // Shown in "Country / Region" field + wrong-answer feedback
  const answerLabel = answerCountryDisplay || fallbackRegion;

  // ---------- Game Over conditions ----------
  const roundsExceeded = !isBeast && round > totalRounds;
  const beastDead = isBeast && lives <= 0;
  const gameOver = roundsExceeded || beastDead;

  // ---------- Wrapper background per mode ----------
  const wrapperStyle = useMemo(() => {
    if (isBeast) {
      // Full dark + red danger aura
      const ratio =
        timeLimit && timeLeft != null && timeLimit > 0
          ? Math.max(0, Math.min(1, timeLeft / timeLimit))
          : 1;
      const danger = 1 - ratio;
      const vignette = `0 0 ${80 + 60 * danger}px rgba(255, 0, 0, ${
        0.25 + 0.25 * danger
      }) inset`;

      return {
        minHeight: "100vh",
        padding: 24,
        background:
          "radial-gradient(circle at top, #3b0008 0, #050006 55%, #000000 100%)",
        color: "#f9fafb",
        boxShadow: vignette,
      };
    }

    if (isEasy) {
      // Guppie mode – deep blue, slightly friendly
      return {
        minHeight: "100vh",
        padding: 24,
        background:
          "radial-gradient(circle at top, #05213e 0, #020617 60%, #000000 100%)",
        color: "#e0f2ff",
      };
    }

    // Monkey mode – jungle-ish green
    return {
      minHeight: "100vh",
      padding: 24,
      background:
        "radial-gradient(circle at top, #022c22 0, #020617 60%, #000000 100%)",
      color: "#e7f8ec",
    };
  }, [isBeast, isEasy, timeLimit, timeLeft]);

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
  }, [round, isBeast]);

  // ---------- BEAST MODE: setup heartbeat audio ----------
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
        // file should live at: /public/assets/audio/heartbeat.mp3
        const audio = new Audio("/assets/audio/heartbeat.mp3");
        audio.loop = true;
        audio.volume = 0.4;
        heartbeatRef.current = audio;
      } catch (err) {
        console.warn("Could not create heartbeat audio:", err);
      }
    }
  }, [isBeast]);

  // ---------- BEAST MODE: reset timer each round when animal is loaded ----------
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

  // ---------- BEAST MODE: timer tick effect ----------
  useEffect(() => {
    if (!isBeast || !current || locked || timeLimit == null || timeLeft == null) {
      return;
    }

    if (timeLeft <= 0) {
      // Time's up: treat as wrong answer
      if (!locked && lives > 0) {
        const penalty = Math.floor(score / 3);
        const newScore = Math.max(0, score - penalty);

        setLocked(true);
        setScore(newScore);
        setLives((prev) => Math.max(0, prev - 1));
        setStreak(0);
        setFeedback(
          `Time's up — this animal can be found in: ${answerLabel}. (-${penalty})`
        );
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
  }, [isBeast, current, locked, timeLeft, timeLimit, lives, score, answerLabel]);

  // ---------- BEAST MODE: heartbeat speed control ----------
  useEffect(() => {
    if (!isBeast) return;
    const audio = heartbeatRef.current;
    if (!audio || timeLimit == null || timeLeft == null) return;

    // If round is locked or game over, pause
    if (locked || lives <= 0 || timeLeft <= 0) {
      audio.pause();
      return;
    }

    // ratio = 1 at start (calm), 0 at end (panic)
    const ratio = Math.max(0, Math.min(1, timeLeft / timeLimit));
    const minRate = 1.0;
    const maxRate = 1.8; // pretty anxious at the end
    const rate = maxRate - (maxRate - minRate) * ratio; // start near 1.0, end near 1.8

    audio.playbackRate = rate;
    audio
      .play()
      .catch(() => {
        // ignore autoplay errors
      });

    return () => {
      audio.pause();
    };
  }, [isBeast, timeLeft, timeLimit, locked, lives]);

  // ---------- BEAST MODE: auto-advance after result ----------
  useEffect(() => {
    if (!isBeast) return;
    if (!locked) return;
    if (lives <= 0) return; // game over handled separately

    const id = setTimeout(() => {
      setRound((r) => r + 1);
    }, 750); // little pause to let them see result

    return () => clearTimeout(id);
  }, [isBeast, locked, lives]);

  // ---------- Easy-mode hint from the current animal (after first wrong guess) ----------
  const hint1 = useMemo(() => {
    if (!isEasy || !current || wrongGuesses < 1) return null;
    return getFeatureHint(current);
  }, [isEasy, current, wrongGuesses]);

  // ---------- Zoom scale for BEAST MODE (with subtle pulse) ----------
  const zoomScale = useMemo(() => {
    if (!isBeast || !timeLimit || timeLeft == null) return 1;
    const ratio = Math.max(0, Math.min(1, timeLeft / timeLimit));
    const maxScale = 2.1; // zoomed in at start
    const minScale = 1.0; // normal at end
    const baseScale = minScale + (maxScale - minScale) * ratio;

    const danger = 1 - ratio;
    const phase = (timeLimit - timeLeft) * 10; // just a number to wiggle a bit
    const pulse = danger > 0.3 ? 0.03 * Math.sin(phase) * danger : 0;

    return baseScale + pulse;
  }, [isBeast, timeLimit, timeLeft]);

  // ---------- Dramatic timer UI (color + "panic" effect) ----------
  const { timerDisplay, timerStyle } = useMemo(() => {
    if (!isBeast || timeLimit == null || timeLeft == null) {
      return {
        timerDisplay: "--",
        timerStyle: {
          padding: "2px 8px",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          minWidth: 60,
          textAlign: "right",
          background: "#eee",
          color: "#555",
        },
      };
    }

    const display = `${timeLeft.toFixed(1)}s`;
    const ratio = Math.max(0, Math.min(1, timeLeft / timeLimit));

    // Base style
    const style = {
      padding: "6px 16px",
      borderRadius: 999,
      fontWeight: 800,
      minWidth: 80,
      textAlign: "center",
      transition:
        "color 0.1s linear, background 0.1s linear, transform 0.1s linear, box-shadow 0.1s linear",
    };

    if (ratio > 0.6) {
      // Plenty of time – calm golden
      return {
        timerDisplay: display,
        timerStyle: {
          ...style,
          fontSize: 16,
          background: "#fff4bf",
          color: "#5e4100",
          boxShadow: "0 0 12px rgba(255, 215, 0, 0.5)",
          transform: "scale(1)",
        },
      };
    }

    if (ratio > 0.3) {
      // Mid danger – amber
      return {
        timerDisplay: display,
        timerStyle: {
          ...style,
          fontSize: 17,
          background: "#ffd9b3",
          color: "#8a3b00",
          boxShadow: "0 0 14px rgba(255, 140, 0, 0.7)",
          transform: "scale(1.07)",
        },
      };
    }

    // Critical – big red + glow + slight shake
    const shake = timeLeft > 0 ? (timeLeft * 10) % 2 === 0 ? "-1px" : "1px" : "0";

    return {
      timerDisplay: display,
      timerStyle: {
        ...style,
        fontSize: 18,
        background: "#ffe1e1",
        color: "#ff1f3b",
        boxShadow: "0 0 18px rgba(255, 0, 0, 0.95)",
        transform: `scale(1.16) translateX(${shake})`,
      },
    };
  }, [isBeast, timeLeft, timeLimit]);

  // ---------- Mode label ----------
  let modeLabel;
  if (isBeast) modeLabel = "BEAST MODE 🐯";
  else if (isEasy) modeLabel = "Guppie Mode 🐟";
  else modeLabel = "Monkey Mode 🐒";

  // ---------- Early returns for game state ----------
  if (gameOver) {
    return (
      <div style={wrapperStyle}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
          <h2>Game Over</h2>
          {beastDead ? (
            <p>You ran out of lives in BEAST MODE.</p>
          ) : (
            <p>You completed all rounds.</p>
          )}
          <p>
            Final score: <strong>{score}</strong>
          </p>
          {isBeast && <p>Highest streak (this run): x{streak}</p>}
          <button onClick={() => navigate("/")}>Back To Home</button>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={wrapperStyle}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
          <h2>Couldn’t load the next animal.</h2>
          <button onClick={() => setRound((r) => r)}>Retry</button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div style={wrapperStyle}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
          Loading animal for Round {round}...
        </div>
      </div>
    );
  }

  // ---------- Guess submission ----------
  function submitGuess() {
    if (!current || !guess?.trim() || locked) return;

    const normalizedGuess = guess.trim().toLowerCase();
    let correct = false;

    // PRIMARY RULE: compare guess to any of the animal's countries
    if (countryList.length > 0) {
      correct = countryList.some(
        (c) => c.trim().toLowerCase() === normalizedGuess
      );
    } else {
      // Fallback: compare to animal name (should rarely happen)
      correct =
        normalizedGuess === String(current.name || "").trim().toLowerCase();
    }

    if (correct) {
      const userGuessClean = guess.trim();

      if (isBeast) {
        const newStreak = streak + 1;
        const basePoints = 100;
        const roundBonus = Math.max(0, (round - 1) * 5);

        const timeRatio =
          timeLimit && timeLeft != null && timeLimit > 0
            ? Math.max(0, Math.min(1, timeLeft / timeLimit))
            : 0;

        const timeBonus = Math.round(20 * timeRatio); // up to +20 per correct if fast
        const pointsPerStreak = basePoints + roundBonus + timeBonus;
        const gained = pointsPerStreak * newStreak;

        setStreak(newStreak);
        setScore((s) => s + gained);
        setLocked(true);
        setFeedback(
          `Correct! ${userGuessClean} is in range. Streak x${newStreak} (+${gained}).`
        );
      } else {
        const points = 100;
        setScore((s) => s + points);
        setLocked(true);
        setFeedback(
          countryList.length > 0
            ? `Correct! You guessed ${userGuessClean}. (+${points})`
            : `Correct! (+${points})`
        );
      }

      return;
    }

    // ----- WRONG ANSWER HANDLING -----
    if (isBeast) {
      // BEAST: lose life + lose 1/3 of current score + reset streak
      const penalty = Math.floor(score / 3);
      const newScore = Math.max(0, score - penalty);

      setScore(newScore);
      setLives((prev) => Math.max(0, prev - 1));
      setStreak(0);
      setLocked(true);
      setFeedback(
        `Not quite — this animal can be found in: ${answerLabel}. (-${penalty})`
      );
      return;
    }

    if (isEasy) {
      // Easy mode: 2 guesses total, 1 hint after the first wrong guess
      setWrongGuesses((n) => {
        const next = n + 1;

        if (next >= 2) {
          setLocked(true);
          setFeedback(
            `Not quite — this animal can be found in: ${answerLabel}.`
          );
        } else {
          setFeedback("Not quite — here's a habitat hint!");
        }

        return next;
      });
    } else {
      // Normal mode: lock immediately after one guess (right or wrong)
      setLocked(true);
      setFeedback(
        `Not quite — this animal can be found in: ${answerLabel}.`
      );
    }
  }

  function nextRound() {
    setRound((r) => r + 1);
  }

  function restart() {
    navigate("/");
  }

  const imgSrc = current.image_url || current.imageUrl || "";

  // Image card styling differs per mode a bit
  const imageCardStyle = isBeast
    ? {
        flex: 1.5,
        minWidth: 0,
        overflow: "hidden",
        borderRadius: 18,
        border: "2px solid #ff1f3b",
        boxShadow: "0 0 28px rgba(255, 0, 0, 0.6)",
        background: "#050109",
        padding: 6,
      }
    : {
        flex: 1.5,
        minWidth: 0,
        overflow: "hidden",
        borderRadius: 18,
        border: isEasy ? "2px solid #2563eb" : "2px solid #16a34a",
        boxShadow: isEasy
          ? "0 0 20px rgba(37,99,235,0.4)"
          : "0 0 20px rgba(22,163,74,0.35)",
        background: "#050609",
        padding: 6,
      };

  return (
    <div style={wrapperStyle}>
      <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            paddingBottom: 16,
          }}
        >
          <img
            src={"../assets/logos/logorect.webp"}
            style={{ width: "30%", minWidth: 150, height: "auto" }}
            alt="Logo"
          />
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div>
                <strong>Score:</strong> {score}
              </div>
              <div>
                <strong>Round:</strong>{" "}
                {isBeast ? round : `${round} / ${totalRounds}`}
              </div>
              <div>
                <strong>Mode:</strong> {modeLabel}
              </div>
              {isBeast && (
                <>
                  <div>
                    <strong>Lives:</strong>{" "}
                    {lives > 0 ? "❤️".repeat(lives) : "💀"}
                  </div>
                  <div>
                    <strong>Streak:</strong> x{streak}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <strong>Time:</strong>
                    <span style={timerStyle}>{timerDisplay}</span>
                  </div>
                </>
              )}
            </div>
            <button onClick={restart}>Back To Home</button>
          </div>
        </header>

        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* Image */}
          <div style={imageCardStyle}>
            {imgSrc ? (
              <img
                src={imgSrc}
                alt="Animal to guess"
                style={{
                  width: "100%",
                  height: "100%",
                  maxHeight: "500px",
                  objectFit: "cover",
                  borderRadius: 12,
                  transform: `scale(${zoomScale})`,
                  transformOrigin: "center center",
                  transition: "transform 0.1s linear",
                }}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/800x500?text=Image+unavailable";
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 320,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 12,
                  background: "#111827",
                  color: "#9ca3af",
                }}
              >
                (No image provided)
              </div>
            )}
          </div>

          {/* Right panel */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Animal Name (revealed after lock) */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, opacity: 0.7 }}>Animal Name</div>
              <div style={{ fontSize: 28, fontWeight: 700, minHeight: 36 }}>
                {locked ? current.name : "?"}
              </div>
            </div>

            {/* Country / Region (the “answer” you care about) */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, opacity: 0.7 }}>Country / Region</div>
              <div style={{ fontSize: 20, fontWeight: 600, minHeight: 28 }}>
                {locked ? answerLabel : "?"}
              </div>
            </div>

            {/* Easy Mode Hint (single) */}
            {isEasy && wrongGuesses >= 1 && hint1 && (
              <div
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.6)",
                  borderRadius: 10,
                  padding: "8px 12px",
                  marginBottom: 8,
                  background: "rgba(15, 23, 42, 0.7)",
                }}
              >
                <strong>Hint:</strong> {hint1}
              </div>
            )}

            {/* Guess input (autocomplete) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <CountryDropdown setGuess={setGuess} />

              <button
                onClick={submitGuess}
                disabled={!guess?.trim() || locked}
                style={{
                  padding: 12,
                  fontSize: 16,
                  fontWeight: "bold",
                  background: "#111827",
                  color: "#f9fafb",
                  border: "1px solid rgba(148, 163, 184, 0.7)",
                  borderRadius: 999,
                  cursor:
                    !guess?.trim() || locked ? "not-allowed" : "pointer",
                  opacity: !guess?.trim() || locked ? 0.6 : 1,
                }}
              >
                Submit Guess
              </button>

              {/* Next Round ONLY for non-BEAST modes */}
              {!isBeast && (
                <button
                  onClick={nextRound}
                  disabled={!locked}
                  style={{
                    padding: 12,
                    fontSize: 16,
                    background: "transparent",
                    color: "#e5e7eb",
                    borderRadius: 999,
                    border: "1px solid rgba(148, 163, 184, 0.6)",
                    cursor: locked ? "pointer" : "not-allowed",
                    opacity: locked ? 1 : 0.5,
                  }}
                >
                  Next Round
                </button>
              )}
            </div>

            <p
              style={{
                minHeight: 24,
                marginTop: 16,
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              {feedback}
            </p>

            {isEasy && (
              <p style={{ marginTop: 8, fontSize: 14, opacity: 0.85 }}>
                Wrong guesses: {wrongGuesses}/2
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
