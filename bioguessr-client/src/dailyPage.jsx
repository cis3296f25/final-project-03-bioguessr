import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import './App.css';
import bgImage from '../assets/homePageBG.png'; 
import logoImage from '../assets/logos/logorect.webp'; 
import CountryDropdown from "./CountryDropdown.jsx";
import PostRoundPopup from "./endOfRoundDispaly.jsx";
import RegionsList from "./RegionsList.jsx";


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
    const [roundOver, setRoundOver] = useState(false);


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

    const finishRound = (finalScore) => {
        setScore(finalScore);
        setRoundOver(true);
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

    if (gameOver && !roundOver) {
        return (
            <div className="app-container" style={containerStyle}>
                <div className="overlay">
                    <div className="glass-card game-card">
                        <h2 className="title">Daily Complete!</h2>
                        <p className="subtitle">Final Score: {score}</p>
                        <button className="btn primary-btn" onClick={() => navigate('/')}>
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
    }

    function nextRound() {
        setGuess("");
        setLocked(false);
        setFeedback("");

        if(round == totalRounds){
            finishRound(score);
            return;
        }

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
                        <div className="game-image-wrapper">
                            <div className="game-image-section">
                                <img
                                    key={current.imageUrl || round} 
                                    src={current.imageUrl}
                                    alt="Animal to guess"
                                    className="game-image"
                                    onError={(e) => { e.currentTarget.src = "https://placehold.co/800x500?text=Image+unavailable"; }}
                                />
                            </div>
                            {feedback && (
                                <div className={`feedback-overlay ${feedback.includes("Correct") ? "feedback-correct" : "feedback-wrong"}`}>
                                    <span className="feedback-icon">{feedback.includes("Correct") ? "✓" : "✗"}</span>
                                    <span className="feedback-message">{feedback}</span>
                                </div>
                            )}
                        </div>

                        <div className="game-controls-section">
                            <div className="animal-info">
                                <div className="animal-name-label">Scientific Name</div>
                                <div className="scientific-name">{current.scientificName}</div>
                            </div>

                            <div className="animal-info">
                                <div className="animal-name-label">Common Name</div>
                                <div className={locked ? "animal-name-revealed" : "animal-name-hidden"}>
                                    {locked ? current.name : "?"}
                                </div>
                            </div>

                            {locked ? (
                                <div className="answer-reveal">
                                    <div className="answer-label">Correct Regions</div>
                                    <RegionsList countries={current.countries} />
                                    <button className="btn primary-btn" onClick={nextRound}>
                                        Next Round →
                                    </button>
                                </div>
                            ) : (
                                <div className="input-group">
                                    <CountryDropdown setGuess={setGuess} disabled={locked} />
                                    <button
                                        className="btn primary-btn"
                                        onClick={submitGuess}
                                        disabled={!guess?.trim()}
                                    >
                                        Submit Guess
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <PostRoundPopup 
                        open={roundOver}
                        score={score}
                        onClose={() => setRoundOver(false)}
                    />

                </div>
            </div>
        </div>
    );
};