const { forbiddenError, unauthorizedError } = require("../utils/errors");

// Authorization only — must run AFTER authMiddleware has set req.user.
// Does not re-read the cookie, re-verify the JWT, or query PostgreSQL.
// Enforce Admin on the backend; frontend route guards alone are not sufficient.
// isAdmin is a capability flag: a user may also be a mentor and/or mentee.
function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json(unauthorizedError());
  }

  if (req.user.isAdmin !== true) {
    return res.status(403).json(forbiddenError());
  }

  return next();
}

module.exports = adminMiddleware;
