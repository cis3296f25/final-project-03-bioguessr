import express from "express";
import dotenv from "dotenv";

const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const app = express();
dotenv.config();
const port = 3000;

const client = new DynamoDBClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

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

app.get("/api/play", async (req, res) => {
  res.send(await getRandomAnimal());
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
