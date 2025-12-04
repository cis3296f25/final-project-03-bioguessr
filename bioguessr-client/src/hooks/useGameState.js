import { useState, useEffect, useCallback } from "react";

export default function useGameState({ endpoint, totalRounds = null }) {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [guess, setGuess] = useState("");
  const [current, setCurrent] = useState(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isGameOver = totalRounds !== null && round > totalRounds;

  useEffect(() => {
    if (isGameOver) return;
    
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        if (!cancelled) {
          setCurrent(Array.isArray(data) ? data : data);
          setGuess("");
          setLocked(false);
          setFeedback("");
          setLoading(false);
        }
      } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err);
        if (!cancelled) {
          setCurrent(null);
          setError(err.message);
          setLoading(false);
        }
      }
    })();
    
    return () => { cancelled = true; };
  }, [endpoint, round, isGameOver]);

  const checkGuess = useCallback(() => {
    if (!current || !guess?.trim() || locked) return null;
    const countries = current.countries || [];
    return countries.some(c => c.toLowerCase() === guess.trim().toLowerCase());
  }, [current, guess, locked]);

  const submitCorrect = useCallback((points, feedbackMsg) => {
    setScore(s => s + points);
    setLocked(true);
    setFeedback(feedbackMsg);
  }, []);

  const submitWrong = useCallback((feedbackMsg, penaltyPoints = 0) => {
    if (penaltyPoints > 0) {
      setScore(s => Math.max(0, s - penaltyPoints));
    }
    setLocked(true);
    setFeedback(feedbackMsg);
  }, []);

  const setFeedbackOnly = useCallback((msg) => {
    setFeedback(msg);
  }, []);

  const nextRound = useCallback(() => {
    setRound(r => r + 1);
    setGuess("");
    setLocked(false);
    setFeedback("");
  }, []);

  const resetRoundState = useCallback(() => {
    setGuess("");
    setLocked(false);
    setFeedback("");
  }, []);

  return {
    round,
    score,
    guess,
    current,
    locked,
    feedback,
    loading,
    error,
    isGameOver,
    totalRounds,

    setGuess,
    setScore,
    setLocked,
    setFeedback: setFeedbackOnly,
    
    checkGuess,
    submitCorrect,
    submitWrong,
    nextRound,
    resetRoundState,
  };
}

