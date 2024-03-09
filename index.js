// ---------- APPLICATION ----------
// Import packages (express, mongoose, dotenv)
require("dotenv").config();
const express = require(`express`);
const mongoose = require(`mongoose`);

// Create server
const app = express();

// Enable JSON format
app.use(express.json());

// Creating and connecting to database
mongoose.connect(process.env.MONGODB_URI);

// ---------- Routes ALL ----------
// Exclude other path
app.all(`*`, (req, res) => {
  res.status(404).json({ message: `This route does not exist` });
});

// Listening on :
app.listen(process.env.PORT, () => {
  console.log(`Server started`);
});
