import express from "express";
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const app = express();
const port = 3000;

const client = new DynamoDBClient({
  endpoint: "http://localhost:8000",
  region: "us-east-1",
  credentials: { accessKeyId: "fake", secretAccessKey: "fake" },
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
