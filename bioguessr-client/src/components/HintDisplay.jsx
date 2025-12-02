export default function HintDisplay({ hints, show }) {
  if (!show) return null;

  const availableHints = hints.filter(h => h.visible && h.text);

  return (
    <div className="hints-container">
      {availableHints.length === 0 ? (
        <div className="hint-placeholder">
          <span className="hint-icon">💡</span>
          <span>Wrong guesses unlock hints...</span>
        </div>
      ) : (
        <div className="hints-list">
          {availableHints.map((hint, i) => (
            <div key={i} className="hint-item">
              <span className="hint-number">{i + 1}</span>
              <span className="hint-text">{hint.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

