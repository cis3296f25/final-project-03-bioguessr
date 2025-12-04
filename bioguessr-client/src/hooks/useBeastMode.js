import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const MAX_LIVES = 3;
const BASE_TIME = 7;
const MIN_TIME = 4;

export default function useBeastMode(game, { enabled = false }) {
  const [lives, setLives] = useState(MAX_LIVES);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const audioRef = useRef(null);

  const { round, score, current, locked, setLocked, setScore, setFeedback, nextRound } = game;
  
  const timeLimit = useMemo(() => {
    if (!enabled) return null;
    return Math.max(MIN_TIME, BASE_TIME - Math.floor((round - 1) / 10));
  }, [enabled, round]);

  // Reset timer when round/current changes
  useEffect(() => {
    if (current && timeLimit) {
      setTimeLeft(timeLimit);
    }
  }, [current, timeLimit]);

  // Timer countdown
  useEffect(() => {
    if (!enabled || !current || locked || timeLeft === null || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 0.1)), 100);
    return () => clearInterval(id);
  }, [enabled, current, locked, timeLeft]);

  // Time's up handler
  useEffect(() => {
    if (!enabled || timeLeft === null || timeLeft > 0 || locked || lives <= 0) return;
    const penalty = Math.floor(score / 3);
    setLocked(true);
    setScore(s => Math.max(0, s - penalty));
    setLives(l => l - 1);
    setStreak(0);
    setFeedback(`Time's up! (-${penalty} pts)`);
  }, [enabled, timeLeft, locked, lives, score, setLocked, setScore, setFeedback]);

  // Auto-advance after answer
  useEffect(() => {
    if (!enabled || !locked || lives <= 0) return;
    const id = setTimeout(nextRound, 1500);
    return () => clearTimeout(id);
  }, [enabled, locked, lives, nextRound]);

  // Heartbeat audio
  useEffect(() => {
    if (!enabled) return;
    if (!audioRef.current) {
      audioRef.current = new Audio("/assets/audio/heartbeat.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
    }
    const audio = audioRef.current;
    if (locked || lives <= 0 || !timeLeft) {
      audio.pause();
    } else {
      audio.playbackRate = 1 + (1 - timeLeft / timeLimit) * 0.8;
      audio.play().catch(() => {});
    }
    return () => audio.pause();
  }, [enabled, timeLeft, timeLimit, locked, lives]);

  const ratio = (timeLimit && timeLeft != null) ? Math.max(0, timeLeft / timeLimit) : 0;
  const timerColor = ratio < 0.3 ? "#ff5252" : ratio < 0.6 ? "#ff9800" : "#4caf50";
  const zoomScale = enabled ? 1 + ratio * 1.1 : 1;

  const handleCorrectGuess = useCallback(() => {
    const newStreak = streak + 1;
    const currentRatio = (timeLimit && timeLeft != null) ? Math.max(0, timeLeft / timeLimit) : 0;
    const points = (100 + (round - 1) * 5 + Math.round(20 * currentRatio)) * newStreak;
    setStreak(newStreak);
    setScore(s => s + points);
    setLocked(true);
    setFeedback(`Correct! Streak x${newStreak} (+${points})`);
  }, [streak, round, timeLimit, timeLeft, setScore, setLocked, setFeedback]);

  const handleWrongGuess = useCallback(() => {
    const penalty = Math.floor(score / 3);
    setScore(s => Math.max(0, s - penalty));
    setLives(l => l - 1);
    setStreak(0);
    setLocked(true);
    setFeedback(`Wrong! (-${penalty} pts)`);
  }, [score, setScore, setLocked, setFeedback]);

  return {
    enabled,
    lives,
    streak,
    timeLeft,
    timeLimit,
    isDead: lives <= 0,
    timerColor,
    zoomScale,
    handleCorrectGuess: enabled ? handleCorrectGuess : () => {},
    handleWrongGuess: enabled ? handleWrongGuess : () => {},
  };
}
