import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function HomePage() {
  const [title, setTitle] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [rulesText, setRulesText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const titleRes = await fetch('/api/title');
        const titleData = await titleRes.text();
        setTitle(titleData);

        const bottomTextRes = await fetch('/api/bottomText');
        const bottomTextData = await bottomTextRes.text();
        setBottomText(bottomTextData);

        const buttonRes = await fetch('/api/playButton');
        const buttonData = await buttonRes.text();
        setButtonText(buttonData);

        const rulesRes = await fetch('/api/rulesButton');
        const rulesData = await rulesRes.text();
        setRulesText(rulesData);

      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData(); 
  }, []);

  const handlePlayClick = () => {
    navigate('/play'); 
  };

  const handleRulesClick = () => {
    setShowRules(true);
};
  return (
    <>
      <h1>{title}</h1>
      <p>{bottomText}</p>
      <button onClick={handlePlayClick}>
        {buttonText}
      </button>
      <button onClick={handleRulesClick} style={{ marginLeft: '10px' }}>
        {rulesText}
      </button>

      {showRules && (
        <div className="modal-overlay" onClick={() => setShowRules(false)}>
          
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>How To Play</h2>
            <p>You will be shown a picture of an animal along with it's scientific name. 
            </p>
            <p>
                Your job is to correctly identify the region(s) that the animal can be found in by
                selecting a country from the dropdown menu provided. 
            </p>
                
            <p>Correct guesses will be rewarded
                with points, while incorrect guesses will not reward any points.
            </p>
            <button onClick={() => setShowRules(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

export default HomePage;