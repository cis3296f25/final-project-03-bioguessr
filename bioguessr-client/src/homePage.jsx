import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import logoImage from '../assets/logos/logosquare.webp'; 
import bgImage from '../assets/homePageBG.png'; 

function HomePage() {
  const [buttonText, setButtonText] = useState('Play');
  const [showRules, setShowRules] = useState(false);
  const [showPlayMenu, setShowPlayMenu] = useState(false); 
  const [rulesText, setRulesText] = useState('Rules');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const buttonRes = await fetch('/api/playButton');
        if (buttonRes.ok) setButtonText(await buttonRes.text());

        const rulesRes = await fetch('/api/rulesButton');
        if (rulesRes.ok) setRulesText(await rulesRes.text());
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = logoImage;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = logoImage;
      document.head.appendChild(newLink);
    }
  }, []);

  const handleDailyClick = () => navigate('/daily');
  const handlePlayClick = () => setShowPlayMenu(true);
  const handleRulesClick = () => setShowRules(true);

  const startEasyMode = () => navigate('/play?mode=easy');
  const startNormalMode = () => navigate('/play');
  const startHardMode = () => alert("Hard mode is currently under development!");

  // Split the text for the wave animation
  const subtitleText = "How well do you know Biology?";

  return (
    <div className="app-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="overlay">
        <div className="glass-card home-card">
          
          <h1 className="title">
            <span className="text-bio">Bio</span>
            <span className="text-guessr">Guessr</span>
          </h1>
          
          <img src={logoImage} alt="BioGuessr Logo" className="main-logo" />
          
          {/* UPDATED: Subtitle with Wave Animation */}
          <p className="subtitle wave-text">
            {subtitleText.split("").map((char, index) => (
              <span key={index} style={{ animationDelay: `${index * 0.04}s` }}>
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </p>
          
          <div className="button-group">
            <button className="btn primary-btn" onClick={handlePlayClick}>
              {buttonText}
            </button>
            <button className="btn secondary-btn" onClick={handleDailyClick}>
              Daily Challenge
            </button>
            <button className="btn secondary-btn" onClick={handleRulesClick}>
              {rulesText}
            </button>
          </div>
        </div>

        {showRules && (
          <div className="modal-overlay" onClick={() => setShowRules(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>How To Play</h2>
              <p>You will be shown a picture of an animal along with its scientific name.</p>
              <p>Your job is to correctly identify the region(s) that the animal can be found in by selecting a country from the dropdown menu provided.</p>
              <p>Correct guesses will be rewarded with points, while incorrect guesses will not reward any points.</p>
              <button className="btn modal-btn" onClick={() => setShowRules(false)}>Close</button>
            </div>
          </div>
        )}

        {showPlayMenu && (
          <div className="modal-overlay" onClick={() => setShowPlayMenu(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Select Difficulty</h2>
              <p>Choose your challenge level:</p>
              
              <div className="button-group" style={{ marginTop: '20px' }}>
                <button className="btn primary-btn" onClick={startEasyMode}>
                  Easy Mode
                </button>
                <button 
                  className="btn primary-btn" 
                  style={{ backgroundColor: '#2196f3' }} 
                  onClick={startNormalMode}
                >
                  Normal Mode
                </button>
                <button className="btn secondary-btn" onClick={startHardMode}>
                  Hard Mode (Locked)
                </button>
              </div>

              <button className="btn modal-btn" onClick={() => setShowPlayMenu(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;