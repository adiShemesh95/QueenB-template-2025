const express = require("express");
const router = express.Router();
const {
  trackEvent,
  CLIENT_TRACKABLE_EVENT_TYPES,
} = require("../services/analyticsService");
const {
  buildError,
  validationError,
  internalError,
} = require("../utils/errors");

/**
 * POST /api/analytics/events
 * Authenticated clients may record client-side analytics only
 * (currently mentor_profile_viewed). Lifecycle events are server-owned.
 * userId always comes from req.user.id — never from the body.
 */
router.post("/events", async (req, res) => {
  try {
    const userId = req.user?.id;

    if (userId == null) {
      return res
        .status(401)
        .json(buildError("UNAUTHORIZED", "Unauthorized"));
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const { eventType, mentorUserId, source, metadata } = body;

    if (
      eventType != null &&
      String(eventType).trim() !== "" &&
      !CLIENT_TRACKABLE_EVENT_TYPES.includes(String(eventType).trim())
    ) {
      return res.status(400).json(
        validationError("This event type cannot be recorded via the client API.", [
          {
            field: "eventType",
            message:
              "Only mentor_profile_viewed may be posted by clients. Lifecycle events are recorded server-side.",
          },
        ])
      );
    }

    const result = await trackEvent({
      eventType,
      userId,
      mentorUserId,
      matchingId: null,
      source,
      metadata,
    });

    if (result.error === "VALIDATION_ERROR") {
      return res
        .status(400)
        .json(validationError("Please fix the highlighted fields.", result.details));
    }

    return res.status(201).json({ event: result });
  } catch (err) {
    console.error("POST /api/analytics/events failed:", err.message);
    return res.status(500).json(internalError("Failed to record analytics event."));
  }
});

module.exports = router;
