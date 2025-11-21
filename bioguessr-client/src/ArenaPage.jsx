// bioguessr-client/src/ArenaPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import CountryDropdown from "./CountryDropdown.jsx";
import { AUGMENTS } from "./arenaAugments";
import bgImage from "../assets/homePageBG.png";
import logoImage from "../assets/logos/logorect.webp";

// --------- Arena constants ---------
const START_HP = 10; // more intense: only 10 HP total
const QUESTIONS_PER_STAGE = 4;
const MAX_STAGE = 4; // 4 stages, then boss

// --------- Final Doom configs ---------
const DOOM_CONFIGS = {
  bronze: {
    id: "bronze",
    label: "Bronze Trial",
    description:
      "Slower timer, no blur. +20% score. One mistake allowed (you just lose HP).",
    baseTime: 12,
    minTime: 4,
    stepQ: 3,
    stepAmount: 1,
    scoreMultiplier: 1.2,
    strikes: 1,
    extraBlur: false,
    extraZoom: false,
  },
  silver: {
    id: "silver",
    label: "Silver Trial",
    description:
      "Faster timer, no blur. +60% score. One wrong answer ends the run.",
    baseTime: 10,
    minTime: 3,
    stepQ: 2,
    stepAmount: 2,
    scoreMultiplier: 1.6,
    strikes: 0,
    extraBlur: false,
    extraZoom: false,
  },
  gold: {
    id: "gold",
    label: "Gold Doom",
    description:
      "Blurred, fast, insane speed. ~3x score. One mistake and you’re done.",
    baseTime: 7,
    minTime: 2,
    stepQ: 1,
    stepAmount: 1,
    scoreMultiplier: 3.0,
    strikes: 0,
    extraBlur: true,
    extraZoom: true,
  },
};

// Score thresholds for unlocking Doom tiers
const DOOM_THRESHOLDS = {
  bronze: 0, // always available
  silver: 600,
  gold: 1200,
};

// Helper to normalize country list
function getCountryList(animal) {
  if (!animal || !animal.countries) return [];
  if (!Array.isArray(animal.countries)) return [];
  return animal.countries
    .map((c) => (typeof c === "string" ? c.trim().toLowerCase() : ""))
    .filter(Boolean);
}

// Weighted random augments by rarity
function pickAugmentChoices(count = 3) {
  const weights = {
    common: 1,
    rare: 0.6,
    epic: 0.25,
    legendary: 0.1,
  };

  const pool = AUGMENTS.flatMap((a) => {
    const w = weights[a.rarity] ?? 1;
    const copies = Math.round(w * 10);
    return Array(copies).fill(a);
  });

  const choices = [];
  const usedIds = new Set();
  while (choices.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const aug = pool[idx];
    pool.splice(idx, 1);
    if (usedIds.has(aug.id)) continue;
    usedIds.add(aug.id);
    choices.push(aug);
  }
  return choices;
}

