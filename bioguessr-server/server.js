import express from "express";
const app = express();
const port = 3000;

app.get("/api/title", (req, res) => {
  res.send("BioGuessr");
});

app.get("/api/bottomText", (req, res) => {
  res.send("How well do you know biology?");
});

app.get("/api/playButton", (req, res) => {
  res.send("Play");
});

app.get("/api/rulesButton", (req, res) => {
  res.send("How To Play");
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
