const COOKIE_NAME = "token";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
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
