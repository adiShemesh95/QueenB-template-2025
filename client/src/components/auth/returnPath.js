/**
 * Safe in-app return path after login (blocks open redirects).
 * Accepts pathname + search, e.g. "/mentors/12?source=whatsapp".
 */
export function getSafeReturnPath(from) {
  if (typeof from !== "string") return null;
  const trimmed = from.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }
  return trimmed;
}
