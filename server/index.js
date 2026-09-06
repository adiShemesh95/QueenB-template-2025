const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const app = require("./app");
const pool = require("./db");

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", require("./routes/users"));

// TODO: Attach auth middleware (sets req.user) before matching routes once auth lands.
app.use("/api/matching", require("./routes/matching"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    message: "QueenB Server is running!",
    timestamp: new Date().toISOString(),
    status: "healthy",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Welcome to QueenB API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);

  // Temporary: verify PostgreSQL connection
  pool
    .query("SELECT NOW()")
    .then((result) => {
      console.log("PostgreSQL connected:", result.rows[0].now);
    })
    .catch((err) => {
      console.error("PostgreSQL connection error:", err.message);
    });
});