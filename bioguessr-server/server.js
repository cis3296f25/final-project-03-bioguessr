// bioguessr-server/server.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- Load animals with characteristics (one-time) ---
let ANIMALS = [];
try {
  const p = path.join(__dirname, "animal_data", "animals.json");
  const raw = fs.readFileSync(p, "utf8");
  const data = JSON.parse(raw);

  ANIMALS = (Array.isArray(data) ? data : []).filter(
    (a) =>
      a &&
      a.name &&
      a.characteristics &&
      Object.keys(a.characteristics || {}).length > 0 &&
      (a.image_url || a.imageUrl || a.local_image_path)
  );
  console.log(`[server] Loaded animals with characteristics: ${ANIMALS.length}`);
} catch (err) {
  console.error("[server] Failed to load animals.json from animal_data/", err);
}

// Fallback pool if JSON load fails
const DEMO = [
  { name: "Krill", imageUrl: "https://example.com/krill.jpg" },
  { name: "Beaglier", imageUrl: "https://example.com/beaglier.jpg" },
];

// --- Routes ---
app.get("/api/play", (_req, res) => {
  if (ANIMALS.length > 0) {
    const animal = ANIMALS[(Math.random() * ANIMALS.length) | 0];
    res.json({
      name: animal.name,
      imageUrl: animal.image_url || animal.imageUrl || null,
      characteristics: animal.characteristics || {},
      image_url: animal.image_url || null,
      local_image_path: animal.local_image_path || null,
      countries: animal.countries || [],
      taxonomy: animal.taxonomy || {},
    });
    return;
  }

  const demo = DEMO[(Math.random() * DEMO.length) | 0];
  res.json(demo);
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
