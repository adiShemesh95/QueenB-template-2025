const express = require("express");
const router = express.Router();
const {
  MATCHING_REPORT_STATUSES,
  listUsersForAdmin,
  getUserForAdmin,
  listMatchingsForAdmin,
  getMatchingForAdmin,
} = require("../services/adminService");
const { getDashboardAnalytics } = require("../services/analyticsService");
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

// GET /api/admin/analytics — aggregated Smart Referral & Mentoring Analytics KPIs.
// Auth/Admin checks are already enforced on /api/admin in app.js.
router.get("/analytics", async (req, res) => {
  try {
    const analytics = await getDashboardAnalytics();
    return res.status(200).json({ analytics });
  } catch (err) {
    console.error("GET /api/admin/analytics failed:", err.message);
    return res.status(500).json(internalError("Failed to load analytics."));
  }
});

// GET /api/admin/matchings — report of current matching records (not "completed meetings").
// Auth/Admin checks are not repeated here: app.js already runs authMiddleware then
// adminMiddleware for the entire /api/admin router.
router.get("/matchings", async (req, res) => {
  try {
    const filters = {};

    // Only accept statuses that exist in production matching today.
    // Do not accept future attendance/completion/feedback values here.
    if (req.query.status !== undefined) {
      const status = String(req.query.status);
      if (!MATCHING_REPORT_STATUSES.includes(status)) {
        return res.status(400).json(
          validationError("Invalid matching status.", [
            {
              field: "status",
              message: `Must be one of: ${MATCHING_REPORT_STATUSES.join(", ")}.`,
            },
          ])
        );
      }
      filters.status = status;
    }

    // participantId = either side of the match (mentor OR mentee).
    if (req.query.participantId !== undefined) {
      const participantId = Number(req.query.participantId);
      if (!Number.isInteger(participantId) || participantId <= 0) {
        return res.status(400).json(
          validationError("Valid participantId is required.", [
            {
              field: "participantId",
              message: "Must be a positive integer.",
            },
          ])
        );
      }
      filters.participantId = participantId;
    }

    const matchings = await listMatchingsForAdmin(filters);
    return res.status(200).json({ matchings });
  } catch (err) {
    console.error("GET /api/admin/matchings failed:", err.message);
    return res.status(500).json(internalError());
  }
});

// GET /api/admin/matchings/:id — one matching with Admin-safe detail.
// Admin authorization is already enforced on /api/admin in app.js.
// This route only handles matching-id validation and retrieval.
// Read-only: does not change matching status, slots, or teammate matching logic.
router.get("/matchings/:id", async (req, res) => {
  try {
    const matchingId = Number(req.params.id);

    // Same positive-integer rule as Admin user detail (/users/:id).
    if (!Number.isInteger(matchingId) || matchingId <= 0) {
      return res
        .status(400)
        .json(validationError("Valid matching id is required."));
    }

    const matching = await getMatchingForAdmin(matchingId);

    if (!matching) {
      return res
        .status(404)
        .json(buildError("NOT_FOUND", "Matching not found."));
    }

    return res.status(200).json({ matching });
  } catch (err) {
    console.error("GET /api/admin/matchings/:id failed:", err.message);
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
