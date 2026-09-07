const express = require("express");
const router = express.Router();
const {
  listUsersForAdmin,
  getUserForAdmin,
} = require("../services/adminService");
const {
  buildError,
  internalError,
  validationError,
} = require("../utils/errors");

// GET /api/admin/users — list all users with provisional matching counts
router.get("/users", async (req, res) => {
  try {
    const users = await listUsersForAdmin();
    return res.status(200).json({ users });
  } catch (err) {
    console.error("GET /api/admin/users failed:", err.message);
    return res.status(500).json(internalError());
  }
});

// GET /api/admin/users/:id — one user + mentorProfile (null if none)
router.get("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res
        .status(400)
        .json(validationError("Valid user id is required."));
    }

    const user = await getUserForAdmin(userId);

    if (!user) {
      return res
        .status(404)
        .json(buildError("NOT_FOUND", "User not found."));
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error("GET /api/admin/users/:id failed:", err.message);
    return res.status(500).json(internalError());
  }
});

module.exports = router;
