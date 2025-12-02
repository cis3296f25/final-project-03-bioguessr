import { useState, useEffect } from 'react';

export default function GameImage({ src, feedback, imageStyle, wrapperStyle }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isCorrect = feedback?.includes("Correct");

  // Reset loading state when src changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className="game-image-wrapper">
      <div className="game-image-section" style={wrapperStyle}>
        {/* Loading skeleton */}
        {!loaded && !error && (
          <div className="image-skeleton">
            <div className="skeleton-shimmer" />
            <span className="skeleton-icon">🐾</span>
          </div>
        )}

        {/* Actual image */}
        {src && (
          <img
            src={src}
            alt="Animal to guess"
            className={`game-image ${loaded ? 'loaded' : ''}`}
            style={imageStyle}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setError(true);
              setLoaded(true);
            }}
          />
        )}

        {/* Error fallback */}
        {error && (
          <div className="image-error">
            <span className="error-icon">📷</span>
            <span>Image unavailable</span>
          </div>
        )}

        {/* No image placeholder */}
        {!src && (
          <div className="image-error">
            <span className="error-icon">🖼️</span>
            <span>No image provided</span>
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
