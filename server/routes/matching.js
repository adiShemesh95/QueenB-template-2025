const express = require("express");
const router = express.Router();
const {
  createMatching,
  getMatchingsByMentee,
} = require("../services/matchingService");

// TODO: Wire team auth middleware so req.user is set from the session/JWT.
// Until then, this route expects req.user.id (mentee) and returns 401 if missing.

// GET /api/matching - List the authenticated mentee's matching requests
router.get("/", async (req, res) => {
  try {
    const menteeId = req.user?.id;

    if (menteeId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const matchings = await getMatchingsByMentee(Number(menteeId));
    return res.status(200).json(matchings);
  } catch (err) {
    console.error("GET /api/matching failed:", err.message);
    return res.status(500).json({ error: "Failed to fetch matchings" });
  }
});

// POST /api/matching - Create a matching request (mentee -> mentor)
router.post("/", async (req, res) => {
  try {
    const menteeId = req.user?.id;

    if (menteeId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { mentorId } = req.body;

    if (mentorId == null || !Number.isInteger(Number(mentorId)) || Number(mentorId) <= 0) {
      return res.status(400).json({ error: "Valid mentorId is required" });
    }

    if (Number(mentorId) === Number(menteeId)) {
      return res.status(400).json({
        error: "You cannot request mentoring from yourself"
      });
    }

    const matching = await createMatching(Number(menteeId), Number(mentorId));
    return res.status(201).json(matching);
  } catch (err) {
    console.error("POST /api/matching failed:", err.message);
    return res.status(500).json({ error: "Failed to create matching" });
  }
});

module.exports = router;
