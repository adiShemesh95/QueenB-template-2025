const express = require("express");
const router = express.Router();
const {
  createMatching,
  findActiveMatching,
  getMatchingsByMentee,
  getMatchingByIdForMentee,
  requestMoreTimes,
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

// GET /api/matching/:id - Get one matching request owned by the authenticated mentee
router.get("/:id", async (req, res) => {
  try {
    const menteeId = req.user?.id;

    if (menteeId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const matchingId = Number(req.params.id);

    if (!Number.isInteger(matchingId) || matchingId <= 0) {
      return res.status(400).json({ error: "Valid matching id is required" });
    }

    const matching = await getMatchingByIdForMentee(matchingId, Number(menteeId));

    if (!matching) {
      return res.status(404).json({ error: "Matching not found" });
    }

    return res.status(200).json(matching);
  } catch (err) {
    console.error("GET /api/matching/:id failed:", err.message);
    return res.status(500).json({ error: "Failed to fetch matching" });
  }
});

// POST /api/matching/:id/request-more-times - Mentee asks mentor for more slots
router.post("/:id/request-more-times", async (req, res) => {
  try {
    const menteeId = req.user?.id;

    if (menteeId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const matchingId = Number(req.params.id);

    if (!Number.isInteger(matchingId) || matchingId <= 0) {
      return res.status(400).json({ error: "Valid matching id is required" });
    }

    const result = await requestMoreTimes(matchingId, Number(menteeId));

    if (result.error === "NOT_FOUND") {
      return res.status(404).json({ error: "Matching not found" });
    }

    if (result.error === "ALREADY_REQUESTED") {
      return res.status(409).json({
        error: "Additional times were already requested for this matching"
      });
    }

    if (result.error === "INVALID_STATUS") {
      return res.status(400).json({
        error: "Additional times can only be requested while status is PENDING_MENTEE"
      });
    }

    return res.status(200).json(result.matching);
  } catch (err) {
    console.error("POST /api/matching/:id/request-more-times failed:", err.message);
    return res.status(500).json({ error: "Failed to request more times" });
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

    const existing = await findActiveMatching(Number(menteeId), Number(mentorId));
    if (existing) {
      return res.status(409).json({
        error: "An active matching request with this mentor already exists"
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
