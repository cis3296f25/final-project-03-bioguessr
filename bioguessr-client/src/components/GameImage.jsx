export default function GameImage({ src, feedback, imageStyle, wrapperStyle }) {
  const isCorrect = feedback?.includes("Correct");

  return (
    <div className="game-image-wrapper">
      <div className="game-image-section" style={wrapperStyle}>
        {src ? (
          <img
            src={src}
            alt="Animal to guess"
            className="game-image"
            style={imageStyle}
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
      {feedback && (
        <div className={`feedback-overlay ${isCorrect ? "feedback-correct" : "feedback-wrong"}`}>
          <span className="feedback-icon">{isCorrect ? "✓" : "✗"}</span>
          <span className="feedback-message">{feedback}</span>
        </div>
      )}
    </div>
  );
}

