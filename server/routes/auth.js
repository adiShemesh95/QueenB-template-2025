const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authService = require("../services/authService");
const { internalError, buildError } = require("../utils/errors");
const { setAuthCookie, clearAuthCookie } = require("../utils/cookies");

const authWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json(
      buildError(
        "RATE_LIMITED",
        "Too many attempts. Please try again later."
      )
    );
  },
});

router.post("/register", authWriteLimiter, async (req, res) => {
  try {
    const result = await authService.register(req.body);

    if (result.body && result.body.error) {
      return res.status(result.status).json(result.body);
    }

    setAuthCookie(res, result.token);
    return res.status(result.status).json({ user: result.user });
  } catch (err) {
    console.error("Register error:", err.message);
    return res.status(500).json(internalError());
  }
});

router.post("/login", authWriteLimiter, async (req, res) => {
  try {
    const result = await authService.login(req.body);

    if (result.body && result.body.error) {
      return res.status(result.status).json(result.body);
    }

    setAuthCookie(res, result.token);
    return res.status(result.status).json({ user: result.user });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json(internalError());
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: "Logged out" });
});

module.exports = router;
