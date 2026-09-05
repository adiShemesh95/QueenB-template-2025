const { verifyToken } = require("../utils/token");
const { findById } = require("../services/usersService");
const { toPublicUser } = require("../services/authService");
const {
  unauthorizedError,
  internalError,
  buildError,
} = require("../utils/errors");
const { COOKIE_NAME } = require("../utils/cookies");

async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies && req.cookies[COOKIE_NAME];

    if (!token) {
      return res.status(401).json(unauthorizedError());
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return res.status(401).json(unauthorizedError());
    }

    const userId = payload && payload.userId;
    if (!userId) {
      return res.status(401).json(unauthorizedError());
    }

    const userRow = await findById(userId);
    if (!userRow) {
      return res
        .status(404)
        .json(buildError("NOT_FOUND", "User not found."));
    }

    req.user = toPublicUser(userRow);
    return next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(500).json(internalError());
  }
}

module.exports = authMiddleware;
