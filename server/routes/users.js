const express = require("express");
const router = express.Router();
const { getAllUsers } = require("../services/usersService");
const authMiddleware = require("../middleware/authMiddleware");
const { internalError } = require("../utils/errors");

router.get("/", (req, res) => {
  const users = getAllUsers();
  res.json(users);
});

// Session identity for the client: requires a valid auth cookie.
router.get("/me", authMiddleware, async (req, res) => {
  try {
    return res.status(200).json({ user: req.user });
  } catch (err) {
    console.error("GET /users/me error:", err.message);
    return res.status(500).json(internalError());
  }
});

module.exports = router;
