const jwt = require("jsonwebtoken");

const TOKEN_EXPIRES_IN = "7d";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }
  return secret;
}

// Signs a short-lived session JWT; the value is stored in an httpOnly cookie.
function signToken(userId) {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: TOKEN_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  signToken,
  verifyToken,
};
