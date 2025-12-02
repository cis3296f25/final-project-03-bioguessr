import { useState, useEffect, useMemo, useCallback } from "react";
import { getFeatureHint, getWeightHint } from "../utils/hints.js";

export default function useEasyMode(game, { enabled = false }) {
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const { current, setLocked, setFeedback } = game;

  useEffect(() => {
    if (current) {
      setWrongGuesses(0);
    }
  }, [current]);

  const hint1 = useMemo(() => {
    if (!enabled || !current || wrongGuesses < 1) return null;
    return getFeatureHint(current);
  }, [enabled, current, wrongGuesses]);

  const hint2 = useMemo(() => {
    if (!enabled || !current || wrongGuesses < 2) return null;
    return getWeightHint(current);
  }, [enabled, current, wrongGuesses]);

  const handleWrongGuess = useCallback(() => {
    setWrongGuesses((n) => {
      const next = n + 1;
      if (next >= 3) {
        setLocked(true);
        setFeedback("Not quite.");
      } else {
        setFeedback("Try again!");
      }
      return next;
    });
  }, [setLocked, setFeedback]);

  const resetWrongGuesses = useCallback(() => {
    setWrongGuesses(0);
  }, []);

  if (!enabled) {
    return {
      enabled: false,
      hint1: null,
      hint2: null,
      wrongGuesses: 0,
      handleWrongGuess: () => {},
      resetWrongGuesses: () => {},
    };
  }

  return {
    enabled: true,
    hint1,
    hint2,
    wrongGuesses,
    handleWrongGuess,
    resetWrongGuesses,
  };
}
