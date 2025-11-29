import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import './App.css';
import bgImage from '../assets/homePageBG.png'; 
import CountryDropdown from "./CountryDropdown.jsx";
import PostRoundPopup from "./endOfRoundDispaly.jsx";
import RegionsList from "./RegionsList.jsx";
import GameHeader from "./components/GameHeader.jsx";
import GameImage from "./components/GameImage.jsx";
import AnimalInfo from "./components/AnimalInfo.jsx";


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
                    <GameHeader
                        stats={
                            <>
                                <div>Score: <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{score}</span></div>
                                <div>Round: {round} / {totalRounds}</div>
                                <div>Mode: <span style={{ color: '#ffd700' }}>Daily</span></div>
                            </>
                        }
                        onExit={restart}
                    />

                    <div className="game-layout">
                        <GameImage src={current.imageUrl} feedback={feedback} />

                        <div className="game-controls-section">
                            <AnimalInfo
                                scientificName={current.scientificName}
                                commonName={current.name}
                                revealed={locked}
                            />

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