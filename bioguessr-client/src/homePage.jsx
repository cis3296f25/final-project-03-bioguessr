import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import PrimaryButton from './components/PrimaryButton.jsx';
import Background from './components/Background.jsx';
import RulesModal from './components/RulesModal.jsx';

const API = import.meta.env.VITE_API_BASE || '';

export default function HomePage() {
  const [buttonText, setButtonText] = useState('Play');
  const [rulesText, setRulesText] = useState('How to Play');
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [btnRes, rulesRes] = await Promise.all([
          fetch(`${API}/api/playButton`),
          fetch(`${API}/api/rulesButton`),
        ]);
        if (!cancelled) {
          if (btnRes.ok)   setButtonText(await btnRes.text());
          if (rulesRes.ok) setRulesText(await rulesRes.text());
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePlayClick = () => navigate('/play');

  return (
    <Background>
      <h1>BioGuessr</h1>
      <p>How well do you know Biology?</p>

      <PrimaryButton onClick={handlePlayClick}>
        {buttonText}
      </PrimaryButton>

      <PrimaryButton onClick={() => setShowRules(true)} style={{ marginLeft: 10 }}>
        {rulesText}
      </PrimaryButton>

      <RulesModal open={showRules} onClose={() => setShowRules(false)}>
        <h2>How To Play</h2>
        <p>You will be shown a picture of an animal along with its scientific name.</p>
        <p>Your job is to select a country where the animal is found. Some animals have multiple valid origins.</p>
        <p>Correct guesses earn points; incorrect guesses do not.</p>
      </RulesModal>
    </Background>
  );
}
