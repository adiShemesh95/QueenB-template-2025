const express = require("express");
const router = express.Router();
const {
  createMatching,
  findActiveMatching,
  getMatchingsByMentee,
  getMatchingByIdForMentee,
  requestMoreTimes,
  cancelMatching,
  selectSlot,
} = require("../services/matchingService");
const { getMentorProfileByUserId } = require("../services/mentorsService");

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

// POST /api/matching/:id/cancel - Mentee cancels after a second slot set still does not work
router.post("/:id/cancel", async (req, res) => {
  try {
    const menteeId = req.user?.id;

    if (menteeId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const matchingId = Number(req.params.id);

    if (!Number.isInteger(matchingId) || matchingId <= 0) {
      return res.status(400).json({ error: "Valid matching id is required" });
    }

    const result = await cancelMatching(matchingId, Number(menteeId));

    if (result.error === "NOT_FOUND") {
      return res.status(404).json({ error: "Matching not found" });
    }

    if (result.error === "INVALID_STATUS") {
      return res.status(400).json({
        error:
          "Cancellation is only available while status is PENDING_MENTEE",
      });
    }

    if (result.error === "CANCEL_NOT_ALLOWED") {
      return res.status(400).json({
        error:
          "Cancellation is only available after additional times were already requested",
      });
    }

    return res.status(200).json(result.matching);
  } catch (err) {
    console.error("POST /api/matching/:id/cancel failed:", err.message);
    return res.status(500).json({ error: "Failed to cancel matching" });
  }
});

// POST /api/matching/:id/select-slot - Mentee selects a suggested time slot
router.post("/:id/select-slot", async (req, res) => {
  try {
    const menteeId = req.user?.id;

    if (menteeId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const matchingId = Number(req.params.id);
    const { slotId } = req.body;

    if (!Number.isInteger(matchingId) || matchingId <= 0) {
      return res.status(400).json({ error: "Valid matching id is required" });
    }

    if (slotId == null || !Number.isInteger(Number(slotId)) || Number(slotId) <= 0) {
      return res.status(400).json({ error: "Valid slotId is required" });
    }

    const result = await selectSlot(matchingId, Number(menteeId), Number(slotId));

    if (result.error === "NOT_FOUND") {
      return res.status(404).json({ error: "Matching not found" });
    }

    if (result.error === "INVALID_STATUS") {
      return res.status(400).json({
        error: "Slot selection is only available while status is PENDING_MENTEE"
      });
    }

    if (result.error === "SLOT_NOT_FOUND") {
      return res.status(404).json({ error: "Slot not found for this matching" });
    }

    return res.status(200).json(result.matching);
  } catch (err) {
    console.error("POST /api/matching/:id/select-slot failed:", err.message);
    return res.status(500).json({ error: "Failed to select slot" });
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

    const mentorProfile = await getMentorProfileByUserId(Number(mentorId));
    if (!mentorProfile || !mentorProfile.isActive) {
      return res.status(404).json({
        error: "Active mentor profile not found"
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
