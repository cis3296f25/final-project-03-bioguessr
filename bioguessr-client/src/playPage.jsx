// bioguessr-client/src/playPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CountryDropdown from "./CountryDropdown.jsx";
import { getFeatureHint } from "./utils/hints.js";

// Only for the round counter UI (your server still supplies the animal)
const DEMO_TOTAL_ROUNDS = 4;

// Read ?mode=easy from the URL
function useIsEasyMode() {
  const { search } = useLocation();
  return new URLSearchParams(search).get("mode") === "easy";
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

  // Load animal for this round
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

  // Easy-mode hint from the current animal (after first wrong guess)
  const hint1 = useMemo(() => {
    if (!isEasy || !current || wrongGuesses < 1) return null;
    return getFeatureHint(current);
  }, [isEasy, current, wrongGuesses]);

  if (gameOver) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Game Over</h2>
        <p>
          Final score: <strong>{score}</strong>
        </p>
        <button onClick={() => navigate("/")}>Back To Home</button>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Couldn’t load the next animal.</h2>
        <button onClick={() => setRound((r) => r)}>Retry</button>
      </div>
    );
  }

  if (!current) {
    return <div style={{ padding: 16 }}>Loading animal for Round {round}...</div>;
  }

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
      setScore((s) => s + 100);
      setLocked(true);
      setFeedback(
        countryList.length > 0
          ? `Correct! You guessed ${userGuessClean}. (+100)`
          : "Correct! +100"
      );
      return;
    }

    // Wrong answer handling
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
      // In Normal mode, lock immediately after one guess (right or wrong)
      setLocked(true);
      setFeedback(
        `Not quite — this animal can be found in: ${answerLabel}.`
      );
    }
  }

  function nextRound() {
    // Advance the round; effect above will fetch a new animal and reset state
    setRound((r) => r + 1);
  }

  function restart() {
    navigate("/");
  }

  const imgSrc = current.image_url || current.imageUrl || "";

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          borderBottom: "1px solid #eee",
          paddingBottom: 16,
        }}
      >
        <img
          src={"../assets/logos/logorect.webp"}
          style={{ width: "30%", minWidth: 150, height: "auto" }}
          alt="Logo"
        />
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div>
              <strong>Score:</strong> {score}
            </div>
            <div>
              <strong>Round:</strong> {round} / {totalRounds}
            </div>
            <div>
              <strong>Mode:</strong> {isEasy ? "Easy" : "Normal"}
            </div>
          </div>
          <button onClick={restart}>Back To Home</button>
        </div>
      </header>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Image */}
        <div style={{ flex: 1.5, minWidth: 0 }}>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt="Animal to guess"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "500px",
                objectFit: "contain",
                borderRadius: 8,
                border: "1px solid #ddd",
                backgroundColor: "#f9f9f9",
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
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "#f9f9f9",
                color: "#666",
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
            <div style={{ fontSize: 14, color: "#666" }}>Animal Name</div>
            <div style={{ fontSize: 28, fontWeight: 700, minHeight: 36 }}>
              {locked ? current.name : "?"}
            </div>
          </div>

          {/* Country / Region (the “answer” you care about) */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: "#666" }}>Country / Region</div>
            <div style={{ fontSize: 20, fontWeight: 600, minHeight: 28 }}>
              {locked ? answerLabel : "?"}
            </div>
          </div>

          {/* Easy Mode Hint (single) */}
          {isEasy && wrongGuesses >= 1 && hint1 && (
            <div
              style={{
                border: "1px solid #444",
                borderRadius: 10,
                padding: "8px 12px",
                marginBottom: 8,
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
              style={{ padding: 12, fontSize: 16, fontWeight: "bold" }}
            >
              Submit Guess
            </button>

            <button
              onClick={nextRound}
              disabled={!locked}
              style={{ padding: 12, fontSize: 16 }}
            >
              Next Round
            </button>
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
  );
}