export default function ArenaPage() {
  const navigate = useNavigate();

  // Core state
  // modes: 'question' | 'augment' | 'doomSelect' | 'doom' | 'gameOver'
  const [mode, setMode] = useState("question");
  const [stage, setStage] = useState(1);
  const [qInStage, setQInStage] = useState(1);
  const [round, setRound] = useState(1);

  const [hp, setHp] = useState(START_HP);
  const [score, setScore] = useState(0);

  const [current, setCurrent] = useState(null);
  const [guess, setGuess] = useState("");
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [questionKey, setQuestionKey] = useState(0);
  const [loadError, setLoadError] = useState(false);

  // Augment state
  const [augmentChoices, setAugmentChoices] = useState([]);
  const [globalMultiplier, setGlobalMultiplier] = useState(1);
  const [safeGuardRemaining, setSafeGuardRemaining] = useState(0);
  const [flurryRemaining, setFlurryRemaining] = useState(0);
  const [heartyApplied, setHeartyApplied] = useState(false);

  // Additional augments
  const [shieldedRemaining, setShieldedRemaining] = useState(0); // Shielded Shell
  const [leechRemaining, setLeechRemaining] = useState(0); // Leech Vines
  const [foresightRemaining, setForesightRemaining] = useState(0); // Clairvoyance

  // Legendary flags
  const [oneHpOath, setOneHpOath] = useState(false); // HP capped at 1
  const [zoomCurse, setZoomCurse] = useState(false); // permanent zoom-in
  const [blurCurse, setBlurCurse] = useState(false); // permanent blur

  // Duel (self-challenge) augment
  const [duelPending, setDuelPending] = useState(false);

  // Final Doom state
  const [doomTier, setDoomTier] = useState(null); // 'bronze' | 'silver' | 'gold'
  const [doomQuestionCount, setDoomQuestionCount] = useState(0);
  const [doomTimeLimit, setDoomTimeLimit] = useState(null);
  const [doomTimeLeft, setDoomTimeLeft] = useState(null);
  const [doomStrikesLeft, setDoomStrikesLeft] = useState(0);

  const gameOver = mode === "gameOver";

  // --------- Load animal whenever questionKey changes ---------
  useEffect(() => {
    if (mode === "augment" || mode === "gameOver") return;

    let cancelled = false;

    (async () => {
      try {
        setLoadError(false);
        const res = await fetch("/api/play");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const animal = await res.json();
        if (cancelled) return;

        setCurrent(animal || null);
        setGuess("");
        setLocked(false);
        setFeedback("");
      } catch (err) {
        console.error("Arena /api/play error:", err);
        if (!cancelled) {
          setLoadError(true);
          setCurrent(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [questionKey, mode]);

  // Kick off the very first question
  useEffect(() => {
    setQuestionKey((k) => k + 1);
  }, []);

  // --------- Final Doom: compute time limit for each question ---------
  useEffect(() => {
    if (mode !== "doom" || !doomTier) {
      setDoomTimeLimit(null);
      setDoomTimeLeft(null);
      return;
    }
    const cfg = DOOM_CONFIGS[doomTier];
    const qIndex = doomQuestionCount || 1;
    const decrements = Math.floor((qIndex - 1) / cfg.stepQ);
    const limit = Math.max(
      cfg.minTime,
      cfg.baseTime - decrements * cfg.stepAmount
    );
    setDoomTimeLimit(limit);
    setDoomTimeLeft(limit);
  }, [mode, doomTier, doomQuestionCount]);

  // --------- Final Doom: timer tick ---------
  useEffect(() => {
    if (mode !== "doom") return;
    if (doomTimeLimit == null || doomTimeLeft == null) return;
    if (locked) return;

    if (doomTimeLeft <= 0) {
      handleDoomTimeout();
      return;
    }

    const id = setInterval(() => {
      setDoomTimeLeft((t) => {
        if (t == null) return t;
        const next = t - 0.1;
        return next <= 0 ? 0 : Number(next.toFixed(1));
      });
    }, 100);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, doomTimeLeft, doomTimeLimit, locked]);

  // --------- Helpers for state transitions ---------
  function startNextQuestion(newStage, newQInStage, newMode = "question") {
    setStage(newStage);
    setQInStage(newQInStage);
    setMode(newMode);
    setRound((r) => r + 1);
    setQuestionKey((k) => k + 1);
  }

  function startAugmentPhase() {
    setMode("augment");
    setAugmentChoices(pickAugmentChoices(3));
  }

  function startDoomSelection() {
    setMode("doomSelect");
  }

  function startDoomTier(tierId) {
    const cfg = DOOM_CONFIGS[tierId];
    if (!cfg) return;
    setDoomTier(tierId);
    setDoomQuestionCount(1);
    setDoomStrikesLeft(cfg.strikes);
    setMode("doom");
    setRound((r) => r + 1);
    setQuestionKey((k) => k + 1);
  }

  function endGame(reason) {
    console.log("Arena game over:", reason);
    setMode("gameOver");
  }

  // --------- Guess evaluation shared by normal + doom ---------
  const countryList = useMemo(() => getCountryList(current), [current]);

  function clampHp(value) {
    let v = value;
    if (oneHpOath && v > 1) v = 1;
    return v;
  }

  function evaluateGuess() {
    if (!current || !guess?.trim()) return { correct: false };

    const normalized = guess.trim().toLowerCase();
    const hit = countryList.some((c) => c === normalized);
    return { correct: hit };
  }

  // --------- Normal stage question handling ---------
  function handleSubmitQuestion() {
    if (!current || !guess?.trim() || locked || mode !== "question") return;

    const { correct } = evaluateGuess();

    // snapshot active augments for this question
    const hasSafe = safeGuardRemaining > 0;
    const hasFlurry = flurryRemaining > 0;
    const hasShield = shieldedRemaining > 0;
    const hasLeech = leechRemaining > 0;
    const hasForesight = foresightRemaining > 0;
    const hasDuel = duelPending;

    // consume 1 charge of any per-question augments
    if (hasSafe) setSafeGuardRemaining((n) => Math.max(0, n - 1));
    if (hasFlurry) setFlurryRemaining((n) => Math.max(0, n - 1));
    if (hasShield) setShieldedRemaining((n) => Math.max(0, n - 1));
    if (hasLeech) setLeechRemaining((n) => Math.max(0, n - 1));
    if (hasForesight) setForesightRemaining((n) => Math.max(0, n - 1));
    if (hasDuel) setDuelPending(false); // one-shot

    let basePoints = 100;
    let hpLoss = 1;

    // Safety Net: no HP loss, -30% points
    if (hasSafe) {
      hpLoss = 0;
      basePoints = Math.round(basePoints * 0.7);
    }

    // Flurry Gambit: +20% points, wrong = 2 damage
    if (hasFlurry) {
      basePoints = Math.round(basePoints * 1.2);
      hpLoss = 2;
    }

    // Shielded Shell: -25% points, half HP damage
    if (hasShield) {
      basePoints = Math.round(basePoints * 0.75);
      hpLoss = Math.max(1, Math.ceil(hpLoss / 2));
    }

    // Clairvoyance: -20% points (common name reveal handled in UI)
    if (hasForesight) {
      basePoints = Math.round(basePoints * 0.8);
    }

    // Duel Flurry: triple points on this question if correct
    if (correct && hasDuel) {
      basePoints = Math.round(basePoints * 3);
    }

    if (correct) {
      let newHp = hp;

      // Leech Vines: heal 1 HP on correct, -25% points
      if (hasLeech) {
        basePoints = Math.round(basePoints * 0.75);
        newHp = clampHp(newHp + 1);
      }

      const gained = Math.round(basePoints * globalMultiplier);
      setHp(newHp);
      setScore((s) => s + gained);
      setFeedback(
        hasDuel ? `Duel Won! (+${gained})` : `Correct! (+${gained})`
      );
    } else {
      // wrong
      let loss = hpLoss;

      if (hasDuel) {
        const duelLoss = Math.ceil(hp / 2);
        loss = Math.max(loss, duelLoss);
      }

      const newHp = clampHp(hp - loss);
      setHp(newHp);

      if (newHp <= 0) {
        if (hasDuel) {
          setFeedback("Duel Lost! You were knocked out.");
        } else {
          setFeedback(
            loss === 0 ? "Wrong! (No HP lost.)" : `Wrong! (-${loss} HP)`
          );
        }
        setLocked(true);
        setTimeout(() => endGame("hp-zero"), 800);
        return;
      } else {
        if (hasDuel) {
          setFeedback("Duel Lost! You took massive damage.");
        } else {
          setFeedback(
            loss === 0 ? "Wrong! (No HP lost.)" : `Wrong! (-${loss} HP)`
          );
        }
      }
    }

    setLocked(true);

    // Move to next stage / question after a short delay
    setTimeout(() => {
      const nextQ = qInStage + 1;
      if (nextQ > QUESTIONS_PER_STAGE) {
        // Stage complete
        if (stage >= MAX_STAGE) {
          // After stage 4 -> go to Final Boss selection
          startDoomSelection();
        } else {
          startAugmentPhase();
        }
      } else {
        startNextQuestion(stage, nextQ, "question");
      }
    }, 750);
  }

  // --------- Final Doom scoring ---------
  function doomScoring(correct) {
    if (!doomTier) return;
    const cfg = DOOM_CONFIGS[doomTier];

    if (correct) {
      const ratio =
        doomTimeLimit && doomTimeLeft != null && doomTimeLimit > 0
          ? Math.max(0, Math.min(1, doomTimeLeft / doomTimeLimit))
          : 0;

      const base = 120 * cfg.scoreMultiplier;
      const speedBonus = Math.round(80 * ratio * cfg.scoreMultiplier);
      const gained = Math.round((base + speedBonus) * globalMultiplier);

      setScore((s) => s + gained);
      setFeedback(`${cfg.label}: Correct! (+${gained})`);
      return;
    }

    // Wrong answer in Doom
    if (cfg.strikes > 0 && doomStrikesLeft > 0) {
      setDoomStrikesLeft((n) => n - 1);
      setHp((hPrev) => {
        const newHp = clampHp(hPrev - 3);
        if (newHp <= 0) {
          setFeedback("You fell in the Doom Trial!");
          setLocked(true);
          setTimeout(() => endGame("doom-death"), 700);
        } else {
          setFeedback("Wrong! You used up a strike (-3 HP).");
        }
        return newHp;
      });
      return;
    }

    // No strikes left -> instant fail
    setFeedback(`${cfg.label}: One mistake and you're out.`);
    setLocked(true);
    setTimeout(() => endGame("doom-fail"), 700);
  }

  function handleDoomSubmit() {
    if (!current || !guess?.trim() || locked || mode !== "doom") return;
    const { correct } = evaluateGuess();
    doomScoring(correct);

    if (correct) {
      setLocked(true);
      setTimeout(() => {
        setLocked(false);
        setDoomQuestionCount((n) => n + 1);
        setQuestionKey((k) => k + 1);
      }, 600);
    }
  }

  function handleDoomTimeout() {
    if (locked || mode !== "doom") return;
    doomScoring(false);
  }

  // --------- Augment selection ---------
  function pickAugment(augment) {
    if (!augment) return;

    switch (augment.id) {
      case "safe_guard":
        setSafeGuardRemaining((n) => n + 4);
        break;
      case "blood_pact":
        setHp((h) => clampHp(Math.max(0, h - 3)));
        setGlobalMultiplier((m) => m * 2);
        break;
      case "flurry_gambit":
        setFlurryRemaining((n) => n + 4);
        break;
      case "hearty":
        if (!heartyApplied) {
          setHeartyApplied(true);
          setHp((h) => clampHp(h + 5));
          setGlobalMultiplier((m) => m * 0.8);
        }
        break;

      // Shielded Shell
      case "shielded_shell":
        setShieldedRemaining((n) => n + 4);
        break;

      // Leech Vines
      case "leech_vines":
        setLeechRemaining((n) => n + 4);
        break;

      // Clairvoyance
      case "clairvoyance":
        setForesightRemaining((n) => n + 3);
        break;

      // LEGENDARIES
      case "last_life_lens":
        setOneHpOath(true);
        setZoomCurse(true);
        setHp(1); // force to 1
        setGlobalMultiplier((m) => m * 3);
        break;

      case "phantom_shroud":
        setBlurCurse(true);
        setGlobalMultiplier((m) => m * 2.5);
        break;

      case "eternal_flurry":
        setFlurryRemaining(999);
        break;

      // Duel (self-challenge)
      case "duel_flurry":
        setDuelPending(true);
        break;

      default:
        break;
    }

    // After augment: next stage or doom selection if we just finished stage 4
    if (stage >= MAX_STAGE) {
      if (hp <= 0) {
        endGame("hp-zero-after-augment");
      } else {
        startDoomSelection();
      }
    } else {
      const nextStage = stage + 1;
      startNextQuestion(nextStage, 1, "question");
    }
  }

  // --------- Game Over screen ---------
  if (gameOver) {
    return (
      <div
        className="app-container"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="overlay">
          <div
            className="glass-card game-card"
            style={{ justifyContent: "center", minHeight: "auto" }}
          >
            <h2
              className="title"
              style={{ color: hp <= 0 ? "#ff5252" : "#ffd700" }}
            >
              Arena – Game Over
            </h2>
            <p className="subtitle" style={{ marginTop: "1rem" }}>
              Final Score: <strong>{score}</strong>
            </p>
            <p style={{ marginTop: "0.5rem" }}>Stage reached: {stage}</p>
            <button
              className="btn primary-btn"
              style={{ marginTop: "1.5rem", maxWidth: 260 }}
              onClick={() => navigate("/")}
            >
              Back To Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------- Error / loading ---------
  if (loadError) {
    return (
      <div
        className="app-container"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="overlay">
          <div
            className="glass-card game-card"
            style={{ justifyContent: "center", minHeight: "auto" }}
          >
            <h2>Error loading Arena question.</h2>
            <button
              className="btn secondary-btn"
              onClick={() => setQuestionKey((k) => k + 1)}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div
        className="app-container"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="overlay">
          <div
            className="glass-card game-card"
            style={{ justifyContent: "center", minHeight: "auto" }}
          >
            <h2>Loading Arena...</h2>
          </div>
        </div>
      </div>
    );
  }

  // --------- Derived render values ---------
  const isDoom = mode === "doom";
  const doomTimerColor =
    isDoom && doomTimeLimit
      ? doomTimeLeft / doomTimeLimit < 0.3
        ? "#ff5252"
        : doomTimeLeft / doomTimeLimit < 0.6
        ? "#ff9800"
        : "#4caf50"
      : "#4caf50";

  const imgSrc = current.image_url || current.imageUrl || "";

  // Clairvoyance: show common name early
  const showCommonName = locked || foresightRemaining > 0;

  // Stage label swaps to Final Boss when in doom modes
  const stageLabel =
    mode === "doom" || mode === "doomSelect" ? "Final Boss" : stage;

  const baseImageBorder = isDoom
    ? `2px solid ${doomTimerColor}`
    : "2px solid #444";

  const cfg = doomTier ? DOOM_CONFIGS[doomTier] : null;

  const doomExtra =
    isDoom && doomTimeLimit && doomTimeLeft != null
      ? (doomTimeLimit - doomTimeLeft) / (doomTimeLimit * 3)
      : 0;

  let imageScale = isDoom ? 1.05 + doomExtra : 1;
  if (zoomCurse || (isDoom && cfg?.extraZoom)) {
    imageScale *= 1.6;
  }

  const shouldBlurExtraDoom = isDoom && cfg?.extraBlur;
  const blurOn = blurCurse || shouldBlurExtraDoom;
  const blurAmount = shouldBlurExtraDoom ? 14 : 10;

  const imageStyle = {
    border: baseImageBorder,
    transform: `scale(${imageScale})`,
    transition: isDoom || zoomCurse ? "transform 0.08s linear" : undefined,
    filter: blurOn
      ? `blur(${blurAmount}px) contrast(0.9) brightness(0.9)`
      : "none",
  };

  // Which Doom tiers are unlocked by score?
  const bronzeAvailable = score >= DOOM_THRESHOLDS.bronze;
  const silverAvailable = score >= DOOM_THRESHOLDS.silver;
  const goldAvailable = score >= DOOM_THRESHOLDS.gold;

  // --------- Main render ---------
  return (
    <div
      className="app-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="overlay">
        <div className="glass-card game-card">
          {/* Header */}
          <header className="game-header">
            <img src={logoImage} className="header-logo" alt="BioGuessr" />
            <div className="game-stats">
              <div>
                HP:{" "}
                <span
                  style={{
                    color: hp <= 3 ? "#ff5252" : "#4caf50",
                    fontWeight: "bold",
                  }}
                >
                  {hp}
                </span>
              </div>
              <div>
                Score:{" "}
                <span style={{ color: "#ffd700", fontWeight: "bold" }}>
                  {score}
                </span>
              </div>
              <div>Stage: {stageLabel}</div>
              <div>Round: {round}</div>
              {globalMultiplier !== 1 && (
                <div>Score Multiplier: x{globalMultiplier.toFixed(2)}</div>
              )}
              {safeGuardRemaining > 0 && (
                <div>Safety Net: {safeGuardRemaining} Q</div>
              )}
              {flurryRemaining > 0 && <div>Flurry: {flurryRemaining} Q</div>}
              {shieldedRemaining > 0 && (
                <div>Shielded: {shieldedRemaining} Q</div>
              )}
              {leechRemaining > 0 && (
                <div>Leech Vines: {leechRemaining} Q</div>
              )}
              {foresightRemaining > 0 && (
                <div>Clairvoyance: {foresightRemaining} Q</div>
              )}
              {oneHpOath && <div>Legendary: Last Life (HP max 1)</div>}
              {zoomCurse && <div>Legendary: Zoomed View</div>}
              {blurCurse && <div>Legendary: Blurred Vision</div>}
              {duelPending && (
                <div>Duel Flurry armed: next guess is high stakes</div>
              )}
              {isDoom && (
                <div style={{ fontWeight: "bold", color: doomTimerColor }}>
                  {doomTimeLeft != null ? doomTimeLeft.toFixed(1) + "s" : "--"}
                </div>
              )}
              {isDoom && cfg && cfg.strikes > 0 && (
                <div>Strikes left: {doomStrikesLeft}</div>
              )}
            </div>
            <button
              className="btn secondary-btn"
              style={{ width: "auto", padding: "0.5em 1em" }}
              onClick={() => navigate("/")}
            >
              Exit
            </button>
          </header>

          {/* Main layout */}
          <div className="game-layout">
            {/* Image */}
            <div className="game-image-section">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt="Arena animal"
                  className="game-image"
                  style={imageStyle}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/800x500?text=Image+unavailable";
                  }}
                />
              ) : (
                <div className="game-image-placeholder">(No image)</div>
              )}
            </div>

            {/* Controls */}
            <div className="game-controls-section">
              <div style={{ marginBottom: "1rem" }}>
                <div className="animal-name-label">Scientific Name</div>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontStyle: "italic",
                    fontWeight: 600,
                    color: "#4caf50",
                  }}
                >
                  {current.scientificName}
                </div>
              </div>

              <div>
                <div className="animal-name-label">Common Name</div>
                <div
                  className={
                    showCommonName
                      ? "animal-name-revealed"
                      : "animal-name-hidden"
                  }
                >
                  {showCommonName ? current.name : "?"}
                </div>
              </div>

              <div className="input-group">
                <CountryDropdown setGuess={setGuess} disabled={locked} />

                <button
                  className="btn primary-btn"
                  onClick={isDoom ? handleDoomSubmit : handleSubmitQuestion}
                  disabled={!guess?.trim() || locked}
                >
                  {isDoom ? "Lock In (Boss)" : "Submit Guess"}
                </button>
              </div>

              <p
                className="feedback-text"
                style={{
                  color: feedback.startsWith("Correct") ? "#4caf50" : "#ff5252",
                }}
              >
                {feedback}
              </p>
            </div>
          </div>
        </div>

        {/* Augment selection modal */}
        {mode === "augment" && (
          <div className="modal-overlay" onClick={() => {}}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 620 }}
            >
              <h2>Choose an Augment</h2>
              <p style={{ marginBottom: "1rem" }}>
                Stage {stage} complete! Pick one bonus for the next stage.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                {augmentChoices.map((aug) => (
                  <button
                    key={aug.id}
                    className="btn primary-btn"
                    style={{
                      flex: "1 1 30%",
                      minWidth: "180px",
                      whiteSpace: "normal",
                      padding: "0.75rem",
                      backgroundColor:
                        aug.rarity === "legendary"
                          ? "#b8860b"
                          : aug.rarity === "epic"
                          ? "#7b1fa2"
                          : aug.rarity === "rare"
                          ? "#1565c0"
                          : "#424242",
                    }}
                    onClick={() => pickAugment(aug)}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: 4,
                      }}
                    >
                      {aug.name}{" "}
                      <span style={{ fontSize: 12, opacity: 0.85 }}>
                        ({aug.rarity.toUpperCase()})
                      </span>
                    </div>
                    <div style={{ fontSize: 13 }}>{aug.description}</div>
                  </button>
                ))}
              </div>
              <button
                className="btn modal-btn"
                style={{ marginTop: "1rem" }}
                onClick={() =>
                  pickAugment(
                    augmentChoices[
                      Math.floor(Math.random() * augmentChoices.length)
                    ]
                  )
                }
              >
                Random Choice
              </button>
            </div>
          </div>
        )}

        {/* Final Boss selection modal */}
        {mode === "doomSelect" && (
          <div className="modal-overlay" onClick={() => {}}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 650 }}
            >
              <h2>Choose Your Final Boss</h2>
              <p style={{ marginBottom: "1rem" }}>
                Your score is <strong>{score}</strong>. Tougher bosses give
                bigger multipliers but harsher penalties.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                {/* Bronze */}
                <button
                  className="btn primary-btn"
                  style={{
                    flex: "1 1 30%",
                    minWidth: "180px",
                    whiteSpace: "normal",
                    padding: "0.75rem",
                    opacity: bronzeAvailable ? 1 : 0.4,
                  }}
                  disabled={!bronzeAvailable}
                  onClick={() => startDoomTier("bronze")}
                >
                  <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                    {DOOM_CONFIGS.bronze.label}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {DOOM_CONFIGS.bronze.description}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                    Unlocked at any score
                  </div>
                </button>

                {/* Silver */}
                <button
                  className="btn primary-btn"
                  style={{
                    flex: "1 1 30%",
                    minWidth: "180px",
                    whiteSpace: "normal",
                    padding: "0.75rem",
                    opacity: silverAvailable ? 1 : 0.4,
                  }}
                  disabled={!silverAvailable}
                  onClick={() => startDoomTier("silver")}
                >
                  <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                    {DOOM_CONFIGS.silver.label}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {DOOM_CONFIGS.silver.description}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                    Requires score ≥ {DOOM_THRESHOLDS.silver}
                  </div>
                </button>

                {/* Gold */}
                <button
                  className="btn primary-btn"
                  style={{
                    flex: "1 1 30%",
                    minWidth: "180px",
                    whiteSpace: "normal",
                    padding: "0.75rem",
                    opacity: goldAvailable ? 1 : 0.35,
                    border: "1px solid #ffd700",
                  }}
                  disabled={!goldAvailable}
                  onClick={() => startDoomTier("gold")}
                >
                  <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                    {DOOM_CONFIGS.gold.label}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {DOOM_CONFIGS.gold.description}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                    Requires score ≥ {DOOM_THRESHOLDS.gold}
                  </div>
                </button>
              </div>

              <p
                style={{
                  marginTop: "0.75rem",
                  fontSize: 12,
                  opacity: 0.8,
                }}
              >
                Tip: Gold Doom stacks with legendaries like Last Life Lens and
                Phantom Shroud for true misery.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
