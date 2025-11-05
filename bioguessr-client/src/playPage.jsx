import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimalName from "./components/AnimalName.jsx";
import FeedbackBar from "./components/FeedbackBar.jsx";
import GuessControls from "./components/GuessControls.jsx";
import PrimaryButton from "./components/PrimaryButton.jsx";
import "./App.css";

// Demo data
const DEMO_ANIMALS = [
  { name: "Tiger", imageUrl: "https://placehold.co/800x500?text=Tiger" },
  { name: "Penguin", imageUrl: "https://placehold.co/800x500?text=Penguin" },
  { name: "Red Panda", imageUrl: "https://placehold.co/800x500?text=Red+Panda" },
  { name: "Blue Whale", imageUrl: "https://placehold.co/800x500?text=Blue+Whale" },
];

export default function PlayPage() {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [guess, setGuess] = useState("");
  const [current, setCurrent] = useState(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();

  const totalRounds = DEMO_ANIMALS.length;
  const options = useMemo(() => DEMO_ANIMALS.map(a => a.name), []);
  const gameOver = round > totalRounds;

  useEffect(() => {
    if (!gameOver) setCurrent(DEMO_ANIMALS[round - 1]);
  }, [round, gameOver]);

  if (gameOver) {
    return (
      <div className="page">
        <div className="hud">
          <div />
          <PrimaryButton onClick={() => navigate("/")}>Back To Home</PrimaryButton>
        </div>

        <div className="panel" style={{ textAlign: "center" }}>
          <h2>Game Over</h2>
          <p>Final score: <strong>{score}</strong></p>
        </div>
      </div>
    );
  }

  if (!current) return <div className="page">Loading…</div>;

  function submitGuess() {
    if (!guess || locked) return;
    const correct = guess.toLowerCase() === current.name.toLowerCase();
    if (correct) setScore(s => s + 100);
    setLocked(true);
    setFeedback(correct ? "Correct! +100" : `Not quite — it was ${current.name}.`);
  }

  function nextRound() {
    setGuess("");
    setLocked(false);
    setFeedback("");
    setRound(r => r + 1);
  }

  return (
    <div className="page">
      {/* HUD */}
      <div className="hud">
        <div style={{ display: "flex", gap: 16 }}>
          <div><strong>Score:</strong> {score}</div>
          <div><strong>Round:</strong> {round} / {totalRounds}</div>
        </div>
        <PrimaryButton onClick={() => navigate("/")}>Back To Home</PrimaryButton>
      </div>

      {/* Two columns */}
      <div className="row">
        {/* LEFT: logo above image */}
        <div className="panel" style={{ alignItems: "center" }}>
          <img
            className="page-logo"
            src="/assets/logos/logorect.webp"
            alt="BioGuessr"
          />

          <div className="image-wrap" style={{ width: "100%" }}>
            <img
              className="animal"
              src={current.imageUrl}
              alt="Animal to guess"
            />
          </div>
        </div>

        {/* RIGHT: info + controls */}
        <div className="panel">
          <AnimalName name={current.name} locked={locked} />

          <GuessControls
            options={options}
            guess={guess}
            setGuess={setGuess}
            locked={locked}
            onSubmit={submitGuess}
            onNext={nextRound}
            onBack={() => navigate("/")}
          />

          <FeedbackBar message={feedback} />
        </div>
      </div>
    </div>
  );
}
