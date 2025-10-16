import express from "express";
const app = express();
const port = 3000;

app.get("/api/title", (req, res) => {
  res.send("BioGuessr");
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
