const express = require("express");
const router = express.Router();
const {
  getUnreadCounts,
  markNotificationsRead,
} = require("../services/notificationsService");
const {
  validationError,
  internalError,
  buildError,
} = require("../utils/errors");

// GET /api/notifications/unread-count
router.get("/unread-count", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (userId == null) {
      return res.status(401).json(buildError("UNAUTHORIZED", "Unauthorized"));
    }

    const counts = await getUnreadCounts(Number(userId));
    return res.status(200).json(counts);
  } catch (err) {
    console.error("GET /api/notifications/unread-count failed:", err.message);
    return res
      .status(500)
      .json(internalError("Failed to fetch unread notification counts."));
  }
});

// PUT /api/notifications/mark-read
// Body: { all?: true } | { audience: 'mentor'|'mentee' } | { ids: number[] }
router.put("/mark-read", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (userId == null) {
      return res.status(401).json(buildError("UNAUTHORIZED", "Unauthorized"));
    }

    const body = req.body || {};
    const hasIds = Array.isArray(body.ids) && body.ids.length > 0;
    const audience = body.audience || "all";

    if (!["all", "mentor", "mentee"].includes(audience)) {
      return res
        .status(400)
        .json(validationError("audience must be all, mentor, or mentee."));
    }

    if (!hasIds && !body.all && audience === "all") {
      body.all = true;
    }

    const result = await markNotificationsRead(Number(userId), {
      all: Boolean(body.all),
      audience: hasIds ? "all" : audience,
      ids: hasIds ? body.ids : undefined,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("PUT /api/notifications/mark-read failed:", err.message);
    return res
      .status(500)
      .json(internalError("Failed to mark notifications as read."));
  }
});

module.exports = router;
