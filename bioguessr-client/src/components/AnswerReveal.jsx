import RegionsList from '../RegionsList';

export default function AnswerReveal({ countries, onNextRound, showNextButton = true }) {
  return (
    <div className="answer-reveal">
      <div className="answer-label">Correct Regions</div>
      <RegionsList countries={countries} />
      {showNextButton && (
        <button className="btn primary-btn" onClick={onNextRound}>
          Next Round →
        </button>
      )}
    </div>
  );
}

