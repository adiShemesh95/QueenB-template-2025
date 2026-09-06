const express = require("express");
const router = express.Router();
const {
  getMentorRequests,
  addSlotsToRequest,
  rejectRequest,
} = require("../services/mentorsService");
const {
  validationError,
  internalError,
  buildError,
} = require("../utils/errors");

// GET /api/mentor-requests - Incoming requests for the logged-in mentor
router.get("/", async (req, res) => {
  try {
    const mentorUserId = req.user?.id;
    if (mentorUserId == null) {
      return res.status(401).json(buildError("UNAUTHORIZED", "Unauthorized"));
    }

    const requests = await getMentorRequests(Number(mentorUserId));
    return res.status(200).json(requests);
  } catch (err) {
    console.error("GET /api/mentor-requests failed:", err.message);
    return res
      .status(500)
      .json(internalError("Failed to fetch mentor requests."));
  }
});

// POST /api/mentor-requests/:id/slots - Propose time slots
router.post("/:id/slots", async (req, res) => {
  try {
    const mentorUserId = req.user?.id;
    if (mentorUserId == null) {
      return res.status(401).json(buildError("UNAUTHORIZED", "Unauthorized"));
    }

    const matchingId = Number(req.params.id);
    if (!Number.isInteger(matchingId) || matchingId <= 0) {
      return res
        .status(400)
        .json(validationError("Valid request id is required."));
    }

    const slots = req.body?.slots;
    const result = await addSlotsToRequest(
      matchingId,
      Number(mentorUserId),
      slots
    );

    if (result.error === "NOT_FOUND") {
      return res
        .status(404)
        .json(buildError("NOT_FOUND", "Mentorship request not found."));
    }

    if (result.error === "INVALID_STATUS") {
      return res.status(400).json(
        buildError(
          "INVALID_STATUS",
          "Time slots can only be offered while the request is waiting for the mentor."
        )
      );
    }

    if (result.error === "VALIDATION_ERROR") {
      return res
        .status(400)
        .json(validationError("Please fix the highlighted fields.", result.details));
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("POST /api/mentor-requests/:id/slots failed:", err.message);
    return res.status(500).json(internalError("Failed to add time slots."));
  }
});

// POST /api/mentor-requests/:id/reject - Reject a mentorship request
router.post("/:id/reject", async (req, res) => {
  try {
    const mentorUserId = req.user?.id;
    if (mentorUserId == null) {
      return res.status(401).json(buildError("UNAUTHORIZED", "Unauthorized"));
    }

    const matchingId = Number(req.params.id);
    if (!Number.isInteger(matchingId) || matchingId <= 0) {
      return res
        .status(400)
        .json(validationError("Valid request id is required."));
    }

    const result = await rejectRequest(matchingId, Number(mentorUserId));

    if (result.error === "NOT_FOUND") {
      return res
        .status(404)
        .json(buildError("NOT_FOUND", "Mentorship request not found."));
    }

    if (result.error === "INVALID_STATUS") {
      return res.status(400).json(
        buildError(
          "INVALID_STATUS",
          "Only pending requests can be rejected."
        )
      );
    }

    return res.status(200).json(result.matching);
  } catch (err) {
    console.error("POST /api/mentor-requests/:id/reject failed:", err.message);
    return res
      .status(500)
      .json(internalError("Failed to reject mentorship request."));
  }
});

module.exports = router;
