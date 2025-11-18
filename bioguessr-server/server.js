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




/*
POST request to update leaderboard with new score

Example usage for this API:
async function submitScore(name, score) {
  try { //fetch for API POST Request
    const response = await fetch("/api/updateLeaderboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        score: score,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error submitting score:", data.error);
    }
  } catch (err) {
    console.error("Error with request:", err);
  }
}
*/
app.post("/api/updateLeaderboard", async (req, res) => {
  const { name, score } = req.body; //data needed for request

  if (!name || score === undefined) { //return error if request does not have name or score
    return res.status(400).json(
      { error: "name and score required" }
    );
  }

  try {
    const newItem = {
      id: uuidv4(), //needed to allow repeats in names (gives everyone a unique PK) - otherwise we would have to rely on unique names
      group: "LEADERBOARD", //needed to sort data for retrieval
      name,
      score,
    };

    //update leaderboard database with new users score.
    await client.send(
      new PutItemCommand({
        TableName: process.env.LEADERBOARD_TABLE,
        Item: marshall(newItem),
      })
    );

    res.json({ message: "Score added successfully" }); //success message on success
  } catch (err) { //catches errors
    console.error("Error adding score:", err);
    res.status(400).json(
      { error: "Error adding score" }
    );
  }
});


/*
GET request to get the sorted top 10 from the leaderboard
async function getLeaderboard() {
  try {
    const response = await fetch("/api/getTopTenFromLeaderboard"); 
    const data = await response.json();

    if (!response.ok) {
      console.error("Error fetching leaderboard:", data.error);
      return;
    }

    console.log("Leaderboard:");
    data.leaderboard.forEach((entry, index) => { //sorting through data
      console.log(`${index + 1}. ${entry.name} - ${entry.score}`);
    });

  } catch (err) {
    console.error("Error with request:", err);
  }
}


*/
app.get("/api/getTopTenFromLeaderboard", async (req, res) => {
   try {
    const data = await client.send(
      new QueryCommand({
        TableName: process.env.LEADERBOARD_TABLE,
        IndexName: "ScoreIndex",
        KeyConditionExpression: "#g = :g",
        ExpressionAttributeNames: { "#g": "group", "#n": "name" },
        ExpressionAttributeValues: marshall({ ":g": "LEADERBOARD" }),
        ProjectionExpression: "#n, score",
        ScanIndexForward: false,
        Limit: 10,
      })
    );

    const leaderboard = data.Items.map((i) => unmarshall(i));
    res.json({ leaderboard }); //return the top ten
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({ error: "Error fetching leaderboard" });
  }
});
