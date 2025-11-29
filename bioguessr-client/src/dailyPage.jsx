import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import './App.css';
import bgImage from '../assets/homePageBG.png'; 
import logoImage from '../assets/logos/logorect.webp'; 
import CountryDropdown from "./CountryDropdown.jsx";

export default function DailyPage() {
    const [dailyAnimals, setDailyAnimals] = useState([]);
    const [round, setRound] = useState(1);
    const [score, setScore] = useState(0);
    const [guess, setGuess] = useState("");
    const [locked, setLocked] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const totalRounds = dailyAnimals?.length || 0;
    const gameOver = totalRounds > 0 && round > totalRounds;
    const current = dailyAnimals ? dailyAnimals[round - 1] : null; 

    useEffect(() => {
        const fetchGameData = async () => {
            try {
                setLoading(true);
                const animalsRes = await fetch('/api/daily');
                if (!animalsRes.ok) throw new Error("Failed to load daily challenge.");
                const animalsData = await animalsRes.json();
                setDailyAnimals(animalsData || []);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch game data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGameData();
    }, []);

    const containerStyle = {
        backgroundImage: `url(${bgImage})`,
        backgroundColor: '#1a1a1a'
    };

    if (loading) {
        return (
            <div className="app-container" style={containerStyle}>
                <div className="overlay">
                    <div className="glass-card game-card" style={{ justifyContent: 'center', minHeight: 'auto' }}>
                        <h2 className="title" style={{ fontSize: '2rem' }}>Loading Daily Challenge...</h2>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-container" style={containerStyle}>
                <div className="overlay">
                    <div className="glass-card game-card" style={{ justifyContent: 'center', minHeight: 'auto' }}>
                        <h2>Error Loading Game</h2>
                        <p>{error}</p>
                        <button className="btn secondary-btn" onClick={() => navigate('/')}>Return Home</button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameOver) {
        return (
            <div className="app-container" style={containerStyle}>
                <div className="overlay">
                    <div className="glass-card game-card" style={{ justifyContent: 'center', minHeight: 'auto' }}>
                        <h2 className="title">Daily Complete!</h2>
                        <p className="subtitle" style={{ marginTop: '1rem' }}>Final Score: {score}</p>
                        <button className="btn primary-btn" style={{ maxWidth: '300px', marginTop: '2rem' }} onClick={() => navigate('/')}>
                            Back To Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!current) {
        return (
            <div className="app-container" style={containerStyle}>
                <div className="overlay">
                    <div className="glass-card game-card" style={{ justifyContent: 'center', minHeight: 'auto' }}>
                        <h2>Loading Round {round}...</h2>
                    </div>
                </div>
            </div>
        );
    }

    function submitGuess() {
        if (!current || !guess?.trim() || locked) return;

        const correct = current.countries.some(c => c.toLowerCase() === guess.trim().toLowerCase());

        if (correct) setScore(s => s + 100);
        setLocked(true);
        setFeedback(correct ? "Correct! +100" : "Not quite.");
        setGuess("");
    }

    function nextRound() {
        setGuess("");
        setLocked(false);
        setFeedback("");
        setRound(r => r + 1);
    }

    function restart() {
        navigate('/');
    };

    return (
        <div className="app-container" style={containerStyle}>
            <div className="overlay">
                <div className="glass-card game-card">
                    <header className="game-header">
                        <img src={logoImage} className="header-logo" alt="BioGuessr" />
                        <div className="game-stats">
                            <div>Score: <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{score}</span></div>
                            <div>Round: {round} / {totalRounds}</div>
                            <div>Mode: <span style={{ color: '#ffd700' }}>Daily</span></div>
                        </div>
                        <button className="btn secondary-btn" style={{ width: 'auto', padding: '0.5em 1em' }} onClick={restart}>
                            Exit
                        </button>
                    </header>

                    <div className="game-layout">
                        <div className="game-image-section">
                            <img
                                key={current.imageUrl || round} 
                                src={current.imageUrl}
                                alt="Animal to guess"
                                className="game-image"
                                onError={(e) => { e.currentTarget.src = "https://placehold.co/800x500?text=Image+unavailable"; }}
                            />
                        </div>

                        <div className="game-controls-section">
                            <div style={{ marginBottom: '1rem' }}>
                                <div className="animal-name-label">Scientific Name</div>
                                <div style={{ fontSize: '1.8rem', fontStyle: 'italic', fontWeight: 600, color: '#4caf50' }}>
                                    {current.scientificName}
                                </div>
                            </div>

                            <div>
                                <div className="animal-name-label">Common Name</div>
                                <div className={locked ? "animal-name-revealed" : "animal-name-hidden"}>
                                    {locked ? current.name : "?"}
                                </div>
                            </div>

                            <div className="input-group">
                                <CountryDropdown setGuess={setGuess} value={guess} disabled={locked} />

                                <button
                                    className="btn primary-btn"
                                    onClick={submitGuess}
                                    disabled={!guess?.trim() || locked}
                                >
                                    Submit Guess
                                </button>

                                <button
                                    className="btn secondary-btn"
                                    onClick={nextRound}
                                    disabled={!locked}
                                >
                                    Next Round
                                </button>
                            </div>

                            <p className="feedback-text" style={{ color: feedback.includes("Correct") ? "#4caf50" : "#ff5252" }}>
                                {feedback}
                            </p>
                        </div>
                    </div>

                    {locked && (
                        <div className="answer-section">
                            <div className="answer-title">Correct Regions</div>
                            <div className="answer-text">
                                {current.countries.join(", ")}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};