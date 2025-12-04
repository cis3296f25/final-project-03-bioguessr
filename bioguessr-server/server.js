import express from "express";
import {
  DynamoDBClient,
  PutItemCommand,
  CreateTableCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const ANIMALS_TABLE = process.env.ANIMALS_TABLE || "animals";

function isValidAnimal(a) {
  return (
    a &&
    a.name &&
    a.characteristics &&
    Object.keys(a.characteristics || {}).length > 0 &&
    (a.image_url || a.imageUrl)
  );
}

async function fetchRandomAnimalFromDB() {
  const totalSegments = 10;
  const randomSegment = Math.floor(Math.random() * totalSegments);

  const params = {
    TableName: ANIMALS_TABLE,
    Segment: randomSegment,
    TotalSegments: totalSegments,
    Limit: 20,
  };

  console.log(`[server] Fetching from DynamoDB table: ${ANIMALS_TABLE}, segment: ${randomSegment}`);

  const data = await client.send(new ScanCommand(params));
  const rawItems = (data.Items || []).map(unmarshall);
  const items = rawItems.filter(isValidAnimal);

  console.log(`[server] Got ${rawItems.length} raw items, ${items.length} valid animals`);

  if (items.length > 0) {
    const animal = items[Math.floor(Math.random() * items.length)];
    console.log(`[server] Returning animal: ${animal.name}`);
    return animal;
  }

  console.log("[server] No valid animals found in segment");
  return null;
}

async function fetchAnimalsFromDB() {
  const items = [];
  let lastKey = undefined;

  do {
    const params = {
      TableName: ANIMALS_TABLE,
      ExclusiveStartKey: lastKey,
    };

    const data = await client.send(new ScanCommand(params));
    const batch = (data.Items || []).map(unmarshall);
    items.push(...batch);
    lastKey = data.LastEvaluatedKey;
  } while (lastKey);

  return items.filter(isValidAnimal);
}

const DEMO = [
  {
    name: "Krill",
    scientificName: "Euphausiacea",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Krill_anatomy.jpg/1200px-Krill_anatomy.jpg",
    countries: ["Antarctica", "Ocean"],
    characteristics: { diet: "Plankton" },
  },
  {
    name: "Beaglier",
    scientificName: "Canis lupus familiaris",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Beaglier_puppy.jpg/800px-Beaglier_puppy.jpg",
    countries: ["Australia"],
    characteristics: { diet: "Omnivore" },
  },
];

function wrapImageUrl(url) {
  if (!url) return null;
  return `/api/image?url=${encodeURIComponent(url)}`;
}

function normalizeAnimal(animal) {
  const rawImageUrl = animal.image_url || animal.imageUrl || null;

  return {
    name: animal.name,
    scientificName:
      animal.scientific_name || animal.taxonomy?.scientific_name || animal.name,
    imageUrl: wrapImageUrl(rawImageUrl),
    characteristics: animal.characteristics || {},
    countries: animal.country || animal.countries || animal.locations || [],
    taxonomy: animal.taxonomy || {},
  };
}

function seedRandom(seed) {
  return function () {
    var t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDailySeed() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = (now.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = now.getUTCDate().toString().padStart(2, "0");
  return parseInt(`${year}${month}${day}`);
}

app.get("/api/play", async (_req, res) => {
  try {
    const animal = await fetchRandomAnimalFromDB();
    if (animal) {
      return res.json(normalizeAnimal(animal));
    }
    console.log("[server] No animal from DB, falling back to DEMO");
  } catch (err) {
    console.error("[server] Failed to fetch random animal:", err.message, err);
  }

  console.log("[server] Using DEMO data");
  const demo = DEMO[(Math.random() * DEMO.length) | 0];
  res.json(normalizeAnimal(demo));
});

app.get("/api/daily", async (_req, res) => {
  let pool = DEMO;

  try {
    const animals = await fetchAnimalsFromDB();
    if (animals.length > 0) {
      pool = animals;
    }
  } catch (err) {
    console.error("[server] Failed to fetch animals for daily:", err.message);
  }

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

app.get("/api/image", async (req, res) => {
  const { url } = req.query;

  console.log("[server] Image proxy request for:", url);

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' query parameter" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: new URL(url).origin + "/",
      },
    });

    if (!response.ok) {
      console.error(
        `[server] Image fetch failed: ${response.status} for ${url}`,
      );
      return res
        .status(response.status)
        .json({ error: "Failed to fetch image" });
    }

    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    res.setHeader("Cache-Control", "public, max-age=86400");

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("[server] Image proxy error:", err.message, "URL:", url);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

//POST request to upload a score to the leaderboard
app.post("/api/updateLeaderboard", async (req, res) => {
  console.log("BODY RECEIVED:", req.body);

  const { initials, score } = req.body;

  console.log("got here with: " + req.body);

  if (!initials || score === undefined) {
    //validate input
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
      }),
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
    const params = {
      //parameters for query to get top ten in order
      TableName: process.env.LEADERBOARD_TABLE,
      IndexName: "ScoreIndex",
      KeyConditionExpression: "#g = :g",
      ExpressionAttributeNames: {
        "#g": "group",
      },
      ExpressionAttributeValues: {
        ":g": { S: "LEADERBOARD" },
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

app.listen(PORT);
