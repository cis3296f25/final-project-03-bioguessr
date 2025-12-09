import { useLocation, useNavigate } from "react-router-dom";
import useGameState from "./hooks/useGameState.js";
import useBeastMode from "./hooks/useBeastMode.js";
import useEasyMode from "./hooks/useEasyMode.js";
import GameLayout from "./components/GameLayout.jsx";
import GameHeader from "./components/GameHeader.jsx";
import GameImage from "./components/GameImage.jsx";
import AnimalInfo from "./components/AnimalInfo.jsx";
import GuessInput from "./components/GuessInput.jsx";
import AnswerReveal from "./components/AnswerReveal.jsx";
import HintDisplay from "./components/HintDisplay.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import ErrorScreen from "./components/ErrorScreen.jsx";
import GameOverScreen from "./components/GameOverScreen.jsx";
import "./App.css";

const TOTAL_ROUNDS = 4;

function useGameMode() {
  const { search } = useLocation();
  const modeParam = new URLSearchParams(search).get("mode");
  if (modeParam === "easy") return "easy";
  if (modeParam === "beast") return "beast";
  return "normal";
}

export default function PlayPage() {
  const mode = useGameMode();
  const isEasy = mode === "easy";
  const isBeast = mode === "beast";
  const navigate = useNavigate();

  const game = useGameState({
    endpoint: "/api/play",
    totalRounds: isBeast ? null : TOTAL_ROUNDS,
  });

  const beast = useBeastMode(game, { enabled: isBeast });
  const easy = useEasyMode(game, { enabled: isEasy });

  const isGameOver = game.isGameOver || beast.isDead;

  const handleSubmitGuess = () => {
    const correct = game.checkGuess();
    if (correct === null) return;

    if (correct) {
      if (isBeast) {
        beast.handleCorrectGuess();
      } else {
        game.submitCorrect(100, "Correct! +100");
      }
    } else {
      if (isBeast) {
        beast.handleWrongGuess();
      } else if (isEasy) {
        easy.handleWrongGuess();
      } else {
        game.submitWrong("Not quite.");
      }
      game.setGuess("");
    }
  };

  const handleExit = () => navigate("/");

  let modeLabel = "Normal";
  if (isBeast) modeLabel = "BEAST MODE";
  if (isEasy) modeLabel = "Easy";

  if (isGameOver) {
    return (
      <GameOverScreen
        title={beast.isDead ? "DEFEATED" : "Game Over"}
        subtitle={beast.isDead ? "You ran out of lives." : "All rounds completed."}
        score={game.score}
        extraStats={isBeast && <div>Highest Streak: <strong>{beast.streak}</strong></div>}
        onGoHome={handleExit}
        titleColor={beast.isDead ? '#ff5252' : '#4caf50'}
      />
    );
  }

  if (game.error) {
    return (
      <ErrorScreen
        title="Couldn't load the next animal."
        onButtonClick={() => game.nextRound()}
        buttonText="Retry"
      />
    );
  }

  if (game.loading || !game.current) {
    return <LoadingScreen message={`Loading Round ${game.round}...`} />;
  }

  const imgSrc = game.current.image_url || game.current.imageUrl || "";

  return (
    <GameLayout>
      <GameHeader
        stats={
          <>
            <div>Score: <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{game.score}</span></div>
            {isBeast ? (
              <>
                <div>Round: {game.round}</div>
                <div><span style={{ color: '#ff5252', fontWeight: 'bold' }}>{modeLabel}</span></div>
                <div>Lives: {Array(beast.lives).fill("❤️").join("")}</div>
                <div>Streak: x{beast.streak}</div>
                <div style={{ fontWeight: 'bold', color: beast.timerColor, minWidth: '60px' }}>
                  {beast.timeLeft != null ? beast.timeLeft.toFixed(1) + "s" : "--"}
                </div>
              </>
            ) : (
              <>
                <div>Round: {game.round} / {game.totalRounds}</div>
                <div>Mode: <span style={{ color: isEasy ? '#4caf50' : '#2196f3' }}>{modeLabel}</span></div>
              </>
            )}
          </>
        }
        onExit={handleExit}
      />

      <div className="game-layout">
        <GameImage
          src={imgSrc}
          feedback={game.feedback}
          wrapperStyle={isBeast ? { border: '2px solid ' + beast.timerColor } : {}}
          imageStyle={isBeast ? { transform: `scale(${beast.zoomScale})`, transition: 'transform 0.1s linear' } : {}}
        />

        <div className="game-controls-section">
          <AnimalInfo
            scientificName={game.current.scientificName}
            commonName={game.current.name}
            revealed={game.locked}
          />

          <HintDisplay
            show={isEasy && !game.locked}
            hints={[
              { visible: easy.wrongGuesses >= 1, text: easy.hint1 },
              { visible: easy.wrongGuesses >= 2, text: easy.hint2 },
            ]}
          />

          {game.locked ? (
            <AnswerReveal
              countries={game.current.countries}
              onNextRound={game.nextRound}
              showNextButton={!isBeast}
            />
          ) : (
            <GuessInput
              onGuessChange={game.setGuess}
              onSubmit={handleSubmitGuess}
              disabled={!game.guess?.trim()}
              value={game.guess}
            />
          )}
        </div>
      </div>
    </GameLayout>
  );
}
