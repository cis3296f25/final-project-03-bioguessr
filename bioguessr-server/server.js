import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

let ANIMALS = [];
try {
  const p = path.join(__dirname, "animal_data", "animals.json");
  if (fs.existsSync(p)) {
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
  } else {
    console.warn(`[server] Warning: animal_data/animals.json not found at ${p}`);
  }
} catch (err) {
  console.error("[server] Failed to load animals.json:", err);
}

const DEMO = [
  { 
    name: "Krill", 
    scientificName: "Euphausiacea",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Krill_anatomy.jpg/1200px-Krill_anatomy.jpg",
    countries: ["Antarctica", "Ocean"],
    characteristics: { diet: "Plankton" }
  },
  { 
    name: "Beaglier", 
    scientificName: "Canis lupus familiaris",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Beaglier_puppy.jpg/800px-Beaglier_puppy.jpg",
    countries: ["Australia"],
    characteristics: { diet: "Omnivore" }
  },
];

function normalizeAnimal(animal) {
  return {
    name: animal.name,
    scientificName: animal.scientific_name || animal.taxonomy?.scientific_name || animal.name,
    imageUrl: animal.image_url || animal.imageUrl || animal.local_image_path || null,
    characteristics: animal.characteristics || {},
    countries: animal.locations || animal.countries || [], 
    taxonomy: animal.taxonomy || {},
  };
}

function seedRandom(seed) {
  return function() {
    var t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function getDailySeed() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = now.getUTCDate().toString().padStart(2, '0');
  return parseInt(`${year}${month}${day}`);
}


app.get("/api/play", (_req, res) => {
  if (ANIMALS.length > 0) {
    const animal = ANIMALS[(Math.random() * ANIMALS.length) | 0];
    res.json(normalizeAnimal(animal));
    return;
  }

  const demo = DEMO[(Math.random() * DEMO.length) | 0];
  res.json(normalizeAnimal(demo));
});

app.get("/api/daily", (_req, res) => {
  let pool = ANIMALS.length > 0 ? ANIMALS : DEMO;
  
  const seed = getDailySeed();
  const rng = seedRandom(seed);

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, 5);

  const responseData = selected.map(normalizeAnimal);
  
  res.json(responseData);
});

app.get("/api/playButton", (_req, res) => res.send("Play"));
app.get("/api/rulesButton", (_req, res) => res.send("Rules"));

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});