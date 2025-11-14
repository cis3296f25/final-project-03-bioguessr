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
