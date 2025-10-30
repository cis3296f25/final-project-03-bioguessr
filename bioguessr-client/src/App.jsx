// src/App.jsx
import { useState, useEffect } from "react";
import "./App.css";
import Gameplay from "./pages/Gameplay.jsx";
import PlayButton from "./components/PlayButton.jsx";

export default function App() {
  const [started, setStarted] = useState(false);
  const [title, setTitle] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const BASE = import.meta.env.VITE_API_BASE || ""; // e.g., http://localhost:3000
        const [titleRes, bottomRes] = await Promise.all([
          fetch(`${BASE}/api/title`).catch(() => new Response("ioGuessr")),
          fetch(`${BASE}/api/bottomText`).catch(() => new Response("Guess the animal’s origin.")),
        ]);
        const [titleText, bottomTextText] = await Promise.all([
          titleRes.text(),
          bottomRes.text(),
        ]);
        if (!cancelled) {
          setTitle(titleText || "ioGuessr");
          setBottomText(bottomTextText || "Guess the animal’s origin.");
        }
      } catch (e) {
        // Fallbacks if the API isn't running yet
        if (!cancelled) {
          setTitle("ioGuessr");
          setBottomText("Guess the animal’s origin.");
        }
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (started) return <Gameplay />;

  // Simple start screen (no Tailwind)
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center", border: "1px solid #ddd", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          {loading ? "Loading..." : title || "ioGuessr"}
        </h1>
        <p style={{ color: "#555", marginBottom: 16 }}>
          {bottomText || "Guess the animal’s origin."}
        </p>
        <PlayButton onClick={() => setStarted(true)} disabled={loading}>
          {loading ? "Loading…" : "▶ Play Game"}
        </PlayButton>
      </div>
    </div>
  );
}
