const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

app.post("/webhook", (req, res) => {
  axios.post(`http://134.209.158.156:3000/webhook/`, req.body);
  res.send("OK");
});

app.listen(80, () => console.log("Listening on port 80!"));
