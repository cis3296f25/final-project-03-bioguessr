import bgImage from '../../assets/homePageBG.png';

export default function GameLayout({ children, centered }) {
  return (
    <div className="app-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="overlay">
        <div 
          className="glass-card game-card" 
          style={centered ? { justifyContent: 'center', minHeight: 'auto' } : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

