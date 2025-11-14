import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

export default function DailyPage() {
    const [dailyAnimals, setDailyAnimals] = useState([]);
    const [allCountries, setAllCountries] = useState([]);
    const [round, setRound] = useState(1);
    const [score, setScore] = useState(0);
    const [guess, setGuess] = useState("");
    const [locked, setLocked] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const totalRounds = dailyAnimals.length || 5;
    const gameOver = round > totalRounds;
    const current = dailyAnimals[round - 1]; // Get current animal from the pre-fetched array

    // On mount, fetch both the daily animals and the master country list
    useEffect(() => {
        const fetchGameData = async () => {
            try {
                setLoading(true);
                // Fetch daily animals from our server
                const animalsRes = fetch('/api/daily');
                // Fetch a master list of countries for the dropdown
                const countriesRes = fetch('https://restcountries.com/v3.1/all?fields=name');

                const [animalsResponse, countriesResponse] = await Promise.all([animalsRes, countriesRes]);

                if (!animalsResponse.ok) throw new Error("Failed to load daily challenge.");
                if (!countriesResponse.ok) throw new Error("Failed to load country list.");

                const animalsData = await animalsResponse.json();
                const countriesData = await countriesResponse.json();

                // Sort countries alphabetically
                countriesData.sort((a, b) => a.name.common.localeCompare(b.name.common));

                setDailyAnimals(animalsData);
                setAllCountries(countriesData);
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

    if (loading) {
        return <div style={{ padding: 16 }}>Loading Daily Challenge...</div>;
    }

    if (error) {
        return <div style={{ padding: 16 }}>Error: {error}</div>;
    }

    if (gameOver) {
        return (
            <div style={{ padding: 16, textAlign: 'center' }}>
                <h2>Daily Challenge Complete!</h2>
                <p>Final score: <strong>{score}</strong></p>
                <button onClick={() => navigate('/')}>Back To Home</button>
            </div>
        );
    }
    
    // This check is important, as `current` is derived from `dailyAnimals`
    if (!current) {
        return <div style={{ padding: 16 }}>Loading animal for Round {round}...</div>;
    }


    function submitGuess() {
        if (!current || !guess || locked) return;

        // Check if the guess is in the animal's 'countries' array
        const correct = current.countries.some(c => c.toLowerCase() === guess.toLowerCase());

        if (correct) setScore(s => s + 100);
        setLocked(true);
        setFeedback(correct ?
            "Correct! +100" :
            `Not quite. The correct regions are: ${current.countries.join(', ')}.`
        );
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
        <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
            <header style={{ display: "flex", gap: 16, justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #eee", paddingBottom: 16 }}>
                <img src={"../assets/logos/logorect.webp"} style={{ width: '30%', minWidth: 150, height: 'auto' }} alt="Logo" />
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 12 }}>
                        <div><strong>Score:</strong> {score}</div>
                        <div><strong>Round:</strong> {round} / {totalRounds}</div>
                    </div>
                    <button onClick={restart}>
                        Back To Home
                    </button>
                </div>
            </header>

            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

                <div style={{ flex: 1.5, minWidth: 0 }}>
                    <img
                        src={current.imageUrl}
                        alt="Animal to guess"
                        style={{
                            width: "100%",
                            height: "auto",
                            maxHeight: "500px",
                            objectFit: "contain",
                            borderRadius: 8,
                            border: "1px solid #ddd",
                            backgroundColor: "#f9f9f9"
                        }}
                    />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>

                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 14, color: "#666" }}>Scientific Name</div>
                        <div style={{ fontSize: 28, fontWeight: 700, minHeight: 36, fontStyle: 'italic' }}>
                            {current.scientificName}
                        </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 14, color: "#666" }}>Common Name</div>
                        <div style={{ fontSize: 28, fontWeight: 700, minHeight: 36 }}>
                            {locked ? current.name : "?"}
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <select
                            value={guess}
                            onChange={e => setGuess(e.target.value)}
                            disabled={locked}
                            style={{ padding: 10, fontSize: 16 }}
                        >
                            <option value="" disabled>Choose a country...</option>
                            {allCountries.map(country => 
                                <option key={country.name.common} value={country.name.common}>
                                    {country.name.common}
                                </option>
                            )}
                        </select>

                        <button
                            onClick={submitGuess}
                            disabled={!guess || locked}
                            style={{ padding: 12, fontSize: 16, fontWeight: 'bold' }}
                        >
                            Submit Guess
                        </button>

                        <button
                            onClick={nextRound}
                            disabled={!locked}
                            style={{ padding: 12, fontSize: 16 }}
                        >
                            Next Round
                        </button>
                    </div>

                    <p style={{ minHeight: 24, marginTop: 16, fontSize: 18, fontWeight: 500 }}>
                        {feedback}
                    </p>
                </div>
            </div>
        </div>
    );
};