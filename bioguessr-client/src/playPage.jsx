import { useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';

// Demo data for now. Replace with API later.
const DEMO_ANIMALS = [
  { name: "Tiger",     imageUrl: "https://placehold.co/600x360?text=Tiger" },
  { name: "Penguin",   imageUrl: "https://placehold.co/600x360?text=Penguin" },
  { name: "Red Panda", imageUrl: "https://placehold.co/600x360?text=Red+Panda" },
  { name: "Blue Whale",imageUrl: "https://placehold.co/600x360?text=Blue+Whale" },
];

export default function PlayPage() {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [guess, setGuess] = useState("");
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();

  const totalRounds = DEMO_ANIMALS.length;
  const current = DEMO_ANIMALS[round - 1];
  const options = useMemo(() => DEMO_ANIMALS.map(a => a.name), []);

  const gameOver = round > totalRounds;

  function submitGuess() {
    if (!current || !guess) return;
    const correct = guess === current.name;
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

  function restart() {
    navigate('/');
  };

  if (gameOver) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Game Over</h2>
        <p>Final score: <strong>{score}</strong></p>
        <button onClick={restart}>Back To Home</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <header style={{ display: "flex", gap: 16, justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>BioGuessr – Gameplay</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <div><strong>Score:</strong> {score}</div>
          <div><strong>Round:</strong> {round} / {totalRounds}</div>
        </div>
      </header>

      {}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: "#666" }}>Animal Name</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          {locked ? current.name : "?"}
        </div>
      </div>

      {/* Image */}
      <div style={{ margin: "12px 0" }}>
        <img
          src={current.imageUrl}
          alt="Animal"
          style={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" }}
        />
      </div>

      {/* Guess controls */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <select
          value={guess}
          onChange={e => setGuess(e.target.value)}
          disabled={locked}
        >
          <option value="" disabled>Choose an animal…</option>
          {options.map(name => <option key={name} value={name}>{name}</option>)}
        </select>

        <button onClick={submitGuess} disabled={!guess || locked}>
          Submit Guess
        </button>

        <button onClick={nextRound} disabled={!locked}>
          Next Round
        </button>

        <button onClick={restart} style={{ marginLeft: "auto" }}>
          Back To Home
        </button>
      </div>

      {/* Feedback */}
      <p style={{ minHeight: 24, marginTop: 8 }}>{feedback}</p>
    </div>
  );
}