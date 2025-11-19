// bioguessr-server/server.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  DynamoDBClient,
  PutItemCommand,
  CreateTableCommand,
  QueryCommand
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


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




//POST request to upload a score to the leaderboard 
app.post("/api/updateLeaderboard", async (req, res) => {
  const { initials, score } = req.body;

  if (!initials || score === undefined) { //validate input
    return res.status(400).json({
      error: "initials and score required",
    });
  }

  try {
    const item = {
      id: uuidv4(), //unique key 
      group: "LEADERBOARD", //group for sorting
      initials: initials,
      score: score,
    };

    const marshalledItem = marshall(item, {
      removeUndefinedValues: true,
    });

    // Upload to DynamoDB 
    await client.send(
      new PutItemCommand({
        TableName: process.env.LEADERBOARD_TABLE,
        Item: marshalledItem,
      })
    );

    console.log(`Inserted leaderboard row for: ${initials}`);
    return res.json({ message: "Score added successfully" });
  } catch (err) {
    console.error("Error inserting leaderboard item:", err);
    return res.status(500).json({ error: "Failed to insert score" });
  }
});

//GET request to get the top ten in order from leaderboard
app.get("/api/getTopTenFromLeaderboard", async (req, res) => {
  try {
    const params = { //parameters for query to get top ten in order
      TableName: process.env.LEADERBOARD_TABLE,
      IndexName: "ScoreIndex",
      KeyConditionExpression: "#g = :g",
      ExpressionAttributeNames: {
        "#g": "group"
      },
      ExpressionAttributeValues: {
        ":g": { S: "LEADERBOARD" }
      },
      ProjectionExpression: "initials, score",
      ScanIndexForward: false,
      Limit: 10,
    };

    const data = await client.send(new QueryCommand(params)); //sending query

    const leaderboard = data.Items.map(unmarshall);
    res.json({ leaderboard }); //response
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({ error: "Error fetching leaderboard" });
  }
});



app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});


