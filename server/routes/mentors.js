const express = require("express");
const router = express.Router();
const {
  getActiveMentors,
  getMentorById,
} = require("../services/mentorsService");
const { buildError, internalError } = require("../utils/errors");

// GET /api/mentors - Active mentors for the directory
router.get("/", async (req, res) => {
  try {
    const mentors = await getActiveMentors();
    return res.status(200).json(mentors);
  } catch (err) {
    console.error("GET /api/mentors failed:", err.message);
    return res.status(500).json(internalError("Failed to fetch mentors."));
  }
});

// GET /api/mentors/:id - Detailed mentor profile by mentor_profiles.id
router.get("/:id", async (req, res) => {
  try {
    const mentorId = Number(req.params.id);

    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json(
        buildError("VALIDATION_ERROR", "Valid mentor id is required.")
      );
    }

    const mentor = await getMentorById(mentorId, { activeOnly: true });

    if (!mentor) {
      return res
        .status(404)
        .json(buildError("NOT_FOUND", "Mentor not found."));
    }

    return res.status(200).json(mentor);
  } catch (err) {
    console.error("GET /api/mentors/:id failed:", err.message);
    return res.status(500).json(internalError("Failed to fetch mentor."));
  }
});

module.exports = router;
