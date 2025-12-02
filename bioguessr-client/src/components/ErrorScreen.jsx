import GameLayout from './GameLayout';

export default function ErrorScreen({ title, message, buttonText, onButtonClick }) {
  return (
    <GameLayout centered>
      <h2>{title || "Error"}</h2>
      {message && <p>{message}</p>}
      <button className="btn secondary-btn" onClick={onButtonClick}>
        {buttonText || "Go Back"}
      </button>
    </GameLayout>
  );
}

