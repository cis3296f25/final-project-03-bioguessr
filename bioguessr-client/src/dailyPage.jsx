import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import './App.css';
import PostRoundPopup from "./endOfRoundDispaly.jsx";
import GameLayout from "./components/GameLayout.jsx";
import GameHeader from "./components/GameHeader.jsx";
import GameImage from "./components/GameImage.jsx";
import AnimalInfo from "./components/AnimalInfo.jsx";
import GuessInput from "./components/GuessInput.jsx";
import AnswerReveal from "./components/AnswerReveal.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import ErrorScreen from "./components/ErrorScreen.jsx";
import GameOverScreen from "./components/GameOverScreen.jsx";

export default function DailyPage() {
  const [dailyAnimals, setDailyAnimals] = useState([]);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [guess, setGuess] = useState("");
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roundOver, setRoundOver] = useState(false);
  const navigate = useNavigate();

  const totalRounds = dailyAnimals?.length || 0;
  const isGameOver = totalRounds > 0 && round > totalRounds;
  const current = dailyAnimals?.[round - 1] || null;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/daily');
        if (!res.ok) throw new Error("Failed to load daily challenge.");
        setDailyAnimals(await res.json() || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch game data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmitGuess = () => {
    if (!current || !guess?.trim() || locked) return;
    const correct = current.countries.some(c => c.toLowerCase() === guess.trim().toLowerCase());
    if (correct) setScore(s => s + 100);
    setLocked(true);
    setFeedback(correct ? "Correct! +100" : "Not quite.");

    if (!correct) setGuess("");
  };

  const handleNextRound = () => {
    setGuess("")
    setLocked(false);
    setFeedback("");
    if (round === totalRounds) {
      setRoundOver(true);
      return;
    }
    setRound(r => r + 1);
  };

  const handleExit = () => navigate('/');

  if (loading) return <LoadingScreen message="Loading Daily Challenge..." />;

  if (error) {
    return (
      <ErrorScreen
        title="Error Loading Game"
        message={error}
        buttonText="Return Home"
        onButtonClick={handleExit}
      />
    );
  }

  if (isGameOver && !roundOver) {
    return (
      <GameOverScreen
        title="Daily Complete!"
        score={score}
        onGoHome={handleExit}
      />
    );
  }

  if (!current) return <LoadingScreen message={`Loading Round ${round}...`} />;

  return (
    <GameLayout>
      <GameHeader
        stats={
          <>
            <div>Score: <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{score}</span></div>
            <div>Round: {round} / {totalRounds}</div>
            <div>Mode: <span style={{ color: '#ffd700' }}>Daily</span></div>
          </>
        }
        onExit={handleExit}
      />

      <div className="game-layout">
        <GameImage src={current.imageUrl} feedback={feedback} />

        <div className="game-controls-section">
          <AnimalInfo
            scientificName={current.scientificName}
            commonName={current.name}
            revealed={locked}
          />

          {locked ? (
            <AnswerReveal countries={current.countries} onNextRound={handleNextRound} />
          ) : (
            <GuessInput
              onGuessChange={setGuess}
              onSubmit={handleSubmitGuess}
              disabled={!guess?.trim()}
              value={guess}
            />
          )}
        </div>
      </div>

      <PostRoundPopup
        open={roundOver}
        score={score}
        onClose={() => setRoundOver(false)}
      />
    </GameLayout>
  );
}
