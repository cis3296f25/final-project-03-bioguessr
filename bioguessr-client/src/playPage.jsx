import { useMemo, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

// Demo data for now. Replace with API later.
const DEMO_ANIMALS = [
    { name: "Tiger", imageUrl: "https://placehold.co/600x360?text=Tiger" },
    { name: "Penguin", imageUrl: "https://placehold.co/600x360?text=Penguin" },
    { name: "Red Panda", imageUrl: "https://placehold.co/600x360?text=Red+Panda" },
    { name: "Blue Whale", imageUrl: "https://placehold.co/600x360?text=Blue+Whale" },
];

export default function PlayPage() {
    const [round, setRound] = useState(1);
    const [score, setScore] = useState(0);
    const [guess, setGuess] = useState("");
    const [current, setCurrent] = useState(null); 
    const [locked, setLocked] = useState(false);
    const [feedback, setFeedback] = useState("");
    const navigate = useNavigate();

    const totalRounds = DEMO_ANIMALS.length;
    const options = useMemo(() => DEMO_ANIMALS.map(a => a.name), []);

    const gameOver = round > totalRounds;

    useEffect(() => {
        if (gameOver) return;

        const animalIndex = round - 1; 

        const nextAnimal = DEMO_ANIMALS[animalIndex];

        setCurrent(nextAnimal);
    }, [round, gameOver]); 

    if (gameOver) {
        return (
            <div style={{ padding: 16 }}>
                <h2>Game Over</h2>
                <p>Final score: <strong>{score}</strong></p>
                <button onClick={() => navigate('/')}>Back To Home</button>
            </div>
        );
    }
        if (!current) {
        return <div style={{ padding: 16 }}>Loading animal for Round {round}...</div>;
    }


    function submitGuess() {
        if (!current || !guess || locked) return; 
        
        const correct = guess.toLowerCase() === current.name.toLowerCase(); 
        
        if (correct) setScore(s => s + 100);
        setLocked(true);
        setFeedback(correct ? 
            "Correct! +100" : 
            `Not quite — it was ${current.name}.`
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
        <img src={"../assets/logos/logorect.webp"} style={{width: '30%', minWidth: 150, height: 'auto'}} alt="Logo" />
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
            <div style={{ fontSize: 14, color: "#666" }}>Animal Name</div>
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
              <option value="" disabled>Choose an animal…</option>
              {options.map(name => <option key={name} value={name}>{name}</option>)}
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