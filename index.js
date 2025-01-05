// server/index.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
const app = express();

// Connect DB
connectDB();

// Middleware
app.use(cors({
  origin: ["*"], 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  }));

app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/friends", require("./routes/friend"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});