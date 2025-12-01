import CountryDropdown from '../CountryDropdown';

export default function GuessInput({ onGuessChange, onSubmit, disabled, value }) {
  return (
    <div className="input-group">
      <CountryDropdown setGuess={onGuessChange} value={value} />
      <button
        className="btn primary-btn"
        onClick={onSubmit}
        disabled={disabled}
      >
        Submit Guess
      </button>
    </div>
  );
}

