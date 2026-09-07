const COOKIE_NAME = "token";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getAuthCookieOptions() {
  return {
    // httpOnly: JS cannot read the JWT (reduces XSS token theft).
    httpOnly: true,
    // Lax: sent on top-level navigations; blocks most cross-site POSTs.
    sameSite: "lax",
    // Secure cookies require HTTPS; keep off for local http:// development.
    secure: process.env.NODE_ENV === "production",
    maxAge: SEVEN_DAYS_MS,
    path: "/",
  };
}

function getClearAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, getAuthCookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, getClearAuthCookieOptions());
}

module.exports = {
  COOKIE_NAME,
  SEVEN_DAYS_MS,
  getAuthCookieOptions,
  getClearAuthCookieOptions,
  setAuthCookie,
  clearAuthCookie,
};
