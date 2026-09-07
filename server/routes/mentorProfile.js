const express = require("express");
const router = express.Router();
const {
  getMentorProfileByUserId,
  upsertMentorProfile,
} = require("../services/mentorsService");
const {
  validationError,
  internalError,
  buildError,
} = require("../utils/errors");

// GET /api/mentor-profile - Current user's mentor profile (if any)
router.get("/", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (userId == null) {
      return res.status(401).json(buildError("UNAUTHORIZED", "Unauthorized"));
    }

    const mentor = await getMentorProfileByUserId(Number(userId));
    if (!mentor) {
      return res
        .status(404)
        .json(buildError("NOT_FOUND", "Mentor profile not found."));
    }

    return res.status(200).json(mentor);
  } catch (err) {
    console.error("GET /api/mentor-profile failed:", err.message);
    return res
      .status(500)
      .json(internalError("Failed to fetch mentor profile."));
  }
});

// POST /api/mentor-profile - Create or update mentor profile for logged-in user
router.post("/", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (userId == null) {
      return res.status(401).json(buildError("UNAUTHORIZED", "Unauthorized"));
    }

    const result = await upsertMentorProfile(Number(userId), req.body || {});

    if (result.error === "VALIDATION_ERROR") {
      return res
        .status(400)
        .json(validationError("Please fix the highlighted fields.", result.details));
    }

    return res.status(200).json(result.mentor);
  } catch (err) {
    console.error("POST /api/mentor-profile failed:", err.message);
    return res
      .status(500)
      .json(internalError("Failed to save mentor profile."));
  }
});

module.exports = router;
