import logoImage from '../../assets/logos/logorect.webp';

export default function GameHeader({ stats, onExit }) {
  return (
    <header className="game-header">
      <img src={logoImage} className="header-logo" alt="BioGuessr" />
      <div className="game-stats">
        {stats}
      </div>
      <button 
        className="btn secondary-btn" 
        style={{ width: 'auto', padding: '0.5em 1em' }} 
        onClick={onExit}
      >
        Exit
      </button>
    </header>
  );
}

