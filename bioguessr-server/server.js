import express from "express";
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const app = express();
const port = 3000;

const client = new DynamoDBClient({
  endpoint: "http://localhost:8000",
  region: "us-east-1",
  credentials: { accessKeyId: "fake", secretAccessKey: "fake" },
});

function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

async function getAllAnimals() {
  const result = await client.send(new ScanCommand({ TableName: "animals" }));
  return result.Items || [];
}

async function getRandomAnimal() {
  const result = await client.send(new ScanCommand({ TableName: "animals" }));
  const items = result.Items;

  if (!items || items.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * items.length);
  const item = items[randomIndex];

  return {
    name: item.name.S,
    imageUrl: item.image_url.S,
  };
}

async function getDailyAnimals() {
  const date = new Date();
  const seed = date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
  
  const seededRandom = mulberry32(seed);

  const items = await getAllAnimals();
  if (items.length === 0) return [];

  let m = items.length, t, i;
  while (m) {
    i = Math.floor(seededRandom() * m--);
    t = items[m];
    items[m] = items[i];
    items[i] = t;
  }

  return items.slice(0, 5).map(item => ({
    name: item.name.S,
    imageUrl: item.image_url.S,
    scientificName: item.scientific_name.S,
    countries: item.country?.L.map(country => country.S) || []
  }));
}

app.get("/api/play", async (req, res) => {
  res.send(await getRandomAnimal());
});

app.get("/api/daily", async (req, res) => {
  try {
    const animals = await getDailyAnimals();
    res.json(animals);
  } catch (error) {
    console.error("Failed to get daily animals:", error);
    res.status(500).send("Error fetching daily animals");
  }
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
