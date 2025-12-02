import GameLayout from './GameLayout';

export default function GameOverScreen({ 
  title, 
  subtitle, 
  score, 
  extraStats,
  onGoHome,
  titleColor = '#4caf50'
}) {
  return (
    <GameLayout centered>
      <h2 className="title" style={{ color: titleColor }}>{title}</h2>
      {subtitle && (
        <p className="subtitle" style={{ marginTop: '1rem' }}>{subtitle}</p>
      )}
      <div className="game-stats" style={{ flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        <div>Final Score: <strong>{score}</strong></div>
        {extraStats}
      </div>
      <button 
        className="btn primary-btn" 
        style={{ maxWidth: '300px', marginTop: '2rem' }} 
        onClick={onGoHome}
      >
        Back To Home
      </button>
    </GameLayout>
  );
}

