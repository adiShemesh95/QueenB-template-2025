require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const authMiddleware = require("./middleware/authMiddleware");
const adminMiddleware = require("./middleware/adminMiddleware");

const { internalError, validationError } = require("./utils/errors");

const app = express();

app.use(helmet());
app.use(
  cors({
    // Allow the React client to send/receive the auth cookie cross-origin in local/dev.
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/mentors", require("./routes/mentors"));
app.use(
  "/api/mentor-profile",
  authMiddleware,
  require("./routes/mentorProfile")
);
app.use(
  "/api/mentor-requests",
  authMiddleware,
  require("./routes/mentorRequests")
);
app.use(
  "/api/matching",
  authMiddleware,
  require("./routes/matching")
);
app.use(
  "/api/analytics",
  authMiddleware,
  require("./routes/analytics")
);
// Admin APIs: authenticate first, then authorize Admin capability server-side.
app.use(
  "/api/admin",
  authMiddleware,
  adminMiddleware,
  require("./routes/admin")
);

app.get("/api/health", (req, res) => {
  res.json({
    message: "QueenB Server is running!",
    timestamp: new Date().toISOString(),
    status: "healthy",
  });
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to QueenB API" });
});

// Map express.json SyntaxErrors to the same VALIDATION_ERROR shape as auth input errors.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res
      .status(400)
      .json(validationError("Invalid JSON in request body."));
  }

  console.error(err.message);
  return res.status(500).json(internalError());
});

app.use("*", (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
});

module.exports = app;
